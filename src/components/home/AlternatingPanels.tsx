// ---------------------------------------------------------------------------
// 9. Two alternating 50/50 panels — curtains, then blinds.
//
// The two ranges get one panel each and one idea each: curtains are about light
// and proportion, blinds are about precision and control. That is the split the
// customer is actually choosing between, and it is why these are two panels
// rather than one section listing both.
//
// The image and text swap sides between them, and the grounds alternate warm
// white then parchment, so the second panel reads as a turn of the page rather
// than as a repeat. Both are built from one component: the only difference is
// which column the photograph lands in, which is a prop, not a second copy of
// the markup.
// ---------------------------------------------------------------------------

import { tokens, headline, eyebrow, layout } from '../../theme';
import { useIsMobile } from '../../hooks/useIsMobile';
import { CtaLink } from './primitives';

interface Panel {
  label: string;
  title: React.ReactNode;
  body: string[];
  cta: { label: string; to: string };
  image: string;
  objectPosition: string;
  imageSide: 'left' | 'right';
  background: string;
}

const PANELS: Panel[] = [
  {
    label: 'Curtains & drapes',
    title: (
      <>
        Softer light.
        <br />
        <span style={{ fontStyle: 'italic' }}>A room that breathes.</span>
      </>
    ),
    body: [
      'A sheer does not block light, it spreads it. The hard afternoon square on the floorboards becomes an even glow across the whole room, and the glare goes without the view going with it.',
      'Hung from the ceiling rather than the architrave, it also buys you height — the eye reads the fall of the fabric as the height of the wall, which is why a modest room with floor-length curtains feels taller than it measures.',
    ],
    // Curtains have no page of their own; /indoor is the listing that shows the
    // three curtain types with their prices, which is the nearest real thing.
    cta: { label: 'Explore Curtains', to: '/indoor' },
    // Warm light diffusing through the cloth. The dark heavy-drape bedroom shot
    // was here first and it argued against the headline — "softer light, a room
    // that breathes" over a photograph of a room shut down for the night.
    image: '/images/room-5.png',
    objectPosition: '62% 45%',
    imageSide: 'left',
    background: tokens.warmWhite,
  },
  {
    label: 'Roller blinds',
    title: (
      <>
        Clean lines.
        <br />
        <span style={{ fontStyle: 'italic' }}>Complete control.</span>
      </>
    ),
    body: [
      'One tube, one bracket, one line across the top of the window. Rolled up it is a 45mm cylinder and the window is simply a window again — which is the argument for a roller over anything that stacks, folds or hangs when it is open.',
      'Blockout for a bedroom, sunscreen where you want the view kept, or a dual roller carrying both on the one bracket so a single window can do either job depending on the hour.',
    ],
    cta: { label: 'Explore Blinds', to: '/blinds/roller-blinds' },
    // The clearest roller shot in the library — the bracket line across the head
    // of the glazing is exactly what the copy is about. Also the hero's
    // photograph, which is a reuse, but nine sections apart and the alternative
    // was an empty grey room.
    image: '/images/lifestyle/room-living.png',
    objectPosition: 'center 40%',
    imageSide: 'right',
    background: tokens.parchment,
  },
];

function EditorialPanel({ panel }: { panel: Panel }) {
  const isMobile = useIsMobile();
  const imageFirst = panel.imageSide === 'left';

  const image = (
    <div style={{ minHeight: isMobile ? 320 : 620, overflow: 'hidden' }}>
      <img
        src={panel.image}
        alt=""
        style={{
          width: '100%',
          height: '100%',
          minHeight: isMobile ? 320 : 620,
          objectFit: 'cover',
          objectPosition: panel.objectPosition,
          display: 'block',
        }}
      />
    </div>
  );

  const copy = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        // The inner edge gets less inset than the outer one, so the copy sits
        // closer to the photograph it belongs to than to the page edge.
        padding: isMobile
          ? '64px 24px'
          : imageFirst
            ? `96px ${layout.inlinePad(isMobile)}px 96px 72px`
            : `96px 72px 96px ${layout.inlinePad(isMobile)}px`,
      }}
    >
      <div style={{ maxWidth: 480 }}>
        <p style={{ ...eyebrow, marginBottom: 22 }}>{panel.label}</p>
        <h2 style={{ ...headline.section, color: tokens.ink }}>{panel.title}</h2>
        <div
          style={{
            fontFamily: tokens.body,
            fontSize: 15,
            lineHeight: 1.85,
            color: tokens.inkSoft,
            marginTop: 26,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          {panel.body.map(para => (
            <p key={para.slice(0, 24)} style={{ margin: 0 }}>
              {para}
            </p>
          ))}
        </div>
        <div style={{ marginTop: 36 }}>
          <CtaLink to={panel.cta.to}>{panel.cta.label} →</CtaLink>
        </div>
      </div>
    </div>
  );

  return (
    <section
      style={{
        background: panel.background,
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
      }}
    >
      {/* On mobile the photograph always leads, whichever side it takes on
          desktop — a column of prose above the picture it describes is the wrong
          way round on a phone. */}
      {isMobile || imageFirst ? (
        <>
          {image}
          {copy}
        </>
      ) : (
        <>
          {copy}
          {image}
        </>
      )}
    </section>
  );
}

export function AlternatingPanels() {
  return (
    <>
      {PANELS.map(panel => (
        <EditorialPanel key={panel.label} panel={panel} />
      ))}
    </>
  );
}
