// max-depth — §8, nesting beyond four
export function deep(n: number) {
  if (n > 0) { if (n > 1) { if (n > 2) { if (n > 3) { if (n > 4) { return n; } } } } }
  return 0;
}
