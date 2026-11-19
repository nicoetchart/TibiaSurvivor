/* PSR-7 certification: purge ps.*, dominio Tibia, sin rutas Pokémon en boot. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

function run(nodeScript) {
  const r = spawnSync(process.execPath, [path.join(__dirname, nodeScript)], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) err(`${nodeScript} failed:\n${r.stdout}\n${r.stderr}`);
}

run('validate-mvp.js');
run('validate-psr6.js');
run('ms9-smoke.js');

const db = fs.readFileSync(path.join(ROOT, 'js/core/db.js'), 'utf8');
if (!db.includes('purgeLegacyPs')) err('db.js missing purgeLegacyPs (DEC-036)');
const flow = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
if (!flow.includes('purgeLegacyPs')) err('Flow.boot must call purgeLegacyPs');

const stubs = fs.readFileSync(path.join(ROOT, 'js/data/runtime-stubs.js'), 'utf8');
if (stubs.includes('getPokemon')) err('runtime-stubs.js must not define getPokemon');

const cname = fs.readFileSync(path.join(ROOT, 'CNAME'), 'utf8').trim();
const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'site-config.json'), 'utf8'));
const siteHost = new URL(cfg.siteUrl).hostname;
if (cname !== siteHost) err(`CNAME (${cname}) must match site-config host (${siteHost})`);

const dev = fs.readFileSync(path.join(ROOT, 'dev.html'), 'utf8');
if (dev.includes('PS_PAGES') || dev.includes('pokedex.js') || dev.includes('sprites-meta')) {
  err('dev.html still references legacy PS/Pokémon boot');
}

const menu = fs.readFileSync(path.join(ROOT, 'js/ui/menu.js'), 'utf8');
if (menu.includes('openDex') || menu.includes('G.DEX_BY')) err('menu.js still has legacy dex UI');

if (errors.length) {
  console.error('validate-psr7 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr7 OK (MVP + PSR-6 + MS-9 smoke, DEC-036 purge, domain)');