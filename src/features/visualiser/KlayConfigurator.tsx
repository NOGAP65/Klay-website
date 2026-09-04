import { useEffect, useRef, useState } from 'react';
import { radius, tokens, space, type as typeScale } from '@/ds';
import { useVisualiserStore, isJoinery, BlindType, type ProductCategory } from './useVisualiserStore';
import { usePhotoUpload } from './usePhotoUpload';
import CornerPinOverlay, { CornerPinOverlayHandle, Point } from './CornerPinOverlay';
import Canvas2DBlindRenderer, { RenderedArea } from './Canvas2DBlindRenderer';
import Canvas2DCurtainRenderer from './Canvas2DCurtainRenderer';
import WardrobeRoomRenderer from './WardrobeRoomRenderer';
import Wardrobe3D from './Wardrobe3D';
import WallColourChip from './WallColourChip';

// One radius for every surface in the visualiser. The three files used to
// disagree (0 here, 12px on the homepage wrapper, 4px on the thumbnails),
// which is what made the panel read as assembled rather than designed.

/** Caps how tall the media box can get. Width is capped instead of height so
 * the photo's aspect ratio is never violated — see the root style. */
const MAX_MEDIA_VH = 72;

/** ONE SWITCH FOR THE WARDROBE'S ROOM VIEW, and it is off.
 *
 * The composite is built and works — WardrobeRoomRenderer, the seeded alcoves,
 * the recess shade, the overhang that says a model will not fit. What is not
 * settled is the trace it depends on: a customer who outlines their whole
 * 2460mm doorway instead of where the cabinet sits gets a wardrobe scaled by a
 * fifth and a fit answer that is wrong. That is worse than not offering it.
 *
 * Kept as one named constant rather than deleted branches so turning it back on
 * is a one-line change and the code beneath cannot rot in the meantime. */
const ROOM_VIEW_READY = false;

// --- Buttons ---------------------------------------------------------------
// Raised, with real press feedback. Inline styles can't express :hover or
// :active, so the Button component tracks both in state and swaps the
// shadow — a lit top edge and a cast shadow when up, an inset shadow and a
// 1px nudge down when pressed.

type ButtonVariant = 'primary' | 'ghost' | 'accent';

const buttonBase: React.CSSProperties = {
  ...typeScale.label,
  lineHeight: 1,
  // 32 — the pill height. These are the configurator's own small controls
  // (Open, Shut, Reset), not the page's primary CTA, so they take the pill's
  // box rather than the CTA's 52.
  height: 32,
  padding: `0 ${space.md}px`,
  borderRadius: radius.md,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  transition: 'box-shadow 0.12s ease, transform 0.12s ease, background 0.2s ease',
};

const RAISED_SHADOW = '0 1px 0 rgba(255,255,255,0.18) inset, 0 -1px 0 rgba(0,0,0,0.28) inset, 0 3px 6px rgba(0,0,0,0.38)';
const RAISED_SHADOW_HOVER = '0 1px 0 rgba(255,255,255,0.24) inset, 0 -1px 0 rgba(0,0,0,0.28) inset, 0 5px 12px rgba(0,0,0,0.44)';
const PRESSED_SHADOW = '0 2px 5px rgba(0,0,0,0.5) inset, 0 1px 0 rgba(255,255,255,0.08)';

const VARIANT_FILL: Record<ButtonVariant, { background: string; color: string; border: string }> = {
  primary: {
    background: `linear-gradient(180deg, ${tokens.fillStrongHover} 0%, ${tokens.fillStrong} 52%, ${tokens.ink} 100%)`,
    color: tokens.onFillStrong,
    border: `1px solid ${tokens.ink}`,
  },
  ghost: {
    background: 'linear-gradient(180deg, rgba(248,248,248,0.14) 0%, rgba(248,248,248,0.05) 100%)',
    color: tokens.onDark,
    border: `1px solid ${tokens.onDarkLine}`,
  },
  accent: {
    background: 'linear-gradient(180deg, rgba(248,248,248,0.22) 0%, rgba(248,248,248,0.08) 100%)',
    color: tokens.onDark,
    border: `1px solid ${tokens.onDarkEdge}`,
  },
};

function Button({
  variant = 'ghost',
  onClick,
  children,
  style,
  ariaLabel,
  disabled = false,
}: {
  variant?: ButtonVariant;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  ariaLabel?: string;
  /** Shown, and plainly not available. Used by the wardrobe's "In your room",
   * which is announced rather than hidden — see the footer. A disabled button
   * keeps its place in the row, so nothing shifts when it becomes live. */
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const fill = VARIANT_FILL[variant];
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onPointerEnter={() => !disabled && setHover(true)}
      onPointerLeave={() => { setHover(false); setPressed(false); }}
      onPointerDown={() => !disabled && setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...buttonBase,
        ...fill,
        // FLAT AND FADED, rather than greyed to a different colour. It keeps the
        // variant's own fill so it still reads as the button it will be; losing
        // the shadow is what says it cannot be pressed, since every live button
        // here sits up off the page.
        boxShadow: disabled ? 'none' : pressed ? PRESSED_SHADOW : hover ? RAISED_SHADOW_HOVER : RAISED_SHADOW,
        transform: pressed && !disabled ? 'translateY(1px)' : 'translateY(0)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// --- Manual: the pull controls ---------------------------------------------
// Manual operation draws the hardware the product is actually operated by, and
// dragging that hardware is how the covering moves — the control IS the thing
// it controls, rather than a slider standing in for one.
//
// It replaced a groove-and-thumb slider in a floating charcoal housing. That
// worked and read as a piece of UI parked over the photograph: the one object
// in the frame that could not exist in the room.
//
// TWO PRODUCTS, TWO OBJECTS. A roller blind is worked by a loop of beaded ball
// chain off the end of the tube. A curtain on a corded track is worked by a
// smooth cord loop with a weight on the bottom — no beads, different colour,
// different bottom fitting. Shipping the blind's chain on a curtain would be
// showing the customer hardware they are not buying.
//
// THE LOOP RUNS, and this is the detail that sells both of them. Drag down and
// the near strand travels down while the far strand travels UP, because a
// continuous loop over a pulley can do nothing else. Both scroll at exactly the
// drag distance, so the loop stays under your finger instead of sliding
// against it.
//
// SEAMLESS BY MODULO, not by a long strip. Beads and cord ticks are drawn from
// a phase offset wrapped into a single pitch, so a fixed number of shapes tiles
// an endless run and the loop can be dragged forever without the geometry
// growing.
//
// STILL A SLIDER TO A SCREEN READER. role, aria-valuenow and the arrow/Home/End
// keys are carried over from the control this replaced — the visual metaphor
// got richer and the keyboard contract did not change.

/** Bead spacing. Real roller chain is a #10 ball chain at roughly 4.5mm pitch
 * against a 2m drop; this is that ratio at the size the render displays. */
const BEAD_PITCH = 7.2;
const BEAD_R = 2.5;
/** Fallback run length, used only before the media box has been measured. */
const CHAIN_H_FALLBACK = 188;
/** Distance between the two strands — the pulley's width. */
const STRAND_GAP = 13;
/** Drag distance, in pixels, that takes the covering from fully open to fully
 * shut. Matched to the run length so a drag down the length of the visible
 * hardware is very nearly the full travel: the gesture is the size of the
 * object. */
const CHAIN_TRAVEL = 190;

const CHAIN_TOP = 16;
const CHAIN_W = STRAND_GAP + BEAD_R * 4 + 8;

/** Repeat spacing of the cord's fibre ticks. Wider than the bead pitch because
 * a twisted cord reads at a coarser rhythm than a ball chain — and because the
 * two must not look like the same object in a different colour. */
const CORD_PITCH = 11;

/** Shape centres for one strand, phase-shifted by `offset` and wrapped into a
 * single pitch so a finite number of shapes tiles an endless run. */
function runYs(offset: number, run: number, pitch: number, margin: number): number[] {
  const phase = ((offset % pitch) + pitch) % pitch;
  const out: number[] = [];
  for (let y = CHAIN_TOP - pitch + phase; y < CHAIN_TOP + run; y += pitch) {
    if (y >= CHAIN_TOP - margin && y <= CHAIN_TOP + run + margin) out.push(y);
  }
  return out;
}

/** Drag, keyboard and hover behaviour for a pull control. Shared so the chain
 * and the cord cannot drift apart on feel — they are the same gesture on two
 * different objects. */
function usePullDrag(value: number, onChange: (v: number) => void) {
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  // Where the drag began, and the position it began from. Deltas are measured
  // against these rather than accumulated frame to frame, so a fast drag cannot
  // drift away from the pointer.
  const originRef = useRef({ y: 0, value: 0 });

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const pct = clamp(value);

  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      originRef.current = { y: e.clientY, value: pct };
      setDragging(true);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!dragging) return;
      const dy = e.clientY - originRef.current.y;
      onChange(clamp(originRef.current.value + dy / CHAIN_TRAVEL));
    },
    onPointerUp: (e: React.PointerEvent) => {
      setDragging(false);
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    },
    onPointerCancel: () => setDragging(false),
    onPointerEnter: () => setHover(true),
    onPointerLeave: () => setHover(false),
    onKeyDown: (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 0.1 : 0.02;
      if (e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value - step)); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value + step)); }
      else if (e.key === 'Home') { e.preventDefault(); onChange(0); }
      else if (e.key === 'End') { e.preventDefault(); onChange(1); }
    },
  };

  return { dragging, hover, handlers, pct };
}

/** OPEN above, CLOSE below.
 *
 * The hardware alone does not say which way to pull. A chain is obviously
 * draggable once you have grabbed it, but nothing on screen says that dragging
 * DOWN is what closes the blind — the old slider said Open and Shut at its two
 * ends and that was the one thing worth keeping from it.
 *
 * Set at the two ends of the travel rather than beside the object, so the words
 * are the destinations: the label you are pulling toward is what you get. The
 * arrows carry the direction on their own for anyone who reads the glyph before
 * the word.
 *
 * Dark pills because these land on an unknown photograph — a pale wall, a
 * window, a dark curtain — and type alone cannot be legible on all three. */
const PULL_LABEL_STYLE: React.CSSProperties = {
  position: 'absolute',
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '3px 7px',
  borderRadius: 4,
  background: 'rgba(24,24,24,0.74)',
  backdropFilter: 'blur(3px)',
  color: 'rgba(255,255,255,0.94)',
  fontFamily: tokens.body,
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.16em',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  // The labels are signage on the object, not part of its hit area — grabbing
  // the word should not start a drag that the word is not attached to.
  pointerEvents: 'none',
  userSelect: 'none',
  transition: 'opacity 0.18s ease',
};

function PullLabels({ run, dimmed }: { run: number; dimmed: boolean }) {
  return (
    <>
      <div style={{ ...PULL_LABEL_STYLE, top: -19, opacity: dimmed ? 0.35 : 1 }}>▲ OPEN</div>
      <div style={{ ...PULL_LABEL_STYLE, top: CHAIN_TOP + run + 13, opacity: dimmed ? 0.35 : 1 }}>
        ▼ CLOSE
      </div>
    </>
  );
}

/** Wrapper carrying the interaction, the labels and the drop shadow. The two
 * pull controls differ only in the artwork they hand it. */
function PullControl({
  value,
  onChange,
  run,
  ariaLabel,
  children,
}: {
  value: number;
  onChange: (v: number) => void;
  run: number;
  ariaLabel: string;
  children: (travel: number) => React.ReactNode;
}) {
  const { dragging, hover, handlers, pct } = usePullDrag(value, onChange);

  return (
    <div
      role="slider"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      aria-valuetext={`${Math.round(pct * 100)}% closed`}
      tabIndex={0}
      {...handlers}
      style={{
        position: 'relative',
        // Generous hit area around hardware that is only ~20px of actual metal
        // or cord: the visible object stays thin and delicate, the target stays
        // usable.
        padding: `0 ${space.sm}px`,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        lineHeight: 0,
        // Thin, light hardware landing on whatever the photograph happens to
        // be. The drop shadow is what guarantees it separates from a pale wall;
        // it deepens on hover so the object acknowledges the pointer.
        filter: dragging || hover
          ? 'drop-shadow(0 3px 7px rgba(0,0,0,0.6))'
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
        transition: 'filter 0.18s ease',
      }}
    >
      {children(pct * CHAIN_TRAVEL)}
      {/* Faded while dragging: once the pull is under way the direction is no
          longer in question, and the words would only be in the way of watching
          the covering move. */}
      <PullLabels run={run} dimmed={dragging} />
    </div>
  );
}

/** BLINDS — a loop of nickel ball chain off the end of the tube. */
function BeadChain({
  value,
  onChange,
  run = CHAIN_H_FALLBACK,
}: {
  value: number;
  onChange: (v: number) => void;
  /** Visible length of the run, in CSS pixels. Sized to the covering's drop by
   * the caller so the hardware stays in proportion to the window. */
  run?: number;
}) {
  const xLeft = CHAIN_W / 2 - STRAND_GAP / 2;
  const xRight = CHAIN_W / 2 + STRAND_GAP / 2;

  return (
    <PullControl value={value} onChange={onChange} run={run} ariaLabel="Blind position — drag the chain">
      {travel => (
        <svg width={CHAIN_W} height={CHAIN_TOP + run + 16} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            {/* Across the bead, not down it: a ball catches its highlight on the
                side facing the window, which is what makes it read as metal
                rather than as a flat dot. */}
            <linearGradient id="klay-bead" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#9C9C9C" />
              <stop offset="30%" stopColor="#FBFBFB" />
              <stop offset="64%" stopColor="#D2D2D2" />
              <stop offset="100%" stopColor="#8A8A8A" />
            </linearGradient>
            <linearGradient id="klay-chain-mount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7E7E7E" />
              <stop offset="100%" stopColor="#4A4A4A" />
            </linearGradient>
          </defs>

          {/* The pulley housing the loop hangs from, at the end of the tube. */}
          <rect
            x={CHAIN_W / 2 - 7.5}
            y={2}
            width={15}
            height={CHAIN_TOP - 2}
            rx={3.5}
            fill="url(#klay-chain-mount)"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.6}
          />

          {/* Cord behind the beads. Without it a fast drag can show daylight
              between beads at the moment the phase wraps. */}
          <line x1={xLeft} y1={CHAIN_TOP} x2={xLeft} y2={CHAIN_TOP + run} stroke="rgba(90,90,90,0.34)" strokeWidth={0.9} />
          <line x1={xRight} y1={CHAIN_TOP} x2={xRight} y2={CHAIN_TOP + run} stroke="rgba(90,90,90,0.34)" strokeWidth={0.9} />

          {runYs(travel, run, BEAD_PITCH, BEAD_R).map(y => (
            <circle key={`l${y}`} cx={xLeft} cy={y} r={BEAD_R} fill="url(#klay-bead)" stroke="rgba(0,0,0,0.22)" strokeWidth={0.4} />
          ))}
          {runYs(-travel, run, BEAD_PITCH, BEAD_R).map(y => (
            <circle key={`r${y}`} cx={xRight} cy={y} r={BEAD_R} fill="url(#klay-bead)" stroke="rgba(0,0,0,0.22)" strokeWidth={0.4} />
          ))}

          {/* The connector that closes the loop, and the reason the two strands
              have to travel in opposite directions. */}
          <rect
            x={CHAIN_W / 2 - STRAND_GAP / 2 - 2.5}
            y={CHAIN_TOP + run - 1}
            width={STRAND_GAP + 5}
            height={7}
            rx={3.5}
            fill="url(#klay-chain-mount)"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.6}
          />
        </svg>
      )}
    </PullControl>
  );
}

/** CURTAINS — a corded track's cord loop, weighted at the bottom.
 *
 * Deliberately not the blind's chain. A curtain track runs a smooth braided
 * cord, not a ball chain, and it is tensioned by a weight hanging on the loop
 * rather than closed by a metal joiner. The differences are the whole point:
 * ecru braid instead of nickel balls, a teardrop weight instead of a connector,
 * a slimmer run.
 *
 * MOVEMENT WITHOUT BEADS was the problem to solve. A plain line gives no sign
 * that it is running, so the cord carries the short diagonal ticks of its own
 * fibre twist, scrolling on the same modulo trick the beads use. It reads as
 * rope moving over a pulley. */
function CurtainCord({
  value,
  onChange,
  run = CHAIN_H_FALLBACK,
}: {
  value: number;
  onChange: (v: number) => void;
  run?: number;
}) {
  const xLeft = CHAIN_W / 2 - STRAND_GAP / 2 + 1.5;
  const xRight = CHAIN_W / 2 + STRAND_GAP / 2 - 1.5;

  /** One strand: the braid, then its twist ticks scrolling along it. */
  const strand = (x: number, offset: number, key: string) => (
    <g key={key}>
      <line x1={x} y1={CHAIN_TOP} x2={x} y2={CHAIN_TOP + run} stroke="#8C7F6A" strokeWidth={2.6} strokeLinecap="round" />
      <line x1={x} y1={CHAIN_TOP} x2={x} y2={CHAIN_TOP + run} stroke="#E4DAC6" strokeWidth={1.5} strokeLinecap="round" />
      {runYs(offset, run, CORD_PITCH, 0).map(y => (
        <line
          key={`${key}${y}`}
          x1={x - 1.3}
          y1={y + 1.6}
          x2={x + 1.3}
          y2={y - 1.6}
          stroke="rgba(120,108,88,0.55)"
          strokeWidth={0.9}
          strokeLinecap="round"
        />
      ))}
    </g>
  );

  return (
    <PullControl value={value} onChange={onChange} run={run} ariaLabel="Curtain position — drag the cord">
      {travel => (
        <svg width={CHAIN_W} height={CHAIN_TOP + run + 20} style={{ display: 'block', overflow: 'visible' }}>
          <defs>
            <linearGradient id="klay-cord-weight" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8E8272" />
              <stop offset="38%" stopColor="#E8DFCD" />
              <stop offset="100%" stopColor="#7C7160" />
            </linearGradient>
            <linearGradient id="klay-cord-mount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8A8A8A" />
              <stop offset="100%" stopColor="#565656" />
            </linearGradient>
          </defs>

          {/* The pulley at the end of the track. Wider and flatter than the
              blind's, because a track end cap is a different fitting. */}
          <rect
            x={CHAIN_W / 2 - 9}
            y={4}
            width={18}
            height={CHAIN_TOP - 4}
            rx={2.5}
            fill="url(#klay-cord-mount)"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.6}
          />

          {strand(xLeft, travel, 'l')}
          {strand(xRight, -travel, 'r')}

          {/* The cord weight — a teardrop acorn that tensions the loop. This is
              the silhouette that most separates a curtain cord from a blind
              chain at a glance. */}
          <path
            d={`M ${CHAIN_W / 2} ${CHAIN_TOP + run - 2}
                C ${CHAIN_W / 2 - 5.5} ${CHAIN_TOP + run + 3},
                  ${CHAIN_W / 2 - 4.5} ${CHAIN_TOP + run + 15},
                  ${CHAIN_W / 2} ${CHAIN_TOP + run + 17}
                C ${CHAIN_W / 2 + 4.5} ${CHAIN_TOP + run + 15},
                  ${CHAIN_W / 2 + 5.5} ${CHAIN_TOP + run + 3},
                  ${CHAIN_W / 2} ${CHAIN_TOP + run - 2} Z`}
            fill="url(#klay-cord-weight)"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={0.6}
          />
        </svg>
      )}
    </PullControl>
  );
}

// --- Motorised: the handset ------------------------------------------------
// Selecting Motorised puts a remote in the frame, because that is the thing a
// motorised blind actually ships with and the thing the customer is being asked
// to picture themselves holding. It replaced three stacked pill buttons in a
// charcoal box, which described the feature accurately and sold none of it.
//
// IT POPS. The handset rises, scales up and fades in on mount, and because
// sideControl swaps components when the operation changes, that happens every
// time Motorised is picked rather than only on first paint. Driven by a state
// flip on the first frame plus a transition, not a keyframe — the visualiser
// has no stylesheet to put an @keyframes in, and this needs no global CSS.
//
// THE MIDDLE KEY IS NEW. The old panel could start a movement but never
// interrupt one; a real handset's stop button is the one control it always has.
// It halts the animation and the auto cycle wherever they are.

const KEY_FACE = 'linear-gradient(180deg, #4C4C4C 0%, #333 55%, #262626 100%)';
const KEY_FACE_ACCENT = 'linear-gradient(180deg, #9A7A50 0%, #8A6C46 60%, #6F5537 100%)';

function RemoteKey({
  label,
  ariaLabel,
  onClick,
  accent = false,
  wide = false,
}: {
  label: React.ReactNode;
  ariaLabel: string;
  onClick: () => void;
  accent?: boolean;
  wide?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);
  return (
    <button
      aria-label={ariaLabel}
      onClick={onClick}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => { setHover(false); setPressed(false); }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        width: wide ? 52 : 34,
        height: wide ? 20 : 34,
        borderRadius: wide ? 10 : '50%',
        border: '1px solid rgba(0,0,0,0.6)',
        background: accent ? KEY_FACE_ACCENT : KEY_FACE,
        color: accent ? '#FFF' : 'rgba(248,248,248,0.92)',
        fontFamily: tokens.body,
        fontSize: wide ? 8 : 12,
        fontWeight: 700,
        letterSpacing: wide ? '0.14em' : '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
        // Keys are lit from above and sink when pressed — the same physical
        // grammar as the configurator's Buttons, at the scale of a handset.
        boxShadow: pressed
          ? 'inset 0 2px 4px rgba(0,0,0,0.7)'
          : hover
            ? '0 1px 0 rgba(255,255,255,0.22) inset, 0 3px 6px rgba(0,0,0,0.5)'
            : '0 1px 0 rgba(255,255,255,0.16) inset, 0 2px 4px rgba(0,0,0,0.45)',
        transform: pressed ? 'translateY(1px)' : 'translateY(0)',
        transition: 'box-shadow 0.12s ease, transform 0.12s ease, background 0.2s ease',
      }}
    >
      {label}
    </button>
  );
}

function MotorRemote({
  onOpen,
  onShut,
  onStop,
  onToggleAuto,
  autoRunning,
  transmitting,
}: {
  onOpen: () => void;
  onShut: () => void;
  onStop: () => void;
  onToggleAuto: () => void;
  autoRunning: boolean;
  transmitting: boolean;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    // Next frame, so the browser paints the "before" state once and has
    // something to transition FROM. Setting it synchronously would land the
    // handset in its final position with no movement at all.
    const r = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
    <div
      style={{
        width: 78,
        padding: '10px 9px 12px',
        borderRadius: 16,
        // Bezel and body: a light top edge, a dark base, and a hairline of
        // white along the very top so the case has a moulded lip.
        background: 'linear-gradient(165deg, #3A3A3A 0%, #262626 46%, #1B1B1B 100%)',
        border: '1px solid rgba(0,0,0,0.7)',
        boxShadow: [
          '0 1px 0 rgba(255,255,255,0.18) inset',
          '0 -2px 6px rgba(0,0,0,0.4) inset',
          '0 18px 34px rgba(0,0,0,0.55)',
          '0 4px 10px rgba(0,0,0,0.4)',
        ].join(', '),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transformOrigin: 'center bottom',
        transform: shown ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.92)',
        opacity: shown ? 1 : 0,
        // Overshoots slightly on the way in, which is what makes it read as
        // popping rather than fading.
        transition: 'transform 340ms cubic-bezier(0.22, 1.2, 0.36, 1), opacity 240ms ease',
      }}
    >
      {/* Status LED. Lit while the motor is actually running, which is the only
          honest moment for it — a permanently-on light is decoration. */}
      <div
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: transmitting ? '#C2703A' : 'rgba(255,255,255,0.14)',
          boxShadow: transmitting ? '0 0 7px 2px rgba(194,112,58,0.85)' : 'none',
          transition: 'background 0.18s ease, box-shadow 0.18s ease',
        }}
      />

      <span
        style={{
          fontFamily: tokens.body,
          fontSize: 7,
          fontWeight: 700,
          letterSpacing: '0.3em',
          color: 'rgba(248,248,248,0.42)',
          // The wordmark is letter-spaced, which leaves a trailing gap on the
          // right and throws the centring out by half a space.
          textIndent: '0.3em',
        }}
      >
        KLAY
      </span>

      <RemoteKey label="▲" ariaLabel="Open the blind" onClick={onOpen} />
      <RemoteKey label="■" ariaLabel="Stop the blind" onClick={onStop} accent />
      <RemoteKey label="▼" ariaLabel="Close the blind" onClick={onShut} />

      <div style={{ width: '100%', height: 1, background: 'rgba(255,255,255,0.07)', margin: '1px 0' }} />

      <RemoteKey
        label={autoRunning ? 'STOP' : 'AUTO'}
        ariaLabel={autoRunning ? 'Stop the demonstration' : 'Run the blind up and down'}
        onClick={onToggleAuto}
        wide
        accent={autoRunning}
      />
    </div>
  );
}

/** THE SAMPLE ROOMS, AND THEY ARE NOT THE SAME FOR EVERY PRODUCT.
 *
 * The window presets are blind and curtain scenes — a window in the middle of a
 * wall, which is exactly what a roller blind needs and exactly the wrong thing
 * for a wardrobe. Offered one, the first thing a customer does is trace a
 * window and the first thing the visualiser does is stand a cupboard in front
 * of the glass.
 *
 * THE WARDROBE ROOMS ARE ALCOVES AT KNOWN WIDTHS, which is worth more than a
 * backdrop. Each was shot with its opening labelled, so the photograph carries
 * the one measurement a photograph normally cannot give up — and that lets the
 * preset seed a trace that is already the right size, instead of asking someone
 * to guess where the alcove's edges are before they have seen anything.
 *
 * They are supplied with doors on. The doors are not the product here — the
 * opening behind them is — so the trace goes on the opening and the visualiser
 * draws an open carcass into it. */
/** THE PATHS WERE WRONG AND HAD ALWAYS BEEN. They named `/images/room-N.png`;
 * the files are in `/images/rooms/`. Three empty frames on "visualise in your
 * own room", live, for as long as this list has existed.
 *
 * IT DID NOT 404, WHICH IS WHY NOTHING SAW IT. Vite and Netlify both fall back
 * to index.html for an unmatched path, so each request returned 200 with 9 KB
 * of HTML and the <img> quietly failed to decode it. The browser image check
 * counted non-200 responses and there were none to count.
 *
 * Caught by npm run check:asset-paths, which reads the file system instead of
 * the network for exactly this reason. */
const PRESET_ROOMS_WINDOW = ['/images/rooms/room-3.png', '/images/rooms/room-4.png', '/images/rooms/room-5.png'];

export interface WardrobeRoom {
  url: string;
  /** The opening's real width, from the label in the photograph itself. */
  openingMm: number;
}

/** NAMED BY THE LABEL IN THE PICTURE, not by the filename.
 *
 * `2700mm.jpeg` is a 2400 opening — the dimension drawn across the top of that
 * photograph says 2400mm, and the cabinet in it is the same width as the other
 * four-door shot. The file name is wrong and the artwork is right, so the
 * artwork wins. */
/** NO ENCODING NEEDED ANY MORE, because the filenames no longer need it.
 *
 * They were `visualizer pictures/1500 .. opening.jpeg` — a directory spelled
 * the American way the house style had already rejected, spaces in every name,
 * and a literal `..` in one of them, which is a path-traversal shape some
 * tooling normalises away. Every reference had to be percent-encoded by hand
 * just to be fetchable, and the encoded string had to be carried around so
 * openingWidthFor could match it back.
 *
 * Renamed at U4 to say what they are: the opening's width in millimetres.
 *
 * AND 2700mm.jpeg IS NOW opening-2400.jpeg, WHICH FIXES A NAME THAT WAS WRONG.
 * The dimension drawn across the top of that photograph reads 2400, and the
 * cabinet in it is the width of the other four-door shot. The supplier's
 * filename disagreed with their own artwork; the artwork wins, and the file is
 * now named for what it shows rather than needing a comment to explain that it
 * is not. */
const PRESET_ROOMS_WARDROBE: WardrobeRoom[] = [
  { url: '/images/visualiser/openings/opening-1500.jpeg', openingMm: 1500 },
  { url: '/images/visualiser/openings/opening-1800.jpeg', openingMm: 1800 },
  { url: '/images/visualiser/openings/opening-2100.jpeg', openingMm: 2100 },
  { url: '/images/visualiser/openings/opening-2400.jpeg', openingMm: 2400 },
];

const presetRoomsFor = (category: string): string[] =>
  category === 'wardrobe' ? PRESET_ROOMS_WARDROBE.map(r => r.url) : PRESET_ROOMS_WINDOW;

/** The opening width a wardrobe sample was shot at, if this is one of them.
 *
 * COMPARED ON THE DECODED PATH, because the URL does not survive the round trip
 * unchanged. These filenames contain spaces, so once one has been through an
 * <img src> and back out it arrives percent-encoded — `1500%20..%20opening` —
 * and a plain equality test against the literal never matched. The seeded trace
 * silently fell back to the generic default box, which covers most of the
 * photograph rather than the alcove. */
export const openingWidthFor = (url: string | null): number | null => {
  if (!url) return null;
  const norm = (u: string) => {
    try { return decodeURI(u); } catch { return u; }
  };
  const want = norm(url);
  return PRESET_ROOMS_WARDROBE.find(r => norm(r.url) === want)?.openingMm ?? null;
};

// Loaded automatically on mount so the visualiser never shows an empty
// upload prompt by default — the blind renders immediately against this
// photo using a fixed set of corner pins (see DEFAULT_WINDOW_CORNERS_PCT),
// with no CornerPinOverlay involved at all until the user replaces it.
const DEFAULT_WINDOW_URL = '/images/visualiser/preview.png';

/** THE WARDROBE PREVIEW IS AN ALCOVE, not the window photograph.
 *
 * Preview.png is a bedroom with a window in it, and it is right for a blind.
 * For a wardrobe it was never more than the least-bad option: a customer
 * arriving on the wardrobe tab saw a cupboard standing against a window, which
 * is the first thing the visualiser says about the product and it was saying
 * something false.
 *
 * The 1500 alcove says the true thing instead — a built-in robe in an opening,
 * which is what these are — and it comes dimensioned, so the seeded trace can
 * be the real opening rather than a guess. */
const DEFAULT_WARDROBE_URL = '/images/visualiser/openings/opening-1500.jpeg';

// Shelving takes the alcove too: it is joinery going into an opening, and the
// window photograph would be as wrong for it as it is for a robe.
const defaultPhotoFor = (category: ProductCategory) =>
  isJoinery(category) ? DEFAULT_WARDROBE_URL : DEFAULT_WINDOW_URL;
// The glass aperture of the double window in Preview.png (1254 x 1254).
//
// These pins are paired to this photo and only this photo. Swapping
// DEFAULT_WINDOW_URL without re-measuring will hang the blind off its window.
//
// A true quad, not a rectangle: the window is photographed in perspective, so
// the top edge falls ~63px from left to right while the bottom edge rises
// ~40px, and the left edge stands ~103px taller than the right. Each corner
// therefore has its own x AND y — an axis-aligned rectangle cannot sit on this
// window. Order is TL, TR, BR, BL, which is what the renderer destructures
// positionally.
// Measured by dragging the corner pins onto the glass in the browser, then
// reading back the confirmed quad — so these are the renderer's own numbers,
// not an estimate off the image.
const DEFAULT_WINDOW_CORNERS_PCT: [number, number][] = [
  [0.1918, 0.1989], // top-left     — x 241, y 249
  [0.5841, 0.2492], // top-right    — x 732, y 312
  [0.5830, 0.6382], // bottom-right — x 731, y 800
  [0.1864, 0.6699], // bottom-left  — x 234, y 840
];

/** WHERE A WARDROBE STANDS ON THE DEFAULT PHOTO.
 *
 * The seeded trace is the window's glass, which is the right default for
 * everything that hangs on a window and exactly the wrong one for a wardrobe:
 * it stands the cabinet inside the opening, floating a metre off the floor with
 * the garden behind it. The first render of the wardrobe tab did precisely that.
 *
 * So wardrobes get their own default footprint on Preview.png — the left-hand
 * wall, running down to where the floor meets it.
 *
 * ITS PROPORTIONS MATTER now that the renderer fills whatever is traced. The
 * first version of this box was half as wide as it was tall, so the very first
 * thing a visitor saw was a wide cabinet squeezed into a narrow slot. This one
 * is about 1.25:1, which is the shape of the keyed sticker, so the default
 * opens on the product at its own proportions and any distortion after that is
 * something the customer drew themselves.
 *
 * It is a starting position, not a claim about the room — the customer retraces
 * or uploads their own wall from here.
 *
 * A rectangle rather than a true quad, because the renderer takes this as a
 * footprint to stand a photograph in rather than a plane to project onto — see
 * Canvas2DWardrobeRenderer. */
const DEFAULT_WARDROBE_CORNERS_PCT: [number, number][] = [
  [0.035, 0.435],
  [0.605, 0.435],
  [0.605, 0.900],
  [0.035, 0.900],
];

/** WHERE THE WARDROBE GOES IN EACH SUPPLIED PHOTOGRAPH.
 *
 * MEASURED PER PHOTOGRAPH, and the previous set was not, whatever its comment
 * said: all four shared a top and a bottom, which is the signature of exactly
 * the ratio-scaling it disowned. The top sat about 70px above the architrave in
 * the 1500 shot, so the seeded quad was some 10% too tall and the render hung
 * over the frame before anything else went wrong.
 *
 * THE ARROW IS THE RULER. Each photograph is annotated with a white dimension
 * arrow spanning the opening and labelled in millimetres, which fixes
 * millimetres-per-pixel exactly. Left and right are read straight off it.
 *
 * THIS IS THE CABINET'S FOOTPRINT, NOT THE DOORWAY, and the difference matters
 * because the four photographs do not agree with each other. Scaled by their
 * own arrows, the openings measure:
 *
 *   1500 x 2460    1800 x 2467    2100 x 1990    2400 x 1997
 *
 * Two of them are 2016-high openings and two are full-height door openings.
 * Every unit in the range is 2016 tall, so seeding to the doorway would draw a
 * 1500 cabinet 2460 high — the proportion wrong by a fifth, and worse, the
 * width the renderer derives from the trace would come out at about 1160mm and
 * the fixed 507 modules would be sliced against a number that is not real.
 *
 * So the box is the opening's full width, standing on its floor, 2016 tall at
 * that photograph's own scale. Where the doorway is 2016 the two coincide;
 * where it is taller, the gap above the cabinet is left showing, because that
 * is what a 2016 unit in a 2460 opening actually looks like.
 *
 * A starting position rather than a claim: the customer drags the pins or
 * uploads their own wall from here. */
const ALCOVE_BOXES: Record<number, { l: number; r: number; t: number; b: number }> = {
  1500: { l: 0.357, r: 0.602, t: 0.326, b: 0.820 },
  1800: { l: 0.348, r: 0.645, t: 0.336, b: 0.835 },
  2100: { l: 0.293, r: 0.715, t: 0.207, b: 0.815 },
  2400: { l: 0.255, r: 0.755, t: 0.189, b: 0.815 },
};

function alcoveCornersPct(openingMm: number): [number, number][] {
  const box = ALCOVE_BOXES[openingMm] ?? ALCOVE_BOXES[1500];
  return [
    [box.l, box.t],
    [box.r, box.t],
    [box.r, box.b],
    [box.l, box.b],
  ];
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface KlayConfiguratorProps {
  /** Pre-selects a blind type and locks it, for callers that already know
   * which product the customer is looking at — a product page has no reason
   * to offer the type switcher, since the URL already answered that. Setting
   * `lockedRange` is what hides the switcher in VisualiserControls. */
  defaultBlindType?: BlindType;
  /** Height cap for the media box, in vh. Defaults to MAX_MEDIA_VH; a
   * full-height column can afford more than a section on a scrolling page. */
  mediaMaxVh?: number;
}

// Canvas-only: renders the upload / trace / rendered-blind states inside a
// self-contained box. All configurator controls (Range, Hardware, Size,
// Operation, Price, Book Installation) live in the caller's own layout —
// see VisualiserControls — since callers place this box differently
// (VisualiserSection's right column vs VisualiserPage's full-bleed canvas).
export default function KlayConfigurator({
  defaultBlindType,
  mediaMaxVh = MAX_MEDIA_VH,
}: KlayConfiguratorProps = {}) {
  const store = useVisualiserStore();

  // Before anything else, so the seeded trace and the first render both see
  // the right type. The store is module-global and outlives this component,
  // so the lock is released on unmount — otherwise the general visualiser
  // page would come up with its type switcher still hidden.
  useEffect(() => {
    if (!defaultBlindType) return;
    store.setBlindType(defaultBlindType);
    store.setLockedRange(defaultBlindType);
    return () => store.setLockedRange(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultBlindType]);

  const { photoUrl: hookPhotoUrl, photoBitmap, uploadError, handleUpload, handleTakePhoto, loadFromUrl, clear } = usePhotoUpload();

  const overlayRef = useRef<CornerPinOverlayHandle>(null);
  const rendererContainerRef = useRef<HTMLDivElement>(null);

  // Set once the default window's traced area has been seeded, so a later
  // real upload/preset selection can be told apart from that initial load.
  const hasSeededDefaultRef = useRef(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);

  // Kick off the default window photo once, on mount — only if the store
  // doesn't already carry a real user photo from earlier in this session.
  useEffect(() => {
    if (store.defaultWindowActive) {
      // THE CATEGORY IS READ FRESH, not captured. This runs once on mount, and
      // the store may already say 'wardrobe' — a visitor who left the tab there,
      // or a host that mounts with it set. Loading the window photo first and
      // letting the category effect correct it afterwards raced: two loads in
      // flight, and whichever image decoded last won.
      loadFromUrl(defaultPhotoFor(useVisualiserStore.getState().productCategory));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The hook owns photo acquisition; only photoUrl needs to live in the
  // shared store (photoBitmap stays local — it's only needed here for
  // pixel dimensions). A new photo always invalidates any existing trace.
  // Once the default window has already been seeded once, any further
  // photo change is a real user upload/preset — that ends default mode and
  // hands control back to normal corner-pin tracing.
  useEffect(() => {
    store.setPhotoUrl(hookPhotoUrl);
    if (hookPhotoUrl) {
      store.clearTracedAreas();
      if (hasSeededDefaultRef.current) {
        store.setDefaultWindowActive(false);
        setShowUploadPrompt(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hookPhotoUrl]);

  // Once the default window's bitmap is ready, seed its trace directly —
  // no CornerPinOverlay, no user interaction, pins locked to the preset.
  //
  // The emptiness check reads LIVE store state rather than this render's
  // snapshot. loadFromUrl sets the bitmap and the url together, so React
  // batches them into one commit and both effects run in the same flush: the
  // effect above clears the trace, and this one used to still see the
  // pre-clear array. On a first load that was harmless because the array was
  // already empty — but arriving from another page that had seeded (homepage
  // to a product page, where the store is shared and nothing had cleared it)
  // it read a stale length of 1, failed the guard, and never retried, because
  // none of this effect's dependencies change when the clear lands. That left
  // the configurator permanently unseeded, which renders as an empty box.
  // tracedAreas.length is a dependency for the same reason — belt and braces
  // if the two updates ever land in separate commits.
  useEffect(() => {
    // THE PHOTO HAS TO BE THIS CATEGORY'S OWN, and that is not a tidiness
    // check — it is what stops the wardrobe landing on a trace overlay.
    //
    // Switching category clears the trace and starts loading the other default
    // photograph, and loadFromUrl is asynchronous. So there is a commit where
    // tracedAreas is empty, the category says 'wardrobe', and hookPhotoUrl is
    // still the WINDOW photograph from a moment ago. The old guard accepted
    // that — it asked only whether the URL was a default of some kind — so it
    // seeded window corners onto a wardrobe and set hasSeededDefaultRef. When
    // the alcove then arrived, the photo effect saw that ref already true, read
    // the load as a real upload and turned default mode off. No reseed, no
    // confirmed area, and the visitor got "Confirm outline" over an alcove
    // instead of the wardrobe rendered in it.
    //
    // Comparing against defaultPhotoFor(category) means the seed waits for the
    // photograph it is actually seeding.
    const expected = defaultPhotoFor(store.productCategory);
    if (
      store.defaultWindowActive &&
      !hasSeededDefaultRef.current &&
      photoBitmap &&
      hookPhotoUrl === expected &&
      useVisualiserStore.getState().tracedAreas.length === 0
    ) {
      // A SUPPLIED ALCOVE SEEDS ITS OWN OPENING. These photographs were shot
      // with the opening labelled, so where the alcove is and how wide it is
      // are both known — the trace can start on it rather than asking someone
      // to find it. Everything else falls back to the fixed default.
      // THE STORE HAS TO LEARN THE PHOTO TOO. loadFromUrl sets the hook's own
      // state — the bitmap and the URL it decoded — but the store keeps its own
      // photoUrl, and that is the one the renderer reads. A preset thumbnail
      // sets both because its click handler calls setPhotoUrl explicitly; the
      // default path never did, so the store sat on a null photo and the
      // wardrobe never rendered.
      if (useVisualiserStore.getState().photoUrl !== hookPhotoUrl) {
        store.setPhotoUrl(hookPhotoUrl);
      }

      const openingMm = openingWidthFor(hookPhotoUrl);
      const seed =
        openingMm !== null
          ? alcoveCornersPct(openingMm)
          : isJoinery(useVisualiserStore.getState().productCategory)
            ? DEFAULT_WARDROBE_CORNERS_PCT
            : DEFAULT_WINDOW_CORNERS_PCT;
      const corners: Point[] = seed.map(([px, py]) => [
        px * photoBitmap.width,
        py * photoBitmap.height,
      ]);
      store.addTracedArea({
        id: crypto.randomUUID(),
        corners,
        blindType: store.blindType,
        fabricColor: store.getFabricColor(),
        hardwareColor: store.getHardwareColor(),
        controlType: store.operation,
        showChain: false,
        confirmed: true,
      });
      hasSeededDefaultRef.current = true;
    }
    // productCategory is a dependency because `expected` is derived from it:
    // the effect has to re-run when the category changes, or the guard above is
    // comparing against the previous category's photograph.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoBitmap, hookPhotoUrl, store.defaultWindowActive, store.tracedAreas.length, store.productCategory]);

  const hasPhoto = !!(store.photoUrl && photoBitmap);
  const confirmedArea = store.tracedAreas.find(a => a.confirmed);

  // The media box's rendered height, watched rather than read once: the box is
  // sized off the viewport (MAX_MEDIA_VH) and the photo's own ratio, so it
  // changes on every resize and on every photo swap. The chain is measured
  // against it, and a stale height would hang a chain of the wrong length.
  const mediaBoxRef = useRef<HTMLDivElement>(null);
  const [mediaBoxH, setMediaBoxH] = useState(0);
  useEffect(() => {
    const el = mediaBoxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setMediaBoxH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  // Brief, near-instant window while the default photo's bitmap loads —
  // rendered as nothing (not the upload prompt) so there's no empty state.
  const isLoadingDefault = store.defaultWindowActive && !hasPhoto && !uploadError && !showUploadPrompt;

  const handleChangePhoto = () => {
    clear();
    store.setPhotoUrl(null);
    store.clearTracedAreas();
  };

  const handleConfirmTrace = (corners: Point[]) => {
    store.addTracedArea({
      id: crypto.randomUUID(),
      corners,
      blindType: store.blindType,
      fabricColor: store.getFabricColor(),
      hardwareColor: store.getHardwareColor(),
      controlType: store.operation,
      showChain: false,
      confirmed: true,
    });
  };

  const handleDownload = () => {
    const canvas = rendererContainerRef.current?.querySelector('canvas');
    if (!canvas) return;
    const colourSlug = store.fabricColour.toLowerCase().replace(/\s+/g, '-');
    const link = document.createElement('a');
    link.download = `klay-blind-${store.blindType}-${colourSlug}-${store.windowSize}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.click();
  };

  // --- Motorised auto (open -> close -> open, looping) ----------------------
  const animFrameRef = useRef<number | null>(null);
  const autoTimeoutRef = useRef<number | null>(null);
  const autoRunningRef = useRef(false);
  const [autoRunning, setAutoRunning] = useState(false);
  const rollPositionRef = useRef(store.rollPosition);
  rollPositionRef.current = store.rollPosition;

  const cancelRollAnimation = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (autoTimeoutRef.current !== null) {
      clearTimeout(autoTimeoutRef.current);
      autoTimeoutRef.current = null;
    }
  };

  const animateRollTo = (target: number, duration: number, onDone?: () => void) => {
    if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current);
    const from = rollPositionRef.current;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      store.setRollPosition(from + (target - from) * easeInOut(t));
      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
        onDone?.();
      }
    };
    animFrameRef.current = requestAnimationFrame(step);
  };

  // Lights the handset's LED, and only while the blind is genuinely moving —
  // set when a movement starts, cleared when it lands or is interrupted. The
  // stop key clears it directly, which is what makes stopping feel like it did
  // something even though the blind simply stays where it is.
  const [motorRunning, setMotorRunning] = useState(false);

  /** One motor command: travel to `target`, holding the LED for the trip. */
  const runMotor = (target: number) => {
    setMotorRunning(true);
    animateRollTo(target, 1200, () => setMotorRunning(false));
  };

  const stopAuto = () => {
    autoRunningRef.current = false;
    setAutoRunning(false);
    setMotorRunning(false);
    cancelRollAnimation();
  };

  const startAuto = () => {
    autoRunningRef.current = true;
    setAutoRunning(true);
    // The LED follows each leg of the cycle rather than staying lit throughout,
    // so it goes dark in the two 600ms pauses — which is exactly when a real
    // blind is sitting still at the top or bottom of its travel.
    const cycle = () => {
      if (!autoRunningRef.current) return;
      setMotorRunning(true);
      animateRollTo(0, 1500, () => {
        if (!autoRunningRef.current) return;
        setMotorRunning(false);
        autoTimeoutRef.current = window.setTimeout(() => {
          if (!autoRunningRef.current) return;
          setMotorRunning(true);
          animateRollTo(1, 1500, () => {
            if (!autoRunningRef.current) return;
            setMotorRunning(false);
            autoTimeoutRef.current = window.setTimeout(cycle, 600);
          });
        }, 600);
      });
    };
    cycle();
  };

  // WHICH operation. Blinds and curtains keep separate operation fields, and
  // this control read the blind's for both — so a curtain switched to Motorised
  // still got the manual control, and a motorised blind switched to curtains
  // kept a handset the curtain had not asked for. Harmless while the control
  // was an abstract slider; not harmless now that manual and motorised draw
  // visibly different hardware.
  const activeOperation =
    store.productCategory === 'curtain' ? store.curtainOperation : store.operation;

  // Leaving motorised must stop a running demo, whichever product's operation
  // field was the one that changed.
  useEffect(() => {
    if (activeOperation !== 'motorised') stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOperation]);

  useEffect(() => () => stopAuto(), []); // eslint-disable-line react-hooks/exhaustive-deps

  // RE-SEED WHEN THE PRODUCT CHANGES SHAPE. A blind and a wardrobe want
  // completely different default footprints — the window's glass versus the
  // wall beside it — and the seed above fires once per photo, so whichever
  // category happened to be showing at load would otherwise own the trace for
  // the rest of the session. Crossing between wardrobes and window coverings
  // therefore drops the seeded default and lets it run again for the category
  // now in play.
  //
  // ONLY WHILE THE DEFAULT PHOTO IS SHOWING. Once the customer has uploaded a
  // room and traced it, that trace is theirs; throwing it away because they
  // looked at a different product would be destroying work they did.
  const seededForWardrobeRef = useRef(isJoinery(store.productCategory));
  useEffect(() => {
    const isWardrobe = isJoinery(store.productCategory);
    if (isWardrobe === seededForWardrobeRef.current) return;
    seededForWardrobeRef.current = isWardrobe;
    if (!store.defaultWindowActive) return;
    hasSeededDefaultRef.current = false;
    store.clearTracedAreas();
    // AND THE PHOTOGRAPH CHANGES WITH IT. The two categories have different
    // default rooms — a window for a blind, an alcove for a wardrobe — so
    // crossing between them has to reload the photo, not just clear the trace.
    // Left alone, a customer switching to wardrobes got a cupboard standing
    // against a window, which is the first thing the visualiser says about the
    // product.
    loadFromUrl(defaultPhotoFor(store.productCategory));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.productCategory, store.defaultWindowActive]);

  const canvasTracedAreas: RenderedArea[] = store.tracedAreas.map(a => ({
    ...a,
    blindType: store.blindType,
    fabricColor: store.getFabricColor(),
    hardwareColor: store.getHardwareColor(),
    hardwareColourName: store.hardwareColour,
    controlType: store.operation,
    showChain: false,
    productCategory: store.productCategory,
    curtainType: store.curtainType,
    curtainOperation: store.curtainOperation,
    curtainMount: store.curtainMount,
  }));

  // The default window's pins are seeded in an effect, but these states are
  // resolved during render — so on a cold load there is one painted frame
  // where the bitmap has arrived (hasPhoto true) and the seed has not yet
  // committed (tracedAreas still empty). Without this guard that frame
  // resolved to showTraceState, flashing the corner-pin overlay and a
  // "Confirm outline" button at every first-time visitor: the default window
  // is supposed to need no interaction at all, and for that frame it looked
  // like tracing your own window was a required step before anything rendered.
  // Holding the loading state through the gap means it goes straight from
  // blank to the rendered blind.
  const awaitingDefaultSeed = store.defaultWindowActive && !hasSeededDefaultRef.current;

  // The three canvas states, resolved once so the canvas area and the
  // persistent footer below it can never disagree about which one is showing.
  const showUploadState = !isLoadingDefault && (!hasPhoto || showUploadPrompt);
  const showTraceState =
    !isLoadingDefault && !showUploadState && !confirmedArea && !awaitingDefaultSeed;
  const showRenderState = !isLoadingDefault && !showUploadState && !!confirmedArea;

  /** TURN IT vs SEE IT IN THE ROOM — two different questions, so two views.
   *
   * The room composite answers "does this fit my bedroom", and it has to be a
   * photograph pasted onto a photograph to do that. The 3D view answers "what
   * IS this thing", which needs the cabinet on its own and turnable, and cannot
   * be a fixed viewpoint however well composited.
   *
   * A WARDROBE IS 3D ONLY, FOR NOW, and the room half is switched off rather
   * than deleted. WardrobeRoomRenderer, the trace, the recess shade and the
   * seeded alcoves are all still here and still work; what is not offered is
   * the button that reaches them, for the reason in the footer note — the
   * composite is only as good as the trace it is given, and the trace is the
   * part still being settled.
   *
   * So this is `true` for a wardrobe and there is nothing to toggle. Blinds and
   * curtains never had a 3D view and are untouched. Flip ROOM_VIEW_READY when
   * the trace is trustworthy and both views come back with their toggle. */
  const isWardrobe = isJoinery(store.productCategory);
  const wardrobe3D = isWardrobe && !ROOM_VIEW_READY;

  // Footer sits BELOW the canvas rather than floating over it, so "Visualise
  // in your own room" is always reachable while the default window shows.
  const footerButtons = showUploadState ? (
    // Opened from the default window — offer a way back to it, otherwise the
    // upload prompt is a one-way door out of a perfectly good render.
    store.defaultWindowActive && hasPhoto ? (
      <Button onClick={() => setShowUploadPrompt(false)}>Cancel</Button>
    ) : null
  ) : showTraceState ? (
    // In the footer rather than over the image: at bottom:16 these sat on
    // top of the photo and could cover the very corner pins being dragged.
    <>
      <Button onClick={handleChangePhoto}>Change photo</Button>
      <Button variant="primary" onClick={() => overlayRef.current?.confirm()}>
        Confirm outline
      </Button>
    </>
  ) : showRenderState ? (
    store.defaultWindowActive ? (
      <>
        {/* IN YOUR ROOM IS NOT OFFERED FOR WARDROBES YET, and it is announced
            rather than hidden — see ROOM_VIEW_READY for why it is off and what
            turning it on takes.

            A disabled button rather than no button, because "coming soon" is
            information: it tells a customer the thing they are looking for is
            planned, and it holds the row's shape so nothing moves when it goes
            live. There is no "Turn it in 3D" beside it any more, because the 3D
            view is now the only wardrobe view and a toggle with one destination
            is a button that does nothing.

            Blinds and curtains are untouched: their composite has been in front
            of customers for months. */}
        {isWardrobe ? (
          <Button variant="accent" disabled onClick={() => {}}>
            In your room — coming soon
          </Button>
        ) : (
          <Button variant="accent" onClick={() => setShowUploadPrompt(true)}>
            Visualise in your own room
          </Button>
        )}
      </>
    ) : (
      <>
        <Button onClick={() => {
          clear();
          store.setPhotoUrl(null);
          store.clearTracedAreas();
          store.setDefaultWindowActive(true);
          hasSeededDefaultRef.current = false;
          loadFromUrl(defaultPhotoFor(store.productCategory));
        }}>Back to preview</Button>
        <Button onClick={() => store.clearTracedAreas()}>Retrace</Button>
        <Button variant="primary" onClick={handleDownload}>Download</Button>
      </>
    )
  ) : null;

  // HOW LONG THE PULL IS. Sized to the covering's drop so the hardware stays in
  // proportion to the window — a bit over half its height, which is where a real
  // chain hangs to. Clamped at both ends so a small traced window still gets
  // something you can grab and a very tall one does not get a run that falls off
  // the bottom of the frame.
  //
  // The corners are in photo-pixel space and the box is a percentage of the
  // viewport, so the conversion goes through the photo's dimensions: a fraction
  // of the bitmap is a fraction of the box, whatever size the box is today.
  const pullRun = (() => {
    if (!confirmedArea || !photoBitmap || !mediaBoxH) return null;
    const topRight = confirmedArea.corners[1];
    const bottomRight = confirmedArea.corners[2];
    if (!topRight || !bottomRight) return null;
    const dropPx = ((bottomRight[1] - topRight[1]) / photoBitmap.height) * mediaBoxH;
    return Math.max(70, Math.min(240, dropPx * 0.62));
  })();

  // WHERE EVERY CONTROL SITS: against the right edge of the frame, vertically
  // centred. One position for all three, because they are one control in three
  // forms and the eye should not have to go looking for it when the operation
  // changes.
  //
  // The pulls used to be positioned from the blind's own top-right corner, which
  // is where the hardware physically is. It was more truthful and it read worse:
  // the traced window is usually somewhere in the middle of the photograph, so
  // the chain landed in the middle of the picture, over the part of the room the
  // customer is trying to look at, and it moved every time a different window
  // was traced. Against the frame edge it is out of the photograph's way, it is
  // in the same place every time, and it is where the handset already was.
  const SIDE_CONTROL_POSITION: React.CSSProperties = {
    position: 'absolute',
    right: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 20,
  };

  // Each operation gets the object it is actually sold with: a chain for
  // manual, a handset for motorised. Both are hardware in the room rather than
  // UI over the top of it, which is the point — the visualiser sells what the
  // window will look like, and the thing you touch is part of that.
  //
  // They mount differently because they ARE different things. The chain belongs
  // to the blind and is placed against it. The handset is held, so it sits off
  // to the side of the frame where a hand would be, unattached to anything.
  const sideControl = !showRenderState || isJoinery(store.productCategory) ? null : activeOperation === 'motorised' ? (
    <div style={SIDE_CONTROL_POSITION}>
      <MotorRemote
        autoRunning={autoRunning}
        transmitting={motorRunning}
        onOpen={() => { stopAuto(); runMotor(0); }}
        onShut={() => { stopAuto(); runMotor(1); }}
        onStop={() => { stopAuto(); setMotorRunning(false); }}
        onToggleAuto={() => (autoRunning ? stopAuto() : startAuto())}
      />
    </div>
  ) : pullRun ? (
    <div style={SIDE_CONTROL_POSITION}>
      {store.productCategory === 'curtain' ? (
        <CurtainCord value={store.rollPosition} onChange={v => store.setRollPosition(v)} run={pullRun} />
      ) : (
        <BeadChain value={store.rollPosition} onChange={v => store.setRollPosition(v)} run={pullRun} />
      )}
    </div>
  ) : null;

  // The box takes the photo's own shape instead of sitting in a fixed panel
  // and letterboxing the image inside it. Height is capped by capping WIDTH
  // (maxWidth = maxHeight x ratio) — capping height directly would fight the
  // aspect-ratio and reintroduce the empty charcoal margins.
  const photoRatio = photoBitmap ? photoBitmap.width / photoBitmap.height : 4 / 3;

  return (
    <div
      style={{
        width: '100%',
        maxWidth: `calc(${mediaMaxVh}vh * ${photoRatio})`,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        background: tokens.charcoal,
        borderRadius: radius.md,
        overflow: 'hidden',
        boxShadow: '0 16px 40px rgba(29,29,29,0.22)',
      }}
    >
      <div ref={mediaBoxRef} style={{ position: 'relative', width: '100%', aspectRatio: String(photoRatio) }}>
      {isLoadingDefault ? null : showUploadState ? (
        /* STATE 1 — no photo yet, or the user asked to visualise their own room */
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: space.md,
          }}
        >
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <h2 style={{ ...typeScale.card, color: tokens.onDark }}>
              Upload a photo of your window
            </h2>
            <p style={{ ...typeScale.body, color: tokens.onDarkMuted, marginTop: space.xs }}>
              or choose a preset room
            </p>
            <div style={{ display: 'flex', gap: space.sm, marginTop: space.md, justifyContent: 'center' }}>
              <Button variant="primary" onClick={handleUpload}>Upload photo</Button>
              <Button onClick={handleTakePhoto}>Take photo</Button>
            </div>
            <div style={{ display: 'flex', gap: space.md, marginTop: space.lg, justifyContent: 'center' }}>
              {presetRoomsFor(store.productCategory).map(url => (
                <img
                  key={url}
                  src={url}
                  onClick={() => {
                    store.setPhotoUrl(url);
                    loadFromUrl(url);
                    store.clearTracedAreas();
                  }}
                  style={{
                    width: 116,
                    height: 78,
                    objectFit: 'cover',
                    borderRadius: radius.md,
                    border: `1px solid ${tokens.onDarkLine}`,
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : showTraceState ? (
        /* STATE 2 — photo loaded, not yet traced. The media box already
           carries the photo's aspect ratio, so the image fills it exactly
           and the overlay's pin coordinates line up with what's on screen. */
        <div style={{ position: 'absolute', inset: 0 }}>
          <img
            src={store.photoUrl!}
            alt="Your room"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          {/* FOUR POINTS, and for a wardrobe they are the ALCOVE'S FRONT FRAME.
              Two points could not describe a recess — they fixed a scale and a
              lean and nothing else, so a wall running away to one side had
              nowhere to say so. A quad can, and that is what a built-in needs:
              the opening it is being built into. See drawBuiltIn. */}
          <CornerPinOverlay
            // Keyed on the photo, so choosing another sample re-opens the pins
            // on ITS subject rather than leaving them where the last one was.
            key={hookPhotoUrl ?? 'none'}
            ref={overlayRef}
            imageWidth={photoBitmap!.width}
            imageHeight={photoBitmap!.height}
            onConfirm={handleConfirmTrace}
            initialCornersPct={
              openingWidthFor(hookPhotoUrl) !== null
                ? (alcoveCornersPct(openingWidthFor(hookPhotoUrl)!) as Point[])
                : undefined
            }
          />
          {/* Confirm / Change photo live in the footer — see footerButtons. */}
        </div>
      ) : (
        /* STATE 3 — area traced and confirmed */
        <div ref={rendererContainerRef} style={{ position: 'absolute', inset: 0 }}>
          {/* ON THE PICTURE, NOT IN THE FORM. The wall colour is judged by eye
              against the render, so it belongs over the thing it changes —
              a column away meant looking left to click and right to see. It is
              also not a configuration: nothing about it reaches a quote. See
              WallColourChip.

              Joinery only. A blind or a curtain is composited onto the
              customer's own photograph, which already has their wall in it. */}
          {isJoinery(store.productCategory) && (
            <WallColourChip
              value={store.wardrobeWallColour}
              onChange={store.setWardrobeWallColour}
            />
          )}
          {isJoinery(store.productCategory) && wardrobe3D ? (
            /* TURN IT. The sticker projected onto the real carcass, orbitable
               — see Wardrobe3D. It stands on its own rather than in the room
               photo, because the cabinet is what is being examined here; the
               room view is the other tab, and it is shown at the width the
               customer traced so both views are the same cabinet. */
            <Wardrobe3D
              modelId={store.wardrobeModel}
              colourName={store.wardrobeColour}
              selectedWidthMm={store.wardrobeWidthMm}
              handleFinish={store.wardrobeHandleFinish}
              recessed={store.wardrobeRecessed}
              wallColour={store.wardrobeWallColour}
            />
          ) : isJoinery(store.productCategory) && confirmedArea ? (
            <WardrobeRoomRenderer
              photoUrl={store.photoUrl!}
              corners={confirmedArea.corners as [number, number][]}
              modelId={store.wardrobeModel}
              colourName={store.wardrobeColour}
              widthMm={store.wardrobeWidthMm}
              handleFinish={store.wardrobeHandleFinish}
              recessed={store.wardrobeRecessed}
              wallColour={store.wardrobeWallColour}
            />
          ) : store.productCategory === 'curtain' && confirmedArea ? (
            <Canvas2DCurtainRenderer
              tl={{ x: confirmedArea.corners[0][0], y: confirmedArea.corners[0][1] }}
              tr={{ x: confirmedArea.corners[1][0], y: confirmedArea.corners[1][1] }}
              br={{ x: confirmedArea.corners[2][0], y: confirmedArea.corners[2][1] }}
              bl={{ x: confirmedArea.corners[3][0], y: confirmedArea.corners[3][1] }}
              fabricType={store.curtainType}
              hardwareColour={store.hardwareColour}
              mount={store.curtainMount}
              colour={store.getFabricColor()}
              // The ordered width, which is what decides how many waves the
              // heading carries — a 3m track is not a 1.2m track with fatter
              // folds. See wavesForTrack.
              size={store.curtainSize}
              openness={1 - store.rollPosition}
              canvasWidth={photoBitmap?.width ?? 1}
              canvasHeight={photoBitmap?.height ?? 1}
              photoUrl={store.photoUrl!}
            />
          ) : (
            <Canvas2DBlindRenderer
              photoUrl={store.photoUrl!}
              tracedAreas={canvasTracedAreas}
              activeAreaId={store.activeAreaId ?? undefined}
              rollPosition={store.rollPosition}
            />
          )}

          {/* Each control carries its own absolute placement — the chain from
              the blind's corner, the handset from the frame's edge. */}
          {sideControl}
        </div>
      )}
      </div>

      {footerButtons && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: space.sm,
            padding: `${space.sm}px ${space.md}px`,
            borderTop: `1px solid ${tokens.onDarkLine}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: space.sm }}>{footerButtons}</div>
        </div>
      )}
    </div>
  );
}

