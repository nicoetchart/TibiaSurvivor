/* PSR-10: sin G.DEX/G.DEX_BY en runtime; eventos solo horde/gold. */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr9.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr9 failed');

const stubs = fs.readFileSync(path.join(ROOT, 'js/data/runtime-stubs.js'), 'utf8');
if (/\bG\.DEX\s*=/.test(stubs) || /\bG\.DEX_BY\s*=/.test(stubs)) {
  err('runtime-stubs.js must not assign G.DEX or G.DEX_BY');
}

const events = fs.readFileSync(path.join(ROOT, 'js/systems/events.js'), 'utf8');
if (events.includes('G.DEX') || events.includes('spawnLost') || events.includes("'lost'")) {
  err('events.js must be horde/gold only (no G.DEX, lost event)');
}

const skip = new Set(['js/data/changelog.js']);
function walkJs(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.relative(ROOT, path.join(dir, ent.name)).replace(/\\/g, '/');
    if (ent.isDirectory()) walkJs(path.join(dir, ent.name));
    else if (ent.name.endsWith('.js') && !skip.has(rel) && rel !== 'js/data/runtime-stubs.js' && rel !== 'js/app.min.js') {
      const t = fs.readFileSync(path.join(dir, ent.name), 'utf8');
      if (/\bG\.DEX\b/.test(t) || /\bG\.DEX_BY\b/.test(t)) err(`${rel} must not reference G.DEX or G.DEX_BY`);
    }
  }
}
walkJs(path.join(ROOT, 'js'));

const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
if (game.includes('G.onRescue') || game.includes('G.onShinyCaught')) {
  err('game.js must not define onRescue/onShinyCaught hooks');
}

if (errors.length) {
  console.error('validate-psr10 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr10 OK');