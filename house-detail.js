import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const isEnergyTrackingPage = document.body.classList.contains('energy-tracking-page');
const isHouseDetailPage = document.body.classList.contains('house-detail-page') || isEnergyTrackingPage;
const isPrimaryHouseDetailPage = isHouseDetailPage && !isEnergyTrackingPage;
const isHouseIsolatePage = document.body.classList.contains('house-isolate-page');
let isolateSceneActive = false;
let isolateButton = null;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 5, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.82;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('root').appendChild(renderer.domElement);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.0, 0.42, 0.78);
composer.addPass(bloomPass);
const pmremGenerator = new THREE.PMREMGenerator(renderer);
const roomEnvironmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.05).texture;
const daySkyBackground = new THREE.Color(0x87ceeb);
scene.environment = roomEnvironmentTexture;
scene.background = daySkyBackground.clone();
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
  scene.background = daySkyBackground.clone();
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

const ambientLight = new THREE.AmbientLight(0xf3f7ff, 0.12);
scene.add(ambientLight);

const keyLight = new THREE.DirectionalLight(0xfff7ee, 0.82);
keyLight.position.set(5, 10, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.radius = 4;
keyLight.shadow.blurSamples = 8;
keyLight.shadow.camera.near = 1;
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
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xaaddff, 0.8);
rimLight.position.set(0, 5, -10);
scene.add(rimLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x222233, 0.6);
scene.add(hemiLight);

const interiorLight = new THREE.PointLight(0xfff1de, 0.1, 10, 2);
interiorLight.position.set(0, 1.6, 0);
scene.add(interiorLight);

const houseRoot = new THREE.Group();
scene.add(houseRoot);
let houseWrapper = null;
let houseModelRef = null;
let carModelRef = null;
let lngModelRef = null;
let storageModelRef = null;
const storageMachineRoomMeshes = [];
const storageBatteryRoomMeshes = [];
let storageHoveredRoomKey = null;
let storageSelectedRoomKey = null;
let storagePointerActive = false;
let pvModelRef = null;
let treeModelRef = null;
let treeModelRef2 = null;
let treeModelRef3 = null;
let treeModelRef4 = null;
const tree3LeafMaterials = [];
let palmModelRef = null;
let palmModelRef2 = null;
const carPatrolState = {
  enabled: true,
  initialized: false,
  points: [],
  curve: null,
  progress: 0,
  speed: 0.028,
  headingOffset: 0,
  loopCount: 0,
  baseY: 0,
  wheelMeshes: [],
  frontWheelMeshes: new Set(),
  longitudinalAxis: 'z',
  forwardSign: 1,
  wheelRollAxis: 'x',
  wheelRadius: 0.32,
  wheelSpin: 0,
  lastPosition: null,
};
const carPatrolTempPoint = new THREE.Vector3();
const carPatrolTempAhead = new THREE.Vector3();
const carPatrolTempDir = new THREE.Vector3();
const carPatrolTempCenter = new THREE.Vector3();
const carPatrolTempSize = new THREE.Vector3();
const carPatrolExpandedBox = new THREE.Box3();
const carPatrolObstacleBox = new THREE.Box3();
const carPatrolWheelLocal = new THREE.Vector3();
let palmAccentLight = null;
let palmAccentLight2 = null;
let pvPositioned = false;
let carPositioned = false;
let lngPositioned = false;
let storagePositioned = false;
let treePositioned = false;
let tree2Positioned = false;
let tree3Positioned = false;
let tree4Positioned = false;
let palmPositioned = false;
let palm2Positioned = false;
const houseMeshes = [];
let sharedHouseMaterialTemplate = null;
let selectedHouseMesh = null;
let houseHovered = false;
let houseSelected = false;
let pvHovered = false;
let pvSelected = false;
let houseSelectionLight = null;
let pvGlowMesh = null;
const storageRoomLabelContent = {
  machine: {
    title: 'Machine Room',
    subtitle: 'System Control Unit',
  },
  battery: {
    title: 'Battery Storage',
    subtitle: 'Energy Storage System',
  },
};
let gui = null;
let guiVisible = false;
let carGuiBound = false;
let lngGuiBound = false;
let pvGuiBound = false;
let storageGuiBound = false;
let treeGuiBound = false;
let tree2GuiBound = false;
let tree3GuiBound = false;
let tree4GuiBound = false;
let palmGuiBound = false;
let palm2GuiBound = false;
let houseGuiBound = false;
let grassGuiBound = false;
let environmentGuiBound = false;
let lightingGuiBound = false;
let energyLightingGuiBound = false;
let timeOfDayGuiBound = false;
let cameraGuiBound = false;
let groundRadiusGuiBound = false;
let groundColorGuiBound = false;
let atmosphereColorGuiBound = false;
let housePartGuiBound = false;
let houseFolder = null;
let carFolder = null;
let lngFolder = null;
let pvFolder = null;
let storageFolder = null;
let treeFolder = null;
let tree2Folder = null;
let tree3Folder = null;
let tree4Folder = null;
let palmFolder = null;
let palm2Folder = null;
let grassFolder = null;
let environmentFolder = null;
let lightingFolder = null;
let energyLightingFolder = null;
let timeOfDayFolder = null;
let cameraFolder = null;
let groundRadiusFolder = null;
let groundColorFolder = null;
let atmosphereColorFolder = null;
let housePartFolder = null;
let houseSurfaceFolder = null;
let grassField = null;
let grassMaterial = null;
let grassNoiseTexture = null;
let grassDiffuseTexture = null;
let grassHeightTexture = null;
let skyboxMesh = null;
let rain = null;
let rainPositions = null;
let rainButton = null;
let isRaining = false;
let energyTrackingGroup = null;
let energyTrackingMode = false;
let energyTrackingPageIntroStarted = false;
let sceneSection = 'default';
let visualizationMode = isEnergyTrackingPage ? 'Energy' : 'Live';
let energyLevel = 0.72;
const energyModeBackground = new THREE.Color(0xe8e6e1);
let energyModeBlend = isEnergyTrackingPage ? 1 : 0;
const energyFlowCurves = [];
const energyFlowSystems = [];
const pvEnergyEdgeGlows = [];
const energyTrackingHiddenTargets = [];
const energyTrackingState = {
  cameraPosition: new THREE.Vector3(),
  controlsTarget: new THREE.Vector3(),
  liveBackgroundColor: new THREE.Color(),
  autoCameraEnabled: false,
  houseRotationY: 0,
  storagePosition: new THREE.Vector3(),
  storageRotationY: 0,
  skyboxVisible: true,
  activationStart: 0,
};
const groundVisualBleedScale = 1.14;
const energyTrackingCameraTransition = {
  startPosition: new THREE.Vector3(),
  startTarget: new THREE.Vector3(),
  endPosition: new THREE.Vector3(),
  endTarget: new THREE.Vector3(),
  startHouseRotationY: 0,
  endHouseRotationY: 0,
  animateHouseRotation: false,
  focusCenter: new THREE.Vector3(),
  startStoragePosition: new THREE.Vector3(),
  endStoragePosition: new THREE.Vector3(),
  startStorageRotationY: 0,
  endStorageRotationY: 0,
  animateStorageTransform: false,
  progress: 0,
  active: false,
  restoreAutoCameraEnabled: false,
};
const energyTrackingVisualState = {
  currentLevel: energyLevel,
  targetLevel: energyLevel,
};
const visualizationModeTransition = {
  active: false,
  start: energyModeBlend,
  target: energyModeBlend,
  duration: 0.85,
  elapsed: 0,
  startCameraPosition: new THREE.Vector3(),
  endCameraPosition: new THREE.Vector3(),
  startCameraTarget: new THREE.Vector3(),
  endCameraTarget: new THREE.Vector3(),
};
const houseStorageKey = 'house-detail-house-transform';
const carStorageKey = 'house-detail-car-transform';
const lngStorageKey = 'house-detail-lng-transform';
const lngTransformVersion = 3;
const storageStorageKey = 'house-detail-storage-transform';
const pvStorageKey = 'house-detail-pv-transform';
const pvTransformVersion = 2;
const treeStorageKey = 'house-detail-tree-transform';
const tree2StorageKey = 'house-detail-tree-2-transform';
const tree3StorageKey = 'house-detail-tree-3-transform';
const tree4StorageKey = 'house-detail-tree-4-transform';
const palmStorageKey = 'house-detail-palm-transform';
const palm2StorageKey = 'house-detail-palm-2-transform';
const cameraStorageKey = 'house-detail-camera-transform';
const environmentStorageKey = 'house-detail-environment-transform';
const housePartStorageKey = 'house-detail-house-part-overrides';
const houseSurfaceStorageKey = 'house-detail-house-surface';
const houseSavedTransform = {
  position: { x: -0.210, y: -0.980, z: -0.870 },
  rotationY: -0.130,
  scale: 3.600,
};
const pvSavedTransform = {
  position: { x: -6.530, y: -0.330, z: 7.230 },
  rotation: { x: 0.000, y: 2.980, z: 0.000 },
  scale: 0.069,
};
const carSavedTransform = {
  position: { x: -0.311, y: -0.537, z: 5.384 },
  rotation: { x: 0.000, y: -1.690, z: 0.000 },
  scale: 1.407,
};
const lngSavedTransform = {
  position: { x: -13.950, y: 0.189, z: -2.680 },
  rotation: { x: -6.280, y: 1.430, z: 0.000 },
  scale: 0.619,
};
const storageSavedTransform = {
  position: { x: -0.420, y: 12.800, z: -10.800 },
  rotation: { x: 0.000, y: -0.130, z: 0.000 },
  scale: 0.750,
};
const treeSavedTransform = {
  position: { x: 8.600, y: -1.130, z: -0.870 },
  scale: 0.860,
};
const tree2SavedTransform = {
  position: { x: -11.700, y: -0.970, z: -4.889 },
  rotationY: 1.000,
  scale: 0.860,
};
const tree3SavedTransform = {
  position: { x: -10.110, y: -1.410, z: -0.630 },
  rotationY: 1.990,
  scale: 14.750,
  leafColor: '#d8eead',
  leafOpacity: 0.82,
};
const tree4SavedTransform = {
  position: { x: -14.160, y: -0.975, z: 6.130 },
  rotation: { x: -3.142, y: 2.420, z: -3.142 },
  rotationY: 2.420,
  scale: 12.950,
};
const palmSavedTransform = {
  position: { x: 6.810, y: -0.390, z: 12.220 },
  rotationY: 0.000,
  scale: 4.800,
};
const palm2SavedTransform = {
  position: { x: 4.100, y: -0.964, z: 10.870 },
  rotationY: 0.000,
  scale: 4.800,
};
const houseFacingRotationY = -0.130;
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
  shader.uniforms.uGroundColor = { value: new THREE.Color(0xdfe8d8) };
  shader.uniforms.uGroundHalfSize = { value: 56.0 };
  shader.uniforms.uSkyColor = { value: new THREE.Color(0xbfd5ff) };
  shader.uniforms.uHorizonOpacity = { value: 1.0 };
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
    uniform float uHorizonOpacity;
    uniform sampler2D uGrassTex;
    varying vec3 vWorldPosition;
    varying vec2 vGroundUv;`
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <output_fragment>',
    `
    float viewDist = distance(vWorldPosition.xz, cameraPosition.xz);
    float distanceFade = smoothstep(uInnerRadius * 1.24, uOuterRadius * 2.9, viewDist);
    float uvEdgeDistance = min(min(vGroundUv.x, 1.0 - vGroundUv.x), min(vGroundUv.y, 1.0 - vGroundUv.y));
    float outerEdgeFade = 1.0 - smoothstep(0.0, 0.34, uvEdgeDistance);
    vec2 tiledUv = fract(vGroundUv * 20.0);
    vec2 croppedUv = tiledUv * 0.82 + 0.09;
    vec3 texColor = texture2D(uGrassTex, croppedUv).rgb;
    vec3 screenGround = 1.0 - (1.0 - outgoingLight) * (1.0 - texColor);
    vec3 texturedGround = mix(outgoingLight, screenGround, 0.38);
    vec3 horizonColor = mix(texturedGround, uSkyColor, 0.96);
    float horizonBlend = clamp(distanceFade + outerEdgeFade * 0.9, 0.0, 1.0);
    horizonBlend = smoothstep(0.02, 0.98, horizonBlend);
    horizonBlend *= uHorizonOpacity;
    outgoingLight = mix(texturedGround, horizonColor, horizonBlend);
    float alphaFade = clamp(distanceFade * 0.08 + outerEdgeFade * 0.22, 0.0, 0.24);
    diffuseColor.a *= (1.0 - alphaFade);
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

function createContactShadowTexture(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(
    size * 0.5,
    size * 0.5,
    size * 0.06,
    size * 0.5,
    size * 0.5,
    size * 0.5
  );
  gradient.addColorStop(0, 'rgba(0,0,0,1.0)');
  gradient.addColorStop(0.18, 'rgba(0,0,0,0.72)');
  gradient.addColorStop(0.42, 'rgba(0,0,0,0.34)');
  gradient.addColorStop(0.72, 'rgba(0,0,0,0.12)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const sharedContactShadowTexture = createContactShadowTexture();
const objectContactShadows = new Map();

function createContactShadow(size = 2, opacity = 0.15) {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    map: sharedContactShadowTexture,
    color: 0x000000,
    transparent: true,
    opacity,
    depthWrite: false,
  });

  const shadow = new THREE.Mesh(geometry, material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  shadow.renderOrder = 1;
  return shadow;
}

function ensureObjectContactShadow(key, size = 2, opacity = 0.15) {
  if (objectContactShadows.has(key)) {
    return objectContactShadows.get(key);
  }

  const shadow = createContactShadow(size, opacity);
  scene.add(shadow);
  objectContactShadows.set(key, shadow);
  return shadow;
}

function syncObjectContactShadow(object, key, {
  widthScale = 1,
  depthScale = 1,
  minWidth = 1,
  minDepth = 1,
  opacity = 0.15,
  blurScale = 1,
} = {}) {
  const shadow = ensureObjectContactShadow(key, Math.max(minWidth, minDepth), opacity);

  if (!object || !object.visible) {
    shadow.visible = false;
    return;
  }

  const bounds = new THREE.Box3().setFromObject(object);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const heightInfluence = THREE.MathUtils.clamp(size.y * 0.08, 0, 0.45);

  shadow.visible = true;
  shadow.position.set(center.x, groundPlane.position.y + 0.012, center.z);
  shadow.scale.set(
    Math.max(size.x * widthScale, minWidth) * blurScale,
    Math.max(size.z * depthScale, minDepth) * blurScale,
    1
  );
  shadow.material.opacity = THREE.MathUtils.clamp(opacity + heightInfluence, 0, 0.34);
}

function updateContactShadows() {
  syncObjectContactShadow(houseWrapper, 'house', {
    widthScale: 0.9,
    depthScale: 0.82,
    minWidth: 1.8,
    minDepth: 1.6,
    opacity: 0.12,
  });
  syncObjectContactShadow(pvModelRef, 'pv', {
    widthScale: 1.18,
    depthScale: 1.12,
    minWidth: 1.45,
    minDepth: 1.0,
    opacity: 0.22,
    blurScale: 1.16,
  });
  syncObjectContactShadow(storageModelRef, 'storage', {
    widthScale: 1.05,
    depthScale: 1.0,
    minWidth: 1.15,
    minDepth: 0.95,
    opacity: 0.18,
    blurScale: 1.1,
  });
  syncObjectContactShadow(treeModelRef, 'tree-1', {
    widthScale: 0.82,
    depthScale: 0.82,
    minWidth: 1.35,
    minDepth: 1.35,
    opacity: 0.24,
    blurScale: 1.32,
  });
  syncObjectContactShadow(treeModelRef2, 'tree-2', {
    widthScale: 0.82,
    depthScale: 0.82,
    minWidth: 1.35,
    minDepth: 1.35,
    opacity: 0.24,
    blurScale: 1.32,
  });
  syncObjectContactShadow(treeModelRef3, 'tree-3', {
    widthScale: 0.78,
    depthScale: 0.78,
    minWidth: 1.05,
    minDepth: 1.05,
    opacity: 0.23,
    blurScale: 1.26,
  });
  syncObjectContactShadow(treeModelRef4, 'tree-4', {
    widthScale: 0.78,
    depthScale: 0.78,
    minWidth: 1.05,
    minDepth: 1.05,
    opacity: 0.23,
    blurScale: 1.26,
  });
}

function createRainStreakTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 24;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(canvas.width * 0.5, 0, canvas.width * 0.5, canvas.height);
  gradient.addColorStop(0, 'rgba(152, 176, 198, 0.0)');
  gradient.addColorStop(0.10, 'rgba(136, 164, 190, 0.42)');
  gradient.addColorStop(0.42, 'rgba(184, 222, 255, 1.0)');
  gradient.addColorStop(0.76, 'rgba(92, 116, 138, 0.72)');
  gradient.addColorStop(1, 'rgba(152, 176, 198, 0.0)');

  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(canvas.width * 0.5, 8);
  ctx.lineTo(canvas.width * 0.5, canvas.height - 8);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createRainSystem() {
  if (rain) {
    return;
  }

  const rainCount = 13200;
  const geometry = new THREE.BufferGeometry();
  rainPositions = new Float32Array(rainCount * 3);

  for (let i = 0; i < rainCount; i++) {
    rainPositions[i * 3] = (Math.random() - 0.5) * 56;
    rainPositions[i * 3 + 1] = Math.random() * 36 + 10;
    rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 56;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  const rainTexture = createRainStreakTexture();

  const material = new THREE.PointsMaterial({
    map: rainTexture,
    color: 0xcfe7ff,
    size: 0.125,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
    alphaTest: 0.02,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });

  rain = new THREE.Points(geometry, material);
  rain.name = 'rainSystem';
  rain.renderOrder = 10;
  rain.visible = false;
  scene.add(rain);
  if (isRaining) {
    applyRainMode();
  }
}

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

const interactionAccentColor = new THREE.Color(0x6ebdff);
const interactionAccentColorStrong = new THREE.Color(0x9dd8ff);
const interactionPanelTextColor = 'rgba(206, 232, 255, 0.96)';
const interactionPanelBackground = 'rgba(10, 22, 42, 0.78)';
const interactionPanelBorder = 'rgba(120, 196, 255, 0.28)';
const interactionPanelShadow = '0 0 22px rgba(80, 176, 255, 0.18), inset 0 0 18px rgba(120, 196, 255, 0.06)';
const storageRoomSplitX = 0;

const detailMaterials = [];
const houseInteractiveMaterials = [];
const modeLabel = document.getElementById('mode-label');
const modeButton = document.getElementById('mode-button');
const dashboardOverlay = document.getElementById('dashboard-overlay');
const detailLabel = document.querySelector('.detail-label');
const dashboardRefs = {
  solarValue: document.getElementById('dashboard-solar-value'),
  referenceValue: document.getElementById('dashboard-reference-value'),
  consumedValue: document.getElementById('dashboard-consumed-value'),
  receivedValue: document.getElementById('dashboard-received-value'),
  costValue: document.getElementById('dashboard-cost-value'),
  earningValue: document.getElementById('dashboard-earning-value'),
  earningDate: document.getElementById('dashboard-earning-date'),
  totalEnergyValue: document.getElementById('dashboard-total-energy-value'),
  weatherTemp: document.getElementById('dashboard-weather-temp'),
  weatherTempSecondary: document.getElementById('dashboard-weather-temp-secondary'),
  weatherCondition: document.getElementById('dashboard-weather-condition'),
  weatherConditionSecondary: document.getElementById('dashboard-weather-condition-secondary'),
  weatherWind: document.getElementById('dashboard-weather-wind'),
  solarIntensity: document.getElementById('dashboard-solar-intensity'),
  transducerValue: document.getElementById('dashboard-transducer-value'),
  weatherPath: document.getElementById('dashboard-weather-path'),
  balancePath: document.getElementById('dashboard-balance-path'),
  gaugeArc: document.getElementById('dashboard-gauge-arc'),
  barSolar: document.getElementById('dashboard-bar-solar'),
  barReference: document.getElementById('dashboard-bar-reference'),
  barConsumed: document.getElementById('dashboard-bar-consumed'),
  efficiencyFill: document.getElementById('dashboard-efficiency-fill'),
  operationPanel: document.getElementById('dashboard-operation-panel'),
  operationCleaning: document.getElementById('dashboard-operation-cleaning'),
  operationCoverage: document.getElementById('dashboard-operation-coverage'),
  operationMode: document.getElementById('dashboard-operation-mode'),
};
const dashboardData = {
  current: {
    solar: 4.23,
    reference: 4.07,
    consumed: 265,
    received: 2.48,
    cost: 3.52,
    efficiency: 86,
    totalEnergy: 306,
    temperature: 27.4,
    humanFlow: 8,
    wind: 6.2,
    solarIntensity: 82,
    coverage: 72,
  },
  target: {
    solar: 4.23,
    reference: 4.07,
    consumed: 265,
    received: 2.48,
    cost: 3.52,
    efficiency: 86,
    totalEnergy: 306,
    temperature: 27.4,
    humanFlow: 8,
    wind: 6.2,
    solarIntensity: 82,
    coverage: 72,
  },
  weatherSeries: [38, 46, 41, 55, 50, 62, 58, 66],
  balanceSeries: [42, 46, 39, 44, 51, 47, 57, 53, 59, 56],
  accumulator: 0,
};
const dashboardWeatherConditions = ['Clear sky', 'Mostly sunny', 'Bright haze'];
let dashboardWeatherIndex = 0;
if (isPrimaryHouseDetailPage && modeButton) {
  modeButton.style.display = 'none';
}
if (isPrimaryHouseDetailPage && modeLabel) {
  modeLabel.textContent = 'Day';
}
let modeSwitcher = null;
const modeSwitcherItems = new Map();
const cameraControls = {
  posX: -4.587,
  posY: 29.747,
  posZ: 18.452,
  fov: 41.000,
  zoom: 1.000,
  targetX: -0.318,
  targetY: 0.980,
  targetZ: -0.872,
  radius: 18.140,
  height: 1.176,
  azimuth: 0.010,
  introSweep: 1.200,
  autoAnimate: false,
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
  groundSize: 160.00,
  innerRadiusScale: 0.790,
  outerRadiusScale: 2.780,
  groundColor: '#dfe8d8',
  horizonColor: '#bfd5ff',
  skyboxX: -21.50,
  skyboxY: -14.30,
  skyboxZ: 12.70,
  skyboxScale: 163.00,
  log() {
    syncEnvironmentFromScene();
    saveEnvironmentToStorage();
    const snippet = `const environmentControls = {
  groundSize: ${environmentControls.groundSize.toFixed(2)},
  innerRadiusScale: ${environmentControls.innerRadiusScale.toFixed(3)},
  outerRadiusScale: ${environmentControls.outerRadiusScale.toFixed(3)},
  groundColor: '${environmentControls.groundColor}',
  horizonColor: '${environmentControls.horizonColor}',
  skyboxX: ${environmentControls.skyboxX.toFixed(2)},
  skyboxY: ${environmentControls.skyboxY.toFixed(2)},
  skyboxZ: ${environmentControls.skyboxZ.toFixed(2)},
  skyboxScale: ${environmentControls.skyboxScale.toFixed(2)},
};`;
    console.log('Paste this into house-detail.js to save the environment permanently:\n' + snippet);
  },
};
const defaultEnvironmentGroundSize = 160.00;
const defaultEnvironmentControls = {
  groundSize: defaultEnvironmentGroundSize,
  innerRadiusScale: environmentControls.innerRadiusScale,
  outerRadiusScale: environmentControls.outerRadiusScale,
  groundColor: environmentControls.groundColor,
  horizonColor: environmentControls.horizonColor,
  skyboxX: environmentControls.skyboxX,
  skyboxY: environmentControls.skyboxY,
  skyboxZ: environmentControls.skyboxZ,
  skyboxScale: environmentControls.skyboxScale,
};
environmentControls.resetToSource = function resetToSource() {
  environmentControls.groundSize = defaultEnvironmentControls.groundSize;
  environmentControls.innerRadiusScale = defaultEnvironmentControls.innerRadiusScale;
  environmentControls.outerRadiusScale = defaultEnvironmentControls.outerRadiusScale;
  environmentControls.groundColor = defaultEnvironmentControls.groundColor;
  environmentControls.horizonColor = defaultEnvironmentControls.horizonColor;
  environmentControls.skyboxX = defaultEnvironmentControls.skyboxX;
  environmentControls.skyboxY = defaultEnvironmentControls.skyboxY;
  environmentControls.skyboxZ = defaultEnvironmentControls.skyboxZ;
  environmentControls.skyboxScale = defaultEnvironmentControls.skyboxScale;
  updateGroundAppearance();
  updateSkyboxTransform();
  saveEnvironmentToStorage();
  refreshGui();
};
const lightingControls = {
  keyX: 5,
  keyY: 10,
  keyZ: 5,
  keyIntensity: 1.200,
  ambientIntensity: 0.200,
  interiorIntensity: 0.120,
  exposure: 1.000,
  environmentIntensity: 0.300,
  log() {
    syncLightingFromScene();
    saveEnvironmentToStorage();
    const snippet = `const lightingControls = {
  keyX: ${lightingControls.keyX.toFixed(2)},
  keyY: ${lightingControls.keyY.toFixed(2)},
  keyZ: ${lightingControls.keyZ.toFixed(2)},
  keyIntensity: ${lightingControls.keyIntensity.toFixed(3)},
  ambientIntensity: ${lightingControls.ambientIntensity.toFixed(3)},
  interiorIntensity: ${lightingControls.interiorIntensity.toFixed(3)},
  exposure: ${lightingControls.exposure.toFixed(3)},
  environmentIntensity: ${lightingControls.environmentIntensity.toFixed(3)},
};`;
    console.log('Paste this into house-detail.js to save the lighting permanently:\n' + snippet);
  },
};
const energyLightingStorageKey = 'house-detail-energy-lighting';
const energyLightingControls = {
  keyX: 6.8,
  keyY: 9.2,
  keyZ: 4.6,
  keyIntensity: 0.74,
  ambientIntensity: 0.045,
  hemiIntensity: 0.1,
  interiorIntensity: 0.015,
  fillIntensity: 0.2,
  rimIntensity: 0.08,
  exposure: 0.92,
  log() {
    const snippet = `const energyLightingControls = {
  keyX: ${energyLightingControls.keyX.toFixed(2)},
  keyY: ${energyLightingControls.keyY.toFixed(2)},
  keyZ: ${energyLightingControls.keyZ.toFixed(2)},
  keyIntensity: ${energyLightingControls.keyIntensity.toFixed(3)},
  ambientIntensity: ${energyLightingControls.ambientIntensity.toFixed(3)},
  hemiIntensity: ${energyLightingControls.hemiIntensity.toFixed(3)},
  interiorIntensity: ${energyLightingControls.interiorIntensity.toFixed(3)},
  fillIntensity: ${energyLightingControls.fillIntensity.toFixed(3)},
  rimIntensity: ${energyLightingControls.rimIntensity.toFixed(3)},
  exposure: ${energyLightingControls.exposure.toFixed(3)},
};`;
    console.log('Paste this into house-detail.js to save the energy lighting permanently:\n' + snippet);
  },
};
const timeOfDayControls = {
  value: 0,
  mode: 'Day',
  setDay() {
    setTime(0);
  },
  setSunset() {
    setTime(1);
  },
  setNight() {
    setTime(2);
  },
};
let timeOfDaySliderPanel = null;
let timeOfDaySlider = null;
let timeOfDaySliderStyle = null;
let timeOfDayValueLabel = null;
let topControlsContainer = null;
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
  environmentControls.groundSize = (groundPlane.scale.x * 56) / groundVisualBleedScale;
  environmentControls.groundColor = `#${groundMaterial.color.getHexString()}`;

  if (skyboxMesh) {
    environmentControls.skyboxX = skyboxMesh.position.x;
    environmentControls.skyboxY = skyboxMesh.position.y;
    environmentControls.skyboxZ = skyboxMesh.position.z;
    environmentControls.skyboxScale = skyboxMesh.scale.x;
  }
}

function syncLightingFromScene() {
  lightingControls.keyX = keyLight.position.x;
  lightingControls.keyY = keyLight.position.y;
  lightingControls.keyZ = keyLight.position.z;
  lightingControls.keyIntensity = keyLight.intensity;
  lightingControls.ambientIntensity = ambientLight.intensity;
  lightingControls.interiorIntensity = interiorLight.intensity;
  lightingControls.exposure = renderer.toneMappingExposure;
  lightingControls.environmentIntensity = scene.environmentIntensity ?? 0;
}

function applyLightingControls() {
  keyLight.position.set(
    lightingControls.keyX,
    lightingControls.keyY,
    lightingControls.keyZ
  );
  keyLight.intensity = lightingControls.keyIntensity;
  keyLight.shadow.camera.near = 1;
  keyLight.shadow.camera.far = 50;
  keyLight.shadow.camera.left = -20;
  keyLight.shadow.camera.right = 20;
  keyLight.shadow.camera.top = 20;
  keyLight.shadow.camera.bottom = -20;
  keyLight.shadow.radius = 4;
  keyLight.shadow.blurSamples = 8;
  ambientLight.intensity = lightingControls.ambientIntensity;
  fillLight.color.set(0xdbe7ff);
  fillLight.position.set(-6, 5.5, -4.5);
  fillLight.intensity = 0.16;
  rimLight.color.set(0xfff2de);
  rimLight.position.set(2.5, 4.2, -7.5);
  rimLight.intensity = 0.05;
  interiorLight.intensity = lightingControls.interiorIntensity;
  renderer.toneMappingExposure = lightingControls.exposure;
  scene.environmentIntensity = lightingControls.environmentIntensity;
}

function applyHorizonFog() {
  if (isRaining) {
    return;
  }

  const horizonColor = groundMaterial.userData.shader?.uniforms?.uSkyColor?.value
    || (scene.background instanceof THREE.Color ? scene.background : daySkyBackground);
  scene.fog = new THREE.Fog(horizonColor.getHex(), 22, 175);
  renderer.setClearColor(horizonColor);
}

function syncGroundSkyBlendColor(color = null) {
  const manualHorizonColor = environmentControls?.horizonColor
    ? new THREE.Color(environmentControls.horizonColor)
    : daySkyBackground.clone();
  const skyDrivenColor = color?.clone?.()
    || (scene.background instanceof THREE.Color ? scene.background.clone() : daySkyBackground.clone());
  const timeBlend = THREE.MathUtils.clamp((timeOfDayControls?.value ?? 0) / 2, 0, 1);
  const rainHorizonBlend = isRaining ? 0.82 : 0.0;
  const targetColor = manualHorizonColor.clone().lerp(
    skyDrivenColor,
    Math.max(timeBlend, rainHorizonBlend),
  );
  const baseHorizonOpacity = THREE.MathUtils.lerp(1.0, 0.42, timeBlend);
  const horizonOpacity = isRaining
    ? Math.min(baseHorizonOpacity, 0.26)
    : baseHorizonOpacity;

  if (groundMaterial.userData.shader?.uniforms?.uSkyColor) {
    groundMaterial.userData.shader.uniforms.uSkyColor.value.copy(targetColor);
    groundMaterial.userData.shader.uniforms.uHorizonOpacity.value = horizonOpacity;
  }

  if (grassMaterial?.uniforms?.uSkyColor) {
    grassMaterial.uniforms.uSkyColor.value.copy(targetColor);
  }

  applyHorizonFog();
}

function updateGroundColor(t) {
  const groundMat = groundMaterial;
  if (!groundMat) {
    return;
  }

  const clampedT = THREE.MathUtils.clamp(t, 0, 2);
  const day = new THREE.Color(0xdfe8d8);
  const sunset = new THREE.Color(0xdcc9aa);
  const night = new THREE.Color(0x50606a);
  const color = clampedT < 1
    ? day.clone().lerp(sunset, clampedT)
    : sunset.clone().lerp(night, clampedT - 1);

  groundMat.color.copy(color);

  if (groundMat.userData.shader?.uniforms?.uGroundColor) {
    groundMat.userData.shader.uniforms.uGroundColor.value.copy(groundMat.color);
  }

  groundMat.needsUpdate = true;
}

function updateLighting(t) {
  const clampedT = THREE.MathUtils.clamp(t, 0, 2);
  const phaseT = clampedT < 1 ? clampedT : clampedT - 1;
  const dayColor = new THREE.Color(0xffffff);
  const sunsetColor = new THREE.Color(0xffaa66);
  const nightColor = new THREE.Color(0x8899ff);
  const dayHemi = new THREE.Color(0xffffff);
  const sunsetHemi = new THREE.Color(0xffc18c);
  const nightHemi = new THREE.Color(0x8ea0ff);
  const dayGround = new THREE.Color(0x222233);
  const sunsetGround = new THREE.Color(0x3d2f26);
  const nightGround = new THREE.Color(0x101621);

  if (clampedT < 1) {
    lightingControls.keyIntensity = THREE.MathUtils.lerp(1.2, 0.8, phaseT);
    lightingControls.keyX = THREE.MathUtils.lerp(5, 5, phaseT);
    lightingControls.keyY = THREE.MathUtils.lerp(10, 5, phaseT);
    lightingControls.keyZ = THREE.MathUtils.lerp(5, 2, phaseT);
    lightingControls.ambientIntensity = THREE.MathUtils.lerp(0.2, 0.14, phaseT);
    lightingControls.interiorIntensity = THREE.MathUtils.lerp(0.12, 0.08, phaseT);
    lightingControls.exposure = THREE.MathUtils.lerp(1.0, 0.85, phaseT);
    lightingControls.environmentIntensity = THREE.MathUtils.lerp(0.3, 0.22, phaseT);
    keyLight.color.copy(dayColor).lerp(sunsetColor, phaseT);
    hemiLight.color.copy(dayHemi).lerp(sunsetHemi, phaseT);
    hemiLight.groundColor.copy(dayGround).lerp(sunsetGround, phaseT);
    hemiLight.intensity = THREE.MathUtils.lerp(0.6, 0.4, phaseT);
  } else {
    lightingControls.keyIntensity = THREE.MathUtils.lerp(0.8, 0.3, phaseT);
    lightingControls.keyX = THREE.MathUtils.lerp(5, 0, phaseT);
    lightingControls.keyY = THREE.MathUtils.lerp(5, 3, phaseT);
    lightingControls.keyZ = THREE.MathUtils.lerp(2, -5, phaseT);
    lightingControls.ambientIntensity = THREE.MathUtils.lerp(0.14, 0.08, phaseT);
    lightingControls.interiorIntensity = THREE.MathUtils.lerp(0.08, 0.05, phaseT);
    lightingControls.exposure = THREE.MathUtils.lerp(0.85, 0.6, phaseT);
    lightingControls.environmentIntensity = THREE.MathUtils.lerp(0.22, 0.12, phaseT);
    keyLight.color.copy(sunsetColor).lerp(nightColor, phaseT);
    hemiLight.color.copy(sunsetHemi).lerp(nightHemi, phaseT);
    hemiLight.groundColor.copy(sunsetGround).lerp(nightGround, phaseT);
    hemiLight.intensity = THREE.MathUtils.lerp(0.4, 0.2, phaseT);
  }

  applyLightingControls();
}

function updateSky(t) {
  if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
    if (!(scene.background instanceof THREE.Color)) {
      scene.background = energyModeBackground.clone();
    }
    scene.background.copy(energyModeBackground);
    syncGroundSkyBlendColor(scene.background);
    renderer.setClearColor(scene.background);
    if (skyboxMesh) {
      skyboxMesh.visible = false;
    }
    return;
  }
  if (!(scene.background instanceof THREE.Color)) {
    scene.background = daySkyBackground.clone();
  }
  if (!skyboxMesh) {
    return;
  }

  const clampedT = THREE.MathUtils.clamp(t, 0, 2);
  const day = daySkyBackground.clone();
  const sunset = new THREE.Color(0xff8844);
  const night = new THREE.Color(0x0a0a2a);
  let backgroundColor;
  let opacity;

  if (clampedT < 1) {
    backgroundColor = day.clone().lerp(sunset, clampedT);
    opacity = THREE.MathUtils.lerp(1.0, 0.85, clampedT);
  } else {
    backgroundColor = sunset.clone().lerp(night, clampedT - 1);
    opacity = THREE.MathUtils.lerp(0.85, 0.7, clampedT - 1);
  }

  scene.background.copy(backgroundColor);
  syncGroundSkyBlendColor(backgroundColor);
  skyboxMesh.material.forEach((material) => {
    material.opacity = opacity;
    material.needsUpdate = true;
  });
}

function updateBuildingNightGlow(t) {
  const nightFactor = THREE.MathUtils.smoothstep(THREE.MathUtils.clamp(t, 0, 2), 1.05, 1.9);
  const interactiveMaterials = [...new Set(houseInteractiveMaterials)];

  interactiveMaterials.forEach((material) => {
    if (!material?.userData?.houseStaticBaseEmissive) {
      return;
    }

    const glowColor = material.userData.houseNightGlowColor || new THREE.Color(0xffd39a);
    const glowStrength = material.userData.houseNightGlowStrength ?? 0.05;
    const baseEmissive = material.userData.houseStaticBaseEmissive.clone().lerp(glowColor, 0.18 * nightFactor);
    const baseIntensity = material.userData.houseStaticBaseEmissiveIntensity + glowStrength * nightFactor;

    material.userData.houseBaseEmissive.copy(baseEmissive);
    material.userData.houseBaseEmissiveIntensity = baseIntensity;
    material.userData.houseHoverEmissive.copy(baseEmissive.clone().lerp(interactionAccentColor, 0.55));
    material.userData.houseHoverEmissiveIntensity = Math.max(baseIntensity + 0.08, 0.08);
    material.userData.houseSelectedEmissive.copy(baseEmissive.clone().lerp(interactionAccentColorStrong, 0.72));
    material.userData.houseSelectedEmissiveIntensity = Math.max(baseIntensity + 0.18, 0.16);
  });

  houseInteractiveMaterials.forEach((material) => {
    if (!material?.userData?.houseBaseEmissive) {
      return;
    }

    const targetEmissive = houseSelected
      ? (material.userData.houseSelectedEmissive || material.userData.houseHoverEmissive)
      : (houseHovered ? material.userData.houseHoverEmissive : material.userData.houseBaseEmissive);
    const targetIntensity = houseSelected
      ? (material.userData.houseSelectedEmissiveIntensity ?? material.userData.houseHoverEmissiveIntensity)
      : (houseHovered ? material.userData.houseHoverEmissiveIntensity : material.userData.houseBaseEmissiveIntensity);
    const currentIntensity = material.emissiveIntensity ?? 0;
    material.emissive.lerp(targetEmissive, 0.18);
    material.emissiveIntensity = THREE.MathUtils.lerp(currentIntensity, targetIntensity, 0.18);
  });
}

function updateTimeSliderVisual(value = timeOfDayControls.value) {
  if (!timeOfDaySlider) {
    return;
  }

  const percentage = (THREE.MathUtils.clamp(value, 0, 2) / 2) * 100;
  timeOfDaySlider.style.background = `linear-gradient(90deg,
    rgba(255, 153, 102, 0.95) 0%,
    rgba(255, 204, 136, 0.98) 50%,
    rgba(136, 153, 255, 0.95) 100%)`;
  timeOfDaySlider.style.backgroundSize = '100% 100%';
  timeOfDaySlider.style.boxShadow = `inset ${percentage * 0.01}px 0 0 rgba(255,255,255,0.0)`;
}

function setTime(mode) {
  let normalizedValue = 0;
  if (typeof mode === 'string') {
    normalizedValue = mode === 'Sunset' ? 1 : mode === 'Night' ? 2 : 0;
  } else {
    normalizedValue = THREE.MathUtils.clamp(mode, 0, 2);
  }

  timeOfDayControls.value = normalizedValue;
  timeOfDayControls.mode = normalizedValue < 0.5 ? 'Day' : normalizedValue < 1.5 ? 'Sunset' : 'Night';
  updateLighting(normalizedValue);
  updateGroundColor(normalizedValue);
  updateSky(normalizedValue);
  applyHorizonFog();
  updateBuildingNightGlow(normalizedValue);
  energyTrackingVisualState.targetLevel = getEnergySolarProfile(getEnergyTimeOfDay()).emissiveBoost;
  if (isRaining) {
    applyRainMode();
  }
  if (timeOfDaySlider) {
    timeOfDaySlider.value = normalizedValue.toFixed(2);
  }
  if (timeOfDayValueLabel) {
    timeOfDayValueLabel.textContent = timeOfDayControls.mode;
  }
  updateTimeSliderVisual(normalizedValue);
  saveEnvironmentToStorage();
  refreshGui();
}

function updateRain() {
  if (!rain || !rainPositions || !isRaining) {
    return;
  }

  for (let i = 0; i < rainPositions.length; i += 3) {
    rainPositions[i] += 0.045;
    rainPositions[i + 1] -= 4.1;
    rainPositions[i + 2] += 0.082;

    if (rainPositions[i + 1] < 0) {
      rainPositions[i] = (Math.random() - 0.5) * 56;
      rainPositions[i + 1] = Math.random() * 18 + 36;
      rainPositions[i + 2] = (Math.random() - 0.5) * 56;
    }
  }

  rain.geometry.attributes.position.needsUpdate = true;
  rain.position.set(camera.position.x, groundPlane.position.y, camera.position.z);
}

function applyRainMode() {
  if (!rain || !isRaining) {
    return;
  }

  rain.visible = true;
  if (!(scene.background instanceof THREE.Color)) {
    scene.background = new THREE.Color(0xa9b8c8);
  }
  scene.background.set(0xa9b8c8);
  renderer.setClearColor(scene.background);
  syncGroundSkyBlendColor(scene.background);
  keyLight.intensity = Math.min(keyLight.intensity, 0.68);
  keyLight.color.set(0xcfd6df);
  hemiLight.intensity = Math.min(hemiLight.intensity, 0.22);
  ambientLight.intensity = Math.min(ambientLight.intensity, 0.12);
  fillLight.intensity = Math.min(fillLight.intensity, 0.14);
  rimLight.intensity = Math.min(rimLight.intensity, 0.04);
  renderer.toneMappingExposure = Math.min(renderer.toneMappingExposure, 0.78);
  const rainHorizonColor = groundMaterial.userData.shader?.uniforms?.uSkyColor?.value
    || scene.background;
  scene.fog = new THREE.Fog(rainHorizonColor.getHex(), 16, 78);
  if (skyboxMesh) {
    skyboxMesh.visible = true;
    skyboxMesh.material.forEach((material) => {
      material.opacity = 0.62;
      material.color.set(0x9eaab7);
      material.needsUpdate = true;
    });
  }
  groundMaterial.color.set(0xcfd7cc);
  if (rain.material) {
    rain.material.color.set(0xbfdcff);
    rain.material.opacity = 0.62;
    rain.material.size = 0.13;
  }
  if (groundMaterial.userData.shader?.uniforms?.uGroundColor) {
    groundMaterial.userData.shader.uniforms.uGroundColor.value.copy(groundMaterial.color);
  }
  groundMaterial.needsUpdate = true;
}

function enableRain() {
  isRaining = true;
  restoreLiveModeBaseline();
  applyRainMode();
  if (rainButton) {
    rainButton.innerText = 'Rain: ON';
    rainButton.style.color = 'rgba(255,255,255,0.98)';
    rainButton.style.background = 'rgba(255,255,255,0.15)';
    rainButton.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,0.04)';
  }
}

function disableRain() {
  isRaining = false;
  if (rain) {
    rain.visible = false;
  }
  scene.fog = null;
  restoreLiveModeBaseline();
  setTime(timeOfDayControls.value);
  if (rainButton) {
    rainButton.innerText = 'Rain: OFF';
    rainButton.style.color = 'rgba(255,255,255,0.78)';
    rainButton.style.background = '';
    rainButton.style.boxShadow = '';
  }
}

function ensureTopControlsContainer() {
  if (!isPrimaryHouseDetailPage) {
    return null;
  }

  if (topControlsContainer) {
    return topControlsContainer;
  }

  topControlsContainer = document.createElement('div');
  topControlsContainer.className = 'container-top';
  document.body.appendChild(topControlsContainer);
  return topControlsContainer;
}

function syncTopControlsPosition() {
  if (!topControlsContainer) {
    return;
  }

  const width = topControlsContainer.getBoundingClientRect().width;
  if (width > 0) {
    topControlsContainer.style.left = `${Math.round((window.innerWidth - width) * 0.5)}px`;
    topControlsContainer.style.transform = 'none';
  }
}

function syncTimeOfDayPanelWidth() {
  if (!timeOfDaySliderPanel || !topControlsContainer) {
    return;
  }

  const topRect = topControlsContainer.getBoundingClientRect();
  const topWidth = topRect.width;
  if (topWidth > 0) {
    timeOfDaySliderPanel.style.width = `${Math.round(topWidth)}px`;
    timeOfDaySliderPanel.style.left = '50%';
    timeOfDaySliderPanel.style.transform = 'translateX(-50%)';
  }
}

function setupRainButton() {
  if (!isPrimaryHouseDetailPage || rainButton) {
    return;
  }

  rainButton = document.createElement('button');
  rainButton.innerText = 'Rain: OFF';
  rainButton.className = 'glass-panel';
  rainButton.style.position = 'relative';
  rainButton.style.padding = '0 18px';
  rainButton.style.color = 'rgba(255,255,255,0.78)';
  rainButton.style.cursor = 'pointer';
  rainButton.style.font = '500 14px/1.2 "Helvetica Neue", Arial, sans-serif';
  rainButton.style.letterSpacing = '0.06em';
  rainButton.style.textTransform = 'uppercase';
  rainButton.style.whiteSpace = 'nowrap';
  rainButton.onclick = () => {
    if (isRaining) {
      disableRain();
    } else {
      enableRain();
    }
  };

  ensureTopControlsContainer()?.appendChild(rainButton);
  syncTopControlsPosition();
  syncTimeOfDayPanelWidth();
}

function getObjectWorldCenter(object) {
  const box = new THREE.Box3().setFromObject(object);
  return box.getCenter(new THREE.Vector3());
}

function clampEnergyLevel(value) {
  return THREE.MathUtils.clamp(value, 0, 1);
}

function setEnergyLevel(value) {
  energyLevel = clampEnergyLevel(value);
  energyTrackingVisualState.targetLevel = energyLevel;
  return energyLevel;
}

if (typeof window !== 'undefined') {
  window.setEnergyLevel = setEnergyLevel;
  Object.defineProperty(window, 'energyLevel', {
    configurable: true,
    get: () => energyLevel,
    set: (value) => {
      setEnergyLevel(value);
    },
  });
}

function createEnergyFlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, 'rgba(176, 230, 255, 0.96)');
  gradient.addColorStop(0.48, 'rgba(98, 255, 239, 1)');
  gradient.addColorStop(1, 'rgba(173, 138, 255, 0.96)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 26; i += 1) {
    const x = (i / 26) * canvas.width;
    const width = 18 + Math.random() * 38;
    const pulse = ctx.createLinearGradient(x, 0, x + width, 0);
    pulse.addColorStop(0, 'rgba(255,255,255,0)');
    pulse.addColorStop(0.5, 'rgba(255,255,255,0.82)');
    pulse.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = pulse;
    ctx.fillRect(x, 0, width, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(3.5, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const sharedEnergyParticleTexture = createEnergyParticleTexture();

function createEnergyParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(64, 64, 6, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.35, 'rgba(165,255,255,0.95)');
  gradient.addColorStop(0.72, 'rgba(85,190,255,0.42)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function createEnergyNode(position, color) {
  const group = new THREE.Group();
  group.position.copy(position);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 18, 18),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    })
  );
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: sharedEnergyParticleTexture,
    color,
    transparent: true,
    opacity: 0.46,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
  }));
  glow.scale.setScalar(0.74);

  const burst = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.18, 32),
    new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.34,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      side: THREE.DoubleSide,
    })
  );
  burst.rotation.x = Math.PI / 2;
  burst.userData.baseScale = 1;

  group.add(core);
  group.add(glow);
  group.add(burst);
  group.userData.core = core;
  group.userData.glow = glow;
  group.userData.burst = burst;
  return group;
}

function createEnergyParticles(curve, count, color) {
  const positions = new Float32Array(count * 3);
  const progress = new Float32Array(count);
  const speeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    const t = Math.random();
    const point = curve.getPointAt(t);
    positions[i * 3] = point.x;
    positions[i * 3 + 1] = point.y;
    positions[i * 3 + 2] = point.z;
    progress[i] = t;
    speeds[i] = 0.07 + Math.random() * 0.12;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    map: sharedEnergyParticleTexture,
    color,
    size: 0.14,
    transparent: true,
    opacity: 0.82,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.userData.progress = progress;
  points.userData.speeds = speeds;
  return points;
}

function createEnergyFlowSystem(curve, index, activeLevel = energyTrackingVisualState.currentLevel) {
  const outerTexture = createEnergyFlowTexture();
  const innerTexture = createEnergyFlowTexture();
  const coreTexture = createEnergyFlowTexture();
  [outerTexture, innerTexture, coreTexture].forEach((texture) => {
    texture.repeat.set(3 + index * 0.35, 1);
  });

  const group = new THREE.Group();
  const tubularSegments = 96;
  const radialSegments = 14;
  const level = clampEnergyLevel(activeLevel);
  const outerGeometry = new THREE.TubeGeometry(curve, tubularSegments, 0.078 + level * 0.03, radialSegments, false);
  const innerGeometry = new THREE.TubeGeometry(curve, tubularSegments, 0.046 + level * 0.02, radialSegments, false);
  const coreGeometry = new THREE.TubeGeometry(curve, tubularSegments, 0.02 + level * 0.012, radialSegments, false);

  const aura = new THREE.Mesh(
    outerGeometry,
    new THREE.MeshBasicMaterial({
      map: outerTexture,
      color: 0x76deff,
      transparent: true,
      opacity: 0.08 + level * 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
    })
  );
  const innerTube = new THREE.Mesh(
    innerGeometry,
    new THREE.MeshBasicMaterial({
      map: innerTexture,
      color: 0x8eeeff,
      transparent: true,
      opacity: 0.12 + level * 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    })
  );
  const coreBeam = new THREE.Mesh(
    coreGeometry,
    new THREE.MeshBasicMaterial({
      map: coreTexture,
      color: 0xe8fdff,
      transparent: true,
      opacity: 0.36 + level * 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      toneMapped: false,
    })
  );

  const sourceNode = createEnergyNode(curve.getPointAt(0), 0x9fefff);
  const targetNode = createEnergyNode(curve.getPointAt(1), index === 2 ? 0xa98fff : 0x74efff);
  const particleCount = Math.round(10 + level * 22);
  const particles = createEnergyParticles(curve, particleCount, index === 2 ? 0xb39dff : 0x9df8ff);

  group.add(aura);
  group.add(innerTube);
  group.add(coreBeam);
  group.add(sourceNode);
  group.add(targetNode);
  group.add(particles);
  group.userData.layers = [aura, innerTube, coreBeam];
  group.userData.textures = [outerTexture, innerTexture, coreTexture];
  group.userData.sourceNode = sourceNode;
  group.userData.targetNode = targetNode;
  group.userData.particles = particles;
  group.userData.curve = curve;
  group.userData.baseSpeed = 0.12 + index * 0.03;
  group.userData.phase = index * 0.37;
  group.userData.particleBaseSize = particles.material.size;
  group.userData.baseParticleCount = particleCount;
  group.userData.baseLayerOpacity = [
    aura.material.opacity,
    innerTube.material.opacity,
    coreBeam.material.opacity,
  ];
  group.userData.activationOffset = index * 0.22;
  return group;
}

function getEnergyTimeOfDay() {
  return THREE.MathUtils.clamp(timeOfDayControls.value / 2, 0, 1);
}

function getEnergySolarProfile(timeOfDay) {
  const t = THREE.MathUtils.clamp(timeOfDay, 0, 1);
  const morningColor = new THREE.Color(0xa9dcff);
  const middayColor = new THREE.Color(0xf3ffff);
  const afternoonColor = new THREE.Color(0x9bdcff);
  const sunsetColor = new THREE.Color(0xfff0c7);
  const nightColor = new THREE.Color(0xe2d2a8);

  let flowColor = morningColor.clone();
  if (t <= 0.5) {
    flowColor.lerp(middayColor, t / 0.5);
  } else if (t <= 0.72) {
    flowColor = middayColor.clone().lerp(afternoonColor, (t - 0.5) / 0.22);
  } else if (t <= 0.86) {
    flowColor = afternoonColor.clone().lerp(sunsetColor, (t - 0.72) / 0.14);
  } else {
    flowColor = sunsetColor.clone().lerp(nightColor, (t - 0.86) / 0.14);
  }

  const solarStrength = Math.max(0, Math.sin(t * Math.PI));
  const visibility = THREE.MathUtils.lerp(0.04, 1.0, Math.pow(solarStrength, 1.25));
  const speed = THREE.MathUtils.lerp(0.18, 1.0, Math.pow(solarStrength, 1.1));
  const particleDensity = THREE.MathUtils.lerp(0.06, 1.0, Math.pow(solarStrength, 1.2));
  const emissiveBoost = THREE.MathUtils.lerp(0.18, 1.0, Math.pow(solarStrength, 1.1));

  return {
    timeOfDay: t,
    color: flowColor,
    visibility,
    speed,
    particleDensity,
    emissiveBoost,
  };
}

function getWorldBoundsCenter(object) {
  return new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
}

function createRoundedOrthogonalCurve(points, cornerRadius = 0.22) {
  if (points.length < 2) {
    return new THREE.CatmullRomCurve3(points.map((point) => point.clone()));
  }

  const smoothed = [points[0].clone()];
  for (let i = 1; i < points.length - 1; i += 1) {
    const prev = points[i - 1];
    const current = points[i];
    const next = points[i + 1];
    const inDir = prev.clone().sub(current).normalize();
    const outDir = next.clone().sub(current).normalize();
    const inLen = prev.distanceTo(current);
    const outLen = next.distanceTo(current);
    const offset = Math.min(cornerRadius, inLen * 0.35, outLen * 0.35);

    smoothed.push(current.clone().add(inDir.clone().multiplyScalar(offset)));
    smoothed.push(current.clone());
    smoothed.push(current.clone().add(outDir.clone().multiplyScalar(offset)));
  }
  smoothed.push(points[points.length - 1].clone());

  return new THREE.CatmullRomCurve3(smoothed, false, 'catmullrom', 0.2);
}

function buildOrthogonalEnergyCurve(startPoint, endPoint, bendMode = 'x-first', lift = 0.46) {
  const start = startPoint.clone();
  const end = endPoint.clone();
  const height = Math.max(start.y, end.y, groundPlane.position.y + lift);
  start.y = height;
  end.y = height;

  const points = [start.clone()];
  if (bendMode === 'z-first') {
    points.push(new THREE.Vector3(start.x, height, end.z));
  } else {
    points.push(new THREE.Vector3(end.x, height, start.z));
  }
  points.push(end.clone());

  return createRoundedOrthogonalCurve(points);
}

function ensurePvEnergyEdgeGlow() {
  if (!pvModelRef) {
    return;
  }

  pvEnergyEdgeGlows.length = 0;
  pvModelRef.traverse((child) => {
    if (!child.isMesh || !child.geometry) {
      return;
    }

    if (!child.userData.pvEnergyEdgeGlow) {
      const edges = new THREE.EdgesGeometry(child.geometry, 32);
      const edgeMaterial = new THREE.LineBasicMaterial({
        color: 0x9fe3ff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      });
      const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
      edgeLines.visible = false;
      edgeLines.renderOrder = 5;
      child.add(edgeLines);
      child.userData.pvEnergyEdgeGlow = edgeLines;
    }

    if (!child.material?.userData?.pvEnergyBaseEmissive) {
      child.material.userData.pvEnergyBaseEmissive = child.material.emissive
        ? child.material.emissive.clone()
        : new THREE.Color(0x000000);
      child.material.userData.pvEnergyBaseEmissiveIntensity = child.material.emissiveIntensity ?? 0;
    }

    pvEnergyEdgeGlows.push(child.userData.pvEnergyEdgeGlow);
  });
}

function updatePvEnergyVisuals(isActive, level = energyTrackingVisualState.currentLevel) {
  if (!pvModelRef) {
    return;
  }

  const clampedLevel = clampEnergyLevel(level);
  ensurePvEnergyEdgeGlow();

  pvModelRef.traverse((child) => {
    if (!child.isMesh || !child.material) {
      return;
    }

    const edgeGlow = child.userData.pvEnergyEdgeGlow;
    if (edgeGlow) {
      edgeGlow.visible = isActive;
      edgeGlow.material.opacity = isActive ? 0.18 + clampedLevel * 0.32 : 0;
    }

    if (!child.material.emissive) {
      child.material.emissive = new THREE.Color(0x000000);
    }
    const baseEmissive = child.material.userData.pvEnergyBaseEmissive || new THREE.Color(0x000000);
    const baseIntensity = child.material.userData.pvEnergyBaseEmissiveIntensity ?? 0;
    const targetEmissive = isActive ? interactionAccentColor : baseEmissive;
    const targetIntensity = isActive ? Math.max(0.18 + clampedLevel * 0.45, baseIntensity) : baseIntensity;
    child.material.emissive.lerp(targetEmissive, 0.16);
    child.material.emissiveIntensity = THREE.MathUtils.lerp(
      child.material.emissiveIntensity ?? baseIntensity,
      targetIntensity,
      0.16
    );
  });
}

function setEnergySectionVisualState(isActive) {
  if (isActive) {
    sceneSection = 'energy section';
  }
  bloomPass.strength = isActive ? 0.18 + energyTrackingVisualState.currentLevel * 0.28 : 0.0;
  bloomPass.radius = isActive ? 0.42 : 0.0;
  bloomPass.threshold = isActive ? 0.78 : 1.0;
}

function ensureFadeMaterialState(material) {
  if (!material?.userData) {
    return null;
  }

  if (!material.userData.fadeState) {
    material.userData.fadeState = {
      opacity: material.opacity ?? 1,
      transparent: material.transparent ?? false,
      depthWrite: material.depthWrite ?? true,
    };
  }

  return material.userData.fadeState;
}

function applyFadeToMaterial(material, alpha) {
  const fadeState = ensureFadeMaterialState(material);
  if (!fadeState) {
    return;
  }

  const clampedAlpha = THREE.MathUtils.clamp(alpha, 0, 1);
  const nextOpacity = fadeState.opacity * clampedAlpha;
  const nextTransparent = clampedAlpha < 0.999 ? true : fadeState.transparent;
  const nextDepthWrite = clampedAlpha > 0.98 ? fadeState.depthWrite : false;
  if (material.opacity !== nextOpacity) {
    material.opacity = nextOpacity;
    material.needsUpdate = true;
  }
  if (material.transparent !== nextTransparent) {
    material.transparent = nextTransparent;
    material.needsUpdate = true;
  }
  if ('depthWrite' in material && material.depthWrite !== nextDepthWrite) {
    material.depthWrite = nextDepthWrite;
    material.needsUpdate = true;
  }
}

function setObjectFade(target, alpha) {
  if (!target) {
    return;
  }

  const clampedAlpha = THREE.MathUtils.clamp(alpha, 0, 1);
  const shouldBeVisible = clampedAlpha > 0.01;
  target.visible = shouldBeVisible;

  const applyObjectMaterialFade = (object) => {
    if (!object?.material) {
      return;
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => applyFadeToMaterial(material, clampedAlpha));
  };

  applyObjectMaterialFade(target);
  if (target.traverse) {
    target.traverse((child) => {
      applyObjectMaterialFade(child);
    });
  }
}

function ensureEnergyMaterialState(material) {
  if (!material?.userData) {
    return null;
  }

  if (!material.userData.energyModeState) {
    material.userData.energyModeState = {
      color: material.color?.clone ? material.color.clone() : null,
      roughness: material.roughness,
      metalness: material.metalness,
      envMapIntensity: material.envMapIntensity,
      emissive: material.emissive?.clone ? material.emissive.clone() : new THREE.Color(0x000000),
      emissiveIntensity: material.emissiveIntensity ?? 0,
      transparent: material.transparent ?? false,
      opacity: material.opacity ?? 1,
      transmission: material.transmission,
      clearcoat: material.clearcoat,
      clearcoatRoughness: material.clearcoatRoughness,
    };
  }

  return material.userData.energyModeState;
}

function applyEnergyModeMaterialLook(blend) {
  const clampedBlend = THREE.MathUtils.clamp(blend, 0, 1);
  const houseOffWhite = new THREE.Color(0xf5f5f3);
  const houseGlassWhite = new THREE.Color(0xefefea);
  const groundStudioColor = new THREE.Color(0xe6e6e6);
  const houseMaterials = [...new Set([...detailMaterials, ...houseInteractiveMaterials])];

  houseMaterials.forEach((material) => {
    const base = ensureEnergyMaterialState(material);
    if (!base) {
      return;
    }

    const isGlassLike = material.transparent || (material.transmission ?? 0) > 0.05;
    if (material.color && base.color) {
      material.color.copy(base.color).lerp(isGlassLike ? houseGlassWhite : houseOffWhite, clampedBlend);
    }
    if (material.emissive) {
      material.emissive.copy(base.emissive).lerp(new THREE.Color(0x000000), clampedBlend);
      material.emissiveIntensity = THREE.MathUtils.lerp(base.emissiveIntensity ?? 0, 0, clampedBlend);
    }
    if (material.roughness != null) {
      material.roughness = THREE.MathUtils.lerp(
        base.roughness ?? (isGlassLike ? 0.12 : 0.76),
        isGlassLike ? 0.36 : 0.68,
        clampedBlend
      );
    }
    if (material.metalness != null) {
      material.metalness = THREE.MathUtils.lerp(base.metalness ?? 0, 0, clampedBlend);
    }
    if ('envMapIntensity' in material) {
      material.envMapIntensity = THREE.MathUtils.lerp(base.envMapIntensity ?? 0.38, isGlassLike ? 0.14 : 0.08, clampedBlend);
    }
    if (isGlassLike) {
      if ('transmission' in material) {
        material.transmission = THREE.MathUtils.lerp(base.transmission ?? 0.68, 0.12, clampedBlend);
      }
      if ('clearcoat' in material) {
        material.clearcoat = THREE.MathUtils.lerp(base.clearcoat ?? 0.4, 0.12, clampedBlend);
      }
      if ('clearcoatRoughness' in material) {
        material.clearcoatRoughness = THREE.MathUtils.lerp(base.clearcoatRoughness ?? 0.12, 0.28, clampedBlend);
      }
      material.opacity = THREE.MathUtils.lerp(base.opacity ?? 1, 0.94, clampedBlend);
      material.transparent = true;
    } else {
      material.opacity = THREE.MathUtils.lerp(base.opacity ?? 1, 1, clampedBlend);
      material.transparent = base.transparent ?? false;
    }
    material.needsUpdate = true;
  });

  ensureEnergyMaterialState(groundMaterial);
  const groundBase = groundMaterial.userData.energyModeState;
  groundMaterial.color.copy(groundBase.color || new THREE.Color(environmentControls.groundColor)).lerp(groundStudioColor, clampedBlend);
  groundMaterial.emissive.copy(groundBase.emissive || new THREE.Color(0x000000));
  groundMaterial.emissiveIntensity = THREE.MathUtils.lerp(groundBase.emissiveIntensity ?? 0, 0.0, clampedBlend);
  groundMaterial.roughness = THREE.MathUtils.lerp(groundBase.roughness ?? 0.98, 0.28, clampedBlend);
  groundMaterial.metalness = THREE.MathUtils.lerp(groundBase.metalness ?? 0.0, 0.0, clampedBlend);
  groundMaterial.envMap = clampedBlend > 0.01 ? roomEnvironmentTexture : null;
  groundMaterial.envMapIntensity = THREE.MathUtils.lerp(0.0, 0.22, clampedBlend);
  groundMaterial.needsUpdate = true;

  if (groundMaterial.userData.shader) {
    groundMaterial.userData.shader.uniforms.uGroundColor.value.copy(groundMaterial.color);
    groundMaterial.userData.shader.uniforms.uSkyColor.value.copy(
      daySkyBackground.clone().lerp(energyModeBackground, clampedBlend)
    );
  }

  objectContactShadows.forEach((shadow) => {
    if (!shadow?.material) {
      return;
    }
    if (shadow.material.userData.energyBaseOpacity == null) {
      shadow.material.userData.energyBaseOpacity = shadow.material.opacity;
    }
    const baseOpacity = shadow.material.userData.energyBaseOpacity;
    shadow.material.opacity = THREE.MathUtils.lerp(baseOpacity, Math.min(baseOpacity, 0.08), clampedBlend);
  });
}

function getEnergyFadeTargets() {
  return [
    groundPlane,
    grassField,
    rain,
    pulseField,
    ...pulseWaves,
    storageModelRef,
    treeModelRef,
    treeModelRef2,
    treeModelRef3,
    treeModelRef4,
    palmModelRef,
    palmModelRef2,
  ];
}

function updateIsolateButtonLabel() {
  if (!isolateButton) {
    return;
  }
  isolateButton.textContent = isolateSceneActive ? 'Show All' : 'Hide';
}

function isHouseIsolationActive() {
  return isHouseIsolatePage && isolateSceneActive;
}

function setHouseRoofVisibility(visible) {
  houseMeshes.forEach((mesh) => {
    if (mesh?.userData?.houseRoofLike) {
      mesh.visible = visible;
    }
  });
}

function applyHouseIsolateState() {
  if (!isHouseIsolatePage) {
    return;
  }

  if (!isolateButton) {
    isolateButton = document.getElementById('isolate-toggle');
    if (isolateButton) {
      isolateButton.addEventListener('click', () => {
        isolateSceneActive = !isolateSceneActive;
        updateIsolateButtonLabel();
      });
      updateIsolateButtonLabel();
    }
  }

  if (!isHouseIsolationActive()) {
    setHouseRoofVisibility(true);
    return;
  }

  const hiddenTargets = [
    carModelRef,
    lngModelRef,
    storageModelRef,
    pvModelRef,
    treeModelRef,
    treeModelRef2,
    treeModelRef3,
    treeModelRef4,
    palmModelRef,
    palmModelRef2,
    grassField,
    rain,
    pulseField,
    ...pulseWaves,
    energyTrackingGroup,
  ];

  hiddenTargets.forEach((target) => {
    if (!target) {
      return;
    }
    setObjectFade(target, 0);
    target.visible = false;
  });

  if (groundPlane) {
    setObjectFade(groundPlane, 0);
    groundPlane.visible = false;
  }

  if (skyboxMesh) {
    skyboxMesh.visible = false;
    skyboxMesh.material.forEach((material) => applyFadeToMaterial(material, 0));
  }

  if (houseWrapper) {
    houseWrapper.visible = true;
    setObjectFade(houseWrapper, 1);
  }

  setHouseRoofVisibility(false);

  if (rain) {
    rain.visible = false;
  }

  objectContactShadows.forEach((shadow) => {
    if (shadow) {
      shadow.visible = false;
    }
  });

  hideFloatingInfoPanel(pvInfoPanel);
  hideFloatingInfoPanel(storageInfoPanel);
}
function restoreLiveModeBaseline({ resetCamera = false } = {}) {
  applyDetailBaseline();
  setTime(timeOfDayControls.value);
  setEnergySectionVisualState(false);

  getEnergyFadeTargets().forEach((target) => {
    if (!target) {
      return;
    }
    setObjectFade(target, 1);
  });

  if (houseWrapper) {
    houseWrapper.visible = true;
    setObjectFade(houseWrapper, 1);
  }
  if (pvModelRef) {
    pvModelRef.visible = true;
    setObjectFade(pvModelRef, 1);
  }
  if (skyboxMesh) {
    skyboxMesh.visible = true;
    skyboxMesh.material.forEach((material) => {
      applyFadeToMaterial(material, 1);
    });
  }

  scene.environment = detailSkybox || roomEnvironmentTexture;
  scene.environmentIntensity = lightingControls.environmentIntensity;
  if (!(scene.background instanceof THREE.Color)) {
    scene.background = daySkyBackground.clone();
  }
  renderer.setClearColor(scene.background);

  if (resetCamera) {
    camera.position.set(cameraControls.posX, cameraControls.posY, cameraControls.posZ);
    controls.target.set(cameraControls.targetX, cameraControls.targetY, cameraControls.targetZ);
    camera.fov = cameraControls.fov;
    camera.zoom = cameraControls.zoom;
    camera.updateProjectionMatrix();
    autoCamera.radius = cameraControls.radius;
    autoCamera.baseHeight = cameraControls.height;
    autoCamera.azimuth = cameraControls.azimuth;
    autoCamera.introSweep = cameraControls.introSweep;
    autoCamera.enabled = cameraControls.autoAnimate;
  }

  controls.enablePan = true;
  controls.update();
  updatePvEnergyVisuals(false, energyTrackingVisualState.currentLevel);
}

function getEnergyModeCameraState() {
  const focusBounds = new THREE.Box3().setFromObject(houseWrapper);
  focusBounds.union(new THREE.Box3().setFromObject(pvModelRef));
  const focusCenter = focusBounds.getCenter(new THREE.Vector3());
  const focusSize = focusBounds.getSize(new THREE.Vector3());
  const maxSpan = Math.max(focusSize.x, focusSize.z, focusSize.y);
  const position = new THREE.Vector3(
    focusCenter.x + Math.max(focusSize.x * 0.9, maxSpan * 0.55),
    focusCenter.y + Math.max(focusSize.y * 1.55, maxSpan * 0.92),
    focusCenter.z + Math.max(focusSize.z * 1.2, maxSpan * 0.85)
  );
  const target = focusCenter.clone();
  target.y += Math.max(focusSize.y * 0.08, 0.18);
  return { position, target };
}

function startVisualizationModeTransition(targetBlend, endCameraPosition, endCameraTarget) {
  visualizationModeTransition.start = energyModeBlend;
  visualizationModeTransition.target = targetBlend;
  visualizationModeTransition.elapsed = 0;
  visualizationModeTransition.active = true;
  visualizationModeTransition.startCameraPosition.copy(camera.position);
  visualizationModeTransition.endCameraPosition.copy(endCameraPosition || camera.position);
  visualizationModeTransition.startCameraTarget.copy(controls.target);
  visualizationModeTransition.endCameraTarget.copy(endCameraTarget || controls.target);
}

function applyEnergyModeBlend(blend) {
  const clampedBlend = THREE.MathUtils.clamp(blend, 0, 1);
  const liveAlpha = 1 - clampedBlend;

  energyModeBlend = clampedBlend;
  setEnergySectionVisualState(clampedBlend > 0.001);

  if (!(scene.background instanceof THREE.Color)) {
    scene.background = energyTrackingState.liveBackgroundColor.clone();
  }
  scene.background
    .copy(energyTrackingState.liveBackgroundColor)
    .lerp(energyModeBackground, clampedBlend);
  renderer.setClearColor(scene.background);
  renderer.toneMappingExposure = THREE.MathUtils.lerp(
    lightingControls.exposure,
    energyLightingControls.exposure,
    clampedBlend
  );

  if (clampedBlend > 0.98) {
    scene.environment = null;
    scene.environmentIntensity = 0;
  } else {
    scene.environment = detailSkybox || roomEnvironmentTexture;
    scene.environmentIntensity = lightingControls.environmentIntensity * liveAlpha;
  }

  ambientLight.intensity = THREE.MathUtils.lerp(
    lightingControls.ambientIntensity,
    energyLightingControls.ambientIntensity,
    clampedBlend
  );
  ambientLight.color.set(0xf7f3ea);
  hemiLight.intensity = THREE.MathUtils.lerp(
    0.6,
    energyLightingControls.hemiIntensity,
    clampedBlend
  );
  hemiLight.color.set(0xf8f4ec);
  hemiLight.groundColor.set(0xd9d3ca);
  keyLight.intensity = THREE.MathUtils.lerp(
    Math.max(1.2, lightingControls.keyIntensity),
    energyLightingControls.keyIntensity,
    clampedBlend
  );
  keyLight.color.set(0xfff1dc);
  keyLight.position.set(
    THREE.MathUtils.lerp(lightingControls.keyX, energyLightingControls.keyX, clampedBlend),
    THREE.MathUtils.lerp(lightingControls.keyY, energyLightingControls.keyY, clampedBlend),
    THREE.MathUtils.lerp(lightingControls.keyZ, energyLightingControls.keyZ, clampedBlend)
  );
  keyLight.shadow.radius = THREE.MathUtils.lerp(4, 6, clampedBlend);
  keyLight.shadow.blurSamples = clampedBlend > 0.5 ? 10 : 8;
  fillLight.color.set(0xdbe7ff);
  fillLight.position.set(-6.2, 5.4, -5.6);
  fillLight.intensity = THREE.MathUtils.lerp(0.16, energyLightingControls.fillIntensity, clampedBlend);
  rimLight.color.set(0xffefd8);
  rimLight.position.set(2.4, 4.8, -8.2);
  rimLight.intensity = THREE.MathUtils.lerp(0.05, energyLightingControls.rimIntensity, clampedBlend);
  interiorLight.intensity = THREE.MathUtils.lerp(
    lightingControls.interiorIntensity,
    energyLightingControls.interiorIntensity,
    clampedBlend
  );

  if (skyboxMesh) {
    skyboxMesh.visible = liveAlpha > 0.01;
    skyboxMesh.material.forEach((material) => {
      applyFadeToMaterial(material, liveAlpha);
    });
  }

  getEnergyFadeTargets().forEach((target) => {
    if (!target) {
      return;
    }
    setObjectFade(target, liveAlpha);
  });

  if (houseWrapper) {
    houseWrapper.visible = true;
    setObjectFade(houseWrapper, 1);
  }
  if (pvModelRef) {
    pvModelRef.visible = true;
    setObjectFade(pvModelRef, 1);
  }

  if (energyTrackingGroup) {
    energyTrackingGroup.visible = clampedBlend > 0.01;
    setObjectFade(energyTrackingGroup, clampedBlend);
  }

  applyEnergyModeMaterialLook(clampedBlend);
  updatePvEnergyVisuals(clampedBlend > 0.01, energyTrackingVisualState.currentLevel * Math.max(clampedBlend, 0.4));
}

function updateVisualizationModeTransition(dt) {
  if (!visualizationModeTransition.active) {
    return;
  }

  visualizationModeTransition.elapsed = Math.min(
    visualizationModeTransition.elapsed + dt,
    visualizationModeTransition.duration
  );
  const rawT = THREE.MathUtils.clamp(
    visualizationModeTransition.elapsed / visualizationModeTransition.duration,
    0,
    1
  );
  const easedT = easeInOutCubic(rawT);
  const blend = THREE.MathUtils.lerp(
    visualizationModeTransition.start,
    visualizationModeTransition.target,
    easedT
  );

  applyEnergyModeBlend(blend);
  camera.position.lerpVectors(
    visualizationModeTransition.startCameraPosition,
    visualizationModeTransition.endCameraPosition,
    easedT
  );
  controls.target.lerpVectors(
    visualizationModeTransition.startCameraTarget,
    visualizationModeTransition.endCameraTarget,
    easedT
  );

  if (rawT >= 1) {
    visualizationModeTransition.active = false;
    if (visualizationModeTransition.target < 0.01) {
      energyTrackingMode = false;
      if (energyTrackingGroup) {
        energyTrackingGroup.visible = false;
      }
      restoreLiveModeBaseline();
      sceneSection = visualizationMode === 'Live' ? 'default' : visualizationMode.toLowerCase();
    }
    autoCamera.enabled = visualizationMode === 'Live' ? energyTrackingState.autoCameraEnabled : false;
    controls.enablePan = visualizationMode !== 'Energy';
  }
}

function syncModeSwitcher() {
  if (!modeSwitcherItems.size) {
    return;
  }

  modeSwitcherItems.forEach((item, mode) => {
    const isActive = visualizationMode === mode;
    item.style.color = isActive ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.6)';
    item.style.background = isActive ? 'rgba(255,255,255,0.15)' : 'transparent';
    item.style.boxShadow = isActive ? 'inset 0 0 0 1px rgba(255,255,255,0.04)' : 'none';
  });
}

function syncDashboardOverlay() {
  if (!dashboardOverlay || !isPrimaryHouseDetailPage) {
    return;
  }

  const isDashboardMode = visualizationMode === 'Dashboard';
  dashboardOverlay.classList.toggle('visible', isDashboardMode);
  dashboardOverlay.setAttribute('aria-hidden', isDashboardMode ? 'false' : 'true');

  const activeClass = isDashboardMode ? 'dashboard-controls-muted' : 'dashboard-controls-live';
  const inactiveClass = isDashboardMode ? 'dashboard-controls-live' : 'dashboard-controls-muted';
  [topControlsContainer, timeOfDaySliderPanel, detailLabel].forEach((element) => {
    if (!element) {
      return;
    }
    element.classList.remove(inactiveClass);
    element.classList.add(activeClass);
  });
}

function lerpDashboardValue(current, target, alpha) {
  return current + (target - current) * alpha;
}

function buildDashboardLinePath(values, width, height, padding = 8) {
  if (!values.length) {
    return '';
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const step = values.length > 1 ? (width - padding * 2) / (values.length - 1) : 0;
  const points = values.map((value, index) => {
    const x = padding + step * index;
    const normalized = (value - min) / range;
    const y = height - padding - normalized * (height - padding * 2);
    return { x, y };
  });

  if (points.length === 1) {
    return `M${points[0].x},${points[0].y}`;
  }

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}

function buildGaugeArcPath(progress) {
  const clamped = THREE.MathUtils.clamp(progress, 0, 1);
  const cx = 110;
  const cy = 108;
  const radius = 90;
  const startAngle = Math.PI;
  const endAngle = Math.PI - Math.PI * clamped;
  const startX = cx + Math.cos(startAngle) * radius;
  const startY = cy + Math.sin(startAngle) * radius;
  const endX = cx + Math.cos(endAngle) * radius;
  const endY = cy + Math.sin(endAngle) * radius;
  const largeArcFlag = clamped > 0.5 ? 1 : 0;
  return `M${startX},${startY} A${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}`;
}

function simulateDashboardData(dt) {
  dashboardData.accumulator += dt;
  if (dashboardData.accumulator < 1) {
    return;
  }
  dashboardData.accumulator -= 1;

  const target = dashboardData.target;
  target.solar = THREE.MathUtils.clamp(target.solar + (Math.random() - 0.5) * 0.12, 3.8, 4.8);
  target.reference = THREE.MathUtils.clamp(target.reference + (Math.random() - 0.5) * 0.06, 3.9, 4.3);
  target.consumed = THREE.MathUtils.clamp(target.consumed + (Math.random() - 0.5) * 6, 245, 290);
  target.received = THREE.MathUtils.clamp(target.received + (Math.random() - 0.5) * 0.12, 2.1, 2.9);
  target.cost = THREE.MathUtils.clamp(target.cost + (Math.random() - 0.5) * 0.14, 3.1, 3.9);
  target.efficiency = THREE.MathUtils.clamp(target.efficiency + (Math.random() - 0.5) * 2.2, 78, 93);
  target.totalEnergy += 0.03 + Math.random() * 0.14;
  target.temperature = THREE.MathUtils.clamp(target.temperature + (Math.random() - 0.5) * 0.18, 26.0, 29.0);
  target.humanFlow = THREE.MathUtils.clamp(target.humanFlow + (Math.random() - 0.5) * 1.8, 2, 20);
  target.wind = THREE.MathUtils.clamp(target.wind + (Math.random() - 0.5) * 0.3, 5.3, 7.1);
  target.solarIntensity = THREE.MathUtils.clamp(target.solarIntensity + (Math.random() - 0.5) * 2.4, 74, 91);
  target.coverage = THREE.MathUtils.clamp(target.coverage + (Math.random() - 0.5) * 1.8, 64, 86);

  dashboardData.weatherSeries.push(target.solarIntensity + Math.random() * 1.4);
  dashboardData.balanceSeries.push(target.received * 18 + Math.random() * 6 + target.cost * 6);
  if (dashboardData.weatherSeries.length > 10) dashboardData.weatherSeries.shift();
  if (dashboardData.balanceSeries.length > 12) dashboardData.balanceSeries.shift();

  if (Math.random() > 0.66) {
    dashboardWeatherIndex = (dashboardWeatherIndex + 1) % dashboardWeatherConditions.length;
  }
}

function updateDashboardOverlayData(dt) {
  simulateDashboardData(dt);

  const current = dashboardData.current;
  const target = dashboardData.target;
  Object.keys(current).forEach((key) => {
    current[key] = lerpDashboardValue(current[key], target[key], 0.08);
  });

  if (dashboardRefs.solarValue) {
    dashboardRefs.solarValue.textContent = `${current.solar.toFixed(2)} kW`;
    dashboardRefs.referenceValue.textContent = `${current.reference.toFixed(2)} kW`;
    dashboardRefs.consumedValue.textContent = `${current.consumed.toFixed(0)} kW`;
    dashboardRefs.receivedValue.textContent = `${current.received.toFixed(2)} kW`;
    dashboardRefs.costValue.textContent = `${current.cost.toFixed(2)} kW`;
    dashboardRefs.earningValue.textContent = `${current.efficiency.toFixed(0)}%`;
    dashboardRefs.totalEnergyValue.textContent = `${current.totalEnergy.toFixed(0)} kW`;
    dashboardRefs.weatherTemp.textContent = `${current.temperature.toFixed(1)}°C`;
    dashboardRefs.weatherTempSecondary.textContent = `${current.temperature.toFixed(1)}°C`;
    dashboardRefs.weatherCondition.textContent = dashboardWeatherConditions[dashboardWeatherIndex];
    dashboardRefs.weatherConditionSecondary.textContent = dashboardWeatherConditions[dashboardWeatherIndex];
    dashboardRefs.weatherWind.textContent = `Wind ${current.wind.toFixed(1)} m/s`;
    dashboardRefs.solarIntensity.textContent = `${current.solarIntensity.toFixed(0)}%`;
    dashboardRefs.transducerValue.textContent = `${Math.round(current.humanFlow)}`;
    dashboardRefs.earningDate.textContent = 'Real-time performance ratio';
    dashboardRefs.operationCleaning.textContent = 'ACTIVE';
    dashboardRefs.operationCoverage.textContent = `${current.coverage.toFixed(0)}%`;
    dashboardRefs.operationMode.textContent = 'Autonomous';
  }

  if (dashboardRefs.barSolar) {
    const solarPct = THREE.MathUtils.clamp(current.solar / 5.2, 0.18, 1);
    const refPct = THREE.MathUtils.clamp(current.reference / 5.2, 0.18, 1);
    const consumedPct = THREE.MathUtils.clamp(current.consumed / 330, 0.22, 1);
    dashboardRefs.barSolar.style.height = `${(solarPct * 100).toFixed(1)}%`;
    dashboardRefs.barReference.style.height = `${(refPct * 100).toFixed(1)}%`;
    dashboardRefs.barConsumed.style.height = `${(consumedPct * 100).toFixed(1)}%`;
  }

  if (dashboardRefs.weatherPath) {
    dashboardRefs.weatherPath.setAttribute('d', buildDashboardLinePath(dashboardData.weatherSeries, 300, 120, 10));
  }
  if (dashboardRefs.balancePath) {
    dashboardRefs.balancePath.setAttribute('d', buildDashboardLinePath(dashboardData.balanceSeries, 260, 110, 10));
  }
  if (dashboardRefs.gaugeArc) {
    const progress = THREE.MathUtils.clamp(current.totalEnergy / 400, 0, 1);
    dashboardRefs.gaugeArc.setAttribute('d', buildGaugeArcPath(progress));
  }
  if (dashboardRefs.efficiencyFill) {
    dashboardRefs.efficiencyFill.style.width = `${THREE.MathUtils.clamp(current.efficiency, 0, 100).toFixed(1)}%`;
  }
}

function updateDashboardOperationPanel() {
  if (!dashboardRefs.operationPanel || !dashboardOverlay?.classList.contains('visible') || !carModelRef) {
    return;
  }

  carModelRef.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(carModelRef);
  const anchor = box.getCenter(new THREE.Vector3());
  anchor.y = box.max.y + 0.65;
  anchor.project(camera);

  if (anchor.z < -1 || anchor.z > 1) {
    dashboardRefs.operationPanel.style.opacity = '0';
    return;
  }

  const screenX = (anchor.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
  dashboardRefs.operationPanel.style.left = `${screenX}px`;
  dashboardRefs.operationPanel.style.top = `${screenY}px`;
  dashboardRefs.operationPanel.style.transform = 'translate(-50%, calc(-100% - 16px))';
}

function setVisualizationMode(mode) {
  visualizationMode = mode;

  if (mode === 'Energy') {
    enableEnergyTrackingMode();
  } else {
    disableEnergyTrackingMode();
    if (mode === 'Live') {
      sceneSection = 'default';
    } else {
      sceneSection = mode.toLowerCase();
      setEnergySectionVisualState(false);
    }
  }

  syncModeSwitcher();
  syncDashboardOverlay();
}

function setupModeSwitcher() {
  if (!isHouseDetailPage || modeSwitcher) {
    return;
  }

  modeSwitcher = document.createElement('div');
  modeSwitcher.className = 'glass-panel mode-switcher';

  ['Live', 'Energy', 'Dashboard', 'Flow'].forEach((mode) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = mode;
    item.style.color = 'rgba(255,255,255,0.6)';
    item.onmouseenter = () => {
      if (visualizationMode !== mode) {
        item.style.color = 'rgba(255,255,255,0.82)';
      }
    };
    item.onmouseleave = () => {
      if (visualizationMode !== mode) {
        item.style.color = 'rgba(255,255,255,0.6)';
      }
    };
    item.onclick = () => {
      if (isEnergyTrackingPage && mode === 'Live') {
        window.location.href = './house-detail.html';
        return;
      }
      setVisualizationMode(mode);
    };
    modeSwitcher.appendChild(item);
    modeSwitcherItems.set(mode, item);
  });

  ensureTopControlsContainer()?.appendChild(modeSwitcher);
  syncModeSwitcher();
  syncTopControlsPosition();
  syncTimeOfDayPanelWidth();
  syncDashboardOverlay();
}

function ensureEnergyTrackingVisuals() {
  if (energyTrackingGroup || !isHouseDetailPage) {
    return;
  }

  energyTrackingGroup = new THREE.Group();
  energyTrackingGroup.name = 'energyTrackingGroup';
  energyTrackingGroup.visible = false;
  scene.add(energyTrackingGroup);
}

function rebuildEnergyTrackingVisuals() {
  ensureEnergyTrackingVisuals();
  if (!energyTrackingGroup || !pvModelRef || !houseWrapper) {
    return;
  }

  while (energyTrackingGroup.children.length) {
    const child = energyTrackingGroup.children.pop();
    child.parent?.remove(child);
  }
  energyFlowCurves.length = 0;
  energyFlowSystems.length = 0;

  const pvBounds = new THREE.Box3().setFromObject(pvModelRef);
  const houseBounds = new THREE.Box3().setFromObject(houseWrapper);

  const pvStart = pvBounds.getCenter(new THREE.Vector3());
  const houseCenter = houseBounds.getCenter(new THREE.Vector3());
  const pvIsLeftOfHouse = pvStart.x <= houseCenter.x;
  pvStart.x = pvIsLeftOfHouse ? pvBounds.max.x : pvBounds.min.x;
  pvStart.y = groundPlane.position.y + 0.48;

  const houseInput = houseBounds.getCenter(new THREE.Vector3());
  houseInput.x = pvIsLeftOfHouse
    ? houseBounds.min.x + (houseBounds.max.x - houseBounds.min.x) * 0.22
    : houseBounds.max.x - (houseBounds.max.x - houseBounds.min.x) * 0.22;
  houseInput.z = THREE.MathUtils.lerp(pvStart.z, houseCenter.z, 0.58);
  houseInput.y = groundPlane.position.y + 0.48;

  const energyCurve = buildOrthogonalEnergyCurve(
    pvStart,
    houseInput,
    Math.abs(pvStart.x - houseInput.x) > Math.abs(pvStart.z - houseInput.z) ? 'x-first' : 'z-first',
    0.54
  );
  energyFlowCurves.push(energyCurve);
  const system = createEnergyFlowSystem(energyCurve, 0, energyTrackingVisualState.currentLevel);
  energyFlowSystems.push(system);
  energyTrackingGroup.add(system);

  ensurePvEnergyEdgeGlow();
}

function setEnergyTrackingVisibility(isActive) {
  applyEnergyModeBlend(isActive ? 1 : 0);
}

function rotatePointAroundY(point, center, angle) {
  const offset = point.clone().sub(center);
  const rotated = new THREE.Vector3(
    offset.x * Math.cos(angle) - offset.z * Math.sin(angle),
    offset.y,
    offset.x * Math.sin(angle) + offset.z * Math.cos(angle)
  );
  return center.clone().add(rotated);
}

function startEnergyTrackingCameraTransition(targetPosition, targetLookAt, targetHouseRotationY = null, focusCenter = null) {
  energyTrackingCameraTransition.startPosition.copy(camera.position);
  energyTrackingCameraTransition.startTarget.copy(controls.target);
  energyTrackingCameraTransition.endPosition.copy(targetPosition);
  energyTrackingCameraTransition.endTarget.copy(targetLookAt);
  energyTrackingCameraTransition.startHouseRotationY = houseWrapper ? houseWrapper.rotation.y : 0;
  energyTrackingCameraTransition.endHouseRotationY = targetHouseRotationY ?? energyTrackingCameraTransition.startHouseRotationY;
  energyTrackingCameraTransition.animateHouseRotation = targetHouseRotationY != null && !!houseWrapper;
  energyTrackingCameraTransition.focusCenter.copy(focusCenter || targetLookAt);
  energyTrackingCameraTransition.animateStorageTransform = false;

  if (storageModelRef && targetHouseRotationY != null) {
    energyTrackingCameraTransition.startStoragePosition.copy(storageModelRef.position);
    energyTrackingCameraTransition.startStorageRotationY = storageModelRef.rotation.y;
    const deltaRotation = targetHouseRotationY - energyTrackingCameraTransition.startHouseRotationY;
    energyTrackingCameraTransition.endStoragePosition.copy(
      rotatePointAroundY(
        storageModelRef.position,
        energyTrackingCameraTransition.focusCenter,
        deltaRotation
      )
    );
    energyTrackingCameraTransition.endStorageRotationY = storageModelRef.rotation.y + deltaRotation;
    energyTrackingCameraTransition.animateStorageTransform = true;
  }

  energyTrackingCameraTransition.progress = 0;
  energyTrackingCameraTransition.active = true;
  energyTrackingCameraTransition.restoreAutoCameraEnabled = false;
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function updateEnergyTrackingCameraTransition(dt) {
  if (!energyTrackingCameraTransition.active) {
    return;
  }

  energyTrackingCameraTransition.progress = Math.min(
    energyTrackingCameraTransition.progress + dt * 0.4,
    1
  );
  const t = energyTrackingCameraTransition.progress;
  const ease = easeInOutCubic(t);

  camera.position.lerpVectors(
    energyTrackingCameraTransition.startPosition,
    energyTrackingCameraTransition.endPosition,
    ease
  );
  controls.target.lerpVectors(
    energyTrackingCameraTransition.startTarget,
    energyTrackingCameraTransition.endTarget,
    ease
  );
  if (energyTrackingCameraTransition.animateHouseRotation && houseWrapper) {
    houseWrapper.rotation.y = THREE.MathUtils.lerp(
      energyTrackingCameraTransition.startHouseRotationY,
      energyTrackingCameraTransition.endHouseRotationY,
      ease
    );
    houseWrapper.updateMatrixWorld(true);
  }
  if (energyTrackingCameraTransition.animateStorageTransform && storageModelRef) {
    storageModelRef.position.lerpVectors(
      energyTrackingCameraTransition.startStoragePosition,
      energyTrackingCameraTransition.endStoragePosition,
      ease
    );
    storageModelRef.rotation.y = THREE.MathUtils.lerp(
      energyTrackingCameraTransition.startStorageRotationY,
      energyTrackingCameraTransition.endStorageRotationY,
      ease
    );
    storageModelRef.updateMatrixWorld(true);
  }

  if (energyTrackingCameraTransition.progress >= 1) {
    energyTrackingCameraTransition.progress = 1;
    energyTrackingCameraTransition.active = false;
    if (energyTrackingCameraTransition.animateHouseRotation && houseWrapper) {
      houseWrapper.rotation.y = energyTrackingCameraTransition.endHouseRotationY;
      houseWrapper.updateMatrixWorld(true);
    }
    if (energyTrackingCameraTransition.animateStorageTransform && storageModelRef) {
      storageModelRef.position.copy(energyTrackingCameraTransition.endStoragePosition);
      storageModelRef.rotation.y = energyTrackingCameraTransition.endStorageRotationY;
      storageModelRef.updateMatrixWorld(true);
    }
    if (energyTrackingCameraTransition.restoreAutoCameraEnabled) {
      autoCamera.enabled = true;
      energyTrackingCameraTransition.restoreAutoCameraEnabled = false;
    }
  }
}

function startEnergyTrackingPageIntro() {
  if (
    !isEnergyTrackingPage ||
    energyTrackingPageIntroStarted ||
    energyTrackingMode ||
    !houseWrapper ||
    !pvModelRef
  ) {
    return;
  }

  energyTrackingPageIntroStarted = true;
  enableEnergyTrackingMode();
}

function enableEnergyTrackingMode() {
  if (energyTrackingMode || !pvModelRef || !houseWrapper) {
    return;
  }

  restoreLiveModeBaseline();
  rebuildEnergyTrackingVisuals();
  energyTrackingMode = true;
  energyTrackingState.cameraPosition.set(cameraControls.posX, cameraControls.posY, cameraControls.posZ);
  energyTrackingState.controlsTarget.set(cameraControls.targetX, cameraControls.targetY, cameraControls.targetZ);
  energyTrackingState.autoCameraEnabled = cameraControls.autoAnimate;
  energyTrackingState.liveBackgroundColor.copy(
    scene.background instanceof THREE.Color ? scene.background : daySkyBackground
  );
  energyTrackingState.activationStart = clock.elapsedTime;
  autoCamera.enabled = false;
  controls.enablePan = false;

  if (energyTrackingGroup) {
    energyTrackingGroup.visible = true;
  }
  const energyCameraState = getEnergyModeCameraState();
  startVisualizationModeTransition(1, energyCameraState.position, energyCameraState.target);
  visualizationMode = 'Energy';
  syncModeSwitcher();
}

function disableEnergyTrackingMode() {
  if (!energyTrackingMode && energyModeBlend <= 0.001) {
    restoreLiveModeBaseline();
    return;
  }

  restoreLiveModeBaseline();
  if (energyTrackingGroup) {
    energyTrackingGroup.visible = true;
  }
  startVisualizationModeTransition(
    0,
    energyTrackingState.cameraPosition,
    energyTrackingState.controlsTarget
  );
  autoCamera.enabled = false;
  if (visualizationMode === 'Energy') {
    visualizationMode = isEnergyTrackingPage ? 'Energy' : 'Live';
  }
  syncModeSwitcher();
}

function updateEnergyTracking(elapsed) {
  if (!energyTrackingMode || !energyTrackingGroup?.visible) {
    return;
  }

  const solarProfile = getEnergySolarProfile(getEnergyTimeOfDay());
  energyTrackingVisualState.targetLevel = solarProfile.emissiveBoost;
  energyTrackingVisualState.currentLevel += (energyTrackingVisualState.targetLevel - energyTrackingVisualState.currentLevel) * 0.06;
  const flowLevel = energyTrackingVisualState.currentLevel * solarProfile.visibility;
  updatePvEnergyVisuals(flowLevel > 0.02, flowLevel);

  energyFlowSystems.forEach((system) => {
    const level = flowLevel;
    const activationT = THREE.MathUtils.clamp(
      (elapsed - energyTrackingState.activationStart - (system.userData.activationOffset ?? 0)) / 0.75,
      0,
      1
    );
    const easedActivation = activationT * activationT * (3 - 2 * activationT);
    const pulse = 0.72 + Math.sin(elapsed * (1.1 + solarProfile.speed * 2.1) + (system.userData.phase ?? 0)) * 0.16;
    const flowStrength = easedActivation * pulse;
    const targetColor = solarProfile.color;

    system.userData.textures?.forEach((texture, index) => {
      texture.offset.x -= (
        system.userData.baseSpeed * (0.22 + solarProfile.speed * 1.18) +
        index * 0.012
      ) * 0.01;
    });

    system.userData.layers?.forEach((layer, index) => {
      const baseOpacity = system.userData.baseLayerOpacity?.[index] ?? layer.material.opacity ?? 0;
      const opacityBoost = index === 2 ? 1.15 : index === 1 ? 0.9 : 0.68;
      layer.material.color.lerp(targetColor, 0.14);
      layer.material.opacity = baseOpacity * flowStrength * opacityBoost * THREE.MathUtils.lerp(0.2, 1.0, solarProfile.visibility);
      const widthScale = 1 + easedActivation * (0.02 + level * 0.07) * (index === 0 ? 1.4 : index === 1 ? 1.0 : 0.6);
      layer.scale.setScalar(widthScale);
    });

    const sourceNode = system.userData.sourceNode;
    const targetNode = system.userData.targetNode;
    [sourceNode, targetNode].forEach((node, nodeIndex) => {
      if (!node) {
        return;
      }
      const nodePulse = 0.82 + Math.sin(elapsed * (2.2 + nodeIndex * 0.4) + (system.userData.phase ?? 0)) * 0.18;
      node.children.forEach((child) => {
        if (child.material?.color) {
          child.material.color.lerp(targetColor, 0.14);
        }
      });
      node.children[0].material.opacity = (0.14 + easedActivation * 0.56 * nodePulse) * solarProfile.visibility;
      node.children[1].material.opacity = (0.06 + easedActivation * 0.34 * nodePulse) * solarProfile.visibility;
      node.children[2].material.opacity = (0.04 + easedActivation * 0.22 * (1 - nodePulse * 0.4)) * solarProfile.visibility;
      node.children[2].scale.setScalar(0.72 + easedActivation * (0.48 + nodePulse * 0.35));
    });

    const particles = system.userData.particles;
    const curve = system.userData.curve;
    if (particles && curve) {
      const positions = particles.geometry.attributes.position.array;
      const progress = particles.userData.progress;
      const speeds = particles.userData.speeds;
      for (let i = 0; i < progress.length; i += 1) {
        progress[i] = (
          progress[i] +
          speeds[i] * (0.0012 + solarProfile.speed * 0.012) * easedActivation
        ) % 1;
        const point = curve.getPointAt(progress[i]);
        positions[i * 3] = point.x;
        positions[i * 3 + 1] = point.y;
        positions[i * 3 + 2] = point.z;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.material.color.lerp(targetColor, 0.14);
      particles.material.opacity = (0.04 + easedActivation * (0.28 + level * 0.3)) * solarProfile.visibility;
      particles.material.size = system.userData.particleBaseSize * (0.58 + solarProfile.particleDensity * 0.78);
      particles.geometry.setDrawRange(
        0,
        Math.max(1, Math.floor((system.userData.baseParticleCount ?? progress.length) * solarProfile.particleDensity))
      );
    }
  });
}

function setupTimeOfDaySlider() {
  if (!isPrimaryHouseDetailPage || timeOfDaySliderPanel) {
    return;
  }

  const container = document.createElement('div');
  container.className = 'time-container';
  const panel = document.createElement('div');
  panel.className = 'glass-panel time-panel';

  const labelRow = document.createElement('div');
  labelRow.className = 'time-panel-labels';
  const title = document.createElement('span');
  title.className = 'time-panel-title';
  title.textContent = 'Time Of Day';
  const valueLabel = document.createElement('span');
  valueLabel.className = 'time-panel-value';
  valueLabel.textContent = timeOfDayControls.mode;
  labelRow.appendChild(title);
  labelRow.appendChild(valueLabel);
  panel.appendChild(labelRow);

  const slider = document.createElement('input');
  slider.type = 'range';
  slider.min = 0;
  slider.max = 2;
  slider.step = 0.01;
  slider.value = `${timeOfDayControls.value}`;
  slider.className = 'time-of-day-slider';
  panel.appendChild(slider);

  if (!timeOfDaySliderStyle) {
    const style = document.createElement('style');
    style.innerHTML = `
input[type=range].time-of-day-slider {
  -webkit-appearance: none;
  appearance: none;
  height: 8px;
  border-radius: 10px;
  background: linear-gradient(to right, #ff9966, #ffcc88, #8899ff);
  outline: none;
}
input[type=range].time-of-day-slider::-webkit-slider-runnable-track {
  height: 8px;
  border-radius: 10px;
}
input[type=range].time-of-day-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #222;
  border: 2px solid rgba(255,255,255,0.2);
  margin-top: -7px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1);
  cursor: pointer;
}
input[type=range].time-of-day-slider::-moz-range-track {
  height: 8px;
  border-radius: 10px;
  background: linear-gradient(to right, #ff9966, #ffcc88, #8899ff);
}
input[type=range].time-of-day-slider::-moz-range-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #222;
  border: 2px solid rgba(255,255,255,0.2);
  box-shadow: 0 4px 10px rgba(0,0,0,0.4), inset 0 1px 2px rgba(255,255,255,0.1);
  cursor: pointer;
}
`;
    document.head.appendChild(style);
    timeOfDaySliderStyle = style;
  }

  slider.addEventListener('input', () => {
    setTime(parseFloat(slider.value));
  });

  container.appendChild(panel);
  document.body.appendChild(container);
  timeOfDaySliderPanel = container;
  timeOfDaySlider = slider;
  timeOfDayValueLabel = valueLabel;
  updateTimeSliderVisual(timeOfDayControls.value);
  syncTimeOfDayPanelWidth();
}

if (isHouseDetailPage) {
  window.addEventListener('resize', () => {
    syncTopControlsPosition();
    syncTimeOfDayPanelWidth();
  });
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
    horizonColor: environmentControls.horizonColor,
    timeValue: timeOfDayControls.value,
    timeMode: timeOfDayControls.mode,
    keyX: lightingControls.keyX,
    keyY: lightingControls.keyY,
    keyZ: lightingControls.keyZ,
    keyIntensity: lightingControls.keyIntensity,
    ambientIntensity: lightingControls.ambientIntensity,
    interiorIntensity: lightingControls.interiorIntensity,
    exposure: lightingControls.exposure,
    environmentIntensity: lightingControls.environmentIntensity,
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

function saveEnergyLightingToStorage() {
  if (!isHouseDetailPage) {
    return;
  }

  window.localStorage.setItem(energyLightingStorageKey, JSON.stringify({
    keyX: energyLightingControls.keyX,
    keyY: energyLightingControls.keyY,
    keyZ: energyLightingControls.keyZ,
    keyIntensity: energyLightingControls.keyIntensity,
    ambientIntensity: energyLightingControls.ambientIntensity,
    hemiIntensity: energyLightingControls.hemiIntensity,
    interiorIntensity: energyLightingControls.interiorIntensity,
    fillIntensity: energyLightingControls.fillIntensity,
    rimIntensity: energyLightingControls.rimIntensity,
    exposure: energyLightingControls.exposure,
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

function loadEnergyLightingFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(energyLightingStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved energy lighting settings:', error);
    return null;
  }
}

const savedEnvironment = loadEnvironmentFromStorage();
environmentControls.groundSize = defaultEnvironmentGroundSize;
if (savedEnvironment) {
  if (savedEnvironment.innerRadiusScale != null) {
    environmentControls.innerRadiusScale = savedEnvironment.innerRadiusScale;
  }
  if (savedEnvironment.outerRadiusScale != null) {
    environmentControls.outerRadiusScale = savedEnvironment.outerRadiusScale;
  }
  if (savedEnvironment.groundColor != null) {
    environmentControls.groundColor = savedEnvironment.groundColor;
  }
  if (savedEnvironment.horizonColor != null) {
    environmentControls.horizonColor = savedEnvironment.horizonColor;
  }
  if (savedEnvironment.timeMode != null) {
    timeOfDayControls.mode = savedEnvironment.timeMode;
  }
  if (savedEnvironment.timeValue != null) {
    timeOfDayControls.value = THREE.MathUtils.clamp(savedEnvironment.timeValue, 0, 2);
  } else if (savedEnvironment.timeMode != null) {
    timeOfDayControls.value = savedEnvironment.timeMode === 'Sunset'
      ? 1
      : savedEnvironment.timeMode === 'Night'
        ? 2
        : 0;
  }
  if (savedEnvironment.keyX != null) {
    lightingControls.keyX = savedEnvironment.keyX;
  }
  if (savedEnvironment.keyY != null) {
    lightingControls.keyY = savedEnvironment.keyY;
  }
  if (savedEnvironment.keyZ != null) {
    lightingControls.keyZ = savedEnvironment.keyZ;
  }
  if (savedEnvironment.keyIntensity != null) {
    lightingControls.keyIntensity = savedEnvironment.keyIntensity;
  }
  if (savedEnvironment.ambientIntensity != null) {
    lightingControls.ambientIntensity = savedEnvironment.ambientIntensity;
  }
  if (savedEnvironment.interiorIntensity != null) {
    lightingControls.interiorIntensity = savedEnvironment.interiorIntensity;
  }
  if (savedEnvironment.exposure != null) {
    lightingControls.exposure = savedEnvironment.exposure;
  }
  if (savedEnvironment.environmentIntensity != null) {
    lightingControls.environmentIntensity = savedEnvironment.environmentIntensity;
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

const savedEnergyLighting = loadEnergyLightingFromStorage();
if (savedEnergyLighting) {
  if (savedEnergyLighting.keyX != null) energyLightingControls.keyX = savedEnergyLighting.keyX;
  if (savedEnergyLighting.keyY != null) energyLightingControls.keyY = savedEnergyLighting.keyY;
  if (savedEnergyLighting.keyZ != null) energyLightingControls.keyZ = savedEnergyLighting.keyZ;
  if (savedEnergyLighting.keyIntensity != null) energyLightingControls.keyIntensity = savedEnergyLighting.keyIntensity;
  if (savedEnergyLighting.ambientIntensity != null) energyLightingControls.ambientIntensity = savedEnergyLighting.ambientIntensity;
  if (savedEnergyLighting.hemiIntensity != null) energyLightingControls.hemiIntensity = savedEnergyLighting.hemiIntensity;
  if (savedEnergyLighting.interiorIntensity != null) energyLightingControls.interiorIntensity = savedEnergyLighting.interiorIntensity;
  if (savedEnergyLighting.fillIntensity != null) energyLightingControls.fillIntensity = savedEnergyLighting.fillIntensity;
  if (savedEnergyLighting.rimIntensity != null) energyLightingControls.rimIntensity = savedEnergyLighting.rimIntensity;
  if (savedEnergyLighting.exposure != null) energyLightingControls.exposure = savedEnergyLighting.exposure;
}

const grassControls = {
  density: 3200,
  patchSize: 8.6,
  windSpeed: 0.9,
  bladeHeight: 1.0,
  bladeWidth: 0.14,
};
const houseSurfaceControls = {
  noiseVariation: 69,
  repeat: 0.5,
  bumpScale: 0,
  roughnessBoost: 0.26,
  apply() {
    refreshHouseSurfaceVariation();
    saveHouseSurfaceToStorage();
  },
  log() {
    console.log(`const houseSurfaceControls = ${JSON.stringify({
      noiseVariation: Number(houseSurfaceControls.noiseVariation.toFixed(3)),
      repeat: Number(houseSurfaceControls.repeat.toFixed(3)),
      bumpScale: Number(houseSurfaceControls.bumpScale.toFixed(4)),
      roughnessBoost: Number(houseSurfaceControls.roughnessBoost.toFixed(3)),
    }, null, 2)};`);
  },
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

function formatTransformSnippet(object, name = 'model') {
  if (!object) {
    return `// ${name} is not available yet.`;
  }

  const p = object.position;
  const r = object.rotation;
  const s = object.scale;
  return `${name}.position.set(${p.x.toFixed(3)}, ${p.y.toFixed(3)}, ${p.z.toFixed(3)});
${name}.rotation.set(${r.x.toFixed(3)}, ${r.y.toFixed(3)}, ${r.z.toFixed(3)});
${name}.scale.set(${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)});`;
}

function exportAllGuiState() {
  syncEnvironmentFromScene();
  syncLightingFromScene();
  saveEnvironmentToStorage();
  saveCameraTransformToStorage();
  saveHouseTransformToStorage();
  saveCarTransformToStorage();
  saveLngTransformToStorage();
  savePvTransformToStorage();
  saveTreeTransformToStorage();
  saveTree2TransformToStorage();
  saveTree3TransformToStorage();
  saveTree4TransformToStorage();
  savePalmTransformToStorage();
  savePalm2TransformToStorage();
  saveHouseSurfaceToStorage();
  saveHousePartOverridesToStorage();

  const sections = [
    '// ===== COPY THIS INTO YOUR SOURCE CODE =====',
    '',
    '// House Detail Transforms',
    formatTransformSnippet(houseWrapper, 'houseWrapper'),
    formatTransformSnippet(houseModelRef, 'houseModelRef'),
    formatTransformSnippet(carModelRef, 'carModelRef'),
    formatTransformSnippet(lngModelRef, 'lngModelRef'),
    formatTransformSnippet(pvModelRef, 'pvModelRef'),
    formatTransformSnippet(treeModelRef, 'treeModelRef'),
    formatTransformSnippet(treeModelRef2, 'treeModelRef2'),
    formatTransformSnippet(treeModelRef3, 'treeModelRef3'),
    formatTransformSnippet(treeModelRef4, 'treeModelRef4'),
    formatTransformSnippet(palmModelRef, 'palmModelRef'),
    formatTransformSnippet(palmModelRef2, 'palmModelRef2'),
    '',
    '// Camera',
    `const cameraControls = {
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
};`,
    '',
    '// Environment',
    `const environmentControls = {
  groundSize: ${environmentControls.groundSize.toFixed(2)},
  innerRadiusScale: ${environmentControls.innerRadiusScale.toFixed(3)},
  outerRadiusScale: ${environmentControls.outerRadiusScale.toFixed(3)},
  groundColor: '${environmentControls.groundColor}',
  horizonColor: '${environmentControls.horizonColor}',
  skyboxX: ${environmentControls.skyboxX.toFixed(2)},
  skyboxY: ${environmentControls.skyboxY.toFixed(2)},
  skyboxZ: ${environmentControls.skyboxZ.toFixed(2)},
  skyboxScale: ${environmentControls.skyboxScale.toFixed(2)},
};`,
    '',
    '// Lighting',
    `const lightingControls = {
  keyX: ${lightingControls.keyX.toFixed(2)},
  keyY: ${lightingControls.keyY.toFixed(2)},
  keyZ: ${lightingControls.keyZ.toFixed(2)},
  keyIntensity: ${lightingControls.keyIntensity.toFixed(3)},
  ambientIntensity: ${lightingControls.ambientIntensity.toFixed(3)},
  interiorIntensity: ${lightingControls.interiorIntensity.toFixed(3)},
  exposure: ${lightingControls.exposure.toFixed(3)},
  environmentIntensity: ${lightingControls.environmentIntensity.toFixed(3)},
};`,
    '',
    '// Ground Radius',
    `const groundRadiusControls = {
  innerRadiusScale: ${environmentControls.innerRadiusScale.toFixed(3)},
  outerRadiusScale: ${environmentControls.outerRadiusScale.toFixed(3)},
};`,
    '',
    '// Ground Color',
    `const groundColorControls = {
  groundColor: '${environmentControls.groundColor}',
};`,
    '',
    '// Atmosphere',
    `const atmosphereColorControls = {
  daySkyboxTint: '${atmosphereColorControls.daySkyboxTint}',
  sunsetSkyboxTint: '${atmosphereColorControls.sunsetSkyboxTint}',
  nightSkyboxTint: '${atmosphereColorControls.nightSkyboxTint}',
  dayGroundColor: '${atmosphereColorControls.dayGroundColor}',
  sunsetGroundColor: '${atmosphereColorControls.sunsetGroundColor}',
  nightGroundColor: '${atmosphereColorControls.nightGroundColor}',
};`,
    '',
    '// House Surface',
    `const houseSurfaceControls = ${JSON.stringify({
  noiseVariation: Number(houseSurfaceControls.noiseVariation.toFixed(3)),
  repeat: Number(houseSurfaceControls.repeat.toFixed(3)),
  bumpScale: Number(houseSurfaceControls.bumpScale.toFixed(4)),
  roughnessBoost: Number(houseSurfaceControls.roughnessBoost.toFixed(3)),
}, null, 2)};`,
    '',
    '// House Part Overrides',
    `const housePartSavedOverrides = ${JSON.stringify(buildHousePartOverrideMap(), null, 2)};`,
  ];

  const snippet = sections.join('\n');
  console.log(snippet);
  return snippet;
}

let exportOverlay = null;
let exportOverlayTextarea = null;
let exportOverlayStatus = null;

function ensureExportOverlay() {
  if (exportOverlay || typeof document === 'undefined') {
    return exportOverlay;
  }

  exportOverlay = document.createElement('div');
  exportOverlay.style.cssText = `
position: fixed;
inset: 0;
z-index: 3000;
display: none;
align-items: center;
justify-content: center;
padding: 24px;
background: rgba(8, 14, 24, 0.58);
backdrop-filter: blur(10px);
`;

  const panel = document.createElement('div');
  panel.style.cssText = `
width: min(980px, 100%);
max-height: min(82vh, 920px);
display: flex;
flex-direction: column;
gap: 14px;
padding: 18px;
border-radius: 18px;
background: rgba(15, 22, 32, 0.94);
border: 1px solid rgba(160, 196, 236, 0.18);
box-shadow: 0 22px 60px rgba(0,0,0,0.35);
`;

  const header = document.createElement('div');
  header.style.cssText = `
display: flex;
align-items: center;
justify-content: space-between;
gap: 12px;
color: rgba(234, 244, 255, 0.94);
font: 600 12px/1.2 "Helvetica Neue", Arial, sans-serif;
letter-spacing: 0.16em;
text-transform: uppercase;
`;
  header.textContent = 'Export All GUI State';

  const actions = document.createElement('div');
  actions.style.cssText = `
display: flex;
align-items: center;
gap: 10px;
`;

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.textContent = 'Copy';
  copyButton.style.cssText = `
appearance: none;
border: 0;
border-radius: 999px;
padding: 9px 14px;
background: rgba(120, 170, 220, 0.18);
color: rgba(234, 244, 255, 0.94);
font: inherit;
letter-spacing: 0.1em;
text-transform: inherit;
cursor: pointer;
`;

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.textContent = 'Close';
  closeButton.style.cssText = copyButton.style.cssText;

  actions.appendChild(copyButton);
  actions.appendChild(closeButton);
  header.appendChild(actions);

  exportOverlayStatus = document.createElement('div');
  exportOverlayStatus.style.cssText = `
min-height: 18px;
color: rgba(194, 216, 242, 0.76);
font: 500 12px/1.3 "Helvetica Neue", Arial, sans-serif;
`;

  exportOverlayTextarea = document.createElement('textarea');
  exportOverlayTextarea.readOnly = true;
  exportOverlayTextarea.spellcheck = false;
  exportOverlayTextarea.style.cssText = `
width: 100%;
min-height: 420px;
flex: 1;
resize: vertical;
padding: 16px;
border-radius: 14px;
border: 1px solid rgba(160, 196, 236, 0.12);
background: rgba(5, 10, 18, 0.9);
color: rgba(236, 243, 252, 0.96);
font: 12px/1.55 Menlo, Monaco, Consolas, monospace;
outline: none;
box-sizing: border-box;
`;

  closeButton.onclick = () => {
    exportOverlay.style.display = 'none';
  };

  copyButton.onclick = async () => {
    try {
      await navigator.clipboard.writeText(exportOverlayTextarea.value);
      exportOverlayStatus.textContent = 'Copied to clipboard.';
    } catch (error) {
      exportOverlayStatus.textContent = 'Copy failed. Select and copy the text manually.';
    }
  };

  exportOverlay.addEventListener('click', (event) => {
    if (event.target === exportOverlay) {
      exportOverlay.style.display = 'none';
    }
  });

  panel.appendChild(header);
  panel.appendChild(exportOverlayStatus);
  panel.appendChild(exportOverlayTextarea);
  exportOverlay.appendChild(panel);
  document.body.appendChild(exportOverlay);
  return exportOverlay;
}

function showExportAllOverlay() {
  const snippet = exportAllGuiState();
  ensureExportOverlay();
  exportOverlayTextarea.value = snippet;
  exportOverlayStatus.textContent = 'Review, copy, and paste this back into your source files.';
  exportOverlay.style.display = 'flex';
  exportOverlayTextarea.focus();
  exportOverlayTextarea.select();
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
  window.exportAllGuiState = exportAllGuiState;
  window.showExportAllOverlay = showExportAllOverlay;
  window.setTime = setTime;
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
const carControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(carModelRef, 'carModelRef', saveCarTransformToStorage);
  },
};
const lngControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(lngModelRef, 'lngModelRef', saveLngTransformToStorage);
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
const housePartSavedOverrides = {
  "0": {
    "material": "white",
    "opacity": 1
  },
  "1": {
    "material": "white",
    "opacity": 1
  },
  "2": {
    "material": "concrete",
    "opacity": 1,
    "concreteColor": "#f7f2e9"
  },
  "3": {
    "material": "concrete",
    "opacity": 1,
    "concreteColor": "#f7f2e9"
  },
  "4": {
    "material": "white",
    "opacity": 1
  },
  "5": {
    "material": "white",
    "opacity": 1
  },
  "6": {
    "material": "white",
    "opacity": 1
  },
  "7": {
    "material": "white",
    "opacity": 1
  },
  "8": {
    "material": "white",
    "opacity": 1
  },
  "9": {
    "material": "white",
    "opacity": 1
  },
  "10": {
    "material": "white",
    "opacity": 1
  },
  "11": {
    "material": "white",
    "opacity": 1
  },
  "12": {
    "material": "white",
    "opacity": 1
  },
  "13": {
    "material": "white",
    "opacity": 1
  },
  "14": {
    "material": "white",
    "opacity": 1
  },
  "15": {
    "material": "white",
    "opacity": 1
  },
  "16": {
    "material": "white",
    "opacity": 1
  },
  "17": {
    "material": "white",
    "opacity": 1
  },
  "18": {
    "material": "white",
    "opacity": 1
  },
  "19": {
    "material": "white",
    "opacity": 1
  },
  "20": {
    "material": "white",
    "opacity": 1
  },
  "21": {
    "material": "white",
    "opacity": 1
  },
  "22": {
    "material": "white",
    "opacity": 1
  },
  "23": {
    "material": "white",
    "opacity": 1
  },
  "24": {
    "material": "white",
    "opacity": 1
  },
  "25": {
    "material": "white",
    "opacity": 1
  },
  "26": {
    "material": "white",
    "opacity": 1
  },
  "27": {
    "material": "white",
    "opacity": 1
  },
  "28": {
    "material": "white",
    "opacity": 1
  },
  "29": {
    "material": "white",
    "opacity": 1
  },
  "30": {
    "material": "concrete",
    "opacity": 0.91,
    "concreteColor": "#f7f2e9"
  },
  "31": {
    "material": "glass",
    "opacity": 0.92
  },
  "32": {
    "material": "white",
    "opacity": 0.92
  },
  "33": {
    "material": "white",
    "opacity": 1
  },
  "34": {
    "material": "white",
    "opacity": 1
  },
  "35": {
    "material": "white",
    "opacity": 0.9
  },
  "36": {
    "material": "white",
    "opacity": 0.92
  },
  "37": {
    "material": "white",
    "opacity": 0.9
  },
  "38": {
    "material": "white",
    "opacity": 0.77
  },
  "39": {
    "material": "white",
    "opacity": 1
  },
  "40": {
    "material": "white",
    "opacity": 1
  },
  "41": {
    "material": "white",
    "opacity": 1
  },
  "42": {
    "material": "white",
    "opacity": 1
  },
  "43": {
    "material": "white",
    "opacity": 1
  },
  "44": {
    "material": "white",
    "opacity": 1
  },
  "45": {
    "material": "white",
    "opacity": 1
  },
  "46": {
    "material": "white",
    "opacity": 1
  },
  "47": {
    "material": "white",
    "opacity": 1
  },
  "48": {
    "material": "white",
    "opacity": 1
  },
  "49": {
    "material": "white",
    "opacity": 1
  },
  "50": {
    "material": "white",
    "opacity": 1
  },
  "51": {
    "material": "white",
    "opacity": 0.92
  },
  "52": {
    "material": "white",
    "opacity": 0.92
  },
  "53": {
    "material": "white",
    "opacity": 0.92
  },
  "54": {
    "material": "white",
    "opacity": 0.92
  },
  "55": {
    "material": "white",
    "opacity": 0.92
  },
  "56": {
    "material": "white",
    "opacity": 0.92
  },
  "57": {
    "material": "white",
    "opacity": 0.92
  },
  "58": {
    "material": "white",
    "opacity": 1
  },
  "59": {
    "material": "white",
    "opacity": 1
  },
  "60": {
    "material": "white",
    "opacity": 1
  },
  "61": {
    "material": "white",
    "opacity": 1
  },
  "62": {
    "material": "white",
    "opacity": 1
  },
  "63": {
    "material": "white",
    "opacity": 1
  },
  "64": {
    "material": "white",
    "opacity": 1
  },
  "65": {
    "material": "white",
    "opacity": 1
  },
  "66": {
    "material": "white",
    "opacity": 1
  },
  "67": {
    "material": "white",
    "opacity": 1
  },
  "68": {
    "material": "white",
    "opacity": 1
  },
  "69": {
    "material": "white",
    "opacity": 1
  },
  "70": {
    "material": "white",
    "opacity": 1
  },
  "71": {
    "material": "white",
    "opacity": 0.92
  },
  "72": {
    "material": "white",
    "opacity": 1
  },
  "73": {
    "material": "glass",
    "opacity": 0.9
  },
  "74": {
    "material": "white",
    "opacity": 1
  },
  "75": {
    "material": "concrete",
    "opacity": 0.92,
    "concreteColor": "#f7f2e9"
  },
  "76": {
    "material": "white",
    "opacity": 0.92
  },
  "77": {
    "material": "white",
    "opacity": 0.2
  },
  "78": {
    "material": "white",
    "opacity": 1
  },
  "79": {
    "material": "white",
    "opacity": 1
  },
  "80": {
    "material": "white",
    "opacity": 1
  },
  "81": {
    "material": "white",
    "opacity": 1
  },
  "82": {
    "material": "white",
    "opacity": 0.2
  },
  "83": {
    "material": "white",
    "opacity": 1
  },
  "84": {
    "material": "white",
    "opacity": 1
  },
  "85": {
    "material": "white",
    "opacity": 1
  },
  "86": {
    "material": "white",
    "opacity": 1
  },
  "87": {
    "material": "white",
    "opacity": 1
  },
  "88": {
    "material": "white",
    "opacity": 0.2
  },
  "89": {
    "material": "white",
    "opacity": 1
  },
  "90": {
    "material": "white",
    "opacity": 1
  },
  "91": {
    "material": "white",
    "opacity": 0.2
  },
  "92": {
    "material": "white",
    "opacity": 1
  },
  "93": {
    "material": "white",
    "opacity": 0.2
  },
  "94": {
    "material": "white",
    "opacity": 1
  },
  "95": {
    "material": "white",
    "opacity": 1
  },
  "96": {
    "material": "white",
    "opacity": 0.2
  },
  "97": {
    "material": "white",
    "opacity": 1
  },
  "98": {
    "material": "white",
    "opacity": 1
  },
  "99": {
    "material": "white",
    "opacity": 1
  },
  "100": {
    "material": "white",
    "opacity": 0.2
  },
  "101": {
    "material": "white",
    "opacity": 1
  },
  "102": {
    "material": "white",
    "opacity": 1
  },
  "103": {
    "material": "white",
    "opacity": 0.2
  },
  "104": {
    "material": "white",
    "opacity": 1
  },
  "105": {
    "material": "white",
    "opacity": 1
  },
  "106": {
    "material": "white",
    "opacity": 0.2
  },
  "107": {
    "material": "white",
    "opacity": 1
  },
  "108": {
    "material": "white",
    "opacity": 1
  },
  "109": {
    "material": "white",
    "opacity": 0.2
  },
  "110": {
    "material": "white",
    "opacity": 1
  },
  "111": {
    "material": "white",
    "opacity": 0.2
  },
  "112": {
    "material": "white",
    "opacity": 1
  },
  "113": {
    "material": "white",
    "opacity": 1
  },
  "114": {
    "material": "white",
    "opacity": 0.2
  },
  "115": {
    "material": "white",
    "opacity": 1
  },
  "116": {
    "material": "white",
    "opacity": 1
  },
  "117": {
    "material": "white",
    "opacity": 0.2
  },
  "118": {
    "material": "white",
    "opacity": 1
  },
  "119": {
    "material": "white",
    "opacity": 1
  },
  "120": {
    "material": "white",
    "opacity": 1
  },
  "121": {
    "material": "white",
    "opacity": 0.2
  },
  "122": {
    "material": "white",
    "opacity": 1
  },
  "123": {
    "material": "white",
    "opacity": 1
  },
  "124": {
    "material": "white",
    "opacity": 0.2
  },
  "125": {
    "material": "white",
    "opacity": 1
  },
  "126": {
    "material": "white",
    "opacity": 1
  },
  "127": {
    "material": "white",
    "opacity": 0.2
  },
  "128": {
    "material": "white",
    "opacity": 1
  },
  "129": {
    "material": "white",
    "opacity": 1
  },
  "130": {
    "material": "white",
    "opacity": 0.2
  },
  "131": {
    "material": "white",
    "opacity": 1
  },
  "132": {
    "material": "white",
    "opacity": 1
  },
  "133": {
    "material": "white",
    "opacity": 0.2
  },
  "134": {
    "material": "white",
    "opacity": 1
  },
  "135": {
    "material": "white",
    "opacity": 1
  },
  "136": {
    "material": "white",
    "opacity": 0.2
  },
  "137": {
    "material": "white",
    "opacity": 1
  },
  "138": {
    "material": "white",
    "opacity": 1
  },
  "139": {
    "material": "white",
    "opacity": 0.2
  },
  "140": {
    "material": "white",
    "opacity": 1
  },
  "141": {
    "material": "white",
    "opacity": 1
  },
  "142": {
    "material": "white",
    "opacity": 0.2
  },
  "143": {
    "material": "white",
    "opacity": 1
  },
  "144": {
    "material": "white",
    "opacity": 1
  },
  "145": {
    "material": "white",
    "opacity": 0.2
  },
  "146": {
    "material": "white",
    "opacity": 1
  },
  "147": {
    "material": "white",
    "opacity": 1
  },
  "148": {
    "material": "white",
    "opacity": 1
  },
  "149": {
    "material": "white",
    "opacity": 0.2
  },
  "150": {
    "material": "white",
    "opacity": 1
  },
  "151": {
    "material": "white",
    "opacity": 0.2
  },
  "152": {
    "material": "white",
    "opacity": 1
  },
  "153": {
    "material": "white",
    "opacity": 0.28
  },
  "154": {
    "material": "white",
    "opacity": 1
  },
  "155": {
    "material": "white",
    "opacity": 1
  },
  "156": {
    "material": "white",
    "opacity": 1
  },
  "157": {
    "material": "white",
    "opacity": 1
  },
  "158": {
    "material": "white",
    "opacity": 1
  },
  "159": {
    "material": "white",
    "opacity": 1
  },
  "160": {
    "material": "white",
    "opacity": 1
  },
  "161": {
    "material": "white",
    "opacity": 1
  },
  "162": {
    "material": "glass",
    "opacity": 0.92
  },
  "163": {
    "material": "white",
    "opacity": 0.92
  },
  "164": {
    "material": "glass",
    "opacity": 0.92
  },
  "165": {
    "material": "white",
    "opacity": 1
  },
  "166": {
    "material": "white",
    "opacity": 1
  },
  "167": {
    "material": "glass",
    "opacity": 1
  },
  "168": {
    "material": "white",
    "opacity": 1
  },
  "169": {
    "material": "concrete",
    "opacity": 1,
    "concreteColor": "#f7f2e9"
  },
  "170": {
    "material": "white",
    "opacity": 1
  },
  "171": {
    "material": "white",
    "opacity": 1
  },
  "172": {
    "material": "white",
    "opacity": 1
  },
  "173": {
    "material": "white",
    "opacity": 1
  },
  "174": {
    "material": "white",
    "opacity": 1
  }
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

function createSurfaceNoiseTexture(size = 256, baseTone = 188, variation = 34) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = `rgb(${baseTone}, ${baseTone}, ${baseTone})`;
  ctx.fillRect(0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const grain = baseTone + (Math.random() - 0.5) * variation;
    const clamped = Math.max(0, Math.min(255, grain));
    data[i] = clamped;
    data[i + 1] = clamped;
    data[i + 2] = clamped;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);

  for (let i = 0; i < 180; i++) {
    const alpha = 0.02 + Math.random() * 0.05;
    const tone = 150 + Math.random() * 70;
    ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * size,
      Math.random() * size,
      0.8 + Math.random() * 2.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  for (let i = 0; i < 85; i++) {
    const alpha = 0.015 + Math.random() * 0.04;
    const tone = 115 + Math.random() * 55;
    ctx.fillStyle = `rgba(${tone}, ${tone}, ${tone}, ${alpha})`;
    ctx.fillRect(
      Math.random() * size,
      Math.random() * size,
      8 + Math.random() * 28,
      1 + Math.random() * 2.5
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

function createHouseHeightField(size = 256, variation = 34) {
  const field = new Float32Array(size * size);
  const variationScale = THREE.MathUtils.clamp(variation / 48, 0.25, 2.2);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x;
      const broad = Math.sin((x / size) * Math.PI * 2.1 + y * 0.014) * 0.5 + 0.5;
      const medium = Math.sin((x + y) * 0.09) * 0.5 + 0.5;
      const fine = Math.random();
      const streak = Math.sin(y * 0.055 + x * 0.006) * 0.5 + 0.5;
      const edgeShade = 1 - Math.min(
        Math.min(x / size, 1 - x / size),
        Math.min(y / size, 1 - y / size)
      ) * 2;

      field[idx] = THREE.MathUtils.clamp(
        0.5
          + (broad - 0.5) * 0.18
          + (medium - 0.5) * 0.14
          + (fine - 0.5) * 0.12 * variationScale
          + Math.max(0, streak - 0.72) * 0.08
          - edgeShade * 0.05,
        0,
        1
      );
    }
  }

  return field;
}

function createHouseSurfaceMaps({
  size = 256,
  baseColor = new THREE.Color(0xeee8de),
  variation = 34,
  repeatX = 2,
  repeatY = 2,
  sourceMap = null,
} = {}) {
  const field = createHouseHeightField(size, variation);
  const albedoCanvas = document.createElement('canvas');
  const roughnessCanvas = document.createElement('canvas');
  albedoCanvas.width = roughnessCanvas.width = size;
  albedoCanvas.height = roughnessCanvas.height = size;
  const albedoCtx = albedoCanvas.getContext('2d');
  const roughnessCtx = roughnessCanvas.getContext('2d');

  if (sourceMap?.image) {
    albedoCtx.drawImage(sourceMap.image, 0, 0, size, size);
  }

  const albedoImage = albedoCtx.getImageData(0, 0, size, size);
  const roughnessImage = roughnessCtx.createImageData(size, size);
  const normalData = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x;
      const pixelIndex = idx * 4;
      const height = field[idx];
      const broadShade = Math.sin((x / size) * Math.PI * 3.2 + y * 0.022) * 0.5 + 0.5;
      const grunge = Math.max(0, Math.sin(x * 0.024 - y * 0.11) * 0.5 + 0.5 - 0.78);
      const edgeDarken = Math.max(
        0,
        0.12 - Math.min(
          Math.min(x / size, 1 - x / size),
          Math.min(y / size, 1 - y / size)
        )
      ) * 0.45;

      const sourceR = sourceMap?.image ? albedoImage.data[pixelIndex] / 255 : baseColor.r;
      const sourceG = sourceMap?.image ? albedoImage.data[pixelIndex + 1] / 255 : baseColor.g;
      const sourceB = sourceMap?.image ? albedoImage.data[pixelIndex + 2] / 255 : baseColor.b;
      const brightness = (broadShade - 0.5) * 0.08 + (height - 0.5) * 0.12 - grunge * 0.08 - edgeDarken;

      albedoImage.data[pixelIndex] = Math.round(THREE.MathUtils.clamp((sourceR + brightness) * 255, 0, 255));
      albedoImage.data[pixelIndex + 1] = Math.round(THREE.MathUtils.clamp((sourceG + brightness * 0.96) * 255, 0, 255));
      albedoImage.data[pixelIndex + 2] = Math.round(THREE.MathUtils.clamp((sourceB + brightness * 0.9) * 255, 0, 255));
      albedoImage.data[pixelIndex + 3] = 255;

      const roughnessValue = THREE.MathUtils.clamp(0.66 + (1 - height) * 0.18 + grunge * 0.08 + edgeDarken * 0.3, 0, 1);
      const roughnessChannel = Math.round(roughnessValue * 255);
      roughnessImage.data[pixelIndex] = roughnessChannel;
      roughnessImage.data[pixelIndex + 1] = roughnessChannel;
      roughnessImage.data[pixelIndex + 2] = roughnessChannel;
      roughnessImage.data[pixelIndex + 3] = 255;
    }
  }

  albedoCtx.putImageData(albedoImage, 0, 0);
  roughnessCtx.putImageData(roughnessImage, 0, 0);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = y * size + x;
      const pixelIndex = idx * 4;
      const left = field[y * size + Math.max(0, x - 1)];
      const right = field[y * size + Math.min(size - 1, x + 1)];
      const up = field[Math.max(0, y - 1) * size + x];
      const down = field[Math.min(size - 1, y + 1) * size + x];
      const nx = -(right - left) * 1.35;
      const ny = -(down - up) * 1.35;
      const nz = 1;
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      normalData[pixelIndex] = Math.round(((nx / len) * 0.5 + 0.5) * 255);
      normalData[pixelIndex + 1] = Math.round(((ny / len) * 0.5 + 0.5) * 255);
      normalData[pixelIndex + 2] = Math.round(((nz / len) * 0.5 + 0.5) * 255);
      normalData[pixelIndex + 3] = 255;
    }
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  const roughnessMap = new THREE.CanvasTexture(roughnessCanvas);
  const normalMap = new THREE.DataTexture(normalData, size, size, THREE.RGBAFormat);
  [map, roughnessMap, normalMap].forEach((texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.generateMipmaps = true;
    texture.needsUpdate = true;
  });
  map.colorSpace = THREE.SRGBColorSpace;
  roughnessMap.colorSpace = THREE.NoColorSpace;
  normalMap.colorSpace = THREE.NoColorSpace;
  return { map, roughnessMap, normalMap };
}

function saveHouseSurfaceToStorage() {
  if (!isHouseDetailPage) {
    return;
  }

  window.localStorage.setItem(houseSurfaceStorageKey, JSON.stringify({
    noiseVariation: houseSurfaceControls.noiseVariation,
    repeat: houseSurfaceControls.repeat,
    bumpScale: houseSurfaceControls.bumpScale,
    roughnessBoost: houseSurfaceControls.roughnessBoost,
  }));
}

function loadHouseSurfaceFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(houseSurfaceStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved house surface settings:', error);
    return null;
  }
}

function applySavedHouseSurfaceControls() {
  const savedSurface = loadHouseSurfaceFromStorage();
  if (!savedSurface) {
    return;
  }

  houseSurfaceControls.noiseVariation = clampFinite(savedSurface.noiseVariation, houseSurfaceControls.noiseVariation, 0, 96);
  houseSurfaceControls.repeat = clampFinite(savedSurface.repeat, houseSurfaceControls.repeat, 0.5, 8);
  houseSurfaceControls.bumpScale = clampFinite(savedSurface.bumpScale, houseSurfaceControls.bumpScale, 0, 0.08);
  houseSurfaceControls.roughnessBoost = clampFinite(savedSurface.roughnessBoost, houseSurfaceControls.roughnessBoost, -0.25, 0.35);
}

function applyHouseSurfaceVariation(material, {
  repeatX = 2,
  repeatY = 2,
  bumpScale = 0.015,
  roughness = 0.78,
  metalness = 0.02,
  baseColor = new THREE.Color(0xeee8de),
} = {}) {
  if (!material) {
    return material;
  }

  const settings = {
    repeatX,
    repeatY,
    bumpScale,
    roughness,
    metalness,
    baseColor: baseColor?.clone ? baseColor.clone() : new THREE.Color(baseColor),
    ...material.userData.houseSurfaceSettings,
  };
  material.userData.houseSurfaceSettings = settings;
  material.userData.houseSourceMap = material.userData.houseSourceMap ?? material.map ?? null;

  material.userData.houseGeneratedMaps?.forEach((texture) => texture?.dispose?.());

  const repeatMultiplier = houseSurfaceControls.repeat / 2.4;
  const maps = createHouseSurfaceMaps({
    size: 256,
    baseColor: settings.baseColor,
    variation: houseSurfaceControls.noiseVariation,
    repeatX: settings.repeatX * repeatMultiplier,
    repeatY: settings.repeatY * repeatMultiplier,
    sourceMap: material.userData.houseSourceMap,
  });

  material.roughness = THREE.MathUtils.clamp(settings.roughness + houseSurfaceControls.roughnessBoost, 0.05, 1);
  material.metalness = settings.metalness;
  material.color.set(0xf7f2e9);
  material.map = maps.map;
  material.roughnessMap = maps.roughnessMap;
  material.normalMap = maps.normalMap;
  if (!material.normalScale) {
    material.normalScale = new THREE.Vector2();
  }
  const resolvedNormalScale = Math.max(0.06, (settings.bumpScale + houseSurfaceControls.bumpScale) * 8.5);
  material.normalScale.setScalar(resolvedNormalScale);
  material.bumpMap = null;
  material.bumpScale = 0;
  material.userData.houseGeneratedMaps = [maps.map, maps.roughnessMap, maps.normalMap];
  material.userData.houseSurfaceVariation = true;
  material.needsUpdate = true;
  return material;
}

function refreshHouseSurfaceVariation() {
  houseMeshes.forEach((mesh) => {
    const material = mesh.material;
    if (!material || !material.userData.houseSurfaceVariation) {
      return;
    }

    applyHouseSurfaceVariation(material);
  });

  if (selectedHouseMesh?.material?.userData?.houseSurfaceVariation) {
    selectedHouseMesh.material.needsUpdate = true;
  }
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
const storageControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 1,
  log() {
    return saveAndExportTransform(storageModelRef, 'storageModelRef', saveStorageTransformToStorage);
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
  gui.add({ exportAll: showExportAllOverlay }, 'exportAll').name('Export All');
  if (gui.domElement) {
    gui.domElement.style.display = 'none';
  }
}

applySavedHouseSurfaceControls();

function setGuiVisibility(visible) {
  guiVisible = Boolean(visible);
  if (gui?.domElement) {
    gui.domElement.style.display = guiVisible ? '' : 'none';
  }
}

function toggleGuiVisibility() {
  setGuiVisibility(!guiVisible);
}

if (isHouseDetailPage) {
  window.addEventListener('keydown', (event) => {
    const targetTag = event.target?.tagName?.toLowerCase?.() || '';
    const isTypingTarget = targetTag === 'input'
      || targetTag === 'textarea'
      || event.target?.isContentEditable;
    if (isTypingTarget) {
      return;
    }
    if (event.key?.toLowerCase() === 'e') {
      toggleGuiVisibility();
    }
  });
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
  color: ${interactionPanelTextColor};
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: ${interactionPanelBackground};
  border: 1px solid ${interactionPanelBorder};
  border-radius: 14px;
  box-shadow: ${interactionPanelShadow};
  backdrop-filter: blur(10px);
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, calc(-100% - 14px));
  transition: opacity 180ms ease, transform 180ms ease;
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
  color: ${interactionPanelTextColor};
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: ${interactionPanelBackground};
  border: 1px solid ${interactionPanelBorder};
  border-radius: 14px;
  box-shadow: ${interactionPanelShadow};
  backdrop-filter: blur(10px);
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, calc(-100% - 14px));
  transition: opacity 180ms ease, transform 180ms ease;
  white-space: nowrap;
`;

const storageInfoPanel = document.createElement('div');
storageInfoPanel.innerHTML = `
  <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">Storage Room</div>
  <div style="margin-top: 4px; font-size: 12px; letter-spacing: 0.04em; text-transform: none; opacity: 0.88;">Energy System Module</div>
`;
storageInfoPanel.style.cssText = `
  position: fixed;
  left: 0;
  top: 0;
  z-index: 25;
  padding: 10px 14px;
  color: ${interactionPanelTextColor};
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: ${interactionPanelBackground};
  border: 1px solid ${interactionPanelBorder};
  border-radius: 14px;
  box-shadow: ${interactionPanelShadow};
  backdrop-filter: blur(10px);
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, calc(-100% - 14px));
  transition: opacity 180ms ease, transform 180ms ease;
  white-space: nowrap;
`;
if (isPrimaryHouseDetailPage) {
  document.body.appendChild(houseInfoPanel);
  document.body.appendChild(pvInfoPanel);
  document.body.appendChild(storageInfoPanel);
  setupTimeOfDaySlider();
  setupRainButton();
  setupModeSwitcher();
}

function showFloatingInfoPanel(panel) {
  panel.style.opacity = '1';
  panel.style.transform = 'translate(-50%, calc(-100% - 18px))';
}

function hideFloatingInfoPanel(panel) {
  panel.style.opacity = '0';
  panel.style.transform = 'translate(-50%, calc(-100% - 14px))';
}

function applyDetailBaseline() {
  if (!(scene.background instanceof THREE.Color)) {
    scene.background = daySkyBackground.clone();
  }
  scene.background.copy(daySkyBackground);
  scene.environment = detailSkybox || roomEnvironmentTexture;
  scene.environmentIntensity = lightingControls.environmentIntensity;
  scene.fog = null;
  renderer.toneMappingExposure = lightingControls.exposure;
  ambientLight.color.set(0xf3f7ff);
  ambientLight.intensity = lightingControls.ambientIntensity;
  keyLight.color.set(0xfff7ee);
  keyLight.intensity = Math.max(1.2, lightingControls.keyIntensity);
  keyLight.position.set(lightingControls.keyX, lightingControls.keyY, lightingControls.keyZ);
  fillLight.color.set(0xdbe7ff);
  fillLight.position.set(-6, 5.5, -4.5);
  fillLight.intensity = 0.16;
  rimLight.color.set(0xfff2de);
  rimLight.position.set(2.5, 4.2, -7.5);
  rimLight.intensity = 0.05;
  interiorLight.intensity = lightingControls.interiorIntensity;
  groundMaterial.color.set(environmentControls.groundColor);
  groundMaterial.emissive.set(0x000000);
  groundMaterial.emissiveIntensity = 0.0;
  groundMaterial.roughness = 0.98;
  groundMaterial.metalness = 0.0;
  groundMaterial.needsUpdate = true;
  if (groundMaterial.userData.shader) {
    groundMaterial.userData.shader.uniforms.uGroundColor.value.copy(groundMaterial.color);
  }
  pulseField.material.opacity = 0.045;
  pulseWaves.forEach((wave) => {
    wave.material.opacity = 0.02;
  });
  detailMaterials.forEach((mat) => {
    mat.emissive.set(0x000000);
    mat.emissiveIntensity = 0.008;
    mat.opacity = 0.88;
    mat.reflectivity = 0.78;
    if ('envMapIntensity' in mat) {
      mat.envMapIntensity = 0.38;
    }
  });
  syncGroundSkyBlendColor(scene.background);
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

function tryPositionCarModel() {
  if (!isHouseDetailPage || carPositioned || !houseModelRef || !carModelRef) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const carBox = new THREE.Box3().setFromObject(carModelRef);
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const carCenter = carBox.getCenter(new THREE.Vector3());
  const carSize = carBox.getSize(new THREE.Vector3());

  carModelRef.position.y -= carBox.min.y - groundPlane.position.y;
  carModelRef.position.x += houseCenter.x - carCenter.x + 0.55;
  carModelRef.position.z += houseBox.max.z + carSize.z * 0.6 - carCenter.z + 1.15;

  carPositioned = true;
}

function isValidCarPatrolPoint(point, expandedHouseBox, minDistance) {
  if (expandedHouseBox.containsPoint(point)) {
    return false;
  }

  const point2D = new THREE.Vector2(point.x, point.z);
  const reservedTargets = [
    houseWrapper,
    lngModelRef,
    storageModelRef,
    pvModelRef,
    treeModelRef,
    treeModelRef2,
    treeModelRef3,
    treeModelRef4,
    palmModelRef,
    palmModelRef2,
  ];

  for (const target of reservedTargets) {
    if (!target) {
      continue;
    }
    const targetBox = new THREE.Box3().setFromObject(target);
    const targetCenter = targetBox.getCenter(new THREE.Vector3());
    const targetSize = targetBox.getSize(new THREE.Vector3());
    const isPvFieldTarget = target === pvModelRef;
    const reservedRadius = Math.max(targetSize.x, targetSize.z) * (isPvFieldTarget ? 0.9 : 0.6)
      + minDistance * (isPvFieldTarget ? 0.78 : 0.48);
    if (point2D.distanceTo(new THREE.Vector2(targetCenter.x, targetCenter.z)) < reservedRadius) {
      return false;
    }
  }

  return true;
}

function resolveCarPatrolPoint(point, expandedHouseBox, minDistance) {
  const resolved = point.clone();

  if (expandedHouseBox.containsPoint(resolved)) {
    resolved.x += resolved.x >= carPatrolTempCenter.x
      ? expandedHouseBox.max.x - resolved.x + minDistance * 0.45
      : expandedHouseBox.min.x - resolved.x - minDistance * 0.45;
    resolved.z += resolved.z >= carPatrolTempCenter.z
      ? expandedHouseBox.max.z - resolved.z + minDistance * 0.45
      : expandedHouseBox.min.z - resolved.z - minDistance * 0.45;
  }

  const reservedTargets = [
    houseWrapper,
    lngModelRef,
    storageModelRef,
    pvModelRef,
    treeModelRef,
    treeModelRef2,
    treeModelRef3,
    treeModelRef4,
    palmModelRef,
    palmModelRef2,
  ];

  reservedTargets.forEach((target) => {
    if (!target) {
      return;
    }
    const targetBox = new THREE.Box3().setFromObject(target);
    const targetCenter = targetBox.getCenter(new THREE.Vector3());
    const targetSize = targetBox.getSize(new THREE.Vector3());
    const isPvFieldTarget = target === pvModelRef;
    const reservedRadius = Math.max(targetSize.x, targetSize.z) * (isPvFieldTarget ? 0.9 : 0.6)
      + minDistance * (isPvFieldTarget ? 0.78 : 0.48);
    const offset = new THREE.Vector2(resolved.x - targetCenter.x, resolved.z - targetCenter.z);
    const distance = offset.length();
    if (distance < reservedRadius) {
      if (distance < 1e-4) {
        offset.set(1, 0);
      } else {
        offset.divideScalar(distance);
      }
      const extraPush = isPvFieldTarget ? 0.7 : 0.25;
      resolved.x = targetCenter.x + offset.x * (reservedRadius + extraPush);
      resolved.z = targetCenter.z + offset.y * (reservedRadius + extraPush);
    }
  });

  resolved.y = carPatrolState.baseY;
  return resolved;
}

function generateCarPatrolPath() {
  if (!houseWrapper || !carModelRef) {
    return false;
  }

  carPatrolState.baseY = carModelRef.position.y;
  const sourceBox = new THREE.Box3().setFromObject(houseWrapper);
  sourceBox.getCenter(carPatrolTempCenter);
  sourceBox.getSize(carPatrolTempSize);
  const obstacleTargets = [
    houseWrapper,
    lngModelRef,
    storageModelRef,
    pvModelRef,
    treeModelRef,
    treeModelRef2,
    treeModelRef3,
    treeModelRef4,
    palmModelRef,
    palmModelRef2,
  ].filter(Boolean);

  carPatrolExpandedBox.copy(sourceBox);
  obstacleTargets.forEach((target) => {
    carPatrolObstacleBox.setFromObject(target);
    carPatrolExpandedBox.union(carPatrolObstacleBox);
  });
  carPatrolExpandedBox.expandByScalar(Math.max(carPatrolTempSize.x, carPatrolTempSize.z) * 0.1 + 0.95);

  const boundsCenter = carPatrolExpandedBox.getCenter(new THREE.Vector3());
  const boundsSize = carPatrolExpandedBox.getSize(new THREE.Vector3());
  const minDistance = Math.max(boundsSize.x, boundsSize.z) * 0.06 + 1.1;
  const orbitRadiusX = Math.max(boundsSize.x * 0.56, 5.8);
  const orbitRadiusZ = Math.max(boundsSize.z * 0.56, 6.2);
  const pointCount = 12;
  const points = [];

  for (let i = 0; i < pointCount; i += 1) {
    const angle = (i / pointCount) * Math.PI * 2;
    const rawPoint = new THREE.Vector3(
      boundsCenter.x + Math.cos(angle) * orbitRadiusX,
      carPatrolState.baseY,
      boundsCenter.z + Math.sin(angle) * orbitRadiusZ
    );
    points.push(resolveCarPatrolPoint(rawPoint, carPatrolExpandedBox, minDistance));
  }

  carPatrolState.points = points;
  carPatrolState.curve = new THREE.CatmullRomCurve3(points, true, 'centripetal');
  carPatrolState.progress = 0;
  carPatrolState.loopCount = 0;
  carPatrolState.speed = 0.026;

  carPatrolState.curve.getPointAt(0, carPatrolTempPoint);
  carPatrolState.curve.getPointAt(0.03, carPatrolTempAhead);
  const initialYaw = Math.atan2(
    carPatrolTempAhead.x - carPatrolTempPoint.x,
    carPatrolTempAhead.z - carPatrolTempPoint.z
  );
  initializeCarWheelRig();
  configureCarForwardAxis(initialYaw);
  carPatrolState.wheelSpin = 0;
  carModelRef.position.set(carPatrolTempPoint.x, carPatrolState.baseY, carPatrolTempPoint.z);
  carPatrolState.lastPosition = carPatrolTempPoint.clone();
  carPatrolState.initialized = true;
  return true;
}

function ensureCarPatrolPath() {
  if (!isPrimaryHouseDetailPage || !carPatrolState.enabled || !carModelRef || !houseWrapper) {
    return;
  }

  if (!carPatrolState.initialized || !carPatrolState.curve || carPatrolState.points.length < 6) {
    generateCarPatrolPath();
  }
}

function lerpAngle(current, target, alpha) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * alpha;
}

function initializeCarWheelRig() {
  if (!carModelRef) {
    return;
  }

  const carBox = new THREE.Box3().setFromObject(carModelRef);
  const carSize = carBox.getSize(new THREE.Vector3());
  carPatrolState.longitudinalAxis = carSize.x >= carSize.z ? 'x' : 'z';
  carPatrolState.wheelRollAxis = carPatrolState.longitudinalAxis === 'x' ? 'z' : 'x';
  carPatrolState.wheelMeshes = [];
  carPatrolState.frontWheelMeshes = new Set();

  carModelRef.traverse((child) => {
    if (!child.isMesh) {
      return;
    }
    const meshName = child.name.toLowerCase();
    if (!meshName.includes('wheel') && !meshName.includes('tire') && !meshName.includes('tyre')) {
      return;
    }
    child.updateWorldMatrix(true, false);
    child.getWorldPosition(carPatrolWheelLocal);
    carModelRef.worldToLocal(carPatrolWheelLocal);
    child.userData.carWheelBaseRotation = child.rotation.clone();
    child.userData.carWheelLocalPosition = carPatrolWheelLocal.clone();
    carPatrolState.wheelMeshes.push(child);
  });

  if (carPatrolState.wheelMeshes.length > 0) {
    let maxWheelRadius = 0.18;
    carPatrolState.wheelMeshes.forEach((wheel) => {
      const wheelBox = new THREE.Box3().setFromObject(wheel);
      const wheelSize = wheelBox.getSize(new THREE.Vector3());
      maxWheelRadius = Math.max(maxWheelRadius, Math.max(wheelSize.x, wheelSize.y, wheelSize.z) * 0.28);
    });
    carPatrolState.wheelRadius = maxWheelRadius;
  }
}

function configureCarForwardAxis(initialYaw) {
  if (!carModelRef) {
    return;
  }

  const currentRotation = carModelRef.rotation.y;
  const candidateOffsets = carPatrolState.longitudinalAxis === 'x'
    ? [
        { sign: 1, offset: -Math.PI * 0.5 },
        { sign: -1, offset: Math.PI * 0.5 },
      ]
    : [
        { sign: 1, offset: 0 },
        { sign: -1, offset: Math.PI },
      ];

  let bestCandidate = candidateOffsets[0];
  let bestDelta = Infinity;

  candidateOffsets.forEach((candidate) => {
    const desiredRotation = initialYaw + candidate.offset;
    const delta = Math.abs(Math.atan2(
      Math.sin(desiredRotation - currentRotation),
      Math.cos(desiredRotation - currentRotation)
    ));
    if (delta < bestDelta) {
      bestDelta = delta;
      bestCandidate = candidate;
    }
  });

  carPatrolState.forwardSign = bestCandidate.sign;
  carPatrolState.headingOffset = bestCandidate.offset + Math.PI * 0.5;
  carPatrolState.frontWheelMeshes = new Set();

  if (carPatrolState.wheelMeshes.length === 0) {
    return;
  }

  const axisKey = carPatrolState.longitudinalAxis === 'x' ? 'x' : 'z';
  const sortedWheels = [...carPatrolState.wheelMeshes].sort((a, b) => {
    const av = a.userData.carWheelLocalPosition?.[axisKey] ?? 0;
    const bv = b.userData.carWheelLocalPosition?.[axisKey] ?? 0;
    return carPatrolState.forwardSign > 0 ? bv - av : av - bv;
  });
  sortedWheels.slice(0, Math.max(2, Math.ceil(sortedWheels.length / 2))).forEach((wheel) => {
    carPatrolState.frontWheelMeshes.add(wheel);
  });
}

function updateCarWheelAnimation(targetYaw, distanceDelta) {
  if (!carModelRef || carPatrolState.wheelMeshes.length === 0) {
    return;
  }

  if (distanceDelta > 0) {
    carPatrolState.wheelSpin += distanceDelta / Math.max(carPatrolState.wheelRadius, 0.12);
  }

  const steeringDelta = Math.atan2(
    Math.sin(targetYaw - carModelRef.rotation.y),
    Math.cos(targetYaw - carModelRef.rotation.y)
  );
  const steeringAngle = THREE.MathUtils.clamp(steeringDelta * 0.85, -0.42, 0.42);

  carPatrolState.wheelMeshes.forEach((wheel) => {
    const baseRotation = wheel.userData.carWheelBaseRotation;
    if (!baseRotation) {
      return;
    }
    wheel.rotation.copy(baseRotation);
    if (carPatrolState.wheelRollAxis === 'x') {
      wheel.rotation.x = baseRotation.x - carPatrolState.wheelSpin;
    } else {
      wheel.rotation.z = baseRotation.z + carPatrolState.wheelSpin;
    }
    if (carPatrolState.frontWheelMeshes.has(wheel)) {
      wheel.rotation.y = baseRotation.y + steeringAngle;
    }
  });
}

function updateCarPatrol(dt) {
  if (!isPrimaryHouseDetailPage || !carPatrolState.enabled || !carModelRef || !carPatrolState.curve) {
    return;
  }

  const previousProgress = carPatrolState.progress;
  carPatrolState.progress = (carPatrolState.progress + dt * carPatrolState.speed) % 1;

  if (carPatrolState.progress < previousProgress) {
    carPatrolState.loopCount += 1;
  }

  carPatrolState.curve.getPointAt(carPatrolState.progress, carPatrolTempPoint);
  carPatrolState.curve.getPointAt((carPatrolState.progress + 0.028) % 1, carPatrolTempAhead);
  carPatrolTempDir.subVectors(carPatrolTempAhead, carPatrolTempPoint);
  carPatrolTempDir.y = 0;
  const distanceDelta = carPatrolState.lastPosition ? carPatrolState.lastPosition.distanceTo(carPatrolTempPoint) : 0;

  if (carPatrolTempDir.lengthSq() > 1e-6) {
    const targetYaw = Math.atan2(carPatrolTempDir.x, carPatrolTempDir.z) + carPatrolState.headingOffset;
    carModelRef.rotation.y = lerpAngle(carModelRef.rotation.y, targetYaw, 0.14);
    updateCarWheelAnimation(targetYaw, distanceDelta);
  }

  carModelRef.position.x = carPatrolTempPoint.x;
  carModelRef.position.y = carPatrolState.baseY;
  carModelRef.position.z = carPatrolTempPoint.z;
  if (!carPatrolState.lastPosition) {
    carPatrolState.lastPosition = carPatrolTempPoint.clone();
  } else {
    carPatrolState.lastPosition.copy(carPatrolTempPoint);
  }
}

function tryPositionLngModel() {
  if (!isHouseDetailPage || lngPositioned || !houseModelRef || !lngModelRef) {
    return;
  }

  if (loadLngTransformFromStorage()) {
    lngPositioned = true;
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const lngBox = new THREE.Box3().setFromObject(lngModelRef);
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const lngCenter = lngBox.getCenter(new THREE.Vector3());
  const lngSize = lngBox.getSize(new THREE.Vector3());

  lngModelRef.position.y -= lngBox.min.y - groundPlane.position.y;
  lngModelRef.position.x += houseBox.min.x - lngSize.x * 0.75 - lngCenter.x - 0.8;
  lngModelRef.position.z += houseCenter.z - lngCenter.z + 0.4;

  lngPositioned = true;
}

function tryPositionStorageModel() {
  if (!isHouseDetailPage || storagePositioned || !houseModelRef || !storageModelRef) {
    return;
  }

  const houseBox = new THREE.Box3().setFromObject(houseModelRef);
  const storageBox = new THREE.Box3().setFromObject(storageModelRef);
  const storageSize = storageBox.getSize(new THREE.Vector3());
  const houseCenter = houseBox.getCenter(new THREE.Vector3());
  const storageCenter = storageBox.getCenter(new THREE.Vector3());
  const houseSize = houseBox.getSize(new THREE.Vector3());

  storageModelRef.position.y -= storageBox.min.y - groundPlane.position.y;
  storageModelRef.position.x += houseBox.min.x - storageSize.x * 0.85 - 1.15;
  storageModelRef.position.z += houseCenter.z + houseSize.z * 0.24 - storageCenter.z;

  storagePositioned = true;
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

  updateContactShadows();

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
  const scale = (environmentControls.groundSize / 56) * groundVisualBleedScale;
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
    transparent: true,
    opacity: 1,
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
    environmentFolder.add(environmentControls, 'groundSize', 20, 160, 1).name('Ground Size').onChange(() => {
      updateGroundAppearance();
      saveEnvironmentToStorage();
    });
    environmentFolder.addColor(environmentControls, 'horizonColor').name('Horizon Color').onChange(() => {
      syncGroundSkyBlendColor();
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
    environmentFolder.add(environmentControls, 'resetToSource').name('Reset To Source');
    environmentFolder.add(environmentControls, 'log').name('Log Environment');
    environmentGuiBound = true;
  }

  refreshGui();
}

function setupLightingGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!lightingFolder) {
    lightingFolder = gui.addFolder('Lighting');
  }

  if (!lightingGuiBound) {
    lightingFolder.add(lightingControls, 'keyX', -30, 30, 0.1).name('Key Light X').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'keyY', 0, 30, 0.1).name('Key Light Y').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'keyZ', -30, 30, 0.1).name('Key Light Z').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'keyIntensity', 0, 2.5, 0.01).name('Key Intensity').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'ambientIntensity', 0, 1.2, 0.01).name('Ambient').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'interiorIntensity', 0, 1.2, 0.01).name('Interior').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'exposure', 0.3, 1.5, 0.01).name('Exposure').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'environmentIntensity', 0, 1.2, 0.01).name('Env Intensity').onChange(() => {
      applyLightingControls();
      saveEnvironmentToStorage();
    });
    lightingFolder.add(lightingControls, 'log').name('Log Lighting');
    lightingGuiBound = true;
  }

  refreshGui();
}

function setupEnergyLightingGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!energyLightingFolder) {
    energyLightingFolder = gui.addFolder('Energy Lighting');
  }

  if (!energyLightingGuiBound) {
    energyLightingFolder.add(energyLightingControls, 'keyX', -30, 30, 0.1).name('Key Light X').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'keyY', 0, 30, 0.1).name('Key Light Y').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'keyZ', -30, 30, 0.1).name('Key Light Z').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'keyIntensity', 0, 2.5, 0.01).name('Key Intensity').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'ambientIntensity', 0, 1.2, 0.01).name('Ambient').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'hemiIntensity', 0, 1.2, 0.01).name('Hemi').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'interiorIntensity', 0, 1.2, 0.01).name('Interior').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'fillIntensity', 0, 1.2, 0.01).name('Fill').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'rimIntensity', 0, 1.2, 0.01).name('Rim').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'exposure', 0.3, 1.5, 0.01).name('Exposure').onChange(() => {
      if (visualizationMode === 'Energy' || energyModeBlend > 0.001) {
        applyEnergyModeBlend(Math.max(energyModeBlend, 1));
      }
      saveEnergyLightingToStorage();
    });
    energyLightingFolder.add(energyLightingControls, 'log').name('Log Energy Light');
    energyLightingGuiBound = true;
  }

  refreshGui();
}

function setupTimeOfDayGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!timeOfDayFolder) {
    timeOfDayFolder = gui.addFolder('Time Of Day');
  }

  if (!timeOfDayGuiBound) {
    timeOfDayFolder.add(timeOfDayControls, 'mode', ['Day', 'Sunset', 'Night']).name('Mode').onChange((value) => {
      setTime(value);
    });
    timeOfDayGuiBound = true;
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

function saveCarTransformToStorage() {
  if (!isHouseDetailPage || !carModelRef) {
    return;
  }

  const transform = {
    position: {
      x: carModelRef.position.x,
      y: carModelRef.position.y,
      z: carModelRef.position.z,
    },
    rotation: {
      x: carModelRef.rotation.x,
      y: carModelRef.rotation.y,
      z: carModelRef.rotation.z,
    },
    scale: carModelRef.scale.x,
  };

  window.localStorage.setItem(carStorageKey, JSON.stringify(transform));
}

function saveLngTransformToStorage() {
  if (!isHouseDetailPage || !lngModelRef) {
    return;
  }

  const transform = {
    version: lngTransformVersion,
    position: {
      x: lngModelRef.position.x,
      y: lngModelRef.position.y,
      z: lngModelRef.position.z,
    },
    rotation: {
      x: lngModelRef.rotation.x,
      y: lngModelRef.rotation.y,
      z: lngModelRef.rotation.z,
    },
    scale: lngModelRef.scale.x,
  };

  window.localStorage.setItem(lngStorageKey, JSON.stringify(transform));
}

function loadCarTransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(carStorageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved car transform:', error);
    return null;
  }
}

function loadLngTransformFromStorage() {
  if (!isHouseDetailPage) {
    return null;
  }

  const raw = window.localStorage.getItem(lngStorageKey);
  if (!raw) {
    return null;
  }

  try {
    const saved = JSON.parse(raw);
    if ((saved?.version ?? 0) !== lngTransformVersion) {
      return null;
    }
    return saved;
  } catch (error) {
    console.warn('Failed to parse saved LNG transform:', error);
    return null;
  }
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

function saveStorageTransformToStorage() {
  if (!storageModelRef) {
    return;
  }

  storageSavedTransform.position = {
    x: storageModelRef.position.x,
    y: storageModelRef.position.y,
    z: storageModelRef.position.z,
  };
  storageSavedTransform.rotation = {
    x: storageModelRef.rotation.x,
    y: storageModelRef.rotation.y,
    z: storageModelRef.rotation.z,
  };
  storageSavedTransform.scale = storageModelRef.scale.x;
  window.localStorage.setItem(storageStorageKey, JSON.stringify(storageSavedTransform));
}

function savePvTransformToStorage() {
  if (!isHouseDetailPage || !pvModelRef) {
    return;
  }

  const transform = {
    version: pvTransformVersion,
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
    const saved = JSON.parse(raw);
    if ((saved?.version ?? 0) !== pvTransformVersion) {
      return null;
    }
    return saved;
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
    rotation: {
      x: treeModelRef4.rotation.x,
      y: treeModelRef4.rotation.y,
      z: treeModelRef4.rotation.z,
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

function applySavedCarTransform() {
  if (!carModelRef) {
    return;
  }

  const storedTransform = loadCarTransformFromStorage();
  const activeTransform = storedTransform || carSavedTransform;

  if (activeTransform.scale != null) {
    carModelRef.scale.setScalar(clampFinite(activeTransform.scale, carModelRef.scale.x, 0.01, 20));
  }

  if (activeTransform.rotation) {
    carModelRef.rotation.set(
      clampFinite(activeTransform.rotation.x, carModelRef.rotation.x, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.y, carModelRef.rotation.y, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.z, carModelRef.rotation.z, -Math.PI * 8, Math.PI * 8)
    );
  }

  if (activeTransform.position) {
    carModelRef.position.set(
      clampFinite(activeTransform.position.x, carModelRef.position.x, -80, 80),
      clampFinite(activeTransform.position.y, carModelRef.position.y, -20, 20),
      clampFinite(activeTransform.position.z, carModelRef.position.z, -80, 80)
    );
  }
}

function applySavedLngTransform() {
  if (!lngModelRef) {
    return;
  }

  const storedTransform = loadLngTransformFromStorage();
  const activeTransform = storedTransform || lngSavedTransform;

  if (activeTransform.scale != null) {
    lngModelRef.scale.setScalar(clampFinite(activeTransform.scale, lngModelRef.scale.x, 0.01, 20));
  }

  if (activeTransform.rotation) {
    lngModelRef.rotation.set(
      clampFinite(activeTransform.rotation.x, lngModelRef.rotation.x, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.y, lngModelRef.rotation.y, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.z, lngModelRef.rotation.z, -Math.PI * 8, Math.PI * 8)
    );
  }

  if (activeTransform.position) {
    lngModelRef.position.set(
      clampFinite(activeTransform.position.x, lngModelRef.position.x, -80, 80),
      clampFinite(activeTransform.position.y, lngModelRef.position.y, -20, 20),
      clampFinite(activeTransform.position.z, lngModelRef.position.z, -80, 80)
    );
  }
}

function applySavedStorageTransform() {
  if (!storageModelRef) {
    return;
  }

  const raw = window.localStorage.getItem(storageStorageKey);
  if (raw) {
    try {
      const saved = JSON.parse(raw);
      storageSavedTransform.position = saved.position ?? storageSavedTransform.position;
      storageSavedTransform.rotation = saved.rotation ?? storageSavedTransform.rotation;
      storageSavedTransform.scale = saved.scale ?? storageSavedTransform.scale;
    } catch (error) {
      console.warn('Failed to parse saved storage transform:', error);
    }
  }

  const activeTransform = storageSavedTransform;
  if (activeTransform.scale != null) {
    storageModelRef.scale.setScalar(clampFinite(activeTransform.scale, storageModelRef.scale.x, 0.01, 20));
  }

  if (activeTransform.rotation) {
    storageModelRef.rotation.set(
      clampFinite(activeTransform.rotation.x, storageModelRef.rotation.x, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.y, storageModelRef.rotation.y, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.z, storageModelRef.rotation.z, -Math.PI * 8, Math.PI * 8)
    );
  }

  if (activeTransform.position) {
    storageModelRef.position.set(
      clampFinite(activeTransform.position.x, storageModelRef.position.x, -80, 80),
      clampFinite(activeTransform.position.y, storageModelRef.position.y, -20, 20),
      clampFinite(activeTransform.position.z, storageModelRef.position.z, -80, 80)
    );
  }
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

  if (activeTransform.rotation) {
    treeModelRef4.rotation.set(
      clampFinite(activeTransform.rotation.x, treeModelRef4.rotation.x, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.y, treeModelRef4.rotation.y, -Math.PI * 8, Math.PI * 8),
      clampFinite(activeTransform.rotation.z, treeModelRef4.rotation.z, -Math.PI * 8, Math.PI * 8)
    );
  } else {
    treeModelRef4.rotation.y = activeTransform.rotationY != null
      ? clampFinite(activeTransform.rotationY, treeModelRef4.rotation.y, -Math.PI * 8, Math.PI * 8)
      : treeModelRef4.rotation.y;
  }
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

function syncCarControls() {
  if (!carModelRef) {
    return;
  }

  carControls.posX = carModelRef.position.x;
  carControls.posY = carModelRef.position.y;
  carControls.posZ = carModelRef.position.z;
  carControls.rotX = carModelRef.rotation.x;
  carControls.rotY = carModelRef.rotation.y;
  carControls.rotZ = carModelRef.rotation.z;
  carControls.scale = carModelRef.scale.x;
}

function syncLngControls() {
  if (!lngModelRef) {
    return;
  }

  lngControls.posX = lngModelRef.position.x;
  lngControls.posY = lngModelRef.position.y;
  lngControls.posZ = lngModelRef.position.z;
  lngControls.rotX = lngModelRef.rotation.x;
  lngControls.rotY = lngModelRef.rotation.y;
  lngControls.rotZ = lngModelRef.rotation.z;
  lngControls.scale = lngModelRef.scale.x;
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

function syncStorageControls() {
  if (!storageModelRef) {
    return;
  }

  storageControls.posX = storageModelRef.position.x;
  storageControls.posY = storageModelRef.position.y;
  storageControls.posZ = storageModelRef.position.z;
  storageControls.rotX = storageModelRef.rotation.x;
  storageControls.rotY = storageModelRef.rotation.y;
  storageControls.rotZ = storageModelRef.rotation.z;
  storageControls.scale = storageModelRef.scale.x;
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

function setupCarGui() {
  if (!isHouseDetailPage || !gui || !carModelRef) {
    return;
  }

  syncCarControls();

  if (!carFolder) {
    carFolder = gui.addFolder('Car');
  }

  if (!carGuiBound) {
    carFolder.add(carControls, 'posX', -20, 20, 0.01).name('Position X').onChange((value) => {
      carModelRef.position.x = value;
      saveCarTransformToStorage();
    });
    carFolder.add(carControls, 'posY', -10, 20, 0.01).name('Position Y').onChange((value) => {
      carModelRef.position.y = value;
      saveCarTransformToStorage();
    });
    carFolder.add(carControls, 'posZ', -20, 20, 0.01).name('Position Z').onChange((value) => {
      carModelRef.position.z = value;
      saveCarTransformToStorage();
    });
    carFolder.add(carControls, 'rotX', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation X').onChange((value) => {
      carModelRef.rotation.x = value;
      saveCarTransformToStorage();
    });
    carFolder.add(carControls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      carModelRef.rotation.y = value;
      saveCarTransformToStorage();
    });
    carFolder.add(carControls, 'rotZ', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Z').onChange((value) => {
      carModelRef.rotation.z = value;
      saveCarTransformToStorage();
    });
    carFolder.add(carControls, 'scale', 0.01, 10, 0.001).name('Uniform Scale').onChange((value) => {
      carModelRef.scale.setScalar(value);
      saveCarTransformToStorage();
    });
    carFolder.add(carControls, 'log').name('Save Transform');
    carGuiBound = true;
  }

  refreshGui();
}

function setupLngGui() {
  if (!isHouseDetailPage || !gui || !lngModelRef) {
    return;
  }

  syncLngControls();

  if (!lngFolder) {
    lngFolder = gui.addFolder('LNG');
  }

  if (!lngGuiBound) {
    lngFolder.add(lngControls, 'posX', -20, 20, 0.01).name('Position X').onChange((value) => {
      lngModelRef.position.x = value;
      saveLngTransformToStorage();
    });
    lngFolder.add(lngControls, 'posY', -10, 20, 0.01).name('Position Y').onChange((value) => {
      lngModelRef.position.y = value;
      saveLngTransformToStorage();
    });
    lngFolder.add(lngControls, 'posZ', -20, 20, 0.01).name('Position Z').onChange((value) => {
      lngModelRef.position.z = value;
      saveLngTransformToStorage();
    });
    lngFolder.add(lngControls, 'rotX', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation X').onChange((value) => {
      lngModelRef.rotation.x = value;
      saveLngTransformToStorage();
    });
    lngFolder.add(lngControls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      lngModelRef.rotation.y = value;
      saveLngTransformToStorage();
    });
    lngFolder.add(lngControls, 'rotZ', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Z').onChange((value) => {
      lngModelRef.rotation.z = value;
      saveLngTransformToStorage();
    });
    lngFolder.add(lngControls, 'scale', 0.01, 10, 0.001).name('Uniform Scale').onChange((value) => {
      lngModelRef.scale.setScalar(value);
      saveLngTransformToStorage();
    });
    lngFolder.add(lngControls, 'log').name('Save Transform');
    lngGuiBound = true;
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

function setupStorageGui() {
  if (!isHouseDetailPage || !gui || !storageModelRef) {
    return;
  }

  syncStorageControls();

  if (!storageFolder) {
    storageFolder = gui.addFolder('Storage');
  }

  if (!storageGuiBound) {
    storageFolder.add(storageControls, 'posX', -20, 20, 0.01).name('Position X').onChange((value) => {
      storageModelRef.position.x = value;
      saveStorageTransformToStorage();
    });
    storageFolder.add(storageControls, 'posY', -10, 20, 0.01).name('Position Y').onChange((value) => {
      storageModelRef.position.y = value;
      saveStorageTransformToStorage();
    });
    storageFolder.add(storageControls, 'posZ', -20, 20, 0.01).name('Position Z').onChange((value) => {
      storageModelRef.position.z = value;
      saveStorageTransformToStorage();
    });
    storageFolder.add(storageControls, 'rotX', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation X').onChange((value) => {
      storageModelRef.rotation.x = value;
      saveStorageTransformToStorage();
    });
    storageFolder.add(storageControls, 'rotY', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Y').onChange((value) => {
      storageModelRef.rotation.y = value;
      saveStorageTransformToStorage();
    });
    storageFolder.add(storageControls, 'rotZ', -Math.PI * 2, Math.PI * 2, 0.01).name('Rotation Z').onChange((value) => {
      storageModelRef.rotation.z = value;
      saveStorageTransformToStorage();
    });
    storageFolder.add(storageControls, 'scale', 0.01, 10, 0.001).name('Uniform Scale').onChange((value) => {
      storageModelRef.scale.setScalar(value);
      saveStorageTransformToStorage();
    });
    storageFolder.add(storageControls, 'log').name('Save Transform');
    storageGuiBound = true;
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
    color: 0xeee8de,
    roughness: 0.74,
    metalness: 0.01,
    transparent: true,
    opacity: 1.0,
  });
  material.userData.housePartPreset = 'white';
  return applyHouseSurfaceVariation(material, {
    repeatX: 2.4,
    repeatY: 2.4,
    bumpScale: 0.012,
    roughness: 0.76,
    metalness: 0.01,
    baseColor: new THREE.Color(0xede7dd),
  });
}

function createHouseGlassMaterial(opacity = 0.3) {
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xdce8f3,
    transparent: true,
    opacity,
    roughness: 0.06,
    metalness: 0.04,
    transmission: 0.68,
    thickness: 0.75,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.25,
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
  return applyHouseSurfaceVariation(material, {
    repeatX: 3.8,
    repeatY: 3.8,
    bumpScale: 0.022,
    roughness: 0.86,
    metalness: 0.015,
    baseColor: new THREE.Color(color),
  });
}

function extractSharedHouseMaterialTemplate() {
  if (sharedHouseMaterialTemplate || houseMeshes.length === 0) {
    return sharedHouseMaterialTemplate;
  }

  const sourceMesh = houseMeshes.find((mesh) => !(mesh.material?.transparent && (mesh.material?.opacity ?? 1) < 0.999))
    || houseMeshes[0];
  const sourceMaterial = sourceMesh?.material;
  if (!sourceMaterial) {
    return null;
  }

  sharedHouseMaterialTemplate = sourceMaterial.clone ? sourceMaterial.clone() : sourceMaterial;
  return sharedHouseMaterialTemplate;
}

function cloneSharedHousePbrMaterial({
  glassLike = false,
  color = glassLike ? '#edf2f5' : '#eaeaea',
  roughness = glassLike ? 0.3 : 0.8,
} = {}) {
  const template = extractSharedHouseMaterialTemplate();
  let material;

  if (template) {
    material = template.clone ? template.clone() : template;
  } else {
    material = new THREE.MeshPhysicalMaterial({
      color: 0xeaeaea,
      roughness: 0.8,
      metalness: 0.02,
    });
  }

  if (!(material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)) {
    material = new THREE.MeshPhysicalMaterial({
      color: 0xeaeaea,
      roughness: 0.8,
      metalness: 0.02,
    });
  }

  material.color = material.color?.clone ? material.color : new THREE.Color(0xffffff);
  material.color.set(color);
  material.roughness = roughness;
  if ('metalness' in material) {
    material.metalness = Math.max(0.01, material.metalness ?? 0.02);
  }
  if ('envMapIntensity' in material) {
    material.envMapIntensity = material.envMapIntensity ?? 0.85;
  }

  if (glassLike && material.isMeshPhysicalMaterial) {
    material.transparent = true;
    material.opacity = 0.92;
    material.transmission = 0.6;
    material.thickness = 0.55;
    material.ior = 1.22;
  } else {
    material.transparent = false;
    material.opacity = 1;
    if ('transmission' in material) {
      material.transmission = 0;
    }
    if ('thickness' in material) {
      material.thickness = 0;
    }
  }

  material.needsUpdate = true;
  return material;
}

function createLngMetalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xd9dde3,
    metalness: 0.94,
    roughness: 0.24,
    clearcoat: 0.22,
    clearcoatRoughness: 0.12,
    transparent: false,
    opacity: 1,
    side: THREE.FrontSide,
    envMapIntensity: 0.95,
  });
}

function createLngPipeMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xc7ccd2,
    metalness: 0.82,
    roughness: 0.34,
    side: THREE.FrontSide,
  });
}

function createLngSupportMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8d949c,
    metalness: 0.72,
    roughness: 0.42,
    side: THREE.FrontSide,
  });
}

function createCarMetalMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xb6bcc2,
    metalness: 0.72,
    roughness: 0.62,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    transparent: false,
    opacity: 1,
    side: THREE.FrontSide,
    envMapIntensity: 0.18,
  });
}

function createCarGlassMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x4f565f,
    metalness: 0.0,
    roughness: 0.06,
    transmission: 0.18,
    thickness: 0.12,
    transparent: true,
    opacity: 0.92,
    envMapIntensity: 0.9,
    side: THREE.FrontSide,
  });
}

function createCarWheelMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x191b1f,
    metalness: 0.0,
    roughness: 0.82,
    side: THREE.FrontSide,
  });
}

function createCarTrimMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0x8b9198,
    metalness: 0.7,
    roughness: 0.32,
    side: THREE.FrontSide,
  });
}

function applySharedMaterialToStorageModel() {
  if (!storageModelRef) {
    return;
  }

  storageModelRef.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.material = cloneSharedHousePbrMaterial({
      glassLike: false,
      color: '#eaeaea',
      roughness: 0.8,
    });
    child.castShadow = true;
    child.receiveShadow = true;
  });
}

function clearStorageInteractionGroups() {
  storageMachineRoomMeshes.length = 0;
  storageBatteryRoomMeshes.length = 0;
  storageHoveredRoomKey = null;
  storageSelectedRoomKey = null;
}

function getStorageRoomMeshes(roomKey) {
  return roomKey === 'machine'
    ? storageMachineRoomMeshes
    : roomKey === 'battery'
      ? storageBatteryRoomMeshes
      : [];
}

function getStorageRoomKeyFromObject(object) {
  return object?.userData?.storageRoomKey || null;
}

function getStorageRoomAnchor(roomKey) {
  const roomMeshes = getStorageRoomMeshes(roomKey);
  if (!roomMeshes.length) {
    return null;
  }

  const roomBounds = new THREE.Box3();
  let hasBounds = false;
  roomMeshes.forEach((mesh) => {
    roomBounds.expandByObject(mesh);
    hasBounds = true;
  });

  if (!hasBounds || roomBounds.isEmpty()) {
    return null;
  }

  return roomBounds.getCenter(new THREE.Vector3());
}

function setupStorageInteractionGroups() {
  clearStorageInteractionGroups();
  if (!storageModelRef) {
    return;
  }

  storageModelRef.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    const childBounds = new THREE.Box3().setFromObject(child);
    if (childBounds.isEmpty()) {
      return;
    }
    const childCenterWorld = childBounds.getCenter(new THREE.Vector3());
    const childCenterLocal = storageModelRef.worldToLocal(childCenterWorld.clone());
    const roomKey = childCenterLocal.x < storageRoomSplitX ? 'machine' : 'battery';

    child.userData.storageRoomKey = roomKey;
    child.userData.storageRoomCenterX = childCenterLocal.x;

    if (!child.material?.emissive) {
      child.material.emissive = new THREE.Color(0x000000);
    }
    child.material.userData.storageBaseEmissive = child.material.emissive.clone();
    child.material.userData.storageBaseEmissiveIntensity = child.material.emissiveIntensity ?? 0;
    child.material.userData.storageTargetEmissiveIntensity = child.material.userData.storageBaseEmissiveIntensity;
    child.material.userData.storageHighlightEmissive = interactionAccentColor.clone();

    if (roomKey === 'machine') {
      storageMachineRoomMeshes.push(child);
    } else {
      storageBatteryRoomMeshes.push(child);
    }
  });
}

function setStorageRoomHover(roomKey) {
  storageHoveredRoomKey = roomKey;
}

function setStorageRoomSelection(roomKey) {
  storageSelectedRoomKey = roomKey;

  if (!roomKey) {
    hideFloatingInfoPanel(storageInfoPanel);
    return;
  }

  const labelContent = storageRoomLabelContent[roomKey];
  if (labelContent) {
    storageInfoPanel.innerHTML = `
      <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase;">${labelContent.title}</div>
      <div style="margin-top: 4px; font-size: 12px; letter-spacing: 0.04em; text-transform: none; opacity: 0.88;">${labelContent.subtitle}</div>
    `;
  }
}

function updateStorageRoomHighlight() {
  const activeRoomKey = storageHoveredRoomKey || storageSelectedRoomKey;
  ['machine', 'battery'].forEach((roomKey) => {
    const isActive = activeRoomKey === roomKey;
    const roomMeshes = getStorageRoomMeshes(roomKey);
    roomMeshes.forEach((mesh) => {
      if (!mesh.material?.userData) {
        return;
      }

      const baseEmissive = mesh.material.userData.storageBaseEmissive || new THREE.Color(0x000000);
      const highlightEmissive = mesh.material.userData.storageHighlightEmissive || interactionAccentColor;
      const baseIntensity = mesh.material.userData.storageBaseEmissiveIntensity ?? 0;
      const targetIntensity = isActive ? 0.6 : baseIntensity;
      const currentIntensity = mesh.material.emissiveIntensity ?? baseIntensity;

      mesh.material.emissive.copy(isActive ? highlightEmissive : baseEmissive);
      mesh.material.emissiveIntensity = THREE.MathUtils.lerp(currentIntensity, targetIntensity, 0.18);
    });
  });
}

function updateStorageHover() {
  if (!isHouseDetailPage || !storagePointerActive || !storageModelRef) {
    if (storageHoveredRoomKey) {
      setStorageRoomHover(null);
    }
    return;
  }

  raycaster.setFromCamera(pointer, camera);
  const storageIntersects = raycaster.intersectObject(storageModelRef, true);
  const hitRoomKey = storageIntersects.length > 0
    ? getStorageRoomKeyFromObject(storageIntersects[0].object)
    : null;

  setStorageRoomHover(hitRoomKey);
}

function updateStorageInfoPanelPosition() {
  if (!storageSelectedRoomKey) {
    return;
  }

  const anchor = getStorageRoomAnchor(storageSelectedRoomKey);
  if (!anchor) {
    storageInfoPanel.style.opacity = '0';
    return;
  }

  anchor.project(camera);
  const screenX = (anchor.x * 0.5 + 0.5) * window.innerWidth;
  const screenY = (-anchor.y * 0.5 + 0.5) * window.innerHeight;
  const isVisible = anchor.z > -1 && anchor.z < 1;

  storageInfoPanel.style.left = `${screenX}px`;
  storageInfoPanel.style.top = `${screenY}px`;
  if (isVisible) {
    showFloatingInfoPanel(storageInfoPanel);
  } else {
    hideFloatingInfoPanel(storageInfoPanel);
  }
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
    return housePartSavedOverrides;
  }

  const raw = window.localStorage.getItem(housePartStorageKey);
  if (!raw) {
    return housePartSavedOverrides;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse saved house part overrides:', error);
    return housePartSavedOverrides;
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

function setupHouseSurfaceGui() {
  if (!isHouseDetailPage || !gui) {
    return;
  }

  if (!houseSurfaceFolder) {
    houseSurfaceFolder = gui.addFolder('House Surface');
  }

  if (!houseSurfaceFolder.__controllers.length) {
    houseSurfaceFolder.add(houseSurfaceControls, 'noiseVariation', 0, 96, 1).name('Noise Amount').onChange(() => {
      houseSurfaceControls.apply();
    });
    houseSurfaceFolder.add(houseSurfaceControls, 'repeat', 0.5, 8, 0.05).name('Noise Scale').onChange(() => {
      houseSurfaceControls.apply();
    });
    houseSurfaceFolder.add(houseSurfaceControls, 'bumpScale', 0, 0.08, 0.001).name('Bump Depth').onChange(() => {
      houseSurfaceControls.apply();
    });
    houseSurfaceFolder.add(houseSurfaceControls, 'roughnessBoost', -0.25, 0.35, 0.01).name('Roughness').onChange(() => {
      houseSurfaceControls.apply();
    });
    houseSurfaceFolder.add(houseSurfaceControls, 'apply').name('Apply Surface');
    houseSurfaceFolder.add(houseSurfaceControls, 'log').name('Log Surface');
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
  if (!isSelected) {
    hideFloatingInfoPanel(pvInfoPanel);
  }
}

function setHouseHoverState(isHovered) {
  if (houseHovered === isHovered) {
    return;
  }

  houseHovered = isHovered;
}

function setHouseSelectedState(isSelected) {
  houseSelected = isSelected;
  if (houseSelectionLight) {
    houseSelectionLight.visible = false;
    houseSelectionLight.intensity = 0;
  }
  if (!isSelected) {
    hideFloatingInfoPanel(houseInfoPanel);
  }
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
  if (isVisible) {
    showFloatingInfoPanel(pvInfoPanel);
  } else {
    hideFloatingInfoPanel(pvInfoPanel);
  }
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
  if (isVisible) {
    showFloatingInfoPanel(houseInfoPanel);
  } else {
    hideFloatingInfoPanel(houseInfoPanel);
  }
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
      color: 0xdce8f3,
      roughness: 0.07,
      metalness: 0.04,
      transmission: 0.56,
      thickness: 1.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      ior: 1.45,
      reflectivity: 0.84,
      envMapIntensity: 1.45,
      transparent: true,
      opacity: 0.92,
      emissive: new THREE.Color(0x0f2340),
      emissiveIntensity: 0.05,
    });
    detailMaterials.push(shellGlassMaterial);

    const backWallMaterial = applyHouseSurfaceVariation(new THREE.MeshStandardMaterial({
      color: 0xeee6dc,
      roughness: 0.66,
      metalness: 0.02,
      emissive: new THREE.Color(0x06111e),
      emissiveIntensity: 0.015,
    }), {
      repeatX: 2.8,
      repeatY: 2.8,
      bumpScale: 0.014,
      roughness: 0.76,
      metalness: 0.015,
      baseColor: new THREE.Color(0xede5db),
    });

    const frontGlassMaterial = shellGlassMaterial.clone();
    frontGlassMaterial.transmission = 0.56;
    frontGlassMaterial.opacity = 0.9;
    frontGlassMaterial.thickness = 0.85;
    detailMaterials.push(frontGlassMaterial);

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
        child.material = applyHouseSurfaceVariation(new THREE.MeshStandardMaterial({
          color: 0xeee6dc,
          roughness: 0.64,
          metalness: 0.03,
          emissive: new THREE.Color(0x081321),
          emissiveIntensity: 0.012,
        }), {
          repeatX: 2.2,
          repeatY: 2.2,
          bumpScale: 0.013,
          roughness: 0.7,
          metalness: 0.03,
          baseColor: new THREE.Color(0xede5db),
        });
      }

      child.material = child.material.clone();
      houseInteractiveMaterials.push(child.material);
      child.userData.houseMeshIndex = houseMeshes.length;
      child.userData.houseRoofLike = roofLike;
      child.userData.housePartPreset = (child.material.transparent && (child.material.opacity ?? 1) < 0.999)
        ? 'glass'
        : 'white';
      child.material.userData.houseNightGlowStrength = child.material.transparent
        ? (roofLike || frontLike ? 0.16 : 0.12)
        : backWallLike
          ? 0.05
          : 0.025;
      child.material.userData.houseNightGlowColor = child.material.transparent
        ? new THREE.Color(0xffdda9)
        : new THREE.Color(0xffbf7a);
      child.userData.houseDefaultMaterial = child.material.clone();
      houseMeshes.push(child);
    });

    model.position.set(0.140, 0.226, 0.092);
    model.rotation.set(0.000, 0.000, 0.000);
    model.scale.set(0.225, 0.225, 0.225);

    [...new Set(houseInteractiveMaterials)].forEach((material) => {
      if (!material.emissive) {
        material.emissive = new THREE.Color(0x000000);
      }
      material.userData.houseBaseEmissive = material.emissive.clone();
      material.userData.houseBaseEmissiveIntensity = material.emissiveIntensity ?? 0;
      material.userData.houseStaticBaseEmissive = material.userData.houseBaseEmissive.clone();
      material.userData.houseStaticBaseEmissiveIntensity = material.userData.houseBaseEmissiveIntensity;
      material.userData.houseNightGlowColor = material.userData.houseNightGlowColor || new THREE.Color(0xffd39a);
      material.userData.houseNightGlowStrength = material.userData.houseNightGlowStrength ?? 0.04;
      material.userData.houseHoverEmissive = material.emissive.clone().lerp(interactionAccentColor, 0.55);
      material.userData.houseHoverEmissiveIntensity = Math.max(
        (material.emissiveIntensity ?? 0) + 0.08,
        0.08
      );
      material.userData.houseSelectedEmissive = material.emissive.clone().lerp(interactionAccentColorStrong, 0.72);
      material.userData.houseSelectedEmissiveIntensity = Math.max(
        (material.emissiveIntensity ?? 0) + 0.18,
        0.16
      );
    });

    extractSharedHouseMaterialTemplate();
    applySharedMaterialToStorageModel();

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
    houseSelectionLight = new THREE.PointLight(interactionAccentColorStrong, 0, Math.max(houseLightSize.x, houseLightSize.y, houseLightSize.z) * 1.25, 2);
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
    setupHouseSurfaceGui();
    setupGrassGui();
    setupTimeOfDayGui();
    setupEnvironmentGui();
    setupLightingGui();
    setupEnergyLightingGui();
    setupGroundRadiusGui();
    setupGroundColorGui();
    setupCameraGui();
    createSkyboxMesh();
    createRainSystem();
    updateGroundAppearance();
    updateSkyboxTransform();
    applyDetailBaseline();
    setTime(timeOfDayControls.value);
    syncCameraControls();
    applySavedCameraTransform();
    syncCameraControls();
    refreshGui();
    buildGrassField();
    tryPositionCarModel();
    tryPositionLngModel();
    tryPositionPvModel();
    tryPositionTreeModel();
    tryPositionTreeModel2();
    tryPositionTreeModel3();
    tryPositionTreeModel4();
    tryPositionPalmModel();
    tryPositionPalmModel2();
    rebuildEnergyTrackingVisuals();
    startEnergyTrackingPageIntro();
  },
  undefined,
  (error) => {
    console.error('GLB load error:', error);
  }
);

if (isHouseDetailPage) {
  renderer.domElement.addEventListener('pointermove', (event) => {
    if (!pvModelRef && !houseWrapper && !storageModelRef) {
      return;
    }

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    storagePointerActive = true;
    raycaster.setFromCamera(pointer, camera);

    const storageIntersects = storageModelRef ? raycaster.intersectObject(storageModelRef, true) : [];
    const storageRoomKey = storageIntersects.length > 0
      ? getStorageRoomKeyFromObject(storageIntersects[0].object)
      : null;
    const pvIntersects = storageRoomKey ? [] : (pvModelRef ? raycaster.intersectObject(pvModelRef, true) : []);
    const houseIntersects = storageRoomKey ? [] : (houseWrapper ? raycaster.intersectObject(houseWrapper, true) : []);
    const isHoveringPv = pvIntersects.length > 0;
    const isHoveringHouse = !storageRoomKey && !isHoveringPv && houseIntersects.length > 0;
    setStorageRoomHover(storageRoomKey);
    setPvHoverState(isHoveringPv);
    setHouseHoverState(isHoveringHouse);
    renderer.domElement.style.cursor = storageRoomKey || isHoveringPv || isHoveringHouse ? 'pointer' : 'default';
  });

  renderer.domElement.addEventListener('pointerleave', () => {
    storagePointerActive = false;
    setStorageRoomHover(null);
    setPvHoverState(false);
    setHouseHoverState(false);
    renderer.domElement.style.cursor = 'default';
  });

  renderer.domElement.addEventListener('pointerdown', (event) => {
    if (!pvModelRef && !houseWrapper && !storageModelRef) {
      return;
    }

    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    storagePointerActive = true;
    raycaster.setFromCamera(pointer, camera);

    const storageIntersects = storageModelRef ? raycaster.intersectObject(storageModelRef, true) : [];
    if (storageIntersects.length > 0) {
      const storageRoomKey = getStorageRoomKeyFromObject(storageIntersects[0].object);
      if (storageRoomKey) {
        selectedHouseMesh = null;
        setStorageRoomSelection(storageRoomKey);
        setPvSelectedState(false);
        setHouseSelectedState(false);
        return;
      }
    }

    const pvIntersects = pvModelRef ? raycaster.intersectObject(pvModelRef, true) : [];
    const houseIntersects = houseMeshes.length > 0 ? raycaster.intersectObjects(houseMeshes, false) : [];

    if (pvIntersects.length > 0) {
      selectedHouseMesh = null;
      setStorageRoomSelection(null);
      setPvSelectedState(!pvSelected);
      setHouseSelectedState(false);
      return;
    }

    if (houseIntersects.length > 0) {
      selectedHouseMesh = houseIntersects[0].object;
      updateHousePartGui();
      setStorageRoomSelection(null);
      setHouseSelectedState(true);
      setPvSelectedState(false);
      return;
    }

    selectedHouseMesh = null;
    setStorageRoomSelection(null);
    setPvSelectedState(false);
    setHouseSelectedState(false);
  });

  loader.load(
    './models/energy_storage-3.glb',
    (gltf) => {
      const carModel = gltf.scene;
      carModel.name = 'detailCarModel';

      const carBox = new THREE.Box3().setFromObject(carModel);
      const carSize = carBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(carSize.x, carSize.y, carSize.z) || 1;
      const targetLength = 2.6;
      carModel.scale.setScalar(targetLength / maxDim);

      carBox.setFromObject(carModel);
      const carCenter = carBox.getCenter(new THREE.Vector3());
      carModel.position.set(-carCenter.x, -carBox.min.y, -carCenter.z);
      carModel.rotation.y = Math.PI;

      carModel.traverse((child) => {
        if (!child.isMesh) {
          return;
        }
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.geometry?.computeVertexNormals) {
          child.geometry.computeVertexNormals();
        }
        const meshName = child.name.toLowerCase();
        if (meshName.includes('glass') || meshName.includes('window') || meshName.includes('windshield')) {
          child.material = createCarGlassMaterial();
        } else if (meshName.includes('wheel') || meshName.includes('tire') || meshName.includes('tyre')) {
          child.material = createCarWheelMaterial();
        } else if (meshName.includes('rim') || meshName.includes('trim') || meshName.includes('metal')) {
          child.material = createCarTrimMaterial();
        } else {
          child.material = createCarMetalMaterial();
        }
      });

      carModelRef = carModel;
      exposeTransformTarget('carModelRef', carModelRef);
      houseRoot.add(carModelRef);
      tryPositionCarModel();
      applySavedCarTransform();
      syncCarControls();
      setupCarGui();
      startEnergyTrackingPageIntro();
    },
    undefined,
    (error) => {
      console.error('Car GLB load error:', error);
    }
  );

  loader.load(
    './models/lng.glb',
    (gltf) => {
      const lngModel = gltf.scene;
      lngModel.name = 'detailLngModel';

      const lngBox = new THREE.Box3().setFromObject(lngModel);
      const lngSize = lngBox.getSize(new THREE.Vector3());
      const maxDim = Math.max(lngSize.x, lngSize.y, lngSize.z) || 1;
      const targetLength = 2.9;
      lngModel.scale.setScalar(targetLength / maxDim);

      lngBox.setFromObject(lngModel);
      const lngCenter = lngBox.getCenter(new THREE.Vector3());
      lngModel.position.set(-lngCenter.x, -lngBox.min.y, -lngCenter.z);

      lngModel.traverse((child) => {
        if (!child.isMesh) {
          return;
        }
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.geometry?.computeVertexNormals) {
          child.geometry.computeVertexNormals();
        }
        const meshName = child.name.toLowerCase();
        if (meshName.includes('pipe') || meshName.includes('tube') || meshName.includes('rail')) {
          child.material = createLngPipeMaterial();
        } else if (meshName.includes('frame') || meshName.includes('base') || meshName.includes('support')) {
          child.material = createLngSupportMaterial();
        } else {
          child.material = createLngMetalMaterial();
        }
      });

      lngModelRef = lngModel;
      houseRoot.add(lngModelRef);
      tryPositionLngModel();
      applySavedLngTransform();
      syncLngControls();
      setupLngGui();
      startEnergyTrackingPageIntro();
    },
    undefined,
    (error) => {
      console.error('LNG GLB load error:', error);
    }
  );

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
        color: interactionAccentColorStrong,
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
          const lightenedMap = createLightenedPvTexture(originalMap, 0.7);
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
          child.userData.pvHoverColor = new THREE.Color(0xf3ead7);
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
      startEnergyTrackingPageIntro();
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
  updateDashboardOverlayData(dt);
  updateDashboardOperationPanel();
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
  updateEnergyTrackingCameraTransition(dt);
  updateVisualizationModeTransition(dt);
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
  if (isRaining) {
    updateRain();
  }
  ensureCarPatrolPath();
  updateCarPatrol(dt);
  updateEnergyTracking(elapsed);
  updateStorageHover();
  updateStorageRoomHighlight();
  updateContactShadows();
  updateHouseInfoPanelPosition();
  updatePvInfoPanelPosition();
  updateStorageInfoPanelPosition();
  controls.update();
  if (sceneSection === 'energy section') {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  bloomPass.setSize(window.innerWidth, window.innerHeight);
});
