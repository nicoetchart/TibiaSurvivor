const fs = require('fs');
const path = require('path');
const IDS = [
  'swamp_troll', 'lizard_henchman', 'goblin_scavenger', 'hyaena', 'lizard_magician', 'cobra', 'rotworm',
  'skeleton_warrior', 'chakoya_tribewarden', 'lizard_swordmaster', 'pirate_gunner', 'centipede', 'larva', 'orc',
  'salamander', 'lizard_executioner', 'goblin_assassin', 'tiger', 'troll_champion', 'white_tiger', 'wild_horse',
  'bear', 'chakoya_toolshaper', 'dworc_venomsniper', 'dworc_voodomaster', 'lion', 'panda', 'swampling',
  'chakoya_windcaller', 'dworc_fleshhunter', 'honor_guard', 'infernoid_hound', 'emerald_damselfly', 'dwarf',
  'leaf_golem', 'poacher', 'infernoid_soul', 'barbarian_headsplitter', 'crazed_beggar', 'elf'
];

const BEH = {
  swamp_troll: 'chase', lizard_henchman: 'chase', goblin_scavenger: 'chase', hyaena: 'charger',
  lizard_magician: 'ranged', cobra: 'chase', rotworm: 'chase', skeleton_warrior: 'chase',
  chakoya_tribewarden: 'tank', lizard_swordmaster: 'charger', pirate_gunner: 'ranged', centipede: 'chase',
  larva: 'chase', orc: 'chase', salamander: 'runner', lizard_executioner: 'chase', goblin_assassin: 'runner',
  tiger: 'charger', troll_champion: 'tank', white_tiger: 'charger', wild_horse: 'runner', bear: 'tank',
  chakoya_toolshaper: 'chase', dworc_venomsniper: 'ranged', dworc_voodomaster: 'ranged', lion: 'charger',
  panda: 'tank', swampling: 'chase', chakoya_windcaller: 'ranged', dworc_fleshhunter: 'chase',
  honor_guard: 'tank', infernoid_hound: 'charger', emerald_damselfly: 'runner', dwarf: 'chase',
  leaf_golem: 'tank', poacher: 'ranged', infernoid_soul: 'runner', barbarian_headsplitter: 'charger',
  crazed_beggar: 'chase', elf: 'ranged'
};

const NAME = {
  swamp_troll: 'Swamp Troll', lizard_henchman: 'Lizard Henchman', goblin_scavenger: 'Goblin Scavenger',
  hyaena: 'Hyaena', lizard_magician: 'Lizard Magician', cobra: 'Cobra', rotworm: 'Rotworm',
  skeleton_warrior: 'Skeleton Warrior', chakoya_tribewarden: 'Chakoya Tribewarden',
  lizard_swordmaster: 'Lizard Swordmaster', pirate_gunner: 'Pirate Gunner', centipede: 'Centipede',
  larva: 'Larva', orc: 'Orc', salamander: 'Salamander', lizard_executioner: 'Lizard Executioner',
  goblin_assassin: 'Goblin Assassin', tiger: 'Tiger', troll_champion: 'Troll Champion',
  white_tiger: 'White Tiger', wild_horse: 'Wild Horse', bear: 'Bear', chakoya_toolshaper: 'Chakoya Toolshaper',
  dworc_venomsniper: 'Dworc Venomsniper', dworc_voodomaster: 'Dworc Voodomaster', lion: 'Lion', panda: 'Panda',
  swampling: 'Swampling', chakoya_windcaller: 'Chakoya Windcaller', dworc_fleshhunter: 'Dworc Fleshhunter',
  honor_guard: 'Honor Guard', infernoid_hound: 'Infernoid Hound', emerald_damselfly: 'Emerald Damselfly',
  dwarf: 'Dwarf', leaf_golem: 'Leaf Golem', poacher: 'Poacher', infernoid_soul: 'Infernoid Soul',
  barbarian_headsplitter: 'Barbarian Headsplitter', crazed_beggar: 'Crazed Beggar', elf: 'Elf'
};

function tipEn(name, beh) {
  if (beh === 'ranged') return `Drop ${name} first — it shoots while melee swarms you.`;
  if (beh === 'charger') return `Sidestep ${name} charges; punish after the dash.`;
  if (beh === 'runner') return `Do not chase ${name} in a straight line.`;
  if (beh === 'tank') return `Kite ${name}; sustained damage beats bursting one target.`;
  return `Clear ${name} in early swarms before it clogs your escape route.`;
}

function tipEs(name, beh) {
  if (beh === 'ranged') return `Elimina a ${name} primero: dispara mientras el melee te rodea.`;
  if (beh === 'charger') return `Esquiva las cargas de ${name} y castiga después.`;
  if (beh === 'runner') return `No persigas a ${name} en línea recta.`;
  if (beh === 'tank') return `Kitea a ${name}; daño sostenido, no bursts.`;
  return `Limpia ${name} en oleadas tempranas antes de que corte tu huida.`;
}

const tipsPath = path.join(__dirname, '..', 'js', 'data', 'bestiary-tips.js');
let t = fs.readFileSync(tipsPath, 'utf8');
let add = '';
let n = 0;
for (const id of IDS) {
  const k = `bestiary.${id}.tip1`;
  if (t.includes(k)) continue;
  const beh = BEH[id];
  const name = NAME[id];
  add += `  '${k}': { es: '${tipEs(name, beh)}', en: '${tipEn(name, beh)}' },\n`;
  n++;
}
if (n) {
  const idx = t.lastIndexOf('\n};');
  if (idx < 0) throw new Error('BESTIARY_TIPS closing not found');
  t = t.slice(0, idx) + ',\n' + add.slice(0, -2) + t.slice(idx);
  fs.writeFileSync(tipsPath, t);
}
console.log('added', n, 'tips');