import { useRef, useEffect } from 'react';
import * as THREE from 'three';

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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

const VERTEX_SHADER = `
uniform float uFoldFrequency;
uniform float uFoldAmplitude;
uniform int uFoldType;
uniform float uOpenness;
uniform float uIsLeftPanel; // 1.0 for left panel, 0.0 for right panel

varying vec2 vUv;
varying float vFoldDepth;
varying float vFoldGradient;
varying float vLocalCollapse;

#define SFOLD 0
#define PENCILPLEAT 1
#define PINCHPLEAT 2
#define BOXPLEAT 3

void main() {
  vUv = uv;
  vec3 pos = position;

  // Sequential fold collapse: folds collapse from outer edge (wall) toward centre
  // Left panel: uv.x=0 is inner (centre), uv.x=1 is outer (wall)
  // Right panel: uv.x=0 is outer (wall), uv.x=1 is inner (centre) — flip it
  float distFromOuter = uIsLeftPanel > 0.5 ? uv.x : (1.0 - uv.x);

  // Collapse threshold moves from 1.0 to 0.0 as openness increases
  // When openness=0, threshold=1.0, nothing collapsed
  // When openness=1, threshold=0.0, everything collapsed
  float collapseThreshold = 1.0 - uOpenness;

  // Local collapse: 0 = normal hanging, 1 = fully collapsed/bunched
  // Folds past the threshold are collapsed, with a soft transition zone of 0.25
  float localCollapse = clamp(
    (distFromOuter - collapseThreshold) / 0.25,
    0.0, 1.0
  );
  vLocalCollapse = localCollapse;

  // Collapsed folds: tighter frequency (bunched), deeper amplitude
  float localFrequency = uFoldFrequency * mix(1.0, 3.0, localCollapse);
  float localAmplitude = uFoldAmplitude * mix(1.0, 2.5, localCollapse);

  float foldX = uv.x * localFrequency;

  float wave = 0.0;
  float gradient = 0.0;

  if (uFoldType == SFOLD) {
    wave = sin(foldX * 6.28318);
    gradient = cos(foldX * 6.28318);
  }
  else if (uFoldType == PENCILPLEAT) {
    float topFreq = localFrequency * 2.0;
    float bottomFreq = localFrequency * 0.6;
    float yBlend = smoothstep(0.0, 0.6, 1.0 - uv.y);
    float freq = mix(topFreq, bottomFreq, yBlend);
    wave = sin(uv.x * freq * 6.28318);
    gradient = cos(uv.x * freq * 6.28318);
    float depthFade = mix(1.0, 0.4, yBlend);
    wave *= depthFade;
  }
  else if (uFoldType == PINCHPLEAT) {
    float pinchCycle = fract(foldX);
    float inPinch = smoothstep(0.2, 0.35, pinchCycle) * (1.0 - smoothstep(0.65, 0.8, pinchCycle));
    float pinchWave = sin(pinchCycle * 9.4248) * inPinch;
    float flowWave = sin(foldX * 6.28318);
    float yBlend = smoothstep(0.0, 0.4, 1.0 - uv.y);
    wave = mix(pinchWave + flowWave * 0.3, flowWave, yBlend);
    gradient = cos(foldX * 6.28318);
  }
  else if (uFoldType == BOXPLEAT) {
    float boxCycle = fract(foldX);
    float boxWave = smoothstep(0.0, 0.15, boxCycle)
                  - smoothstep(0.35, 0.5, boxCycle)
                  + smoothstep(0.5, 0.65, boxCycle)
                  - smoothstep(0.85, 1.0, boxCycle);
    wave = boxWave * 2.0 - 0.5;
    gradient = (step(0.5, boxCycle) * 2.0 - 1.0) * (1.0 - smoothstep(0.0, 0.2, min(abs(boxCycle - 0.25), abs(boxCycle - 0.75))));
  }

  float zDisp = wave * localAmplitude;
  pos.z += zDisp;

  // X position compression: collapsed region pulls toward outer wall
  // Left panel collapses leftward (negative X), right panel collapses rightward (positive X)
  float xCompressFactor = localCollapse * 0.85;
  float compressDirection = uIsLeftPanel > 0.5 ? -1.0 : 1.0;
  // Pull collapsed vertices toward the outer edge
  pos.x += compressDirection * xCompressFactor * (1.0 - distFromOuter) * 0.5;

  vFoldDepth = wave;
  vFoldGradient = gradient;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform vec3 uColour;
uniform float uOpacity;
uniform float uIsSheer;
uniform int uFoldType;

varying vec2 vUv;
varying float vFoldDepth;
varying float vFoldGradient;
varying float vLocalCollapse;

#define SFOLD 0
#define PENCILPLEAT 1
#define PINCHPLEAT 2
#define BOXPLEAT 3

void main() {
  vec3 colour = uColour;

  // Fold shadow contrast: Peak (facing viewer) at 115%, Trough (facing away) at 78%
  // vFoldDepth ranges -1 to 1: positive = peak, negative = trough
  // Map to smooth gradient from 0.78 to 1.15
  float foldT = (vFoldDepth + 1.0) * 0.5; // 0 = trough, 1 = peak
  float foldLight = mix(0.78, 1.15, smoothstep(0.0, 1.0, foldT));

  // Collapsed regions are darker/denser due to bunched fabric
  float collapseDarken = mix(1.0, 0.85, vLocalCollapse);
  foldLight *= collapseDarken;

  // Ambient occlusion in deep folds — stronger in collapsed regions
  float aoStrength = mix(0.06, 0.12, vLocalCollapse);
  float ao = 1.0 - pow(abs(vFoldDepth), 1.5) * aoStrength;
  foldLight *= ao;

  // Subtle edge highlights where fold surface curves toward viewer
  float edgeLight = abs(vFoldGradient) * 0.04;
  foldLight += edgeLight * smoothstep(0.3, 0.7, vFoldDepth);

  // Fold-type specific adjustments
  if (uFoldType == PENCILPLEAT) {
    float gatherDark = smoothstep(0.85, 1.0, vUv.y) * 0.08;
    foldLight -= gatherDark;
  }
  else if (uFoldType == PINCHPLEAT) {
    float pinchShadow = smoothstep(0.88, 1.0, vUv.y) * abs(vFoldDepth) * 0.10;
    foldLight -= pinchShadow;
  }
  else if (uFoldType == BOXPLEAT) {
    float creaseDark = (1.0 - smoothstep(0.0, 0.3, abs(vFoldGradient))) * 0.04;
    foldLight -= creaseDark;
  }

  colour *= clamp(foldLight, 0.68, 1.18);

  // Sheer fabric: warm backlit glow (reduced in collapsed regions)
  if (uIsSheer > 0.5) {
    vec3 warmGlow = colour + vec3(0.15, 0.12, 0.06);
    float glowStrength = (0.4 + (1.0 - abs(vFoldDepth)) * 0.3) * (1.0 - vLocalCollapse * 0.5);
    colour = mix(colour, warmGlow, glowStrength);
    float centerBright = smoothstep(0.2, 0.6, vUv.y) * smoothstep(0.9, 0.6, vUv.y);
    colour *= 1.0 + centerBright * 0.15 * (1.0 - vLocalCollapse);
  }

  // Micro-grain noise to break up flat CG look and simulate woven fabric texture
  float grain = fract(sin(dot(vUv * 500.0, vec2(127.1, 311.7))) * 43758.5453);
  colour += (grain - 0.5) * 0.015;

  gl_FragColor = vec4(colour, uOpacity);
}
`;

interface FoldConfig {
  frequency: number;
  amplitude: number;
  foldType: number;
}

const FOLD_CONFIGS: Record<string, FoldConfig> = {
  sfold: {
    frequency: 5.5,
    amplitude: 0.055,
    foldType: 0,
  },
  pencilpleat: {
    frequency: 6.0,
    amplitude: 0.035,
    foldType: 1,
  },
  pinchpleat: {
    frequency: 4.5,
    amplitude: 0.06,
    foldType: 2,
  },
  boxpleat: {
    frequency: 4.0,
    amplitude: 0.045,
    foldType: 3,
  },
};

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
  const containerRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLCanvasElement>(null);
  const threeRef = useRef<HTMLCanvasElement>(null);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const leftPanelRef = useRef<THREE.Mesh | null>(null);
  const rightPanelRef = useRef<THREE.Mesh | null>(null);
  const leftMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rightMaterialRef = useRef<THREE.ShaderMaterial | null>(null);

  const panelGeometryRef = useRef<{
    leftCentreX: number;
    rightCentreX: number;
    panelWidth: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const bgCanvas = bgRef.current;
      const threeCanvas = threeRef.current;
      if (!bgCanvas || !threeCanvas) return;

      const photo = await loadImage(photoUrl);
      if (cancelled) return;

      const W = photo.naturalWidth;
      const H = photo.naturalHeight;

      bgCanvas.width = W;
      bgCanvas.height = H;
      threeCanvas.width = W;
      threeCanvas.height = H;

      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        bgCtx.drawImage(photo, 0, 0);
      }

      const tlPx = { x: tl.x, y: H - tl.y };
      const trPx = { x: tr.x, y: H - tr.y };
      const blPx = { x: bl.x, y: H - bl.y };
      const brPx = { x: br.x, y: H - br.y };

      const windowLeft = Math.min(tlPx.x, blPx.x);
      const windowRight = Math.max(trPx.x, brPx.x);
      const windowTop = Math.max(tlPx.y, trPx.y);
      const windowBottom = Math.min(blPx.y, brPx.y);
      const windowWidth = windowRight - windowLeft;
      const windowHeight = windowTop - windowBottom;

      void mount;

      const gapWidth = windowWidth * 0.006;
      const panelWidth = (windowWidth - gapWidth) / 2;
      const panelHeight = windowHeight;

      const leftCentreX = windowLeft + panelWidth / 2;
      const rightCentreX = windowRight - panelWidth / 2;
      const centreY = windowBottom + panelHeight / 2;

      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        while (sceneRef.current.children.length > 0) {
          const obj = sceneRef.current.children[0];
          sceneRef.current.remove(obj);
          if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose();
          if ((obj as THREE.Mesh).material) {
            const mat = (obj as THREE.Mesh).material;
            if (Array.isArray(mat)) mat.forEach(m => m.dispose());
            else (mat as THREE.Material).dispose();
          }
        }
      }

      const renderer = new THREE.WebGLRenderer({
        canvas: threeCanvas,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(1);
      renderer.setSize(W, H, false);
      renderer.setClearColor(0x000000, 0);
      renderer.sortObjects = true;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.OrthographicCamera(0, W, H, 0, -1000, 1000);
      camera.position.set(0, 0, 100);
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      const foldConfig = FOLD_CONFIGS[foldType] || FOLD_CONFIGS.sfold;
      const rgb = hexToRgb(colour);
      const colourVec = new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255);

      const isSheer = fabricType === 'sheer';
      const opacity = isSheer ? 0.52 : 1.0;

      const foldAmpScaled = foldConfig.amplitude * panelWidth;

      const createPanelMaterial = (isLeftPanel: boolean) => {
        return new THREE.ShaderMaterial({
          uniforms: {
            uFoldFrequency: { value: foldConfig.frequency },
            uFoldAmplitude: { value: foldAmpScaled },
            uFoldType: { value: foldConfig.foldType },
            uColour: { value: colourVec },
            uOpacity: { value: opacity },
            uIsSheer: { value: isSheer ? 1.0 : 0.0 },
            uOpenness: { value: openness },
            uIsLeftPanel: { value: isLeftPanel ? 1.0 : 0.0 },
          },
          vertexShader: VERTEX_SHADER,
          fragmentShader: FRAGMENT_SHADER,
          transparent: true,
          depthWrite: !isSheer,
          side: THREE.DoubleSide,
        });
      };

      panelGeometryRef.current = { leftCentreX, rightCentreX, panelWidth };

      const leftGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight, 128, 256);
      const leftMaterial = createPanelMaterial(true);
      const leftPanel = new THREE.Mesh(leftGeometry, leftMaterial);
      const leftSlideOffset = panelWidth * 0.8 * openness;
      leftPanel.position.set(leftCentreX - leftSlideOffset, centreY, 0);
      scene.add(leftPanel);
      leftPanelRef.current = leftPanel;
      leftMaterialRef.current = leftMaterial;

      const rightGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight, 128, 256);
      const rightMaterial = createPanelMaterial(false);
      const rightPanel = new THREE.Mesh(rightGeometry, rightMaterial);
      const rightSlideOffset = panelWidth * 0.8 * openness;
      rightPanel.position.set(rightCentreX + rightSlideOffset, centreY, 0);
      scene.add(rightPanel);
      rightPanelRef.current = rightPanel;
      rightMaterialRef.current = rightMaterial;

      renderer.render(scene, camera);
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [photoUrl, canvasWidth, canvasHeight, tl, tr, br, bl, mount, foldType, colour, fabricType, openness]);

  useEffect(() => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    if (!leftMaterialRef.current || !rightMaterialRef.current) return;
    if (!leftPanelRef.current || !rightPanelRef.current) return;
    if (!panelGeometryRef.current) return;

    const { leftCentreX, rightCentreX, panelWidth } = panelGeometryRef.current;

    const foldConfig = FOLD_CONFIGS[foldType] || FOLD_CONFIGS.sfold;
    const rgb = hexToRgb(colour);
    const colourVec = new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    const isSheer = fabricType === 'sheer';
    const opacity = isSheer ? 0.52 : 1.0;

    [leftMaterialRef.current, rightMaterialRef.current].forEach((mat) => {
      mat.uniforms.uFoldFrequency.value = foldConfig.frequency;
      mat.uniforms.uFoldType.value = foldConfig.foldType;
      mat.uniforms.uColour.value = colourVec;
      mat.uniforms.uOpacity.value = opacity;
      mat.uniforms.uIsSheer.value = isSheer ? 1.0 : 0.0;
      mat.uniforms.uOpenness.value = openness;
      mat.transparent = true;
      mat.depthWrite = !isSheer;
      mat.needsUpdate = true;
    });

    const leftSlideOffset = panelWidth * 0.8 * openness;
    const rightSlideOffset = panelWidth * 0.8 * openness;
    leftPanelRef.current.position.x = leftCentreX - leftSlideOffset;
    rightPanelRef.current.position.x = rightCentreX + rightSlideOffset;

    rendererRef.current.render(sceneRef.current, cameraRef.current);
  }, [colour, openness, fabricType, foldType]);

  useEffect(() => {
    return () => {
      if (leftPanelRef.current) {
        leftPanelRef.current.geometry.dispose();
        (leftPanelRef.current.material as THREE.Material).dispose();
      }
      if (rightPanelRef.current) {
        rightPanelRef.current.geometry.dispose();
        (rightPanelRef.current.material as THREE.Material).dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);

  void hardwareColour;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={bgRef}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      />
      <canvas
        ref={threeRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 'auto',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
