import { useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Canvas2DCurtainRendererProps {
  tl: Point;
  tr: Point;
  br: Point;
  bl: Point;
  fabricType: 'blockout' | 'sheer';
  foldType: 'sfold' | 'pencilpleat' | 'pinchpleat' | 'boxpleat';
  hardwareColour: 'white' | 'black' | 'chrome';
  mount: 'ceiling' | 'window';
  colour: string;
  openness: number;
  canvasWidth: number;
  canvasHeight: number;
  photoUrl: string;
}

const HARDWARE_HEX: Record<'white' | 'black' | 'chrome', string> = {
  white: '#F5F2ED',
  black: '#1C1810',
  chrome: '#C0C0C0',
};

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { r: 200, g: 200, b: 200 };
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function lighten(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newL = Math.min(1, l + amount);
  const rgb = hslToRgb(h, s, newL);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function darken(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newL = Math.max(0, l - amount);
  const rgb = hslToRgb(h, s, newL);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function Canvas2DCurtainRenderer({
  tl,
  tr,
  br,
  bl,
  fabricType,
  foldType,
  hardwareColour,
  mount,
  colour,
  openness,
  canvasWidth,
  canvasHeight,
  photoUrl,
}: Canvas2DCurtainRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const photo = await loadImage(photoUrl);
      if (cancelled) return;

      const W = photo.naturalWidth;
      const H = photo.naturalHeight;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(photo, 0, 0);

      const scaleX = W / canvasWidth;
      const scaleY = H / canvasHeight;
      const scaledTl = { x: tl.x * scaleX, y: tl.y * scaleY };
      const scaledTr = { x: tr.x * scaleX, y: tr.y * scaleY };
      const scaledBr = { x: br.x * scaleX, y: br.y * scaleY };
      const scaledBl = { x: bl.x * scaleX, y: bl.y * scaleY };

      let curtainTl: Point, curtainTr: Point, curtainBr: Point, curtainBl: Point;
      let trackTl: Point, trackTr: Point;

      if (mount === 'ceiling') {
        const leftEdge = { x: scaledTl.x - scaledBl.x, y: scaledTl.y - scaledBl.y };
        const rightEdge = { x: scaledTr.x - scaledBr.x, y: scaledTr.y - scaledBr.y };
        const leftLen = Math.sqrt(leftEdge.x * leftEdge.x + leftEdge.y * leftEdge.y);
        const rightLen = Math.sqrt(rightEdge.x * rightEdge.x + rightEdge.y * rightEdge.y);
        const leftUnit = { x: leftEdge.x / leftLen, y: leftEdge.y / leftLen };
        const rightUnit = { x: rightEdge.x / rightLen, y: rightEdge.y / rightLen };

        const trackOffset = 15 * scaleY;
        trackTl = { x: scaledTl.x + leftUnit.x * trackOffset, y: scaledTl.y + leftUnit.y * trackOffset };
        trackTr = { x: scaledTr.x + rightUnit.x * trackOffset, y: scaledTr.y + rightUnit.y * trackOffset };

        const topEdge = { x: scaledTr.x - scaledTl.x, y: scaledTr.y - scaledTl.y };
        const topLen = Math.sqrt(topEdge.x * topEdge.x + topEdge.y * topEdge.y);
        const topUnit = { x: topEdge.x / topLen, y: topEdge.y / topLen };
        const extendAmount = topLen * 0.12;

        curtainTl = { x: trackTl.x - topUnit.x * extendAmount, y: trackTl.y - topUnit.y * extendAmount };
        curtainTr = { x: trackTr.x + topUnit.x * extendAmount, y: trackTr.y + topUnit.y * extendAmount };

        const bottomEdge = { x: scaledBr.x - scaledBl.x, y: scaledBr.y - scaledBl.y };
        const bottomLen = Math.sqrt(bottomEdge.x * bottomEdge.x + bottomEdge.y * bottomEdge.y);
        const bottomUnit = { x: bottomEdge.x / bottomLen, y: bottomEdge.y / bottomLen };
        const bottomExtend = bottomLen * 0.12;

        curtainBl = { x: scaledBl.x - bottomUnit.x * bottomExtend, y: scaledBl.y - bottomUnit.y * bottomExtend };
        curtainBr = { x: scaledBr.x + bottomUnit.x * bottomExtend, y: scaledBr.y + bottomUnit.y * bottomExtend };
      } else {
        trackTl = { ...scaledTl };
        trackTr = { ...scaledTr };
        curtainTl = { ...scaledTl };
        curtainTr = { ...scaledTr };
        curtainBl = { ...scaledBl };
        curtainBr = { ...scaledBr };
      }

      const hardwareHex = HARDWARE_HEX[hardwareColour];
      const trackHeight = 8 * scaleY;
      ctx.fillStyle = hardwareHex;
      ctx.beginPath();
      ctx.moveTo(curtainTl.x, trackTl.y - trackHeight);
      ctx.lineTo(curtainTr.x, trackTr.y - trackHeight);
      ctx.lineTo(curtainTr.x, trackTr.y);
      ctx.lineTo(curtainTl.x, trackTl.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = darken(hardwareHex, 0.15);
      ctx.lineWidth = 1;
      ctx.stroke();

      const isSheer = fabricType === 'sheer';
      if (isSheer) {
        ctx.globalAlpha = 0.55;
      }

      const curtainTop = { left: curtainTl, right: curtainTr };
      const curtainBottom = { left: curtainBl, right: curtainBr };

      const leftCurtainOpenFrac = Math.min(1, openness * 2);
      const rightCurtainOpenFrac = Math.min(1, openness * 2);

      const leftCurtainWidth = 0.5 - leftCurtainOpenFrac * 0.4;
      const rightCurtainStart = 0.5 + rightCurtainOpenFrac * 0.4;

      const leftTopStart = curtainTop.left;
      const leftTopEnd = lerpPoint(curtainTop.left, curtainTop.right, leftCurtainWidth);
      const leftBottomStart = curtainBottom.left;
      const leftBottomEnd = lerpPoint(curtainBottom.left, curtainBottom.right, leftCurtainWidth);

      const rightTopStart = lerpPoint(curtainTop.left, curtainTop.right, rightCurtainStart);
      const rightTopEnd = curtainTop.right;
      const rightBottomStart = lerpPoint(curtainBottom.left, curtainBottom.right, rightCurtainStart);
      const rightBottomEnd = curtainBottom.right;

      drawCurtainPanel(ctx, leftTopStart, leftTopEnd, leftBottomEnd, leftBottomStart, colour, foldType, isSheer, scaleX, scaleY);
      drawCurtainPanel(ctx, rightTopStart, rightTopEnd, rightBottomEnd, rightBottomStart, colour, foldType, isSheer, scaleX, scaleY);

      if (isSheer) {
        ctx.globalAlpha = 1.0;
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [tl, tr, br, bl, fabricType, foldType, hardwareColour, mount, colour, openness, canvasWidth, canvasHeight, photoUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}

function drawCurtainPanel(
  ctx: CanvasRenderingContext2D,
  topLeft: Point,
  topRight: Point,
  bottomRight: Point,
  bottomLeft: Point,
  colour: string,
  foldType: 'sfold' | 'pencilpleat' | 'pinchpleat' | 'boxpleat',
  isSheer: boolean,
  scaleX: number,
  scaleY: number
) {
  const panelWidth = Math.sqrt(
    Math.pow(topRight.x - topLeft.x, 2) + Math.pow(topRight.y - topLeft.y, 2)
  );
  if (panelWidth < 10) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(bottomRight.x, bottomRight.y);
  ctx.lineTo(bottomLeft.x, bottomLeft.y);
  ctx.closePath();
  ctx.clip();

  if (isSheer) {
    ctx.fillStyle = 'rgba(255, 248, 231, 0.3)';
    ctx.fill();
  }

  ctx.fillStyle = colour;
  ctx.fill();

  switch (foldType) {
    case 'sfold':
      drawSFold(ctx, topLeft, topRight, bottomRight, bottomLeft, colour, scaleX);
      break;
    case 'pencilpleat':
      drawPencilPleat(ctx, topLeft, topRight, bottomRight, bottomLeft, colour, scaleX, scaleY);
      break;
    case 'pinchpleat':
      drawPinchPleat(ctx, topLeft, topRight, bottomRight, bottomLeft, colour, scaleX, scaleY);
      break;
    case 'boxpleat':
      drawBoxPleat(ctx, topLeft, topRight, bottomRight, bottomLeft, colour, scaleX);
      break;
  }

  ctx.restore();
}

function drawSFold(
  ctx: CanvasRenderingContext2D,
  topLeft: Point,
  topRight: Point,
  bottomRight: Point,
  bottomLeft: Point,
  colour: string,
  scaleX: number
) {
  const numFolds = 7;
  const panelWidth = Math.sqrt(
    Math.pow(topRight.x - topLeft.x, 2) + Math.pow(topRight.y - topLeft.y, 2)
  );
  const foldWidth = panelWidth / numFolds;

  for (let i = 0; i < numFolds; i++) {
    const t1 = i / numFolds;
    const t2 = (i + 1) / numFolds;

    const topStart = lerpPoint(topLeft, topRight, t1);
    const topEnd = lerpPoint(topLeft, topRight, t2);
    const bottomStart = lerpPoint(bottomLeft, bottomRight, t1);
    const bottomEnd = lerpPoint(bottomLeft, bottomRight, t2);

    const phase = (i % 2 === 0) ? 1 : -1;
    const peakOffset = phase > 0 ? 0.18 : -0.22;

    const midX = (topStart.x + topEnd.x) / 2;

    ctx.beginPath();
    ctx.moveTo(topStart.x, topStart.y);

    const topMidY = (topStart.y + topEnd.y) / 2;

    if (phase > 0) {
      ctx.fillStyle = lighten(colour, 0.08);
    } else {
      ctx.fillStyle = darken(colour, 0.10);
    }

    ctx.quadraticCurveTo(midX, topMidY - foldWidth * peakOffset, topEnd.x, topEnd.y);
    ctx.lineTo(bottomEnd.x, bottomEnd.y);

    const bottomMidY = (bottomStart.y + bottomEnd.y) / 2;
    const bottomMidX = (bottomStart.x + bottomEnd.x) / 2;
    ctx.quadraticCurveTo(bottomMidX, bottomMidY - foldWidth * peakOffset, bottomStart.x, bottomStart.y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = rgba('#000000', phase > 0 ? 0.05 : 0.12);
    ctx.lineWidth = 1 * scaleX;
    ctx.stroke();
  }
}

function drawPencilPleat(
  ctx: CanvasRenderingContext2D,
  topLeft: Point,
  topRight: Point,
  bottomRight: Point,
  bottomLeft: Point,
  colour: string,
  scaleX: number,
  _scaleY: number
) {
  const headingHeight = Math.sqrt(
    Math.pow(topLeft.x - bottomLeft.x, 2) + Math.pow(topLeft.y - bottomLeft.y, 2)
  ) * 0.09;

  const headingBl = lerpPoint(topLeft, bottomLeft, headingHeight / Math.sqrt(Math.pow(topLeft.x - bottomLeft.x, 2) + Math.pow(topLeft.y - bottomLeft.y, 2)));
  const headingBr = lerpPoint(topRight, bottomRight, headingHeight / Math.sqrt(Math.pow(topRight.x - bottomRight.x, 2) + Math.pow(topRight.y - bottomRight.y, 2)));

  ctx.fillStyle = darken(colour, 0.05);
  ctx.beginPath();
  ctx.moveTo(topLeft.x, topLeft.y);
  ctx.lineTo(topRight.x, topRight.y);
  ctx.lineTo(headingBr.x, headingBr.y);
  ctx.lineTo(headingBl.x, headingBl.y);
  ctx.closePath();
  ctx.fill();

  const numColumns = 12;
  for (let i = 0; i < numColumns; i++) {
    const t = (i + 0.5) / numColumns;
    const topPt = lerpPoint(topLeft, topRight, t);
    const bottomPt = lerpPoint(bottomLeft, bottomRight, t);

    const shade = (i % 2 === 0) ? 0.06 : -0.04;
    ctx.strokeStyle = shade > 0 ? lighten(colour, shade) : darken(colour, -shade);
    ctx.lineWidth = 2 * scaleX;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(topPt.x, topPt.y + headingHeight);
    ctx.lineTo(bottomPt.x, bottomPt.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = rgba('#000000', 0.08);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(headingBl.x, headingBl.y);
  ctx.lineTo(headingBr.x, headingBr.y);
  ctx.stroke();
}

function drawPinchPleat(
  ctx: CanvasRenderingContext2D,
  topLeft: Point,
  topRight: Point,
  bottomRight: Point,
  bottomLeft: Point,
  colour: string,
  scaleX: number,
  _scaleY: number
) {
  const numGroups = 4;
  const panelWidth = Math.sqrt(
    Math.pow(topRight.x - topLeft.x, 2) + Math.pow(topRight.y - topLeft.y, 2)
  );
  const panelHeight = Math.sqrt(
    Math.pow(topLeft.x - bottomLeft.x, 2) + Math.pow(topLeft.y - bottomLeft.y, 2)
  );
  const pinchHeight = panelHeight * 0.12;

  for (let g = 0; g < numGroups; g++) {
    const groupCenter = (g + 0.5) / numGroups;
    const groupWidth = 1 / numGroups;

    const pinchTopCenter = lerpPoint(topLeft, topRight, groupCenter);
    const pinchBottomCenter = lerpPoint(
      lerpPoint(topLeft, bottomLeft, pinchHeight / panelHeight),
      lerpPoint(topRight, bottomRight, pinchHeight / panelHeight),
      groupCenter
    );

    const subFoldWidth = (groupWidth * panelWidth) / 6;
    for (let s = 0; s < 3; s++) {
      const offset = (s - 1) * subFoldWidth * 0.6;
      const subTop = { x: pinchTopCenter.x + offset, y: pinchTopCenter.y };
      const subBottom = { x: pinchBottomCenter.x + offset * 0.3, y: pinchBottomCenter.y };

      ctx.beginPath();
      ctx.moveTo(subTop.x - subFoldWidth * 0.3, subTop.y);
      ctx.lineTo(subTop.x + subFoldWidth * 0.3, subTop.y);
      ctx.lineTo(subBottom.x, subBottom.y);
      ctx.closePath();
      ctx.fillStyle = darken(colour, 0.15 + s * 0.03);
      ctx.fill();
    }

    const leftT = groupCenter - groupWidth * 0.4;
    const rightT = groupCenter + groupWidth * 0.4;
    const foldTopLeft = lerpPoint(topLeft, topRight, leftT);
    const foldTopRight = lerpPoint(topLeft, topRight, rightT);
    const foldBottomLeft = lerpPoint(bottomLeft, bottomRight, leftT);
    const foldBottomRight = lerpPoint(bottomLeft, bottomRight, rightT);

    ctx.strokeStyle = rgba('#000000', 0.12);
    ctx.lineWidth = 1 * scaleX;
    ctx.beginPath();
    ctx.moveTo(foldTopLeft.x, foldTopLeft.y + pinchHeight);
    ctx.lineTo(foldBottomLeft.x, foldBottomLeft.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(foldTopRight.x, foldTopRight.y + pinchHeight);
    ctx.lineTo(foldBottomRight.x, foldBottomRight.y);
    ctx.stroke();
  }
}

function drawBoxPleat(
  ctx: CanvasRenderingContext2D,
  topLeft: Point,
  topRight: Point,
  bottomRight: Point,
  bottomLeft: Point,
  colour: string,
  scaleX: number
) {
  const numPleats = 4;

  for (let i = 0; i <= numPleats; i++) {
    const t = i / numPleats;
    const topPt = lerpPoint(topLeft, topRight, t);
    const bottomPt = lerpPoint(bottomLeft, bottomRight, t);

    ctx.strokeStyle = darken(colour, 0.25);
    ctx.lineWidth = 2 * scaleX;
    ctx.beginPath();
    ctx.moveTo(topPt.x, topPt.y);
    ctx.lineTo(bottomPt.x, bottomPt.y);
    ctx.stroke();
  }

  for (let i = 0; i < numPleats; i++) {
    const t1 = i / numPleats;
    const t2 = (i + 1) / numPleats;

    const shade = (i % 2 === 0) ? 0.05 : -0.08;
    const topStart = lerpPoint(topLeft, topRight, t1);
    const topEnd = lerpPoint(topLeft, topRight, t2);
    const bottomStart = lerpPoint(bottomLeft, bottomRight, t1);
    const bottomEnd = lerpPoint(bottomLeft, bottomRight, t2);

    ctx.fillStyle = shade > 0 ? lighten(colour, shade) : darken(colour, -shade);
    ctx.beginPath();
    ctx.moveTo(topStart.x, topStart.y);
    ctx.lineTo(topEnd.x, topEnd.y);
    ctx.lineTo(bottomEnd.x, bottomEnd.y);
    ctx.lineTo(bottomStart.x, bottomStart.y);
    ctx.closePath();
    ctx.fill();
  }
}
