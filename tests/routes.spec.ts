import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { test, expect } from '@playwright/test';
import ts from 'typescript';

import * as routes from '../src/config/routes';

const source = readFileSync('netlify.toml', 'utf8');
const rules = source.split('[[redirects]]').slice(1).map(block => ({
  from: block.match(/^\s*from\s*=\s*"([^"]+)"/m)?.[1],
  to: block.match(/^\s*to\s*=\s*"([^"]+)"/m)?.[1],
  status: Number(block.match(/^\s*status\s*=\s*(\d+)/m)?.[1]),
  force: /^\s*force\s*=\s*true/m.test(block),
}));
const pagePaths = Object.values(routes).filter(value => typeof value === 'string').sort();

test('hosting serves the app only for the exact pages mounted by the router', () => {
  const appRules = rules.filter(rule => rule.to === '/index.html');
  expect(appRules.map(rule => rule.from).sort()).toEqual(pagePaths);
  expect(appRules.every(rule => rule.status === 200 && !rule.from?.includes('*'))).toBe(true);
  const router = ts.createSourceFile('router.tsx', readFileSync('src/app/router.tsx', 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const mounted: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(router) === 'Route') {
      for (const prop of node.attributes.properties) {
        if (!ts.isJsxAttribute(prop) || prop.name.getText(router) !== 'path' || !prop.initializer) continue;
        if (ts.isStringLiteral(prop.initializer)) mounted.push(prop.initializer.text);
        else if (ts.isJsxExpression(prop.initializer) && prop.initializer.expression) {
          const key = prop.initializer.expression.getText(router).replace(/^routes\./, '') as keyof typeof routes;
          expect(typeof routes[key]).toBe('string');
          mounted.push(routes[key] as string);
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(router);
  expect(mounted.sort()).toEqual(['*', ...pagePaths].sort());
  expect(existsSync('src/app/routes/legacyRedirects.tsx')).toBe(false);
});

test('only implemented APIs are mapped; missing paths and private build metadata return 404', () => {
  const functions = readdirSync('netlify/functions').filter(file => file.endsWith('.ts')).map(file => file.slice(0, -3)).sort();
  const apiRules = rules.filter(rule => rule.from?.startsWith('/api/'));
  expect(apiRules.map(rule => rule.from?.slice(5)).sort()).toEqual(functions);
  for (const rule of apiRules) {
    const name = rule.from!.slice(5);
    expect(rule.to).toBe(`/.netlify/functions/${name}`);
    expect(rule.status).toBe(200);
    expect(readFileSync(`netlify/functions/${name}.ts`, 'utf8')).toContain(`path: '/api/${name}'`);
  }
  expect(rules.at(-1)).toEqual({ from: '/*', to: '/404.html', status: 404, force: false });
  expect(rules.find(rule => rule.from === '/.vite/*')).toEqual({ from: '/.vite/*', to: '/404.html', status: 404, force: true });
  expect(rules.filter(rule => rule.status === 200)).toHaveLength(pagePaths.length + functions.length);
  // The payment return is an integration route even though it isn't in the nav.
  expect(readFileSync('netlify/functions/create-checkout-session.ts', 'utf8')).toContain(routes.bookingConfirmed);
});

test('the published error page has no application scripts or obsolete navigation', () => {
  const errorPage = readFileSync('public/404.html', 'utf8');
  expect(errorPage).toContain('noindex, nofollow');
  expect(errorPage).not.toMatch(/<script\b/i);
  expect([...errorPage.matchAll(/href="([^"]+)"/g)].map(match => match[1]).sort()).toEqual(['/', '/products']);
  const htmlFiles = readdirSync('public', { recursive: true }).filter(file => typeof file === 'string' && /\.html?$/i.test(file));
  expect(htmlFiles).toEqual(['404.html']);
});
