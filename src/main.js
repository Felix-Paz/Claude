// ============================================================
// MAIN.JS — the conductor. Boots the world, runs the cinematic
// state machine: lobby → feed → seal → travel → seven rooms of
// judgement → the verdict vault. The user never scrolls.
// ============================================================

import './styles.css';
import * as THREE from 'three';
import { initWorld } from './world.js';
import { buildFactory, roomX, INTAKE_X, VERDICT_X, BELT_Y } from './rooms.js';
import { buildCylinder } from './cylinder.js';
import { Rig } from './camera.js';
import { initFX } from './fx.js';
import { audio } from './audio.js';
import { initUI } from './ui.js';
import { TIQUES, FEED_SEQUENCE_LINES } from './copy.js';
import { analyzeStory, askTique, resolveEngine, setStoredKey, getStoredKey } from './ai.js';

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------- boot ----------------
const world = initWorld(document.getElementById('scene'));
const fx = initFX(world.scene);
const factory = buildFactory(world.scene, TIQUES);
const rig = new Rig(world.camera);

// ambient steam
fx.addSteam(V3(-6, 0.4, -6.5), { rate: 0.8 });
fx.addSteam(V3(roomX(1) + 4, 0.4, -6.8), { rate: 1.1 });
fx.addSteam(V3(roomX(4) - 5, 0.4, -7 ), { rate: 0.9 });
fx.addSteam(V3(VERDICT_X - 4, 0.4, -6.5), { rate: 1 });

// ---------------- state ----------------
const S = {
  phase: 'title',          // title | lobby | feeding | travel | room | verdict
  story: '',
  mode: 'draft',
  results: {},             // roomId → result
  metrics: null,
  engine: 'local',
  roomIdx: -1,
  cylinder: null,
  roomDeferred: {},        // roomId → {promise, resolve}
  chatHistory: {},         // roomId → [{who, text}]
  chatBusy: false,
  advanceDeferred: null,
  tweens: [],
};

function defer() {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
}

function tween(dur, fn, ease = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) {
  return new Promise((resolve) => {
    S.tweens.push({ t: 0, dur, fn, ease, resolve });
  });
}

const sleep = (s) => new Promise((r) => setTimeout(r, s * 1000));

// ---------------- ui ----------------
const ui = initUI({
  onEnter: enterFactory,
  onFeed: feedFactory,
  onAdvance: () => { S.advanceDeferred?.resolve(); },
  onChat: handleChat,
  onRestart: restart,
  onReport: () => ui.buildReport(S.results, S.story, S.mode, S.engine),
  onSkip: () => { rig.fastForward(5); audio.whoosh(0.5); },
  onToggleAudio: () => { audio.setMuted(!audio.isMuted()); return audio.isMuted(); },
  onSetKey: async (k) => {
    setStoredKey(k);
    const engine = await resolveEngine();
    ui.setEngine(engine);
    ui.toast(k ? 'CLAUDE CORE ENGAGED. THE CREATURES FEEL SMARTER ALREADY.' : 'KEY FORGOTTEN. RUNNING ON HONEST GEARS.');
  },
  onUiClick: () => audio.uiClick(),
});

resolveEngine().then((e) => ui.setEngine(e));

// ---------------- camera helpers ----------------
function lobbyCamera() {
  rig.orbit(V3(0, 0, 0.5), 12.5, 4.6, 0.1, 2.6);
}

function roomViewPosition(i) {
  const x = roomX(i);
  // action framed left-of-center so the critique panel owns the right side
  return {
    pos: V3(x + 3.4, 3.4, 9.2),
    look: V3(x - 1.2, 2.2, -2.2),
  };
}

// ---------------- phases ----------------
function enterFactory() {
  audio.init();
  audio.bell();
  ui.showTitle(false);
  ui.showHud(true);
  ui.showIntake(true);
  S.phase = 'lobby';
  rig.cut(V3(14, 5.5, 14), V3(0, 2.5, 0));
  lobbyCamera();
  factory.setBeltSpeed(0.4); // the factory was alive before you arrived
  ui.toast('WELCOME TO THE FLOOR. MIND THE OPINIONS.');
}

async function feedFactory(text, mode) {
  if (S.phase !== 'lobby') return;
  S.phase = 'feeding';
  S.story = text;
  S.mode = mode;
  S.results = {};
  S.chatHistory = {};
  S.roomDeferred = {};
  for (const t of TIQUES) S.roomDeferred[t.id] = defer();

  ui.showIntake(false);
  ui.letterbox(true);
  ui.showProgress(true);

  // the factory notices
  audio.bell();
  world.flicker(1.1);
  Object.values(factory.tiques).forEach((tq) => {
    tq.setState('alert');
    tq.lookAt(V3(INTAKE_X, 3, 0));
    setTimeout(() => tq.setState('idle'), 2600 + Math.random() * 1800);
  });
  factory.intern.say('uh oh.', 2.5);

  // kick off the analysis immediately — rooms resolve as verdicts land
  analyzeStory(S.story, S.mode, (roomId, result) => {
    S.results[roomId] = result;
    S.roomDeferred[roomId].resolve(result);
  }, (engine) => {
    S.engine = engine;
    ui.setEngine(engine);
  }).then(({ metrics }) => { S.metrics = metrics; });

  // — cinematic: approach the intake —
  ui.toast(FEED_SEQUENCE_LINES[0]);
  await rig.flyTo({ pos: V3(6.5, 4.2, 8.5), look: V3(0, 3.4, 0), dur: 2.2 });

  // print the words into the world
  ui.toast(FEED_SEQUENCE_LINES[1]);
  audio.print();
  S.cylinder = buildCylinder(S.story);
  S.cylinder.group.position.set(INTAKE_X, BELT_Y, 0);
  world.scene.add(S.cylinder.group);
  fx.burst(V3(0, 3.4, 0.8), 0xffd23f, 20, 3);
  await rig.flyTo({ pos: V3(3.4, 2.8, 5.2), look: V3(0, 2.3, 0), dur: 1.6 });
  await S.cylinder.fill(2.2);

  // seal it
  ui.toast(FEED_SEQUENCE_LINES[2]);
  await sleep(0.3);
  await S.cylinder.seal();
  audio.seal();
  rig.shake(0.22);
  fx.burst(V3(0, 2.8, 0), 0x2de2e6, 18, 2.5);

  // doors open — the factory accepts
  ui.toast(FEED_SEQUENCE_LINES[3]);
  audio.doors();
  factory.openIntakeDoors(true);
  world.flicker(0.6);
  await sleep(1.4);
  ui.toast(FEED_SEQUENCE_LINES[4]);

  // travel through all seven rooms
  for (let i = 0; i < TIQUES.length; i++) {
    await travelToRoom(i);
    await roomSequence(i);
  }
  await verdictSequence();
}

async function travelToRoom(i) {
  S.phase = 'travel';
  S.roomIdx = i;
  ui.hidePanel();
  ui.letterbox(true);
  ui.showSkip(true);
  for (let p = 0; p < 8; p++) ui.setPip(p, p < i ? 'done' : p === i ? 'now' : '');

  const fromX = i === 0 ? INTAKE_X : roomX(i - 1);
  const toX = roomX(i);
  const dur = i === 0 ? 7 : 5.5;

  factory.setBeltSpeed(2.2);
  audio.whoosh(1.4);
  const clanks = setInterval(() => audio.clank(), 700);

  // cylinder rides the belt; camera swoops alongside with personality
  const startT = performance.now() / 1000;
  rig.follow((dt, t) => {
    const cyl = S.cylinder.group.position;
    const k = (t - startT) / dur;
    const swing = Math.sin(k * Math.PI * 2) * 2.2;
    const dip = Math.sin(k * Math.PI) * -1.2; // dips low mid-travel like it ducked under a machine
    return {
      pos: V3(cyl.x - 5.5 + swing, 4.4 + dip + Math.sin(t * 0.8) * 0.3, 7.5 - Math.abs(swing) * 0.8),
      look: V3(cyl.x + 1.5, 2.0, 0),
    };
  });

  await tween(dur, (k) => {
    const x = fromX + (toX - fromX) * k;
    S.cylinder.group.position.x = x;
  });

  clearInterval(clanks);
  factory.setBeltSpeed(0.25);
  audio.clank();
  ui.showSkip(false);
}

async function roomSequence(i) {
  S.phase = 'room';
  const def = TIQUES[i];
  const tq = factory.tiques[def.id];

  ui.letterbox(false);

  // the creature notices the cylinder
  tq.setState('inspect');
  tq.lookAt(V3(roomX(i), 2.2, 0));
  if (def.id === 'tempo') tq.runSpeed = 9;

  const view = roomViewPosition(i);
  await rig.flyTo({ pos: view.pos, look: view.look, dur: 2.0, via: V3(roomX(i) - 5, 5.5, 8) });

  ui.showPanel(i);
  audio.talk(280 + i * 90, 4);

  // wait for this room's verdict (instant on local gears, async on Claude)
  const result = await S.roomDeferred[def.id].promise;

  // dramatic pause — the creature reads
  await sleep(S.engine === 'local' ? 1.6 : 0.4);

  // REACT
  tq.react(result.reaction, result.score);
  rig.shake(result.reaction === 'horror' ? 0.3 : 0.12);
  if (def.id === 'cringe' && (result.reaction === 'horror' || result.reaction === 'pain')) {
    factory.setCringeAlarm(true);
    setTimeout(() => factory.setCringeAlarm(false), 3500);
  }
  switch (result.reaction) {
    case 'horror': audio.alarm(); fx.burst(V3(roomX(i), 3, -2), 0xff4757, 30, 5); break;
    case 'pain': audio.sad(); break;
    case 'unimpressed': audio.sad(); break;
    case 'neutral': audio.clank(); break;
    case 'intrigued': audio.chime(); break;
    case 'delight': audio.chime(); fx.burst(V3(roomX(i), 3.4, -2.5), def.color, 36, 5); break;
  }
  if (def.id === 'tempo') tq.runSpeed = result.score < 4 ? 2.5 : 4 + result.score;

  // verdict lands on the panel
  await ui.setResult(i, result);

  // hold the room until the operator sends it onward
  S.advanceDeferred = defer();
  await S.advanceDeferred.promise;
  audio.uiClick();
  tq.setState('idle');
  tq.lookTarget = null;
  if (def.id === 'tempo') tq.runSpeed = 7;
}

async function verdictSequence() {
  S.phase = 'verdict';
  ui.hidePanel();
  ui.letterbox(true);
  for (let p = 0; p < 7; p++) ui.setPip(p, 'done');
  ui.setPip(7, 'now');

  // final leg of the journey
  factory.setBeltSpeed(2.2);
  audio.whoosh(1.4);
  const startT = performance.now() / 1000;
  rig.follow((dt, t) => {
    const cyl = S.cylinder.group.position;
    return {
      pos: V3(cyl.x - 6, 4.8, 8),
      look: V3(cyl.x + 1, 2.2, 0),
    };
  });
  await tween(4.5, (k) => {
    S.cylinder.group.position.x = roomX(6) + (VERDICT_X - roomX(6)) * k;
  });
  factory.setBeltSpeed(0);

  // the GREAT STAMP delivers the official opinion
  await rig.flyTo({ pos: V3(VERDICT_X - 7, 3.6, 9.5), look: V3(VERDICT_X, 2.6, -1), dur: 1.6 });
  await sleep(0.4);
  factory.stampSlam();
  await sleep(0.45);
  audio.stamp();
  rig.shake(0.5);
  world.flicker(0.5);
  fx.burst(V3(VERDICT_X, 2.4, 0), 0xff4757, 40, 6);
  await sleep(0.9);
  audio.chime();
  fx.confetti(V3(VERDICT_X, 5.5, 1));
  await sleep(1.2);

  ui.letterbox(false);
  ui.showVerdict(S.results, S.story, S.mode, S.engine);
}

function restart() {
  ui.hideVerdict();
  ui.showProgress(false);
  for (let p = 0; p < 8; p++) ui.setPip(p, '');
  if (S.cylinder) {
    world.scene.remove(S.cylinder.group);
    S.cylinder = null;
  }
  factory.openIntakeDoors(false);
  factory.setBeltSpeed(0.4);
  Object.values(factory.tiques).forEach((tq) => { tq.setState('idle'); tq.lookTarget = null; });
  S.phase = 'lobby';
  lobbyCamera();
  ui.showIntake(true);
  ui.toast('THE FUNNEL IS HUNGRY AGAIN. IT SAYS HI.');
}

// ---------------- chat ----------------
async function handleChat(question) {
  if (S.phase !== 'room' || S.chatBusy) return;
  const def = TIQUES[S.roomIdx];
  const result = S.results[def.id];
  if (!result) return;

  S.chatBusy = true;
  const history = S.chatHistory[def.id] ?? (S.chatHistory[def.id] = []);
  ui.addChat('you', question);
  const thinking = ui.addChatThinking();
  const tq = factory.tiques[def.id];

  try {
    const reply = await askTique(def.id, S.story, S.mode, result, history, question, S.metrics);
    thinking.remove();
    ui.addChat('tique', reply);
    history.push({ who: 'you', text: question }, { who: 'tique', text: reply });
    tq.talk(1.6);
    audio.talk(280 + S.roomIdx * 90, 7);
  } catch (err) {
    thinking.remove();
    ui.addChat('tique', 'The intercom jammed. Bureaucratically speaking, please ask again.');
  } finally {
    S.chatBusy = false;
  }
}

// ---------------- the loop ----------------
const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  elapsed += dt;
  const t = elapsed;

  // run active tweens
  for (let i = S.tweens.length - 1; i >= 0; i--) {
    const tw = S.tweens[i];
    tw.t += (dt * rig.speed) / tw.dur;
    const k = Math.min(1, tw.t);
    tw.fn(tw.ease(k));
    if (k >= 1) { S.tweens.splice(i, 1); tw.resolve(); }
  }

  factory.update(dt, t);
  Object.values(factory.tiques).forEach((tq) => tq.update(t, dt, world.camera));
  factory.intern.update(t, dt, world.camera);
  S.cylinder?.update(dt, t);
  fx.update(dt, t);
  rig.update(dt, t);
  world.update(dt);
  world.composer.render();
}

// title screen camera: slow push through the lobby
rig.cut(V3(18, 6.5, 17), V3(0, 3, 0));
rig.orbit(V3(0, 0, 0), 16, 6, 0.05, 3);

animate();
