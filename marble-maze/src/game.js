// =====================================================================
//  game.js — the 3D engine & gameplay (Retention v2).
//  Readability-first: RED == death everywhere, FINISH is a bright green
//  beam with particles + an off-screen arrow, walls get bright top caps,
//  and dark biomes are lifted with ambient + emissive caps.
// =====================================================================
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import {
  T, WALL_H, WALL_CAP, MARBLE_R, PHYS, RADII, STARS, POWERUPS,
  DANGER, DANGER_DARK, FINISH_COLOR, MOVER_COLOR, GOLD_RUSH, CAMERA, FX,
} from './config.js';
import { drawMarbleTexture } from './marbletex.js';

const UP = new THREE.Vector3(0, 1, 0);
const tmpV = new THREE.Vector3();

// Display-space color grade (final composer pass): a gentle saturation +
// contrast lift so the render reads as vivid, punchy hypercasual art.
const GRADE_SHADER = {
  uniforms: {
    tDiffuse:   { value: null },
    saturation: { value: 1.24 },
    contrast:   { value: 1.08 },
    brightness: { value: 1.01 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float saturation; uniform float contrast; uniform float brightness;
    varying vec2 vUv;
    void main(){
      vec4 t = texture2D(tDiffuse, vUv);
      vec3 c = t.rgb * brightness;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));   // perceived luminance
      c = mix(vec3(l), c, saturation);                  // saturate
      c = (c - 0.5) * contrast + 0.5;                   // contrast about mid-grey
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), t.a);
    }`,
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.cb = {};
    this.state = 'idle';
    this.level = null;
    this.timeScale = 1;
    this.clockMs = 0;
    this._t = 0;
    this.activePowerups = new Map();
    this.coinsCollected = 0;
    this.combo = 0; this.comboTimer = 0;
    this.shield = false;
    this.radius = MARBLE_R; this.baseRadius = MARBLE_R;
    this.skinDef = null; this.trailDef = null;
    this.forgive = 0;
    this.wallsPhased = false; this.phaseAmt = 0;
    this.holesPatched = false;
    this.gold = { active: false, timer: 0, times: [], coins: [] };
    this.idleTimer = 0; this._idleFired = false;
    // perf
    this.autoQuality = true; this.qfixed = null; this._fpsAcc = 0; this._fpsN = 0; this._degraded = 0;

    this._initRenderer();
    this._initScene();
    this._initPost();
    this._initParticles();
    this._geo = {};
    this._texCache = {};
    this.levelGroup = new THREE.Group();
    this.scene.add(this.levelGroup);

    window.addEventListener('resize', this._onResize);
  }
  setCallbacks(cb) { this.cb = cb || {}; }

  _initRenderer() {
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.14;   // a touch punchier — bloom + saturation lift
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = r;
    this.shadowSize = 1024;   // lighter startup + smoother on weak devices
  }

  // Post FX: scene -> bloom -> tone-mapped output. r160 skips tone mapping when
  // drawing to a render target, so OutputPass re-applies ACES + sRGB exactly
  // once, keeping the base look and adding a controllable glow on emissives.
  _initPost() {
    try {
      const w = window.innerWidth, h = window.innerHeight;
      this.composer = new EffectComposer(this.renderer);
      this.composer.setSize(w, h);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      const b = FX.bloom;
      this.bloomPass = new UnrealBloomPass(new THREE.Vector2(w, h), b.strength, b.radius, b.threshold);
      this.composer.addPass(this.bloomPass);
      this.composer.addPass(new OutputPass());
      // Final color grade (runs in display space after tone-map): a saturation
      // + contrast lift that turns the flat render into the vivid, punchy look
      // of the reference art.
      this.gradePass = new ShaderPass(GRADE_SHADER);
      this.composer.addPass(this.gradePass);
      this.usePost = true;
    } catch (e) { this.composer = null; this.usePost = false; }   // never block play on FX
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, CAMERA.height, CAMERA.distance); this.camera.lookAt(0, 0, 0);
    this.camTarget = new THREE.Vector3(); this.camPos = new THREE.Vector3(0, CAMERA.height, CAMERA.distance);
    // chase-rig heading: yaw the camera follows, plus cached forward/right used
    // to make steering camera-relative. yaw 0 == looking toward -Z ("into" the maze).
    this.camYaw = 0; this.camYawTarget = 0;
    this._fwd = new THREE.Vector3(0, 0, -1); this._right = new THREE.Vector3(1, 0, 0);
    this._curFov = CAMERA.fov;

    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0); this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.6);
    this.sun.position.set(18, 42, 22); this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(this.shadowSize, this.shadowSize);
    this.sun.shadow.bias = -0.0006; this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun); this.scene.add(this.sun.target);
    this.fill = new THREE.AmbientLight(0xffffff, 0.34); this.scene.add(this.fill);

    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x9fe0ff) }, bottom: { value: new THREE.Color(0xdff6ff) } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
        void main(){ float h = clamp(normalize(vP).y*0.5+0.5,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.65)),1.0);} `,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), this.skyMat);
    sky.scale.setScalar(500); sky.frustumCulled = false; sky.renderOrder = -1; this.scene.add(sky);
    this.scene.fog = new THREE.FogExp2(0xdff6ff, 0.012);
  }

  geo(key, make) { return this._geo[key] || (this._geo[key] = make()); }
  _own(m) { m.userData = m.userData || {}; m.userData._own = true; return m; }

  // wall box whose TOP face is the bright cap colour (single mesh => no z-fight)
  _wallGeo(w) {
    const g = new THREE.BoxGeometry(T, WALL_H, T); g.userData = { _own: true };
    const pos = g.attributes && g.attributes.position;
    if (pos) {
      const wall = new THREE.Color(w.wall), top = new THREE.Color(w.wallTop);
      const n = pos.count, col = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const c = (i >= 8 && i <= 11) ? top : wall; col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    return g;
  }

  // skin perks: a reason to want a skin beyond looks
  _applyPerks(skinDef) {
    this.perkMagnet = false; this.speedPerk = 1; this.coinPerk = 1;
    const p = skinDef && skinDef.perk;
    if (p === 'shield') this.shield = true;                 // one free hit at level start
    else if (p === 'magnet') this.perkMagnet = true;
    else if (p === 'headstart') this.speedPerk = 1.08;
    else if (p === 'lucky') this.coinPerk = 1.15;
  }

  _makeEnvCube(world) {
    const faces = []; const top = new THREE.Color(world.sky), bot = new THREE.Color(world.floorEdge), hor = new THREE.Color(world.horizon);
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const ctx = c.getContext('2d');
      if (i === 2) { ctx.fillStyle = '#' + top.getHexString(); ctx.fillRect(0, 0, 64, 64); }
      else if (i === 3) { ctx.fillStyle = '#' + bot.getHexString(); ctx.fillRect(0, 0, 64, 64); }
      else { const g = ctx.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, '#' + top.getHexString()); g.addColorStop(0.55, '#' + hor.getHexString()); g.addColorStop(1, '#' + bot.getHexString()); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64); }
      faces.push(c);
    }
    const cube = new THREE.CubeTexture(faces); cube.colorSpace = THREE.SRGBColorSpace; cube.needsUpdate = true; return cube;
  }

  tileWorld(tx, ty) { return { x: (tx - (this.level.gw - 1) / 2) * T, z: (ty - (this.level.gh - 1) / 2) * T }; }
  worldTile(x, z) { return { tx: Math.round(x / T + (this.level.gw - 1) / 2), ty: Math.round(z / T + (this.level.gh - 1) / 2) }; }
  isWall(tx, ty) { const g = this.level.grid; if (ty < 0 || tx < 0 || ty >= this.level.gh || tx >= this.level.gw) return true; return g[ty][tx] === 1; }

  _clearLevel() {
    this.levelGroup.traverse((o) => {
      if (o.geometry && o.userData._own) o.geometry.dispose();
      if (o.material && o.userData._own) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose?.(); m.dispose(); });
    });
    while (this.levelGroup.children.length) this.levelGroup.remove(this.levelGroup.children[0]);
    if (this.envCube) { this.envCube.dispose?.(); this.envCube = null; }
  }

  // ---------------------------------------------------------------
  //  LEVEL BUILD
  // ---------------------------------------------------------------
  loadLevel(data, skinDef, trailDef) {
    this._clearLevel();
    this.level = data; this.skinDef = skinDef; this.trailDef = trailDef;
    const w = data.world;
    this.forgive = data.forgive || 0;

    this.envCube = this._makeEnvCube(w); this.scene.environment = this.envCube;
    this.skyMat.uniforms.top.value.set(w.sky); this.skyMat.uniforms.bottom.value.set(w.horizon);
    // The chase cam looks ALONG the ground, so the per-biome fog (tuned for the
    // old top-down view) would wash everything out — keep just enough for depth.
    this.scene.fog.color.set(w.horizon); this.scene.fog.density = w.fog * 0.45;
    this.renderer.setClearColor(new THREE.Color(w.horizon), 1);
    this.hemi.color.set(w.hemiSky); this.hemi.groundColor.set(w.hemiGround); this.hemi.intensity = w.hemiInt;
    this.sun.color.set(w.sun); this.sun.intensity = w.sunInt;
    this.fill.intensity = w.amb ?? 0.34;

    const half = Math.max((data.gw / 2) * T + T, (data.gh / 2) * T + T);
    const sc = this.sun.shadow.camera; sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 1; sc.far = 180; sc.updateProjectionMatrix();

    // floor + apron
    const fW = data.gw * T, fD = data.gh * T;
    const floor = new THREE.Mesh(this._own(new THREE.BoxGeometry(fW, 1.5, fD)), this._own(new THREE.MeshStandardMaterial({ color: w.floor, roughness: 0.95 })));
    floor.position.y = -0.75; floor.receiveShadow = true; this.levelGroup.add(floor);
    const apron = new THREE.Mesh(this._own(new THREE.BoxGeometry(fW + T * 0.6, 3.6, fD + T * 0.6)), this._own(new THREE.MeshStandardMaterial({ color: w.floorEdge, roughness: 1 })));
    apron.position.y = -2.6; apron.receiveShadow = true; this.levelGroup.add(apron);

    // walls (body + bright top cap) in a group so phase-walls can drop them
    this.wallGroup = new THREE.Group(); this.levelGroup.add(this.wallGroup);
    const wallTiles = [];
    this.openTiles = [];
    for (let y = 0; y < data.gh; y++) for (let x = 0; x < data.gw; x++) {
      if (data.grid[y][x] === 0) { this.openTiles.push({ tx: x, ty: y }); continue; }
      let exposed = false;
      for (const [dx, dy] of [[0,-1],[1,0],[0,1],[-1,0]]) { const nx = x+dx, ny = y+dy; if (nx<0||ny<0||nx>=data.gw||ny>=data.gh||data.grid[ny][nx]===0) { exposed = true; break; } }
      if (exposed) wallTiles.push([x, y]);
    }
    // ONE vertex-coloured mesh (top face = bright cap colour). A single mesh
    // removes the coplanar body/cap faces that caused the walls to shimmer.
    const wallGeo = this._wallGeo(w);
    const wallMat = this._own(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, metalness: w.emissiveWorld ? 0.2 : 0.04, emissive: new THREE.Color(w.emissiveWorld ? w.wall : 0x000000), emissiveIntensity: w.emissiveWorld ? 0.22 : 0 }));
    const body = new THREE.InstancedMesh(wallGeo, wallMat, wallTiles.length); body.castShadow = true; body.receiveShadow = true;
    const m = new THREE.Matrix4();
    wallTiles.forEach(([x, y], i) => { const p = this.tileWorld(x, y); m.makeTranslation(p.x, WALL_H / 2, p.z); body.setMatrixAt(i, m); });
    body.instanceMatrix.needsUpdate = true;
    this.wallGroup.add(body);

    // holes
    this.finishMesh = this._makeHole(data.finish, true, w);
    this.decoyMeshes = (data.decoys || []).map(d => this._makeHole(d, false, w));

    // entities
    this.coins = (data.coins || []).map(c => this._makeCoin(c));
    this.coinsCollected = 0;
    this.boostPads = (data.boostPads || []).map(p => this._makeBoostPad(p, w));
    this.bouncers = (data.bouncers || []).map(b => this._makeBouncer(b));
    this.crawlers = (data.crawlers || []).map(c => this._makeCrawler(c));
    this.spikes = (data.spikes || []).map(s => this._makeSpike(s));
    this.turrets = (data.turrets || []).map(t => this._makeTurret(t, w)); this.projectiles = [];
    this.sizeZones = (data.sizeZones || []).map(z => this._makeSizeZone(z));
    this.rotators = (data.rotators || []).map(r => this._makeRotator(r));
    this.movers = (data.movingWalls || []).map(mw => this._makeMover(mw));
    this.powerups = (data.powerups || []).map(p => this._makePowerup(p));

    // marble
    this._makeMarble(skinDef, trailDef);
    const sp = this.tileWorld(data.start.tx, data.start.ty);
    this.radius = MARBLE_R; this.baseRadius = MARBLE_R;
    this.marble.position.set(sp.x, MARBLE_R, sp.z); this.marble.scale.setScalar(1);
    this.vel = { x: 0, z: 0 };
    this.activePowerups.clear(); this.shield = false; this.timeScale = 1;
    this.clockMs = 0; this.combo = 0; this.comboTimer = 0;
    this.wallsPhased = false; this.phaseAmt = 0; this.wallGroup.position.y = 0;
    this.holesPatched = false; this.ghost = false; this.freeze = false;
    this.gold = { active: false, timer: 0, times: [], coins: [], used: false };
    this.idleTimer = 0; this._idleFired = false; this.launchTimer = 0;
    this._applyPerks(skinDef);

    this._setInitialHeading();
    this._updateCameraImmediate();
    this._fall = null; this._resolved = false; this._boosting = false;
    this.state = 'idle';
  }

  revive() {
    const safe = this.level.safe; let best = null, bd = Infinity;
    for (const k of safe) { const [tx, ty] = k.split(',').map(Number); const p = this.tileWorld(tx, ty); const d = Math.hypot(p.x - this.marble.position.x, p.z - this.marble.position.z); if (d < bd) { bd = d; best = p; } }
    const p = best || this.tileWorld(this.level.start.tx, this.level.start.ty);
    this.marble.position.set(p.x, MARBLE_R, p.z); this.marble.scale.setScalar(this.radius / this.baseRadius);
    this.vel = { x: 0, z: 0 }; this._fall = null; this._resolved = false;
    this.shield = true; this.activePowerups.set('shield', 2.6); this.cb.onPowerups?.(this._activeList());
    this.state = 'playing';
  }

  // ---- hole factory ----
  _makeHole(tile, isFinish, w) {
    const g = new THREE.Group(); const p = this.tileWorld(tile.tx, tile.ty); g.position.set(p.x, 0, p.z);
    const R = T * 0.42;
    const pit = new THREE.Mesh(this.geo('pit', () => new THREE.CylinderGeometry(1, 0.6, 6, 22, 1, true)), this._own(new THREE.MeshBasicMaterial({ color: 0x05070c, side: THREE.DoubleSide })));
    pit.scale.set(R, 1, R); pit.position.y = -3; g.add(pit);
    const disc = new THREE.Mesh(this.geo('disc', () => new THREE.CircleGeometry(1, 28)), this._own(new THREE.MeshBasicMaterial({ color: isFinish ? 0x031b12 : 0x1a0306 })));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02; disc.scale.setScalar(R); g.add(disc);
    const col = isFinish ? FINISH_COLOR : DANGER;
    const rim = new THREE.Mesh(this.geo('rim', () => new THREE.TorusGeometry(1, 0.14, 12, 30)), this._own(new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: isFinish ? 1.3 : 1.0, roughness: 0.35 })));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.06; rim.scale.setScalar(R); g.add(rim);
    if (isFinish) {
      const beam = new THREE.Mesh(this.geo('beam', () => new THREE.CylinderGeometry(0.82, 1.0, 26, 22, 1, true)), this._own(new THREE.MeshBasicMaterial({ color: FINISH_COLOR, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })));
      beam.position.y = 13; beam.scale.set(R, 1, R); g.add(beam);
      const ring2 = new THREE.Mesh(this.geo('rim2', () => new THREE.TorusGeometry(1.35, 0.06, 10, 30)), this._own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })));
      ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.08; ring2.scale.setScalar(R); g.add(ring2);
      g.userData.beam = beam; g.userData.ring2 = ring2;
    } else {
      // red danger glow plate so wrong holes scream "no"
      const warn = new THREE.Mesh(this.geo('warn', () => new THREE.RingGeometry(1.05, 1.5, 28)), this._own(new THREE.MeshBasicMaterial({ color: DANGER, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })));
      warn.rotation.x = -Math.PI / 2; warn.position.y = 0.04; warn.scale.setScalar(R); g.add(warn);
      g.userData.warn = warn;
    }
    g.userData = { ...g.userData, tile, R, baseR: R, isFinish, rim };
    this.levelGroup.add(g); return g;
  }

  _makeCoin(c) {
    const p = this.tileWorld(c.tx, c.ty);
    const mesh = new THREE.Mesh(this.geo('coin', () => new THREE.CylinderGeometry(0.46, 0.46, 0.14, 18)), this._own(new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffae00, emissiveIntensity: 0.95, metalness: 1, roughness: 0.3 })));
    mesh.rotation.x = Math.PI / 2; mesh.position.set(p.x, 0.9, p.z); mesh.castShadow = true;
    mesh.userData = { tx: c.tx, ty: c.ty, collected: false, baseY: 0.9, risk: !!c.risk, gold: false, spin: Math.random() * 6 };
    this.levelGroup.add(mesh); return mesh;
  }

  _makePowerup(p) {
    const def = POWERUPS[p.type] || POWERUPS.shield;
    const g = new THREE.Group(); const wp = this.tileWorld(p.tx, p.ty); g.position.set(wp.x, 1.55, wp.z);
    // unmistakable vs coins: glowing orb + white halo + light pillar + a
    // billboarded ICON so the player instantly reads what it does.
    const orb = new THREE.Mesh(this.geo('puOrb', () => new THREE.SphereGeometry(0.66, 20, 16)), this._own(new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 1.1, roughness: 0.12, metalness: 0.25 })));
    orb.castShadow = true; g.add(orb);
    const halo = new THREE.Mesh(this.geo('puHalo', () => new THREE.TorusGeometry(1.05, 0.08, 12, 28)), this._own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 })));
    halo.rotation.x = Math.PI / 2; g.add(halo);
    const pillar = new THREE.Mesh(this.geo('puPillar', () => new THREE.CylinderGeometry(0.22, 0.22, 3.4, 10, 1, true)), this._own(new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.28, depthWrite: false })));
    pillar.position.y = -1.1; g.add(pillar);
    const icon = new THREE.Mesh(this.geo('puIcon', () => new THREE.PlaneGeometry(1.15, 1.15)), this._own(new THREE.MeshBasicMaterial({ map: this._iconTex(def), transparent: true, depthWrite: false })));
    icon.position.y = 1.3; g.add(icon);
    g.userData = { tx: p.tx, ty: p.ty, type: p.type, def, collected: false, orb, halo, icon };
    this.levelGroup.add(g); return g;
  }
  _iconTex(def) {
    const k = 'ic_' + def.id; if (this._texCache[k]) return this._texCache[k];
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    const col = new THREE.Color(def.color);
    x.fillStyle = '#' + col.getHexString(); x.beginPath(); x.arc(64, 64, 54, 0, 7); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.95)'; x.font = '70px serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(def.icon || '★', 64, 74);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; this._texCache[k] = t; return t;
  }

  _makeBoostPad(p, w) {
    // a non-directional glowing SPEED pad (two-way) with a light shaft — NO
    // collision body, so it never blocks the marble.
    const g = new THREE.Group(); const wp = this.tileWorld(p.tx, p.ty); g.position.set(wp.x, 0.05, wp.z);
    const pad = new THREE.Mesh(this.geo('spPad', () => new THREE.CylinderGeometry(T * 0.36, T * 0.42, 0.12, 24)), this._own(new THREE.MeshStandardMaterial({ color: 0x081830, emissive: 0x18e0ff, emissiveIntensity: 0.95, roughness: 0.3 })));
    g.add(pad);
    const ring = new THREE.Mesh(this.geo('spRing', () => new THREE.TorusGeometry(T * 0.3, 0.06, 10, 28)), this._own(new THREE.MeshBasicMaterial({ color: 0xbff7ff, transparent: true, opacity: 0.9 })));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.12; g.add(ring);
    const shaft = new THREE.Mesh(this.geo('spShaft', () => new THREE.CylinderGeometry(T * 0.22, T * 0.34, 2.6, 16, 1, true)), this._own(new THREE.MeshBasicMaterial({ color: 0x18e0ff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })));
    shaft.position.y = 1.3; g.add(shaft);
    g.userData = { tile: p, dir: p.dir, cd: 0, ring, pad }; this.levelGroup.add(g); return g;
  }

  _makeBouncer(b) {
    const wp = this.tileWorld(b.tx, b.ty);
    const mesh = new THREE.Mesh(this.geo('bounce', () => new THREE.CylinderGeometry(T * 0.32, T * 0.42, 0.5, 20)), this._own(new THREE.MeshStandardMaterial({ color: 0xff5bb0, emissive: 0xff2a8a, emissiveIntensity: 0.7, roughness: 0.3 })));
    mesh.position.set(wp.x, 0.25, wp.z); mesh.castShadow = true; mesh.userData = { tile: b, cd: 0, squash: 0 };
    this.levelGroup.add(mesh); return mesh;
  }

  _makeCrawler(c) {
    // witty RED toxic blob with an angry face
    const g = new THREE.Group();
    const body = new THREE.Mesh(this.geo('crawlBody', () => new THREE.SphereGeometry(0.78, 20, 16)), this._own(new THREE.MeshStandardMaterial({ map: this._tex('toxicFace'), color: 0xffffff, emissive: DANGER, emissiveIntensity: 0.45, roughness: 0.4 })));
    body.castShadow = true; g.add(body);
    // toxic drip spikes
    for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(this.geo('crawlSpk', () => new THREE.ConeGeometry(0.16, 0.4, 6)), this._own(new THREE.MeshStandardMaterial({ color: DANGER_DARK, emissive: DANGER, emissiveIntensity: 0.5 }))); const a = i / 6 * Math.PI * 2; s.position.set(Math.cos(a) * 0.7, -0.55, Math.sin(a) * 0.7); s.rotation.x = Math.PI; g.add(s); }
    const pts = c.path.map(t => { const p = this.tileWorld(t.tx, t.ty); return new THREE.Vector3(p.x, 0.78, p.z); });
    g.userData = { pts, speed: c.speed, u: 0, dir: 1, body }; if (pts.length) g.position.copy(pts[0]);
    this.levelGroup.add(g); return g;
  }

  _makeSpike(s) {
    // real 3D spikes that RISE (red, deadly) and retract; red telegraph first
    const g = new THREE.Group(); const wp = this.tileWorld(s.tx, s.ty); g.position.set(wp.x, 0, wp.z);
    const base = new THREE.Mesh(this.geo('spkBase', () => new THREE.CylinderGeometry(T * 0.36, T * 0.4, 0.12, 16)), this._own(new THREE.MeshStandardMaterial({ color: 0x1a1d26, roughness: 1 })));
    base.position.y = 0.02; g.add(base);
    const tel = new THREE.Mesh(this.geo('spkTel', () => new THREE.CircleGeometry(T * 0.34, 20)), this._own(new THREE.MeshBasicMaterial({ color: DANGER, transparent: true, opacity: 0.0, depthWrite: false })));
    tel.rotation.x = -Math.PI / 2; tel.position.y = 0.05; g.add(tel);
    const cluster = new THREE.Group();
    const offs = [[0, 0], [0.5, 0.5], [-0.5, 0.5], [0.5, -0.5], [-0.5, -0.5]];
    for (const [ox, oz] of offs) { const cone = new THREE.Mesh(this.geo('spkCone', () => new THREE.ConeGeometry(0.32, 1.5, 6)), this._own(new THREE.MeshStandardMaterial({ color: DANGER, emissive: DANGER, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.4 }))); cone.position.set(ox, 0.75, oz); cluster.add(cone); }
    cluster.position.y = -1.6; g.add(cluster);  // start hidden below floor
    g.userData = { tile: s, phase: s.phase, period: s.period, cluster, tel, up: 0 };
    this.levelGroup.add(g); return g;
  }

  _makeTurret(t, w) {
    const g = new THREE.Group(); const wp = this.tileWorld(t.tx, t.ty); g.position.set(wp.x, 0, wp.z);
    const base = new THREE.Mesh(this.geo('tBase', () => new THREE.CylinderGeometry(0.66, 0.78, 1.0, 14)), this._own(new THREE.MeshStandardMaterial({ color: 0x2b3240, metalness: 0.6, roughness: 0.4 }))); base.position.y = 0.5; g.add(base);
    const barrel = new THREE.Mesh(this.geo('tBarrel', () => new THREE.CylinderGeometry(0.22, 0.26, 1.1, 12)), this._own(new THREE.MeshStandardMaterial({ color: 0x9fb0c8, emissive: DANGER, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.3 })));
    barrel.rotation.z = Math.PI / 2; const ang = Math.atan2(t.dir.y, t.dir.x); barrel.position.set(t.dir.x * 0.6, 0.9, t.dir.y * 0.6); barrel.rotation.y = -ang; g.add(barrel);
    g.userData = { tile: t, dir: t.dir, period: t.period, timer: t.phase * t.period }; this.levelGroup.add(g); return g;
  }

  _makeSizeZone(z) {
    const g = new THREE.Group(); const wp = this.tileWorld(z.tx, z.ty); g.position.set(wp.x, 0.05, wp.z);
    const col = z.kind === 'shrink' ? 0x49d0ff : 0xff8a3d;
    const ring = new THREE.Mesh(this.geo('szRing', () => new THREE.TorusGeometry(T * 0.34, 0.1, 10, 24)), this._own(new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8, roughness: 0.4 })));
    ring.rotation.x = -Math.PI / 2; g.add(ring);
    g.userData = { tile: z, kind: z.kind, cd: 0 }; this.levelGroup.add(g); return g;
  }

  _makeRotator(r) {
    const g = new THREE.Group(); const wp = this.tileWorld(r.tx, r.ty); g.position.set(wp.x, 0.85, wp.z);
    const hub = new THREE.Mesh(this.geo('rHub', () => new THREE.CylinderGeometry(0.5, 0.62, 1.8, 16)), this._own(new THREE.MeshStandardMaterial({ color: 0x2b3346, metalness: 0.7, roughness: 0.35 }))); g.add(hub);
    const len = r.len * T;
    // the deadly RED bar starts AT the pivot and reaches `len` — exactly the
    // lethal segment, so you only die if you actually touch the bar.
    const arm = new THREE.Mesh(this._own(new THREE.BoxGeometry(len, 0.5, 0.5)), this._own(new THREE.MeshStandardMaterial({ color: DANGER, emissive: DANGER, emissiveIntensity: 0.85, roughness: 0.4 })));
    arm.position.x = len / 2; arm.castShadow = true; g.add(arm);
    const tip = new THREE.Mesh(this.geo('rTip', () => new THREE.SphereGeometry(0.4, 12, 10)), this._own(new THREE.MeshStandardMaterial({ color: DANGER, emissive: DANGER, emissiveIntensity: 1.3 }))); tip.position.x = len; g.add(tip);
    g.userData = { tile: r, len, speed: r.speed, angle: Math.random() * 6 }; this.levelGroup.add(g); return g;
  }

  _makeMover(mw) {
    // a sliding AMBER wall that retracts into a side wall, opening the corridor
    const wp = this.tileWorld(mw.tx, mw.ty);
    // retract direction = a perpendicular side that is a wall (hide there)
    const perp = mw.dir.x ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
    let retract = perp.find(([dx, dy]) => this.isWall(mw.tx + dx, mw.ty + dy)) || perp[0];
    const mesh = new THREE.Mesh(this._own(new THREE.BoxGeometry(T * 0.96, WALL_H * 0.92, T * 0.96)), this._own(new THREE.MeshStandardMaterial({ color: MOVER_COLOR, emissive: MOVER_COLOR, emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.5 })));
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.position.set(wp.x, WALL_H * 0.46, wp.z);
    mesh.userData = { tile: mw, base: wp, retract: { x: retract[0], y: retract[1] }, period: mw.period, phase: mw.phase, offset: 0 };
    this.levelGroup.add(mesh); return mesh;
  }

  _makeMarble(skinDef, trailDef) {
    if (!this.marble) {
      this.marble = new THREE.Mesh(new THREE.SphereGeometry(MARBLE_R, 40, 30), new THREE.MeshPhysicalMaterial());
      this.marble.castShadow = true; this.scene.add(this.marble);
      this.blob = new THREE.Mesh(new THREE.CircleGeometry(MARBLE_R * 1.25, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }));
      this.blob.rotation.x = -Math.PI / 2; this.scene.add(this.blob);
      this._initGroundStreak();
      this._initTrail();
    }
    this.applySkin(skinDef); this.applyTrail(trailDef);
  }

  applySkin(def) {
    this.skinDef = def; const mat = this.marble.material; const mm = def.mat;
    if (mat.map) { mat.map.dispose?.(); mat.map = null; }
    mat.color = new THREE.Color(mm.color);
    mat.metalness = mm.metalness ?? 0; mat.roughness = mm.roughness ?? 0.2;
    mat.clearcoat = mm.clearcoat ?? 0; mat.clearcoatRoughness = 0.08;
    mat.emissive = new THREE.Color(mm.emissive ?? 0x000000); mat.emissiveIntensity = mm.emissiveInt ?? 0;
    // crisper, more reflective marble so every skin reads as a premium glossy
    // ball under the chase cam (and metallic skins pop through bloom).
    mat.envMapIntensity = 1.3;
    if ((mm.clearcoat ?? 0) <= 0) { mat.clearcoat = 0.35; mat.clearcoatRoughness = 0.2; }
    if (def.tex) { const cv = document.createElement('canvas'); cv.width = cv.height = 256; drawMarbleTexture(cv.getContext('2d'), def.tex, 256); const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; mat.map = tex; mat.color = new THREE.Color(0xffffff); }
    this._setRing(!!def.ring, mm.color);
    this._rainbow = !!mm.rainbow; mat.needsUpdate = true;
  }
  _setRing(on, color) {
    if (on && !this.ringMesh) { this.ringMesh = new THREE.Mesh(new THREE.TorusGeometry(MARBLE_R * 1.7, MARBLE_R * 0.18, 10, 32), new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5 })); this.ringMesh.rotation.x = 1.2; this.marble.add(this.ringMesh); }
    if (this.ringMesh) this.ringMesh.visible = on;
  }
  applyTrail(def) { this.trailDef = def; const on = def && def.id !== 'none'; if (this.trail) this.trail.visible = on; if (on) this.trailColor = new THREE.Color(def.color); this._trailRainbow = !!(def && def.rainbow); }

  _tex(name) {
    if (this._texCache[name]) return this._texCache[name];
    const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
    if (name === 'toxicFace') {
      x.fillStyle = '#ff2b2b'; x.fillRect(0, 0, 128, 128);
      x.fillStyle = '#7a0d0d'; for (let i = 0; i < 10; i++) { x.beginPath(); x.arc(Math.random() * 128, Math.random() * 128, 6 + Math.random() * 8, 0, 7); x.fill(); }
      x.fillStyle = '#fff'; x.beginPath(); x.arc(48, 56, 14, 0, 7); x.fill(); x.beginPath(); x.arc(84, 56, 14, 0, 7); x.fill();
      x.fillStyle = '#111'; x.beginPath(); x.arc(50, 58, 6, 0, 7); x.fill(); x.beginPath(); x.arc(82, 58, 6, 0, 7); x.fill();
      x.strokeStyle = '#111'; x.lineWidth = 6; x.lineCap = 'round'; x.beginPath(); x.arc(66, 96, 22, Math.PI + 0.3, -0.3); x.stroke(); // frown
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; this._texCache[name] = tex; return tex;
  }

  // ---- ground speed-streak (a stretched additive smear under the marble) ----
  _initGroundStreak() {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const x = cv.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0.0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1.0, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 256);
    // soften the long edges so it reads as a beam, not a rectangle
    const eg = x.createLinearGradient(0, 0, 64, 0);
    eg.addColorStop(0, 'rgba(0,0,0,1)'); eg.addColorStop(0.5, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,1)');
    x.globalCompositeOperation = 'destination-out'; x.fillStyle = eg; x.fillRect(0, 0, 64, 256);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 6), mat);
    plane.geometry.translate(0, 2.6, 0);   // bias the smear so it trails BEHIND the marble
    plane.rotation.x = -Math.PI / 2;
    const group = new THREE.Group(); group.add(plane); group.visible = false; group.renderOrder = 2;
    this.scene.add(group); this._groundStreak = group; this._groundStreakMat = mat;
  }

  // ---- trail ----
  _initTrail() {
    const N = 46; const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    this.trail = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.9, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.trail.frustumCulled = false; this.scene.add(this.trail);
    this._trailN = N; this._trailHead = 0; this._trailLife = new Float32Array(N); this.trailColor = new THREE.Color(0xffffff);
  }

  // ---- particles ----
  _initParticles() {
    const M = 700; this.pM = M; const geo = new THREE.BufferGeometry();
    this.pPos = new Float32Array(M * 3); this.pCol = new Float32Array(M * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.pCol, 3));
    this.particles = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.particles.frustumCulled = false;
    this.pVel = new Float32Array(M * 3); this.pLife = new Float32Array(M); this.pMax = new Float32Array(M); this.pBase = new Float32Array(M * 3); this.pHead = 0;
    for (let i = 0; i < M; i++) this.pPos[i * 3 + 1] = -9999;
    this.scene.add(this.particles);
  }
  burst(x, y, z, color, count = 16, spd = 6, life = 0.6, up = 2) {
    if (this._degraded > 1) count = Math.ceil(count * 0.5);
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const idx = this.pHead; this.pHead = (this.pHead + 1) % this.pM;
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI, s = spd * (0.4 + Math.random() * 0.8);
      this.pVel[idx * 3] = Math.sin(e) * Math.cos(a) * s; this.pVel[idx * 3 + 1] = Math.cos(e) * s * 0.5 + up; this.pVel[idx * 3 + 2] = Math.sin(e) * Math.sin(a) * s;
      this.pPos[idx * 3] = x; this.pPos[idx * 3 + 1] = y; this.pPos[idx * 3 + 2] = z;
      this.pBase[idx * 3] = c.r; this.pBase[idx * 3 + 1] = c.g; this.pBase[idx * 3 + 2] = c.b;
      this.pLife[idx] = this.pMax[idx] = life * (0.6 + Math.random() * 0.6);
    }
  }
  _updateParticles(dt) {
    for (let i = 0; i < this.pM; i++) {
      if (this.pLife[i] <= 0) continue;
      this.pLife[i] -= dt; const k = Math.max(0, this.pLife[i] / this.pMax[i]);
      this.pVel[i * 3 + 1] -= 9 * dt; this.pVel[i * 3] *= 0.96; this.pVel[i * 3 + 2] *= 0.96;
      this.pPos[i * 3] += this.pVel[i * 3] * dt; this.pPos[i * 3 + 1] += this.pVel[i * 3 + 1] * dt; this.pPos[i * 3 + 2] += this.pVel[i * 3 + 2] * dt;
      this.pCol[i * 3] = this.pBase[i * 3] * k; this.pCol[i * 3 + 1] = this.pBase[i * 3 + 1] * k; this.pCol[i * 3 + 2] = this.pBase[i * 3 + 2] * k;
      if (this.pLife[i] <= 0) { this.pPos[i * 3 + 1] = -9999; this.pCol[i*3]=this.pCol[i*3+1]=this.pCol[i*3+2]=0; }
    }
    this.particles.geometry.attributes.position.needsUpdate = true; this.particles.geometry.attributes.color.needsUpdate = true;
  }

  start() { if (this.state === 'idle' || this.state === 'paused') this.state = 'playing'; }
  pause() { if (this.state === 'playing') this.state = 'paused'; }
  resume() { if (this.state === 'paused') this.state = 'playing'; }

  // ---------------------------------------------------------------
  //  MAIN UPDATE
  // ---------------------------------------------------------------
  update(dt, input) {
    dt = Math.min(dt, 0.05); this._t += dt; const sdt = dt * this.timeScale;
    if (this.state === 'playing') {
      this.clockMs += dt * 1000;
      this._physics(sdt, input);
      this._entities(sdt);
      this._powerupTick(dt);
      this._goldTick(dt);
      this._phaseTick(dt);
      this._trailUpdate(dt);
      this._checkPickups();
      this._checkHoles();
      this._checkHazards();
      this._idleCheck(dt, input);
      if (this.cb.onHud) this.cb.onHud(this._hud());
      this._finishArrow();
    } else if (this.state === 'win' || this.state === 'die') {
      this._deathAnim(dt); this._entities(sdt * 0.2); this._trailUpdate(dt);
    } else { this._idleAnim(dt); }
    if (this.state === 'playing') this._speedFx(dt);
    this._animateDecor(dt); this._updateParticles(dt); this._camera(dt);
    if (this.usePost && this.composer) this.composer.render(dt);
    else this.renderer.render(this.scene, this.camera);
    this._perf(dt);
  }

  // friction sparks + a stretched ground light-streak when the marble is fast.
  _speedFx(dt) {
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const m = this.marble.position;
    if (this._groundStreak) {
      const f = Math.max(0, Math.min(1, (sp - 3) / (PHYS.maxSpeed - 3)));
      const gs = this._groundStreak, gsm = this._groundStreakMat;
      gs.visible = f > 0.02 && !(this.wallsPhased && this.phaseAmt > 0.5);
      if (gs.visible) {
        gs.position.set(m.x, 0.06, m.z);
        gs.rotation.y = Math.atan2(this.vel.x, this.vel.z);
        const len = 0.8 + f * 1.4;
        gs.scale.set(0.7 + f * 0.5, 1, len);
        gsm.opacity = 0.07 + f * 0.32;
        const col = this._boosting ? 0xfff1c2 : (this.gold.active ? 0xffe14d : this.trailColor);
        gsm.color.set(col);
      }
    }
    // embers: throttled so the count tracks speed without flooding the buffer
    if (this._degraded < 2 && (sp > FX.sparkSpeed || this._boosting)) {
      this._sparkAcc = (this._sparkAcc || 0) + dt;
      const rate = this._boosting ? 0.018 : 0.05;
      if (this._sparkAcc >= rate) {
        this._sparkAcc = 0;
        const back = 0.5; const bx = m.x - (this.vel.x / (sp || 1)) * back, bz = m.z - (this.vel.z / (sp || 1)) * back;
        const warm = this._boosting ? 0xfff0b0 : 0xffb347;
        this.burst(bx, 0.28, bz, warm, this._boosting ? 4 : 2, 5, 0.34, 2.4);
      }
    }
  }

  _hud() {
    const speed = Math.hypot(this.vel.x, this.vel.z);
    return { coins: this.coinsCollected, coinTotal: this.level.coinTotal, timeMs: this.clockMs, parMs: this.level.parTimeMs, speed, maxSpeed: PHYS.maxSpeed, boosting: !!this._boosting, gold: this.gold.active };
  }

  // ---- physics ----
  _physics(dt, input) {
    const w = this.level.world; const boosting = input && input.boost; this._boosting = boosting;
    let accel = PHYS.accel * (boosting ? PHYS.boostMult : 1);
    let maxv = PHYS.maxSpeed * (boosting ? PHYS.boostMult : 1);
    if (this.activePowerups.has('speed')) { accel *= 1.4; maxv *= 1.4; }
    accel *= this.speedPerk; maxv *= this.speedPerk;          // skin headstart perk
    const sizeF = this.baseRadius / this.radius; maxv *= sizeF; accel *= sizeF;
    if (this.launchTimer > 0) { this.launchTimer -= dt; maxv = Math.max(maxv, 38); }   // boost-pad launch carries through
    let fric = PHYS.friction;
    if (w.sig === 'slippery') fric *= 0.45;
    if (w.sig === 'lowgrav') { fric *= 0.62; maxv *= 1.1; }
    // Camera-relative steering: the input vector is interpreted in screen space
    // (forward = into the screen, x = strafe) and rotated by the chase rig's
    // heading, so "push up" always rolls the marble away from the camera.
    let ax = 0, az = 0;
    if (input) {
      const inF = -input.vec.y, inR = input.vec.x;
      ax = (this._fwd.x * inF + this._right.x * inR) * accel;
      az = (this._fwd.z * inF + this._right.z * inR) * accel;
    }
    if (this.level.current) { ax += this.level.current.x * this.level.current.strength; az += this.level.current.y * this.level.current.strength; }
    this.vel.x += ax * dt; this.vel.z += az * dt;
    const fr = Math.exp(-fric * dt); this.vel.x *= fr; this.vel.z *= fr;
    const sp = Math.hypot(this.vel.x, this.vel.z); if (sp > maxv) { const k = maxv / sp; this.vel.x *= k; this.vel.z *= k; }
    const move = Math.hypot(this.vel.x, this.vel.z) * dt; const nSub = Math.max(1, Math.ceil(move / (T * 0.3)));
    const hx = this.vel.x * dt / nSub, hz = this.vel.z * dt / nSub;
    for (let s = 0; s < nSub; s++) { this.marble.position.x += hx; this.marble.position.z += hz; this._resolveWalls(); }
    const v = Math.hypot(this.vel.x, this.vel.z);
    if (v > 0.01) { const axis = tmpV.set(-this.vel.z, 0, this.vel.x).normalize(); this.marble.rotateOnWorldAxis(axis, (v * dt) / this.radius); }
    // Ghost ignores interior walls but must NOT leave the platform.
    if (this.ghost) {
      const hx = (this.level.gw * T) / 2 - this.radius, hz = (this.level.gh * T) / 2 - this.radius;
      if (this.marble.position.x < -hx) { this.marble.position.x = -hx; this.vel.x = Math.max(0, this.vel.x); }
      if (this.marble.position.x > hx) { this.marble.position.x = hx; this.vel.x = Math.min(0, this.vel.x); }
      if (this.marble.position.z < -hz) { this.marble.position.z = -hz; this.vel.z = Math.max(0, this.vel.z); }
      if (this.marble.position.z > hz) { this.marble.position.z = hz; this.vel.z = Math.min(0, this.vel.z); }
    }
  }

  _circleVsBox(px, pz, cx, cz, halfX, halfZ, r) {
    const minX = cx - halfX, maxX = cx + halfX, minZ = cz - halfZ, maxZ = cz + halfZ;
    const qx = Math.max(minX, Math.min(px, maxX)), qz = Math.max(minZ, Math.min(pz, maxZ));
    let nx = px - qx, nz = pz - qz, d2 = nx * nx + nz * nz;
    if (d2 >= r * r) return null;
    let d = Math.sqrt(d2);
    if (d < 1e-5) { const l = px - minX, ri = maxX - px, tp = pz - minZ, bt = maxZ - pz; const mn = Math.min(l, ri, tp, bt); if (mn === l) { nx = -1; nz = 0; } else if (mn === ri) { nx = 1; nz = 0; } else if (mn === tp) { nx = 0; nz = -1; } else { nx = 0; nz = 1; } d = 0; } else { nx /= d; nz /= d; }
    return { nx, nz, push: r - d };
  }
  _resolveWalls() {
    if (this.ghost) return;                              // ghost passes through
    if (this.wallsPhased && this.phaseAmt > 0.5) return; // phased through
    const r = this.radius, px0 = this.marble.position.x, pz0 = this.marble.position.z;
    const { tx, ty } = this.worldTile(px0, pz0);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const wx = tx + dx, wy = ty + dy; if (!this.isWall(wx, wy)) continue;
      const c = this.tileWorld(wx, wy);
      const hit = this._circleVsBox(this.marble.position.x, this.marble.position.z, c.x, c.z, T / 2, T / 2, r);
      if (hit) this._applyHit(hit);
    }
    // moving walls (dynamic) — only when extended enough to block
    for (const mv of this.movers || []) {
      if (mv.userData.offset > 0.55) continue; // retracted -> open
      const hit = this._circleVsBox(this.marble.position.x, this.marble.position.z, mv.position.x, mv.position.z, T * 0.48, T * 0.48, r);
      if (hit) this._applyHit(hit);
    }
  }
  _applyHit(hit) {
    this.marble.position.x += hit.nx * hit.push; this.marble.position.z += hit.nz * hit.push;
    const vn = this.vel.x * hit.nx + this.vel.z * hit.nz;
    if (vn < 0) { this.vel.x -= (1 + PHYS.wallRestitution) * vn * hit.nx; this.vel.z -= (1 + PHYS.wallRestitution) * vn * hit.nz; }
  }

  // ---- entity motion ----
  _entities(dt) {
    if (!this.freeze) this._moveHazards(dt);
    // cooldowns / non-hazard motion still tick under Freeze
    for (const b of this.bouncers) { if (b.userData.cd > 0) b.userData.cd -= dt; b.userData.squash = Math.max(0, b.userData.squash - dt * 4); const sq = b.userData.squash; b.scale.set(1 + sq * 0.3, 1 - sq * 0.5, 1 + sq * 0.3); }
    for (const p of this.boostPads) if (p.userData.cd > 0) p.userData.cd -= dt;
    for (const z of this.sizeZones) if (z.userData.cd > 0) z.userData.cd -= dt;
  }
  _moveHazards(dt) {
    for (const c of this.crawlers) {
      const pts = c.userData.pts; if (pts.length < 2) continue;
      c.userData.u += c.userData.dir * c.userData.speed * dt / T;
      if (c.userData.u >= pts.length - 1) { c.userData.u = pts.length - 1; c.userData.dir = -1; }
      if (c.userData.u <= 0) { c.userData.u = 0; c.userData.dir = 1; }
      const i = Math.floor(c.userData.u), f = c.userData.u - i; const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
      c.position.lerpVectors(a, b, f); c.position.y = 0.78 + Math.sin(this._t * 4 + i) * 0.08; c.rotation.y += dt * 1.5;
    }
    for (const s of this.spikes) {
      const u = (this._t / s.userData.period + s.userData.phase) % 1;
      // 0..0.35 warn, 0.35..0.55 strike up, 0.55..0.8 down
      let up = 0, tel = 0;
      if (u < 0.35) { tel = (u / 0.35); up = 0; }
      else if (u < 0.55) { up = (u - 0.35) / 0.2; tel = 1; }
      else if (u < 0.8) { up = 1 - (u - 0.55) / 0.25; tel = 0.4; }
      s.userData.up = up; s.userData.cluster.position.y = -1.6 + up * 1.6;
      s.userData.tel.material.opacity = 0.15 + tel * 0.5 * (0.6 + 0.4 * Math.sin(this._t * 12));
    }
    for (const t of this.turrets) { t.userData.timer += dt; if (t.userData.timer >= t.userData.period) { t.userData.timer = 0; this._fire(t); } }
    for (const p of this.projectiles) { if (!p.alive) continue; p.mesh.position.x += p.vx * dt; p.mesh.position.z += p.vz * dt; const { tx, ty } = this.worldTile(p.mesh.position.x, p.mesh.position.z); if (this.isWall(tx, ty)) { p.alive = false; this.levelGroup.remove(p.mesh); this.burst(p.mesh.position.x, 0.6, p.mesh.position.z, DANGER, 6, 4, 0.3); } }
    this.projectiles = this.projectiles.filter(p => p.alive);
    for (const r of this.rotators) { r.userData.angle += r.userData.speed * dt; r.rotation.y = r.userData.angle; }
    // sliding walls
    for (const mv of this.movers || []) {
      const u = (this._t / mv.userData.period + mv.userData.phase) % 1;
      const off = 0.5 - 0.5 * Math.cos(u * Math.PI * 2); // 0..1..0
      mv.userData.offset = off;
      mv.position.x = mv.userData.base.x + mv.userData.retract.x * off * T;
      mv.position.z = mv.userData.base.z + mv.userData.retract.y * off * T;
    }
  }
  _fire(t) {
    const mesh = new THREE.Mesh(this.geo('proj', () => new THREE.SphereGeometry(0.26, 12, 10)), this._own(new THREE.MeshStandardMaterial({ color: DANGER, emissive: DANGER, emissiveIntensity: 1.3 })));
    const wp = this.tileWorld(t.userData.tile.tx, t.userData.tile.ty);
    mesh.position.set(wp.x + t.userData.dir.x * T * 0.5, 0.7, wp.z + t.userData.dir.y * T * 0.5);
    this.levelGroup.add(mesh); const speed = 11;
    this.projectiles.push({ mesh, vx: t.userData.dir.x * speed, vz: t.userData.dir.y * speed, alive: true });
  }

  // ---- pickups ----
  _checkPickups() {
    const mx = this.marble.position.x, mz = this.marble.position.z;
    const magnetActive = this.activePowerups.has('magnet');
    const magnet = magnetActive || this.perkMagnet;
    const mRange = magnetActive ? T * 3.4 : T * 1.8, mPull = magnetActive ? 20 : 9;
    for (const coin of this.coins) {
      if (coin.userData.collected) continue;
      let dx = coin.position.x - mx, dz = coin.position.z - mz, dd = Math.hypot(dx, dz);
      if (magnet && dd < mRange) { const pull = mPull * (1 - dd / mRange); coin.position.x -= (dx / (dd || 1)) * pull * 0.016; coin.position.z -= (dz / (dd || 1)) * pull * 0.016; dx = coin.position.x - mx; dz = coin.position.z - mz; dd = Math.hypot(dx, dz); }
      if (dd < RADII.coin + this.radius * 0.4) this._collectCoin(coin);
    }
    for (const pu of this.powerups) { if (pu.userData.collected) continue; if (Math.hypot(pu.position.x - mx, pu.position.z - mz) < RADII.powerup + this.radius * 0.5) this._collectPowerup(pu); }
    for (const p of this.boostPads) {
      if (p.userData.cd > 0) continue;
      if (Math.hypot(p.position.x - mx, p.position.z - mz) < T * 0.5) {
        // TWO-WAY: launch along the marble's current heading (or the corridor
        // axis if nearly stopped). Strong but controllable.
        const sp = Math.hypot(this.vel.x, this.vel.z); let dx, dz;
        if (sp > 1.2) { dx = this.vel.x / sp; dz = this.vel.z / sp; } else { dx = p.userData.dir.x; dz = p.userData.dir.y; }
        this.vel.x = dx * 40; this.vel.z = dz * 40; p.userData.cd = 0.6;
        this.launchTimer = 0.65;                          // bypass the speed cap so it carries down the corridor
        this.burst(p.position.x, 0.5, p.position.z, 0x6cf0ff, 18, 9, 0.45, 3); this.cb.onSfx?.('boost');
      }
    }
    for (const b of this.bouncers) {
      if (b.userData.cd > 0) continue;
      const dx = mx - b.position.x, dz = mz - b.position.z, dd = Math.hypot(dx, dz);
      if (dd < T * 0.42 + this.radius) { const n = dd < 1e-3 ? { x: Math.random() - 0.5, z: Math.random() - 0.5 } : { x: dx / dd, z: dz / dd }; this.vel.x = n.x * 26; this.vel.z = n.z * 26; b.userData.cd = 0.4; b.userData.squash = 1; this.burst(b.position.x, 0.6, b.position.z, 0xff5bb0, 14, 8, 0.4, 4); this.cb.onSfx?.('bounce'); }
    }
    for (const z of this.sizeZones) { if (z.userData.cd > 0) continue; if (Math.hypot(z.position.x - mx, z.position.z - mz) < T * 0.34) { z.userData.cd = 2; if (z.userData.kind === 'shrink') this._startPowerup('shrink'); else { this.radius = this.baseRadius * 1.5; this.activePowerups.set('grow', 7); this._applySize(); } this.cb.onSfx?.('powerup'); } }
  }
  _collectCoin(coin) {
    coin.userData.collected = true; coin.visible = false;
    const gold = coin.userData.gold; if (!gold) this.coinsCollected++;
    this.combo++; this.comboTimer = 1.4;
    const val = (this.activePowerups.has('x2') ? 2 : 1) * (this.gold.active ? 2 : 1) * this.coinPerk;
    this.burst(coin.position.x, coin.position.y, coin.position.z, gold ? 0xffe14d : 0xffd23a, 12, 5, 0.5, 2);
    this.cb.onCoin?.(this.coinsCollected, val, this.combo);
    this.cb.onSfx?.('coin', this.combo);
    // GOLD RUSH — rare & earned: once per level, only when nearly ALL coins are
    // grabbed, or a big burst very fast.
    if (!this.gold.active && !this.gold.used && !gold) {
      this.gold.times.push(this._t);
      this.gold.times = this.gold.times.filter(tt => this._t - tt < GOLD_RUSH.windowSec);
      const total = this.level.coinTotal || 1;
      const grabbedMost = total >= 6 && this.coinsCollected >= Math.ceil(total * GOLD_RUSH.fraction);
      const fastBurst = this.gold.times.length >= GOLD_RUSH.minFast;
      if (grabbedMost || fastBurst) this._startGoldRush();
    }
  }
  _collectPowerup(pu) {
    pu.userData.collected = true; pu.visible = false;
    this.burst(pu.position.x, 1.4, pu.position.z, pu.userData.def.color, 28, 8, 0.7, 4);
    this.burst(pu.position.x, 1.4, pu.position.z, 0xffffff, 12, 5, 0.5, 3);
    this._startPowerup(pu.userData.type); this.cb.onSfx?.('powerup');
  }
  // allow the director (panic/reward) to trigger a rush
  forceGoldRush() { if (!this.gold.active && !this.gold.used) this._startGoldRush(); }

  _startPowerup(id) {
    const def = POWERUPS[id] || { id, dur: 7 };
    this.activePowerups.set(id, def.dur);
    if (id === 'shield') this.shield = true;
    if (id === 'slowmo') this.timeScale = 0.55;
    if (id === 'shrink') { this.radius = this.baseRadius * 0.55; this._applySize(); }
    if (id === 'patchHoles') this._setHolesPatched(true);
    if (id === 'phaseWalls') this.wallsPhased = true;
    if (id === 'ghost') { this.ghost = true; this._setMarbleGhost(true); }
    if (id === 'freeze') this.freeze = true;
    this.cb.onPowerupStart?.(def); this.cb.onPowerups?.(this._activeList());
  }
  _setMarbleGhost(on) { const m = this.marble.material; m.transparent = on; m.opacity = on ? 0.4 : 1; m.needsUpdate = true; }
  _applySize() { this.marble.scale.setScalar(this.radius / this.baseRadius); }
  _setHolesPatched(on) { this.holesPatched = on; for (const d of this.decoyMeshes) { d.userData.rim.material.emissiveIntensity = on ? 0.1 : 1.0; if (d.userData.warn) d.userData.warn.material.opacity = on ? 0.0 : 0.4; d.scale.y = on ? 0.1 : 1; } }

  _powerupTick(dt) {
    let changed = false;
    for (const [id, t] of this.activePowerups) {
      const nt = t - dt;
      if (nt <= 0) {
        this.activePowerups.delete(id); changed = true;
        if (id === 'slowmo') this.timeScale = 1;
        if (id === 'shrink' || id === 'grow') { this.radius = this.baseRadius; this._applySize(); }
        if (id === 'shield') this.shield = false;
        if (id === 'patchHoles') this._setHolesPatched(false);
        if (id === 'phaseWalls') this.wallsPhased = false;
        if (id === 'ghost') { this.ghost = false; this._setMarbleGhost(false); }
        if (id === 'freeze') this.freeze = false;
        this.cb.onPowerupEnd?.(id);
      } else this.activePowerups.set(id, nt);
    }
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    if (changed) this.cb.onPowerups?.(this._activeList());
  }
  _activeList() { return [...this.activePowerups.entries()].map(([id, t]) => ({ id, t, def: POWERUPS[id] })); }

  _phaseTick(dt) {
    const target = this.wallsPhased ? 1 : 0;
    this.phaseAmt += (target - this.phaseAmt) * Math.min(1, dt * 6);
    if (this.wallGroup) this.wallGroup.position.y = -this.phaseAmt * (WALL_H + 0.6);
  }

  // ---- GOLD RUSH (god mode) ----
  _startGoldRush() {
    this.gold.active = true; this.gold.used = true; this.gold.timer = GOLD_RUSH.durationSec; this.gold.times = [];
    const open = this.openTiles.filter(t => !(t.tx === this.level.finish.tx && t.ty === this.level.finish.ty));
    for (let i = 0; i < GOLD_RUSH.fillCount && open.length; i++) {
      const t = open[Math.floor(Math.random() * open.length)];
      const coin = this._makeCoin({ tx: t.tx, ty: t.ty }); coin.userData.gold = true;
      coin.material.emissive = new THREE.Color(0xffe14d); coin.material.emissiveIntensity = 0.9;
      this.coins.push(coin); this.gold.coins.push(coin);
    }
    this.burst(this.marble.position.x, 1.2, this.marble.position.z, 0xffe14d, 50, 10, 1.0, 6);
    this.cb.onGoldRush?.(true); this.cb.onSfx?.('gold');
  }
  _goldTick(dt) {
    if (!this.gold.active) return;
    this.gold.timer -= dt;
    if (this.gold.timer <= 0) this._endGold();
  }
  _endGold() {
    if (!this.gold.active) return;
    this.gold.active = false;
    for (const c of this.gold.coins) if (!c.userData.collected) { c.visible = false; c.userData.collected = true; }
    this.gold.coins = [];
    this.cb.onGoldRush?.(false);
  }

  // ---- holes ----
  _checkHoles() {
    const mx = this.marble.position.x, mz = this.marble.position.z;
    const f = this.finishMesh;
    let R = f.userData.R * (1 + this.forgive * 0.5);
    if (this.level.biggerGoal) R *= 1.5;
    if (this.activePowerups.has('bigfinish')) R *= 1.7;
    if (Math.hypot(mx - f.position.x, mz - f.position.z) < R) { this._win(); return; }
    if (!this.holesPatched) {
      for (const d of this.decoyMeshes) {
        if (Math.hypot(mx - d.position.x, mz - d.position.z) < d.userData.R) {
          if (this.shield) { this._consumeShield(d.position.x, d.position.z); return; }
          this._die('hole', d.position.x, d.position.z); return;
        }
      }
    }
  }

  // ---- hazards (RED == death) ----
  _checkHazards() {
    if (this.state !== 'playing') return;
    const mx = this.marble.position.x, mz = this.marble.position.z, r = this.radius - this.forgive * 0.15;
    const hit = (x, z, rad) => Math.hypot(mx - x, mz - z) < (r + rad);
    for (const c of this.crawlers) if (hit(c.position.x, c.position.z, 0.68)) return this._lethal(c.position.x, c.position.z);
    for (const s of this.spikes) if (s.userData.up > 0.5 && hit(s.position.x, s.position.z, 0.55)) return this._lethal(s.position.x, s.position.z);
    for (const p of this.projectiles) if (p.alive && hit(p.mesh.position.x, p.mesh.position.z, 0.3)) { p.alive = false; this.levelGroup.remove(p.mesh); return this._lethal(p.mesh.position.x, p.mesh.position.z); }
    for (const rt of this.rotators) { const ang = rt.userData.angle; const ex = rt.position.x + Math.cos(ang) * rt.userData.len; const ez = rt.position.z + Math.sin(ang) * rt.userData.len; if (distToSeg(mx, mz, rt.position.x, rt.position.z, ex, ez) < r + 0.34) return this._lethal(mx, mz); }
  }
  _lethal(x, z) { if (this.shield) { this._consumeShield(x, z); return; } this._die('hazard', x, z); }
  _consumeShield(x, z) { this.shield = false; this.activePowerups.delete('shield'); this.burst(x, 0.8, z, 0x4dffa3, 26, 9, 0.6, 4); this.cb.onSfx?.('shieldHit'); this.cb.onPowerupEnd?.('shield'); this.cb.onPowerups?.(this._activeList()); this.vel.x *= -0.4; this.vel.z *= -0.4; }

  // ---- win/die ----
  _win() {
    if (this.state !== 'playing') return; this.state = 'win'; this._endGold();
    this._fall = { x: this.finishMesh.position.x, z: this.finishMesh.position.z, t: 0 };
    const coins = this.coinsCollected, total = this.level.coinTotal || 1; let stars = 1;
    if (coins >= total * STARS.coinFractionFor2) stars = 2; if (coins >= total * STARS.coinFractionFor3) stars = 3;
    this.burst(this._fall.x, 1.2, this._fall.z, FINISH_COLOR, 44, 9, 0.9, 5); this.cb.onSfx?.('win');
    this._winData = { timeMs: this.clockMs, coins, coinTotal: total, stars };
  }
  _die(reason, x, z) {
    if (this.state !== 'playing') return; this.state = 'die'; this._endGold();
    const nearFinish = Math.hypot(this.marble.position.x - this.finishMesh.position.x, this.marble.position.z - this.finishMesh.position.z) < T * 2.5;
    this._fall = { x: x ?? this.marble.position.x, z: z ?? this.marble.position.z, t: 0, reason, nearFinish };
    this.burst(this.marble.position.x, 0.8, this.marble.position.z, this.skinDef?.mat.color ?? 0xffffff, 30, 9, 0.7, 5); this.cb.onSfx?.('die');
  }
  _deathAnim(dt) {
    if (!this._fall) return; this._fall.t += dt; const k = Math.min(1, this._fall.t / 0.5);
    if (this.state === 'win' || this._fall.reason === 'hole') {
      this.marble.position.x += (this._fall.x - this.marble.position.x) * Math.min(1, dt * 10);
      this.marble.position.z += (this._fall.z - this.marble.position.z) * Math.min(1, dt * 10);
      this.marble.position.y = MARBLE_R - k * (MARBLE_R + 4); this.marble.scale.setScalar((this.radius / this.baseRadius) * (1 - k * 0.7));
    } else { this.marble.position.y = MARBLE_R + Math.sin(k * Math.PI) * 2.2; this.marble.scale.setScalar((this.radius / this.baseRadius) * (1 - k)); }
    if (k >= 1 && !this._resolved) {
      this._resolved = true;
      if (this.state === 'win') this.cb.onWin?.(this._winData);
      else this.cb.onDie?.(this._fall.reason, { x: this._fall.x, z: this._fall.z, nearFinish: this._fall.nearFinish });
    }
  }
  beginResolveReset() { this._resolved = false; }

  // ---- idle detection (churn signal) ----
  _idleCheck(dt, input) {
    const moving = input && (Math.abs(input.vec.x) > 0.05 || Math.abs(input.vec.y) > 0.05);
    if (moving || Math.hypot(this.vel.x, this.vel.z) > 0.5) { this.idleTimer = 0; if (this._idleFired) { this._idleFired = false; this.cb.onActive?.(); } }
    else { this.idleTimer += dt; if (this.idleTimer > 5 && !this._idleFired) { this._idleFired = true; this.cb.onIdle?.(); } }
  }

  // ---- finish arrow ----
  _finishArrow() {
    if (!this.cb.onFinishArrow) return;
    const v = this.finishMesh.position.clone(); v.y = 1.4; v.project(this.camera);
    const onScreen = v.z < 1 && Math.abs(v.x) < 0.9 && Math.abs(v.y) < 0.9;
    this.cb.onFinishArrow({ visible: !onScreen, x: v.x, y: v.y });
  }

  _animateDecor(dt) {
    for (const coin of this.coins) { if (coin.userData.collected) continue; coin.rotation.z += dt * 3; coin.position.y = coin.userData.baseY + Math.sin(this._t * 2 + coin.userData.spin) * 0.12; }
    for (const pu of this.powerups) { if (pu.userData.collected) continue; pu.userData.orb.rotation.y += dt * 1.6; pu.userData.halo.rotation.z += dt * 1.3; pu.position.y = 1.55 + Math.sin(this._t * 2) * 0.18; if (pu.userData.icon) pu.userData.icon.lookAt(this.camera.position); }
    for (const bp of this.boostPads) { const s = 1 + 0.25 * Math.sin(this._t * 5); bp.userData.ring.scale.set(s, s, s); bp.userData.pad.material.emissiveIntensity = 0.7 + 0.4 * Math.sin(this._t * 5); }
    if (this.finishMesh?.userData.beam) {
      this.finishMesh.userData.rim.rotation.z += dt * 0.8;
      this.finishMesh.userData.beam.material.opacity = 0.18 + Math.sin(this._t * 3) * 0.07;
      if (this.state === 'playing' && Math.random() < 0.5) this.burst(this.finishMesh.position.x + (Math.random() - 0.5) * 1.6, 0.4 + Math.random() * 3, this.finishMesh.position.z + (Math.random() - 0.5) * 1.6, FINISH_COLOR, 1, 1.5, 0.9, 2.5);
    }
    if (this._rainbow && this.marble) { const h = (this._t * 0.15) % 1; this.marble.material.emissive.setHSL(h, 1, 0.5); if (!this.skinDef?.tex) this.marble.material.color.setHSL(h, 0.7, 0.5); }
    if (this.blob && this.marble) { this.blob.position.set(this.marble.position.x, 0.03, this.marble.position.z); this.blob.scale.setScalar(this.radius / this.baseRadius); this.blob.visible = !(this.wallsPhased && this.phaseAmt > 0.5); }
  }
  _idleAnim(dt) { if (this.marble) this.marble.position.y = MARBLE_R + Math.sin(this._t * 2) * 0.08; }

  _trailUpdate(dt) {
    if (!this.trail || !this.trail.visible) return;
    const sp = Math.hypot(this.vel.x, this.vel.z); const pos = this.trail.geometry.attributes.position.array; const col = this.trail.geometry.attributes.color.array;
    for (let i = 0; i < this._trailN; i++) this._trailLife[i] -= dt * 2.2;
    if (sp > 1.5) { const i = this._trailHead; this._trailHead = (this._trailHead + 1) % this._trailN; pos[i*3] = this.marble.position.x + (Math.random()-0.5)*0.2; pos[i*3+1] = this.marble.position.y; pos[i*3+2] = this.marble.position.z + (Math.random()-0.5)*0.2; this._trailLife[i] = 1; }
    let c = this.trailColor; if (this._trailRainbow) c = new THREE.Color().setHSL((this._t * 0.2) % 1, 1, 0.55);
    for (let i = 0; i < this._trailN; i++) { const k = Math.max(0, this._trailLife[i]); if (this.trailDef?.id === 'bubble') pos[i*3+1] += dt * 0.6 * k; col[i*3]=c.r*k; col[i*3+1]=c.g*k; col[i*3+2]=c.b*k; if (k<=0) pos[i*3+1]=-9999; }
    this.trail.geometry.attributes.position.needsUpdate = true; this.trail.geometry.attributes.color.needsUpdate = true;
  }

  // ---- camera (close third-person chase rig) ----
  // yaw 0 looks toward -Z; +yaw turns toward +X. Forward/right are cached so
  // steering can be made camera-relative in _physics.
  _setHeadingVecs() {
    const s = Math.sin(this.camYaw), c = Math.cos(this.camYaw);
    this._fwd.set(s, 0, -c); this._right.set(c, 0, s);
  }
  _aimYawFrom(dx, dz) { return Math.atan2(dx, -dz); }   // direction -> yaw
  _setInitialHeading() {
    // Aim the rig from start toward finish, SNAPPED to the nearest grid
    // direction. Snapping keeps the maze axis-aligned on screen (corridors run
    // straight up/down/left/right) and — crucially — the heading is then LOCKED
    // for the whole level. The camera never re-aims to the marble's motion, so
    // steering stays rock-steady: W is always "up the screen", forever.
    const f = this.level.finish, s = this.level.start;
    const a = this.tileWorld(s.tx, s.ty), b = this.tileWorld(f.tx, f.ty);
    let dx = b.x - a.x, dz = b.z - a.z;
    if (Math.hypot(dx, dz) < 1e-3) { dx = 0; dz = -1; }
    const q = Math.PI / 2;
    this.camYaw = this.camYawTarget = Math.round(this._aimYawFrom(dx, dz) / q) * q;
  }
  _updateCameraImmediate() {
    this._setHeadingVecs();
    const m = this.marble.position;
    this.camPos.set(m.x - this._fwd.x * CAMERA.distance, CAMERA.height, m.z - this._fwd.z * CAMERA.distance);
    this.camera.position.copy(this.camPos);
    this.camTarget.set(m.x + this._fwd.x * CAMERA.lookAhead, CAMERA.lookHeight, m.z + this._fwd.z * CAMERA.lookAhead);
    this.camera.lookAt(this.camTarget);
    this._curFov = CAMERA.fov; this.camera.fov = CAMERA.fov; this.camera.updateProjectionMatrix();
    this.sun.position.set(m.x + 18, 44, m.z + 24); this.sun.target.position.copy(m); this.sun.target.updateMatrixWorld();
  }
  _camera(dt) {
    const m = this.marble.position, sp = Math.hypot(this.vel.x, this.vel.z);
    // Heading is LOCKED for the level (set in _setInitialHeading). The camera
    // only ever tracks the marble's POSITION, never its direction of travel —
    // that coupling was what made steering feel like it fought back.
    this._setHeadingVecs();

    const k = 1 - Math.exp(-CAMERA.posLerp * dt);
    const dpx = m.x - this._fwd.x * CAMERA.distance, dpz = m.z - this._fwd.z * CAMERA.distance;
    this.camPos.x += (dpx - this.camPos.x) * k; this.camPos.y += (CAMERA.height - this.camPos.y) * k; this.camPos.z += (dpz - this.camPos.z) * k;
    this.camera.position.copy(this.camPos);
    const tx = m.x + this._fwd.x * CAMERA.lookAhead, tz = m.z + this._fwd.z * CAMERA.lookAhead;
    this.camTarget.x += (tx - this.camTarget.x) * k; this.camTarget.y += (CAMERA.lookHeight - this.camTarget.y) * k; this.camTarget.z += (tz - this.camTarget.z) * k;
    this.camera.lookAt(this.camTarget);

    // speed-reactive FOV — a subtle dolly-punch that sells velocity
    const boost = this._boosting ? 1 : 0;
    const f = Math.min(1, sp / PHYS.maxSpeed) * 0.8 + boost * 0.2;
    const fovT = CAMERA.fov + CAMERA.fovBoost * f;
    this._curFov += (fovT - this._curFov) * (1 - Math.exp(-4 * dt));
    if (Math.abs(this._curFov - this.camera.fov) > 0.01) { this.camera.fov = this._curFov; this.camera.updateProjectionMatrix(); }

    this.sun.position.set(m.x + 18, 44, m.z + 24); this.sun.target.position.set(m.x, 0, m.z); this.sun.target.updateMatrixWorld();
  }

  _onResize = () => {
    if (!this.renderer) return;
    const w = window.innerWidth, h = window.innerHeight;
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.composer?.setSize(w, h); this.bloomPass?.setSize(w, h);
  };

  // ---- performance ----
  setQuality(q) {
    this.qfixed = (q === 'auto') ? null : q; this.autoQuality = (q === 'auto');
    if (q === 'low') this._applyTier(2); else if (q === 'high') this._applyTier(0); else this._applyTier(this._degraded);
  }
  _applyTier(tier) {
    this._degraded = tier;
    if (tier >= 2) { this.renderer.setPixelRatio(1); this.renderer.shadowMap.enabled = false; this.sun.castShadow = false; }
    else if (tier === 1) { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.3)); this.renderer.shadowMap.enabled = true; this.sun.castShadow = true; if (this.shadowSize !== 1024) { this.shadowSize = 1024; this.sun.shadow.mapSize.set(1024, 1024); } }
    else { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); this.renderer.shadowMap.enabled = true; this.sun.castShadow = true; }
    // bloom is the first thing to go on weak hardware; bypass the whole
    // composer at the lowest tier so we draw straight to the canvas.
    this.usePost = !!this.composer && tier < 2;
    if (this.bloomPass) this.bloomPass.enabled = tier < 2;
    if (this.composer) { this.composer.setPixelRatio(this.renderer.getPixelRatio()); this.composer.setSize(window.innerWidth, window.innerHeight); }
  }
  _perf(dt) {
    if (!this.autoQuality) return;
    this._fpsAcc += dt; this._fpsN++;
    if (this._fpsAcc >= 1.5) {
      const fps = this._fpsN / this._fpsAcc; this._fpsAcc = 0; this._fpsN = 0;
      if (fps < 40) { this._lowStreak = (this._lowStreak || 0) + 1; if (this._lowStreak >= 2 && this._degraded < 2) { this._applyTier(this._degraded + 1); this._lowStreak = 0; } }
      else this._lowStreak = 0;
      // NEVER auto-upgrade: re-toggling pixelRatio/shadows mid-session is what
      // caused the periodic whole-screen flicker. Quality only steps down.
    }
  }

  dispose() { window.removeEventListener('resize', this._onResize); this._clearLevel(); this.renderer.dispose(); }
}

// ---- helpers ----
function distToSeg(px, pz, ax, az, bx, bz) { const dx = bx - ax, dz = bz - az; const l2 = dx*dx + dz*dz || 1e-6; let t = ((px-ax)*dx + (pz-az)*dz)/l2; t = Math.max(0, Math.min(1, t)); const cx = ax+t*dx, cz = az+t*dz; return Math.hypot(px-cx, pz-cz); }
function chevronGeo() { return new THREE.BoxGeometry(0.9, 0.06, 0.28); }
function pent(x, cx, cy, r, rot) { x.beginPath(); for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; const px = cx + Math.cos(a) * r, py = cy + Math.sin(a) * r; i ? x.lineTo(px, py) : x.moveTo(px, py); } x.closePath(); x.fill(); }
function line(x, x1, y1, x2, y2) { x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); }
