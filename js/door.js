// 3D-интро: прихожая с белой филёнчатой дверью и рамками с работами Алексея.
// Скролл открывает дверь, камера проходит в коридор, в конце коридора — такая же дверь.
// Вся геометрия собрана кодом (метры), без внешних моделей.
import * as THREE from 'three';
import { RoomEnvironment } from '../vendor/three/addons/RoomEnvironment.js';
import { RoundedBoxGeometry } from '../vendor/three/addons/RoundedBoxGeometry.js';

const W = 0.86, H = 2.06, WALL_T = 0.12;      // проём
const LT = 0.04;                              // толщина полотна
const CORR = { w: 1.7, d: 4.6, h: 2.75 };     // коридор за дверью
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const span = (p, a, b) => ease(clamp((p - a) / (b - a)));

export function createDoor(canvas, { frames, mobile }) {
  // preserveDrawingBuffer на телефоне: иначе мобильный Safari мигает пустым canvas при скролле sticky-блока
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: mobile });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#d9d1c5');
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 40);

  const M = {
    enamel: new THREE.MeshPhysicalMaterial({ color: '#f4f2ee', roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    panel: new THREE.MeshPhysicalMaterial({ color: '#efece6', roughness: 0.4, clearcoat: 0.3 }),
    wall: new THREE.MeshStandardMaterial({ color: '#ddd5c9', roughness: 0.95 }),
    corr: new THREE.MeshStandardMaterial({ color: '#cbc4c8', roughness: 0.95 }),
    ceil: new THREE.MeshStandardMaterial({ color: '#f1eee9', roughness: 1 }),
    metal: new THREE.MeshStandardMaterial({ color: '#c9c6c0', metalness: 1, roughness: 0.28 }),
    walnut: new THREE.MeshStandardMaterial({ color: '#4a3020', roughness: 0.55 }),
    mat: new THREE.MeshStandardMaterial({ color: '#f6f4f0', roughness: 0.9 }),
    floor: new THREE.MeshStandardMaterial({ map: planks(), roughness: 0.62 }),
    glow: new THREE.MeshBasicMaterial({ color: '#fff4e0' }),
    ceramic: new THREE.MeshStandardMaterial({ color: '#efebe4', roughness: 0.5 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#4d6a43', roughness: 0.55, side: THREE.DoubleSide }),
    stem: new THREE.MeshStandardMaterial({ color: '#5b4632', roughness: 0.8 }),
    black: new THREE.MeshStandardMaterial({ color: '#232120', metalness: 0.6, roughness: 0.45 }),
    rug: new THREE.MeshStandardMaterial({ map: rugTex(), roughness: 1 }),
    glass: new THREE.MeshPhysicalMaterial({ color: '#d5dcda', roughness: 0.18, transparent: true, opacity: 0.62 }),
    room: new THREE.MeshBasicMaterial({ color: '#efe3cf' }),
    graphite: new THREE.MeshStandardMaterial({ color: '#2e2f31', roughness: 0.5 }),
  };

  const mesh = (geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); m.castShadow = m.receiveShadow = shadow;
    parent.add(m); return m;
  };
  const rbox = (w, h, d, r = 0.003) => new RoundedBoxGeometry(w, h, d, 2, r);
  const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);

  // стена с проёмом и плинтус
  const SIDE = 8, WH = 7;
  mesh(box(SIDE, WH, WALL_T), M.wall, -W / 2 - SIDE / 2, WH / 2, 0);
  mesh(box(SIDE, WH, WALL_T), M.wall, W / 2 + SIDE / 2, WH / 2, 0);
  mesh(box(W, WH - H, WALL_T), M.wall, 0, H + (WH - H) / 2, 0);
  for (const s of [-1, 1]) mesh(rbox(SIDE - 0.08, 0.08, 0.016, 0.004), M.enamel, s * (W / 2 + 0.08 + (SIDE - 0.08) / 2), 0.04, WALL_T / 2 + 0.008);

  const front = buildDoor(new THREE.Group());
  scene.add(front.group);

  // коридор за дверью: стены, потолок, плинтусы, дверь в торце
  const { w: cw, d: cd, h: ch } = CORR;
  // стены коридора без приёма теней: иначе ключевой свет рисует через проём резкий треугольник
  mesh(box(0.1, ch, cd), M.corr, -cw / 2 - 0.05, ch / 2, -cd / 2).receiveShadow = false;
  mesh(box(0.1, ch, cd), M.corr, cw / 2 + 0.05, ch / 2, -cd / 2).receiveShadow = false;
  mesh(box(cw + 0.2, 0.1, cd), M.ceil, 0, ch + 0.05, -cd / 2, scene, false);
  for (const s of [-1, 1]) mesh(rbox(0.016, 0.08, cd - 0.1, 0.004), M.enamel, s * (cw / 2 - 0.008), 0.04, -cd / 2);
  const endWall = new THREE.Group();
  endWall.position.z = -cd;
  scene.add(endWall);
  const ew = (cw - W) / 2;
  mesh(box(ew, ch, WALL_T), M.corr, -W / 2 - ew / 2, ch / 2, 0, endWall);
  mesh(box(ew, ch, WALL_T), M.corr, W / 2 + ew / 2, ch / 2, 0, endWall);
  mesh(box(W, ch - H, WALL_T), M.corr, 0, H + (ch - H) / 2, 0, endWall);
  mesh(box(W, H, 0.02), M.ceil, 0, H / 2, -0.04, endWall);            // за дальней дверью — светлое
  for (const s of [-1, 1]) mesh(rbox(ew - 0.08, 0.08, 0.016, 0.004), M.enamel, s * (W / 2 + 0.08 + (ew - 0.08) / 2), 0.04, WALL_T / 2 + 0.008, endWall);
  endWall.add(buildDoor(new THREE.Group()).group);
  endWall.traverse(o => (o.receiveShadow = false));
  // светильники в потолке коридора
  for (const z of [-1.4, -3.2]) {
    const disc = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 32), M.glow, 0, ch - 0.005, z, scene, false);
    disc.receiveShadow = false;
  }
  const corrLight = new THREE.PointLight('#ffe9cc', 4, 6, 1.6);
  corrLight.position.set(0, ch - 0.25, -2.2);
  scene.add(corrLight);

  // рамка с фото работы: строится лицом к +z в группе parent
  const loader = new THREE.TextureLoader();
  let fi = 0;
  function addFrame(parent, x, y, w, h) {
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    parent.add(g);
    const B = 0.03, D = 0.03;
    mesh(rbox(w, B, D, 0.004), M.walnut, 0, h / 2 - B / 2, D / 2, g);
    mesh(rbox(w, B, D, 0.004), M.walnut, 0, -h / 2 + B / 2, D / 2, g);
    mesh(rbox(B, h, D, 0.004), M.walnut, -w / 2 + B / 2, 0, D / 2, g);
    mesh(rbox(B, h, D, 0.004), M.walnut, w / 2 - B / 2, 0, D / 2, g);
    mesh(box(w - B * 2, h - B * 2, 0.004), M.mat, 0, 0, 0.004, g);
    const tex = loader.load(frames[fi++ % frames.length], () => (dirty = true));
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const pw = w - 0.16, ph = h - 0.16;
    tex.repeat.set(Math.min(1, pw / ph), Math.min(1, ph / pw));         // квадратное фото → обрезка под рамку
    tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2);
    mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), 0, 0, 0.0065, g);
  }
  // стена прихожей: рамки справа от двери
  const frontWall = new THREE.Group();
  frontWall.position.z = WALL_T / 2;
  scene.add(frontWall);
  addFrame(frontWall, 1.2, 1.6, 0.62, 0.78);
  addFrame(frontWall, 1.86, 1.9, 0.44, 0.56);
  addFrame(frontWall, 1.86, 1.28, 0.44, 0.56);

  // коридор-шоурум: слева стеклянная дверь, справа раздвижная LOFT, рамки, дорожка
  const wallL = new THREE.Group(), wallR = new THREE.Group();
  wallL.position.x = -cw / 2; wallL.rotation.y = Math.PI / 2;            // локальный +z смотрит в коридор
  wallR.position.x = cw / 2; wallR.rotation.y = -Math.PI / 2;
  scene.add(wallL, wallR);
  // локальный x стены: слева x = -worldZ, справа x = worldZ
  const glassX = 2.35, barnX = -2.55;
  {
    const g = new THREE.Group(); g.position.x = glassX; wallL.add(g);
    const GW = 0.8, GH = 2.02, C = 0.07;
    mesh(box(GW + 0.02, GH, 0.004), M.room, 0, GH / 2, 0.002, g, false);              // светлая комната за стеклом
    mesh(new THREE.PlaneGeometry(GW, GH), M.glass, 0, GH / 2, 0.012, g, false);
    for (const sx of [-1, 1]) mesh(rbox(C, GH + C, 0.022, 0.004), M.walnut, sx * (GW / 2 + C / 2), (GH + C) / 2, 0.011, g);
    mesh(rbox(GW + C * 2, C, 0.022, 0.004), M.walnut, 0, GH + C / 2, 0.011, g);
    mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.32, 16), M.metal, GW / 2 - 0.09, 1.0, 0.045, g);
    for (const y of [0.88, 1.12]) mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.03, 12), M.metal, GW / 2 - 0.09, y, 0.028, g).rotation.x = Math.PI / 2;
  }
  {
    const g = new THREE.Group(); g.position.x = barnX; wallR.add(g);
    mesh(rbox(2.0, 0.035, 0.02, 0.006), M.black, 0.3, 2.24, 0.02, g);
    mesh(rbox(0.94, 2.1, 0.04, 0.006), M.graphite, 0, 1.08, 0.07, g);
    for (const x of [-0.3, 0.3]) {
      mesh(box(0.035, 0.22, 0.006), M.black, x, 2.14, 0.094, g);
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24), M.black, x, 2.24, 0.06, g).rotation.x = Math.PI / 2;
    }
    mesh(rbox(0.022, 0.4, 0.022, 0.008), M.black, -0.36, 1.05, 0.11, g);
  }
  addFrame(wallL, 0.95, 1.5, 0.5, 0.64);
  addFrame(wallL, 3.75, 1.5, 0.5, 0.64);
  addFrame(wallR, -1.05, 1.5, 0.56, 0.7);
  mesh(rbox(0.8, 0.01, 3.4, 0.004), M.rug, 0, 0.005, -2.55).receiveShadow = true;

  // бра слева от двери
  const sconce = new THREE.Group();
  sconce.position.set(0.74, 1.62, WALL_T / 2);
  scene.add(sconce);
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 32), M.walnut, 0, 0, 0.006, sconce).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.12, 12), M.metal, 0, 0, 0.07, sconce).rotation.x = Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.11, 32, 1, true), M.glow, 0, 0.03, 0.14, sconce, false);
  const lamp = new THREE.PointLight('#ffdcae', 1.4, 3, 1.8);
  lamp.position.set(0.74, 1.66, WALL_T / 2 + 0.22);
  scene.add(lamp);


  // интерьер прихожей: стеновые панели, ковёр, растение, скамья
  const strip = (w, h, x, y, parent = scene) => mesh(rbox(w, h, 0.018, 0.005), M.enamel, x, y, WALL_T / 2 + 0.009, parent);
  for (const s of [-1, 1]) {
    const x0 = W / 2 + 0.12, len = 4.2;
    strip(len, 0.045, s * (x0 + len / 2), 0.92);                        // поручень-молдинг
    for (let i = 0; i < 6; i++) {                                       // рамки под ним
      const pw = 0.6, cx = s * (x0 + 0.1 + pw / 2 + i * (pw + 0.1)), cy = 0.5, ph = 0.56, t = 0.022;
      strip(pw, t, cx, cy + ph / 2); strip(pw, t, cx, cy - ph / 2);
      strip(t, ph, cx - pw / 2, cy); strip(t, ph, cx + pw / 2, cy);
    }
  }
  mesh(rbox(1.5, 0.012, 1.0, 0.005), M.rug, 0, 0.006, 0.9).receiveShadow = true;

  const plant = new THREE.Group();
  plant.position.set(-2.95, 0, 0.42);
  scene.add(plant);
  mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.46, 40), M.ceramic, 0, 0.23, 0, plant);
  mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.01, 32), M.stem, 0, 0.44, 0, plant);
  const leafGeo = new THREE.SphereGeometry(1, 20, 10);
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 16; i++) {
    const a = i * 2.4 + rnd(), h = 0.62 + (i / 16) * 0.85, r = 0.08 + rnd() * 0.12;
    const stem = mesh(new THREE.CylinderGeometry(0.008, 0.01, h - 0.4, 6), M.stem, Math.cos(a) * r / 2, 0.4 + (h - 0.4) / 2, Math.sin(a) * r / 2, plant);
    stem.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18);
    const lf = mesh(leafGeo, M.leaf, Math.cos(a) * r, h, Math.sin(a) * r, plant);
    lf.scale.set(0.13, 0.012, 0.085);
    lf.rotation.set(0.5 + rnd() * 0.5, -a, 0.3 + rnd() * 0.4);
  }

  const bench = new THREE.Group();
  bench.position.set(1.5, 0, 0.32);
  scene.add(bench);
  mesh(rbox(1.15, 0.045, 0.36, 0.01), M.walnut, 0, 0.44, 0, bench);
  for (const x of [-0.52, 0.52]) for (const z of [-0.14, 0.14]) mesh(box(0.025, 0.42, 0.025), M.black, x, 0.21, z, bench);
  mesh(rbox(0.3, 0.05, 0.22, 0.004), M.mat, -0.3, 0.488, 0, bench).rotation.y = 0.12;
  mesh(rbox(0.26, 0.04, 0.2, 0.004), M.walnut, -0.29, 0.533, 0.01, bench).rotation.y = -0.08;
  mesh(new THREE.SphereGeometry(0.07, 32, 16), M.ceramic, 0.33, 0.53, 0, bench).scale.y = 1.3;
  mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 6), M.stem, 0.34, 0.66, 0, bench).rotation.z = 0.25;

  // пол
  mesh(new THREE.PlaneGeometry(30, 30), M.floor).rotation.x = -Math.PI / 2;

  // ключевой свет и тёплый свет из коридора
  const key = new THREE.DirectionalLight('#fff3e2', 1.15);
  key.position.set(-2.2, 3.4, 3.2);
  key.castShadow = true;
  key.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -3, right: 3.5, top: 3, bottom: -1, near: 0.5, far: 12 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key);
  const spill = new THREE.SpotLight('#ffe2b8', 0, 7, 0.75, 0.6, 1.2);
  spill.position.set(0.1, 1.9, -1.4);
  spill.target.position.set(0, 0, 2.2);
  spill.castShadow = !mobile;
  spill.shadow.mapSize.set(1024, 1024);
  scene.add(spill, spill.target);

  // путь камеры: прихожая → коридор
  const camA = new THREE.Vector3(-0.1, 1.4, 5.6), camB = new THREE.Vector3(0, 1.4, -0.6);
  const lookA = new THREE.Vector3(-0.62, 1.0, 0), lookB = new THREE.Vector3(0, 1.1, -cd);
  const look = new THREE.Vector3(), start = new THREE.Vector3(), lookS = new THREE.Vector3();
  let p = 0, mx = 0, my = 0, dirty = true, live = true, portrait = false;

  let lastW = 0, lastH = 0;
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h || (w === lastW && h === lastH)) return;
    lastW = w; lastH = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    portrait = camera.aspect < 1;
    camera.fov = portrait ? 52 : 34;
    camera.updateProjectionMatrix();
    dirty = true;
    frame();   // сразу: setSize очищает canvas, без кадра будет вспышка фона
  }

  function frame() {
    if (!live || (!dirty && !mobile)) return;   // телефон: рисуем каждый кадр, без пропусков
    dirty = false;
    const press = Math.sin(clamp(p / 0.12) * Math.PI);           // нажать ручку и отпустить
    for (const l of front.levers) l.rotation.z = 0.5 * press;
    front.hinge.rotation.y = 1.85 * span(p, 0.08, 0.6);          // ~106°, внутрь
    spill.intensity = 14 * span(p, 0.08, 0.45);
    const t = span(p, 0.3, 1);
    start.copy(camA); lookS.copy(lookA);
    if (portrait) { start.set(0, 1.35, 5.2); lookS.set(0, 1.2, 0); } // телефон: дверь по центру
    camera.position.lerpVectors(start, camB, t);
    camera.position.x += mx * 0.12 * (1 - t);
    camera.position.y += my * 0.06 * (1 - t);
    look.lerpVectors(lookS, lookB, t);
    camera.lookAt(look);
    renderer.render(scene, camera);
  }

  // дверь в сборе: коробка, наличник, полотно с филёнками, ручки, петли. Лицом к +z.
  function buildDoor(group) {
    const JT = 0.026, CW = 0.075, CT = 0.014, cz = WALL_T / 2 + CT / 2;
    mesh(box(JT, H, WALL_T + 0.01), M.enamel, -W / 2 + JT / 2, H / 2, 0, group);
    mesh(box(JT, H, WALL_T + 0.01), M.enamel, W / 2 - JT / 2, H / 2, 0, group);
    mesh(box(W, JT, WALL_T + 0.01), M.enamel, 0, H - JT / 2, 0, group);
    for (const z of [cz, -cz]) {
      for (const s of [-1, 1]) mesh(rbox(CW, H + CW - 0.01, CT, 0.004), M.enamel, s * (W / 2 + CW / 2 - 0.012), (H + CW - 0.01) / 2, z, group);
      mesh(rbox(W + CW * 2 - 0.024, CW, CT, 0.004), M.enamel, 0, H + CW / 2 - 0.012, z + Math.sign(z) * 0.0005, group);
    }
    const hinge = new THREE.Group();
    hinge.position.set(-W / 2 + JT + 0.002, 0.006, 0.012);
    group.add(hinge);
    const LWi = W - 0.008 - JT * 2, LH = H - 0.012 - JT;
    mesh(rbox(LWi, LH, LT, 0.004), M.enamel, LWi / 2, LH / 2, 0, hinge);
    for (const side of [1, -1]) {
      for (const [ph, cy] of [[0.98, 1.36], [0.56, 0.5]]) {
        const pw = LWi - 0.2, z = side * (LT / 2 + 0.004), S = 0.024;
        mesh(rbox(pw, S, 0.01), M.enamel, LWi / 2, cy + ph / 2 - S / 2, z, hinge);
        mesh(rbox(pw, S, 0.01), M.enamel, LWi / 2, cy - ph / 2 + S / 2, z, hinge);
        mesh(rbox(S, ph - S * 2, 0.01), M.enamel, LWi / 2 - pw / 2 + S / 2, cy, z, hinge);
        mesh(rbox(S, ph - S * 2, 0.01), M.enamel, LWi / 2 + pw / 2 - S / 2, cy, z, hinge);
        mesh(rbox(pw - 0.09, ph - 0.09, 0.008, 0.003), M.panel, LWi / 2, cy, side * (LT / 2 + 0.002), hinge);
      }
    }
    const levers = [];
    for (const side of [1, -1]) {
      const z = side * (LT / 2 + 0.006);
      mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 40), M.metal, LWi - 0.065, 1.0, z, hinge).rotation.x = Math.PI / 2;
      mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 40), M.metal, LWi - 0.065, 0.86, z, hinge).rotation.x = Math.PI / 2;
      const lev = new THREE.Group();
      lev.position.set(LWi - 0.065, 1.0, side * (LT / 2 + 0.03));
      hinge.add(lev);
      mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.04, 20), M.metal, 0, 0, -side * 0.012, lev).rotation.x = Math.PI / 2;
      mesh(rbox(0.13, 0.018, 0.016, 0.007), M.metal, -0.058, 0, 0, lev);
      levers.push(lev);
    }
    for (const y of [0.25, 1.75]) mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 16), M.metal, 0, y, LT / 2, hinge);
    return { group, hinge, levers };
  }

  new ResizeObserver(resize).observe(canvas);
  renderer.setAnimationLoop(frame);

  return {
    set progress(v) { if (v !== p) { p = v; dirty = true; } },
    pointer(x, y) { mx = x; my = y; dirty = true; },
    set active(v) { live = v; if (v) dirty = true; },
  };
}

// доска пола на canvas: дуб, разбежка швов
function planks() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
  const g = c.getContext('2d');
  const rows = 10, rh = c.height / rows;
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let r = 0; r < rows; r++) {
    let x = -rnd() * 700;
    while (x < c.width) {
      const len = 600 + rnd() * 500;
      g.fillStyle = `hsl(${29 + rnd() * 3} 32% ${44 + rnd() * 4}%)`;
      g.fillRect(x, r * rh, len, rh);
      for (let i = 0; i < 26; i++) {                       // волокна
        g.fillStyle = rnd() > 0.5 ? 'rgba(70,45,25,.07)' : 'rgba(255,240,220,.05)';
        g.fillRect(x, r * rh + rnd() * rh, len, 1 + rnd() * 2);
      }
      g.fillStyle = 'rgba(50,32,20,.22)';
      g.fillRect(x, r * rh, 1.5, rh);
      x += len;
    }
    g.fillStyle = 'rgba(50,32,20,.2)';
    g.fillRect(0, r * rh, c.width, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(15, 15);
  t.anisotropy = 8;
  return t;
}

// ковёр: тёплый серый с каймой
function rugTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 342;
  const g = c.getContext('2d');
  g.fillStyle = '#b9ab98'; g.fillRect(0, 0, c.width, c.height);
  g.strokeStyle = '#8f7f6b'; g.lineWidth = 10; g.strokeRect(22, 22, c.width - 44, c.height - 44);
  g.strokeStyle = '#d6cbbb'; g.lineWidth = 3; g.strokeRect(40, 40, c.width - 80, c.height - 80);
  for (let i = 0; i < 4000; i++) {                                      // ворс
    g.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(60,40,20,.06)';
    g.fillRect(Math.random() * c.width, Math.random() * c.height, 2, 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
