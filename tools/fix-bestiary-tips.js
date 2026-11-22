const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'js', 'data', 'bestiary-tips.js');
let lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
const batchStart = lines.findIndex((l) => l.includes("'bestiary.swamp_troll.tip1'"));
const batchEnd = lines.findIndex((l, i) => i > batchStart && l.trim() === '};' && lines[i + 1] === '');
const batch = lines.slice(batchStart, batchEnd);
const head = lines.slice(0, lines.findIndex((l) => l.includes("'bestiary.crab.tip1'")) + 1);
head[head.length - 1] = head[head.length - 1].replace(/\s*\}\s*$/, ',');
const tail = [
  '',
  'G.BestiaryTips = {',
  '  text(key) {',
  '    const row = G.BESTIARY_TIPS && G.BESTIARY_TIPS[key];',
  '    if (!row) return null;',
  '    return row.en || row.es;',
  '  },',
  '  has(key) {',
  '    return !!(G.BESTIARY_TIPS && G.BESTIARY_TIPS[key]);',
  '  }',
  '};',
  ''
];
const out = [...head, ...batch, '};', ...tail].join('\n');
fs.writeFileSync(p, out);
console.log('fixed, batch lines', batch.length);