/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const wiki = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch2-creatures-wiki.json'), 'utf8'));
wiki.dworc_voodomaster.hp = 80;
wiki.dworc_voodomaster.speed = 75;
wiki.honor_guard = { hp: 85, speed: 77 };

const ROWS = [
  ['swamp_troll', 99045, 'Swamp Troll', 76, 'humanoid', 'humanoid', 'easy', 1, 'chase', ['physical'], null, null, 0.9, null],
  ['lizard_henchman', 99046, 'Lizard Henchman', 1927, 'reptile', 'reptile', 'easy', 1, 'chase', ['physical'], null, null, 0.85, null],
  ['goblin_scavenger', 99047, 'Goblin Scavenger', 297, 'humanoid', 'humanoid', 'easy', 1, 'chase', ['physical'], null, null, 0.92, null],
  ['hyaena', 99048, 'Hyaena', 94, 'beast', 'mammal', 'easy', 1, 'charger', ['physical'], null, null, 0.88, null],
  ['lizard_magician', 99049, 'Lizard Magician', 1928, 'reptile', 'reptile', 'easy', 1, 'ranged', ['energy', 'physical'], null, null, 0.78, ['ranged']],
  ['cobra', 99050, 'Cobra', 81, 'reptile', 'reptile', 'easy', 1, 'chase', ['earth', 'physical'], ['fire'], null, 0.86, null],
  ['rotworm', 99051, 'Rotworm', 26, 'vermin', 'vermin', 'easy', 1, 'chase', ['physical'], null, null, 1, null],
  ['skeleton_warrior', 99052, 'Skeleton Warrior', 298, 'undead', 'undead', 'easy', 1, 'chase', ['death', 'physical'], ['holy'], null, 0.9, null],
  ['chakoya_tribewarden', 99053, 'Chakoya Tribewarden', 249, 'humanoid', 'humanoid', 'easy', 1, 'tank', ['physical'], null, ['ice'], 0.82, null],
  ['lizard_swordmaster', 99054, 'Lizard Swordmaster', 1929, 'reptile', 'reptile', 'easy', 1, 'charger', ['physical'], null, null, 0.8, null],
  ['pirate_gunner', 99055, 'Pirate Gunner', 97, 'humanoid', 'humanoid', 'easy', 1, 'ranged', ['physical'], null, null, 0.74, ['ranged']],
  ['centipede', 99056, 'Centipede', 124, 'vermin', 'vermin', 'easy', 1, 'chase', ['earth'], ['fire'], null, 0.88, null],
  ['larva', 99057, 'Larva', 82, 'vermin', 'vermin', 'easy', 1, 'chase', ['earth'], ['fire'], null, 0.95, null],
  ['orc', 99058, 'Orc', 5, 'humanoid', 'humanoid', 'easy', 1, 'chase', ['physical'], null, null, 1.05, null],
  ['salamander', 99059, 'Salamander', 529, 'reptile', 'reptile', 'easy', 1, 'runner', ['fire', 'physical'], ['ice'], null, 0.84, null],
  ['lizard_executioner', 99060, 'Lizard Executioner', 1929, 'reptile', 'reptile', 'easy', 1, 'chase', ['physical'], null, null, 0.76, null],
  ['goblin_assassin', 99061, 'Goblin Assassin', 296, 'humanoid', 'humanoid', 'easy', 1, 'runner', ['physical'], null, null, 0.82, null],
  ['tiger', 99062, 'Tiger', 125, 'beast', 'mammal', 'easy', 1, 'charger', ['physical'], null, null, 0.85, null],
  ['troll_champion', 99063, 'Troll Champion', 281, 'humanoid', 'humanoid', 'easy', 1, 'tank', ['physical'], ['death', 'earth'], ['energy', 'holy'], 0.8, null],
  ['white_tiger', 99064, 'White Tiger', 1649, 'beast', 'mammal', 'easy', 1, 'charger', ['physical'], null, null, 0.72, null],
  ['wild_horse', 99065, 'Wild Horse', 393, 'beast', 'mammal', 'easy', 1, 'runner', ['physical'], null, null, 0.7, null],
  ['bear', 99066, 'Bear', 16, 'beast', 'mammal', 'easy', 1, 'tank', ['physical'], null, null, 0.88, null],
  ['chakoya_toolshaper', 99067, 'Chakoya Toolshaper', 259, 'humanoid', 'humanoid', 'easy', 1, 'chase', ['physical'], null, ['ice'], 0.78, null],
  ['dworc_venomsniper', 99068, 'Dworc Venomsniper', 216, 'humanoid', 'humanoid', 'easy', 1, 'ranged', ['earth', 'physical'], null, null, 0.76, ['ranged']],
  ['dworc_voodomaster', 99069, 'Dworc Voodomaster', 214, 'humanoid', 'humanoid', 'easy', 1, 'ranged', ['death', 'earth'], null, null, 0.74, ['ranged']],
  ['lion', 99070, 'Lion', 41, 'beast', 'mammal', 'easy', 1, 'charger', ['physical'], null, null, 0.86, null],
  ['panda', 99071, 'Panda', 123, 'beast', 'mammal', 'easy', 1, 'tank', ['physical'], null, null, 0.72, null],
  ['swampling', 99072, 'Swampling', 535, 'plant', 'plant', 'easy', 1, 'chase', ['earth', 'physical'], ['fire'], null, 0.8, null],
  ['chakoya_windcaller', 99073, 'Chakoya Windcaller', 260, 'humanoid', 'humanoid', 'easy', 1, 'ranged', ['ice', 'energy'], null, ['ice'], 0.72, ['ranged']],
  ['dworc_fleshhunter', 99074, 'Dworc Fleshhunter', 215, 'humanoid', 'humanoid', 'easy', 1, 'chase', ['physical'], null, null, 0.84, null],
  ['honor_guard', 99075, 'Honor Guard', 298, 'undead', 'undead', 'easy', 1, 'tank', ['death', 'physical'], ['holy'], null, 0.7, null],
  ['infernoid_hound', 99076, 'Infernoid Hound', 414, 'magical', 'magical', 'medium', 2, 'charger', ['fire', 'physical'], ['ice'], ['fire'], 0.68, null],
  ['emerald_damselfly', 99077, 'Emerald Damselfly', 528, 'vermin', 'vermin', 'medium', 2, 'runner', ['earth', 'physical'], ['fire'], null, 0.65, null],
  ['dwarf', 99078, 'Dwarf', 69, 'humanoid', 'humanoid', 'medium', 2, 'chase', ['physical'], null, null, 0.82, null],
  ['leaf_golem', 99079, 'Leaf Golem', 567, 'construct', 'construct', 'medium', 2, 'tank', ['earth', 'physical'], ['fire'], ['earth'], 0.75, null],
  ['poacher', 99080, 'Poacher', 129, 'humanoid', 'human', 'medium', 2, 'ranged', ['physical'], null, null, 0.72, ['ranged']],
  ['infernoid_soul', 99081, 'Infernoid Soul', 242, 'magical', 'magical', 'medium', 2, 'runner', ['fire', 'death'], ['ice', 'holy'], ['fire'], 0.66, null],
  ['barbarian_headsplitter', 99082, 'Barbarian Headsplitter', 253, 'humanoid', 'human', 'medium', 2, 'charger', ['physical'], null, null, 0.78, null],
  ['crazed_beggar', 99083, 'Crazed Beggar', 153, 'humanoid', 'human', 'medium', 2, 'chase', ['physical'], null, null, 0.7, null],
  ['elf', 99084, 'Elf', 62, 'humanoid', 'human', 'medium', 2, 'ranged', ['physical'], null, null, 0.8, ['ranged']]
];

const DESC = {
  swamp_troll: 'Bog troll that lurks in poison and strikes from the mud.',
  lizard_henchman: 'Low-ranking lizard thug from the Muggy Plains.',
  goblin_scavenger: 'Goblin that picks through scraps and fights for scraps of loot.',
  hyaena: 'Pack scavenger that circles wounded prey.',
  lizard_magician: 'Casts sudden energy bursts between claw swipes.',
  cobra: 'Venomous snake that strikes from short range.',
  rotworm: 'Tunnel worm that bursts from loose soil.',
  skeleton_warrior: 'Undead foot-soldier with a chipped blade.',
  chakoya_tribewarden: 'Ice tribe guardian with thick pelts.',
  lizard_swordmaster: 'Lizard fencer that presses with quick thrusts.',
  pirate_gunner: 'Buccaneer that peppers you from afar.',
  centipede: 'Many-legged crawler with an irritating bite.',
  larva: 'Juvenile insect that swarms in caves.',
  orc: 'Common greenskin raider from the orc warbands.',
  salamander: 'Fiery reptile that scampers when cornered.',
  lizard_executioner: 'Lizard headsman with a heavy cleaver.',
  goblin_assassin: 'Sneaky goblin that darts in and out of melee.',
  tiger: 'Jungle predator that lunges in a short charge.',
  troll_champion: 'Hardened troll bruiser that shrugs off weak blows.',
  white_tiger: 'Rare pale hunter with a fierce dash.',
  wild_horse: 'Stampeding herd animal; flees then tramples.',
  bear: 'Heavy mammal that stands its ground.',
  chakoya_toolshaper: 'Chakoya craftswoman with stone tools.',
  dworc_venomsniper: 'Dworc archer that coats arrows in poison.',
  dworc_voodomaster: 'Dworc curse-caster flinging death and earth.',
  lion: 'Savanna king that charges with claws extended.',
  panda: 'Deceptively stout bear that tanks hits.',
  swampling: 'Sap-dripping swamp creature weak to fire.',
  chakoya_windcaller: 'Chakoya mystic hurling frost and sparks.',
  dworc_fleshhunter: 'Dworc front-line fighter with crude blades.',
  honor_guard: 'Skeletal sentinel posted in ancient crypts.',
  infernoid_hound: 'Fire-spawned hound that rushes burning trails.',
  emerald_damselfly: 'Giant dragonfly that zips past spell lines.',
  dwarf: 'Stocky miner-soldier with axe and ale.',
  leaf_golem: 'Living shrub animated by druid magic.',
  poacher: 'Hunter loosing arrows from the treeline.',
  infernoid_soul: 'Wisp of flame that skitters between targets.',
  barbarian_headsplitter: 'Northman raider swinging a brutal axe.',
  crazed_beggar: 'Unstable vagrant that attacks without fear.',
  elf: 'Forest archer with keen eyes and quick shots.'
};

function attackFor(hp, behavior) {
  if (hp >= 95) return 1.06;
  if (hp >= 85) return 1.04;
  if (behavior === 'tank') return 1.03;
  return 1;
}

let blocks = '';
for (const row of ROWS) {
  const [id, legacyId, name, , family, bClass, diff, tier, behavior, dmg, weak, res, weight, behaviors] = row;
  const w = wiki[id] || {};
  const hp = w.hp || 70;
  let speed = w.speed || 70;
  if (speed > 130) speed = Math.min(120, Math.round(speed * 0.85));
  const atk = attackFor(hp, behavior);
  const desc = DESC[id];
  let extra = '';
  if (weak) extra += `, weaknesses: ${JSON.stringify(weak)}`;
  if (res) extra += `, resistances: ${JSON.stringify(res)}`;
  const behExtra = behaviors ? `, behaviors: ${JSON.stringify(behaviors)}` : '';
  blocks += `  { id: '${id}', legacyId: ${legacyId}, name: '${name}', description: '${desc.replace(/'/g, "\\'")}',\n`;
  blocks += `    nameKey: 'creature.${id}.name', descriptionKey: 'creature.${id}.description',\n`;
  blocks += `    family: '${family}', bestiaryClass: '${bClass}', difficulty: '${diff}', tags: ['melee', 'ground'],\n`;
  blocks += `    hp: ${hp}, speed: ${speed}, attack: ${atk}, damageTypes: ${JSON.stringify(dmg)}, defenseTypes: ${JSON.stringify(dmg[0] === 'physical' ? ['physical'] : [dmg[0]])}${extra},\n`;
  blocks += `    behavior: '${behavior}'${behExtra}, sprite: 'tibia', role: 'enemy', tier: ${tier}, spawnWeight: ${weight},\n`;
  blocks += `    bestiary: rosterBestiary('${id}') },\n`;
}

const rosterPath = path.join(__dirname, '..', 'js', 'data', 'creatures-roster-ext.js');
let src = fs.readFileSync(rosterPath, 'utf8');
if (src.includes("id: 'swamp_troll'")) {
  console.log('batch2 already present, skip roster append');
} else {
  src = src.replace(/\n];\s*$/, `,\n${blocks}];\n`);
  fs.writeFileSync(rosterPath, src);
  console.log('appended', ROWS.length, 'creatures to roster-ext');
}

const tipsPath = path.join(__dirname, '..', 'js', 'data', 'bestiary-tips.js');
let tips = fs.readFileSync(tipsPath, 'utf8');
for (const row of ROWS) {
  const id = row[0];
  const key = `'bestiary.${id}.tip1'`;
  if (tips.includes(key)) continue;
  const en = `Watch ${row[2]}: adjust for ${row[8]} behaviour and its damage types.`;
  const es = `Ante ${row[2]}: adapta al comportamiento ${row[8]} y a sus tipos de daño.`;
  const entry = `  ${key}: { es: '${es.replace(/'/g, "\\'")}', en: '${en}' },\n`;
  tips = tips.replace(/\n};\n\nG\.BestiaryTips/, `\n${entry}};\n\nG.BestiaryTips`);
}
fs.writeFileSync(tipsPath, tips);
console.log('tips updated');

const mapPath = path.join(__dirname, '..', 'js', 'data', 'tibia-sprite-map.js');
let map = fs.readFileSync(mapPath, 'utf8');
for (const row of ROWS) {
  const [, legacyId, name, lookType] = row;
  const line = `    ${legacyId}: { kind: 'lookType', lookType: ${lookType} }`;
  if (!map.includes(`${legacyId}:`)) {
    map = map.replace(/(\s+99044:[^\n]+\n)(\s+},\n\n\s+\/\*\* Claves)/, `$1${line},     // ${name}\n$2`);
  }
}
fs.writeFileSync(mapPath, map);
console.log('sprite map updated');