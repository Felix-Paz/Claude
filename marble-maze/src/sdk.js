let provider = 'none';
let ready = false;
let adInProgress = false;

const noop = () => {};
let onAdStateChange = noop;
export function setAdStateHandler(fn) { onAdStateChange = fn || noop; }

export async function init() {
  try {
    if (window.PokiSDK) {
      provider = 'poki';
      await window.PokiSDK.init().catch(() => {});
      window.PokiSDK.setDebug?.(false);
      ready = true;
    } else if (window.CrazyGames?.SDK) {
      provider = 'crazygames';
      await window.CrazyGames.SDK.init().catch(() => {});
      ready = true;
    } else {
      provider = 'none';
      ready = true;
    }
  } catch (e) {
    provider = 'none'; ready = true;
  }
  return provider;
}

export function getProvider() { return provider; }

export function loadingStart() {
  if (provider === 'poki') window.PokiSDK?.gameLoadingStart?.();
}
export function loadingFinished() {
  if (provider === 'poki') window.PokiSDK?.gameLoadingFinished?.();
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.loadingStop?.();
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
}

export async function commercialBreak() {
  if (adInProgress) return;
  adInProgress = true; onAdStateChange(true);
  try {
    if (provider === 'poki') {
      await window.PokiSDK.commercialBreak();
    } else if (provider === 'crazygames') {
      await new Promise((res) => {
        window.CrazyGames.SDK.ad.requestAd('midgame', {
          adFinished: res, adError: res, adStarted: noop,
        });
      });
    }
  } catch (e) { }
  adInProgress = false; onAdStateChange(false);
}

export async function rewardedBreak() {
  if (adInProgress) return false;
  adInProgress = true; onAdStateChange(true);
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
    } else {
      success = true;
    }
  } catch (e) { success = false; }
  adInProgress = false; onAdStateChange(false);
  return success;
}

export function isAdRunning() { return adInProgress; }
