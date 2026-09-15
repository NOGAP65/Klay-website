import { dependencyGraph, runtimeCycles } from './dependency-graph.mjs';
const graph = dependencyGraph();
const cycles = runtimeCycles(graph);
if (process.argv.includes('--count')) console.log(cycles.length);
else if (!cycles.length) console.log(`ZERO runtime import cycles across ${graph.size} browser, core and server files.`);
else for (const cycle of cycles) console.error(cycle.join(' -> '));
process.exitCode = cycles.length ? 1 : 0;
