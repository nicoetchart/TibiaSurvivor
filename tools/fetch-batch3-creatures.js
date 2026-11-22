const https = require('https');
const fs = require('fs');
const path = require('path');

const CREATURES = [
  ['marsh_stalker', 'Marsh_Stalker'],
  ['minotaur_archer', 'Minotaur_Archer'],
  ['infernoid_spiritual', 'Infernoid_Spiritual', 'Infernoid_Spectral'],
  ['crocodile', 'Crocodile'],
  ['orc_spearman', 'Orc_Spearman'],
  ['amazon', 'Amazon'],
  ['wisp', 'Wisp'],
  ['gazer', 'Gazer'],
  ['stalker', 'Stalker'],
  ['feverish_citizen', 'Feverish_Citizen'],
  ['orc_warrior', 'Orc_Warrior'],
  ['smuggler', 'Smuggler'],
  ['barbarian_skullhunter', 'Barbarian_Skullhunter'],
  ['dwarf_soldier', 'Dwarf_Soldier'],
  ['toad', 'Toad'],
  ['wild_warrior', 'Wild_Warrior'],
  ['husky', 'Husky'],
  ['war_wolf', 'War_Wolf'],
  ['barbarian_brutetamer', 'Barbarian_Brutetamer'],
  ['carrion_worm', 'Carrion_Worm'],
  ['ghost', 'Ghost'],
  ['hunter', 'Hunter'],
  ['mercury_blob', 'Mercury_Blob'],
  ['slime', 'Slime'],
  ['tarnished_spirit', 'Tarnished_Spirit'],
  ['minotaur_mage', 'Minotaur_Mage'],
  ['elf_scout', 'Elf_Scout'],
  ['lizard_commander', 'Lizard_Commander', 'Lizard_Legionnaire'],
  ['nomad_basic', 'Nomad_(Basic)'],
  ['nomad_blue', 'Nomad_(Blue)'],
  ['nomad_female', 'Nomad_(Female)'],
  ['assassin', 'Assassin'],
  ['firestarter', 'Firestarter'],
  ['orc_rider', 'Orc_Rider'],
  ['gladiator', 'Gladiator'],
  ['minotaur_guard', 'Minotaur_Guard'],
  ['tortoise', 'Tortoise'],
  ['dark_monk', 'Dark_Monk'],
  ['deepling_worker', 'Deepling_Worker'],
  ['pirate_skeleton', 'Pirate_Skeleton'],
  ['valkyrie', 'Valkyrie'],
  ['white_deer', 'White_Deer'],
  ['boar', 'Boar'],
  ['gnarlhound', 'Gnarlhound'],
  ['gloom_wolf', 'Gloom_Wolf'],
  ['mole', 'Mole'],
  ['orc_berserker', 'Orc_Berserker'],
  ['pirate_marauder', 'Pirate_Marauder'],
  ['elf_arcanist', 'Elf_Arcanist'],
  ['quara_mantassin_scout', 'Quara_Mantassin_Scout'],
  ['dark_apprentice', 'Dark_Apprentice'],
  ['sibang', 'Sibang'],
  ['tarantula', 'Tarantula'],
  ['insectoid_scout', 'Insectoid_Scout'],
  ['merlkin', 'Merlkin'],
  ['orc_marauder', 'Orc_Marauder'],
  ['deepling_scout', 'Deepling_Scout'],
  ['gozzler', 'Gozzler'],
  ['monk_creature', 'Monk_(Creature)'],
  ['mummy', 'Mummy'],
  ['mutated_human', 'Mutated_Human'],
  ['bandit', 'Bandit'],
  ['dwarf_guard', 'Dwarf_Guard'],
  ['acid_blob', 'Acid_Blob'],
  ['corym_charlatan', 'Corym_Charlatan'],
  ['gargoyle', 'Gargoyle'],
  ['tainted_soul', 'Tainted_Soul'],
  ['carniphila', 'Carniphila']
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
        resolve({ status: res.statusCode, body, title });
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
  for (const row of CREATURES) {
    const id = row[0];
    const titles = row.slice(1);
    let status = 404;
    let body = '';
    let usedTitle = titles[0];
    for (const t of titles) {
      const res = await fetchPage(t);
      if (res.status === 200 && res.body.length > 200) {
        status = res.status;
        body = res.body;
        usedTitle = t;
        break;
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    const hp = status === 200 ? parseField(body, 'hp') : null;
    let speed = status === 200 ? parseField(body, 'speed') : null;
    if (typeof speed === 'number' && speed > 200) speed = Math.round(speed / 3);
    const lookType = status === 200 ? parseField(body, 'type') : null;
    out[id] = { wiki: usedTitle, status, hp, speed, lookType };
    console.log(id, status, hp, speed, lookType, usedTitle);
    await new Promise((r) => setTimeout(r, 100));
  }
  const outPath = path.join(__dirname, 'batch3-creatures-wiki.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log('wrote', outPath);
})();