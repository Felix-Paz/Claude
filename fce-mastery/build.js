#!/usr/bin/env node
/* Bundles FCE Mastery into a single self-contained HTML file (dist/FCE-Mastery.html). */
const fs = require('fs');
const path = require('path');
const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');

const css = read('css/styles.css');
const js = [
  'js/data-core.js',
  'js/data-bank1.js',
  'js/data-bank2.js',
  'js/data-bank3.js',
  'js/data-bank4.js',
  'js/data-bank5.js',
  'js/data-bank6.js',
  'js/data-bank7.js',
  'js/data-mocks2.js',
  'js/data-mocks3.js',
  'js/data-papers.js',
  'js/data-vocab.js',
  'js/data-vocab2.js',
  'js/engine.js',
  'js/charts.js',
  'js/views.js',
  'js/practice.js',
  'js/app.js',
].map(f => '/* ===== ' + f + ' ===== */\n' + read(f)).join('\n\n');

let html = read('index.html');
// replacer functions: a plain replacement string would mangle $-sequences ($$, $&, $') inside the code
html = html.replace(/<link rel="stylesheet"[^>]*>/, () => '<style>\n' + css + '\n</style>');
html = html.replace(/(\s*<script src="[^"]+"><\/script>)+/, () => '\n<script>\n' + js.replace(/<\/script>/g, '<\\/script>') + '\n</script>\n');

const out = path.join(root, '..', 'dist');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'Mastery-FCE.html'), html);
console.log('Built dist/Mastery-FCE.html (' + (html.length / 1024).toFixed(1) + ' KB)');
