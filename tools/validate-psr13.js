/* PSR-13: js/ sin marcas legacy en runtime (comentarios y código). */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr12.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr12 failed');

const skip = new Set(['js/data/lang-en.js', 'js/data/changelog.js', 'js/app.min.js']);
const ban = /Pokémon|Pokemon|\bArceus\b|\bgacha\b|Pokédex|Pokedex|\bPMD\b/i;
const allowLine = (line) =>
  line.includes('sprites=legacy') || line.includes('sprites=off') ||
  line.includes("'pokedex/':") || line.includes('"pokedex/"');

function walkJs(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (ent.isDirectory()) walkJs(full);
    else if (ent.name.endsWith('.js') && !skip.has(rel)) {
      const lines = fs.readFileSync(full, 'utf8').split(/\n/);
      lines.forEach((line, i) => {
        if (ban.test(line) && !allowLine(line)) err(`${rel}:${i + 1} legacy mark: ${line.trim().slice(0, 72)}`);
      });
    }
  }
}
walkJs(path.join(ROOT, 'js'));

const ui = fs.readFileSync(path.join(ROOT, 'js/ui/ui.js'), 'utf8');
if (ui.includes('tickets-pill')) err('ui.js must not reference tickets-pill');

if (errors.length) {
  console.error('validate-psr13 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr13 OK');