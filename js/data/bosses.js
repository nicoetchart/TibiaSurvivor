/* ============ bosses.js — BossDefinition + kits (CYC-5) ============
 * Tabla de jefes MVP: black_knight (Bane), orshabaal (Nemesis).
 * Combate sigue en Enemy; aquí solo datos de kit, fases y encuentro.
 */
G.BossRegistry = (() => {
  const VERSION = 1;

  /** IDs de ataque compartidos con Enemy.bossStart */
  const ATTACK = {
    slam: { id: 'slam', kind: 'ground_zone', defaultType: 'physical' },
    dash: { id: 'dash', kind: 'charge', defaultType: 'physical' },
    leap: { id: 'leap', kind: 'delayed_strike', defaultType: 'physical' },
    rain: { id: 'rain', kind: 'ground_zone', defaultType: 'fire' },
    beam: { id: 'beam', kind: 'beam', defaultType: 'energy' },
    volley: { id: 'volley', kind: 'burst', defaultType: 'physical' },
    nova: { id: 'nova', kind: 'nova', defaultType: 'physical' }
  };

  const ORSHABAAL_ATTACKS = {
    slam: ATTACK.slam,
    dash: ATTACK.dash,
    leap: ATTACK.leap,
    rain: ATTACK.rain,
    beam: ATTACK.beam
  };

  function rand(a, b) {
    return G.U.rand(a, b);
  }

  function buildProceduralKit(enemy) {
    const T = enemy.types || [];
    const has = (...xs) => xs.some(x => T.includes(x));
    const melee = ['slam', G.U.hash(enemy.dex, 3, 7) < 0.5 ? 'dash' : 'leap'];
    const pref = has('fire', 'ground', 'poison', 'rock', 'grass') ? 'rain'
      : has('electric', 'psychic', 'dragon', 'ice', 'steel') ? 'beam'
        : has('fairy', 'ghost', 'water', 'flying') ? 'nova' : 'volley';
    const others = ['rain', 'beam', 'nova', 'volley'].filter(x => x !== pref);
    const ranged = [pref, others[Math.floor(G.U.hash(enemy.dex, 5, 9) * 3) % 3]];
    const far = enemy.hasBehavior && enemy.hasBehavior('ranged');
    return {
      melee,
      ranged,
      farLike: far ? 0.65 : 0.35,
      mode: far ? 'far' : 'close',
      modeT: rand(6, 8),
      cd: 1.6,
      cast: null,
      fury: false,
      side: Math.random() < 0.5 ? -1 : 1
    };
  }

  function buildOrshabaalKit() {
    return {
      melee: ['slam', 'dash', 'leap'],
      ranged: ['rain', 'beam'],
      attackTypes: { slam: 'physical', rain: 'fire', beam: 'energy' },
      farLike: 0.22,
      mode: 'close',
      modeT: rand(6, 8),
      cd: 1.45,
      cast: null,
      fury: false,
      side: Math.random() < 0.5 ? -1 : 1,
      fleeAt: 0.111,
      fleeing: false,
      selfHealCd: 1.5,
      summonCd: 8
    };
  }

  const DEFINITIONS = {
    black_knight: {
      id: 'black_knight',
      creatureId: 'black_knight',
      legacyId: 99017,
      bossCategory: 'bane',
      phases: [
        { id: 'main', untilHpPct: 0.5 },
        { id: 'enraged', fromHpPct: 0.5, flags: ['fury'] }
      ],
      kit: 'procedural',
      attacks: [ATTACK.slam, ATTACK.dash, ATTACK.leap, ATTACK.volley, ATTACK.nova],
      enrage: {
        nemesisBanner: false,
        lines: null
      },
      summon: null,
      flee: null,
      buildAi: buildProceduralKit
    },
    orshabaal: {
      id: 'orshabaal',
      creatureId: 'orshabaal',
      legacyId: 99016,
      bossCategory: 'nemesis',
      finalBoss: true,
      phases: [
        { id: 'main', untilHpPct: 0.5 },
        { id: 'enraged', fromHpPct: 0.5, flags: ['fury'] },
        { id: 'desperate', fromHpPct: 0.111, flags: ['flee', 'heal'] }
      ],
      kit: 'custom',
      attacks: Object.values(ORSHABAAL_ATTACKS),
      melee: ['slam', 'dash', 'leap'],
      ranged: ['rain', 'beam'],
      attackTypes: { slam: 'physical', rain: 'fire', beam: 'energy' },
      enrage: {
        nemesisBanner: true,
        lines: ['YOU ARE DOOMED!', 'SOULS FOR ORSHABAAL!', 'ORSHABAAL IS BACK!']
      },
      summon: {
        minionCreatureId: 'demon',
        minionLegacyFallback: 99018,
        maxActive: 4,
        perCast: 2,
        capBuffer: 12,
        intervalMin: 11,
        intervalMax: 15,
        initialCd: 8,
        hpMul: 0.22,
        spdMul: 0.95,
        dmgMul: 0.55,
        xpMul: 0.08
      },
      flee: {
        hpBelow: 0.111,
        selfHealInitial: 1.5,
        healIntervalMin: 2.8,
        healIntervalMax: 4.2,
        healPctMin: 0.06,
        healPctMax: 0.11
      },
      buildAi: buildOrshabaalKit
    }
  };

  function resolveBossId(def, legacyDex) {
    if (def && def.creatureId && DEFINITIONS[def.creatureId]) return def.creatureId;
    if (def && def.bossKitId && DEFINITIONS[def.bossKitId]) return def.bossKitId;
    if (legacyDex != null && G.CREATURE_BY_LEGACY && G.CREATURE_BY_LEGACY[legacyDex]) {
      const cid = G.CREATURE_BY_LEGACY[legacyDex].id;
      if (DEFINITIONS[cid]) return cid;
    }
    return null;
  }

  function getDefinition(bossId) {
    return bossId && DEFINITIONS[bossId] ? Object.assign({}, DEFINITIONS[bossId]) : null;
  }

  /** Kit de combate para UI/validación (sin estado runtime). */
  function getKit(bossId) {
    const d = getDefinition(bossId);
    if (!d) return null;
    return {
      id: d.id,
      creatureId: d.creatureId,
      phases: (d.phases || []).map(p => Object.assign({}, p)),
      melee: d.melee || null,
      ranged: d.ranged || null,
      attackTypes: d.attackTypes || null,
      kit: d.kit,
      attacks: (d.attacks || []).map(a => Object.assign({}, a)),
      summon: d.summon ? Object.assign({}, d.summon) : null,
      flee: d.flee ? Object.assign({}, d.flee) : null,
      enrage: d.enrage ? Object.assign({}, d.enrage) : null
    };
  }

  function initBossAi(enemy) {
    if (!enemy || !enemy.boss) return false;
    const id = resolveBossId(enemy.def, enemy.dex);
    if (!id) return false;
    const def = DEFINITIONS[id];
    if (!def || typeof def.buildAi !== 'function') return false;
    enemy._bossRegistryId = id;
    enemy.ai = def.buildAi(enemy);
    return true;
  }

  function isNemesisBoss(enemy) {
    const id = enemy._bossRegistryId || resolveBossId(enemy.def, enemy.dex);
    const d = id && DEFINITIONS[id];
    return !!(d && d.enrage && d.enrage.nemesisBanner);
  }

  function enrageMessage(enemy) {
    const id = enemy._bossRegistryId || resolveBossId(enemy.def, enemy.dex);
    const d = id && DEFINITIONS[id];
    if (d && d.enrage && d.enrage.lines && d.enrage.lines.length) {
      return G.U.pick(d.enrage.lines);
    }
    return (enemy.name || 'Boss') + ' is enraged!';
  }

  function summonSpec(enemy) {
    const id = enemy._bossRegistryId || resolveBossId(enemy.def, enemy.dex);
    const d = id && DEFINITIONS[id];
    return d && d.summon ? d.summon : null;
  }

  function attackTypeFor(bossId, attackId, enemyTypes) {
    const d = bossId && DEFINITIONS[bossId];
    if (d && d.attackTypes && d.attackTypes[attackId]) return d.attackTypes[attackId];
    if (attackId === 'rain' && enemyTypes && enemyTypes.includes('fire')) return 'fire';
    if (attackId === 'beam' && enemyTypes && enemyTypes.includes('energy')) return 'energy';
    return null;
  }

  function validate(issues) {
    if (!issues) issues = [];
    const seen = new Set();
    for (const [id, d] of Object.entries(DEFINITIONS)) {
      if (seen.has(id)) issues.push(`duplicate boss id ${id}`);
      seen.add(id);
      if (!d.creatureId) issues.push(`boss ${id}: missing creatureId`);
      else if (!G.CREATURE_BY_ID || !G.CREATURE_BY_ID[d.creatureId]) {
        issues.push(`boss ${id}: creature ${d.creatureId} not in CREATURE_BY_ID`);
      }
      if (d.legacyId != null && G.CREATURE_BY_ID && G.CREATURE_BY_ID[d.creatureId]) {
        const leg = G.CREATURE_BY_ID[d.creatureId].legacyId;
        if (leg !== d.legacyId) issues.push(`boss ${id}: legacyId mismatch (def ${d.legacyId} vs creature ${leg})`);
      }
      if (!d.buildAi) issues.push(`boss ${id}: missing buildAi`);
    }
    return { ok: issues.length === 0, issues };
  }

  if (typeof location !== 'undefined' && /[?&]dev\b/.test(location.search)) {
    const v = validate([]);
    if (!v.ok) console.error('[G.BossRegistry] validation failed:', v.issues);
  }

  return {
    VERSION,
    ATTACK,
    DEFINITIONS,
    resolveBossId,
    getDefinition,
    getKit,
    initBossAi,
    buildProceduralKit,
    isNemesisBoss,
    enrageMessage,
    summonSpec,
    attackTypeFor,
    validate
  };
})();