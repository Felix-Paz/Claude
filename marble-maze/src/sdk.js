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
let gdFailed = false;
let adPauseSeen = false;
let adResumed = noop;

function portalEvent(event) {
  if (!event || !event.name) return;
  if (event.name === 'SDK_ERROR') gdFailed = true;
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

function gdWaitReady(ms) {
  return new Promise((resolve) => {
    if (gdCanShow()) { resolve(true); return; }
    const t0 = Date.now();
    const tick = () => {
      if (gdCanShow()) { resolve(true); return; }
      if (gdFailed || Date.now() - t0 >= ms) { resolve(false); return; }
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
    if (window.GamePix) {
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
}
export function gameplayStop() {
  if (provider === 'poki') window.PokiSDK?.gameplayStop?.();
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.gameplayStop?.();
}
export function happyMoment() {
  if (provider === 'poki') window.PokiSDK?.happyTime?.(0.7);
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.happytime?.();
  if (provider === 'gamepix') { try { window.GamePix.happyMoment?.(); } catch (e) {} }
}

export function reportLevelStart(level) {
  if (provider === 'gamepix') { try { window.GamePix.updateLevel?.(level); } catch (e) {} }
  if (provider === 'crazygames') { try { window.CrazyGames?.SDK?.game?.setGameContext?.({ level: String(level) }); } catch (e) {} }
}
export function reportWin({ maxLevel, score } = {}) {
  if (provider === 'gamepix' && score != null) { try { window.GamePix.updateScore?.(Math.round(score)); } catch (e) {} }
  if (provider === 'crazygames' && maxLevel != null) {
    const pct = Math.max(0, Math.min(100, Math.round((maxLevel / 30) * 100)));
    try { window.CrazyGames?.SDK?.game?.reportGameCompletedPercentage?.(pct); } catch (e) {}
  }
}
export function clearLevelContext() {
  if (provider === 'crazygames') { try { window.CrazyGames?.SDK?.game?.clearGameContext?.(); } catch (e) {} }
}

export function requiresPlayGate() { return provider === 'gamedistribution'; }
export function midrollOnUi() { return provider === 'gamedistribution'; }

export async function preroll() {
  if (provider !== 'gamedistribution' || adInProgress) return;
  adInProgress = true; onAdStateChange(true, 'ad');
  try { if (await gdWaitReady(2500)) await gdShowAd(); } catch (e) { }
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
    if (provider === 'poki') {
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
    if (provider === 'poki') {
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
    } else {
      success = true;
    }
  } catch (e) { success = false; }
  adInProgress = false; onAdStateChange(false, 'reward');
  return success;
}

export function isAdRunning() { return adInProgress; }
