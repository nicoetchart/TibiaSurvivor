/** Colores oficiales (TibiaGG) → js/data/tibia-creature-outfits.js */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ROWS = [
  ['99090', 'amazon', 0],
  ['99116', 'assassin', 3],
  ['99146', 'bandit', 3],
  ['99103', 'barbarian-brutetamer', 3],
  ['99082', 'barbarian-headsplitter', 0],
  ['99097', 'barbarian-skullhunter', 3],
  ['99149', 'corym-charlatan', 0],
  ['99083', 'crazed-beggar', 0],
  ['99135', 'dark-apprentice', 0],
  ['99117', 'firestarter', 0],
  ['99119', 'gladiator', 3],
  ['99106', 'hunter', 3],
  ['99112', 'lizard-commander', 0],
  ['99113', 'nomad', 0],
  ['99114', 'nomad', 0],
  ['99115', 'nomad', 0],
  ['99080', 'poacher', 3],
  ['99096', 'smuggler', 3],
  ['99093', 'stalker', 3],
  ['99125', 'valkyrie', 3],
  ['99100', 'wild-warrior', 3]
];

/** Ajustes cliente/OTServ que TibiaGG no distingue por criatura (mismo lookType). */
const LEGACY_PATCH = {
  '99080': { addons: 1 },
  '99083': { addons: 3 },
  '99093': { addons: 0 },
  '99096': { addons: 0 },
  '99097': { addons: 0 },
  '99100': { addons: 0 },
  '99103': { addons: 0 },
  '99106': { addons: 0 },
  '99113': { addons: 3 },
  '99114': { head: 104, body: 48, legs: 49, feet: 3, addons: 3 },
  '99115': { head: 96, body: 39, legs: 40, feet: 3, addons: 3 },
  '99119': { addons: 0 },
  '99125': { addons: 0 },
  '99135': { addons: 1 },
  '99146': { addons: 0 }
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TibiaSurvivor/dev' } }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    }).on('error', reject);
  });
}

function codeAfter(label, body) {
  const re = new RegExp(label + '[\\s\\S]*?<code[^>]*>(\\d+)<\\/code>', 'i');
  const m = body.match(re);
  return m ? +m[1] : null;
}

function parseGg(body) {
  const lookType = codeAfter('Look type', body);
  const head = codeAfter('Head:', body);
  const bodyC = codeAfter('Body:', body);
  const legs = codeAfter('Legs:', body);
  const feet = codeAfter('Feet:', body);
  if (head == null || bodyC == null) return { lookType, colours: null };
  return {
    lookType,
    colours: {
      head,
      body: bodyC,
      legs: legs != null ? legs : 0,
      feet: feet != null ? feet : 0
    }
  };
}

(async () => {
  const byLegacy = {};
  for (const [legacy, slug, addons] of ROWS) {
    const url = `https://tibia.gg/en/wiki/${slug}`;
    const { status, body } = await fetchText(url);
    const parsed = status === 200 ? parseGg(body) : { lookType: null, colours: null };
    if (!parsed.colours) {
      console.warn('MISSING', legacy, slug, status);
      continue;
    }
    const lt = parsed.lookType;
    const outfit = Object.assign({ type: lt, addons }, parsed.colours, LEGACY_PATCH[legacy] || null);
    byLegacy[legacy] = outfit;
    console.log(legacy, slug, outfit);
    await new Promise((r) => setTimeout(r, 120));
  }

  const out = `/* ============ tibia-creature-outfits.js — lookTypes compuestos (colores Tibia) ============
 * Generado/verificado con tools/fetch-tibia-gg-outfits.mjs (TibiaGG wiki).
 * legacyId → outfit para TibiaOutfitDraw (capas + addons).
 */
G.TIBIA_CREATURE_OUTFITS = ${JSON.stringify(byLegacy, null, 2)};
`;

  const dest = path.join(__dirname, '..', 'js', 'data', 'tibia-creature-outfits.js');
  fs.writeFileSync(dest, out);
  console.log('wrote', dest, Object.keys(byLegacy).length);
})();