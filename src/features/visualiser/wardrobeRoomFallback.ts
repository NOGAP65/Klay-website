import { hardwareSpec, wardrobeColourHex } from '@/features/joinery';

import { buildCarcass } from './wardrobeCarcass';
import { projectorFromQuad } from './wardrobeGeometry';

import type { RoomRenderSettings } from './wardrobeRoomEngine';

/** Low-memory / unavailable-GPU fallback. Same millimetre geometry and camera
 * plane, without a second asset download or an invented fit. */
export function drawWardrobeRoomFallback(ctx: CanvasRenderingContext2D, settings: RoomRenderSettings) {
  const { corners, room, modelId, widthMm, colourName, handleFinish, recessed: isRecessed, offsetZ } = settings;
  const plane = projectorFromQuad(corners, room.width, room.height, ctx.canvas.width, ctx.canvas.height);
  if (!plane) throw new Error('Invalid room outline.');
  const { boxes } = buildCarcass(modelId, widthMm, hardwareSpec(handleFinish), isRecessed);
  const faces = boxes.flatMap(box => {
    const { x, y, w, h, d } = box, z = box.z + offsetZ;
    const vertices = [[x,y,z], [x+w,y,z], [x+w,y+h,z], [x,y+h,z],
      [x,y,z+d], [x+w,y,z+d], [x+w,y+h,z+d], [x,y+h,z+d]];
    return [[0,1,2,3], [4,5,6,7], [0,4,7,3], [1,5,6,2], [3,2,6,7], [0,1,5,4]].map((indices, side) => ({
      points: indices.map(i => plane.project(vertices[i][0], vertices[i][1], vertices[i][2])),
      depth: indices.reduce((sum, i) => sum + plane.depth(vertices[i][0], vertices[i][1], vertices[i][2]), 0) / 4,
      colour: box.metal ? `rgb(${(box.colour ?? [.15,.15,.15]).map(c => Math.round(c * 255)).join(',')})` : wardrobeColourHex(colourName),
      shade: [.18, .02, .13, .22, 0, .26][side],
    }));
  });
  faces.sort((a, b) => b.depth - a.depth);
  for (const face of faces) {
    if (face.depth <= .001) continue;
    ctx.beginPath();
    face.points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = face.colour;
    ctx.fill();
    ctx.fillStyle = `rgba(0,0,0,${face.shade})`;
    ctx.fill();
  }
}
