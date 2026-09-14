// Read-only dependency inventory. Dynamic literal imports and type imports count.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile).config;
const options = ts.parseJsonConfigFileContent(config, ts.sys, root).options;
const files = fs.readdirSync('src', { recursive: true }).filter(f => /\.(tsx?|css|json)$/.test(f))
  .map(f => path.resolve('src', f));
const graph = new Map();
for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
  const dependencies = new Set();
  function visit(node) {
    const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ? node.moduleSpecifier
      : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? node.arguments[0] : null;
    if (specifier && ts.isStringLiteralLike(specifier)) {
      const resolved = ts.resolveModuleName(specifier.text, file, options, ts.sys).resolvedModule?.resolvedFileName
        ?? (specifier.text.startsWith('.') ? path.resolve(path.dirname(file), specifier.text) : '');
      if (resolved && path.resolve(resolved).startsWith(path.join(root, 'src'))) dependencies.add(path.resolve(resolved));
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  graph.set(file, [...dependencies]);
}
const reachable = new Set();
function traverse(file) {
  if (reachable.has(file)) return;
  reachable.add(file);
  for (const dependency of graph.get(file) ?? []) traverse(dependency);
}
traverse(path.resolve('src/main.tsx'));
const relative = file => path.relative(root, file).replaceAll('\\', '/');
console.log(JSON.stringify({
  files: files.length,
  unreachable: files.filter(f => !reachable.has(f)).map(relative),
  largest: files.map(f => ({ file: relative(f), bytes: fs.statSync(f).size }))
    .sort((a,b) => b.bytes-a.bytes).slice(0, 12),
}, null, 2));
