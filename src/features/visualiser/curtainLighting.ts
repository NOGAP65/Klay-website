import * as THREE from 'three';
import { CURTAIN_SCREEN_SPACE_GLSL } from './curtainScreenSpace';

export interface CurtainLighting {
  shadowMap: THREE.Texture;
  shadowMatrix: THREE.Matrix4;
  densityMap: THREE.Texture;
  resize: (width: number, height: number) => void;
  render: () => void;
  dispose: () => void;
}

/** Shadow depth comes from the actual folded geometry. A separate additive
 * pass sums the optical path through every sheer layer, including return faces. */
export function createCurtainLighting(
  renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera,
  panels: THREE.Mesh[], projectionUniforms: Record<string, THREE.IUniform>, width: number, height: number,
  vertexShader: string, isSheer: boolean,
): CurtainLighting {
  const resolution = renderer.domElement.width > 1100 ? 1536 : 1024;
  const shadow = new THREE.WebGLRenderTarget(resolution, resolution);
  shadow.depthTexture = new THREE.DepthTexture(resolution, resolution, THREE.UnsignedIntType);
  // Resolve subpixel fold edges before sampling their transmission. A sharp
  // unsampled density pass over antialiased cloth produces dark comb lines.
  const density = new THREE.WebGLRenderTarget(renderer.domElement.width, renderer.domElement.height, {
    depthBuffer: false, samples: Math.min(4, renderer.capabilities.maxSamples),
  });
  const scale = Math.max(width, height);
  const light = new THREE.OrthographicCamera(-scale * 0.72, scale * 0.72, scale * 0.72, -scale * 0.72, 1, scale * 4);
  const target = new THREE.Vector3(width / 2, height / 2, 0);
  light.position.copy(target).add(new THREE.Vector3(-0.75, 0.45, 1).normalize().multiplyScalar(scale * 1.8));
  light.lookAt(target);
  light.updateMatrixWorld();
  const shadowMatrix = new THREE.Matrix4().set(0.5,0,0,0.5, 0,0.5,0,0.5, 0,0,0.5,0.5, 0,0,0,1)
    .multiply(light.projectionMatrix).multiply(light.matrixWorldInverse);
  const depthMaterial = new THREE.MeshDepthMaterial({ side: THREE.DoubleSide });
  const densityMaterial = new THREE.ShaderMaterial({
    uniforms: { ...projectionUniforms, uShadowMatrix:{value:shadowMatrix} },
    vertexShader,
    fragmentShader: `
      ${CURTAIN_SCREEN_SPACE_GLSL}
      varying vec3 vViewNormal;
      varying vec2 vUv;
      void main() {
        vec3 viewDirection = curtainViewDirection();
        float cosine = abs(dot(normalize(vViewNormal), viewDirection));
        // Open yarns scatter broadly rather than acting like a solid tinted
        // slab. Keep each layer's angular response bounded; real overlapping
        // surfaces, not a grazing singularity, make a gathered sheer opaque.
        float angularDensity = 1.0 + 0.18*pow(1.0-cosine,1.4);
        float hem = 1.0 - smoothstep(0.018, 0.024, vUv.y);
        float tape = smoothstep(0.965, 0.99, vUv.y);
        float path = (1.0 + hem * 0.65 + tape * 0.45) * angularDensity;
        gl_FragColor = vec4(vec3(path / 12.0), 1.0);
      }`,
    side:THREE.DoubleSide, depthTest:false, depthWrite:false,
    transparent:true, blending:THREE.AdditiveBlending,
  });
  return {
    shadowMap:shadow.depthTexture, shadowMatrix, densityMap:density.texture,
    resize: (w, h) => density.setSize(w, h),
    render() {
      const visibility = scene.children.map(object => object.visible);
      // Open-weave cloth does not cast an opaque shadow onto neighbouring
      // folds. Transmission handles its optical depth and saves a mobile pass.
      if (!isSheer) {
        scene.children.forEach(object => { if (object.renderOrder < 0) object.visible = false; });
        scene.overrideMaterial = depthMaterial;
        renderer.setRenderTarget(shadow);
        renderer.setClearColor(0xffffff, 1);
        renderer.clear();
        renderer.render(scene, light);
      }
      if (isSheer) {
        scene.children.forEach(object => { object.visible = panels.includes(object as THREE.Mesh); });
        scene.overrideMaterial = densityMaterial;
        renderer.setRenderTarget(density);
        renderer.setClearColor(0x000000, 0);
        renderer.clear();
        renderer.render(scene, camera);
      }
      scene.children.forEach((object, i) => { object.visible = visibility[i]; });
      scene.overrideMaterial = null;
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x000000, 0);
      renderer.render(scene, camera);
    },
    dispose() { shadow.dispose(); density.dispose(); depthMaterial.dispose(); densityMaterial.dispose(); },
  };
}
