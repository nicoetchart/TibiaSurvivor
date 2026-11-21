/* Reescribe valores EN con términos legacy (PSR-11). */
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'js', 'data', 'lang-en.js');
const BAN = /Pokémon|Poké|Arceus|Gacha|SpriteCollab|GAME FREAK|Nintendo|The Pokémon Company|Pokédex|Pokémonedas|gacha pull|PMD SpriteCollab|966\s/i;

let lines = fs.readFileSync(FILE, 'utf8').split(/\n/);
const out = [];
let skip = false;

for (const line of lines) {
  if (line.includes('// colección')) { skip = true; continue; }
  if (skip === true && line.includes('// ---------------- misiones, logros y perfil')) {
    skip = false;
    out.push(line);
    continue;
  }
  if (skip === true) continue;
  if (line.trim().startsWith('//') && line.includes('La Sentencia de Arceus')) { skip = 'arceus'; continue; }
  if (skip === 'arceus' && line.includes('// ---------------- recuperar la cuenta')) {
    skip = false;
    out.push(line);
    continue;
  }
  if (skip === 'arceus') continue;

  if (line.trim().startsWith('//') || !line.includes("': '")) {
    out.push(line);
    continue;
  }

  const fixed = line.replace(/'((?:\\.|[^'\\])*)'\s*:\s*'((?:\\.|[^'\\])*)'/g, (_, es, en) => {
    let v = en;
    if (BAN.test(v)) {
      if (es.includes('Proyecto de fan sin ánimo')) {
        v = 'TibiaSurvivor · fan project · Tibia-inspired art · MIT code';
      } else if (es.includes('Sobrevive a las hordas con tu compañero')) {
        v = 'Underground hunting sessions · free in your browser';
      } else if (es.includes('Juego de supervivencia con Pokémon')) {
        v = 'A pixel-art fantasy survivor, free in your browser.';
      } else if (es.includes('Sobrevive a las hordas con tu compañero Pokémon') && !es.includes('·')) {
        v = 'Survive the hordes with your hunting vocation';
      } else {
        v = v
          .replace(/Pokémonedas/gi, 'gold coins')
          .replace(/Pokémon/gi, 'creatures')
          .replace(/Pokédex/gi, 'Bestiary')
          .replace(/Arceus/gi, 'the boss')
          .replace(/Gacha/gi, 'Market')
          .replace(/gacha/gi, 'market')
          .replace(/SpriteCollab|PMD SpriteCollab/gi, 'community artists')
          .replace(/Nintendo|Creatures Inc\.|GAME FREAK|The Pokémon Company/gi, 'their respective owners')
          .replace(/966 creatures from all 9 regions[^.]*/gi, 'hunts in a Tibia-inspired bestiary')
          .replace(/shinies never repeat/gi, 'duplicates give gold coins');
      }
    }
    if (es === 'Pokémon' && v === 'Pokémon') v = 'Creatures';
    if (es.includes('Tickets del gacha')) v = 'Gold coins';
    if (es.includes('9 regiones')) v = 'Bestiary progress';
    return `'${es}': '${v}'`;
  });
  out.push(fixed);
}

const s = out.join('\n');
const bad = [];
for (const line of s.split(/\n/)) {
  const m = line.match(/':\s*'([^']*(?:\\'[^']*)*)'/g);
  if (!m) continue;
  for (const part of m) {
    const v = part.slice(4, -1);
    if (BAN.test(v)) bad.push(v.slice(0, 60));
  }
}
if (bad.length) {
  console.error('sanitize-lang-en-psr11 FAIL:', bad.slice(0, 12));
  process.exit(1);
}
if (!/\}\);\s*$/.test(s.replace(/\r/g, ''))) {
  console.error('sanitize-lang-en-psr11: missing closing });', JSON.stringify(s.slice(-80)));
  process.exit(1);
}
fs.writeFileSync(FILE, s);
console.log('sanitize-lang-en-psr11 OK');