// =====================================================================
//  game.js — the 3D engine & gameplay.
//  Owns the Three.js scene, marble physics, every entity/hazard system,
//  power-up effects, particles, trails and the follow camera.
//  UI/main talk to it through a callbacks object.
// =====================================================================
import * as THREE from 'three';
import { T, WALL_H, MARBLE_R, PHYS, RADII, STARS, POWERUPS } from './config.js';

const UP = new THREE.Vector3(0, 1, 0);
const tmpV = new THREE.Vector3();

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.cb = {};
    this.state = 'idle';          // idle | playing | win | die | paused
    this.level = null;
    this.timeScale = 1;           // slow-mo
    this.clockMs = 0;             // level timer
    this._t = 0;                  // global anim time
    this.activePowerups = new Map(); // id -> remaining seconds
    this.coinsCollected = 0;
    this.combo = 0; this.comboTimer = 0;
    this.shield = false;
    this.coinMult = 1;
    this.skinDef = null; this.trailDef = null;

    this._initRenderer();
    this._initScene();
    this._initParticles();
    this._geo = {};
    this.levelGroup = new THREE.Group();
    this.scene.add(this.levelGroup);

    window.addEventListener('resize', this._onResize);
  }

  setCallbacks(cb) { this.cb = cb || {}; }

  // ---------------------------------------------------------------
  //  Renderer / scene scaffolding
  // ---------------------------------------------------------------
  _initRenderer() {
    const r = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    r.setSize(window.innerWidth, window.innerHeight);
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = r;
  }

  _initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 26, 20);
    this.camera.lookAt(0, 0, 0);
    this.camTarget = new THREE.Vector3();
    this.camPos = new THREE.Vector3(0, 26, 20);

    // lights (configured per world in loadLevel)
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
    this.scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.4);
    this.sun.position.set(18, 40, 22);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun);
    this.scene.add(this.sun.target);
    this.fill = new THREE.AmbientLight(0xffffff, 0.18);
    this.scene.add(this.fill);

    // gradient sky dome
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x9fe0ff) }, bottom: { value: new THREE.Color(0xdff6ff) } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `,
      fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 bottom;
        void main(){ float h = clamp(normalize(vP).y*0.5+0.5,0.0,1.0); gl_FragColor = vec4(mix(bottom, top, pow(h,0.7)),1.0);} `,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), this.skyMat);
    sky.scale.setScalar(500); sky.frustumCulled = false; sky.renderOrder = -1;
    this.scene.add(sky);
    this.scene.fog = new THREE.FogExp2(0xdff6ff, 0.012);
  }

  _makeEnvCube(world) {
    const faces = [];
    const top = new THREE.Color(world.sky), bot = new THREE.Color(world.floorEdge);
    for (let i = 0; i < 6; i++) {
      const c = document.createElement('canvas'); c.width = c.height = 96;
      const ctx = c.getContext('2d');
      if (i === 2) { ctx.fillStyle = '#' + top.getHexString(); ctx.fillRect(0, 0, 96, 96); }       // +Y sky
      else if (i === 3) { ctx.fillStyle = '#' + bot.getHexString(); ctx.fillRect(0, 0, 96, 96); }   // -Y ground
      else {
        const g = ctx.createLinearGradient(0, 0, 0, 96);
        g.addColorStop(0, '#' + top.getHexString());
        g.addColorStop(0.55, '#' + new THREE.Color(world.horizon).getHexString());
        g.addColorStop(1, '#' + bot.getHexString());
        ctx.fillStyle = g; ctx.fillRect(0, 0, 96, 96);
      }
      faces.push(c);
    }
    const cube = new THREE.CubeTexture(faces);
    cube.colorSpace = THREE.SRGBColorSpace;
    cube.needsUpdate = true;
    return cube;
  }

  geo(key, make) { return this._geo[key] || (this._geo[key] = make()); }

  // ---------------------------------------------------------------
  //  Coordinate helpers
  // ---------------------------------------------------------------
  tileWorld(tx, ty) {
    return { x: (tx - (this.level.gw - 1) / 2) * T, z: (ty - (this.level.gh - 1) / 2) * T };
  }
  worldTile(x, z) {
    return { tx: Math.round(x / T + (this.level.gw - 1) / 2), ty: Math.round(z / T + (this.level.gh - 1) / 2) };
  }
  isWall(tx, ty) {
    const g = this.level.grid;
    if (ty < 0 || tx < 0 || ty >= this.level.gh || tx >= this.level.gw) return true;
    return g[ty][tx] === 1;
  }

  // ---------------------------------------------------------------
  //  Level build / teardown
  // ---------------------------------------------------------------
  _clearLevel() {
    this.levelGroup.traverse((o) => {
      if (o.geometry && o.userData._own) o.geometry.dispose();
      if (o.material && o.userData._own) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      }
    });
    while (this.levelGroup.children.length) this.levelGroup.remove(this.levelGroup.children[0]);
    if (this.envCube) { this.envCube.dispose?.(); this.envCube = null; }
  }

  loadLevel(data, skinDef, trailDef) {
    this._clearLevel();
    this.level = data;
    this.skinDef = skinDef; this.trailDef = trailDef;
    const w = data.world;

    // environment + palette
    this.envCube = this._makeEnvCube(w);
    this.scene.environment = this.envCube;
    this.skyMat.uniforms.top.value.set(w.sky);
    this.skyMat.uniforms.bottom.value.set(w.horizon);
    this.scene.fog.color.set(w.horizon);
    this.scene.fog.density = w.fog;
    this.renderer.setClearColor(new THREE.Color(w.horizon), 1);
    this.hemi.color.set(w.hemiSky); this.hemi.groundColor.set(w.hemiGround); this.hemi.intensity = w.hemiInt;
    this.sun.color.set(w.sun); this.sun.intensity = w.sunInt;

    // shadow frustum to cover maze
    const halfX = (data.gw / 2) * T + T, halfZ = (data.gh / 2) * T + T;
    const half = Math.max(halfX, halfZ);
    const sc = this.sun.shadow.camera;
    sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 1; sc.far = 160;
    sc.updateProjectionMatrix();

    // ---- floor + apron ----
    const floorMat = new THREE.MeshStandardMaterial({ color: w.floor, roughness: 0.95, metalness: 0.0 });
    floorMat.userData._own = true;
    const fW = data.gw * T, fD = data.gh * T;
    const floor = new THREE.Mesh(new THREE.BoxGeometry(fW, 1.5, fD), floorMat);
    floor.geometry.userData._own = true;
    floor.position.y = -0.75; floor.receiveShadow = true;
    this.levelGroup.add(floor);
    const apronMat = new THREE.MeshStandardMaterial({ color: w.floorEdge, roughness: 1.0 });
    apronMat.userData._own = true;
    const apron = new THREE.Mesh(new THREE.BoxGeometry(fW + T * 0.6, 3.5, fD + T * 0.6), apronMat);
    apron.geometry.userData._own = true; apron.position.y = -2.6; apron.receiveShadow = true;
    this.levelGroup.add(apron);

    // ---- walls (instanced; only visible faces) ----
    const wallTiles = [];
    for (let y = 0; y < data.gh; y++) for (let x = 0; x < data.gw; x++) {
      if (data.grid[y][x] !== 1) continue;
      let exposed = false;
      for (const [dx, dy] of [[0,-1],[1,0],[0,1],[-1,0]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= data.gw || ny >= data.gh || data.grid[ny][nx] === 0) { exposed = true; break; }
      }
      if (exposed) wallTiles.push([x, y]);
    }
    const wallGeo = new THREE.BoxGeometry(T, WALL_H, T); wallGeo.userData._own = true;
    const wallMat = new THREE.MeshStandardMaterial({
      color: w.wall, roughness: 0.7, metalness: w.emissiveWorld ? 0.3 : 0.05,
      emissive: w.emissiveWorld ? new THREE.Color(w.wallTop) : new THREE.Color(0x000000),
      emissiveIntensity: w.emissiveWorld ? 0.18 : 0,
    });
    wallMat.userData._own = true;
    const walls = new THREE.InstancedMesh(wallGeo, wallMat, wallTiles.length);
    walls.castShadow = true; walls.receiveShadow = true;
    const m = new THREE.Matrix4();
    wallTiles.forEach(([x, y], i) => {
      const p = this.tileWorld(x, y);
      m.makeTranslation(p.x, WALL_H / 2, p.z);
      walls.setMatrixAt(i, m);
    });
    walls.instanceMatrix.needsUpdate = true;
    this.levelGroup.add(walls);

    // ---- holes (finish + decoys) ----
    this.finishMesh = this._makeHole(data.finish, true, w);
    this.decoyMeshes = (data.decoys || []).map(d => this._makeHole(d, false, w));

    // ---- coins ----
    this.coins = (data.coins || []).map(c => this._makeCoin(c));
    this.coinsCollected = 0;

    // ---- boost pads ----
    this.boostPads = (data.boostPads || []).map(p => this._makeBoostPad(p, w));
    // ---- bouncers ----
    this.bouncers = (data.bouncers || []).map(b => this._makeBouncer(b));
    // ---- crawlers ----
    this.crawlers = (data.crawlers || []).map(c => this._makeCrawler(c));
    // ---- spikes ----
    this.spikes = (data.spikes || []).map(s => this._makeSpike(s));
    // ---- turrets ----
    this.turrets = (data.turrets || []).map(t => this._makeTurret(t, w));
    this.projectiles = [];
    // ---- size zones ----
    this.sizeZones = (data.sizeZones || []).map(z => this._makeSizeZone(z));
    // ---- rotators ----
    this.rotators = (data.rotators || []).map(r => this._makeRotator(r, w));
    // ---- power-ups ----
    this.powerups = (data.powerups || []).map(p => this._makePowerup(p));

    // ---- marble ----
    this._makeMarble(skinDef, trailDef);
    const sp = this.tileWorld(data.start.tx, data.start.ty);
    this.radius = MARBLE_R; this.baseRadius = MARBLE_R;
    this.marble.position.set(sp.x, MARBLE_R, sp.z);
    this.marble.scale.setScalar(1);
    this.vel = { x: 0, z: 0 };
    this.activePowerups.clear(); this.shield = false; this.coinMult = 1; this.timeScale = 1;
    this.clockMs = 0; this.combo = 0; this.comboTimer = 0;

    // place camera instantly
    this._updateCameraImmediate();
    this._fall = null; this._resolved = false; this._boosting = false;
    this.state = 'idle';
  }

  // Respawn at the nearest point on the guaranteed safe path, with a
  // brief protective shield. Keeps coins & timer (used by rewarded revive).
  revive() {
    const safe = this.level.safe;
    let best = null, bd = Infinity;
    for (const k of safe) {
      const [tx, ty] = k.split(',').map(Number);
      const p = this.tileWorld(tx, ty);
      const d = Math.hypot(p.x - this.marble.position.x, p.z - this.marble.position.z);
      if (d < bd) { bd = d; best = p; }
    }
    const p = best || this.tileWorld(this.level.start.tx, this.level.start.ty);
    this.marble.position.set(p.x, MARBLE_R, p.z);
    this.marble.scale.setScalar(this.radius / this.baseRadius);
    this.vel = { x: 0, z: 0 };
    this._fall = null; this._resolved = false;
    this.shield = true; this.activePowerups.set('shield', 2.6);
    this.cb.onPowerups?.(this._activeList());
    this.state = 'playing';
  }

  // ---- mesh factories ----
  _makeHole(tile, isFinish, w) {
    const g = new THREE.Group();
    const p = this.tileWorld(tile.tx, tile.ty);
    g.position.set(p.x, 0, p.z);
    const R = T * 0.42;
    const pit = new THREE.Mesh(
      this.geo('pit', () => new THREE.CylinderGeometry(1, 0.6, 6, 24, 1, true)),
      this._own(new THREE.MeshStandardMaterial({ color: 0x05070c, roughness: 1, metalness: 0, side: THREE.DoubleSide })));
    pit.scale.set(R, 1, R); pit.position.y = -3; g.add(pit);
    const disc = new THREE.Mesh(
      this.geo('disc', () => new THREE.CircleGeometry(1, 28)),
      this._own(new THREE.MeshBasicMaterial({ color: 0x02040a })));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.02; disc.scale.setScalar(R); g.add(disc);
    const rimColor = isFinish ? w.accent : 0xff3b30;
    const rim = new THREE.Mesh(
      this.geo('rim', () => new THREE.TorusGeometry(1, 0.12, 12, 28)),
      this._own(new THREE.MeshStandardMaterial({ color: rimColor, emissive: rimColor, emissiveIntensity: isFinish ? 1.1 : 0.7, roughness: 0.4 })));
    rim.rotation.x = -Math.PI / 2; rim.position.y = 0.05; rim.scale.setScalar(R); g.add(rim);
    if (isFinish) {
      const beam = new THREE.Mesh(
        this.geo('beam', () => new THREE.CylinderGeometry(0.9, 0.9, 18, 20, 1, true)),
        this._own(new THREE.MeshBasicMaterial({ color: w.accent, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })));
      beam.position.y = 9; beam.scale.set(R, 1, R); g.add(beam);
      g.userData.beam = beam;
    }
    g.userData = { ...g.userData, tile, R, baseR: R, isFinish, rim };
    this.levelGroup.add(g);
    return g;
  }

  _makeCoin(c) {
    const p = this.tileWorld(c.tx, c.ty);
    const mesh = new THREE.Mesh(
      this.geo('coin', () => new THREE.CylinderGeometry(0.5, 0.5, 0.14, 18)),
      this._own(new THREE.MeshStandardMaterial({ color: 0xffd23a, emissive: 0xffae00, emissiveIntensity: 0.45, metalness: 1, roughness: 0.3 })));
    mesh.rotation.x = Math.PI / 2;
    mesh.position.set(p.x, 1.0, p.z);
    mesh.castShadow = true;
    mesh.userData = { tx: c.tx, ty: c.ty, collected: false, baseY: 1.0, risk: !!c.risk, spin: Math.random() * 6 };
    this.levelGroup.add(mesh);
    return mesh;
  }

  _makeBoostPad(p, w) {
    const g = new THREE.Group();
    const wp = this.tileWorld(p.tx, p.ty); g.position.set(wp.x, 0.06, wp.z);
    const pad = new THREE.Mesh(this.geo('padBox', () => new THREE.BoxGeometry(T * 0.8, 0.12, T * 0.8)),
      this._own(new THREE.MeshStandardMaterial({ color: w.accent, emissive: w.accent, emissiveIntensity: 0.8, roughness: 0.4 })));
    g.add(pad);
    const arrow = new THREE.Mesh(this.geo('arrow', () => new THREE.ConeGeometry(0.45, 0.9, 4)),
      this._own(new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 })));
    arrow.rotation.x = Math.PI / 2;
    arrow.rotation.z = Math.atan2(p.dir.x, -p.dir.y);
    arrow.position.y = 0.4; g.add(arrow);
    g.userData = { tile: p, dir: p.dir, cd: 0 };
    this.levelGroup.add(g); return g;
  }

  _makeBouncer(b) {
    const wp = this.tileWorld(b.tx, b.ty);
    const mesh = new THREE.Mesh(this.geo('bounce', () => new THREE.CylinderGeometry(T * 0.34, T * 0.42, 0.5, 20)),
      this._own(new THREE.MeshStandardMaterial({ color: 0xff5bb0, emissive: 0xff2a8a, emissiveIntensity: 0.7, roughness: 0.3 })));
    mesh.position.set(wp.x, 0.25, wp.z); mesh.castShadow = true;
    mesh.userData = { tile: b, cd: 0, squash: 0 };
    this.levelGroup.add(mesh); return mesh;
  }

  _makeCrawler(c) {
    const mesh = new THREE.Mesh(this.geo('crawl', () => new THREE.IcosahedronGeometry(0.78, 1)),
      this._own(new THREE.MeshStandardMaterial({ color: 0x6fdf2a, emissive: 0x3aff10, emissiveIntensity: 0.8, roughness: 0.4 })));
    mesh.castShadow = true;
    const pts = c.path.map(t => { const p = this.tileWorld(t.tx, t.ty); return new THREE.Vector3(p.x, 0.78, p.z); });
    mesh.userData = { pts, speed: c.speed, u: 0, dir: 1 };
    if (pts.length) mesh.position.copy(pts[0]);
    this.levelGroup.add(mesh); return mesh;
  }

  _makeSpike(s) {
    const g = new THREE.Group();
    const wp = this.tileWorld(s.tx, s.ty); g.position.set(wp.x, 0, wp.z);
    const cone = new THREE.Mesh(this.geo('spike', () => new THREE.ConeGeometry(0.7, 1.6, 5)),
      this._own(new THREE.MeshStandardMaterial({ color: 0xcfd6df, metalness: 0.8, roughness: 0.3 })));
    cone.position.y = 0.8; g.add(cone);
    const base = new THREE.Mesh(this.geo('spikeBase', () => new THREE.CircleGeometry(T * 0.34, 18)),
      this._own(new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 1 })));
    base.rotation.x = -Math.PI / 2; base.position.y = 0.02; g.add(base);
    g.userData = { tile: s, phase: s.phase, period: s.period, cone, up: 0 };
    this.levelGroup.add(g); return g;
  }

  _makeTurret(t, w) {
    const g = new THREE.Group();
    const wp = this.tileWorld(t.tx, t.ty); g.position.set(wp.x, 0, wp.z);
    const base = new THREE.Mesh(this.geo('tBase', () => new THREE.CylinderGeometry(0.7, 0.8, 1.0, 14)),
      this._own(new THREE.MeshStandardMaterial({ color: 0x2b3240, metalness: 0.6, roughness: 0.4 })));
    base.position.y = 0.5; g.add(base);
    const barrel = new THREE.Mesh(this.geo('tBarrel', () => new THREE.CylinderGeometry(0.22, 0.22, 1.2, 12)),
      this._own(new THREE.MeshStandardMaterial({ color: 0x9fb0c8, emissive: w.accent, emissiveIntensity: 0.4, metalness: 0.7, roughness: 0.3 })));
    barrel.rotation.z = Math.PI / 2;
    const ang = Math.atan2(t.dir.y, t.dir.x);
    barrel.position.set(t.dir.x * 0.7, 0.9, t.dir.y * 0.7);
    barrel.rotation.y = -ang; g.add(barrel);
    g.rotation.y = 0;
    g.userData = { tile: t, dir: t.dir, period: t.period, phase: t.phase, timer: t.phase * t.period };
    this.levelGroup.add(g); return g;
  }

  _makeSizeZone(z) {
    const g = new THREE.Group();
    const wp = this.tileWorld(z.tx, z.ty); g.position.set(wp.x, 0.05, wp.z);
    const col = z.kind === 'shrink' ? 0x49d0ff : 0xff8a3d;
    const ring = new THREE.Mesh(this.geo('ring', () => new THREE.TorusGeometry(T * 0.34, 0.1, 10, 24)),
      this._own(new THREE.MeshStandardMaterial({ color: col, emissive: col, emissiveIntensity: 0.8, roughness: 0.4 })));
    ring.rotation.x = -Math.PI / 2; g.add(ring);
    g.userData = { tile: z, kind: z.kind, cd: 0 };
    this.levelGroup.add(g); return g;
  }

  _makeRotator(r, w) {
    const g = new THREE.Group();
    const wp = this.tileWorld(r.tx, r.ty); g.position.set(wp.x, 0.9, wp.z);
    const pivot = new THREE.Mesh(this.geo('pivot', () => new THREE.CylinderGeometry(0.4, 0.4, 1.8, 12)),
      this._own(new THREE.MeshStandardMaterial({ color: 0x33405a, metalness: 0.6, roughness: 0.4 })));
    g.add(pivot);
    const len = r.len * T;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(len, 0.6, 0.6),
      this._own(new THREE.MeshStandardMaterial({ color: 0xff5a2a, emissive: 0xff5a2a, emissiveIntensity: 0.6, roughness: 0.5 })));
    arm.geometry.userData._own = true;
    arm.position.x = len / 2 - T * 0.5; arm.castShadow = true; g.add(arm);
    g.userData = { tile: r, len, speed: r.speed, angle: Math.random() * 6 };
    this.levelGroup.add(g); return g;
  }

  _makePowerup(p) {
    const def = POWERUPS[p.type];
    const g = new THREE.Group();
    const wp = this.tileWorld(p.tx, p.ty); g.position.set(wp.x, 1.1, wp.z);
    const core = new THREE.Mesh(this.geo('puCore', () => new THREE.IcosahedronGeometry(0.62, 0)),
      this._own(new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 0.9, roughness: 0.25, metalness: 0.2 })));
    core.castShadow = true; g.add(core);
    const halo = new THREE.Mesh(this.geo('puHalo', () => new THREE.TorusGeometry(0.95, 0.06, 8, 24)),
      this._own(new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.6 })));
    halo.rotation.x = Math.PI / 2; g.add(halo);
    g.userData = { tx: p.tx, ty: p.ty, type: p.type, def, collected: false, halo, core };
    this.levelGroup.add(g); return g;
  }

  _makeMarble(skinDef, trailDef) {
    if (!this.marble) {
      this.marble = new THREE.Mesh(new THREE.SphereGeometry(MARBLE_R, 40, 32), new THREE.MeshPhysicalMaterial());
      this.marble.castShadow = true; this.marble.geometry.userData._own = false;
      this.scene.add(this.marble);
      // contact shadow blob (cheap, always under marble)
      this.blob = new THREE.Mesh(new THREE.CircleGeometry(MARBLE_R * 1.2, 20),
        new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
      this.blob.rotation.x = -Math.PI / 2;
      this.scene.add(this.blob);
      // trail pool
      this._initTrail();
    }
    this.applySkin(skinDef);
    this.applyTrail(trailDef);
  }

  applySkin(def) {
    this.skinDef = def;
    const mat = this.marble.material;
    const mm = def.mat;
    mat.color = new THREE.Color(mm.color);
    mat.metalness = mm.metalness ?? 0.0;
    mat.roughness = mm.roughness ?? 0.2;
    mat.clearcoat = mm.clearcoat ?? 0.0;
    mat.clearcoatRoughness = 0.08;
    mat.emissive = new THREE.Color(mm.emissive ?? 0x000000);
    mat.emissiveIntensity = mm.emissiveInt ?? 0;
    mat.envMapIntensity = 1.1;
    this._rainbow = !!mm.rainbow;
    mat.needsUpdate = true;
  }

  applyTrail(def) {
    this.trailDef = def;
    const on = def && def.id !== 'none';
    if (this.trail) this.trail.visible = on;
    if (on) this.trailColor = new THREE.Color(def.color);
    this._trailRainbow = !!(def && def.rainbow);
  }

  _own(mat) { mat.userData = mat.userData || {}; mat.userData._own = true; return mat; }

  // ---------------------------------------------------------------
  //  Trail (pooled additive points)
  // ---------------------------------------------------------------
  _initTrail() {
    const N = 48;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    const mat = new THREE.PointsMaterial({ size: 0.9, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.trail = new THREE.Points(geo, mat);
    this.trail.frustumCulled = false;
    this.scene.add(this.trail);
    this._trailN = N; this._trailHead = 0;
    this._trailLife = new Float32Array(N);
    this._trailColor = new THREE.Color(0xffffff);
    this.trailColor = new THREE.Color(0xffffff);
  }

  // ---------------------------------------------------------------
  //  GPU-ish particle system (single Points buffer)
  // ---------------------------------------------------------------
  _initParticles() {
    const M = 700;
    this.pM = M;
    const geo = new THREE.BufferGeometry();
    this.pPos = new Float32Array(M * 3);
    this.pCol = new Float32Array(M * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.pPos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(this.pCol, 3));
    const mat = new THREE.PointsMaterial({ size: 0.5, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
    this.particles = new THREE.Points(geo, mat);
    this.particles.frustumCulled = false;
    this.pVel = new Float32Array(M * 3);
    this.pLife = new Float32Array(M);
    this.pMax = new Float32Array(M);
    this.pBase = new Float32Array(M * 3);
    this.pHead = 0;
    // initialize far away
    for (let i = 0; i < M; i++) this.pPos[i * 3 + 1] = -9999;
  }

  burst(x, y, z, color, count = 16, spd = 6, life = 0.6, up = 2) {
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
      const idx = this.pHead; this.pHead = (this.pHead + 1) % this.pM;
      const a = Math.random() * Math.PI * 2, e = Math.random() * Math.PI;
      const s = spd * (0.4 + Math.random() * 0.8);
      this.pVel[idx * 3] = Math.sin(e) * Math.cos(a) * s;
      this.pVel[idx * 3 + 1] = Math.cos(e) * s * 0.5 + up;
      this.pVel[idx * 3 + 2] = Math.sin(e) * Math.sin(a) * s;
      this.pPos[idx * 3] = x; this.pPos[idx * 3 + 1] = y; this.pPos[idx * 3 + 2] = z;
      this.pBase[idx * 3] = c.r; this.pBase[idx * 3 + 1] = c.g; this.pBase[idx * 3 + 2] = c.b;
      this.pLife[idx] = this.pMax[idx] = life * (0.6 + Math.random() * 0.6);
    }
  }

  _updateParticles(dt) {
    const M = this.pM;
    for (let i = 0; i < M; i++) {
      if (this.pLife[i] <= 0) continue;
      this.pLife[i] -= dt;
      const k = Math.max(0, this.pLife[i] / this.pMax[i]);
      this.pVel[i * 3 + 1] -= 9 * dt;          // gravity
      this.pVel[i * 3] *= 0.96; this.pVel[i * 3 + 2] *= 0.96;
      this.pPos[i * 3] += this.pVel[i * 3] * dt;
      this.pPos[i * 3 + 1] += this.pVel[i * 3 + 1] * dt;
      this.pPos[i * 3 + 2] += this.pVel[i * 3 + 2] * dt;
      this.pCol[i * 3] = this.pBase[i * 3] * k;
      this.pCol[i * 3 + 1] = this.pBase[i * 3 + 1] * k;
      this.pCol[i * 3 + 2] = this.pBase[i * 3 + 2] * k;
      if (this.pLife[i] <= 0) { this.pPos[i * 3 + 1] = -9999; this.pCol[i*3]=this.pCol[i*3+1]=this.pCol[i*3+2]=0; }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.color.needsUpdate = true;
  }

  // ---------------------------------------------------------------
  //  Lifecycle
  // ---------------------------------------------------------------
  start() { if (this.state === 'idle' || this.state === 'paused') this.state = 'playing'; }
  pause() { if (this.state === 'playing') this.state = 'paused'; }
  resume() { if (this.state === 'paused') this.state = 'playing'; }

  // ---------------------------------------------------------------
  //  Main update (sim + render)
  // ---------------------------------------------------------------
  update(dt, input) {
    dt = Math.min(dt, 0.05);
    this._t += dt;
    const sdt = dt * this.timeScale;

    if (this.state === 'playing') {
      this.clockMs += dt * 1000;
      this._physics(sdt, input);
      this._entities(sdt);
      this._powerupTick(dt);
      this._trailUpdate(dt);
      this._checkPickups();
      this._checkHoles();
      this._checkHazards();
      if (this.cb.onHud) this.cb.onHud(this._hud());
    } else if (this.state === 'win' || this.state === 'die') {
      this._deathAnim(dt);
      this._entities(sdt * 0.2);
      this._trailUpdate(dt);
    } else {
      this._idleAnim(dt);
    }

    this._animateDecor(dt);
    this._updateParticles(dt);
    this._camera(dt);
    this.renderer.render(this.scene, this.camera);
  }

  _hud() {
    const speed = Math.hypot(this.vel.x, this.vel.z);
    return {
      coins: this.coinsCollected, coinTotal: this.level.coinTotal,
      timeMs: this.clockMs, speed, maxSpeed: PHYS.maxSpeed,
      boosting: !!this._boosting, shield: this.shield,
    };
  }

  // ---- physics ----
  _physics(dt, input) {
    const w = this.level.world;
    const boosting = input && input.boost;
    this._boosting = boosting;
    let accel = PHYS.accel * (boosting ? PHYS.boostMult : 1);
    let maxv = PHYS.maxSpeed * (boosting ? PHYS.boostMult : 1);
    // power-up modifiers
    if (this.activePowerups.has('speed')) { accel *= 1.4; maxv *= 1.4; }
    // size affects agility
    const sizeF = this.baseRadius / this.radius;        // smaller => nippier
    maxv *= sizeF; accel *= sizeF;
    // world feel
    let fric = PHYS.friction;
    if (w.signature === 'slippery') fric *= 0.42;        // ice
    if (w.signature === 'lowgrav') { fric *= 0.6; maxv *= 1.12; }

    let ax = 0, az = 0;
    if (input) { ax = input.vec.x * accel; az = input.vec.y * accel; }
    // global current
    if (this.level.current) { ax += this.level.current.x * this.level.current.strength; az += this.level.current.y * this.level.current.strength; }

    this.vel.x += ax * dt; this.vel.z += az * dt;
    const fr = Math.exp(-fric * dt);
    this.vel.x *= fr; this.vel.z *= fr;
    // clamp speed
    const sp = Math.hypot(this.vel.x, this.vel.z);
    if (sp > maxv) { const k = maxv / sp; this.vel.x *= k; this.vel.z *= k; }

    // substeps to prevent tunneling at high speed
    const move = Math.hypot(this.vel.x, this.vel.z) * dt;
    const nSub = Math.max(1, Math.ceil(move / (T * 0.3)));
    const hx = this.vel.x * dt / nSub, hz = this.vel.z * dt / nSub;
    for (let s = 0; s < nSub; s++) {
      this.marble.position.x += hx; this.marble.position.z += hz;
      this._resolveWalls();
    }
    // rolling rotation
    const v = Math.hypot(this.vel.x, this.vel.z);
    if (v > 0.01) {
      const axis = tmpV.set(-this.vel.z, 0, this.vel.x).normalize();
      this.marble.rotateOnWorldAxis(axis, (v * dt) / this.radius);
    }
  }

  _resolveWalls() {
    const r = this.radius;
    const { tx, ty } = this.worldTile(this.marble.position.x, this.marble.position.z);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const wx = tx + dx, wy = ty + dy;
      if (!this.isWall(wx, wy)) continue;
      const c = this.tileWorld(wx, wy);
      const minX = c.x - T / 2, maxX = c.x + T / 2, minZ = c.z - T / 2, maxZ = c.z + T / 2;
      const px = this.marble.position.x, pz = this.marble.position.z;
      const cx = Math.max(minX, Math.min(px, maxX));
      const cz = Math.max(minZ, Math.min(pz, maxZ));
      let nx = px - cx, nz = pz - cz;
      let d2 = nx * nx + nz * nz;
      if (d2 >= r * r) continue;
      let d = Math.sqrt(d2);
      if (d < 1e-5) {
        // center inside the box: push out along least-penetration axis
        const left = px - minX, right = maxX - px, top = pz - minZ, bot = maxZ - pz;
        const mn = Math.min(left, right, top, bot);
        if (mn === left) { nx = -1; nz = 0; } else if (mn === right) { nx = 1; nz = 0; }
        else if (mn === top) { nx = 0; nz = -1; } else { nx = 0; nz = 1; }
        d = 0;
      } else { nx /= d; nz /= d; }
      const push = r - d;
      this.marble.position.x += nx * push; this.marble.position.z += nz * push;
      const vn = this.vel.x * nx + this.vel.z * nz;
      if (vn < 0) {
        this.vel.x -= (1 + PHYS.wallRestitution) * vn * nx;
        this.vel.z -= (1 + PHYS.wallRestitution) * vn * nz;
      }
    }
  }

  // ---- entities update (movement only) ----
  _entities(dt) {
    // crawlers
    for (const c of this.crawlers) {
      const pts = c.userData.pts; if (pts.length < 2) continue;
      c.userData.u += c.userData.dir * c.userData.speed * dt / T;
      if (c.userData.u >= pts.length - 1) { c.userData.u = pts.length - 1; c.userData.dir = -1; }
      if (c.userData.u <= 0) { c.userData.u = 0; c.userData.dir = 1; }
      const i = Math.floor(c.userData.u); const f = c.userData.u - i;
      const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)];
      c.position.lerpVectors(a, b, f);
      c.position.y = 0.78 + Math.sin(this._t * 4 + i) * 0.08;
      c.rotation.y += dt * 2;
    }
    // spikes
    for (const s of this.spikes) {
      const u = (this._t / s.userData.period + s.userData.phase) % 1;
      const up = u < 0.45 ? Math.min(1, u / 0.12) : Math.max(0, 1 - (u - 0.45) / 0.12);
      s.userData.up = up;
      s.userData.cone.scale.y = 0.05 + up * 0.95;
      s.userData.cone.position.y = 0.05 + (0.05 + up * 0.95) * 0.8;
    }
    // turrets
    for (const t of this.turrets) {
      t.userData.timer += dt;
      if (t.userData.timer >= t.userData.period) {
        t.userData.timer = 0;
        this._fireProjectile(t);
      }
    }
    // projectiles
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      p.mesh.position.x += p.vx * dt; p.mesh.position.z += p.vz * dt;
      const { tx, ty } = this.worldTile(p.mesh.position.x, p.mesh.position.z);
      if (this.isWall(tx, ty)) { p.alive = false; this.levelGroup.remove(p.mesh); this.burst(p.mesh.position.x, 0.6, p.mesh.position.z, 0xffaa55, 8, 4, 0.3); }
    }
    this.projectiles = this.projectiles.filter(p => p.alive);
    // rotators
    for (const r of this.rotators) {
      r.userData.angle += r.userData.speed * dt;
      r.rotation.y = r.userData.angle;
    }
    // bouncers cooldown + squash recovery
    for (const b of this.bouncers) {
      if (b.userData.cd > 0) b.userData.cd -= dt;
      b.userData.squash = Math.max(0, b.userData.squash - dt * 4);
      const sq = b.userData.squash;
      b.scale.set(1 + sq * 0.3, 1 - sq * 0.5, 1 + sq * 0.3);
    }
    for (const p of this.boostPads) if (p.userData.cd > 0) p.userData.cd -= dt;
    for (const z of this.sizeZones) if (z.userData.cd > 0) z.userData.cd -= dt;
  }

  _fireProjectile(t) {
    const mesh = new THREE.Mesh(this.geo('proj', () => new THREE.SphereGeometry(0.28, 12, 10)),
      this._own(new THREE.MeshStandardMaterial({ color: 0xff5a2a, emissive: 0xff3a10, emissiveIntensity: 1.2 })));
    const wp = this.tileWorld(t.userData.tile.tx, t.userData.tile.ty);
    mesh.position.set(wp.x + t.userData.dir.x * T * 0.5, 0.7, wp.z + t.userData.dir.y * T * 0.5);
    this.levelGroup.add(mesh);
    const speed = 11;
    this.projectiles.push({ mesh, vx: t.userData.dir.x * speed, vz: t.userData.dir.y * speed, alive: true });
  }

  // ---- pickups ----
  _checkPickups() {
    const mx = this.marble.position.x, mz = this.marble.position.z;
    // magnet pulls coins
    const magnet = this.activePowerups.has('magnet');
    for (const coin of this.coins) {
      if (coin.userData.collected) continue;
      let dx = coin.position.x - mx, dz = coin.position.z - mz;
      let dd = Math.hypot(dx, dz);
      if (magnet && dd < T * 3.2) {
        const pull = 18 * (1 - dd / (T * 3.2));
        coin.position.x -= (dx / (dd || 1)) * pull * 0.016;
        coin.position.z -= (dz / (dd || 1)) * pull * 0.016;
        dx = coin.position.x - mx; dz = coin.position.z - mz; dd = Math.hypot(dx, dz);
      }
      if (dd < RADII.coin + this.radius * 0.4) this._collectCoin(coin);
    }
    // power-ups
    for (const pu of this.powerups) {
      if (pu.userData.collected) continue;
      const dx = pu.position.x - mx, dz = pu.position.z - mz;
      if (Math.hypot(dx, dz) < RADII.powerup + this.radius * 0.4) this._collectPowerup(pu);
    }
    // boost pads
    for (const p of this.boostPads) {
      if (p.userData.cd > 0) continue;
      const dx = p.position.x - mx, dz = p.position.z - mz;
      if (Math.hypot(dx, dz) < T * 0.5) {
        const dir = p.userData.dir; const boostSpeed = 24;
        this.vel.x = dir.x * boostSpeed; this.vel.z = dir.y * boostSpeed;
        p.userData.cd = 0.6;
        this.burst(p.position.x, 0.4, p.position.z, this.level.world.accent, 14, 7, 0.4, 3);
        this.cb.onSfx?.('boost');
      }
    }
    // bouncers
    for (const b of this.bouncers) {
      if (b.userData.cd > 0) continue;
      const dx = mx - b.position.x, dz = mz - b.position.z;
      const dd = Math.hypot(dx, dz);
      if (dd < T * 0.42 + this.radius) {
        const n = dd < 1e-3 ? { x: Math.random() - 0.5, z: Math.random() - 0.5 } : { x: dx / dd, z: dz / dd };
        const power = 26;
        this.vel.x = n.x * power; this.vel.z = n.z * power;
        b.userData.cd = 0.4; b.userData.squash = 1;
        this.burst(b.position.x, 0.6, b.position.z, 0xff5bb0, 16, 8, 0.4, 4);
        this.cb.onSfx?.('bounce');
      }
    }
    // size zones
    for (const z of this.sizeZones) {
      if (z.userData.cd > 0) continue;
      const dx = z.position.x - mx, dz = z.position.z - mz;
      if (Math.hypot(dx, dz) < T * 0.34) {
        z.userData.cd = 2;
        if (z.userData.kind === 'shrink') this._startPowerup('shrink');
        else { this.radius = Math.min(this.baseRadius * 1.5, this.baseRadius * 1.5); this.activePowerups.set('grow', 7); this._applySize(); }
        this.cb.onSfx?.('powerup');
      }
    }
  }

  _collectCoin(coin) {
    coin.userData.collected = true; coin.visible = false;
    this.coinsCollected++;
    this.combo++; this.comboTimer = 1.4;
    const val = (this.activePowerups.has('x2') ? 2 : 1) * 1;
    this.burst(coin.position.x, coin.position.y, coin.position.z, 0xffd23a, 12, 5, 0.5, 2);
    this.cb.onCoin?.(this.coinsCollected, val, this.combo);
    this.cb.onSfx?.('coin', this.combo);
  }

  _collectPowerup(pu) {
    pu.userData.collected = true; pu.visible = false;
    this.burst(pu.position.x, pu.position.y, pu.position.z, pu.userData.def.color, 20, 7, 0.6, 3);
    this._startPowerup(pu.userData.type);
    this.cb.onSfx?.('powerup');
  }

  _startPowerup(id) {
    const def = POWERUPS[id] || { id, dur: 7 };
    this.activePowerups.set(id, def.dur);
    if (id === 'shield') this.shield = true;
    if (id === 'slowmo') this.timeScale = 0.55;
    if (id === 'shrink') { this.radius = this.baseRadius * 0.55; this._applySize(); }
    this.cb.onPowerupStart?.(def);
    this.cb.onPowerups?.(this._activeList());
  }

  _applySize() { this.marble.scale.setScalar(this.radius / this.baseRadius); }

  _powerupTick(dt) {
    let changed = false;
    for (const [id, t] of this.activePowerups) {
      const nt = t - dt;
      if (nt <= 0) {
        this.activePowerups.delete(id); changed = true;
        if (id === 'slowmo') this.timeScale = 1;
        if (id === 'shrink' || id === 'grow') { this.radius = this.baseRadius; this._applySize(); }
        if (id === 'shield') this.shield = false;
        this.cb.onPowerupEnd?.(id);
      } else this.activePowerups.set(id, nt);
    }
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) this.combo = 0; }
    if (changed) this.cb.onPowerups?.(this._activeList());
  }
  _activeList() {
    return [...this.activePowerups.entries()].map(([id, t]) => ({ id, t, def: POWERUPS[id] }));
  }

  // ---- holes ----
  _checkHoles() {
    const mx = this.marble.position.x, mz = this.marble.position.z;
    // finish
    const f = this.finishMesh;
    let R = f.userData.R; if (this.activePowerups.has('bigfinish')) R *= 1.7;
    if (Math.hypot(mx - f.position.x, mz - f.position.z) < R) { this._win(); return; }
    // decoys (ignored while 'ghost' active)
    if (!this.activePowerups.has('ghost')) {
      for (const d of this.decoyMeshes) {
        if (Math.hypot(mx - d.position.x, mz - d.position.z) < d.userData.R) {
          if (this.shield) { this._consumeShield(d.position.x, d.position.z); return; }
          this._die('hole', d.position.x, d.position.z); return;
        }
      }
    }
  }

  // ---- hazards (contact lethal) ----
  _checkHazards() {
    if (this.state !== 'playing') return;
    const mx = this.marble.position.x, mz = this.marble.position.z, r = this.radius;
    const hit = (x, z, rad) => Math.hypot(mx - x, mz - z) < (r + rad);
    // crawlers
    for (const c of this.crawlers) if (hit(c.position.x, c.position.z, 0.7)) return this._lethal(c.position.x, c.position.z);
    // spikes (only when up)
    for (const s of this.spikes) if (s.userData.up > 0.5 && hit(s.position.x, s.position.z, 0.5)) return this._lethal(s.position.x, s.position.z);
    // projectiles
    for (const p of this.projectiles) if (p.alive && hit(p.mesh.position.x, p.mesh.position.z, 0.3)) { p.alive = false; this.levelGroup.remove(p.mesh); return this._lethal(p.mesh.position.x, p.mesh.position.z); }
    // rotator arms (distance to swept segment)
    for (const rt of this.rotators) {
      const ang = rt.userData.angle;
      const ex = rt.position.x + Math.cos(ang) * (rt.userData.len - T * 0.5);
      const ez = rt.position.z + Math.sin(ang) * (rt.userData.len - T * 0.5);
      if (distToSegment(mx, mz, rt.position.x, rt.position.z, ex, ez) < r + 0.45) return this._lethal(mx, mz);
    }
  }

  _lethal(x, z) {
    if (this.shield) { this._consumeShield(x, z); return; }
    this._die('hazard', x, z);
  }
  _consumeShield(x, z) {
    this.shield = false; this.activePowerups.delete('shield');
    this.burst(x, 0.8, z, 0x4dffa3, 26, 9, 0.6, 4);
    this.cb.onSfx?.('shieldHit');
    this.cb.onPowerupEnd?.('shield'); this.cb.onPowerups?.(this._activeList());
    // small grace knockback toward marble center
    this.vel.x *= -0.4; this.vel.z *= -0.4;
  }

  // ---- win / die ----
  _win() {
    if (this.state !== 'playing') return;
    this.state = 'win';
    this._fall = { x: this.finishMesh.position.x, z: this.finishMesh.position.z, t: 0 };
    const coins = this.coinsCollected, total = this.level.coinTotal || 1;
    let stars = 1;
    if (coins >= total * STARS.coinFractionFor2) stars = 2;
    if (coins >= total * STARS.coinFractionFor3) stars = 3;
    this.burst(this._fall.x, 1.2, this._fall.z, this.level.world.accent, 40, 9, 0.9, 5);
    this.cb.onSfx?.('win');
    this._winData = { timeMs: this.clockMs, coins, coinTotal: total, stars };
  }
  _die(reason, x, z) {
    if (this.state !== 'playing') return;
    this.state = 'die';
    this._fall = { x: x ?? this.marble.position.x, z: z ?? this.marble.position.z, t: 0, reason };
    this.burst(this.marble.position.x, 0.8, this.marble.position.z, this.skinDef?.mat.color ?? 0xffffff, 30, 9, 0.7, 5);
    this.cb.onSfx?.('die');
  }
  _deathAnim(dt) {
    if (!this._fall) return;
    this._fall.t += dt;
    const k = Math.min(1, this._fall.t / 0.5);
    if (this.state === 'win' || this._fall.reason === 'hole') {
      // suck into hole
      this.marble.position.x += (this._fall.x - this.marble.position.x) * Math.min(1, dt * 10);
      this.marble.position.z += (this._fall.z - this.marble.position.z) * Math.min(1, dt * 10);
      this.marble.position.y = MARBLE_R - k * (MARBLE_R + 4);
      this.marble.scale.setScalar((this.radius / this.baseRadius) * (1 - k * 0.7));
    } else {
      // pop upward then gone
      this.marble.position.y = MARBLE_R + Math.sin(k * Math.PI) * 2.2;
      this.marble.scale.setScalar((this.radius / this.baseRadius) * (1 - k));
    }
    if (k >= 1 && !this._resolved) {
      this._resolved = true;
      if (this.state === 'win') this.cb.onWin?.(this._winData);
      else this.cb.onDie?.(this._fall.reason);
    }
  }

  beginResolveReset() { this._resolved = false; }

  // ---- decoration anim (always) ----
  _animateDecor(dt) {
    for (const coin of this.coins) {
      if (coin.userData.collected) continue;
      coin.rotation.z += dt * 3;
      coin.position.y = coin.userData.baseY + Math.sin(this._t * 2 + coin.userData.spin) * 0.12;
    }
    for (const pu of this.powerups) {
      if (pu.userData.collected) continue;
      pu.userData.core.rotation.y += dt * 1.5; pu.userData.core.rotation.x += dt * 0.8;
      pu.userData.halo.rotation.z += dt * 1.2;
      pu.position.y = 1.1 + Math.sin(this._t * 2) * 0.14;
    }
    if (this.finishMesh?.userData.beam) {
      this.finishMesh.userData.rim.rotation.z += dt * 0.8;
      this.finishMesh.userData.beam.material.opacity = 0.12 + Math.sin(this._t * 3) * 0.05;
    }
    // rainbow skin/trail
    if (this._rainbow && this.marble) {
      const h = (this._t * 0.15) % 1;
      this.marble.material.emissive.setHSL(h, 1, 0.5);
      this.marble.material.color.setHSL(h, 0.7, 0.5);
    }
    // marble pulse for emissive skins handled by material
    if (this.blob && this.marble) {
      this.blob.position.set(this.marble.position.x, 0.03, this.marble.position.z);
      const s = this.radius / this.baseRadius;
      this.blob.scale.setScalar(s);
    }
  }
  _idleAnim(dt) {
    // gentle bob before start (decor is animated once per frame in update())
    if (this.marble) this.marble.position.y = MARBLE_R + Math.sin(this._t * 2) * 0.08;
  }

  // ---- trail ----
  _trailUpdate(dt) {
    if (!this.trail || !this.trail.visible) return;
    const sp = Math.hypot(this.vel.x, this.vel.z);
    const pos = this.trail.geometry.attributes.position.array;
    const col = this.trail.geometry.attributes.color.array;
    // age existing (opacity is derived from life in the color-write below)
    for (let i = 0; i < this._trailN; i++) this._trailLife[i] -= dt * 2.2;
    // emit at head if moving
    if (sp > 1.5) {
      const i = this._trailHead; this._trailHead = (this._trailHead + 1) % this._trailN;
      pos[i * 3] = this.marble.position.x + (Math.random() - 0.5) * 0.2;
      pos[i * 3 + 1] = this.marble.position.y + (this.trailDef?.id === 'bubble' ? 0.2 : 0);
      pos[i * 3 + 2] = this.marble.position.z + (Math.random() - 0.5) * 0.2;
      this._trailLife[i] = 1;
    }
    // write colors by life
    let c = this.trailColor;
    if (this._trailRainbow) { c = new THREE.Color().setHSL((this._t * 0.2) % 1, 1, 0.55); }
    for (let i = 0; i < this._trailN; i++) {
      const k = Math.max(0, this._trailLife[i]);
      if (this.trailDef?.id === 'bubble') pos[i * 3 + 1] += dt * 0.6 * k; // drift up
      col[i * 3] = c.r * k; col[i * 3 + 1] = c.g * k; col[i * 3 + 2] = c.b * k;
      if (k <= 0) pos[i * 3 + 1] = -9999;
    }
    this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.attributes.color.needsUpdate = true;
  }

  // ---- camera ----
  _camOffset() {
    const span = Math.max(this.level.gw, this.level.gh) * T;
    const h = 16 + span * 0.22;
    const d = 11 + span * 0.16;
    return { h, d };
  }
  _updateCameraImmediate() {
    const { h, d } = this._camOffset();
    this.camPos.set(this.marble.position.x, h, this.marble.position.z + d);
    this.camera.position.copy(this.camPos);
    this.camTarget.copy(this.marble.position);
    this.camera.lookAt(this.camTarget);
    this.sun.position.set(this.marble.position.x + 18, 42, this.marble.position.z + 24);
    this.sun.target.position.copy(this.marble.position);
  }
  _camera(dt) {
    const { h, d } = this._camOffset();
    const lead = this.state === 'playing' ? 0.35 : 0;
    const tx = this.marble.position.x + this.vel.x * lead;
    const tz = this.marble.position.z + this.vel.z * lead;
    const k = 1 - Math.exp(-6 * dt);
    this.camPos.x += (tx - this.camPos.x) * k;
    this.camPos.z += (tz + d - this.camPos.z) * k;
    this.camPos.y += (h - this.camPos.y) * k;
    this.camera.position.copy(this.camPos);
    this.camTarget.x += (this.marble.position.x - this.camTarget.x) * k;
    this.camTarget.y += (0 - this.camTarget.y) * k;
    this.camTarget.z += (this.marble.position.z - this.camTarget.z) * k;
    this.camera.lookAt(this.camTarget);
    // keep shadow following
    this.sun.position.set(this.marble.position.x + 18, 42, this.marble.position.z + 24);
    this.sun.target.position.set(this.marble.position.x, 0, this.marble.position.z);
    this.sun.target.updateMatrixWorld();
  }

  _onResize = () => {
    if (!this.renderer) return;
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  setQuality(q) {
    if (q === 'low') { this.renderer.setPixelRatio(1); this.renderer.shadowMap.enabled = false; this.sun.castShadow = false; }
    else { this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); this.renderer.shadowMap.enabled = true; this.sun.castShadow = true; }
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    this._clearLevel();
    this.renderer.dispose();
  }
}

// distance from point to segment in XZ
function distToSegment(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az;
  const len2 = dx * dx + dz * dz || 1e-6;
  let t = ((px - ax) * dx + (pz - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cz = az + t * dz;
  return Math.hypot(px - cx, pz - cz);
}
