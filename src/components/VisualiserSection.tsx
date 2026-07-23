import KlayConfigurator from '../visualiser/KlayConfigurator'

export default function VisualiserSection() {
  return (
    <section id="visualiser" style={{ display:'flex', width:'100%', minHeight:'80vh', borderTop:'1px solid rgba(28,24,20,0.08)', borderBottom:'1px solid rgba(28,24,20,0.08)' }}>
      <KlayConfigurator showMarketingCopy />
    </section>
  )
}
