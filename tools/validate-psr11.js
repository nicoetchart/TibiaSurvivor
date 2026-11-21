/* PSR-11: i18n EN sin marcas Pokémon/gacha en valores visibles. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BAN = /Pokémon|Poké|Arceus|Gacha|SpriteCollab|GAME FREAK|Nintendo|The Pokémon Company|Pokédex|gacha pull|PMD SpriteCollab|966\s/i;
const errors = [];
const err = m => errors.push(m);

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr10.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr10 failed');

if (!fs.existsSync(path.join(ROOT, 'tools/sanitize-lang-en-psr11.js'))) {
  err('missing tools/sanitize-lang-en-psr11.js');
}

const lang = fs.readFileSync(path.join(ROOT, 'js/data/lang-en.js'), 'utf8');
if (lang.includes('// colección') || lang.includes('La Sentencia de Arceus')) {
  err('lang-en.js still has legacy collection/gacha/Arceus blocks');
}
for (const line of lang.split(/\n/)) {
  if (!line.includes("': '")) continue;
  const parts = line.match(/':\s*'([^']*(?:\\'[^']*)*)'/g) || [];
  for (const part of parts) {
    const v = part.slice(4, -1);
    if (BAN.test(v)) err(`lang-en EN value: ${v.slice(0, 50)}…`);
  }
}

const spawner = fs.readFileSync(path.join(ROOT, 'js/systems/spawner.js'), 'utf8');
if (spawner.includes('Pokémon swarm')) err('spawner.js must not say Pokémon swarm');

if (errors.length) {
  console.error('validate-psr11 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr11 OK');