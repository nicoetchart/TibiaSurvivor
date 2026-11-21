/* PSR-15: lang-en sin claves huérfanas (referenciadas en el repo). */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const errors = [];
const err = m => errors.push(m);

const r = spawnSync(process.execPath, [path.join(__dirname, 'validate-psr14.js')], { cwd: ROOT, encoding: 'utf8' });
if (r.status !== 0) err('validate-psr14 failed');

const dry = spawnSync(process.execPath, [path.join(__dirname, 'prune-lang-en-orphans-psr15.js'), '--dry-run'], {
  cwd: ROOT, encoding: 'utf8'
});
if (dry.status === 2) {
  const n = (dry.stdout || '').match(/unused \(scan\): (\d+)/);
  err(`lang-en has ${n ? n[1] : '?'} unused keys (run prune-lang-en-orphans-psr15.js)`);
} else if (dry.status !== 0) err('prune-lang-en-orphans dry-run failed');

const lang = fs.readFileSync(path.join(ROOT, 'js', 'data', 'lang-en.js'), 'utf8');
if (lang.includes('// test de personalidad')) err('lang-en still has personality-test block');

if (errors.length) {
  console.error('validate-psr15 FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-psr15 OK');