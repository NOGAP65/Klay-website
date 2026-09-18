/** Restrained highlights keep dark plastic dark and preserve cream's hue. */
export function chainFinish(hex: string) {
  const rgb = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16));
  const shade = (amount: number) => `rgb(${rgb.map(value => Math.round(amount < 0
    ? value * (1 + amount) : value + (255 - value) * amount)).join(',')})`;
  return { base: hex, shadow: shade(-.28), highlight: shade(.24), edge: shade(-.16) };
}
