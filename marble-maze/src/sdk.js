let provider = 'none';
let ready = false;
let adInProgress = false;

const noop = () => {};
let onAdStateChange = noop;
export function setAdStateHandler(fn) { onAdStateChange = fn || noop; }

let hooks = { pause: () => false, resume: noop, hardMute: noop };
export function setGameHooks(h) { hooks = { ...hooks, ...h }; }

let gdRewardWatched = noop;
let pausedByAd = false;
let sdkFailed = false;
let adPauseSeen = false;
let adResumed = noop;

function portalEvent(event) {
  if (!event || !event.name) return;
  if (event.name === 'SDK_ERROR') sdkFailed = true;
  else if (event.name === 'SDK_GAME_PAUSE') { adPauseSeen = true; hooks.hardMute(true); pausedByAd = !!hooks.pause(); }
  else if (event.name === 'SDK_GAME_START') {
    hooks.hardMute(false);
    if (pausedByAd) { pausedByAd = false; hooks.resume(); }
    adResumed();
  } else if (event.name === 'SDK_REWARDED_WATCH_COMPLETE') gdRewardWatched();
}

async function gmShowBanner() {
  if (!(window.sdk && typeof window.sdk.showBanner === 'function')) return;
  await new Promise((resolve) => {
    let done = false;
    const finish = () => { if (done) return; done = true; adResumed = noop; resolve(); };
    adPauseSeen = false; adResumed = finish;
    try { window.sdk.showBanner(); } catch (e) { finish(); return; }
    setTimeout(() => { if (!adPauseSeen) finish(); }, 3000);
    setTimeout(finish, 60000);
  });
}

let pgAudioAllowed = true;
let pgPaused = false;
let pgAdHold = 0;
let pgGameReadySent = false;

function pgApplyMute() { hooks.hardMute(!pgAudioAllowed || pgPaused || pgAdHold > 0); }

function initPlaygama() {
  const b = window.bridge, EV = b.EVENT_NAME, p = b.platform;
  try {
    pgAudioAllowed = p.isAudioEnabled !== false;
    pgPaused = !!p.isPaused;
    pgApplyMute();
    p.on(EV.AUDIO_STATE_CHANGED, (on) => { pgAudioAllowed = !!on; pgApplyMute(); });
    p.on(EV.PAUSE_STATE_CHANGED, (paused) => {
      pgPaused = !!paused;
      pgApplyMute();
      if (pgPaused) pausedByAd = !!hooks.pause();
      else if (pausedByAd) { pausedByAd = false; hooks.resume(); }
    });
  } catch (e) { }
}

function pgMsg(name, options) {
  if (provider !== 'playgama') return;
  try { Promise.resolve(window.bridge.platform.sendMessage(name, options)).catch(() => { }); } catch (e) { }
}

async function pgAd(rewarded, placement) {
  const b = window.bridge, EV = b.EVENT_NAME, ad = b.advertisement;
  if (rewarded ? !ad.isRewardedSupported : !ad.isInterstitialSupported) return false;
  const evName = rewarded ? EV.REWARDED_STATE_CHANGED : EV.INTERSTITIAL_STATE_CHANGED;

  pgAdHold++; pgApplyMute();
  const wasPlaying = !!hooks.pause();

  const earned = await new Promise((resolve) => {
    let done = false, got = false, closeT = null;
    function finish() {
      if (done) return;
      done = true; clearTimeout(closeT);
      try { ad.off(evName, onState); } catch (e) { }
      resolve(got);
    }
    function onState(state) {
      if (rewarded && state === 'rewarded') {
        got = true;
        clearTimeout(closeT); closeT = setTimeout(finish, 1500);
      } else if (state === 'closed' || state === 'failed') finish();
    }
    try { ad.on(evName, onState); } catch (e) { finish(); return; }
    try { if (rewarded) ad.showRewarded(placement); else ad.showInterstitial(placement); }
    catch (e) { finish(); return; }
    setTimeout(finish, 60000);
  });

  pgAdHold--; pgApplyMute();
  if (wasPlaying) hooks.resume();
  return earned;
}

export function hasRemoteStorage() { return provider === 'playgama'; }
export const remoteStorage = {
  get: (k) => window.bridge.storage.get(k),
  set: (k, v) => window.bridge.storage.set(k, v),
};

export function language() {
  if (provider === 'playgama') { try { return window.bridge.platform.language || 'en'; } catch (e) { } }
  return 'en';
}

export function gameReady() {
  if (provider !== 'playgama' || pgGameReadySent) return;
  pgGameReadySent = true;
  pgMsg('game_ready');
}

export function reportLevelFail(level) {
  pgMsg('level_failed', { level: String(level) });
}

function y8CanShow() { return !!(window.__y8Sdk && typeof window.__y8Sdk.showAd === 'function'); }

async function y8ShowAd(opts) {
  if (!y8CanShow()) return false;
  return await new Promise((resolve) => {
    let done = false, wasPlaying = false, viewed = false;
    const release = () => {
      hooks.hardMute(false);
      if (wasPlaying) { wasPlaying = false; hooks.resume(); }
    };
    const finish = () => { if (done) return; done = true; release(); resolve(viewed); };
    try {
      window.__y8Sdk.showAd({
        ...opts,
        beforeAd: () => { wasPlaying = !!hooks.pause(); hooks.hardMute(true); },
        afterAd: () => release(),
        adViewed: () => { viewed = true; },
        adDismissed: () => { viewed = false; },
        adBreakDone: () => finish(),
      });
    } catch (e) { finish(); return; }
    setTimeout(finish, 60000);
  });
}

async function gamePixAd(request) {
  const wasPlaying = !!hooks.pause();
  hooks.hardMute(true);
  let res = null;
  try { res = await request(); } catch (e) { res = null; }
  hooks.hardMute(false);
  if (wasPlaying) hooks.resume();
  return res;
}

function gdCanShow() { return !!(window.gdsdk && typeof window.gdsdk.showAd === 'function'); }
function gmCanShow() { return !!(window.sdk && typeof window.sdk.showBanner === 'function'); }

function waitReady(canShow, ms) {
  return new Promise((resolve) => {
    if (canShow()) { resolve(true); return; }
    const t0 = Date.now();
    const tick = () => {
      if (canShow()) { resolve(true); return; }
      if (sdkFailed || Date.now() - t0 >= ms) { resolve(false); return; }
      setTimeout(tick, 80);
    };
    setTimeout(tick, 80);
  });
}

async function gdShowAd() {
  if (!gdCanShow()) return;
  try {
    await Promise.race([
      Promise.resolve(window.gdsdk.showAd()).catch(() => {}),
      new Promise((res) => setTimeout(res, 60000)),
    ]);
  } catch (e) {}
}

function initCrazyGames() {
  const g = window.CrazyGames?.SDK?.game;
  const apply = (s) => { if (s && typeof s.muteAudio === 'boolean') hooks.hardMute(s.muteAudio); };
  try { apply(g?.settings); g?.addSettingsChangeListener?.(apply); } catch (e) {}
}

function inScrollable(target) {
  let n = (target && target.nodeType === 1) ? target : null;
  for (; n && n !== document.body; n = n.parentElement) {
    if (n.scrollHeight > n.clientHeight + 1) {
      const oy = getComputedStyle(n).overflowY;
      if (oy === 'auto' || oy === 'scroll') return true;
    }
  }
  return false;
}

let gpLoaded = false;
function gamePixLoaded() {
  if (gpLoaded) return;
  gpLoaded = true;
  try { window.GamePix.loaded?.(); } catch (e) { }
}

function initGamePix() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === ' ') e.preventDefault();
  });
  window.addEventListener('wheel', (e) => {
    if (!inScrollable(e.target)) e.preventDefault();
  }, { passive: false });
  gamePixLoaded();
}

export async function init() {
  try {
    // Bridge loads the host platform's own scripts, so it must be detected first.
    if (window.bridge && typeof window.bridge.initialize === 'function') {
      provider = 'playgama';
      await window.bridge.initialize().catch(() => { });
      initPlaygama();
      ready = true;
    } else if (window.GamePix) {
      provider = 'gamepix';
      initGamePix();
      ready = true;
    } else if (window.CrazyGames?.SDK) {
      provider = 'crazygames';
      await window.CrazyGames.SDK.init().catch(() => {});
      initCrazyGames();
      ready = true;
    } else if (window.GD_OPTIONS || window.gdsdk) {
      provider = 'gamedistribution';
      window.__gdHandler = portalEvent;
      (window.__gdEvents || []).forEach(portalEvent);
      window.__gdEvents = [];
      ready = true;
    } else if (window.__y8 || window.__y8Sdk) {
      provider = 'y8';
      ready = true;
    } else if (window.SDK_OPTIONS || (window.sdk && typeof window.sdk.showBanner === 'function')) {
      provider = 'gamemonetize';
      window.__gmHandler = portalEvent;
      (window.__gmEvents || []).forEach(portalEvent);
      window.__gmEvents = [];
      ready = true;
    } else if (window.PokiSDK) {
      provider = 'poki';
      await window.PokiSDK.init().catch(() => {});
      window.PokiSDK.setDebug?.(false);
      ready = true;
    } else {
      provider = 'none'; ready = true;
    }
  } catch (e) {
    provider = 'none'; ready = true;
  }
  return provider;
}

export function getProvider() { return provider; }

export function loadingStart() {
  if (provider === 'poki') window.PokiSDK?.gameLoadingStart?.();
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.loadingStart?.();
}
export function loadingFinished() {
  if (provider === 'poki') window.PokiSDK?.gameLoadingFinished?.();
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.loadingStop?.();
  if (provider === 'gamepix') gamePixLoaded();
}

export function gameplayStart() {
  if (provider === 'poki') window.PokiSDK?.gameplayStart?.();
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.gameplayStart?.();
  pgMsg('gameplay_started');
}
export function gameplayStop() {
  if (provider === 'poki') window.PokiSDK?.gameplayStop?.();
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.gameplayStop?.();
  pgMsg('gameplay_stopped');
}
export function happyMoment() {
  if (provider === 'poki') window.PokiSDK?.happyTime?.(0.7);
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.happytime?.();
  if (provider === 'gamepix') { try { window.GamePix.happyMoment?.(); } catch (e) {} }
  pgMsg('player_got_achievement');
}

export function reportLevelStart(level) {
  if (provider === 'gamepix') { try { window.GamePix.updateLevel?.(level); } catch (e) {} }
  if (provider === 'crazygames') { try { window.CrazyGames?.SDK?.game?.setGameContext?.({ level: String(level) }); } catch (e) {} }
  pgMsg('level_started', { level: String(level) });
}
export function reportWin({ maxLevel, score } = {}) {
  pgMsg('level_completed', maxLevel != null ? { level: String(maxLevel) } : undefined);
  if (provider === 'gamepix' && score != null) { try { window.GamePix.updateScore?.(Math.round(score)); } catch (e) {} }
  if (provider === 'crazygames' && maxLevel != null) {
    const pct = Math.max(0, Math.min(100, Math.round((maxLevel / 30) * 100)));
    try { window.CrazyGames?.SDK?.game?.reportGameCompletedPercentage?.(pct); } catch (e) {}
  }
}
export function clearLevelContext() {
  if (provider === 'crazygames') { try { window.CrazyGames?.SDK?.game?.clearGameContext?.(); } catch (e) {} }
}

export function requiresPlayGate() { return provider === 'gamedistribution' || provider === 'gamemonetize'; }
export function midrollOnUi() { return provider === 'gamedistribution'; }

export async function preroll() {
  if (!requiresPlayGate() || adInProgress) return;
  adInProgress = true; onAdStateChange(true, 'ad');
  try {
    if (provider === 'gamedistribution') { if (await waitReady(gdCanShow, 2500)) await gdShowAd(); }
    else if (provider === 'gamemonetize') { if (await waitReady(gmCanShow, 2500)) await gmShowBanner(); }
  } catch (e) { }
  adInProgress = false; onAdStateChange(false, 'ad');
}

export async function midroll() {
  if (provider !== 'gamedistribution') return;
  await commercialBreak();
}

export async function commercialBreak() {
  if (adInProgress) return;
  adInProgress = true; onAdStateChange(true, 'ad');
  try {
    if (provider === 'playgama') {
      await pgAd(false, 'level_completed');
    } else if (provider === 'poki') {
      await window.PokiSDK.commercialBreak();
    } else if (provider === 'crazygames') {
      await new Promise((res) => {
        window.CrazyGames.SDK.ad.requestAd('midgame', {
          adFinished: res, adError: res, adStarted: noop,
        });
      });
    } else if (provider === 'gamedistribution') {
      await gdShowAd();
    } else if (provider === 'gamemonetize') {
      await gmShowBanner();
    } else if (provider === 'y8') {
      if (await waitReady(y8CanShow, 2500)) await y8ShowAd({ type: 'next', name: 'level-complete' });
    } else if (provider === 'gamepix') {
      await gamePixAd(() => window.GamePix.interstitialAd());
    }
  } catch (e) { }
  adInProgress = false; onAdStateChange(false, 'ad');
}

export async function rewardedBreak() {
  if (adInProgress) return false;
  adInProgress = true; onAdStateChange(true, 'reward');
  let success = false;
  try {
    if (provider === 'playgama') {
      success = await pgAd(true, 'reward');
    } else if (provider === 'poki') {
      success = await window.PokiSDK.rewardedBreak();
    } else if (provider === 'crazygames') {
      success = await new Promise((res) => {
        window.CrazyGames.SDK.ad.requestAd('rewarded', {
          adFinished: () => res(true),
          adError: () => res(false),
          adStarted: noop,
        });
      });
    } else if (provider === 'gamedistribution') {
      if (window.gdsdk && typeof window.gdsdk.showAd === 'function') {
        success = await new Promise((resolve) => {
          let done = false, watched = false;
          gdRewardWatched = () => { watched = true; };
          const finish = () => { if (!done) { done = true; gdRewardWatched = noop; resolve(watched); } };
          try {
            window.gdsdk.showAd('rewarded').then(() => setTimeout(finish, 150)).catch(() => finish());
          } catch (e) { finish(); }
          setTimeout(finish, 60000);
        });
      }
    } else if (provider === 'gamepix') {
      const res = await gamePixAd(() => window.GamePix.rewardAd());
      success = !!(res && res.success);
    } else if (provider === 'gamemonetize') {
      await gmShowBanner();
      success = true;
    } else if (provider === 'y8') {
      success = !!(await waitReady(y8CanShow, 2500)) &&
        !!(await y8ShowAd({ type: 'reward', name: 'reward', beforeReward: (show) => { try { show(); } catch (e) { } } }));
    } else {
      success = true;
    }
  } catch (e) { success = false; }
  adInProgress = false; onAdStateChange(false, 'reward');
  return success;
}

export function isAdRunning() { return adInProgress; }
