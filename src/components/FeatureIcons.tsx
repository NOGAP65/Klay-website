import { tokens } from '../theme';

function IconBox({ size, children }: { size: number; children: React.ReactNode }) {
  return <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>{children}</div>;
}

export function RulerIcon({ size }: { size: number }) {
  const gold = tokens.gold;
  return (
    <IconBox size={size}>
      <div style={{ position: 'absolute', bottom: '19%', left: '9%', right: '9%', height: '25%', border: `1px solid ${gold}`, borderTop: 'none' }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', bottom: '19%', left: `${19 + i * 19}%`, width: 1, height: '12%', background: gold }} />
      ))}
    </IconBox>
  );
}

export function HandIcon({ size }: { size: number }) {
  const gold = tokens.gold;
  return (
    <IconBox size={size}>
      <div style={{ position: 'absolute', bottom: '12%', left: '28%', width: '50%', height: '44%', border: `1px solid ${gold}`, borderTop: 'none', borderRadius: '0 0 30% 30%' }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ position: 'absolute', bottom: '50%', left: `${28 + i * 12}%`, width: 1, height: '32%', background: gold, borderRadius: 1 }} />
      ))}
    </IconBox>
  );
}

export function ShieldIcon({ size }: { size: number }) {
  const gold = tokens.gold;
  return (
    <IconBox size={size}>
      <div style={{ position: 'absolute', top: '9%', left: '22%', right: '22%', bottom: '9%', border: `1px solid ${gold}`, borderRadius: '15% 15% 45% 45%' }} />
      <div
        style={{
          position: 'absolute',
          top: '40%',
          left: '38%',
          width: '22%',
          height: '12%',
          borderLeft: `1.5px solid ${gold}`,
          borderBottom: `1.5px solid ${gold}`,
          transform: 'rotate(-45deg)',
        }}
      />
    </IconBox>
  );
}

const icons = { ruler: RulerIcon, hand: HandIcon, shield: ShieldIcon };

export interface Feature {
  icon: 'ruler' | 'hand' | 'shield';
  label: string;
}

export function FeatureRow({ features, size = 14, textSize = 11 }: { features: Feature[]; size?: number; textSize?: number }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 }}>
      {features.map((f) => {
        const Icon = icons[f.icon];
        return (
          <div
            key={f.label}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 14px',
              border: '1px solid rgba(200,151,58,0.25)',
              borderRadius: 999,
            }}
          >
            <Icon size={size} />
            <span
              style={{
                fontFamily: tokens.body,
                fontWeight: 400,
                fontSize: textSize,
                color: tokens.textMuted,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {f.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
