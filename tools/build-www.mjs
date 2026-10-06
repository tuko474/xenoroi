// Собирает папку www для APK: игра + шрифты внутри приложения (работает без интернета).
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.join(root, 'www');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'fonts'), { recursive: true });

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const ver = process.env.APP_VERSION;
if (ver) html = html.replace('<meta name="app-version" content="dev">', `<meta name="app-version" content="${ver}">`);

const fonts = [
  ['russo-one', ['400']],
  ['exo-2', ['400', '600', '800']],
  ['pt-mono', ['400']],
];
let css = '';
for (const [pkg, weights] of fonts) {
  const dir = path.join(root, 'node_modules', '@fontsource', pkg);
  if (!fs.existsSync(dir)) { console.warn(`нет шрифта ${pkg} — останется системный`); continue; }
  const files = path.join(dir, 'files');
  const dest = path.join(out, 'fonts', pkg);
  fs.mkdirSync(dest, { recursive: true });
  for (const f of fs.readdirSync(files)) if (/(cyrillic|latin)-.*\.woff2$/.test(f) && !/-ext-/.test(f)) fs.copyFileSync(path.join(files, f), path.join(dest, f));
  for (const w of weights) {
    const file = path.join(dir, `${w}.css`);
    if (!fs.existsSync(file)) continue;
    // берём только кириллицу и латиницу, пути переводим на локальную папку
    const blocks = fs.readFileSync(file, 'utf8').split('@font-face').slice(1)
      .map(b => '@font-face' + b)
      .filter(b => /(cyrillic|latin)-\d+-normal\.woff2/.test(b) && !/-ext-/.test(b))
      .map(b => {
        const m = b.match(/\.\/files\/([^)\s'"]+\.woff2)/);
        return m ? b.replace(/src:[^;]+;/, `src: url(fonts/${pkg}/${m[1]}) format('woff2');`) : '';
      });
    css += blocks.join('\n') + '\n';
  }
}
fs.writeFileSync(path.join(out, 'fonts.css'), css);
html = html.replace(/<link rel="preconnect"[^>]*>\s*/, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/, '<link rel="stylesheet" href="fonts.css">');
fs.writeFileSync(path.join(out, 'index.html'), html);
console.log('www готова:', fs.readdirSync(out).join(', '), `| шрифтов: ${(css.match(/@font-face/g) || []).length}`);
