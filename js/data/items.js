/* ============ items.js — held items (one per run) ============
 * Found in chests and from elites/boss. Only one at a time.
 */
G.Items = (() => {
  const LIST = [
    { id: 'starlightVial', name: 'Starlight Vial', desc: 'Regenerate 1.5% of your max HP per second.',
      on: p => { p.regenFlat += p.maxHp * 0.015; p._itemRegen = p.maxHp * 0.015; },
      off: p => { p.regenFlat -= p._itemRegen || 0; } },
    { id: 'skull', name: 'Skull', desc: '+40% damage, but you cannot switch spells.',
      on: p => { p.atkMul *= 1.4; }, off: p => { p.atkMul /= 1.4; } },
    { id: 'sunCatcher', name: 'Sun Catcher', desc: '-20% cooldown on all spells.',
      on: p => { p.cdMul *= 0.8; }, off: p => { p.cdMul /= 0.8; } },
    { id: 'moonMirror', name: 'Moon Mirror', desc: 'A killing blow leaves you at 1 HP instead (60 s cooldown).',
      on: () => {}, off: () => {} },
    { id: 'boneFiddle', name: 'Bone Fiddle', desc: 'You heal from the damage you deal.',
      on: () => {}, off: () => {} },
    { id: 'glowingMush', name: 'Glowing Mushroom', desc: '+50% gold coins at the end of the run.',
      on: p => { p.coinMul *= 1.5; }, off: p => { p.coinMul /= 1.5; } },
    { id: 'frozenStarlight', name: 'Frozen Starlight', desc: '+30% experience.',
      on: p => { p.xpMul *= 1.3; }, off: p => { p.xpMul /= 1.3; } },
    { id: 'magicalTorch', name: 'Magical Torch', desc: '+35% movement speed.',
      on: p => { p.spdMul *= 1.35; }, off: p => { p.spdMul /= 1.35; } },
    { id: 'blueSphere', name: 'Blue Sphere', desc: 'Melee attackers take damage when they hit you.',
      on: () => {}, off: () => {} },
    { id: 'cursedCoin', name: 'Cursed Coin', desc: '+20% damage reduction.',
      on: p => { p.dmgReduce += 0.2; }, off: p => { p.dmgReduce -= 0.2; } }
  ];
  const BY = {};
  for (const it of LIST) BY[it.id] = it;

  function roll(except) {
    const pool = LIST.filter(i => i.id !== except);
    return G.U.pick(pool).id;
  }

  return { LIST, BY, roll };
})();