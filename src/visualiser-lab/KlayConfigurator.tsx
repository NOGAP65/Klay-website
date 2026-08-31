import { useEffect, useRef, useState } from 'react';
import { radius, tokens, space, type as typeScale } from '../theme';
import { useVisualiserStore, BlindType } from './useVisualiserStore';
import { usePhotoUpload } from './usePhotoUpload';
import CornerPinOverlay, { CornerPinOverlayHandle, Point } from './CornerPinOverlay';
import Canvas2DBlindRenderer, { RenderedArea } from './Canvas2DBlindRenderer';
import Canvas2DCurtainRenderer from './Canvas2DCurtainRenderer';

// One radius for every surface in the visualiser. The three files used to
// disagree (0 here, 12px on the homepage wrapper, 4px on the thumbnails),
// which is what made the panel read as assembled rather than designed.

/** Caps how tall the media box can get. Width is capped instead of height so
 * the photo's aspect ratio is never violated — see the root style. */
const MAX_MEDIA_VH = 72;

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
}: {
  variant?: ButtonVariant;
  onClick: () => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
  ariaLabel?: string;
}) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const fill = VARIANT_FILL[variant];
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => { setHover(false); setPressed(false); }}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      style={{
        ...buttonBase,
        ...fill,
        boxShadow: pressed ? PRESSED_SHADOW : hover ? RAISED_SHADOW_HOVER : RAISED_SHADOW,
        transform: pressed ? 'translateY(1px)' : 'translateY(0)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// --- Manual: the bead chain ------------------------------------------------
// A roller blind is operated by a continuous loop of beaded chain hanging off
// the end of the tube. So that is what this draws, and dragging it is how the
// blind moves — the control IS the thing it controls, rather than a slider
// standing in for one.
//
// It replaced a groove-and-thumb slider in a floating charcoal housing. That
// worked and read as a piece of UI parked over the photograph: the one object
// in the frame that could not exist in the room. A chain hanging from the top
// right of the window is the object that is genuinely there.
//
// THE LOOP RUNS, and this is the detail that sells it. Drag down and the near
// strand's beads travel down while the far strand's travel UP, because a
// continuous loop over a pulley can do nothing else. Both strands scroll at
// exactly the drag distance, so the chain stays under your finger instead of
// sliding against it.
//
// SEAMLESS BY MODULO, not by a long strip. Beads are drawn from a phase offset
// wrapped into a single pitch, so the same nine circles are reused forever and
// the chain can be dragged indefinitely without the geometry growing.
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
/** Drag distance, in pixels, that takes the blind from fully open to fully
 * shut. Matched to CHAIN_H so a drag down the length of the visible chain is
 * very nearly the full travel: the gesture is the size of the object. */
const CHAIN_TRAVEL = 190;

const CHAIN_TOP = 16;
const CHAIN_W = STRAND_GAP + BEAD_R * 4 + 8;

/** Bead centres for one strand, phase-shifted by `offset` and wrapped into a
 * single pitch so a finite number of circles tiles an endless chain. */
function beadYs(offset: number, run: number): number[] {
  const phase = ((offset % BEAD_PITCH) + BEAD_PITCH) % BEAD_PITCH;
  const out: number[] = [];
  for (let y = CHAIN_TOP - BEAD_PITCH + phase; y < CHAIN_TOP + run; y += BEAD_PITCH) {
    if (y >= CHAIN_TOP - BEAD_R && y <= CHAIN_TOP + run + BEAD_R) out.push(y);
  }
  return out;
}

function BeadChain({
  value,
  onChange,
  run = CHAIN_H_FALLBACK,
}: {
  value: number;
  onChange: (v: number) => void;
  /** Visible length of chain, in CSS pixels. Sized to the blind's drop by the
   * caller so the chain stays in proportion to the window it hangs on. */
  run?: number;
}) {
  const [dragging, setDragging] = useState(false);
  const [hover, setHover] = useState(false);
  // Where the drag began, and the position it began from. Deltas are measured
  // against these rather than accumulated frame to frame, so a fast drag cannot
  // drift away from the pointer.
  const originRef = useRef({ y: 0, value: 0 });

  const clamp = (v: number) => Math.max(0, Math.min(1, v));
  const pct = clamp(value);

  // Down the chain shuts the blind, up opens it — the same sense as the roll
  // itself, where 0 is open at the top and 1 is shut at the bottom.
  const travel = pct * CHAIN_TRAVEL;
  const leftYs = beadYs(travel, run);
  const rightYs = beadYs(-travel, run);

  const xLeft = CHAIN_W / 2 - STRAND_GAP / 2;
  const xRight = CHAIN_W / 2 + STRAND_GAP / 2;

  return (
    <div
      role="slider"
      aria-label="Blind position — drag the chain"
      aria-orientation="vertical"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct * 100)}
      aria-valuetext={`${Math.round(pct * 100)}% closed`}
      tabIndex={0}
      onPointerDown={e => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        originRef.current = { y: e.clientY, value: pct };
        setDragging(true);
      }}
      onPointerMove={e => {
        if (!dragging) return;
        const dy = e.clientY - originRef.current.y;
        onChange(clamp(originRef.current.value + dy / CHAIN_TRAVEL));
      }}
      onPointerUp={e => {
        setDragging(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      }}
      onPointerCancel={() => setDragging(false)}
      onPointerEnter={() => setHover(true)}
      onPointerLeave={() => setHover(false)}
      onKeyDown={e => {
        const step = e.shiftKey ? 0.1 : 0.02;
        if (e.key === 'ArrowUp') { e.preventDefault(); onChange(clamp(value - step)); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); onChange(clamp(value + step)); }
        else if (e.key === 'Home') { e.preventDefault(); onChange(0); }
        else if (e.key === 'End') { e.preventDefault(); onChange(1); }
      }}
      style={{
        // Generous hit area around a chain that is only ~24px of actual metal:
        // the visible object stays thin and delicate, the target stays usable.
        padding: `0 ${space.sm}px`,
        cursor: dragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        lineHeight: 0,
        // The chain is thin, light metal and lands on whatever the photograph
        // happens to be. The drop shadow is what guarantees it separates from a
        // pale wall; it deepens on hover so the object acknowledges the pointer.
        filter: dragging || hover
          ? 'drop-shadow(0 3px 7px rgba(0,0,0,0.6))'
          : 'drop-shadow(0 2px 4px rgba(0,0,0,0.45))',
        transition: 'filter 0.18s ease',
      }}
    >
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

        {leftYs.map(y => (
          <circle key={`l${y}`} cx={xLeft} cy={y} r={BEAD_R} fill="url(#klay-bead)" stroke="rgba(0,0,0,0.22)" strokeWidth={0.4} />
        ))}
        {rightYs.map(y => (
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
    </div>
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

const PRESET_ROOMS = ['/images/room-3.png', '/images/room-4.png', '/images/room-5.png'];

// Loaded automatically on mount so the visualiser never shows an empty
// upload prompt by default — the blind renders immediately against this
// photo using a fixed set of corner pins (see DEFAULT_WINDOW_CORNERS_PCT),
// with no CornerPinOverlay involved at all until the user replaces it.
const DEFAULT_WINDOW_URL = '/images/Preview.png';
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
      loadFromUrl(DEFAULT_WINDOW_URL);
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
    if (
      store.defaultWindowActive &&
      !hasSeededDefaultRef.current &&
      photoBitmap &&
      hookPhotoUrl === DEFAULT_WINDOW_URL &&
      useVisualiserStore.getState().tracedAreas.length === 0
    ) {
      const corners: Point[] = DEFAULT_WINDOW_CORNERS_PCT.map(([px, py]) => [
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoBitmap, hookPhotoUrl, store.defaultWindowActive, store.tracedAreas.length]);

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
      <Button variant="accent" onClick={() => setShowUploadPrompt(true)}>
        Visualise in your own room
      </Button>
    ) : (
      <>
        <Button onClick={() => {
          clear();
          store.setPhotoUrl(null);
          store.clearTracedAreas();
          store.setDefaultWindowActive(true);
          hasSeededDefaultRef.current = false;
          loadFromUrl(DEFAULT_WINDOW_URL);
        }}>Back to preview</Button>
        <Button onClick={() => store.clearTracedAreas()}>Retrace</Button>
        <Button variant="primary" onClick={handleDownload}>Download</Button>
      </>
    )
  ) : null;

  // WHERE THE CHAIN HANGS, and it is not a styling detail — it is the whole
  // difference between the chain reading as part of the room and reading as a
  // widget. Pinned to the right edge of the PHOTOGRAPH it hangs in mid-air
  // beside the window, attached to nothing, which is what the first version of
  // this did. It has to hang off the tube, so it is positioned from the blind's
  // own top-right corner.
  //
  // The corners are in photo-pixel space and the box is a percentage of the
  // viewport, so the conversion goes through the photo's dimensions: a fraction
  // of the bitmap is a fraction of the box, whatever size the box is today.
  //
  // LENGTH FOLLOWS THE DROP. A real chain is a bit over half the height of the
  // blind it hangs on; clamped at both ends so a very small traced window still
  // gets a chain you can grab, and a very tall one does not get a chain running
  // off the bottom of the frame.
  const chainAnchor = (() => {
    if (!confirmedArea || !photoBitmap || !mediaBoxH) return null;
    const topRight = confirmedArea.corners[1];
    const bottomRight = confirmedArea.corners[2];
    if (!topRight || !bottomRight) return null;
    const dropPx = ((bottomRight[1] - topRight[1]) / photoBitmap.height) * mediaBoxH;
    return {
      leftPct: (topRight[0] / photoBitmap.width) * 100,
      topPct: (topRight[1] / photoBitmap.height) * 100,
      run: Math.max(70, Math.min(240, dropPx * 0.62)),
    };
  })();

  // Each operation gets the object it is actually sold with: a chain for
  // manual, a handset for motorised. Both are hardware in the room rather than
  // UI over the top of it, which is the point — the visualiser sells what the
  // window will look like, and the thing you touch is part of that.
  //
  // They mount differently because they ARE different things. The chain belongs
  // to the blind and is placed against it. The handset is held, so it sits off
  // to the side of the frame where a hand would be, unattached to anything.
  const sideControl = !showRenderState ? null : activeOperation === 'motorised' ? (
    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 20 }}>
      <MotorRemote
        autoRunning={autoRunning}
        transmitting={motorRunning}
        onOpen={() => { stopAuto(); runMotor(0); }}
        onShut={() => { stopAuto(); runMotor(1); }}
        onStop={() => { stopAuto(); setMotorRunning(false); }}
        onToggleAuto={() => (autoRunning ? stopAuto() : startAuto())}
      />
    </div>
  ) : chainAnchor ? (
    <div
      style={{
        position: 'absolute',
        left: `${chainAnchor.leftPct}%`,
        top: `${chainAnchor.topPct}%`,
        // Back up by half the chain's width so the strands straddle the edge of
        // the tube rather than starting at it, and up by the mount's height so
        // the bracket sits ON the tube instead of below it.
        transform: `translate(-${CHAIN_W / 2}px, -${CHAIN_TOP}px)`,
        zIndex: 20,
      }}
    >
      <BeadChain
        value={store.rollPosition}
        onChange={v => store.setRollPosition(v)}
        run={chainAnchor.run}
      />
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
              {PRESET_ROOMS.map(url => (
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
          <CornerPinOverlay
            ref={overlayRef}
            imageWidth={photoBitmap!.width}
            imageHeight={photoBitmap!.height}
            onConfirm={handleConfirmTrace}
          />
          {/* Confirm / Change photo live in the footer — see footerButtons. */}
        </div>
      ) : (
        /* STATE 3 — area traced and confirmed */
        <div ref={rendererContainerRef} style={{ position: 'absolute', inset: 0 }}>
          {store.productCategory === 'curtain' && confirmedArea ? (
            <Canvas2DCurtainRenderer
              tl={{ x: confirmedArea.corners[0][0], y: confirmedArea.corners[0][1] }}
              tr={{ x: confirmedArea.corners[1][0], y: confirmedArea.corners[1][1] }}
              br={{ x: confirmedArea.corners[2][0], y: confirmedArea.corners[2][1] }}
              bl={{ x: confirmedArea.corners[3][0], y: confirmedArea.corners[3][1] }}
              fabricType={store.curtainType}
              hardwareColour={store.hardwareColour}
              mount={store.curtainMount}
              colour={store.getFabricColor()}
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
