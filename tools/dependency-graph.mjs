import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const normalise = file => path.relative(root, file).replaceAll('\\', '/');
const config = ts.readConfigFile('tsconfig.app.json', ts.sys.readFile).config;
const options = ts.parseJsonConfigFileContent(config, ts.sys, root).options;
const resolutions = ts.createModuleResolutionCache(root, file => file, options);
export function dependencyGraph() {
  const files = ['src', 'shared-core', 'netlify'].flatMap(dir => fs.readdirSync(dir, { recursive: true })
    .filter(file => /\.tsx?$/.test(file)).map(file => path.resolve(dir, file)));
  const graph = new Map();
  for (const file of files) {
    const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const edges = [];
    function visit(node) {
      const isDeclaration = ts.isImportDeclaration(node) || ts.isExportDeclaration(node);
      const isDynamic = ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const specifier = isDeclaration ? node.moduleSpecifier : isDynamic ? node.arguments[0] : null;
      if (specifier && ts.isStringLiteralLike(specifier)) {
        const clause = ts.isImportDeclaration(node) ? node.importClause : ts.isExportDeclaration(node) ? node.exportClause : null;
        const elements = clause?.namedBindings?.elements ?? clause?.elements;
        const isTypeOnly = !!(node.isTypeOnly || clause?.isTypeOnly || (elements?.length && !clause?.name && elements.every(e => e.isTypeOnly)));
        const resolved = ts.resolveModuleName(specifier.text, file, options, ts.sys, resolutions).resolvedModule;
        if (resolved && !resolved.isExternalLibraryImport) edges.push({ target: normalise(path.resolve(resolved.resolvedFileName)), isDynamic, isTypeOnly });
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
    graph.set(normalise(file), edges);
  }
  return graph;
}

/** O(V + E) traversal, plus the size of reported cycle paths. Includes re-exports and side-effect imports. Type-only and
 * asynchronous loading edges cannot create a synchronous initialisation cycle. */
export function runtimeCycles(graph) {
  const state = new Map(), stack = [], cycles = [];
  function visit(file) {
    state.set(file, 1); stack.push(file);
    for (const edge of graph.get(file) ?? []) {
      if (edge.isTypeOnly || edge.isDynamic) continue;
      if (state.get(edge.target) === 1) cycles.push([...stack.slice(stack.indexOf(edge.target)), edge.target]);
      else if (!state.has(edge.target)) visit(edge.target);
    }
    stack.pop(); state.set(file, 2);
  }
  for (const file of graph.keys()) if (!state.has(file)) visit(file);
  return cycles;
}
