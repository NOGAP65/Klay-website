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

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return { r: isNaN(r) ? 200 : r, g: isNaN(g) ? 200 : g, b: isNaN(b) ? 200 : b };
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
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
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

function adjustBrightness(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(r, g, b);
  const newL = Math.max(0, Math.min(1, l + amount));
  const rgb = hslToRgb(h, s, newL);
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
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

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export default function Canvas2DCurtainRenderer({
  tl, tr, br, bl,
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
      const sTl = { x: tl.x * scaleX, y: tl.y * scaleY };
      const sTr = { x: tr.x * scaleX, y: tr.y * scaleY };
      const sBr = { x: br.x * scaleX, y: br.y * scaleY };
      const sBl = { x: bl.x * scaleX, y: bl.y * scaleY };

      let curtainTl: Point, curtainTr: Point, curtainBr: Point, curtainBl: Point;

      if (mount === 'ceiling') {
        const topEdge = { x: sTr.x - sTl.x, y: sTr.y - sTl.y };
        const topLen = Math.sqrt(topEdge.x * topEdge.x + topEdge.y * topEdge.y);
        const topUnit = { x: topEdge.x / topLen, y: topEdge.y / topLen };
        const extendAmount = topLen * 0.12;

        const leftEdge = { x: sTl.x - sBl.x, y: sTl.y - sBl.y };
        const leftLen = Math.sqrt(leftEdge.x * leftEdge.x + leftEdge.y * leftEdge.y);
        const leftUnit = { x: leftEdge.x / leftLen, y: leftEdge.y / leftLen };
        const trackOffset = 15 * scaleY;

        curtainTl = {
          x: sTl.x - topUnit.x * extendAmount + leftUnit.x * trackOffset,
          y: sTl.y - topUnit.y * extendAmount + leftUnit.y * trackOffset
        };
        curtainTr = {
          x: sTr.x + topUnit.x * extendAmount + leftUnit.x * trackOffset,
          y: sTr.y + topUnit.y * extendAmount + leftUnit.y * trackOffset
        };

        const bottomEdge = { x: sBr.x - sBl.x, y: sBr.y - sBl.y };
        const bottomLen = Math.sqrt(bottomEdge.x * bottomEdge.x + bottomEdge.y * bottomEdge.y);
        const bottomUnit = { x: bottomEdge.x / bottomLen, y: bottomEdge.y / bottomLen };
        const bottomExtend = bottomLen * 0.12;

        curtainBl = { x: sBl.x - bottomUnit.x * bottomExtend, y: sBl.y - bottomUnit.y * bottomExtend };
        curtainBr = { x: sBr.x + bottomUnit.x * bottomExtend, y: sBr.y + bottomUnit.y * bottomExtend };
      } else {
        curtainTl = { ...sTl };
        curtainTr = { ...sTr };
        curtainBl = { ...sBl };
        curtainBr = { ...sBr };
      }

      const isSheer = fabricType === 'sheer';

      if (isSheer) {
        const centerX = (curtainTl.x + curtainTr.x + curtainBr.x + curtainBl.x) / 4;
        const centerY = (curtainTl.y + curtainTr.y + curtainBr.y + curtainBl.y) / 4;
        const width = Math.abs(curtainTr.x - curtainTl.x);
        const height = Math.abs(curtainBl.y - curtainTl.y);
        const radius = Math.max(width, height) * 0.6;

        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 248, 234, 0.35)');
        gradient.addColorStop(1, 'rgba(255, 248, 234, 0)');

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(curtainTl.x, curtainTl.y);
        ctx.lineTo(curtainTr.x, curtainTr.y);
        ctx.lineTo(curtainBr.x, curtainBr.y);
        ctx.lineTo(curtainBl.x, curtainBl.y);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }

      const leftPanelOpenFrac = Math.min(1, openness * 2);
      const rightPanelOpenFrac = Math.min(1, openness * 2);

      const leftPanelEndT = 0.5 - leftPanelOpenFrac * 0.4;
      const rightPanelStartT = 0.5 + rightPanelOpenFrac * 0.4;

      const leftPanelTl = curtainTl;
      const leftPanelTr = lerpPoint(curtainTl, curtainTr, leftPanelEndT);
      const leftPanelBr = lerpPoint(curtainBl, curtainBr, leftPanelEndT);
      const leftPanelBl = curtainBl;

      const rightPanelTl = lerpPoint(curtainTl, curtainTr, rightPanelStartT);
      const rightPanelTr = curtainTr;
      const rightPanelBr = curtainBr;
      const rightPanelBl = lerpPoint(curtainBl, curtainBr, rightPanelStartT);

      if (isSheer) {
        ctx.globalAlpha = 0.55;
      }

      drawPanel(ctx, leftPanelTl, leftPanelTr, leftPanelBr, leftPanelBl, colour, foldType, false);
      drawPanel(ctx, rightPanelTl, rightPanelTr, rightPanelBr, rightPanelBl, colour, foldType, true);

      if (isSheer) {
        ctx.globalAlpha = 1.0;
      }

      void hardwareColour;
    };

    render();
    return () => { cancelled = true; };
  }, [tl, tr, br, bl, fabricType, foldType, hardwareColour, mount, colour, openness, canvasWidth, canvasHeight, photoUrl]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: 'auto', display: 'block' }}
    />
  );
}

function drawPanel(
  ctx: CanvasRenderingContext2D,
  tl: Point, tr: Point, br: Point, bl: Point,
  colour: string,
  foldType: 'sfold' | 'pencilpleat' | 'pinchpleat' | 'boxpleat',
  isRightPanel: boolean
) {
  const panelWidth = Math.sqrt(Math.pow(tr.x - tl.x, 2) + Math.pow(tr.y - tl.y, 2));
  if (panelWidth < 5) return;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.clip();

  switch (foldType) {
    case 'sfold':
      drawSFoldPanel(ctx, tl, tr, br, bl, colour, panelWidth);
      break;
    case 'pencilpleat':
      drawPencilPleatPanel(ctx, tl, tr, br, bl, colour, panelWidth);
      break;
    case 'pinchpleat':
      drawPinchPleatPanel(ctx, tl, tr, br, bl, colour, panelWidth, isRightPanel);
      break;
    case 'boxpleat':
      drawBoxPleatPanel(ctx, tl, tr, br, bl, colour, panelWidth, isRightPanel);
      break;
  }

  ctx.restore();
}

function drawSFoldPanel(
  ctx: CanvasRenderingContext2D,
  tl: Point, tr: Point, br: Point, bl: Point,
  colour: string,
  panelWidth: number
) {
  const numColumns = 28;
  const foldDepth = panelWidth * 0.06;

  for (let i = 0; i < numColumns; i++) {
    const t1 = i / numColumns;
    const t2 = (i + 1) / numColumns;

    const colTl = lerpPoint(tl, tr, t1);
    const colTr = lerpPoint(tl, tr, t2);
    const colBr = lerpPoint(bl, br, t2);
    const colBl = lerpPoint(bl, br, t1);

    const sineVal = Math.sin((i + 0.5) * Math.PI / 4);
    const brightness = sineVal * 0.12;

    ctx.fillStyle = adjustBrightness(colour, brightness);
    ctx.beginPath();
    ctx.moveTo(colTl.x, colTl.y);
    ctx.lineTo(colTr.x, colTr.y);
    ctx.lineTo(colBr.x, colBr.y);
    ctx.lineTo(colBl.x, colBl.y);
    ctx.closePath();
    ctx.fill();
  }

  void foldDepth;
}

function drawPencilPleatPanel(
  ctx: CanvasRenderingContext2D,
  tl: Point, tr: Point, br: Point, bl: Point,
  colour: string,
  _panelWidth: number
) {
  const headingFrac = 0.09;
  const numColumns = 48;

  const headingBl = lerpPoint(tl, bl, headingFrac);
  const headingBr = lerpPoint(tr, br, headingFrac);

  ctx.fillStyle = adjustBrightness(colour, -0.08);
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(headingBr.x, headingBr.y);
  ctx.lineTo(headingBl.x, headingBl.y);
  ctx.closePath();
  ctx.fill();

  const bodyTl = headingBl;
  const bodyTr = headingBr;
  const bodyBr = br;
  const bodyBl = bl;

  const seeds = [0.7, 0.9, 0.65, 0.85, 0.75, 0.95, 0.6, 0.8, 0.7, 0.9, 0.65, 0.85];

  for (let i = 0; i < numColumns; i++) {
    const t1 = i / numColumns;
    const t2 = (i + 1) / numColumns;

    const colTl = lerpPoint(bodyTl, bodyTr, t1);
    const colTr = lerpPoint(bodyTl, bodyTr, t2);
    const colBr = lerpPoint(bodyBl, bodyBr, t2);
    const colBl = lerpPoint(bodyBl, bodyBr, t1);

    const foldGroup = Math.floor(i / 4);
    const amp = seeds[foldGroup % seeds.length];
    const sineVal = Math.sin((i + 0.5) * Math.PI / 4) * amp;
    const brightness = sineVal * 0.10;

    ctx.fillStyle = adjustBrightness(colour, brightness);
    ctx.beginPath();
    ctx.moveTo(colTl.x, colTl.y);
    ctx.lineTo(colTr.x, colTr.y);
    ctx.lineTo(colBr.x, colBr.y);
    ctx.lineTo(colBl.x, colBl.y);
    ctx.closePath();
    ctx.fill();
  }

}

function drawPinchPleatPanel(
  ctx: CanvasRenderingContext2D,
  tl: Point, tr: Point, br: Point, bl: Point,
  colour: string,
  _panelWidth: number,
  _isRightPanel: boolean
) {
  const numPinches = 4;
  const pinchWidth = 0.12;
  const pinchRelax = 0.5;

  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.fill();

  for (let p = 0; p < numPinches; p++) {
    const pinchCenter = (p + 0.5) / numPinches;
    const pinchLeft = pinchCenter - pinchWidth / 2;
    const pinchRight = pinchCenter + pinchWidth / 2;

    const topLeft = lerpPoint(tl, tr, pinchLeft);
    const topRight = lerpPoint(tl, tr, pinchRight);
    const topCenter = lerpPoint(tl, tr, pinchCenter);

    const midCenter = lerpPoint(
      lerpPoint(tl, bl, pinchRelax * 0.3),
      lerpPoint(tr, br, pinchRelax * 0.3),
      pinchCenter
    );

    ctx.fillStyle = adjustBrightness(colour, -0.20);
    ctx.beginPath();
    ctx.moveTo(topLeft.x, topLeft.y);
    ctx.lineTo(topCenter.x, topCenter.y);
    ctx.lineTo(midCenter.x, midCenter.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(topCenter.x, topCenter.y);
    ctx.lineTo(topRight.x, topRight.y);
    ctx.lineTo(midCenter.x, midCenter.y);
    ctx.closePath();
    ctx.fill();

    const subFoldOffsets = [-0.03, 0, 0.03];
    for (let s = 0; s < 3; s++) {
      const offset = subFoldOffsets[s];
      const subTop = lerpPoint(tl, tr, pinchCenter + offset);
      const subMid = lerpPoint(
        lerpPoint(tl, bl, pinchRelax * 0.8),
        lerpPoint(tr, br, pinchRelax * 0.8),
        pinchCenter + offset * 2
      );

      const shade = s === 1 ? -0.15 : -0.10;
      ctx.strokeStyle = adjustBrightness(colour, shade);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(subTop.x, subTop.y);
      ctx.lineTo(subMid.x, subMid.y);
      ctx.stroke();
    }

    const bottomLeft = lerpPoint(bl, br, pinchLeft - 0.02);
    const bottomRight = lerpPoint(bl, br, pinchRight + 0.02);
    const bodyTopLeft = lerpPoint(
      lerpPoint(tl, bl, pinchRelax),
      lerpPoint(tr, br, pinchRelax),
      pinchLeft - 0.01
    );
    const bodyTopRight = lerpPoint(
      lerpPoint(tl, bl, pinchRelax),
      lerpPoint(tr, br, pinchRelax),
      pinchRight + 0.01
    );

    const numBodyCols = 6;
    for (let c = 0; c < numBodyCols; c++) {
      const ct1 = c / numBodyCols;
      const ct2 = (c + 1) / numBodyCols;

      const cTl = lerpPoint(bodyTopLeft, bodyTopRight, ct1);
      const cTr = lerpPoint(bodyTopLeft, bodyTopRight, ct2);
      const cBr = lerpPoint(bottomLeft, bottomRight, ct2);
      const cBl = lerpPoint(bottomLeft, bottomRight, ct1);

      const sineVal = Math.sin((c + 0.5) * Math.PI / 3);
      const brightness = sineVal * 0.08;

      ctx.fillStyle = adjustBrightness(colour, brightness);
      ctx.beginPath();
      ctx.moveTo(cTl.x, cTl.y);
      ctx.lineTo(cTr.x, cTr.y);
      ctx.lineTo(cBr.x, cBr.y);
      ctx.lineTo(cBl.x, cBl.y);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawBoxPleatPanel(
  ctx: CanvasRenderingContext2D,
  tl: Point, tr: Point, br: Point, bl: Point,
  colour: string,
  _panelWidth: number,
  _isRightPanel: boolean
) {
  const numPleats = 4;

  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(tl.x, tl.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(bl.x, bl.y);
  ctx.closePath();
  ctx.fill();

  for (let p = 0; p < numPleats; p++) {
    const pleatCenter = (p + 0.5) / numPleats;
    const pleatLeft = pleatCenter - 0.04;
    const pleatRight = pleatCenter + 0.04;

    const returnLeft = pleatCenter - 0.08;
    const returnRight = pleatLeft;

    const returnTopLeft = lerpPoint(tl, tr, returnLeft);
    const returnTopRight = lerpPoint(tl, tr, returnRight);
    const returnBotRight = lerpPoint(bl, br, returnRight);
    const returnBotLeft = lerpPoint(bl, br, returnLeft);

    ctx.fillStyle = adjustBrightness(colour, -0.06);
    ctx.beginPath();
    ctx.moveTo(returnTopLeft.x, returnTopLeft.y);
    ctx.lineTo(returnTopRight.x, returnTopRight.y);
    ctx.lineTo(returnBotRight.x, returnBotRight.y);
    ctx.lineTo(returnBotLeft.x, returnBotLeft.y);
    ctx.closePath();
    ctx.fill();

    const pleatTop = lerpPoint(tl, tr, pleatLeft);
    const pleatBot = lerpPoint(bl, br, pleatLeft);

    ctx.strokeStyle = adjustBrightness(colour, -0.25);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pleatTop.x, pleatTop.y);
    ctx.lineTo(pleatBot.x, pleatBot.y);
    ctx.stroke();

    const return2Left = pleatRight;
    const return2Right = pleatCenter + 0.08;

    const return2TopLeft = lerpPoint(tl, tr, return2Left);
    const return2TopRight = lerpPoint(tl, tr, return2Right);
    const return2BotRight = lerpPoint(bl, br, return2Right);
    const return2BotLeft = lerpPoint(bl, br, return2Left);

    ctx.fillStyle = adjustBrightness(colour, -0.06);
    ctx.beginPath();
    ctx.moveTo(return2TopLeft.x, return2TopLeft.y);
    ctx.lineTo(return2TopRight.x, return2TopRight.y);
    ctx.lineTo(return2BotRight.x, return2BotRight.y);
    ctx.lineTo(return2BotLeft.x, return2BotLeft.y);
    ctx.closePath();
    ctx.fill();

    const pleat2Top = lerpPoint(tl, tr, pleatRight);
    const pleat2Bot = lerpPoint(bl, br, pleatRight);

    ctx.beginPath();
    ctx.moveTo(pleat2Top.x, pleat2Top.y);
    ctx.lineTo(pleat2Bot.x, pleat2Bot.y);
    ctx.stroke();
  }
}
