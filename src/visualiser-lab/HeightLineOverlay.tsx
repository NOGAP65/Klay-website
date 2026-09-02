// ---------------------------------------------------------------------------
// TWO POINTS, NOT FOUR.
//
// The corner pins ask the customer to judge a four-sided box against a
// photograph, and for a wardrobe that is a harder question than the renderer
// needs answered. Height is the only fixed parameter — every unit is 2016 —
// and the width belongs to the product, so the two right-hand pins described
// something the render then ignored. They were the hardest two to place and
// the least use.
//
// So this asks for one edge: the left side of where the wardrobe goes, floor to
// ceiling of the opening. That line is 2016mm by definition, which fixes the
// scale; its position says where the cabinet starts; its tilt says which way is
// up, so a photograph taken with the camera slightly rolled gets a cabinet on
// the same lean as the room. The wardrobe is then drawn to the RIGHT of it at
// its own width — see cornersFromHeightLine.
//
// A PREVIEW OF THE FOOTPRINT IS DRAWN, faintly, so the customer can see what
// the two points imply before committing. Dragging the line is the only
// interaction; the box follows.
// ---------------------------------------------------------------------------

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { cornersFromHeightLine } from './wardrobeGeometry';

export type Point = [number, number];

export interface HeightLineOverlayHandle {
  confirm: () => void;
}

interface HeightLineOverlayProps {
  imageWidth: number;
  imageHeight: number;
  /** The cabinet's own width, so the preview shows what will actually be drawn. */
  widthMm: number;
  onConfirm: (corners: Point[]) => void;
  /** Where to open the line, as fractions of the image: [topX, topY, bottomY].
   * The supplied alcove photographs know their own opening, so the line can
   * start on its left edge rather than in the middle of the frame. */
  initialLinePct?: { x: number; top: number; bottom: number };
}

const TEAL = '#4ABFB5';

/** A line down the middle-left of the frame, for a photograph nothing is known
 * about. Tall enough to read as "this is the height", short of the edges so
 * both handles are grabbable. */
const DEFAULT_LINE = { x: 0.33, top: 0.18, bottom: 0.86 };

const HIT_RADIUS_PX = 22;
const CROSSHAIR_LEN_PX = 22;
const CROSSHAIR_STROKE_PX = 2;
const LINE_STROKE_PX = 2.5;

const HeightLineOverlay = forwardRef<HeightLineOverlayHandle, HeightLineOverlayProps>(
  ({ imageWidth, imageHeight, widthMm, onConfirm, initialLinePct }, ref) => {
    const start = initialLinePct ?? DEFAULT_LINE;
    const [top, setTop] = useState<Point>(() => [start.x * imageWidth, start.top * imageHeight]);
    const [bottom, setBottom] = useState<Point>(() => [start.x * imageWidth, start.bottom * imageHeight]);

    const dragging = useRef<'top' | 'bottom' | 'line' | null>(null);
    const lastPoint = useRef<Point | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

    // The SVG's rendered size, so a handle specified in screen pixels comes out
    // the right size in viewBox units whatever the photograph's resolution is.
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
    const px = (n: number) => (n * imageWidth) / Math.max(1, renderedWidth);

    const corners = cornersFromHeightLine(top, bottom, widthMm);

    useImperativeHandle(ref, () => ({
      confirm: () => onConfirm(corners),
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
      [imageWidth, imageHeight],
    );

    const down = (what: 'top' | 'bottom' | 'line') => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragging.current = what;
      lastPoint.current = toImagePoint(e.clientX, e.clientY);
    };

    const move = useCallback(
      (e: React.PointerEvent) => {
        if (!dragging.current) return;
        const p = toImagePoint(e.clientX, e.clientY);
        if (dragging.current === 'top') setTop(p);
        else if (dragging.current === 'bottom') setBottom(p);
        else {
          // THE WHOLE LINE MOVES TOGETHER, which is most of what makes this
          // easy: get the height right once, then slide it to the left edge of
          // the opening without having to set it again.
          const last = lastPoint.current;
          if (!last) return;
          const dx = p[0] - last[0];
          const dy = p[1] - last[1];
          setTop(t => [t[0] + dx, t[1] + dy]);
          setBottom(b => [b[0] + dx, b[1] + dy]);
          lastPoint.current = p;
        }
      },
      [toImagePoint],
    );

    const up = useCallback((e: React.PointerEvent) => {
      if (!dragging.current) return;
      try { (e.target as Element).releasePointerCapture(e.pointerId); } catch { /* already released */ }
      dragging.current = null;
      lastPoint.current = null;
    }, []);

    const handle = (p: Point, what: 'top' | 'bottom') => (
      <g key={what} style={{ cursor: 'ns-resize' }} onPointerDown={down(what)}>
        {/* A generous invisible target under a small precise mark — the mark
            says where the point is, the target is what a finger can hit. */}
        <circle cx={p[0]} cy={p[1]} r={px(HIT_RADIUS_PX)} fill="transparent" />
        <line
          x1={p[0] - px(CROSSHAIR_LEN_PX) / 2} y1={p[1]}
          x2={p[0] + px(CROSSHAIR_LEN_PX) / 2} y2={p[1]}
          stroke="rgba(0,0,0,0.45)" strokeWidth={px(CROSSHAIR_STROKE_PX + 1.5)} strokeLinecap="round"
        />
        <line
          x1={p[0] - px(CROSSHAIR_LEN_PX) / 2} y1={p[1]}
          x2={p[0] + px(CROSSHAIR_LEN_PX) / 2} y2={p[1]}
          stroke="#fff" strokeWidth={px(CROSSHAIR_STROKE_PX)} strokeLinecap="round"
        />
        <circle cx={p[0]} cy={p[1]} r={px(5)} fill={TEAL} stroke="#fff" strokeWidth={px(1.5)} />
      </g>
    );

    const path = corners.map((c, i) => `${i ? 'L' : 'M'}${c[0]},${c[1]}`).join(' ') + ' Z';

    return (
      <svg
        ref={svgRef}
        viewBox={`0 0 ${imageWidth} ${imageHeight}`}
        preserveAspectRatio="none"
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
      >
        {/* What the two points imply, so the footprint is visible before it is
            committed to. Faint, because the line is the thing being set. */}
        <path d={path} fill="rgba(74,191,181,0.12)" stroke={TEAL} strokeWidth={px(1.2)} strokeDasharray={`${px(7)} ${px(5)}`} />

        {/* The height line itself, drawn over the footprint so it stays the
            loudest thing on the picture. */}
        <line
          x1={top[0]} y1={top[1]} x2={bottom[0]} y2={bottom[1]}
          stroke="rgba(0,0,0,0.4)" strokeWidth={px(LINE_STROKE_PX + 2)} strokeLinecap="round"
        />
        <line
          x1={top[0]} y1={top[1]} x2={bottom[0]} y2={bottom[1]}
          stroke={TEAL} strokeWidth={px(LINE_STROKE_PX)} strokeLinecap="round"
          style={{ cursor: 'move' }}
          onPointerDown={down('line')}
        />
        {/* A wider invisible grab strip, so the line can be moved without
            having to land exactly on a two-pixel stroke. */}
        <line
          x1={top[0]} y1={top[1]} x2={bottom[0]} y2={bottom[1]}
          stroke="transparent" strokeWidth={px(26)} strokeLinecap="round"
          style={{ cursor: 'move' }}
          onPointerDown={down('line')}
        />

        {handle(top, 'top')}
        {handle(bottom, 'bottom')}
      </svg>
    );
  },
);

HeightLineOverlay.displayName = 'HeightLineOverlay';

export default HeightLineOverlay;
