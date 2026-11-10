/* ============ tibia-outfits.js — catálogo de aspectos jugador ============ */
G.TibiaOutfits = (() => {
  /**
   * Catálogo visible (como la lista del cliente). `unlock`: free | mission | shop
   * @type {Record<number, object>}
   */
  const CATALOG = {
    128: {
      type: 128,
      name: 'Citizen',
      nameEs: 'Citizen',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'free',
      preview: { head: 78, body: 69, legs: 58, feet: 76, addons: 0 }
    },
    129: {
      type: 129,
      name: 'Hunter',
      nameEs: 'Hunter',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'mission',
      unlockHintEs: 'Desbloqueo: misiones de cacería (próximamente).',
      unlockHintEn: 'Unlock: hunting missions (coming soon).',
      preview: { head: 78, body: 69, legs: 58, feet: 76, addons: 0 }
    },
    132: {
      type: 132,
      name: 'Mage',
      nameEs: 'Mage',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'free',
      preview: { head: 0, body: 94, legs: 94, feet: 94, addons: 0 }
    },
    133: {
      type: 133,
      name: 'Knight',
      nameEs: 'Knight',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'mission',
      unlockHintEs: 'Desbloqueo: derrota al jefe de la cueva (próximamente).',
      unlockHintEn: 'Unlock: cave boss kill (coming soon).',
      preview: { head: 76, body: 76, legs: 76, feet: 76, addons: 0 }
    },
    137: {
      type: 137,
      name: 'Noblewoman',
      nameEs: 'Noblewoman',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'shop',
      unlockHintEs: 'Desbloqueo: tienda premium (próximamente).',
      unlockHintEn: 'Unlock: premium shop (coming soon).',
      preview: { head: 0, body: 88, legs: 88, feet: 88, addons: 0 }
    },
    134: {
      type: 134,
      name: 'Summoner',
      nameEs: 'Summoner',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'mission',
      unlockHintEs: 'Desbloqueo: misión de vocación (próximamente).',
      unlockHintEn: 'Unlock: vocation quest (coming soon).',
      preview: { head: 0, body: 94, legs: 94, feet: 94, addons: 0 }
    },
    136: {
      type: 136,
      name: 'Warrior',
      nameEs: 'Warrior',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'mission',
      unlockHintEs: 'Desbloqueo: misiones (próximamente).',
      unlockHintEn: 'Unlock: missions (coming soon).',
      preview: { head: 94, body: 94, legs: 94, feet: 94, addons: 0 }
    },
    143: {
      type: 143,
      name: 'Barbarian',
      nameEs: 'Barbarian',
      patternHeight: 3,
      addonBits: 3,
      unlock: 'mission',
      unlockHintEs: 'Desbloqueo: misiones (próximamente).',
      unlockHintEn: 'Unlock: missions (coming soon).',
      preview: { head: 106, body: 106, legs: 106, feet: 106, addons: 0 }
    }
  };

  /** Orden en la rejilla derecha (lookType). */
  const SHOWCASE_ORDER = [128, 129, 132, 133, 137, 134, 136, 143];

  const DEFAULT_UNLOCKED = [128, 132];

  const DEFAULT = { type: 132, head: 0, body: 94, legs: 94, feet: 94, addons: 0 };

  /** Presets de color (vacío hasta sistema de guardado de combinaciones). */
  const PRESETS = [];

  function meta(type) {
    return CATALOG[type] || null;
  }

  function hasAssets(type) {
    const key = 'out_' + (type | 0);
    const m = G.TIBIA_CREATURES_META && G.TIBIA_CREATURES_META[key];
    return !!(m && m.composite);
  }

  function unlockedList(save) {
    const s = save || (G.DB && G.DB.save);
    if (!s) return DEFAULT_UNLOCKED.slice();
    const u = Array.isArray(s.unlockedOutfits) ? s.unlockedOutfits.map(Number) : [];
    const set = new Set(DEFAULT_UNLOCKED.concat(u));
    return SHOWCASE_ORDER.filter(t => set.has(t));
  }

  function isUnlocked(type, save) {
    return unlockedList(save).includes(type | 0);
  }

  function unlockHint(type) {
    const cat = meta(type);
    if (!cat) return '';
    const en = G.I18n && G.I18n.lang === 'en';
    return en ? (cat.unlockHintEn || '') : (cat.unlockHintEs || 'Bloqueado.');
  }

  function grant(type, save) {
    const s = save || (G.DB && G.DB.save);
    if (!s || !meta(type)) return false;
    s.unlockedOutfits = s.unlockedOutfits || DEFAULT_UNLOCKED.slice();
    if (!s.unlockedOutfits.includes(type | 0)) {
      s.unlockedOutfits.push(type | 0);
      return true;
    }
    return false;
  }

  function previewLook(type) {
    const cat = meta(type);
    if (!cat || !cat.preview) return Object.assign({ type: type | 0, addons: 0 }, DEFAULT);
    return Object.assign({ type: type | 0 }, cat.preview);
  }

  /** Rejilla: tipo de la fila + colores/addons actuales del jugador. */
  function showcaseLook(type, save) {
    const cur = fromSave(save);
    return {
      type: type | 0,
      head: cur.head,
      body: cur.body,
      legs: cur.legs,
      feet: cur.feet,
      addons: cur.addons
    };
  }

  function normalize(o) {
    const base = Object.assign({}, DEFAULT, o || {});
    let type = base.type | 0;
    if (!meta(type)) type = DEFAULT.type;
    if (!isUnlocked(type)) type = unlockedList()[0] || DEFAULT.type;
    base.type = type;
    base.head = G.U.clamp(base.head | 0, 0, 132);
    base.body = G.U.clamp(base.body | 0, 0, 132);
    base.legs = G.U.clamp(base.legs | 0, 0, 132);
    base.feet = G.U.clamp(base.feet | 0, 0, 132);
    const cat = meta(type);
    const maxAddon = cat ? (cat.addonBits | 0) : 3;
    let addons = base.addons | 0;
    if (addons < 0) addons = 0;
    if (addons > maxAddon) addons = maxAddon;
    base.addons = addons;
    return base;
  }

  function patternRows(addons, type) {
    const a = addons | 0;
    const cat = meta(type);
    const ph = cat ? (cat.patternHeight || 3) : 3;
    const rows = [0];
    if (a & 1 && ph > 1) rows.push(1);
    if (a & 2 && ph > 2) rows.push(2);
    if (a & 4 && ph > 3) rows.push(3);
    return rows;
  }

  function fromSave() {
    if (!G.DB || !G.DB.save) return normalize(DEFAULT);
    const s = G.DB.save.playerOutfit;
    return normalize(s || DEFAULT);
  }

  function applyToSave(patch) {
    if (!G.DB || !G.DB.save) return null;
    const next = Object.assign({}, fromSave(), patch);
    if (next.type != null && !isUnlocked(next.type)) delete next.type;
    G.DB.save.playerOutfit = normalize(next);
    return G.DB.save.playerOutfit;
  }

  function rosterFiltered(opts = {}) {
    const onlyMine = !!opts.onlyMine;
    const q = (opts.q || '').trim().toLowerCase();
    return SHOWCASE_ORDER.map(type => {
      const cat = meta(type);
      if (!cat) return null;
      const row = {
        type,
        name: cat.nameEs || cat.name,
        unlock: cat.unlock,
        unlocked: isUnlocked(type),
        assets: hasAssets(type)
      };
      if (onlyMine && !row.unlocked) return null;
      if (q && !row.name.toLowerCase().includes(q)) return null;
      return row;
    }).filter(Boolean);
  }

  function presetsForType(type) {
    return PRESETS.filter(p => !p.types || p.types.includes(type | 0));
  }

  /** @deprecated usar grid; mantiene compat */
  function catalogList() {
    return unlockedList().map(t => CATALOG[t]).filter(Boolean);
  }

  function stepType(current, dir) {
    const list = unlockedList();
    if (!list.length) return current;
    const i = list.indexOf(current | 0);
    const at = i >= 0 ? i : 0;
    const next = (at + dir + list.length) % list.length;
    return list[next];
  }

  function initSave(save) {
    if (!save.unlockedOutfits) save.unlockedOutfits = DEFAULT_UNLOCKED.slice();
    save.unlockedOutfits = save.unlockedOutfits.filter(t => meta(t));
    for (const t of DEFAULT_UNLOCKED) if (!save.unlockedOutfits.includes(t)) save.unlockedOutfits.push(t);
  }

  return {
    DEFAULT,
    PRESETS,
    CATALOG,
    SHOWCASE_ORDER,
    DEFAULT_UNLOCKED,
    rosterFiltered,
    catalogList,
    presetsForType,
    stepType,
    meta,
    hasAssets,
    isUnlocked,
    unlockedList,
    unlockHint,
    grant,
    previewLook,
    showcaseLook,
    initSave,
    normalize,
    patternRows,
    fromSave,
    applyToSave,
    defaultLook: () => normalize(DEFAULT)
  };
})();
