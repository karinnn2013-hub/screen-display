import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const isHouseDetailPage = document.body.classList.contains('house-detail-page');

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('root').appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const roomEnvironmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.05).texture;
scene.environment = roomEnvironmentTexture;
scene.background = new THREE.Color(0xeef4fb);
scene.fog = null;

let detailSkybox = null;
let detailSkyboxFaces = null;
if (isHouseDetailPage) {
  const cubeTextureLoader = new THREE.CubeTextureLoader();
  const skyboxFacePaths = [
    './skybox/px.bmp',
    './skybox/nx.bmp',
    './skybox/py.bmp',
    './skybox/ny.bmp',
    './skybox/pz.bmp',
    './skybox/nz.bmp',
  ];
  detailSkybox = cubeTextureLoader.load(skyboxFacePaths);
  detailSkybox.colorSpace = THREE.SRGBColorSpace;
  const textureLoader = new THREE.TextureLoader();
  detailSkyboxFaces = skyboxFacePaths.map((path) => {
    const texture = textureLoader.load(path);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  });
  scene.background = new THREE.Color(0xeef4fb);
  scene.environment = detailSkybox;
}

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 5;
controls.maxDistance = 50;
controls.maxPolarAngle = Math.PI / 2.02;
controls.addEventListener('start', () => {
  autoCamera.enabled = false;
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 10, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 50;
keyLight.shadow.camera.left = -20;
keyLight.shadow.camera.right = 20;
keyLight.shadow.camera.top = 20;
keyLight.shadow.camera.bottom = -20;
keyLight.shadow.bias = -0.0001;
keyLight.shadow.normalBias = 0.02;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x88aaff, 0.4);
fillLight.position.set(-5, 5, -5);

const rimLight = new THREE.DirectionalLight(0xaaddff, 0.8);
rimLight.position.set(0, 5, -10);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.6);

const interiorLight = new THREE.PointLight(0xfff1de, 0.18, 10, 2);
interiorLight.position.set(0, 1.6, 0);
scene.add(interiorLight);

const houseRoot = new THREE.Group();
scene.add(houseRoot);
let houseWrapper = null;
let houseModelRef = null;
let pvModelRef = null;
let treeModelRef = null;
let treeModelRef2 = null;
let treeModelRef3 = null;
let treeModelRef4 = null;
const tree3LeafMaterials = [];
let palmModelRef = null;
let palmModelRef2 = null;
let palmAccentLight = null;
let palmAccentLight2 = null;
let pvPositioned = false;
let treePositioned = false;
let tree2Positioned = false;
let tree3Positioned = false;
let tree4Positioned = false;
let palmPositioned = false;
let palm2Positioned = false;
const houseMeshes = [];
let selectedHouseMesh = null;
let houseHovered = false;
let houseSelected = false;
let pvHovered = false;
let pvSelected = false;
let houseSelectionLight = null;
let pvGlowMesh = null;
let gui = null;
let pvGuiBound = false;
let treeGuiBound = false;
let tree2GuiBound = false;
let tree3GuiBound = false;
let tree4GuiBound = false;
let palmGuiBound = false;
let palm2GuiBound = false;
let houseGuiBound = false;
let grassGuiBound = false;
let environmentGuiBound = false;
let cameraGuiBound = false;
let groundRadiusGuiBound = false;
let groundColorGuiBound = false;
let atmosphereColorGuiBound = false;
let housePartGuiBound = false;
let houseFolder = null;
let pvFolder = null;
let treeFolder = null;
let tree2Folder = null;
let tree3Folder = null;
let tree4Folder = null;
let palmFolder = null;
let palm2Folder = null;
let grassFolder = null;
let environmentFolder = null;
let cameraFolder = null;
let groundRadiusFolder = null;
let groundColorFolder = null;
let atmosphereColorFolder = null;
let housePartFolder = null;
let grassField = null;
let grassMaterial = null;
let grassNoiseTexture = null;
let grassDiffuseTexture = null;
let grassHeightTexture = null;
let skyboxMesh = null;
const houseStorageKey = 'house-detail-house-transform';
const pvStorageKey = 'house-detail-pv-transform';
const treeStorageKey = 'house-detail-tree-transform';
const tree2StorageKey = 'house-detail-tree-2-transform';
const tree3StorageKey = 'house-detail-tree-3-transform';
const tree4StorageKey = 'house-detail-tree-4-transform';
const palmStorageKey = 'house-detail-palm-transform';
const palm2StorageKey = 'house-detail-palm-2-transform';
const cameraStorageKey = 'house-detail-camera-transform';
const environmentStorageKey = 'house-detail-environment-transform';
const housePartStorageKey = 'house-detail-house-part-overrides';
const houseSavedTransform = {
  position: null,
  rotationY: null,
  scale: null,
};
const pvSavedTransform = {
  position: null,
  rotation: null,
  scale: null,
};
const treeSavedTransform = {
  position: null,
  scale: null,
};
const tree2SavedTransform = {
  position: null,
  rotationY: null,
  scale: null,
};
const tree3SavedTransform = {
  position: null,
  rotationY: null,
  scale: null,
  leafColor: '#d8eead',
  leafOpacity: 0.82,
};
const tree4SavedTransform = {
  position: null,
  rotationY: null,
  scale: null,
};
const palmSavedTransform = {
  position: null,
  rotationY: null,
  scale: null,
};
const palm2SavedTransform = {
  position: null,
  rotationY: null,
  scale: null,
};
const houseFacingRotationY = Math.PI / 2 - 0.9;
const autoCamera = {
  enabled: false,
  target: new THREE.Vector3(),
  radius: 6,
  polar: 1.1,
  azimuth: -0.7,
  baseHeight: 0,
  introSweep: 1.2,
  introDuration: 2.8,
};

function createGrassGroundTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#789b4e';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 12000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const length = 3 + Math.random() * 8;
    const angle = Math.random() * Math.PI * 2;
    const hueShift = Math.random();
    const color = hueShift > 0.7
      ? 'rgba(156, 188, 102, 0.22)'
      : hueShift > 0.35
        ? 'rgba(123, 160, 77, 0.18)'
        : 'rgba(92, 122, 53, 0.18)';

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      x + Math.cos(angle) * length,
      y + Math.sin(angle) * length
    );
    ctx.stroke();
  }

  for (let i = 0; i < 24000; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const alpha = 0.04 + Math.random() * 0.06;
    const shade = 92 + Math.floor(Math.random() * 45);
    ctx.fillStyle = `rgba(${shade}, ${112 + Math.floor(Math.random() * 42)}, ${48 + Math.floor(Math.random() * 24)}, ${alpha})`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }

  for (let i = 0; i < 1800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 2 + Math.random() * 6;
    ctx.fillStyle = Math.random() > 0.5
      ? 'rgba(72, 98, 38, 0.12)'
      : 'rgba(176, 200, 108, 0.08)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const softNoise = ctx.createRadialGradient(size * 0.5, size * 0.5, size * 0.05, size * 0.5, size * 0.5, size * 0.7);
  softNoise.addColorStop(0, 'rgba(255,255,255,0.03)');
  softNoise.addColorStop(0.5, 'rgba(255,255,255,0.0)');
  softNoise.addColorStop(1, 'rgba(0,0,0,0.05)');
  ctx.fillStyle = softNoise;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(10, 10);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const grassGroundTexture = createGrassGroundTexture();
const grassOverlayTexture = new THREE.TextureLoader().load('./textures-grass-overlay.jpg');
grassOverlayTexture.wrapS = THREE.RepeatWrapping;
grassOverlayTexture.wrapT = THREE.RepeatWrapping;
grassOverlayTexture.repeat.set(20, 20);
grassOverlayTexture.colorSpace = THREE.SRGBColorSpace;
const groundMaterial = new THREE.MeshStandardMaterial({
  color: 0x6fae5a,
  map: grassGroundTexture,
  emissive: 0x000000,
  emissiveIntensity: 0.0,
  roughness: 0.98,
  metalness: 0.0,
  transparent: true,
  depthWrite: false,
});
groundMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uCenter = { value: new THREE.Vector3(0, 0, 0) };
  shader.uniforms.uInnerRadius = { value: 44.8 };
  shader.uniforms.uOuterRadius = { value: 51.52 };
  shader.uniforms.uGroundColor = { value: new THREE.Color(0x6fae5a) };
  shader.uniforms.uGroundHalfSize = { value: 56.0 };
  shader.uniforms.uSkyColor = { value: new THREE.Color(0xbfd5ff) };
  shader.uniforms.uGrassTex = { value: grassOverlayTexture };
  groundMaterial.userData.shader = shader;

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
    varying vec3 vWorldPosition;
    varying vec2 vGroundUv;`
  );

  shader.vertexShader = shader.vertexShader.replace(
    '#include <worldpos_vertex>',
    `#include <worldpos_vertex>
    vWorldPosition = worldPosition.xyz;
    vGroundUv = uv;`
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
    uniform vec3 uCenter;
    uniform float uInnerRadius;
    uniform float uOuterRadius;
    uniform vec3 uGroundColor;
    uniform float uGroundHalfSize;
    uniform vec3 uSkyColor;
    uniform sampler2D uGrassTex;
    varying vec3 vWorldPosition;
    varying vec2 vGroundUv;`
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <output_fragment>',
    `
    float radialDist = length(vWorldPosition.xz - uCenter.xz);
    float radialFade = smoothstep(uInnerRadius, uOuterRadius, radialDist);
    float uvEdgeDistance = min(min(vGroundUv.x, 1.0 - vGroundUv.x), min(vGroundUv.y, 1.0 - vGroundUv.y));
    float edgeFade = 1.0 - smoothstep(0.0, 0.18, uvEdgeDistance);
    vec2 tiledUv = fract(vGroundUv * 20.0);
    vec2 croppedUv = tiledUv * 0.82 + 0.09;
    vec3 texColor = texture2D(uGrassTex, croppedUv).rgb;
    vec3 radialColor = mix(uGroundColor, uSkyColor, radialFade);
    vec3 screenGround = 1.0 - (1.0 - outgoingLight) * (1.0 - texColor);
    vec3 screenRadial = 1.0 - (1.0 - radialColor) * (1.0 - texColor);
    vec3 texturedGround = mix(outgoingLight, screenGround, 0.42);
    vec3 texturedRadial = mix(radialColor, screenRadial, 0.35);
    float edgeBlend = clamp(edgeFade * 0.65, 0.0, 1.0);
    outgoingLight = mix(texturedGround, texturedRadial, radialFade);
    outgoingLight = mix(outgoingLight, uSkyColor, edgeBlend);
    diffuseColor.a *= (1.0 - edgeFade * 0.92);
    #include <output_fragment>
    `
  );
};
groundMaterial.customProgramCacheKey = () => 'ground-distance-fade';

const groundPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(112, 112, 1, 1),
  groundMaterial
);
groundPlane.rotation.x = -Math.PI / 2;
groundPlane.position.y = -0.02;
groundPlane.castShadow = false;
groundPlane.receiveShadow = true;
groundPlane.renderOrder = 0;
scene.add(groundPlane);
grassGroundTexture.repeat.set(46, 46);

function createPulseTexture(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const gradient = ctx.createRadialGradient(center, center, size * 0.1, center, center, size * 0.5);
  gradient.addColorStop(0, 'rgba(120, 215, 255, 0.18)');
  gradient.addColorStop(0.35, 'rgba(110, 205, 255, 0.10)');
  gradient.addColorStop(0.68, 'rgba(80, 175, 255, 0.045)');
  gradient.addColorStop(1, 'rgba(80, 175, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const pulseTexture = createPulseTexture();

const pulseField = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 96),
  new THREE.MeshBasicMaterial({
    map: pulseTexture,
    color: 0x78d7ff,
    transparent: true,
    opacity: 0.09,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
);
pulseField.rotation.x = -Math.PI / 2;
pulseField.position.y = 0.02;
scene.add(pulseField);

const pulseWaves = Array.from({ length: 2 }, (_, index) => {
  const wave = new THREE.Mesh(
    new THREE.RingGeometry(0.82, 1.0, 96),
    new THREE.MeshBasicMaterial({
      color: 0x86dcff,
      transparent: true,
      opacity: 0.05,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  wave.rotation.x = -Math.PI / 2;
  wave.position.y = 0.021 + index * 0.001;
  wave.userData.phase = index * 0.5;
  scene.add(wave);
  return wave;
});

const detailMaterials = [];
const houseInteractiveMaterials = [];
const modeLabel = document.getElementById('mode-label');
const modeButton = document.getElementById('mode-button');
if (isHouseDetailPage && modeButton) {
  modeButton.style.display = 'none';
}
if (isHouseDetailPage && modeLabel) {
  modeLabel.textContent = 'Day';
}
const cameraControls = {
  posX: 0,
  posY: 5,
  posZ: 15,
  fov: 35,
  zoom: 1,
  targetX: 0,
  targetY: 0,
  targetZ: 0,
  radius: 6,
  height: 1.15,
  azimuth: -0.7,
  introSweep: 1.2,
  autoAnimate: true,
  log() {
    saveCameraTransformToStorage();
    const snippet = `const cameraControls = {
  posX: ${camera.position.x.toFixed(3)},
  posY: ${camera.position.y.toFixed(3)},
  posZ: ${camera.position.z.toFixed(3)},
  fov: ${camera.fov.toFixed(3)},
  zoom: ${camera.zoom.toFixed(3)},
  targetX: ${controls.target.x.toFixed(3)},
  targetY: ${controls.target.y.toFixed(3)},
  targetZ: ${controls.target.z.toFixed(3)},
  radius: ${autoCamera.radius.toFixed(3)},
  height: ${autoCamera.baseHeight.toFixed(3)},
  azimuth: ${autoCamera.azimuth.toFixed(3)},
  introSweep: ${autoCamera.introSweep.toFixed(3)},
  autoAnimate: ${autoCamera.enabled},
};`;
    console.log('Paste this into house-detail.js to save the camera permanently:\n' + snippet);
  },
};
const environmentControls = {
  groundSize: 56,
  innerRadiusScale: 0.8,
  outerRadiusScale: 0.92,
  groundColor: '#6fae5a',
  skyboxX: 0,
  skyboxY: 0,
  skyboxZ: 0,
  skyboxScale: 120,
  log() {
    syncEnvironmentFromScene();
    saveEnvironmentToStorage();
    const snippet = `const environmentControls = {
  groundSize: ${environmentControls.groundSize.toFixed(2)},
  innerRadiusScale: ${environmentControls.innerRadiusScale.toFixed(3)},
  outerRadiusScale: ${environmentControls.outerRadiusScale.toFixed(3)},
  groundColor: '${environmentControls.groundColor}',
  skyboxX: ${environmentControls.skyboxX.toFixed(2)},
  skyboxY: ${environmentControls.skyboxY.toFixed(2)},
  skyboxZ: ${environmentControls.skyboxZ.toFixed(2)},
  skyboxScale: ${environmentControls.skyboxScale.toFixed(2)},
};`;
    console.log('Paste this into house-detail.js to save the environment permanently:\n' + snippet);
  },
};
const groundRadiusControls = {
  log() {
    syncEnvironmentFromScene();
    saveEnvironmentToStorage();
    const snippet = `const groundRadiusControls = {
  innerRadiusScale: ${environmentControls.innerRadiusScale.toFixed(3)},
  outerRadiusScale: ${environmentControls.outerRadiusScale.toFixed(3)},
};`;
    console.log('Paste this into house-detail.js to save the ground radius permanently:\n' + snippet);
  },
};
const groundColorControls = {
  log() {
    syncEnvironmentFromScene();
    saveEnvironmentToStorage();
    const snippet = `const groundColorControls = {
  groundColor: '${environmentControls.groundColor}',
};`;
    console.log('Paste this into house-detail.js to save the ground color permanently:\n' + snippet);
  },
};
const atmosphereColorControls = {
  daySkyboxTint: '#ffffff',
  sunsetSkyboxTint: '#ffc29b',
  nightSkyboxTint: '#050510',
  dayGroundColor: '#444444',
  sunsetGroundColor: '#333333',
  nightGroundColor: '#111111',
  log() {
    saveEnvironmentToStorage();
    const snippet = `const atmosphereColorControls = {
  daySkyboxTint: '${atmosphereColorControls.daySkyboxTint}',
  sunsetSkyboxTint: '${atmosphereColorControls.sunsetSkyboxTint}',
  nightSkyboxTint: '${atmosphereColorControls.nightSkyboxTint}',
  dayGroundColor: '${atmosphereColorControls.dayGroundColor}',
  sunsetGroundColor: '${atmosphereColorControls.sunsetGroundColor}',
  nightGroundColor: '${atmosphereColorControls.nightGroundColor}',
};`;
    console.log('Paste this into house-detail.js to save the atmosphere colors permanently:\n' + snippet);
  },
};

function syncEnvironmentFromScene() {
  environmentControls.groundSize = groundPlane.scale.x * 56;
  environmentControls.groundColor = `#${groundMaterial.color.getHexString()}`;

  if (skyboxMesh) {
    environmentControls.skyboxX = skyboxMesh.position.x;
    environmentControls.skyboxY = skyboxMesh.position.y;
    environmentControls.skyboxZ = skyboxMesh.position.z;
    environmentControls.skyboxScale = skyboxMesh.scale.x;
  }
}

function saveEnvironmentToStorage() {
  if (!isHouseDetailPage) {
    return;
  }

  syncEnvironmentFromScene();
  window.localStorage.setItem(environmentStorageKey, JSON.stringify({
    groundSize: environmentControls.groundSize,
    innerRadiusScale: environmentControls.innerRadiusScale,
    outerRadiusScale: environmentControls.outerRadiusScale,
    groundColor: environmentControls.groundColor,
    daySkyboxTint: atmosphereColorControls.daySkyboxTint,
    sunsetSkyboxTint: atmosphereColorControls.sunsetSkyboxTint,
    nightSkyboxTint: atmosphereColorControls.nightSkyboxTint,
    dayGroundColor: atmosphereColorControls.dayGroundColor,
    sunsetGroundColor: atmosphereColorControls.sunsetGroundColor,
    nightGroundColor: atmosphereColorControls.nightGroundColor,
    skyboxX: environmentControls.skyboxX,
    skyboxY: environmentControls.skyboxY,
    skyboxZ: environmentControls.skyboxZ,
    skyboxScale: environmentControls.skyboxScale,
  }));
}

function loadEnvironmentFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(environmentStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved environment settings:', error);
    return null;
  }
}

const savedEnvironment = loadEnvironmentFromStorage();
if (savedEnvironment) {
  if (savedEnvironment.groundSize != null) {
    environmentControls.groundSize = savedEnvironment.groundSize;
  }
  if (savedEnvironment.innerRadiusScale != null) {
    environmentControls.innerRadiusScale = savedEnvironment.innerRadiusScale;
  }
  if (savedEnvironment.outerRadiusScale != null) {
    environmentControls.outerRadiusScale = savedEnvironment.outerRadiusScale;
  }
  if (savedEnvironment.groundColor != null) {
    environmentControls.groundColor = savedEnvironment.groundColor;
  }
  if (savedEnvironment.daySkyboxTint != null) {
    atmosphereColorControls.daySkyboxTint = savedEnvironment.daySkyboxTint;
  }
  if (savedEnvironment.sunsetSkyboxTint != null) {
    atmosphereColorControls.sunsetSkyboxTint = savedEnvironment.sunsetSkyboxTint;
  }
  if (savedEnvironment.nightSkyboxTint != null) {
    atmosphereColorControls.nightSkyboxTint = savedEnvironment.nightSkyboxTint;
  }
  if (savedEnvironment.dayGroundColor != null) {
    atmosphereColorControls.dayGroundColor = savedEnvironment.dayGroundColor;
  }
  if (savedEnvironment.sunsetGroundColor != null) {
    atmosphereColorControls.sunsetGroundColor = savedEnvironment.sunsetGroundColor;
  }
  if (savedEnvironment.nightGroundColor != null) {
    atmosphereColorControls.nightGroundColor = savedEnvironment.nightGroundColor;
  }
  if (savedEnvironment.skyboxX != null) {
    environmentControls.skyboxX = savedEnvironment.skyboxX;
  }
  if (savedEnvironment.skyboxY != null) {
    environmentControls.skyboxY = savedEnvironment.skyboxY;
  }
  if (savedEnvironment.skyboxZ != null) {
    environmentControls.skyboxZ = savedEnvironment.skyboxZ;
  }
  if (savedEnvironment.skyboxScale != null) {
    environmentControls.skyboxScale = savedEnvironment.skyboxScale;
  }
}

const grassControls = {
  density: 3200,
  patchSize: 8.6,
  windSpeed: 0.9,
  bladeHeight: 1.0,
  bladeWidth: 0.14,
};

function exportTransform(object, name = 'model') {
  if (!object) {
    console.warn(`exportTransform: "${name}" is not available yet.`);
    return '';
  }

  const p = object.position;
  const r = object.rotation;
  const s = object.scale;
  const snippet = `// ===== COPY THIS INTO YOUR SOURCE CODE =====

${name}.position.set(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)});
${name}.rotation.set(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)});
${name}.scale.set(${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)});`;

  console.log(snippet);
  return snippet;
}

function saveAndExportTransform(object, name, saveTransform) {
  if (!object) {
    console.warn(`saveAndExportTransform: "${name}" is not available yet.`);
    return '';
  }

  if (typeof saveTransform === 'function') {
    saveTransform();
  }

  return exportTransform(object, name);
}

function exposeTransformTarget(name, object) {
  if (typeof window === 'undefined') {
    return;
  }

  window[name] = object;
}

if (typeof window !== 'undefined') {
  window.exportTransform = exportTransform;
}

const houseControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotY: houseFacingRotationY,
  scale: 1,
  log() {
    return saveAndExportTransform(houseWrapper, 'houseWrapper', saveHouseTransformToStorage);
  },
};
const housePartControllers = [];
const housePartControls = {
  material: 'white',
  opacity: 1.0,
  concreteColor: '#d7d3cc',
  log() {
    saveHousePartOverridesToStorage();
    const overrides = buildHousePartOverrideMap();
    const snippet = `const housePartSavedOverrides = ${JSON.stringify(overrides, null, 2)};`;
    console.log('Paste this into house-detail.js to save the house part overrides permanently:\n' + snippet);
  },
};

function createConcreteTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#c9c9c4';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2600; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const radius = Math.random() * 1.6 + 0.15;
    const tone = 188 + Math.floor(Math.random() * 42);
    ctx.fillStyle = `rgba(${tone}, ${tone - 2}, ${tone - 6}, ${0.08 + Math.random() * 0.16})`;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < 180; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = Math.random() * 18 + 8;
    const h = Math.random() * 1.2 + 0.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((Math.random() - 0.5) * Math.PI);
    ctx.fillStyle = `rgba(110, 108, 103, ${0.045 + Math.random() * 0.06})`;
    ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1.6, 1.6);
  texture.needsUpdate = true;
  return texture;
}

const concreteTexture = createConcreteTexture();
const pvControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(pvModelRef, 'pvModelRef', savePvTransformToStorage);
  },
};
const treeControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(treeModelRef, 'treeModelRef', saveTreeTransformToStorage);
  },
};
const tree2Controls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotY: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(treeModelRef2, 'treeModelRef2', saveTree2TransformToStorage);
  },
};
const tree3Controls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotY: 0,
  scale: 1,
  leafColor: '#d8eead',
  leafOpacity: 0.82,
  log() {
    return saveAndExportTransform(treeModelRef3, 'treeModelRef3', saveTree3TransformToStorage);
  },
};
const tree4Controls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotY: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(treeModelRef4, 'treeModelRef4', saveTree4TransformToStorage);
  },
};
const palmControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotY: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(palmModelRef, 'palmModelRef', savePalmTransformToStorage);
  },
};
const palm2Controls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotY: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(palmModelRef2, 'palmModelRef2', savePalm2TransformToStorage);
  },
};

if (isHouseDetailPage && window.dat) {
  gui = new window.dat.GUI({ name: 'PV Controls' });
}

function refreshGui(guiNode = gui) {
  if (!guiNode) {
    return;
  }

  const controllers = guiNode.__controllers || [];
  controllers.forEach((controller) => {
    if (typeof controller.updateDisplay === 'function') {
      controller.updateDisplay();
    }
  });

  const folders = guiNode.__folders || {};
  Object.values(folders).forEach((folder) => refreshGui(folder));
}


function createSolidTexture(color) {
  const data = new Uint8Array([
    color.r * 255,
    color.g * 255,
    color.b * 255,
    255,
  ]);
  const texture = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGrassNoiseTexture(size = 128) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(size, size);

  for (let i = 0; i < imageData.data.length; i += 4) {
    const noise = 120 + Math.floor(Math.random() * 120);
    imageData.data[i] = noise;
    imageData.data[i + 1] = noise;
    imageData.data[i + 2] = noise;
    imageData.data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipMapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

const grassVertexShader = `
  attribute vec3 aBladeOrigin;
  attribute vec3 aYaw;
  attribute float aBladeHeight;
  attribute float aColorMix;

  uniform float uTime;
  uniform vec3 uPlayerPosition;
  uniform float uPatchSize;
  uniform sampler2D uHeightMap;
  uniform sampler2D uNoiseTexture;
  uniform sampler2D uDiffuseMap;
  uniform vec3 uBoundingBoxMin;
  uniform vec3 uBoundingBoxMax;
  uniform float uBladeWidth;
  uniform float uMaxBladeHeight;
  uniform float uWindSpeed;
  uniform vec3 uWindDirection;

  varying vec2 vUv;
  varying float vShade;
  varying float vHeightMix;
  varying float vColorMix;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vHeightMix = uv.y;
    vColorMix = aColorMix;

    vec3 transformed = position;
    transformed.x *= uBladeWidth;
    transformed.y *= aBladeHeight * uMaxBladeHeight;

    vec2 windDir = normalize(vec2(uWindDirection.x, uWindDirection.z) + vec2(0.0001));
    vec2 noiseUv = (aBladeOrigin.xz / max(uPatchSize, 0.001)) * 0.32;
    noiseUv += windDir * (uTime * uWindSpeed * 0.045);
    float noise = texture2D(uNoiseTexture, fract(noiseUv + vec2(aColorMix * 0.17, aBladeHeight * 0.11))).r;

    float swayPhase = uTime * (0.85 + uWindSpeed) + dot(aBladeOrigin.xz, windDir) * 0.42 + noise * 6.2831;
    float bend = uv.y * uv.y;
    float swayX = sin(swayPhase) * (0.035 + noise * 0.085);
    float swayZ = cos(swayPhase * 0.8) * (0.02 + noise * 0.045);

    transformed.x += swayX * bend;
    transformed.z += swayZ * bend;

    vec2 yawDir = normalize(vec2(aYaw.x, aYaw.z) + vec2(0.0001));
    mat2 yawRotation = mat2(yawDir.x, -yawDir.y, yawDir.y, yawDir.x);
    transformed.xz = yawRotation * transformed.xz;

    vec3 localPosition = transformed + aBladeOrigin;
    vec4 worldPosition = modelMatrix * instanceMatrix * vec4(localPosition, 1.0);
    vWorldPosition = worldPosition.xyz;

    vShade = 0.58 + bend * 0.38 + noise * 0.08;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const grassFragmentShader = `
  uniform sampler2D uDiffuseMap;
  uniform vec3 uSkyColor;
  uniform float uFadeStart;
  uniform float uFadeEnd;

  varying vec2 vUv;
  varying float vShade;
  varying float vHeightMix;
  varying float vColorMix;
  varying vec3 vWorldPosition;

  void main() {
    float centerFalloff = abs(vUv.x - 0.5) * 2.0;
    float bladeShape = smoothstep(1.0, 0.16, centerFalloff + (1.0 - vHeightMix) * 0.2);

    vec3 rootColor = mix(vec3(0.26, 0.44, 0.20), vec3(0.34, 0.56, 0.24), vColorMix);
    vec3 tipColor = mix(vec3(0.56, 0.74, 0.34), vec3(0.70, 0.84, 0.44), vColorMix);
    vec3 color = mix(rootColor, tipColor, smoothstep(0.08, 1.0, vHeightMix));
    color *= vShade;

    float dist = length(vWorldPosition - cameraPosition);
    float fade = smoothstep(uFadeStart, uFadeEnd, dist);
    vec3 finalColor = mix(color, uSkyColor, fade);
    float alpha = bladeShape * smoothstep(0.0, 0.06, vHeightMix) * 0.95;
    gl_FragColor = vec4(finalColor, alpha * (1.0 - fade));
  }
`;

const houseInfoPanel = document.createElement('div');
houseInfoPanel.innerHTML = `
  <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">Soloaris Living House</div>
  <div style="margin-top: 4px; font-size: 12px; letter-spacing: 0.04em; text-transform: none; opacity: 0.88;">光和未来居所</div>
`;
houseInfoPanel.style.cssText = `
  position: fixed;
  left: 0;
  top: 0;
  z-index: 25;
  padding: 10px 14px;
  color: rgba(206, 232, 255, 0.96);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgba(10, 22, 42, 0.78);
  border: 1px solid rgba(120, 196, 255, 0.28);
  border-radius: 14px;
  box-shadow: 0 0 22px rgba(80, 176, 255, 0.18), inset 0 0 18px rgba(120, 196, 255, 0.06);
  backdrop-filter: blur(10px);
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -120%);
  transition: opacity 160ms ease;
  white-space: nowrap;
`;

const pvInfoPanel = document.createElement('div');
pvInfoPanel.innerHTML = `
  <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">Photovoltaic Array</div>
  <div style="margin-top: 4px; font-size: 12px; letter-spacing: 0.04em; text-transform: none; opacity: 0.88;">光伏能量收集区</div>
`;
pvInfoPanel.style.cssText = `
  position: fixed;
  left: 0;
  top: 0;
  z-index: 25;
  padding: 10px 14px;
  color: rgba(206, 232, 255, 0.96);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: rgba(10, 22, 42, 0.78);
  border: 1px solid rgba(120, 196, 255, 0.28);
  border-radius: 14px;
  box-shadow: 0 0 22px rgba(80, 176, 255, 0.18), inset 0 0 18px rgba(120, 196, 255, 0.06);
  backdrop-filter: blur(10px);
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -120%);
  transition: opacity 160ms ease;
  white-space: nowrap;
`;
if (isHouseDetailPage) {
  document.body.appendChild(houseInfoPanel);
  document.body.appendChild(pvInfoPanel);
}

function applyDetailBaseline() {
  scene.background = new THREE.Color(0xeef4fb);
  scene.environment = detailSkybox || roomEnvironmentTexture;
  scene.environmentIntensity = 0.3;
  renderer.toneMappingExposure = 1.0;
  ambientLight.color.set(0xffffff);
  ambientLight.intensity = 0.2;
  keyLight.color.set(0xffffff);
  keyLight.intensity = 1.2;
  keyLight.position.set(5, 10, 5);
  interiorLight.intensity = 0.18;
  groundMaterial.map = grassGroundTexture;
  groundMaterial.color.set(0xffffff);
  groundMaterial.emissive.set(0x000000);
  groundMaterial.emissiveIntensity = 0.0;
  groundMaterial.roughness = 0.98;
  groundMaterial.metalness = 0.0;
  groundMaterial.needsUpdate = true;
  if (groundMaterial.userData.shader) {
    groundMaterial.userData.shader.uniforms.uGroundColor.value.set(0xffffff);
    groundMaterial.userData.shader.uniforms.uSkyColor.value.set(0xbfd5ff);
  }
  pulseField.material.opacity = 0.045;
  pulseWaves.forEach((wave) => {
    wave.material.opacity = 0.02;
  });
  detailMaterials.forEach((mat) => {
    mat.emissive.set(0x000000);
    mat.emissiveIntensity = 0.02;
    mat.opacity = 0.9;
    mat.reflectivity = 0.9;
    if ('envMapIntensity' in mat) {
      mat.envMapIntensity = 0.45;
    }
  });
  if (grassMaterial) {
    grassMaterial.uniforms.uSkyColor.value.set(0xbfd5ff);
  }
  if (palmAccentLight) palmAccentLight.intensity = 0.46;
  if (palmAccentLight2) palmAccentLight2.intensity = 0.42;
}

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
const detailTextureLoader = new THREE.TextureLoader();
let treeReferenceCanopyTexture = null;
detailTextureLoader.load('./models/tree_reference.png', (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  treeReferenceCanopyTexture = createTreeCanopyTexture(texture);
});

function tryPositionPvModel() {
  if (!isHouseDetailPage || pvPositioned || !houseModelRef || !pvModelRef) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const pvBox = new THREE.Box3().setFromObject(pvModelRef);
  const pvSize = pvBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const pvCenter = pvBox.getCenter(new THREE.Vector3());
  const spacing = 0.2;

  pvModelRef.position.y -= pvBox.min.y;
  pvModelRef.position.x += houseBox.min.x - pvSize.x / 2 - spacing - 2.4;
  pvModelRef.position.z += houseCenter.z - pvCenter.z - 2.4;

  pvPositioned = true;
}

function tryPositionTreeModel() {
  if (!isHouseDetailPage || treePositioned || !houseModelRef || !treeModelRef) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const treeBox = new THREE.Box3().setFromObject(treeModelRef);
  const treeSize = treeBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const houseSize = houseBox.getSize(new THREE.Vector3());
  const treeCenter = treeBox.getCenter(new THREE.Vector3());

  treeModelRef.position.y -= treeBox.min.y - groundPlane.position.y;
  treeModelRef.position.y += 0.02;
  treeModelRef.position.x += houseBox.max.x + treeSize.x * 0.35;
  treeModelRef.position.z += houseCenter.z + houseSize.z * 0.32 - treeCenter.z;

  treePositioned = true;
}

function tryPositionTreeModel2() {
  if (!isHouseDetailPage || tree2Positioned || !houseModelRef || !treeModelRef2) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const treeBox = new THREE.Box3().setFromObject(treeModelRef2);
  const treeSize = treeBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const houseSize = houseBox.getSize(new THREE.Vector3());
  const treeCenter = treeBox.getCenter(new THREE.Vector3());

  treeModelRef2.position.y -= treeBox.min.y - groundPlane.position.y;
  treeModelRef2.position.x += houseBox.min.x - treeSize.x * 0.9;
  treeModelRef2.position.z += houseCenter.z - houseSize.z * 0.44 - treeCenter.z;

  tree2Positioned = true;
}

function tryPositionPalmModel() {
  if (!isHouseDetailPage || palmPositioned || !houseModelRef || !palmModelRef) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const palmBox = new THREE.Box3().setFromObject(palmModelRef);
  const palmSize = palmBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const houseSize = houseBox.getSize(new THREE.Vector3());
  const palmCenter = palmBox.getCenter(new THREE.Vector3());

  palmModelRef.position.y -= palmBox.min.y - groundPlane.position.y;
  palmModelRef.position.y += 0.02;
  palmModelRef.position.x += houseBox.max.x + palmSize.x * 0.7;
  palmModelRef.position.z += houseCenter.z - houseSize.z * 0.58 - palmCenter.z;

  palmPositioned = true;
}

function tryPositionPalmModel2() {
  if (!isHouseDetailPage || palm2Positioned || !houseModelRef || !palmModelRef2) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const palmBox = new THREE.Box3().setFromObject(palmModelRef2);
  const palmSize = palmBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const houseSize = houseBox.getSize(new THREE.Vector3());
  const palmCenter = palmBox.getCenter(new THREE.Vector3());

  palmModelRef2.position.y -= palmBox.min.y - groundPlane.position.y;
  palmModelRef2.position.y += 0.02;
  palmModelRef2.position.x += houseBox.min.x - palmSize.x * 0.85;
  palmModelRef2.position.z += houseCenter.z + houseSize.z * 0.62 - palmCenter.z;

  palm2Positioned = true;
}

function tryPositionTreeModel3() {
  if (!isHouseDetailPage || tree3Positioned || !houseModelRef || !treeModelRef3) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const treeBox = new THREE.Box3().setFromObject(treeModelRef3);
  const treeSize = treeBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const houseSize = houseBox.getSize(new THREE.Vector3());
  const treeCenter = treeBox.getCenter(new THREE.Vector3());

  treeModelRef3.position.y -= treeBox.min.y - groundPlane.position.y;
  treeModelRef3.position.y += 0.02;
  treeModelRef3.position.x += houseBox.min.x - treeSize.x * 0.55;
  treeModelRef3.position.z += houseCenter.z - houseSize.z * 0.96 - treeCenter.z;

  tree3Positioned = true;
}

function tryPositionTreeModel4() {
  if (!isHouseDetailPage || tree4Positioned || !houseModelRef || !treeModelRef4) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const treeBox = new THREE.Box3().setFromObject(treeModelRef4);
  const treeSize = treeBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const houseSize = houseBox.getSize(new THREE.Vector3());
  const treeCenter = treeBox.getCenter(new THREE.Vector3());

  treeModelRef4.position.y -= treeBox.min.y - groundPlane.position.y;
  treeModelRef4.position.y += 0.02;
  treeModelRef4.position.x += houseBox.max.x + treeSize.x * 0.45;
  treeModelRef4.position.z += houseCenter.z - houseSize.z * 1.05 - treeCenter.z;

  tree4Positioned = true;
}

function updateHouseAnchors(updateCameraTarget = false) {
  if (!houseWrapper) {
    return;
  }

  const framedBox = new THREE.Box3().setFromObject(houseWrapper);
  const framedSize = framedBox.getSize(new THREE.Vector3());
  const framedCenter = framedBox.getCenter(new THREE.Vector3());
  if (groundMaterial.userData.shader) {
    groundMaterial.userData.shader.uniforms.uCenter.value.set(
      framedCenter.x,
      groundPlane.position.y,
      framedCenter.z
    );
  }

  interiorLight.position.set(
    framedCenter.x,
    framedCenter.y + framedSize.y * 0.18,
    framedCenter.z
  );
  if (houseSelectionLight) {
    houseSelectionLight.position.set(
      framedCenter.x,
      framedCenter.y + framedSize.y * 0.08,
      framedCenter.z
    );
    houseSelectionLight.distance = Math.max(framedSize.x, framedSize.y, framedSize.z) * 1.25;
  }
  groundPlane.position.y = framedBox.min.y - 0.015;
  pulseField.position.set(framedCenter.x, framedBox.min.y + 0.03, framedCenter.z);

  const pulseScale = Math.max(framedSize.x, framedSize.z) * 0.5;
  pulseField.scale.setScalar(pulseScale);
  pulseField.userData.baseScale = pulseScale;

  pulseWaves.forEach((wave) => {
    wave.position.set(framedCenter.x, framedBox.min.y + 0.031, framedCenter.z);
    wave.userData.baseScale = pulseScale * 0.65;
  });

  if (grassField && grassMaterial) {
    grassField.position.set(framedCenter.x, groundPlane.position.y, framedCenter.z);
    grassMaterial.uniforms.uPlayerPosition.value.copy(framedCenter);
    grassMaterial.uniforms.uBoundingBoxMin.value.set(
      framedCenter.x - grassControls.patchSize * 0.5,
      groundPlane.position.y,
      framedCenter.z - grassControls.patchSize * 0.5
    );
    grassMaterial.uniforms.uBoundingBoxMax.value.set(
      framedCenter.x + grassControls.patchSize * 0.5,
      groundPlane.position.y + grassControls.bladeHeight * 1.4,
      framedCenter.z + grassControls.patchSize * 0.5
    );
  }

  if (updateCameraTarget) {
    const distance = Math.max(framedSize.z * 2.1, framedSize.x * 1.2, 5.4);
    autoCamera.target.copy(framedCenter);
    autoCamera.radius = distance;
    autoCamera.baseHeight = Math.max(framedSize.y * 0.3, 1.15);
    controls.target.copy(framedCenter);
    camera.position.set(
      framedCenter.x + Math.sin(autoCamera.azimuth) * autoCamera.radius,
      framedCenter.y + autoCamera.baseHeight,
      framedCenter.z + Math.cos(autoCamera.azimuth) * autoCamera.radius
    );
    camera.lookAt(framedCenter);
  }
}

function createGrassMaterial() {
  if (!grassNoiseTexture) {
    grassNoiseTexture = createGrassNoiseTexture();
  }
  if (!grassDiffuseTexture) {
    grassDiffuseTexture = createSolidTexture(new THREE.Color(0x8bc56e));
  }
  if (!grassHeightTexture) {
    grassHeightTexture = createSolidTexture(new THREE.Color(0x000000));
  }

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPlayerPosition: { value: new THREE.Vector3() },
      uPatchSize: { value: grassControls.patchSize },
      uHeightMap: { value: grassHeightTexture },
      uNoiseTexture: { value: grassNoiseTexture },
      uDiffuseMap: { value: grassDiffuseTexture },
      uBoundingBoxMin: { value: new THREE.Vector3() },
      uBoundingBoxMax: { value: new THREE.Vector3() },
      uBladeWidth: { value: grassControls.bladeWidth },
      uMaxBladeHeight: { value: grassControls.bladeHeight },
      uWindSpeed: { value: grassControls.windSpeed },
      uWindDirection: { value: new THREE.Vector3(0.9, 0.0, 0.35).normalize() },
      uSkyColor: { value: new THREE.Color(0xbfd5ff) },
      uFadeStart: { value: 5.0 },
      uFadeEnd: { value: 14.0 },
    },
    vertexShader: grassVertexShader,
    fragmentShader: grassFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function disposeGrassField() {
  if (!grassField) {
    return;
  }

  scene.remove(grassField);
  grassField.geometry.dispose();
  grassField = null;
}

function generatePoissonGrassPositions(maxCount, radius, areaSize, exclusionRadius = 0) {
  const halfArea = areaSize * 0.5;
  const cellSize = radius / Math.sqrt(2);
  const gridWidth = Math.ceil(areaSize / cellSize);
  const gridHeight = Math.ceil(areaSize / cellSize);
  const grid = new Array(gridWidth * gridHeight).fill(null);
  const samples = [];
  const active = [];
  const k = 30;

  function toGrid(x, z) {
    return {
      gx: Math.floor((x + halfArea) / cellSize),
      gz: Math.floor((z + halfArea) / cellSize),
    };
  }

  function inBounds(x, z) {
    return x >= -halfArea && x <= halfArea && z >= -halfArea && z <= halfArea;
  }

  function isFarEnough(x, z) {
    if (!inBounds(x, z) || Math.hypot(x, z) < exclusionRadius) {
      return false;
    }

    const { gx, gz } = toGrid(x, z);
    if (gx < 0 || gz < 0 || gx >= gridWidth || gz >= gridHeight) {
      return false;
    }

    for (let ix = Math.max(0, gx - 2); ix <= Math.min(gridWidth - 1, gx + 2); ix++) {
      for (let iz = Math.max(0, gz - 2); iz <= Math.min(gridHeight - 1, gz + 2); iz++) {
        const neighbor = grid[ix + iz * gridWidth];
        if (!neighbor) {
          continue;
        }
        const dx = neighbor.x - x;
        const dz = neighbor.z - z;
        if (dx * dx + dz * dz < radius * radius) {
          return false;
        }
      }
    }

    return true;
  }

  function addSample(x, z) {
    const sample = { x, z };
    samples.push(sample);
    active.push(sample);
    const { gx, gz } = toGrid(x, z);
    grid[gx + gz * gridWidth] = sample;
  }

  let seedPoint = null;
  for (let i = 0; i < 40; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radialBias = Math.pow(Math.random(), 0.8);
    const radiusOffset = radialBias * (halfArea * 0.9);
    const x = Math.cos(angle) * radiusOffset;
    const z = Math.sin(angle) * radiusOffset;
    if (isFarEnough(x, z)) {
      seedPoint = { x, z };
      break;
    }
  }

  if (!seedPoint) {
    return samples;
  }

  addSample(seedPoint.x, seedPoint.z);

  while (active.length > 0 && samples.length < maxCount) {
    const activeIndex = Math.floor(Math.random() * active.length);
    const point = active[activeIndex];
    let found = false;

    for (let i = 0; i < k; i++) {
      const angle = Math.random() * Math.PI * 2;
      const candidateRadius = radius * (1 + Math.random());
      let x = point.x + Math.cos(angle) * candidateRadius;
      let z = point.z + Math.sin(angle) * candidateRadius;

      x += (Math.random() - 0.5) * 0.05;
      z += (Math.random() - 0.5) * 0.05;

      if (!isFarEnough(x, z)) {
        continue;
      }

      addSample(x, z);
      found = true;
      if (samples.length >= maxCount) {
        break;
      }
    }

    if (!found) {
      active.splice(activeIndex, 1);
    }
  }

  return samples;
}

function buildGrassField() {
  if (!isHouseDetailPage || !houseWrapper) {
    return;
  }

  disposeGrassField();
  return;

  if (!grassMaterial) {
    grassMaterial = createGrassMaterial();
  }

  const targetCount = Math.min(Math.max(Math.floor(grassControls.density), 2000), 5000);
  const bladeGeometry = new THREE.PlaneGeometry(0.22, 1.15, 1, 4);
  bladeGeometry.translate(0, 0.5, 0);

  const spawnArea = grassControls.patchSize * 0.9;
  const exclusionRadius = 1.85;
  const poissonRadius = Math.max(0.08, Math.min(0.24, spawnArea / Math.sqrt(targetCount) * 0.88));
  const positions = generatePoissonGrassPositions(targetCount, poissonRadius, spawnArea, exclusionRadius);
  const count = positions.length;

  const origins = new Float32Array(count * 3);
  const yaws = new Float32Array(count * 3);
  const heights = new Float32Array(count);
  const colorMixes = new Float32Array(count);
  const dummy = new THREE.Object3D();

  for (let i = 0; i < count; i++) {
    const { x, z } = positions[i];

    const yaw = Math.random() * Math.PI * 2;
    const height = THREE.MathUtils.lerp(0.78, 1.24, Math.random());

    origins[i * 3] = x;
    origins[i * 3 + 1] = 0.0;
    origins[i * 3 + 2] = z;

    yaws[i * 3] = Math.cos(yaw);
    yaws[i * 3 + 1] = 0.0;
    yaws[i * 3 + 2] = Math.sin(yaw);

    heights[i] = height;
    colorMixes[i] = Math.random();

    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
  }

  bladeGeometry.setAttribute('aBladeOrigin', new THREE.InstancedBufferAttribute(origins, 3));
  bladeGeometry.setAttribute('aYaw', new THREE.InstancedBufferAttribute(yaws, 3));
  bladeGeometry.setAttribute('aBladeHeight', new THREE.InstancedBufferAttribute(heights, 1));
  bladeGeometry.setAttribute('aColorMix', new THREE.InstancedBufferAttribute(colorMixes, 1));

  grassField = new THREE.InstancedMesh(bladeGeometry, grassMaterial, count);
  grassField.name = 'grassField';
  grassField.frustumCulled = false;

  for (let i = 0; i < count; i++) {
    grassField.setMatrixAt(i, dummy.matrix);
  }
  grassField.instanceMatrix.needsUpdate = true;

  scene.add(grassField);
  updateHouseAnchors();
}

function setupGrassGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!grassFolder) {
    grassFolder = gui.addFolder('Grass');
  }

  if (!grassGuiBound) {
    grassFolder.add(grassControls, 'windSpeed', 0.1, 2.5, 0.01).name('Wind Speed').onChange((value) => {
      if (grassMaterial) {
        grassMaterial.uniforms.uWindSpeed.value = value;
      }
    });
    grassFolder.add(grassControls, 'bladeHeight', 0.01, 1.8, 0.01).name('Blade Height').onChange((value) => {
      if (grassMaterial) {
        grassMaterial.uniforms.uMaxBladeHeight.value = value;
        updateHouseAnchors();
      }
    });
    grassFolder.add(grassControls, 'bladeWidth', 0.04, 0.16, 0.001).name('Blade Width').onChange((value) => {
      if (grassMaterial) {
        grassMaterial.uniforms.uBladeWidth.value = value;
      }
    });
    grassFolder.add(grassControls, 'patchSize', 8, 18, 0.1).name('Patch Size').onFinishChange(() => {
      if (houseWrapper) {
        if (grassMaterial) {
          grassMaterial.uniforms.uPatchSize.value = grassControls.patchSize;
        }
        buildGrassField();
      }
    });
    grassFolder.add(grassControls, 'density', 500, 1400000, 100).name('Density').onFinishChange(() => {
      if (houseWrapper) {
        buildGrassField();
      }
    });
    grassGuiBound = true;
  }

  refreshGui();
}

function updateGroundAppearance() {
  const scale = environmentControls.groundSize / 56;
  groundPlane.scale.setScalar(scale);
  const repeat = Math.max(16, environmentControls.groundSize * 0.82);
  grassGroundTexture.repeat.set(repeat, repeat);
  groundMaterial.color.set(environmentControls.groundColor);
  if (groundMaterial.userData.shader) {
    groundMaterial.userData.shader.uniforms.uGroundHalfSize.value = environmentControls.groundSize;
    groundMaterial.userData.shader.uniforms.uInnerRadius.value = environmentControls.groundSize * environmentControls.innerRadiusScale;
    groundMaterial.userData.shader.uniforms.uOuterRadius.value = environmentControls.groundSize * environmentControls.outerRadiusScale;
    groundMaterial.userData.shader.uniforms.uGroundColor.value.set(environmentControls.groundColor);
  }
}

function createSkyboxMesh() {
  if (!isHouseDetailPage || !detailSkyboxFaces || skyboxMesh) {
    return;
  }

  const materials = detailSkyboxFaces.map((texture) => new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
    toneMapped: false,
  }));

  skyboxMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials);
  skyboxMesh.name = 'detailSkyboxMesh';
  skyboxMesh.renderOrder = -1000;
  scene.add(skyboxMesh);
  updateSkyboxTransform();
}

function updateSkyboxTransform() {
  if (!skyboxMesh) {
    return;
  }

  skyboxMesh.position.set(
    environmentControls.skyboxX,
    environmentControls.skyboxY,
    environmentControls.skyboxZ
  );
  skyboxMesh.scale.setScalar(environmentControls.skyboxScale);
}

function syncCameraControls() {
  cameraControls.posX = camera.position.x;
  cameraControls.posY = camera.position.y;
  cameraControls.posZ = camera.position.z;
  cameraControls.fov = camera.fov;
  cameraControls.zoom = camera.zoom;
  cameraControls.targetX = controls.target.x;
  cameraControls.targetY = controls.target.y;
  cameraControls.targetZ = controls.target.z;
  cameraControls.radius = autoCamera.radius;
  cameraControls.height = autoCamera.baseHeight;
  cameraControls.azimuth = autoCamera.azimuth;
  cameraControls.introSweep = autoCamera.introSweep;
  cameraControls.autoAnimate = autoCamera.enabled;
}

function applyCameraControls() {
  camera.fov = cameraControls.fov;
  camera.zoom = cameraControls.zoom;
  camera.updateProjectionMatrix();
  autoCamera.enabled = cameraControls.autoAnimate;
  autoCamera.radius = cameraControls.radius;
  autoCamera.baseHeight = cameraControls.height;
  autoCamera.azimuth = cameraControls.azimuth;
  autoCamera.introSweep = cameraControls.introSweep;
  autoCamera.target.set(
    cameraControls.targetX,
    cameraControls.targetY,
    cameraControls.targetZ
  );
  controls.target.set(
    cameraControls.targetX,
    cameraControls.targetY,
    cameraControls.targetZ
  );

  if (!cameraControls.autoAnimate) {
    camera.position.set(
      cameraControls.posX,
      cameraControls.posY,
      cameraControls.posZ
    );
    camera.lookAt(controls.target);
  }
}

function setupEnvironmentGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!environmentFolder) {
    environmentFolder = gui.addFolder('Environment');
  }

  if (!environmentGuiBound) {
    environmentFolder.add(environmentControls, 'groundSize', 20, 140, 1).name('Ground Size').onChange(() => {
      updateGroundAppearance();
      saveEnvironmentToStorage();
    });
    environmentFolder.add(environmentControls, 'skyboxX', -80, 80, 0.1).name('Skybox X').onChange(() => {
      updateSkyboxTransform();
      saveEnvironmentToStorage();
    });
    environmentFolder.add(environmentControls, 'skyboxY', -80, 80, 0.1).name('Skybox Y').onChange(() => {
      updateSkyboxTransform();
      saveEnvironmentToStorage();
    });
    environmentFolder.add(environmentControls, 'skyboxZ', -80, 80, 0.1).name('Skybox Z').onChange(() => {
      updateSkyboxTransform();
      saveEnvironmentToStorage();
    });
    environmentFolder.add(environmentControls, 'skyboxScale', 40, 260, 1).name('Skybox Size').onChange(() => {
      updateSkyboxTransform();
      saveEnvironmentToStorage();
    });
    environmentFolder.add(environmentControls, 'log').name('Log Environment');
    environmentGuiBound = true;
  }

  refreshGui();
}

function setupGroundRadiusGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!groundRadiusFolder) {
    groundRadiusFolder = gui.addFolder('Ground Radius');
  }

  if (!groundRadiusGuiBound) {
    groundRadiusFolder.add(environmentControls, 'innerRadiusScale', 0.1, 1.5, 0.01).name('Inner Radius').onChange(() => {
      updateGroundAppearance();
      saveEnvironmentToStorage();
    });
    groundRadiusFolder.add(environmentControls, 'outerRadiusScale', 0.1, 4.0, 0.01).name('Outer Radius').onChange(() => {
      updateGroundAppearance();
      saveEnvironmentToStorage();
    });
    groundRadiusFolder.add(groundRadiusControls, 'log').name('Log Ground Radius');
    groundRadiusGuiBound = true;
  }

  refreshGui();
}

function setupGroundColorGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!groundColorFolder) {
    groundColorFolder = gui.addFolder('Ground Color');
  }

  if (!groundColorGuiBound) {
    groundColorFolder.addColor(environmentControls, 'groundColor').name('Base Color').onChange(() => {
      updateGroundAppearance();
      saveEnvironmentToStorage();
    });
    groundColorFolder.add(groundColorControls, 'log').name('Log Ground Color');
    groundColorGuiBound = true;
  }

  refreshGui();
}

function setupAtmosphereColorGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!atmosphereColorFolder) {
    atmosphereColorFolder = gui.addFolder('Atmosphere Colors');
  }

  if (!atmosphereColorGuiBound) {
    const onColorChange = () => {
      syncAtmospherePresetControls();
      saveEnvironmentToStorage();
    };

    atmosphereColorFolder.addColor(atmosphereColorControls, 'daySkyboxTint').name('Day Sky').onChange(onColorChange);
    atmosphereColorFolder.addColor(atmosphereColorControls, 'sunsetSkyboxTint').name('Sunset Sky').onChange(onColorChange);
    atmosphereColorFolder.addColor(atmosphereColorControls, 'nightSkyboxTint').name('Night Sky').onChange(onColorChange);
    atmosphereColorFolder.addColor(atmosphereColorControls, 'dayGroundColor').name('Day Ground').onChange(onColorChange);
    atmosphereColorFolder.addColor(atmosphereColorControls, 'sunsetGroundColor').name('Sunset Ground').onChange(onColorChange);
    atmosphereColorFolder.addColor(atmosphereColorControls, 'nightGroundColor').name('Night Ground').onChange(onColorChange);
    atmosphereColorFolder.add(atmosphereColorControls, 'log').name('Log Colors');
    atmosphereColorGuiBound = true;
  }

  refreshGui();
}

function setupCameraGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  syncCameraControls();

  if (!cameraFolder) {
    cameraFolder = gui.addFolder('Camera');
  }

  if (!cameraGuiBound) {
    cameraFolder.add(cameraControls, 'autoAnimate').name('Auto Animate').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'posX', -40, 40, 0.01).name('Position X').onChange(() => {
      cameraControls.autoAnimate = false;
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'posY', -10, 30, 0.01).name('Position Y').onChange(() => {
      cameraControls.autoAnimate = false;
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'posZ', -40, 40, 0.01).name('Position Z').onChange(() => {
      cameraControls.autoAnimate = false;
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'fov', 10, 90, 0.1).name('Field Of View').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'zoom', 0.2, 3, 0.01).name('Zoom').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'targetX', -20, 20, 0.01).name('Target X').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'targetY', -10, 20, 0.01).name('Target Y').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'targetZ', -20, 20, 0.01).name('Target Z').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'radius', 1, 30, 0.01).name('Orbit Radius').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'height', 0.1, 15, 0.01).name('Orbit Height').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'azimuth', -Math.PI * 2, Math.PI * 2, 0.01).name('Azimuth').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'introSweep', 0, 3, 0.01).name('Intro Sweep').onChange(() => {
      applyCameraControls();
    });
    cameraFolder.add(cameraControls, 'log').name('Log Camera');
    cameraGuiBound = true;
  }

  refreshGui();
}

function saveCameraTransformToStorage() {
  if (!isHouseDetailPage) {
    return;
  }

  syncCameraControls();
  window.localStorage.setItem(cameraStorageKey, JSON.stringify({
    posX: cameraControls.posX,
    posY: cameraControls.posY,
    posZ: cameraControls.posZ,
    fov: cameraControls.fov,
    zoom: cameraControls.zoom,
    targetX: cameraControls.targetX,
    targetY: cameraControls.targetY,
    targetZ: cameraControls.targetZ,
    radius: cameraControls.radius,
    height: cameraControls.height,
    azimuth: cameraControls.azimuth,
    introSweep: cameraControls.introSweep,
    autoAnimate: cameraControls.autoAnimate,
  }));
}

function loadCameraTransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(cameraStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved camera transform:', error);
    return null;
  }
}

function applySavedCameraTransform() {
  const storedTransform = loadCameraTransformFromStorage();
  if (!storedTransform) {
    return;
  }

  cameraControls.posX = clampFinite(storedTransform.posX, cameraControls.posX, -200, 200);
  cameraControls.posY = clampFinite(storedTransform.posY, cameraControls.posY, -50, 100);
  cameraControls.posZ = clampFinite(storedTransform.posZ, cameraControls.posZ, -200, 200);
  cameraControls.fov = clampFinite(storedTransform.fov, cameraControls.fov, 10, 90);
  cameraControls.zoom = clampFinite(storedTransform.zoom, cameraControls.zoom, 0.2, 5);
  cameraControls.targetX = clampFinite(storedTransform.targetX, cameraControls.targetX, -100, 100);
  cameraControls.targetY = clampFinite(storedTransform.targetY, cameraControls.targetY, -100, 100);
  cameraControls.targetZ = clampFinite(storedTransform.targetZ, cameraControls.targetZ, -100, 100);
  cameraControls.radius = clampFinite(storedTransform.radius, cameraControls.radius, 0.1, 200);
  cameraControls.height = clampFinite(storedTransform.height, cameraControls.height, -50, 100);
  cameraControls.azimuth = clampFinite(storedTransform.azimuth, cameraControls.azimuth, -Math.PI * 8, Math.PI * 8);
  cameraControls.introSweep = clampFinite(storedTransform.introSweep, cameraControls.introSweep, 0, 10);
  cameraControls.autoAnimate = typeof storedTransform.autoAnimate === 'boolean'
    ? storedTransform.autoAnimate
    : cameraControls.autoAnimate;

  applyCameraControls();
}

function saveHouseTransformToStorage() {
  if (!isHouseDetailPage || !houseWrapper) {
    return;
  }

  const transform = {
    position: {
      x: houseWrapper.position.x,
      y: houseWrapper.position.y,
      z: houseWrapper.position.z,
    },
    rotationY: houseWrapper.rotation.y,
    scale: houseWrapper.scale.x,
  };

  window.localStorage.setItem(houseStorageKey, JSON.stringify(transform));
}

function loadHouseTransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(houseStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved house transform:', error);
    return null;
  }
}

function savePvTransformToStorage() {
  if (!isHouseDetailPage || !pvModelRef) {
    return;
  }

  const transform = {
    position: {
      x: pvModelRef.position.x,
      y: pvModelRef.position.y,
      z: pvModelRef.position.z,
    },
    rotation: {
      x: pvModelRef.rotation.x,
      y: pvModelRef.rotation.y,
      z: pvModelRef.rotation.z,
    },
    scale: pvModelRef.scale.x,
  };

  window.localStorage.setItem(pvStorageKey, JSON.stringify(transform));
}

function loadPvTransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(pvStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved PV transform:', error);
    return null;
  }
}

function saveTreeTransformToStorage() {
  if (!isHouseDetailPage || !treeModelRef) {
    return;
  }

  const transform = {
    position: {
      x: treeModelRef.position.x,
      y: treeModelRef.position.y,
      z: treeModelRef.position.z,
    },
    scale: treeModelRef.scale.x,
  };

  window.localStorage.setItem(treeStorageKey, JSON.stringify(transform));
}

function saveTree2TransformToStorage() {
  if (!isHouseDetailPage || !treeModelRef2) {
    return;
  }

  const transform = {
    position: {
      x: treeModelRef2.position.x,
      y: treeModelRef2.position.y,
      z: treeModelRef2.position.z,
    },
    rotationY: treeModelRef2.rotation.y,
    scale: treeModelRef2.scale.x,
  };

  window.localStorage.setItem(tree2StorageKey, JSON.stringify(transform));
}

function saveTree3TransformToStorage() {
  if (!isHouseDetailPage || !treeModelRef3) {
    return;
  }

  const transform = {
    position: {
      x: treeModelRef3.position.x,
      y: treeModelRef3.position.y,
      z: treeModelRef3.position.z,
    },
    rotationY: treeModelRef3.rotation.y,
    scale: treeModelRef3.scale.x,
    leafColor: tree3Controls.leafColor,
    leafOpacity: tree3Controls.leafOpacity,
  };

  window.localStorage.setItem(tree3StorageKey, JSON.stringify(transform));
}

function saveTree4TransformToStorage() {
  if (!isHouseDetailPage || !treeModelRef4) {
    return;
  }

  const transform = {
    position: {
      x: treeModelRef4.position.x,
      y: treeModelRef4.position.y,
      z: treeModelRef4.position.z,
    },
    rotationY: treeModelRef4.rotation.y,
    scale: treeModelRef4.scale.x,
  };

  window.localStorage.setItem(tree4StorageKey, JSON.stringify(transform));
}

function savePalmTransformToStorage() {
  if (!isHouseDetailPage || !palmModelRef) {
    return;
  }

  const transform = {
    position: {
      x: palmModelRef.position.x,
      y: palmModelRef.position.y,
      z: palmModelRef.position.z,
    },
    rotationY: palmModelRef.rotation.y,
    scale: palmModelRef.scale.x,
  };

  window.localStorage.setItem(palmStorageKey, JSON.stringify(transform));
}

function savePalm2TransformToStorage() {
  if (!isHouseDetailPage || !palmModelRef2) {
    return;
  }

  const transform = {
    position: {
      x: palmModelRef2.position.x,
      y: palmModelRef2.position.y,
      z: palmModelRef2.position.z,
    },
    rotationY: palmModelRef2.rotation.y,
    scale: palmModelRef2.scale.x,
  };

  window.localStorage.setItem(palm2StorageKey, JSON.stringify(transform));
}

function loadTreeTransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(treeStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved tree transform:', error);
    return null;
  }
}

function loadTree2TransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(tree2StorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved tree 2 transform:', error);
    return null;
  }
}

function loadPalmTransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(palmStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved palm transform:', error);
    return null;
  }
}

function loadTree3TransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(tree3StorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved tree 3 transform:', error);
    return null;
  }
}

function loadTree4TransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(tree4StorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved tree 4 transform:', error);
    return null;
  }
}

function loadPalm2TransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(palm2StorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved palm 2 transform:', error);
    return null;
  }
}

function clampFinite(value, fallback, min, max) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return THREE.MathUtils.clamp(value, min, max);
}

function applySavedHouseTransform() {
  if (!houseWrapper) {
    return;
  }

  const storedTransform = loadHouseTransformFromStorage();
  const activeTransform = storedTransform || houseSavedTransform;

  if (activeTransform.scale != null) {
    houseWrapper.scale.setScalar(clampFinite(activeTransform.scale, 1, 0.05, 20));
  }

  if (activeTransform.position) {
    houseWrapper.position.set(
      clampFinite(activeTransform.position.x, 0, -50, 50),
      clampFinite(activeTransform.position.y, 0, -20, 20),
      clampFinite(activeTransform.position.z, 0, -50, 50)
    );
  }

  houseWrapper.rotation.y = activeTransform.rotationY != null
    ? clampFinite(activeTransform.rotationY, houseFacingRotationY, -Math.PI * 8, Math.PI * 8)
    : houseFacingRotationY;
}

function applySavedPvTransform() {
  if (!pvModelRef) {
    return;
  }

  const storedTransform = loadPvTransformFromStorage();
  const activeTransform = storedTransform || pvSavedTransform;

  if (activeTransform.scale != null) {
    pvModelRef.scale.setScalar(clampFinite(activeTransform.scale, pvModelRef.scale.x, 0.01, 20));
  }

  if (activeTransform.rotation) {
    pvModelRef.rotation.set(
      clampFinite(activeTransform.rotation.x, 0, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.y, 0, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.z, 0, -Math.PI * 8, Math.PI * 8)
    );
  }

  if (activeTransform.position) {
    pvModelRef.position.set(
      clampFinite(activeTransform.position.x, pvModelRef.position.x, -50, 50),
      clampFinite(activeTransform.position.y, pvModelRef.position.y, -20, 20),
      clampFinite(activeTransform.position.z, pvModelRef.position.z, -50, 50)
    );
  }
}

function applySavedTreeTransform() {
  if (!treeModelRef) {
    return;
  }

  const storedTransform = loadTreeTransformFromStorage();
  const activeTransform = storedTransform || treeSavedTransform;

  if (activeTransform.scale != null) {
    treeModelRef.scale.setScalar(clampFinite(activeTransform.scale, treeModelRef.scale.x, 0.01, 20));
  }

  if (activeTransform.position) {
    treeModelRef.position.set(
      clampFinite(activeTransform.position.x, treeModelRef.position.x, -80, 80),
      clampFinite(activeTransform.position.y, treeModelRef.position.y, -20, 20),
      clampFinite(activeTransform.position.z, treeModelRef.position.z, -80, 80)
    );
  }
}

function applySavedTree2Transform() {
  if (!treeModelRef2) {
    return;
  }

  const storedTransform = loadTree2TransformFromStorage();
  const activeTransform = storedTransform || tree2SavedTransform;

  if (activeTransform.scale != null) {
    treeModelRef2.scale.setScalar(clampFinite(activeTransform.scale, treeModelRef2.scale.x, 0.01, 20));
  }

  if (activeTransform.position) {
    treeModelRef2.position.set(
      clampFinite(activeTransform.position.x, treeModelRef2.position.x, -80, 80),
      clampFinite(activeTransform.position.y, treeModelRef2.position.y, -20, 20),
      clampFinite(activeTransform.position.z, treeModelRef2.position.z, -80, 80)
    );
  }

  treeModelRef2.rotation.y = activeTransform.rotationY != null
    ? clampFinite(activeTransform.rotationY, treeModelRef2.rotation.y, -Math.PI * 8, Math.PI * 8)
    : treeModelRef2.rotation.y;
}

function applySavedTree3Transform() {
  if (!treeModelRef3) {
    return;
  }

  const storedTransform = loadTree3TransformFromStorage();
  const activeTransform = storedTransform || tree3SavedTransform;

  if (activeTransform.scale != null) {
    treeModelRef3.scale.setScalar(clampFinite(activeTransform.scale, treeModelRef3.scale.x, 0.01, 20));
  }

  if (activeTransform.position) {
    treeModelRef3.position.set(
      clampFinite(activeTransform.position.x, treeModelRef3.position.x, -80, 80),
      clampFinite(activeTransform.position.y, treeModelRef3.position.y, -20, 20),
      clampFinite(activeTransform.position.z, treeModelRef3.position.z, -80, 80)
    );
  }

  treeModelRef3.rotation.y = activeTransform.rotationY != null
    ? clampFinite(activeTransform.rotationY, treeModelRef3.rotation.y, -Math.PI * 8, Math.PI * 8)
    : treeModelRef3.rotation.y;

  tree3Controls.leafColor = typeof activeTransform.leafColor === 'string'
    ? activeTransform.leafColor
    : tree3SavedTransform.leafColor;
  tree3Controls.leafOpacity = clampFinite(
    activeTransform.leafOpacity,
    tree3SavedTransform.leafOpacity,
    0.2,
    1.0
  );
  applyTree3LeafOverlay();
}

function applySavedTree4Transform() {
  if (!treeModelRef4) {
    return;
  }

  const storedTransform = loadTree4TransformFromStorage();
  const activeTransform = storedTransform || tree4SavedTransform;

  if (activeTransform.scale != null) {
    treeModelRef4.scale.setScalar(clampFinite(activeTransform.scale, treeModelRef4.scale.x, 0.01, 20));
  }

  if (activeTransform.position) {
    treeModelRef4.position.set(
      clampFinite(activeTransform.position.x, treeModelRef4.position.x, -80, 80),
      clampFinite(activeTransform.position.y, treeModelRef4.position.y, -20, 20),
      clampFinite(activeTransform.position.z, treeModelRef4.position.z, -80, 80)
    );
  }

  treeModelRef4.rotation.y = activeTransform.rotationY != null
    ? clampFinite(activeTransform.rotationY, treeModelRef4.rotation.y, -Math.PI * 8, Math.PI * 8)
    : treeModelRef4.rotation.y;
}

function applySavedPalmTransform() {
  if (!palmModelRef) {
    return;
  }

  const storedTransform = loadPalmTransformFromStorage();
  const activeTransform = storedTransform || palmSavedTransform;

  if (activeTransform.scale != null) {
    palmModelRef.scale.setScalar(clampFinite(activeTransform.scale, palmModelRef.scale.x, 0.01, 20));
  }

  if (activeTransform.position) {
    palmModelRef.position.set(
      clampFinite(activeTransform.position.x, palmModelRef.position.x, -80, 80),
      clampFinite(activeTransform.position.y, palmModelRef.position.y, -20, 20),
      clampFinite(activeTransform.position.z, palmModelRef.position.z, -80, 80)
    );
  }

  palmModelRef.rotation.y = activeTransform.rotationY != null
    ? clampFinite(activeTransform.rotationY, palmModelRef.rotation.y, -Math.PI * 8, Math.PI * 8)
    : palmModelRef.rotation.y;
}

function applySavedPalm2Transform() {
  if (!palmModelRef2) {
    return;
  }

  const storedTransform = loadPalm2TransformFromStorage();
  const activeTransform = storedTransform || palm2SavedTransform;

  if (activeTransform.scale != null) {
    palmModelRef2.scale.setScalar(clampFinite(activeTransform.scale, palmModelRef2.scale.x, 0.01, 20));
  }

  if (activeTransform.position) {
    palmModelRef2.position.set(
      clampFinite(activeTransform.position.x, palmModelRef2.position.x, -80, 80),
      clampFinite(activeTransform.position.y, palmModelRef2.position.y, -20, 20),
      clampFinite(activeTransform.position.z, palmModelRef2.position.z, -80, 80)
    );
  }

  palmModelRef2.rotation.y = activeTransform.rotationY != null
    ? clampFinite(activeTransform.rotationY, palmModelRef2.rotation.y, -Math.PI * 8, Math.PI * 8)
    : palmModelRef2.rotation.y;
}

function syncHouseControls() {
  if (!houseWrapper) {
    return;
  }

  houseControls.posX = houseWrapper.position.x;
  houseControls.posY = houseWrapper.position.y;
  houseControls.posZ = houseWrapper.position.z;
  houseControls.rotY = houseWrapper.rotation.y;
  houseControls.scale = houseWrapper.scale.x;
}

function syncPvControls() {
  if (!pvModelRef) {
    return;
  }

  pvControls.posX = pvModelRef.position.x;
  pvControls.posY = pvModelRef.position.y;
  pvControls.posZ = pvModelRef.position.z;
  pvControls.rotX = pvModelRef.rotation.x;
  pvControls.rotY = pvModelRef.rotation.y;
  pvControls.rotZ = pvModelRef.rotation.z;
  pvControls.scale = pvModelRef.scale.x;
}

function syncTreeControls() {
  if (!treeModelRef) {
    return;
  }

  treeControls.posX = treeModelRef.position.x;
  treeControls.posY = treeModelRef.position.y;
  treeControls.posZ = treeModelRef.position.z;
  treeControls.scale = treeModelRef.scale.x;
}

function syncTree2Controls() {
  if (!treeModelRef2) {
    return;
  }

  tree2Controls.posX = treeModelRef2.position.x;
  tree2Controls.posY = treeModelRef2.position.y;
  tree2Controls.posZ = treeModelRef2.position.z;
  tree2Controls.rotY = treeModelRef2.rotation.y;
  tree2Controls.scale = treeModelRef2.scale.x;
}

function syncPalmControls() {
  if (!palmModelRef) {
    return;
  }

  palmControls.posX = palmModelRef.position.x;
  palmControls.posY = palmModelRef.position.y;
  palmControls.posZ = palmModelRef.position.z;
  palmControls.rotY = palmModelRef.rotation.y;
  palmControls.scale = palmModelRef.scale.x;
}

function syncPalm2Controls() {
  if (!palmModelRef2) {
    return;
  }

  palm2Controls.posX = palmModelRef2.position.x;
  palm2Controls.posY = palmModelRef2.position.y;
  palm2Controls.posZ = palmModelRef2.position.z;
  palm2Controls.rotY = palmModelRef2.rotation.y;
  palm2Controls.scale = palmModelRef2.scale.x;
}

function syncTree3Controls() {
  if (!treeModelRef3) {
    return;
  }

  tree3Controls.posX = treeModelRef3.position.x;
  tree3Controls.posY = treeModelRef3.position.y;
  tree3Controls.posZ = treeModelRef3.position.z;
  tree3Controls.rotY = treeModelRef3.rotation.y;
  tree3Controls.scale = treeModelRef3.scale.x;
  if (!tree3Controls.leafColor) {
    tree3Controls.leafColor = tree3SavedTransform.leafColor;
  }
  if (!Number.isFinite(tree3Controls.leafOpacity)) {
    tree3Controls.leafOpacity = tree3SavedTransform.leafOpacity;
  }
}

function syncTree4Controls() {
  if (!treeModelRef4) {
    return;
  }

  tree4Controls.posX = treeModelRef4.position.x;
  tree4Controls.posY = treeModelRef4.position.y;
  tree4Controls.posZ = treeModelRef4.position.z;
  tree4Controls.rotY = treeModelRef4.rotation.y;
  tree4Controls.scale = treeModelRef4.scale.x;
}

function setupHouseGui() {
  if (!isHouseDetailPage || !gui || !houseWrapper) {
    return;
  }

  syncHouseControls();

  if (!houseFolder) {
    houseFolder = gui.addFolder('House');
  }

  if (!houseGuiBound) {
    houseFolder.add(houseControls, 'posX', -10, 10, 0.01).name('Position X').onChange((value) => {
      houseWrapper.position.x = value;
      updateHouseAnchors();
      saveHouseTransformToStorage();
    });
    houseFolder.add(houseControls, 'posY', -5, 5, 0.01).name('Position Y').onChange((value) => {
      houseWrapper.position.y = value;
      updateHouseAnchors();
      saveHouseTransformToStorage();
    });
    houseFolder.add(houseControls, 'posZ', -10, 10, 0.01).name('Position Z').onChange((value) => {
      houseWrapper.position.z = value;
      updateHouseAnchors();
      saveHouseTransformToStorage();
    });
    houseFolder.add(houseControls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      houseWrapper.rotation.y = value;
      updateHouseAnchors();
      saveHouseTransformToStorage();
    });
    houseFolder.add(houseControls, 'scale', 0.1, 5, 0.01).name('Uniform Scale').onChange((value) => {
      houseWrapper.scale.setScalar(value);
      updateHouseAnchors();
      saveHouseTransformToStorage();
    });
    houseFolder.add(houseControls, 'log').name('Save Transform');
    houseGuiBound = true;
  }

  refreshGui();
}

function setupPvGui() {
  if (!isHouseDetailPage || !gui || !pvModelRef) {
    return;
  }

  syncPvControls();

  if (!pvFolder) {
    pvFolder = gui.addFolder('PV Board');
  }

  if (!pvGuiBound) {
    pvFolder.add(pvControls, 'posX', -10, 10, 0.01).name('Position X').onChange((value) => {
      pvModelRef.position.x = value;
      savePvTransformToStorage();
    });
    pvFolder.add(pvControls, 'posY', -5, 5, 0.01).name('Position Y').onChange((value) => {
      pvModelRef.position.y = value;
      savePvTransformToStorage();
    });
    pvFolder.add(pvControls, 'posZ', -10, 10, 0.01).name('Position Z').onChange((value) => {
      pvModelRef.position.z = value;
      savePvTransformToStorage();
    });
    pvFolder.add(pvControls, 'rotX', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation X').onChange((value) => {
      pvModelRef.rotation.x = value;
      savePvTransformToStorage();
    });
    pvFolder.add(pvControls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      pvModelRef.rotation.y = value;
      savePvTransformToStorage();
    });
    pvFolder.add(pvControls, 'rotZ', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Z').onChange((value) => {
      pvModelRef.rotation.z = value;
      savePvTransformToStorage();
    });
    pvFolder.add(pvControls, 'scale', 0.01, 5, 0.001).name('Uniform Scale').onChange((value) => {
      pvModelRef.scale.setScalar(value);
      savePvTransformToStorage();
    });
    pvFolder.add(pvControls, 'log').name('Save Transform');
    pvGuiBound = true;
  }

  refreshGui();
}

function setupTreeGui() {
  if (!isHouseDetailPage || !gui || !treeModelRef) {
    return;
  }

  syncTreeControls();

  if (!treeFolder) {
    treeFolder = gui.addFolder('Tree');
  }

  if (!treeGuiBound) {
    treeFolder.add(treeControls, 'posX', -20, 20, 0.01).name('Position X').onChange((value) => {
      treeModelRef.position.x = value;
      saveTreeTransformToStorage();
    });
    treeFolder.add(treeControls, 'posY', -5, 10, 0.01).name('Position Y').onChange((value) => {
      treeModelRef.position.y = value;
      saveTreeTransformToStorage();
    });
    treeFolder.add(treeControls, 'posZ', -20, 20, 0.01).name('Position Z').onChange((value) => {
      treeModelRef.position.z = value;
      saveTreeTransformToStorage();
    });
    treeFolder.add(treeControls, 'scale', 0.05, 10, 0.01).name('Uniform Scale').onChange((value) => {
      treeModelRef.scale.setScalar(value);
      saveTreeTransformToStorage();
    });
    treeFolder.add(treeControls, 'log').name('Save Transform');
    treeGuiBound = true;
  }

  refreshGui();
}

function setupPalmGui() {
  if (!isHouseDetailPage || !gui || !palmModelRef) {
    return;
  }

  syncPalmControls();

  if (!palmFolder) {
    palmFolder = gui.addFolder('Palm');
  }

  if (!palmGuiBound) {
    palmFolder.add(palmControls, 'posX', -30, 30, 0.01).name('Position X').onChange((value) => {
      palmModelRef.position.x = value;
      savePalmTransformToStorage();
    });
    palmFolder.add(palmControls, 'posY', -10, 20, 0.01).name('Position Y').onChange((value) => {
      palmModelRef.position.y = value;
      savePalmTransformToStorage();
    });
    palmFolder.add(palmControls, 'posZ', -30, 30, 0.01).name('Position Z').onChange((value) => {
      palmModelRef.position.z = value;
      savePalmTransformToStorage();
    });
    palmFolder.add(palmControls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      palmModelRef.rotation.y = value;
      savePalmTransformToStorage();
    });
    palmFolder.add(palmControls, 'scale', 0.01, 20, 0.01).name('Uniform Scale').onChange((value) => {
      palmModelRef.scale.setScalar(value);
      savePalmTransformToStorage();
    });
    palmFolder.add(palmControls, 'log').name('Save Transform');
    palmGuiBound = true;
  }

  refreshGui();
}

function setupPalm2Gui() {
  if (!isHouseDetailPage || !gui || !palmModelRef2) {
    return;
  }

  syncPalm2Controls();

  if (!palm2Folder) {
    palm2Folder = gui.addFolder('Palm 2');
  }

  if (!palm2GuiBound) {
    palm2Folder.add(palm2Controls, 'posX', -30, 30, 0.01).name('Position X').onChange((value) => {
      palmModelRef2.position.x = value;
      savePalm2TransformToStorage();
    });
    palm2Folder.add(palm2Controls, 'posY', -10, 20, 0.01).name('Position Y').onChange((value) => {
      palmModelRef2.position.y = value;
      savePalm2TransformToStorage();
    });
    palm2Folder.add(palm2Controls, 'posZ', -30, 30, 0.01).name('Position Z').onChange((value) => {
      palmModelRef2.position.z = value;
      savePalm2TransformToStorage();
    });
    palm2Folder.add(palm2Controls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      palmModelRef2.rotation.y = value;
      savePalm2TransformToStorage();
    });
    palm2Folder.add(palm2Controls, 'scale', 0.01, 20, 0.01).name('Uniform Scale').onChange((value) => {
      palmModelRef2.scale.setScalar(value);
      savePalm2TransformToStorage();
    });
    palm2Folder.add(palm2Controls, 'log').name('Save Transform');
    palm2GuiBound = true;
  }

  refreshGui();
}

function setupTree3Gui() {
  if (!isHouseDetailPage || !gui || !treeModelRef3) {
    return;
  }

  syncTree3Controls();

  if (!tree3Folder) {
    tree3Folder = gui.addFolder('Tree 3');
  }

  if (!tree3GuiBound) {
    tree3Folder.add(tree3Controls, 'posX', -30, 30, 0.01).name('Position X').onChange((value) => {
      treeModelRef3.position.x = value;
      saveTree3TransformToStorage();
    });
    tree3Folder.add(tree3Controls, 'posY', -10, 20, 0.01).name('Position Y').onChange((value) => {
      treeModelRef3.position.y = value;
      saveTree3TransformToStorage();
    });
    tree3Folder.add(tree3Controls, 'posZ', -30, 30, 0.01).name('Position Z').onChange((value) => {
      treeModelRef3.position.z = value;
      saveTree3TransformToStorage();
    });
    tree3Folder.add(tree3Controls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      treeModelRef3.rotation.y = value;
      saveTree3TransformToStorage();
    });
    tree3Folder.add(tree3Controls, 'scale', 0.01, 20, 0.01).name('Uniform Scale').onChange((value) => {
      treeModelRef3.scale.setScalar(value);
      saveTree3TransformToStorage();
    });
    tree3Folder.addColor(tree3Controls, 'leafColor').name('Leaf Color').onChange((value) => {
      tree3Controls.leafColor = value;
      applyTree3LeafOverlay();
      saveTree3TransformToStorage();
    });
    tree3Folder.add(tree3Controls, 'leafOpacity', 0.2, 1.0, 0.01).name('Leaf Opacity').onChange((value) => {
      tree3Controls.leafOpacity = value;
      applyTree3LeafOverlay();
      saveTree3TransformToStorage();
    });
    tree3Folder.add(tree3Controls, 'log').name('Save Transform');
    tree3GuiBound = true;
  }

  refreshGui();
}

function setupTree4Gui() {
  if (!isHouseDetailPage || !gui || !treeModelRef4) {
    return;
  }

  syncTree4Controls();

  if (!tree4Folder) {
    tree4Folder = gui.addFolder('Tree 4');
  }

  if (!tree4GuiBound) {
    tree4Folder.add(tree4Controls, 'posX', -30, 30, 0.01).name('Position X').onChange((value) => {
      treeModelRef4.position.x = value;
      saveTree4TransformToStorage();
    });
    tree4Folder.add(tree4Controls, 'posY', -10, 20, 0.01).name('Position Y').onChange((value) => {
      treeModelRef4.position.y = value;
      saveTree4TransformToStorage();
    });
    tree4Folder.add(tree4Controls, 'posZ', -30, 30, 0.01).name('Position Z').onChange((value) => {
      treeModelRef4.position.z = value;
      saveTree4TransformToStorage();
    });
    tree4Folder.add(tree4Controls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      treeModelRef4.rotation.y = value;
      saveTree4TransformToStorage();
    });
    tree4Folder.add(tree4Controls, 'scale', 0.01, 20, 0.01).name('Uniform Scale').onChange((value) => {
      treeModelRef4.scale.setScalar(value);
      saveTree4TransformToStorage();
    });
    tree4Folder.add(tree4Controls, 'log').name('Save Transform');
    tree4GuiBound = true;
  }

  refreshGui();
}

function setupTree2Gui() {
  if (!isHouseDetailPage || !gui || !treeModelRef2) {
    return;
  }

  syncTree2Controls();

  if (!tree2Folder) {
    tree2Folder = gui.addFolder('Tree 2');
  }

  if (!tree2GuiBound) {
    tree2Folder.add(tree2Controls, 'posX', -20, 20, 0.01).name('Position X').onChange((value) => {
      treeModelRef2.position.x = value;
      saveTree2TransformToStorage();
    });
    tree2Folder.add(tree2Controls, 'posY', -5, 10, 0.01).name('Position Y').onChange((value) => {
      treeModelRef2.position.y = value;
      saveTree2TransformToStorage();
    });
    tree2Folder.add(tree2Controls, 'posZ', -20, 20, 0.01).name('Position Z').onChange((value) => {
      treeModelRef2.position.z = value;
      saveTree2TransformToStorage();
    });
    tree2Folder.add(tree2Controls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      treeModelRef2.rotation.y = value;
      saveTree2TransformToStorage();
    });
    tree2Folder.add(tree2Controls, 'scale', 0.05, 10, 0.01).name('Uniform Scale').onChange((value) => {
      treeModelRef2.scale.setScalar(value);
      saveTree2TransformToStorage();
    });
    tree2Folder.add(tree2Controls, 'log').name('Save Transform');
    tree2GuiBound = true;
  }

  refreshGui();
}

function createHouseWhiteMaterial() {
  const material = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.8,
    metalness: 0.0,
    transparent: true,
    opacity: 1.0,
  });
  material.userData.housePartPreset = 'white';
  return material;
}

function createHouseGlassMaterial(opacity = 0.3) {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity,
    roughness: 0.1,
    metalness: 0.0,
  });
  material.userData.housePartPreset = 'glass';
  return material;
}

function createHouseConcreteMaterial(opacity = 1.0, color = '#d7d3cc') {
  const material = new THREE.MeshStandardMaterial({
    color,
    map: concreteTexture.clone(),
    transparent: true,
    opacity,
    roughness: 0.92,
    metalness: 0.02,
  });
  material.map.colorSpace = THREE.SRGBColorSpace;
  material.userData.housePartPreset = 'concrete';
  return material;
}

function inferHousePartPreset(mesh) {
  if (!mesh?.material) {
    return 'white';
  }

  return mesh.material.userData?.housePartPreset
    || mesh.userData.housePartPreset
    || ((mesh.material.transparent && (mesh.material.opacity ?? 1) < 0.999) ? 'glass' : 'white');
}

function buildHousePartOverrideMap() {
  const overrides = {};

  houseMeshes.forEach((mesh) => {
    const index = mesh.userData.houseMeshIndex;
    if (index == null) {
      return;
    }

    overrides[index] = {
      material: inferHousePartPreset(mesh),
      opacity: Number((mesh.material?.opacity ?? 1).toFixed(4)),
    };

    if (overrides[index].material === 'concrete' && mesh.material?.color) {
      overrides[index].concreteColor = `#${mesh.material.color.getHexString()}`;
    }
  });

  return overrides;
}

function saveHousePartOverridesToStorage() {
  if (!isHouseDetailPage) {
    return;
  }

  window.localStorage.setItem(housePartStorageKey, JSON.stringify(buildHousePartOverrideMap()));
}

function loadHousePartOverridesFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(housePartStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved house part overrides:', error);
    return null;
  }
}

function applyHousePartOverrides() {
  const overrides = loadHousePartOverridesFromStorage();
  if (!overrides) {
    return;
  }

  houseMeshes.forEach((mesh) => {
    const index = mesh.userData.houseMeshIndex;
    const override = index != null ? overrides[index] : null;
    if (!override) {
      return;
    }

    const opacity = THREE.MathUtils.clamp(override.opacity ?? 1, 0, 1);
    mesh.material = override.material === 'glass'
      ? createHouseGlassMaterial(opacity)
      : override.material === 'concrete'
        ? createHouseConcreteMaterial(opacity, override.concreteColor ?? '#d7d3cc')
        : createHouseWhiteMaterial();
    mesh.material.opacity = opacity;
    mesh.material.transparent = opacity < 0.999 || override.material === 'glass' || override.material === 'concrete';
    mesh.material.needsUpdate = true;
    mesh.userData.housePartPreset = override.material === 'glass'
      ? 'glass'
      : override.material === 'concrete'
        ? 'concrete'
        : 'white';
  });
}

function refreshHousePartGuiDisplay() {
  housePartControllers.forEach((controller) => controller.updateDisplay());
}

function updateHousePartGui() {
  if (!selectedHouseMesh) {
    return;
  }

  housePartControls.material = inferHousePartPreset(selectedHouseMesh);
  housePartControls.opacity = selectedHouseMesh.material.opacity ?? 1.0;
  housePartControls.concreteColor = selectedHouseMesh.material?.color
    ? `#${selectedHouseMesh.material.color.getHexString()}`
    : '#d7d3cc';
  refreshHousePartGuiDisplay();
}

function setupHousePartGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!housePartFolder) {
    housePartFolder = gui.addFolder('House Part Control');
  }

  if (!housePartGuiBound) {
    housePartControllers.push(
      housePartFolder.add(housePartControls, 'material', ['white', 'glass', 'concrete']).name('Material').onChange((value) => {
        if (!selectedHouseMesh) {
          return;
        }

        const opacity = housePartControls.opacity;
        selectedHouseMesh.material = value === 'glass'
          ? createHouseGlassMaterial(opacity)
          : value === 'concrete'
            ? createHouseConcreteMaterial(opacity, housePartControls.concreteColor)
            : createHouseWhiteMaterial();
        selectedHouseMesh.material.opacity = opacity;
        selectedHouseMesh.material.transparent = opacity < 0.999 || value === 'glass' || value === 'concrete';
        selectedHouseMesh.material.needsUpdate = true;
        selectedHouseMesh.userData.housePartPreset = value;
        saveHousePartOverridesToStorage();
      })
    );
    housePartControllers.push(
      housePartFolder.addColor(housePartControls, 'concreteColor').name('Concrete Color').onChange((value) => {
        if (!selectedHouseMesh || inferHousePartPreset(selectedHouseMesh) !== 'concrete') {
          return;
        }

        if (selectedHouseMesh.material?.color) {
          selectedHouseMesh.material.color.set(value);
          selectedHouseMesh.material.needsUpdate = true;
          saveHousePartOverridesToStorage();
        }
      })
    );
    housePartControllers.push(
      housePartFolder.add(housePartControls, 'opacity', 0, 1, 0.01).name('Opacity').onChange((value) => {
        if (!selectedHouseMesh) {
          return;
        }

        selectedHouseMesh.material.transparent = true;
        selectedHouseMesh.material.opacity = value;
        selectedHouseMesh.material.needsUpdate = true;
        selectedHouseMesh.userData.housePartPreset = inferHousePartPreset(selectedHouseMesh);
        saveHousePartOverridesToStorage();
      })
    );
    housePartControllers.push(
      housePartFolder.add(housePartControls, 'log').name('Log Part Overrides')
    );
    housePartFolder.open();
    housePartGuiBound = true;
  }

  refreshGui();
}

function setPvHoverState(isHovered) {
  if (!pvModelRef || pvHovered === isHovered) {
    return;
  }

  pvHovered = isHovered;

  pvModelRef.traverse((child) => {
    if (!child.isMesh || !child.material || !child.userData.pvBaseColor) {
      return;
    }

    child.material.color.copy(isHovered ? child.userData.pvHoverColor : child.userData.pvBaseColor);
    if (child.userData.pvBaseMap || child.userData.pvHoverMap) {
      child.material.map = isHovered ? child.userData.pvHoverMap : child.userData.pvBaseMap;
      child.material.needsUpdate = true;
    }
  });
}

function setPvSelectedState(isSelected) {
  pvSelected = isSelected;
  if (pvGlowMesh) {
    pvGlowMesh.visible = isSelected;
  }
  pvInfoPanel.style.opacity = isSelected ? '1' : '0';
}

function setHouseHoverState(isHovered) {
  if (houseHovered === isHovered) {
    return;
  }

  houseHovered = isHovered;
  if (houseSelected) {
    return;
  }

  houseInteractiveMaterials.forEach((material) => {
    if (!material.userData.houseBaseEmissive) {
      return;
    }

    material.emissive.copy(
      isHovered
        ? material.userData.houseHoverEmissive
        : material.userData.houseBaseEmissive
    );
    material.emissiveIntensity = isHovered
      ? material.userData.houseHoverEmissiveIntensity
      : material.userData.houseBaseEmissiveIntensity;
  });
}

function setHouseSelectedState(isSelected) {
  houseSelected = isSelected;
  if (houseSelectionLight) {
    houseSelectionLight.visible = isSelected;
  }
  houseInteractiveMaterials.forEach((material) => {
    if (!material.userData.houseBaseEmissive) {
      return;
    }

    const selectedEmissive = material.userData.houseSelectedEmissive || material.userData.houseHoverEmissive;
    const selectedIntensity = material.userData.houseSelectedEmissiveIntensity ?? material.userData.houseHoverEmissiveIntensity;
    const targetEmissive = isSelected
      ? selectedEmissive
      : (houseHovered ? material.userData.houseHoverEmissive : material.userData.houseBaseEmissive);
    const targetIntensity = isSelected
      ? selectedIntensity
      : (houseHovered ? material.userData.houseHoverEmissiveIntensity : material.userData.houseBaseEmissiveIntensity);

    material.emissive.copy(targetEmissive);
    material.emissiveIntensity = targetIntensity;
  });
  houseInfoPanel.style.opacity = isSelected ? '1' : '0';
}

function updatePvInfoPanelPosition() {
  if (!pvSelected || !pvModelRef) {
    return;
  }

  const pvBox = new THREE.Box3().setFromObject(pvModelRef);
  const anchor = pvBox.getCenter(new THREE.Vector3());
  anchor.y = pvBox.max.y + Math.max(pvBox.getSize(new THREE.Vector3()).y * 0.35, 0.22);
  anchor.project(camera);

  const screenX = (anchor.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
  const isVisible = anchor.z > -1 && anchor.z < 1;

  pvInfoPanel.style.left = `${screenX}px`;
  pvInfoPanel.style.top = `${screenY}px`;
  pvInfoPanel.style.opacity = isVisible ? '1' : '0';
}

function updateHouseInfoPanelPosition() {
  if (!houseSelected || !houseWrapper) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseWrapper);
  const anchor = houseBox.getCenter(new THREE.Vector3());
  anchor.y = houseBox.max.y + Math.max(houseBox.getSize(new THREE.Vector3()).y * 0.22, 0.28);
  anchor.project(camera);

  const screenX = (anchor.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
  const isVisible = anchor.z > -1 && anchor.z < 1;

  houseInfoPanel.style.left = `${screenX}px`;
  houseInfoPanel.style.top = `${screenY}px`;
  houseInfoPanel.style.opacity = isVisible ? '1' : '0';
}

function createLightenedPvTexture(sourceTexture, whiteOverlay = 0.42) {
  if (!sourceTexture?.image) {
    return null;
  }

  const image = sourceTexture.image;
  const width = image.naturalWidth || image.videoWidth || image.width;
  const height = image.naturalHeight || image.videoHeight || image.height;

  if (!width || !height) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);
  ctx.fillStyle = `rgba(255, 255, 255, ${whiteOverlay})`;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(216, 234, 252, 0.14)';
  ctx.fillRect(0, 0, width, height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = sourceTexture.colorSpace;
  texture.wrapS = sourceTexture.wrapS;
  texture.wrapT = sourceTexture.wrapT;
  texture.repeat.copy(sourceTexture.repeat);
  texture.offset.copy(sourceTexture.offset);
  texture.center.copy(sourceTexture.center);
  texture.rotation = sourceTexture.rotation;
  texture.flipY = sourceTexture.flipY;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function createTreeCanopyTexture(sourceTexture) {
  if (!sourceTexture?.image) {
    return null;
  }

  const image = sourceTexture.image;
  const width = image.naturalWidth || image.videoWidth || image.width;
  const height = image.naturalHeight || image.videoHeight || image.height;

  if (!width || !height) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const isBackdrop = g > 70 && g > r * 1.18 && g > b * 1.12;
    if (isBackdrop) {
      const backdropStrength = Math.min(1, (g - Math.max(r, b)) / 120);
      data[i + 3] = Math.max(0, 255 - backdropStrength * 255);
    } else {
      data[i] = Math.min(255, r * 1.03);
      data[i + 1] = Math.min(255, g * 1.06);
      data[i + 2] = Math.min(255, b * 0.98);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = sourceTexture.flipY;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function applyAlphaCutoutPlantMaterialFix(material) {
  if (!material) {
    return;
  }

  const hasAlphaLikeTexture = !!(material.alphaMap || (material.map && material.transparent));
  if (!hasAlphaLikeTexture) {
    return;
  }

  material.transparent = true;
  material.depthWrite = false;
  material.alphaTest = Math.max(material.alphaTest ?? 0, 0.5);
  material.side = THREE.DoubleSide;
  material.needsUpdate = true;
}

function attachPalmAccentLight(model, secondary = false) {
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const localCenter = model.worldToLocal(center.clone());

  const light = new THREE.PointLight(secondary ? 0xeaffd2 : 0xf2ffd8, 0.55, Math.max(5.5, size.y * 1.9), 2);
  light.position.set(
    localCenter.x,
    localCenter.y + size.y * 0.58,
    localCenter.z + (secondary ? -size.z * 0.08 : size.z * 0.08)
  );
  light.castShadow = false;
  model.add(light);
  return light;
}

function applyTree3LeafOverlay() {
  if (!tree3LeafMaterials.length) {
    return;
  }

  const tint = new THREE.Color(tree3Controls.leafColor);
  const opacity = THREE.MathUtils.clamp(tree3Controls.leafOpacity, 0.2, 1.0);

  tree3LeafMaterials.forEach((material) => {
    if (!material) {
      return;
    }

    if (!material.userData.tree3BaseColor && material.color) {
      material.userData.tree3BaseColor = material.color.clone();
    }

    if (material.color) {
      material.color.copy(material.userData.tree3BaseColor || new THREE.Color(0xffffff)).lerp(tint, 0.62);
    }

    material.transparent = true;
    material.opacity = opacity;
    material.depthWrite = false;
    material.alphaTest = Math.max(material.alphaTest ?? 0, 0.5);
    material.side = THREE.DoubleSide;
    material.needsUpdate = true;
  });
}

function finalizeDetailTreeModel(treeModel) {
  treeModel.name = 'detailTreeModel';
  treeModel.renderOrder = 1;

  const treeBox = new THREE.Box3().setFromObject(treeModel);
  const treeSize = treeBox.getSize(new THREE.Vector3());
  const treeHeight = treeSize.y || Math.max(treeSize.x, treeSize.y, treeSize.z) || 1;
  const targetHeight = 3.6;
  treeModel.scale.setScalar(targetHeight / treeHeight);

  treeBox.setFromObject(treeModel);
  const treeCenter = treeBox.getCenter(new THREE.Vector3());
  treeModel.position.set(-treeCenter.x, groundPlane.position.y - treeBox.min.y + 0.02, -treeCenter.z);

  treeModel.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.castShadow = true;
    child.receiveShadow = false;
    child.renderOrder = 1;

    if (Array.isArray(child.material)) {
      child.material = child.material.map((material) => {
        if (!material?.clone) {
          return material;
        }

        const cloned = material.clone();
        const lowerName = `${child.name} ${cloned.name ?? ''}`.toLowerCase();
        const isLeafLike =
          lowerName.includes('leaf')
          || lowerName.includes('foliage')
          || lowerName.includes('crown');
        const hasLeafAlpha = !!(cloned.alphaMap || (cloned.transparent && cloned.map));

        if (isLeafLike && hasLeafAlpha) {
          applyAlphaCutoutPlantMaterialFix(cloned);
        } else if (!cloned.map && 'color' in cloned) {
          cloned.color.set(isLeafLike ? 0xa7c86a : 0x7e6a56);
        }

        if ('roughness' in cloned && cloned.roughness == null) {
          cloned.roughness = 1.0;
        }
        if ('metalness' in cloned && cloned.metalness == null) {
          cloned.metalness = 0.0;
        }
        cloned.needsUpdate = true;
        return cloned;
      });
      return;
    }

    if (child.material?.clone) {
      child.material = child.material.clone();
    }

    const lowerName = `${child.name} ${child.material?.name ?? ''}`.toLowerCase();
    const isLeafLike =
      lowerName.includes('leaf')
      || lowerName.includes('foliage')
      || lowerName.includes('crown');
    const hasLeafAlpha = !!(child.material?.alphaMap || (child.material?.transparent && child.material?.map));

    if (isLeafLike && hasLeafAlpha && child.material) {
      applyAlphaCutoutPlantMaterialFix(child.material);
    } else if (child.material && !child.material.map && 'color' in child.material) {
      child.material.color.set(isLeafLike ? 0xa7c86a : 0x7e6a56);
    }

    if (child.material && 'roughness' in child.material && child.material.roughness == null) {
      child.material.roughness = 1.0;
    }
    if (child.material && 'metalness' in child.material && child.material.metalness == null) {
      child.material.metalness = 0.0;
    }
    if (child.material) {
      child.material.needsUpdate = true;
    }
  });

  treeModelRef = treeModel;
  exposeTransformTarget('treeModelRef', treeModelRef);
  houseRoot.add(treeModel);
  treePositioned = false;
  tryPositionTreeModel();
  applySavedTreeTransform();
  treeModelRef2 = treeModel.clone(true);
  treeModelRef2.name = 'detailTreeModelClone';
  exposeTransformTarget('treeModelRef2', treeModelRef2);
  tree2Positioned = false;
  houseRoot.add(treeModelRef2);
  tryPositionTreeModel2();
  applySavedTree2Transform();
  syncTree2Controls();
  syncTreeControls();
  setupTreeGui();
  setupTree2Gui();
}

loader.load(
  './models/Untitled-2.glb',
  (gltf) => {
    const model = gltf.scene;
    model.name = 'houseModel';

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 3.8 / maxDim;
    model.scale.setScalar(scale);

    box.setFromObject(model);
    box.getCenter(center);
    model.position.set(-center.x, -box.min.y, -center.z);
    model.rotation.set(0, 0, 0);

    const shellBounds = box.clone();
    const shellSize = shellBounds.getSize(new THREE.Vector3());
    const xThreshold = shellSize.x * 0.12;
    const yThreshold = shellSize.y * 0.18;
    const zThreshold = shellSize.z * 0.14;

    const shellGlassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xcfe5ff,
      roughness: 0.12,
      metalness: 0.04,
      transmission: 0.46,
      thickness: 1.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      ior: 1.45,
      reflectivity: 0.84,
      envMapIntensity: 1.2,
      transparent: true,
      opacity: 0.92,
      emissive: new THREE.Color(0x0f2340),
      emissiveIntensity: 0.08,
    });
    detailMaterials.push(shellGlassMaterial);
    houseInteractiveMaterials.push(shellGlassMaterial);

    const backWallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f2,
      roughness: 0.55,
      metalness: 0.02,
      emissive: new THREE.Color(0x06111e),
      emissiveIntensity: 0.02,
    });
    houseInteractiveMaterials.push(backWallMaterial);

    const frontGlassMaterial = shellGlassMaterial.clone();
    frontGlassMaterial.transmission = 0.56;
    frontGlassMaterial.opacity = 0.9;
    frontGlassMaterial.thickness = 0.85;
    detailMaterials.push(frontGlassMaterial);
    houseInteractiveMaterials.push(frontGlassMaterial);

    model.traverse((child) => {
      if (!child.isMesh) return;

      child.castShadow = true;
      child.receiveShadow = true;

      const childBounds = new THREE.Box3().setFromObject(child);
      const childSize = childBounds.getSize(new THREE.Vector3());
      const touchesRoof = childBounds.max.y >= shellBounds.max.y - yThreshold;
      const touchesLeft = childBounds.min.x <= shellBounds.min.x + xThreshold;
      const touchesRight = childBounds.max.x >= shellBounds.max.x - xThreshold;
      const touchesFront = childBounds.max.z >= shellBounds.max.z - zThreshold;
      const touchesBack = childBounds.min.z <= shellBounds.min.z + zThreshold;
      const broadSurface =
        childSize.x >= shellSize.x * 0.16 ||
        childSize.y >= shellSize.y * 0.16 ||
        childSize.z >= shellSize.z * 0.16;

      const roofLike = touchesRoof && childSize.z >= shellSize.z * 0.22;
      const sideLike = broadSurface && (touchesLeft || touchesRight);
      const frontLike = broadSurface && touchesFront;
      const backWallLike = broadSurface && touchesBack && !roofLike;

      if (roofLike || sideLike) {
        child.material = shellGlassMaterial;
      } else if (frontLike) {
        child.material = frontGlassMaterial;
      } else if (backWallLike) {
        child.material = backWallMaterial;
      } else {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xc7d5e8,
          roughness: 0.4,
          metalness: 0.08,
          emissive: new THREE.Color(0x081321),
          emissiveIntensity: 0.015,
        });
        houseInteractiveMaterials.push(child.material);
      }

      child.material = child.material.clone();
      child.userData.houseMeshIndex = houseMeshes.length;
      child.userData.housePartPreset = (child.material.transparent && (child.material.opacity ?? 1) < 0.999)
        ? 'glass'
        : 'white';
      child.userData.houseDefaultMaterial = child.material.clone();
      houseMeshes.push(child);
    });

    [...new Set(houseInteractiveMaterials)].forEach((material) => {
      if (!material.emissive) {
        material.emissive = new THREE.Color(0x000000);
      }
      material.userData.houseBaseEmissive = material.emissive.clone();
      material.userData.houseBaseEmissiveIntensity = material.emissiveIntensity ?? 0;
      material.userData.houseHoverEmissive = material.emissive.clone().lerp(new THREE.Color(0x6ebdff), 0.55);
      material.userData.houseHoverEmissiveIntensity = Math.max(
        (material.emissiveIntensity ?? 0) + 0.08,
        0.08
      );
      material.userData.houseSelectedEmissive = material.emissive.clone().lerp(new THREE.Color(0x9dd8ff), 0.72);
      material.userData.houseSelectedEmissiveIntensity = Math.max(
        (material.emissiveIntensity ?? 0) + 0.18,
        0.16
      );
    });

    houseModelRef = model;
    exposeTransformTarget('houseModelRef', houseModelRef);
    houseWrapper = new THREE.Group();
    houseWrapper.name = 'houseWrapper';
    exposeTransformTarget('houseWrapper', houseWrapper);
    houseWrapper.rotation.y = houseFacingRotationY;
    houseWrapper.add(model);
    houseRoot.add(houseWrapper);

    const houseLightBox = new THREE.Box3().setFromObject(houseWrapper);
    const houseLightSize = houseLightBox.getSize(new THREE.Vector3());
    const houseLightCenter = houseLightBox.getCenter(new THREE.Vector3());
    houseSelectionLight = new THREE.PointLight(0x8fd4ff, 0, Math.max(houseLightSize.x, houseLightSize.y, houseLightSize.z) * 1.25, 2);
    houseSelectionLight.position.set(
      houseLightCenter.x,
      houseLightCenter.y + houseLightSize.y * 0.08,
      houseLightCenter.z
    );
    houseSelectionLight.visible = false;
    scene.add(houseSelectionLight);

    applySavedHouseTransform();
    applyHousePartOverrides();
    console.log('House wrapper rotation:', houseWrapper.rotation.toArray());
    console.log('House model rotation:', model.rotation.toArray());

    const framedBox = new THREE.Box3().setFromObject(houseRoot);
    const framedSize = framedBox.getSize(new THREE.Vector3());
    const framedCenter = framedBox.getCenter(new THREE.Vector3());

    const distance = Math.max(framedSize.z * 2.1, framedSize.x * 1.2, 5.4);
    autoCamera.enabled = true;
    autoCamera.target.copy(framedCenter);
    autoCamera.radius = distance;
    autoCamera.polar = 1.08;
    autoCamera.azimuth = -0.7;
    autoCamera.baseHeight = Math.max(framedSize.y * 0.3, 1.15);
    controls.target.copy(framedCenter);
    camera.position.set(
      framedCenter.x + Math.sin(autoCamera.azimuth) * autoCamera.radius,
      framedCenter.y + autoCamera.baseHeight,
      framedCenter.z + Math.cos(autoCamera.azimuth) * autoCamera.radius
    );
    camera.lookAt(framedCenter);
    updateHouseAnchors();

    setupHouseGui();
    setupHousePartGui();
    setupGrassGui();
    setupEnvironmentGui();
    setupGroundRadiusGui();
    setupGroundColorGui();
    setupCameraGui();
    createSkyboxMesh();
    updateGroundAppearance();
    updateSkyboxTransform();
    applyDetailBaseline();
    syncCameraControls();
    applySavedCameraTransform();
    syncCameraControls();
    refreshGui();
    buildGrassField();
    tryPositionPvModel();
    tryPositionTreeModel();
    tryPositionTreeModel2();
    tryPositionTreeModel3();
    tryPositionTreeModel4();
    tryPositionPalmModel();
    tryPositionPalmModel2();
  },
  undefined,
  (error) => {
    console.error('GLB load error:', error);
  }
);

if (isHouseDetailPage) {
  renderer.domElement.addEventListener('pointermove', (event) => {
    if (!pvModelRef && !houseWrapper) {
      return;
    }

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const pvIntersects = pvModelRef ? raycaster.intersectObject(pvModelRef, true) : [];
    const houseIntersects = houseWrapper ? raycaster.intersectObject(houseWrapper, true) : [];
    const isHoveringPv = pvIntersects.length > 0;
    const isHoveringHouse = !isHoveringPv && houseIntersects.length > 0;
    setPvHoverState(isHoveringPv);
    setHouseHoverState(isHoveringHouse);
    renderer.domElement.style.cursor = isHoveringPv || isHoveringHouse ? 'pointer' : 'default';
  });

  renderer.domElement.addEventListener('pointerleave', () => {
    setPvHoverState(false);
    setHouseHoverState(false);
    renderer.domElement.style.cursor = 'default';
  });

  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (!pvModelRef && !houseWrapper) {
      return;
    }

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);

    const pvIntersects = pvModelRef ? raycaster.intersectObject(pvModelRef, true) : [];
    const houseIntersects = houseMeshes.length > 0 ? raycaster.intersectObjects(houseMeshes, false) : [];

    if (pvIntersects.length > 0) {
      selectedHouseMesh = null;
      setPvSelectedState(!pvSelected);
      setHouseSelectedState(false);
      return;
    }

    if (houseIntersects.length > 0) {
      selectedHouseMesh = houseIntersects[0].object;
      updateHousePartGui();
      setHouseSelectedState(true);
      setPvSelectedState(false);
      return;
    }

    selectedHouseMesh = null;
    setPvSelectedState(false);
    setHouseSelectedState(false);
  });

  loader.load(
    './models/pv_board_1.glb',
    (gltf) => {
      const pvModel = gltf.scene;
      pvModel.name = 'pvBoardModel';

      const pvBox = new THREE.Box3().setFromObject(pvModel);
      const pvSize = pvBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(pvSize.x, pvSize.y, pvSize.z) || 1;
      const targetWidth = 1.5;
      pvModel.scale.setScalar((targetWidth / maxDim) * 1.44);

      pvBox.setFromObject(pvModel);
      const pvCenter = pvBox.getCenter(new THREE.Vector3());
      pvModel.position.set(-pvCenter.x, -pvBox.min.y, -pvCenter.z);

      const glowSize = pvBox.getSize(new THREE.Vector3()).multiplyScalar(1.04);
      const glowCenter = pvCenter.clone();
      const glowGeometry = new THREE.BoxGeometry(glowSize.x, glowSize.y, glowSize.z);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x6fc8ff,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
      });
      pvGlowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      pvGlowMesh.position.copy(glowCenter);
      pvGlowMesh.visible = false;
      pvGlowMesh.renderOrder = 4;
      pvModel.add(pvGlowMesh);

      pvModel.traverse((child) => {
        if (child.isMesh) {
          const pvMaterial = child.material?.clone?.() ?? new THREE.MeshStandardMaterial();
          const originalMap = pvMaterial.map || null;
          const lightenedMap = createLightenedPvTexture(originalMap, 0.48);
          pvMaterial.map = lightenedMap || originalMap;
          pvMaterial.color = new THREE.Color(0xeef6ff);
          if ('roughness' in pvMaterial) {
            pvMaterial.roughness = 0.34;
          }
          if ('metalness' in pvMaterial) {
            pvMaterial.metalness = 0.18;
          }
          child.material = pvMaterial;
          child.userData.pvBaseColor = new THREE.Color(0xeef6ff);
          child.userData.pvHoverColor = new THREE.Color(0xa7bfd6);
          child.userData.pvBaseMap = lightenedMap || originalMap;
          child.userData.pvHoverMap = originalMap || lightenedMap;
          child.castShadow = true;
          child.receiveShadow = false;
        }
      });

      pvModelRef = pvModel;
      exposeTransformTarget('pvModelRef', pvModelRef);
      houseRoot.add(pvModel);
      tryPositionPvModel();
      applySavedPvTransform();
      setPvSelectedState(false);
      syncHouseControls();
      setupPvGui();
    },
    undefined,
    (error) => {
      console.error('PV GLB load error:', error);
    }
  );

  loader.load(
    './models/american_elm_tree-compressed.glb',
    (gltf) => {
      finalizeDetailTreeModel(gltf.scene);
    },
    undefined,
    (error) => {
      console.error('Tree GLB load error:', error);
    }
  );

  loader.load(
    './models/small_tree.glb',
    (gltf) => {
      const treeModel = gltf.scene;
      treeModel.name = 'detailTreeModel3';
      treeModel.renderOrder = 1;
      tree3LeafMaterials.length = 0;

      const treeBox = new THREE.Box3().setFromObject(treeModel);
      const treeSize = treeBox.getSize(new THREE.Vector3());
      const treeHeight = treeSize.y || Math.max(treeSize.x, treeSize.y, treeSize.z) || 1;
      const targetHeight = 2.6;
      treeModel.scale.setScalar(targetHeight / treeHeight);

      treeBox.setFromObject(treeModel);
      const treeCenter = treeBox.getCenter(new THREE.Vector3());
      treeModel.position.set(-treeCenter.x, groundPlane.position.y - treeBox.min.y + 0.02, -treeCenter.z);

      treeModel.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        child.castShadow = true;
        child.receiveShadow = false;
        child.renderOrder = 1;

        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) => {
            const cloned = material?.clone ? material.clone() : material;
            applyAlphaCutoutPlantMaterialFix(cloned);
            if (cloned) {
              const isLeafLike = !!(cloned.alphaMap || (cloned.map && cloned.transparent));
              if ('color' in cloned && cloned.color) {
                cloned.color.lerp(new THREE.Color(0xcfe5b2), 0.18);
              }
              if ('emissive' in cloned && cloned.emissive) {
                cloned.emissive.lerp(new THREE.Color(0x29421c), 0.12);
                cloned.emissiveIntensity = Math.max(cloned.emissiveIntensity ?? 0, 0.03);
              }
              if ('roughness' in cloned && cloned.roughness != null) {
                cloned.roughness = Math.max(0.58, cloned.roughness * 0.88);
              }
              if (isLeafLike) {
                tree3LeafMaterials.push(cloned);
              }
              cloned.needsUpdate = true;
            }
            return cloned;
          });
          return;
        }

        if (child.material?.clone) {
          child.material = child.material.clone();
          applyAlphaCutoutPlantMaterialFix(child.material);
          const isLeafLike = !!(child.material.alphaMap || (child.material.map && child.material.transparent));
          if ('color' in child.material && child.material.color) {
            child.material.color.lerp(new THREE.Color(0xcfe5b2), 0.18);
          }
          if ('emissive' in child.material && child.material.emissive) {
            child.material.emissive.lerp(new THREE.Color(0x29421c), 0.12);
            child.material.emissiveIntensity = Math.max(child.material.emissiveIntensity ?? 0, 0.03);
          }
          if ('roughness' in child.material && child.material.roughness != null) {
            child.material.roughness = Math.max(0.58, child.material.roughness * 0.88);
          }
          if (isLeafLike) {
            tree3LeafMaterials.push(child.material);
          }
          child.material.needsUpdate = true;
        }
      });

      treeModelRef3 = treeModel;
      exposeTransformTarget('treeModelRef3', treeModelRef3);
      houseRoot.add(treeModel);
      tree3Positioned = false;
      tryPositionTreeModel3();
      applySavedTree3Transform();
      applyTree3LeafOverlay();
      treeModelRef4 = treeModel.clone(true);
      treeModelRef4.name = 'detailTreeModel4';
      exposeTransformTarget('treeModelRef4', treeModelRef4);
      tree4Positioned = false;
      houseRoot.add(treeModelRef4);
      tryPositionTreeModel4();
      applySavedTree4Transform();
      syncTree3Controls();
      syncTree4Controls();
      setupTree3Gui();
      setupTree4Gui();
    },
    undefined,
    (error) => {
      console.error('Tree 3 GLB load error:', error);
    }
  );

  loader.load(
    './models/untitled-5.glb',
    (gltf) => {
      const palmModel = gltf.scene;
      palmModel.name = 'detailPalmModel';
      palmModel.renderOrder = 1;

      const palmBox = new THREE.Box3().setFromObject(palmModel);
      const palmSize = palmBox.getSize(new THREE.Vector3());
      const palmHeight = palmSize.y || Math.max(palmSize.x, palmSize.y, palmSize.z) || 1;
      const targetHeight = 4.8;
      palmModel.scale.setScalar(targetHeight / palmHeight);

      palmBox.setFromObject(palmModel);
      const palmCenter = palmBox.getCenter(new THREE.Vector3());
      palmModel.position.set(-palmCenter.x, groundPlane.position.y - palmBox.min.y + 0.02, -palmCenter.z);

      palmModel.traverse((child) => {
        if (!child.isMesh) {
          return;
        }

        child.castShadow = true;
        child.receiveShadow = false;
        child.renderOrder = 1;
        if (child.material?.clone) {
          child.material = child.material.clone();
          applyAlphaCutoutPlantMaterialFix(child.material);
          child.material.needsUpdate = true;
        }
        if (Array.isArray(child.material)) {
          child.material = child.material.map((material) => {
            const cloned = material?.clone ? material.clone() : material;
            applyAlphaCutoutPlantMaterialFix(cloned);
            if (cloned) {
              cloned.needsUpdate = true;
            }
            return cloned;
          });
        }
      });

      palmModelRef = palmModel;
      exposeTransformTarget('palmModelRef', palmModelRef);
      houseRoot.add(palmModel);
      palmPositioned = false;
      tryPositionPalmModel();
      applySavedPalmTransform();
      palmAccentLight = attachPalmAccentLight(palmModelRef, false);
      palmModelRef2 = palmModel.clone(true);
      palmModelRef2.name = 'detailPalmModelClone';
      exposeTransformTarget('palmModelRef2', palmModelRef2);
      palm2Positioned = false;
      houseRoot.add(palmModelRef2);
      tryPositionPalmModel2();
      applySavedPalm2Transform();
      palmAccentLight2 = attachPalmAccentLight(palmModelRef2, true);
      syncPalmControls();
      syncPalm2Controls();
      setupPalmGui();
      setupPalm2Gui();
    },
    undefined,
    (error) => {
      console.error('Palm GLB load error:', error);
    }
  );

}

const clock = new THREE.Clock();

function animate() {
  const dt = clock.getDelta();
  const elapsed = clock.elapsedTime;
  if (autoCamera.enabled) {
    const introProgress = Math.min(elapsed / autoCamera.introDuration, 1);
    const easedIntro = 1 - Math.pow(1 - introProgress, 3);
    const introAzimuthOffset = (easedIntro - 0.5) * autoCamera.introSweep;
    const driftAzimuth = Math.sin(elapsed * 0.16) * 0.05;
    const animatedAzimuth = autoCamera.azimuth + introAzimuthOffset + driftAzimuth;
    const animatedRadius = autoCamera.radius * (1.0 + Math.sin(elapsed * 0.9) * 0.028);
    const animatedHeight = autoCamera.target.y + autoCamera.baseHeight + Math.sin(elapsed * 0.55) * 0.09;
    const desiredPosition = new THREE.Vector3(
      autoCamera.target.x + Math.sin(animatedAzimuth) * animatedRadius,
      animatedHeight,
      autoCamera.target.z + Math.cos(animatedAzimuth) * animatedRadius
    );
    camera.position.lerp(desiredPosition, 0.045);
    controls.target.lerp(autoCamera.target, 0.08);
  }
  if (grassMaterial) {
    grassMaterial.uniforms.uTime.value = elapsed;
  }
  const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.4);
  pulseField.material.opacity += ((0.045 + pulse * 0.012) - pulseField.material.opacity) * 0.08;
  const outerBaseScale = pulseField.userData.baseScale || 1;
  pulseField.scale.setScalar(outerBaseScale * (1.0 + pulse * 0.01));
  pulseWaves.forEach((wave) => {
    const wavePulse = (elapsed * 0.32 + wave.userData.phase) % 1;
    const eased = 1 - Math.pow(1 - wavePulse, 2);
    const baseScale = wave.userData.baseScale || 1;
    wave.scale.setScalar(baseScale * (0.7 + eased * 1.15));
    wave.material.opacity = 0.02 * (1 - eased) * 0.9;
  });
  if (pvGlowMesh) {
    pvGlowMesh.material.opacity = pvSelected
      ? (0.12 + Math.sin(elapsed * 2.3) * 0.025)
      : 0;
  }
  if (houseSelectionLight) {
    houseSelectionLight.intensity = houseSelected
      ? (0.5 + Math.sin(elapsed * 2.0) * 0.08)
      : 0;
  }
  updateHouseInfoPanelPosition();
  updatePvInfoPanelPosition();
  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
