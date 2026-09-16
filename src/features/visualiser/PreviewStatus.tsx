import { LoadingIndicator, space, tokens } from '@/ds';

export function PreviewStatus({ loading, failed, retry, label, delayed = false }: {
  loading: boolean; failed: boolean; retry: () => void; label: string; delayed?: boolean;
}) {
  if (failed) return <div role="alert" className="preview-error" style={{ position: 'absolute', inset: 0, zIndex: 26, display: 'grid', placeContent: 'center', gap: space.item, padding: space.group, background: tokens.charcoal, color: tokens.onDark, textAlign: 'center' }}>
    <p>This preview couldn’t load. Please try again.</p>
    <button type="button" onClick={retry} style={{ minHeight: 44, padding: `${space.snug}px ${space.group}px`, background: tokens.accent, color: tokens.onAccent }}>Try again</button>
  </div>;
  return loading ? <LoadingIndicator overlay delayed={delayed} label={label} /> : null;
}
