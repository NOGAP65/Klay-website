import { Link } from 'react-router-dom';

import { tokens, space, radius, type as typeScale } from '@/ds';

import { useVisualiserStore } from './useVisualiserStore';
import { blindGroup, type ProductCategory } from './windowProducts';

const groups: { title: string; choices: { id: ProductCategory; label: string }[] }[] = [
  { title: 'Indoor window coverings', choices: [{ id: 'blind', label: 'Blinds' }, { id: 'curtain', label: 'Curtains' }] },
  { title: 'Wardrobes & shelving', choices: [{ id: 'wardrobe', label: 'Wardrobes' }, { id: 'shelving', label: 'Shelving' }] },
];
const shopGroups = [
  { label: 'Outdoor coverings', to: '/products?area=Outdoor' },
  { label: 'Mirrors & shower screens', to: '/products?type=mirrors&type=shower-screens' },
];

/** Shared navigation for the homepage and the full visualiser. Groups with no
 * room renderer lead explicitly to the shop rather than a dead preview tab. */
export function VisualiserCategories({ onDark = false }: { onDark?: boolean }) {
  const category = useVisualiserStore(state => state.productCategory);
  const select = useVisualiserStore(state => state.setProductCategory);
  const active = blindGroup(category);
  const ink = onDark ? tokens.paper : tokens.ink;
  const paper = onDark ? tokens.ink : tokens.paper;
  return <nav aria-label="Visualiser products" style={{ display: 'grid', gap: space.item, fontFamily: tokens.body, color: ink }}>
    {groups.map(group => <fieldset key={group.title} style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}>
      <legend style={{ ...typeScale.micro, fontWeight: 600, letterSpacing: '.1em', marginBottom: space.tight }}>{group.title}</legend>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: space.tight }}>
        {group.choices.map(choice => <button key={choice.id} type="button" aria-pressed={active === choice.id}
          onClick={() => { if (active !== choice.id) select(choice.id); }}
          style={{ ...typeScale.label, textTransform: 'none', letterSpacing: 'normal', minHeight: 44, padding: space.tight, borderRadius: radius.md,
            border: `1px solid ${onDark ? tokens.onDarkEdge : tokens.line}`, cursor: 'pointer',
            background: active === choice.id ? ink : paper, color: active === choice.id ? paper : ink }}>
          {choice.label}
        </button>)}
      </div>
    </fieldset>)}
    <div style={{ display: 'grid', gap: space.tight, borderTop: `1px solid ${onDark ? tokens.onDarkEdge : tokens.line}`, paddingTop: space.snug }}>
      {shopGroups.map(group => <Link key={group.to} to={group.to} style={{ display: 'flex', alignItems: 'center',
        ...typeScale.label, textTransform: 'none', letterSpacing: 'normal', justifyContent: 'space-between', gap: space.tight, minHeight: 32, color: ink, textDecoration: 'none' }}>
        {group.label}<span style={{ ...typeScale.micro, letterSpacing: 'normal', whiteSpace: 'nowrap' }}>Shop →</span>
      </Link>)}
    </div>
  </nav>;
}
