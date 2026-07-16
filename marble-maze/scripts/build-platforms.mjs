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

const PLATFORMS = {
  poki: (html) => html.replace(SDK_BLOCK, '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>\n'),
  crazygames: (html) => html.replace(SDK_BLOCK, '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>\n'),
  gamedistribution: (html) => html.replace(SDK_BLOCK, GD_SNIPPET),
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
  const zip = path.join(DIST, `marble-maze-${name}.zip`);
  execSync(`cd "${out}" && zip -rq "${zip}" .`);
  console.log('built', zip);
}
