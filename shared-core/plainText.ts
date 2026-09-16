/** Keep customer text printable; allow newlines/tabs only in multiline notes. */
export function hasControlCharacters(value: string, allowLineBreaks = false): boolean {
  return [...value].some(character => {
    const code = character.charCodeAt(0);
    if (allowLineBreaks && [9, 10, 13].includes(code)) return false;
    return code < 32 || code === 127;
  });
}
