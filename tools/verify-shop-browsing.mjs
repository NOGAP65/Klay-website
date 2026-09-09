import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import ts from 'typescript';

const modules = new Map();
function moduleUrl(file) {
  file = resolve(file);
  if (modules.has(file)) return modules.get(file);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, removeComments: true },
  });
  const code = outputText.replace(/from ['"]([^'"]+)['"]/g, (_, specifier) => {
    if (specifier === '@/features/visualiser') {
      const exports = ['wardrobes', 'wardrobeHardware'].map(name =>
        `export * from '${moduleUrl(`src/features/visualiser/${name}.ts`)}';`).join('\n');
      return `from 'data:text/javascript;base64,${Buffer.from(exports).toString('base64')}'`;
    }
    return `from '${moduleUrl(resolve(dirname(file), `${specifier}.ts`))}'`;
  });
  const url = `data:text/javascript;base64,${Buffer.from(code).toString('base64')}`;
  modules.set(file, url);
  return url;
}
const { CATALOGUE } = await import(moduleUrl('src/features/catalogue/constants.ts'));
const { EMPTY_FACETS, TYPE_FILTERS, typeOf, applyFacets, countFor, facetCount } = await import(moduleUrl('src/features/catalogue/lib/facets.ts'));
const { readBrowseState, writeBrowseState } = await import(moduleUrl('src/features/catalogue/lib/shopBrowseState.ts'));
const { sortProducts } = await import(moduleUrl('src/features/catalogue/lib/sortProducts.ts'));
const ids = items => items.map(item => item.id);
const browse = query => readBrowseState(new URLSearchParams(query));
const results = query => { const state = browse(query); return applyFacets(state.facets, state.query); };
assert.equal(applyFacets(EMPTY_FACETS).length, CATALOGUE.length);
assert.deepEqual([...TYPE_FILTERS.flatMap(type => type.products)].sort(), ids(CATALOGUE).sort(), 'Every current product appears in exactly one browsing family');
for (const type of TYPE_FILTERS) {
  assert.deepEqual(new Set(ids(results(`type=${type.id}`))), new Set(type.products), `${type.label} has the expected products`);
}
assert.equal(results('type=mirrors&type=shower-screens').length, 7, 'Product types combine with OR');
assert.deepEqual(ids(results('type=shutters&area=Indoor')), ['plantation-shutters'], 'Independent facets combine with AND');
assert.equal(countFor(browse('type=mirrors').facets, 'types', 'shower-screens'), 4, 'Other types remain selectable');
assert.equal(countFor(browse('area=Outdoor').facets, 'lights', 'Sheer'), 0, 'Impossible combinations are unavailable');
assert.equal(countFor(EMPTY_FACETS, 'types', 'mirrors', 'cabinet'), 1, 'Counts respect search');
for (const phrase of ['shower screen', 'shower screens', 'showerscreen', 'SHOWER-SCREEN']) {
  assert.equal(results(`q=${encodeURIComponent(phrase)}`).length, 4, phrase);
}
for (const phrase of ['fly screen', 'flyscreens', 'pleated fly screens']) {
  assert.deepEqual(ids(results(`q=${encodeURIComponent(phrase)}`)), ['pleated-flyscreens'], phrase);
}
assert.deepEqual(ids(results('q=walkin')), ['walk-in-wardrobes']);
assert.deepEqual(ids(results('q=doors')), ['shaker-framed-sliding-doors', 'shaker-sliding-doors'], 'Door search excludes open wardrobe interiors');
assert.equal(results('q=mirror').length, 5, 'Search also finds the two doors offering mirror panels');
assert.equal(results('q=mirrors').length, 5);
assert.equal(results('q=zzzzunknown').length, 0);
assert.equal(results('type=mirrors&q=blind').length, 0);
assert.deepEqual(new Set(ids(results('category=wardrobes'))), new Set(TYPE_FILTERS.find(type => type.id === 'wardrobes').products), 'Legacy wardrobe links avoid unrelated bathrooms');
assert.deepEqual(ids(results('category=sheer-curtains')), ['curtains']);
assert.equal(results('category=outdoor').length, 4);
assert.equal(results('type=unknown&area=invalid&light=invalid').length, CATALOGUE.length, 'Unknown URL values do not hide the catalogue');
const state = browse('type=mirrors&type=shower-screens&availability=Price+on+measure&q=frame&sort=name-az');
const encoded = writeBrowseState(new URLSearchParams('category=indoor&utm_source=test'), state);
assert.deepEqual(readBrowseState(encoded), state, 'Search, filters and sort round-trip for refresh, sharing and Back');
assert.equal(encoded.get('utm_source'), 'test');
assert.equal(encoded.has('category'), false);
const cleared = writeBrowseState(encoded, { facets: EMPTY_FACETS, query: '', sort: 'featured' });
assert.equal(cleared.toString(), 'utm_source=test', 'Clear removes all shop state without losing campaign parameters');
assert.equal(browse('sort=unknown').sort, 'featured');
assert.equal(facetCount(EMPTY_FACETS), 0, 'Reading legacy links never mutates empty defaults');
assert.equal(facetCount(state.facets), 3);
const sorted = sortProducts(CATALOGUE, 'price-low');
assert.equal(sorted[0].id, 'roller-blinds');
assert.ok(sorted.slice(1).every(item => item.priceFrom === undefined));
assert.ok(CATALOGUE.every(item => typeOf(item)), 'All products have a browsing family');
console.log('Shop browsing: all products, family/search combinations, live counts, legacy links, URL persistence and honest sorting pass.');
