/* CYC-10 — Cyclopedia UI smoke (search filter logic via exported pattern). */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'dev.html'), 'utf8');
const ui = fs.readFileSync(path.join(ROOT, 'js/ui/bestiary-ui.js'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'css/style.css'), 'utf8');
const errors = [];
const ok = (c, m) => { if (!c) errors.push(m); };

ok(/id="cyclopedia-daily"/.test(html), 'cyclopedia-daily in dev.html');
ok(/id="bestiary-search"/.test(html), 'bestiary-search in dev.html');
ok(/function renderDailyPanel/.test(ui), 'renderDailyPanel');
ok(/searchQ/.test(ui), 'search state');
ok(/isDailyBoostEntry/.test(ui), 'boost highlight');
ok(/\.cyclopedia-daily/.test(css), 'daily panel css');

if (errors.length) {
  console.error('validate-cyclopedia-ui FAIL:\n' + errors.map(e => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('validate-cyclopedia-ui OK');