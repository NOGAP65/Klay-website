import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Dialog } from '@/ds';

import { EMPTY_FACETS, type Facets } from '../lib/facets';

import './shopGuide.css';

const STARTING_POINTS = [
  { name: 'Windows & light', detail: 'Blinds, curtains and plantation shutters.', facet: 'groups', values: ['Indoor'] },
  { name: 'Outdoor living', detail: 'Awnings, screens and roller shutters.', facet: 'groups', values: ['Outdoor'] },
  { name: 'Wardrobes & storage', detail: 'Fitted wardrobes, sliding doors and shelving.', facet: 'types', values: ['wardrobes', 'shelving'] },
  { name: 'Bathrooms', detail: 'Mirrors, mirror cabinets and shower screens.', facet: 'types', values: ['mirrors', 'shower-screens'] },
] satisfies { name: string; detail: string; facet: keyof Facets; values: string[] }[];

/** Help is requested, never timed. Each choice takes the shopper straight to the relevant range. */
export function ShopGuide({ onChoose }: { onChoose: (facets: Facets) => void }) {
  const [isOpen, setOpen] = useState(false);
  const [topic, setTopic] = useState<'range' | 'measure'>('range');
  const triggerRef = useRef<HTMLButtonElement>(null);
  return <>
    <div className="shop-guide-prompt">
      <span>A little help finding the right fit?</span>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => { setTopic('range'); setOpen(true); }}>
        Help me choose <span aria-hidden="true">↗</span>
      </button>
    </div>
    <Dialog isOpen={isOpen} title="Find your starting point." closeLabel="Close guide" returnFocusRef={triggerRef} onClose={() => setOpen(false)}>
      <div className="shop-guide-tabs" role="group" aria-label="Guide topic">
        <button type="button" aria-pressed={topic === 'range'} onClick={() => setTopic('range')}>Explore the range</button>
        <button type="button" aria-pressed={topic === 'measure'} onClick={() => setTopic('measure')}>Sizes & measuring</button>
      </div>
      {topic === 'range' ? <div className="shop-guide-options">
        <p>What would you like to work on?</p>
        {STARTING_POINTS.map(point => <button type="button" key={point.name} onClick={() => {
          onChoose({ ...EMPTY_FACETS, [point.facet]: new Set(point.values) });
          setOpen(false);
        }}>
          <span><strong>{point.name}</strong><span>{point.detail}</span></span><span aria-hidden="true">→</span>
        </button>)}
      </div> : <div className="shop-guide-measure">
        <p>You choose the look. We confirm the fit.</p>
        <ol>
          <li><strong>Start with your room and style.</strong><span>Choose your location, fabric or material, and colour. The preview updates as you go.</span></li>
          <li><strong>Select a size to get started.</strong><span>Use the size bands or dimensions listed for your product. If you are unsure which to choose, ask us before ordering.</span></li>
          <li><strong>We check the final details.</strong><span>Your professional check measure confirms the dimensions and fit. Products labelled “Price on measure” are added as a quote request.</span></li>
        </ol>
        <Link to="/how-it-works" onClick={() => setOpen(false)}>See how it works <span aria-hidden="true">→</span></Link>
      </div>}
      <div className="shop-guide-footer"><span>Prefer a hand from our team?</span><Link to="/contact" onClick={() => setOpen(false)}>Ask Klay</Link></div>
    </Dialog>
  </>;
}
