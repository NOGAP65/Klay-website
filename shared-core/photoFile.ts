/** Recognise supported raster containers from bytes, not a user-controlled MIME label. */
export function isRasterPhoto(bytes: Uint8Array): boolean {
  const ascii = (offset: number, length: number) => String.fromCharCode(...bytes.slice(offset, offset + length));
  if (bytes.length < 12) return false;
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  return startsWith([0xff, 0xd8, 0xff])
    || startsWith([0x89, 80, 78, 71, 13, 10, 26, 10])
    || ['GIF87a', 'GIF89a'].includes(ascii(0, 6))
    || (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP')
    || (ascii(4, 4) === 'ftyp' && ['avif', 'avis', 'heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(ascii(8, 4)));
}
