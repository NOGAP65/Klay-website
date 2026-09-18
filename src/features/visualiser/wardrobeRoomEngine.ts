import * as THREE from 'three';

import { loadImage } from '@/shared';

import { drawWardrobeRoomFallback } from './wardrobeRoomFallback';
import { wardrobeRoomCamera } from './wardrobeRoomProjection';
import { buildWardrobeScene, type WardrobeScene } from './wardrobeScene';

import type { Point } from './homography';
import type { RoomDimensions } from './wardrobeRoomFit';

export interface RoomRenderSettings {
  photoUrl: string; corners: Point[]; room: RoomDimensions; modelId: string;
  colourName: string; widthMm: number; handleFinish: string; recessed: boolean; offsetZ: number;
}

function paintRoomFrame(canvas: HTMLCanvasElement, photo: HTMLImageElement,
  gpu: THREE.WebGLRenderer | null, settings: RoomRenderSettings) {
  const ctx = canvas.getContext('2d', { colorSpace: 'srgb' });
  if (!ctx) throw new Error('Preview canvas unavailable.');
  if (canvas.width !== photo.naturalWidth || canvas.height !== photo.naturalHeight) {
    canvas.width = photo.naturalWidth; canvas.height = photo.naturalHeight;
  }
  ctx.drawImage(photo, 0, 0);
  const isAccelerated = gpu && !gpu.getContext().isContextLost();
  ctx.save();
  try {
    // The front reveal occludes boards deeper inside a recess. Walk-ins and
    // against-wall installations extend forward from their traced back wall.
    if (settings.recessed && settings.offsetZ === 0) {
      ctx.beginPath();
      settings.corners.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath(); ctx.clip();
    }
    if (isAccelerated) ctx.drawImage(gpu.domElement, 0, 0, canvas.width, canvas.height);
    else drawWardrobeRoomFallback(ctx, settings);
  } finally { ctx.restore(); }
  canvas.dataset.renderMode = isAccelerated ? 'webgl' : 'canvas2d';
}

export function createWardrobeRoomEngine(canvas: HTMLCanvasElement) {
  let renderer: THREE.WebGLRenderer | null = null, built: WardrobeScene | null = null;
  let sceneKey = '', disposed = false, generation = 0;
  let photoSource = '', photoRequest: Promise<HTMLImageElement> | null = null;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  } catch { /* Render the same geometry in Canvas 2D on devices without WebGL. */ }
  const gpu = renderer;
  const draw = async (settings: RoomRenderSettings, current: () => boolean) => {
    const revision = ++generation;
    const active = () => !disposed && current() && revision === generation;
    // Session-local: reuse the decoded upload while changing finishes, without
    // retaining a private room photo in the shared image cache.
    if (photoSource !== settings.photoUrl || !photoRequest) {
      photoSource = settings.photoUrl; photoRequest = loadImage(photoSource);
    }
    const photo = await photoRequest;
    if (!active()) return;
    if (gpu && !gpu.getContext().isContextLost()) {
      const key = JSON.stringify([settings.modelId, settings.widthMm, settings.colourName, settings.recessed]);
      if (key !== sceneKey) {
        const next = await buildWardrobeScene({ ...settings, renderer: gpu, forRoom: true });
        if (!active()) { next.dispose(); return; }
        built?.dispose(); built = next; sceneKey = key;
      }
      built!.setHandleFinish(settings.handleFinish);
      built!.scene.position.z = settings.offsetZ * .001;
      const scale = Math.min(1, 1200 / Math.max(photo.naturalWidth, photo.naturalHeight));
      const width = Math.round(photo.naturalWidth * scale), height = Math.round(photo.naturalHeight * scale);
      if (gpu.domElement.width !== width || gpu.domElement.height !== height) gpu.setSize(width, height, false);
      const camera = wardrobeRoomCamera(settings.corners, settings.room, { width: photo.naturalWidth, height: photo.naturalHeight });
      gpu.render(built!.scene, camera);
    }
    if (!active()) return;
    paintRoomFrame(canvas, photo, gpu, settings);
  };
  return { draw, dispose() {
    disposed = true; generation++; photoRequest = null; photoSource = '';
    built?.dispose(); gpu?.dispose(); gpu?.forceContextLoss();
  } };
}
