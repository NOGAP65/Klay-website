import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { isValidWindowQuad, windowPlane } from './homography';

export type Point = [number, number];

export interface CornerPinOverlayHandle {
  confirm: () => void;
}

interface CornerPinOverlayProps {
  imageWidth: number;
  imageHeight: number;
  onConfirm: (corners: Point[]) => void;
  /** Where to open the pins, as fractions of the image, TL TR BR BL.
   *
   * For a photograph whose subject is known — the supplied alcove shots, which
   * carry their opening's dimension in the frame — this puts the trace on the
   * opening from the start. Omitted for an uploaded photo, where nothing is
   * known and the generic box is the honest default. */
  initialCornersPct?: Point[];
}

const DEFAULT_CORNERS_PCT: Point[] = [
  [0.1, 0.1],
  [0.9, 0.1],
  [0.9, 0.9],
  [0.1, 0.9],
];

const TEAL = '#4ABFB5';

// Corner order is [tl, tr, br, bl]. Each midpoint sits between the two
// corners listed. Edge handles follow the pointer in both directions so an
// angled opening can be resized without snapping to the photo's axes.
type MidpointId = 'top' | 'bottom' | 'left' | 'right';

const MIDPOINTS: { id: MidpointId; indices: [number, number]; cursor: string }[] = [
  { id: 'top', indices: [0, 1], cursor: 'move' },
  { id: 'right', indices: [1, 2], cursor: 'move' },
  { id: 'bottom', indices: [3, 2], cursor: 'move' },
  { id: 'left', indices: [0, 3], cursor: 'move' },
];

// Handles render at a fixed on-screen size regardless of image resolution
// (rather than scaling with image dimensions), so they don't dwarf a small
// traced window or vanish on a huge photo.
//
// Corner handles are crosshairs — a big transparent hit circle underneath a
// small precise white crosshair + teal centre dot, like a camera/scope reticle.
//
// TWO SETS, AND THE POINTER PICKS. One set of sizes was serving a mouse and a
// thumb, and it was drawn for the mouse: a 16px corner radius is a 32px target
// and a midpoint's 8px is a 16px one, against the 44px both Apple and Android
// publish as the minimum a finger can reliably hit. On a phone the pins were
// fiddly to grab and the reticle was too fine to see what it was sitting on,
// which is the same complaint twice — the handle is both the target and the
// only indication of where the corner IS.
//
// The coarse set clears 44px on both handles and grows the drawn glyph with the
// target, because a big invisible circle under a small crosshair tells the
// finger nothing about where it may press.
//
// ASKED AS `pointer: coarse`, NOT AS A WIDTH. The question is whether a finger
// is doing the dragging, and that is not the same question as how wide the
// screen is: a touch laptop and a tablet both need the big handles at desktop
// widths, and a phone browser in desktop-site mode still has a thumb on it.
const HANDLE_PX = {
  fine: {
    cornerHitRadius: 16,
    crosshairLineLength: 20,
    crosshairStroke: 2,
    crosshairShadowStroke: 3,
    crosshairShadowOffset: 1,
    crosshairCenterRadius: 4,
    crosshairCenterStroke: 1.5,
    // Midpoint diamonds keep their small visual size but get a bigger
    // invisible hit circle, same idea as the corner crosshairs.
    midpointHitRadius: 8,
    midpointDiamond: 10,
    midpointDiamondStroke: 1.5,
  },
  coarse: {
    // 48px across, so it clears the 44px floor with a little to spare.
    cornerHitRadius: 24,
    crosshairLineLength: 30,
    crosshairStroke: 2.5,
    crosshairShadowStroke: 3.75,
    crosshairShadowOffset: 1.25,
    crosshairCenterRadius: 6,
    crosshairCenterStroke: 2,
    // 40px, deliberately a shade under the corner's 48. The two hit circles
    // start overlapping once a traced side is shorter than their radii
    // combined, and where they do the midpoint wins — it is painted second.
    // Keeping it smaller means a corner stays grabbable further down, and the
    // crossover is a side of about 88px against the fine set's 48px.
    midpointHitRadius: 20,
    midpointDiamond: 15,
    midpointDiamondStroke: 2,
  },
} as const;

const CornerPinOverlay = forwardRef<CornerPinOverlayHandle, CornerPinOverlayProps>(
  ({ imageWidth, imageHeight, onConfirm, initialCornersPct }, ref) => {
    // A CALLER MAY SAY WHERE TO START. The supplied wardrobe photographs were
    // shot with the opening dimensioned, so where the alcove is and how wide it
    // is are both known — the pins can open on it rather than on a generic box
    // the customer then has to drag onto the opening.
    //
    // The fallback stays 10%..90% for an uploaded photo, where nothing is known
    // about the room and a box in the middle of the frame is the honest start.
    const [corners, setCorners] = useState<Point[]>(() =>
      (initialCornersPct ?? DEFAULT_CORNERS_PCT).map(
        ([px, py]) => [px * imageWidth, py * imageHeight] as Point,
      )
    );
    const activeIndex = useRef<number | null>(null);
    const activeMidpoint = useRef<MidpointId | null>(null);
    const lastMidpointPoint = useRef<Point | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    // WHICH HANDLE SET TO DRAW — see HANDLE_PX.
    //
    // Subscribed here rather than through the shared useMediaQuery hook: no
    // file in this feature imports @/shared, the scope guard is what keeps that
    // true, and this is one media query. It mirrors the ResizeObserver below it,
    // which watches for the same reason — a rendered size this component cannot
    // be told about.
    const [isCoarsePointer, setCoarsePointer] = useState(
      () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
    );
    useEffect(() => {
      const query = window.matchMedia('(pointer: coarse)');
      const update = () => setCoarsePointer(query.matches);
      update();
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }, []);
    const handlePx = HANDLE_PX[isCoarsePointer ? 'coarse' : 'fine'];

    // Tracks the SVG's actual rendered CSS size so a "12px" handle can be
    // converted into the right size in viewBox (image-pixel) units.
    const [renderedWidth, setRenderedWidth] = useState<number>(imageWidth);
    useEffect(() => {
      const svg = svgRef.current;
      if (!svg) return;
      const update = () => {
        const w = svg.getBoundingClientRect().width;
        if (w > 0) setRenderedWidth(w);
      };
      update();
      const ro = new ResizeObserver(update);
      ro.observe(svg);
      return () => ro.disconnect();
    }, []);

    const updateCorners = useCallback((update: (prev: Point[]) => Point[]) => {
      setCorners(prev => {
        const next = update(prev).map(([x, y]): Point => [
          Math.max(0, Math.min(imageWidth, x)), Math.max(0, Math.min(imageHeight, y)),
        ]);
        return isValidWindowQuad(next, Math.min(imageWidth, imageHeight) * 0.015) ? next : prev;
      });
    }, [imageWidth, imageHeight]);

    useImperativeHandle(ref, () => ({
      confirm: () => { if (isValidWindowQuad(corners)) onConfirm(corners); },
    }), [corners, onConfirm]);

    const toImagePoint = useCallback(
      (clientX: number, clientY: number): Point => {
        const svg = svgRef.current;
        if (!svg) return [0, 0];
        const rect = svg.getBoundingClientRect();
        const x = ((clientX - rect.left) / rect.width) * imageWidth;
        const y = ((clientY - rect.top) / rect.height) * imageHeight;
        return [
          Math.min(Math.max(x, 0), imageWidth),
          Math.min(Math.max(y, 0), imageHeight),
        ];
      },
      [imageWidth, imageHeight]
    );

    const handlePinPointerDown = useCallback((index: number) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      activeIndex.current = index;
    }, []);

    const handleMidpointPointerDown = useCallback((id: MidpointId) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      activeMidpoint.current = id;
      lastMidpointPoint.current = toImagePoint(e.clientX, e.clientY);
    }, [toImagePoint]);

    const handleSvgPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
      if (activeIndex.current !== null) {
        const point = toImagePoint(e.clientX, e.clientY);
        const index = activeIndex.current;
        updateCorners(prev => prev.map((c, i) => (i === index ? point : c)));
        return;
      }
      if (activeMidpoint.current !== null && lastMidpointPoint.current) {
        const point = toImagePoint(e.clientX, e.clientY);
        const last = lastMidpointPoint.current;
        const dx = point[0] - last[0];
        const dy = point[1] - last[1];
        const config = MIDPOINTS.find(m => m.id === activeMidpoint.current)!;
        const [i, j] = config.indices;
        updateCorners(prev => prev.map((c, idx) =>
          idx !== i && idx !== j ? c : [c[0] + dx, c[1] + dy]
        ));
        lastMidpointPoint.current = point;
      }
    }, [toImagePoint, updateCorners]);

    const handlePointerUp = useCallback(() => {
      activeIndex.current = null;
      activeMidpoint.current = null;
      lastMidpointPoint.current = null;
    }, []);

    // Touch fallbacks mirroring the pointer handlers. Page scrolling during a
    // trace is blocked by `touch-action: none` on the svg and pins (React
    // registers touch listeners as passive, so preventDefault() is a no-op
    // there — the CSS property is the reliable mechanism).
    const handlePinTouchStart = useCallback((index: number) => (e: React.TouchEvent) => {
      e.stopPropagation();
      activeIndex.current = index;
    }, []);

    const handleMidpointTouchStart = useCallback((id: MidpointId) => (e: React.TouchEvent) => {
      e.stopPropagation();
      const touch = e.touches[0];
      activeMidpoint.current = id;
      lastMidpointPoint.current = touch ? toImagePoint(touch.clientX, touch.clientY) : null;
    }, [toImagePoint]);

    const handleSvgTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (activeIndex.current !== null) {
        const point = toImagePoint(touch.clientX, touch.clientY);
        const index = activeIndex.current;
        updateCorners(prev => prev.map((c, i) => (i === index ? point : c)));
        return;
      }
      if (activeMidpoint.current !== null && lastMidpointPoint.current) {
        const point = toImagePoint(touch.clientX, touch.clientY);
        const last = lastMidpointPoint.current;
        const dx = point[0] - last[0];
        const dy = point[1] - last[1];
        const config = MIDPOINTS.find(m => m.id === activeMidpoint.current)!;
        const [i, j] = config.indices;
        updateCorners(prev => prev.map((c, idx) =>
          idx !== i && idx !== j ? c : [c[0] + dx, c[1] + dy]
        ));
        lastMidpointPoint.current = point;
      }
    }, [toImagePoint, updateCorners]);

    const polygonPoints = corners.map(([x, y]) => `${x},${y}`).join(' ');
    const plane = windowPlane(corners);
    const guides = [1 / 3, 2 / 3].flatMap(t => [
      [plane(t, 0), plane(t, 1)], [plane(0, t), plane(1, t)],
    ]);

    // Convert the desired fixed CSS pixel sizes into viewBox (image pixel)
    // units using the SVG's actual rendered width, so handles stay a
    // constant on-screen size regardless of the photo's resolution.
    const scale = renderedWidth > 0 ? imageWidth / renderedWidth : 1;
    const cornerHitRadius = handlePx.cornerHitRadius * scale;
    const crosshairHalfLength = (handlePx.crosshairLineLength * scale) / 2;
    const crosshairStroke = handlePx.crosshairStroke * scale;
    const crosshairShadowStroke = handlePx.crosshairShadowStroke * scale;
    const crosshairShadowOffset = handlePx.crosshairShadowOffset * scale;
    const crosshairCenterRadius = handlePx.crosshairCenterRadius * scale;
    const crosshairCenterStroke = handlePx.crosshairCenterStroke * scale;
    const midpointHitRadius = handlePx.midpointHitRadius * scale;
    const midpointSide = handlePx.midpointDiamond * scale;
    const midpointStroke = handlePx.midpointDiamondStroke * scale;
    const midpoints = MIDPOINTS.map(m => {
      const [i, j] = m.indices;
      const [x1, y1] = corners[i];
      const [x2, y2] = corners[j];
      return { ...m, x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
    });

    return (
      <div style={{ position: 'absolute', inset: 0 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${imageWidth} ${imageHeight}`}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none' }}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onTouchMove={handleSvgTouchMove}
          onTouchEnd={handlePointerUp}
          onTouchCancel={handlePointerUp}
        >
          <polygon
            points={polygonPoints}
            fill="rgba(74,191,181,0.15)"
            stroke={TEAL}
            strokeWidth={Math.max(imageWidth, imageHeight) * 0.004}
          />
          {guides.map(([a, b], i) => (
            <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}
              stroke="rgba(255,255,255,0.6)" strokeWidth={scale}
              strokeDasharray={`${4 * scale} ${5 * scale}`} pointerEvents="none" />
          ))}
          {corners.map(([x, y], i) => (
            <g key={i}>
              {/* Shadow crosshair, offset slightly, drawn first (underneath) */}
              <line
                x1={x - crosshairHalfLength + crosshairShadowOffset}
                y1={y + crosshairShadowOffset}
                x2={x + crosshairHalfLength + crosshairShadowOffset}
                y2={y + crosshairShadowOffset}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={crosshairShadowStroke}
                style={{ pointerEvents: 'none' }}
              />
              <line
                x1={x + crosshairShadowOffset}
                y1={y - crosshairHalfLength + crosshairShadowOffset}
                x2={x + crosshairShadowOffset}
                y2={y + crosshairHalfLength + crosshairShadowOffset}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={crosshairShadowStroke}
                style={{ pointerEvents: 'none' }}
              />
              {/* White crosshair on top */}
              <line
                x1={x - crosshairHalfLength}
                y1={y}
                x2={x + crosshairHalfLength}
                y2={y}
                stroke="#FFFFFF"
                strokeWidth={crosshairStroke}
                style={{ pointerEvents: 'none' }}
              />
              <line
                x1={x}
                y1={y - crosshairHalfLength}
                x2={x}
                y2={y + crosshairHalfLength}
                stroke="#FFFFFF"
                strokeWidth={crosshairStroke}
                style={{ pointerEvents: 'none' }}
              />
              {/* Teal centre dot */}
              <circle
                cx={x}
                cy={y}
                r={crosshairCenterRadius}
                fill={TEAL}
                stroke="#FFFFFF"
                strokeWidth={crosshairCenterStroke}
                style={{ pointerEvents: 'none' }}
              />
              {/* Invisible hit area — the only element that actually
                  receives pointer/touch events for this corner */}
              <circle
                cx={x}
                cy={y}
                r={cornerHitRadius}
                fill="transparent"
                stroke="none"
                onPointerDown={handlePinPointerDown(i)}
                onTouchStart={handlePinTouchStart(i)}
                role="button"
                tabIndex={0}
                aria-label={`Adjust ${['top left', 'top right', 'bottom right', 'bottom left'][i]} corner`}
                onKeyDown={e => {
                  const delta = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
                  if (!delta) return;
                  e.preventDefault();
                  const step = scale * (e.shiftKey ? 10 : 1);
                  updateCorners(prev => prev.map((c, j) => j === i ? [c[0] + delta[0] * step, c[1] + delta[1] * step] : c));
                }}
                style={{ cursor: 'crosshair', touchAction: 'none' }}
              />
            </g>
          ))}
          {midpoints.map(m => (
            <g key={m.id}>
              <rect
                x={m.x - midpointSide / 2}
                y={m.y - midpointSide / 2}
                width={midpointSide}
                height={midpointSide}
                transform={`rotate(45 ${m.x} ${m.y})`}
                fill="#FFFFFF"
                stroke={TEAL}
                strokeWidth={midpointStroke}
                style={{ pointerEvents: 'none' }}
              />
              <circle
                cx={m.x}
                cy={m.y}
                r={midpointHitRadius}
                fill="transparent"
                stroke="none"
                onPointerDown={handleMidpointPointerDown(m.id)}
                onTouchStart={handleMidpointTouchStart(m.id)}
                style={{ cursor: m.cursor, touchAction: 'none' }}
              />
            </g>
          ))}
        </svg>
      </div>
    );
  }
);

CornerPinOverlay.displayName = 'CornerPinOverlay';

export default CornerPinOverlay;
