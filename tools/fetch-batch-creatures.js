const https = require('https');
const fs = require('fs');
const path = require('path');

const CREATURES = [
  ['chicken', 'Chicken'],
  ['rat', 'Rat'],
  ['sheep', 'Sheep'],
  ['skunk', 'Skunk'],
  ['spider', 'Spider'],
  ['squirrel', 'Squirrel'],
  ['fox', 'Fox'],
  ['badger', 'Badger'],
  ['flamingo', 'Flamingo'],
  ['parrot', 'Parrot'],
  ['pig', 'Pig'],
  ['seagull', 'Seagull'],
  ['poison_spider', 'Poison_Spider'],
  ['bat', 'Bat'],
  ['cave_rat', 'Cave_Rat'],
  ['pigeon', 'Pigeon'],
  ['sandcrawler', 'Sandcrawler'],
  ['winter_wolf', 'Winter_Wolf'],
  ['penguin', 'Penguin'],
  ['dromedary', 'Dromedary'],
  ['scorpion', 'Scorpion'],
  ['goblin', 'Goblin'],
  ['insect_swarm', 'Insect_Swarm'],
  ['island_troll', 'Island_Troll'],
  ['skeleton', 'Skeleton'],
  ['crab', 'Crab']
];

function fetchPage(title) {
  const u =
    'https://tibia.fandom.com/api.php?action=parse&page=' +
    encodeURIComponent(title) +
    '&prop=text&format=json';
  return new Promise((resolve, reject) => {
    https.get(u, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let d = '';
      res.on('data', (c) => { d += c; });
      res.on('end', () => {
        let body = '';
        if (res.statusCode === 200) {
          try {
            body = JSON.parse(d).parse.text['*'] || '';
          } catch (_) {}
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

(async () => {
  const out = {};
  for (const [id, wiki] of CREATURES) {
    const { status, body } = await fetchPage(wiki);
    out[id] = {
      wiki,
      status,
      hp: status === 200 ? parseField(body, 'hp') : null,
      speed: status === 200 ? parseField(body, 'speed') : null,
      lookType: status === 200 ? parseField(body, 'type') : null
    };
    console.log(id, out[id].hp, out[id].speed, out[id].lookType);
    await new Promise((r) => setTimeout(r, 320));
  }
  fs.writeFileSync(path.join(__dirname, 'batch-creatures-wiki.json'), JSON.stringify(out, null, 2));
})();