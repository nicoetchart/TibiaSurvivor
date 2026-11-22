const fs = require('fs');
const path = require('path');
const gen = fs.readFileSync(path.join(__dirname, 'gen-roster-batch3.js'), 'utf8');
const ROWS = [...gen.matchAll(/\['(\w+)',\s*(\d+),\s*'([^']+)',\s*(\d+)/g)].map((m) => ({
  legacy: +m[2],
  name: m[3],
  lt: +m[4]
}));
let lines = '';
for (const r of ROWS) {
  lines += `    ${r.legacy}: { kind: 'lookType', lookType: ${r.lt} },    // ${r.name}\n`;
}
const mapPath = path.join(__dirname, '..', 'js', 'data', 'tibia-sprite-map.js');
let map = fs.readFileSync(mapPath, 'utf8');
if (map.includes('99085:')) {
  console.log('sprite map batch3 already patched');
  process.exit(0);
}
map = map.replace(
  /99084: \{ kind: 'lookType', lookType: 62 \}\s*\/\/ Elf/,
  `99084: { kind: 'lookType', lookType: 62 },     // Elf\n${lines.trim()}`
);
fs.writeFileSync(mapPath, map);
console.log('patched', ROWS.length, 'sprite map entries');