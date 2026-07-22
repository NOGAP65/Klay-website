import KlayConfigurator from '../visualiser/KlayConfigurator';

export function VisualiserSection() {
  return (
    <section id="visualiser" style={{ width: '100%', height: '100vh', position: 'relative' }}>
      <KlayConfigurator />
    </section>
  );
}
