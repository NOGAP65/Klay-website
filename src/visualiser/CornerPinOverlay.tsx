import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

export type Point = [number, number];

export interface CornerPinOverlayHandle {
  confirm: () => void;
}

interface CornerPinOverlayProps {
  imageWidth: number;
  imageHeight: number;
  onConfirm: (corners: Point[]) => void;
}

const DEFAULT_CORNERS_PCT: Point[] = [
  [0.1, 0.1],
  [0.9, 0.1],
  [0.9, 0.9],
  [0.1, 0.9],
];

const TEAL = '#4ABFB5';

// Corner order is [tl, tr, br, bl]. Each midpoint sits between the two
// corners listed and, when dragged, moves only those two corners together
// along a single axis (x for top/bottom, y for left/right) — this is what
// lets the user skew/tilt the traced area to match perspective.
type MidpointId = 'top' | 'bottom' | 'left' | 'right';

const MIDPOINTS: { id: MidpointId; indices: [number, number]; axis: 'x' | 'y'; cursor: string }[] = [
  { id: 'top', indices: [0, 1], axis: 'x', cursor: 'ew-resize' },
  { id: 'right', indices: [1, 2], axis: 'y', cursor: 'ns-resize' },
  { id: 'bottom', indices: [3, 2], axis: 'x', cursor: 'ew-resize' },
  { id: 'left', indices: [0, 3], axis: 'y', cursor: 'ns-resize' },
];

// Handles render at a fixed on-screen size regardless of image resolution
// (rather than scaling with image dimensions), so they don't dwarf a small
// traced window or vanish on a huge photo.
//
// Corner handles are crosshairs — a big transparent hit circle (easy to grab
// on mobile) underneath a small precise white crosshair + teal centre dot,
// like a camera/scope reticle.
const CORNER_HIT_RADIUS_PX = 16;
const CROSSHAIR_LINE_LENGTH_PX = 20;
const CROSSHAIR_STROKE_PX = 2;
const CROSSHAIR_SHADOW_STROKE_PX = 3;
const CROSSHAIR_SHADOW_OFFSET_PX = 1;
const CROSSHAIR_CENTER_RADIUS_PX = 4;
const CROSSHAIR_CENTER_STROKE_PX = 1.5;

// Midpoint diamonds keep their small visual size but get a bigger invisible
// hit circle, same idea as the corner crosshairs.
const MIDPOINT_HIT_RADIUS_PX = 8;
const MIDPOINT_DIAMOND_PX = 10;
const MIDPOINT_DIAMOND_STROKE_PX = 1.5;

const CornerPinOverlay = forwardRef<CornerPinOverlayHandle, CornerPinOverlayProps>(
  ({ imageWidth, imageHeight, onConfirm }, ref) => {
    const [corners, setCorners] = useState<Point[]>(() =>
      DEFAULT_CORNERS_PCT.map(([px, py]) => [px * imageWidth, py * imageHeight])
    );
    const activeIndex = useRef<number | null>(null);
    const activeMidpoint = useRef<MidpointId | null>(null);
    const lastMidpointPoint = useRef<Point | null>(null);
    const svgRef = useRef<SVGSVGElement | null>(null);

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
        setCorners(prev => prev.map((c, i) => (i === index ? point : c)));
        return;
      }
      if (activeMidpoint.current !== null && lastMidpointPoint.current) {
        const point = toImagePoint(e.clientX, e.clientY);
        const last = lastMidpointPoint.current;
        const dx = point[0] - last[0];
        const dy = point[1] - last[1];
        const config = MIDPOINTS.find(m => m.id === activeMidpoint.current)!;
        const [i, j] = config.indices;
        setCorners(prev => prev.map((c, idx) =>
          idx !== i && idx !== j ? c : config.axis === 'x' ? [c[0] + dx, c[1]] : [c[0], c[1] + dy]
        ));
        lastMidpointPoint.current = point;
      }
    }, [toImagePoint]);

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
        setCorners(prev => prev.map((c, i) => (i === index ? point : c)));
        return;
      }
      if (activeMidpoint.current !== null && lastMidpointPoint.current) {
        const point = toImagePoint(touch.clientX, touch.clientY);
        const last = lastMidpointPoint.current;
        const dx = point[0] - last[0];
        const dy = point[1] - last[1];
        const config = MIDPOINTS.find(m => m.id === activeMidpoint.current)!;
        const [i, j] = config.indices;
        setCorners(prev => prev.map((c, idx) =>
          idx !== i && idx !== j ? c : config.axis === 'x' ? [c[0] + dx, c[1]] : [c[0], c[1] + dy]
        ));
        lastMidpointPoint.current = point;
      }
    }, [toImagePoint]);

    const polygonPoints = corners.map(([x, y]) => `${x},${y}`).join(' ');

    // Convert the desired fixed CSS pixel sizes into viewBox (image pixel)
    // units using the SVG's actual rendered width, so handles stay a
    // constant on-screen size regardless of the photo's resolution.
    const scale = renderedWidth > 0 ? imageWidth / renderedWidth : 1;
    const cornerHitRadius = CORNER_HIT_RADIUS_PX * scale;
    const crosshairHalfLength = (CROSSHAIR_LINE_LENGTH_PX * scale) / 2;
    const crosshairStroke = CROSSHAIR_STROKE_PX * scale;
    const crosshairShadowStroke = CROSSHAIR_SHADOW_STROKE_PX * scale;
    const crosshairShadowOffset = CROSSHAIR_SHADOW_OFFSET_PX * scale;
    const crosshairCenterRadius = CROSSHAIR_CENTER_RADIUS_PX * scale;
    const crosshairCenterStroke = CROSSHAIR_CENTER_STROKE_PX * scale;
    const midpointHitRadius = MIDPOINT_HIT_RADIUS_PX * scale;
    const midpointSide = MIDPOINT_DIAMOND_PX * scale;
    const midpointStroke = MIDPOINT_DIAMOND_STROKE_PX * scale;
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
