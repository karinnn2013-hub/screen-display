import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe6ebf0);
scene.fog = new THREE.FogExp2(0xe6ebf0, 0.0035);
const baseLayer = new THREE.Group();
baseLayer.name = 'baseLayer';
const systemLayer = new THREE.Group();
systemLayer.name = 'systemLayer';
const epilogueLayer = new THREE.Group();
epilogueLayer.name = 'epilogueLayer';
scene.add(baseLayer);
scene.add(systemLayer);
scene.add(epilogueLayer);

const heroCameraPosition = new THREE.Vector3(0.620, 8.680, 37.116);
const heroCameraTarget = new THREE.Vector3(0.875, 0.000, -13.902);
const heroCameraZoom = 0.9;
const scrollEndCameraPosition = new THREE.Vector3(0, 30, 0.01);
const scrollEndCameraTarget = new THREE.Vector3(0, 0, 0);
const scrollEndCityScale = 0.85;

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.copy(heroCameraPosition);
camera.zoom = heroCameraZoom;
camera.lookAt(heroCameraTarget);
camera.updateProjectionMatrix();

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.physicallyCorrectLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.72;
const root = document.getElementById('root') ?? document.body;
root.appendChild(renderer.domElement);

const pmremGenerator = new THREE.PMREMGenerator(renderer);
const cityEnvironmentTexture = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = cityEnvironmentTexture;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.24,
  0.24,
  0.9
);
composer.addPass(bloomPass);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0';
labelRenderer.domElement.style.left = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
labelRenderer.domElement.style.overflow = 'hidden';
root.appendChild(labelRenderer.domElement);

const labelStyle = document.createElement('style');
labelStyle.textContent = `
  .module-label {
    position: relative;
    padding: 8px 12px;
    min-width: 108px;
    text-align: center;
    font-family: "Inter", "Segoe UI", sans-serif;
    font-size: 10px;
    line-height: 1.25;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    white-space: pre-line;
    border-radius: 10px;
    backdrop-filter: blur(8px);
    transform: translate(-50%, -50%);
    transition:
      color 0.35s ease,
      background-color 0.35s ease,
      border-color 0.35s ease,
      box-shadow 0.35s ease;
  }

  .module-label.day {
    color: rgba(92, 112, 136, 0.92);
    background: rgba(248, 251, 255, 0.52);
    border: 1px solid rgba(182, 196, 214, 0.45);
    box-shadow:
      0 0 0 1px rgba(255, 255, 255, 0.18) inset,
      0 4px 14px rgba(120, 145, 170, 0.08);
  }

  .module-label.night {
    color: rgba(208, 232, 255, 0.94);
    background: rgba(7, 16, 30, 0.62);
    border: 1px solid rgba(118, 164, 214, 0.24);
    box-shadow:
      0 0 0 1px rgba(120, 180, 255, 0.06) inset,
      0 0 16px rgba(80, 160, 255, 0.12);
  }

  .module-label::after {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: 10px;
    pointer-events: none;
    transition: box-shadow 0.35s ease;
  }

  .module-label.day::after {
    box-shadow: 0 0 10px rgba(180, 200, 224, 0.08);
  }

  .module-label.night::after {
    box-shadow: 0 0 14px rgba(98, 176, 255, 0.14);
  }
`;
document.head.appendChild(labelStyle);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.enablePan = true;
controls.enableRotate = true;
controls.rotateSpeed = 0.4;
controls.zoomSpeed = 0.8;
controls.panSpeed = 0.8;
controls.minAzimuthAngle = -0.4;
controls.maxAzimuthAngle = 0.4;
controls.minPolarAngle = 0.82;
controls.maxPolarAngle = 1.42;
controls.minDistance = 27.55;
controls.maxDistance = 70.843;
controls.target.copy(heroCameraTarget);
controls.saveState = () => {};
controls.update();
controls.enabled = false;

let scrollCameraProgress = 0;
let scrollStoryProgress = 0;
window.addEventListener('scroll', () => {
  const cameraScroll = window.innerHeight * 1.5;
  const storyScroll = window.innerHeight * 3.2;
  scrollCameraProgress = THREE.MathUtils.clamp(window.scrollY / cameraScroll, 0, 1);
  scrollStoryProgress = THREE.MathUtils.clamp(window.scrollY / storyScroll, 0, 1);
}, { passive: true });

const stageVisualState = {
  sensing: 1,
  interpreting: 0,
  synchronizing: 0,
  interpretingProgress: 0,
  synchronizingProgress: 0,
};

function updateStageVisualState() {
  const p = scrollStoryProgress;
  stageVisualState.sensing = 1 - smoothstepJS(0.2, 0.42, p);
  const interpretingIn = smoothstepJS(0.22, 0.48, p);
  const interpretingOut = smoothstepJS(0.58, 0.82, p);
  stageVisualState.interpreting = interpretingIn * (1 - interpretingOut);
  stageVisualState.synchronizing = smoothstepJS(0.64, 0.86, p) * (1 - smoothstepJS(0.92, 0.98, p));
  stageVisualState.interpretingProgress = smoothstepJS(0.33, 0.66, p);
  stageVisualState.synchronizingProgress = smoothstepJS(0.66, 0.86, p);
  stageVisualState.epilogue = smoothstepJS(0.92, 1.0, p);
  stageVisualState.intensify = smoothstepJS(0.92, 0.95, p);
  stageVisualState.breakdown = smoothstepJS(0.945, 0.972, p);
  stageVisualState.detach = smoothstepJS(0.965, 0.987, p);
  stageVisualState.flatten = smoothstepJS(0.982, 0.996, p);
  stageVisualState.dataField = smoothstepJS(0.992, 1.0, p);
}

function updateScrollCamera() {
  const eased = scrollCameraProgress * scrollCameraProgress * (3 - 2 * scrollCameraProgress);
  const currentPos = heroCameraPosition.clone().lerp(scrollEndCameraPosition, eased);
  const currentTarget = heroCameraTarget.clone().lerp(scrollEndCameraTarget, eased);
  camera.position.copy(currentPos);
  controls.target.copy(currentTarget);
  camera.lookAt(currentTarget);
  const scaleT = smoothstepJS(0.55, 1.0, eased);
  const cityScale = THREE.MathUtils.lerp(1.0, scrollEndCityScale, scaleT);
  cityGroup.scale.setScalar(cityScale);
}

function formatCameraNumber(value) {
  return Number(value).toFixed(3);
}

const cameraExportToast = document.createElement('div');
cameraExportToast.style.cssText = `
  position: fixed;
  right: 18px;
  bottom: 18px;
  padding: 10px 14px;
  border-radius: 10px;
  background: rgba(10, 18, 28, 0.88);
  color: rgba(255, 255, 255, 0.92);
  font-family: "Inter", "Segoe UI", sans-serif;
  font-size: 12px;
  letter-spacing: 0.02em;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(120, 180, 255, 0.2);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.18);
  opacity: 0;
  transform: translateY(10px);
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  z-index: 1200;
`;
root.appendChild(cameraExportToast);

let cameraExportToastTimer = null;

function showCameraExportToast(message) {
  cameraExportToast.textContent = message;
  cameraExportToast.style.opacity = '1';
  cameraExportToast.style.transform = 'translateY(0)';
  if (cameraExportToastTimer) clearTimeout(cameraExportToastTimer);
  cameraExportToastTimer = setTimeout(() => {
    cameraExportToast.style.opacity = '0';
    cameraExportToast.style.transform = 'translateY(10px)';
  }, 1800);
}

function getCameraExportText() {
  return `
camera.position.set(${formatCameraNumber(camera.position.x)}, ${formatCameraNumber(camera.position.y)}, ${formatCameraNumber(camera.position.z)});
controls.target.set(${formatCameraNumber(controls.target.x)}, ${formatCameraNumber(controls.target.y)}, ${formatCameraNumber(controls.target.z)});
camera.zoom = ${formatCameraNumber(camera.zoom)};
camera.lookAt(${formatCameraNumber(controls.target.x)}, ${formatCameraNumber(controls.target.y)}, ${formatCameraNumber(controls.target.z)});
camera.updateProjectionMatrix();
controls.minAzimuthAngle = ${formatCameraNumber(controls.minAzimuthAngle)};
controls.maxAzimuthAngle = ${formatCameraNumber(controls.maxAzimuthAngle)};
controls.minPolarAngle = ${formatCameraNumber(controls.minPolarAngle)};
controls.maxPolarAngle = ${formatCameraNumber(controls.maxPolarAngle)};
controls.minDistance = ${formatCameraNumber(controls.minDistance)};
controls.maxDistance = ${formatCameraNumber(controls.maxDistance)};
controls.update();
`.trim();
}

async function exportCameraState() {
  const exportText = getCameraExportText();
  console.log(exportText);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(exportText);
      showCameraExportToast('Camera export copied');
      return;
    } catch (error) {
      // Fall through to visual fallback below.
    }
  }

  showCameraExportToast('Camera export logged to console');
}

controls.addEventListener('end', exportCameraState);

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'e') {
    exportCameraState();
  }
});

window.exportCityCamera = exportCameraState;

function getCityModelExportText() {
  const lines = ['// City Scene Model Transforms'];

  if (cityCarModel) {
    lines.push(`cityCarModel.position.set(${formatCameraNumber(cityCarModel.position.x)}, ${formatCameraNumber(cityCarModel.position.y)}, ${formatCameraNumber(cityCarModel.position.z)});`);
    lines.push(`cityCarModel.rotation.set(${formatCameraNumber(cityCarModel.rotation.x)}, ${formatCameraNumber(cityCarModel.rotation.y)}, ${formatCameraNumber(cityCarModel.rotation.z)});`);
    lines.push(`cityCarModel.scale.set(${formatCameraNumber(cityCarModel.scale.x)}, ${formatCameraNumber(cityCarModel.scale.y)}, ${formatCameraNumber(cityCarModel.scale.z)});`);
  }

  if (cityLngModel) {
    lines.push(`cityLngModel.position.set(${formatCameraNumber(cityLngModel.position.x)}, ${formatCameraNumber(cityLngModel.position.y)}, ${formatCameraNumber(cityLngModel.position.z)});`);
    lines.push(`cityLngModel.rotation.set(${formatCameraNumber(cityLngModel.rotation.x)}, ${formatCameraNumber(cityLngModel.rotation.y)}, ${formatCameraNumber(cityLngModel.rotation.z)});`);
    lines.push(`cityLngModel.scale.set(${formatCameraNumber(cityLngModel.scale.x)}, ${formatCameraNumber(cityLngModel.scale.y)}, ${formatCameraNumber(cityLngModel.scale.z)});`);
  }

  return lines.join('\n');
}

async function exportCityModelTransforms() {
  const exportText = getCityModelExportText();
  console.log(exportText);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(exportText);
      showCameraExportToast('City model export copied');
      return;
    } catch (error) {
      // Fall through to visual fallback below.
    }
  }

  showCameraExportToast('City model export logged to console');
}

window.exportCityModels = exportCityModelTransforms;

// Materials
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 });
const lightWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf8f8f8, roughness: 0.5, metalness: 0.05 });
const slightGrayMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e8, roughness: 0.7, metalness: 0.0 });
const edgeMat = new THREE.MeshStandardMaterial({ color: 0xd0d0d0, roughness: 0.8, metalness: 0.0 });
const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, metalness: 0.1, transmission: 0.3, thickness: 0.5, clearcoat: 1.0 });
const waterMat = new THREE.MeshPhysicalMaterial({ color: 0xeaf0f5, roughness: 0.05, metalness: 0.1, transmission: 0.5, thickness: 1.0 });
const subtleAccent = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.3, metalness: 0.15 });
const materialColorPresets = {
  day: {
    white: new THREE.Color(0xffffff),
    lightWhite: new THREE.Color(0xf8f8f8),
    slightGray: new THREE.Color(0xe8e8e8),
    edge: new THREE.Color(0xd0d0d0),
    glass: new THREE.Color(0xffffff),
    water: new THREE.Color(0xeaf0f5),
    accent: new THREE.Color(0xf0f4f8),
    solar: new THREE.Color(0xb9ddff),
  },
  night: {
    white: new THREE.Color(0x13233d),
    lightWhite: new THREE.Color(0x172a48),
    slightGray: new THREE.Color(0x1b2f4f),
    edge: new THREE.Color(0x10203a),
    glass: new THREE.Color(0x1b3b63),
    water: new THREE.Color(0x10243f),
    accent: new THREE.Color(0x20385a),
    solar: new THREE.Color(0x79acd6),
  },
};

const citySoftBlue = new THREE.Color(0xa8d8e8);
const citySoftBlueBright = new THREE.Color(0xd8eff6);
const citySoftGreen = new THREE.Color(0xb9dec4);
const citySoftGreenBright = new THREE.Color(0xe0f0e3);
let cityCarModel = null;
let cityLngModel = null;
const breathingVolumes = [];
const breathingBuildingTargets = [];
const breathingBuildingMaterials = [];
const sceneVisualControls = {
  backgroundColor: '#f0f0f0',
  groundColor: '#ffffff',
};
const buildingVisualControls = {
  bottomColor: '#4fc3ff',
  topColor: '#f5fbff',
  opacity: 0.62,
  emissiveIntensity: 0,
};
const sensingGreyBottomColor = new THREE.Color(0xc4ccd4);
const sensingGreyTopColor = new THREE.Color(0xf1f4f7);
const animatedBuildingBottomColor = new THREE.Color();
const animatedBuildingTopColor = new THREE.Color();
const cityCarControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 1,
};
const cityLngControls = {
  posX: 0,
  posY: 0,
  posZ: 0,
  rotX: 0,
  rotY: 0,
  rotZ: 0,
  scale: 1,
};
const sceneBackgroundTargetColor = new THREE.Color(sceneVisualControls.backgroundColor);
let groundPlaneMat = null;
let basePlatformMat = null;

function syncSceneVisuals() {
  scene.background = new THREE.Color(sceneVisualControls.backgroundColor);
  sceneBackgroundTargetColor.set(sceneVisualControls.backgroundColor);
  if (groundPlaneMat) groundPlaneMat.color.set(sceneVisualControls.groundColor);
  if (basePlatformMat) basePlatformMat.color.set(sceneVisualControls.groundColor).multiplyScalar(0.82);
}

const buildingPanel = document.createElement('div');
buildingPanel.style.cssText = `
  position: fixed;
  right: 16px;
  bottom: 74px;
  width: 208px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(170, 190, 210, 0.45);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(12px);
  font-family: "Inter", "Segoe UI", sans-serif;
  color: #607287;
  z-index: 1100;
  box-sizing: border-box;
  display: none;
`;

const panelTitle = document.createElement('div');
panelTitle.textContent = 'Building Visuals';
panelTitle.style.cssText = `
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 10px;
  color: #6b7f95;
`;
buildingPanel.appendChild(panelTitle);

function addPanelRow(labelText, input) {
  const row = document.createElement('label');
  row.style.cssText = `
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 12px;
  `;
  const label = document.createElement('span');
  label.textContent = labelText;
  label.style.color = '#687b90';
  row.appendChild(label);
  row.appendChild(input);
  buildingPanel.appendChild(row);
}

function createSectionTitle(labelText) {
  const sectionTitle = document.createElement('div');
  sectionTitle.textContent = labelText;
  sectionTitle.style.cssText = `
    margin: 14px 0 8px;
    padding-top: 10px;
    border-top: 1px solid rgba(170, 190, 210, 0.35);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #7a8ea5;
  `;
  buildingPanel.appendChild(sectionTitle);
}

function createNumberInput(value, min, max, step, onInput) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 132px;
  `;

  const input = document.createElement('input');
  input.type = 'range';
  input.value = String(value);
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.style.cssText = `
    width: 100%;
    accent-color: #88b8e8;
  `;

  const valueLabel = document.createElement('span');
  valueLabel.textContent = Number(value).toFixed(step < 0.01 ? 3 : 2);
  valueLabel.style.cssText = `
    min-width: 42px;
    text-align: right;
    color: #516274;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `;

  input.addEventListener('input', () => {
    const numericValue = Number(input.value);
    if (Number.isFinite(numericValue)) {
      valueLabel.textContent = numericValue.toFixed(step < 0.01 ? 3 : 2);
      onInput(numericValue);
    }
  });

  wrapper.appendChild(input);
  wrapper.appendChild(valueLabel);
  wrapper.rangeInput = input;
  wrapper.valueLabel = valueLabel;
  return wrapper;
}

function syncCityTransformControls() {
  if (cityCarModel) {
    cityCarControls.posX = cityCarModel.position.x;
    cityCarControls.posY = cityCarModel.position.y;
    cityCarControls.posZ = cityCarModel.position.z;
    cityCarControls.rotX = cityCarModel.rotation.x;
    cityCarControls.rotY = cityCarModel.rotation.y;
    cityCarControls.rotZ = cityCarModel.rotation.z;
    cityCarControls.scale = cityCarModel.scale.x;
  }
  if (cityLngModel) {
    cityLngControls.posX = cityLngModel.position.x;
    cityLngControls.posY = cityLngModel.position.y;
    cityLngControls.posZ = cityLngModel.position.z;
    cityLngControls.rotX = cityLngModel.rotation.x;
    cityLngControls.rotY = cityLngModel.rotation.y;
    cityLngControls.rotZ = cityLngModel.rotation.z;
    cityLngControls.scale = cityLngModel.scale.x;
  }
}

function addTransformSection(title, controlsState, getModel) {
  createSectionTitle(title);
  const rows = [
    ['Position X', 'posX', -50, 50, 0.01, (model, value) => { model.position.x = value; }],
    ['Position Y', 'posY', -20, 20, 0.01, (model, value) => { model.position.y = value; }],
    ['Position Z', 'posZ', -50, 50, 0.01, (model, value) => { model.position.z = value; }],
    ['Rotation X', 'rotX', -Math.PI * 2, Math.PI * 2, 0.01, (model, value) => { model.rotation.x = value; }],
    ['Rotation Y', 'rotY', -Math.PI * 2, Math.PI * 2, 0.01, (model, value) => { model.rotation.y = value; }],
    ['Rotation Z', 'rotZ', -Math.PI * 2, Math.PI * 2, 0.01, (model, value) => { model.rotation.z = value; }],
    ['Uniform Scale', 'scale', 0.01, 10, 0.001, (model, value) => { model.scale.setScalar(value); }],
  ];

  rows.forEach(([label, key, min, max, step, applyValue]) => {
    const input = createNumberInput(controlsState[key], min, max, step, (value) => {
      controlsState[key] = value;
      const model = getModel();
      if (!model) {
        return;
      }
      applyValue(model, value);
    });
    addPanelRow(label, input);
    Object.defineProperty(controlsState, `${key}Input`, {
      value: input,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  });
}

const backgroundColorInput = document.createElement('input');
backgroundColorInput.type = 'color';
backgroundColorInput.value = sceneVisualControls.backgroundColor;
backgroundColorInput.style.cssText = 'width:48px;height:28px;border:none;background:transparent;padding:0;';
backgroundColorInput.addEventListener('input', () => {
  sceneVisualControls.backgroundColor = backgroundColorInput.value;
  syncSceneVisuals();
});
addPanelRow('Background', backgroundColorInput);

const groundColorInput = document.createElement('input');
groundColorInput.type = 'color';
groundColorInput.value = sceneVisualControls.groundColor;
groundColorInput.style.cssText = 'width:48px;height:28px;border:none;background:transparent;padding:0;';
groundColorInput.addEventListener('input', () => {
  sceneVisualControls.groundColor = groundColorInput.value;
  syncSceneVisuals();
});
addPanelRow('Ground', groundColorInput);

const bottomColorInput = document.createElement('input');
bottomColorInput.type = 'color';
bottomColorInput.value = buildingVisualControls.bottomColor;
bottomColorInput.style.cssText = 'width:48px;height:28px;border:none;background:transparent;padding:0;';
bottomColorInput.addEventListener('input', () => {
  buildingVisualControls.bottomColor = bottomColorInput.value;
  syncBuildingVisuals();
});
addPanelRow('Bottom Color', bottomColorInput);

const topColorInput = document.createElement('input');
topColorInput.type = 'color';
topColorInput.value = buildingVisualControls.topColor;
topColorInput.style.cssText = 'width:48px;height:28px;border:none;background:transparent;padding:0;';
topColorInput.addEventListener('input', () => {
  buildingVisualControls.topColor = topColorInput.value;
  syncBuildingVisuals();
});
addPanelRow('Top Color', topColorInput);

const opacityInput = document.createElement('input');
opacityInput.type = 'range';
opacityInput.min = '0.2';
opacityInput.max = '1';
opacityInput.step = '0.01';
opacityInput.value = String(buildingVisualControls.opacity);
opacityInput.style.width = '112px';
opacityInput.disabled = true;
opacityInput.title = 'Buildings are locked solid';
opacityInput.addEventListener('input', () => {
  buildingVisualControls.opacity = Number(opacityInput.value);
  syncBuildingVisuals();
});
addPanelRow('Opacity', opacityInput);

const emissiveInput = document.createElement('input');
emissiveInput.type = 'range';
emissiveInput.min = '0';
emissiveInput.max = '3';
emissiveInput.step = '0.01';
emissiveInput.value = String(buildingVisualControls.emissiveIntensity);
emissiveInput.style.width = '112px';
emissiveInput.addEventListener('input', () => {
  buildingVisualControls.emissiveIntensity = Number(emissiveInput.value);
  syncBuildingVisuals();
});
addPanelRow('Emissive', emissiveInput);

addTransformSection('City Car', cityCarControls, () => cityCarModel);
addTransformSection('City LNG', cityLngControls, () => cityLngModel);

const exportCityModelsButton = document.createElement('button');
exportCityModelsButton.type = 'button';
exportCityModelsButton.textContent = 'Export City Models';
exportCityModelsButton.style.cssText = `
  width: 100%;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(170, 190, 210, 0.45);
  background: rgba(245, 249, 255, 0.92);
  color: #5f7287;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  cursor: pointer;
`;
exportCityModelsButton.addEventListener('click', () => {
  exportCityModelTransforms();
});
buildingPanel.appendChild(exportCityModelsButton);

root.appendChild(buildingPanel);
refreshCityTransformPanel();

buildingVisualControls.opacity = 1;
opacityInput.value = '1';

function syncBuildingVisuals() {
  const bottomColor = new THREE.Color(buildingVisualControls.bottomColor);
  const topColor = new THREE.Color(buildingVisualControls.topColor);
  breathingBuildingMaterials.forEach((material) => {
    material.color.copy(bottomColor);
    material.transparent = false;
    material.opacity = 1.0;
    material.depthWrite = true;
    material.side = THREE.FrontSide;
    material.emissiveIntensity = buildingVisualControls.emissiveIntensity;
    if (material.userData.shader?.uniforms) {
      material.userData.shader.uniforms.uBottomColor.value.copy(bottomColor);
      material.userData.shader.uniforms.uTopColor.value.copy(topColor);
      material.userData.shader.uniforms.uMaterialOpacity.value = 1.0;
    }
  });
}

function updateBuildingStageColors(elapsed) {
  const blueBottom = new THREE.Color(buildingVisualControls.bottomColor);
  const blueTop = new THREE.Color(buildingVisualControls.topColor);
  const interpretingProgress = stageVisualState.interpretingProgress ?? 0;
  const sensingPulse = 0.5 + 0.5 * Math.sin(elapsed * 0.72);
  const sensingGreyMix = (1 - interpretingProgress) * sensingPulse;

  animatedBuildingBottomColor.copy(blueBottom).lerp(sensingGreyBottomColor, sensingGreyMix);
  animatedBuildingTopColor.copy(blueTop).lerp(sensingGreyTopColor, sensingGreyMix * 0.92);

  breathingBuildingMaterials.forEach((material) => {
    material.color.copy(animatedBuildingBottomColor);
    if (material.userData.shader?.uniforms) {
      material.userData.shader.uniforms.uBottomColor.value.copy(animatedBuildingBottomColor);
      material.userData.shader.uniforms.uTopColor.value.copy(animatedBuildingTopColor);
    }
  });
}

function refreshCityTransformPanel() {
  syncCityTransformControls();
  [cityCarControls, cityLngControls].forEach((controlsState) => {
    ['posX', 'posY', 'posZ', 'rotX', 'rotY', 'rotZ', 'scale'].forEach((key) => {
      const input = controlsState[`${key}Input`];
      if (input?.rangeInput) {
        const numericValue = Number(controlsState[key].toFixed ? controlsState[key].toFixed(3) : controlsState[key]);
        input.rangeInput.value = String(numericValue);
        input.valueLabel.textContent = numericValue.toFixed(3);
      }
    });
  });
}

function updateEpilogueScene(elapsed) {
  ensureEpilogueConnections();
  const breakdown = stageVisualState.breakdown ?? 0;
  const detach = stageVisualState.detach ?? 0;
  const flatten = stageVisualState.flatten ?? 0;
  const dataField = stageVisualState.dataField ?? 0;
  const epiloguePresence = Math.max(breakdown, detach, flatten, dataField);
  const dissolve = smoothstepJS(0.0, 1.0, breakdown);
  const fragmentFlow = smoothstepJS(0.0, 1.0, detach);
  const fieldFormation = smoothstepJS(0.0, 1.0, flatten);
  epilogueLayer.visible = epiloguePresence > 0.001;

  epilogueUnits.forEach((unit, index) => {
    const baseRotation = unit.userData.epilogueBaseRotation;
    const baseScale = unit.userData.epilogueBaseScale;
    const gridPosition = unit.userData.epilogueGridPosition;
    const baseWorldPosition = unit.userData.epilogueBaseWorldPosition;
    if (!gridPosition) {
      return;
    }

    const sourceWorld = baseWorldPosition?.clone() ?? unit.getWorldPosition(new THREE.Vector3());
    const flowVector = new THREE.Vector3(
      Math.sin(index * 0.83 + 0.7),
      0.22 + Math.sin(index * 0.41) * 0.08,
      Math.cos(index * 0.67 + 1.1)
    ).normalize();
    const emergenceDelay = (Math.sin(index * 12.73) * 0.5 + 0.5) * 0.42;
    const emergence = smoothstepJS(emergenceDelay, Math.min(1, emergenceDelay + 0.28), dataField);
    const distributedDrift = flowVector.multiplyScalar(fragmentFlow * (0.28 + (index % 7) * 0.035));
    const fieldNoise = new THREE.Vector3(
      Math.sin(elapsed * 0.34 + index * 0.41) * 0.22,
      Math.sin(elapsed * 0.28 + index * 0.19) * 0.08,
      Math.cos(elapsed * 0.31 + index * 0.33) * 0.18
    );
    const particleNoise = new THREE.Vector3(
      Math.sin(elapsed * 0.82 + index * 0.73) * 0.36,
      Math.cos(elapsed * 0.64 + index * 0.29) * 0.12,
      Math.cos(elapsed * 0.77 + index * 0.61) * 0.34
    );
    const fragmentTarget = sourceWorld.clone()
      .add(distributedDrift)
      .add(fieldNoise.clone().multiplyScalar(0.35 + dissolve * 0.45));
    const fieldTarget = gridPosition.clone().add(new THREE.Vector3(
      Math.sin(elapsed * 0.24 + index * 0.12) * 0.20 * dataField,
      Math.sin(elapsed * 0.29 + index * 0.07) * 0.06 * dataField,
      Math.cos(elapsed * 0.22 + index * 0.15) * 0.18 * dataField
    )).add(particleNoise.multiplyScalar(0.55 * emergence));
    const targetPosition = fragmentTarget.clone()
      .lerp(fieldTarget, fieldFormation);

    unit.position.copy(targetPosition);
    unit.rotation.copy(baseRotation);

    const fragmentScale = THREE.MathUtils.lerp(1.0, 0.24 + (index % 4) * 0.035, dissolve);
    const fieldPulse = 1 + Math.sin(elapsed * 0.55 + index * 0.31) * 0.035 * dataField;
    unit.scale.copy(baseScale).multiplyScalar(
      THREE.MathUtils.lerp(fragmentScale, (0.12 + emergence * 0.10) * fieldPulse, fieldFormation)
    );

    if (unit.material) {
      unit.material.transparent = true;
      unit.material.opacity =
        THREE.MathUtils.lerp(0.0, 0.92, epiloguePresence) *
        THREE.MathUtils.lerp(0.7, 0.94 + Math.sin(elapsed * 0.46 + index * 0.27) * 0.04, dataField) *
        THREE.MathUtils.lerp(0.2, 1.0, emergence);
      unit.material.depthWrite = false;
      if ('emissiveIntensity' in unit.material) {
        unit.material.emissiveIntensity = (0.06 + dissolve * 0.18 + dataField * 0.22) * emergence;
      }
    }
    unit.visible = epiloguePresence > 0.01 && emergence > 0.02;
  });

  if (epilogueConnectionLines) {
    const positions = epilogueConnectionLines.geometry.attributes.position.array;
    const pairs = epilogueConnectionLines.userData.pairs ?? [];
    pairs.forEach(([a, b], pairIndex) => {
      const start = epilogueUnits[a]?.position;
      const end = epilogueUnits[b]?.position;
      if (!start || !end) return;
      const growth = fieldFormation * dataField * (0.52 + 0.10 * Math.sin(elapsed * 0.32 + pairIndex * 0.2));
      positions[pairIndex * 6 + 0] = start.x;
      positions[pairIndex * 6 + 1] = start.y;
      positions[pairIndex * 6 + 2] = start.z;
      positions[pairIndex * 6 + 3] = THREE.MathUtils.lerp(start.x, end.x, growth);
      positions[pairIndex * 6 + 4] = THREE.MathUtils.lerp(start.y, end.y, growth);
      positions[pairIndex * 6 + 5] = THREE.MathUtils.lerp(start.z, end.z, growth);
    });
    epilogueConnectionLines.geometry.attributes.position.needsUpdate = true;
    epilogueConnectionLines.material.opacity = (0.01 + dataField * 0.04) * epiloguePresence;
    epilogueConnectionLines.visible = epiloguePresence > 0.01 && dataField > 0.2;
  }
}

function createBreathingBuildingMaterial(baseColor = 0xf5f5f5) {
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(buildingVisualControls.bottomColor),
    roughness: 0.2,
    metalness: 0.1,
    transparent: false,
    opacity: 1.0,
    depthWrite: true,
    side: THREE.FrontSide,
    emissive: new THREE.Color(0x66ccff),
    emissiveIntensity: buildingVisualControls.emissiveIntensity,
    fog: false,
  });
  breathingBuildingMaterials.push(material);

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
      vWorldPos = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vViewDir = normalize(cameraPosition - worldPosition.xyz);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;
      varying vec3 vViewDir;
      uniform float uTime;
      uniform vec3 uBottomColor;
      uniform vec3 uTopColor;
      uniform float uMaterialOpacity;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }`
    );

    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uBottomColor = { value: new THREE.Color(buildingVisualControls.bottomColor) };
    shader.uniforms.uTopColor = { value: new THREE.Color(buildingVisualControls.topColor) };
    shader.uniforms.uMaterialOpacity = { value: buildingVisualControls.opacity };
    material.userData.shader = shader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <output_fragment>',
      `
      float h = vWorldPos.y;
      float gradient = smoothstep(0.0, 10.0, h);
      vec2 noiseUv = vWorldPos.xz * 0.22 + vec2(uTime * 0.035, -uTime * 0.02);
      float noiseField = noise(noiseUv);
      float softVariation = (noiseField - 0.5) * 0.16;
      vec3 bottomColor = uBottomColor;
      vec3 topColor = uTopColor;
      vec3 gradientColor = mix(bottomColor, topColor, gradient);
      gradientColor *= 1.02 + softVariation;
      gradientColor = mix(gradientColor, vec3(1.0), smoothstep(0.72, 1.0, gradient + softVariation * 0.45) * 0.12);
      vec3 litColor = outgoingLight;
      float fresnel = pow(1.0 - dot(normalize(vWorldNormal), normalize(vViewDir)), 2.0);
      float facing = dot(normalize(vWorldNormal), vec3(0.0, 1.0, 0.0));
      vec3 finalColor = mix(litColor, gradientColor, 0.72);
      finalColor += vec3(fresnel * 0.16);
      finalColor += gradientColor * 0.16;
      finalColor *= (0.92 + 0.08 * facing);
      totalEmissiveRadiance += gradientColor * 0.72;
      outgoingLight = finalColor;
      diffuseColor.a = uMaterialOpacity;
      #include <output_fragment>`
    );
  };

  material.customProgramCacheKey = () => `breathing-building-${baseColor}`;
  return material;
}

// ---- SOLAR PANEL TEXTURE GENERATION ----
function createSolarCellTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eef8ff';
  ctx.fillRect(0, 0, size, size);
  const cells = 8;
  const cellW = size / cells;
  const cellH = size / cells;
  const gap = Math.max(1.5, size / 180);
  for (let row = 0; row < cells; row++) {
    for (let col = 0; col < cells; col++) {
      const x = col * cellW + gap;
      const y = row * cellH + gap;
      const w = cellW - gap * 2;
      const h = cellH - gap * 2;
      const seed = (row * 13 + col * 7) % 20;
      const r = 174 + seed * 1.4;
      const g = 214 + seed * 0.7;
      const b = 255;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(236, 245, 255, 0.38)';
      ctx.lineWidth = 0.5;
      const lineCount = 12;
      for (let i = 1; i < lineCount; i++) {
        const ly = y + (h / lineCount) * i;
        ctx.beginPath();
        ctx.moveTo(x, ly);
        ctx.lineTo(x + w, ly);
        ctx.stroke();
      }
    }
  }
  ctx.strokeStyle = 'rgba(176, 223, 255, 0.90)';
  ctx.lineWidth = Math.max(1.5, size / 140);
  for (let col = 0; col <= cells; col++) {
    const bx = col * cellW;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx, size);
    ctx.stroke();
  }
  for (let row = 0; row <= cells; row++) {
    const by = row * cellH;
    ctx.beginPath();
    ctx.moveTo(0, by);
    ctx.lineTo(size, by);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(233, 246, 255, 0.98)';
  ctx.lineWidth = Math.max(2, size / 100);
  ctx.strokeRect(1, 1, size - 2, size - 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createSolarEmissiveTexture(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  const cells = 8;
  const cellW = size / cells;
  const cellH = size / cells;
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = 'rgba(156, 214, 255, 0.09)';
  ctx.lineWidth = Math.max(6, size / 40);
  for (let col = 0; col <= cells; col++) {
    ctx.beginPath();
    ctx.moveTo(col * cellW, 0);
    ctx.lineTo(col * cellW, size);
    ctx.stroke();
  }
  for (let row = 0; row <= cells; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * cellH);
    ctx.lineTo(size, row * cellH);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(150, 212, 255, 0.52)';
  ctx.lineWidth = Math.max(1.5, size / 150);
  for (let col = 0; col <= cells; col++) {
    ctx.beginPath();
    ctx.moveTo(col * cellW, 0);
    ctx.lineTo(col * cellW, size);
    ctx.stroke();
  }
  for (let row = 0; row <= cells; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * cellH);
    ctx.lineTo(size, row * cellH);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(204, 232, 255, 0.72)';
  ctx.lineWidth = Math.max(2.5, size / 80);
  ctx.strokeRect(1, 1, size - 2, size - 2);
  ctx.globalCompositeOperation = 'source-over';
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

// Create shared textures
const solarColorTex = createSolarCellTexture(512);
const solarEmissiveTex = createSolarEmissiveTexture(512);
const roofColorTex = createSolarCellTexture(256);
const roofEmissiveTex = createSolarEmissiveTexture(256);

const solarPanelMat = new THREE.MeshPhysicalMaterial({
  map: roofColorTex,
  emissiveMap: roofEmissiveTex,
  emissive: new THREE.Color(0.72, 1.08, 1.55),
  emissiveIntensity: 0.96,
  color: 0x8fdfff,
  roughness: 0.46,
  metalness: 0.08,
  transmission: 0.0,
  thickness: 0.0,
  transparent: false,
  opacity: 1,
  clearcoat: 0.10,
  clearcoatRoughness: 0.55,
  envMapIntensity: 0.10,
});

const roofPanelMat = new THREE.MeshPhysicalMaterial({
  map: roofColorTex,
  emissiveMap: roofEmissiveTex,
  emissive: new THREE.Color(0.62, 0.95, 1.35),
  emissiveIntensity: 0.88,
  color: 0xb9ddff,
  roughness: 0.06,
  metalness: 0.42,
  transmission: 0.08,
  thickness: 0.3,
  transparent: false,
  opacity: 1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  envMapIntensity: 1.2,
});

const allSolarPanelMeshes = [];
const allRoofPanelMeshes = [];
const allSolarFrameMeshes = [];
const allRoofFrameMeshes = [];
const allRoofGlowMeshes = [];

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.24);
ambientLight.name = 'ambientLight';
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.62);
dirLight.name = 'dirLight';
dirLight.position.set(20, 35, 15);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -30;
dirLight.shadow.camera.right = 30;
dirLight.shadow.camera.top = 30;
dirLight.shadow.camera.bottom = -30;
dirLight.shadow.bias = -0.001;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0xf0f0ff, 0.0);
fillLight.name = 'fillLight';
fillLight.position.set(-15, 10, -10);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.0);
rimLight.name = 'rimLight';
rimLight.position.set(-5, 15, 25);
scene.add(rimLight);

const buildingSpotlights = [];

function createBuildingSpotlight(x, y, z, targetX, targetY, targetZ, intensity = 0.55) {
  const light = new THREE.SpotLight(0xcfe2ff, intensity, 45, Math.PI / 5.5, 0.45, 1.2);
  light.position.set(x, y, z);
  light.castShadow = false;
  const target = new THREE.Object3D();
  target.position.set(targetX, targetY, targetZ);
  scene.add(target);
  light.target = target;
  light.userData.baseIntensity = intensity;
  scene.add(light);
  buildingSpotlights.push(light);
}

createBuildingSpotlight(-6, 9, -10, -1, 1.5, -4, 0.0);
createBuildingSpotlight(10, 11, -8, 6, 2.5, -1, 0.0);
createBuildingSpotlight(15, 10, 7, 10, 2.0, 5, 0.0);
createBuildingSpotlight(0, 12, 15, 5, 2.0, 10, 0.0);

const moduleLabels = [];
const epilogueArchitectureTargets = [];
const epilogueUnits = [];
let epilogueConnectionLines = null;

function computeEpilogueFieldPosition(index) {
  const angle = index * 2.399963229728653;
  const radius = 1.2 + (index % 11) * 0.42 + Math.floor(index / 11) * 0.18;
  const x = Math.cos(angle) * radius + Math.sin(index * 1.73) * 0.34;
  const z = Math.sin(angle) * radius * 0.78 + Math.cos(index * 1.21) * 0.26;
  const offsetY = ((index % 5) - 2) * 0.08;
  return new THREE.Vector3(
    x,
    2.25 + offsetY,
    z
  );
}

function ensureEpilogueConnections() {
  if (epilogueConnectionLines || epilogueUnits.length < 2) return;

  const pairSet = new Set();
  const positions = epilogueUnits.map((unit) => unit.userData.epilogueGridPosition.clone());
  positions.forEach((pos, index) => {
    const distances = positions
      .map((other, otherIndex) => ({
        otherIndex,
        distance: otherIndex === index ? Infinity : pos.distanceTo(other),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2);

    distances.forEach(({ otherIndex, distance }) => {
      if (distance > 2.4) return;
      const a = Math.min(index, otherIndex);
      const b = Math.max(index, otherIndex);
      pairSet.add(`${a}:${b}`);
    });
  });

  const pairList = Array.from(pairSet).map((key) => key.split(':').map(Number));
  const linePositions = new Float32Array(pairList.length * 2 * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  const material = new THREE.LineBasicMaterial({
    color: 0xcff6ff,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  epilogueConnectionLines = new THREE.LineSegments(geometry, material);
  epilogueConnectionLines.name = 'epilogueConnections';
  epilogueConnectionLines.userData.pairs = pairList;
  epilogueConnectionLines.visible = false;
  epilogueLayer.add(epilogueConnectionLines);
}

function initializeBreathingProfile(group) {
  const phase = Math.random() * Math.PI * 2;
  const amplitude = THREE.MathUtils.randFloat(0.3, 0.8);
  const frequency = THREE.MathUtils.randFloat(0.5, 1.2);
  group.userData.baseY = group.position.y;
  group.userData.baseScale = group.scale.clone();
  group.userData.breathPhase = phase;
  group.userData.amplitude = amplitude;
  group.userData.frequency = frequency;
  group.userData.currentAmplitude = amplitude;
  group.userData.currentFrequency = frequency;
  group.userData.motionState = 'SENSING';
}

function addModuleLabel(parent, text, position) {
  const el = document.createElement('div');
  el.className = 'module-label';
  el.textContent = text;

  const label = new CSS2DObject(el);
  label.position.copy(position);
  label.center.set(0.5, 1);
  label.userData.baseY = position.y;
  label.userData.floatOffset = Math.random() * Math.PI * 2;
  parent.add(label);
  moduleLabels.push(label);
  return label;
}

function registerEpilogueArchitecture(object3D) {
  epilogueArchitectureTargets.push(object3D);
  return object3D;
}

function registerEpilogueUnit(mesh) {
  if (!mesh?.userData?.isEpilogueCap) {
    return null;
  }
  const index = epilogueUnits.length;
  mesh.updateWorldMatrix(true, false);

  const epilogueMesh = new THREE.Mesh(
    mesh.geometry,
    mesh.material?.clone ? mesh.material.clone() : mesh.material
  );
  epilogueMesh.name = `${mesh.name || 'epilogueUnit'}_epilogue`;
  epilogueMesh.castShadow = false;
  epilogueMesh.receiveShadow = false;
  epilogueMesh.visible = false;
  epilogueMesh.userData.epilogueUnit = true;
  epilogueMesh.userData.epilogueBasePosition = mesh.position.clone();
  epilogueMesh.userData.epilogueBaseRotation = new THREE.Euler().setFromQuaternion(
    mesh.getWorldQuaternion(new THREE.Quaternion()),
    'XYZ'
  );
  epilogueMesh.userData.epilogueBaseScale = mesh.getWorldScale(new THREE.Vector3());
  epilogueMesh.userData.epilogueBaseWorldPosition = mesh.getWorldPosition(new THREE.Vector3());
  epilogueMesh.userData.epilogueGridPosition = computeEpilogueFieldPosition(index);
  epilogueMesh.position.copy(epilogueMesh.userData.epilogueBaseWorldPosition);
  epilogueMesh.rotation.copy(epilogueMesh.userData.epilogueBaseRotation);
  epilogueMesh.scale.copy(epilogueMesh.userData.epilogueBaseScale);
  if (epilogueMesh.material) {
    epilogueMesh.material.transparent = true;
    epilogueMesh.material.opacity = 0;
    epilogueMesh.material.depthWrite = false;
    if ('emissive' in epilogueMesh.material) {
      epilogueMesh.material.emissive = new THREE.Color(0xaeebff);
      epilogueMesh.material.emissiveIntensity = 0;
    }
  }
  epilogueLayer.add(epilogueMesh);
  epilogueUnits.push(epilogueMesh);
  return epilogueMesh;
}

function setObjectFade(object3D, alpha) {
  const clampedAlpha = THREE.MathUtils.clamp(alpha, 0, 1);
  object3D.traverse((child) => {
    if (!child.isMesh || !child.material || child.userData.epilogueUnit) {
      return;
    }
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.forEach((material) => {
      if (material.userData._baseTransparent === undefined) {
        material.userData._baseTransparent = material.transparent;
        material.userData._baseOpacity = material.opacity ?? 1;
      }
      material.transparent = clampedAlpha < 0.999 ? true : material.userData._baseTransparent;
      material.opacity = (material.userData._baseOpacity ?? 1) * clampedAlpha;
      material.depthWrite = clampedAlpha > 0.2;
    });
  });
}

function updateModuleLabelStyles(mode) {
  moduleLabels.forEach((label) => {
    label.element.classList.toggle('day', mode === 'day');
    label.element.classList.toggle('night', mode === 'night');
  });
}

// ======== CITY GROUP ========
const cityGroup = new THREE.Group();
cityGroup.name = 'cityGroup';
cityGroup.rotation.y = Math.PI;
scene.add(cityGroup);

// ---- BASE PLATFORM ----
const baseGeo = new THREE.BoxGeometry(40, 1.2, 40);
basePlatformMat = new THREE.MeshStandardMaterial({ color: 0xd1d1d1, roughness: 0.8, metalness: 0.0 });
const baseMesh = new THREE.Mesh(baseGeo, basePlatformMat);
baseMesh.name = 'basePlatform';
baseMesh.position.y = -0.6;
baseMesh.rotation.z = Math.PI;
baseMesh.receiveShadow = true;
cityGroup.add(baseMesh);
registerEpilogueArchitecture(baseMesh);

const surfaceGeo = new THREE.BoxGeometry(39.5, 0.15, 39.5);
groundPlaneMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.0 });
const surfaceMesh = new THREE.Mesh(surfaceGeo, groundPlaneMat);
surfaceMesh.name = 'topSurface';
surfaceMesh.position.y = 0.075;
surfaceMesh.rotation.z = Math.PI;
surfaceMesh.receiveShadow = true;
cityGroup.add(surfaceMesh);
registerEpilogueArchitecture(surfaceMesh);
syncSceneVisuals();

// ---- WATER AREA ----
const waterGeo = new THREE.BoxGeometry(12, 0.12, 20);
const waterMesh = new THREE.Mesh(waterGeo, waterMat);
waterMesh.name = 'waterArea';
waterMesh.position.set(-14, 0.16, -4);
waterMesh.receiveShadow = true;
cityGroup.add(waterMesh);
registerEpilogueArchitecture(waterMesh);

const coastGeo = new THREE.BoxGeometry(0.15, 0.3, 20);
const coastMesh = new THREE.Mesh(coastGeo, slightGrayMat);
coastMesh.name = 'coastline';
coastMesh.position.set(-8, 0.15, -4);
cityGroup.add(coastMesh);
registerEpilogueArchitecture(coastMesh);

// ---- WIND TURBINES ----
function createWindTurbine(x, y, z, scale = 1) {
  const group = new THREE.Group();
  const towerGeo = new THREE.CylinderGeometry(0.06 * scale, 0.12 * scale, 4 * scale, 8);
  const tower = new THREE.Mesh(towerGeo, whiteMat);
  tower.position.y = 2 * scale;
  tower.castShadow = true;
  group.add(tower);
  const nacelleGeo = new THREE.BoxGeometry(0.35 * scale, 0.2 * scale, 0.15 * scale);
  const nacelle = new THREE.Mesh(nacelleGeo, lightWhiteMat);
  nacelle.position.y = 4.05 * scale;
  nacelle.castShadow = true;
  group.add(nacelle);
  const bladesGroup = new THREE.Group();
  bladesGroup.position.y = 4.05 * scale;
  bladesGroup.position.x = 0.18 * scale;
  for (let i = 0; i < 3; i++) {
    const bladeGeo = new THREE.BoxGeometry(0.06 * scale, 1.8 * scale, 0.02 * scale);
    const blade = new THREE.Mesh(bladeGeo, lightWhiteMat);
    blade.position.y = 0.9 * scale;
    blade.castShadow = true;
    const pivot = new THREE.Group();
    pivot.add(blade);
    pivot.rotation.z = (Math.PI * 2 / 3) * i;
    bladesGroup.add(pivot);
  }
  group.add(bladesGroup);
  group.userData.blades = bladesGroup;
  group.position.set(x, y, z);
  return group;
}

const turbines = [];
const turbinePositions = [
  [-16, 0.15, -11], [-18, 0.15, -7], [-15, 0.15, -3],
  [-18, 0.15, 1], [-16, 0.15, 5]
];
turbinePositions.forEach((pos, i) => {
  const t = createWindTurbine(pos[0], pos[1], pos[2], 0.7);
  t.name = `windTurbine_${i}`;
  cityGroup.add(t);
  registerEpilogueArchitecture(t);
  turbines.push(t);
});
const windFarmAnchor = new THREE.Group();
windFarmAnchor.position.set(-16.8, 3.8, -3.2);
cityGroup.add(windFarmAnchor);
addModuleLabel(windFarmAnchor, 'Offshore\nWind Farm', new THREE.Vector3(0, 0, 0));

// ---- SOLAR PANEL FIELD ----
function createSolarPanel(x, z) {
  const group = new THREE.Group();
  const panelGeo = new THREE.BoxGeometry(0.9, 0.04, 0.5);
  const panel = new THREE.Mesh(panelGeo, solarPanelMat.clone());
  panel.name = `solarFieldPanel_${allSolarPanelMeshes.length}`;
  panel.rotation.x = -0.3;
  panel.position.y = 0.35;
  panel.castShadow = true;
  panel.receiveShadow = true;
  panel.userData.editableKind = 'pv-panel';
  allSolarPanelMeshes.push(panel);
  const frameGeo = new THREE.BoxGeometry(0.94, 0.005, 0.54);
  const frameMat = new THREE.MeshBasicMaterial({
    color: 0x8fdfff, transparent: true, opacity: 0.16,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.rotation.x = -0.3;
  frame.position.y = 0.36;
  frame.userData.nonEditable = true;
  group.add(frame);
  allSolarFrameMeshes.push(frame);
  group.add(panel);
  const supportGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4);
  const support = new THREE.Mesh(supportGeo, slightGrayMat);
  support.position.y = 0.15;
  support.userData.nonEditable = true;
  group.add(support);
  group.position.set(x, 0.15, z);
  return group;
}

const solarParent = new THREE.Group();
solarParent.name = 'solarField';
for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 6; col++) {
    const panel = createSolarPanel(col * 1.1 - 3, row * 0.7 - 2.5);
    panel.name = `solarPanel_${row}_${col}`;
    solarParent.add(panel);
  }
}
solarParent.position.set(-3, 0, -14);
cityGroup.add(solarParent);
registerEpilogueArchitecture(solarParent);
addModuleLabel(solarParent, 'Photovoltaic\nPower Station', new THREE.Vector3(0, 1.9, 0));

// ---- CITY BUILDINGS ----
function createBuilding(x, z, w, d, h, material) {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(w, h, d);
  const body = new THREE.Mesh(bodyGeo, createBreathingBuildingMaterial(0xf5f5f5));
  body.position.y = h / 2;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);
  const capGeo = new THREE.BoxGeometry(w + 0.05, 0.08, d + 0.05);
  const cap = new THREE.Mesh(capGeo, createBreathingBuildingMaterial(0xf3f3f3));
  cap.position.y = h;
  cap.userData.isEpilogueCap = true;
  group.add(cap);
  const lineCount = Math.floor(h / 0.8);
  for (let i = 1; i <= lineCount; i++) {
    const lineGeo = new THREE.BoxGeometry(w + 0.02, 0.02, d + 0.02);
    const line = new THREE.Mesh(lineGeo, createBreathingBuildingMaterial(0xf3f3f3));
    line.position.y = i * (h / (lineCount + 1));
    group.add(line);
  }
  group.position.set(x, 0.15, z);
  group.userData.buildingHeight = h;
  group.userData.footprint = { x, z, w, d };
  group.userData.epilogueCap = cap;
  initializeBreathingProfile(group);
  breathingBuildingTargets.push(group);
  return group;
}

const buildings = [
  createBuilding(3, -2, 1.8, 1.8, 8, glassMat),
  createBuilding(5.5, -1, 1.5, 1.5, 10, whiteMat),
  createBuilding(4, 1, 2, 1.2, 6.5, lightWhiteMat),
  createBuilding(7, -2.5, 1.2, 1.2, 7, glassMat),
  createBuilding(6, 1.5, 1.6, 1.6, 9, whiteMat),
  createBuilding(8.5, 0, 1.3, 1.3, 5.5, lightWhiteMat),
  createBuilding(2, 1, 1.4, 1.4, 4, whiteMat),
  createBuilding(3.5, 3, 1.8, 1, 3.5, slightGrayMat),
  createBuilding(10, -4, 2, 2, 6, whiteMat),
  createBuilding(12, -2, 1.5, 1.2, 4.5, lightWhiteMat),
  createBuilding(10.5, -1, 1, 1, 3, glassMat),
  createBuilding(13, -4.5, 1.8, 1.5, 5, whiteMat),
  createBuilding(12, 4, 3, 2, 2, slightGrayMat),
  createBuilding(15, 3, 2.5, 2.5, 2.5, whiteMat),
  createBuilding(14, 7, 3.5, 2, 1.8, slightGrayMat),
  createBuilding(11, 7, 2, 3, 2.2, lightWhiteMat),
  createBuilding(16, 6, 2, 2, 1.5, whiteMat),
  createBuilding(-2, 4, 1.2, 1.2, 2.5, whiteMat),
  createBuilding(0, 6, 1.5, 1, 2, lightWhiteMat),
  createBuilding(2, 5, 1, 1.5, 3, whiteMat),
  createBuilding(-1, 8, 2, 1.5, 1.8, slightGrayMat),
  createBuilding(4, 7, 1.8, 1.8, 2.5, whiteMat),
  createBuilding(7, 6, 1.2, 1.2, 3.5, glassMat),
  createBuilding(8, 9, 2.5, 2, 2, lightWhiteMat),
  createBuilding(-5, 3, 1.5, 1.5, 3.5, whiteMat),
  createBuilding(-3, 5, 1, 1, 2.5, lightWhiteMat),
  createBuilding(-6, 6, 2, 1.2, 2, whiteMat),
  createBuilding(-4, 8, 1.8, 1.5, 1.5, slightGrayMat),
];

buildings.forEach((b, i) => {
  b.name = `building_${i}`;
  cityGroup.add(b);
  registerEpilogueArchitecture(b);
  if (b.userData.epilogueCap) {
    registerEpilogueUnit(b.userData.epilogueCap);
  }
});
const buildingsAnchor = new THREE.Group();
buildingsAnchor.position.set(6.5, 7.0, -0.8);
cityGroup.add(buildingsAnchor);
addModuleLabel(buildingsAnchor, 'Commercial\nBuildings', new THREE.Vector3(0, 0, 0));

function hash2D(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function overlapsReservedZone(x, z, w, d, reservedZones) {
  return reservedZones.some((zone) => (
    Math.abs(x - zone.x) < (w + zone.w) * 0.5 &&
    Math.abs(z - zone.z) < (d + zone.d) * 0.5
  ));
}

function createLowRiseBuilding(x, z, w, d, h) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    createBreathingBuildingMaterial(0xeaf6ff)
  );
  body.position.y = h * 0.5;
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  const cap = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.04, 0.05, d + 0.04),
    createBreathingBuildingMaterial(0xf4fbff)
  );
  cap.position.y = h + 0.025;
  cap.userData.isEpilogueCap = true;
  group.add(cap);

  group.position.set(x, 0.15, z);
  group.userData.buildingHeight = h;
  group.userData.footprint = { x, z, w, d };
  group.userData.epilogueCap = cap;
  initializeBreathingProfile(group);
  breathingBuildingTargets.push(group);
  return group;
}

const lowRiseReservedZones = [
  ...buildings.map((b) => b.userData.footprint).filter(Boolean),
  { x: -14, z: -4, w: 12.8, d: 20.8 },   // water
  { x: -3, z: -14, w: 9.5, d: 7.8 },     // solar field
  { x: 4, z: -14, w: 8.0, d: 6.0 },      // house zone
  { x: 5, z: -1, w: 3.4, d: 3.4 },       // tower zone
  { x: 5, z: 14, w: 4.2, d: 3.4 },       // data center zone
  { x: 8, z: -3, w: 4.0, d: 4.0 },       // vpp dome
  { x: -9.3, z: 5.2, w: 4.8, d: 4.2 },   // lng tanks
  { x: 16.5, z: 8.0, w: 3.4, d: 4.4 },   // chimneys
  { x: 16, z: -5, w: 4.5, d: 3.8 },      // satellite dishes
  { x: -8, z: -10, w: 6.0, d: 3.0 },     // bridge
  { x: 0, z: -5.5, w: 38.5, d: 1.2 },
  { x: 0, z: 3, w: 38.5, d: 1.0 },
  { x: 0, z: 10, w: 38.5, d: 1.0 },
  { x: -7.5, z: 2, w: 1.2, d: 34.5 },
  { x: 0, z: 2, w: 1.2, d: 34.5 },
  { x: 9, z: 2, w: 1.2, d: 34.5 },
  { x: 16, z: 2, w: 1.2, d: 20.5 },
];

const lowRiseGroup = new THREE.Group();
lowRiseGroup.name = 'lowRiseDistrict';
cityGroup.add(lowRiseGroup);
registerEpilogueArchitecture(lowRiseGroup);

const lowRiseSpacing = 2.25;
for (let gx = -17; gx <= 17; gx += lowRiseSpacing) {
  for (let gz = -17; gz <= 17; gz += lowRiseSpacing) {
    const jitterX = (hash2D(gx, gz) - 0.5) * 0.46;
    const jitterZ = (hash2D(gz, gx) - 0.5) * 0.46;
    const x = gx + jitterX;
    const z = gz + jitterZ;

    const centerDistance = Math.sqrt((x - 4.5) ** 2 + (z - 0.5) ** 2);
    const densityBias = THREE.MathUtils.clamp(1.0 - centerDistance / 24, 0, 1);
    const placementChance = 0.52 + densityBias * 0.32;
    if (hash2D(x * 0.7, z * 0.7) > placementChance) continue;

    const width = 0.72 + hash2D(x * 1.7, z * 1.3) * 1.18;
    const depth = 0.72 + hash2D(z * 1.9, x * 1.1) * 1.18;
    const heightFactor = THREE.MathUtils.clamp(1.0 - centerDistance / 20, 0, 1);
    const heightBand = hash2D(x * 2.3, z * 2.1);
    const height =
      heightBand < 0.45
        ? 0.8 + heightFactor * 1.0 + heightBand * 0.45
        : heightBand < 0.82
          ? 1.2 + heightFactor * 1.45 + heightBand * 0.55
          : 1.9 + heightFactor * 2.0 + heightBand * 0.45;

    if (overlapsReservedZone(x, z, width + 0.22, depth + 0.22, lowRiseReservedZones)) continue;

    const lowRise = createLowRiseBuilding(x, z, width, depth, height);
    lowRise.name = `lowRise_${lowRiseGroup.children.length}`;
    lowRiseGroup.add(lowRise);
    if (lowRise.userData.epilogueCap) {
      registerEpilogueUnit(lowRise.userData.epilogueCap);
    }
    lowRiseReservedZones.push({ x, z, w: width + 0.18, d: depth + 0.18 });
  }
}

const microFillSpacing = 1.58;
for (let gx = -17.5; gx <= 17.5; gx += microFillSpacing) {
  for (let gz = -17.5; gz <= 17.5; gz += microFillSpacing) {
    const jitterX = (hash2D(gx * 1.3, gz * 1.1) - 0.5) * 0.24;
    const jitterZ = (hash2D(gz * 1.5, gx * 1.2) - 0.5) * 0.24;
    const x = gx + jitterX;
    const z = gz + jitterZ;

    const centerDistance = Math.sqrt((x - 4.5) ** 2 + (z - 0.5) ** 2);
    const densityBias = THREE.MathUtils.clamp(1.0 - centerDistance / 26, 0, 1);
    const placementChance = 0.18 + densityBias * 0.44;
    if (hash2D(x * 2.1, z * 1.9) > placementChance) continue;

    const width = 0.52 + hash2D(x * 2.7, z * 2.3) * 0.72;
    const depth = 0.52 + hash2D(z * 2.5, x * 2.9) * 0.72;
    const heightMix = hash2D(x * 3.1, z * 3.3);
    const height =
      heightMix < 0.65
        ? 0.7 + densityBias * 0.55 + heightMix * 0.26
        : 0.95 + densityBias * 0.9 + heightMix * 0.35;

    if (overlapsReservedZone(x, z, width + 0.14, depth + 0.14, lowRiseReservedZones)) continue;

    const lowRise = createLowRiseBuilding(x, z, width, depth, height);
    lowRise.name = `lowRise_${lowRiseGroup.children.length}`;
    lowRiseGroup.add(lowRise);
    if (lowRise.userData.epilogueCap) {
      registerEpilogueUnit(lowRise.userData.epilogueCap);
    }
    lowRiseReservedZones.push({ x, z, w: width + 0.11, d: depth + 0.11 });
  }
}

// ---- ICONIC TALL TOWER ----
const towerGroup = new THREE.Group();
towerGroup.name = 'mainTower';
const towerBaseGeo = new THREE.CylinderGeometry(0.6, 0.9, 3, 16);
const towerBase = new THREE.Mesh(towerBaseGeo, createBreathingBuildingMaterial(0xf5f5f5));
towerBase.position.y = 1.5;
towerBase.castShadow = true;
towerGroup.add(towerBase);

const towerMidGeo = new THREE.CylinderGeometry(0.5, 0.6, 5, 16);
const towerMid = new THREE.Mesh(towerMidGeo, createBreathingBuildingMaterial(0xf5f5f5));
towerMid.position.y = 5.5;
towerMid.castShadow = true;
towerGroup.add(towerMid);

const towerTopGeo = new THREE.CylinderGeometry(0.1, 0.5, 3, 16);
const towerTop = new THREE.Mesh(towerTopGeo, createBreathingBuildingMaterial(0xf3f3f3));
towerTop.position.y = 9.5;
towerTop.castShadow = true;
towerGroup.add(towerTop);

const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 2, 4);
const antenna = new THREE.Mesh(antennaGeo, slightGrayMat);
antenna.position.y = 12;
towerGroup.add(antenna);
towerGroup.position.set(5, 0.15, -1);
towerGroup.userData.buildingHeight = 12;
initializeBreathingProfile(towerGroup);
cityGroup.add(towerGroup);
breathingBuildingTargets.push(towerGroup);
registerEpilogueArchitecture(towerGroup);
registerEpilogueArchitecture(towerGroup);

// ---- ROADS ----
function createRoad(x, z, w, d) {
  const roadGeo = new THREE.BoxGeometry(w, 0.05, d);
  const road = new THREE.Mesh(roadGeo, slightGrayMat);
  road.position.set(x, 0.17, z);
  road.receiveShadow = true;
  return road;
}

const roads = [
  createRoad(0, -5.5, 38, 0.5),
  createRoad(0, 3, 38, 0.4),
  createRoad(0, 10, 38, 0.4),
  createRoad(-7.5, 2, 0.4, 34),
  createRoad(0, 2, 0.4, 34),
  createRoad(9, 2, 0.4, 34),
  createRoad(16, 2, 0.4, 20),
];
roads.forEach((r, i) => {
  r.name = `road_${i}`;
  cityGroup.add(r);
  registerEpilogueArchitecture(r);
});

// ---- LNG TANKS ----
function createTank(x, z, r, h) {
  const group = new THREE.Group();
  const tankGeo = new THREE.CylinderGeometry(r, r, h, 16);
  const tank = new THREE.Mesh(tankGeo, whiteMat);
  tank.position.y = h / 2;
  tank.castShadow = true;
  group.add(tank);
  const domeGeo = new THREE.SphereGeometry(r, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, lightWhiteMat);
  dome.position.y = h;
  group.add(dome);
  group.position.set(x, 0.15, z);
  return group;
}

const tanks = [
  createTank(-10, 4, 0.8, 1.2),
  createTank(-10, 6.5, 0.8, 1.2),
  createTank(-8, 5, 0.6, 1),
];
tanks.forEach((t, i) => {
  t.name = `lngTank_${i}`;
  cityGroup.add(t);
  registerEpilogueArchitecture(t);
});

// ---- SATELLITE DISHES ----
function createSatelliteDish(x, z) {
  const group = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 6);
  const pole = new THREE.Mesh(poleGeo, slightGrayMat);
  pole.position.y = 0.75;
  group.add(pole);
  const dishGeo = new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const dish = new THREE.Mesh(dishGeo, whiteMat);
  dish.position.y = 1.5;
  dish.rotation.x = 0.4;
  dish.castShadow = true;
  group.add(dish);
  group.position.set(x, 0.15, z);
  return group;
}

const dish1 = createSatelliteDish(15, -6);
dish1.name = 'satelliteDish_0';
cityGroup.add(dish1);
registerEpilogueArchitecture(dish1);
const dish2 = createSatelliteDish(17, -4);
dish2.name = 'satelliteDish_1';
cityGroup.add(dish2);
registerEpilogueArchitecture(dish2);

// ---- TREES ----
function createTree(x, z, h = 1) {
  const group = new THREE.Group();
  const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, h * 0.6, 6);
  const trunk = new THREE.Mesh(trunkGeo, slightGrayMat);
  trunk.position.y = h * 0.3;
  group.add(trunk);
  const canopyGeo = new THREE.SphereGeometry(h * 0.3, 8, 6);
  const canopy = new THREE.Mesh(canopyGeo, whiteMat);
  canopy.position.y = h * 0.7;
  canopy.castShadow = true;
  group.add(canopy);
  group.position.set(x, 0.15, z);
  return group;
}

const treePositions = [
  [-5, -7], [-3, -8], [-1, -7.5], [1, -8], [3, -7],
  [-6, 10], [-4, 11], [-2, 10.5], [0, 11], [2, 10],
  [5, 12], [7, 11], [9, 12], [-6, -2], [-5, 0],
  [-3, -1], [6, 12], [8, 13], [10, 12],
  [-8, 9], [-7, 11], [-9, 10],
];
treePositions.forEach((pos, i) => {
  const tree = createTree(pos[0], pos[1], 0.6 + Math.random() * 0.4);
  tree.name = `tree_${i}`;
  cityGroup.add(tree);
});

// ---- VEHICLES ----
function createVehicle(x, z, rotation = 0) {
  const vehicleGeo = new THREE.BoxGeometry(0.4, 0.15, 0.2);
  const vehicle = new THREE.Mesh(vehicleGeo, slightGrayMat);
  vehicle.position.set(x, 0.25, z);
  vehicle.rotation.y = rotation;
  vehicle.castShadow = true;
  return vehicle;
}

const vehicles = [
  createVehicle(3, -5.5, 0), createVehicle(7, -5.5, 0), createVehicle(12, -5.5, 0),
  createVehicle(-3, 3, 0), createVehicle(5, 3, 0),
  createVehicle(9, 0, Math.PI / 2), createVehicle(0, 7, Math.PI / 2),
];
vehicles.forEach((v, i) => {
  v.name = `vehicle_${i}`;
  cityGroup.add(v);
});

function createBreathingVolume(target, {
  opacity = 0.18,
  scaleMultiplier = new THREE.Vector3(1.18, 1.12, 1.18),
  speed = 0.22,
  phase = 0,
} = {}) {
  const bounds = new THREE.Box3().setFromObject(target);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const geometry = new THREE.BoxGeometry(
    Math.max(size.x * scaleMultiplier.x, 0.8),
    Math.max(size.y * scaleMultiplier.y, 0.8),
    Math.max(size.z * scaleMultiplier.z, 0.8)
  );
  const material = new THREE.MeshBasicMaterial({
    visible: false,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.BackSide,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(center);
  mesh.renderOrder = 0;
  mesh.visible = true;
  cityGroup.add(mesh);
  breathingVolumes.push({
    mesh,
    center: center.clone(),
    baseScale: new THREE.Vector3(1, 1, 1),
    speed,
    phase,
    opacity,
  });
  return mesh;
}

// ---- CHIMNEYS ----
function createChimney(x, z) {
  const group = new THREE.Group();
  const chimneyGeo = new THREE.CylinderGeometry(0.15, 0.2, 3, 8);
  const chimney = new THREE.Mesh(chimneyGeo, whiteMat);
  chimney.position.y = 1.5;
  chimney.castShadow = true;
  group.add(chimney);
  for (let i = 0; i < 3; i++) {
    const stripeGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 8);
    const stripe = new THREE.Mesh(stripeGeo, slightGrayMat);
    stripe.position.y = 0.5 + i * 1;
    group.add(stripe);
  }
  group.position.set(x, 0.15, z);
  return group;
}

const chimney1 = createChimney(17, 9);
chimney1.name = 'chimney_0';
cityGroup.add(chimney1);
registerEpilogueArchitecture(chimney1);
const chimney2 = createChimney(18, 7);
chimney2.name = 'chimney_1';
cityGroup.add(chimney2);
registerEpilogueArchitecture(chimney2);

// ---- BRIDGE ----
const bridgeGroup = new THREE.Group();
bridgeGroup.name = 'bridge';
const bridgeDeckGeo = new THREE.BoxGeometry(5, 0.12, 0.6);
const bridgeDeck = new THREE.Mesh(bridgeDeckGeo, whiteMat);
bridgeDeck.position.set(-8, 0.5, -10);
bridgeDeck.castShadow = true;
bridgeGroup.add(bridgeDeck);
for (let i = 0; i < 3; i++) {
  const pillarGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6);
  const pillar = new THREE.Mesh(pillarGeo, slightGrayMat);
  pillar.position.set(-9.5 + i * 1.5, 0.25, -10);
  bridgeGroup.add(pillar);
}
cityGroup.add(bridgeGroup);
registerEpilogueArchitecture(bridgeGroup);

// ---- PIPES ----
function createPipe(start, end, radius = 0.03) {
  const dir = new THREE.Vector3().subVectors(end, start);
  const length = dir.length();
  const pipeGeo = new THREE.CylinderGeometry(radius, radius, length, 6);
  const pipe = new THREE.Mesh(pipeGeo, slightGrayMat);
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  pipe.position.copy(mid);
  dir.normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
  pipe.quaternion.copy(quat);
  return pipe;
}

const pipeConnections = [
  [new THREE.Vector3(-10, 0.8, 4), new THREE.Vector3(-7.5, 0.8, 4)],
  [new THREE.Vector3(-7.5, 0.8, 4), new THREE.Vector3(-5, 0.8, 3)],
  [new THREE.Vector3(-10, 0.8, 6.5), new THREE.Vector3(-7, 0.8, 6.5)],
];
pipeConnections.forEach((p, i) => {
  const pipe = createPipe(p[0], p[1], 0.04);
  pipe.name = `pipe_${i}`;
  cityGroup.add(pipe);
});

// ---- DATA CENTER ----
const dcGroup = new THREE.Group();
dcGroup.name = 'dataCenter';
const dcBodyGeo = new THREE.BoxGeometry(2.5, 1.5, 2);
const dcBody = new THREE.Mesh(dcBodyGeo, createBreathingBuildingMaterial(0xf5f5f5));
dcBody.position.y = 0.75;
dcBody.castShadow = true;
dcBody.receiveShadow = true;
dcGroup.add(dcBody);
for (let i = 0; i < 5; i++) {
  const ventGeo = new THREE.BoxGeometry(2.3, 0.02, 0.01);
  const vent = new THREE.Mesh(ventGeo, createBreathingBuildingMaterial(0xf3f3f3));
  vent.position.set(0, 0.3 + i * 0.25, 1.01);
  dcGroup.add(vent);
}
dcGroup.position.set(5, 0.15, 14);
dcGroup.userData.buildingHeight = 1.5;
initializeBreathingProfile(dcGroup);
cityGroup.add(dcGroup);
breathingBuildingTargets.push(dcGroup);
registerEpilogueArchitecture(dcGroup);
addModuleLabel(dcGroup, 'Data\nCenter', new THREE.Vector3(0, 2.1, 0));
createBreathingVolume(dcGroup, {
  opacity: 0.0,
  scaleMultiplier: new THREE.Vector3(1.24, 1.16, 1.24),
  speed: 0.2,
  phase: 1.8,
});

// ---- ROOF SOLAR ----
function addRoofSolar(building, panelCount = 4) {
  const footprint = building.userData.footprint;
  const height = building.userData.buildingHeight ?? 2;
  if (!footprint) {
    return;
  }

  const cols = Math.min(2, panelCount);
  const rows = Math.max(1, Math.ceil(panelCount / cols));
  const panelWidth = footprint.w * 0.28;
  const panelDepth = footprint.d * 0.28;
  const spacingX = footprint.w * 0.34;
  const spacingZ = footprint.d * 0.34;

  for (let i = 0; i < panelCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const offsetX = (col - (cols - 1) / 2) * spacingX;
    const offsetZ = (row - (rows - 1) / 2) * spacingZ;

    const panelGeo = new THREE.BoxGeometry(panelWidth, 0.03, panelDepth);
    const panel = new THREE.Mesh(panelGeo, roofPanelMat.clone());
    panel.position.set(offsetX, height + 0.03, offsetZ);
    panel.name = `roofSolar_${building.name}_${i}`;
    panel.userData.isRoofSolar = true;
    panel.userData.editableKind = 'pv-panel';
    allRoofPanelMeshes.push(panel);
    building.add(panel);

    const glowGeo = new THREE.PlaneGeometry(panelWidth * 0.92, panelDepth * 0.92);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xbcefff,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.rotation.x = -Math.PI / 2;
    glow.position.set(offsetX, height + 0.047, offsetZ);
    glow.name = `roofSolarGlow_${building.name}_${i}`;
    glow.userData.isRoofSolar = true;
    glow.userData.nonEditable = true;
    allRoofGlowMeshes.push(glow);
    building.add(glow);

    const frameGeo = new THREE.BoxGeometry(panelWidth * 1.08, 0.005, panelDepth * 1.08);
    const fMat = new THREE.MeshBasicMaterial({
      color: 0x8fdfff, transparent: true, opacity: 0.14,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const frame = new THREE.Mesh(frameGeo, fMat);
    frame.position.copy(panel.position);
    frame.position.y += 0.02;
    frame.name = `roofSolarFrame_${building.name}_${i}`;
    frame.userData.nonEditable = true;
    frame.userData.isRoofSolar = true;
    allRoofFrameMeshes.push(frame);
    building.add(frame);
  }
}

[0, 1, 4, 8].forEach((i) => {
  if (buildings[i]) {
    buildings[i].userData.disableBreathing = true;
    addRoofSolar(buildings[i], 4);
  }
});

// ---- VPP CENTER ----
const vppGroup = new THREE.Group();
vppGroup.name = 'vppCenter';
const vppDomeGeo = new THREE.SphereGeometry(1.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
const vppDome = new THREE.Mesh(vppDomeGeo, glassMat);
vppDome.castShadow = true;
vppGroup.add(vppDome);
const vppBaseGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.2, 24);
const vppBase = new THREE.Mesh(vppBaseGeo, whiteMat);
vppBase.position.y = 0;
vppGroup.add(vppBase);
vppGroup.position.set(8, 0.15, -3);
cityGroup.add(vppGroup);
registerEpilogueArchitecture(vppGroup);
addModuleLabel(vppGroup, 'Virtual Power\nPlant Hub', new THREE.Vector3(0, 2.0, 0));
createBreathingVolume(vppGroup, {
  opacity: 0.0,
  scaleMultiplier: new THREE.Vector3(1.28, 1.22, 1.28),
  speed: 0.18,
  phase: 0.4,
});

// ---- LOAD UPLOADED HOUSE MODEL (GLB) ----
const houseGroup = new THREE.Group();
houseGroup.name = 'importedHouse';
houseGroup.position.set(4, 0.15, -14);
houseGroup.rotation.set(0, 0, 0);
cityGroup.add(houseGroup);
registerEpilogueArchitecture(houseGroup);
addModuleLabel(houseGroup, 'Sunroom\nModule', new THREE.Vector3(0, 2.8, 0));

// Placeholder pink marker visible until model loads
const placeholderGeo = new THREE.BoxGeometry(2.5, 1.5, 1.8);
const placeholderMat = new THREE.MeshStandardMaterial({ color: 0xf5b0b0, roughness: 0.5, transparent: true, opacity: 0.5 });
const placeholder = new THREE.Mesh(placeholderGeo, placeholderMat);
placeholder.name = 'housePlaceholder';
placeholder.position.y = 0.75;
houseGroup.add(placeholder);

// Load the actual GLB model
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

createBreathingVolume(solarParent, {
  opacity: 0.0,
  scaleMultiplier: new THREE.Vector3(1.16, 1.1, 1.16),
  speed: 0.16,
  phase: 1.2,
});

createBreathingVolume(towerGroup, {
  opacity: 0.0,
  scaleMultiplier: new THREE.Vector3(1.22, 1.12, 1.22),
  speed: 0.14,
  phase: 2.1,
});

function loadHouseModel() {
  gltfLoader.load('./models/Untitled-2.glb', (gltf) => {
    const model = gltf.scene;
    model.name = 'houseModel';

    // Remove placeholder
    const ph = houseGroup.getObjectByName('housePlaceholder');
    if (ph) houseGroup.remove(ph);

    // Reset group rotation to identity first for correct bounding box
    houseGroup.rotation.set(0, 0, 0);
    houseGroup.updateMatrixWorld(true);

    // Compute bounding box, center + scale to fit
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Target height ~3.5 units to fit with nearby buildings
    const targetHeight = 3.5;
    const maxDim = Math.max(size.x, size.y, size.z);
    const scaleFactor = targetHeight / maxDim;
    model.scale.setScalar(scaleFactor);

    // Recompute after scaling
    box.setFromObject(model);
    box.getCenter(center);
    const newSize = box.getSize(new THREE.Vector3());

    // Center model horizontally and sit bottom on y=0 (local space)
    model.position.x = -center.x;
    model.position.z = -center.z;
    model.position.y = -box.min.y;

    // Now apply the desired rotation on the model itself (not the group)
    // This avoids the inverted-Y ground alignment problem
    model.rotation.set(Math.PI, 0, Math.PI);

    // Recompute box after rotation to fix vertical placement
    houseGroup.add(model);
    houseGroup.updateMatrixWorld(true);
    const finalBox = new THREE.Box3().setFromObject(houseGroup);
    // Shift the group Y so the bottom sits on the ground plane (y=0.15)
    houseGroup.position.y = 0.15 - finalBox.min.y + 0.15;

    // Enable shadows on all meshes
    model.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    // Add blue glow to the imported model
    // Override materials with blue emissive tint
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        const mat = child.material.clone();
        mat.emissive = new THREE.Color(0x0066ff);
        mat.emissiveIntensity = 0.35;
        mat.transparent = true;
        mat.opacity = 0.92;
        child.material = mat;
      }
    });

    // Create glow shells relative to the model in world space
    houseGroup.updateMatrixWorld(true);
    const glowBox = new THREE.Box3().setFromObject(houseGroup);
    const glowSize = glowBox.getSize(new THREE.Vector3());
    const glowCenter = glowBox.getCenter(new THREE.Vector3());

    // Convert world center to houseGroup local space
    const localGlowCenter = houseGroup.worldToLocal(glowCenter.clone());

    // Inner glow shell
    const glowShellGeo = new THREE.BoxGeometry(
      glowSize.x * 1.08,
      glowSize.y * 1.08,
      glowSize.z * 1.08
    );
    const glowShellMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const glowShell = new THREE.Mesh(glowShellGeo, glowShellMat);
    glowShell.name = 'houseGlowShellInner';
    glowShell.position.copy(localGlowCenter);
    houseGroup.add(glowShell);

    // Outer glow shell (larger, more transparent)
    const outerGlowGeo = new THREE.BoxGeometry(
      glowSize.x * 1.25,
      glowSize.y * 1.25,
      glowSize.z * 1.25
    );
    const outerGlowMat = new THREE.MeshBasicMaterial({
      color: 0x0066ff,
      transparent: true,
      opacity: 0.04,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide,
    });
    const outerGlow = new THREE.Mesh(outerGlowGeo, outerGlowMat);
    outerGlow.name = 'houseGlowShellOuter';
    outerGlow.position.copy(localGlowCenter);
    houseGroup.add(outerGlow);

    // Ground glow ring under the house
    const groundGlowGeo = new THREE.RingGeometry(0.2, Math.max(glowSize.x, glowSize.z) * 0.8, 32);
    const groundGlowMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const groundGlow = new THREE.Mesh(groundGlowGeo, groundGlowMat);
    groundGlow.name = 'houseGroundGlow';
    groundGlow.rotation.x = -Math.PI / 2;
    // Place at the bottom of the model in local space
    const localBottom = houseGroup.worldToLocal(new THREE.Vector3(glowCenter.x, glowBox.min.y + 0.05, glowCenter.z));
    groundGlow.position.copy(localBottom);
    houseGroup.add(groundGlow);

    // ---- RHYTHMIC EXPANDING CIRCULAR WAVES ----
    const waveCount = 5;
    const waves = [];
    const waveMaxRadius = Math.max(glowSize.x, glowSize.z) * 2.5;
    const waveMinRadius = Math.max(glowSize.x, glowSize.z) * 0.25;

    for (let i = 0; i < waveCount; i++) {
      const waveGeo = new THREE.RingGeometry(0.5, 0.62, 64);
      const waveMat = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(0x0088ff) },
          uOpacity: { value: 0.0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying vec2 vUv;
          void main() {
            // Soft fade at inner and outer edges of the ring
            float edgeFade = smoothstep(0.0, 0.35, vUv.x) * smoothstep(1.0, 0.65, vUv.x);
            gl_FragColor = vec4(uColor, uOpacity * edgeFade);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.rotation.x = -Math.PI / 2;
      waveMesh.position.copy(localBottom);
      waveMesh.position.y += 0.02;
      waveMesh.name = `houseWave_${i}`;
      houseGroup.add(waveMesh);
      waves.push({
        mesh: waveMesh,
        phase: i / waveCount, // stagger each wave
        minRadius: waveMinRadius,
        maxRadius: waveMaxRadius,
      });
    }

    // ---- SOFT AMBIENT HALO (gradient disc) ----
    const haloRadius = Math.max(glowSize.x, glowSize.z) * 2.0;
    const haloGeo = new THREE.CircleGeometry(haloRadius, 64);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x0066ff) },
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec2 vUv;
        void main() {
          float dist = length(vUv - vec2(0.5)) * 2.0;
          // Smooth radial falloff — very soft edge
          float alpha = smoothstep(1.0, 0.0, dist);
          alpha = pow(alpha, 2.2); // Gradual power falloff
          // Gentle breathing
          float breath = 0.6 + 0.4 * sin(uTime * 0.8);
          alpha *= 0.12 * breath;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.rotation.x = -Math.PI / 2;
    haloMesh.position.copy(localBottom);
    haloMesh.position.y += 0.01;
    haloMesh.name = 'houseHalo';
    houseGroup.add(haloMesh);

    // ---- VERTICAL AMBIENT GLOW SPHERE ----
    const glowSphereGeo = new THREE.SphereGeometry(Math.max(glowSize.x, glowSize.y, glowSize.z) * 1.1, 32, 24);
    const glowSphereMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x0077ff) },
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float fresnel = 1.0 - abs(dot(vNormal, vViewDir));
          fresnel = pow(fresnel, 2.5);
          float breath = 0.55 + 0.45 * sin(uTime * 1.0 + 0.5);
          float alpha = fresnel * 0.18 * breath;
          gl_FragColor = vec4(uColor * 1.3, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const glowSphere = new THREE.Mesh(glowSphereGeo, glowSphereMat);
    glowSphere.position.copy(localGlowCenter);
    glowSphere.name = 'houseGlowSphere';
    houseGroup.add(glowSphere);

    // Store references for animation
    houseGroup.userData.glowShell = glowShell;
    houseGroup.userData.outerGlow = outerGlow;
    houseGroup.userData.groundGlow = groundGlow;
    houseGroup.userData.waves = waves;
    houseGroup.userData.haloMesh = haloMesh;
    houseGroup.userData.glowSphere = glowSphere;

    // ---- WARM INTERIOR GLOW (night mode only) ----
    // Subtle, contained interior lighting — no spill, no visible projections
    houseGroup.updateMatrixWorld(true);
    const interiorBox = new THREE.Box3().setFromObject(houseGroup);
    const interiorSize = interiorBox.getSize(new THREE.Vector3());
    const interiorCenter = interiorBox.getCenter(new THREE.Vector3());
    const localInteriorCenter = houseGroup.worldToLocal(interiorCenter.clone());
    const localInteriorBottom = houseGroup.worldToLocal(new THREE.Vector3(interiorCenter.x, interiorBox.min.y, interiorCenter.z));

    // Store original material properties
    const houseMeshOriginals = [];
    model.traverse((child) => {
      if (child.isMesh && child.material) {
        houseMeshOriginals.push({
          mesh: child,
          origOpacity: child.material.opacity,
          origTransparent: child.material.transparent,
        });
      }
    });

    // ---- INDIRECT AMBIENT GLOW (no point lights, no spotlight effect) ----
    // Multiple tiny hemisphere lights scattered inside simulate bounced light
    const warmAmbientLights = [];
    const ambientPositions = [
      { x: 0, y: 0.25, z: 0 },       // center low
      { x: 0.3, y: 0.45, z: 0.2 },   // offset upper
      { x: -0.25, y: 0.3, z: -0.15 }, // offset mid
    ];
    ambientPositions.forEach((offset, ai) => {
      const hemi = new THREE.HemisphereLight(0xffe0a0, 0xffc070, 0);
      hemi.name = `houseAmbientHemi_${ai}`;
      hemi.position.set(
        localInteriorCenter.x + offset.x * interiorSize.x,
        localInteriorBottom.y + offset.y * interiorSize.y,
        localInteriorCenter.z + offset.z * interiorSize.z
      );
      houseGroup.add(hemi);
      warmAmbientLights.push(hemi);
    });

    // Soft diffused warm volume — simulates indirect bounced light, not a point source
    // Uses a smooth radial falloff from center rather than a fresnel edge glow
    const warmVolumeGeo = new THREE.SphereGeometry(
      Math.min(interiorSize.x, interiorSize.z) * 0.38, 16, 12
    );
    const warmVolumeMat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(1.0, 0.85, 0.5) },
        uOpacity: { value: 0.0 },
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;
        void main() {
          vLocalPos = position;
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        varying vec3 vLocalPos;
        void main() {
          // Soft omnidirectional glow — not view-dependent like fresnel
          // Gentle radial falloff from sphere center
          float dist = length(vLocalPos) / 0.5;
          float radialFade = 1.0 - smoothstep(0.0, 1.0, dist);
          radialFade = pow(radialFade, 0.8);

          // Very slight view-angle softness (not harsh fresnel)
          float viewSoft = 0.5 + 0.5 * (1.0 - abs(dot(vNormal, vViewDir)));

          // Slow gentle breathing — not a flicker, more like ambient warmth
          float breath = 0.94 + 0.04 * sin(uTime * 0.35 + 0.8) + 0.02 * sin(uTime * 0.7 + 2.1);

          float alpha = radialFade * viewSoft * uOpacity * breath * 0.35;
          // Warm color gets slightly cooler at edges (simulates scattered light)
          vec3 col = mix(uColor, uColor * vec3(0.9, 0.95, 1.1), dist * 0.3);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
    });
    const warmVolume = new THREE.Mesh(warmVolumeGeo, warmVolumeMat);
    warmVolume.position.copy(localInteriorCenter);
    warmVolume.position.y = localInteriorBottom.y + interiorSize.y * 0.32;
    warmVolume.name = 'houseWarmVolume';
    houseGroup.add(warmVolume);

    // Secondary smaller warm volume at upper level — mimics upward-bounced light
    const warmVolumeUpperGeo = new THREE.SphereGeometry(
      Math.min(interiorSize.x, interiorSize.z) * 0.25, 12, 8
    );
    const warmVolumeUpperMat = warmVolumeMat.clone();
    warmVolumeUpperMat.uniforms = {
      uColor: { value: new THREE.Color(1.0, 0.88, 0.58) },
      uOpacity: { value: 0.0 },
      uTime: { value: 0.0 },
    };
    const warmVolumeUpper = new THREE.Mesh(warmVolumeUpperGeo, warmVolumeUpperMat);
    warmVolumeUpper.position.copy(localInteriorCenter);
    warmVolumeUpper.position.y = localInteriorBottom.y + interiorSize.y * 0.55;
    warmVolumeUpper.name = 'houseWarmVolumeUpper';
    houseGroup.add(warmVolumeUpper);

    houseGroup.userData.warmAmbientLights = warmAmbientLights;
    houseGroup.userData.warmVolume = warmVolume;
    houseGroup.userData.warmVolumeUpper = warmVolumeUpper;
    houseGroup.userData.houseMeshOriginals = houseMeshOriginals;

    console.log('House model loaded with enhanced glow at position:', houseGroup.position.toArray());
    createBreathingVolume(houseGroup, {
      opacity: 0.0,
      scaleMultiplier: new THREE.Vector3(1.22, 1.14, 1.22),
      speed: 0.17,
      phase: 2.6,
    });
    loadCityCarModel();
    loadCityLngModel();
  }, undefined, (err) => {
    console.error('GLB load error:', err);
  });
}

function loadCityCarModel() {
  if (cityCarModel) {
    return;
  }

  const houseModel = houseGroup.getObjectByName('houseModel');
  if (!houseModel) {
    return;
  }

  gltfLoader.load('./models/energy_storage-3.glb', (gltf) => {
    const model = gltf.scene;
    model.name = 'cityCarModel';

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetLength = 1.8;
    model.scale.setScalar(targetLength / maxDim);

    box.setFromObject(model);
    box.getCenter(center);
    model.position.set(-center.x, -box.min.y, -center.z);
    model.rotation.y = Math.PI;

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.geometry?.computeVertexNormals) {
        child.geometry.computeVertexNormals();
      }
      if (child.material?.clone) {
        child.material = child.material.clone();
        if ('envMapIntensity' in child.material) {
          child.material.envMapIntensity = 0.32;
        }
      }
    });

    houseGroup.add(model);
    houseGroup.updateMatrixWorld(true);

    const houseBox = new THREE.Box3().setFromObject(houseModel);
    const carBox = new THREE.Box3().setFromObject(model);
    const houseCenter = houseBox.getCenter(new THREE.Vector3());
    const carCenter = carBox.getCenter(new THREE.Vector3());
    const carSize = carBox.getSize(new THREE.Vector3());

    model.position.set(0.460, 0.180, -1.080);
    model.rotation.set(0.000, 1.607, 0.000);
    model.scale.set(0.546, 0.546, 0.546);

    cityCarModel = model;
    refreshCityTransformPanel();
  }, undefined, (err) => {
    console.error('City car GLB load error:', err);
  });
}

function loadCityLngModel() {
  if (cityLngModel) {
    return;
  }

  const houseModel = houseGroup.getObjectByName('houseModel');
  if (!houseModel) {
    return;
  }

  gltfLoader.load('./models/lng.glb', (gltf) => {
    const model = gltf.scene;
    model.name = 'cityLngModel';

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const targetLength = 2.6;
    model.scale.setScalar(targetLength / maxDim);

    box.setFromObject(model);
    box.getCenter(center);
    model.position.set(-center.x, -box.min.y, -center.z);

    model.traverse((child) => {
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (child.geometry?.computeVertexNormals) {
        child.geometry.computeVertexNormals();
      }
      if (child.material?.clone) {
        child.material = child.material.clone();
        if ('envMapIntensity' in child.material) {
          child.material.envMapIntensity = 0.3;
        }
      }
    });

    houseGroup.add(model);
    houseGroup.updateMatrixWorld(true);

    const houseBox = new THREE.Box3().setFromObject(houseModel);
    const lngBox = new THREE.Box3().setFromObject(model);
    const houseCenter = houseBox.getCenter(new THREE.Vector3());
    const lngCenter = lngBox.getCenter(new THREE.Vector3());
    const lngSize = lngBox.getSize(new THREE.Vector3());

    model.position.set(3.530, 0.091, 0.327);
    model.rotation.set(0.000, 1.607, 0.000);
    model.scale.set(0.128, 0.128, 0.128);

    cityLngModel = model;
    refreshCityTransformPanel();
  }, undefined, (err) => {
    console.error('City LNG GLB load error:', err);
  });
}

loadHouseModel();

// ---- BUILDING WINDOW LIGHTS (night mode) ----
const windowLightsMat = new THREE.MeshBasicMaterial({ color: 0xffeebb, transparent: true, opacity: 0.0, depthWrite: false });
const windowLightsCoolMat = new THREE.MeshBasicMaterial({ color: 0xaaddff, transparent: true, opacity: 0.0, depthWrite: false });
const windowLightsWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.0, depthWrite: false });
const windowMaterials = [windowLightsMat, windowLightsCoolMat, windowLightsWhiteMat];
const allWindowMeshes = [];

function findBodyMesh(group) {
  let best = null;
  let bestVol = 0;
  group.children.forEach(child => {
    if (!child.geometry) return;
    const params = child.geometry.parameters;
    if (!params) return;
    let vol = 0;
    if (params.width !== undefined && params.height !== undefined && params.depth !== undefined) {
      vol = params.width * params.height * params.depth;
    } else if (params.radiusTop !== undefined && params.height !== undefined) {
      vol = Math.PI * Math.pow(Math.max(params.radiusTop, params.radiusBottom || params.radiusTop), 2) * params.height;
    }
    if (vol > bestVol) { bestVol = vol; best = child; }
  });
  return best;
}

function addWindowLights(building, buildingIndex) {
  const bodyMesh = findBodyMesh(building);
  if (!bodyMesh) return;
  const params = bodyMesh.geometry.parameters;
  const isCylinder = params.radiusTop !== undefined;
  const groupPos = new THREE.Vector3();
  building.getWorldPosition(groupPos);
  const bodyLocalPos = bodyMesh.position.clone();
  const seed = buildingIndex * 137;
  let winCount = 0;
  const winW = 0.12;
  const winH = 0.18;
  const SIDE_INSET = 0.15;
  const BOTTOM_INSET = 0.35;
  const TOP_INSET = 0.25;

  if (isCylinder) {
    const radius = Math.max(params.radiusTop, params.radiusBottom || params.radiusTop);
    const h = params.height;
    const centerY = groupPos.y + bodyLocalPos.y;
    const centerX = groupPos.x + bodyLocalPos.x;
    const centerZ = groupPos.z + bodyLocalPos.z;
    const minY = centerY - h / 2 + BOTTOM_INSET;
    const maxY = centerY + h / 2 - TOP_INSET;
    const rows = Math.max(1, Math.floor((maxY - minY) / 0.5));
    const cols = 8;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hash = ((seed + r * 17 + c * 53) * 2654435761) >>> 0;
        if ((hash % 100) < 40) continue;
        const angle = (c / cols) * Math.PI * 2;
        const yPos = minY + (r + 0.5) * ((maxY - minY) / rows);
        const wx = centerX + Math.cos(angle) * (radius + 0.01);
        const wz = centerZ + Math.sin(angle) * (radius + 0.01);
        const winGeo = new THREE.PlaneGeometry(winW, winH);
        const matIdx = hash % 3;
        const winMesh = new THREE.Mesh(winGeo, windowMaterials[matIdx].clone());
        winMesh.position.set(wx, yPos, wz);
        winMesh.rotation.y = -angle + Math.PI / 2;
        winMesh.userData.winFlickerPhase = (hash % 628) / 100;
        winMesh.userData.winFlickerSpeed = 0.3 + (hash % 50) / 100;
        winMesh.userData.winBaseIntensity = 0.5 + (hash % 50) / 100;
        winMesh.name = `window_${buildingIndex}_cyl_${winCount}`;
        cityGroup.add(winMesh);
        allWindowMeshes.push(winMesh);
        winCount++;
      }
    }
    return;
  }

  const bw = params.width;
  const bh = params.height;
  const bd = params.depth;
  const cx = groupPos.x + bodyLocalPos.x;
  const cy = groupPos.y + bodyLocalPos.y;
  const cz = groupPos.z + bodyLocalPos.z;
  const usableHeight = bh - BOTTOM_INSET - TOP_INSET;
  if (usableHeight < winH) return;

  const faces = [
    { axis: 'x', dir: 1, spanSize: bd, facePos: cx + bw / 2 + 0.01, spanCenter: cz },
    { axis: 'x', dir: -1, spanSize: bd, facePos: cx - bw / 2 - 0.01, spanCenter: cz },
    { axis: 'z', dir: 1, spanSize: bw, facePos: cz + bd / 2 + 0.01, spanCenter: cx },
    { axis: 'z', dir: -1, spanSize: bw, facePos: cz - bd / 2 - 0.01, spanCenter: cx },
  ];

  faces.forEach((face, fi) => {
    const usableSpan = face.spanSize - 2 * SIDE_INSET;
    if (usableSpan < winW) return;
    const cols = Math.max(1, Math.floor(usableSpan / 0.35));
    const rows = Math.max(1, Math.floor(usableHeight / 0.5));
    const colSpacing = usableSpan / (cols + 1);
    const rowSpacing = usableHeight / (rows + 1);
    const baseY = cy - bh / 2 + BOTTOM_INSET;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hash = ((seed + fi * 31 + r * 17 + c * 53) * 2654435761) >>> 0;
        if ((hash % 100) < 40) continue;
        const winGeo = new THREE.PlaneGeometry(winW, winH);
        const matIdx = hash % 3;
        const winMesh = new THREE.Mesh(winGeo, windowMaterials[matIdx].clone());
        const spanPos = face.spanCenter - usableSpan / 2 + colSpacing * (c + 1);
        const yPos = baseY + rowSpacing * (r + 1);
        if (face.axis === 'x') {
          winMesh.position.set(face.facePos, yPos, spanPos);
          winMesh.rotation.y = face.dir > 0 ? 0 : Math.PI;
        } else {
          winMesh.position.set(spanPos, yPos, face.facePos);
          winMesh.rotation.y = face.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
        }
        winMesh.userData.winFlickerPhase = (hash % 628) / 100;
        winMesh.userData.winFlickerSpeed = 0.3 + (hash % 50) / 100;
        winMesh.userData.winBaseIntensity = 0.5 + (hash % 50) / 100;
        winMesh.name = `window_${buildingIndex}_${fi}_${winCount}`;
        cityGroup.add(winMesh);
        allWindowMeshes.push(winMesh);
        winCount++;
      }
    }
  });
}

buildings.forEach((b, i) => {
  const body = findBodyMesh(b);
  if (!body) return;
  const h = body.geometry.parameters.height;
  if (h > 2.0) addWindowLights(b, i);
});

[towerBase, towerMid, towerTop].forEach((section, si) => {
  const params = section.geometry.parameters;
  if (!params || params.radiusTop === undefined) return;
  const radius = Math.max(params.radiusTop, params.radiusBottom || params.radiusTop);
  const h = params.height;
  const centerX = towerGroup.position.x + section.position.x;
  const centerY = towerGroup.position.y + section.position.y;
  const centerZ = towerGroup.position.z + section.position.z;
  const BOTTOM_INSET = 0.25;
  const TOP_INSET = 0.2;
  const minY = centerY - h / 2 + BOTTOM_INSET;
  const maxY = centerY + h / 2 - TOP_INSET;
  const rows = Math.max(1, Math.floor((maxY - minY) / 0.45));
  const cols = 8;
  const seed = (100 + si) * 137;
  let winCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const hash = ((seed + r * 17 + c * 53) * 2654435761) >>> 0;
      if ((hash % 100) < 40) continue;
      const angle = (c / cols) * Math.PI * 2;
      const yPos = minY + (r + 0.5) * ((maxY - minY) / rows);
      const t = (yPos - (centerY - h / 2)) / h;
      const localRadius = params.radiusBottom + (params.radiusTop - params.radiusBottom) * t;
      const wx = centerX + Math.cos(angle) * (localRadius + 0.01);
      const wz = centerZ + Math.sin(angle) * (localRadius + 0.01);
      const winGeo = new THREE.PlaneGeometry(0.1, 0.15);
      const matIdx = hash % 3;
      const winMesh = new THREE.Mesh(winGeo, windowMaterials[matIdx].clone());
      winMesh.position.set(wx, yPos, wz);
      winMesh.rotation.y = -angle + Math.PI / 2;
      winMesh.userData.winFlickerPhase = (hash % 628) / 100;
      winMesh.userData.winFlickerSpeed = 0.3 + (hash % 50) / 100;
      winMesh.userData.winBaseIntensity = 0.5 + (hash % 50) / 100;
      winMesh.name = `window_tower_${si}_${winCount}`;
      cityGroup.add(winMesh);
      allWindowMeshes.push(winMesh);
      winCount++;
    }
  }
});

addWindowLights(dcGroup, 200);

let windowTargetOpacity = 0.0;
let windowCurrentOpacity = 0.0;

// ---- GRID ----
const gridHelper = new THREE.GridHelper(39, 60, 0xe0e0e0, 0xe8e8e8);
gridHelper.name = 'gridOverlay';
gridHelper.position.y = 0.16;
gridHelper.material.opacity = 0.3;
gridHelper.material.transparent = true;
cityGroup.add(gridHelper);

// ==============================================================
// ====  GRID-ALIGNED ENERGY FLOW ROUTING SYSTEM  ==============
// ==============================================================

const FLOW_Y = 0.35;

const energyNodes = {
  windFarm: new THREE.Vector3(-16, FLOW_Y, -3),
  solarField: new THREE.Vector3(-3, FLOW_Y, -14),
  lngTerminal: new THREE.Vector3(-10, FLOW_Y, 5.5),
  jnWestCoast: new THREE.Vector3(-8, FLOW_Y, -3),
  jnWestMain: new THREE.Vector3(-8, FLOW_Y, -5.5),
  jnSolarNorth: new THREE.Vector3(-3, FLOW_Y, -5.5),
  jnCenterNorth: new THREE.Vector3(0, FLOW_Y, -5.5),
  jnCenterMid: new THREE.Vector3(0, FLOW_Y, 3),
  jnTowerWest: new THREE.Vector3(5, FLOW_Y, -5.5),
  jnTowerNode: new THREE.Vector3(5, FLOW_Y, -1),
  jnVppApproach: new THREE.Vector3(8, FLOW_Y, -5.5),
  jnEastMain: new THREE.Vector3(9, FLOW_Y, -5.5),
  jnEastMid: new THREE.Vector3(9, FLOW_Y, 3),
  jnEastIndustry: new THREE.Vector3(13, FLOW_Y, 3),
  jnLngJunction: new THREE.Vector3(-8, FLOW_Y, 5.5),
  jnResWest: new THREE.Vector3(-2, FLOW_Y, 6),
  jnResMid: new THREE.Vector3(0, FLOW_Y, 6),
  jnResEast: new THREE.Vector3(5, FLOW_Y, 7),
  jnDCApproach: new THREE.Vector3(5, FLOW_Y, 10),
  jnBridge: new THREE.Vector3(-8, FLOW_Y, -10),
  jnSatApproach: new THREE.Vector3(15, FLOW_Y, -5.5),
  jnChimney: new THREE.Vector3(17, FLOW_Y, 3),
  jnChimneyEnd: new THREE.Vector3(17, FLOW_Y, 8),
  vppCenter: new THREE.Vector3(8, FLOW_Y, -3),
  mainTower: new THREE.Vector3(5, FLOW_Y, -1),
  downtown: new THREE.Vector3(5.5, FLOW_Y, -1),
  industrialZone: new THREE.Vector3(13, FLOW_Y, 5),
  dataCenter: new THREE.Vector3(5, FLOW_Y, 14),
  satellite: new THREE.Vector3(15, FLOW_Y, -6),
  chimney: new THREE.Vector3(17, FLOW_Y, 8),
  bridgeEnd: new THREE.Vector3(-8, FLOW_Y, -10),
  residential1: new THREE.Vector3(-2, FLOW_Y, 6),
  residential2: new THREE.Vector3(5, FLOW_Y, 7),
};

const TIER_RADIUS = { 1: 0.14, 2: 0.10, 3: 0.07 };
const TIER_GLOW = { 1: 0.38, 2: 0.28, 3: 0.20 };

breathingBuildingTargets.forEach((group) => {
  const footprint = group.userData.footprint;
  const center = footprint
    ? new THREE.Vector3(footprint.x, 0, footprint.z)
    : group.position.clone();
  let minDistance = Infinity;
  Object.values(energyNodes).forEach((node) => {
    const dx = center.x - node.x;
    const dz = center.z - node.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    if (distance < minDistance) minDistance = distance;
  });
  group.userData.nearEnergy = minDistance < 3.8;
});

const flowPaths = [
  { waypoints: ['windFarm', 'jnWestCoast', 'jnWestMain', 'jnCenterNorth', 'jnTowerWest', 'jnVppApproach', 'vppCenter'], color: 0x7fd7ff, speed: 0.22, tier: 1, label: 'Wind → VPP', power: '18 MW' },
  { waypoints: ['windFarm', 'jnWestCoast', 'jnLngJunction', 'lngTerminal'], color: 0xffb3cf, speed: 0.19, tier: 2, label: 'Wind → LNG', power: '6 MW' },
  { waypoints: ['solarField', 'jnSolarNorth', 'jnTowerWest', 'jnTowerNode', 'downtown'], color: 0xa8e6a1, speed: 0.24, tier: 1, label: 'Solar → Downtown', power: '12 MW' },
  { waypoints: ['solarField', 'jnSolarNorth', 'jnWestMain', 'jnBridge'], color: 0xffe48a, speed: 0.16, tier: 3, label: 'Solar → Bridge', power: '3 MW' },
  { waypoints: ['vppCenter', 'jnVppApproach', 'jnEastMain', 'jnEastMid', 'jnEastIndustry', 'industrialZone'], color: 0xb7c8ff, speed: 0.2, tier: 1, label: 'VPP → Industrial', power: '14 MW' },
  { waypoints: ['vppCenter', 'jnVppApproach', 'jnEastMain', 'jnEastMid', 'jnCenterMid', 'jnResMid', 'jnResEast', 'jnDCApproach', 'dataCenter'], color: 0x9ff0df, speed: 0.23, tier: 1, label: 'VPP → Data Center', power: '22 MW' },
  { waypoints: ['lngTerminal', 'jnLngJunction', 'jnWestCoast', 'jnWestMain', 'jnCenterNorth', 'jnCenterMid', 'jnResWest'], color: 0xffc98f, speed: 0.18, tier: 2, label: 'LNG → Residential', power: '8 MW' },
  { waypoints: ['downtown', 'jnTowerWest', 'jnVppApproach', 'jnEastMain', 'jnSatApproach', 'satellite'], color: 0xe2b7ff, speed: 0.22, tier: 3, label: 'Data → Satellite', power: '2 MW' },
  { waypoints: ['jnResWest', 'jnResMid', 'jnResEast', 'jnDCApproach', 'dataCenter'], color: 0xc9f59a, speed: 0.17, tier: 3, label: 'Residential → DC', power: '5 MW' },
  { waypoints: ['industrialZone', 'jnEastIndustry', 'jnChimney', 'jnChimneyEnd'], color: 0xffd88f, speed: 0.14, tier: 3, label: 'Industrial → Exhaust', power: '4 MW' },
];

function buildRouteCurve(waypointKeys) {
  const raw = waypointKeys.map(k => energyNodes[k].clone());
  const FILLET_R = 0.55;
  const points = [];
  for (let i = 0; i < raw.length; i++) {
    if (i === 0 || i === raw.length - 1) { points.push(raw[i]); continue; }
    const prev = raw[i - 1], curr = raw[i], next = raw[i + 1];
    const dIn = new THREE.Vector3().subVectors(curr, prev);
    const dOut = new THREE.Vector3().subVectors(next, curr);
    const lenIn = dIn.length(), lenOut = dOut.length();
    const r = Math.min(FILLET_R, lenIn * 0.4, lenOut * 0.4);
    const dirIn = dIn.clone().normalize();
    const dirOut = dOut.clone().normalize();
    const filletStart = curr.clone().sub(dirIn.clone().multiplyScalar(r));
    const filletEnd = curr.clone().add(dirOut.clone().multiplyScalar(r));
    points.push(filletStart);
    for (let t = 0.25; t <= 0.75; t += 0.25) {
      const p = new THREE.Vector3().lerpVectors(filletStart, filletEnd, t);
      const toCorner = curr.clone().sub(p).multiplyScalar(0.42);
      p.add(toCorner);
      points.push(p);
    }
    points.push(filletEnd);
  }
  return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.0);
}

const flowCurves = flowPaths.map(fp => buildRouteCurve(fp.waypoints));

const flowVertShader = `
  attribute float aProgress;
  varying float vProgress;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  void main() {
    vProgress = aProgress;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const flowFragShader = `
  uniform vec3 uColor;
  uniform vec3 uColorAlt;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uBaseAlpha;
  uniform float uHighlight;
  uniform float uReveal;
  uniform float uBrightness;
  varying float vProgress;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  void main() {
    float flow = fract(vProgress - uTime * uSpeed);
    float pulse1 = smoothstep(0.0, 0.10, flow) * smoothstep(0.30, 0.10, flow);
    float pulse2 = smoothstep(0.0, 0.08, fract(flow + 0.5)) * smoothstep(0.20, 0.08, fract(flow + 0.5)) * 0.5;
    float pulse = pulse1 + pulse2;
    float fresnel = 1.0 - abs(dot(vWorldNormal, vViewDir));
    fresnel = pow(fresnel, 1.2);
    float dimFactor = uHighlight < -0.2 ? 0.08 : 1.0;
    float alpha = (uBaseAlpha + pulse * 0.42 + max(0.0, uHighlight) * 0.24) * dimFactor;
    alpha *= uBrightness;
    alpha *= (0.7 + fresnel * 0.34);
    float revealHead = smoothstep(0.0, 0.05, uReveal);
    float revealMask = revealHead * (1.0 - smoothstep(uReveal, min(1.0, uReveal + 0.06), vProgress));
    alpha *= revealMask;
    vec3 gradientColor = mix(uColor, uColorAlt, smoothstep(0.1, 0.9, vProgress));
    vec3 brightColor = mix(gradientColor, uColorAlt, 0.45);
    vec3 col = mix(gradientColor, brightColor, pulse * 0.55 + max(0.0, uHighlight) * 0.35);
    vec3 whiteCore = vec3(0.96, 0.99, 1.0);
    col = mix(col, whiteCore, pulse1 * 0.12);
    col *= mix(0.82, 1.55, clamp(uBrightness, 0.0, 2.4) / 2.4);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
  }
`;

const glowFragShader = `
  uniform vec3 uColor;
  uniform vec3 uColorAlt;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uHighlight;
  uniform float uReveal;
  uniform float uGlowStrength;
  varying float vProgress;
  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  void main() {
    float flow = fract(vProgress - uTime * uSpeed);
    float pulse1 = smoothstep(0.0, 0.15, flow) * smoothstep(0.35, 0.15, flow);
    float pulse2 = smoothstep(0.0, 0.10, fract(flow + 0.5)) * smoothstep(0.25, 0.10, fract(flow + 0.5)) * 0.4;
    float pulse = pulse1 + pulse2;
    float fresnel = 1.0 - abs(dot(vWorldNormal, vViewDir));
    fresnel = pow(fresnel, 0.5);
    float dimFactor = uHighlight < -0.2 ? 0.05 : 1.0;
    float alpha = (0.08 + pulse * 0.18 + max(0.0, uHighlight) * 0.12) * fresnel * dimFactor;
    alpha += pulse * 0.04;
    alpha *= uGlowStrength;
    float revealHead = smoothstep(0.0, 0.05, uReveal);
    float revealMask = revealHead * (1.0 - smoothstep(uReveal, min(1.0, uReveal + 0.08), vProgress));
    alpha *= revealMask;
    vec3 gradientColor = mix(uColor, uColorAlt, smoothstep(0.1, 0.9, vProgress));
    vec3 col = gradientColor * (0.78 + pulse * 0.42) * mix(0.75, 1.8, clamp(uGlowStrength, 0.0, 2.5) / 2.5);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.85));
  }
`;

function addProgressAttribute(tubeGeo, segmentCount, radialSegments) {
  const vertCount = tubeGeo.attributes.position.count;
  const progress = new Float32Array(vertCount);
  const ringSize = radialSegments + 1;
  const ringCount = segmentCount + 1;
  for (let ring = 0; ring < ringCount; ring++) {
    const prog = ring / segmentCount;
    for (let rv = 0; rv < ringSize; rv++) {
      const idx = ring * ringSize + rv;
      if (idx < vertCount) progress[idx] = prog;
    }
  }
  tubeGeo.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1));
}

const energyFlowGroup = new THREE.Group();
energyFlowGroup.name = 'energyFlowGroup';
scene.add(energyFlowGroup);

const flowLineObjects = [];
const flowVisualControls = {
  primaryTint: '#ffffff',
  secondaryTint: '#dfffff',
  tintStrength: 0.0,
  lineBrightness: 1.18,
  glowBrightness: 1.38,
  particleBrightness: 1.12,
  speedMultiplier: 1.0,
};

flowPaths.forEach((path, pathIndex) => {
  const curve = flowCurves[pathIndex];
  const tier = path.tier;
  const radius = TIER_RADIUS[tier];
  const glowRadius = TIER_GLOW[tier];
  const pathColor = new THREE.Color(path.color);
  const altColor = pathColor.clone().lerp(pathIndex % 2 === 0 ? citySoftGreenBright : citySoftBlueBright, 0.55);
  const segments = 120;
  const radial = 6;
  const glowRadial = 8;

  const tubeGeo = new THREE.TubeGeometry(curve, segments, radius, radial, false);
  addProgressAttribute(tubeGeo, segments, radial);
  const coreMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: pathColor.clone() },
      uColorAlt: { value: altColor.clone() },
      uTime: { value: 0 },
      uSpeed: { value: path.speed },
      uBaseAlpha: { value: tier === 1 ? 0.54 : tier === 2 ? 0.42 : 0.32 },
      uHighlight: { value: 0.0 },
      uReveal: { value: 0.0 },
      uBrightness: { value: flowVisualControls.lineBrightness },
    },
    vertexShader: flowVertShader, fragmentShader: flowFragShader,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const coreMesh = new THREE.Mesh(tubeGeo, coreMat);
  coreMesh.name = `energyFlow_${pathIndex}`;
  coreMesh.renderOrder = 2;
  coreMesh.userData = {
    pathIndex,
    isFlowLine: true,
    baseAlpha: tier === 1 ? 0.54 : tier === 2 ? 0.42 : 0.32,
    baseSpeed: path.speed,
    baseColor: pathColor.clone(),
    baseAltColor: altColor.clone(),
  };
  energyFlowGroup.add(coreMesh);
  flowLineObjects.push({ obj: coreMesh, isMain: true, pathIndex });

  const glowGeo = new THREE.TubeGeometry(curve, segments, glowRadius, glowRadial, false);
  addProgressAttribute(glowGeo, segments, glowRadial);
  const glowMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: pathColor.clone() },
      uColorAlt: { value: altColor.clone() },
      uTime: { value: 0 },
      uSpeed: { value: path.speed },
      uHighlight: { value: 0.0 },
      uReveal: { value: 0.0 },
      uGlowStrength: { value: flowVisualControls.glowBrightness },
    },
    vertexShader: flowVertShader, fragmentShader: glowFragShader,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const glowMesh = new THREE.Mesh(glowGeo, glowMat);
  glowMesh.name = `energyGlow_${pathIndex}`;
  glowMesh.renderOrder = 1;
  glowMesh.userData = {
    pathIndex,
    isFlowGlow: true,
    baseSpeed: path.speed,
    baseColor: pathColor.clone(),
    baseAltColor: altColor.clone(),
  };
  energyFlowGroup.add(glowMesh);
  flowLineObjects.push({ obj: glowMesh, isMain: false, pathIndex });
});

// Flow particles
const flowParticleData = [];
flowPaths.forEach((path, pathIndex) => {
  const curve = flowCurves[pathIndex];
  const numParticles = path.tier === 1 ? 6 : path.tier === 2 ? 4 : 3;
  const particleSize = path.tier === 1 ? 0.13 : path.tier === 2 ? 0.10 : 0.07;
  for (let i = 0; i < numParticles; i++) {
    const particleGeo = new THREE.SphereGeometry(particleSize, 6, 4);
    const particleColor = new THREE.Color(path.color);
    const particleMat = new THREE.MeshBasicMaterial({
      color: particleColor, transparent: true, opacity: 0.95,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const particle = new THREE.Mesh(particleGeo, particleMat);
    particle.name = `flowParticle_${pathIndex}_${i}`;
    energyFlowGroup.add(particle);
    flowParticleData.push({ mesh: particle, curve, offset: i / numParticles, speed: path.speed * 0.35, pathIndex, baseColor: particleColor.clone() });
  }
});

function syncFlowVisuals() {
  const primaryTint = new THREE.Color(flowVisualControls.primaryTint);
  const secondaryTint = new THREE.Color(flowVisualControls.secondaryTint);
  flowLineObjects.forEach(({ obj, isMain }) => {
    const uniforms = obj.material?.uniforms;
    const baseColor = obj.userData.baseColor;
    const baseAltColor = obj.userData.baseAltColor;
    if (uniforms?.uColor && baseColor) {
      uniforms.uColor.value.copy(baseColor).lerp(primaryTint, flowVisualControls.tintStrength);
    }
    if (uniforms?.uColorAlt && baseAltColor) {
      uniforms.uColorAlt.value.copy(baseAltColor).lerp(secondaryTint, flowVisualControls.tintStrength);
    }
    if (uniforms?.uBrightness && isMain) {
      uniforms.uBrightness.value = flowVisualControls.lineBrightness;
    }
    if (uniforms?.uGlowStrength && !isMain) {
      uniforms.uGlowStrength.value = flowVisualControls.glowBrightness;
    }
  });

  flowParticleData.forEach((particleData) => {
    particleData.mesh.material.color
      .copy(particleData.baseColor)
      .lerp(primaryTint, flowVisualControls.tintStrength * 0.55);
  });
}

const flowPanel = document.createElement('div');
flowPanel.style.cssText = `
  position: fixed;
  right: 16px;
  bottom: 74px;
  width: 220px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(170, 190, 210, 0.42);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.10);
  backdrop-filter: blur(14px);
  font-family: "Inter", "Segoe UI", sans-serif;
  color: #607287;
  z-index: 1100;
  box-sizing: border-box;
  display: none;
`;

const flowPanelTitle = document.createElement('div');
flowPanelTitle.textContent = 'Flow Controls';
flowPanelTitle.style.cssText = `
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 12px;
  color: #6b7f95;
`;
flowPanel.appendChild(flowPanelTitle);

function addFlowPanelRow(labelText, control) {
  const row = document.createElement('label');
  row.style.cssText = `
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 12px;
  `;
  const label = document.createElement('span');
  label.textContent = labelText;
  label.style.color = '#687b90';
  row.appendChild(label);
  row.appendChild(control);
  flowPanel.appendChild(row);
}

function createFlowSlider(value, min, max, step, onInput) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 136px;
  `;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.style.cssText = `width: 100%; accent-color: #88b8e8;`;
  const valueLabel = document.createElement('span');
  valueLabel.textContent = Number(value).toFixed(step < 0.01 ? 3 : 2);
  valueLabel.style.cssText = `
    min-width: 42px;
    text-align: right;
    color: #516274;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `;
  input.addEventListener('input', () => {
    const nextValue = Number(input.value);
    valueLabel.textContent = nextValue.toFixed(step < 0.01 ? 3 : 2);
    onInput(nextValue);
  });
  wrapper.appendChild(input);
  wrapper.appendChild(valueLabel);
  return wrapper;
}

function createFlowColorInput(value, onInput) {
  const input = document.createElement('input');
  input.type = 'color';
  input.value = value;
  input.style.cssText = 'width:48px;height:28px;border:none;background:transparent;padding:0;';
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

addFlowPanelRow('Primary Tint', createFlowColorInput(flowVisualControls.primaryTint, (value) => {
  flowVisualControls.primaryTint = value;
  syncFlowVisuals();
}));

addFlowPanelRow('Secondary Tint', createFlowColorInput(flowVisualControls.secondaryTint, (value) => {
  flowVisualControls.secondaryTint = value;
  syncFlowVisuals();
}));

addFlowPanelRow('Tint Strength', createFlowSlider(flowVisualControls.tintStrength, 0, 1, 0.01, (value) => {
  flowVisualControls.tintStrength = value;
  syncFlowVisuals();
}));

addFlowPanelRow('Line Brightness', createFlowSlider(flowVisualControls.lineBrightness, 0.2, 2.4, 0.01, (value) => {
  flowVisualControls.lineBrightness = value;
  syncFlowVisuals();
}));

addFlowPanelRow('Glow Brightness', createFlowSlider(flowVisualControls.glowBrightness, 0.2, 2.5, 0.01, (value) => {
  flowVisualControls.glowBrightness = value;
  syncFlowVisuals();
}));

addFlowPanelRow('Particle Brightness', createFlowSlider(flowVisualControls.particleBrightness, 0.2, 2.4, 0.01, (value) => {
  flowVisualControls.particleBrightness = value;
}));

addFlowPanelRow('Flow Speed', createFlowSlider(flowVisualControls.speedMultiplier, 0.4, 2.5, 0.01, (value) => {
  flowVisualControls.speedMultiplier = value;
}));

syncFlowVisuals();

let selectedEditableMesh = null;
let selectedEditableTargets = [];

function getEditableTargets(mesh) {
  if (!mesh) return [];
  if (mesh.userData?.editableKind === 'pv-panel') {
    if (mesh.name?.startsWith('solarFieldPanel_')) {
      return allSolarPanelMeshes;
    }
    if (mesh.name?.startsWith('roofSolar_')) {
      return allRoofPanelMeshes;
    }
  }
  return [mesh];
}

function ensureUniqueEditableMaterial(mesh) {
  if (!mesh?.material) return;
  if (Array.isArray(mesh.material)) {
    mesh.material = mesh.material.map((material) => {
      if (!material) return material;
      if (material.userData?.selectionUnique) return material;
      const clone = material.clone();
      clone.userData = { ...(clone.userData || {}), selectionUnique: true };
      return clone;
    });
    return;
  }
  if (mesh.material.userData?.selectionUnique) return;
  const clone = mesh.material.clone();
  clone.userData = { ...(clone.userData || {}), selectionUnique: true };
  mesh.material = clone;
}

function getEditableMaterial(mesh) {
  if (!mesh?.material) return null;
  return Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
}

const selectedElementPanel = document.createElement('div');
selectedElementPanel.style.cssText = `
  position: fixed;
  left: 16px;
  bottom: 74px;
  width: 228px;
  padding: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.84);
  border: 1px solid rgba(170, 190, 210, 0.42);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.10);
  backdrop-filter: blur(14px);
  font-family: "Inter", "Segoe UI", sans-serif;
  color: #607287;
  z-index: 1100;
  box-sizing: border-box;
  display: none;
`;

const selectedElementTitle = document.createElement('div');
selectedElementTitle.textContent = 'Selected Element';
selectedElementTitle.style.cssText = `
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #6b7f95;
`;
selectedElementPanel.appendChild(selectedElementTitle);

const selectedElementName = document.createElement('div');
selectedElementName.style.cssText = `
  font-size: 12px;
  font-weight: 600;
  color: #55687b;
  margin-bottom: 10px;
  min-height: 16px;
`;
selectedElementPanel.appendChild(selectedElementName);

function addSelectedElementRow(labelText, control) {
  const row = document.createElement('label');
  row.style.cssText = `
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
    font-size: 12px;
  `;
  const label = document.createElement('span');
  label.textContent = labelText;
  label.style.color = '#687b90';
  row.appendChild(label);
  row.appendChild(control);
  selectedElementPanel.appendChild(row);
}

function createSelectedColorInput(onInput) {
  const input = document.createElement('input');
  input.type = 'color';
  input.style.cssText = 'width:48px;height:28px;border:none;background:transparent;padding:0;';
  input.addEventListener('input', () => onInput(input.value));
  return input;
}

function createSelectedSlider(min, max, step, onInput) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    width: 136px;
  `;
  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.style.cssText = `width: 100%; accent-color: #88b8e8;`;
  const valueLabel = document.createElement('span');
  valueLabel.style.cssText = `
    min-width: 42px;
    text-align: right;
    color: #516274;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  `;
  input.addEventListener('input', () => {
    const nextValue = Number(input.value);
    valueLabel.textContent = nextValue.toFixed(step < 0.01 ? 3 : 2);
    onInput(nextValue);
  });
  wrapper.appendChild(input);
  wrapper.appendChild(valueLabel);
  wrapper.rangeInput = input;
  wrapper.valueLabel = valueLabel;
  return wrapper;
}

const selectedBaseColorInput = createSelectedColorInput((value) => {
  if (!selectedEditableTargets.length) return;
  selectedEditableTargets.forEach((mesh) => {
    ensureUniqueEditableMaterial(mesh);
    const material = getEditableMaterial(mesh);
    if (material?.color) {
      material.color.set(value);
    }
    if (mesh.userData?.editableKind === 'pv-panel' && material?.emissive) {
      material.emissive.set(value);
    }
  });
});
addSelectedElementRow('Base Color', selectedBaseColorInput);

const selectedEmissiveColorInput = createSelectedColorInput((value) => {
  if (!selectedEditableTargets.length) return;
  selectedEditableTargets.forEach((mesh) => {
    ensureUniqueEditableMaterial(mesh);
    const material = getEditableMaterial(mesh);
    if (material?.emissive) {
      material.emissive.set(value);
    }
  });
});
addSelectedElementRow('Emissive', selectedEmissiveColorInput);

const selectedEmissiveSlider = createSelectedSlider(0, 3, 0.01, (value) => {
  if (!selectedEditableTargets.length) return;
  selectedEditableTargets.forEach((mesh) => {
    ensureUniqueEditableMaterial(mesh);
    const material = getEditableMaterial(mesh);
    if ('emissiveIntensity' in (material || {})) {
      material.emissiveIntensity = value;
    }
  });
});
addSelectedElementRow('Glow', selectedEmissiveSlider);

const selectedRoughnessSlider = createSelectedSlider(0, 1, 0.01, (value) => {
  if (!selectedEditableTargets.length) return;
  selectedEditableTargets.forEach((mesh) => {
    ensureUniqueEditableMaterial(mesh);
    const material = getEditableMaterial(mesh);
    if ('roughness' in (material || {})) {
      material.roughness = value;
    }
  });
});
addSelectedElementRow('Roughness', selectedRoughnessSlider);

function syncSelectedElementPanel() {
  selectedElementPanel.style.display = 'none';
  return;
  const material = getEditableMaterial(selectedEditableMesh);
  if (!selectedEditableMesh || !material) {
    selectedElementPanel.style.display = 'none';
    return;
  }

  selectedElementPanel.style.display = 'block';
  const selectionLabel = selectedEditableMesh.userData?.editableKind === 'pv-panel'
    ? (selectedEditableMesh.name?.startsWith('solarFieldPanel_') ? 'PV Field' : 'Roof PV')
    : (selectedEditableMesh.name || selectedEditableMesh.parent?.name || 'Unnamed Mesh');
  selectedElementName.textContent = selectedEditableTargets.length > 1 ? `${selectionLabel} (${selectedEditableTargets.length})` : selectionLabel;
  selectedBaseColorInput.value = material.color?.getStyle ? `#${material.color.getHexString()}` : '#ffffff';
  selectedEmissiveColorInput.value = material.emissive?.getStyle ? `#${material.emissive.getHexString()}` : '#000000';

  const emissiveIntensity = Number.isFinite(material.emissiveIntensity) ? material.emissiveIntensity : 0;
  selectedEmissiveSlider.rangeInput.value = String(emissiveIntensity);
  selectedEmissiveSlider.valueLabel.textContent = emissiveIntensity.toFixed(2);

  const roughness = Number.isFinite(material.roughness) ? material.roughness : 0;
  selectedRoughnessSlider.rangeInput.value = String(roughness);
  selectedRoughnessSlider.valueLabel.textContent = roughness.toFixed(2);
}

function selectEditableMesh(mesh) {
  selectedEditableMesh = mesh;
  selectedEditableTargets = getEditableTargets(mesh);
  syncSelectedElementPanel();
}

function clearSelectedEditableMesh() {
  selectedEditableMesh = null;
  selectedEditableTargets = [];
  selectedElementPanel.style.display = 'none';
}

function collectEditablePlaneMeshes() {
  const meshes = [];
  cityGroup.traverse((child) => {
    if (!child.isMesh) return;
    if (!child.visible) return;
    if (child.userData?.epilogueUnit) return;
    if (child.userData?.nonEditable) return;
    if (child.name?.startsWith('energyFlow_') || child.name?.startsWith('energyGlow_')) return;
    meshes.push(child);
  });
  return meshes;
}


// Junction node markers
const junctionNodeKeys = [
  'jnWestCoast', 'jnWestMain', 'jnSolarNorth', 'jnCenterNorth',
  'jnCenterMid', 'jnTowerWest', 'jnVppApproach', 'jnEastMain',
  'jnEastMid', 'jnEastIndustry', 'jnLngJunction', 'jnResMid',
  'jnResEast', 'jnDCApproach', 'jnSatApproach', 'jnChimney',
];

junctionNodeKeys.forEach((key, i) => {
  const pos = energyNodes[key];
  const ringGeo = new THREE.RingGeometry(0.15, 0.30, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff, transparent: true, opacity: 0.30, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos); ring.position.y += 0.01; ring.rotation.x = -Math.PI / 2;
  ring.name = `junctionRing_${i}`;
  energyFlowGroup.add(ring);
  const dotGeo = new THREE.CircleGeometry(0.09, 12);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x18ffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  dot.position.copy(pos); dot.position.y += 0.02; dot.rotation.x = -Math.PI / 2;
  dot.name = `junctionDot_${i}`;
  energyFlowGroup.add(dot);
});

// ---- INTERACTIVE NODE SYSTEM ----
const interactiveNodeDefs = [
  { key: 'vppCenter', label: 'VPP Control Center', sublabel: 'Virtual Power Plant Hub', connectedPaths: [0, 4, 5], icon: '⚡' },
  { key: 'mainTower', label: 'Control Tower', sublabel: 'City Energy Backbone', connectedPaths: [0, 2], icon: '🏗' },
  { key: 'windFarm', label: 'Offshore Wind Farm', sublabel: 'Renewable Generation', connectedPaths: [0, 1], icon: '💨' },
  { key: 'solarField', label: 'Solar Array', sublabel: 'Photovoltaic Field', connectedPaths: [2, 3], icon: '☀️' },
  { key: 'dataCenter', label: 'Data Center', sublabel: 'Processing & Storage', connectedPaths: [5, 8], icon: '🖥' },
  { key: 'lngTerminal', label: 'LNG Terminal', sublabel: 'Natural Gas Reserve', connectedPaths: [1, 6], icon: '🔋' },
  { key: 'industrialZone', label: 'Industrial Zone', sublabel: 'Manufacturing District', connectedPaths: [4, 9], icon: '🏭' },
  { key: 'satellite', label: 'Satellite Uplink', sublabel: 'Communications Relay', connectedPaths: [7], icon: '📡' },
  { key: 'downtown', label: 'Downtown Core', sublabel: 'Commercial District', connectedPaths: [2, 7], icon: '🏢' },
  { key: 'residential1', label: 'Residential West', sublabel: 'Smart Housing Zone', connectedPaths: [6, 8], icon: '🏠' },
];

const nodeHitTargets = [];
const nodeGlowObjects = [];

interactiveNodeDefs.forEach((nodeDef, i) => {
  const pos = energyNodes[nodeDef.key];
  const hitGeo = new THREE.SphereGeometry(0.8, 12, 8);
  const hitMat = new THREE.MeshBasicMaterial({ visible: false });
  const hitSphere = new THREE.Mesh(hitGeo, hitMat);
  hitSphere.position.copy(pos); hitSphere.position.y += 0.3;
  hitSphere.name = `nodeHit_${nodeDef.key}`;
  hitSphere.userData = { nodeIndex: i, nodeDef };
  scene.add(hitSphere);
  nodeHitTargets.push(hitSphere);

  const ringGeo = new THREE.RingGeometry(0.28, 0.52, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.40, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.copy(pos); ring.position.y += 0.02; ring.rotation.x = -Math.PI / 2;
  ring.name = `nodeGlow_${i}`;
  energyFlowGroup.add(ring);
  nodeGlowObjects.push({ mesh: ring, baseOpacity: 0.2, type: 'ring', nodeIndex: i });

  const dotGeo = new THREE.CircleGeometry(0.16, 16);
  const dotMat = new THREE.MeshBasicMaterial({ color: 0x18ffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
  const dot = new THREE.Mesh(dotGeo, dotMat);
  dot.position.copy(pos); dot.position.y += 0.03; dot.rotation.x = -Math.PI / 2;
  dot.name = `nodeDot_${i}`;
  energyFlowGroup.add(dot);
  nodeGlowObjects.push({ mesh: dot, baseOpacity: 0.35, type: 'dot', nodeIndex: i });
});

// ---- TOOLTIP ----
const tooltip = document.createElement('div');
tooltip.id = 'energyTooltip';
tooltip.style.cssText = `position:fixed;pointer-events:none;background:rgba(10,14,20,0.92);backdrop-filter:blur(12px);border:1px solid rgba(0,191,165,0.2);border-radius:8px;padding:12px 16px;font-family:'Inter',system-ui,sans-serif;color:#fff;font-size:12px;line-height:1.5;opacity:0;transform:translateY(6px);transition:opacity 0.25s ease,transform 0.25s ease;z-index:1000;min-width:180px;box-sizing:border-box;`;
document.body.appendChild(tooltip);

function showTooltip(nodeDef, screenX, screenY) {
  const pathLines = nodeDef.connectedPaths.map(pi => {
    const p = flowPaths[pi];
    return `<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:3px 0;">
      <span style="color:rgba(255,255,255,0.6);font-size:11px;">${p.label}</span>
      <span style="color:#${new THREE.Color(p.color).getHexString()};font-weight:600;font-size:11px;">${p.power}</span>
    </div>`;
  }).join('');
  tooltip.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
      <span style="font-size:16px;">${nodeDef.icon}</span>
      <div>
        <div style="font-weight:600;font-size:13px;color:#fff;letter-spacing:0.3px;">${nodeDef.label}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:0.5px;text-transform:uppercase;">${nodeDef.sublabel}</div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(0,191,165,0.15);margin:6px 0 4px;"></div>
    <div style="font-size:10px;color:rgba(0,191,165,0.7);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Energy Flows</div>
    ${pathLines}
  `;
  let tx = screenX + 18, ty = screenY - 20;
  if (tx + 200 > window.innerWidth - 16) tx = screenX - 218;
  if (ty + 120 > window.innerHeight - 16) ty = window.innerHeight - 136;
  if (ty < 16) ty = 16;
  tooltip.style.left = tx + 'px';
  tooltip.style.top = ty + 'px';
  tooltip.style.opacity = '1';
  tooltip.style.transform = 'translateY(0)';
}

function hideTooltip() {
  tooltip.style.opacity = '0';
  tooltip.style.transform = 'translateY(6px)';
}

// ---- HOUSE DASHBOARD ----
let houseDashboardVisible = false;
let houseDashboardEl = null;

function createHouseDashboard() {
  const dash = document.createElement('div');
  dash.id = 'houseDashboard';
  dash.style.cssText = `
    position: fixed;
    pointer-events: auto;
    font-family: 'Inter', system-ui, sans-serif;
    z-index: 1001;
    opacity: 0;
    transform: translateX(20px) scale(0.96);
    transition: opacity 0.45s cubic-bezier(0.22,1,0.36,1), transform 0.45s cubic-bezier(0.22,1,0.36,1);
    width: 220px;
    background: rgba(8, 12, 20, 0.88);
    backdrop-filter: blur(16px);
    border: 1px solid rgba(0, 136, 255, 0.15);
    border-radius: 10px;
    padding: 16px;
    box-sizing: border-box;
    color: #fff;
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `display:flex;align-items:center;gap:8px;margin-bottom:12px;`;
  header.innerHTML = `
    <div style="width:6px;height:6px;border-radius:50%;background:#0088ff;box-shadow:0 0 8px rgba(0,136,255,0.6);"></div>
    <div style="font-size:11px;font-weight:600;letter-spacing:1.2px;text-transform:uppercase;color:rgba(0,170,255,0.85);">Smart Home</div>
  `;
  dash.appendChild(header);

  // Thin separator
  const sep1 = document.createElement('div');
  sep1.style.cssText = `height:1px;background:linear-gradient(90deg,rgba(0,136,255,0.25),transparent);margin-bottom:14px;`;
  dash.appendChild(sep1);

  // Widget: Temperature
  dash.appendChild(createWidget('Temperature', createBarBlock(0.72, '#0088ff'), '○'));
  // Widget: Humidity
  dash.appendChild(createWidget('Humidity', createBarBlock(0.55, '#00c8ff'), '◇'));
  // Widget: People Flow
  dash.appendChild(createWidget('People Flow', createDotGrid(), '△'));

  // Thin separator
  const sep2 = document.createElement('div');
  sep2.style.cssText = `height:1px;background:linear-gradient(90deg,rgba(0,136,255,0.15),transparent);margin:10px 0 12px;`;
  dash.appendChild(sep2);

  // Mini chart placeholder
  const chartSection = document.createElement('div');
  chartSection.style.cssText = `margin-bottom:10px;`;
  const chartLabel = document.createElement('div');
  chartLabel.style.cssText = `font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:8px;`;
  chartLabel.textContent = 'Energy Usage';
  chartSection.appendChild(chartLabel);
  chartSection.appendChild(createMiniChart());
  dash.appendChild(chartSection);

  // Status row
  const statusRow = document.createElement('div');
  statusRow.style.cssText = `display:flex;align-items:center;justify-content:space-between;`;
  const statusDot = document.createElement('div');
  statusDot.style.cssText = `display:flex;align-items:center;gap:5px;`;
  statusDot.innerHTML = `
    <div style="width:5px;height:5px;border-radius:50%;background:#00ff88;box-shadow:0 0 6px rgba(0,255,136,0.5);animation:statusPulse 2s ease-in-out infinite;"></div>
    <span style="font-size:9px;color:rgba(255,255,255,0.3);letter-spacing:0.8px;">ONLINE</span>
  `;
  const statusTime = document.createElement('div');
  statusTime.style.cssText = `font-size:9px;color:rgba(255,255,255,0.15);letter-spacing:0.5px;font-variant-numeric:tabular-nums;`;
  statusTime.textContent = '— : — : —';
  statusRow.appendChild(statusDot);
  statusRow.appendChild(statusTime);
  dash.appendChild(statusRow);

  // Add pulse animation keyframes
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes statusPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    @keyframes barShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(styleSheet);

  document.body.appendChild(dash);
  return dash;
}

function createWidget(label, contentEl, icon) {
  const widget = document.createElement('div');
  widget.style.cssText = `margin-bottom:12px;`;

  const row = document.createElement('div');
  row.style.cssText = `display:flex;align-items:center;gap:6px;margin-bottom:6px;`;

  const iconEl = document.createElement('span');
  iconEl.style.cssText = `font-size:9px;color:rgba(0,170,255,0.5);line-height:1;`;
  iconEl.textContent = icon;

  const labelEl = document.createElement('div');
  labelEl.style.cssText = `font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.25);`;
  labelEl.textContent = label;

  row.appendChild(iconEl);
  row.appendChild(labelEl);
  widget.appendChild(row);
  widget.appendChild(contentEl);
  return widget;
}

function createBarBlock(fillRatio, color) {
  const container = document.createElement('div');
  container.style.cssText = `display:flex;gap:3px;align-items:flex-end;height:24px;`;

  for (let i = 0; i < 8; i++) {
    const bar = document.createElement('div');
    const h = i < Math.floor(fillRatio * 8)
      ? 8 + Math.random() * 16
      : 3 + Math.random() * 5;
    const active = i < Math.floor(fillRatio * 8);
    bar.style.cssText = `
      width: 100%;
      flex: 1;
      height: ${h}px;
      border-radius: 2px;
      background: ${active
        ? `linear-gradient(180deg, ${color}, rgba(0,136,255,0.2))`
        : 'rgba(255,255,255,0.04)'};
      border: 1px solid ${active ? `${color}33` : 'rgba(255,255,255,0.04)'};
      transition: height 0.6s ease;
    `;
    container.appendChild(bar);
  }
  return container;
}

function createDotGrid() {
  const container = document.createElement('div');
  container.style.cssText = `display:grid;grid-template-columns:repeat(7,1fr);gap:4px;padding:2px 0;`;

  for (let i = 0; i < 21; i++) {
    const dot = document.createElement('div');
    const active = Math.random() > 0.5;
    dot.style.cssText = `
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: ${active ? 'rgba(0,170,255,0.5)' : 'rgba(255,255,255,0.06)'};
      ${active ? 'box-shadow: 0 0 4px rgba(0,170,255,0.3);' : ''}
      transition: background 0.5s ease;
    `;
    container.appendChild(dot);
  }
  return container;
}

function createMiniChart() {
  const canvas = document.createElement('canvas');
  canvas.width = 188;
  canvas.height = 36;
  canvas.style.cssText = `width:100%;height:36px;border-radius:4px;border:1px solid rgba(0,136,255,0.08);background:rgba(0,0,0,0.2);`;

  const ctx = canvas.getContext('2d');
  const points = [];
  for (let i = 0; i < 20; i++) {
    points.push(0.2 + Math.random() * 0.6);
  }

  // Draw fill
  ctx.beginPath();
  ctx.moveTo(0, 36);
  points.forEach((p, i) => {
    const x = (i / (points.length - 1)) * 188;
    const y = 36 - p * 30;
    if (i === 0) ctx.lineTo(x, y);
    else {
      const prevX = ((i - 1) / (points.length - 1)) * 188;
      const prevY = 36 - points[i - 1] * 30;
      const cpx = (prevX + x) / 2;
      ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
    }
  });
  ctx.lineTo(188, 36);
  ctx.closePath();
  const grad = ctx.createLinearGradient(0, 0, 0, 36);
  grad.addColorStop(0, 'rgba(0,136,255,0.15)');
  grad.addColorStop(1, 'rgba(0,136,255,0.01)');
  ctx.fillStyle = grad;
  ctx.fill();

  // Draw line
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = (i / (points.length - 1)) * 188;
    const y = 36 - p * 30;
    if (i === 0) ctx.moveTo(x, y);
    else {
      const prevX = ((i - 1) / (points.length - 1)) * 188;
      const prevY = 36 - points[i - 1] * 30;
      const cpx = (prevX + x) / 2;
      ctx.bezierCurveTo(cpx, prevY, cpx, y, x, y);
    }
  });
  ctx.strokeStyle = 'rgba(0,136,255,0.5)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  return canvas;
}

function showHouseDashboard() {
  if (!houseDashboardEl) {
    houseDashboardEl = createHouseDashboard();
  }
  // Position the dashboard next to the house in screen space
  positionDashboard();
  requestAnimationFrame(() => {
    houseDashboardEl.style.opacity = '1';
    houseDashboardEl.style.transform = 'translateX(0) scale(1)';
  });
  houseDashboardVisible = true;
}

function hideHouseDashboard() {
  if (houseDashboardEl) {
    houseDashboardEl.style.opacity = '0';
    houseDashboardEl.style.transform = 'translateX(20px) scale(0.96)';
  }
  houseDashboardVisible = false;
}

function positionDashboard() {
  if (!houseDashboardEl) return;
  // Project the house position + offset to screen
  const worldPos = new THREE.Vector3();
  houseGroup.getWorldPosition(worldPos);
  worldPos.y += 2.0; // anchor at top of house
  const screenPos = worldPos.clone().project(camera);
  const hw = window.innerWidth / 2;
  const hh = window.innerHeight / 2;
  let sx = (screenPos.x * hw) + hw + 30; // offset to the right
  let sy = -(screenPos.y * hh) + hh - 80;

  // Clamp to viewport
  sx = Math.min(sx, window.innerWidth - 240);
  sx = Math.max(sx, 10);
  sy = Math.min(sy, window.innerHeight - 340);
  sy = Math.max(sy, 10);

  houseDashboardEl.style.left = sx + 'px';
  houseDashboardEl.style.top = sy + 'px';
}

// ---- RAYCASTING & INTERACTION ----
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let hoveredNodeIndex = -1;
let selectedNodeIndex = -1;
const highlightTransitions = {};
const revealTransitions = {};
let houseHovered = false;
let houseGlowIntensity = 0; // 0 = fully hidden, 1 = fully visible

function setHighlightTarget(pi, target) {
  if (!highlightTransitions[pi]) highlightTransitions[pi] = { current: 0, target: 0 };
  highlightTransitions[pi].target = target;
}

function setRevealTarget(pi, target) {
  if (!revealTransitions[pi]) revealTransitions[pi] = { current: 0, target: 0 };
  revealTransitions[pi].target = target;
}

function highlightConnectedPaths(nodeIndex) {
  const nodeDef = interactiveNodeDefs[nodeIndex];
  flowPaths.forEach((_, pi) => {
    setHighlightTarget(pi, -1);
    setRevealTarget(pi, 0);
  });
  nodeDef.connectedPaths.forEach(pi => {
    setHighlightTarget(pi, 1);
    setRevealTarget(pi, 1);
  });
}

function resetAllPaths() {
  flowPaths.forEach((_, pi) => {
    setHighlightTarget(pi, 0);
    setRevealTarget(pi, 0);
  });
}

renderer.domElement.addEventListener('pointermove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check house hover
  const houseChildren = [];
  houseGroup.traverse((child) => { if (child.isMesh && !child.name.startsWith('houseGlow') && !child.name.startsWith('houseWave') && !child.name.startsWith('houseHalo') && !child.name.startsWith('houseGroundGlow') && child.name !== 'houseGlowSphere' && child.name !== 'houseGlowShellInner' && child.name !== 'houseGlowShellOuter') houseChildren.push(child); });
  const houseIntersects = raycaster.intersectObjects(houseChildren, false);
  houseHovered = houseIntersects.length > 0;

  const intersects = raycaster.intersectObjects(nodeHitTargets);
  if (intersects.length > 0) {
    const ni = intersects[0].object.userData.nodeIndex;
    if (hoveredNodeIndex !== ni) {
      hoveredNodeIndex = ni;
      renderer.domElement.style.cursor = 'pointer';
      if (selectedNodeIndex === -1) {
        showTooltip(interactiveNodeDefs[ni], e.clientX, e.clientY);
      }
    } else if (selectedNodeIndex === -1) {
      let tx = e.clientX + 18, ty = e.clientY - 20;
      if (tx + 200 > window.innerWidth - 16) tx = e.clientX - 218;
      if (ty < 16) ty = 16;
      tooltip.style.left = tx + 'px';
      tooltip.style.top = ty + 'px';
    }
  } else {
    if (hoveredNodeIndex !== -1 && selectedNodeIndex === -1) {
      renderer.domElement.style.cursor = 'default';
      hideTooltip();
    }
    hoveredNodeIndex = -1;
  }
});

renderer.domElement.addEventListener('pointerdown', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check house click
  const houseClickTargets = [];
  houseGroup.traverse((child) => {
    if (child.isMesh && !child.name.startsWith('houseGlow') && !child.name.startsWith('houseWave') && !child.name.startsWith('houseHalo') && !child.name.startsWith('houseGroundGlow') && child.name !== 'houseGlowSphere' && child.name !== 'houseGlowShellInner' && child.name !== 'houseGlowShellOuter') {
      houseClickTargets.push(child);
    }
  });
  const houseClickHits = raycaster.intersectObjects(houseClickTargets, false);
  if (houseClickHits.length > 0) {
    window.location.href = './house-detail.html';
    return;
  }

  const intersects = raycaster.intersectObjects(nodeHitTargets);
  if (intersects.length > 0) {
    clearSelectedEditableMesh();
    const ni = intersects[0].object.userData.nodeIndex;
    if (selectedNodeIndex === ni) {
      selectedNodeIndex = -1; resetAllPaths(); hideTooltip();
    } else {
      selectedNodeIndex = ni;
      highlightConnectedPaths(ni);
      showTooltip(interactiveNodeDefs[ni], e.clientX, e.clientY);
    }
  } else {
    const editableHits = raycaster.intersectObjects(collectEditablePlaneMeshes(), false);
    if (editableHits.length > 0) {
      const selectedMesh = editableHits[0].object;
      selectEditableMesh(selectedMesh);
    } else {
      clearSelectedEditableMesh();
    }
    if (selectedNodeIndex !== -1) {
      selectedNodeIndex = -1; resetAllPaths(); hideTooltip();
    }
    // Also close dashboard when clicking empty space
    if (houseDashboardVisible) {
      hideHouseDashboard();
    }
  }
});

// ---- SMOOTHSTEP HELPER ----
function smoothstepJS(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ---- MAIN ANIMATION LOOP ----
const clock = new THREE.Clock();
let currentMode = 'day';

function animate() {
  const dt = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  updateScrollCamera();
  updateStageVisualState();
  updateBuildingStageColors(elapsed);
  syncGlassBannerVisibility();
  updateStageOverlay();

  const sensingWeight = stageVisualState.sensing;
  const interpretingWeight = stageVisualState.interpreting;
  const synchronizingWeight = stageVisualState.synchronizing;
  const interpretingLabelWeight = smoothstepJS(0.08, 0.72, stageVisualState.interpretingProgress);
  const labelBaseOpacity = interpretingLabelWeight * (1 - synchronizingWeight);
  renderer.domElement.style.filter = `blur(${(sensingWeight * 2.2).toFixed(2)}px) brightness(${(0.98 + synchronizingWeight * 0.03).toFixed(3)})`;
  labelRenderer.domElement.style.opacity = String(labelBaseOpacity);
  energyFlowGroup.visible = true;

  moduleLabels.forEach((label, index) => {
    const staggeredReveal = smoothstepJS(
      0.04 + index * 0.08,
      0.38 + index * 0.08,
      stageVisualState.interpretingProgress
    ) * (1 - synchronizingWeight);
    const stageAccent = [
      'rgba(140, 168, 195, 0.92)',
      'rgba(121, 170, 182, 0.92)',
      'rgba(120, 161, 208, 0.92)',
      'rgba(145, 170, 205, 0.92)',
      'rgba(121, 183, 171, 0.92)',
      'rgba(139, 175, 205, 0.92)',
    ][index % 6];
    label.position.y =
      label.userData.baseY +
      Math.sin(elapsed * 0.85 + label.userData.floatOffset + index * 0.15) * 0.06;
    label.element.style.opacity = String(staggeredReveal);
    label.element.style.color = staggeredReveal > 0.65 ? stageAccent : '';
  });

  // Wind turbines
  turbines.forEach((t, i) => {
    if (t.userData.blades) t.userData.blades.rotation.x = elapsed * (1.5 + i * 0.2);
  });

  // Solar panel breathing effect
  {
    const isNight = currentMode === 'night';
    const baseEmissive = isNight ? 1.55 : 1.1;
    const breathAmpEmissive = isNight ? 0.35 : 0.22;
    const colorBase = isNight ? 0.84 : 0.94;
    const colorAmp = isNight ? 0.16 : 0.10;
    const frameBaseOpacity = isNight ? 0.22 : 0.16;
    const frameBreathAmp = isNight ? 0.16 : 0.10;

    allSolarPanelMeshes.forEach((panel, idx) => {
      const phase = idx * 0.37;
      const b1 = Math.sin(elapsed * 0.25 * Math.PI * 2 + phase) * 0.5 + 0.5;
      const b2 = Math.sin(elapsed * 0.17 * Math.PI * 2 + phase * 0.7) * 0.5 + 0.5;
      const breath = b1 * 0.65 + b2 * 0.35;
      panel.material.emissiveIntensity = baseEmissive + breath * breathAmpEmissive;
      const cv = colorBase + breath * colorAmp;
      panel.material.color.setRGB(cv * 0.82, cv, cv * 0.98);
    });

    allSolarFrameMeshes.forEach((frame, idx) => {
      const phase = idx * 0.37;
      const b1 = Math.sin(elapsed * 0.25 * Math.PI * 2 + phase) * 0.5 + 0.5;
      const b2 = Math.sin(elapsed * 0.17 * Math.PI * 2 + phase * 0.7) * 0.5 + 0.5;
      const breath = b1 * 0.65 + b2 * 0.35;
      frame.material.opacity = frameBaseOpacity + breath * frameBreathAmp;
    });

  allRoofPanelMeshes.forEach((panel) => {
      panel.material.emissiveIntensity = isNight ? 1.18 : 0.82;
      panel.material.color.setRGB(colorBase * 0.84, colorBase, colorBase * 0.985);
    });

    allRoofFrameMeshes.forEach((frame) => {
      frame.material.opacity = isNight ? 0.18 : 0.12;
    });

    allRoofGlowMeshes.forEach((glow, idx) => {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 1.6 + idx * 0.42);
      glow.material.opacity = (isNight ? 0.34 : 0.22) + pulse * (isNight ? 0.12 : 0.08);
      const glowColor = isNight ? 0xd7f6ff : 0xbcefff;
      glow.material.color.set(glowColor);
    });
  }

  // Building breathing motion
  {
    const transitionWeight = smoothstepJS(0.05, 0.95, stageVisualState.interpretingProgress ?? 0);
    const buildingMotionState =
      transitionWeight < 0.02
        ? 'SENSING'
        : transitionWeight < 0.98
          ? 'TRANSITION'
          : 'INTERPRETING';
    breathingBuildingTargets.forEach((group, index) => {
      const baseY = group.userData.baseY ?? group.position.y;
      const baseScale = group.userData.baseScale ?? new THREE.Vector3(1, 1, 1);
      const phase = group.userData.breathPhase ?? index * 0.35;
      const buildingHeight = Math.max(group.userData.buildingHeight ?? 3, 0.5);
      if (group.userData.disableBreathing) {
        group.position.y = baseY;
        group.scale.copy(baseScale);
        return;
      }
      const baseAmplitude = (group.userData.amplitude ?? 0.45) * (group.userData.nearEnergy ? 1.2 : 1.0);
      const baseFrequency = group.userData.frequency ?? 0.8;
      group.userData.motionState = buildingMotionState;

      if (buildingMotionState === 'SENSING') {
        group.userData.currentAmplitude += (baseAmplitude - group.userData.currentAmplitude) * Math.min(1, 2.6 * dt);
        group.userData.currentFrequency += (baseFrequency - group.userData.currentFrequency) * Math.min(1, 2.2 * dt);
        const heightOffset = Math.sin(elapsed * group.userData.currentFrequency + phase) * group.userData.currentAmplitude;
        const targetScaleY = THREE.MathUtils.clamp(1 + heightOffset / buildingHeight, 0.72, 1.28);
        group.position.y = baseY;
        group.scale.set(baseScale.x, baseScale.y * targetScaleY, baseScale.z);
      } else if (buildingMotionState === 'TRANSITION') {
        group.userData.currentAmplitude *= Math.pow(0.97, dt * 60);
        group.userData.currentFrequency *= Math.pow(0.995, dt * 60);
        const heightOffset =
          Math.sin(elapsed * group.userData.currentFrequency + phase) * group.userData.currentAmplitude;
        const oscillationScaleY = THREE.MathUtils.clamp(1 + heightOffset / buildingHeight, 0.76, 1.24);
        const settledScaleY = THREE.MathUtils.lerp(
          oscillationScaleY,
          1,
          0.08 + transitionWeight * 0.18
        );
        group.position.y = baseY;
        group.scale.set(baseScale.x, baseScale.y * settledScaleY, baseScale.z);
      } else {
        group.userData.currentAmplitude = THREE.MathUtils.lerp(
          group.userData.currentAmplitude,
          0,
          Math.min(1, 0.14 * dt * 60)
        );
        group.userData.currentFrequency = THREE.MathUtils.lerp(
          group.userData.currentFrequency,
          baseFrequency * 0.96,
          Math.min(1, 0.08 * dt * 60)
        );
        group.position.y = baseY;
        group.scale.set(
          baseScale.x,
          THREE.MathUtils.lerp(group.scale.y, baseScale.y, Math.min(1, 0.1 * dt * 60)),
          baseScale.z
        );
      }

      group.traverse((child) => {
        if (child.isMesh && child.material?.userData?.shader?.uniforms?.uTime) {
          child.material.userData.shader.uniforms.uTime.value = elapsed;
        }
      });
    });
  }

  // Energy flow animations
  {
    const stageReveal = synchronizingWeight;
    const intensify = stageVisualState.intensify ?? 0;
    for (const piStr in highlightTransitions) {
      const ht = highlightTransitions[piStr];
      ht.current += (ht.target - ht.current) * Math.min(1, 5.0 * dt);
    }
    for (const piStr in revealTransitions) {
      const rt = revealTransitions[piStr];
      rt.current += (rt.target - rt.current) * Math.min(1, 2.8 * dt);
    }

    flowLineObjects.forEach(({ obj, pathIndex }) => {
      const u = obj.material.uniforms;
      if (u.uTime) u.uTime.value = elapsed;
      const ht = highlightTransitions[pathIndex];
      const hVal = Math.max(ht ? ht.current : 0, stageReveal * 0.18);
      const rt = revealTransitions[pathIndex];
      const revealVal = Math.max(rt ? rt.current : 0, stageReveal);
      if (u.uHighlight) u.uHighlight.value = hVal;
      if (u.uReveal) u.uReveal.value = revealVal;
      if (u.uBaseAlpha) {
        u.uBaseAlpha.value = THREE.MathUtils.lerp(obj.userData.baseAlpha ?? 0.16, 0.32, intensify);
      }
      if (u.uSpeed) {
        u.uSpeed.value = (obj.userData.baseSpeed ?? 0.14) * THREE.MathUtils.lerp(1, 1.8, intensify) * flowVisualControls.speedMultiplier;
      }
      obj.visible = revealVal > 0.01;
    });

    flowParticleData.forEach(pd => {
      const ht = highlightTransitions[pd.pathIndex];
      const hVal = Math.max(ht ? ht.current : 0, stageReveal * 0.18);
      const rt = revealTransitions[pd.pathIndex];
      const revealVal = Math.max(rt ? rt.current : 0, stageReveal);
      const travelSpan = Math.max(0.001, revealVal);
      const t = travelSpan > 0.02 ? (pd.offset * travelSpan + elapsed * pd.speed) % travelSpan : 0;
      const pos = pd.curve.getPointAt(t);
      pd.mesh.position.copy(pos);
      const visibleFactor = smoothstepJS(0.02, 0.24, revealVal);
      const dimFactor = hVal < -0.3 ? 0.1 : 1.0;
      pd.mesh.material.opacity = ((0.48 + 0.18 * Math.sin(elapsed * 1.7 + pd.offset * Math.PI * 2)) * dimFactor + Math.max(0, hVal) * 0.18 + intensify * 0.24) * visibleFactor * flowVisualControls.particleBrightness;
      const s = (0.92 + 0.16 * Math.sin(elapsed * 1.2 + pd.offset * 8)) * (hVal < -0.3 ? 0.3 : 1.0 + Math.max(0, hVal) * 0.35) * visibleFactor;
      pd.mesh.scale.setScalar(s);
      pd.mesh.visible = visibleFactor > 0.01;
    });

    nodeGlowObjects.forEach((ng) => {
      const isActive = ng.nodeIndex === hoveredNodeIndex || ng.nodeIndex === selectedNodeIndex;
      const targetOpacity = (isActive ? ng.baseOpacity * 1.75 : ng.baseOpacity) * stageReveal;
      const pulse = 0.78 + 0.22 * Math.sin(elapsed * (0.95 + synchronizingWeight * 0.45 + intensify * 1.0) + ng.nodeIndex * 0.8);
      ng.mesh.material.opacity += (targetOpacity * pulse - ng.mesh.material.opacity) * 0.08;
      if (ng.type === 'ring') {
        const targetScale = isActive ? 1.22 + 0.06 * Math.sin(elapsed * 1.1) : 1.0;
        ng.mesh.scale.setScalar(ng.mesh.scale.x + (targetScale - ng.mesh.scale.x) * 0.08);
      }
      ng.mesh.visible = stageReveal > 0.01;
    });

    breathingVolumes.forEach((volume, index) => {
      const breath = 1.0 + 0.032 * (0.5 + 0.5 * Math.sin(elapsed * volume.speed * Math.PI * 2 + volume.phase + index * 0.41));
      volume.mesh.scale.copy(volume.baseScale).multiplyScalar(breath);
      const opacityPulse = 0.92 + 0.08 * Math.sin(elapsed * volume.speed * Math.PI * 2 + volume.phase + 0.6);
      volume.mesh.material.opacity = volume.opacity * opacityPulse;
      volume.mesh.visible = true;
    });
  }

  updateEpilogueScene(elapsed);

  // Window lights fade
  windowCurrentOpacity += (windowTargetOpacity - windowCurrentOpacity) * Math.min(1, 2.5 * dt);
  if (allWindowMeshes.length > 0) {
    for (let i = 0; i < allWindowMeshes.length; i++) {
      const wm = allWindowMeshes[i];
      const ud = wm.userData;
      if (windowCurrentOpacity > 0.01) {
        const flicker = ud.winBaseIntensity + 0.15 * Math.sin(elapsed * ud.winFlickerSpeed + ud.winFlickerPhase);
        wm.material.opacity = windowCurrentOpacity * flicker;
      } else {
        wm.material.opacity = 0;
      }
    }
  }

  // Animate house blue glow + expanding waves + halo (HOVER ONLY)
  if (houseGroup.userData.glowShell) {
    // Smooth transition: ramp up on hover, fade out when not
    const glowLerpSpeed = houseHovered ? 3.0 : 2.0;
    const glowTarget = houseHovered ? 1.0 : 0.0;
    houseGlowIntensity += (glowTarget - houseGlowIntensity) * Math.min(1, glowLerpSpeed * dt);
    // Clamp tiny values to zero for clean off-state
    if (houseGlowIntensity < 0.001) houseGlowIntensity = 0;

    const gi = houseGlowIntensity; // shorthand
    const glowPulse = 0.5 + 0.5 * Math.sin(elapsed * 1.2);
    const glowShell = houseGroup.userData.glowShell;
    const outerGlow = houseGroup.userData.outerGlow;
    const groundGlow = houseGroup.userData.groundGlow;

    // Inner/outer shell breathing — scaled by hover intensity
    glowShell.material.opacity = (0.05 + glowPulse * 0.07) * gi;
    outerGlow.material.opacity = (0.025 + glowPulse * 0.035) * gi;
    groundGlow.material.opacity = (0.08 + glowPulse * 0.12) * gi;

    const s = 1.0 + glowPulse * 0.025 * gi;
    outerGlow.scale.setScalar(s);
    groundGlow.scale.setScalar(1.0 + glowPulse * 0.06 * gi);

    // Also modulate emissive on the house model itself
    const houseModel = houseGroup.getObjectByName('houseModel');
    if (houseModel) {
      houseModel.traverse((child) => {
        if (child.isMesh && child.material && child.material.emissive) {
          child.material.emissiveIntensity = 0.35 * gi;
          child.material.opacity = 0.92 + 0.08 * (1.0 - gi); // slightly more transparent when no glow
        }
      });
    }

    // Expanding circular waves — scaled by hover intensity
    const waveCycleSpeed = 0.3;
    if (houseGroup.userData.waves) {
      houseGroup.userData.waves.forEach((w) => {
        const t = ((elapsed * waveCycleSpeed + w.phase) % 1.0);
        const radius = w.minRadius + t * (w.maxRadius - w.minRadius);
        w.mesh.scale.set(radius * gi, radius * gi, 1);

        const fadeIn = smoothstepJS(0.0, 0.1, t);
        const fadeOut = smoothstepJS(1.0, 0.4, t);
        w.mesh.material.uniforms.uOpacity.value = fadeIn * fadeOut * 0.28 * gi;
      });
    }

    // Halo breathing — scaled by hover intensity
    if (houseGroup.userData.haloMesh) {
      houseGroup.userData.haloMesh.material.uniforms.uTime.value = elapsed;
      houseGroup.userData.haloMesh.scale.setScalar(gi);
      houseGroup.userData.haloMesh.visible = gi > 0.001;
    }

    // Glow sphere breathing — scaled by hover intensity
    if (houseGroup.userData.glowSphere) {
      houseGroup.userData.glowSphere.material.uniforms.uTime.value = elapsed;
      const sphereBreath = 1.0 + 0.04 * Math.sin(elapsed * 0.9);
      houseGroup.userData.glowSphere.scale.setScalar(sphereBreath * gi);
      houseGroup.userData.glowSphere.visible = gi > 0.001;
    }
  }

  // ---- WARM INTERIOR GLOW (night mode transition) ----
  {
    const nightFactor = currentMode === 'night' ? 1.0 : 0.0;
    if (houseGroup.userData._nightGlow === undefined) houseGroup.userData._nightGlow = 0;
    houseGroup.userData._nightGlow += (nightFactor - houseGroup.userData._nightGlow) * Math.min(1, 1.8 * dt);
    const ng = houseGroup.userData._nightGlow;

    // Indirect ambient hemisphere lights — very gentle, directionless
    if (houseGroup.userData.warmAmbientLights) {
      const breath = 0.94 + 0.04 * Math.sin(elapsed * 0.35 + 0.8) + 0.02 * Math.sin(elapsed * 0.7 + 2.1);
      houseGroup.userData.warmAmbientLights.forEach((hemi, ai) => {
        // Each light slightly offset in phase for organic feel
        const localBreath = breath + 0.015 * Math.sin(elapsed * 0.45 + ai * 1.7);
        hemi.intensity = ng * 0.18 * localBreath;
      });
    }

    // Main warm interior volume — soft omnidirectional glow
    if (houseGroup.userData.warmVolume) {
      houseGroup.userData.warmVolume.material.uniforms.uOpacity.value = ng * 0.5;
      houseGroup.userData.warmVolume.material.uniforms.uTime.value = elapsed;
    }

    // Upper warm volume — subtle upward bounced light
    if (houseGroup.userData.warmVolumeUpper) {
      houseGroup.userData.warmVolumeUpper.material.uniforms.uOpacity.value = ng * 0.3;
      houseGroup.userData.warmVolumeUpper.material.uniforms.uTime.value = elapsed;
    }

    // Subtle material opacity shift at night — very slight translucency
    if (houseGroup.userData.houseMeshOriginals) {
      houseGroup.userData.houseMeshOriginals.forEach((entry) => {
        const mat = entry.mesh.material;
        if (ng > 0.01) {
          mat.transparent = true;
          mat.opacity = entry.origOpacity - ng * 0.06;
        } else {
          mat.opacity = entry.origOpacity;
        }
      });
    }

    // Gentle emissive color shift: blue → soft warm ambient tint
    if (ng > 0.001) {
      const warmBreath = 0.95 + 0.03 * Math.sin(elapsed * 0.4 + 1.3) + 0.02 * Math.sin(elapsed * 0.65 + 0.7);
      const houseModel = houseGroup.getObjectByName('houseModel');
      if (houseModel) {
        houseModel.traverse((child) => {
          if (child.isMesh && child.material && child.material.emissive) {
            const warmAmount = ng * 0.18 * warmBreath;
            const r = 0.0 + 0.9 * warmAmount;
            const g = 0.4 + 0.3 * warmAmount;
            const b = 1.0 - 0.55 * warmAmount;
            child.material.emissive.setRGB(r, g, b);
            child.material.emissiveIntensity = 0.35 + ng * 0.1 * warmBreath;
          }
        });
      }
    }
  }

  // Update dashboard position each frame if visible
  if (houseDashboardVisible) {
    positionDashboard();
  }

  updateLightingTransition(dt);
  composer.render();
  labelRenderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ---- LIGHTING PRESETS ----
const lightingPresets = {
  day: {
    background: new THREE.Color(0xf0f0f0),
    fogColor: new THREE.Color(0xf0f0f0),
    fogDensity: 0.005,
    ambientColor: new THREE.Color(0xffffff),
    ambientIntensity: 0.18,
    dirColor: new THREE.Color(0xffffff),
    dirIntensity: 0.52,
    dirPos: new THREE.Vector3(20, 35, 15),
    fillColor: new THREE.Color(0xf0f0ff),
    fillIntensity: 0.08,
    rimColor: new THREE.Color(0xffffff),
    rimIntensity: 0.05,
    toneMappingExposure: 0.64,
    gridOpacity: 0.3,
    labelColor: '#aaa',
  },
  night: {
    background: new THREE.Color(0x061126),
    fogColor: new THREE.Color(0x061126),
    fogDensity: 0.011,
    ambientColor: new THREE.Color(0x0a1a33),
    ambientIntensity: 0.08,
    dirColor: new THREE.Color(0x5fa4ff),
    dirIntensity: 0.14,
    dirPos: new THREE.Vector3(-8, 22, -4),
    fillColor: new THREE.Color(0x0c2344),
    fillIntensity: 0.03,
    rimColor: new THREE.Color(0x16345d),
    rimIntensity: 0.05,
    toneMappingExposure: 0.62,
    gridOpacity: 0.14,
    labelColor: '#6c89b3',
  },
};

let targetPreset = lightingPresets.day;
let lerpSpeed = 2.0;

function updateLightingTransition(dt) {
  const t = Math.min(1, lerpSpeed * dt);
  sceneBackgroundTargetColor.set(sceneVisualControls.backgroundColor);
  scene.background.lerp(sceneBackgroundTargetColor, t);
  scene.fog.color.lerp(sceneBackgroundTargetColor, t);
  scene.fog.density += (targetPreset.fogDensity - scene.fog.density) * t;
  ambientLight.color.lerp(targetPreset.ambientColor, t);
  ambientLight.intensity += (targetPreset.ambientIntensity - ambientLight.intensity) * t;
  dirLight.color.lerp(targetPreset.dirColor, t);
  dirLight.intensity += (targetPreset.dirIntensity - dirLight.intensity) * t;
  dirLight.position.lerp(targetPreset.dirPos, t);
  fillLight.color.lerp(targetPreset.fillColor, t);
  fillLight.intensity += (targetPreset.fillIntensity - fillLight.intensity) * t;
  rimLight.color.lerp(targetPreset.rimColor, t);
  rimLight.intensity += (targetPreset.rimIntensity - rimLight.intensity) * t;
  renderer.toneMappingExposure += (targetPreset.toneMappingExposure - renderer.toneMappingExposure) * t;
  gridHelper.material.opacity += (targetPreset.gridOpacity - gridHelper.material.opacity) * t;

  const materialPreset = materialColorPresets[currentMode];
  whiteMat.color.lerp(materialPreset.white, t);
  lightWhiteMat.color.lerp(materialPreset.lightWhite, t);
  slightGrayMat.color.lerp(materialPreset.slightGray, t);
  edgeMat.color.lerp(materialPreset.edge, t);
  glassMat.color.lerp(materialPreset.glass, t);
  waterMat.color.lerp(materialPreset.water, t);
  subtleAccent.color.lerp(materialPreset.accent, t);
  solarPanelMat.color.lerp(materialPreset.solar, t);
  roofPanelMat.color.lerp(materialPreset.solar, t);

  const nightFactor = currentMode === 'night' ? 1 : 0;
  buildingSpotlights.forEach((light, index) => {
    const pulse = 0.96 + 0.04 * Math.sin(performance.now() * 0.00045 + index * 0.7);
    const targetIntensity = nightFactor * light.userData.baseIntensity * pulse;
    light.intensity += (targetIntensity - light.intensity) * t;
  });
}

function setMode(mode) {
  currentMode = mode;
  targetPreset = lightingPresets[mode];
  windowTargetOpacity = mode === 'night' ? 0.85 : 0.0;
  updateToggleUI();
  updateModuleLabelStyles(mode);
  labelDiv.style.color = targetPreset.labelColor;
}

// ---- MODE TOGGLE SWITCH ----
const toggleContainer = document.createElement('div');
toggleContainer.style.cssText = `display:none;`;

const sunIcon = document.createElement('span');
sunIcon.textContent = '☀️';
sunIcon.style.cssText = `font-size:16px;transition:opacity 0.3s ease;`;

const toggleTrack = document.createElement('div');
toggleTrack.style.cssText = `width:48px;height:26px;border-radius:13px;background:rgba(200,200,200,0.3);border:1px solid rgba(150,150,150,0.2);cursor:pointer;position:relative;transition:background 0.4s ease, border-color 0.4s ease;backdrop-filter:blur(8px);`;

const toggleThumb = document.createElement('div');
toggleThumb.style.cssText = `width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:2px;left:3px;transition:transform 0.35s cubic-bezier(0.4,0,0.2,1), background 0.35s ease;box-shadow:0 1px 4px rgba(0,0,0,0.2);`;

toggleTrack.appendChild(toggleThumb);

const moonIcon = document.createElement('span');
moonIcon.textContent = '🌙';
moonIcon.style.cssText = `font-size:16px;transition:opacity 0.3s ease;`;

const modeLabel = document.createElement('span');
modeLabel.style.cssText = `font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(150,150,150,0.7);transition:color 0.3s ease;min-width:52px;`;
modeLabel.textContent = 'Daytime';

function updateToggleUI() {
  return;
}

// ---- LABEL ----
const stageOverlay = document.createElement('div');
stageOverlay.style.cssText = `
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  pointer-events: none;
  z-index: 850;
`;

const stagePanels = [
  { key: 'sensing', label: 'SENSING.' },
  { key: 'interpreting', label: 'INTERPRETING.' },
  { key: 'synchronizing', label: 'SYNCHRONIZING.' },
].map((stage, index) => {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
  `;

  const word = document.createElement('div');
  word.textContent = stage.label;
  word.style.cssText = `
    font-family: "Inter", "Segoe UI", sans-serif;
    font-size: clamp(34px, 4.2vw, 64px);
    line-height: 1;
    letter-spacing: -0.05em;
    font-weight: 400;
    color: rgba(118, 122, 126, 0.28);
    opacity: 0.2;
    transform: scale(0.95);
    transition: opacity 0.3s ease, transform 0.3s ease, color 0.3s ease;
    text-align: center;
    white-space: nowrap;
  `;

  panel.appendChild(word);
  stageOverlay.appendChild(panel);
  return { ...stage, panel, word };
});

document.body.appendChild(stageOverlay);

function updateStageOverlay() {
  const activeColor = 'rgba(78, 82, 88, 0.92)';
  const inactiveColor = 'rgba(136, 142, 148, 0.34)';
  stagePanels.forEach((stage) => {
    const value = stageVisualState[stage.key] ?? 0;
    stage.word.style.opacity = String(0.2 + value * 0.8);
    stage.word.style.transform = `scale(${(0.95 + value * 0.05).toFixed(3)})`;
    stage.word.style.color = value > 0.45 ? activeColor : inactiveColor;
  });
}

const glassBannerStyle = document.createElement('style');
glassBannerStyle.textContent = `
  .glass-banner.visible {
    opacity: 1 !important;
    transform: translateY(0) !important;
    pointer-events: auto !important;
  }

  .glass-banner .gallery::-webkit-scrollbar {
    display: none;
  }
`;
document.head.appendChild(glassBannerStyle);

const glassBanner = document.createElement('section');
glassBanner.className = 'glass-banner';
glassBanner.style.cssText = `
  position: fixed;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 50vh;
  opacity: 0;
  transform: translateY(80px);
  transition:
    opacity 0.8s cubic-bezier(0.77, 0, 0.175, 1),
    transform 0.8s cubic-bezier(0.77, 0, 0.175, 1);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  background: rgba(255, 255, 255, 0.2);
  border-top: 1px solid rgba(255, 255, 255, 0.32);
  box-shadow:
    0 -1px 0 rgba(255, 255, 255, 0.18) inset,
    0 -24px 60px rgba(185, 205, 225, 0.06);
  z-index: 820;
  pointer-events: none;
  overflow: hidden;
`;

const glassBackdrop = document.createElement('div');
glassBackdrop.style.cssText = `
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 18% 26%, rgba(255,255,255,0.18), transparent 34%),
    radial-gradient(circle at 78% 18%, rgba(210,238,255,0.16), transparent 30%),
    linear-gradient(180deg, rgba(255,255,255,0.16), rgba(244,248,252,0.08));
  pointer-events: none;
`;
glassBanner.appendChild(glassBackdrop);

const glassInner = document.createElement('div');
glassInner.className = 'glass-inner';
glassInner.style.cssText = `
  position: relative;
  display: flex;
  height: 100%;
  padding: 4vw;
  gap: 4vw;
  box-sizing: border-box;
`;

const leftPanel = document.createElement('div');
leftPanel.className = 'left-panel';
leftPanel.style.cssText = `
  width: 50%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  color: rgba(78, 88, 98, 0.88);
`;

const leftTitle = document.createElement('h2');
leftTitle.textContent = 'LAB OVERVIEW';
leftTitle.style.cssText = `
  margin: 0;
  font-family: "Inter", "Segoe UI", sans-serif;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
`;

const leftCopy = document.createElement('p');
leftCopy.textContent = 'Content placeholder for lab introduction';
leftCopy.style.cssText = `
  margin: 10px 0 0;
  max-width: 360px;
  font-family: "Inter", "Segoe UI", sans-serif;
  font-size: 14px;
  line-height: 1.7;
  letter-spacing: 0.01em;
  opacity: 0.58;
`;

leftPanel.appendChild(leftTitle);
leftPanel.appendChild(leftCopy);

const rightPanel = document.createElement('div');
rightPanel.className = 'right-panel';
rightPanel.style.cssText = `
  width: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  pointer-events: auto;
`;

const gallery = document.createElement('div');
gallery.className = 'gallery';
gallery.style.cssText = `
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding-bottom: 10px;
  scrollbar-width: none;
`;
gallery.addEventListener('wheel', (event) => {
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
    gallery.scrollLeft += event.deltaY;
    event.preventDefault();
  }
}, { passive: false });

[
  { title: 'Pv Panel Diagnosis Robot', accent: 'linear-gradient(135deg, rgba(255,255,255,0.72), rgba(185,226,255,0.52) 48%, rgba(150,210,255,0.44))' },
  { title: 'Solar Energy Installation', accent: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(206,236,255,0.56) 44%, rgba(167,219,255,0.46))' },
  { title: 'Energy Flow System', accent: 'linear-gradient(135deg, rgba(255,255,255,0.74), rgba(192,228,255,0.54) 42%, rgba(142,205,255,0.48))' },
].forEach((item) => {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.cssText = `
    min-width: 240px;
    flex-shrink: 0;
  `;

  const cardImg = document.createElement('div');
  cardImg.className = 'card-img';
  cardImg.style.cssText = `
    width: 100%;
    height: 140px;
    border-radius: 12px;
    background:
      radial-gradient(circle at 30% 28%, rgba(255,255,255,0.72), transparent 34%),
      ${item.accent};
    border: 1px solid rgba(255,255,255,0.42);
    box-shadow:
      0 1px 0 rgba(255,255,255,0.34) inset,
      0 10px 30px rgba(184, 205, 225, 0.08);
  `;

  const cardLabel = document.createElement('p');
  cardLabel.textContent = item.title;
  cardLabel.style.cssText = `
    margin: 8px 0 0;
    font-family: "Inter", "Segoe UI", sans-serif;
    font-size: 13px;
    letter-spacing: 0.01em;
    color: rgba(82, 94, 106, 0.84);
    opacity: 0.76;
  `;

  card.appendChild(cardImg);
  card.appendChild(cardLabel);
  gallery.appendChild(card);
});

rightPanel.appendChild(gallery);
glassInner.appendChild(leftPanel);
glassInner.appendChild(rightPanel);
glassBanner.appendChild(glassInner);
document.body.appendChild(glassBanner);

let glassBannerTriggerVisible = false;

function syncGlassBannerVisibility() {
  const shouldShow =
    glassBannerTriggerVisible &&
    (stageVisualState.synchronizingProgress ?? 0) > 0.24;
  glassBanner.classList.toggle('visible', shouldShow);
}

const triggerSection = document.querySelector('#trigger-section');
if (triggerSection) {
  const bannerObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      glassBannerTriggerVisible = entry.isIntersecting;
      syncGlassBannerVisibility();
    });
  }, {
    threshold: 0.2,
  });

  bannerObserver.observe(triggerSection);
}

setMode('day');
