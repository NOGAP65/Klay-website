import { useEffect, useRef, useState } from 'react';
import { tokens } from '../theme';
import { useVisualiserStore, BlindType } from './useVisualiserStore';
import { usePhotoUpload } from './usePhotoUpload';
import CornerPinOverlay, { CornerPinOverlayHandle, Point } from './CornerPinOverlay';
import Canvas2DBlindRenderer, { RenderedArea } from './Canvas2DBlindRenderer';

// One radius for every surface in the visualiser. The three files used to
// disagree (0 here, 12px on the homepage wrapper, 4px on the thumbnails),
// which is what made the panel read as assembled rather than designed.
const RADIUS = 2;

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
  fontFamily: tokens.body,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  height: 38,
  padding: '0 20px',
  borderRadius: RADIUS,
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
    background: `linear-gradient(180deg, ${tokens.goldLight} 0%, ${tokens.gold} 52%, ${tokens.goldDeep} 100%)`,
    color: tokens.ink,
    border: `1px solid ${tokens.goldDeep}`,
  },
  ghost: {
    background: 'linear-gradient(180deg, rgba(245,242,237,0.14) 0%, rgba(245,242,237,0.05) 100%)',
    color: tokens.onDark,
    border: `1px solid ${tokens.onDarkLine}`,
  },
  accent: {
    background: 'linear-gradient(180deg, rgba(200,151,58,0.22) 0%, rgba(200,151,58,0.08) 100%)',
    color: tokens.gold,
    border: `1px solid ${tokens.goldLine}`,
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

const controlLabelStyle: React.CSSProperties = {
  fontFamily: tokens.body,
  fontSize: 8.5,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: tokens.onDarkMuted,
  userSelect: 'none',
};

// --- Roll slider -----------------------------------------------------------
// Hand-built rather than an <input type="range">: styling a range thumb
// needs ::-webkit-slider-thumb, which inline styles can't reach, and the
// vertical variant previously relied on writingMode:'vertical-lr' (unreliable
// in Safari). Pointer capture makes the drag survive leaving the track.
// Top of the track is open, bottom is closed — the way the blind moves.

function RollSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  const applyFromY = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.height <= 0) return;
    onChange(Math.max(0, Math.min(1, (clientY - r.top) / r.height)));
  };

  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 9,
        padding: '12px 9px',
        borderRadius: RADIUS,
        background: 'linear-gradient(180deg, rgba(44,40,36,0.92) 0%, rgba(28,24,16,0.92) 100%)',
        border: `1px solid ${tokens.onDarkLine}`,
        boxShadow: RAISED_SHADOW,
        backdropFilter: 'blur(6px)',
      }}
    >
      <span style={controlLabelStyle}>Open</span>
      <div
        ref={trackRef}
        role="slider"
        aria-label="Blind position"
        aria-orientation="vertical"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        tabIndex={0}
        onPointerDown={e => {
          e.preventDefault();
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          applyFromY(e.clientY);
        }}
        onPointerMove={e => { if (dragging) applyFromY(e.clientY); }}
        onPointerUp={e => {
          setDragging(false);
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={e => {
          const step = e.shiftKey ? 0.1 : 0.02;
          if (e.key === 'ArrowUp') { e.preventDefault(); onChange(Math.max(0, value - step)); }
          else if (e.key === 'ArrowDown') { e.preventDefault(); onChange(Math.min(1, value + step)); }
          else if (e.key === 'Home') { e.preventDefault(); onChange(0); }
          else if (e.key === 'End') { e.preventDefault(); onChange(1); }
        }}
        style={{
          position: 'relative',
          width: 12,
          height: 148,
          borderRadius: 999,
          cursor: 'pointer',
          // Groove: dark inside with a lit lower lip, so it reads as cut in.
          background: 'rgba(0,0,0,0.5)',
          boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.1)',
          touchAction: 'none',
        }}
      >
        {/* Travelled portion, filling from the top down */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `${pct}%`,
            borderRadius: 999,
            background: `linear-gradient(180deg, ${tokens.goldDeep} 0%, ${tokens.gold} 100%)`,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: 'absolute',
            top: `${pct}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 24,
            height: 15,
            borderRadius: 3,
            background: `linear-gradient(180deg, ${tokens.goldLight} 0%, ${tokens.gold} 55%, ${tokens.goldDeep} 100%)`,
            border: `1px solid ${tokens.goldDeep}`,
            boxShadow: dragging ? PRESSED_SHADOW : RAISED_SHADOW,
            pointerEvents: 'none',
          }}
        />
      </div>
      <span style={controlLabelStyle}>Shut</span>
    </div>
  );
}

const PRESET_ROOMS = ['/images/room-3.png', '/images/room-4.png', '/images/room-5.png'];

// Loaded automatically on mount so the visualiser never shows an empty
// upload prompt by default — the blind renders immediately against this
// photo using a fixed set of corner pins (see DEFAULT_WINDOW_CORNERS_PCT),
// with no CornerPinOverlay involved at all until the user replaces it.
const DEFAULT_WINDOW_URL = '/images/Preview.png';
// Face-mounted (outside mount) on the double window in Preview.png
// (1254 x 1254) — how a roller blind is actually hung: the fabric overlaps
// the frame rather than sitting inside the glass.
//
// These pins are paired to this photo and only this photo. On a 1254px square
// they resolve to x 220..751, y 220..833, which lands between the glass
// (x 235..727, y 255..817) and the outer edge of the white frame
// (x 205..757, y 213..877) — i.e. on the frame band, as a face mount should.
// Swapping DEFAULT_WINDOW_URL without re-measuring will hang the blind off
// its window.
const DEFAULT_WINDOW_CORNERS_PCT: [number, number][] = [
  [0.1754, 0.1754], // top-left     — x 220/1254, y 220/1254
  [0.5989, 0.1754], // top-right    — x 751/1254
  [0.5989, 0.6643], // bottom-right — y 833/1254
  [0.1754, 0.6643], // bottom-left
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
  useEffect(() => {
    if (
      store.defaultWindowActive &&
      !hasSeededDefaultRef.current &&
      photoBitmap &&
      hookPhotoUrl === DEFAULT_WINDOW_URL &&
      store.tracedAreas.length === 0
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
  }, [photoBitmap, hookPhotoUrl, store.defaultWindowActive]);

  const hasPhoto = !!(store.photoUrl && photoBitmap);
  const confirmedArea = store.tracedAreas.find(a => a.confirmed);
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

  const stopAuto = () => {
    autoRunningRef.current = false;
    setAutoRunning(false);
    cancelRollAnimation();
  };

  const startAuto = () => {
    autoRunningRef.current = true;
    setAutoRunning(true);
    const cycle = () => {
      if (!autoRunningRef.current) return;
      animateRollTo(0, 1500, () => {
        if (!autoRunningRef.current) return;
        autoTimeoutRef.current = window.setTimeout(() => {
          if (!autoRunningRef.current) return;
          animateRollTo(1, 1500, () => {
            if (!autoRunningRef.current) return;
            autoTimeoutRef.current = window.setTimeout(cycle, 600);
          });
        }, 600);
      });
    };
    cycle();
  };

  useEffect(() => {
    if (store.operation !== 'motorised') stopAuto();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.operation]);

  useEffect(() => () => stopAuto(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const canvasTracedAreas: RenderedArea[] = store.tracedAreas.map(a => ({
    ...a,
    blindType: store.blindType,
    fabricColor: store.getFabricColor(),
    hardwareColor: store.getHardwareColor(),
    hardwareColourName: store.hardwareColour,
    controlType: store.operation,
    showChain: false,
  }));

  // The three canvas states, resolved once so the canvas area and the
  // persistent footer below it can never disagree about which one is showing.
  const showUploadState = !isLoadingDefault && (!hasPhoto || showUploadPrompt);
  const showTraceState = !isLoadingDefault && !showUploadState && !confirmedArea;
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
        <Button onClick={() => store.clearTracedAreas()}>Retrace</Button>
        <Button onClick={handleChangePhoto}>Change photo</Button>
        <Button variant="primary" onClick={handleDownload}>Download</Button>
      </>
    )
  ) : null;

  // Roll control, on the right edge of the render. Manual gets the slider;
  // motorised gets the three motor actions in the same raised housing, so
  // both modes read as one physical control rather than two layouts.
  const sideControl = !showRenderState ? null : store.operation === 'motorised' ? (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 10px',
        borderRadius: RADIUS,
        background: 'linear-gradient(180deg, rgba(44,40,36,0.92) 0%, rgba(28,24,16,0.92) 100%)',
        border: `1px solid ${tokens.onDarkLine}`,
        boxShadow: RAISED_SHADOW,
        backdropFilter: 'blur(6px)',
      }}
    >
      <span style={{ ...controlLabelStyle, textAlign: 'center' }}>Motor</span>
      <Button onClick={() => { stopAuto(); animateRollTo(0, 1200); }} style={{ height: 32, padding: '0 12px' }}>
        Open
      </Button>
      <Button onClick={() => { stopAuto(); animateRollTo(1, 1200); }} style={{ height: 32, padding: '0 12px' }}>
        Shut
      </Button>
      <Button
        variant={autoRunning ? 'primary' : 'accent'}
        onClick={() => (autoRunning ? stopAuto() : startAuto())}
        style={{ height: 32, padding: '0 12px' }}
      >
        {autoRunning ? 'Stop' : 'Auto'}
      </Button>
    </div>
  ) : (
    <RollSlider value={store.rollPosition} onChange={v => store.setRollPosition(v)} />
  );

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
        borderRadius: RADIUS,
        overflow: 'hidden',
        boxShadow: '0 16px 40px rgba(28,24,16,0.22)',
      }}
    >
      <div style={{ position: 'relative', width: '100%', aspectRatio: String(photoRatio) }}>
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
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            <h2 style={{ fontFamily: tokens.display, fontSize: 28, fontWeight: 300, color: tokens.onDark, margin: 0 }}>
              Upload a photo of your window
            </h2>
            <p style={{ fontFamily: tokens.body, fontSize: 13, color: tokens.onDarkMuted, marginTop: 8 }}>
              or choose a preset room
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'center' }}>
              <Button variant="primary" onClick={handleUpload}>Upload photo</Button>
              <Button onClick={handleTakePhoto}>Take photo</Button>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
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
                    borderRadius: RADIUS,
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
          <Canvas2DBlindRenderer
            photoUrl={store.photoUrl!}
            tracedAreas={canvasTracedAreas}
            activeAreaId={store.activeAreaId ?? undefined}
            rollPosition={store.rollPosition}
          />

          {sideControl && (
            <div
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 20,
              }}
            >
              {sideControl}
            </div>
          )}
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
            gap: 10,
            padding: '13px 18px',
            borderTop: `1px solid ${tokens.onDarkLine}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{footerButtons}</div>
        </div>
      )}
    </div>
  );
}
