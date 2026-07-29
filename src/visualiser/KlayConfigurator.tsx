import { useEffect, useRef, useState } from 'react';
import { tokens } from '../theme';
import { useVisualiserStore } from './useVisualiserStore';
import { usePhotoUpload } from './usePhotoUpload';
import CornerPinOverlay, { CornerPinOverlayHandle, Point } from './CornerPinOverlay';
import Canvas2DBlindRenderer, { RenderedArea } from './Canvas2DBlindRenderer';

// One radius for every surface in the visualiser. The three files used to
// disagree (0 here, 12px on the homepage wrapper, 4px on the thumbnails),
// which is what made the panel read as assembled rather than designed.
const RADIUS = 2;

// --- Buttons ---------------------------------------------------------------
// Every control shares one base: same face, same tracking, same height, same
// radius. Variants change only fill and border, so a row of mixed buttons
// still lines up. Previously there were three unrelated button styles plus
// two more inline on the roll controls.

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
  transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
};

/** Solid gold — the one affirmative action in any given state. */
const primaryButtonStyle: React.CSSProperties = {
  ...buttonBase,
  background: tokens.gold,
  color: tokens.ink,
  border: `1px solid ${tokens.gold}`,
};

/** Outline on the charcoal canvas — secondary actions. */
const ghostButtonStyle: React.CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  color: tokens.onDark,
  border: `1px solid ${tokens.onDarkLine}`,
};

/** Gold outline — the one route out to the user's own photo. */
const accentButtonStyle: React.CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  color: tokens.gold,
  border: `1px solid ${tokens.goldLine}`,
};

/** Square, for the icon-only roll controls. Same height and border language
 * as the text buttons so they sit on one baseline. */
const iconButtonStyle: React.CSSProperties = {
  ...buttonBase,
  width: 34,
  height: 34,
  padding: 0,
  fontSize: 13,
  letterSpacing: 0,
  background: 'transparent',
  color: tokens.onDark,
  border: `1px solid ${tokens.onDarkLine}`,
};

const footerLabelStyle: React.CSSProperties = {
  fontFamily: tokens.body,
  fontSize: 9,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: tokens.onDarkMuted,
};

const PRESET_ROOMS = ['/images/room-3.png', '/images/room-4.png', '/images/room-5.png'];

// Loaded automatically on mount so the visualiser never shows an empty
// upload prompt by default — the blind renders immediately against this
// photo using a fixed set of corner pins (see DEFAULT_WINDOW_CORNERS_PCT),
// with no CornerPinOverlay involved at all until the user replaces it.
const DEFAULT_WINDOW_URL = '/images/static-imafge.png';
// Face-mounted (outside mount) on the window in static-imafge.png
// (1448 x 1086) — how a roller blind is actually hung: the fabric overlaps
// the casing rather than sitting inside the glass, leaving about half the
// casing visible on every side.
//
// Measured off the decoded pixels. Glass runs x 408..1035, y 173..788; the
// casing's outer edge is the contact-shadow dip against the wall at x=348 /
// x=1096, y=103, and the sill nose at y=838. Each blind edge is the midpoint
// of that casing band — a 30px overlap left/right, 35px top, 25px bottom:
//
//   side     glass  casing  blind   band  overlap
//   left       408     348    378     60       30
//   right     1035    1096   1065     61       30
//   top        173     103    138     70       35
//   bottom     788     838    813     50       25
//
// Centre lands on x=721.5 against the casing's own 722, so the blind hangs
// square to the window rather than drifting to one side.
const DEFAULT_WINDOW_CORNERS_PCT: [number, number][] = [
  [0.2610, 0.1271], // top-left     — x 378/1448,  y 138/1086
  [0.7355, 0.1271], // top-right    — x 1065/1448
  [0.7355, 0.7486], // bottom-right — y 813/1086
  [0.2610, 0.7486], // bottom-left
];

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

// Canvas-only: renders the upload / trace / rendered-blind states inside a
// self-contained box. All configurator controls (Range, Hardware, Size,
// Operation, Price, Book Installation) live in the caller's own layout —
// see VisualiserControls — since callers place this box differently
// (VisualiserSection's right column vs VisualiserPage's full-bleed canvas).
export default function KlayConfigurator() {
  const store = useVisualiserStore();
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
      <button onClick={() => setShowUploadPrompt(false)} style={ghostButtonStyle}>
        Cancel
      </button>
    ) : null
  ) : showTraceState ? (
    // In the footer rather than over the image: at bottom:16 these sat on
    // top of the photo and could cover the very corner pins being dragged.
    <>
      <button onClick={handleChangePhoto} style={ghostButtonStyle}>
        Change photo
      </button>
      <button onClick={() => overlayRef.current?.confirm()} style={primaryButtonStyle}>
        Confirm outline
      </button>
    </>
  ) : showRenderState ? (
    store.defaultWindowActive ? (
      <button onClick={() => setShowUploadPrompt(true)} style={accentButtonStyle}>
        Visualise in your own room
      </button>
    ) : (
      <>
        <button onClick={() => store.clearTracedAreas()} style={ghostButtonStyle}>
          Retrace
        </button>
        <button onClick={handleChangePhoto} style={ghostButtonStyle}>
          Change photo
        </button>
        <button onClick={handleDownload} style={primaryButtonStyle}>
          Download
        </button>
      </>
    )
  ) : null;

  // Roll control. Lives in the footer beside the actions rather than floating
  // over the artwork, which also drops the vertical <input type="range"> —
  // writingMode:'vertical-lr' is unreliable in Safari and it was the only
  // control on the page rotated 90 degrees.
  const rollControl = !showRenderState ? null : store.operation === 'motorised' ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={footerLabelStyle}>Motor</span>
      <button onClick={() => { stopAuto(); animateRollTo(0, 1200); }} style={ghostButtonStyle}>
        Open
      </button>
      <button onClick={() => { stopAuto(); animateRollTo(1, 1200); }} style={ghostButtonStyle}>
        Close
      </button>
      <button
        onClick={() => (autoRunning ? stopAuto() : startAuto())}
        style={autoRunning ? primaryButtonStyle : ghostButtonStyle}
      >
        {autoRunning ? 'Stop' : 'Auto'}
      </button>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={footerLabelStyle}>Open</span>
      <button
        onClick={() => store.setRollPosition(Math.max(0, store.rollPosition - 0.1))}
        aria-label="Raise blind"
        style={iconButtonStyle}
      >
        −
      </button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={store.rollPosition}
        onChange={e => store.setRollPosition(parseFloat(e.target.value))}
        aria-label="Blind position"
        style={{ width: 150, accentColor: tokens.gold, cursor: 'pointer' }}
      />
      <button
        onClick={() => store.setRollPosition(Math.min(1, store.rollPosition + 0.1))}
        aria-label="Lower blind"
        style={iconButtonStyle}
      >
        +
      </button>
      <span style={footerLabelStyle}>Closed</span>
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: tokens.charcoal, borderRadius: 0, overflow: 'hidden' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
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
              <button onClick={handleUpload} style={primaryButtonStyle}>
                Upload photo
              </button>
              <button onClick={handleTakePhoto} style={ghostButtonStyle}>
                Take photo
              </button>
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
        /* STATE 2 — photo loaded, not yet traced */
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div
            style={{
              position: 'relative',
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: `${photoBitmap!.width} / ${photoBitmap!.height}`,
            }}
          >
            <img
              src={store.photoUrl!}
              alt="Your room"
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
            />
            <CornerPinOverlay
              ref={overlayRef}
              imageWidth={photoBitmap!.width}
              imageHeight={photoBitmap!.height}
              onConfirm={handleConfirmTrace}
            />
            {/* Confirm / Change photo live in the footer — see footerButtons. */}
          </div>
        </div>
      ) : (
        /* STATE 3 — area traced and confirmed */
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div ref={rendererContainerRef} style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
            <Canvas2DBlindRenderer
              photoUrl={store.photoUrl!}
              tracedAreas={canvasTracedAreas}
              activeAreaId={store.activeAreaId ?? undefined}
              rollPosition={store.rollPosition}
            />

            {/* Nothing floats over the render. The roll control and every
                action live in the footer below — see rollControl /
                footerButtons. */}
          </div>
        </div>
      )}
      </div>

      {(rollControl || footerButtons) && (
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            flexWrap: 'wrap',
            // Two zones when both are present; a single centred group when
            // only the actions are, so a lone button isn't shoved right.
            justifyContent: rollControl ? 'space-between' : 'center',
            alignItems: 'center',
            gap: 16,
            padding: '14px 20px',
            borderTop: `1px solid ${tokens.onDarkLine}`,
          }}
        >
          {/* Left: how the blind sits. Right: what you do next. Empty spans
              keep the two zones anchored when only one of them is present. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{rollControl}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{footerButtons}</div>
        </div>
      )}
    </div>
  );
}
