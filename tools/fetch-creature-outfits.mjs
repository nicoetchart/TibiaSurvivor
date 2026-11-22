/** Extrae colores Tibia Wiki (Fandom) → JSON para tibia-creature-outfits.js */
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CREATURES = [
  ['99090', 'Amazon'],
  ['99116', 'Assassin'],
  ['99146', 'Bandit'],
  ['99103', 'Barbarian_Brutetamer'],
  ['99082', 'Barbarian_Headsplitter'],
  ['99097', 'Barbarian_Skullhunter'],
  ['99149', 'Corym_Charlatan'],
  ['99083', 'Crazed_Beggar'],
  ['99135', 'Dark_Apprentice'],
  ['99117', 'Firestarter'],
  ['99119', 'Gladiator'],
  ['99106', 'Hunter'],
  ['99112', 'Lizard_Commander'],
  ['99113', 'Nomad'],
  ['99114', 'Nomad_(Blue)'],
  ['99115', 'Nomad_(Female)'],
  ['99080', 'Poacher'],
  ['99096', 'Smuggler'],
  ['99093', 'Stalker'],
  ['99125', 'Valkyrie'],
  ['99100', 'Wild_Warrior']
];

function fetchPage(title) {
  const u =
    'https://tibia.fandom.com/api.php?action=parse&page=' +
    encodeURIComponent(title) +
    '&prop=text&format=json';
  return new Promise((resolve, reject) => {
    https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0 TibiaSurvivor/dev' } }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let body = '';
        if (res.statusCode === 200) {
          try {
            body = JSON.parse(d).parse.text['*'] || '';
          } catch { /* ignore */ }
        }
        resolve({ status: res.statusCode, body });
      });
    }).on('error', reject);
  });
}

function parseField(html, src) {
  const portable = html.match(
    new RegExp(
      'data-source="' + src + '"[\\s\\S]*?<div class="pi-data-value[^"]*"[^>]*>([\\s\\S]*?)</div>',
      'i'
    )
  );
  if (!portable) return null;
  const raw = portable[1].replace(/<[^>]+>/g, '').trim();
  const n = parseInt(raw.replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : raw;
}

function parseColours(html) {
  const portable = html.match(
    /data-source="colours"[\s\S]*?<div class="pi-data-value[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  );
  if (!portable) return null;
  const raw = portable[1].replace(/<[^>]+>/g, ' ').trim();
  const head = raw.match(/Head:\s*(\d+)/i);
  const body = raw.match(/Body:\s*(\d+)/i);
  const legs = raw.match(/Legs:\s*(\d+)/i);
  const feet = raw.match(/Feet:\s*(\d+)/i);
  if (!head && !body) return null;
  return {
    head: head ? +head[1] : 0,
    body: body ? +body[1] : 0,
    legs: legs ? +legs[1] : 0,
    feet: feet ? +feet[1] : 0
  };
}

function parseAddons(html) {
  const a = parseField(html, 'addons');
  if (typeof a === 'number') return a;
  const m = String(a || '').match(/(\d+)/);
  return m ? +m[1] : 0;
}

(async () => {
  const out = {};
  for (const [legacy, wiki] of CREATURES) {
    const { status, body } = await fetchPage(wiki);
    const lookType = status === 200 ? parseField(body, 'type') : null;
    const colours = status === 200 ? parseColours(body) : null;
    const addons = status === 200 ? parseAddons(body) : 0;
    out[legacy] = {
      wiki,
      status,
      lookType: typeof lookType === 'number' ? lookType : null,
      colours,
      addons: addons || 0
    };
    console.log(legacy, wiki, status, lookType, colours, addons);
    await new Promise((r) => setTimeout(r, 150));
  }
  const outPath = path.join(__dirname, 'creature-outfits-wiki.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log('wrote', outPath);
})();