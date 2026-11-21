/* PSR-12: HTML/UI sin controles legacy (shiny/tickets). */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr11.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr11 failed');

const dev = fs.readFileSync(path.join(ROOT, 'dev.html'), 'utf8');
for (const ban of ['menu-shiny', 'tickets-pill', 'Gacha tickets']) {
  if (dev.includes(ban)) err(`dev.html must not contain ${ban}`);
}

const ui = fs.readFileSync(path.join(ROOT, 'js/ui/ui.js'), 'utf8');
if (ui.includes("Gacha") || ui.includes('ticket10')) err('ui.js must not wire gacha tickets UI');

if (errors.length) {
  console.error('validate-psr12 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr12 OK');