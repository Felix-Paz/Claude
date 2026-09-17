import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ESBUILD = 'npx --yes esbuild@0.24.2';

const SDK_BLOCK = /<!-- Optional SDKs \(enable one\):[\s\S]*?-->\n?/;
const IMPORTMAP = /<script type="importmap">[\s\S]*?<\/script>\n?/;
const MODULE_TAG = /<script type="module" src="\.\/src\/main\.js"><\/script>/;

const GD_SNIPPET = `<script>
window["GD_OPTIONS"] = {
  "gameId": "500476821acf49d89fcdb425cbf48b81",
  "onEvent": function (event) {
    if (window.__gdHandler) { window.__gdHandler(event); }
    else { (window.__gdEvents = window.__gdEvents || []).push(event); }
  }
};
(function (d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s);
  js.id = id;
  js.src = 'https://html5.api.gamedistribution.com/main.min.js';
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'gamedistribution-jssdk'));
</script>
`;

const GM_SNIPPET = `<script type="text/javascript">
window["SDK_OPTIONS"] = {
  "gameId": "PUT-YOUR-GAMEMONETIZE-GAME-ID-HERE",
  "onEvent": function (event) {
    if (window.__gmHandler) { window.__gmHandler(event); }
    else { (window.__gmEvents = window.__gmEvents || []).push(event); }
  }
};
(function (a, b, c) {
  var d = a.getElementsByTagName(b)[0];
  a.getElementById(c) || (a = a.createElement(b), a.id = c, a.src = "https://api.gamemonetize.com/sdk.js", d.parentNode.insertBefore(a, d));
})(document, "script", "gamemonetize-sdk");
</script>
`;

const Y8_SNIPPET = `<script src="https://cdn.y8.com/minimal-sdk/2-0/y8.min.js" async></script>
<script>
window.__y8 = { appId: "6aabd15425b1d17038e6416c", gameId: "283597" };
let y8Sdk;

window.addEventListener("y8sdk.ready", function () {
  y8Sdk = y8.sdk();
  window.__y8Sdk = y8Sdk;

  y8Sdk.init(
    { appId: window.__y8.appId, autoLogin: true },
    {
      gameId: window.__y8.gameId,
      preloadAdBreaks: "on",
      sound: "on",
      onReady: function () { window.__y8AdsReady = true; }
    }
  );

  y8Sdk.onAuth(function (user, error) {
    if (error) {
      window.__y8AuthError = error.message ?? error;
      console.warn("[y8] sign-in unavailable, continuing as guest:", window.__y8AuthError);
      return;
    }
    window.__y8User = user;
  });
}, { once: true });

if (window.y8 && window.y8.emitReadyEvent) { window.y8.emitReadyEvent(); }
</script>
`;

const PG_CONFIG = JSON.stringify({
  platforms: {
    game_distribution: { gameId: '500476821acf49d89fcdb425cbf48b81' },
  },
  advertisement: {
    minimumDelayBetweenInterstitial: 60,
    interstitial: { placements: [{ id: 'level_completed' }] },
    rewarded: { placements: [{ id: 'reward' }] },
  },
}, null, 2) + '\n';

const EXTRA_FILES = {
  playgama: { 'playgama-bridge-config.json': PG_CONFIG },
};

const PLATFORMS = {
  poki: (html) => html.replace(SDK_BLOCK, '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>\n'),
  crazygames: (html) => html.replace(SDK_BLOCK, '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n'),
  gamedistribution: (html) => html.replace(SDK_BLOCK, GD_SNIPPET),
  gamemonetize: (html) => html.replace(SDK_BLOCK, GM_SNIPPET),
  y8: (html) => html.replace(SDK_BLOCK, Y8_SNIPPET),
  playgama: (html) => html.replace(SDK_BLOCK, '<script src="https://bridge.playgama.com/v2/stable/playgama-bridge.js"></script>\n'),
  gamepix: (html) => html
    .replace(SDK_BLOCK, '')
    .replace('<head>', '<head>\n<script src="https://integration.gamepix.com/sdk/v3/gamepix.sdk.js"></script>'),
};

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

const bundle = path.join(DIST, 'game.js');
execSync(`${ESBUILD} "${path.join(ROOT, 'src/main.js')}" --bundle --minify --format=iife --charset=utf8 --alias:three="${path.join(ROOT, 'vendor/three.module.min.js')}" --outfile="${bundle}"`, { stdio: 'inherit' });

const baseHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!SDK_BLOCK.test(baseHtml)) throw new Error('SDK block not found in index.html');
if (!IMPORTMAP.test(baseHtml)) throw new Error('importmap not found in index.html');
if (!MODULE_TAG.test(baseHtml)) throw new Error('module script tag not found in index.html');

for (const [name, patch] of Object.entries(PLATFORMS)) {
  const out = path.join(DIST, name);
  fs.mkdirSync(out, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'styles.css'), path.join(out, 'styles.css'));
  fs.copyFileSync(path.join(ROOT, 'fonts.css'), path.join(out, 'fonts.css'));
  fs.copyFileSync(bundle, path.join(out, 'game.js'));
  let html = patch(baseHtml)
    .replace(IMPORTMAP, '')
    .replace(MODULE_TAG, '<script src="./game.js" defer></script>');
  fs.writeFileSync(path.join(out, 'index.html'), html);
  for (const [file, body] of Object.entries(EXTRA_FILES[name] || {})) {
    fs.writeFileSync(path.join(out, file), body);
  }
  const zip = path.join(DIST, `marble-maze-${name}.zip`);
  execSync(`cd "${out}" && zip -rq "${zip}" .`);
  console.log('built', zip);
}
