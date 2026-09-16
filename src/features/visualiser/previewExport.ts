// WebGL's drawing buffer may be cleared after presentation. Repaint and copy
// every registered surface synchronously, without retaining a large GPU buffer.
export const PREVIEW_CAPTURE_EVENT = 'klay:capture-preview';

export function exportPreview(container: HTMLElement): string | null {
  const surfaces = [...container.querySelectorAll<HTMLCanvasElement>('canvas[data-render-surface]')];
  if (!surfaces.length || !surfaces[0].width || !surfaces[0].height) return null;
  const output = document.createElement('canvas');
  output.width = surfaces[0].width;
  output.height = surfaces[0].height;
  const ctx = output.getContext('2d', { colorSpace: 'srgb' });
  if (!ctx) return null;
  for (const surface of surfaces) {
    surface.dispatchEvent(new Event(PREVIEW_CAPTURE_EVENT));
    ctx.drawImage(surface, 0, 0, output.width, output.height);
  }
  return output.toDataURL('image/jpeg', 0.95);
}
