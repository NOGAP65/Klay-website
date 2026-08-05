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

const VERTEX_SHADER_SFOLD = `
uniform float uFoldFrequency;
uniform float uFoldAmplitude;
uniform float uFoldPhase;
uniform float uOpenness;
uniform float uPanelSide; // -1 left, 1 right

varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vec3 pos = position;

  float wave = sin(uv.x * uFoldFrequency * 6.28318 + uFoldPhase) * uFoldAmplitude;

  float topWeight = 1.0 - uv.y;
  wave *= mix(0.3, 1.0, topWeight);
  wave *= (1.0 - uOpenness);

  pos.z += wave;

  float compress = mix(1.0, 0.15, uOpenness);
  float shift = (1.0 - compress) * 0.5 * uPanelSide;
  pos.x = pos.x * compress + shift;

  vDisplacement = wave;

  float dWave = cos(uv.x * uFoldFrequency * 6.28318 + uFoldPhase)
                * uFoldAmplitude * uFoldFrequency * 6.28318
                * mix(0.3, 1.0, topWeight) * (1.0 - uOpenness);
  vec3 tangent = normalize(vec3(1.0, 0.0, dWave));
  vNormal = normalize(cross(tangent, vec3(0.0, 1.0, 0.0)));

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const VERTEX_SHADER_BOXPLEAT = `
uniform float uFoldFrequency;
uniform float uFoldAmplitude;
uniform float uFoldPhase;
uniform float uOpenness;
uniform float uPanelSide;

varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vec3 pos = position;

  float foldPos = fract(uv.x * uFoldFrequency + uFoldPhase / 6.28318);
  float wave = (smoothstep(0.0, 0.3, foldPos) - smoothstep(0.5, 0.8, foldPos)) * 2.0 - 0.5;
  wave *= uFoldAmplitude;

  float topWeight = 1.0 - uv.y;
  wave *= mix(0.5, 1.0, topWeight);
  wave *= (1.0 - uOpenness);

  pos.z += wave;

  float compress = mix(1.0, 0.15, uOpenness);
  float shift = (1.0 - compress) * 0.5 * uPanelSide;
  pos.x = pos.x * compress + shift;

  vDisplacement = wave;
  vNormal = vec3(0.0, 0.0, 1.0);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAGMENT_SHADER = `
uniform vec3 uColour;
uniform float uOpacity;
uniform float uSheerGlow;
uniform float uHeadingDarken;

varying vec2 vUv;
varying float vDisplacement;
varying vec3 vNormal;

void main() {
  vec3 colour = uColour;

  float light = 1.0 + vDisplacement * 12.0;
  colour *= clamp(light, 0.7, 1.3);

  vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
  float diffuse = max(dot(vNormal, lightDir), 0.0) * 0.3 + 0.7;
  colour *= diffuse;

  colour = mix(colour, colour + vec3(0.12, 0.10, 0.06), uSheerGlow * 0.5);

  float headingMask = smoothstep(0.91, 1.0, vUv.y);
  colour *= mix(1.0, 1.0 - uHeadingDarken * 0.15, headingMask);

  gl_FragColor = vec4(colour, uOpacity);
}
`;

interface FoldConfig {
  frequency: number;
  amplitude: number;
  headingDarken: number;
  vertexShader: string;
}

const FOLD_CONFIGS: Record<string, FoldConfig> = {
  sfold: {
    frequency: 3.5,
    amplitude: 0.08,
    headingDarken: 0.0,
    vertexShader: VERTEX_SHADER_SFOLD,
  },
  pencilpleat: {
    frequency: 6.0,
    amplitude: 0.04,
    headingDarken: 1.0,
    vertexShader: VERTEX_SHADER_SFOLD,
  },
  pinchpleat: {
    frequency: 4.0,
    amplitude: 0.06,
    headingDarken: 0.5,
    vertexShader: VERTEX_SHADER_SFOLD,
  },
  boxpleat: {
    frequency: 4.0,
    amplitude: 0.05,
    headingDarken: 0.3,
    vertexShader: VERTEX_SHADER_BOXPLEAT,
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

      let windowLeft = tlPx.x;
      let windowRight = trPx.x;
      let windowTop = tlPx.y;
      const windowBottom = blPx.y;
      let windowWidth = windowRight - windowLeft;
      let windowHeight = windowTop - windowBottom;

      if (mount === 'ceiling') {
        const extendX = windowWidth * 0.12;
        windowLeft -= extendX;
        windowRight += extendX;
        windowWidth = windowRight - windowLeft;
        const extendY = windowHeight * 0.08;
        windowTop += extendY;
        windowHeight = windowTop - windowBottom;
      }

      const panelWidth = windowWidth / 2;
      const panelHeight = windowHeight;

      const leftCentreX = windowLeft + panelWidth / 2;
      const rightCentreX = windowLeft + panelWidth * 1.5;
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
      renderer.setSize(W, H);
      renderer.setClearColor(0x000000, 0);
      renderer.sortObjects = true;
      rendererRef.current = renderer;

      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.OrthographicCamera(0, W, H, 0, -1000, 1000);
      camera.position.set(0, 0, 100);
      cameraRef.current = camera;

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(1, -1, 1);
      scene.add(directionalLight);

      const foldConfig = FOLD_CONFIGS[foldType] || FOLD_CONFIGS.sfold;
      const rgb = hexToRgb(colour);
      const colourVec = new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255);

      const isSheer = fabricType === 'sheer';
      const opacity = isSheer ? 0.55 : 1.0;
      const sheerGlow = isSheer ? 1.0 : 0.0;

      const foldAmpScaled = foldConfig.amplitude * panelWidth;

      const createPanelMaterial = (panelSide: number, phaseOffset: number) => {
        return new THREE.ShaderMaterial({
          uniforms: {
            uFoldFrequency: { value: foldConfig.frequency },
            uFoldAmplitude: { value: foldAmpScaled },
            uFoldPhase: { value: phaseOffset },
            uOpenness: { value: openness },
            uPanelSide: { value: panelSide },
            uColour: { value: colourVec },
            uOpacity: { value: opacity },
            uSheerGlow: { value: sheerGlow },
            uHeadingDarken: { value: foldConfig.headingDarken },
          },
          vertexShader: foldConfig.vertexShader,
          fragmentShader: FRAGMENT_SHADER,
          transparent: true,
          depthWrite: !isSheer,
          side: THREE.DoubleSide,
        });
      };

      const leftGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight, 64, 128);
      const leftMaterial = createPanelMaterial(-1, 0);
      const leftPanel = new THREE.Mesh(leftGeometry, leftMaterial);
      leftPanel.position.set(leftCentreX, centreY, 0);
      scene.add(leftPanel);
      leftPanelRef.current = leftPanel;
      leftMaterialRef.current = leftMaterial;

      const rightGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight, 64, 128);
      const rightMaterial = createPanelMaterial(1, Math.PI);
      const rightPanel = new THREE.Mesh(rightGeometry, rightMaterial);
      rightPanel.position.set(rightCentreX, centreY, 0);
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

    const foldConfig = FOLD_CONFIGS[foldType] || FOLD_CONFIGS.sfold;
    const rgb = hexToRgb(colour);
    const colourVec = new THREE.Vector3(rgb.r / 255, rgb.g / 255, rgb.b / 255);
    const isSheer = fabricType === 'sheer';
    const opacity = isSheer ? 0.55 : 1.0;
    const sheerGlow = isSheer ? 1.0 : 0.0;

    [leftMaterialRef.current, rightMaterialRef.current].forEach((mat, i) => {
      mat.uniforms.uFoldFrequency.value = foldConfig.frequency;
      mat.uniforms.uOpenness.value = openness;
      mat.uniforms.uColour.value = colourVec;
      mat.uniforms.uOpacity.value = opacity;
      mat.uniforms.uSheerGlow.value = sheerGlow;
      mat.uniforms.uHeadingDarken.value = foldConfig.headingDarken;
      mat.uniforms.uFoldPhase.value = i === 0 ? 0 : Math.PI;
      mat.transparent = true;
      mat.depthWrite = !isSheer;
      mat.needsUpdate = true;
    });

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
  void br;

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
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
