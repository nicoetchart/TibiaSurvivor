/* PSR-14: lang-en sin bloques Pokémon (tipos/movimientos). */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr13.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr13 failed');

const lang = fs.readFileSync(path.join(ROOT, 'js/data/lang-en.js'), 'utf8');
for (const ban of ["// ---------------- tipos y regiones", "'Lanzallamas'", 'Onda Ígnea']) {
  if (lang.includes(ban)) err(`lang-en.js must not contain ${ban}`);
}

if (errors.length) {
  console.error('validate-psr14 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr14 OK');