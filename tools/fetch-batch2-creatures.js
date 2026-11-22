const https = require('https');
const fs = require('fs');
const path = require('path');

const CREATURES = [
  ['swamp_troll', 'Swamp_Troll'],
  ['lizard_henchman', 'Lizard_Henchman'],
  ['goblin_scavenger', 'Goblin_Scavenger'],
  ['hyaena', 'Hyaena'],
  ['lizard_magician', 'Lizard_Magician'],
  ['cobra', 'Cobra'],
  ['rotworm', 'Rotworm'],
  ['skeleton_warrior', 'Skeleton_Warrior'],
  ['chakoya_tribewarden', 'Chakoya_Tribewarden'],
  ['lizard_swordmaster', 'Lizard_Swordmaster'],
  ['pirate_gunner', 'Pirate_Gunner'],
  ['centipede', 'Centipede'],
  ['larva', 'Larva'],
  ['orc', 'Orc'],
  ['salamander', 'Salamander'],
  ['lizard_executioner', 'Lizard_Executioner'],
  ['goblin_assassin', 'Goblin_Assassin'],
  ['tiger', 'Tiger'],
  ['troll_champion', 'Troll_Champion'],
  ['white_tiger', 'White_Tiger'],
  ['wild_horse', 'Wild_Horse'],
  ['bear', 'Bear'],
  ['chakoya_toolshaper', 'Chakoya_Toolshaper'],
  ['dworc_venomsniper', 'Dworc_Venomsniper'],
  ['dworc_voodomaster', 'Dworc_Voodomaster'],
  ['lion', 'Lion'],
  ['panda', 'Panda'],
  ['swampling', 'Swampling'],
  ['chakoya_windcaller', 'Chakoya_Windcaller'],
  ['dworc_fleshhunter', 'Dworc_Fleshhunter'],
  ['honor_guard', 'Honor_Guard'],
  ['infernoid_hound', 'Infernoid_Hound'],
  ['emerald_damselfly', 'Emerald_Damselfly'],
  ['dwarf', 'Dwarf'],
  ['leaf_golem', 'Leaf_Golem'],
  ['poacher', 'Poacher'],
  ['infernoid_soul', 'Infernoid_Soul'],
  ['barbarian_headsplitter', 'Barbarian_Headsplitter'],
  ['crazed_beggar', 'Crazed_Beggar'],
  ['elf', 'Elf']
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
    const hp = status === 200 ? parseField(body, 'hp') : null;
    let speed = status === 200 ? parseField(body, 'speed') : null;
    if (typeof speed === 'number' && speed > 200) speed = Math.round(speed / 3);
    const lookType = status === 200 ? parseField(body, 'type') : null;
    out[id] = { wiki, status, hp, speed, lookType };
    console.log(id, status, hp, speed, lookType);
    await new Promise((r) => setTimeout(r, 120));
  }
  const outPath = path.join(__dirname, 'batch2-creatures-wiki.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log('wrote', outPath);
})();