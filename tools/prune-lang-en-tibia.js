/* PSR-14: quita bloques lang-en de tipos/movimientos Pokémon (fragmentos sin uso en MVP). */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'js', 'data', 'lang-en.js');
let lines = fs.readFileSync(FILE, 'utf8').split(/\n/);
const out = [];
let skip = false;

for (const line of lines) {
  if (line.includes('// ---------------- tipos y regiones')) { skip = true; continue; }
  if (skip && line.includes('// ---------------- cartas al subir de nivel')) {
    skip = false;
    out.push(line);
    continue;
  }
  if (skip) continue;
  out.push(line);
}

const s = out.join('\n');
if (s.includes('// ---------------- tipos y regiones') || s.includes("'Lanzallamas'")) {
  console.error('prune-lang-en-tibia: legacy blocks remain');
  process.exit(1);
}
if (!/\}\);\s*$/.test(s.replace(/\r/g, ''))) {
  console.error('prune-lang-en-tibia: bad file end');
  process.exit(1);
}
fs.writeFileSync(FILE, s);
console.log('prune-lang-en-tibia OK');