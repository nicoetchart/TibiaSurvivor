/* ============ creature-dev-overrides.js — overrides de criatura (?dev) ============
 * Persistencia local; no entra en partidas publicadas sin ?dev.
 */
G.CreatureDevOverrides = (() => {
  const LS = 'ts.creatureDevOverrides';
  const SNAP_KEYS = [
    'hp', 'speed', 'attack', 'behavior', 'behaviors', 'difficulty', 'occurrence',
    'spawnWeight', 'tier', 'damageTypes', 'defenseTypes', 'weaknesses', 'resistances', 'immunities'
  ];

  const baseline = Object.create(null);
  let overrides = Object.create(null);
  let ready = false;

  function devOn() {
    return typeof location !== 'undefined' && /[?&]dev\b/.test(location.search);
  }

  function storageOk() {
    try {
      if (typeof localStorage === 'undefined' || !localStorage) return false;
      localStorage.getItem(LS);
      return true;
    } catch { return false; }
  }

  function snapCreature(c) {
    if (!c) return null;
    const o = { id: c.id };
    for (const k of SNAP_KEYS) {
      const v = c[k];
      if (v == null) continue;
      if (Array.isArray(v)) o[k] = v.slice();
      else o[k] = v;
    }
    return o;
  }

  function captureBaseline() {
    if (!G.CREATURES) return;
    for (const c of G.CREATURES) {
      if (!c || !c.id || baseline[c.id]) continue;
      baseline[c.id] = snapCreature(c);
    }
  }

  function load() {
    overrides = Object.create(null);
    if (!devOn() || !storageOk()) return;
    try {
      const j = JSON.parse(localStorage.getItem(LS) || 'null');
      if (j && typeof j === 'object') overrides = j;
    } catch { overrides = Object.create(null); }
  }

  function saveStore() {
    if (!devOn() || !storageOk()) return;
    try { localStorage.setItem(LS, JSON.stringify(overrides)); } catch { /* ignore */ }
  }

  function applyOne(id) {
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
    const patch = overrides[id];
    if (!c || !patch) return;
    for (const k of SNAP_KEYS) {
      if (patch[k] === undefined) continue;
      if (Array.isArray(patch[k])) c[k] = patch[k].slice();
      else c[k] = patch[k];
    }
    if (c.legacyId != null && G.CREATURE_BY_LEGACY) G.CREATURE_BY_LEGACY[c.legacyId] = c;
  }

  function applyAll() {
    if (!devOn()) return;
    captureBaseline();
    for (const id of Object.keys(overrides)) applyOne(id);
  }

  function init() {
    if (ready) return;
    ready = true;
    if (!devOn()) return;
    captureBaseline();
    load();
    applyAll();
  }

  function getBaseline(id) {
    return baseline[id] ? Object.assign({}, baseline[id]) : null;
  }

  function getOverride(id) {
    return overrides[id] ? Object.assign({}, overrides[id]) : null;
  }

  function setOverride(id, patch) {
    if (!devOn()) return null;
    captureBaseline();
    const prev = overrides[id] || {};
    const next = Object.assign({}, prev, patch || {});
    for (const k of SNAP_KEYS) {
      if (patch && patch[k] === undefined) delete next[k];
    }
    const base = baseline[id];
    let empty = true;
    if (base) {
      for (const k of SNAP_KEYS) {
        const bv = base[k];
        const nv = next[k];
        if (nv === undefined) continue;
        if (Array.isArray(bv) && Array.isArray(nv) && bv.length === nv.length && bv.every((x, i) => x === nv[i])) continue;
        if (bv === nv) continue;
        empty = false;
        break;
      }
    } else if (Object.keys(next).length) empty = false;

    if (empty) delete overrides[id];
    else overrides[id] = next;
    saveStore();
    if (base && G.CREATURE_BY_ID[id]) {
      const c = G.CREATURE_BY_ID[id];
      for (const k of SNAP_KEYS) {
        if (base[k] === undefined) delete c[k];
        else if (Array.isArray(base[k])) c[k] = base[k].slice();
        else c[k] = base[k];
      }
    }
    applyOne(id);
    return overrides[id] || null;
  }

  function resetCreature(id) {
    if (!devOn()) return;
    delete overrides[id];
    saveStore();
    const base = baseline[id];
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
    if (base && c) {
      for (const k of SNAP_KEYS) {
        if (base[k] === undefined) delete c[k];
        else if (Array.isArray(base[k])) c[k] = base[k].slice();
        else c[k] = base[k];
      }
      if (c.legacyId != null && G.CREATURE_BY_LEGACY) G.CREATURE_BY_LEGACY[c.legacyId] = c;
    }
  }

  function resetAll() {
    if (!devOn()) return;
    overrides = Object.create(null);
    saveStore();
    for (const id of Object.keys(baseline)) {
      const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
      const base = baseline[id];
      if (!c || !base) continue;
      for (const k of SNAP_KEYS) {
        if (base[k] === undefined) delete c[k];
        else if (Array.isArray(base[k])) c[k] = base[k].slice();
        else c[k] = base[k];
      }
    }
  }

  function exportOverrides() {
    return JSON.stringify(overrides, null, 2);
  }

  function exportCreatureSnippet(id) {
    const c = G.CREATURE_BY_ID && G.CREATURE_BY_ID[id];
    if (!c) return '';
    const lines = [`  // ${c.name} (${id})`];
    for (const k of SNAP_KEYS) {
      if (c[k] === undefined) continue;
      lines.push(`  ${k}: ${JSON.stringify(c[k])},`);
    }
    return lines.join('\n');
  }

  function listIds() {
    return Object.keys(overrides);
  }

  return {
    init,
    devOn,
    SNAP_KEYS,
    getBaseline,
    getOverride,
    setOverride,
    resetCreature,
    resetAll,
    exportOverrides,
    exportCreatureSnippet,
    listIds,
    snapCreature
  };
})();