import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ============================================================ config
const CFG = {
  juggernaut: { name: 'JUGGERNAUT', hp: 260, max: 29, accel: 10, turn: 1.25, grip: 5.5, mass: 3.0, r: 2.7, hx: 1.55, hy: 3.4, hz: 4.0, cam: [10.5, 4.2], blurb: 'Six-wheel long-nose war truck. Blower through the hood, chrome stacks, armored flatbed. Soaks punishment and flattens anything in its path. Slow to turn.' },
  raider: { name: 'RAIDER', hp: 170, max: 37, accel: 15, turn: 1.85, grip: 7, mass: 1.8, r: 2.0, hx: 1.25, hy: 2.7, hz: 2.75, cam: [8.9, 3.8], blurb: 'Long-wheelbase rock crawler on huge mud tires, with a soft top, coilovers, tube bumper and a roof light bar. Solid all-rounder with a gun on the roof.' },
  widowmaker: { name: 'WIDOWMAKER', hp: 150, max: 42, accel: 19, turn: 2.1, grip: 6.5, mass: 1.5, r: 1.9, hx: 1.0, hy: 1.5, hz: 2.45, cam: [7.8, 3.0], blurb: 'Supercharged V8 coupe with a blower punched through the hood. Brutal straight-line speed and the best drifter in the yard.' },
  blackhorn: { name: 'BLACKHORN', hp: 200, max: 43, accel: 18, turn: 1.7, grip: 6.6, mass: 2.4, r: 2.2, hx: 1.15, hy: 2.3, hz: 2.7, cam: [9.2, 3.9], ramMul: 1.25, blurb: 'Lifted 70s big-block muscle coupe on mud tires, chrome headers out the fenders. Hits almost as hard as the Juggernaut but runs with the fast cars. Handles better than you would think.' },
  warwagon: { name: 'WARWAGON', hp: 245, max: 38, accel: 15, turn: 1.5, grip: 6.8, mass: 2.8, r: 2.6, hx: 1.3, hy: 2.9, hz: 3.4, cam: [10.8, 4.5], ramMul: 1.35, blurb: 'Lifted crew-cab diesel pickup with a winch bumper and twin chrome stacks. Torque for days, built like a bulldozer, and still quicker than the Juggernaut.' },
  scrapper: { name: 'DEUCE', hp: 115, max: 45, accel: 21, turn: 2.5, grip: 8, mass: 1.1, r: 1.8, hx: 1.3, hy: 1.8, hz: 2.4, cam: [7.4, 2.9], blurb: '1932-style highboy hot rod. White with red 33 roundels, chrome blown V8, skinny front tires and fat rear slicks. Fastest thing on the sand and turns on a dime. Goes down quick.' },
};
const WEAPONS = {
  cannon: { name: 'SCRAP CANNON', blurb: 'Twin-barrel autocannon behind a riveted shield. Chews armor plates off at range. Overheats if you hold it too long.', dps: 60 },
  harpoon: { name: 'HARPOON', blurb: 'Every rig carries one. Fire a barbed bolt on a steel cable. Hold LB to reel them in, or drive away to rip armor, doors and wheels clean off.', dps: 35 },
  flamer: { name: 'FLAMETHROWER', blurb: 'Twin fuel tanks feeding a pressure nozzle. Hose a rig and it keeps burning after you stop. Short range, cooks barrels, eats fuel.', dps: 70 },
  rockets: { name: 'ROCKET LAUNCHER', blurb: 'Bazooka-style launcher. Each rocket homes in on your target, blows up on impact and blasts plates off everything nearby. Reloads after every shot.', dps: 45 },
};
const RAMS = {
  spike: { name: 'FULL SPIKES', mult: 1.8, grind: 0, blurb: 'Spiked push bar up front, plus spikes down both sides, across the tail and on the wheel hubs. Anything that hits you from any side gets stabbed.' },
  saw: { name: 'SAW PLOW', mult: 1.35, grind: 28, blurb: 'Spinning saw blades that keep cutting while you push.' },
  none: { name: 'STOCK BUMPER', mult: 0.7, grind: 0, blurb: 'No ram fitted.' },
};
const ARMORS = {
  ballistic: { name: 'BALLISTIC PLATE', tiers: 2, speed: 0.92, resist: { gun: 0.6 }, blurb: 'Full plating in thick riveted steel. Cannon shells and harpoon hits do 40% less.' },
  blast: { name: 'BLAST PLATE', tiers: 2, speed: 0.92, resist: { blast: 0.55 }, blurb: 'Full plating, layered with sandbags. Rockets, barrels and lightning do 45% less.' },
  crash: { name: 'CRASH CAGE', tiers: 2, speed: 0.92, resist: { ram: 0.6 }, blurb: 'Full plating on a bolted crash cage. Rams, saws and wrecks do 40% less.' },
  fire: { name: 'FIRE SKIN', tiers: 2, speed: 0.92, resist: { fire: 0.4 }, blurb: 'Full plating wrapped in fireproof skin. Flamethrowers and burning do 60% less.' },
  // older names (saved loadouts, scripted enemies): full plating, no special resistance
  light: { name: 'FULL PLATING', tiers: 2, speed: 0.92, resist: {}, blurb: '' },
  scrap: { name: 'FULL PLATING', tiers: 2, speed: 0.92, resist: {}, blurb: '' },
  heavy: { name: 'FULL PLATING', tiers: 2, speed: 0.92, resist: {}, blurb: '' },
};
const ARMOR_TYPES = ['ballistic', 'blast', 'crash', 'fire'];
const rndArmor = () => ARMOR_TYPES[Math.floor(Math.random() * 4)];
const GUN_NODE = { cannon: 'Cannon', harpoon: 'Harpoon', rockets: 'Rocket', flamer: 'Flamer' };
const PIECE_NAMES = { Side: 'Corrugated Side Sheet', Door: 'Riveted Door Plate', Grille: 'Window Cage', Hood: 'Hood Plate', Roof: 'Roof Plate', Rear: 'Rear Plate', Guard: 'Wheel Guard', Tank: 'Tank Armor' };
// ============================================================ settings + difficulty
const SET = { music: 7, sfx: 8, shake: 2, vib: 1, invert: 0, diff: 1, score: 0 };
try { Object.assign(SET, JSON.parse(localStorage.getItem('sk_settings') || '{}')); } catch (e) {}
function saveSettings() { try { localStorage.setItem('sk_settings', JSON.stringify(SET)); } catch (e) {} }
const DIFF = [
  { name: 'EASY', dmg: 0.6, count: -1, spread: 1.7, speed: 0.92, blurb: 'Raiders hit softer and come in smaller packs.' },
  { name: 'NORMAL', dmg: 1, count: 0, spread: 1, speed: 1, blurb: 'The wasteland as intended.' },
  { name: 'BRUTAL', dmg: 1.4, count: 1, spread: 0.65, speed: 1.06, blurb: 'Bigger packs, sharper gunners, harder hits.' },
];
const D = () => DIFF[SET.diff] || DIFF[1];
const SALVAGE = ['Twin Exhaust Stacks', 'Rusted Supercharger', 'Studded Tire', 'Fuel Cell', 'Nitro Canister', 'Turret Bearing', 'Chain Reel', 'Spiked Hubcap'];

// ============================================================ renderer / scene
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.3, 2500);
const FOG = new THREE.Color('#d0a47c');
scene.fog = new THREE.Fog(FOG, 70, 520);

const sunDir = new THREE.Vector3();
{
  const el = THREE.MathUtils.degToRad(14), az = THREE.MathUtils.degToRad(215);
  sunDir.setFromSphericalCoords(1, Math.PI / 2 - el, az);
}
const sky = new Sky();
sky.scale.setScalar(4000);
const su = sky.material.uniforms;
su.turbidity.value = 7; su.rayleigh.value = 1.8; su.mieCoefficient.value = 0.007; su.mieDirectionalG.value = 0.82;
su.sunPosition.value.copy(sunDir);
scene.add(sky);
const ENV = { pm: new THREE.PMREMGenerator(renderer), scene: new THREE.Scene(), sky: new Sky(), tex: null };
ENV.sky.scale.setScalar(1000); ENV.scene.add(ENV.sky);
function makeEnv(dir, tur, ray, mie) {
  const u = ENV.sky.material.uniforms; u.turbidity.value = tur; u.rayleigh.value = ray; u.mieCoefficient.value = mie; u.mieDirectionalG.value = 0.82; u.sunPosition.value.copy(dir);
  const rt = ENV.pm.fromScene(ENV.scene, 0.02); if (ENV.tex) ENV.tex.dispose(); ENV.tex = rt; scene.environment = rt.texture;
}
makeEnv(sunDir, 7, 1.8, 0.007);
scene.environmentIntensity = 0.55;
const sun = new THREE.DirectionalLight('#ffd6a4', 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const SC = sun.shadow.camera; SC.left = -42; SC.right = 42; SC.top = 42; SC.bottom = -42; SC.near = 1; SC.far = 260;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight('#bcd2e6', '#8a5a36', 0.55); scene.add(hemi);
// headlight for the player's rig (only lit at night; always in the scene so shaders never recompile)
const headL = new THREE.SpotLight('#ffeccc', 0, 150, 0.5, 0.5, 1.1); scene.add(headL, headL.target);
// pooled flash lights (fixed count so shaders never recompile)
const flashes = [0, 1, 2].map(() => { const l = new THREE.PointLight('#ffb060', 0, 30, 1.6); scene.add(l); return { l, t: 0 }; });
function flash(pos, power = 60, dur = 0.25, color = '#ffb060') {
  const f = flashes.reduce((a, b) => (a.t < b.t ? a : b));
  f.l.position.copy(pos); f.l.color.set(color); f.l.userData.p = power; f.l.userData.d = dur; f.t = dur;
}

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.45, 0.95);
composer.addPass(bloom);
composer.addPass(new OutputPass());

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

// ============================================================ noise
function hash2(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, o = 5) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); f *= 2.03; a *= 0.5; } return s / (1 - Math.pow(0.5, o)); }
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rnd = (a, b) => a + Math.random() * (b - a);
const wrapA = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const clamp = THREE.MathUtils.clamp;

// ============================================================ terrain
const ARENA = 240, TS = 900, TN = 225, CELL = TS / TN;
// sand-dune kickers: a long rising face that gets steeper toward a crest, then a short drop off the back
// (cars launch off the lip). x, z = crest centre, a = facing angle, H = height, L = run-up length, W = half width
const RAMPS = [
  { x: 62, z: 28, a: 0.4, H: 4.2, L: 20, W: 11 }, { x: -70, z: 46, a: 2.6, H: 3.6, L: 17, W: 10 },
  { x: -40, z: -92, a: 4.4, H: 5.0, L: 24, W: 13 }, { x: 108, z: -70, a: 3.9, H: 4.6, L: 22, W: 12 },
  { x: 20, z: 140, a: 1.5, H: 5.4, L: 26, W: 14 }, { x: -150, z: -30, a: 0.2, H: 4.4, L: 20, W: 12 },
  { x: 150, z: 95, a: 5.3, H: 3.8, L: 18, W: 10 }, { x: -110, z: 135, a: 1.0, H: 4.8, L: 22, W: 12 },
  { x: 40, z: -165, a: 2.0, H: 4.0, L: 20, W: 11 }, { x: 175, z: -10, a: 3.2, H: 3.4, L: 16, W: 9 },
];
function rampH(x, z) {
  let h = 0;
  for (const r of RAMPS) {
    const dx = x - r.x, dz = z - r.z; if (dx * dx + dz * dz > (r.L + r.W + 10) ** 2) continue;
    const c = Math.cos(r.a), sn = Math.sin(r.a);
    const t = -dx * sn + dz * c; let s = dx * c + dz * sn; s += 0.018 * t * t; // crest curves back like a real dune
    const at = Math.abs(t); if (at > r.W) continue;
    const w = at < r.W * 0.55 ? 1 : 1 - smooth(r.W * 0.55, r.W, at);
    let pr = 0;
    if (s > -r.L && s <= 0) pr = Math.pow((s + r.L) / r.L, 1.8);
    else if (s > 0 && s < 7) pr = Math.pow(1 - s / 7, 2.2);
    h = Math.max(h, r.H * pr * w);
  }
  return h;
}
const onRamp = (x, z, pad = 0) => RAMPS.some((r) => Math.hypot(x - r.x, z - r.z) < r.L * 0.7 + r.W + pad);
function hRaw(x, z) {
  const r = Math.hypot(x, z);
  const d = (fbm(x * 0.011 + 3, z * 0.011 - 7, 5) - 0.5) * 2;
  const ridges = Math.pow(1 - Math.abs(fbm(x * 0.02 - 11, z * 0.02 + 5, 3) * 2 - 1), 3);
  let h = d * 5.5 * smooth(22, 120, r) + ridges * 3.2 * smooth(40, 110, r);
  h += (fbm(x * 0.07, z * 0.07, 3) - 0.5) * 0.7;
  h += rampH(x, z);
  h += Math.max(0, r - ARENA + 20) * 0.28 + Math.pow(Math.max(0, r - ARENA - 10) * 0.07, 2) * 6 * fbm(x * 0.02, z * 0.02, 3);
  return h;
}
const H = new Float32Array((TN + 1) * (TN + 1));
for (let j = 0; j <= TN; j++) for (let i = 0; i <= TN; i++) H[j * (TN + 1) + i] = hRaw(-TS / 2 + i * CELL, -TS / 2 + j * CELL);
// which world is loaded: 'arena' (wave mode, garage) or 'escape' (chapter 1)
const WORLD = { mode: 'arena', h: null };
function height(x, z) { return WORLD.mode === 'arena' ? arenaH(x, z) : WORLD.h(x, z); }
const arenaGroup = new THREE.Group(); scene.add(arenaGroup);
function arenaH(x, z) {
  const fx = (x + TS / 2) / CELL, fz = (z + TS / 2) / CELL;
  const i = clamp(Math.floor(fx), 0, TN - 1), j = clamp(Math.floor(fz), 0, TN - 1);
  const u = fx - i, v = fz - j, k = j * (TN + 1) + i;
  // match the triangle split of PlaneGeometry
  const a = H[k], b = H[k + 1], c = H[k + TN + 1], d = H[k + TN + 2];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function makeTexCanvas(n, fn) {
  const cv = document.createElement('canvas'); cv.width = cv.height = n;
  const cx = cv.getContext('2d'); const img = cx.createImageData(n, n); fn(img.data, n); cx.putImageData(img, 0, 0); return cv;
}
const rippleN = makeTexCanvas(256, (d, n) => {
  const T = 6.283185; const hgt = (x, y) => { const u = x / n * T, v = y / n * T; const warp = 0.035 * Math.sin(u * 2 + Math.sin(v * 3) * 1.5) + 0.02 * Math.sin(u * 5 + v * 2) + 0.012 * Math.sin(u * 9 - v * 4); return Math.sin((y / n + warp) * T * 10); };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const dx = hgt((x + 1) % n, y) - hgt((x - 1 + n) % n, y), dy = hgt(x, (y + 1) % n) - hgt(x, (y - 1 + n) % n);
    const s = 0.9; let nx = -dx * s, ny = -dy * s, nz = 1; const l = Math.hypot(nx, ny, nz);
    const o = (y * n + x) * 4; d[o] = (nx / l * 0.5 + 0.5) * 255; d[o + 1] = (ny / l * 0.5 + 0.5) * 255; d[o + 2] = (nz / l * 0.5 + 0.5) * 255; d[o + 3] = 255;
  }
});
const TERRAIN_TEX = {};
const grain = makeTexCanvas(256, (d, n) => {
  for (let i = 0; i < n * n; i++) { const v = 215 + Math.random() * 40 - (Math.random() < 0.03 ? 60 : 0); d[i * 4] = v; d[i * 4 + 1] = v * 0.97; d[i * 4 + 2] = v * 0.93; d[i * 4 + 3] = 255; }
});
{
  const g = new THREE.PlaneGeometry(TS, TS, TN, TN); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position; const col = new Float32Array(pos.count * 3);
  const cLight = new THREE.Color('#d8a46a'), cDark = new THREE.Color('#9e6636'), cRock = new THREE.Color('#7a4128'), tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i); const y = hRaw(x, z); pos.setY(i, y);
    const n = fbm(x * 0.03, z * 0.03, 4); tmp.copy(cDark).lerp(cLight, smooth(0.3, 0.75, n));
    tmp.lerp(cRock, smooth(ARENA + 5, ARENA + 60, Math.hypot(x, z)) * 0.8);
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.computeVertexNormals();
  const nt = new THREE.CanvasTexture(rippleN); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(170, 170); nt.anisotropy = 8;
  const gt = new THREE.CanvasTexture(grain); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(300, 300); gt.colorSpace = THREE.SRGBColorSpace; gt.anisotropy = 8;
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, map: gt, normalMap: nt, normalScale: new THREE.Vector2(0.55, 0.55), roughness: 0.97, metalness: 0 });
  const t = new THREE.Mesh(g, m); t.receiveShadow = true; arenaGroup.add(t);
  TERRAIN_TEX.grain = gt; TERRAIN_TEX.ripple = nt;
}

// rocks & mesas
const STATIC = []; // {x,z,r}
function rockGeo(detail, amp, seed) {
  const g = new THREE.IcosahedronGeometry(1, detail); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = fbm(v.x * 1.7 + seed, v.y * 1.7 + v.z * 1.3 - seed, 4); v.multiplyScalar(1 + (n - 0.5) * amp); v.y = Math.max(v.y, -0.3); p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g;
}
const rockMat = new THREE.MeshStandardMaterial({ color: '#8a4d2e', roughness: 0.92, flatShading: true });
withSeed(7, () => {
  const g = rockGeo(3, 0.9, 1.3);
  const n = 70; const im = new THREE.InstancedMesh(g, rockMat, n); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let k = 0;
  while (k < n) {
    const a = Math.random() * Math.PI * 2, d = rnd(30, ARENA - 8); const x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (onRamp(x, z, 4)) continue;
    const sc = Math.random() < 0.2 ? rnd(3, 6) : rnd(0.8, 2.4);
    q.setFromEuler(new THREE.Euler(rnd(-0.3, 0.3), rnd(0, 6.28), rnd(-0.3, 0.3))); s.set(sc * rnd(0.9, 1.6), sc * rnd(0.6, 1.1), sc * rnd(0.9, 1.5));
    p.set(x, height(x, z) - sc * 0.15, z); m4.compose(p, q, s); im.setMatrixAt(k++, m4);
    if (sc > 1.4) STATIC.push({ x, z, r: sc * 1.2 });
  }
  im.castShadow = im.receiveShadow = true; arenaGroup.add(im);
  const mg = rockGeo(4, 0.55, 7.1); const mm = new THREE.MeshStandardMaterial({ color: '#8f4a2c', roughness: 0.95, flatShading: true });
  for (let i = 0; i < 22; i++) {
    const a = i / 22 * Math.PI * 2 + rnd(-0.1, 0.1), d = rnd(ARENA + 60, ARENA + 200); const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const me = new THREE.Mesh(mg, mm); me.scale.set(rnd(30, 60), rnd(28, 60), rnd(30, 60)); me.position.set(x, height(x, z) - 8, z); me.rotation.y = rnd(0, 6); arenaGroup.add(me);
  }
});
// ============================================================ breakable props: explosive barrels, tire stacks, cacti
const barrelMat = new THREE.MeshStandardMaterial({ color: '#9a2414', roughness: 0.55, metalness: 0.45, emissive: '#2a0400' });
const hazMat = new THREE.MeshStandardMaterial({ color: '#d9a21c', roughness: 0.6, metalness: 0.3 });
const tireMat = new THREE.MeshStandardMaterial({ color: '#171513', roughness: 0.9 });
const cactusMat = new THREE.MeshStandardMaterial({ color: '#56603a', roughness: 0.85, flatShading: true });
const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.15, 18); barrelGeo.translate(0, 0.575, 0);
const bandGeo = new THREE.CylinderGeometry(0.415, 0.415, 0.16, 18); bandGeo.translate(0, 0.86, 0);
const tireGeo = new THREE.TorusGeometry(0.42, 0.2, 10, 20); tireGeo.rotateX(Math.PI / 2); tireGeo.translate(0, 0.2, 0);
const cTrunk = new THREE.CylinderGeometry(0.32, 0.38, 3.6, 9); cTrunk.translate(0, 1.8, 0);
const cArm = new THREE.CylinderGeometry(0.22, 0.24, 1.3, 8); cArm.translate(0, 0.65, 0);
const cElbow = new THREE.CylinderGeometry(0.22, 0.22, 0.8, 8); cElbow.rotateZ(Math.PI / 2);
const props = []; // { kind, obj, x, z, r, alive }
function makeBarrel(x, z) {
  const g = new THREE.Group(); const m = new THREE.Mesh(barrelGeo, barrelMat), band = new THREE.Mesh(bandGeo, hazMat);
  m.castShadow = m.receiveShadow = band.castShadow = true; g.add(m, band); g.position.set(x, height(x, z), z); g.rotation.y = rnd(0, 6); scene.add(g);
  props.push({ kind: 'barrel', obj: g, x, z, r: 0.55, alive: true, hp: 18 });
}
function makeTires(x, z) {
  const g = new THREE.Group(); const n = 2 + ((Math.random() * 3) | 0);
  for (let k = 0; k < n; k++) { const t = new THREE.Mesh(tireGeo, tireMat); t.position.y = k * 0.36; t.rotation.set(rnd(-0.12, 0.12), 0, rnd(-0.12, 0.12)); t.castShadow = t.receiveShadow = true; g.add(t); }
  g.position.set(x, height(x, z), z); scene.add(g);
  props.push({ kind: 'tires', obj: g, x, z, r: 0.75, alive: true });
}
function makeCactus(x, z) {
  const g = new THREE.Group(); const sc = rnd(0.7, 1.25);
  const t = new THREE.Mesh(cTrunk, cactusMat); g.add(t);
  for (const sd of [-1, 1]) {
    if (Math.random() < 0.25) continue; const y = rnd(1.1, 2.0);
    const e = new THREE.Mesh(cElbow, cactusMat); e.position.set(sd * 0.6, y, 0); g.add(e);
    const a = new THREE.Mesh(cArm, cactusMat); a.position.set(sd * 0.95, y, 0); g.add(a);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.scale.setScalar(sc); g.rotation.y = rnd(0, 6); g.position.set(x, height(x, z) - 0.1, z); scene.add(g);
  props.push({ kind: 'cactus', obj: g, x, z, r: 0.45 * sc, alive: true });
}
function placeProps(seed) { return withSeed(seed == null ? (Math.random() * 1e9) | 0 : seed, placePropsRaw); }
function placePropsRaw() {
  for (const p of props) p.obj.removeFromParent(); props.length = 0;
  const free = (x, z, r) => !STATIC.some((s) => Math.hypot(s.x - x, s.z - z) < s.r + r) && Math.hypot(x, z) > 18 && !onRamp(x, z, r + 3);
  for (let c = 0; c < 16; c++) {
    let cx, cz, k = 0; do { const a = Math.random() * 6.28, d = rnd(30, ARENA - 20); cx = Math.cos(a) * d; cz = Math.sin(a) * d; } while (!free(cx, cz, 3) && ++k < 20);
    const nb = 2 + ((Math.random() * 4) | 0); for (let i = 0; i < nb; i++) makeBarrel(cx + rnd(-1.8, 1.8), cz + rnd(-1.8, 1.8));
    for (let i = 0; i < 2; i++) makeTires(cx + rnd(-3, 3), cz + rnd(-3, 3));
  }
  for (let i = 0; i < 18; i++) { const a = Math.random() * 6.28, d = rnd(40, ARENA - 15), x = Math.cos(a) * d, z = Math.sin(a) * d; if (free(x, z, 3)) makeTires(x, z); }
  for (let i = 0; i < 46; i++) { const a = Math.random() * 6.28, d = rnd(30, ARENA - 10), x = Math.cos(a) * d, z = Math.sin(a) * d; if (free(x, z, 2)) makeCactus(x, z); }
}
// something hit a prop. src = the vehicle responsible (or null)
function breakProp(pr, src, dir) {
  if (!pr.alive || (NET.role === 'guest' && !NET.applying)) return; pr.alive = false;
  const at = V3(pr.x, height(pr.x, pr.z) + 0.6, pr.z); dir = dir || V3(rnd(-1, 1), 0, rnd(-1, 1)).normalize(); netEv('P', props.indexOf(pr), r2(dir.x), r2(dir.z));
  if (pr.kind === "barrel") { pr.obj.removeFromParent(); barrelBlast(at, src); return; }
  const kids = [...pr.obj.children];
  for (const k of kids) { pr.obj.attach(k); scene.attach(k); spawnDebris(k, dir.clone().setY(0).normalize().multiplyScalar(rnd(5, 11)).add(V3(rnd(-2, 2), rnd(3, 7), rnd(-2, 2))), null); }
  pr.obj.removeFromParent();
  if (pr.kind === 'cactus') { for (let i = 0; i < 10; i++) emit(PS_NORM, at.clone().add(V3(0, rnd(0, 2), 0)), V3(rnd(-3, 3), rnd(1, 4), rnd(-3, 3)), rnd(0.6, 1.2), 0.4, 1.2, cactusMat.color, 0.8, COL.dust, 0, 6); }
  else { sfx.clang(); dustBurst({ root: { position: at }, box: { hx: 0.6, hz: 0.6 } }, 6); }
}
function barrelBlast(pos, src) {
  explosion(pos, 0.85); sfx.boom(1.1);
  const R = 9;
  for (const v of vehicles) {
    if (!v.alive) continue; const c = v.root.position.clone().add(V3(0, v.box.hy * 0.4, 0)); const d = c.distanceTo(pos); if (d > R) continue;
    const k = 1 - d / R; const dir = c.clone().sub(pos).setY(0).normalize();
    const by = v === src ? null : src;
    if (v.isPlayer && by && by.team === v.team) continue;
    v.damage((v.isPlayer ? 40 : 80) * Math.pow(k, 0.6), pos, dir, by, 'blast');
    v.vel.addScaledVector(dir, 16 * k / v.mass); v.yawV = clamp(v.yawV + rnd(-2, 2) * k, -2.5, 2.5);
    if (k > 0.35 && !v.air) { v.air = true; v.vy = 5 + 7 * k / v.mass; }
  }
  // chain reaction
  for (const pr of props) if (pr.alive && Math.hypot(pr.x - pos.x, pr.z - pos.z) < R * 0.8) { const q = pr; setTimeout(() => breakProp(q, src, V3(q.x - pos.x, 0, q.z - pos.z).normalize()), pr.kind === 'barrel' ? rnd(120, 300) : 0); }
  for (const db of debris) { const dd = db.obj.position.distanceTo(pos); if (dd < R) { db.settled = false; db.v.add(db.obj.position.clone().sub(pos).setY(0).normalize().multiplyScalar(9 * (1 - dd / R)).add(V3(0, 8 * (1 - dd / R), 0))); } }
}
// a point hit (bullet, flame) near a prop
function hitPropsAt(p, amt, src, radius = 0.7) {
  for (const pr of props) {
    if (!pr.alive || pr.kind !== 'barrel') continue;
    if (Math.abs(pr.x - p.x) > 1.5 || Math.abs(pr.z - p.z) > 1.5) continue;
    const gy = height(pr.x, pr.z); if (Math.hypot(pr.x - p.x, pr.z - p.z) < pr.r + radius && p.y > gy - 0.2 && p.y < gy + 1.5) { pr.hp -= amt; if (pr.hp <= 0) breakProp(pr, src); return true; }
  }
  return false;
}
function propCollisions() {
  for (const v of vehicles) {
    for (const pr of props) {
      if (!pr.alive || Math.abs(v.pos.x - pr.x) > 6 || Math.abs(v.pos.z - pr.z) > 6) continue;
      const dx = v.pos.x - pr.x, dz = v.pos.z - pr.z, d = Math.hypot(dx, dz), m = v.cfg.r * 0.8 + pr.r;
      if (d >= m) continue;
      const sp = v.vel.length();
      if (sp > 4 || pr.kind === 'barrel') { const dir = v.vel.clone().setY(0).normalize(); breakProp(pr, v.alive ? v : null, dir); v.vel.multiplyScalar(pr.kind === 'cactus' ? 0.95 : 0.9); if (v.isPlayer) rumble(0.25, 0.3, 90); }
      else { const nx = dx / (d || 1), nz = dz / (d || 1); v.pos.x += nx * (m - d); v.pos.z += nz * (m - d); }
    }
  }
}

// ============================================================ weathering shader
const NOISE_GLSL = `
float h3(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n3(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
 return mix(mix(mix(h3(i+vec3(0,0,0)),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z); }
float fb3(vec3 p){ float s=0.0,a=0.5; for(int i=0;i<5;i++){ s+=a*n3(p); p*=2.03; a*=0.5; } return s/0.97; }
`;
function weather(mat, rust = 0.35, dust = 1.0, scorch = 0) {
  if (mat.userData.w) return;
  mat.userData.w = true;
  const U = { uRust: { value: rust }, uDust: { value: dust }, uScorch: { value: scorch } };
  mat.userData.U = U;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP; varying vec3 vWN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = transformed; vWN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLP; varying vec3 vWN; uniform float uRust; uniform float uDust; uniform float uScorch;\n' + NOISE_GLSL)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float wn = fb3(vLP*3.1+7.0);
        float rust = smoothstep(1.0-uRust-0.06, 1.0-uRust+0.12, wn);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2,0.075,0.028), rust);
        float fine = fb3(vLP*17.0);
        diffuseColor.rgb *= 0.72 + 0.56*fine;
        float dd = clamp((0.9 - vLP.y)/0.9, 0.0, 1.0)*wn*1.2 + smoothstep(0.65,1.0,vWN.y)*0.5*fine;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.52,0.37,0.22), clamp(dd,0.0,1.0)*0.75*uDust);
        diffuseColor.rgb *= 1.0 - uScorch*(0.75 + 0.2*fine);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.93, max(rust, uScorch));')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, 0.12, rust);');
  };
  mat.customProgramCacheKey = () => 'wthr';
}

// ============================================================ particles
function makePS(additive, cap) {
  const g = new THREE.BufferGeometry();
  const P = new Float32Array(cap * 3), C = new Float32Array(cap * 4), S = new Float32Array(cap);
  g.setAttribute('position', new THREE.BufferAttribute(P, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aColor', new THREE.BufferAttribute(C, 4).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('aSize', new THREE.BufferAttribute(S, 1).setUsage(THREE.DynamicDrawUsage));
  const m = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: innerHeight / 2 }, uDim: { value: 1 } },
    vertexShader: `attribute vec4 aColor; attribute float aSize; varying vec4 vC; uniform float uScale;
      void main(){ vC=aColor; vec4 mv = modelViewMatrix*vec4(position,1.0); gl_PointSize = min(512.0, aSize*uScale/max(0.1,-mv.z)); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `varying vec4 vC; uniform float uDim; void main(){ vec2 p = gl_PointCoord-0.5; float d = length(p); float a = smoothstep(0.5, ${additive ? '0.0' : '0.15'}, d); gl_FragColor = vec4(vC.rgb*uDim, vC.a*a); }`,
    transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; scene.add(pts);
  const list = [];
  return { g, m, list, cap, P, C, S, pts };
}
const PS_ADD = makePS(true, 1400), PS_NORM = makePS(false, 1400);
function emit(ps, pos, vel, life, size0, size1, c0, a0, c1 = c0, a1 = 0, grav = 0, drag = 0) {
  if (ps.list.length >= ps.cap) ps.list.shift();
  ps.list.push({ p: pos.clone(), v: vel.clone(), t: 0, life, size0, size1, c0: c0.clone ? c0 : new THREE.Color(c0), c1: c1.clone ? c1 : new THREE.Color(c1), a0, a1, grav, drag });
}
const _c = new THREE.Color();
function updatePS(ps, dt) {
  const L = ps.list; let w = 0;
  for (let i = 0; i < L.length; i++) {
    const q = L[i]; q.t += dt; if (q.t >= q.life) continue;
    q.v.y -= q.grav * dt; if (q.drag) q.v.multiplyScalar(Math.exp(-q.drag * dt)); q.p.addScaledVector(q.v, dt);
    const k = q.t / q.life; _c.copy(q.c0).lerp(q.c1, k);
    ps.P[w * 3] = q.p.x; ps.P[w * 3 + 1] = q.p.y; ps.P[w * 3 + 2] = q.p.z;
    ps.C[w * 4] = _c.r; ps.C[w * 4 + 1] = _c.g; ps.C[w * 4 + 2] = _c.b; ps.C[w * 4 + 3] = q.a0 + (q.a1 - q.a0) * k;
    ps.S[w] = q.size0 + (q.size1 - q.size0) * k;
    L[w++] = q;
  }
  L.length = w;
  ps.g.setDrawRange(0, w);
  ps.g.attributes.position.needsUpdate = ps.g.attributes.aColor.needsUpdate = ps.g.attributes.aSize.needsUpdate = true;
}
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const COL = { dust: new THREE.Color('#c79a6a'), dust2: new THREE.Color('#e0c09a'), fire: new THREE.Color('#ffb040'), fire2: new THREE.Color('#ff3a0a'), smoke: new THREE.Color('#4a3c30'), smoke2: new THREE.Color('#9a8670'), spark: new THREE.Color('#ffe2a0'), nitro: new THREE.Color('#6ac8ff'), nitro2: new THREE.Color('#2040ff'), flameCore: new THREE.Color('#fff2c0') };
function explosion(pos, big = 1) {
  for (let i = 0; i < 40 * big; i++) emit(PS_ADD, pos.clone().add(V3(rnd(-1, 1), rnd(0, 1.5), rnd(-1, 1))), V3(rnd(-6, 6), rnd(2, 10), rnd(-6, 6)).multiplyScalar(big), rnd(0.4, 0.9), rnd(2, 4) * big, rnd(5, 8) * big, COL.fire, 0.9, COL.fire2, 0, -3, 2.5);
  for (let i = 0; i < 30 * big; i++) emit(PS_NORM, pos.clone().add(V3(rnd(-1.5, 1.5), rnd(0.5, 2), rnd(-1.5, 1.5))), V3(rnd(-3, 3), rnd(2, 7), rnd(-3, 3)), rnd(1.6, 3.2), rnd(2.5, 4) * big, rnd(6, 9) * big, COL.smoke, 0.5, COL.smoke2, 0, -1.2, 1.2);
  for (let i = 0; i < 40 * big; i++) emit(PS_ADD, pos.clone().add(V3(0, 1, 0)), V3(rnd(-18, 18), rnd(4, 18), rnd(-18, 18)), rnd(0.4, 1.2), 0.25, 0.1, COL.spark, 1, COL.fire2, 0.4, 20, 0.5);
  flash(pos.clone().add(V3(0, 2, 0)), 220 * big, 0.5);
  shake(0.6 * big, pos);
  sfx.boom(big);
  if (player) { const k = clamp(1 - player.pos.distanceTo(pos) / 50, 0, 1); if (k > 0) rumble(k * big, k, 380); }
}
function dustBurst(v, n = 16) {
  for (let i = 0; i < n; i++) { const p = v.root.position.clone().add(V3(rnd(-v.box.hx, v.box.hx), 0.3, rnd(-v.box.hz, v.box.hz) * 0.8)); emit(PS_NORM, p, V3(rnd(-4, 4), rnd(1, 3), rnd(-4, 4)), rnd(1.2, 2.2), 1.2, rnd(5, 8), COL.dust, 0.45, COL.dust2, 0, -0.2, 1.5); }
}
function sparks(pos, dir, n = 8) {
  for (let i = 0; i < n; i++) emit(PS_ADD, pos, dir.clone().multiplyScalar(rnd(3, 9)).add(V3(rnd(-4, 4), rnd(1, 6), rnd(-4, 4))), rnd(0.2, 0.5), 0.18, 0.06, COL.spark, 1, COL.fire2, 0.3, 18, 0.5);
}

// ============================================================ assets
const TEMPL = {}; let WEAP = null;
const loader = new GLTFLoader(); loader.setMeshoptDecoder(MeshoptDecoder);
const LMSG = document.getElementById('loadmsg'), LBAR = document.querySelector('#loadbar i');
async function loadAll() {
  const names = ['juggernaut', 'raider', 'scrapper', 'widowmaker', 'blackhorn', 'warwagon', 'weapons'];
  let done = 0;
  const fetchModel = async (n) => {
    const r = await fetch(`${n}.txt`); if (!r.ok) throw new Error('model ' + n + ' ' + r.status);
    const b = atob((await r.text()).trim()); const u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u.buffer;
  };
  await Promise.all(names.map((n) => fetchModel(n).then((buf) => new Promise((res, rej) => loader.parse(buf, '', (g) => {
    g.scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        const m = o.material; const nm = m.name || '';
        if (/Paint|Sheet|Frame|Rim|Hazard/.test(nm)) weather(m, nm === 'Sheet' ? 0.5 : 0.36);
        else if (nm === 'Rust') weather(m, 0.75);
        else if (nm === 'Steel') weather(m, 0.12, 0.5);
        else if (nm === 'Rubber') weather(m, 0.0, 1.0);
      }
    });
    if (n === 'weapons') WEAP = g.scene; else TEMPL[n] = g.scene;
    done++; LBAR.style.width = (done / names.length * 100) + '%'; LMSG.textContent = `Loading rigs ${done}/${names.length}`; res();
  }, rej)))));
}

// ============================================================ audio
const sfx = (() => {
  let ac = null, eng = null, noiseBuf = null, master = null;
  function init() {
    if (ac) return; try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.gain.value = SET.sfx * 0.07; master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 1.5, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), lp = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; lp.type = 'lowpass'; lp.frequency.value = 380; g.gain.value = 0;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(master); o1.start(); o2.start(); eng = { o1, o2, lp, g };
  }
  function noise(dur, f, q, vol, type = 'bandpass', decay = dur) {
    if (!ac) return; const s = ac.createBufferSource(); s.buffer = noiseBuf; const bf = ac.createBiquadFilter(); bf.type = type; bf.frequency.value = f; bf.Q.value = q;
    const g = ac.createGain(); const t = ac.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    s.connect(bf); bf.connect(g); g.connect(master); s.start(t); s.stop(t + dur);
  }
  return {
    init,
    get ctx() { return ac; },
    setVol() { if (master) master.gain.setTargetAtTime(SET.sfx * 0.07, ac.currentTime, 0.05); },
    engine(rpm, on) { if (!eng) return; const t = ac.currentTime; eng.o1.frequency.setTargetAtTime(38 + rpm * 70, t, 0.05); eng.o2.frequency.setTargetAtTime(19 + rpm * 35, t, 0.05); eng.lp.frequency.setTargetAtTime(300 + rpm * 700, t, 0.05); eng.g.gain.setTargetAtTime(on ? 0.05 + rpm * 0.04 : 0, t, 0.1); },
    gun(dist = 0) { noise(0.12, 1500, 0.8, 0.22 / (1 + dist * 0.05), 'bandpass', 0.1); noise(0.1, 180, 1, 0.25 / (1 + dist * 0.05), 'lowpass', 0.09); },
    boom(b = 1) { noise(1.4, 260, 0.7, 0.9 * b, 'lowpass', 1.3); noise(0.3, 1200, 0.5, 0.3 * b, 'bandpass', 0.25); },
    hit() { noise(0.08, 3200, 3, 0.18, 'bandpass', 0.07); },
    clang() { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = rnd(300, 520); const t = ac.currentTime; g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); o.connect(g); g.connect(master); o.start(); o.stop(t + 0.4); noise(0.2, 2400, 2, 0.2, 'bandpass', 0.18); },
    harpoon() { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sawtooth'; const t = ac.currentTime; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.35); g.gain.setValueAtTime(0.14, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4); o.connect(g); g.connect(master); o.start(); o.stop(t + 0.4); },
    rocket(dist = 0) { noise(0.9, 700, 0.6, 0.35 / (1 + dist * 0.04), 'bandpass', 0.8); noise(0.25, 160, 1, 0.3 / (1 + dist * 0.04), 'lowpass', 0.2); },
    flame(dist = 0) { noise(0.16, 520, 0.45, 0.2 / (1 + dist * 0.05), 'lowpass', 0.15); noise(0.14, 2600, 0.7, 0.06 / (1 + dist * 0.05), 'bandpass', 0.12); },
    thunder(big = 1) { noise(3.2, 110, 0.6, 0.9 * big, 'lowpass', 3.0); noise(0.5, 1800, 0.4, 0.35 * big, 'bandpass', 0.4); },
    siren(dist = 0) { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), f = ac.createBiquadFilter(); o.type = 'square'; f.type = 'lowpass'; f.frequency.value = 1800; const t = ac.currentTime, v = 0.09 / (1 + dist * 0.02); for (let k = 0; k < 6; k++) o.frequency.setValueAtTime(k % 2 ? 640 : 900, t + k * 0.22); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.03); g.gain.setValueAtTime(v, t + 1.25); g.gain.linearRampToValueAtTime(0.0001, t + 1.35); o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 1.4); },
    slam() { noise(0.25, 160, 0.8, 0.9, 'lowpass', 0.22); noise(0.1, 2400, 1.5, 0.3, 'bandpass', 0.08); },
    click() { noise(0.05, 4200, 4, 0.5, 'bandpass', 0.04); setTimeout(() => noise(0.04, 3000, 4, 0.35, 'bandpass', 0.03), 70); },
    crank(dur = 0.7) { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = 55; lfo.frequency.value = 11; lg.gain.value = 0.18; lfo.connect(lg); lg.connect(g.gain); g.gain.value = 0.2; const t = ac.currentTime; g.gain.setTargetAtTime(0, t + dur, 0.05); o.connect(g); g.connect(master); o.start(); lfo.start(); o.stop(t + dur + 0.3); lfo.stop(t + dur + 0.3); },
    roar() { noise(1.2, 300, 0.6, 0.7, 'lowpass', 1.1); if (eng) { const t = ac.currentTime; eng.o1.frequency.setValueAtTime(140, t); eng.o2.frequency.setValueAtTime(70, t); eng.g.gain.setValueAtTime(0.16, t); } },
    whimper() { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; const t = ac.currentTime; o.frequency.setValueAtTime(820, t); o.frequency.exponentialRampToValueAtTime(560, t + 0.7); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.06, t + 0.1); g.gain.exponentialRampToValueAtTime(0.001, t + 0.8); o.connect(g); g.connect(master); o.start(); o.stop(t + 0.85); },
    wind(level) { if (!ac) return; if (!this._w) { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420; const g = ac.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(master); s.start(); this._w = { g, f }; } this._w.g.gain.setTargetAtTime(level * 0.5, ac.currentTime, 0.3); this._w.f.frequency.setTargetAtTime(300 + level * 500, ac.currentTime, 0.3); },
    rip() { noise(0.6, 900, 0.6, 0.5, 'bandpass', 0.5); this.clang(); },
    pickup() { if (!ac) return; [520, 780].forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = f; const t = ac.currentTime + i * 0.08; g.gain.setValueAtTime(0.07, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15); o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.16); }); },
  };
})();


// ============================================================ adaptive music
const music = (() => {
  const STEMS = ['pad', 'melody', 'tension', 'battle'];
  let bus = null, gains = {}, started = false, loading = false, muted = false, stingBuf = null, srcs = [];
  try { muted = localStorage.getItem('sk_music') === 'off'; } catch (e) {}
  async function start() {
    const ac = sfx.ctx; if (!ac || started || loading) return; loading = true;
    try {
      const dir = SET.score === 1 ? 'hh_' : ''; srcs = [];
      // decode one stem at a time at 32 kHz: keeps memory low enough for Xbox (full-rate decode of 4 long stems is ~200 MB)
      const bufs = [];
      for (const n of STEMS) { const r = await fetch(`${dir}${n}.ogg`); if (!r.ok) throw new Error(n); bufs.push(await decodeLow(ac, await r.arrayBuffer())); }
      bus = ac.createGain(); bus.gain.value = muted ? 0 : SET.music * 0.07; bus.connect(ac.destination);
      const t0 = ac.currentTime + 0.15;
      STEMS.forEach((n, i) => { const g = ac.createGain(); g.gain.value = 0; g.connect(bus); const src = ac.createBufferSource(); src.buffer = bufs[i]; src.loop = true; src.connect(g); src.start(t0); gains[n] = g; srcs.push(src); });
      started = true;
      fetch(dir + 'stinger.ogg').then((r) => r.arrayBuffer()).then((b) => decodeLow(ac, b)).then((b) => (stingBuf = b)).catch(() => {});
    } catch (e) { console.warn('music unavailable', e); }
    loading = false;
  }
  function set(target) {
    if (!started) return; const ac = sfx.ctx; const t = ac.currentTime;
    for (const n of STEMS) { const g = gains[n].gain; const up = (target[n] || 0) > g.value; g.setTargetAtTime(target[n] || 0, t, up ? 0.35 : 1.6); }
  }
  function toggle() { muted = !muted; try { localStorage.setItem('sk_music', muted ? 'off' : 'on'); } catch (e) {} if (bus) bus.gain.setTargetAtTime(muted ? 0 : SET.music * 0.07, sfx.ctx.currentTime, 0.2); return !muted; }
  function setVol() { if (bus) bus.gain.setTargetAtTime(muted ? 0 : SET.music * 0.07, sfx.ctx.currentTime, 0.1); }
  let reloadQ = false;
  async function reload() {
    if (loading) { reloadQ = true; return; }
    if (started) {
      for (const s of srcs) { try { s.stop(); s.disconnect(); } catch (e) {} }
      for (const k in gains) { try { gains[k].disconnect(); } catch (e) {} }
      if (bus) { try { bus.disconnect(); } catch (e) {} }
      srcs = []; gains = {}; bus = null; stingBuf = null; started = false;
      await new Promise((r) => setTimeout(r, 400)); // let the old music be freed before loading the new one
    }
    try { await start(); } catch (e) { console.warn('music reload failed', e); }
    if (reloadQ) { reloadQ = false; reload(); }
  }
  async function decodeLow(ac, ab) {
    try { const oc = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(2, 1, 32000); return await oc.decodeAudioData(ab); }
    catch (e) { return ac.decodeAudioData(ab); }
  }
  function sting() { netEv('s'); if (!stingBuf || !bus) return; const ac = sfx.ctx; const s = ac.createBufferSource(); s.buffer = stingBuf; const g = ac.createGain(); g.gain.value = 0.9; s.connect(g); g.connect(bus); s.start(); }
  return { start, set, toggle, setVol, sting, reload, get muted() { return muted; } };
})();
let combatHeat = -99; // game time of the last shot, hit or hook involving the player
function musicTarget() {
  const s = game.state;
  // garage and menus: quiet orchestra only
  if (s === 'title' || s === 'garage' || s === 'loading' || s === 'ask' || (s === 'settings' && ['garage', 'ask', 'title'].includes(setFrom))) return { pad: 0.45, melody: 0, tension: 0, battle: 0 };
  if (s === 'over') return { pad: 0.55, melody: 0, tension: 0, battle: 0 };
  if (s === 'upgrade') return { pad: 0.75, melody: 0, tension: 0.35, battle: 0 };
  if (s === 'cine') { if (ESC.ending) return CINE.i >= 3 ? { pad: 0.5, tension: 0, battle: 0, melody: 0 } : { pad: 0.2, tension: 1, battle: 1, melody: 1 }; return CINE.i < 4 ? { pad: 0.7, tension: CINE.i >= 1 ? 0.6 : 0.3, battle: 0, melody: 0 } : { pad: 0.2, tension: 1, battle: 1, melody: 0.8 }; }
  if (s === 'done') return { pad: 0.6, tension: 0, battle: 0, melody: 0.4 };
  let dmin = 1e9, near = 0; if (player) for (const v of vehicles) if (!v.isPlayer && v.alive) { const d = v.pos.distanceTo(player.pos); dmin = Math.min(dmin, d); if (d < 60) near++; }
  const hot = game.t - combatHeat < 5 || dmin < 45 || (player && player.harp && player.harp.state === 'hooked');
  let t;
  if (hot) t = { pad: 0.2, tension: 1, battle: 1, melody: near >= 2 || (player && player.hp < player.hpMax * 0.4) ? 1 : 0.75 };
  else if (dmin < 110) t = { pad: 0.4, tension: 1, battle: 0.35, melody: 0 };
  else t = { pad: 0.75, tension: 0.55, battle: 0, melody: 0 };
  if (game.mode === 'tutorial') { t.battle *= 0.6; t.melody *= 0.6; }
  if (game.mode === 'escape') { t.tension = 1; t.battle = Math.max(t.battle, 0.5); t.pad *= 0.6; }
  if (s === 'paused' || s === 'settings') for (const k in t) t[k] *= 0.35;
  return t;
}


// ============================================================ polish helpers
let rumbleT = 0;
function rumble(strong, weak, ms) {
  if (!SET.vib) return;
  const now = performance.now(); if (now < rumbleT && strong < 0.6) return; rumbleT = now + Math.min(ms, 120);
  try { for (const p of navigator.getGamepads ? navigator.getGamepads() : []) { if (p && p.connected && p.vibrationActuator && p.vibrationActuator.playEffect) p.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: clamp(strong, 0, 1), weakMagnitude: clamp(weak, 0, 1) }).catch(() => {}); } } catch (e) {}
}
const TRACKS = 1400;
const trackMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.42, 1.0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#5a3a20', transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }), TRACKS);
trackMesh.frustumCulled = false; trackMesh.count = 0; scene.add(trackMesh);
let trackI = 0; const _tm = new THREE.Matrix4(), _tq = new THREE.Quaternion(), _ts = new THREE.Vector3(1, 1, 1), _tp = new THREE.Vector3();
function addTrack(x, z, h, w, len = 1) {
  const n = V3(); const e = 0.6; const y = height(x, z);
  n.set(height(x - e, z) - height(x + e, z), 2 * e, height(x, z - e) - height(x, z + e)).normalize();
  _tq.setFromUnitVectors(V3(0, 1, 0), n).multiply(new THREE.Quaternion().setFromAxisAngle(V3(0, 1, 0), h));
  _ts.set(w / 0.42, 1, len); _tp.set(x, y + 0.06, z); _tm.compose(_tp, _tq, _ts);
  trackMesh.setMatrixAt(trackI, _tm); trackI = (trackI + 1) % TRACKS; trackMesh.count = Math.max(trackMesh.count, trackI || TRACKS); trackMesh.instanceMatrix.needsUpdate = true;
}
function clearTracks() { trackMesh.count = 0; trackI = 0; }
// adaptive graphics quality: steps down if the console can't hold a smooth frame rate
const quality = { level: 0, acc: 0, n: 0, slow: 0 };
function applyQuality() {
  const L = quality.level;
  renderer.setPixelRatio(L === 0 ? Math.min(window.devicePixelRatio || 1, 1.5) : L >= 3 ? 0.8 : 1);
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
  if (L >= 3 && sun.shadow.mapSize.x > 1024) { sun.shadow.mapSize.set(1024, 1024); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
}
function trackFps(rawDt) {
  if (game.state !== 'combat' && game.state !== 'garage') return;
  quality.acc += rawDt; quality.n++;
  if (quality.acc >= 2) { const fps = quality.n / quality.acc; quality.acc = 0; quality.n = 0; if (fps < 42 && quality.level < 3) { quality.level++; applyQuality(); } }
}
function renderFrame() { if (quality.level >= 2) renderer.render(scene, camera); else composer.render(); }
// enemy health bars
const barBox = document.getElementById('ebars'); const bars = [];
function drawEnemyBars() {
  let k = 0;
  if (game.state === 'combat' && player) for (const v of vehicles) {
    if (v.isPlayer || !v.alive) continue; const d = v.pos.distanceTo(player.pos); if (d > 75 || (d > 40 && v.hp >= v.hpMax && !v.dmgTaken)) continue;
    const p = v.root.position.clone().add(V3(0, v.box.hy + 1.1, 0)).project(camera); if (p.z > 1 || Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05) continue;
    let b = bars[k]; if (!b) { b = document.createElement('div'); b.className = 'ebar'; b.innerHTML = '<span></span><i><b></b></i><em></em>'; barBox.append(b); bars.push(b); }
    b.style.display = 'block'; b.style.transform = `translate(${((p.x + 1) / 2 * innerWidth).toFixed(0)}px, ${((1 - p.y) / 2 * innerHeight).toFixed(0)}px) translate(-50%, -100%)`;
    b.firstChild.textContent = v.ai && v.ai.dummy ? 'TARGET' : v.cfg.name; b.children[1].firstChild.style.width = Math.max(0, v.hp / v.hpMax * 100) + '%';
    b.children[2].textContent = '▮'.repeat(v.armorLeft()); k++;
  }
  for (let i = k; i < bars.length; i++) bars[i].style.display = 'none';
}
let hurt = 0; const hurtEl = document.getElementById('hurt');

// ============================================================ vehicles
const tmpV = V3(), tmpV2 = V3(), tmpQ = new THREE.Quaternion();
const vehicles = [];
function tintMaterials(root, paint, hazard, extraRust) {
  const cache = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const m0 = o.material;
    if (!cache.has(m0)) {
      const m = m0.clone(); m.userData = {};
      if (m.name === 'Paint') m.color.set(paint);
      else if (m.name === 'Hazard') m.color.set(hazard);
      const r = m.name === 'Rust' ? 0.75 : m.name === 'Steel' ? 0.15 : m.name === 'Rubber' ? 0 : m.name === 'Sheet' ? 0.5 : 0.36;
      if (/Paint|Sheet|Frame|Rim|Hazard|Rust|Steel|Rubber/.test(m.name)) weather(m, Math.min(0.85, r + extraRust));
      cache.set(m0, m);
    }
    o.material = cache.get(m0);
  });
  return [...cache.values()];
}

// exhaust tips per rig, in model (Blender) coords: [x, y fwd, z up, dx, dy, dz]; mirrored to both sides
const EXH = {
  juggernaut: [[1.18, 0.1, 3.48, 0, -0.2, 1]],
  raider: [[0.5, -2.31, 0.98, 0, -1, 0.05]],
  scrapper: [[0.77, 0.38, 0.5, 0.5, -0.8, -0.2], [0.77, 0.58, 0.5, 0.5, -0.8, -0.2], [0.77, 0.78, 0.5, 0.5, -0.8, -0.2], [0.77, 0.98, 0.5, 0.5, -0.8, -0.2]],
  widowmaker: [[1.11, -0.01, 0.4, 0.55, -0.8, -0.15], [1.11, 0.23, 0.4, 0.55, -0.8, -0.15], [1.11, 0.47, 0.4, 0.55, -0.8, -0.15], [1.11, 0.71, 0.4, 0.55, -0.8, -0.15]],
  blackhorn: [[1.08, -1.27, 0.97, 0, -1, 0]],
  warwagon: [[0.72, -1.55, 3.4, 0, -0.18, 1]],
};
const _ep = new THREE.Vector3(), _ed = new THREE.Vector3();
function nitroFlames(v, vel) {
  const list = EXH[v.type]; if (!list) return;
  v.model.updateWorldMatrix(true, false);
  const n = list.length * 2, per = n >= 6 ? 2 : 3;
  for (const t of list) for (const sx of [-1, 1]) {
    const p = v.model.localToWorld(_ep.set(sx * t[0], t[2], -t[1])).clone();
    const d = _ed.set(sx * t[3], t[5], -t[4]).transformDirection(v.model.matrixWorld).clone();
    for (let i = 0; i < per; i++) {
      const sp = d.clone().multiplyScalar(rnd(9, 15)).add(V3(rnd(-0.6, 0.6), rnd(0.1, 0.8), rnd(-0.6, 0.6)));
      if (vel) sp.addScaledVector(vel, 0.85);
      emit(PS_ADD, p.clone().addScaledVector(d, rnd(0, 0.3)), sp, rnd(0.16, 0.3), rnd(0.9, 1.3), rnd(0.2, 0.45), i ? COL.fire : COL.flameCore, 1, COL.fire2, 0, -2);
    }
    if (Math.random() < 0.5) emit(PS_NORM, p, d.clone().multiplyScalar(4).add(V3(0, 1.5, 0)).addScaledVector(vel || V3(), 0.7), rnd(0.5, 0.9), 0.5, 2.2, COL.smoke, 0.25, COL.smoke2, 0);
  }
}
class Vehicle {
  constructor(type, load, isPlayer = false, paint = null) {
    this.type = type; this.cfg = CFG[type]; this.load = load; this.isPlayer = isPlayer;
    this.root = new THREE.Group(); this.root.rotation.order = 'YXZ';
    this.model = TEMPL[type].clone(true); this.model.rotation.y = Math.PI; this.lean = new THREE.Group(); this.lean.rotation.order = 'YXZ'; this.root.add(this.lean); this.lean.add(this.model);
    this.mats = paint ? tintMaterials(this.model, paint[0], paint[1], paint[2] || 0) : null;
    scene.add(this.root);
    const g = (n) => this.model.getObjectByName(n);
    this.wheels = ['Wheel_FL', 'Wheel_FR', 'Wheel_ML', 'Wheel_MR', 'Wheel_RL', 'Wheel_RR'].map(g).filter(Boolean);
    this.wheels.forEach((w) => { w.rotation.order = 'YXZ'; w.userData.front = /F[LR]$/.test(w.name); { const bb = new THREE.Box3().setFromObject(w); w.userData.r = Math.max(0.2, (bb.max.y - bb.min.y) / 2); } w.userData.home = { p: w.position.clone(), q: w.quaternion.clone(), parent: w.parent }; });
    // armor
    const tiers = ARMORS[load.armor].tiers;
    this.pieces = [];
    const arm = []; this.model.traverse((o) => { if (/^A[12]_/.test(o.name) && o.parent === this.model) arm.push(o); });
    for (const o of arm) {
      const t = +o.name[1];
      if (t > tiers) { o.removeFromParent(); continue; }
      const key = Object.keys(PIECE_NAMES).find((k) => o.name.includes(k)) || 'Side';
      const max = t === 2 ? 55 : 40;
      this.pieces.push({ node: o, hp: max, max, key, label: PIECE_NAMES[key], attached: true, home: { p: o.position.clone(), q: o.quaternion.clone() } });
    }
    // ram
    for (const n of ['Ram_Spike', 'Ram_Saw', 'Ram_SawRear']) { const o = g(n); const keep = (load.ram === 'spike' && n === 'Ram_Spike') || (load.ram === 'saw' && n.startsWith('Ram_Saw')); if (o && !keep) o.removeFromParent(); }
    { const ring = []; this.model.traverse((o) => { if (/^Ram_Spike(Ring|Hub)/.test(o.name)) ring.push(o); }); if (load.ram !== 'spike') ring.forEach((o) => o.removeFromParent()); }
    this.spikeRing = load.ram === 'spike';
    this.blades = [g('Ram_SawBlade_L'), g('Ram_SawBlade_R'), g('Ram_SawRearBlade_L'), g('Ram_SawRearBlade_R')].filter((o) => o && load.ram === 'saw');
    this.rearSaw = load.ram === 'saw';
    this.team = isPlayer ? 'p' : 'e';
    this.ram = RAMS[load.ram];
    // weapon
    // weapons: the main gun from the build, plus a harpoon on every rig (swap with the D-pad)
    const mount = g('Mount_Turret');
    if (load.weapon === 'harpoon' || !WEAPONS[load.weapon]) load.weapon = 'cannon';
    this.paint = paint; this.paintIdx = paint ? ENEMY_PAINT.indexOf(paint) : -1; const mk = (kind) => this.makeGun(kind);
    this.guns = { primary: mk(load.weapon), harpoon: mk('harpoon') };
    this.bolt = this.guns.harpoon.base.getObjectByName('Harpoon_Bolt') || null;
    this.rkAmmo = 1; this.rkReload = 0; this.fuel = 100; this.swapT = 0;
    this.wYaw = 0; this.wPitch = 0;
    this.setActive('primary');
    // state
    const armorMul = ARMORS[load.armor].speed;
    this.maxSpeed = this.cfg.max * armorMul; this.accel = this.cfg.accel * armorMul;
    this.hpMax = this.cfg.hp; this.hp = this.hpMax;
    this.mass = this.cfg.mass * (1 + tiers * 0.12);
    this.pos = V3(); this.h = 0; this.vel = V3(); this.y = 0; this.vy = 0; this.air = false; this.pitch = 0; this.roll = 0; this.steerVis = 0;
    this.nitro = 100; this.heat = 0; this.cool = 0; this.alive = true; this.wheelsLost = 0; this.barrel = 0;
    this.harp = { state: 'ready', t: 0 }; this.mods = baseMods();
    this.box = { hx: this.cfg.hx, hy: this.cfg.hy, hz: this.cfg.hz };
    this.hitFlash = 0; this.yawV = 0; this.leanP = 0; this.leanR = 0; this.sy = 0; this.svy = 0; this.prevVF = 0; this.trackD = 0;
  }
  get wk() { return this.guns[this.active].kind; }
  makeGun(kind) {
    const mount = this.model.getObjectByName('Mount_Turret'); const paint = this.paint;
    const WN = GUN_NODE[kind] || 'Cannon';
    const base = WEAP.getObjectByName(WN + '_Base').clone(true); base.position.set(0, 0, 0); mount.add(base);
    if (paint) tintMaterials(base, paint[0], paint[1], paint[2] || 0);
    base.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return { kind, base, gun: base.getObjectByName(WN + '_Gun'), muzzle: base.getObjectByName(WN + '_Muzzle') || null };
  }
  setActive(k) {
    this.active = k;
    for (const n in this.guns) this.guns[n].base.visible = n === k;
    const G = this.guns[k]; this.wBase = G.base; this.wGun = G.gun; this.muzzle = G.kind === 'cannon' ? G.muzzle : null;
    G.base.rotation.y = this.wYaw; G.gun.rotation.x = this.wPitch;
  }
  place(x, z, h) { this.pos.set(x, 0, z); this.h = h; this.y = groundAt(x, z, 0); this.vel.set(0, 0, 0); this.syncTransform(1); }
  get fwd() { return tmpV.set(Math.sin(this.h), 0, Math.cos(this.h)); }
  armorLeft() { return this.pieces.filter((p) => p.attached).length; }
  update(dt, inp0) {
    const inp = Object.assign({ throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false }, inp0);
    const c = this.cfg;
    if (!this.alive) { this.vel.multiplyScalar(Math.exp(-1.5 * dt)); this.pos.addScaledVector(this.vel, dt); if (WORLD.mode === 'arena') { const r = Math.hypot(this.pos.x, this.pos.z); if (r > ARENA) { this.pos.multiplyScalar(ARENA / r); this.vel.multiplyScalar(0.3); } } else if (WORLD.mode === 'port') portClamp(this, dt); { const g = groundAt(this.pos.x, this.pos.z, this.y) - 0.35; if (this.y > g + 1.5) { this.vy -= 24 * dt; this.y = Math.max(g, this.y + this.vy * dt); } else { this.vy = 0; this.y = Math.max(this.y - 0.2 * dt, g); } } this.syncTransform(dt); return; }
    const fx = Math.sin(this.h), fz = Math.cos(this.h), rx = -Math.cos(this.h), rz = Math.sin(this.h);
    let vF = this.vel.x * fx + this.vel.z * fz, vR = this.vel.x * rx + this.vel.z * rz;
    const wheelPen = 1 - this.wheelsLost * 0.18;
    const nit = inp.nitro && this.nitro > 1 && !this.air;
    if (nit) this.nitro = Math.max(0, this.nitro - 30 * this.mods.drain * dt); else this.nitro = Math.min(100, this.nitro + (10 + this.mods.nitroRegen) * dt);
    this.nitOn = nit;
    const vmax = this.maxSpeed * (nit ? 1.55 : 1) * wheelPen;
    if (!this.air) {
      if (inp.throttle > 0.02) vF += this.accel * inp.throttle * (nit ? 2.6 : 1) * wheelPen * dt * Math.max(0, 1 - vF / vmax) * (vF < 0 ? 2.2 : 1);
      if (nit && inp.throttle <= 0.02 && vF > -1) vF += this.accel * 1.6 * dt * Math.max(0, 1 - vF / vmax);
      if (inp.brake > 0.02) { if (vF > 0.5) vF -= 26 * inp.brake * dt; else vF = Math.max(-vmax * 0.32, vF - this.accel * 0.7 * inp.brake * dt); }
      if (inp.throttle <= 0.02 && inp.brake <= 0.02) vF *= Math.exp(-0.35 * dt);
      if (vF > vmax) vF += (vmax - vF) * Math.min(1, 1.5 * dt);
      // drift: handbrake at speed kicks the tail out, the rear lets go, speed is mostly kept.
      // Counter-steer holds the slide. Letting go of the button grips back up and turns the slide into forward speed.
      if (inp.handbrake && vF > 9 && !this.drifting) { this.drifting = true; this.yawV += -(inp.steer || 0) * 0.55; }
      if (this.drifting && ((!inp.handbrake && Math.abs(vR) < 2.2) || vF < 5)) this.drifting = false;
      let grip = c.grip * (this.wheelsLost ? 0.7 : 1);
      if (this.drifting) { const slipA = Math.abs(Math.atan2(vR, Math.abs(vF) + 0.1)); grip *= (inp.handbrake ? 0.3 : 0.6) + Math.max(0, slipA - 0.55) * 3; }
      else if (inp.handbrake) grip *= 0.3;
      const lost = vR * (1 - Math.exp(-grip * dt)); vR -= lost;
      if (this.drifting) { vF += Math.abs(lost) * 0.6 * Math.sign(vF || 1); this.driftT = (this.driftT || 0) + dt; if (Math.abs(vR) > 3.5) this.nitro = Math.min(100, this.nitro + 16 * this.mods.driftNitro * dt); }
      else this.driftT = 0;
      if (inp.handbrake) vF *= Math.exp(-(this.drifting ? 0.12 : 0.6) * dt);
      const sp = clamp(Math.abs(vF) / 7, 0, 1) * Math.sign(vF || 1);
      const hiSp = 1 - clamp(Math.abs(vF) / (vmax * 1.6), 0, 0.45);
      this.h -= inp.steer * c.turn * sp * hiSp * (this.drifting ? 1.3 : inp.handbrake ? 1.2 : 1) * dt;
      if (this.wheelsLost) this.h += Math.sin(performance.now() / 300 + this.wheelsLost) * 0.25 * dt * Math.abs(sp);
    } else {
      this.h -= inp.steer * c.turn * 0.25 * dt;
    }
    this.h += this.yawV * dt; this.yawV *= Math.exp(-2.6 * dt);
    // gripping: velocity turns with the rig (arcade). Drifting: velocity keeps its old direction so the rig slides.
    const slide = this.drifting && !this.air;
    const nfx = slide ? fx : Math.sin(this.h), nfz = slide ? fz : Math.cos(this.h), nrx = slide ? rx : -Math.cos(this.h), nrz = slide ? rz : Math.sin(this.h);
    this.vel.set(nfx * vF + nrx * vR, 0, nfz * vF + nrz * vR);
    this.pos.addScaledVector(this.vel, dt);
    const r = WORLD.mode === 'arena' ? Math.hypot(this.pos.x, this.pos.z) : 0;
    if (WORLD.mode !== 'arena' && WORLD.clamp) WORLD.clamp(this, dt);
    if (r > ARENA) { const nx = this.pos.x / r, nz = this.pos.z / r; this.pos.x = nx * ARENA; this.pos.z = nz * ARENA; const out = this.vel.x * nx + this.vel.z * nz; if (out > 0) { this.vel.x -= nx * out * 1.5; this.vel.z -= nz * out * 1.5; } }
    // vertical
    const g = groundAt(this.pos.x, this.pos.z, this.y);
    if (this.air) { this.vy -= 24 * dt; this.y += this.vy * dt; if (this.y <= g) { if (this.vy < -9) { shake(0.25, this.pos); dustBurst(this, 20); if (this.isPlayer) rumble(0.7, 0.4, 160); } this.svy += this.vy * 0.35; this.y = g; this.vy = 0; this.air = false; } }
    else { const pred = this.y + this.vy * dt; if ((g < pred - 0.08 && this.vy > 2.5) || g < this.y - 1.4) { this.air = true; this.y = pred; this.vy = this.vy > 6 ? this.vy * 1.05 + 1 : Math.min(this.vy, 0.5); if (this.vy > 6) this.jumpT = 0; } else { this.vy = clamp((g - this.y) / dt, -30, 30); this.y = g; } }
    const accL = (vF - this.prevVF) / Math.max(dt, 1e-3); this.prevVF = vF;
    const yawRate = -inp.steer * c.turn * clamp(Math.abs(vF) / 7, 0, 1) * Math.sign(vF || 1);
    const tP = this.air ? 0 : clamp(-accL * 0.0045, -0.07, 0.06), tR = this.air ? 0 : clamp(vF * yawRate * 0.0065, -0.085, 0.085);
    const kl = 1 - Math.exp(-6 * dt); this.leanP += (tP - this.leanP) * kl; this.leanR += (tR - this.leanR) * kl;
    this.svy += (-90 * this.sy - 9 * this.svy) * dt; this.sy = clamp(this.sy + this.svy * dt, -0.3, 0.2);
    this.lean.rotation.x = this.leanP; this.lean.rotation.z = this.leanR; this.lean.position.y = this.sy;
    this.syncTransform(dt, inp.steer, vF);
    // tire tracks
    if (!this.air && Math.abs(vF) > 2 && (!player || this.pos.distanceToSquared(player.pos) < 14000)) {
      this.tr = this.tr || [null, null];
      [-1, 1].forEach((sd, i) => {
        const p = this.root.localToWorld(tmpV2.set(sd * this.box.hx * 0.78, 0, -this.box.hz * 0.45)); const L = this.tr[i];
        if (!L) { this.tr[i] = V3(p.x, 0, p.z); return; }
        const dx = p.x - L.x, dz = p.z - L.z, d = Math.hypot(dx, dz);
        if (d > 5) { L.set(p.x, 0, p.z); return; }
        if (d > 0.8) { addTrack((p.x + L.x) / 2, (p.z + L.z) / 2, Math.atan2(dx, dz), Math.abs(vR) > 4 ? 0.65 : 0.45, d + 0.1); L.set(p.x, 0, p.z); }
      });
    } else if (this.tr) this.tr = [null, null];
    if (this.isPlayer && nit && game.state === 'combat') rumble(0, 0.25, 90);
    // effects
    this.speed = vF;
    const fast = Math.abs(vF) > 6 || Math.abs(vR) > 4;
    if (!this.air && fast && Math.random() < 0.9) {
      for (const s of [-1, 1]) {
        const p = this.root.localToWorld(tmpV2.set(s * this.box.hx * 0.8, 0.25, -this.box.hz * 0.55)).clone();
        emit(PS_NORM, p, V3(rnd(-1, 1), rnd(0.8, 2.2), rnd(-1, 1)).addScaledVector(this.vel, -0.15), rnd(1.0, 2.0), rnd(0.8, 1.3), rnd(3.5, 6) * (Math.abs(vR) > 4 ? 1.4 : 1), COL.dust, 0.32, COL.dust2, 0, -0.3, 1.2);
      }
    }
    if (this.drifting && !this.air && Math.abs(vR) > 3) for (const s of [-1, 1]) { const p = this.root.localToWorld(tmpV2.set(s * this.box.hx * 0.85, 0.35, -this.box.hz * 0.6)).clone(); emit(PS_NORM, p, V3(rnd(-1.5, 1.5), rnd(1, 2.5), rnd(-1.5, 1.5)).addScaledVector(this.vel, -0.1), rnd(1.4, 2.4), 1.2, rnd(6, 9), COL.dust2, 0.42, COL.smoke2, 0, -0.4, 1.4); }
    if (nit) { nitroFlames(this, this.vel);
      if (Math.random() < 0.3) flash(this.root.localToWorld(tmpV2.set(0, 1, -this.box.hz - 1)).clone(), 18, 0.06, '#ff8a30'); }
    if (this.hp < this.hpMax * 0.35 && Math.random() < 0.4) { const p = this.root.localToWorld(tmpV2.set(rnd(-0.5, 0.5), this.box.hy * 0.6, this.box.hz * 0.5)).clone(); emit(PS_NORM, p, V3(rnd(-0.5, 0.5), rnd(2, 4), rnd(-0.5, 0.5)), rnd(1.5, 2.5), 0.8, 3.2, COL.smoke, 0.35, COL.smoke2, 0, -0.5); }
    // weapon cooling
    this.heat = Math.max(0, this.heat - (this.overheat ? 30 : 38) * dt); if (this.overheat && this.heat < 25) this.overheat = false;
    this.cool -= dt;
    if (!this.flaming) { this.fuel = Math.min(100, this.fuel + 16 * this.mods.cool * dt); if (this.fuelOut && this.fuel > 35) this.fuelOut = false; }
    this.flaming = false;
    if (this.rkReload > 0) { this.rkReload -= dt; if (this.rkReload <= 0) this.rkAmmo = 1; }
    if (this.swapT > 0) { this.swapT -= dt; this.wBase.scale.setScalar(1 - Math.max(0, this.swapT) / 0.3 * 0.55); }
    for (const b of this.blades) b.rotation.y += 30 * dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
  }
  syncTransform(dt, steer = 0, vF = 0) {
    const L = this.box.hz * 1.5, W = this.box.hx * 1.5, fx = Math.sin(this.h), fz = Math.cos(this.h), rx = -Math.cos(this.h), rz = Math.sin(this.h);
    const hF = groundAt(this.pos.x + fx * L / 2, this.pos.z + fz * L / 2, this.y), hB = groundAt(this.pos.x - fx * L / 2, this.pos.z - fz * L / 2, this.y);
    const hR = groundAt(this.pos.x + rx * W / 2, this.pos.z + rz * W / 2, this.y), hL = groundAt(this.pos.x - rx * W / 2, this.pos.z - rz * W / 2, this.y);
    const tp = this.air ? this.pitch * 0.98 - 0.15 * dt : Math.atan2(hF - hB, L), tr = this.air ? this.roll * 0.98 : Math.atan2(hL - hR, W);
    const k = 1 - Math.exp(-10 * dt);
    this.pitch += (tp - this.pitch) * k; this.roll += (tr - this.roll) * k;
    this.root.position.set(this.pos.x, this.y, this.pos.z);
    this.root.rotation.set(-this.pitch, this.h, this.roll);
    this.steerVis += (steer - this.steerVis) * Math.min(1, 12 * dt);
    for (const w of this.wheels) { if (w.parent !== this.model) continue; w.rotation.x -= vF / w.userData.r * dt; w.rotation.y = w.userData.front ? -this.steerVis * 0.45 : 0; }
    this.root.updateMatrixWorld(true);
  }
  aimAt(p, dt, rate = 5) {
    if (!this.wBase) return;
    const par = this.wBase.parent; const l = par.worldToLocal(tmpV2.copy(p));
    const dx = l.x - this.wBase.position.x, dz = l.z - this.wBase.position.z;
    const yaw = Math.atan2(-dx, -dz);
    const d = wrapA(yaw - this.wYaw); this.wYaw += clamp(d, -rate * dt, rate * dt); this.wBase.rotation.y = this.wYaw;
    const piv = this.wGun.getWorldPosition(tmpV2); const hd = Math.hypot(p.x - piv.x, p.z - piv.z);
    const pt = clamp(Math.atan2(p.y - piv.y, hd) + this.pitch * Math.cos(this.wYaw), -0.25, 0.6);
    this.wPitch += (pt - this.wPitch) * Math.min(1, 8 * dt); this.wGun.rotation.x = this.wPitch;
  }
  gunDir() { this.wGun.updateWorldMatrix(true, false); return this.wGun.getWorldDirection(V3()).negate(); }
  muzzlePos() {
    if (this.wk === 'flamer') return this.guns[this.active].muzzle.getWorldPosition(V3());
    if (this.wk === 'rockets') return this.wGun.localToWorld(V3(0, 0.12, -1.2));
    if (this.muzzle) { const off = (this.barrel ^= 1) ? 0.11 : -0.11; return this.wGun.localToWorld(V3(off, 0.02, -1.9)); }
    return this.wGun.localToWorld(V3(0, 0.13, -1.4));
  }
  // --------------------------------------------------------- damage
  damage(amount, at, dir, src, kind) {
    if (!this.alive || NET.role === 'guest') return;
    { const r = ARMORS[this.load.armor] && ARMORS[this.load.armor].resist; if (r && kind && r[kind]) amount *= r[kind]; }
    if (src && src !== this && src.team === this.team) return; // no friendly fire
    if (this.isPlayer && src !== this) amount *= D().dmg * this.mods.taken;
    this.dmgTaken = (this.dmgTaken || 0) + amount;
    if (this.isPlayer || (src && src.isPlayer)) combatHeat = game.t;
    let best = null, bd = 2.6;
    if (at) for (const p of this.pieces) { if (!p.attached) continue; const d = p.node.getWorldPosition(tmpV2).distanceTo(at); if (d < bd) { bd = d; best = p; } }
    if (best) {
      best.hp -= amount; this.hp -= amount * 0.18; best.node.userData.flash = 0.12;
      if (best.hp <= 0) this.detachPiece(best, dir, src);
    } else this.hp -= amount;
    this.hitFlash = 0.1;
    if (this.isPlayer) { shake(Math.min(0.35, amount * 0.02), at); hurt = Math.min(1, hurt + amount * 0.035); rumble(Math.min(1, amount * 0.05), Math.min(1, amount * 0.08), 140); }
    if (this.minHp) this.hp = Math.max(this.hp, this.minHp);
    if (this.hp <= 0) this.destroy(src);
  }
  detachPiece(p, dir, src, ripped = false) {
    if (!p.attached) return;
    p.attached = false;
    if (src && src.isPlayer) { this.lostToPlayer = (this.lostToPlayer || 0) + 1; if (ripped) this.rippedByPlayer = true; }
    scene.attach(p.node);
    const v = (dir ? dir.clone() : V3(rnd(-1, 1), 0, rnd(-1, 1))).setY(0).normalize().multiplyScalar(ripped ? 14 : rnd(4, 8)).add(V3(0, rnd(5, 9), 0)).add(this.vel.clone().multiplyScalar(0.6));
    spawnDebris(p.node, v, { kind: 'piece', key: p.key, label: p.label, from: this, piece: p });
    sparks(p.node.getWorldPosition(V3()), dir || V3(0, 1, 0), 14);
    sfx.clang();
    if (NET.applying) {} else if (this.isPlayer) toast('Armor lost', p.label);
    else if (src && src.isPlayer) toast(ripped ? 'Ripped off' : 'Shot off', p.label);
  }
  detachWheel(dir) {
    const cand = this.wheels.filter((w) => w.parent === this.model);
    if (!cand.length) return false;
    const w = cand[(Math.random() * cand.length) | 0];
    scene.attach(w);
    spawnDebris(w, (dir || V3(0, 0, 1)).clone().setY(0).normalize().multiplyScalar(12).add(V3(0, 7, 0)), { kind: 'wheel', from: this, label: 'Studded Wheel' });
    this.wheelsLost++;
    this.damage(35, null, dir, null);
    return true;
  }
  destroy(src) {
    if (!this.alive) return;
    this.alive = false; this.hp = 0;
    const c = this.root.position.clone().add(V3(0, 1.2, 0));
    explosion(c, this.type === 'juggernaut' ? 1.6 : 1.2);
    for (const p of this.pieces) if (p.attached) this.detachPiece(p, V3(rnd(-1, 1), 0, rnd(-1, 1)), null);
    for (let i = 0; i < 2; i++) { const cand = this.wheels.filter((w) => w.parent === this.model); if (!cand.length) break; const w = cand[(Math.random() * cand.length) | 0]; scene.attach(w); spawnDebris(w, V3(rnd(-10, 10), rnd(8, 13), rnd(-10, 10)), { kind: 'wheel', from: this, label: 'Studded Wheel' }); }
    const mats = this.mats || tintMaterials(this.model, '#2a2420', '#3a2a20', 0.3);
    this.mats = mats; for (const m of mats) if (m.userData.U) m.userData.U.uScorch.value = 0.8;
    this.vy = 6; this.burn = 14;
    if (!this.isPlayer && NET.role !== 'guest') { spawnCrate(this.root.position.clone(), this); if (src && src.isPlayer) onKill(this); }
  }
  // --------------------------------------------------------- weapons
  tryFire(dt, target, hold, press) {
    if (!this.alive || this.swapT > 0) return;
    const wk = this.wk;
    if (wk === 'cannon') {
      if (!hold || this.overheat || this.cool > 0) return;
      this.cool = this.isPlayer ? 0.085 : 0.16;
      this.heat += (this.isPlayer ? 2.1 : 1.2) / this.mods.cool; if (this.heat >= 100) { this.overheat = true; if (this.isPlayer) toast('Cannon', 'OVERHEATED'); }
      const p = this.muzzlePos(); const d = this.gunDir();
      const spread = this.isPlayer ? 0.012 : 0.05 * D().spread; d.x += rnd(-spread, spread); d.y += rnd(-spread, spread) * 0.6; d.z += rnd(-spread, spread); d.normalize();
      fireBullet(p, d, this, (this.isPlayer ? 7 : 2.2) * this.mods.gun);
      if (this.isPlayer) combatHeat = game.t;
      emit(PS_ADD, p.clone().addScaledVector(d, 0.3), d.clone().multiplyScalar(4), 0.06, 1.3, 0.6, COL.fire, 1, COL.fire2, 0);
      emit(PS_NORM, p.clone(), d.clone().multiplyScalar(2).add(V3(0, 1, 0)), 0.6, 0.4, 1.4, COL.smoke2, 0.25, COL.smoke2, 0);
      if (this.isPlayer || Math.random() < 0.3) flash(p.clone().addScaledVector(d, 1.5), this.isPlayer ? 5 : 10, 0.05, '#ffc070');
      sfx.gun(this.isPlayer ? 0 : this.pos.distanceTo(player ? player.pos : this.pos));
      if (this.isPlayer) { shake(0.05); rumble(0.05, 0.22, 50); }
    } else if (wk === 'flamer') {
      if (!hold || this.fuelOut || this.fuel <= 0) return;
      this.flaming = true;
      this.fuel = Math.max(0, this.fuel - (this.isPlayer ? 24 : 18) * dt); if (this.fuel <= 0) { this.fuelOut = true; if (this.isPlayer) toast('Flamethrower', 'OUT OF FUEL'); }
      const p = this.muzzlePos(), d = this.gunDir();
      const n = this.isPlayer ? 7 : 4;
      for (let k = 0; k < n; k++) {
        const v = d.clone().multiplyScalar(rnd(24, 32)).add(V3(rnd(-2.2, 2.2), rnd(-1, 2), rnd(-2.2, 2.2))).addScaledVector(this.vel, 0.9);
        emit(PS_ADD, p.clone().addScaledVector(d, rnd(0, 0.5)), v, rnd(0.42, 0.62), rnd(0.3, 0.6), rnd(2.6, 4.2), k % 3 ? COL.fire : COL.flameCore, 1, COL.fire2, 0, -5, 1.8);
      }
      if (Math.random() < 0.35) emit(PS_NORM, p.clone().addScaledVector(d, 10), d.clone().multiplyScalar(10).add(V3(0, 4, 0)).addScaledVector(this.vel, 0.8), rnd(0.9, 1.4), 1.5, 5, COL.smoke, 0.28, COL.smoke2, 0, -1, 1);
      if (Math.random() < 0.25) flash(p.clone().addScaledVector(d, 4), this.isPlayer ? 26 : 16, 0.08, '#ff7a20');
      // cone damage
      const cosA = Math.cos(0.3), R = 18;
      for (const v of vehicles) {
        if (v === this || !v.alive || v.team === this.team) continue;
        const to = v.root.position.clone().add(V3(0, v.box.hy * 0.4, 0)).sub(p); const L = to.length(); if (L > R + v.cfg.r) continue;
        if (to.normalize().dot(d) < cosA - v.cfg.r / Math.max(L, 1) * 0.5) continue;
        v.damage((this.isPlayer ? 34 : 10) * this.mods.gun * dt, null, d, this, 'fire'); v.burn = Math.max(v.burn || 0, 2.6); v.burnSrc = this;
        if (this.isPlayer && Math.random() < 0.1) hitMarker();
      }
      for (const pr of props) { if (!pr.alive || pr.kind === 'tires') continue; const to = V3(pr.x - p.x, 0, pr.z - p.z); const L = to.length(); if (L > R || to.normalize().dot(V3(d.x, 0, d.z).normalize()) < cosA) continue; pr.hp = (pr.hp || 6) - 30 * dt; if (pr.hp <= 0) breakProp(pr, this); }
      if ((this.fsT = (this.fsT || 0) - dt) <= 0) { this.fsT = 0.12; sfx.flame(this.isPlayer ? 0 : this.pos.distanceTo(player ? player.pos : this.pos)); }
      if (this.isPlayer) { combatHeat = game.t; rumble(0.1, 0.25, 80); }
    } else if (wk === 'rockets') {
      if (this.rkReload > 0 || this.cool > 0 || !(press || hold)) return;
      this.cool = this.isPlayer ? 0.2 : 1.1;
      const p = this.muzzlePos(); const d = this.gunDir(); d.y += 0.03; d.normalize();
      fireRocket(p, d, this, target);
      if (--this.rkAmmo <= 0) this.rkReload = (this.isPlayer ? 1.5 : 4.5) / this.mods.cool;
      const back = this.wGun.localToWorld(V3(0, 0.12, 1.0));
      for (let k = 0; k < 6; k++) emit(PS_NORM, back, d.clone().multiplyScalar(-rnd(4, 9)).add(V3(rnd(-1, 1), rnd(0.5, 1.5), rnd(-1, 1))), rnd(0.7, 1.2), 0.8, 3.5, COL.smoke2, 0.5, COL.smoke2, 0, 0, 2);
      emit(PS_ADD, back, d.clone().multiplyScalar(-5), 0.12, 1.4, 0.6, COL.fire, 1, COL.fire2, 0);
      flash(p, this.isPlayer ? 8 : 14, 0.08, '#ffb060');
      sfx.rocket(this.isPlayer ? 0 : this.pos.distanceTo(player ? player.pos : this.pos));
      if (this.isPlayer) { combatHeat = game.t; shake(0.12); rumble(0.35, 0.3, 110); }
    } else {
      const H = this.harp;
      if (press && H.state === 'ready') launchHarpoon(this, target);
      else if (press && H.state === 'hooked') releaseHarpoon(this, false);
    }
  }
}

// ============================================================ bullets
const bullets = [];
const tracerGeo = new THREE.BoxGeometry(0.07, 0.07, 2.4);
const tracerMat = new THREE.MeshBasicMaterial({ color: '#ffd28a', toneMapped: false });
const tracerMatE = new THREE.MeshBasicMaterial({ color: '#ff7a5a', toneMapped: false });
const bulletPool = [];
function fireBullet(p, d, owner, dmg) {
  if (Math.random() < 0.5) netEv('b', r2(p.x), r2(p.y), r2(p.z), r3(d.x), r3(d.y), r3(d.z), owner.isPlayer ? 1 : 0);
  let m = bulletPool.pop(); if (!m) { m = new THREE.Mesh(tracerGeo, owner.isPlayer ? tracerMat : tracerMatE); scene.add(m); }
  m.material = owner.isPlayer ? tracerMat : tracerMatE; m.visible = true;
  bullets.push({ p: p.clone(), v: d.clone().multiplyScalar(owner.isPlayer ? 170 : 120), life: 0.8, owner, dmg, m });
}
const _a = V3(), _b = V3();
function segBox(v, p0, p1) {
  v.root.worldToLocal(_a.copy(p0)); v.root.worldToLocal(_b.copy(p1));
  const B = v.box; let t0 = 0, t1 = 1;
  const mn = [-B.hx, 0, -B.hz], mx = [B.hx, B.hy, B.hz], a = [_a.x, _a.y, _a.z], d = [_b.x - _a.x, _b.y - _a.y, _b.z - _a.z];
  for (let i = 0; i < 3; i++) {
    if (Math.abs(d[i]) < 1e-6) { if (a[i] < mn[i] || a[i] > mx[i]) return -1; continue; }
    let ta = (mn[i] - a[i]) / d[i], tb = (mx[i] - a[i]) / d[i]; if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if (t0 > t1) return -1;
  }
  return t0;
}
function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i]; b.life -= dt;
    const p0 = b.p.clone(); b.p.addScaledVector(b.v, dt);
    let hit = false;
    for (const v of vehicles) {
      if (v === b.owner || !v.alive || v.team === b.owner.team) continue; if (v.pos.distanceToSquared(b.p) > 400) continue;
      const t = segBox(v, p0, b.p);
      if (t >= 0) {
        const hp = p0.clone().lerp(b.p, t);
        v.damage(b.dmg, hp, b.v.clone().normalize(), b.owner, 'gun');
        sparks(hp, b.v.clone().normalize().negate(), 5); sfx.hit();
        if (b.owner.isPlayer) hitMarker();
        hit = true; break;
      }
    }
    if (!hit && hitPropsAt(b.p, b.dmg, b.owner)) hit = true;
    if (!hit && (b.p.y < groundAt(b.p.x, b.p.z, b.p.y) || solidAt(b.p))) { for (let k = 0; k < 3; k++) emit(PS_NORM, b.p.clone(), V3(rnd(-1, 1), rnd(1, 3), rnd(-1, 1)), 0.8, 0.5, 2, COL.dust, 0.5, COL.dust2, 0, 3); hit = true; }
    if (hit || b.life <= 0) { b.m.visible = false; bulletPool.push(b.m); bullets.splice(i, 1); continue; }
    b.m.position.copy(b.p); b.m.lookAt(tmpV.copy(b.p).add(b.v));
  }
}


// ============================================================ rockets
const rockets = [];
const rkBodyGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.75, 10); rkBodyGeo.rotateX(Math.PI / 2);
const rkTipGeo = new THREE.ConeGeometry(0.07, 0.22, 10); rkTipGeo.rotateX(Math.PI / 2); rkTipGeo.translate(0, 0, 0.48);
const rkFinGeo = new THREE.BoxGeometry(0.3, 0.02, 0.16); rkFinGeo.translate(0, 0, -0.3);
const rkMat = new THREE.MeshStandardMaterial({ color: '#3a3530', metalness: 0.6, roughness: 0.5 });
const rkTipMat = new THREE.MeshStandardMaterial({ color: '#c99a1e', metalness: 0.3, roughness: 0.6 });
function makeRocketMesh() {
  const g = new THREE.Group(); g.add(new THREE.Mesh(rkBodyGeo, rkMat), new THREE.Mesh(rkTipGeo, rkTipMat));
  const f1 = new THREE.Mesh(rkFinGeo, rkMat), f2 = new THREE.Mesh(rkFinGeo, rkMat); f2.rotation.z = Math.PI / 2; g.add(f1, f2); return g;
}
function fireRocket(p, d, owner, target) {
  netEv('r', r2(p.x), r2(p.y), r2(p.z), r3(d.x), r3(d.y), r3(d.z), owner.nid || 0);
  const m = makeRocketMesh(); m.position.copy(p); scene.add(m);
  rockets.push({ p: p.clone(), v: d.clone().multiplyScalar(48), owner, target: target && target.alive ? target : null, life: 3.2, m });
}
function updateRockets(dt) {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i]; r.life -= dt; const p0 = r.p.clone();
    const sp = Math.min(82, r.v.length() + 45 * dt);
    if (r.target && r.target.alive) {
      const want = r.target.root.position.clone().add(V3(0, r.target.box.hy * 0.45, 0)).sub(r.p).normalize();
      const cur = r.v.clone().normalize(); const ang = cur.angleTo(want); const turn = Math.min(1, (2.2 * dt) / Math.max(ang, 1e-3));
      r.v.copy(cur.lerp(want, turn).normalize().multiplyScalar(sp));
    } else { r.v.setLength(sp); r.v.y -= 3 * dt; }
    r.p.addScaledVector(r.v, dt);
    r.m.position.copy(r.p); r.m.lookAt(tmpV.copy(r.p).add(r.v));
    const tail = r.p.clone().addScaledVector(r.v, -0.012);
    emit(PS_ADD, tail, r.v.clone().multiplyScalar(-0.05), 0.12, 0.9, 0.3, COL.fire, 1, COL.fire2, 0);
    emit(PS_NORM, tail, V3(rnd(-0.4, 0.4), rnd(0.2, 0.8), rnd(-0.4, 0.4)), rnd(1.2, 2), 0.5, 2.6, COL.smoke2, 0.4, COL.smoke2, 0, -0.3, 1);
    let hit = null;
    for (const v of vehicles) {
      if (v === r.owner || !v.alive || v.team === r.owner.team) continue; if (v.pos.distanceToSquared(r.p) > 400) continue;
      const t = segBox(v, p0, r.p); if (t >= 0) { hit = p0.clone().lerp(r.p, t); break; }
    }
    if (!hit) for (const pr of props) if (pr.alive && pr.kind !== 'cactus' && Math.hypot(pr.x - r.p.x, pr.z - r.p.z) < pr.r + 0.4 && r.p.y < height(pr.x, pr.z) + 1.6) { hit = r.p.clone(); break; }
    if (!hit && solidAt(r.p)) hit = r.p.clone();
    if (!hit && r.p.y < groundAt(r.p.x, r.p.z, r.p.y)) hit = r.p.clone().setY(groundAt(r.p.x, r.p.z, r.p.y) + 0.2);
    if (hit || r.life <= 0) { rocketBlast(hit || r.p.clone(), r.owner); r.m.removeFromParent(); rockets.splice(i, 1); }
  }
}
function rocketBlast(pos, owner) {
  explosion(pos, 0.7);
  const R = 7.5;
  for (const v of vehicles) {
    if (!v.alive || v.team === owner.team) continue;
    const c = v.root.position.clone().add(V3(0, v.box.hy * 0.4, 0)); const d = c.distanceTo(pos); if (d > R) continue;
    const k = 1 - d / R; const dir = c.clone().sub(pos).setY(0).normalize();
    v.damage((owner.isPlayer ? 62 : 26) * owner.mods.gun * Math.pow(k, 0.7), pos, dir, owner, 'blast');
    v.vel.addScaledVector(dir, 14 * k / v.mass); v.yawV = clamp(v.yawV + rnd(-1.5, 1.5) * k, -2.5, 2.5);
    if (k > 0.45 && !v.air) { v.air = true; v.vy = 4 + 5 * k / v.mass; }
  }
  for (const db of debris) { const dd = db.obj.position.distanceTo(pos); if (dd < R) { db.settled = false; db.v.add(db.obj.position.clone().sub(pos).setY(0).normalize().multiplyScalar(8 * (1 - dd / R)).add(V3(0, 7 * (1 - dd / R), 0))); } }
  for (const pr of props) if (pr.alive && Math.hypot(pr.x - pos.x, pr.z - pos.z) < R) breakProp(pr, owner, V3(pr.x - pos.x, 0, pr.z - pos.z).normalize());
  if (WORLD.mode === 'escape' && ESC.ending && pos.z > ESC.BZ0 - 10 && pos.z < ESC.BZ1 + 10 && !ESC.collapsed) { ESC.collapsed = true; collapseBridge(pos); }
}
function clearRockets() { for (const r of rockets) r.m.removeFromParent(); rockets.length = 0; }

// ============================================================ harpoon
const cableMat = new THREE.MeshStandardMaterial({ color: '#2a2622', metalness: 0.8, roughness: 0.4 });
const cableGeo = new THREE.CylinderGeometry(0.035, 0.035, 1, 6); cableGeo.rotateX(Math.PI / 2); cableGeo.translate(0, 0, 0.5);
function launchHarpoon(v, lock = null) {
  const H = v.harp; const d = v.gunDir(); const p = v.muzzlePos();
  H.state = 'flying'; H.t = 0; H.p = p.clone(); H.v = d.multiplyScalar(95).add(V3(0, 1.5, 0)); H.target = null;
  // locked on (red ring): the bolt homes in and always hooks
  H.lock = lock && lock.alive && lock.team !== v.team && lock.pos.distanceTo(v.pos) < 110 ? lock : null;
  if (H.lock) H.v = H.lock.root.position.clone().add(V3(0, H.lock.box.hy * 0.5, 0)).sub(p).normalize().multiplyScalar(110);
  H.proj = v.bolt.clone(); scene.add(H.proj); v.bolt.visible = false;
  H.cable = H.cable || new THREE.Mesh(cableGeo, cableMat); H.cable.visible = true; scene.add(H.cable);
  sfx.harpoon(); shake(0.12);
}
function swapWeapon(v) {
  if (!v.alive || v.swapT > 0) return;
  if (v.harp.state === 'hooked' || v.harp.state === 'flying') releaseHarpoon(v);
  v.setActive(v.active === 'primary' ? 'harpoon' : 'primary'); v.swapT = 0.3;
  if (v.isPlayer) { $('wname').textContent = WEAPONS[v.wk].name; sfx.clang(); rumble(0.1, 0.3, 60); }
}
function releaseHarpoon(v, reel = true) {
  const H = v.harp; H.state = 'reload'; H.t = 0; H.target = null;
  if (H.anchor) { H.anchor.removeFromParent(); H.anchor = null; }
  if (H.proj) { H.proj.removeFromParent(); H.proj = null; }
  if (H.cable) H.cable.visible = false;
}
function updateHarpoon(v, dt) {
  const H = v.harp; if (H.state === 'ready') return;
  if (!v.alive && H.state !== 'reload') releaseHarpoon(v);
  const start = v.guns.harpoon.gun.localToWorld(V3(0, 0.13, -1.4));
  if (H.state === 'flying') {
    H.t += dt; const p0 = H.p.clone();
    const L = H.lock && H.lock.alive ? H.lock : null;
    if (L) { const aim = L.root.position.clone().add(V3(0, L.box.hy * 0.5, 0)); H.v.copy(aim.sub(H.p).normalize().multiplyScalar(Math.max(110, H.v.length()))); }
    else H.v.y -= 9 * dt;
    H.p.addScaledVector(H.v, dt);
    // guaranteed hit: if the homing bolt reaches its target without the box test catching it, hook it anyway
    if (L && H.p.distanceTo(L.root.position.clone().add(V3(0, L.box.hy * 0.5, 0))) < Math.max(L.box.hx, L.box.hz) + 1.2) H.forceHit = L;
    H.proj.position.copy(H.p); H.proj.lookAt(tmpV.copy(H.p).sub(H.v)); // bolt points -Z
    for (const t of vehicles) {
      if (t === v || !t.alive || t.team === v.team) continue; if (t.pos.distanceToSquared(H.p) > 400) continue;
      let k = segBox(t, p0, H.p);
      if (k < 0 && H.forceHit === t) k = 1;
      if (k >= 0) {
        const hp = H.forceHit === t ? t.root.position.clone().add(V3(0, t.box.hy * 0.55, 0)).lerp(p0, 0.15) : p0.clone().lerp(H.p, k); H.forceHit = null; H.lock = null;
        H.state = 'hooked'; H.target = t; H.t = 0; H.rip = 0;
        H.anchor = new THREE.Object3D(); t.root.add(H.anchor); t.root.worldToLocal(H.anchor.position.copy(hp));
        H.proj.removeFromParent(); H.anchor.add(H.proj); H.proj.position.set(0, 0, 0); H.proj.quaternion.copy(t.root.getWorldQuaternion(tmpQ).invert().multiply(H.proj.quaternion));
        H.rest = start.distanceTo(hp) + 1.5;
        t.damage(14, hp, H.v.clone().normalize(), v, 'gun'); sparks(hp, V3(0, 1, 0), 12); sfx.clang();
        if (v.isPlayer) { toast('Harpoon', 'HOOKED ' + t.cfg.name); rumble(0.6, 0.5, 150); }
        break;
      }
    }
    if (H.state === 'flying' && (H.t > (H.lock ? 1.6 : 0.9) || (!H.lock && (H.p.y < groundAt(H.p.x, H.p.z, H.p.y) || solidAt(H.p))))) releaseHarpoon(v);
  } else if (H.state === 'hooked') {
    const t = H.target; H.t += dt;
    if (!t || !t.alive || H.t > 7) { releaseHarpoon(v); }
    else {
      const ap = H.anchor.getWorldPosition(V3());
      const dist = start.distanceTo(ap);
      const dir = ap.clone().sub(start).setY(0).normalize();
      if (v.reelIn) { const before = H.rest; H.rest = Math.max(4.5, Math.min(H.rest, dist) - 10 * v.mods.reel * dt); H.reeled = (H.reeled || 0) + Math.max(0, before - H.rest); H.reelT = (H.reelT || 0) + dt; if (Math.random() < 0.3) sparks(start, V3(0, 1, 0), 1); if (v.isPlayer && Math.random() < 0.2) rumble(0.15, 0.3, 60); }
      const excess = dist - H.rest;
      if (excess > 0) {
        const f = excess * 9;
        t.vel.addScaledVector(dir, -f / t.mass * dt);
        v.vel.addScaledVector(dir, f / v.mass * dt * 0.7);
        const away = Math.max(0, -v.vel.dot(dir));
        H.rip += (excess * 14 + away * 3.5) * v.mods.rip * dt / (t.type === 'juggernaut' ? 1.6 : 1);
        if (Math.random() < excess * 0.2) sparks(ap, V3(0, 1, 0), 2);
        if (H.rip >= 100) {
          let best = null, bd = 3.2; for (const p of t.pieces) { if (!p.attached) continue; const d = p.node.getWorldPosition(tmpV2).distanceTo(ap); if (d < bd) { bd = d; best = p; } }
          const rdir = dir.clone().negate();
          if (!best) best = t.pieces.find((p) => p.attached) || null;
          if (best) { t.detachPiece(best, rdir, v, true); t.damage(10, null, rdir, v); }
          else if (t.detachWheel(rdir)) { if (v.isPlayer) { toast('Ripped off', 'A WHEEL'); t.rippedByPlayer = true; } }
          else t.damage(60, null, rdir, v);
          sfx.rip(); shake(0.4); if (v.isPlayer) rumble(1, 0.8, 320); releaseHarpoon(v);
        }
      }
      if (excess > 26) releaseHarpoon(v);
      if (H.state === 'hooked') H.end = ap;
    }
  } else if (H.state === 'reload') {
    H.t += dt; if (H.t > 1.1 * v.mods.harpReload) { H.state = 'ready'; if (v.bolt) v.bolt.visible = true; }
  }
  if (H.cable && H.cable.visible) {
    const end = H.state === 'flying' ? H.p : H.end || start;
    H.cable.position.copy(start); H.cable.lookAt(end); H.cable.scale.set(1, 1, Math.max(0.01, start.distanceTo(end)));
  }
}

// ============================================================ debris & pickups
const debris = [];
const ringGeo = new THREE.TorusGeometry(1.6, 0.07, 8, 40); ringGeo.rotateX(Math.PI / 2);
const ringMat = new THREE.MeshBasicMaterial({ color: '#ffc24a', transparent: true, opacity: 0.9, toneMapped: false });
function spawnDebris(obj, vel, info) {
  debris.push({ obj, v: vel.clone(), w: V3(rnd(-6, 6), rnd(-6, 6), rnd(-6, 6)), t: 0, info, settled: false, ring: null });
}
function crateTex() {
  return makeTexCanvas(64, (d, n) => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const s = ((x + y) >> 3) & 1; const o = (y * n + x) * 4; const e = x < 4 || y < 4 || x > n - 5 || y > n - 5; d[o] = e ? 40 : s ? 214 : 30; d[o + 1] = e ? 36 : s ? 160 : 26; d[o + 2] = e ? 30 : s ? 30 : 22; d[o + 3] = 255; } });
}
const crateMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(crateTex()), roughness: 0.7, metalness: 0.3 });
crateMat.map.colorSpace = THREE.SRGBColorSpace;
function spawnCrate(pos, from) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.8, 1.1), crateMat); m.castShadow = true; m.position.copy(pos).add(V3(0, 2, 0)); scene.add(m);
  const ca = rnd(0, 6.28); spawnDebris(m, V3(Math.cos(ca) * 6.5, 9, Math.sin(ca) * 6.5), { kind: 'crate', from, label: SALVAGE[(Math.random() * SALVAGE.length) | 0] });
}
function updateDebris(dt) {
  for (let i = debris.length - 1; i >= 0; i--) {
    if (i >= debris.length) continue;
    const d = debris[i]; d.t += dt; const o = d.obj;
    if (!d.settled) {
      d.v.y -= 22 * dt; o.position.addScaledVector(d.v, dt);
      o.rotation.x += d.w.x * dt; o.rotation.y += d.w.y * dt; o.rotation.z += d.w.z * dt;
      const g = height(o.position.x, o.position.z) + 0.25;
      if (o.position.y < g) { o.position.y = g; d.v.y = Math.abs(d.v.y) * 0.3; d.v.x *= 0.55; d.v.z *= 0.55; d.w.multiplyScalar(0.5); if (d.v.lengthSq() < 2 && d.t > 0.5) { d.settled = true; } }
    }
    const pickable = NET.role !== 'guest' && d.t > 0.9 && d.info && player && player.alive && (d.info.kind === 'crate' || d.info.kind === 'piece' || d.info.kind === 'wheel') && d.info.from !== player;
    if (pickable && d.settled && !d.ring) { d.ring = new THREE.Mesh(ringGeo, ringMat); scene.add(d.ring); }
    if (d.ring) { d.ring.position.set(o.position.x, height(o.position.x, o.position.z) + 0.15, o.position.z); d.ring.scale.setScalar(1 + Math.sin(d.t * 5) * 0.08); d.ring.rotation.y += dt; }
    if (pickable && player.pos.distanceTo(tmpV.set(o.position.x, 0, o.position.z)) < player.cfg.r + 2.2) { collect(d); const j = debris.indexOf(d); if (j >= 0) removeDebris(j); continue; }
    if (d.t > 45 || (d.info && d.info.from === player && d.t > 25)) removeDebris(i);
  }
}
function removeDebris(i) { const d = debris[i]; d.obj.removeFromParent(); if (d.ring) d.ring.removeFromParent(); debris.splice(i, 1); }
function collect(d) {
  sfx.pickup(); game.collected = (game.collected || 0) + 1;
  const I = d.info;
  if (I.kind === 'crate') {
    const s = 40 + ((Math.random() * 60) | 0); game.scrap += s; player.hp = Math.min(player.hpMax, player.hp + 30);
    toast('Salvaged +' + s + ' scrap', I.label, true);
  } else {
    // bolt an enemy plate onto a missing slot of the same kind, else any missing slot
    const miss = player.pieces.filter((p) => !p.attached);
    const slot = miss.find((p) => p.key === I.key) || miss[0];
    if (slot && I.kind === 'piece') {
      // take back our own node if it is lying around, else re-show our node
      const idx = debris.findIndex((q) => q.obj === slot.node); if (idx >= 0) removeDebris(idx);
      slot.node.removeFromParent(); player.model.add(slot.node); slot.node.position.copy(slot.home.p); slot.node.quaternion.copy(slot.home.q); slot.node.scale.set(1, 1, 1);
      slot.attached = true; slot.hp = slot.max;
      toast('Bolted on', I.label + ' (stolen)', true);
    } else {
      game.scrap += 15; player.hp = Math.min(player.hpMax, player.hp + 12);
      toast('Stripped for scrap +15', I.label, true);
    }
  }
}

// ============================================================ camera shake
let trauma = 0;
function shake(a, at) { const k = (at && player ? clamp(1 - player.pos.distanceTo(at) / 60, 0, 1) : 1) * [0, 0.45, 1][SET.shake]; trauma = Math.min(1, trauma + a * k); }

// ============================================================ input
const keys = new Set(); const kPressed = new Set();
addEventListener('keydown', (e) => { if (!keys.has(e.code)) kPressed.add(e.code); keys.add(e.code); if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault(); });
addEventListener('keyup', (e) => keys.delete(e.code));
let mouseDX = 0, mouseDown = false;
canvas.addEventListener('mousedown', (e) => { if (game.state === 'combat') { mouseDown = true; if (document.pointerLockElement !== canvas) { try { const r = canvas.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (err) {} } } });
addEventListener('mouseup', () => (mouseDown = false));
addEventListener('mousemove', (e) => { if (document.pointerLockElement === canvas) mouseDX += e.movementX; });
const pads = { prev: [{}, {}] };
let padErr = '', padShown = -1;
function padStatus(n) {
  const k = padErr ? -2 : n; if (k === padShown) return; padShown = k;
  const el = document.getElementById('padstat'); if (!el) return;
  el.className = padErr ? 'bad' : n ? 'ok' : '';
  el.textContent = padErr ? 'Controller blocked by this page (' + padErr + '). Open the game from its own link.' : n ? (n > 1 ? '2 controllers connected' : 'Controller connected') : 'No controller detected. Press any button on it.';
}
// Edge on Xbox maps the controller's B button to Back. Keep Back inside the game while a controller is in use.
let backTrap = false;
function armBackTrap() {
  if (backTrap) return; backTrap = true;
  try { history.pushState({ sk: 1 }, ''); history.pushState({ sk: 2 }, ''); } catch (e) {}
}
addEventListener('popstate', () => { if (backTrap) { try { history.pushState({ sk: 2 }, ''); } catch (e) {} } });
addEventListener('gamepadconnected', armBackTrap);
addEventListener('keydown', (e) => { if (['GamepadB', 'BrowserBack', 'GoBack'].includes(e.key) || e.keyCode === 196 || e.keyCode === 166) { e.preventDefault(); e.stopPropagation(); } }, true);
addEventListener('beforeunload', (e) => { if (backTrap && (game.state === 'combat' || game.state === 'paused')) { e.preventDefault(); e.returnValue = ''; } });
function readPads() {
  let list = [];
  try { list = (navigator.getGamepads ? [...navigator.getGamepads()] : []).filter((p) => p && p.connected); padErr = ''; }
  catch (e) { padErr = e && e.name ? e.name : 'blocked'; }
  padStatus(list.length);
  if (list.length) armBackTrap();
  const out = [];
  list.slice(0, 2).forEach((p, i) => {
    const b = (k) => (p.buttons[k] ? p.buttons[k].value : 0);
    const dz = (v) => (Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85);
    const cur = { A: b(0), B: b(1), X: b(2), Y: b(3), LB: b(4), RB: b(5), LT: b(6), RT: b(7), VIEW: b(8), MENU: b(9), UP: b(12), DOWN: b(13), LEFT: b(14), RIGHT: b(15), lx: dz(p.axes[0] || 0), ly: dz(p.axes[1] || 0), rx: dz(p.axes[2] || 0), ry: dz(p.axes[3] || 0) };
    const prev = pads.prev[i] || {};
    cur.pressed = (k) => cur[k] > 0.5 && !(prev[k] > 0.5);
    pads.prev[i] = cur; out.push(cur);
  });
  return out;
}

// ============================================================ UI
const $ = (id) => document.getElementById(id);
const feed = $('feed');
function toast(small, big, salv = false) {
  netEv('t', small, big, salv ? 1 : 0);
  const d = document.createElement('div'); d.className = 'toast' + (salv ? ' salv' : '');
  const s = document.createElement('small'); s.textContent = small; d.append(s, document.createTextNode(big)); feed.prepend(d);
  while (feed.children.length > 4) feed.lastChild.remove();
  setTimeout(() => d.remove(), 2600);
}
let hitT = 0; function hitMarker() { hitT = 0.12; }
const OPTS = [
  { key: 'mode', label: 'Mode', list: ['waves', 'escape'], name: (v) => (v === 'waves' ? 'WAVE MODE' : 'CH 1: ESCAPE') },
  { key: 'map', label: 'Map', list: ['dunes', 'port'], name: (v) => ({ dunes: 'DESERT DUNES', port: 'CONTAINER PORT' })[v] },
  { key: 'time', label: 'Time', list: ['day', 'sunrise', 'sunset', 'night'], name: (v) => v.toUpperCase() },
  { key: 'type', label: 'Vehicle', list: ['juggernaut', 'raider', 'scrapper', 'widowmaker', 'blackhorn', 'warwagon'], name: (v) => CFG[v].name },
  { key: 'weapon', label: 'Main gun', list: ['cannon', 'rockets', 'flamer'], name: (v) => WEAPONS[v].name },
  { key: 'ram', label: 'Ram', list: ['spike', 'saw', 'none'], name: (v) => RAMS[v].name },
  { key: 'armor', label: 'Armor', list: ARMOR_TYPES, name: (v) => ARMORS[v].name },
];
const load = { mode: 'waves', time: 'day', type: 'juggernaut', weapon: 'cannon', ram: 'spike', armor: 'ballistic' };
try { const s = JSON.parse(localStorage.getItem('sk_load') || 'null'); if (s) Object.assign(load, s); } catch (e) {}
if (!ARMOR_TYPES.includes(load.armor)) load.armor = 'ballistic';
if (load.map !== 'port') load.map = 'dunes';
if (!CFG[load.type]) load.type = 'juggernaut';
if (!['day', 'sunrise', 'sunset', 'night'].includes(load.time)) load.time = 'day';
if (!['cannon', 'rockets', 'flamer'].includes(load.weapon)) load.weapon = 'cannon';
let selRow = 0;
function buildGarageUI() {
  const rows = $('rows'); rows.innerHTML = '';
  OPTS.forEach((o, i) => {
    const r = document.createElement('div'); r.className = 'row' + (i === selRow ? ' sel' : '');
    const lab = document.createElement('div'); lab.className = 'label'; lab.textContent = o.label;
    const l = document.createElement('button'); l.className = 'arrow'; l.id = 'opt-l-' + o.key; l.textContent = '◀'; l.setAttribute('aria-label', 'Previous ' + o.label);
    const mid = document.createElement('div'); const v = document.createElement('div'); v.className = 'val'; v.textContent = o.name(load[o.key]);
    const sub = document.createElement('div'); sub.className = 'sub'; sub.textContent = `${o.list.indexOf(load[o.key]) + 1} / ${o.list.length}`; mid.append(v, sub);
    const rr = document.createElement('button'); rr.className = 'arrow'; rr.id = 'opt-r-' + o.key; rr.textContent = '▶'; rr.setAttribute('aria-label', 'Next ' + o.label);
    l.onclick = () => { selRow = i; cycle(i, -1); }; rr.onclick = () => { selRow = i; cycle(i, 1); };
    r.onclick = (e) => { if (e.target === r || e.target === lab) { selRow = i; buildGarageUI(); } };
    r.append(lab, l, mid, rr); rows.append(r);
  });
  const o = OPTS[selRow]; const k = load[o.key];
  $('go').firstChild.textContent = load.mode === 'escape' ? 'START CHAPTER 1: ESCAPE' : 'HIT THE PROVING GROUND';
  $('blurb').textContent = o.key === 'map' ? (k === 'port' ? 'Abandoned container port. Drive through open containers, climb the stacks, jump the lanes off the skyway, and fight under the cranes. Wave mode only.' : 'Open desert with dune jumps, rocks and wrecks.') : o.key === 'time' ? ({ day: 'High sun over the proving ground.', sunrise: 'First light. Long shadows and a cold orange sky.', sunset: 'The sun goes down red over the dunes.', night: 'Moon, stars and your headlights. Raiders run with their lights on. Chapter 1 is always at night.' })[k] : o.key === 'mode' ? (k === 'waves' ? 'Endless raider waves in the proving ground. Upgrade between waves. Free.' : 'Chapter 1. Night falls, a storm rolls in, raiders on your tail and one bridge out. About 5 minutes.') : o.key === 'type' ? CFG[k].blurb : o.key === 'weapon' ? WEAPONS[k].blurb + ' Every rig also carries a harpoon. Swap to it with the D-pad.' : o.key === 'ram' ? RAMS[k].blurb : ARMORS[k].blurb;
  const c = CFG[load.type], a = ARMORS[load.armor];
  const armorPts = a.tiers;
  const nPieces = armorPts === 0 ? 0 : (TEMPL[load.type] ? countPieces(load.type, armorPts) : 0);
  const armorHP = nPieces * (armorPts === 2 ? 48 : 40);
  const stats = [
    ['Hull', c.hp, 260, c.hp], ['Armor', armorHP, 520, armorHP],
    ['Top speed', Math.round(c.max * a.speed * 2.237), 105, Math.round(c.max * a.speed * 2.237) + ''],
    ['Handling', Math.round(c.turn * c.grip * 10), 200, Math.round(c.turn * c.grip * 10)],
    ['Ram power', Math.round(RAMS[load.ram].mult * c.mass * 30 * (c.ramMul || 1) + RAMS[load.ram].grind), 190, Math.round(RAMS[load.ram].mult * c.mass * 30 * (c.ramMul || 1) + RAMS[load.ram].grind)],
    ['Firepower', WEAPONS[load.weapon].dps, 70, WEAPONS[load.weapon].dps],
  ];
  const st = $('stats'); st.innerHTML = '';
  for (const [n, v, m, t] of stats) { const a1 = document.createElement('div'); a1.className = 'label'; a1.textContent = n; const b = document.createElement('div'); b.className = 'bar'; const i1 = document.createElement('i'); i1.style.width = Math.min(100, v / m * 100) + '%'; b.append(i1); const nn = document.createElement('div'); nn.className = 'n'; nn.textContent = t; st.append(a1, b, nn); }
}
function countPieces(type, tier) { let n = 0; TEMPL[type].traverse((o) => { if (/^A[12]_/.test(o.name) && o.parent === TEMPL[type] && +o.name[1] <= tier) n++; }); return n; }
function cycle(i, d) {
  const o = OPTS[i]; const L = o.list; load[o.key] = L[(L.indexOf(load[o.key]) + d + L.length) % L.length];
  try { localStorage.setItem('sk_load', JSON.stringify(load)); } catch (e) {}
  if (o.key === 'time') applyTime(load.time);
  if (o.key === 'map') syncMap();
  buildGarageUI(); spawnGarageRig();
}
$('go').onclick = () => (trained() ? startCombat(load.mode) : askTraining());
$('train').onclick = () => startCombat('tutorial');
$('setbtn').onclick = () => openSettings();
$('netbtn').onclick = () => openNet();
$('nhostb').onclick = () => hostNet();
$('njoinb').onclick = () => { netUI.mode = 'joining'; drawNet(); };
$('nback').onclick = () => (netUI.mode === 'choose' ? closeNet() : (netLeave(), (netUI.mode = 'choose'), netStatus(''), drawNet()));
$('ngo').onclick = () => { if (!NET.client) joinNet(); };
function trained() { try { return localStorage.getItem('sk_trained') === '1'; } catch (e) { return false; } }
function setTrained() { try { localStorage.setItem('sk_trained', '1'); } catch (e) {} }
$('bretry').onclick = () => (game.state === 'paused' ? resume() : game.state === 'ask' ? startCombat('tutorial') : startCombat(game.mode === 'escape' ? 'escape' : 'waves'));
$('bskip').onclick = () => { setTrained(); startCombat(game.state === 'ask' ? load.mode : 'waves'); };
$('bsettings').onclick = () => openSettings();
$('bgarage').onclick = () => { if (game.state === 'netguest') { enterGarage(); return; } if (game.state === 'ask') { $('banner').style.display = 'none'; game.state = 'garage'; } else enterGarage(); };
function bannerBtns() { return [...document.querySelectorAll('#banner .btns button')].filter((b) => !b.hidden); }
function showBanner(title, text, labels) {
  for (const id of ['bretry', 'bskip', 'bsettings', 'bgarage']) { const b = $(id); b.hidden = !labels[id]; if (labels[id]) b.textContent = labels[id]; }
  $('btitle').textContent = title; $('btext').textContent = text; $('banner').style.display = 'grid'; menuSel = 0;
  if (document.pointerLockElement) document.exitPointerLock();
}
function askTraining() {
  game.state = 'ask';
  showBanner('FIRST RUN?', 'Training shows you every button in about 3 minutes. You can skip it and come back from the yard any time.', { bretry: 'TRAIN ME', bskip: 'SKIP TRAINING', bgarage: 'BACK' });
}

// ============================================================ settings menu
const SOPTS = [
  { key: 'score', label: 'Soundtrack', n: 2, name: (v) => (v ? 'HIP-HOP' : 'ROCK'), blurb: (v) => (v ? 'Orchestral trap: sliding 808s, trap hat rolls and hard claps over a dusty chopped classical loop, harpsichord riffs, choir chops and violin.' : 'Hard rock and orchestra: distorted guitars and drums under strings and brass.') },
  { key: 'diff', label: 'Difficulty', n: 3, name: (v) => DIFF[v].name, blurb: (v) => DIFF[v].blurb },
  { key: 'music', label: 'Music', n: 11, name: (v) => (v ? v * 10 + '%' : 'OFF'), blurb: () => 'Soundtrack volume. VIEW or M mutes it any time.' },
  { key: 'sfx', label: 'Effects', n: 11, name: (v) => (v ? v * 10 + '%' : 'OFF'), blurb: () => 'Engines, guns, crashes and explosions.' },
  { key: 'shake', label: 'Camera shake', n: 3, name: (v) => ['OFF', 'LOW', 'FULL'][v], blurb: () => 'How hard the camera kicks on hits and explosions.' },
  { key: 'vib', label: 'Vibration', n: 2, name: (v) => (v ? 'ON' : 'OFF'), blurb: () => 'Controller rumble.' },
  { key: 'invert', label: 'Invert look', n: 2, name: (v) => (v ? 'ON' : 'OFF'), blurb: () => 'Flips the right stick for the camera and the gunner.' },
];
let setSel = 0, setFrom = 'garage';
function buildSettingsUI() {
  const rows = $('srows'); rows.innerHTML = '';
  SOPTS.forEach((o, i) => {
    const r = document.createElement('div'); r.className = 'row' + (i === setSel ? ' sel' : '');
    const lab = document.createElement('div'); lab.className = 'label'; lab.textContent = o.label;
    const l = document.createElement('button'); l.className = 'arrow'; l.textContent = '◀'; l.setAttribute('aria-label', 'Lower ' + o.label);
    const v = document.createElement('div'); v.className = 'val'; v.textContent = o.name(SET[o.key]);
    const rr = document.createElement('button'); rr.className = 'arrow'; rr.textContent = '▶'; rr.setAttribute('aria-label', 'Raise ' + o.label);
    l.onclick = () => { setSel = i; setCycle(i, -1); }; rr.onclick = () => { setSel = i; setCycle(i, 1); };
    r.append(lab, l, v, rr); rows.append(r);
  });
  const o = SOPTS[setSel]; $('sblurb').textContent = o ? o.blurb(SET[o.key]) : 'Save and go back.';
  $('sdone').classList.toggle('hl', setSel === SOPTS.length);
}
function setCycle(i, d) {
  const o = SOPTS[i]; if (!o) return;
  SET[o.key] = o.n <= 3 ? (SET[o.key] + d + o.n) % o.n : clamp(SET[o.key] + d, 0, o.n - 1);
  saveSettings(); sfx.setVol(); music.setVol();
  if (o.key === 'vib' && SET.vib) rumble(0.5, 0.5, 200);
  if (o.key === 'sfx') sfx.pickup();
  if (o.key === 'score') music.reload();
  buildSettingsUI();
}
function openSettings() { if (game.state !== 'settings') setFrom = game.state; game.state = 'settings'; $('banner').style.display = 'none'; $('settings').hidden = false; setSel = 0; buildSettingsUI(); if (document.pointerLockElement) document.exitPointerLock(); }
function closeSettings() { $('settings').hidden = true; game.state = setFrom; if (['paused', 'over', 'ask'].includes(setFrom)) $('banner').style.display = 'grid'; }
$('sdone').onclick = () => closeSettings();
function settingsInput(P) {
  const p0 = P[0] || null; const n = SOPTS.length + 1;
  if (kPressed.has('ArrowUp') || (p0 && p0.pressed('UP'))) { setSel = (setSel + n - 1) % n; buildSettingsUI(); }
  if (kPressed.has('ArrowDown') || (p0 && p0.pressed('DOWN'))) { setSel = (setSel + 1) % n; buildSettingsUI(); }
  if (kPressed.has('ArrowLeft') || (p0 && p0.pressed('LEFT'))) setCycle(setSel, -1);
  if (kPressed.has('ArrowRight') || (p0 && p0.pressed('RIGHT'))) setCycle(setSel, 1);
  if (p0) { const t = game.t; settingsInput.t = settingsInput.t || 0; if (Math.abs(p0.ly) > 0.6 && t - settingsInput.t > 0.25) { settingsInput.t = t; setSel = (setSel + (p0.ly > 0 ? 1 : -1) + n) % n; buildSettingsUI(); } if (Math.abs(p0.lx) > 0.6 && t - settingsInput.t > 0.25) { settingsInput.t = t; setCycle(setSel, p0.lx > 0 ? 1 : -1); } }
  if (((p0 && p0.pressed('A')) || kPressed.has('Enter')) && setSel === SOPTS.length) closeSettings();
  else if ((p0 && p0.pressed('A')) || kPressed.has('Enter')) setCycle(setSel, 1);
  if ((p0 && (p0.pressed('B') || p0.pressed('Y') || p0.pressed('MENU'))) || kPressed.has('Escape')) closeSettings();
}

// ============================================================ upgrades between waves
const UPG = [
  { id: 'hull', name: 'REINFORCED HULL', text: 'Max hull +25% and a full repair.', apply: (v) => { v.hpMax = Math.round(v.hpMax * 1.25); v.hp = v.hpMax; } },
  { id: 'nitro', name: 'BIGGER INJECTORS', text: 'Nitro refills 60% faster.', apply: (v) => { v.mods.nitroRegen += 6; } },
  { id: 'engine', name: 'TUNED ENGINE', text: 'Top speed +8% and quicker acceleration.', apply: (v) => { v.maxSpeed *= 1.08; v.accel *= 1.12; } },
  { id: 'ram', name: 'SHARPENED RAM', text: 'Ram and saw damage +30%.', apply: (v) => { v.mods.ram *= 1.3; } },
  { id: 'harp', name: 'BARBED HARPOON', text: 'Reel in 50% faster and rip parts off 40% faster.', apply: (v) => { v.mods.reel *= 1.5; v.mods.rip *= 1.4; } },
  { id: 'gun', name: 'GUNSMITH', text: 'Main gun damage +20%.', apply: (v) => { v.mods.gun *= 1.2; } },
  { id: 'weld', name: 'SCRAP WELDER', text: 'Every missing plate bolted back on. Plates 25% tougher.', apply: (v) => { for (const p of v.pieces) { p.max = Math.round(p.max * 1.25); p.hp = p.max; if (!p.attached) reattach(v, p); } } },
  { id: 'drift', name: 'DRIFT KING', text: 'Drifting refills nitro twice as fast.', apply: (v) => { v.mods.driftNitro *= 2; } },
  { id: 'cool', name: 'QUICK HANDS', text: 'Cannon cools, rockets reload and flames refuel 35% faster.', apply: (v) => { v.mods.cool *= 1.35; } },
];
const UPG_CLASS = {
  juggernaut: [
    { id: 'hide', name: 'IRON HIDE', text: 'Juggernaut only. Take 15% less damage from everything.', apply: (v) => { v.mods.taken *= 0.85; } },
    { id: 'dozer', name: 'BULLDOZER', text: 'Juggernaut only. Rams hit 25% harder and throw rigs twice as far.', apply: (v) => { v.mods.ram *= 1.25; v.mods.knock *= 2; } },
  ],
  raider: [
    { id: 'cage', name: 'ROLL CAGE', text: 'Raider only. Max hull +15% and 8% less damage taken.', apply: (v) => { v.hpMax = Math.round(v.hpMax * 1.15); v.hp = Math.min(v.hpMax, v.hp + 30); v.mods.taken *= 0.92; } },
    { id: 'spot', name: 'SPOTTER', text: 'Raider only. Main gun damage +15% and the harpoon reloads in half the time.', apply: (v) => { v.mods.gun *= 1.15; v.mods.harpReload *= 0.5; } },
  ],
  scrapper: [
    { id: 'ghost', name: 'GHOST', text: 'Deuce only. Nitro burns 35% slower.', apply: (v) => { v.mods.drain *= 0.65; } },
    { id: 'hitrun', name: 'HIT AND RUN', text: 'Deuce only. Rams on nitro deal double damage.', apply: (v) => { v.mods.nitroRam *= 2; } },
  ],
  blackhorn: [
    { id: 'wball', name: 'WRECKING BALL', text: 'Blackhorn only. Rams hit 25% harder and throw rigs twice as far.', apply: (v) => { v.mods.ram *= 1.25; v.mods.knock *= 2; } },
    { id: 'bigblock', name: 'BIG BLOCK', text: 'Blackhorn only. Top speed +8% and nitro refills 40% faster.', apply: (v) => { v.maxSpeed *= 1.08; v.mods.nitroRegen += 4; } },
  ],
  warwagon: [
    { id: 'torque', name: 'DIESEL TORQUE', text: 'Warwagon only. 25% quicker off the line and rams hit 20% harder.', apply: (v) => { v.accel *= 1.25; v.mods.ram *= 1.2; } },
    { id: 'winch', name: 'WINCH LINE', text: 'Warwagon only. Harpoon reels in twice as fast and 10% less damage taken.', apply: (v) => { v.mods.reel *= 2; v.mods.taken *= 0.9; } },
  ],
  widowmaker: [
    { id: 'v8', name: 'BIG BLOCK V8', text: 'Widowmaker only. Top speed +12%.', apply: (v) => { v.maxSpeed *= 1.12; } },
    { id: 'slide', name: 'SIDEWINDER', text: 'Widowmaker only. Drifting rigs you sideswipe take heavy damage.', apply: (v) => { v.mods.swipe *= 2.2; } },
  ],
};
function baseMods() { return { nitroRegen: 0, ram: 1, reel: 1, rip: 1, gun: 1, driftNitro: 1, cool: 1, taken: 1, knock: 1, harpReload: 1, drain: 1, nitroRam: 1, swipe: 1 }; }
function reattach(v, slot) {
  const idx = debris.findIndex((q) => q.obj === slot.node); if (idx >= 0) removeDebris(idx);
  slot.node.removeFromParent(); v.model.add(slot.node); slot.node.position.copy(slot.home.p); slot.node.quaternion.copy(slot.home.q); slot.node.scale.set(1, 1, 1);
  slot.attached = true; slot.hp = slot.max;
}
let upgCards = [], upgSel = 0;
function openUpgrade() {
  const taken = player.upgs || (player.upgs = []);
  const pool = [...UPG, ...(UPG_CLASS[player.type] || [])].filter((u) => !(u.id !== 'hull' && u.id !== 'weld' && taken.filter((t) => t === u.id).length >= 2));
  const cls = (UPG_CLASS[player.type] || []).filter((u) => pool.includes(u));
  upgCards = [];
  if (cls.length && Math.random() < 0.75) upgCards.push(cls[(Math.random() * cls.length) | 0]);
  while (upgCards.length < 3) { const u = pool[(Math.random() * pool.length) | 0]; if (!upgCards.includes(u)) upgCards.push(u); }
  upgCards.sort(() => Math.random() - 0.5);
  upgSel = 0; game.state = 'upgrade';
  const box = $('ucards'); box.innerHTML = '';
  upgCards.forEach((u, i) => {
    const b = document.createElement('button'); b.className = 'ucard'; b.setAttribute('aria-label', u.name + '. ' + u.text);
    const cl = (UPG_CLASS[player.type] || []).includes(u);
    const k = document.createElement('div'); k.className = 'label'; k.textContent = cl ? player.cfg.name + ' PERK' : 'UPGRADE';
    const t = document.createElement('div'); t.className = 'big'; t.textContent = u.name;
    const x = document.createElement('p'); x.textContent = u.text;
    const n = document.createElement('span'); n.className = 'un'; n.textContent = (i + 1);
    b.append(n, k, t, x); b.onclick = () => pickUpgrade(i); box.append(b);
  });
  $('uwave').textContent = 'WAVE ' + game.wave + ' CLEARED';
  $('upg').hidden = false; markUpg();
  if (document.pointerLockElement) document.exitPointerLock();
}
function markUpg() { [...$('ucards').children].forEach((c, i) => c.classList.toggle('sel', i === upgSel)); }
function pickUpgrade(i) {
  const u = upgCards[i]; if (!u || game.state !== 'upgrade') return;
  u.apply(player); (player.upgs = player.upgs || []).push(u.id);
  $('upg').hidden = true; game.state = 'combat'; game.waveT = 5;
  sfx.pickup(); toast('Upgrade', u.name, true); buildPips();
}
function upgradeInput(P) {
  const p0 = P[0] || null;
  if (kPressed.has('ArrowLeft') || (p0 && (p0.pressed('LEFT') || p0.pressed('LB')))) { upgSel = (upgSel + 2) % 3; markUpg(); }
  if (kPressed.has('ArrowRight') || (p0 && (p0.pressed('RIGHT') || p0.pressed('RB')))) { upgSel = (upgSel + 1) % 3; markUpg(); }
  if (p0) { const t = game.t; upgradeInput.t = upgradeInput.t || 0; if (Math.abs(p0.lx) > 0.6 && t - upgradeInput.t > 0.25) { upgradeInput.t = t; upgSel = (upgSel + (p0.lx > 0 ? 1 : 2)) % 3; markUpg(); } }
  for (const [k, i] of [['Digit1', 0], ['Digit2', 1], ['Digit3', 2]]) if (kPressed.has(k)) return pickUpgrade(i);
  if (kPressed.has('Enter') || kPressed.has('Space') || (p0 && p0.pressed('A'))) pickUpgrade(upgSel);
}

// ============================================================ game state
const game = { state: 'loading', wave: 0, kills: 0, scrap: 0, waveT: 0, t: 0 };
let player = null; let garageRig = null; let camYaw = 0, camYawT = 0, camPitch = 0.12;
let p2 = { on: false, yaw: 0, pitch: 0.05 }, swapRoles = false;
const wrecks = [];

function clearWorld() {
  clearRockets();
  clearTracks(); hurt = 0;
  for (const v of vehicles) { if (v.harp) releaseHarpoon(v); v.root.removeFromParent(); }
  vehicles.length = 0;
  while (debris.length) removeDebris(0);
  for (const b of bullets) { b.m.visible = false; bulletPool.push(b.m); } bullets.length = 0;
  PS_ADD.list.length = 0; PS_NORM.list.length = 0;
}
function spawnGarageRig() {
  if (garageRig) { garageRig.root.removeFromParent(); const i = vehicles.indexOf(garageRig); if (i >= 0) vehicles.splice(i, 1); }
  garageRig = new Vehicle(load.type, { ...load }, true); garageRig.place(0, 0, 0.6);
  garageRig.wYaw = 0.5; garageRig.wBase.rotation.y = 0.5;
}
function enterGarage() {
  if (NET.role === 'guest') { netSend('g2h', { t: 'bye' }); netLeave(); } else if (NET.role === 'host') netLeave(); NET.started = false; $('net').hidden = true;
  clearTutorial(); clearWorld(); leaveEscapeWorld(); syncMap(); CINE.on = false; document.body.classList.remove('incombat', 'cine'); caption(null); game.state = 'garage'; player = null; $('upg').hidden = true;
  $('banner').style.display = 'none'; $('combat').style.display = 'none'; $('garage').hidden = false; $('gkeys').hidden = false;
  if (document.pointerLockElement) document.exitPointerLock();
  buildGarageUI(); spawnGarageRig();
}
function placeWrecks() { withSeed(11, placeWrecksRaw); }
function placeWrecksRaw() {
  if (wrecks.length) return;
  const burnt = new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.95, metalness: 0.3 }); weather(burnt, 0.7, 1.4);
  const types = ['juggernaut', 'raider', 'scrapper'];
  for (let i = 0; i < 9; i++) {
    const t = types[i % 3]; const b = TEMPL[t].getObjectByName('Body').clone(true);
    b.traverse((o) => { if (o.isMesh) { o.material = burnt; o.castShadow = o.receiveShadow = true; } });
    let a, d, x, z, tries = 0; do { a = rnd(0, 6.28); d = rnd(35, ARENA - 20); x = Math.cos(a) * d; z = Math.sin(a) * d; } while (onRamp(x, z, 6) && ++tries < 30);
    const g = new THREE.Group(); g.add(b); b.rotation.y = Math.PI;
    g.position.set(x, height(x, z) - 0.45, z); g.rotation.set(rnd(-0.15, 0.15), rnd(0, 6.28), rnd(-0.4, 0.4) + (Math.random() < 0.3 ? Math.PI * 0.5 : 0));
    arenaGroup.add(g); wrecks.push(g); STATIC.push({ x, z, r: CFG[t].r * 1.1 });
  }
}
function startCombat(mode = 'waves') {
  if (typeof mode !== 'string') mode = 'waves';
  if (mode === 'escape') return startEscape();
  if (WORLD.mode === 'escape') leaveEscapeWorld();
  if (mode === 'tutorial') leavePortWorld(); else syncMap();
  if (WORLD.mode === 'port') ganReset();
  clearTutorial(); clearWorld(); if (garageRig) garageRig.root.removeFromParent(); garageRig = null;
  $('garage').hidden = true; $('gkeys').hidden = true; $('banner').style.display = 'none'; $('upg').hidden = true; $('combat').style.display = 'block'; game.upgT = 0;
  if (WORLD.mode === 'port') placePortProps(); else placeProps(NET.peer ? NET.seed : undefined);
  player = new Vehicle(load.type, { ...load }, true); player.place(0, 0, 0); vehicles.push(player);
  document.body.classList.add('incombat'); game.state = 'combat'; game.wave = 0; game.kills = 0; game.scrap = 0; game.waveT = 2.5; game.t = 0;
  camYaw = 0; camYawT = 0; $('wname').textContent = WEAPONS[player.wk].name; $('ramlbl').textContent = RAMS[load.ram].name + ' · ' + ARMORS[load.armor].name;
  buildPips();
  sfx.init(); music.start();
  game.mode = mode; game.collected = 0;
  if (mode === 'tutorial') { game.waveT = 1e9; startTutorial(); }
  else toast('Proving ground', 'SURVIVE THE RAIDERS');
}
function buildPips() { const p = $('pips'); p.innerHTML = ''; for (const q of player.pieces) { const b = document.createElement('b'); p.append(b); } if (!player.pieces.length) p.textContent = 'none fitted'; }
const ENEMY_PAINT = [['#2d2622', '#a3261a', 0.15], ['#43301f', '#c7a01e', 0.2], ['#3a3d38', '#b23a16', 0.1]];
function spawnWave() {
  game.wave++; music.sting();
  const n = clamp(Math.min(2 + game.wave, 7) + D().count, 1, 8);
  const wc = $('wavecall'); wc.textContent = 'WAVE ' + game.wave; wc.style.opacity = 1; setTimeout(() => (wc.style.opacity = 0), 1800);
  for (let i = 0; i < n; i++) {
    const type = game.wave >= 3 && i === 0 ? 'juggernaut' : game.wave >= 2 && Math.random() < 0.18 ? (['widowmaker', 'blackhorn', 'warwagon'][Math.floor(Math.random() * 3)]) : Math.random() < 0.55 ? 'raider' : 'scrapper';
    const lo = { type, weapon: type === 'scrapper' ? (Math.random() < 0.3 ? 'cannon' : 'harpoon') : 'cannon', ram: Math.random() < 0.6 ? 'spike' : 'saw', armor: rndArmor() };
    if (lo.weapon === 'harpoon') lo.weapon = 'cannon';
    if (type === 'juggernaut' && Math.random() < 0.6) lo.weapon = 'rockets';
    if (type === 'raider' && game.wave >= 3 && Math.random() < 0.3) lo.weapon = 'flamer';
    const e = new Vehicle(type, lo, false, ENEMY_PAINT[i % 3]);
    const a = rnd(0, 6.28), d = rnd(110, 150); let x = player.pos.x + Math.cos(a) * d, z = player.pos.z + Math.sin(a) * d;
    const r = Math.hypot(x, z); if (r > ARENA - 10) { x *= (ARENA - 10) / r; z *= (ARENA - 10) / r; }
    if (WORLD.mode === 'port') [x, z] = portSpawnPoint(player.pos, 70, 170);
    e.place(x, z, Math.atan2(player.pos.x - x, player.pos.z - z));
    e.ai = { mode: type === 'scrapper' || lo.weapon === 'flamer' ? 'ram' : Math.random() < 0.5 ? 'strafe' : 'ram', stuck: 0, rev: 0, burst: rnd(0, 2), orbit: Math.random() < 0.5 ? 1 : -1, skill: Math.min(1, 0.55 + game.wave * 0.08), range: lo.weapon === 'flamer' ? 17 : 60 };
    e.maxSpeed *= (0.86 + Math.min(0.1, game.wave * 0.02)) * D().speed;
    vehicles.push(e);
  }
}
function onKill(e) {
  game.kills++; game.scrap += 25;
  const left = vehicles.filter((v) => !v.isPlayer && v.alive).length;
  game.slow = left === 0 ? 1.0 : 0.45;
  toast('Wrecked +25 scrap', e.cfg.name);
}
function aiInput(e, dt) {
  const A = e.ai; const P = player;
  const inp = { throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false };
  if (A.dummy) return inp;
  if (!P || !P.alive) { inp.brake = 0.4; return inp; }
  const toP = P.pos.clone().sub(e.pos); const dist = toP.length();
  let target = P.pos.clone().addScaledVector(P.vel, clamp(dist / 30, 0, 1.2));
  if (A.mode === 'strafe' && dist < 55) {
    const ang = Math.atan2(e.pos.x - P.pos.x, e.pos.z - P.pos.z) + A.orbit * 0.9;
    target = P.pos.clone().add(V3(Math.sin(ang) * 32, 0, Math.cos(ang) * 32));
  }
  if (WORLD.mode === 'port') target = portNavTarget(e, target);
  // avoid other enemies and rocks
  for (const o of vehicles) { if (o === e || o === P || !o.alive) continue; const d = e.pos.distanceTo(o.pos); if (d < 9) target.addScaledVector(e.pos.clone().sub(o.pos).normalize(), (9 - d) * 2); }
  const des = Math.atan2(target.x - e.pos.x, target.z - e.pos.z);
  const diff = wrapA(des - e.h);
  inp.steer = -clamp(diff * 2.2, -1, 1);
  inp.throttle = Math.abs(diff) < 1.3 ? 1 : 0.55;
  if (A.mode === 'ram' && dist < 40 && Math.abs(diff) < 0.35) inp.nitro = Math.random() < A.skill * 0.6;
  if (Math.abs(diff) > 1.2 && Math.abs(e.speed) > 18) inp.handbrake = true;
  // stuck handling
  if (Math.abs(e.speed) < 2 && inp.throttle > 0.5) A.stuck += dt; else A.stuck = Math.max(0, A.stuck - dt);
  if (A.stuck > 1.6) { A.rev = 1.3; A.stuck = 0; }
  if (A.rev > 0) { A.rev -= dt; inp.throttle = 0; inp.brake = 1; inp.steer = -inp.steer; }
  return inp;
}
function aiShoot(e, dt) {
  if (!player || !player.alive) return;
  if (e.ai.dummy && !e.ai.shooter) return;
  const aim = player.root.position.clone().add(V3(0, 1.2, 0)).addScaledVector(player.vel, e.pos.distanceTo(player.pos) / 120);
  e.aimAt(aim, dt, 2.5);
  const A = e.ai; A.burst -= dt; const d = e.pos.distanceTo(player.pos);
  const firing = A.burst < 0 && A.burst > -1.0 && d < (A.range || 60);
  if (A.burst < -1.0) A.burst = rnd(1.2, 2.5) / A.skill;
  e.tryFire(dt, player, firing, false);
}

// vehicle vs vehicle / static
const hitCD = new Map();
function circles(v) {
  const k = v.alive ? 1 : 0.7, off = v.cfg.hz * 0.45, r = v.cfg.hx * 1.15 * k, fx = Math.sin(v.h), fz = Math.cos(v.h);
  return [[v.pos.x + fx * off, v.pos.z + fz * off, r], [v.pos.x - fx * off, v.pos.z - fz * off, r]];
}
function collisions(dt) {
  for (let i = 0; i < vehicles.length; i++) {
    const a = vehicles[i];
    for (const s of STATIC) {
      if (Math.abs(a.pos.x - s.x) > 14 || Math.abs(a.pos.z - s.z) > 14) continue;
      const dx = a.pos.x - s.x, dz = a.pos.z - s.z, d = Math.hypot(dx, dz), m = a.cfg.r * 0.85 + s.r;
      if (d < m && d > 0.001) { const nx = dx / d, nz = dz / d; a.pos.x += nx * (m - d); a.pos.z += nz * (m - d); const vn = a.vel.x * nx + a.vel.z * nz; if (vn < 0) { a.vel.x -= nx * vn * 1.4; a.vel.z -= nz * vn * 1.4; if (vn < -12 && a.alive) { a.damage(-vn * 0.8, null, null, null, 'ram'); sparks(a.root.position.clone().add(V3(0, 1, 0)), V3(nx, 0.5, nz), 10); shake(0.3, a.pos); sfx.clang(); } } }
    }
    for (let j = i + 1; j < vehicles.length; j++) {
      const b = vehicles[j];
      if (Math.abs(a.pos.x - b.pos.x) > 12 || Math.abs(a.pos.z - b.pos.z) > 12) continue;
      // each rig is two overlapping circles (front and rear) so long trucks collide along their length
      let best = null;
      for (const ca of circles(a)) for (const cb of circles(b)) { const ddx = cb[0] - ca[0], ddz = cb[1] - ca[1], dd = Math.hypot(ddx, ddz), mm = ca[2] + cb[2]; if (dd < mm && dd > 0.001 && (!best || mm - dd > best.pen)) best = { nx: ddx / dd, nz: ddz / dd, pen: mm - dd, cx: ca[0] + ddx / dd * ca[2], cz: ca[1] + ddz / dd * ca[2] }; }
      if (!best) continue;
      const nx = best.nx, nz = best.nz, pen = best.pen; const ta = b.mass / (a.mass + b.mass);
      a.pos.x -= nx * pen * ta; a.pos.z -= nz * pen * ta; b.pos.x += nx * pen * (1 - ta); b.pos.z += nz * pen * (1 - ta);
      const rv = (b.vel.x - a.vel.x) * nx + (b.vel.z - a.vel.z) * nz; // negative = closing
      const cp = V3(best.cx, (a.root.position.y + b.root.position.y) / 2 + 1, best.cz);
      if (rv < 0) {
        const imp = -(1.35) * rv / (1 / a.mass + 1 / b.mass);
        a.vel.x -= nx * imp / a.mass; a.vel.z -= nz * imp / a.mass; b.vel.x += nx * imp / b.mass; b.vel.z += nz * imp / b.mass;
        // off-centre hits spin the rigs
        const spin = (v, fx, fz) => { const rx = best.cx - v.pos.x, rz = best.cz - v.pos.z; v.yawV = clamp(v.yawV + (rz * fx - rx * fz) * 0.035 / v.mass, -2.2, 2.2); };
        spin(a, -nx * imp, -nz * imp); spin(b, nx * imp, nz * imp);
        if ((a.isPlayer || b.isPlayer) && -rv > 3) rumble(Math.min(1, -rv * 0.05), Math.min(1, -rv * 0.07), 200);
        const key = i * 100 + j; const now = game.t;
        if (-rv > 4 && (!hitCD.has(key) || now - hitCD.get(key) > 0.35)) {
          hitCD.set(key, now);
          const close = -rv; const cf = close <= 18 ? close : 18 + (close - 18) * 0.35;
          const fa = Math.sin(a.h) * nx + Math.cos(a.h) * nz, fb = -(Math.sin(b.h) * nx + Math.cos(b.h) * nz);
          const rm = (v) => v.mods.ram * (v.cfg.ramMul || 1) * (v.nitOn ? v.mods.nitroRam : 1);
          const dmgToB = cf * (fa > 0.55 ? a.ram.mult * a.mass * 1.3 * rm(a) : 0.35 * a.mass * (a.drifting ? a.mods.swipe : 1));
          const dmgToA = cf * (fb > 0.55 ? b.ram.mult * b.mass * 1.3 * rm(b) : 0.35 * b.mass * (b.drifting ? b.mods.swipe : 1));
          if (fa > 0.55 && a.mods.knock > 1) { b.vel.x += nx * close * 0.35 * (a.mods.knock - 1); b.vel.z += nz * close * 0.35 * (a.mods.knock - 1); }
          if (fb > 0.55 && b.mods.knock > 1) { a.vel.x -= nx * close * 0.35 * (b.mods.knock - 1); a.vel.z -= nz * close * 0.35 * (b.mods.knock - 1); }
          if (a.isPlayer && fa > 0.55 && close > 7) b.rammedByPlayer = true;
          if (b.isPlayer && fb > 0.55 && close > 7) a.rammedByPlayer = true;
          if (a.rearSaw && fa < -0.55 && a.alive) b.damage(cf * 1.3 * (b.isPlayer ? 0.5 : 1), cp, V3(nx, 0, nz), a, 'ram');
          if (b.rearSaw && fb < -0.55 && b.alive) a.damage(cf * 1.3 * (a.isPlayer ? 0.5 : 1), cp, V3(-nx, 0, -nz), b, 'ram');
          // spikes all round: touching a spiked rig's sides or tail hurts
          if (a.spikeRing && fa <= 0.55 && a.alive) { b.damage(cf * 0.9 * a.mods.ram * (b.isPlayer ? 0.5 : 1), cp, V3(nx, 0, nz), a, 'ram'); sparks(cp, V3(0, 1, 0), 6); }
          if (b.spikeRing && fb <= 0.55 && b.alive) { a.damage(cf * 0.9 * b.mods.ram * (a.isPlayer ? 0.5 : 1), cp, V3(-nx, 0, -nz), b, 'ram'); sparks(cp, V3(0, 1, 0), 6); }
          if (a.alive) b.damage(dmgToB * (b.isPlayer ? 0.5 : 1), cp, V3(nx, 0, nz), a, 'ram');
          if (b.alive) a.damage(dmgToA * (a.isPlayer ? 0.5 : 1), cp, V3(-nx, 0, -nz), b, 'ram');
          sparks(cp, V3(0, 1, 0), Math.min(30, close * 2)); sfx.clang(); shake(Math.min(0.6, close * 0.03), cp);
          if (close > 12) flash(cp, 40, 0.1, '#ffd090');
        }
      }
      // saw grind, front and rear
      for (const [x, y, sgn] of [[a, b, 1], [b, a, -1]]) {
        if (!x.alive || !x.ram.grind) continue; const f = sgn * (Math.sin(x.h) * nx + Math.cos(x.h) * nz);
        if (f > 0.55 || (x.rearSaw && f < -0.55)) { y.damage(x.ram.grind * x.mods.ram * dt, cp, V3(nx * sgn, 0, nz * sgn), x, 'ram'); if (Math.random() < 0.6) sparks(cp, V3(0, 1, 0), 3); }
      }
    }
  }
}

// ============================================================ HUD
const radar = $('radar').getContext('2d');
let hudTick = 0;
function drawHUD(dt) {
  hudTick++;
  $('hpbar').style.width = (player.hp / player.hpMax * 100) + '%';
  $('spd').textContent = Math.round(Math.abs(player.speed || 0) * 2.237);
  $('nitro').style.width = player.nitro + '%';
  const H = player.harp;
  const hb = document.querySelector('#heat i');
  const wk = player.wk;
  if (wk === 'cannon') { hb.style.width = player.heat + '%'; hb.style.background = player.overheat ? '#ff4d2e' : '#ffb347'; }
  else if (wk === 'flamer') { hb.style.width = player.fuel + '%'; hb.style.background = player.fuelOut ? '#8a7f72' : '#ff7a20'; }
  else if (wk === 'rockets') { hb.style.width = (player.rkReload > 0 ? (1 - player.rkReload / 1.5) * 100 : 100) + '%'; hb.style.background = player.rkReload > 0 ? '#8a7f72' : '#e0762c'; }
  else { hb.style.width = (H.state === 'ready' ? 100 : H.state === 'reload' ? H.t / 1.1 * 100 : 0) + '%'; hb.style.background = '#4cc4b8'; }
  const rip = $('rip'); if (H.state === 'hooked') { rip.style.display = 'flex'; $('ripbar').style.width = Math.min(100, H.rip) + '%'; } else rip.style.display = 'none';
  if (hudTick % 6 === 0) {
    const pipEls = $('pips').children; player.pieces.forEach((p, i) => { if (pipEls[i]) pipEls[i].className = p.attached ? '' : 'off'; });
    const alive = vehicles.filter((v) => !v.isPlayer && v.alive).length;
    $('wave').innerHTML = ''; $('wave').append(document.createTextNode(game.mode === 'tutorial' ? 'TRAINING' : game.mode === 'escape' ? 'ESCAPE' : 'WAVE ' + Math.max(1, game.wave)));
    const sm = document.createElement('small'); sm.textContent = game.mode === 'tutorial' ? 'Press ☰ Menu to leave' : game.mode === 'escape' ? `${Math.max(0, (ESC.BZ1 - player.pos.z) / 1000).toFixed(1)} KM TO THE BRIDGE · CHECKPOINT ${ESC.cp}/${ESC.checkpoints.length - 1} · ${game.kills} WRECKED` : `${alive} RAIDERS LEFT · ${game.kills} WRECKED · ${game.scrap} SCRAP`; $('wave').append(sm);
    $('p2').textContent = p2.on ? (swapRoles ? 'P2 DRIVING · P1 ON THE GUN' : 'P2 ON THE GUN') : (padsCount > 1 ? 'P2: press A to man the gun' : '');
    const wp = player.wk; const hk = wp === 'harpoon';
    const wl = wp === 'cannon' ? 'fire' : wp === 'rockets' ? 'rockets' : wp === 'flamer' ? 'flame' : 'harpoon / release';
    $('ctrlhint').innerHTML = padsCount ? `<span class="pad pr">RT</span> gas <span class="pad pr">LT</span> brake <span class="pad pb">B</span>/<span class="pad px">X</span> drift <span class="pad pa">A</span> nitro<br><span class="pad pr">RB</span> ${wl}${hk ? ' <span class="pad pr">LB</span> reel in' : ''} <span class="pad pr">RS</span> look <span class="pad pr">D-PAD</span> ${hk ? 'main gun' : 'harpoon'}${p2.on ? ' <span class="pad py">Y</span> swap seats' : ''}` : `W/S drive · A/D steer · Space drift · Shift nitro<br>Click or J ${wl}${hk ? ' · K reel in' : ''} · F swap to ${hk ? 'main gun' : 'harpoon'} · Q/E look · Esc pause`;
  }
  if (hudTick % 3 === 0) {
    const R = radar, W = 340, c = W / 2, sc = c / 110; R.clearRect(0, 0, W, W);
    R.save(); R.beginPath(); R.arc(c, c, c - 2, 0, 6.3); R.clip();
    R.strokeStyle = 'rgba(255,255,255,.12)'; R.lineWidth = 2; for (const rr of [0.33, 0.66]) { R.beginPath(); R.arc(c, c, c * rr, 0, 6.3); R.stroke(); }
    const ch = Math.cos(camYawWorld), sh = Math.sin(camYawWorld);
    const tp = (x, z) => { const dx = x - player.pos.x, dz = z - player.pos.z; return [c - (dx * ch - dz * sh) * sc, c - (dx * sh + dz * ch) * sc]; };
    if (game.mode === 'escape') { R.strokeStyle = 'rgba(255,190,110,.55)'; R.lineWidth = 10; R.beginPath(); for (let z = player.pos.z - 80; z < player.pos.z + 220; z += 10) { const [x, y] = tp(pathX(z), z); z === player.pos.z - 80 ? R.moveTo(x, y) : R.lineTo(x, y); } R.stroke(); }
    if (game.mode === 'tutorial' && TUT.data.gates) { const g = TUT.data.gates[TUT.data.gi]; if (g) { const [x, y] = tp(g.position.x, g.position.z); R.strokeStyle = '#ffb347'; R.lineWidth = 4; R.beginPath(); R.arc(Math.max(10, Math.min(W - 10, x)), Math.max(10, Math.min(W - 10, y)), 10, 0, 6.3); R.stroke(); } }
    for (const d of debris) if (d.ring) { const [x, y] = tp(d.obj.position.x, d.obj.position.z); R.fillStyle = '#ffc24a'; R.fillRect(x - 4, y - 4, 8, 8); }
    for (const v of vehicles) { if (v.isPlayer || !v.alive) continue; const [x, y] = tp(v.pos.x, v.pos.z); R.fillStyle = '#ff4d2e'; R.beginPath(); R.arc(Math.max(8, Math.min(W - 8, x)), Math.max(8, Math.min(W - 8, y)), 8, 0, 6.3); R.fill(); }
    R.restore();
    R.save(); R.translate(c, c); R.rotate(-(player.h - camYawWorld)); R.fillStyle = '#4cc4b8'; R.beginPath(); R.moveTo(0, -14); R.lineTo(10, 12); R.lineTo(-10, 12); R.closePath(); R.fill(); R.restore();
  }
}
let padsCount = 0; let camYawWorld = 0;

// ============================================================ main loop
const clock = new THREE.Clock();
let aimPoint = V3(), lockTarget = null;
const reticle = $('reticle');
let menuSel = 0;
function tick() {
  if (window.__freeze) { requestAnimationFrame(tick); return; }
  const rawDt = clock.getDelta(); const dt0 = Math.min(rawDt, 1 / 30);
  trackFps(rawDt);
  game.slow = Math.max(0, (game.slow || 0) - dt0);
  const dt = (game.state === 'combat' || game.state === 'cine') && game.slow > 0 ? dt0 * 0.35 : dt0;
  game.t += dt;
  const P = readPads(); padsCount = P.length;
  const pressed = (c) => { const r = kPressed.has(c); return r; };
  if (game.state === 'title') {
    if (P.some((p) => p.pressed('A')) || pressed('Enter') || pressed('Space')) { $('startbtn').click(); }
    camOrbit(dt, 16, 4);
  } else if (game.state === 'garage') {
    garageInput(P);
    camOrbit(dt, CFG[load.type].cam[0] * 1.1, 2.6);
    if (garageRig) { garageRig.syncTransform(dt); for (const b of garageRig.blades) b.rotation.y += 10 * dt; }
  } else if (game.state === 'combat') {
    combatStep(dt, P);
  } else if (game.state === 'cine') {
    cineStep(dt, P);
  } else if (game.state === 'net') {
    netLobbyInput(P); camOrbit(dt, CFG[load.type].cam[0] * 1.1, 2.6); if (garageRig) garageRig.syncTransform(dt);
  } else if (game.state === 'netguest') {
    guestStep(dt, P);
  } else if (game.state === 'paused' || game.state === 'over' || game.state === 'ask' || game.state === 'done') {
    const p0 = P[0]; const B = bannerBtns(); const st = game.state;
    if (p0) {
      if (p0.pressed('LEFT') || p0.pressed('UP')) menuSel = (menuSel + B.length - 1) % B.length;
      if (p0.pressed('RIGHT') || p0.pressed('DOWN')) menuSel = (menuSel + 1) % B.length;
      if (p0.pressed('A') && B[menuSel]) B[menuSel].click();
      else if (st === 'ask' && p0.pressed('X')) $('bskip').click();
      else if (p0.pressed('B') || (st === 'paused' && p0.pressed('MENU'))) st === 'paused' ? resume() : st === 'ask' ? $('bgarage').click() : enterGarage();
    }
    if (pressed('Escape')) { if (st === 'paused') resume(); else if (st === 'ask') $('bgarage').click(); }
    if (pressed('Enter') && st === 'ask' && B[menuSel]) B[menuSel].click();
    B.forEach((b, i) => b.classList.toggle('hl', P.length > 0 && i === menuSel));
    if (st === 'over' || st === 'done') { for (const v of vehicles) v.update(dt, {}); updateDebris(dt); updateBullets(dt); updateRockets(dt); if (game.mode === 'escape') { updateLightning(dt); updateBridge(dt); } }
    if (st === 'ask') { camOrbit(dt, CFG[load.type].cam[0] * 1.1, 2.6); if (garageRig) garageRig.syncTransform(dt); } else followCam(dt);
  } else if (game.state === 'upgrade') {
    upgradeInput(P); followCam(dt);
  } else if (game.state === 'settings') {
    settingsInput(P);
    if (['garage', 'ask', 'title'].includes(setFrom)) { camOrbit(dt, CFG[load.type].cam[0] * 1.1, 2.6); if (garageRig) garageRig.syncTransform(dt); } else followCam(dt);
  }
  if (NET.role === 'host') hostSnap(dt0);
  // music follows the action
  if ((tick.mt = (tick.mt || 0) + dt) > 0.25) { tick.mt = 0; music.set(musicTarget()); }
  if (kPressed.has('KeyM') || P.some((p) => p.pressed('VIEW'))) { const on = music.toggle(); if (game.state === 'combat' || game.state === 'garage') toast('Music', on ? 'ON' : 'OFF'); }
  fxStep(dt);
  kPressed.clear();
  hurt = Math.max(0, hurt - dt0 * 1.4); hurtEl.style.opacity = hurt.toFixed(2);
  drawEnemyBars();
  renderFrame();
  requestAnimationFrame(tick);
}
function fxStep(dt) {
  if (ESC.sky.visible) ESC.sky.position.copy(camera.position);
  if (headL.intensity > 0 && player) { player.root.localToWorld(headL.position.set(0, 1.2, player.box.hz * 0.9)); player.root.localToWorld(headL.target.position.set(0, -0.5, player.box.hz + 34)); headL.target.updateMatrixWorld(); }
  // effects always
  for (const f of flashes) { if (f.t > 0) { f.t -= dt; f.l.intensity = Math.max(0, f.t / f.l.userData.d) * f.l.userData.p; } else f.l.intensity = 0; }
  for (const v of vehicles) if (v.burn > 0) { v.burn -= dt; if (Math.random() < 0.7) { const p = v.root.position.clone().add(V3(rnd(-0.8, 0.8), 1.4, rnd(-0.8, 0.8))); emit(PS_ADD, p, V3(rnd(-0.5, 0.5), rnd(2, 4), rnd(-0.5, 0.5)), rnd(0.4, 0.8), 1.2, 2.6, COL.fire, 0.8, COL.fire2, 0); emit(PS_NORM, p.add(V3(0, 1, 0)), V3(rnd(-0.6, 0.6), rnd(3, 5), rnd(-0.6, 0.6)), rnd(2, 3.5), 1.2, 4.5, COL.smoke, 0.32, COL.smoke2, 0); } }
  updatePS(PS_ADD, dt); updatePS(PS_NORM, dt);
  PS_ADD.m.uniforms.uScale.value = PS_NORM.m.uniforms.uScale.value = renderer.domElement.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
  portFx(dt);
  // sun follows focus
  const focus = player ? player.root.position : garageRig ? garageRig.root.position : V3();
  sun.position.copy(focus).addScaledVector(WORLD.lightDir || sunDir, 120); sun.target.position.copy(focus);
}
function garageInput(P) {
  const p0 = P[0] || null;
  const up = kPressed.has('ArrowUp') || (p0 && (p0.pressed('UP'))), dn = kPressed.has('ArrowDown') || (p0 && p0.pressed('DOWN'));
  const lf = kPressed.has('ArrowLeft') || (p0 && (p0.pressed('LEFT') || p0.pressed('LB'))), rt = kPressed.has('ArrowRight') || (p0 && (p0.pressed('RIGHT') || p0.pressed('RB')));
  // left stick with repeat
  if (p0) {
    const t = game.t; garageInput.t = garageInput.t || 0;
    if (Math.abs(p0.ly) > 0.6 && t - garageInput.t > 0.25) { garageInput.t = t; selRow = (selRow + (p0.ly > 0 ? 1 : -1) + OPTS.length) % OPTS.length; buildGarageUI(); }
    if (Math.abs(p0.lx) > 0.6 && t - garageInput.t > 0.3) { garageInput.t = t; cycle(selRow, p0.lx > 0 ? 1 : -1); }
    camYawT += p0.rx * 0.04;
  }
  if (up) { selRow = (selRow + OPTS.length - 1) % OPTS.length; buildGarageUI(); }
  if (dn) { selRow = (selRow + 1) % OPTS.length; buildGarageUI(); }
  if (lf) cycle(selRow, -1); if (rt) cycle(selRow, 1);
  if (kPressed.has('Enter') || (p0 && p0.pressed('A'))) { if (trained()) startCombat(load.mode); else askTraining(); return; }
  if (kPressed.has('KeyT') || (p0 && p0.pressed('X'))) startCombat('tutorial');
  if (kPressed.has('KeyO') || (p0 && p0.pressed('Y'))) openSettings();
  if (kPressed.has('KeyN') || (p0 && p0.pressed('MENU'))) openNet();
}
let orbitA = 0.6;
function camOrbit(dt, dist, hgt) {
  orbitA += dt * 0.12 + camYawT; camYawT *= 0.9;
  const c = garageRig ? garageRig.root.position : V3();
  const x = c.x + Math.sin(orbitA) * dist, z = c.z + Math.cos(orbitA) * dist;
  camera.position.set(x, Math.max(height(x, z) + 1, c.y + hgt), z);
  // offset so the rig sits right of the menu on wide screens
  const side = innerWidth > 900 ? 0.18 : 0;
  camera.lookAt(c.x, c.y + hgt * 0.35, c.z);
  if (side) { camera.rotateY(side * 1.1); }
  camera.fov = 45; camera.updateProjectionMatrix();
}
function resume() { game.state = 'combat'; $('banner').style.display = 'none'; }
function pause() { game.state = 'paused'; showBanner('PAUSED', game.mode === 'tutorial' ? 'Training' : game.mode === 'escape' ? `Chapter 1 · Escape · checkpoint ${ESC.cp} · ${game.kills} wrecked` : `Wave ${game.wave} · ${game.kills} wrecked · ${game.scrap} scrap · ${D().name}`, { bretry: 'RESUME', bskip: game.mode === 'tutorial' ? 'SKIP TRAINING' : null, bsettings: 'SETTINGS', bgarage: 'BACK TO THE YARD' }); }
function gameOver() { game.state = 'over'; showBanner('WRECKED', `You made it to wave ${game.wave}. ${game.kills} raiders wrecked, ${game.scrap} scrap hauled.`, { bretry: 'RUN IT BACK', bsettings: 'SETTINGS', bgarage: 'CHANGE THE BUILD' }); }

function combatStep(dt, P) {
  if (WORLD.mode === 'port') ganStep(dt);
  // who controls what
  const drvPad = swapRoles && P[1] ? P[1] : P[0], gunPad = p2.on ? (swapRoles ? P[0] : P[1]) : null;
  const netGun = NET.role === 'host' && NET.peer; if (netGun) p2.on = true;
  if (P[1] && !p2.on && !netGun && P[1].pressed('A')) { p2.on = true; toast('Co-op', 'PLAYER 2 ON THE GUN'); }
  if (p2.on && !P[1] && !netGun) { p2.on = false; swapRoles = false; }
  if (p2.on && ((P[0] && P[0].pressed('Y')) || (P[1] && P[1].pressed('Y')))) { swapRoles = !swapRoles; toast('Co-op', 'SEATS SWAPPED'); }
  if ((P[0] && P[0].pressed('MENU')) || kPressed.has('Escape') || kPressed.has('KeyP')) { pause(); return; }
  const inp = { throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false };
  if (drvPad) { inp.throttle = Math.max(drvPad.RT, drvPad.ly < -0.5 && !drvPad.RT ? 0 : 0); inp.brake = drvPad.LT; inp.steer = drvPad.lx; inp.handbrake = drvPad.B > 0.5 || drvPad.X > 0.5; inp.nitro = drvPad.A > 0.5; }
  if (keys.has('KeyW') || keys.has('ArrowUp')) inp.throttle = 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) inp.brake = 1;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) inp.steer = -1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) inp.steer = 1;
  if (keys.has('Space')) inp.handbrake = true;
  if (keys.has('ShiftLeft') || keys.has('ShiftRight')) inp.nitro = true;
  if (player.alive) sfx.engine(clamp(Math.abs(player.speed || 0) / player.maxSpeed, 0, 1.3) + inp.throttle * 0.15, true); else sfx.engine(0, false);

  // camera look input (driver RS when solo)
  const lookPad = p2.on ? drvPad : drvPad;
  const inv = SET.invert ? -1 : 1;
  if (lookPad) camYaw -= lookPad.rx * inv * 2.6 * dt * (p2.on ? 0.6 : 1);
  if (keys.has('KeyQ')) camYaw += 2 * dt; if (keys.has('KeyE')) camYaw -= 2 * dt;
  camYaw -= mouseDX * 0.004; mouseDX = 0;
  const looking = (lookPad && Math.abs(lookPad.rx) > 0.05) || keys.has('KeyQ') || keys.has('KeyE') || document.pointerLockElement === canvas;
  if (!looking) camYaw *= Math.exp(-1.2 * dt);
  camYaw = wrapA(camYaw);

  // vehicles
  for (const v of vehicles) {
    if (v === player) v.update(dt, player.alive ? inp : {});
    else { v.update(dt, v.alive ? aiInput(v, dt) : {}); if (v.alive) aiShoot(v, dt); }
    updateHarpoon(v, dt);
  }
  for (const v of vehicles) if (v.alive && v.burn > 0 && v.burnSrc) { v.damage(9 * dt, null, null, v.burnSrc, 'fire'); if (v.burn <= dt) v.burnSrc = null; }
  collisions(dt); propCollisions();
  updateBullets(dt); updateRockets(dt); updateDebris(dt);

  // player aiming
  camYawWorld = player.h + camYaw;
  const camF = V3(Math.sin(camYawWorld), 0, Math.cos(camYawWorld));
  let fire = false, press = false;
  if (netGun) {
    const I = NET.in; p2.yaw = I.yaw || 0; p2.pitch = I.pitch || 0;
    const wy = player.h + p2.yaw; const mp = player.wGun.getWorldPosition(V3());
    aimPoint.copy(mp).add(V3(Math.sin(wy) * 60, Math.tan(p2.pitch) * 60, Math.cos(wy) * 60));
    lockTarget = pickTarget(tmpV2.set(Math.sin(wy), 0, Math.cos(wy)), 0.14); if (lockTarget) aimPoint.copy(lockTarget.root.position).add(V3(0, 1.2, 0));
    fire = !!I.fire; press = (I.press || 0) > NET.seenPress; NET.seenPress = I.press || 0;
    if ((I.swap || 0) > NET.seenSwap) { NET.seenSwap = I.swap; swapWeapon(player); }
  } else if (p2.on && gunPad) {
    p2.yaw -= gunPad.rx * inv * 2.4 * dt; p2.pitch = clamp(p2.pitch - gunPad.ry * inv * 1.2 * dt, -0.2, 0.45);
    const wy = player.h + p2.yaw; const mp = player.wGun.getWorldPosition(V3());
    aimPoint.copy(mp).add(V3(Math.sin(wy) * 60, Math.tan(p2.pitch) * 60, Math.cos(wy) * 60));
    lockTarget = pickTarget(tmpV2.set(Math.sin(wy), 0, Math.cos(wy)), 0.14);
    if (lockTarget) aimPoint.copy(lockTarget.root.position).add(V3(0, 1.2, 0));
    fire = gunPad.RB > 0.5 || gunPad.RT > 0.5; press = gunPad.pressed('RB') || gunPad.pressed('RT');
  } else {
    lockTarget = pickTarget(camF, 0.42);
    if (lockTarget) aimPoint.copy(lockTarget.root.position).add(V3(0, lockTarget.box.hy * 0.45, 0)).addScaledVector(lockTarget.vel, lockTarget.pos.distanceTo(player.pos) / 170).addScaledVector(player.vel, -lockTarget.pos.distanceTo(player.pos) / 170);
    else aimPoint.copy(player.root.position).addScaledVector(camF, 60).add(V3(0, 2, 0));
    if (drvPad) { fire = drvPad.RB > 0.5; press = drvPad.pressed('RB'); }
  }
  const swPad = p2.on && gunPad ? gunPad : drvPad;
  if ((swPad && ['UP', 'DOWN', 'LEFT', 'RIGHT'].some((k) => swPad.pressed(k))) || kPressed.has('KeyF') || kPressed.has('Tab')) swapWeapon(player);
  player.reelIn = !!((p2.on && gunPad ? gunPad.LB > 0.5 : drvPad && drvPad.LB > 0.5) || keys.has('KeyK'));
  if (netGun) player.reelIn = !!NET.in.reel || keys.has('KeyK');
  if (mouseDown || keys.has('KeyJ')) fire = true; if (kPressed.has('KeyJ') || (mouseDown && !combatStep.md)) press = true; combatStep.md = mouseDown;
  if (player.alive) { player.aimAt(aimPoint, dt, 6); player.tryFire(dt, lockTarget, fire, press); }

  // waves
  if (game.mode === 'tutorial') tutorialStep(dt, P, inp);
  if (game.mode === 'escape') escapeStep(dt);
  if (game.state !== 'combat') return;
  const alive = vehicles.filter((v) => !v.isPlayer && v.alive).length;
  if (game.mode === 'waves' && alive === 0 && player.alive) { if (game.waveT <= 0 && game.wave > 0) { const rep0 = Math.round(player.hpMax * 0.25); player.hp = Math.min(player.hpMax, player.hp + rep0); player.nitro = 100; toast('Wave ' + game.wave + ' cleared', 'HULL REPAIRED +' + rep0, true); game.waveT = 6; game.upgT = 1.6; }
    if (game.upgT > 0) { game.upgT -= dt; if (game.upgT <= 0) { openUpgrade(); return; } } if (game.wave > 0 && game.waveT > 0 && game.waveT < 3.2) { const wc = $('wavecall'); wc.textContent = 'WAVE ' + (game.wave + 1) + ' IN ' + Math.ceil(game.waveT); wc.style.opacity = 1; } game.waveT -= dt; if (game.waveT <= 0) { spawnWave(); game.waveT = 0; } }
  // cleanup dead enemies after a while
  for (let i = vehicles.length - 1; i >= 0; i--) { const v = vehicles[i]; if (!v.alive && !v.isPlayer) { v.dead = (v.dead || 0) + dt; if (v.dead > 20) { v.root.removeFromParent(); vehicles.splice(i, 1); } } }
  if (!player.alive && game.mode !== 'escape') { game.overT = (game.overT || 0) + dt; if (game.overT > 2.5) { game.overT = 0; gameOver(); } }

  followCam(dt);
  drawHUD(dt);
  // reticle
  const sp = aimPoint.clone().project(camera);
  if (sp.z < 1 && player.alive) { reticle.style.display = 'block'; reticle.style.left = ((sp.x + 1) / 2 * innerWidth) + 'px'; reticle.style.top = ((1 - sp.y) / 2 * innerHeight) + 'px'; reticle.classList.toggle('lock', !!lockTarget); reticle.style.transform = hitT > 0 ? 'scale(1.25)' : ''; } else reticle.style.display = 'none';
  hitT -= dt;
}
function pickTarget(dir, maxAng) {
  let best = null, bs = maxAng;
  for (const v of vehicles) {
    if (v.isPlayer || !v.alive) continue; const d = v.pos.clone().sub(player.pos); const L = d.length(); if (L > 110) continue;
    const a = Math.acos(clamp(d.setY(0).normalize().dot(dir), -1, 1)); const s = a + L / 900;
    if (s < bs) { bs = s; best = v; }
  }
  return best;
}
let camPos = V3(0, 5, -10); const camLook = V3();
function followCam(dt) {
  if (!player) return;
  const c = player.cfg; const [dist, hgt] = c.cam;
  const yaw = player.h + camYaw; camYawWorld = yaw;
  const sp = Math.abs(player.speed || 0);
  let d = dist + sp * 0.06, h = hgt + sp * 0.02;
  if (WORLD.mode === 'port') { const ce = portCeil(player.pos.x, player.pos.z, player.y); if (ce - player.y < 7) { h = Math.min(h, ce - player.y - 0.8); d = Math.min(d, dist * 0.8); } }
  const target = player.root.position.clone().add(V3(-Math.sin(yaw) * d, h, -Math.cos(yaw) * d));
  target.y = Math.max(target.y, groundAt(target.x, target.z, player.y + 1) + 1.2);
  if (WORLD.mode === 'port') { const from = player.root.position.clone().add(V3(0, 1.3, 0)); const f = portSeg(from, target); if (f < 1) target.lerpVectors(from, target, Math.max(0.12, f - 0.08)); }
  camPos.lerp(target, 1 - Math.exp(-7 * dt));
  camLook.lerp(player.root.position.clone().add(V3(Math.sin(yaw) * 6, c.hy * 0.55, Math.cos(yaw) * 6)), 1 - Math.exp(-10 * dt));
  camera.position.copy(camPos);
  trauma = Math.max(0, trauma - dt * 1.4);
  const s = trauma * trauma; const t = game.t * 40;
  camera.position.add(V3(Math.sin(t * 1.1) * s * 0.5, Math.sin(t * 1.7) * s * 0.4, Math.cos(t * 1.3) * s * 0.5));
  camera.lookAt(camLook);
  const nit = player.nitro < 99 && (keys.has('ShiftLeft') || (readPadsCache && readPadsCache.A > 0.5));
  const tf = 62 + clamp(sp / player.maxSpeed, 0, 1.6) * 8 + (player.nitOn ? 7 : 0);
  camera.fov += (tf - camera.fov) * Math.min(1, 3 * dt); camera.updateProjectionMatrix();
}
let readPadsCache = null;


// ============================================================ CHAPTER 1: ESCAPE (night run to the bridge)
const ESC = {
  built: false, group: new THREE.Group(), sky: new THREE.Group(), chunks: [], grid: null, V0: -320, V1: 6420, W: 130, D: 2,
  checkpoints: [40, 600, 1200, 1800, 2400, 2980, 3600, 4250, 4900, 5450],
  BZ0: 5600, BZ1: 5800, deckY: 10.6, segs: [], tornados: [], bolts: [], static: [], arenaStatic: null,
  waves: [[60, 2, 'behind'], [480, 2, 'behind'], [900, 2, 'ahead'], [1300, 3, 'behind'], [1650, 2, 'ahead'], [2050, 3, 'behind'], [2600, 2, 'ahead'],
    [3050, 2, 'behind'], [3500, 2, 'ahead'], [4300, 3, 'behind'], [4700, 2, 'ahead'], [5100, 3, 'behind'], [5400, 2, 'behind']],
  ramps: [[400, 4, 16, 9, 3.2], [900, -8, 16, 9, 3.2], [1300, 0, 18, 11, 4.2], [1420, -40, 18, 10, 4], [1500, 34, 18, 10, 4], [1620, 0, 20, 12, 4.6],
    [1700, -22, 18, 10, 4], [4500, 0, 16, 10, 3.6], [4800, 10, 16, 9, 3.4], [5150, -6, 18, 10, 4], [5400, 0, 18, 11, 4.2]],
};
ESC.group.visible = false; scene.add(ESC.group); scene.add(ESC.sky); ESC.sky.visible = false;
const pathX = (z) => 60 * Math.sin(z / 700) + 25 * Math.sin(z / 260 + 1) + 10 * Math.sin(z / 97);
const pathDX = (z) => 60 / 700 * Math.cos(z / 700) + 25 / 260 * Math.cos(z / 260 + 1) + 10 / 97 * Math.cos(z / 97);
function keyed(K, z) { // smooth interpolation through [z, value] keypoints
  if (z <= K[0][0]) return K[0][1];
  for (let i = 1; i < K.length; i++) if (z <= K[i][0]) { const [z0, a] = K[i - 1], [z1, b] = K[i]; const t = (z - z0) / (z1 - z0); return a + (b - a) * t * t * (3 - 2 * t); }
  return K[K.length - 1][1];
}
const HW_K = [[-400, 30], [1150, 30], [1260, 90], [1740, 90], [1850, 70], [2850, 70], [2960, 16], [4150, 16], [4260, 40], [5500, 40], [5590, 7], [5815, 7], [5870, 34], [6500, 34]];
const E_K = [[-400, 0], [600, 6], [1200, -4], [1800, 0], [2900, 4], [3300, 18], [4100, 24], [4400, 12], [5480, 10.2], [5900, 10.2], [6500, 10]];
const DUNE_K = [[-400, 0.5], [1100, 0.9], [1260, 3.2], [1740, 3.2], [1850, 1.4], [2850, 1.4], [2960, 0.25], [4150, 0.25], [4260, 1.0], [5450, 0.8], [5560, 0], [5880, 0], [6000, 0.5]];
const escHW = (z) => keyed(HW_K, z), escE = (z) => keyed(E_K, z);
const cliffAmt = (z) => smooth(2940, 3000, z) * (1 - smooth(4100, 4160, z));
const gorgeAmt = (z) => smooth(ESC.BZ0 - 18, ESC.BZ0 + 2, z) * (1 - smooth(ESC.BZ1 - 2, ESC.BZ1 + 18, z));
function escRaw(u, z) {
  const hw = escHW(z), e = escE(z), da = keyed(DUNE_K, z);
  let h = e + da * (Math.sin(z / 19 + Math.sin(u / 27) * 1.3) * 0.6 + Math.sin(z / 41 - u / 33) * 0.4) + (fbm(u * 0.05 + 3, z * 0.05, 3) - 0.5) * 1.1 * Math.min(1, da + 0.3);
  const out = Math.abs(u) - hw;
  if (out > 0) {
    const cs = u > 0 ? cliffAmt(z) : 0;
    const wall = Math.min(75, out * 1.7 + out * out * 0.025) * (0.65 + 0.7 * fbm(u * 0.03 + 9, z * 0.025, 3));
    h += wall * (1 - cs) - Math.min(95, out * 5) * cs;
  }
  for (const [rz, ru, len, w, rh] of ESC.ramps) {
    if (z < rz || z > rz + len || Math.abs(u - ru) > w / 2) continue;
    h = Math.max(h, escE(rz) + rh * (z - rz) / len);
  }
  const gz = gorgeAmt(z); if (gz > 0) h = h + (-85 + fbm(u * 0.04, z * 0.04, 3) * 12 - h) * gz;
  return h;
}
function escGrid(x, z) {
  const u = clamp(x - pathX(z), -ESC.W, ESC.W - 0.01), v = clamp(z, ESC.V0, ESC.V1 - 0.01);
  const fu = (u + ESC.W) / ESC.D, fv = (v - ESC.V0) / ESC.D, i = Math.floor(fu), j = Math.floor(fv), a = fu - i, b = fv - j, C = ESC.cols;
  const G = ESC.grid, k = j * C + i;
  return (G[k] * (1 - a) + G[k + 1] * a) * (1 - b) + (G[k + C] * (1 - a) + G[k + C + 1] * a) * b;
}
function escH(x, z) {
  if (z > ESC.BZ0 && z < ESC.BZ1 && Math.abs(x - pathX(z)) < 6.3) { const s = ESC.segs[Math.floor((z - ESC.BZ0) / 20)]; if (s && !s.gone) return ESC.deckY; }
  return escGrid(x, z);
}
function escClamp(v, dt) {
  const z = v.pos.z, u = v.pos.x - pathX(z), hw = escHW(z);
  if (gorgeAmt(z) > 0.05 && Math.abs(u) > 6.3) return; // off the bridge: fall
  const lim = hw + 0.8;
  if (u > lim && cliffAmt(z) > 0.5) return; // off the cliff road: fall
  if (Math.abs(u) > lim) {
    const sg = Math.sign(u); v.pos.x = pathX(z) + sg * lim;
    const nx = -sg, nz = sg * pathDX(z); const L = Math.hypot(nx, nz); const vn = (v.vel.x * nx + v.vel.z * nz) / L;
    if (vn < 0) { v.vel.x -= nx / L * vn * 1.3; v.vel.z -= nz / L * vn * 1.3; if (vn < -9 && v.alive) { v.damage(-vn * 0.6, null, null, null, 'ram'); sparks(v.root.position.clone().add(V3(0, 1, 0)), V3(nx, 0.6, nz), 8); if (v.isPlayer) { shake(0.25); rumble(0.5, 0.4, 140); } sfx.clang(); } }
  }
  if (z < ESC.V0 + 40) { v.pos.z = ESC.V0 + 40; v.vel.z = Math.max(0, v.vel.z); }
  if (z > ESC.V1 - 60) { v.pos.z = ESC.V1 - 60; v.vel.z = Math.min(0, v.vel.z); }
}
const roadH = (z) => Math.atan2(pathDX(z), 1);

function buildEscape() { if (!ESC.built) withSeed(21, buildEscapeRaw); }
function buildEscapeRaw() {
  ESC.built = true;
  const t0 = performance.now();
  ESC.cols = Math.round(ESC.W * 2 / ESC.D) + 1; ESC.rows = Math.round((ESC.V1 - ESC.V0) / ESC.D) + 1;
  const G = ESC.grid = new Float32Array(ESC.cols * ESC.rows);
  for (let j = 0; j < ESC.rows; j++) { const z = ESC.V0 + j * ESC.D; for (let i = 0; i < ESC.cols; i++) G[j * ESC.cols + i] = escRaw(-ESC.W + i * ESC.D, z); }
  // terrain chunks
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: TERRAIN_TEX.grain, normalMap: TERRAIN_TEX.ripple, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.96, metalness: 0 });
  const cSand = new THREE.Color('#c99a68'), cSand2 = new THREE.Color('#a87648'), cRock = new THREE.Color('#7a4630'), cDeep = new THREE.Color('#3a2418'), tc = new THREE.Color();
  const STEP = 4, NU = Math.round(ESC.W * 2 / STEP) + 1, CH = 200;
  for (let zc = ESC.V0; zc < ESC.V1 - 1; zc += CH) {
    const NV = CH / STEP + 1; const pos = new Float32Array(NU * NV * 3), col = new Float32Array(NU * NV * 3), uv = new Float32Array(NU * NV * 2), idx = [];
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const z = zc + j * STEP, u = -ESC.W + i * STEP, x = pathX(z) + u, k = j * NU + i, y = escGrid(x, z);
      pos[k * 3] = x; pos[k * 3 + 1] = y; pos[k * 3 + 2] = z; uv[k * 2] = (x + 450) / 900; uv[k * 2 + 1] = (z + 450) / 900;
      const out = Math.abs(u) - escHW(z);
      tc.copy(cSand2).lerp(cSand, smooth(0.3, 0.75, fbm(x * 0.03, z * 0.03, 3))).lerp(cRock, smooth(-2, 6, out) * 0.9).lerp(cDeep, smooth(-10, -60, y));
      col[k * 3] = tc.r; col[k * 3 + 1] = tc.g; col[k * 3 + 2] = tc.b;
      if (i < NU - 1 && j < NV - 1) idx.push(k, k + NU, k + 1, k + 1, k + NU, k + NU + 1);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; m.userData.zc = zc + CH / 2; ESC.group.add(m); ESC.chunks.push(m);
  }
  // boulders along the walls, a few in the road
  const rg = rockGeo(3, 0.9, 4.2); const rm = new THREE.MeshStandardMaterial({ color: '#7e4a30', roughness: 0.93, flatShading: true });
  const N = 900; const im = new THREE.InstancedMesh(rg, rm, N); const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = V3(), p = V3(); let k = 0;
  while (k < N) {
    const z = rnd(ESC.V0, ESC.V1 - 100); if (gorgeAmt(z) > 0) continue;
    const hw = escHW(z); const inRoad = Math.random() < 0.06 && z > 150 && Math.abs(z - 5600) > 200;
    const side = Math.random() < 0.5 ? -1 : 1; if (!inRoad && side > 0 && cliffAmt(z) > 0.3) continue;
    const u = inRoad ? rnd(-hw + 4, hw - 4) : side * (hw + rnd(1, 30)); const x = pathX(z) + u;
    if (inRoad && ESC.ramps.some((r) => Math.abs(z - r[0] - 8) < 30)) continue;
    const s0 = inRoad ? rnd(1.2, 2.6) : rnd(2, 9);
    q.setFromEuler(new THREE.Euler(rnd(-0.3, 0.3), rnd(0, 6.28), rnd(-0.3, 0.3))); sc.set(s0 * rnd(0.9, 1.6), s0 * rnd(0.6, 1.2), s0 * rnd(0.9, 1.5));
    p.set(x, escGrid(x, z) - s0 * 0.2, z); m4.compose(p, q, sc); im.setMatrixAt(k++, m4);
    if (inRoad) ESC.static.push({ x, z, r: s0 * 1.2 });
  }
  im.castShadow = im.receiveShadow = true; ESC.group.add(im);
  // ramps: rusty steel wedges
  const rampMat = new THREE.MeshStandardMaterial({ color: '#5a3a26', roughness: 0.7, metalness: 0.5 }); weather(rampMat, 0.6, 0.8);
  for (const [rz, ru, len, w, rh] of ESC.ramps) {
    const geo = new THREE.BufferGeometry(); const hw2 = w / 2;
    const P = [-hw2, 0, 0, hw2, 0, 0, -hw2, rh, len, hw2, rh, len, -hw2, 0, len, hw2, 0, len];
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); geo.setIndex([0, 2, 1, 1, 2, 3, 0, 4, 2, 1, 3, 5, 2, 4, 3, 3, 4, 5]); geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, rampMat); const x = pathX(rz + len / 2) + ru; m.position.set(x, escE(rz) - 0.15, rz); m.rotation.y = roadH(rz + len / 2); m.castShadow = m.receiveShadow = true; ESC.group.add(m);
    for (const sd of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.25, 0.25), new THREE.MeshBasicMaterial({ color: '#ffb347', toneMapped: false })); f.position.set(sd * (hw2 + 0.3), rh + 0.3, len); m.add(f); }
  }
  // wrecks along the road (burnt shells)
  const burnt = new THREE.MeshStandardMaterial({ color: '#2e231c', roughness: 0.95, metalness: 0.3 }); weather(burnt, 0.7, 1.2);
  for (let i = 0; i < 26; i++) {
    const z = rnd(200, 5450); if (ESC.ramps.some((r) => Math.abs(z - r[0] - 8) < 40)) continue; const hw = escHW(z); const u = rnd(-hw + 4, hw - 4); const x = pathX(z) + u;
    const t = ['juggernaut', 'raider', 'scrapper', 'widowmaker'][i % 4]; const b = TEMPL[t].getObjectByName('Body').clone(true);
    b.traverse((o) => { if (o.isMesh) { o.material = burnt; o.castShadow = o.receiveShadow = true; } });
    const g = new THREE.Group(); g.add(b); b.rotation.y = Math.PI; g.position.set(x, escGrid(x, z) - 0.4, z); g.rotation.set(rnd(-0.15, 0.15), rnd(0, 6.28), rnd(-0.4, 0.4)); ESC.group.add(g);
    ESC.static.push({ x, z, r: CFG[t].r * 1.05 });
  }
  // checkpoint flares
  const postM = new THREE.MeshStandardMaterial({ color: '#2a2420', roughness: 0.6, metalness: 0.6 });
  const flareM = new THREE.MeshBasicMaterial({ color: '#ff3a1a', toneMapped: false });
  ESC.cpMarks = ESC.checkpoints.map((z, i) => {
    const g = new THREE.Group(); const hw = escHW(z); if (i === 0) return g;
    for (const sd of [-1, 1]) { const x = pathX(z) + sd * (hw - 1.5); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 3.4, 8), postM); post.position.set(x, escGrid(x, z) + 1.7, z); const f = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), flareM); f.position.set(0, 1.9, 0); post.add(f); g.add(post); }
    ESC.group.add(g); return g;
  });
  // the start: a scrap shack with a lamp
  { const sm = new THREE.MeshStandardMaterial({ color: '#6a5a48', roughness: 0.8, metalness: 0.5 }); weather(sm, 0.55, 1);
    const x = pathX(14) - 16, z = 14, y = escGrid(x, z); const sh = new THREE.Group(); sh.position.set(x, y, z); sh.rotation.y = 0.4;
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(7, 3.2, 5), sm); w1.position.y = 1.6; const rf = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.2, 5.8), sm); rf.position.y = 3.3; rf.rotation.z = 0.08;
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffcf8a', toneMapped: false })); lamp.position.set(3.2, 2.7, 2.7);
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.1), new THREE.MeshBasicMaterial({ color: '#ffb060', toneMapped: false })); door.position.set(1.2, 1.1, 2.52);
    for (const o of [w1, rf]) { o.castShadow = o.receiveShadow = true; } sh.add(w1, rf, lamp, door); ESC.group.add(sh); ESC.static.push({ x, z, r: 4 }); }
  buildBridge(); if (!ESC.skyBuilt) { ESC.skyBuilt = true; buildSkyNight(); } buildInterior(); buildTornados();
  console.log('escape built', Math.round(performance.now() - t0), 'ms');
}
function buildBridge() {
  const deckM = new THREE.MeshStandardMaterial({ color: '#4a3424', roughness: 0.85, metalness: 0.2 }); weather(deckM, 0.3, 0.6);
  const steelM = new THREE.MeshStandardMaterial({ color: '#5a4a3e', roughness: 0.6, metalness: 0.7 }); weather(steelM, 0.65, 0.4);
  const plank = new THREE.BoxGeometry(12.4, 0.5, 20.3), chord = new THREE.BoxGeometry(0.35, 0.35, 20.3), post = new THREE.BoxGeometry(0.3, 4, 0.3), diag = new THREE.BoxGeometry(0.22, 0.22, 10.6), pillar = new THREE.BoxGeometry(1.6, 92, 1.6);
  for (let i = 0; i < 10; i++) {
    const z = ESC.BZ0 + 10 + i * 20, x = pathX(z); const g = new THREE.Group(); g.position.set(x, ESC.deckY, z); g.rotation.y = roadH(z);
    const d = new THREE.Mesh(plank, deckM); d.position.y = -0.25; g.add(d);
    for (const sd of [-1, 1]) {
      const lo = new THREE.Mesh(chord, steelM); lo.position.set(sd * 6.3, 0.3, 0); const hi = new THREE.Mesh(chord, steelM); hi.position.set(sd * 6.3, 4.0, 0); g.add(lo, hi);
      for (const pz of [-10, 0]) { const p = new THREE.Mesh(post, steelM); p.position.set(sd * 6.3, 2.1, pz); g.add(p); }
      const dg = new THREE.Mesh(diag, steelM); dg.position.set(sd * 6.3, 2.1, -5); dg.rotation.x = Math.atan2(3.7, 10); g.add(dg);
      const dg2 = new THREE.Mesh(diag, steelM); dg2.position.set(sd * 6.3, 2.1, 5); dg2.rotation.x = -Math.atan2(3.7, 10); g.add(dg2);
    }
    if (i % 3 === 1) for (const sd of [-1, 1]) { const pl = new THREE.Mesh(pillar, steelM); pl.position.set(sd * 4, -46.5, 0); g.add(pl); }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    ESC.group.add(g); ESC.segs.push({ g, gone: false, fall: -1, vy: 0, home: g.position.clone(), rot: g.rotation.clone(), spin: V3() });
  }
}
function resetBridge() { for (const s of ESC.segs) { s.gone = false; s.fall = -1; s.vy = 0; s.g.position.copy(s.home); s.g.rotation.copy(s.rot); s.g.visible = true; } }
function collapseBridge(at) {
  netEv('B', r2(at.x), r2(at.y), r2(at.z));
  ESC.segs.forEach((s, i) => { const d = Math.abs(s.home.z - at.z); s.fall = 0.12 + d / 75 + rnd(0, 0.15); s.spin.set(rnd(-0.6, 0.6), rnd(-0.3, 0.3), rnd(-0.8, 0.8)); });
}
function updateBridge(dt) {
  for (const s of ESC.segs) {
    if (s.fall < 0) continue;
    if (s.fall > 0) { s.fall -= dt; if (s.fall <= 0) { s.gone = true; s.fall = 0; explosion(s.g.position.clone().add(V3(0, 1, 0)), 0.9); for (let k = 0; k < 12; k++) emit(PS_ADD, s.g.position.clone(), V3(rnd(-12, 12), rnd(4, 16), rnd(-12, 12)), rnd(0.6, 1.4), 0.3, 0.1, COL.spark, 1, COL.fire2, 0.3, 18, 0.4); } continue; }
    s.vy -= 22 * dt; s.g.position.y += s.vy * dt; s.g.rotation.x += s.spin.x * dt; s.g.rotation.z += s.spin.z * dt;
    if (s.g.position.y < -110) s.g.visible = false;
  }
}
function buildSkyNight() {
  const n = 1600, P = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = rnd(0, 6.283), e = Math.asin(rnd(0.05, 1)); P[i * 3] = Math.cos(a) * Math.cos(e) * 1800; P[i * 3 + 1] = Math.sin(e) * 1800; P[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 1800; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  const st = new THREE.Points(g, new THREE.PointsMaterial({ color: '#cfd8ff', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 })); ESC.sky.add(st);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(38, 24, 16), new THREE.MeshBasicMaterial({ color: '#e9eeff', fog: false, toneMapped: false })); moon.position.copy(V3(-0.45, 0.42, 0.78).normalize().multiplyScalar(1750)); ESC.sky.add(moon);
  ESC.moonDir = moon.position.clone().normalize();
}
// close-up set for the intro and ending inserts (dashboard, seat belt, back seat), floating far from the road
function buildInterior() {
  const S = ESC.set = new THREE.Group(); S.position.set(900, 300, 0); ESC.group.add(S);
  const dashM = new THREE.MeshStandardMaterial({ color: '#2a2320', roughness: 0.7, metalness: 0.2 }), steelM = new THREE.MeshStandardMaterial({ color: '#b8b2a8', roughness: 0.3, metalness: 1 });
  const strapM = new THREE.MeshStandardMaterial({ color: '#3e3a30', roughness: 0.9 }), seatM = new THREE.MeshStandardMaterial({ color: '#4a2e1e', roughness: 0.75 }), clothM = new THREE.MeshStandardMaterial({ color: '#59604a', roughness: 0.95 });
  ESC.gaugeM = new THREE.MeshStandardMaterial({ color: '#201a14', emissive: '#ff9a3a', emissiveIntensity: 0, roughness: 0.4 });
  const dash = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 0.7), dashM); dash.position.set(0, 0, 0); S.add(dash);
  for (let i = 0; i < 3; i++) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.04, 24), ESC.gaugeM); g.rotation.x = Math.PI / 2; g.position.set(-0.55 + i * 0.28, 0.08, 0.36); S.add(g); const nd = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.09, 0.01), new THREE.MeshBasicMaterial({ color: '#ff5020' })); nd.position.set(-0.55 + i * 0.28, 0.1, 0.385); nd.rotation.z = 1.2; S.add(nd); (ESC.needles = ESC.needles || []).push(nd); }
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.5, 12), dashM); col.rotation.x = Math.PI / 2 - 0.3; col.position.set(-0.4, -0.15, 0.55); S.add(col);
  const ign = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 16), steelM); ign.rotation.x = Math.PI / 2; ign.position.set(0.25, -0.12, 0.37); S.add(ign);
  const key = ESC.key = new THREE.Group(); key.position.set(0.25, -0.12, 0.4);
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.035, 0.12), steelM); blade.position.z = 0.0; const head = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.012), steelM); head.position.z = 0.07; const ring = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 6, 16), steelM); ring.position.set(0, -0.06, 0.07);
  const tag = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.006), new THREE.MeshStandardMaterial({ color: '#b0261a' })); tag.position.set(0, -0.11, 0.07); key.add(blade, head, ring, tag); S.add(key);
  // seat + belt
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.6), seatM); seat.position.set(1.6, -0.6, 1.2); S.add(seat);
  const sback = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.16), seatM); sback.position.set(1.6, -0.15, 1.55); sback.rotation.x = -0.15; S.add(sback);
  const latch = new THREE.Group(); latch.position.set(1.95, -0.42, 1.25); S.add(latch);
  const lb = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.2, 0.06), new THREE.MeshStandardMaterial({ color: '#141210', roughness: 0.5 })); const btn = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.02), new THREE.MeshStandardMaterial({ color: '#b0261a', roughness: 0.5 })); btn.position.set(0, 0.04, -0.035);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.015), new THREE.MeshBasicMaterial({ color: '#000' })); slot.position.set(0, 0.101, 0); latch.add(lb, btn, slot);
  const lstrap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.01), strapM); lstrap.position.set(0, -0.25, 0); latch.add(lstrap);
  const tongue = ESC.tongue = new THREE.Group(); const tg = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.11, 0.008), steelM); tg.position.y = -0.055; const tgh = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.06, 0.02), new THREE.MeshStandardMaterial({ color: '#141210' })); tgh.position.y = 0.02; const st = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.8, 0.008), strapM); st.position.y = 0.45; st.rotation.z = 0.25; tongue.add(tg, tgh, st); S.add(tongue);
  ESC.latchPos = latch.position.clone().add(V3(0, 0.1, 0));
  // back seat with the mystery blanket
  const bs = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 0.7), seatM); bs.position.set(-2, -0.7, 2.6); const bb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.18), seatM); bb.position.set(-2, -0.3, 2.95); bb.rotation.x = -0.15; S.add(bs, bb);
  const lg = new THREE.SphereGeometry(0.42, 28, 18); const lp = lg.attributes.position; const vv = V3();
  for (let i = 0; i < lp.count; i++) { vv.fromBufferAttribute(lp, i); vv.y = Math.max(vv.y, -0.05) * 0.75; vv.multiplyScalar(1 + (fbm(vv.x * 4 + 2, vv.z * 4 + vv.y * 3, 3) - 0.5) * 0.35); lp.setXYZ(i, vv.x * 1.5, vv.y, vv.z); }
  lg.computeVertexNormals();
  const lump = ESC.lump = new THREE.Mesh(lg, clothM); lump.position.set(-2.1, -0.56, 2.6); S.add(lump);
  const shell = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 7), new THREE.MeshStandardMaterial({ color: '#17110d', roughness: 0.9, side: THREE.BackSide })); shell.position.set(0, 0.4, 1.4); S.add(shell);
  const drv = ESC.driver = makeRunner(); drv.position.set(1.6, -1.42, 1.25); drv.rotation.y = Math.PI; S.add(drv);
  const DP = drv.userData.P; DP.hip.rotation.x = -0.12; DP.legL.rotation.x = DP.legR.rotation.x = -1.45; DP.shinL.rotation.x = DP.shinR.rotation.x = 1.35; DP.armL.rotation.x = DP.armR.rotation.x = -0.5;
  const sg = new THREE.BoxGeometry(0.075, 1, 0.012); sg.translate(0, 0.5, 0);
  ESC.strap = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: '#57524a', roughness: 0.9 })); S.add(ESC.strap);
  S.traverse((o) => { if (o.isMesh) o.castShadow = o.receiveShadow = false; });
}
const torMat = new THREE.ShaderMaterial({
  uniforms: { uT: { value: 0 }, uL: { value: 0.35 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `varying vec2 vUv; uniform float uT; uniform float uL;
    void main(){ float a = vUv.x*6.2831; float n = sin(a*7.0 + vUv.y*16.0 - uT*7.0)*0.5+0.5; n *= sin(a*3.0 - vUv.y*7.0 + uT*2.3)*0.5+0.5; n = n*0.8 + 0.2*(sin(a*19.0+vUv.y*40.0-uT*11.0)*0.5+0.5);
      float al = (0.12 + 0.6*n) * smoothstep(0.0, 0.1, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y));
      gl_FragColor = vec4(mix(vec3(0.22,0.16,0.11), vec3(0.62,0.5,0.36), n) * uL, al); }`,
});
function buildTornados() {
  const geo = new THREE.CylinderGeometry(46, 4.5, 190, 40, 20, true); geo.translate(0, 95, 0);
  const geo2 = new THREE.CylinderGeometry(34, 3.5, 170, 32, 16, true); geo2.translate(0, 85, 0);
  for (const [zc, amp, sp, ph] of [[2250, 55, 0.21, 0], [2680, 50, 0.17, 1.3]]) {
    const g = new THREE.Group(); const a = new THREE.Mesh(geo, torMat), b = new THREE.Mesh(geo2, torMat); g.add(a, b);
    const junk = []; for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(tireGeo, tireMat); g.add(t); junk.push({ m: t, r: rnd(8, 30), y: rnd(10, 90), w: rnd(1.5, 3), a: rnd(0, 6) }); }
    ESC.group.add(g); ESC.tornados.push({ g, a, b, zc, amp, sp, ph, x: 0, z: zc, junk });
  }
}
function updateTornados(dt, t) {
  const pz = player ? player.pos.z : 0; const act = pz > 1600 && pz < 3100;
  let near = 1e9;
  for (const T of ESC.tornados) {
    T.g.visible = act; if (!act) continue;
    T.z = T.zc + 40 * Math.sin(t * 0.07 + T.ph); T.x = pathX(T.z) + T.amp * Math.sin(t * T.sp + T.ph);
    T.g.position.set(T.x, escGrid(T.x, T.z) - 2, T.z); T.a.rotation.y += dt * 1.8; T.b.rotation.y -= dt * 2.6; T.g.rotation.z = Math.sin(t * 0.5 + T.ph) * 0.06;
    for (const j of T.junk) { j.a += j.w * dt; j.m.position.set(Math.cos(j.a) * j.r, j.y + Math.sin(t * 2 + j.a) * 3, Math.sin(j.a) * j.r); j.m.rotation.x += dt * 3; j.m.rotation.y += dt * 2; }
    for (let k = 0; k < 5; k++) { const a = rnd(0, 6.283), r = rnd(4, 26); const p = V3(T.x + Math.cos(a) * r, T.g.position.y + rnd(0.5, 6), T.z + Math.sin(a) * r); emit(PS_NORM, p, V3(-Math.sin(a) * 18 + Math.cos(a) * -4, rnd(3, 9), Math.cos(a) * 18 + Math.sin(a) * -4), rnd(1.2, 2.2), 3, rnd(8, 14), COL.dust, 0.5, COL.dust2, 0, -2, 0.6); }
    for (const v of vehicles) {
      const dx = T.x - v.pos.x, dz = T.z - v.pos.z, d = Math.hypot(dx, dz); if (v.isPlayer) near = Math.min(near, d); if (d > 120 || d < 0.01) continue;
      const k = Math.pow(1 - d / 120, 2), nx = dx / d, nz = dz / d;
      v.vel.x += (nx * 34 - nz * 18) * k * dt; v.vel.z += (nz * 34 + nx * 18) * k * dt;
      if (d < 18) {
        if (!v.air) { v.air = true; v.vy = 9; } v.vy += 26 * dt; v.yawV = clamp(v.yawV + 5 * dt, -4, 4);
        if (v.y > escGrid(v.pos.x, v.pos.z) + 22) { v.vel.x -= nx * 30; v.vel.z -= nz * 30; v.vy = 4; }
        if (v.alive) v.damage((v.isPlayer ? 16 : 45) * dt, null, null, null);
        if (v.isPlayer) { shake(0.06); rumble(0.6, 0.6, 80); }
      }
    }
  }
  sfx.wind(act ? clamp(1 - near / 220, 0.08, 1) : 0);
  if (act && near < 70 && !ESC.torWarned) { ESC.torWarned = true; toast('Sandstorm', 'TORNADO. STEER CLEAR'); }
}
// lightning
const boltMat = new THREE.MeshBasicMaterial({ color: '#e8eeff', toneMapped: false, transparent: true });
const boltGeo = new THREE.BoxGeometry(0.5, 1, 0.5); boltGeo.translate(0, 0.5, 0);
function strike(at, dmgTarget) {
  netEv('L', r2(at.x), r2(at.y), r2(at.z));
  const g = new THREE.Group(); let p = at.clone().add(V3(rnd(-30, 30), 220, rnd(-30, 30)));
  const pts = [p.clone()]; for (let i = 1; i <= 12; i++) { const k = i / 12; p = p.clone().lerp(at, 1 / (13 - i)).add(V3(rnd(-6, 6) * (1 - k), 0, rnd(-6, 6) * (1 - k))); pts.push(p.clone()); }
  const seg = (a, b, w) => { const m = new THREE.Mesh(boltGeo, boltMat); m.position.copy(a); const d = b.clone().sub(a); m.scale.set(w, d.length(), w); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); g.add(m); };
  for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], 1.4 - i * 0.07);
  for (let b = 0; b < 3; b++) { let q = pts[2 + b * 3].clone(); for (let i = 0; i < 4; i++) { const n = q.clone().add(V3(rnd(-12, 12), -rnd(10, 18), rnd(-12, 12))); seg(q, n, 0.5); q = n; } }
  ESC.group.add(g); ESC.bolts.push({ g, t: 0.32 });
  ESC.flashT = 0.35; flash(at.clone().add(V3(0, 8, 0)), 2500, 0.3, '#c8d4ff');
  const d = player ? player.pos.distanceTo(at) : 100; setTimeout(() => sfx.thunder(clamp(1.2 - d / 400, 0.4, 1.2)), Math.min(2500, d / 340 * 1000));
  if (d < 40) { shake(0.4); rumble(0.6, 0.6, 200); }
  if (dmgTarget && dmgTarget.alive) { dmgTarget.damage(70, at, V3(0, 1, 0), null, 'blast'); dmgTarget.air = true; dmgTarget.vy = 7; explosion(at, 0.6); }
  for (let k = 0; k < 20; k++) emit(PS_ADD, at.clone().add(V3(0, 0.5, 0)), V3(rnd(-10, 10), rnd(4, 14), rnd(-10, 10)), rnd(0.3, 0.8), 0.3, 0.1, COL.spark, 1, COL.fire2, 0.3, 18, 0.5);
}
function updateLightning(dt) {
  ESC.lt = (ESC.lt == null ? 3 : ESC.lt) - dt;
  if (ESC.lt <= 0 && player && NET.role !== 'guest') {
    ESC.lt = rnd(5, 12);
    const tgt = Math.random() < 0.25 ? vehicles.find((v) => !v.isPlayer && v.alive && v.pos.distanceTo(player.pos) < 140) : null;
    let at; if (tgt) at = tgt.root.position.clone(); else { const z = player.pos.z + rnd(60, 280), u = rnd(-1.4, 1.4) * escHW(z), x = pathX(z) + u; at = V3(x, escGrid(x, z), z); }
    strike(at, tgt);
  }
  for (let i = ESC.bolts.length - 1; i >= 0; i--) { const b = ESC.bolts[i]; b.t -= dt; b.g.visible = b.t > 0.2 || Math.random() < 0.5; boltMat.opacity = 1; if (b.t <= 0) { b.g.removeFromParent(); ESC.bolts.splice(i, 1); } }
  ESC.flashT = Math.max(0, (ESC.flashT || 0) - dt);
  const f = ESC.flashT / 0.35;
  hemi.intensity = 0.32 + f * 2.6; scene.background.setRGB(0.02 + f * 0.25, 0.025 + f * 0.27, 0.05 + f * 0.36); scene.fog.color.setRGB(0.045 + f * 0.2, 0.05 + f * 0.22, 0.075 + f * 0.3);
  torMat.uniforms.uL.value = 0.35 + f * 1.4;
}
// day / night switch
const NIGHT_BG = new THREE.Color('#05070d');
// time of day for the proving ground and garage: day, sunrise, sunset, night
const TIMES = {
  day: { el: 14, az: 215, tur: 7, ray: 1.8, mie: 0.007, sun: '#ffd6a4', si: 3.2, hs: '#bcd2e6', hg: '#8a5a36', hi: 0.55, fog: '#d0a47c', fn: 70, ff: 520, exp: 0.62, env: 0.55, dim: 1 },
  sunrise: { el: 5, az: 100, tur: 6, ray: 3.4, mie: 0.01, sun: '#ffd8b0', si: 2.5, hs: '#9fb4e0', hg: '#6e5248', hi: 0.5, fog: '#c4a8a6', fn: 60, ff: 480, exp: 0.6, env: 0.45, dim: 0.9 },
  sunset: { el: 3.5, az: 250, tur: 11, ray: 3.2, mie: 0.016, sun: '#ff9050', si: 2.7, hs: '#8f7fb5', hg: '#6e3a24', hi: 0.4, fog: '#c67a58', fn: 55, ff: 460, exp: 0.62, env: 0.42, dim: 0.8 },
};
let curTime = 'day';
function applyTime(t) {
  curTime = TIMES[t] || t === 'night' ? t : 'day';
  if (curTime === 'night') { if (!ESC.skyBuilt) { ESC.skyBuilt = true; buildSkyNight(); } setNight(true); return; }
  setNight(false);
  const T = TIMES[curTime], dir = V3().setFromSphericalCoords(1, Math.PI / 2 - THREE.MathUtils.degToRad(T.el), THREE.MathUtils.degToRad(T.az));
  su.turbidity.value = T.tur; su.rayleigh.value = T.ray; su.mieCoefficient.value = T.mie; su.sunPosition.value.copy(dir);
  sun.color.set(T.sun); sun.intensity = T.si; hemi.color.set(T.hs); hemi.groundColor.set(T.hg); hemi.intensity = T.hi;
  scene.fog.color.set(T.fog); scene.fog.near = T.fn; scene.fog.far = T.ff; renderer.toneMappingExposure = T.exp; scene.environmentIntensity = T.env;
  PS_NORM.m.uniforms.uDim.value = T.dim; WORLD.lightDir = dir; makeEnv(dir, T.tur, T.ray, T.mie);
}
function setNight(on) {
  sky.visible = !on; scene.background = on ? NIGHT_BG.clone() : null;
  scene.fog.color.set(on ? '#0b0d14' : FOG); scene.fog.near = on ? 25 : 70; scene.fog.far = on ? 330 : 520;
  sun.color.set(on ? '#9fb2ff' : '#ffd6a4'); sun.intensity = on ? 0.75 : 3.2;
  hemi.color.set(on ? '#3a4a70' : '#bcd2e6'); hemi.groundColor.set(on ? '#1a120c' : '#8a5a36'); hemi.intensity = on ? 0.32 : 0.55;
  scene.environmentIntensity = on ? 0.12 : 0.55; renderer.toneMappingExposure = on ? 0.95 : 0.62;
  PS_NORM.m.uniforms.uDim.value = on ? 0.32 : 1;
  ESC.sky.visible = on; headL.intensity = on ? 900 : 0;
  WORLD.lightDir = on ? (ESC.moonDir || sunDir) : null;
  if (on && ENV.tex) makeEnv(V3(0, -0.2, 1).normalize(), 2, 0.3, 0.002);
}
function enterEscapeWorld(seed) { buildEscape(); withSeed(seed == null ? (Math.random() * 1e9) | 0 : seed, () => enterEscapeWorldRaw()); }
function enterEscapeWorldRaw() {
  buildEscape();
  if (WORLD.mode !== 'escape') { ESC.arenaStatic = STATIC.splice(0); STATIC.push(...ESC.static); }
  WORLD.mode = 'escape'; WORLD.h = escH; WORLD.clamp = escClamp; setNight(true); ESC.group.visible = true; arenaGroup.visible = false;
  // props along the road
  for (const p of props) p.obj.removeFromParent(); props.length = 0;
  for (let i = 0; i < 70; i++) {
    const z = rnd(120, 5450); if (ESC.ramps.some((r) => Math.abs(z - r[0] - 8) < 30)) continue; const hw = escHW(z); const u = rnd(-hw + 3, hw - 3), x = pathX(z) + u;
    if (i % 3 === 0) makeCactus(pathX(z) + Math.sign(u) * (hw - 1.5), z); else { const nb = 2 + ((Math.random() * 3) | 0); for (let k = 0; k < nb; k++) makeBarrel(x + rnd(-1.5, 1.5), z + rnd(-1.5, 1.5)); makeTires(x + rnd(-3, 3), z + rnd(-3, 3)); }
  }
}
function leaveEscapeWorld() {
  if (WORLD.mode !== 'escape') return;
  WORLD.mode = 'arena'; WORLD.clamp = null; ESC.group.visible = false; arenaGroup.visible = true; applyTime(load.time); sfx.wind(0);
  STATIC.length = 0; STATIC.push(...(ESC.arenaStatic || []));
  for (const b of ESC.bolts) b.g.removeFromParent(); ESC.bolts.length = 0;
  placeProps();
}

// ---------------------------------------------------------------- the run
function startEscape() {
  leavePortWorld();
  clearTutorial(); clearWorld(); if (garageRig) garageRig.root.removeFromParent(); garageRig = null;
  enterEscapeWorld(NET.peer ? NET.seed : undefined); resetBridge();
  $('garage').hidden = true; $('gkeys').hidden = true; $('banner').style.display = 'none'; $('upg').hidden = true; $('combat').style.display = 'block';
  document.body.classList.add('incombat');
  game.mode = 'escape'; game.wave = 0; game.kills = 0; game.scrap = 0; game.t = 0; game.collected = 0; game.waveT = 1e9; game.upgT = 0;
  Object.assign(ESC, { cp: 0, wi: 0, lt: 2.5, flashT: 0, torWarned: false, startT: 0, ending: false, runT: 0 });
  ESC.cpMarks.forEach((g) => (g.visible = true));
  spawnPlayerAt(40);
  $('wname').textContent = WEAPONS[player.wk].name; $('ramlbl').textContent = RAMS[load.ram].name + ' · ' + ARMORS[load.armor].name;
  sfx.init(); music.start();
  introCine();
}
function spawnPlayerAt(z) {
  if (player) removeVehicle(player);
  player = new Vehicle(load.type, { ...load }, true); player.place(pathX(z), z, roadH(z)); vehicles.push(player);
  buildPips(); camYaw = 0; camPos.copy(player.root.position).add(V3(0, 4, -10));
}
function escSpawn(n, from) {
  const pz = player.pos.z; const alive = vehicles.filter((v) => !v.isPlayer && v.alive).length; n = Math.min(n + D().count * (n > 1 ? 1 : 0), 7 - alive); if (n <= 0) return;
  for (let i = 0; i < n; i++) {
    const z = from === 'behind' ? pz - rnd(70, 120) : pz + rnd(150, 210); if (gorgeAmt(z) > 0) continue;
    const hw = escHW(z), x = pathX(z) + rnd(-0.6, 0.6) * hw;
    const r = Math.random(); const type = pz > 3000 && i === 0 ? 'juggernaut' : r < 0.2 && pz > 800 ? 'widowmaker' : r < 0.6 ? 'raider' : 'scrapper';
    const lo = { type, weapon: type === 'juggernaut' ? 'rockets' : type === 'raider' && Math.random() < 0.3 ? 'flamer' : 'cannon', ram: Math.random() < 0.6 ? 'spike' : 'saw', armor: rndArmor() };
    const e = new Vehicle(type, lo, false, ENEMY_PAINT[i % 3]);
    e.place(x, z, from === 'behind' ? roadH(z) : roadH(z) + Math.PI);
    if (from === 'behind') { const f = e.fwd; e.vel.set(f.x * 24, 0, f.z * 24); }
    e.ai = { mode: lo.weapon === 'flamer' || type === 'scrapper' ? 'ram' : 'strafe', stuck: 0, rev: 0, burst: rnd(0.5, 2), orbit: Math.random() < 0.5 ? 1 : -1, skill: Math.min(1, 0.6 + pz / 12000), range: lo.weapon === 'flamer' ? 17 : 70 };
    e.maxSpeed *= D().speed; e.baseMax = e.maxSpeed; vehicles.push(e);
  }
}
function escapeStep(dt) {
  ESC.runT += dt;
  const P = player; const pz = P.pos.z;
  // headlight follows the rig
  P.root.localToWorld(headL.position.set(0, 1.2, P.box.hz * 0.9)); P.root.localToWorld(headL.target.position.set(0, -0.5, P.box.hz + 34)); headL.target.updateMatrixWorld();
  ESC.sky.position.copy(camera.position);
  for (const c of ESC.chunks) c.visible = Math.abs(c.userData.zc - camera.position.z) < 560;
  updateLightning(dt); updateTornados(dt, ESC.runT); updateBridge(dt);
  for (let i = vehicles.length - 1; i >= 0; i--) { const v = vehicles[i]; if (v.y < -32 && !v.isPlayer && v.alive) v.destroy(null); }
  if (ESC.ending || game.state === 'cine') return;
  // checkpoints
  const nx = ESC.checkpoints[ESC.cp + 1];
  if (nx != null && pz > nx && P.alive) { ESC.cp++; ESC.cpMarks[ESC.cp].visible = false; P.hp = Math.min(P.hpMax, P.hp + P.hpMax * 0.35); P.nitro = 100; toast('Checkpoint ' + ESC.cp + ' of ' + (ESC.checkpoints.length - 1), 'HULL PATCHED', true); sfx.pickup(); }
  // raider packs
  while (ESC.wi < ESC.waves.length && pz > ESC.waves[ESC.wi][0]) { const [, n, from] = ESC.waves[ESC.wi++]; escSpawn(n, from); if (from === 'behind') toast('Behind you', 'RAIDERS CLOSING IN'); }
  // rubber band the chasers, clean up stragglers, the fallen
  for (let i = vehicles.length - 1; i >= 0; i--) {
    const v = vehicles[i];
    if (!v.isPlayer && v.alive && v.baseMax) v.maxSpeed = v.baseMax * (pz - v.pos.z > 45 ? 1.3 : 1);
    if (!v.isPlayer && (pz - v.pos.z > 320 || v.pos.z - pz > 420)) { v.root.removeFromParent(); vehicles.splice(i, 1); continue; }
    if (v.y < -32) { if (v.isPlayer) { if (!ESC.respawnT) { ESC.respawnT = 1.2; toast('Over the edge', 'BACK TO THE CHECKPOINT'); } } else if (v.alive) { v.destroy(null); } }
  }
  if (!P.alive && !ESC.respawnT) ESC.respawnT = 2.6;
  if (ESC.respawnT) { ESC.respawnT -= dt; if (ESC.respawnT <= 0) { ESC.respawnT = 0; respawn(); } }
  if (pz > ESC.BZ1 + 30 && P.alive) endingCine();
}
function respawn() {
  const z = ESC.checkpoints[ESC.cp];
  for (let i = vehicles.length - 1; i >= 0; i--) { const v = vehicles[i]; if (!v.isPlayer && Math.abs(v.pos.z - z) < 90) { v.root.removeFromParent(); vehicles.splice(i, 1); } }
  spawnPlayerAt(z + 4); toast('Checkpoint ' + ESC.cp, 'GET MOVING'); combatHeat = -99;
}

// ---------------------------------------------------------------- cutscenes
const CINE = { on: false, shots: [], i: 0, t: 0, done: null };
const runnerMat = new THREE.MeshStandardMaterial({ color: '#4a3b2c', roughness: 0.9 }), skinMat = new THREE.MeshStandardMaterial({ color: '#8a6248', roughness: 0.8 }), coatMat = new THREE.MeshStandardMaterial({ color: '#3a2a20', roughness: 0.85 });
function makeRunner() {
  const R = new THREE.Group(); const P = {};
  const box = (w, h, d, m, x, y, z) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = true; return o; };
  P.hip = new THREE.Group(); P.hip.position.y = 1.0; R.add(P.hip);
  P.torso = box(0.46, 0.62, 0.26, coatMat, 0, 0.36, 0); P.hip.add(P.torso);
  const coat = box(0.5, 0.5, 0.3, coatMat, 0, -0.05, 0); P.hip.add(coat);
  P.head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), skinMat); P.head.position.y = 0.82; P.hip.add(P.head);
  const scarf = box(0.32, 0.1, 0.3, new THREE.MeshStandardMaterial({ color: '#8a2a18' }), 0, 0.67, 0); P.hip.add(scarf);
  for (const sd of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sd * 0.13, -0.05, 0); leg.add(box(0.15, 0.5, 0.16, runnerMat, 0, -0.25, 0)); const shin = new THREE.Group(); shin.position.y = -0.5; shin.add(box(0.13, 0.48, 0.14, runnerMat, 0, -0.24, 0)); shin.add(box(0.15, 0.08, 0.28, coatMat, 0, -0.48, 0.05)); leg.add(shin); P.hip.add(leg);
    const arm = new THREE.Group(); arm.position.set(sd * 0.3, 0.6, 0); arm.add(box(0.11, 0.55, 0.12, coatMat, 0, -0.27, 0)); P.hip.add(arm);
    P[sd < 0 ? 'legL' : 'legR'] = leg; P[sd < 0 ? 'shinL' : 'shinR'] = shin; P[sd < 0 ? 'armL' : 'armR'] = arm;
  }
  R.userData.P = P; return R;
}
function animRunner(R, t, speed = 1) {
  const P = R.userData.P, w = t * 11 * speed;
  P.legL.rotation.x = Math.sin(w) * 0.9; P.legR.rotation.x = -Math.sin(w) * 0.9; P.shinL.rotation.x = Math.max(0, -Math.cos(w)) * 1.2; P.shinR.rotation.x = Math.max(0, Math.cos(w)) * 1.2;
  P.armL.rotation.x = -Math.sin(w) * 1.0; P.armR.rotation.x = Math.sin(w) * 1.0; P.hip.position.y = 1.0 + Math.abs(Math.sin(w)) * 0.08; P.hip.rotation.x = 0.25;
}
function cineCam(pos, look, fov = 50) { camera.position.copy(pos); camera.lookAt(look); camera.fov = fov; camera.updateProjectionMatrix(); }
function caption(big, small, quiet = false) { netEv('c', big || '', small || '', quiet ? 1 : 0); const c = $('cap'); if (!big) { c.hidden = true; return; } c.hidden = false; c.classList.toggle('quiet', quiet); $('capskip').hidden = CINE.skippable === false; $('capb').textContent = big; $('caps').textContent = small || ''; }
function runCine(shots, done) {
  CINE.on = true; CINE.shots = shots; CINE.i = 0; CINE.t = 0; CINE.done = done; game.state = 'cine'; document.body.classList.add('cine');
  if (shots[0].setup) shots[0].setup();
}
function endCine() { CINE.on = false; document.body.classList.remove('cine'); caption(null); const d = CINE.done; CINE.done = null; if (d) d(); }
function cineStep(dt, P) {
  const p0 = P[0];
  if (CINE.skippable !== false && ((p0 && p0.pressed('A')) || kPressed.has('Enter') || kPressed.has('Escape') || kPressed.has('Space'))) { const last = CINE.shots[CINE.shots.length - 1]; for (let i = CINE.i; i < CINE.shots.length; i++) if (CINE.shots[i].skip) CINE.shots[i].skip(); return endCine(); }
  const s = CINE.shots[CINE.i]; CINE.t += dt;
  // keep the world alive during the shot
  for (const v of vehicles) { if (v.cineInp) v.update(dt, v.cineInp(CINE.t)); else v.update(dt, {}); }
  updateBullets(dt); updateRockets(dt); updateDebris(dt);
  escapeStep(dt);
  if (s.update) s.update(CINE.t, dt);
  if (CINE.t >= s.dur) { if (s.end) s.end(); CINE.i++; CINE.t = 0; if (CINE.i >= CINE.shots.length) return endCine(); const n = CINE.shots[CINE.i]; if (n.setup) n.setup(); }
}
function introCine() {
  const z0 = 40, cx = pathX(z0), cy = escGrid(cx, z0);
  const runner = makeRunner(); ESC.group.add(runner);
  const chasers = [];
  for (let i = 0; i < 2; i++) { const z = -90 - i * 25, x = pathX(z) + (i ? 6 : -5); const e = new Vehicle(i ? 'juggernaut' : 'raider', { type: i ? 'juggernaut' : 'raider', weapon: i ? 'rockets' : 'cannon', ram: 'spike', armor: 'heavy' }, false, ENEMY_PAINT[i]); e.place(x, z, roadH(z)); e.ai = { dummy: true, mode: 'ram', stuck: 0, rev: 0, burst: 2, orbit: 1, skill: 0.7, range: 70 }; e.cineInp = () => ({ throttle: 0.45 }); e.baseMax0 = e.maxSpeed; e.maxSpeed *= 0.5; vehicles.push(e); chasers.push(e); }
  player.cineInp = () => ({});
  const shots = [
    { dur: 3.6, setup() { caption('CHAPTER 1', 'ESCAPE'); runner.visible = true; },
      update(t) { const z = -34 + t * 7.2, x = pathX(z) - 2; runner.position.set(x, escGrid(x, z), z); runner.rotation.y = roadH(z); animRunner(runner, t);
        cineCam(V3(pathX(-2) + 3, escGrid(pathX(-2), -2) + 1.0, -2), V3(x, runner.position.y + 1.4, z), 42); if (t > 0.9 && !this.lt) { this.lt = 1; strike(V3(pathX(-70) + 18, escGrid(pathX(-70) + 18, -70), -70)); } } },
    { dur: 2.0, setup() { caption(null); },
      update(t) { const side = player.root.localToWorld(V3(-player.box.hx - 0.3, 0, 0.2)); const from = player.root.localToWorld(V3(-7, 0, -6)); const k = clamp(t / 1.0, 0, 1);
        const pos = from.clone().lerp(side, k); runner.position.set(pos.x, escGrid(pos.x, pos.z), pos.z); runner.lookAt(side.x, runner.position.y, side.z); animRunner(runner, t); runner.visible = t < 1.05;
        if (t > 1.15 && !this.sl) { this.sl = 1; sfx.slam(); shake(0.35); player.svy -= 1.6; }
        cineCam(player.root.localToWorld(V3(6.5, 1.6, 2.5)), player.root.localToWorld(V3(-0.8, 1.0, -0.6)), 42); },
      end() { runner.removeFromParent(); } },
    { dur: 1.6, setup() { flash(ESC.set.localToWorld(V3(0.6, 0.6, 0.2)), 7, 6, '#ffb070'); },
      update(t) { const D0 = ESC.driver, P0 = D0.userData.P; D0.updateMatrixWorld(true);
        const sh = P0.torso.localToWorld(V3(0.21, 0.3, 0.15)), hipR = P0.hip.localToWorld(V3(-0.24, -0.12, 0.2)), out = P0.torso.localToWorld(V3(0.55, 0.0, 0.3));
        const k = clamp((t - 0.15) / 0.8, 0, 1), e = 1 - (1 - k) * (1 - k); const end = out.clone().lerp(hipR, e);
        P0.armL.rotation.x = -0.5 - Math.sin(e * Math.PI) * 0.9; P0.armL.rotation.z = -0.4 * e;
        const a0 = ESC.set.worldToLocal(sh.clone()), a1 = ESC.set.worldToLocal(end.clone()); const d = a1.clone().sub(a0);
        ESC.strap.position.copy(a0); ESC.strap.scale.set(1, d.length(), 1); ESC.strap.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize());
        if (k >= 1 && !this.c) { this.c = 1; sfx.click(); }
        cineCam(D0.localToWorld(V3(-0.7, 1.95, 2.3)), D0.localToWorld(V3(0.05, 1.3, 0)), 38); } },
    { dur: 1.9, update(t) { const k = clamp((t - 0.45) / 0.25, 0, 1); ESC.key.rotation.z = -k * 1.1; if (k > 0 && !this.cr) { this.cr = 1; sfx.crank(0.6); } if (t > 1.05 && !this.r) { this.r = 1; sfx.roar(); shake(0.3); }
        ESC.gaugeM.emissiveIntensity = t > 0.7 ? 1.4 : 0; ESC.needles.forEach((n, i) => (n.rotation.z = 1.2 - (t > 1.05 ? Math.min(1, (t - 1.05) * 3) * (1.6 + i * 0.3) : 0)));
        cineCam(ESC.set.localToWorld(V3(0.62, 0.15, 1.05)), ESC.set.localToWorld(V3(0.1, -0.1, 0.35)), 34); } },
    { dur: 1.1, setup() { player.cineInp = (t) => ({ throttle: t > 0.25 ? 1 : 0, nitro: t > 0.25 }); },
      update(t) { const ex = player.root.localToWorld(V3(0.4, 0.9, -player.box.hz - 0.2)); for (let k = 0; k < 4; k++) emit(PS_ADD, ex, V3(rnd(-1, 1), rnd(0, 2), rnd(-1, 1)).addScaledVector(player.fwd, -10), 0.3, 1.2, 0.3, COL.fire, 1, COL.fire2, 0);
        cineCam(player.root.localToWorld(V3(2.4, 0.5, -player.box.hz - 2.6)), player.root.localToWorld(V3(0.4, 0.6, -0.5)), 50); if (t < 0.05) music.sting(); } },
    { dur: 1.7, setup() { player.cineInp = () => ({ throttle: 1, nitro: true }); for (const e of chasers) { e.cineInp = () => ({ throttle: 1 }); e.maxSpeed = e.baseMax0; } },
      update(t) { const c = player.root.position; const cz = z0 + 46, cxx = pathX(cz) - 7; cineCam(V3(cxx, escGrid(cxx, cz) + 1.4, cz), c.clone().add(V3(0, 1.0, 0)), 48); } },
  ];
  runCine(shots, () => {
    player.cineInp = null; for (const e of chasers) { e.cineInp = null; e.ai.dummy = false; e.maxSpeed = e.baseMax0; e.baseMax = e.maxSpeed; } 
    runner.removeFromParent(); game.state = 'combat'; camPos.copy(camera.position);
    toast('Chapter 1', 'ESCAPE. REACH THE BRIDGE'); ESC.wi = 1;
  });
  shots.forEach((s) => (s.skip = null));
}
function endingCine() {
  ESC.ending = true; const P = player; const zb = (ESC.BZ0 + ESC.BZ1) / 2, bx = pathX(zb);
  for (const v of vehicles) if (!v.isPlayer && v.alive && v.pos.z > ESC.BZ1) v.destroy(null);
  const chasers = [];
  const spawnChasers = () => { for (let i = 0; i < 3; i++) { const z = ESC.BZ0 + 25 + i * 26, x = pathX(z) + (i - 1) * 2.5; const t = ['raider', 'juggernaut', 'scrapper'][i]; const e = new Vehicle(t, { type: t, weapon: 'cannon', ram: 'spike', armor: 'heavy' }, false, ENEMY_PAINT[i]); e.place(x, z, roadH(z)); const f = e.fwd; e.vel.set(f.x * 15, 0, f.z * 15); e.ai = { dummy: true, mode: 'ram', stuck: 0, rev: 0, burst: 9, orbit: 1, skill: 0.5 }; e.cineInp = () => ({ throttle: 0.5 }); vehicles.push(e); chasers.push(e); } };
  const h0 = P.h; let baz = null;
  const shots = [
    { dur: 2.4, setup() { P.cineInp = (t) => ({ brake: 1, handbrake: true, steer: t < 0.9 ? 1 : 0 }); },
      update(t) { const k = clamp(t / 1.4, 0, 1); P.h = h0 + k * k * Math.PI * 0.95; P.vel.multiplyScalar(Math.exp(-1.8 * 1 / 60));
        cineCam(V3(pathX(ESC.BZ1 + 50) - 26, ESC.deckY + 5, ESC.BZ1 + 40), V3(bx, ESC.deckY + 1, zb + 30), 50); } },
    { dur: 2.3, setup() { spawnChasers(); P.cineInp = () => ({ brake: 1 }); baz = P.guns.baz || (P.guns.baz = P.makeGun('rockets')); P.setActive('baz'); },
      update(t) { const aim = V3(bx, ESC.deckY + 1, zb); P.aimAt(aim, 1 / 30, 4);
        if (t > 1.0 && !this.f) { this.f = 1; const p = P.wGun.localToWorld(V3(0, 0.12, -1.2)); const d = aim.clone().sub(p).normalize(); fireRocket(p, d, P, null); rockets[rockets.length - 1].v.setLength(110); rockets[rockets.length - 1].bridge = true; sfx.rocket(0); shake(0.2); }
        const back = P.wGun.localToWorld(V3(0.9, 0.9, 3.2)); cineCam(back, aim, 44); } },
    { dur: 4.2, setup() { game.slow = 1.6; },
      update(t) { cineCam(V3(bx + 62, ESC.deckY + 5, zb + 46), V3(bx, ESC.deckY - 3 - t * 1.5, zb - 6), 52); } },
    { dur: 4.0, setup() { music.set({ pad: 0.5, tension: 0, battle: 0, melody: 0 }); caption(null); },
      update(t) { ESC.lump.scale.set(1, 1 + Math.sin(t * 3.2) * 0.04, 1); ESC.lump.rotation.z = t > 2.0 ? Math.sin((t - 2) * 9) * 0.06 * Math.max(0, 1 - (t - 2) * 0.7) : 0;
        if (t > 2.0 && !this.w) { this.w = 1; sfx.whimper(); } if (t > 2.3 && !this.cap) { this.cap = 1; caption('THE BACK SEAT', 'Something under the blanket is breathing.', true); }
        cineCam(ESC.set.localToWorld(V3(-0.7, 0.35, 1.2)), ESC.set.localToWorld(V3(-2.1, -0.5, 2.6)), 38); flash(ESC.set.localToWorld(V3(-1.2, 0.5, 1.8)), 12, 0.2, '#8aa0ff'); } },
  ];
  CINE.skippable = false;
  runCine(shots, () => {
    CINE.skippable = true; game.state = 'done'; const m = Math.floor(ESC.runT / 60), s = Math.floor(ESC.runT % 60);
    showBanner('ESCAPED', `Chapter 1 complete in ${m}:${String(s).padStart(2, '0')}. ${game.kills} raider${game.kills === 1 ? '' : 's'} wrecked. To be continued.`, { bretry: 'PLAY AGAIN', bgarage: 'BACK TO THE YARD' });
  });
}

// ============================================================ ONLINE CO-OP: two Xboxes, one rig. Host drives and runs the game, guest is on the gun.
const NET = { role: null, code: '', client: null, peer: false, in: { yaw: 0, pitch: 0.05, fire: 0, press: 0, swap: 0, reel: 0 }, seenPress: 0, seenSwap: 0, lastIn: 0, lastSnap: 0, snap: null, ev: [], nid: 0, ents: new Map(), my: { yaw: 0, pitch: 0.05, press: 0, swap: 0 }, sendT: 0, helloT: 0, applying: false, seed: 1 };
const BROKERS = ['wss://broker.emqx.io:8084/mqtt', 'wss://broker.hivemq.com:8884/mqtt', 'wss://test.mosquitto.org:8081/mqtt'];
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const r2 = (x) => Math.round(x * 100) / 100, r3 = (x) => Math.round(x * 1000) / 1000;
async function netConnect() {
  const qs = new URLSearchParams(location.search); const list = qs.get('broker') ? [qs.get('broker')] : BROKERS;
  const mqtt = (await import(window.SK_MQTT || 'https://cdn.jsdelivr.net/npm/mqtt@5.16.0/dist/mqtt.esm.js')).default;
  for (const url of list) {
    netStatus('Connecting to the relay...');
    try {
      return await new Promise((res, rej) => {
        const c = mqtt.connect(url, { clientId: 'sk_' + Math.random().toString(36).slice(2, 10), clean: true, connectTimeout: 6000, reconnectPeriod: 2000, keepalive: 20 });
        const t = setTimeout(() => { c.end(true); rej(new Error('timeout')); }, 7000);
        c.once('connect', () => { clearTimeout(t); res(c); }); c.once('error', (e) => { clearTimeout(t); c.end(true); rej(e); });
      });
    } catch (e) { console.warn('relay failed', url, e && e.message); }
  }
  throw new Error('Could not reach the online relay from this page.');
}
const ntopic = (dir) => `wreckline/sk1/${NET.code}/${dir}`;
function netSend(dir, obj) { if (NET.client && NET.client.connected) NET.client.publish(ntopic(dir), JSON.stringify(obj), { qos: 0 }); }
function netStatus(s) { const e = $('nstat'); if (e) e.textContent = s; }
function netEv(...a) { if (NET.role === 'host' && NET.peer) NET.ev.push(a); }
function netLeave() { if (NET.client) { try { NET.client.end(true); } catch (e) {} } Object.assign(NET, { role: null, client: null, peer: false, code: '' }); NET.ents.clear(); p2.on = false; }

// ---------------- lobby
let netUI = { mode: 'choose', slot: 0, letters: [0, 0, 0, 0] };
function openNet() { netLeave(); game.state = 'net'; netUI = { mode: 'choose', slot: 0, letters: [0, 0, 0, 0] }; $('net').hidden = false; drawNet(); }
function closeNet() { netLeave(); $('net').hidden = true; game.state = 'garage'; }
function drawNet() {
  $('nchoose').hidden = netUI.mode !== 'choose'; $('nhost').hidden = netUI.mode !== 'hosting'; $('njoin').hidden = netUI.mode !== 'joining';
  if (netUI.mode === 'hosting') $('ncode').textContent = NET.code || '....';
  if (netUI.mode === 'joining') { const box = $('nslots'); box.innerHTML = ''; netUI.letters.forEach((l, i) => { const d = document.createElement('div'); d.className = 'nslot' + (i === netUI.slot ? ' sel' : ''); d.textContent = CODE_ABC[l]; box.append(d); }); }
}
async function hostNet() {
  netUI.mode = 'hosting'; NET.role = 'host'; NET.code = Array.from({ length: 4 }, () => CODE_ABC[(Math.random() * CODE_ABC.length) | 0]).join(''); drawNet();
  try {
    NET.client = await netConnect();
    NET.client.subscribe(ntopic('g2h'));
    NET.client.on('message', (tp, buf) => { let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; } hostMsg(m); });
    netStatus('Waiting for player 2. Tell them this code.');
  } catch (e) { netStatus(e.message); }
}
async function joinNet() {
  NET.role = 'guest'; NET.code = netUI.letters.map((l) => CODE_ABC[l]).join('');
  try {
    NET.client = await netConnect();
    NET.client.subscribe(ntopic('h2g'));
    NET.client.on('message', (tp, buf) => { let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; } guestMsg(m); });
    netStatus('Looking for the host with code ' + NET.code + '...'); NET.helloT = 0; NET.lastSnap = performance.now();
  } catch (e) { netStatus(e.message); NET.role = null; }
}
function netLobbyInput(P) {
  const p0 = P[0] || null; const pr = (k) => p0 && p0.pressed(k);
  if (netUI.mode === 'choose') {
    if (pr('A') || kPressed.has('KeyH')) hostNet();
    else if (pr('X') || kPressed.has('KeyJ')) { netUI.mode = 'joining'; drawNet(); }
    else if (pr('B') || kPressed.has('Escape')) closeNet();
  } else if (netUI.mode === 'joining') {
    if (pr('LEFT') || kPressed.has('ArrowLeft')) netUI.slot = (netUI.slot + 3) % 4;
    if (pr('RIGHT') || kPressed.has('ArrowRight')) netUI.slot = (netUI.slot + 1) % 4;
    if (pr('UP') || kPressed.has('ArrowUp')) netUI.letters[netUI.slot] = (netUI.letters[netUI.slot] + 1) % CODE_ABC.length;
    if (pr('DOWN') || kPressed.has('ArrowDown')) netUI.letters[netUI.slot] = (netUI.letters[netUI.slot] + CODE_ABC.length - 1) % CODE_ABC.length;
    for (const k of kPressed) if (/^Key[A-Z]$/.test(k)) { const i = CODE_ABC.indexOf(k[3]); if (i >= 0) { netUI.letters[netUI.slot] = i; netUI.slot = Math.min(3, netUI.slot + 1); } }
    if ((pr('A') || kPressed.has('Enter')) && !NET.client) joinNet();
    if (pr('B') || kPressed.has('Escape')) { netLeave(); netUI.mode = 'choose'; netStatus(''); }
    drawNet();
    if (NET.role === 'guest' && NET.client && performance.now() - NET.helloT > 1000) { NET.helloT = performance.now(); netSend('g2h', { t: 'hello' }); }
  } else if (netUI.mode === 'hosting') {
    if (pr('B') || kPressed.has('Escape')) { netLeave(); netUI.mode = 'choose'; netStatus(''); drawNet(); }
  }
}

// ---------------- host side
function hostMsg(m) {
  if (m.t === 'hello') {
    if (!NET.peer && game.state === 'net') { NET.peer = true; NET.lastIn = performance.now(); $('net').hidden = true; NET.seed = (Math.random() * 1e9) | 0; startCombat(load.mode); toast('Online co-op', 'PLAYER 2 IS ON THE GUN'); }
    if (NET.peer) netSend('h2g', { t: 'start', mode: game.mode, seed: NET.seed, load: { ...load } });
  } else if (m.t === 'in') { NET.in = m; NET.lastIn = performance.now(); }
  else if (m.t === 'bye') { NET.peer = false; p2.on = false; toast('Online co-op', 'PLAYER 2 LEFT'); }
}
function vehMask(v) { let pm = 0; v.pieces.forEach((p, i) => { if (p.attached) pm |= 1 << i; }); let wm = 0; v.wheels.forEach((w, i) => { if (w.parent === v.model) wm |= 1 << i; }); return [pm, wm]; }
function hostSnap(dt) {
  if (NET.role !== 'host' || !NET.peer) return;
  if (performance.now() - NET.lastIn > 15000) { NET.peer = false; p2.on = false; toast('Online co-op', 'PLAYER 2 DISCONNECTED'); return; }
  NET.sendT -= dt; if (NET.sendT > 0) return; NET.sendT = 1 / 15;
  const veh = [];
  for (const v of vehicles) {
    if (!v.root.parent) continue; if (!v.nid) v.nid = ++NET.nid;
    const [pm, wm] = vehMask(v); const H = v.harp; const he = H.state === 'hooked' && H.end ? [r2(H.end.x), r2(H.end.y), r2(H.end.z)] : H.state === 'flying' && H.p ? [r2(H.p.x), r2(H.p.y), r2(H.p.z)] : 0;
    veh.push([v.nid, v.type, v.isPlayer ? 1 : 0, v.paintIdx, v.load.weapon, v.load.ram, v.load.armor, r2(v.pos.x), r2(v.y), r2(v.pos.z), r3(v.h), r3(v.wYaw), r3(v.wPitch), v.active === 'harpoon' ? 1 : v.active === 'baz' ? 2 : 0,
      v.alive ? 1 : 0, Math.round(v.hp), Math.round(v.hpMax), pm, wm, (v.drifting ? 1 : 0) | (v.nitOn ? 2 : 0) | (v.flaming ? 4 : 0) | (v.burn > 0 ? 8 : 0), Math.round(v.speed || 0), he, r3(v.pitch), r3(v.roll)]);
  }
  const P = player;
  const hud = P ? [Math.round(P.nitro), Math.round(P.heat), Math.round(P.fuel), r2(P.rkReload), P.overheat ? 1 : 0, P.fuelOut ? 1 : 0, H2(P.harp)] : 0;
  const msg = { t: 'snap', st: game.state, mode: game.mode, wave: game.wave, kills: game.kills, scrap: game.scrap, cp: ESC.cp, rt: r2(ESC.runT || 0), veh, hud, ev: NET.ev.splice(0), gan: WORLD.mode === 'port' ? ganNet() : null };
  if (game.state === 'cine' || CINE.on) msg.cam = [r2(camera.position.x), r2(camera.position.y), r2(camera.position.z), r3(camera.quaternion.x), r3(camera.quaternion.y), r3(camera.quaternion.z), r3(camera.quaternion.w), Math.round(camera.fov)];
  if (game.state === 'over' || game.state === 'done' || game.state === 'paused') msg.ban = [$('btitle').textContent, $('btext').textContent];
  netSend('h2g', msg);
}
function H2(H) { return [H.state === 'ready' ? 0 : H.state === 'reload' ? 1 : H.state === 'hooked' ? 2 : 3, r2(H.t || 0), Math.round(H.rip || 0)]; }

// ---------------- guest side
function guestMsg(m) {
  if (m.t === 'start') { if (!NET.started) guestStart(m); }
  else if (m.t === 'snap') { NET.snap = m; NET.lastSnap = performance.now(); if (!NET.started) return; for (const e of m.ev) guestEvent(e); if (m.gan) ganApply(m.gan); }
}
function guestStart(m) {
  NET.started = true; NET.lastSnap = performance.now(); $('net').hidden = true; Object.assign(load, m.load); NET.seed = m.seed;
  clearTutorial(); clearWorld(); if (garageRig) { garageRig.root.removeFromParent(); garageRig = null; }
  if (m.mode === 'escape') { leavePortWorld(); enterEscapeWorld(m.seed); resetBridge(); } else { leaveEscapeWorld(); if (m.load && m.load.map === 'port') { enterPortWorld(); placePortProps(); } else { leavePortWorld(); placeProps(m.seed); } }
  for (const v of NET.ents.values()) v.root.removeFromParent(); NET.ents.clear(); player = null;
  $('garage').hidden = true; $('gkeys').hidden = true; $('banner').style.display = 'none'; $('combat').style.display = 'block'; document.body.classList.add('incombat');
  game.mode = m.mode; game.state = 'netguest'; NET.my.yaw = 0; NET.my.pitch = 0.05; sfx.init(); music.start(); toast('Online co-op', 'YOU ARE ON THE GUN');
}
function guestEvent(e) {
  NET.applying = true;
  try {
    const k = e[0];
    if (k === 'b') fireBullet(V3(e[1], e[2], e[3]), V3(e[4], e[5], e[6]), { isPlayer: !!e[7], team: 'net', mods: { gun: 1 } }, 0);
    else if (k === 'r') { const o = NET.ents.get(e[7]); fireRocket(V3(e[1], e[2], e[3]), V3(e[4], e[5], e[6]), o || { isPlayer: false, team: 'net', mods: { gun: 1 } }, null); }
    else if (k === 'x') explosion(V3(e[1], e[2], e[3]), e[4]);
    else if (k === 'D') ganGuestDrop(e[1], e[2], e[3]);
    else if (k === 't') toast(e[1], e[2], !!e[3]);
    else if (k === 'L') strike(V3(e[1], e[2], e[3]), null);
    else if (k === 'B') collapseBridge(V3(e[1], e[2], e[3]));
    else if (k === 'P') { const pr = props[e[1]]; if (pr) breakProp(pr, null, V3(e[2], 0, e[3])); }
    else if (k === 'c') caption(e[1], e[2], !!e[3]);
    else if (k === 's') music.sting();
  } finally { NET.applying = false; }
}
function guestEnt(row) {
  const [id, type, isP, pi, wpn, ram, armor] = row;
  let v = NET.ents.get(id);
  if (!v) {
    v = new Vehicle(type, { type, weapon: wpn, ram, armor }, !!isP, pi >= 0 ? ENEMY_PAINT[pi] : null); v.nid = id;
    v.place(row[7], row[9], row[10]); v.y = row[8]; NET.ents.set(id, v); vehicles.push(v);
    v.ai = isP ? null : { mode: 'net' };
  }
  return v;
}
function guestStep(dt, P) {
  if (performance.now() - NET.lastSnap > 15000) { toast('Online co-op', 'LOST THE HOST'); netLeave(); enterGarage(); return; }
  const S = NET.snap; if (!S) return;
  // input: gunner aim with the right stick, RB fire, LB reel, D-pad swap
  const p0 = P[0] || null; const inv = SET.invert ? -1 : 1;
  if (p0) { NET.my.yaw -= p0.rx * inv * 2.4 * dt; NET.my.pitch = clamp(NET.my.pitch - p0.ry * inv * 1.2 * dt, -0.2, 0.45); }
  if (keys.has('KeyQ')) NET.my.yaw += 2 * dt; if (keys.has('KeyE')) NET.my.yaw -= 2 * dt; NET.my.yaw -= mouseDX * 0.004; mouseDX = 0;
  if (keys.has('KeyR')) NET.my.pitch = Math.min(0.45, NET.my.pitch + dt); if (keys.has('KeyV')) NET.my.pitch = Math.max(-0.2, NET.my.pitch - dt);
  const fire = (p0 && (p0.RB > 0.5 || p0.RT > 0.5)) || keys.has('KeyJ') || mouseDown;
  if ((p0 && (p0.pressed('RB') || p0.pressed('RT'))) || kPressed.has('KeyJ') || (mouseDown && !guestStep.md)) NET.my.press++; guestStep.md = mouseDown;
  if ((p0 && ['UP', 'DOWN', 'LEFT', 'RIGHT'].some((k) => p0.pressed(k))) || kPressed.has('KeyF') || kPressed.has('Tab')) NET.my.swap++;
  const reel = (p0 && p0.LB > 0.5) || keys.has('KeyK');
  if ((p0 && p0.pressed('MENU')) || kPressed.has('Escape')) { netSend('g2h', { t: 'bye' }); netLeave(); enterGarage(); return; }
  NET.sendT -= dt; if (NET.sendT <= 0) { NET.sendT = 1 / 20; netSend('g2h', { t: 'in', yaw: r3(NET.my.yaw), pitch: r3(NET.my.pitch), fire: fire ? 1 : 0, press: NET.my.press, swap: NET.my.swap, reel: reel ? 1 : 0 }); }
  // world state from the host
  game.wave = S.wave; game.kills = S.kills; game.scrap = S.scrap; game.mode = S.mode; ESC.cp = S.cp;
  const seen = new Set(); const k = 1 - Math.exp(-14 * dt);
  for (const row of S.veh) {
    const v = guestEnt(row); seen.add(row[0]);
    v.pos.x += (row[7] - v.pos.x) * k; v.pos.z += (row[9] - v.pos.z) * k; v.y += (row[8] - v.y) * k;
    v.h += wrapA(row[10] - v.h) * k; v.wYaw += wrapA(row[11] - v.wYaw) * k; v.wPitch += (row[12] - v.wPitch) * k;
    const act = row[13] === 1 ? 'harpoon' : row[13] === 2 ? 'baz' : 'primary'; if (act === 'baz' && !v.guns.baz) v.guns.baz = v.makeGun('rockets'); if (v.active !== act) v.setActive(act);
    v.wBase.rotation.y = v.wYaw; v.wGun.rotation.x = v.wPitch; v.hp = row[15]; v.hpMax = row[16]; v.speed = row[20];
    NET.applying = true;
    v.pieces.forEach((p, i) => { const on = (row[17] >> i) & 1; if (p.attached && !on) v.detachPiece(p, V3(rnd(-1, 1), 0, rnd(-1, 1)), null); else if (!p.attached && on) reattach(v, p); });
    v.wheels.forEach((w, i) => { const on = (row[18] >> i) & 1; if (!on && w.parent === v.model) { scene.attach(w); spawnDebris(w, V3(rnd(-8, 8), 8, rnd(-8, 8)), { kind: 'netwheel' }); v.wheelsLost++; } });
    if (v.alive && !row[14]) v.destroy(null);
    NET.applying = false;
    const fl = row[19]; v.drifting = !!(fl & 1); v.nitOn = !!(fl & 2); if (fl & 8) v.burn = Math.max(v.burn || 0, 0.3);
    if (v.alive) { v.syncTransform(dt, 0, v.speed); guestFx(v, dt, fl); } else v.syncTransform(dt);
    // harpoon cable
    const he = row[21];
    if (he) { const start = v.guns.harpoon.gun.localToWorld(V3(0, 0.13, -1.4)); const c = v.netCable || (v.netCable = new THREE.Mesh(cableGeo, cableMat)); if (!c.parent) scene.add(c); c.position.copy(start); c.lookAt(he[0], he[1], he[2]); c.scale.set(1, 1, start.distanceTo(V3(he[0], he[1], he[2]))); if (v.bolt) v.bolt.visible = false; }
    else if (v.netCable && v.netCable.parent) { v.netCable.removeFromParent(); if (v.bolt) v.bolt.visible = true; }
    if (row[2]) {
      if (player !== v) { player = v; buildPips(); $('ramlbl').textContent = RAMS[v.load.ram].name + ' · ' + ARMORS[v.load.armor].name; }
      player = v; const h = S.hud; if (h) { v.nitro = h[0]; v.heat = h[1]; v.fuel = h[2]; v.rkReload = h[3]; v.overheat = !!h[4]; v.fuelOut = !!h[5]; v.harp.state = ['ready', 'reload', 'hooked', 'flying'][h[6][0]]; v.harp.t = h[6][1]; v.harp.rip = h[6][2]; }
    }
  }
  for (const [id, v] of NET.ents) if (!seen.has(id)) { if (v.netCable) v.netCable.removeFromParent(); removeVehicle(v); NET.ents.delete(id); }
  updateBullets(dt); updateRockets(dt); updateDebris(dt);
  if (game.mode === 'escape') { ESC.runT = S.rt; ESC.sky.position.copy(camera.position); for (const c of ESC.chunks) c.visible = Math.abs(c.userData.zc - camera.position.z) < 560; updateLightning(dt); updateTornados(dt, ESC.runT); updateBridge(dt); }
  // camera: host's camera during cutscenes, otherwise the gunner's view
  document.body.classList.toggle('cine', !!S.cam);
  if (S.cam) { camera.position.set(S.cam[0], S.cam[1], S.cam[2]); camera.quaternion.set(S.cam[3], S.cam[4], S.cam[5], S.cam[6]); camera.fov = S.cam[7]; camera.updateProjectionMatrix(); }
  else if (player) {
    const yaw = player.h + NET.my.yaw; camYawWorld = yaw; camYaw = NET.my.yaw;
    const c = player.cfg; const back = c.cam[0] * 0.85, up = c.cam[1] * 0.9;
    const tgt = player.root.position.clone().add(V3(-Math.sin(yaw) * back, up, -Math.cos(yaw) * back)); tgt.y = Math.max(tgt.y, height(tgt.x, tgt.z) + 1.2);
    camPos.lerp(tgt, 1 - Math.exp(-9 * dt)); camera.position.copy(camPos);
    const look = player.root.position.clone().add(V3(Math.sin(yaw) * 20, c.hy * 0.6 + Math.tan(NET.my.pitch) * 20, Math.cos(yaw) * 20)); camera.lookAt(look);
    trauma = Math.max(0, trauma - dt * 1.4); const s = trauma * trauma, t = game.t * 40; camera.position.add(V3(Math.sin(t * 1.1) * s * 0.5, Math.sin(t * 1.7) * s * 0.4, Math.cos(t * 1.3) * s * 0.5));
    camera.fov = 60; camera.updateProjectionMatrix();
    drawHUD(dt);
    const ap = player.root.position.clone().add(V3(Math.sin(yaw) * 60, 2 + Math.tan(NET.my.pitch) * 60, Math.cos(yaw) * 60)).project(camera);
    reticle.style.display = ap.z < 1 ? 'block' : 'none'; reticle.style.left = ((ap.x + 1) / 2 * innerWidth) + 'px'; reticle.style.top = ((1 - ap.y) / 2 * innerHeight) + 'px';
    $('p2').textContent = 'ONLINE · YOU ARE ON THE GUN · CODE ' + NET.code;
    const hb = $('heat') && document.querySelector('#heat i'); if (hb) {}
    $('wname').textContent = WEAPONS[player.wk] ? WEAPONS[player.wk].name : '';
  }
  // host banners (paused, wrecked, escaped)
  if (S.ban) { $('btitle').textContent = S.ban[0]; $('btext').textContent = S.st === 'paused' ? 'The host paused the game.' : S.ban[1]; for (const id of ['bretry', 'bskip', 'bsettings']) $(id).hidden = true; $('bgarage').hidden = false; $('bgarage').textContent = 'LEAVE'; $('banner').style.display = 'grid'; }
  else if (game.state === 'netguest') $('banner').style.display = 'none';
  if (S.st === 'upgrade' && !guestStep.up) { guestStep.up = 1; toast('Wave cleared', 'THE DRIVER IS PICKING AN UPGRADE'); } if (S.st !== 'upgrade') guestStep.up = 0;
}
function guestFx(v, dt, fl) {
  const fast = Math.abs(v.speed) > 6;
  if (fast && Math.random() < 0.6) for (const s of [-1, 1]) { const p = v.root.localToWorld(tmpV2.set(s * v.box.hx * 0.8, 0.25, -v.box.hz * 0.55)).clone(); emit(PS_NORM, p, V3(rnd(-1, 1), rnd(0.8, 2.2), rnd(-1, 1)), rnd(1.0, 2.0), rnd(0.8, 1.3), rnd(3.5, 6), COL.dust, 0.32, COL.dust2, 0, -0.3, 1.2); }
  if (v.drifting) for (const s of [-1, 1]) { const p = v.root.localToWorld(tmpV2.set(s * v.box.hx * 0.85, 0.35, -v.box.hz * 0.6)).clone(); emit(PS_NORM, p, V3(rnd(-1.5, 1.5), rnd(1, 2.5), rnd(-1.5, 1.5)), rnd(1.4, 2.4), 1.2, rnd(6, 9), COL.dust2, 0.42, COL.smoke2, 0, -0.4, 1.4); }
  if (v.nitOn) nitroFlames(v, null);
  if ((fl & 4) && v.wk === 'flamer') { const p = v.muzzlePos(), d = v.gunDir(); for (let k = 0; k < 5; k++) emit(PS_ADD, p.clone().addScaledVector(d, rnd(0, 0.5)), d.clone().multiplyScalar(rnd(24, 32)).add(V3(rnd(-2.2, 2.2), rnd(-1, 2), rnd(-2.2, 2.2))), rnd(0.42, 0.62), rnd(0.3, 0.6), rnd(2.6, 4.2), k % 3 ? COL.fire : COL.flameCore, 1, COL.fire2, 0, -5, 1.8); }
  for (const b of v.blades) b.rotation.y += 30 * dt;
  if (v.isPlayer && Math.random() < 0.02) sfx.engine(clamp(Math.abs(v.speed) / v.maxSpeed, 0, 1.3), true);
}
function withSeed(seed, fn) { const r = Math.random; let a = seed >>> 0; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; try { return fn(); } finally { Math.random = r; } }

// ============================================================ training mode
const TUT = { i: 0, t: 0, doneT: 0, data: {}, steps: [], markers: [], dummy: null, shooter: null };
const beamGeo = new THREE.CylinderGeometry(1.1, 1.1, 60, 16, 1, true); beamGeo.translate(0, 30, 0);
const beamMat = new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, blending: THREE.AdditiveBlending });
const postMat = new THREE.MeshStandardMaterial({ color: '#2a2420', roughness: 0.6, metalness: 0.6 });
const flagMat = new THREE.MeshStandardMaterial({ color: '#e0762c', roughness: 0.8, side: THREE.DoubleSide, emissive: '#6a2a08' });
function makeGate(x, z, h) {
  const g = new THREE.Group(); g.position.set(x, height(x, z), z); g.rotation.y = h;
  for (const s of [-1, 1]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 6, 10), postMat); post.position.set(s * 6, 3, 0); post.castShadow = true; g.add(post);
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), flagMat); flag.position.set(s * 6 + s * 0.9, 5.3, 0); g.add(flag);
  }
  const banner = new THREE.Mesh(new THREE.BoxGeometry(12.4, 0.5, 0.1), flagMat); banner.position.set(0, 5.8, 0); g.add(banner);
  const beam = new THREE.Mesh(beamGeo, beamMat); beam.scale.set(3.5, 1, 3.5); g.add(beam); g.userData.beam = beam;
  scene.add(g); return g;
}
function makeBeacon(v) { const b = new THREE.Mesh(beamGeo, beamMat); scene.add(b); b.userData.follow = v; return b; }
function clearTutorial() {
  for (const m of TUT.markers) m.removeFromParent();
  TUT.markers.length = 0; TUT.dummy = null; TUT.shooter = null;
  $('tut').hidden = true; document.body.classList.remove('training');
}
function spawnDummy(dist, side, opts = {}) {
  const f = V3(Math.sin(player.h), 0, Math.cos(player.h)), r = V3(-Math.cos(player.h), 0, Math.sin(player.h));
  let p = player.pos.clone().addScaledVector(f, dist).addScaledVector(r, side);
  const rr = Math.hypot(p.x, p.z); if (rr > ARENA - 15) p.multiplyScalar((ARENA - 15) / rr);
  const e = new Vehicle(opts.type || 'raider', { type: opts.type || 'raider', weapon: 'cannon', ram: 'spike', armor: opts.armor || 'heavy' }, false, ENEMY_PAINT[opts.paint || 0]);
  e.place(p.x, p.z, player.h + Math.PI / 2);
  e.ai = { dummy: true, shooter: !!opts.shooter, burst: 1, skill: 0.6, stuck: 0, rev: 0, orbit: 1, mode: 'ram' };
  e.minHp = opts.minHp || 0;
  vehicles.push(e);
  const b = makeBeacon(e); TUT.markers.push(b);
  return e;
}
function removeVehicle(v) { if (!v) return; v.root.removeFromParent(); const i = vehicles.indexOf(v); if (i >= 0) vehicles.splice(i, 1); }
function tutSteps() {
  const mph = () => Math.abs(player.speed || 0) * 2.237;
  const S = [
    { title: 'GAS', text: 'Hold the right trigger to drive forward. Get up to 30 mph.', pads: ['RT'], kb: 'W', prog: () => mph() / 30, check: () => mph() >= 30 },
    { title: 'STEER', text: 'Push the left stick left or right to steer. Drive through all 3 flag gates. Follow the orange light.', pads: ['LS', 'RT'], kb: 'A and D',
      setup() {
        const f = V3(Math.sin(player.h), 0, Math.cos(player.h)), r = V3(-Math.cos(player.h), 0, Math.sin(player.h));
        TUT.data.gates = [[55, 16], [105, -18], [150, 12]].map(([d, s]) => { let p = player.pos.clone().addScaledVector(f, d).addScaledVector(r, s); const rr = Math.hypot(p.x, p.z); if (rr > ARENA - 20) p.multiplyScalar((ARENA - 20) / rr); const g = makeGate(p.x, p.z, player.h); TUT.markers.push(g); return g; });
        TUT.data.gi = 0;
      },
      prog: () => TUT.data.gi / 3,
      tick() { const G = TUT.data.gates; G.forEach((g, i) => { g.userData.beam.visible = i === TUT.data.gi; g.visible = i >= TUT.data.gi; }); const g = G[TUT.data.gi]; if (g && player.pos.distanceTo(tmpV.set(g.position.x, 0, g.position.z)) < 8) { TUT.data.gi++; sfx.pickup(); } },
      check: () => TUT.data.gi >= 3 },
    { title: 'BRAKE AND REVERSE', text: 'Hold the left trigger to brake. Keep holding it to back up. Reverse for 2 seconds.', pads: ['LT'], kb: 'S', prog: () => (TUT.data.rev || 0) / 2,
      tick(dt) { if ((player.speed || 0) < -1.5) TUT.data.rev = (TUT.data.rev || 0) + dt; }, check: () => TUT.data.rev >= 2 },
    { title: 'DRIFT', text: 'Get some speed, then hold B (or X) and steer. The back end swings out and you keep your speed. Steer the other way to hold the slide. Drifting refills your nitro. Slide for 2 seconds.', pads: ['B', 'X', 'LS'], kb: 'Space', prog: () => (TUT.data.dr || 0) / 2,
      tick(dt) { if (player.drifting) TUT.data.dr = (TUT.data.dr || 0) + dt; }, check: () => TUT.data.dr >= 2 },
    { title: 'NITRO', text: 'Hold A for a big speed boost. The flame bar in the bottom left is your nitro tank. It refills on its own, and faster while you drift. Boost for 2 seconds.', pads: ['A'], kb: 'Shift', prog: () => (TUT.data.n || 0) / 2,
      tick(dt, inp) { if (inp.nitro && player.nitro > 1 && !player.air) TUT.data.n = (TUT.data.n || 0) + dt; }, check: () => TUT.data.n >= 2 },
    { title: 'LOOK AND AIM', text: 'Move the right stick to swing the camera. Your gunner aims wherever the camera looks. Look all the way left, then all the way right.', pads: ['RS'], kb: 'Q and E, or the mouse', prog: () => ((TUT.data.l ? 1 : 0) + (TUT.data.r ? 1 : 0)) / 2,
      tick() { if (camYaw > 0.9) TUT.data.l = 1; if (camYaw < -0.9) TUT.data.r = 1; }, check: () => TUT.data.l && TUT.data.r },
    { title: 'RAM', text: 'A target rig is parked ahead under the orange light. Build up speed and hit it head-on. Your front ram does the damage.', pads: ['RT', 'A'], kb: 'W, Shift for nitro',
      setup() { TUT.dummy = spawnDummy(60, 0, { minHp: 60 }); }, check: () => TUT.dummy && TUT.dummy.rammedByPlayer },
  ];
  const dummy = () => { if (!TUT.dummy || !TUT.dummy.alive) TUT.dummy = spawnDummy(35, 0, { minHp: 60 }); };
  if (load.weapon === 'flamer') {
    S.push({ title: 'FLAME IT', text: 'Get close to the target. Hold RB to hose it with fire. It keeps burning after you stop. The bar in the bottom right is your fuel. It refills when you are not firing.', pads: ['RB', 'RS'], kb: 'Hold the mouse button or J',
      setup() { dummy(); TUT.data.f0 = TUT.dummy.dmgTaken || 0; }, prog: () => ((TUT.dummy.dmgTaken || 0) - TUT.data.f0) / 45, check: () => TUT.dummy && (TUT.dummy.dmgTaken || 0) - TUT.data.f0 >= 45 });
  } else if (load.weapon === 'rockets') {
    S.push({ title: 'FIRE ROCKETS', text: 'Point the camera at the target. The ring turns red when it locks on and the rocket steers toward it. Tap RB to fire. The launcher reloads after every shot. Blow a plate off.', pads: ['RB', 'RS'], kb: 'Click or J',
      setup: dummy, check: () => TUT.dummy && (TUT.dummy.lostToPlayer || 0) >= 1 });
  } else {
    S.push({ title: 'FIRE', text: 'Point the camera at the target. The ring turns red when it locks on. Hold RB to fire. Fire in bursts so the cannon does not overheat. Shoot a plate off.', pads: ['RB', 'RS'], kb: 'Hold the mouse button or J',
      setup: dummy, check: () => TUT.dummy && (TUT.dummy.lostToPlayer || 0) >= 1 });
  }
  S.push({ title: 'SWITCH TO HARPOON', text: 'Every rig carries a harpoon. Press any direction on the D-pad to swap between your main gun and the harpoon.', pads: ['DPAD'], kb: 'F or Tab',
    setup: dummy, check: () => player.active === 'harpoon' });
  S.push({ title: 'HOOK IT', text: 'Point the camera at the target and tap RB to fire the harpoon.', pads: ['RB', 'RS'], kb: 'Click or J', check: () => player.harp.state === 'hooked' && player.harp.target === TUT.dummy,
    setup() { dummy(); if (player.active !== 'harpoon') swapWeapon(player); } });
  S.push({ title: 'REEL IT IN', text: 'Hold LB to winch the hooked rig toward you. Use it to drag raiders into your ram. If the cable comes loose, hook it again with RB.', pads: ['LB', 'RB'], kb: 'Hold K to reel, J to hook',
    setup() { player.harp.reeled = 0; player.harp.reelT = 0; }, prog: () => Math.max((player.harp.reeled || 0) / 6, (player.harp.reelT || 0) / 1.5), check: () => player.harp.state === 'hooked' && ((player.harp.reeled || 0) >= 6 || (player.harp.reelT || 0) >= 1.5) });
  S.push({ title: 'RIP IT OFF', text: 'Now drive away hard. Fill the red bar to tear a plate or a wheel off. Tap RB again to let go. If the cable snaps, hook it again.', pads: ['RT', 'RB'], kb: 'W to pull away, J to let go', check: () => TUT.dummy && TUT.dummy.rippedByPlayer });
  S.push({ title: 'WRECK IT', text: 'Finish it off with everything you have. Swap guns with the D-pad, shoot it, ram it, rip it.', pads: ['DPAD', 'RB', 'RT'], kb: 'F to swap, J to fire, W to ram',
    setup() { if (TUT.dummy) { TUT.dummy.minHp = 0; TUT.dummy.hp = Math.min(TUT.dummy.hp, TUT.dummy.hpMax * 0.4); } }, prog: () => TUT.dummy ? 1 - TUT.dummy.hp / TUT.dummy.hpMax : 1, check: () => !TUT.dummy || !TUT.dummy.alive });
  S.push({ title: 'SALVAGE', text: 'Wrecked rigs drop parts inside gold rings. Drive over one. Armor plates bolt onto your rig. Everything else turns into scrap and repairs.', pads: ['LS', 'RT'], kb: 'Drive over it',
    setup() { TUT.data.c0 = game.collected; if (!debris.some((d) => d.info && d.info.from !== player && d.info.kind)) spawnCrate(player.root.position.clone().addScaledVector(V3(Math.sin(player.h), 0, Math.cos(player.h)), 18), TUT.dummy); },
    check: () => game.collected > TUT.data.c0 });
  S.push({ title: 'ARMOR', text: 'A raider gun just opened fire on you. Your armor plates take the hits first, and they can get shot off. Watch the plate bar in the top left. Keep moving to dodge.', pads: ['LS', 'RT'], kb: 'Keep driving',
    setup() { TUT.shooter = spawnDummy(40, 22, { shooter: true, paint: 1, armor: 'scrap' }); TUT.shooter.ai.range = 110; TUT.shooter.ai.skill = 1.6; TUT.shooter.ai.burst = 0.4; TUT.data.d0 = player.dmgTaken || 0; },
    prog: () => ((player.dmgTaken || 0) - TUT.data.d0) / 25, check: () => (player.dmgTaken || 0) - TUT.data.d0 >= 25 || TUT.t > 15,
    done() { if (TUT.shooter) { explosion(TUT.shooter.root.position.clone().add(V3(0, 1, 0)), 0.8); TUT.shooter.alive = false; removeVehicle(TUT.shooter); TUT.shooter = null; } player.hp = player.hpMax; for (const p of player.pieces) if (p.attached) p.hp = p.max; } });
  S.push({ title: 'PLAY TOGETHER', info: true, text: 'Turn on a second controller and press A on it to jump on the gun. Player 1 drives. Player 2 aims with the right stick and fires with RB. Press Y to swap seats.', pads: ['A', 'Y'], kb: 'Enter to continue' });
  S.push({ title: 'READY', info: true, text: 'Press the Menu button any time to pause. That is everything. Press A to take on the raiders.', pads: ['MENU', 'A'], kb: 'Enter to start' });
  return S;
}
function glyph(k) {
  const lab = { MENU: '☰', VIEW: '⧉', DPAD: 'D-PAD' }[k] || k;
  return `<span class="gl gl-${k}" aria-label="${k}">${lab}</span>`;
}
function showStep() {
  const s = TUT.steps[TUT.i];
  $('tut').hidden = false; $('tut').classList.remove('ok');
  $('tutn').textContent = `Training · step ${TUT.i + 1} of ${TUT.steps.length}`;
  $('tutt').textContent = s.title; $('tutx').textContent = s.text;
  $('tutg').innerHTML = s.pads.map(glyph).join('') + (s.info ? '<span class="tuta">press ' + glyph('A') + ' to continue</span>' : '');
  $('tutk').textContent = 'Keyboard: ' + s.kb;
  $('tutp').parentElement.hidden = !s.prog; $('tutp').style.width = '0%';
  document.querySelectorAll('#padsvg .k').forEach((el) => el.classList.toggle('on', s.pads.includes(el.dataset.k)));
}
function startTutorial() {
  clearTutorial();
  TUT.i = 0; TUT.t = 0; TUT.doneT = 0; TUT.data = {}; TUT.steps = tutSteps();
  document.body.classList.add('training');
  player.minHp = player.hpMax * 0.35;
  TUT.steps[0].setup && TUT.steps[0].setup();
  showStep();
}
function tutorialStep(dt, P, inp) {
  const s = TUT.steps[TUT.i]; if (!s) return;
  for (const m of TUT.markers) if (m.userData.follow) { const v = m.userData.follow; m.visible = v.alive && vehicles.includes(v); m.position.copy(v.root.position); m.scale.set(1.5, 1, 1.5); }
  for (const d of [TUT.dummy, TUT.shooter]) if (d && d.alive) d.vel.multiplyScalar(Math.exp(-2.5 * dt));
  if (TUT.doneT > 0) {
    TUT.doneT -= dt;
    if (TUT.doneT <= 0) {
      if (s.done) s.done();
      TUT.i++; TUT.t = 0;
      if (TUT.i >= TUT.steps.length) { setTrained(); startCombat('waves'); return; }
      const n = TUT.steps[TUT.i]; if (n.setup) n.setup(); showStep();
    }
    return;
  }
  TUT.t += dt;
  if (s.tick) s.tick(dt, inp);
  if (s.prog) $('tutp').style.width = Math.round(clamp(s.prog(), 0, 1) * 100) + '%';
  const ok = s.info ? ((P[0] && P[0].pressed('A')) || kPressed.has('Enter')) : s.check();
  if (ok) {
    TUT.doneT = s.info ? 0.25 : 1.3;
    if (!s.info) { $('tut').classList.add('ok'); $('tutp').style.width = '100%'; sfx.pickup(); $('tutn').textContent = 'Nice. Step ' + (TUT.i + 1) + ' done'; }
  }
}

// ============================================================ CONTAINER PORT: engine (boxes, ramps, collisions, navigation)
const CT = { L: 12.19, W: 2.44, H: 2.59 };
const PORT = { built: false, group: new THREE.Group(), boxes: [], cells: new Map(), ramps: [], X0: -128, X1: 128, Z0: -128, Z1: 114, nav: null, lights: [] };
PORT.group.visible = false; scene.add(PORT.group);
const P_STEP = 0.9; // how far below a top a rig can be and still be "on" it
const pcell = (x, z) => ((Math.floor(x / 16) + 64) << 8) | (Math.floor(z / 16) + 64);
function portBox(x0, x1, z0, z1, y0, y1, o = {}) {
  const b = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), y0, y1, ...o };
  PORT.boxes.push(b);
  for (let i = Math.floor(b.x0 / 16); i <= Math.floor(b.x1 / 16); i++) for (let j = Math.floor(b.z0 / 16); j <= Math.floor(b.z1 / 16); j++) {
    const k = ((i + 64) << 8) | (j + 64); let L = PORT.cells.get(k); if (!L) PORT.cells.set(k, (L = [])); L.push(b);
  }
  return b;
}
const portNear = (x, z) => PORT.cells.get(pcell(x, z)) || [];
// wedge ramp: rises along axis ('x' or 'z') in direction dir (+1/-1) from h0 to h1; base = the surface it sits on
function portRamp(x0, x1, z0, z1, axis, dir, h0, h1, base = 0) { PORT.ramps.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), axis, dir, h0, h1, base }); }
function rampAt(r, x, z) {
  if (x < r.x0 || x > r.x1 || z < r.z0 || z > r.z1) return -1;
  const t = r.axis === 'x' ? (r.dir > 0 ? (x - r.x0) / (r.x1 - r.x0) : (r.x1 - x) / (r.x1 - r.x0)) : (r.dir > 0 ? (z - r.z0) / (r.z1 - r.z0) : (r.z1 - z) / (r.z1 - r.z0));
  return r.h0 + (r.h1 - r.h0) * Math.pow(t, r.curve || 1);
}
// ground under a point for something at height y (tops count only if you are up there)
function portGround(x, z, y) {
  let g = 0;
  for (const r of PORT.ramps) { if (y < r.base - P_STEP) continue; const h = rampAt(r, x, z); if (h > g) g = h; }
  for (const b of portNear(x, z)) if (!b.noTop && x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && y >= b.y1 - P_STEP && b.y1 > g) g = b.y1;
  return g;
}
const portTopH = (x, z) => portGround(x, z, 999);
function portSolid(x, y, z) { for (const b of portNear(x, z)) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && y >= b.y0 && y <= b.y1) return b; return null; }
function portCeil(x, z, y) { let c = 1e9; for (const b of portNear(x, z)) if (x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && b.y0 > y + 0.5 && b.y0 < c) c = b.y0; return c; }
// 3D segment vs boxes: returns fraction 0..1 of first hit, or 1
function portSeg(a, b) {
  let best = 1; const d = b.clone().sub(a); const seen = new Set();
  const n = Math.ceil(d.length() / 8) + 1;
  for (let s = 0; s <= n; s++) {
    const px = a.x + d.x * s / n, pz = a.z + d.z * s / n;
    for (const bx of portNear(px, pz)) {
      if (seen.has(bx)) continue; seen.add(bx);
      let t0 = 0, t1 = 1, ok = true;
      for (const [o, dd, lo, hi] of [[a.x, d.x, bx.x0, bx.x1], [a.y, d.y, bx.y0, bx.y1], [a.z, d.z, bx.z0, bx.z1]]) {
        if (Math.abs(dd) < 1e-6) { if (o < lo || o > hi) { ok = false; break; } continue; }
        let u0 = (lo - o) / dd, u1 = (hi - o) / dd; if (u0 > u1) [u0, u1] = [u1, u0];
        t0 = Math.max(t0, u0); t1 = Math.min(t1, u1); if (t0 > t1) { ok = false; break; }
      }
      if (ok && t0 < best) best = t0;
    }
  }
  return best;
}
// rigs vs container walls and the yard fence
function portClamp(v, dt) {
  const m = 2.5;
  if (v.pos.x < PORT.X0 + m) { v.pos.x = PORT.X0 + m; if (v.vel.x < 0) v.vel.x *= -0.4; }
  if (v.pos.x > PORT.X1 - m) { v.pos.x = PORT.X1 - m; if (v.vel.x > 0) v.vel.x *= -0.4; }
  if (v.pos.z < PORT.Z0 + m) { v.pos.z = PORT.Z0 + m; if (v.vel.z < 0) v.vel.z *= -0.4; }
  if (v.pos.z > PORT.Z1 - m) { v.pos.z = PORT.Z1 - m; if (v.vel.z > 0) v.vel.z *= -0.4; }
  const vy0 = v.y, vy1 = v.y + 1.5;
  for (let it = 0; it < 2; it++) for (const [cx, cz, r0] of circles(v)) {
    const rr0 = r0 * 0.82;
    for (const b of portNear(cx, cz)) {
      if (vy0 >= b.y1 - P_STEP || vy1 <= b.y0) continue;
      const r = b.thin && v.type !== 'juggernaut' ? Math.min(rr0, 0.95) : rr0;
      const qx = clamp(cx, b.x0, b.x1), qz = clamp(cz, b.z0, b.z1); let dx = cx - qx, dz = cz - qz; let d = Math.hypot(dx, dz);
      if (d >= r) continue;
      let nx, nz, pen;
      if (d < 1e-4) { // centre inside the box: push out the nearest side
        const o = [[cx - b.x0, -1, 0], [b.x1 - cx, 1, 0], [cz - b.z0, 0, -1], [b.z1 - cz, 0, 1]].sort((p, q) => p[0] - q[0])[0];
        nx = o[1]; nz = o[2]; pen = o[0] + r;
      } else { nx = dx / d; nz = dz / d; pen = r - d; }
      v.pos.x += nx * pen; v.pos.z += nz * pen;
      const vn = v.vel.x * nx + v.vel.z * nz;
      if (vn < 0) {
        v.vel.x -= nx * vn * 1.3; v.vel.z -= nz * vn * 1.3;
        if (vn < -11 && v.alive && (!v.wallCD || game.t - v.wallCD > 0.4)) { v.wallCD = game.t; v.damage(-vn * 0.7, null, null, null, 'ram'); const p = V3(cx - nx * r, v.y + 1, cz - nz * r); sparks(p, V3(nx, 0.4, nz), 12); sfx.clang(); shake(Math.min(0.5, -vn * 0.02), v.pos); }
        v.yawV += (Math.random() - 0.5) * 0.4;
      }
    }
  }
}
// ---- navigation: 4 m grid, flow field toward the player, refreshed a few times a second
function portBuildNav() {
  const C = 4, nx = Math.ceil((PORT.X1 - PORT.X0) / C), nz = Math.ceil((PORT.Z1 - PORT.Z0) / C);
  const blocked = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = PORT.X0 + (i + 0.5) * C, z = PORT.Z0 + (j + 0.5) * C; const inf = 1.6;
    for (const b of PORT.boxes) if (b.y0 < 1.2 && x > b.x0 - inf && x < b.x1 + inf && z > b.z0 - inf && z < b.z1 + inf) { blocked[j * nx + i] = 1; break; }
    if (x < PORT.X0 + 4 || x > PORT.X1 - 4 || z < PORT.Z0 + 4 || z > PORT.Z1 - 4) blocked[j * nx + i] = 1;
  }
  PORT.nav = { C, nx, nz, blocked, dist: new Int16Array(nx * nz), t: -1, q: new Int32Array(nx * nz) };
  PORT.free = []; for (let k = 0; k < nx * nz; k++) if (!blocked[k]) PORT.free.push([PORT.X0 + ((k % nx) + 0.5) * C, PORT.Z0 + (((k / nx) | 0) + 0.5) * C]);
}
const navIdx = (x, z) => { const N = PORT.nav; const i = clamp(Math.floor((x - PORT.X0) / N.C), 0, N.nx - 1), j = clamp(Math.floor((z - PORT.Z0) / N.C), 0, N.nz - 1); return j * N.nx + i; };
function portFlow(goal) {
  const N = PORT.nav; N.dist.fill(-1); let h = 0, t = 0; const s = navIdx(goal.x, goal.z); N.dist[s] = 0; N.q[t++] = s;
  while (h < t) {
    const k = N.q[h++], i = k % N.nx, j = (k / N.nx) | 0, d = N.dist[k] + 1;
    if (i > 0 && N.dist[k - 1] < 0 && !N.blocked[k - 1]) { N.dist[k - 1] = d; N.q[t++] = k - 1; }
    if (i < N.nx - 1 && N.dist[k + 1] < 0 && !N.blocked[k + 1]) { N.dist[k + 1] = d; N.q[t++] = k + 1; }
    if (j > 0 && N.dist[k - N.nx] < 0 && !N.blocked[k - N.nx]) { N.dist[k - N.nx] = d; N.q[t++] = k - N.nx; }
    if (j < N.nz - 1 && N.dist[k + N.nx] < 0 && !N.blocked[k + N.nx]) { N.dist[k + N.nx] = d; N.q[t++] = k + N.nx; }
  }
}
// where an AI rig should head to reach `target` through the maze
function portNavTarget(e, target) {
  const N = PORT.nav; if (!N || !player) return target;
  if (game.t - N.t > 0.4) { N.t = game.t; portFlow(player.pos); }
  if (e.y > 1.8) return target; // up on the stacks: just go for it
  // clear straight line? drive direct
  if (portSeg(V3(e.pos.x, e.y + 1, e.pos.z), V3(target.x, Math.max(e.y, player.y) + 1, target.z)) >= 1) return target;
  let k = navIdx(e.pos.x, e.pos.z);
  if (N.dist[k] < 0) { // inside a blocked cell: step to the best free neighbour
    let best = -1, bd = 1e9; const i = k % N.nx, j = (k / N.nx) | 0;
    for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N.nx || jj >= N.nz) continue; const q = jj * N.nx + ii; if (N.dist[q] >= 0 && N.dist[q] + Math.hypot(di, dj) < bd) { bd = N.dist[q] + Math.hypot(di, dj); best = q; } }
    if (best < 0) return target; k = best;
  }
  for (let step = 0; step < 4; step++) {
    const i = k % N.nx, j = (k / N.nx) | 0; let nk = k;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N.nx || jj >= N.nz) continue; const q = jj * N.nx + ii;
      if (N.dist[q] >= 0 && N.dist[q] < N.dist[nk] && (di === 0 || dj === 0 || (!N.blocked[j * N.nx + ii] && !N.blocked[jj * N.nx + i]))) nk = q;
    }
    if (nk === k) break; k = nk;
  }
  return V3(PORT.X0 + ((k % N.nx) + 0.5) * N.C, 0, PORT.Z0 + (((k / N.nx) | 0) + 0.5) * N.C);
}
function portSpawnPoint(near, dmin, dmax) {
  for (let t = 0; t < 60; t++) { const p = PORT.free[(Math.random() * PORT.free.length) | 0]; const d = Math.hypot(p[0] - near.x, p[1] - near.z); if (d > dmin && d < dmax) return p; }
  return PORT.free[(Math.random() * PORT.free.length) | 0];
}
// ground helper used by the shared code
function groundAt(x, z, y) { return WORLD.ground ? WORLD.ground(x, z, y) : height(x, z); }
function solidAt(p) { return WORLD.solid ? WORLD.solid(p.x, p.y, p.z) : null; }
function enterPortWorld() {
  buildPort();
  if (WORLD.mode === 'port') return;
  PORT.arenaStatic = STATIC.splice(0); STATIC.push(...GAN.legs);
  WORLD.mode = 'port'; WORLD.h = portTopH; WORLD.ground = portGround; WORLD.solid = portSolid; WORLD.clamp = portClamp; WORLD.lightDir = null;
  PORT.group.visible = true; arenaGroup.visible = false; applyTime(load.time);
  placePortProps();
}
function leavePortWorld() {
  if (WORLD.mode !== 'port') return;
  WORLD.mode = 'arena'; WORLD.ground = null; WORLD.solid = null; WORLD.clamp = null;
  PORT.group.visible = false; arenaGroup.visible = true;
  STATIC.length = 0; STATIC.push(...(PORT.arenaStatic || []));
  placeProps(); applyTime(load.time);
}
function syncMap() { if (load.map === 'port') enterPortWorld(); else leavePortWorld(); }
function placePortProps() {
  for (const p of props) p.obj.removeFromParent(); props.length = 0;
  withSeed(77, () => {
    for (let c = 0; c < 22; c++) {
      const p = PORT.free[(Math.random() * PORT.free.length) | 0]; if (Math.hypot(p[0], p[1]) < 20) continue;
      if (Math.random() < 0.6) { const nb = 2 + ((Math.random() * 4) | 0); for (let i = 0; i < nb; i++) makeBarrel(p[0] + rnd(-1.5, 1.5), p[1] + rnd(-1.5, 1.5)); }
      else makeTires(p[0], p[1]);
    }
  });
}

// ============================================================ CONTAINER PORT: art + layout
const PT = {}; // shared port textures/materials
function cvs(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function ctex(c, srgb = true, rep = null) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; }
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
// grime, rust streaks, dents and scratches over whatever is on the canvas
function grime(g, w, h, amt = 1, railTop = 0) {
  for (let i = 0; i < 26 * amt; i++) { // soft dirt blotches
    const x = Math.random() * w, y = Math.random() * h, r = 10 + Math.random() * w * 0.08; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${40 + Math.random() * 30},${30 + Math.random() * 20},20,${0.12 + Math.random() * 0.14})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  for (let i = 0; i < 70 * amt; i++) { // rust streaks running down from the top rail and from dents
    const x = Math.random() * w, y0 = Math.random() < 0.7 ? railTop : Math.random() * h * 0.7, L = 10 + Math.random() * h * 0.6, wd = 1 + Math.random() * 3.5;
    const gr = g.createLinearGradient(0, y0, 0, y0 + L); const a = 0.25 + Math.random() * 0.45;
    gr.addColorStop(0, `rgba(${110 + Math.random() * 40},${50 + Math.random() * 20},${20},${a})`); gr.addColorStop(1, 'rgba(90,40,15,0)'); g.fillStyle = gr; g.fillRect(x, y0, wd, L);
  }
  for (let i = 0; i < 14 * amt; i++) { // rust patches
    const x = Math.random() * w, y = Math.random() * h, r = 3 + Math.random() * 12; g.fillStyle = `rgba(${100 + Math.random() * 50},${45 + Math.random() * 20},18,${0.35 + Math.random() * 0.4})`;
    g.beginPath(); for (let k = 0; k < 9; k++) { const a = k / 9 * 6.283, rr = r * (0.5 + Math.random() * 0.7); g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7); } g.fill();
  }
  g.strokeStyle = 'rgba(230,225,210,0.18)'; g.lineWidth = 1; // scratches
  for (let i = 0; i < 30 * amt; i++) { const x = Math.random() * w, y = Math.random() * h; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - 0.5) * 60, y + (Math.random() - 0.5) * 12); g.stroke(); }
  const id = g.getImageData(0, 0, w, h), d = id.data; // fine noise
  for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  g.putImageData(id, 0, 0);
}
function eroded(g, draw, w, h) { // stencil text that is chipped and faded
  const [c2, g2] = cvs(w, h); draw(g2); g2.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) { g2.fillStyle = `rgba(0,0,0,${Math.random() * 0.8})`; g2.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 4, 1 + Math.random() * 3); }
  g.drawImage(c2, 0, 0);
}
const RIBS = 46;
function ribShade(g, x0, x1, y0, y1, n, k = 0.18) { // ambient occlusion in the corrugation grooves
  const pw = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const x = x0 + i * pw; const gr = g.createLinearGradient(x, 0, x + pw, 0); gr.addColorStop(0, `rgba(0,0,0,${k})`); gr.addColorStop(0.2, 'rgba(255,255,255,0.04)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.06)'); gr.addColorStop(0.8, `rgba(0,0,0,${k * 0.6})`); gr.addColorStop(1, `rgba(0,0,0,${k})`); g.fillStyle = gr; g.fillRect(x, y0, pw, y1 - y0); }
}
function containerSideTex(col, name, code, logo) {
  const w = 1024, h = 224, [c, g] = cvs(w, h);
  g.fillStyle = col; g.fillRect(0, 0, w, h);
  const rail = h * 0.075, post = w * 0.018;
  ribShade(g, post, w - post, rail, h - rail, RIBS);
  g.fillStyle = shade(col, 0.72); g.fillRect(0, 0, w, rail); g.fillRect(0, h - rail, w, rail); g.fillRect(0, 0, post, h); g.fillRect(w - post, 0, post, h);
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, rail - 2, w, 2); g.fillRect(0, h - rail, w, 2);
  g.fillStyle = '#2a2826'; for (const x of [0, w - post]) for (const y of [0, h - rail]) g.fillRect(x, y, post, rail); // corner castings
  eroded(g, (q) => {
    q.fillStyle = 'rgba(245,243,236,0.92)'; q.font = `900 ${h * 0.34}px Impact, 'Arial Black', sans-serif`; q.textBaseline = 'middle'; q.fillText(name, w * 0.2, h * 0.5);
    q.font = `700 ${h * 0.085}px Arial, sans-serif`; q.fillText(code, w * 0.74, h * 0.17); q.fillText('45G1', w * 0.86, h * 0.27);
    q.font = `700 ${h * 0.05}px Arial, sans-serif`; q.fillText('MAX GROSS 32,500 KG   TARE 3,800 KG', w * 0.74, h * 0.82);
    // logo mark
    q.lineWidth = h * 0.035; q.strokeStyle = 'rgba(245,243,236,0.9)'; const lx = w * 0.12, ly = h * 0.5, lr = h * 0.17;
    q.beginPath(); if (logo === 0) q.arc(lx, ly, lr, 0, 6.283); else if (logo === 1) { q.moveTo(lx, ly - lr); q.lineTo(lx + lr, ly + lr * 0.8); q.lineTo(lx - lr, ly + lr * 0.8); q.closePath(); } else { q.moveTo(lx - lr, ly); q.lineTo(lx, ly - lr); q.lineTo(lx + lr, ly); q.lineTo(lx, ly + lr); q.closePath(); } q.stroke();
  }, w, h);
  g.fillStyle = 'rgba(200,200,190,0.8)'; g.fillRect(w * 0.06, h * 0.75, w * 0.03, h * 0.09); // CSC plate
  grime(g, w, h, 1, rail);
  return ctex(c);
}
function containerDoorTex(col, code) {
  const w = 256, h = 224, [c, g] = cvs(w, h);
  g.fillStyle = shade(col, 0.95); g.fillRect(0, 0, w, h);
  const rail = h * 0.075; g.fillStyle = shade(col, 0.7); g.fillRect(0, 0, w, rail); g.fillRect(0, h - rail, w, rail); g.fillRect(0, 0, w * 0.06, h); g.fillRect(w * 0.94, 0, w * 0.06, h);
  for (const dx of [0, w / 2]) { g.fillStyle = 'rgba(0,0,0,0.12)'; for (let k = 0; k < 5; k++) g.fillRect(dx + w * 0.08 + k * w * 0.075, rail, 3, h - rail * 2); }
  g.fillStyle = '#1b1a18'; g.fillRect(w / 2 - 1.5, rail, 3, h - rail * 2);
  for (const x of [0.17, 0.33, 0.67, 0.83]) { // locking bars, cams, handles
    const X = x * w; g.fillStyle = '#9a968e'; g.fillRect(X - 3, rail, 6, h - rail * 2); g.fillStyle = '#5c5954'; g.fillRect(X - 6, rail + 2, 12, 9); g.fillRect(X - 6, h - rail - 11, 12, 9);
    g.fillStyle = '#7d7973'; g.fillRect(X - 3, h * 0.55, x < 0.5 ? 24 : -24, 6);
  }
  for (const y of [0.18, 0.5, 0.82]) { g.fillStyle = '#3a3835'; g.fillRect(w * 0.035, y * h - 6, 10, 12); g.fillRect(w * 0.965 - 10, y * h - 6, 10, 12); }
  eroded(g, (q) => { q.fillStyle = 'rgba(245,243,236,0.9)'; q.font = `700 ${h * 0.07}px Arial, sans-serif`; q.fillText(code, w * 0.56, h * 0.18); q.fillText('45G1', w * 0.56, h * 0.27); }, w, h);
  grime(g, w, h, 0.4, rail);
  return ctex(c);
}
function containerEndTex(col) {
  const w = 256, h = 224, [c, g] = cvs(w, h); g.fillStyle = col; g.fillRect(0, 0, w, h);
  const rail = h * 0.075; ribShade(g, 0, w, rail, h - rail, 9); g.fillStyle = shade(col, 0.7); g.fillRect(0, 0, w, rail); g.fillRect(0, h - rail, w, rail); g.fillRect(0, 0, w * 0.06, h); g.fillRect(w * 0.94, 0, w * 0.06, h);
  grime(g, w, h, 0.4, rail); return ctex(c);
}
function containerRoofTex(col) {
  const w = 512, h = 128, [c, g] = cvs(w, h); g.fillStyle = shade(col, 0.88); g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(0,0,0,0.1)'; for (let i = 0; i < 40; i++) g.fillRect(i * w / 40, 0, 3, h);
  for (let i = 0; i < 10; i++) { const x = Math.random() * w, y = Math.random() * h, r = 8 + Math.random() * 30; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(70,60,45,0.35)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  grime(g, w, h, 0.5, 0); return ctex(c);
}
function corrNormal(n, vertical = true, rail = 0.075) { // corrugation normal map (trapezoid ribs)
  const w = 1024, h = 64, [c, g] = cvs(w, h); const id = g.createImageData(w, h), d = id.data;
  for (let x = 0; x < w; x++) {
    const u = (x / w * n) % 1; let nx = 0; if (u < 0.15) nx = -0.75; else if (u > 0.5 && u < 0.65) nx = 0.75;
    for (let y = 0; y < h; y++) { const vv = y / h; const inRail = vv < rail || vv > 1 - rail; const X = inRail ? 0 : nx; const L = Math.hypot(X, 1); const o = (y * w + x) * 4; d[o] = (X / L * 0.5 + 0.5) * 255; d[o + 1] = 128; d[o + 2] = (1 / L * 0.5 + 0.5) * 255; d[o + 3] = 255; }
  }
  g.putImageData(id, 0, 0); return ctex(c, false);
}
const LINES = [
  ['#8c3424', 'ORION LINES', 'ORNU', 0], ['#1e4a74', 'KESTREL', 'KSTU', 1], ['#35663f', 'MARLOW', 'MRLU', 2], ['#858a8a', 'TRITON', 'TRIU', 0],
  ['#d3d0c7', 'HALCYON', 'HLCU', 1], ['#b8621f', 'NORTHMARK', 'NMKU', 2], ['#b99a26', 'BOREAL', 'BORU', 0], ['#5d2626', 'SEAWOLF', 'SWLU', 1], ['#2a6a6e', 'WRECKLINE', 'WRKU', 2],
];
function portMaterials() {
  if (PT.mats) return PT.mats;
  const nSide = corrNormal(RIBS), nEnd = corrNormal(9), nRoof = corrNormal(40, true, 0.02);
  const bottom = new THREE.MeshStandardMaterial({ color: '#1d1b19', roughness: 0.9, metalness: 0.3 });
  PT.mats = LINES.map(([col, name, pre, logo]) => {
    const code = `${pre} ${100000 + ((Math.random() * 899999) | 0)} ${(Math.random() * 9) | 0}`;
    const std = (map, nm, s = 1) => new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(s, s), roughness: 0.62, metalness: 0.35 });
    const side = std(containerSideTex(col, name, code, logo), nSide, 1.1);
    return [std(containerDoorTex(col, code), null), std(containerEndTex(col), nEnd), std(containerRoofTex(col), nRoof, 0.5), bottom, side, side];
  });
  return PT.mats;
}
// ---------------------------------------------------------------- concrete yard
function concreteTex() {
  const w = 1024, [c, g] = cvs(w, w);
  const id = g.createImageData(w, w), d = id.data;
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const n = fbm(x * 0.02, y * 0.02, 4) * 26 + fbm(x * 0.15, y * 0.15, 2) * 14 + Math.random() * 16; const o = (y * w + x) * 4; d[o] = 128 + n; d[o + 1] = 124 + n; d[o + 2] = 116 + n; d[o + 3] = 255; }
  g.putImageData(id, 0, 0);
  for (let i = 0; i < 2600; i++) { g.fillStyle = Math.random() < 0.5 ? 'rgba(60,58,54,0.5)' : 'rgba(210,205,195,0.5)'; g.fillRect(Math.random() * w, Math.random() * w, 1 + Math.random() * 2, 1 + Math.random() * 2); } // aggregate
  for (let i = 0; i < 14; i++) { // oil and tire stains
    const x = Math.random() * w, y = Math.random() * w, r = 20 + Math.random() * 90; const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(25,22,20,${0.25 + Math.random() * 0.3})`); gr.addColorStop(0.6, 'rgba(25,22,20,0.1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1, 0.5 + Math.random()); g.fillRect(-r, -r, 2 * r, 2 * r); g.restore();
  }
  g.strokeStyle = 'rgba(40,38,35,0.55)'; for (let i = 0; i < 10; i++) { g.lineWidth = 1 + Math.random(); g.beginPath(); let x = Math.random() * w, y = Math.random() * w; g.moveTo(x, y); for (let k = 0; k < 30; k++) { x += (Math.random() - 0.5) * 18; y += (Math.random() - 0.3) * 14; g.lineTo(x, y); } g.stroke(); } // cracks
  g.fillStyle = 'rgba(35,33,30,0.8)'; g.fillRect(0, 0, w, 4); g.fillRect(0, 0, 4, w); g.fillRect(0, w / 2 - 2, w, 4); g.fillRect(w / 2 - 2, 0, 4, w); // slab joints
  g.fillStyle = 'rgba(230,226,215,0.25)'; g.fillRect(0, 4, w, 2); g.fillRect(4, 0, 2, w); g.fillRect(0, w / 2 + 2, w, 2); g.fillRect(w / 2 + 2, 0, 2, w);
  return c;
}
function concreteNormal() {
  const w = 512, [c, g] = cvs(w, w); const id = g.createImageData(w, w), d = id.data; const H = (x, y) => fbm(x * 0.08, y * 0.08, 3) * 0.6 + Math.random() * 0.25 - (((x % 256) < 3 || (y % 256) < 3) ? 1.5 : 0);
  const hh = new Float32Array(w * w); for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) hh[y * w + x] = H(x, y);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const dx = hh[y * w + ((x + 1) % w)] - hh[y * w + ((x - 1 + w) % w)], dy = hh[((y + 1) % w) * w + x] - hh[((y - 1 + w) % w) * w + x]; const L = Math.hypot(dx, dy, 1); const o = (y * w + x) * 4; d[o] = (-dx / L * 0.5 + 0.5) * 255; d[o + 1] = (-dy / L * 0.5 + 0.5) * 255; d[o + 2] = (1 / L * 0.5 + 0.5) * 255; d[o + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
function textDecal(text, w, h, col = 'rgba(240,238,230,0.9)', font = 'Impact, Arial Black, sans-serif') {
  const [c, g] = cvs(512, 256); eroded(g, (q) => { q.fillStyle = col; q.font = `900 200px ${font}`; q.textAlign = 'center'; q.textBaseline = 'middle'; q.fillText(text, 256, 132); }, 512, 256);
  const m = new THREE.MeshStandardMaterial({ map: ctex(c), transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.rotation.x = -Math.PI / 2; p.receiveShadow = true; return p;
}
// ---------------------------------------------------------------- build
function buildPort() {
  if (PORT.built) return; PORT.built = true;
  withSeed(4242, buildPortRaw);
  ganBuild();
  portBuildNav();
}
function buildPortRaw() {
  const G = PORT.group; const mats = portMaterials();
  const steel = (col, r = 0.5, m = 0.6, rust = 0.12) => { const mm = new THREE.MeshStandardMaterial({ color: col, roughness: r, metalness: m }); weather(mm, rust, 0.35); return mm; };
  const add = (geo, mat, x, y, z, ry = 0, shadow = true) => { const me = new THREE.Mesh(geo, mat); me.position.set(x, y, z); me.rotation.y = ry; me.castShadow = shadow; me.receiveShadow = true; G.add(me); return me; };
  const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  // ---- ground: concrete apron with large-scale tone variation
  {
    const S = 520, gg = new THREE.PlaneGeometry(S, 390, 130, 98); gg.rotateX(-Math.PI / 2);
    const col = new Float32Array(gg.attributes.position.count * 3); const p = gg.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); const k = 0.82 + fbm(x * 0.012 + 40, z * 0.012, 4) * 0.3 - (z > PORT.Z1 ? 0 : 0); col[i * 3] = k; col[i * 3 + 1] = k * 0.985; col[i * 3 + 2] = k * 0.96; }
    gg.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const map = ctex(concreteTex(), true, [S / 14, 390 / 14]); const nm = ctex(concreteNormal(), false, [S / 14, 390 / 14]);
    const m = new THREE.MeshStandardMaterial({ map, normalMap: nm, normalScale: new THREE.Vector2(0.6, 0.6), vertexColors: true, roughness: 0.88, metalness: 0.02 });
    const gr = new THREE.Mesh(gg, m); gr.position.set(0, 0, -79); gr.receiveShadow = true; G.add(gr);
    // cut the ground off at the quay: a second plane would z-fight, so the water simply sits lower and the quay wall hides the edge
  }
  // ---- painted markings
  const PAINT = {}; const paint = (w, d, x, z, col = '#d8b52a', a = 0.85) => { (PAINT[col + a] = PAINT[col + a] || { col, a, L: [] }).L.push([w, d, x, z]); };
  // ---- container placement
  const inst = LINES.map(() => []); const vis = (x, y, z, ry = 0, v = (Math.random() * LINES.length) | 0) => inst[v].push([x, y, z, ry]);
  const PX = 12.5, PZ = 2.6;
  const blockInfo = [];
  // block: cx, cz, heights[bay][row], tunnelRows
  function block(cx, cz, hf, opt = {}) {
    const bays = 4, rows = 6, x0 = cx - bays * PX / 2, z0 = cz - rows * PZ / 2; const H = [];
    for (let b = 0; b < bays; b++) { H.push([]); for (let r = 0; r < rows; r++) H[b].push(hf(b, r)); }
    const tun = opt.tunnel || [];
    for (let b = 0; b < bays; b++) for (let r = 0; r < rows; r++) {
      const x = x0 + (b + 0.5) * PX, z = z0 + (r + 0.5) * PZ, h = H[b][r];
      for (let k = 0; k < h; k++) { if (k === 0 && tun.includes(r)) continue; vis(x, k * CT.H + CT.H / 2, z, Math.random() < 0.5 ? 0 : Math.PI); }
      if (tun.includes(r)) openContainer(x, z, 0, b === 0 ? -1 : b === bays - 1 ? 1 : 0, false);
    }
    // colliders: merge equal-height solid runs
    for (let r = 0; r < rows; r++) {
      let b = 0;
      while (b < bays) {
        let e = b; while (e + 1 < bays && H[e + 1][r] === H[b][r]) e++;
        const h = H[b][r], zc = z0 + (r + 0.5) * PZ, xa = x0 + b * PX + (b > 0 ? 0 : 0.15), xb = x0 + (e + 1) * PX - (e < bays - 1 ? 0 : 0.15);
        // stretch rows together so there is no crack to fall into between neighbours of equal height
        const za = zc - (r > 0 && H[b][r - 1] === h && !tun.includes(r - 1) && !tun.includes(r) ? PZ / 2 : CT.W / 2), zb = zc + (r < rows - 1 && H[b][r + 1] === h && !tun.includes(r + 1) && !tun.includes(r) ? PZ / 2 : CT.W / 2);
        if (h > 0) { if (tun.includes(r)) { portBox(xa, xb, za, zb, CT.H, h * CT.H); } else portBox(xa, xb, za, zb, 0, h * CT.H); }
        b = e + 1;
      }
    }
    blockInfo.push({ cx, cz, x0, z0, x1: x0 + bays * PX, z1: z0 + rows * PZ, H });
    // ground markings: slot outline and a bay number
    paint(bays * PX + 1.2, 0.18, cx, z0 - 0.6, '#e9e6dc', 0.7); paint(bays * PX + 1.2, 0.18, cx, z0 + rows * PZ + 0.6, '#e9e6dc', 0.7);
    return { x0, z0, x1: x0 + bays * PX, z1: z0 + rows * PZ };
  }
  // open-ended container you can drive through. ends: -1 doors at -x, 1 doors at +x
  function openContainer(x, z, y = 0, doors = 1, solo = true, rot = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rot; const v = (Math.random() * LINES.length) | 0; const M = mats[v];
    if (!PT.inner) PT.inner = []; if (!PT.inner[v]) { const t = M[1].map.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4.8, 1); t.needsUpdate = true; const n = M[1].normalMap.clone(); n.wrapS = n.wrapT = THREE.RepeatWrapping; n.repeat.set(4.8, 1); n.needsUpdate = true; PT.inner[v] = new THREE.MeshStandardMaterial({ map: t, normalMap: n, color: '#9a9a96', roughness: 0.7, metalness: 0.3 }); }
    const inner = PT.inner[v];
    const wall = (zz) => { const m = new THREE.Mesh(bx(CT.L, CT.H, 0.06), [M[1], M[1], M[2], M[3], zz > 0 ? M[4] : inner, zz > 0 ? inner : M[4]]); m.position.set(0, CT.H / 2, zz); m.castShadow = m.receiveShadow = true; g.add(m); };
    wall(CT.W / 2 - 0.03); wall(-CT.W / 2 + 0.03);
    const roof = new THREE.Mesh(bx(CT.L, 0.08, CT.W), [M[1], M[1], M[2], PT.inner[v], M[1], M[1]]); roof.position.y = CT.H - 0.04; roof.castShadow = roof.receiveShadow = true; g.add(roof);
    const floor = new THREE.Mesh(bx(CT.L, 0.12, CT.W - 0.1), new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.9 })); floor.position.y = 0.06; floor.receiveShadow = true; g.add(floor);
    const frameM = new THREE.MeshStandardMaterial({ color: shade(LINES[v][0], 0.6), roughness: 0.6, metalness: 0.4 });
    for (const sx of [-1, 1]) { for (const sz of [-1, 1]) { const p = new THREE.Mesh(bx(0.16, CT.H, 0.16), frameM); p.position.set(sx * (CT.L / 2 - 0.08), CT.H / 2, sz * (CT.W / 2 - 0.08)); g.add(p); } const hdr = new THREE.Mesh(bx(0.16, 0.22, CT.W), frameM); hdr.position.set(sx * (CT.L / 2 - 0.08), CT.H - 0.11, 0); g.add(hdr); }
    if (doors) for (const sz of [-1, 1]) { // doors swung all the way open against the outside walls
      const d = new THREE.Mesh(bx(CT.W / 2, CT.H - 0.1, 0.05), [M[0], M[0], M[0], M[0], M[0], M[0]]); d.position.set(doors * (CT.L / 2 + CT.W / 4), CT.H / 2, sz * (CT.W / 2 + 0.06)); d.castShadow = true; g.add(d);
    }
    G.add(g);
    // colliders (thin walls let smaller rigs squeeze through; the Juggernaut is too wide)
    const c = Math.cos(rot), s = Math.abs(Math.sin(rot)) > 0.5;
    const hw = CT.W / 2, hl = CT.L / 2;
    if (!s) { for (const sz of [-1, 1]) portBox(x - hl, x + hl, z + sz * hw - 0.06, z + sz * hw + 0.06, y, y + CT.H, { thin: true, noTop: true }); if (solo) portBox(x - hl, x + hl, z - hw, z + hw, y + CT.H - 0.2, y + CT.H); }
    else { for (const sx of [-1, 1]) portBox(x + sx * hw - 0.06, x + sx * hw + 0.06, z - hl, z + hl, y, y + CT.H, { thin: true, noTop: true }); if (solo) portBox(x - hw, x + hw, z - hl, z + hl, y + CT.H - 0.2, y + CT.H); }
    return g;
  }
  // ---- the yard
  // south rows: tall stacks with long drive-through tunnels
  block(-90, -100, () => 2 + ((Math.random() * 2) | 0), { tunnel: [2] });
  block(-30, -100, () => 3, { tunnel: [3] });
  block(30, -100, () => 2 + ((Math.random() * 2) | 0), { tunnel: [2] });
  block(90, -100, () => 3, { tunnel: [3] });
  // the skyway: flat decks one container high, ramps up from the plaza, kickers to jump the lanes
  for (const cx of [-90, -30, 30, 90]) {
    const B = block(cx, -64, () => 1);
    portRamp(cx - 4, cx + 4, B.z1, B.z1 + 13, 'z', -1, 0, CT.H); rampVis(cx, B.z1 + 6.5, 8, 13, 0, CT.H, 'z', -1);
    if (cx < 90) { portRamp(B.x1 - 8, B.x1, B.z0 + 1, B.z1 - 1, 'x', 1, CT.H, CT.H + 1.5, CT.H); PORT.ramps[PORT.ramps.length - 1].curve = 1.7; rampVis(B.x1 - 4, (B.z0 + B.z1) / 2, 8, B.z1 - B.z0 - 2, CT.H, CT.H + 1.5, 'x', 1, true); }
  }
  // side blocks around the plaza
  { const B = block(-90, 28, () => 1); portRamp(B.x0 - 12, B.x0, B.z0 + 2, B.z1 - 2, 'x', 1, 0, CT.H); rampVis(B.x0 - 6, (B.z0 + B.z1) / 2, 12, B.z1 - B.z0 - 4, 0, CT.H, 'x', 1);
    portRamp(B.x1 - 8, B.x1, B.z0 + 1, B.z1 - 1, 'x', 1, CT.H, CT.H + 1.6, CT.H); PORT.ramps[PORT.ramps.length - 1].curve = 1.7; rampVis(B.x1 - 4, (B.z0 + B.z1) / 2, 8, B.z1 - B.z0 - 2, CT.H, CT.H + 1.6, 'x', 1, true); }
  { const B = block(90, 28, () => 1); portRamp(B.x1, B.x1 + 12, B.z0 + 2, B.z1 - 2, 'x', -1, 0, CT.H); rampVis(B.x1 + 6, (B.z0 + B.z1) / 2, 12, B.z1 - B.z0 - 4, 0, CT.H, 'x', -1);
    portRamp(B.x0, B.x0 + 8, B.z0 + 1, B.z1 - 1, 'x', -1, CT.H, CT.H + 1.6, CT.H); PORT.ramps[PORT.ramps.length - 1].curve = 1.7; rampVis(B.x0 + 4, (B.z0 + B.z1) / 2, 8, B.z1 - B.z0 - 2, CT.H, CT.H + 1.6, 'x', -1, true); }
  block(-90, -28, (b, r) => 1 + ((b + r) % 3), {}); block(90, -28, (b, r) => 1 + ((b * 2 + r) % 3), {});
  // north row: the staircase (1, 2, 3 high) you can climb and launch off, plus tunnel blocks
  { const B = block(-90, 64, (b) => [1, 2, 3, 3][b]);
    portRamp(B.x0 - 12, B.x0, B.z0 + 1, B.z1 - 1, 'x', 1, 0, CT.H); rampVis(B.x0 - 6, (B.z0 + B.z1) / 2, 12, B.z1 - B.z0 - 2, 0, CT.H, 'x', 1);
    for (let k = 0; k < 2; k++) { const xa = B.x0 + k * PX + (k ? 0 : 0.15), xb = B.x0 + (k + 1) * PX; portRamp(xa, xb, B.z0 + 1, B.z1 - 1, 'x', 1, (k + 1) * CT.H, (k + 2) * CT.H, (k + 1) * CT.H); rampVis((xa + xb) / 2, (B.z0 + B.z1) / 2, xb - xa, B.z1 - B.z0 - 2, (k + 1) * CT.H, (k + 2) * CT.H, 'x', 1); }
    portRamp(B.x1 - 6, B.x1, B.z0 + 1, B.z1 - 1, 'x', 1, 3 * CT.H, 3 * CT.H + 1.2, 3 * CT.H); PORT.ramps[PORT.ramps.length - 1].curve = 1.7; rampVis(B.x1 - 3, (B.z0 + B.z1) / 2, 6, B.z1 - B.z0 - 2, 3 * CT.H, 3 * CT.H + 1.2, 'x', 1, true); }
  block(-30, 64, () => 2 + ((Math.random() * 2) | 0), { tunnel: [2] });
  block(30, 64, () => 3, { tunnel: [3] });
  block(90, 64, (b, r) => (r < 2 ? 1 : 2 + (b % 2)), {});
  // plaza: loose drive-throughs and two tipped-container kickers
  openContainer(-26, 0, 0, 1, true, 0); openContainer(26, 0, 0, -1, true, 0); openContainer(0, 34, 0, 1, true, Math.PI / 2); openContainer(0, -34, 0, 1, true, Math.PI / 2);
  for (const [x, z, dir] of [[-40, -40, 1], [40, 40, -1]]) {
    // a container tipped up on a dirt pile: a natural kicker
    const L = 12, h = 3.2; portRamp(x - L / 2, x + L / 2, z - 1.3, z + 1.3, 'x', dir, 0, h); PORT.ramps[PORT.ramps.length - 1].curve = 1.3;
    const m = new THREE.InstancedMesh(new THREE.BoxGeometry(CT.L, CT.H, CT.W), mats[(Math.random() * LINES.length) | 0], 1); const ang = Math.atan2(h, L);
    const q = new THREE.Object3D(); q.position.set(x, h / 2 - CT.H / 2 * Math.cos(ang) + 0.05, z); q.rotation.set(0, dir > 0 ? 0 : Math.PI, ang); q.updateMatrix(); m.setMatrixAt(0, q.matrix); m.castShadow = m.receiveShadow = true; G.add(m);
    const pile = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), new THREE.MeshStandardMaterial({ color: '#6a5a46', roughness: 1 })); pile.scale.set(4, 2.2, 3.4); pile.position.set(x + dir * (L / 2 - 1), 0, z); pile.receiveShadow = true; G.add(pile);
  }
  // quay apron: a line of drive-throughs, stacked singles to weave around
  openContainer(-90, 92, 0, 1, true, 0); openContainer(-10, 98, 0, -1, true, 0); openContainer(70, 92, 0, 1, true, 0);
  for (const [x, z, h] of [[-75, 86, 2], [10, 84, 1], [100, 100, 2], [-110, 104, 1]]) { for (let k = 0; k < h; k++) vis(x, k * CT.H + CT.H / 2, z, 0); portBox(x - CT.L / 2, x + CT.L / 2, z - CT.W / 2, z + CT.W / 2, 0, h * CT.H); }
  // ---- terminal trucks with a container on the trailer
  function truck(x, z, ry, loaded = true) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const v = (Math.random() * 4) | 0;
    const cabCol = ['#c9c4b8', '#a8321f', '#2b4a6a', '#d1a42a'][v]; const cabM = steel(cabCol, 0.45, 0.4, 0.1), dark = steel('#1f1e1c', 0.8, 0.5, 0.05), tire = new THREE.MeshStandardMaterial({ color: '#121110', roughness: 0.95 });
    const glass = new THREE.MeshStandardMaterial({ color: '#141b20', roughness: 0.05, metalness: 0.4 }), chrome = new THREE.MeshStandardMaterial({ color: '#d8d8d8', roughness: 0.15, metalness: 1 });
    const part = (geo, m, px, py, pz, sh = true) => { const me = new THREE.Mesh(geo, m); me.position.set(px, py, pz); me.castShadow = sh; me.receiveShadow = true; g.add(me); return me; };
    // tractor (facing +x)
    part(bx(2.4, 2.1, 2.45), cabM, 7.4, 2.15, 0); part(bx(0.05, 0.9, 2.1), glass, 8.63, 2.55, 0); for (const s of [-1, 1]) part(bx(1.3, 0.8, 0.05), glass, 7.6, 2.6, s * 1.23);
    part(bx(1.6, 1.2, 2.3), cabM, 9.2, 1.45, 0); part(bx(0.06, 0.9, 1.6), dark, 10.02, 1.4, 0); part(bx(0.2, 0.35, 2.5), chrome, 10.05, 0.75, 0);
    for (const s of [-1, 1]) { part(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 10), chrome, 6.15, 2.6, s * 1.0); part(new THREE.CylinderGeometry(0.32, 0.32, 1.2, 14).rotateZ(Math.PI / 2), chrome, 7.4, 0.75, s * 1.1); }
    part(bx(4.6, 0.3, 1.1), dark, 6.8, 0.95, 0);
    // trailer chassis
    part(bx(12.4, 0.3, 1.2), dark, 0, 1.2, 0); part(bx(12.4, 0.15, 2.4), dark, 0, 1.38, 0); part(bx(0.2, 0.9, 2.2), dark, 4.5, 0.75, 0);
    const wheelG = new THREE.CylinderGeometry(0.52, 0.52, 0.35, 18).rotateX(Math.PI / 2), hubM = steel('#8a8680', 0.4, 0.9);
    for (const wx of [-4.6, -3.4, 7.0, 8.9]) for (const s of [-1, 1]) { part(wheelG, tire, wx, 0.52, s * 1.05); part(new THREE.CylinderGeometry(0.3, 0.3, 0.37, 12).rotateX(Math.PI / 2), hubM, wx, 0.52, s * 1.05, false); }
    for (const s of [-1, 1]) part(bx(0.1, 0.2, 0.3), new THREE.MeshStandardMaterial({ color: '#b0180c', emissive: '#ff2a10', emissiveIntensity: 0.6 }), -6.25, 1.0, s * 1.0);
    G.add(g);
    if (loaded) vis(x, 1.46 + CT.H / 2, z, ry);
    const c = Math.abs(Math.cos(ry)) > 0.5; const hx = c ? 8 : 1.4, hz = c ? 1.4 : 8; const ox = Math.cos(ry) * 2.2, oz = -Math.sin(ry) * 2.2;
    portBox(x + ox - hx, x + ox + hx, z + oz - hz, z + oz + hz, 0, loaded ? 1.46 + CT.H : 3.2);
  }
  truck(-30, 92, 0); truck(-20, 104, Math.PI); truck(52, 96, 0); truck(88, 84, Math.PI, false); truck(-112, 46, Math.PI / 2); truck(112, -46, -Math.PI / 2);
  // site offices (portable cabins) with steps, and jersey barriers
  {
    const [oc, og] = cvs(512, 128); og.fillStyle = '#d9d5c8'; og.fillRect(0, 0, 512, 128); og.fillStyle = 'rgba(0,0,0,0.08)'; for (let i = 0; i < 512; i += 10) og.fillRect(i, 0, 2, 128);
    for (const x of [40, 170, 300, 430]) { og.fillStyle = '#5a5a56'; og.fillRect(x - 2, 30, 64, 46); og.fillStyle = '#20282e'; og.fillRect(x, 32, 60, 42); og.fillStyle = 'rgba(255,255,255,0.15)'; og.fillRect(x + 4, 34, 18, 38); }
    og.fillStyle = '#6a6a64'; og.fillRect(240, 22, 40, 106); grime(og, 512, 128, 0.5, 0);
    const offM = new THREE.MeshStandardMaterial({ map: ctex(oc), roughness: 0.7, metalness: 0.2 }), roofM2 = steel('#7a7c78', 0.6, 0.4);
    for (const [x, z, ry, st] of [[-48, -12, 0, 1], [-48, -12, 0, 2], [46, 14, Math.PI, 1]]) {
      const yy = st === 2 ? 2.9 : 0; const b = new THREE.Mesh(bx(9.6, 2.8, 3), [offM, offM, roofM2, roofM2, offM, offM]); b.position.set(x, yy + 1.4 + 0.3, z); b.rotation.y = ry; b.castShadow = b.receiveShadow = true; G.add(b);
      if (st === 1) portBox(x - 4.8, x + 4.8, z - 1.5, z + 1.5, 0, 3.1); else portBox(x - 4.8, x + 4.8, z - 1.5, z + 1.5, 2.9, 6.0);
      for (const sx of [-1, 1]) { const leg = new THREE.Mesh(bx(0.2, 0.3 + yy, 0.2), roofM2); leg.position.set(x + sx * 4.5, (0.3 + yy) / 2, z); G.add(leg); }
    }
    const jM = new THREE.MeshStandardMaterial({ color: '#b8b4aa', roughness: 0.92 }); weather(jM, 0.05, 1.2);
    const jg = new THREE.BoxGeometry(3.6, 0.95, 0.6); { const p = jg.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setZ(i, p.getZ(i) * 0.35); jg.computeVertexNormals(); }
    const jl = []; for (const [x0, z0, dx, dz, n] of [[-50, 46, 3.7, 0, 6], [28, -46, 3.7, 0, 6], [-56, -30, 0, 3.7, 4], [56, 22, 0, 3.7, 4], [-8, 72, 3.7, 0, 5]]) for (let i = 0; i < n; i++) jl.push([x0 + dx * i, z0 + dz * i, dx ? 0 : Math.PI / 2]);
    const jm = new THREE.InstancedMesh(jg, jM, jl.length); const q = new THREE.Object3D(); jl.forEach(([x, z, ry], i) => { q.position.set(x, 0.475, z); q.rotation.set(0, ry, 0); q.updateMatrix(); jm.setMatrixAt(i, q.matrix); const hx = ry ? 0.35 : 1.8, hz = ry ? 1.8 : 0.35; portBox(x - hx, x + hx, z - hz, z + hz, 0, 0.95, { noTop: true }); }); jm.castShadow = jm.receiveShadow = true; G.add(jm);
    // small stacks scattered in the plaza for cover
    for (const [x, z, h, ry] of [[-14, -22, 2, 0], [16, 22, 1, 0], [-36, 22, 1, Math.PI / 2], [36, -22, 2, Math.PI / 2]]) { for (let k = 0; k < h; k++) vis(x, k * CT.H + CT.H / 2, z, ry); const r = Math.abs(Math.sin(ry)) > 0.5; const hx = r ? CT.W / 2 : CT.L / 2, hz = r ? CT.L / 2 : CT.W / 2; portBox(x - hx, x + hx, z - hz, z + hz, 0, h * CT.H); }
  }
  // ---- instanced containers
  const geo = new THREE.BoxGeometry(CT.L, CT.H, CT.W); const o = new THREE.Object3D();
  inst.forEach((L, v) => { if (!L.length) return; const m = new THREE.InstancedMesh(geo, mats[v], L.length); L.forEach(([x, y, z, ry], i) => { o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = m.receiveShadow = true; G.add(m); });
  // ---- ramps (steel loading ramps with grip bars)
  function rampVis(x, z, len, wid, h0, h1, axis, dir, kicker = false) {
    const rise = h1 - h0, ang = Math.atan2(rise, len), L = Math.hypot(rise, len);
    const g = new THREE.Group(); g.position.set(x, (h0 + h1) / 2, z); g.rotation.y = axis === 'x' ? (dir > 0 ? 0 : Math.PI) : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    const plate = new THREE.Mesh(bx(L, 0.12, wid), steel(kicker ? '#b08a2a' : '#5a5650', 0.55, 0.7)); plate.rotation.z = ang; plate.castShadow = plate.receiveShadow = true; g.add(plate);
    const barM = new THREE.MeshStandardMaterial({ color: '#2a2826', metalness: 0.6, roughness: 0.6 });
    { const n = Math.floor(L / 0.8) - 1; const im = new THREE.InstancedMesh(bx(0.06, 0.05, wid * 0.96), barM, n); const q = new THREE.Object3D(); for (let k = 1; k <= n; k++) { const t = -L / 2 + k * 0.8; q.position.set(t * Math.cos(ang), t * Math.sin(ang) + 0.08, 0); q.rotation.set(0, 0, ang); q.updateMatrix(); im.setMatrixAt(k - 1, q.matrix); } g.add(im); }
    for (const s of [-1, 1]) { const side = new THREE.Mesh(bx(len, rise + 0.1, 0.15), steel('#3a3732')); side.position.set(0, -rise / 2 + rise * 0.0, s * wid / 2); const sg = side.geometry; const p = sg.attributes.position; for (let i = 0; i < p.count; i++) { const X = p.getX(i), Y = p.getY(i); if (Y > 0) p.setY(i, -rise / 2 + (X / len + 0.5) * rise + 0.05); else p.setY(i, -rise / 2 - 0.05); } sg.computeVertexNormals(); side.position.y = 0; side.castShadow = true; g.add(side); }
    if (kicker) for (let k = 0; k < 6; k++) { const st = new THREE.Mesh(bx(0.3, 0.02, wid / 6 * 0.9), new THREE.MeshStandardMaterial({ color: k % 2 ? '#d8b52a' : '#1a1a1a', roughness: 0.6 })); st.position.set(L / 2 * Math.cos(ang) - 0.2, L / 2 * Math.sin(ang) + 0.07, -wid / 2 + (k + 0.5) * wid / 6); st.rotation.z = ang; g.add(st); }
    G.add(g);
  }
  // ---- quay edge, fenders, bollards, rails
  {
    const qz = PORT.Z1 + 2; const wallM = new THREE.MeshStandardMaterial({ color: '#8a8780', roughness: 0.9 }); weather(wallM, 0.2, 0.8);
    add(bx(520, 6, 2), wallM, 0, -3, qz + 1);
    const [hc, hg] = cvs(512, 32); for (let i = 0; i < 32; i++) { hg.fillStyle = i % 2 ? '#1b1b1b' : '#d6ad22'; hg.beginPath(); hg.moveTo(i * 32 - 16, 32); hg.lineTo(i * 32, 0); hg.lineTo(i * 32 + 16, 0); hg.lineTo(i * 32, 32); hg.fill(); } grime(hg, 512, 32, 0.3, 0);
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(520, 0.6), new THREE.MeshStandardMaterial({ map: ctex(hc, true, [30, 1]), roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -1 })); stripe.rotation.x = -Math.PI / 2; stripe.position.set(0, 0.025, qz - 0.6); G.add(stripe);
    const fM = new THREE.MeshStandardMaterial({ color: '#141312', roughness: 0.95 });
    for (let x = -240; x <= 240; x += 16) { add(bx(2.2, 2.4, 0.9), fM, x, -1.6, qz + 2.3); }
    const bM = steel('#25272a', 0.5, 0.8);
    const bol = new THREE.CylinderGeometry(0.32, 0.4, 0.8, 16); const cap = new THREE.CylinderGeometry(0.5, 0.42, 0.18, 16);
    for (let x = -120; x <= 120; x += 15) { add(bol, bM, x, 0.4, qz - 1.2); add(cap, bM, x, 0.85, qz - 1.2); portBox(x - 0.45, x + 0.45, qz - 1.65, qz - 0.75, 0, 0.9, { noTop: true }); }
    // crane rails
    const rM = steel('#4a4844', 0.4, 0.9); for (const z of [84, 108]) add(bx(520, 0.06, 0.25), rM, 0, 0.03, z, 0, false);
  }
  // ---- water
  {
    const nt = new THREE.CanvasTexture(rippleN); nt.wrapS = nt.wrapT = THREE.RepeatWrapping; nt.repeat.set(60, 30);
    const wm = new THREE.MeshStandardMaterial({ color: '#1b3640', roughness: 0.08, metalness: 0.15, normalMap: nt, normalScale: new THREE.Vector2(0.35, 0.35) });
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1600, 700), wm); w.rotation.x = -Math.PI / 2; w.position.set(0, -2.3, PORT.Z1 + 352); w.receiveShadow = true; G.add(w); PORT.water = nt;
  }
  // ---- cargo ship at the berth
  {
    const sh = new THREE.Shape(); sh.moveTo(-110, -16); sh.lineTo(92, -16); sh.quadraticCurveTo(122, -12, 132, 0); sh.quadraticCurveTo(122, 12, 92, 16); sh.lineTo(-110, 16); sh.quadraticCurveTo(-118, 12, -118, 0); sh.quadraticCurveTo(-118, -12, -110, -16);
    const mk = (y0, y1, col) => { const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 18 }); g.rotateX(-Math.PI / 2); const m = steel(col, 0.6, 0.35); const me = new THREE.Mesh(g, m); me.position.set(0, y0, PORT.Z1 + 26); me.receiveShadow = true; me.castShadow = true; G.add(me); return me; };
    mk(-9, -1.6, '#7a2620'); mk(-1.6, 9, '#1c2a3a');
    const deckM = steel('#5b5e58', 0.8, 0.3); const deck = new THREE.Mesh(new THREE.ShapeGeometry(sh, 18), deckM); deck.rotation.x = -Math.PI / 2; deck.position.set(0, 9.02, PORT.Z1 + 26); G.add(deck);
    const sz0 = PORT.Z1 + 26; // ship centre line
    // white superstructure with window bands, funnel, mast
    const [wc, wg] = cvs(256, 256); wg.fillStyle = '#e7e6e0'; wg.fillRect(0, 0, 256, 256); for (let r = 0; r < 6; r++) for (let k = 0; k < 12; k++) { wg.fillStyle = '#20262b'; wg.fillRect(8 + k * 20.5, 18 + r * 40, 14, 14); } grime(wg, 256, 256, 0.3, 0);
    const supM = new THREE.MeshStandardMaterial({ map: ctex(wc), roughness: 0.6, metalness: 0.1 });
    add(bx(16, 22, 30), supM, -98, 20, sz0); add(bx(6, 1.2, 40), supM, -92, 30.5, sz0);
    const fun = add(bx(7, 10, 8), steel('#1c2a3a', 0.6, 0.4), -108, 36, sz0); add(bx(7.05, 2, 8.05), new THREE.MeshStandardMaterial({ color: '#c8452a', roughness: 0.6 }), -108, 37, sz0);
    add(new THREE.CylinderGeometry(0.25, 0.3, 12, 8), steel('#d8d6cf'), -96, 37, sz0);
    // deck cargo: container bays stacked across the beam
    const shipInst = LINES.map(() => []);
    for (let bay = 0; bay < 13; bay++) for (let row = 0; row < 11; row++) {
      const x = -76 + bay * 13.2, z = sz0 - 13 + row * 2.6; const hh = 2 + ((Math.sin(bay * 3.1 + row * 1.7) * 0.5 + 0.5) * 4) | 0;
      if (x > 100 && Math.abs(z - sz0) > 9) continue;
      for (let k = 0; k < hh; k++) shipInst[(Math.random() * LINES.length) | 0].push([x, 9.02 + k * CT.H + CT.H / 2, z]);
    }
    shipInst.forEach((L, v) => { if (!L.length) return; const m = new THREE.InstancedMesh(geo, mats[v], L.length); L.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.rotation.set(0, Math.random() < 0.5 ? 0 : Math.PI, 0); o.updateMatrix(); m.setMatrixAt(i, o.matrix); }); m.castShadow = true; m.receiveShadow = true; G.add(m); });
    // name on the bow
    const nm = textDecal('KESTREL STAR', 26, 6.5, 'rgba(240,240,236,0.95)'); nm.rotation.set(0, 0, 0); nm.position.set(98, 5.5, sz0 - 16.1); nm.rotation.y = Math.PI; G.add(nm);
  }
  // ---- ship-to-shore gantry cranes
  for (const cx of [-48, 34]) {
    const red = steel('#b6402a', 0.5, 0.55, 0.06), white = new THREE.MeshStandardMaterial({ color: '#dcdad2', roughness: 0.55, metalness: 0.3 }), dark = steel('#2c2b29', 0.7, 0.7);
    for (const sx of [-1, 1]) for (const z of [84, 108]) { add(bx(1.6, 30, 1.6), red, cx + sx * 9, 15, z); add(bx(2.6, 1.6, 3.2), dark, cx + sx * 9, 0.8, z); portBox(cx + sx * 9 - 1.4, cx + sx * 9 + 1.4, z - 1.7, z + 1.7, 0, 30, { noTop: true }); }
    for (const z of [84, 108]) add(bx(19.6, 2, 1.8), red, cx, 30, z);
    for (const sx of [-1, 1]) { add(bx(1.4, 1.4, 25.6), red, cx + sx * 9, 13, 96); add(bx(1.6, 2.2, 112), white, cx + sx * 4.5, 36, 112); }
    for (const z of [62, 100, 140, 166]) add(bx(10.6, 1, 1), white, cx, 35.5, z);
    for (const sx of [-1, 1]) { const a = new THREE.Vector3(cx + sx * 9, 31, 96), b = new THREE.Vector3(cx + sx * 3, 54, 96); const leg = add(new THREE.CylinderGeometry(0.6, 0.7, a.distanceTo(b), 10), red, (a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); leg.lookAt(b); leg.rotateX(Math.PI / 2); }
    const ap = new THREE.Vector3(cx, 54, 96); add(bx(7, 3, 3), red, cx, 54, 96);
    for (const tz of [166, 62]) for (const sx of [-1, 1]) { const b = new THREE.Vector3(cx + sx * 4.5, 37, tz); const s = add(new THREE.CylinderGeometry(0.18, 0.18, ap.distanceTo(b), 6), white, (ap.x + b.x) / 2, (ap.y + b.y) / 2, (ap.z + b.z) / 2); s.lookAt(b); s.rotateX(Math.PI / 2); }
    add(bx(10, 6, 9), white, cx, 40, 66); add(bx(5, 3, 6), red, cx, 33, 126); const cab = add(bx(3, 3, 3.5), white, cx, 32, 120); void cab;
    // spreader lowering a container onto the quay
    const sy = 18 + (cx > 0 ? 6 : 0);
    for (const sx of [-1, 1]) add(new THREE.CylinderGeometry(0.04, 0.04, 33 - sy, 4), dark, cx + sx * 2.5, (33 + sy) / 2, 126, 0, false);
    add(bx(12.4, 0.6, 2.6), steel('#d0a21e'), cx, sy, 126);
    const lift = new THREE.InstancedMesh(geo, mats[cx > 0 ? 1 : 0], 1); o.position.set(cx, sy - 1.6, 126); o.rotation.set(0, Math.PI / 2, 0); o.updateMatrix(); lift.setMatrixAt(0, o.matrix); lift.castShadow = true; G.add(lift);
    const lamp = new THREE.MeshStandardMaterial({ color: '#ff3a2a', emissive: '#ff2010', emissiveIntensity: 3 }); add(new THREE.SphereGeometry(0.35, 8, 6), lamp, cx, 56, 96, 0, false);
  }
  // ---- rubber-tyred gantries over two stack blocks
  for (const [cx, z0, z1] of [[-30, -110, -90], [30, 54, 74]]) {
    const yel = steel('#d4a51e', 0.5, 0.45), dark = steel('#232220', 0.8, 0.5);
    for (const sx of [-1, 1]) for (const z of [z0, z1]) { add(bx(1.2, 19, 1.4), yel, cx + sx * 4, 9.5, z); for (const w of [-1, 1]) add(new THREE.CylinderGeometry(0.7, 0.7, 0.6, 18), dark, cx + sx * 4 + w * 1.2, 0.7, z, 0, true).rotation.z = Math.PI / 2; portBox(cx + sx * 4 - 1.8, cx + sx * 4 + 1.8, z - 1.2, z + 1.2, 0, 19, { noTop: true }); }
    for (const sx of [-1, 1]) add(bx(1.2, 1.8, z1 - z0 + 1.4), yel, cx + sx * 4, 19.5, (z0 + z1) / 2);
    for (const z of [z0, z1]) add(bx(9.2, 1.4, 1.4), yel, cx, 19.5, z);
    add(bx(4, 2.4, 3.5), yel, cx, 21, (z0 + z1) / 2 + 3); add(bx(2.6, 2.2, 2.6), steel('#e3e1da'), cx + 2.5, 17.5, (z0 + z1) / 2 + 3);
  }
  // ---- light masts
  PORT.lampM = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffe2a8', emissiveIntensity: 0.4 });
  const poolTex = (() => { const [c, g] = cvs(256, 256); const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, 'rgba(255,225,170,0.55)'); gr.addColorStop(0.5, 'rgba(255,210,150,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return ctex(c); })();
  PORT.pools = [];
  for (const [x, z] of [[-60, -46], [60, -46], [-60, 46], [60, 46], [0, -82], [-60, 100], [60, 100], [0, 112 - 30]]) {
    const pm = steel('#8f908c', 0.5, 0.8); add(new THREE.CylinderGeometry(0.25, 0.45, 32, 12), pm, x, 16, z);
    add(bx(4.2, 0.3, 4.2), pm, x, 32, z); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283; add(bx(0.9, 0.5, 0.5), PORT.lampM, x + Math.cos(a) * 1.6, 31.6, z + Math.sin(a) * 1.6, -a, false); }
    portBox(x - 0.6, x + 0.6, z - 0.6, z + 0.6, 0, 32, { noTop: true });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: true })); pl.rotation.x = -Math.PI / 2; pl.position.set(x, 0.05, z); pl.visible = false; G.add(pl); PORT.pools.push(pl);
  }
  // ---- puddles (mirror-like in the low sun)
  {
    const [c, g] = cvs(256, 256); for (let k = 0; k < 7; k++) { const x = 70 + Math.random() * 116, y = 70 + Math.random() * 116, r = 30 + Math.random() * 50; const gr = g.createRadialGradient(x, y, r * 0.2, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }
    const am = ctex(c, false); const pm = new THREE.MeshStandardMaterial({ color: '#121416', roughness: 0.02, metalness: 0.0, envMapIntensity: 1.6, alphaMap: am, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3 });
    for (let i = 0; i < 26; i++) { const p = PORT.free ? null : null; void p; const x = rnd(-120, 120), z = rnd(-120, 110); const s = rnd(4, 11); const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s * rnd(0.5, 1)), pm); m.rotation.set(-Math.PI / 2, 0, rnd(0, 6)); m.position.set(x, 0.03, z); m.receiveShadow = true; G.add(m); }
  }
  // lane markings: dashed yellow centre lines and white edge lines on the main roads
  for (const z of [-82, -46, 46, 82]) for (let x = -120; x < 120; x += 6) paint(3, 0.22, x + 1.5, z);
  for (const x of [-60, 0, 60]) for (let z = -120; z < 110; z += 6) paint(0.22, 3, x, z + 1.5);
  for (const z of [100]) for (let x = -120; x < 120; x += 6) paint(3, 0.3, x + 1.5, z, '#e9e6dc', 0.8);
  { const t = textDecal('BERTH 4', 14, 7); t.position.set(-10, 0.03, 104); G.add(t); const t2 = textDecal('SLOW', 9, 4.5, 'rgba(240,238,230,0.85)'); t2.position.set(0, 0.03, -70); t2.rotation.z = Math.PI; G.add(t2); }
  { // flush the painted markings as one instanced mesh per colour
    const [lc, lg] = cvs(64, 64); lg.fillStyle = '#fff'; lg.fillRect(0, 0, 64, 64); lg.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { lg.fillStyle = `rgba(0,0,0,${Math.random() * 0.9})`; lg.fillRect(Math.random() * 64, Math.random() * 64, 1 + Math.random() * 5, 1 + Math.random() * 3); }
    const worn = ctex(lc, false); const pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
    for (const k in PAINT) { const P = PAINT[k]; const m = new THREE.MeshStandardMaterial({ color: P.col, roughness: 0.75, transparent: true, opacity: P.a, alphaMap: worn, polygonOffset: true, polygonOffsetFactor: -1, depthWrite: false }); const im = new THREE.InstancedMesh(pg, m, P.L.length); P.L.forEach(([w, d, x, z], i) => { o.position.set(x, 0.02, z); o.rotation.set(0, 0, 0); o.scale.set(w, 1, d); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }); o.scale.set(1, 1, 1); im.receiveShadow = true; G.add(im); }
  }
  // ---- perimeter fence and warehouses
  {
    const [fc, fg] = cvs(128, 128); fg.strokeStyle = 'rgba(190,195,195,1)'; fg.lineWidth = 3; for (let i = -128; i < 256; i += 16) { fg.beginPath(); fg.moveTo(i, 0); fg.lineTo(i + 128, 128); fg.stroke(); fg.beginPath(); fg.moveTo(i + 128, 0); fg.lineTo(i, 128); fg.stroke(); }
    const fenceM = new THREE.MeshStandardMaterial({ map: ctex(fc, true, [1, 1]), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, metalness: 0.7, roughness: 0.4 }); fenceM.map.wrapS = fenceM.map.wrapT = THREE.RepeatWrapping;
    const postM = steel('#7d7f7c', 0.5, 0.8);
    const fence = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0); const f = new THREE.Mesh(new THREE.PlaneGeometry(L, 3.4), fenceM.clone()); f.material.map = fenceM.map.clone(); f.material.map.repeat.set(L / 1.6, 3.4 / 1.6); f.material.map.needsUpdate = true; f.position.set((x0 + x1) / 2, 1.7, (z0 + z1) / 2); f.rotation.y = -Math.atan2(z1 - z0, x1 - x0); G.add(f);
      const n = Math.ceil(L / 3); const pg = new THREE.CylinderGeometry(0.05, 0.05, 3.6, 6); const im = new THREE.InstancedMesh(pg, postM, n + 1); for (let i = 0; i <= n; i++) { o.position.set(x0 + (x1 - x0) * i / n, 1.8, z0 + (z1 - z0) * i / n); o.rotation.set(0, 0, 0); o.updateMatrix(); im.setMatrixAt(i, o.matrix); } G.add(im); };
    const E = 1.2; fence(PORT.X0 - E, PORT.Z0 - E, PORT.X1 + E, PORT.Z0 - E); fence(PORT.X0 - E, PORT.Z0 - E, PORT.X0 - E, PORT.Z1); fence(PORT.X1 + E, PORT.Z0 - E, PORT.X1 + E, PORT.Z1);
    // warehouses
    const [hc, hg] = cvs(1024, 256); hg.fillStyle = '#9da3a6'; hg.fillRect(0, 0, 1024, 256); ribShade(hg, 0, 1024, 0, 256, 80, 0.12);
    for (const dx of [140, 520, 860]) { hg.fillStyle = '#5b5f61'; hg.fillRect(dx, 110, 120, 146); hg.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 112; y < 256; y += 8) hg.fillRect(dx, y, 120, 2); }
    eroded(hg, (q) => { q.fillStyle = 'rgba(30,60,90,0.9)'; q.font = '900 70px Impact, Arial Black, sans-serif'; q.fillText('WRECKLINE STEVEDORING', 150, 75); }, 1024, 256); grime(hg, 1024, 256, 0.8, 0);
    const shedM = new THREE.MeshStandardMaterial({ map: ctex(hc), roughness: 0.6, metalness: 0.4 }), roofM = steel('#6f7375', 0.6, 0.5);
    for (const [x, z, w, d, ry] of [[-70, -160, 80, 30, 0], [40, -160, 70, 30, 0], [-170, -40, 70, 30, Math.PI / 2], [-170, 60, 60, 30, Math.PI / 2], [170, -30, 80, 30, -Math.PI / 2], [170, 70, 50, 30, -Math.PI / 2]]) {
      const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const b = new THREE.Mesh(bx(w, 14, d), [roofM, roofM, roofM, roofM, shedM, shedM]); b.position.y = 7; b.castShadow = b.receiveShadow = true; g.add(b);
      const r = new THREE.Mesh(bx(w + 1, 0.6, d + 1), roofM); r.position.y = 14.3; g.add(r); G.add(g);
    }
    // distant skyline and hills
    const [cc, cg] = cvs(256, 512); cg.fillStyle = '#3d434a'; cg.fillRect(0, 0, 256, 512); for (let r = 0; r < 40; r++) for (let k = 0; k < 16; k++) { const lit = Math.random() < 0.18; cg.fillStyle = lit ? `rgba(255,${200 + Math.random() * 40},140,0.95)` : `rgba(${20 + Math.random() * 25},${28 + Math.random() * 25},${36 + Math.random() * 25},1)`; cg.fillRect(6 + k * 15.5, 6 + r * 12.6, 10, 8); }
    const cityTex = ctex(cc); const [ec, eg] = cvs(256, 512); eg.fillStyle = '#000'; eg.fillRect(0, 0, 256, 512); { const id = cg.getImageData(0, 0, 256, 512); const d = id.data; for (let i = 0; i < d.length; i += 4) { const lit = d[i] > 200; d[i] = d[i + 1] = d[i + 2] = lit ? 255 : 0; } eg.putImageData(id, 0, 0); }
    PORT.cityM = new THREE.MeshStandardMaterial({ map: cityTex, emissiveMap: ctex(ec), emissive: '#ffd9a0', emissiveIntensity: 0, roughness: 0.5, metalness: 0.3 });
    const roofC = new THREE.MeshStandardMaterial({ color: '#2e3135', roughness: 0.9 });
    for (let i = 0; i < 46; i++) { const a = rnd(-2.75, -0.4), d = rnd(400, 620), x = Math.cos(a) * d, z = Math.sin(a) * d, h = rnd(16, 75), w = rnd(18, 40), dd = rnd(18, 40); const m = PORT.cityM.clone(); m.map = cityTex.clone(); m.map.needsUpdate = true; m.map.wrapS = m.map.wrapT = THREE.RepeatWrapping; m.map.repeat.set(w / 30, h / 60); m.emissiveMap = m.emissiveMap.clone(); m.emissiveMap.needsUpdate = true; m.emissiveMap.wrapS = m.emissiveMap.wrapT = THREE.RepeatWrapping; m.emissiveMap.repeat.copy(m.map.repeat); (PORT.cityMs = PORT.cityMs || []).push(m);
      const b = new THREE.Mesh(bx(w, h, dd), [m, m, roofC, roofC, m, m]); b.position.set(x, h / 2, z); b.rotation.y = rnd(-0.3, 0.3); G.add(b); }
    const hillM = new THREE.MeshStandardMaterial({ color: '#6a6250', roughness: 1, flatShading: true });
    for (let i = 0; i < 14; i++) { const a = rnd(-3.1, 0.0), d = rnd(700, 900); const h = new THREE.Mesh(new THREE.ConeGeometry(rnd(120, 220), rnd(60, 140), 7), hillM); h.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); G.add(h); }
  }
  G.traverse((m) => { if (m.isMesh) m.matrixAutoUpdate = true; });
}
// per-frame port effects: water drift, lamps at night
function portFx(dt) {
  if (!PORT.built || WORLD.mode !== 'port') return;
  if (PORT.water) { PORT.water.offset.x += dt * 0.004; PORT.water.offset.y += dt * 0.0025; }
  ganFx(dt);
  const night = curTime === 'night'; if (PORT.lampM) PORT.lampM.emissiveIntensity = night ? 6 : 0.4; if (PORT.cityMs) for (const m of PORT.cityMs) m.emissiveIntensity = night ? 1.6 : 0; if (PORT.pools) for (const p of PORT.pools) p.visible = night;
}

// ============================================================ CONTAINER PORT: the Big Dropper (a gantry crane that drops containers on rigs)
const GAN = { built: false, x: 0, vx: 0, tz: 0, state: 'seek', t: 0, cd: 6, sy: 12.5, cy: 0, cvy: 0, dropped: [], legs: [], target: null, X0: -36, X1: 36, Z: 11, drops: 0 };
function ganBuild() {
  if (GAN.built) return; GAN.built = true;
  const G = new THREE.Group(); GAN.g = G; PORT.group.add(G);
  const yel = new THREE.MeshStandardMaterial({ color: '#d9a81c', roughness: 0.5, metalness: 0.45 }); weather(yel, 0.12, 0.3);
  const dark = new THREE.MeshStandardMaterial({ color: '#232220', roughness: 0.8, metalness: 0.5 });
  const [hc, hg] = cvs(64, 256); for (let i = 0; i < 16; i++) { hg.fillStyle = i % 2 ? '#141414' : '#e2b322'; hg.beginPath(); hg.moveTo(0, i * 32 - 32); hg.lineTo(64, i * 32); hg.lineTo(64, i * 32 + 16); hg.lineTo(0, i * 32 - 16); hg.fill(); }
  const haz = new THREE.MeshStandardMaterial({ map: ctex(hc), roughness: 0.6 });
  const box = (w, h, d, m, x, y, z, par = G) => { const me = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; par.add(me); return me; };
  const H = 19, S = GAN.Z;
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) { box(1.3, H, 1.3, yel, sx * 3.6, H / 2, sz * S); box(1.32, 3, 1.32, haz, sx * 3.6, 1.5 + 0.3, sz * S); for (const w of [-1, 1]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.62, 20), dark); t.rotation.z = Math.PI / 2; t.position.set(sx * 3.6 + w * 0.0, 0.75, sz * S + w * 1.3); t.castShadow = true; G.add(t); } }
    box(8.6, 1.2, 1.4, yel, 0, 1.6, sz * S); box(8.6, 1.6, 1.6, yel, 0, H + 0.8, sz * S);
  }
  for (const sx of [-1, 1]) box(1.3, 1.8, 2 * S + 1.6, yel, sx * 3.6, H + 0.9, 0);
  box(3.4, 2.2, 3.4, yel, 2.2, H + 2.7, -S + 2); box(2.4, 2.2, 2.4, new THREE.MeshStandardMaterial({ color: '#e2e0d8', roughness: 0.5 }), -2.6, H - 2.2, S - 2.5); // machinery house, operator cab
  GAN.beacons = []; const bm = new THREE.MeshStandardMaterial({ color: '#ffb020', emissive: '#ff9a10', emissiveIntensity: 0.3 });
  for (const [x, z] of [[3.6, S], [-3.6, S], [3.6, -S], [-3.6, -S]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), bm); b.position.set(x, H + 1.9, z); G.add(b); GAN.beacons.push(b); }
  GAN.beaconM = bm;
  // trolley that rides the girders, with the spreader and the container on cables
  const T = new THREE.Group(); G.add(T); GAN.trolley = T; box(8.2, 1.4, 3.2, yel, 0, H + 2.4, 0, T); box(2, 1.2, 2.2, dark, 0, H + 3.6, 0, T);
  GAN.cables = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1, 5), dark); c.position.set(sx * 2.4, 0, sz * 0.8); T.add(c); GAN.cables.push(c); }
  const sp = new THREE.Group(); T.add(sp); GAN.spreader = sp; box(12.4, 0.5, 2.5, yel, 0, 0, 0, sp); box(1.2, 0.8, 1.6, dark, 0, 0.5, 0, sp);
  const mats = portMaterials(); GAN.mats = mats;
  GAN.box = new THREE.Mesh(new THREE.BoxGeometry(CT.L, CT.H, CT.W), mats[(Math.random() * mats.length) | 0]); GAN.box.castShadow = GAN.box.receiveShadow = true; PORT.group.add(GAN.box);
  // red target ring painted under the drop point during the warning
  const [rc, rg] = cvs(256, 256); rg.strokeStyle = 'rgba(255,40,20,1)'; rg.lineWidth = 16; rg.beginPath(); rg.arc(128, 128, 104, 0, 6.283); rg.stroke(); rg.lineWidth = 8; rg.beginPath(); rg.moveTo(128, 20); rg.lineTo(128, 236); rg.moveTo(20, 128); rg.lineTo(236, 128); rg.stroke();
  GAN.ring = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: ctex(rc), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); GAN.ring.rotation.x = -Math.PI / 2; GAN.ring.visible = false; PORT.group.add(GAN.ring);
  GAN.legs = []; for (const sz of [-1, 1]) for (const sx of [-1, 1]) GAN.legs.push({ x: 0, z: sz * S, r: 1.5, ox: sx * 3.6, gan: true });
  GAN.H = H; ganPose();
}
function ganPose() {
  if (!GAN.g) return; GAN.g.position.set(GAN.x, 0, 0); GAN.trolley.position.z = GAN.tz;
  const top = GAN.H + 1.7; GAN.spreader.position.y = GAN.sy; for (const c of GAN.cables) { const L = Math.max(0.2, top - GAN.sy); c.scale.y = L; c.position.y = GAN.sy + L / 2; }
  for (const l of GAN.legs) l.x = GAN.x + l.ox;
  if (GAN.state !== 'drop' && GAN.state !== 'empty') { GAN.box.visible = GAN.state !== 'reload' || GAN.t < 0; GAN.box.position.set(GAN.x, GAN.sy - 0.25 - CT.H / 2, GAN.tz); GAN.box.rotation.set(0, 0, 0); }
}
function ganReset() {
  if (!GAN.built) return;
  for (const d of GAN.dropped) { d.m.removeFromParent(); ganUnbox(d.b); } GAN.dropped.length = 0; portBuildNav();
  Object.assign(GAN, { x: 0, vx: 0, tz: 0, state: 'seek', t: 0, cd: 6, sy: 12.5, target: null, drops: 0 }); GAN.box.visible = true; GAN.ring.visible = false; ganPose();
}
function ganUnbox(b) {
  const i = PORT.boxes.indexOf(b); if (i >= 0) PORT.boxes.splice(i, 1);
  for (const L of PORT.cells.values()) { const k = L.indexOf(b); if (k >= 0) L.splice(k, 1); }
}
function ganStep(dt) {
  if (!GAN.built || WORLD.mode !== 'port' || NET.role === 'guest') return;
  GAN.cd -= dt; GAN.t -= dt;
  const live = vehicles.filter((v) => v.alive);
  // pick a victim: whoever is closest to the crane's rails (rigs right under it first)
  const score = (v) => Math.abs(v.pos.x - GAN.x) + Math.max(0, Math.abs(v.pos.z) - (GAN.Z - 2)) * 4 + (v.y > 3 ? 40 : 0);
  if (GAN.state === 'seek') {
    let best = null, bs = 70; for (const v of live) { const s = score(v); if (s < bs) { bs = s; best = v; } } GAN.target = best;
    const tx = best ? clamp(best.pos.x, GAN.X0, GAN.X1) : 0, tz = best ? clamp(best.pos.z, -GAN.Z + 2.2, GAN.Z - 2.2) : 0;
    const ax = clamp((tx - GAN.x) * 1.2 - GAN.vx * 1.6, -5, 5); GAN.vx = clamp(GAN.vx + ax * dt, -8, 8); GAN.x = clamp(GAN.x + GAN.vx * dt, GAN.X0, GAN.X1);
    GAN.tz += clamp(tz - GAN.tz, -6 * dt, 6 * dt);
    if (best && GAN.cd <= 0 && Math.abs(best.pos.x - GAN.x) < 2.6 && Math.abs(best.pos.z - GAN.tz) < 1.8 && Math.abs(best.pos.z) < GAN.Z - 1.5 && best.y < 3.5) {
      GAN.state = 'warn'; GAN.t = 1.35; GAN.vx = 0; sfx.siren && sfx.siren(player ? player.pos.distanceTo(best.pos) : 0); netEv && netEv('G');
    }
  } else if (GAN.state === 'warn') {
    if (GAN.t <= 0) { GAN.state = 'drop'; GAN.cy = GAN.sy - 0.25 - CT.H / 2; GAN.cvy = 0; sfx.click(); }
  } else if (GAN.state === 'drop') {
    GAN.cvy -= 26 * dt; GAN.cy += GAN.cvy * dt;
    const x = GAN.x, z = GAN.tz, bot = GAN.cy - CT.H / 2;
    // crush anything under the box
    for (const v of live) {
      if (v.crushT && game.t - v.crushT < 1) continue;
      if (Math.abs(v.pos.x - x) < CT.L / 2 + v.box.hx * 0.3 && Math.abs(v.pos.z - z) < CT.W / 2 + v.box.hx * 0.8 && bot < v.y + Math.min(2.2, v.box.hy * 0.7) && bot > v.y - 1) {
        v.crushT = game.t; const dmg = v.isPlayer ? 70 : 230; v.damage(dmg, null, V3(0, -1, 0), null, 'ram'); { const pc = v.pieces.filter((q) => q.attached && /Roof|Hood|Grille/.test(q.key)); for (const q of pc.slice(0, 2)) v.detachPiece(q, V3(rnd(-1, 1), 1, rnd(-1, 1)), null); }
        const side = Math.sign(v.pos.z - z) || 1; v.vel.z += side * 14; v.vel.x += (v.pos.x - x) * 1.2; v.yawV += rnd(-2, 2); v.air = true; v.vy = 5;
        sparks(v.root.position.clone().add(V3(0, 2, 0)), V3(0, 1, 0), 26); shake(0.5, v.pos); sfx.clang(); if (v.isPlayer) rumble(1, 1, 400);
      }
    }
    const g = portGround(x, z, bot + 0.5);
    if (bot <= g) { // landed
      GAN.cy = g + CT.H / 2; const b = portBox(x - CT.L / 2, x + CT.L / 2, z - CT.W / 2, z + CT.W / 2, g, g + CT.H, { dropped: true });
      const m = new THREE.Mesh(GAN.box.geometry, GAN.box.material); m.position.set(x, GAN.cy, z); m.rotation.y = Math.random() < 0.5 ? 0 : Math.PI; m.castShadow = m.receiveShadow = true; PORT.group.add(m);
      GAN.dropped.push({ m, b }); if (GAN.dropped.length > 8) { const o = GAN.dropped.shift(); o.m.removeFromParent(); ganUnbox(o.b); }
      portBuildNav(); GAN.box.visible = false; GAN.drops++;
      const at = V3(x, g + 0.3, z); shake(0.7, at); sfx.slam(); sfx.boom(0.7); flash(at, 30, 0.08, '#ffd090');
      for (let i = 0; i < 40; i++) { const a = rnd(0, 6.28); emit(PS_NORM, at.clone().add(V3(Math.cos(a) * rnd(1, 6), 0, Math.sin(a) * rnd(0.5, 2))), V3(Math.cos(a) * rnd(3, 8), rnd(0.5, 2.5), Math.sin(a) * rnd(2, 5)), rnd(1.5, 2.8), 1.5, rnd(5, 9), COL.dust, 0.5, COL.dust2, 0); }
      netEv && netEv('D', r2(x), r2(z), r2(g));
      GAN.state = 'reload'; GAN.t = 3.2;
    }
  } else if (GAN.state === 'reload') {
    GAN.sy += (16 - GAN.sy) * Math.min(1, dt * 1.5);
    if (GAN.t <= 0) { GAN.box.material = GAN.mats[(Math.random() * GAN.mats.length) | 0]; GAN.box.visible = true; GAN.sy = 12.5; GAN.state = 'seek'; GAN.cd = 4.5; }
  }
  if (GAN.state === 'drop') { GAN.box.position.set(GAN.x, GAN.cy, GAN.tz); }
  ganPose();
}
// visual-only bits every frame (beacons, ring) plus the guest's copy
function ganFx(dt) {
  if (!GAN.built) return;
  const warn = GAN.state === 'warn', k = warn ? (Math.sin(performance.now() / 70) > 0 ? 9 : 0.5) : (Math.sin(performance.now() / 400) > 0.6 ? 3 : 0.3);
  GAN.beaconM.emissiveIntensity = k;
  GAN.ring.visible = warn; if (warn) { const g = portGround(GAN.x, GAN.tz, 0.5); GAN.ring.position.set(GAN.x, g + 0.06, GAN.tz); const s = 0.8 + 0.2 * Math.sin(performance.now() / 90); GAN.ring.scale.setScalar(s); }
}
function ganNet() { return GAN.built ? [r2(GAN.x), r2(GAN.tz), ['seek', 'warn', 'drop', 'reload'].indexOf(GAN.state), r2(GAN.cy), r2(GAN.sy)] : null; }
function ganApply(a) {
  if (!a || !GAN.built) return; [GAN.x, GAN.tz] = [a[0], a[1]]; const st = ['seek', 'warn', 'drop', 'reload'][a[2]] || 'seek'; if (st === 'warn' && GAN.state !== 'warn') sfx.siren && sfx.siren(0);
  GAN.state = st; GAN.cy = a[3]; GAN.sy = a[4]; if (st === 'drop') GAN.box.position.set(GAN.x, GAN.cy, GAN.tz); GAN.box.visible = st !== 'reload'; ganPose();
}
function ganGuestDrop(x, z, g) {
  if (!GAN.built) return; const b = portBox(x - CT.L / 2, x + CT.L / 2, z - CT.W / 2, z + CT.W / 2, g, g + CT.H, { dropped: true });
  const m = new THREE.Mesh(GAN.box.geometry, GAN.box.material); m.position.set(x, g + CT.H / 2, z); m.castShadow = m.receiveShadow = true; PORT.group.add(m); GAN.dropped.push({ m, b });
  if (GAN.dropped.length > 8) { const o = GAN.dropped.shift(); o.m.removeFromParent(); ganUnbox(o.b); }
  shake(0.5, V3(x, g, z)); sfx.slam(); sfx.boom(0.6);
}

window.__sk = { vehicles, game, debris, keys, get player() { return player; },
  sim(sec, dt = 1 / 30) { for (let t = 0; t < sec; t += dt) { game.t += dt; if (game.state === 'cine') cineStep(dt, []); else if (game.state === 'combat') combatStep(dt, []); if (NET.role === 'host') hostSnap(dt); else if (game.state === 'over') { for (const v of vehicles) v.update(dt, {}); updateDebris(dt); } updatePS(PS_ADD, dt); updatePS(PS_NORM, dt); kPressed.clear(); } },
  kit: { PORT, GAN, ganStep, portSeg, portGround, enterPortWorld, leavePortWorld, THREE, V3, Vehicle, vehicles, scene, camera, game, ESC, CINE, load, props, debris, rockets, get player() { return player; }, set player(v) { player = v; }, fxStep, renderFrame, combatStep, cineStep, startEscape, startCombat, enterGarage, cineCam, caption, swapWeapon, launchHarpoon, releaseHarpoon, updateHarpoon, fireRocket, explosion, strike, makeBarrel, makeTires, spawnDummy: (d, s, o) => spawnDummy(d, s, o), removeVehicle, pathX, escGrid: (x, z) => escGrid(x, z), roadH, height, ENEMY_PAINT, setNight, enterEscapeWorld, leaveEscapeWorld, placeProps, clearWorld, collapseBridge, spawnCrate, updateBullets, updateRockets, updateDebris, collisions, propCollisions, escapeStep, escSpawn, introCine, endingCine, clearTutorial, set camYaw(v) { camYaw = v; } },
  press(c) { kPressed.add(c); }, WORLD, startCombat, TUT, ESC, CINE, escH, pathX, openUpgrade, pickUpgrade, props, STATIC, swapWeapon, SET, music, musicTarget, sfx };
// ============================================================ boot
(async () => {
  try {
    await loadAll();
  } catch (e) {
    LMSG.textContent = 'Could not load the rigs. Reload the page to try again.'; console.error(e); return;
  }
  placeWrecks(); placeProps(); applyTime(load.time);
  LMSG.textContent = 'Press A or Enter';
  const sb = $('startbtn'); sb.hidden = false; sb.focus();
  game.state = 'title';
  garageRig = new Vehicle(load.type, { ...load }, true); garageRig.place(0, 0, 0.6);
  sb.onclick = () => { sfx.init(); music.start(); $('loading').style.display = 'none'; enterGarage(); };
  requestAnimationFrame(tick);
})();
