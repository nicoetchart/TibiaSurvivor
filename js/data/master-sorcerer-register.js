/* ============ master-sorcerer-register.js — registro MS en G.Abilities ============
 * MS-1: datos. MS-2: pool exclusivo vía abilities.poolFor + helpers de unlock.
 */
G.MasterSorcerer = (() => {
  const VOCATION_ID = 'master_sorcerer';
  const SPELL_COUNT = 10;
  const PASSIVE_COUNT = 9;
  const MAX_LEVEL = 5;
  /** Cooldown mínimo de hechizos MS (Avatar of Storm no puede bajar de aquí). */
  const MIN_SPELL_COOLDOWN = 0.35;
  const SHIELD_REGEN_DELAY = 3.5;
  const SHIELD_REGEN_RATE = 0.28;

  const SPELLS_BY_ID = {};
  const PASSIVES_BY_ID = {};
  let registered = false;

  function levelsToUps(levels) {
    if (!levels || levels.length !== MAX_LEVEL) return null;
    const ups = [];
    for (let i = 1; i < MAX_LEVEL; i++) {
      const row = levels[i];
      ups.push({ t: row.summary, m: row.mods ? Object.assign({}, row.mods) : {} });
    }
    return ups;
  }

  function finalizeEntry(raw, isPassive) {
    const entry = Object.assign({}, raw);
    entry.vocationId = entry.vocationId || VOCATION_ID;
    if (entry.element && !entry.type) entry.type = entry.element;
    const ups = levelsToUps(entry.levels);
    if (!ups) return null;
    entry.ups = ups;
    entry.maxLvl = MAX_LEVEL;
    entry.maxLevel = MAX_LEVEL;
    if (!isPassive && entry.cd != null && !Number.isFinite(entry.cd)) return null;
    if (!isPassive && entry.dmg != null && !Number.isFinite(entry.dmg)) return null;
    return entry;
  }

  function register() {
    if (registered) return true;
    if (!G.Abilities || !G.Abilities.ALL || !G.Abilities.BY_ID) {
      console.error('[MasterSorcerer] G.Abilities no está listo');
      return false;
    }
    const spells = G.MasterSorcererSpells || [];
    const passives = G.MasterSorcererPassives || [];

    for (const raw of spells) {
      if (G.Abilities.BY_ID[raw.id]) {
        console.warn('[MasterSorcerer] id duplicado, omitido:', raw.id);
        continue;
      }
      const entry = finalizeEntry(raw, false);
      if (!entry) {
        console.error('[MasterSorcerer] spell inválido:', raw.id);
        return false;
      }
      SPELLS_BY_ID[entry.id] = entry;
      G.Abilities.ALL.push(entry);
      G.Abilities.BY_ID[entry.id] = entry;
    }

    for (const raw of passives) {
      if (raw.kind !== 'passive') raw.kind = 'passive';
      if (G.Abilities.BY_ID[raw.id]) {
        console.warn('[MasterSorcerer] id duplicado, omitido:', raw.id);
        continue;
      }
      const entry = finalizeEntry(raw, true);
      if (!entry) {
        console.error('[MasterSorcerer] pasiva inválida:', raw.id);
        return false;
      }
      PASSIVES_BY_ID[entry.id] = entry;
      G.Abilities.ALL.push(entry);
      G.Abilities.BY_ID[entry.id] = entry;
    }

    registered = true;
    return validate(true);
  }

  function validate(silent) {
    const spellIds = Object.keys(SPELLS_BY_ID);
    const passiveIds = Object.keys(PASSIVES_BY_ID);
    const errors = [];

    if (spellIds.length !== SPELL_COUNT) errors.push('spells=' + spellIds.length + ' esperado ' + SPELL_COUNT);
    if (passiveIds.length !== PASSIVE_COUNT) errors.push('passives=' + passiveIds.length + ' esperado ' + PASSIVE_COUNT);

    const allIds = spellIds.concat(passiveIds);
    if (new Set(allIds).size !== allIds.length) errors.push('ids duplicados en registro MS');

    for (const id of spellIds) {
      const s = SPELLS_BY_ID[id];
      if (s.vocationId !== VOCATION_ID) errors.push(id + ': vocationId');
      if (s.maxLvl !== MAX_LEVEL || (s.ups && s.ups.length !== MAX_LEVEL - 1)) errors.push(id + ': niveles');
      if (s.kind === 'passive') errors.push(id + ': spell con kind passive');
      if (s.cd != null && (!Number.isFinite(s.cd) || s.cd <= 0)) errors.push(id + ': cd');
      if (s.dmg != null && !Number.isFinite(s.dmg)) errors.push(id + ': dmg NaN');
    }

    for (const id of passiveIds) {
      const p = PASSIVES_BY_ID[id];
      if (p.kind !== 'passive') errors.push(id + ': debe ser passive');
      if (p.maxLvl !== MAX_LEVEL) errors.push(id + ': maxLvl');
    }

    for (const id of allIds) {
      if (id.startsWith('ts-')) errors.push('colisión ts-*: ' + id);
    }

    if (errors.length) {
      if (!silent) console.error('[MasterSorcerer] validate FAIL:', errors.join('; '));
      return false;
    }
    return true;
  }

  /** IDs para pool exclusivo MS (MS-2). */
  function spellPoolIds() {
    return Object.keys(SPELLS_BY_ID);
  }

  function passivePoolIds() {
    return Object.keys(PASSIVES_BY_ID);
  }

  function unlockRowMatches(u, token) {
    return u === token || u.startsWith(token + ':') || u.startsWith(token + '_');
  }

  /** msUnlock en filas de nivel ya alcanzadas (nv. 3 Curse, nv. 5 cadena, etc.). */
  function hasUnlock(moveInst, token) {
    if (!moveInst || !moveInst.def || !moveInst.def.levels || moveInst.lvl < 1) return false;
    for (let i = 0; i < moveInst.lvl && i < moveInst.def.levels.length; i++) {
      const row = moveInst.def.levels[i];
      if (!row.msUnlock) continue;
      if (row.msUnlock.some(u => unlockRowMatches(u, token))) return true;
    }
    return false;
  }

  /** Parámetro numérico de msUnlock (p. ej. chain_on_hit:3 → 3; si hay varios, el mayor). */
  function unlockValue(moveInst, prefix) {
    if (!moveInst || !moveInst.def || !moveInst.def.levels) return null;
    let best = null;
    for (let i = 0; i < moveInst.lvl && i < moveInst.def.levels.length; i++) {
      const row = moveInst.def.levels[i];
      if (!row.msUnlock) continue;
      for (const u of row.msUnlock) {
        if (u.startsWith(prefix + ':')) {
          const v = parseFloat(u.slice(prefix.length + 1));
          if (Number.isFinite(v)) best = best == null ? v : Math.max(best, v);
        }
      }
    }
    return best;
  }

  /** Suma effectPerLevel × nivel de cada pasiva (una sola fuente de verdad). */
  function passiveTotals(pl) {
    const t = {
      fireDamageMul: 0, energyDamageMul: 0, deathDamageMul: 0,
      moveSpeedMul: 0, attackSpeedMul: 0, maxHealthMul: 0,
      regenFlat: 0, magicShieldMaxHpFrac: 0, elementalPenetration: 0
    };
    if (!pl || !pl.passiveInst) return t;
    for (const id in pl.passiveInst) {
      const inst = pl.passiveInst[id];
      const ep = inst.def && inst.def.effectPerLevel;
      if (!ep || !inst.lvl) continue;
      for (const k in ep) t[k] = (t[k] || 0) + ep[k] * inst.lvl;
    }
    return t;
  }

  function damageMulForType(pl, type) {
    if (!pl || !pl.msPassive) return 1;
    const t = pl.msPassive;
    if (type === 'fire') return 1 + (t.fireDamageMul || 0);
    if (type === 'energy') return 1 + (t.energyDamageMul || 0);
    if (type === 'death') return 1 + (t.deathDamageMul || 0);
    return 1;
  }

  function applyElementalPen(mult, pl) {
    const pen = pl && pl.msPassive && pl.msPassive.elementalPenetration;
    if (!pen || mult >= 1) return mult;
    return Math.min(1.35, mult + pen * (1 - mult));
  }

  function effectiveMoveSpeedMul(pl) {
    if (!pl || !pl.msPassive) return 1;
    return 1 + (pl.msPassive.moveSpeedMul || 0);
  }

  function effectiveCdMul(pl) {
    if (!pl) return 1;
    const asp = pl.msPassive && pl.msPassive.attackSpeedMul || 0;
    return pl.cdMul / (1 + asp);
  }

  function minCooldownFor(pl, baseCd) {
    const cd = baseCd * effectiveCdMul(pl);
    return Math.max(MIN_SPELL_COOLDOWN, cd);
  }

  /** Recalcula bonos de pasivas (sin duplicar al subir nivel). */
  function refreshPassives(pl) {
    if (!pl || !pl.passiveInst) return;
    pl.msPassive = passiveTotals(pl);
    if (pl.msBaseMaxHp == null) pl.msBaseMaxHp = pl.maxHp;

    const prevShieldMax = pl.magicShieldMax || 0;
    const newMaxHp = Math.round(pl.msBaseMaxHp * (1 + (pl.msPassive.maxHealthMul || 0)));
    if (newMaxHp !== pl.maxHp) {
      const ratio = pl.maxHp > 0 ? pl.hp / pl.maxHp : 1;
      pl.maxHp = newMaxHp;
      pl.hp = Math.min(pl.maxHp, Math.max(1, Math.round(ratio * pl.maxHp)));
    }

    pl.magicShieldMax = Math.round(pl.maxHp * (pl.msPassive.magicShieldMaxHpFrac || 0));
    if (pl.magicShieldMax > prevShieldMax) {
      pl.magicShield = Math.min(pl.magicShieldMax, (pl.magicShield || 0) + (pl.magicShieldMax - prevShieldMax));
    } else if (pl.magicShield > pl.magicShieldMax) {
      pl.magicShield = pl.magicShieldMax;
    }
  }

  function isPassiveDefensive(def) {
    return !!(def && def.tags && def.tags.indexOf('defensive') >= 0);
  }

  /** Cartas «new»: requisitos de nivel, hechizos previos y elemento. */
  function meetsLearnRequirements(pl, def) {
    if (!pl || !def) return false;
    const r = def.requirements || {};
    if ((r.minPlayerLevel || 1) > pl.level) return false;
    if (r.minOffensiveSpells) {
      const n = pl.moves.filter(m => {
        const t = m.def && m.def.tags;
        return t && t.indexOf('offensive') >= 0;
      }).length;
      if (n < r.minOffensiveSpells) return false;
    }
    if (r.requiresElement) {
      const el = r.requiresElement;
      const has = pl.moves.some(m => m.type === el || (m.def && m.def.element === el));
      if (!has) return false;
    }
    return true;
  }

  register();

  return {
    VOCATION_ID,
    SPELLS_BY_ID,
    PASSIVES_BY_ID,
    register,
    validate,
    spellPoolIds,
    passivePoolIds,
    hasUnlock,
    unlockValue,
    meetsLearnRequirements,
    MIN_SPELL_COOLDOWN,
    SHIELD_REGEN_DELAY,
    SHIELD_REGEN_RATE,
    passiveTotals,
    refreshPassives,
    damageMulForType,
    applyElementalPen,
    effectiveMoveSpeedMul,
    effectiveCdMul,
    minCooldownFor,
    isPassiveDefensive,
    get registered() { return registered; }
  };
})();
