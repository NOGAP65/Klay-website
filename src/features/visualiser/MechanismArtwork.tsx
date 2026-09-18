import { useId } from 'react';

export type MechanismKind = 'crank' | 'cord' | 'wand' | 'louvre';

function Crank({ value, metal }: { value: number; metal: string }) {
  return <g>
    <rect x="29" y="3" width="14" height="17" rx="4" fill={metal} />
    <path d="M36 17V92" stroke="#a0a0a0" strokeWidth="6" strokeLinecap="round" />
    <path d="M35 17V92" stroke="#eeeeee" strokeWidth="2" strokeLinecap="round" />
    <circle cx="36" cy="92" r="9" fill={metal} stroke="#777" />
    <g transform={`rotate(${value * 720},36,92)`}>
      <path d="M36 92H59" stroke="#676767" strokeWidth="7" strokeLinecap="round" />
      <path d="M36 91H59" stroke="#dedede" strokeWidth="4" strokeLinecap="round" />
      <rect x="54" y="80" width="10" height="25" rx="5" fill={metal} stroke="#777" />
    </g>
    <circle cx="36" cy="92" r="3" fill="#777" />
  </g>;
}

function Cord({ value, metal }: { value: number; metal: string }) {
  const end = 123 - value * 61;
  return <g>
    <rect x="27" y="4" width="18" height="10" rx="3" fill={metal} />
    {[32, 39].map(x => <g key={x}>
      <path d={`M${x} 14V${end}`} stroke="#8b806b" strokeWidth="3" />
      <path d={`M${x} 14V${end}`} stroke="#eee5cf" strokeWidth="1.5" />
    </g>)}
    <path d={`M30 ${end}Q26 ${end + 18}36 ${end + 20}Q46 ${end + 18}42 ${end}Z`} fill={metal} stroke="#777" />
    <path d={`M31 ${end + 5}L30 ${end + 12}`} stroke="#fff" strokeOpacity=".65" />
  </g>;
}

function Wand({ value, metal }: { value: number; metal: string }) {
  return <g>
    <path d="M34 16V10Q34 4 39 4Q44 4 44 10V17" fill="none" stroke={metal} strokeWidth="3" />
    <rect x="32" y="16" width="8" height="87" rx="4" fill={metal} />
    <rect x="28" y="96" width="16" height="41" rx="7" fill={metal} stroke="#999" />
    <path d={`M${32 + Math.sin(value * Math.PI * 2) * 4} 100V133`} stroke="#999" strokeWidth="1.5" />
    <path d="M19 75Q9 67 19 59M19 59L13 59M19 59L19 65M53 59Q63 67 53 75" fill="none" stroke="#eee" strokeWidth="1.5" />
  </g>;
}

function Louvre({ value, metal }: { value: number; metal: string }) {
  const height = 5 + value * 26;
  return <g>
    <rect x="5" y="19" width="5" height="117" rx="1" fill={metal} />
    <rect x="62" y="19" width="5" height="117" rx="1" fill={metal} />
    {[40, 76, 112].map(y => <g key={y}>
      <ellipse cx="36" cy={y + 2} rx="26" ry={height / 2} fill="#777" />
      <ellipse cx="36" cy={y} rx="26" ry={height / 2} fill={metal} />
    </g>)}
    <path d="M33 61L36 57L39 61M36 57V94M33 90L36 94L39 90" stroke="#676767" strokeWidth="2" fill="none" />
  </g>;
}

const ARTWORK = { crank: Crank, cord: Cord, wand: Wand, louvre: Louvre };

/** Small vector hardware stays sharp on phones without downloading new images. */
export function MechanismArtwork({ kind, value }: { kind: MechanismKind; value: number }) {
  const id = useId().replace(/:/g, ''), Artwork = ARTWORK[kind];
  return <svg viewBox="0 0 72 160" aria-hidden="true" focusable="false" preserveAspectRatio="none">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2={kind === 'louvre' ? '1' : '0'}>
      <stop offset="0" stopColor="#989898" /><stop offset=".3" stopColor="#fafafa" />
      <stop offset=".58" stopColor="#dedede" /><stop offset="1" stopColor="#999" />
    </linearGradient></defs>
    <Artwork value={value} metal={`url(#${id})`} />
  </svg>;
}
