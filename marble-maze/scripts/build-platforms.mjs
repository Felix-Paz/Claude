import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');

const SDK_BLOCK = /<!-- Optional SDKs \(enable one\):[\s\S]*?-->\n?/;

const GD_SNIPPET = `<script>
window["GD_OPTIONS"] = {
  "gameId": "PUT-YOUR-GD-GAME-ID-HERE",
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
    .replace(/<link rel="preconnect"[^>]*>\n?/g, '')
    .replace(/<link href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/g, '')
    .replace('<head>', '<head>\n<script src="https://integration.gamepix.com/sdk/v3/gamepix.sdk.js"></script>'),
};

const FILES = ['styles.css'];
const DIRS = ['src', 'vendor'];

fs.rmSync(DIST, { recursive: true, force: true });
const baseHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!SDK_BLOCK.test(baseHtml)) throw new Error('SDK block not found in index.html');

for (const [name, patch] of Object.entries(PLATFORMS)) {
  const out = path.join(DIST, name);
  fs.mkdirSync(path.join(out, 'src'), { recursive: true });
  for (const f of FILES) fs.copyFileSync(path.join(ROOT, f), path.join(out, f));
  for (const d of DIRS) fs.cpSync(path.join(ROOT, d), path.join(out, d), { recursive: true });
  const html = patch(baseHtml);
  if (name !== 'gamepix' && !html.includes('sdk')) throw new Error('patched head missing sdk for ' + name);
  fs.writeFileSync(path.join(out, 'index.html'), html);
  const zip = path.join(DIST, `marble-maze-${name}.zip`);
  execSync(`cd "${out}" && zip -rq "${zip}" .`);
  console.log('built', zip);
}
