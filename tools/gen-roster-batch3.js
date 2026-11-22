/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const wiki = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch3-creatures-wiki.json'), 'utf8'));
if (wiki.orc_marauder && wiki.orc_marauder.speed > 130) wiki.orc_marauder.speed = 110;
if (wiki.stalker && wiki.stalker.hp === 120 && wiki.stalker.speed === 130) {
  /* wiki hp ok */
}

/** id, legacyId, name, lookType, family, bClass, diff, tier, behavior, dmg[], weak, res, weight, behaviors? */
const ROWS = [
  ['marsh_stalker', 99085, 'Marsh Stalker', 530, 'beast', 'bird', 'easy', 1, 'runner', ['physical'], null, null, 0.88, null],
  ['minotaur_archer', 99086, 'Minotaur Archer', 24, 'humanoid', 'humanoid', 'easy', 1, 'ranged', ['physical'], null, null, 0.86, ['ranged']],
  ['infernoid_spiritual', 99087, 'Infernoid Spiritual', 243, 'magical', 'magical', 'easy', 1, 'runner', ['fire', 'energy'], ['ice'], ['fire'], 0.72, null],
  ['crocodile', 99088, 'Crocodile', 119, 'reptile', 'reptile', 'easy', 1, 'charger', ['physical'], null, null, 0.9, null],
  ['orc_spearman', 99089, 'Orc Spearman', 50, 'humanoid', 'humanoid', 'easy', 1, 'ranged', ['physical'], null, null, 0.92, ['ranged']],
  ['amazon', 99090, 'Amazon', 137, 'humanoid', 'human', 'easy', 1, 'ranged', ['physical'], null, null, 0.84, ['ranged']],
  ['wisp', 99091, 'Wisp', 294, 'magical', 'magical', 'easy', 1, 'runner', ['energy'], null, null, 0.7, null],
  ['gazer', 99092, 'Gazer', 109, 'magical', 'magical', 'easy', 1, 'chase', ['energy', 'physical'], null, null, 0.82, null],
  ['stalker', 99093, 'Stalker', 128, 'humanoid', 'human', 'easy', 1, 'runner', ['physical'], null, null, 0.8, null],
  ['feverish_citizen', 99094, 'Feverish Citizen', 425, 'humanoid', 'human', 'easy', 1, 'runner', ['physical'], null, null, 0.78, null],
  ['orc_warrior', 99095, 'Orc Warrior', 7, 'humanoid', 'humanoid', 'easy', 1, 'chase', ['physical'], null, null, 1, null],
  ['smuggler', 99096, 'Smuggler', 134, 'humanoid', 'human', 'easy', 1, 'chase', ['physical'], null, null, 0.82, null],
  ['barbarian_skullhunter', 99097, 'Barbarian Skullhunter', 254, 'humanoid', 'human', 'easy', 1, 'charger', ['physical'], null, null, 0.8, null],
  ['dwarf_soldier', 99098, 'Dwarf Soldier', 71, 'humanoid', 'humanoid', 'easy', 1, 'chase', ['physical'], null, null, 0.88, null],
  ['toad', 99099, 'Toad', 222, 'amphibic', 'amphibic', 'easy', 1, 'chase', ['earth', 'physical'], null, null, 0.86, null],
  ['wild_warrior', 99100, 'Wild Warrior', 131, 'humanoid', 'human', 'easy', 1, 'charger', ['physical'], null, null, 0.84, null],
  ['husky', 99101, 'Husky', 258, 'beast', 'mammal', 'easy', 1, 'charger', ['physical'], null, null, 0.75, null],
  ['war_wolf', 99102, 'War Wolf', 3, 'beast', 'mammal', 'easy', 1, 'charger', ['physical'], null, null, 0.9, null],
  ['barbarian_brutetamer', 99103, 'Barbarian Brutetamer', 264, 'humanoid', 'human', 'easy', 1, 'ranged', ['physical'], null, null, 0.76, ['ranged']],
  ['carrion_worm', 99104, 'Carrion Worm', 192, 'vermin', 'vermin', 'easy', 1, 'chase', ['earth', 'physical'], ['fire'], null, 0.88, null],
  ['ghost', 99105, 'Ghost', 48, 'undead', 'undead', 'medium', 2, 'chase', ['death', 'physical'], ['holy'], ['death'], 0.85, null],
  ['hunter', 99106, 'Hunter', 129, 'humanoid', 'human', 'medium', 2, 'ranged', ['physical'], null, null, 0.8, ['ranged']],
  ['mercury_blob', 99107, 'Mercury Blob', 316, 'slime', 'slime', 'medium', 2, 'runner', ['earth'], ['fire'], null, 0.72, null],
  ['slime', 99108, 'Slime', 19, 'slime', 'slime', 'medium', 2, 'runner', ['earth'], ['fire'], null, 0.9, null],
  ['tarnished_spirit', 99109, 'Tarnished Spirit', 566, 'undead', 'undead', 'medium', 2, 'runner', ['death'], ['holy'], ['death'], 0.7, null],
  ['minotaur_mage', 99110, 'Minotaur Mage', 23, 'humanoid', 'humanoid', 'medium', 2, 'ranged', ['energy', 'physical'], null, null, 0.78, ['ranged']],
  ['elf_scout', 99111, 'Elf Scout', 64, 'humanoid', 'human', 'medium', 2, 'ranged', ['physical'], null, null, 0.82, ['ranged']],
  ['lizard_commander', 99112, 'Lizard Commander', 1930, 'reptile', 'reptile', 'medium', 2, 'chase', ['physical'], null, null, 0.74, null],
  ['nomad_basic', 99113, 'Nomad (Basic)', 146, 'humanoid', 'human', 'medium', 2, 'chase', ['physical'], null, null, 0.8, null],
  ['nomad_blue', 99114, 'Nomad (Blue)', 146, 'humanoid', 'human', 'medium', 2, 'chase', ['physical'], null, null, 0.65, null],
  ['nomad_female', 99115, 'Nomad (Female)', 146, 'humanoid', 'human', 'medium', 2, 'chase', ['physical'], null, null, 0.65, null],
  ['assassin', 99116, 'Assassin', 152, 'humanoid', 'human', 'medium', 2, 'runner', ['physical'], null, null, 0.7, null],
  ['firestarter', 99117, 'Firestarter', 159, 'humanoid', 'human', 'medium', 2, 'ranged', ['fire', 'physical'], ['ice'], null, 0.68, ['ranged']],
  ['orc_rider', 99118, 'Orc Rider', 4, 'humanoid', 'humanoid', 'medium', 2, 'charger', ['physical'], null, null, 0.82, null],
  ['gladiator', 99119, 'Gladiator', 131, 'humanoid', 'human', 'medium', 2, 'tank', ['physical'], null, null, 0.76, null],
  ['minotaur_guard', 99120, 'Minotaur Guard', 29, 'humanoid', 'humanoid', 'medium', 2, 'tank', ['physical'], null, null, 0.78, null],
  ['tortoise', 99121, 'Tortoise', 197, 'reptile', 'reptile', 'medium', 2, 'tank', ['physical'], null, null, 0.7, null],
  ['dark_monk', 99122, 'Dark Monk', 225, 'humanoid', 'human', 'medium', 2, 'chase', ['physical'], null, null, 0.74, null],
  ['deepling_worker', 99123, 'Deepling Worker', 470, 'aquatic', 'aquatic', 'medium', 2, 'chase', ['physical'], null, null, 0.72, null],
  ['pirate_skeleton', 99124, 'Pirate Skeleton', 195, 'undead', 'undead', 'medium', 2, 'chase', ['death', 'physical'], ['holy'], null, 0.8, null],
  ['valkyrie', 99125, 'Valkyrie', 139, 'humanoid', 'human', 'medium', 2, 'ranged', ['physical'], null, null, 0.76, ['ranged']],
  ['white_deer', 99126, 'White Deer', 400, 'beast', 'mammal', 'medium', 2, 'runner', ['physical'], null, null, 0.68, null],
  ['boar', 99127, 'Boar', 380, 'beast', 'mammal', 'medium', 2, 'charger', ['physical'], null, null, 0.85, null],
  ['gnarlhound', 99128, 'Gnarlhound', 341, 'beast', 'mammal', 'medium', 2, 'charger', ['physical'], null, null, 0.82, null],
  ['gloom_wolf', 99129, 'Gloom Wolf', 716, 'beast', 'mammal', 'medium', 2, 'charger', ['physical'], null, null, 0.72, null],
  ['mole', 99130, 'Mole', 1048, 'vermin', 'mammal', 'medium', 2, 'chase', ['physical'], null, null, 0.7, null],
  ['orc_berserker', 99131, 'Orc Berserker', 8, 'humanoid', 'humanoid', 'medium', 2, 'charger', ['physical'], null, null, 0.88, null],
  ['pirate_marauder', 99132, 'Pirate Marauder', 93, 'undead', 'undead', 'medium', 2, 'chase', ['death', 'physical'], ['holy'], null, 0.78, null],
  ['elf_arcanist', 99133, 'Elf Arcanist', 63, 'humanoid', 'human', 'medium', 2, 'ranged', ['energy', 'physical'], null, null, 0.74, ['ranged']],
  ['quara_mantassin_scout', 99134, 'Quara Mantassin Scout', 72, 'aquatic', 'aquatic', 'medium', 2, 'chase', ['ice', 'physical'], ['energy'], ['ice'], 0.76, null],
  ['dark_apprentice', 99135, 'Dark Apprentice', 133, 'humanoid', 'human', 'medium', 2, 'ranged', ['death', 'energy'], ['holy'], null, 0.72, ['ranged']],
  ['sibang', 99136, 'Sibang', 118, 'humanoid', 'humanoid', 'medium', 2, 'chase', ['physical'], null, null, 0.8, null],
  ['tarantula', 99137, 'Tarantula', 219, 'vermin', 'vermin', 'medium', 2, 'chase', ['earth', 'physical'], ['fire'], null, 0.86, null],
  ['insectoid_scout', 99138, 'Insectoid Scout', 403, 'vermin', 'vermin', 'medium', 2, 'runner', ['earth', 'physical'], ['fire'], null, 0.74, null],
  ['merlkin', 99139, 'Merlkin', 117, 'humanoid', 'humanoid', 'medium', 2, 'chase', ['physical'], null, null, 0.78, null],
  ['orc_marauder', 99140, 'Orc Marauder', 342, 'humanoid', 'humanoid', 'medium', 2, 'charger', ['physical'], null, null, 0.75, null],
  ['deepling_scout', 99141, 'Deepling Scout', 413, 'aquatic', 'aquatic', 'medium', 2, 'ranged', ['physical'], null, null, 0.72, ['ranged']],
  ['gozzler', 99142, 'Gozzler', 313, 'magical', 'magical', 'medium', 2, 'chase', ['energy', 'physical'], null, null, 0.76, null],
  ['monk_creature', 99143, 'Monk', 57, 'humanoid', 'human', 'medium', 2, 'chase', ['physical'], null, null, 0.74, null],
  ['mummy', 99144, 'Mummy', 65, 'undead', 'undead', 'medium', 2, 'tank', ['death', 'physical'], ['holy'], ['death'], 0.82, null],
  ['mutated_human', 99145, 'Mutated Human', 323, 'humanoid', 'human', 'medium', 2, 'chase', ['earth', 'physical'], ['fire'], null, 0.7, null],
  ['bandit', 99146, 'Bandit', 129, 'humanoid', 'human', 'medium', 2, 'chase', ['physical'], null, null, 0.84, null],
  ['dwarf_guard', 99147, 'Dwarf Guard', 70, 'humanoid', 'humanoid', 'medium', 2, 'tank', ['physical'], null, null, 0.8, null],
  ['acid_blob', 99148, 'Acid Blob', 314, 'slime', 'slime', 'medium', 2, 'runner', ['earth'], ['fire'], null, 0.78, null],
  ['corym_charlatan', 99149, 'Corym Charlatan', 532, 'humanoid', 'humanoid', 'medium', 2, 'chase', ['physical'], null, null, 0.76, null],
  ['gargoyle', 99150, 'Gargoyle', 95, 'magical', 'magical', 'medium', 2, 'tank', ['physical'], null, null, 0.74, null],
  ['tainted_soul', 99151, 'Tainted Soul', 712, 'undead', 'undead', 'medium', 2, 'runner', ['death'], ['holy'], ['death'], 0.68, null],
  ['carniphila', 99152, 'Carniphila', 120, 'plant', 'plant', 'medium', 2, 'chase', ['earth', 'physical'], ['fire'], ['earth'], 0.8, null]
];

const DESC = {
  marsh_stalker: 'Wading bird that strikes from swamp reeds.',
  minotaur_archer: 'Minotaur marksman that peppers foes from range.',
  infernoid_spiritual: 'Floating flame spirit that drifts through heat.',
  crocodile: 'River predator that lunges with snapping jaws.',
  orc_spearman: 'Orc foot soldier throwing spears from mid range.',
  amazon: 'Female warrior archer of the plains.',
  wisp: 'Harmless-looking energy spark that zips away when threatened.',
  gazer: 'Floating eye that lashes out with magic.',
  stalker: 'Drifting outlaw that fades in and out of sight.',
  feverish_citizen: 'Plague-stricken townsfolk running in panic.',
  orc_warrior: 'Standard orc melee fighter.',
  smuggler: 'Outlaw trader who fights when cornered.',
  barbarian_skullhunter: 'Northman raider hunting for trophies.',
  dwarf_soldier: 'Armored dwarf militia with axe and shield.',
  toad: 'Marsh toad with a surprisingly long tongue.',
  wild_warrior: 'Brigand swinging a heavy blade.',
  husky: 'Arctic sled dog that bites in a rush.',
  war_wolf: 'Trained war hound used by orcish hosts.',
  barbarian_brutetamer: 'Barbarian beast handler commanding from afar.',
  carrion_worm: 'Rotting tunnel worm surfacing near corpses.',
  ghost: 'Restless spirit immune to ordinary blades.',
  hunter: 'Human archer tracking prey through the wilds.',
  mercury_blob: 'Quicksilver ooze that slides across stone.',
  slime: 'Classic green slime that splits and spreads.',
  tarnished_spirit: 'Faded soul wandering old battlefields.',
  minotaur_mage: 'Minotaur spellcaster hurling energy.',
  elf_scout: 'Elven archer patrolling the woods.',
  lizard_commander: 'High-ranking lizard officer leading charges.',
  nomad_basic: 'Desert nomad with spear and turban.',
  nomad_blue: 'Blue-clad nomad from the caravan routes.',
  nomad_female: 'Female nomad fighter of the dunes.',
  assassin: 'Silent killer that strikes and retreats.',
  firestarter: 'Arsonist lobbing burning projectiles.',
  orc_rider: 'Orc on war wolf mount charging the line.',
  gladiator: 'Arena fighter built to soak damage.',
  minotaur_guard: 'Hulking minotaur blocking the passage.',
  tortoise: 'Slow armored reptile with a hard shell.',
  dark_monk: 'Corrupted monk striking with inner rage.',
  deepling_worker: 'Deep-sea laborer with surprising strength.',
  pirate_skeleton: 'Undead buccaneer rising from the hold.',
  valkyrie: 'Shieldmaiden attacking with throws and blades.',
  white_deer: 'Sacred stag that flees when wounded.',
  boar: 'Tusked charger crashing through brush.',
  gnarlhound: 'Mangy hound that snaps at ankles.',
  gloom_wolf: 'Shadow-touched wolf with a vicious bite.',
  mole: 'Burrowing mammal erupting near your feet.',
  orc_berserker: 'Frenzied orc swinging wildly in melee.',
  pirate_marauder: 'Undead pirate boarding party.',
  elf_arcanist: 'Elven mage weaving energy bolts.',
  quara_mantassin_scout: 'Quara scout darting through water.',
  dark_apprentice: 'Novice warlock casting death sparks.',
  sibang: 'Ape fighter from the ape city.',
  tarantula: 'Huge spider whose bite weakens prey.',
  insectoid_scout: 'Chitinous scout skittering ahead of the hive.',
  merlkin: 'Shamanistic ape throwing small attacks.',
  orc_marauder: 'Orc raider on lightning-fast raids.',
  deepling_scout: 'Deepling look-out attacking from range.',
  gozzler: 'Small demon imp harassing spellcasters.',
  monk_creature: 'Disciplined monk fighting bare-handed.',
  mummy: 'Wrapped undead rotting with ancient curses.',
  mutated_human: 'Warped experiment oozing toxic filth.',
  bandit: 'Highway robber with bow and sword.',
  dwarf_guard: 'Elite dwarf sentinel with heavy armor.',
  acid_blob: 'Corrosive blob that melts gear on contact.',
  corym_charlatan: 'Corym trickster fighting in cramped tunnels.',
  gargoyle: 'Stone guardian with slow but crushing blows.',
  tainted_soul: 'Corrupted soul flickering between planes.',
  carniphila: 'Man-eating plant rooted but reaching far.'
};

function attackFor(hp, behavior) {
  if (hp >= 220) return 1.08;
  if (hp >= 180) return 1.06;
  if (hp >= 150) return 1.04;
  if (behavior === 'tank') return 1.03;
  return 1;
}

let blocks = '';
for (const row of ROWS) {
  const [id, legacyId, name, , family, bClass, diff, tier, behavior, dmg, weak, res, weight, behaviors] = row;
  const w = wiki[id] || {};
  const hp = w.hp || 100;
  let speed = w.speed || 70;
  if (speed > 130) speed = Math.min(115, Math.round(speed * 0.6));
  const atk = attackFor(hp, behavior);
  const desc = DESC[id] || `${name} from Tibia.`;
  let extra = '';
  if (weak) extra += `, weaknesses: ${JSON.stringify(weak)}`;
  if (res) extra += `, resistances: ${JSON.stringify(res)}`;
  const behExtra = behaviors ? `, behaviors: ${JSON.stringify(behaviors)}` : '';
  const tags = behaviors && behaviors.includes('ranged') ? "['ranged', 'ground']" : "['melee', 'ground']";
  blocks += `  { id: '${id}', legacyId: ${legacyId}, name: '${name.replace(/'/g, "\\'")}', description: '${desc.replace(/'/g, "\\'")}',\n`;
  blocks += `    nameKey: 'creature.${id}.name', descriptionKey: 'creature.${id}.description',\n`;
  blocks += `    family: '${family}', bestiaryClass: '${bClass}', difficulty: '${diff}', tags: ${tags},\n`;
  blocks += `    hp: ${hp}, speed: ${speed}, attack: ${atk}, damageTypes: ${JSON.stringify(dmg)}, defenseTypes: ${JSON.stringify(dmg[0] === 'physical' ? ['physical'] : [dmg[0]])}${extra},\n`;
  blocks += `    behavior: '${behavior}'${behExtra}, sprite: 'tibia', role: 'enemy', tier: ${tier}, spawnWeight: ${weight},\n`;
  blocks += `    bestiary: rosterBestiary('${id}') },\n`;
}

const rosterPath = path.join(__dirname, '..', 'js', 'data', 'creatures-roster-ext.js');
let src = fs.readFileSync(rosterPath, 'utf8');
if (src.includes("id: 'marsh_stalker'")) {
  console.log('batch3 already present, skip roster append');
} else {
  if (src.includes("bestiary: rosterBestiary('elf') },") && !src.includes("id: 'marsh_stalker'")) {
    src = src.replace(
      /bestiary: rosterBestiary\('elf'\) \},\n\];/,
      `bestiary: rosterBestiary('elf') },\n${blocks}];`
    );
  } else if (!src.includes("id: 'marsh_stalker'")) {
    src = src.replace(/\n];\s*$/, `,\n${blocks}];\n`);
  }
  fs.writeFileSync(rosterPath, src);
  console.log('appended', ROWS.length, 'creatures to roster-ext');
}

const tipsPath = path.join(__dirname, '..', 'js', 'data', 'bestiary-tips.js');
let tips = fs.readFileSync(tipsPath, 'utf8');
const tipLines = [];
for (const row of ROWS) {
  const id = row[0];
  const name = row[2];
  const key = `'bestiary.${id}.tip1'`;
  if (tips.includes(key)) continue;
  const en = `Against ${name}: respect its range and damage types.`;
  const es = `Contra ${name}: cuidado con su alcance y tipos de daño.`;
  tipLines.push(`  ${key}: { es: '${es.replace(/'/g, "\\'")}', en: '${en.replace(/'/g, "\\'")}' },`);
}
if (tipLines.length) {
  tips = tips.replace(
    /(\n\s*'bestiary\.elf\.tip1':[^\n]+\n)(};)/,
    `$1${tipLines.join('\n')}\n$2`
  );
  fs.writeFileSync(tipsPath, tips);
}
console.log('tips added:', tipLines.length);

const mapPath = path.join(__dirname, '..', 'js', 'data', 'tibia-sprite-map.js');
let map = fs.readFileSync(mapPath, 'utf8');
for (const row of ROWS) {
  const [, legacyId, name, lookType] = row;
  const line = `    ${legacyId}: { kind: 'lookType', lookType: ${lookType} },`;
  if (!map.includes(`${legacyId}:`)) {
    map = map.replace(
      /99084: \{ kind: 'lookType', lookType: 62 \}\s*\/\/ Elf/,
      `99084: { kind: 'lookType', lookType: 62 },     // Elf`
    );
  }
}
fs.writeFileSync(mapPath, map);
console.log('sprite map updated');

const importPath = path.join(__dirname, 'import_tibia_grouped.mjs');
let imp = fs.readFileSync(importPath, 'utf8');
const existing = new Set();
const m = imp.match(/const MVP_LOOKTYPES = \[([\s\S]*?)\];/);
if (m) {
  for (const n of m[1].match(/\d+/g) || []) existing.add(+n);
}
const add = [];
for (const row of ROWS) {
  const lt = row[3];
  if (!existing.has(lt)) {
    existing.add(lt);
    add.push(lt);
  }
}
if (add.length && !imp.includes('// batch3')) {
  imp = imp.replace(
    /(129, 242, 253, 153, 62)\n\];/,
    `$1,\n  // batch3\n  ${add.join(', ')}\n];`
  );
  fs.writeFileSync(importPath, imp);
  console.log('import looktypes +', add.length);
}

const metaPath = path.join(__dirname, 'batch3-looktypes.json');
fs.writeFileSync(metaPath, JSON.stringify({ added: add, rows: ROWS.length }, null, 2));
console.log('done batch3', ROWS.length, 'creatures', legacyIdStart(ROWS), '-', legacyIdEnd(ROWS));

function legacyIdStart(rows) { return rows[0][1]; }
function legacyIdEnd(rows) { return rows[rows.length - 1][1]; }