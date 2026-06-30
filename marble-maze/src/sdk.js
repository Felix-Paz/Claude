// =====================================================================
//  sdk.js — portal SDK abstraction (Poki / CrazyGames).
//  The game calls these neutral methods; this maps them to whichever
//  portal SDK is present. With no SDK loaded it falls back to safe
//  no-ops (and *grants* rewarded actions) so the game is fully playable
//  standalone during development.
//
//  To ship on a portal, add ONE of these to index.html <head> and set
//  the id — everything below auto-detects it:
//    Poki:        <script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
//    CrazyGames:  <script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
// =====================================================================

let provider = 'none';        // 'poki' | 'crazygames' | 'none'
let ready = false;
let adInProgress = false;

const noop = () => {};
// UI hook: set by ui.js to show/hide a "muting for ad" curtain.
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

// Loading screen lifecycle (helps portals show their own splash correctly).
export function loadingStart() {
  if (provider === 'poki') window.PokiSDK?.gameLoadingStart?.();
}
export function loadingFinished() {
  if (provider === 'poki') window.PokiSDK?.gameLoadingFinished?.();
  if (provider === 'crazygames') window.CrazyGames?.SDK?.game?.loadingStop?.();
}

// Gameplay markers — portals pause their own timers/ads accordingly.
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

// Interstitial — only call at NATURAL breaks (never mid-roll).
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
    // 'none' → instant
  } catch (e) { /* ignore */ }
  adInProgress = false; onAdStateChange(false);
}

// Rewarded — returns true if the reward should be granted.
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
      // standalone dev: grant the reward so the loop is testable
      success = true;
    }
  } catch (e) { success = false; }
  adInProgress = false; onAdStateChange(false);
  return success;
}

export function isAdRunning() { return adInProgress; }
