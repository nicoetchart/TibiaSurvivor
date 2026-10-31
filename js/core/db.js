/* ============ db.js — guardado local (localStorage) ============
 * TODO el acceso a datos persistentes pasa por aquí. El resto del juego sólo
 * usa G.DB.*.
 *
 * TibiaSurvivor (prefijo ts.*):
 *   ts.accounts      { clave: { name, salt, hash, created } }
 *   ts.save.<clave>  partida de esa cuenta (product: tibiasurvivor)
 *   ts.session       última cuenta con sesión iniciada
 *
 * Los saves históricos ps.* no se cargan ni se borran.
 * El modo invitado juega con una partida en memoria que no se guarda.
 */
G.DB = (() => {
  const K_ACC = 'ts.accounts', K_SES = 'ts.session', K_SAVE = 'ts.save.';
  const PRODUCT = 'tibiasurvivor';
  const SCHEMA_VERSION = 1;
  const MAX_SCHEMA_VERSION = 1;
  const VERSION = 3;
  const START_COINS = 500;

  let mode = 'local';
  let localReason = 'offline';
  let user = null;
  let key = null;
  let guest = false;
  let save = null;
  let storageOk = true;
  let saveRecovered = false;

  let syncState = 'local';
  const listeners = new Set();
  const leaveHooks = [];

  function setSync(st) { syncState = st; listeners.forEach(fn => { try { fn(st); } catch (e) { /* nada */ } }); }
  function pushNow() { return Promise.resolve(); }

  // ---------------- almacenamiento local seguro ----------------

  function readRaw(k) {
    try {
      const raw = localStorage.getItem(k);
      if (raw == null || raw === '') return { ok: true, data: null, raw: null };
      return { ok: true, data: JSON.parse(raw), raw };
    } catch (e) {
      storageOk = false;
      let raw = null;
      try { raw = localStorage.getItem(k); } catch (e2) { /* nada */ }
      return { ok: false, raw };
    }
  }

  function read(k) {
    const r = readRaw(k);
    return r.ok ? r.data : null;
  }

  function quarantine(k, raw) {
    const bak = k + '.bak.' + Date.now();
    try {
      if (raw != null) localStorage.setItem(bak, raw);
      localStorage.removeItem(k);
    } catch (e) { /* nada */ }
  }

  function write(k, v) {
    const s = JSON.stringify(v);
    try { localStorage.setItem(k, s); return true; }
    catch (e) {
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const lk = localStorage.key(i);
          if (lk && (/^ps\.rk\.c\./.test(lk) || /^ts\.rk\.c\./.test(lk))) localStorage.removeItem(lk);
        }
        localStorage.setItem(k, s); return true;
      } catch (e2) { storageOk = false; return false; }
    }
  }
  function remove(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } }

  function acceptSave(s) {
    if (!s || typeof s !== 'object') return false;
    if (s.product != null && s.product !== PRODUCT) return false;
    if (typeof s.schemaVersion === 'number' && s.schemaVersion > MAX_SCHEMA_VERSION) return false;
    return true;
  }

  function readSave(k) {
    const slot = K_SAVE + k;
    const r = readRaw(slot);
    if (!r.ok) {
      quarantine(slot, r.raw);
      saveRecovered = true;
      return null;
    }
    if (!r.data) return null;
    if (!acceptSave(r.data)) {
      quarantine(slot, r.raw);
      saveRecovered = true;
      return null;
    }
    return r.data;
  }

  // ---------------- partida ----------------

  function newSave(name) {
    return {
      product: PRODUCT,
      schemaVersion: SCHEMA_VERSION,
      v: VERSION,
      name,
      created: Date.now(),
      updated: Date.now(),
      coins: START_COINS,
      owned: {},
      shiny: {},
      partner: null,
      partnerShiny: false,
      starter: null,
      personality: null,
      upgrades: {},
      pupg: {},
      tickets: { t1: 0, t10: 0 },
      pity: {},
      legends: {},
      arenas: {},
      itemsFound: {},
      evoMoves: {},
      ach: {},
      missions: {},
      profile: { favs: [], title: '' },
      stats: { runs: 0, bestTime: 0, bestLevel: 0, totalKills: 0, pulls: 0, coinsEarned: 0, shinies: 0,
               bossesTotal: 0, riftWins: 0, evolutions: 0, missionsDone: 0, groupRuns: 0, bestGroupTime: 0 }
    };
  }

  function migrate(s, name) {
    const base = newSave(name || s.name);
    for (const k in base) if (s[k] == null) s[k] = base[k];
    for (const k in base.stats) if (s.stats[k] == null) s.stats[k] = base.stats[k];
    if (typeof s.pity === 'number') s.pity = { 1: s.pity };
    if (!s.pupgDone) {
      if (s.partner && Object.values(s.upgrades || {}).some(v => v > 0)) {
        s.pupg[s.partner] = Object.assign({}, s.upgrades);
      }
      s.pupgDone = true;
    }
    s.tickets = Object.assign({ t1: 0, t10: 0 }, s.tickets);
    s.product = PRODUCT;
    s.schemaVersion = SCHEMA_VERSION;
    sanitize(s);
    s.v = VERSION;
    return s;
  }

  function sanitize(s) {
    const n = v => (Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : 0);
    s.coins = n(s.coins);
    s.tickets = s.tickets || { t1: 0, t10: 0 };
    s.tickets.t1 = n(s.tickets.t1);
    s.tickets.t10 = n(s.tickets.t10);
    const knownId = d => (G.DEX_BY && G.DEX_BY[d]) || (G.Content && G.Content.getCreature && G.Content.getCreature(d));
    if (G.DEX_BY || G.Content) for (const coll of ['owned', 'shiny']) {
      for (const d of Object.keys(s[coll] || {})) if (!knownId(d)) delete s[coll][d];
    }
    if (s.partner != null && (G.DEX_BY || G.Content)) {
      const dex = s.partner;
      if (!knownId(dex) || !(s.owned && s.owned[dex])) {
        s.partner = null;
        s.partnerShiny = false;
      }
    }
    if (s.pbind && typeof s.pbind === 'object') {
      for (const d of Object.keys(s.pbind)) {
        const l = Array.isArray(s.pbind[d]) ? s.pbind[d].slice(0, 4) : [];
        const seen = new Set();
        s.pbind[d] = [0, 1, 2, 3].map(i => {
          const id = l[i];
          if (typeof id !== 'string' || (G.Moves && !G.Moves.BY_ID[id]) || seen.has(id)) return null;
          seen.add(id); return id;
        });
      }
    } else s.pbind = {};
    if (s.pban && typeof s.pban === 'object') {
      for (const d of Object.keys(s.pban)) {
        const l = Array.isArray(s.pban[d]) ? s.pban[d] : [];
        s.pban[d] = [...new Set(l.filter(id => typeof id === 'string' && (!G.Moves || G.Moves.BY_ID[id])))].slice(0, 3);
      }
    } else s.pban = {};
    if (G.Upgrades) for (const d of Object.keys(s.pupg || {})) {
      const u = s.pupg[d];
      if (!u || typeof u !== 'object') { delete s.pupg[d]; continue; }
      for (const id of Object.keys(u)) {
        if (!G.Upgrades.BY[id]) delete u[id];
        else u[id] = Math.min(G.Upgrades.BY[id].max, n(u[id]));
      }
    }
  }

  const VALID = /^[A-Za-z0-9_ñÑáéíóúÁÉÍÓÚ]{3,16}$/;

  async function hash(pass, salt) {
    const text = salt + ':' + pass;
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < text.length; i++) {
      const c = text.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677);
    }
    return 'f' + (h1 >>> 0).toString(16) + (h2 >>> 0).toString(16);
  }

  function randomSalt() {
    const a = new Uint8Array(12);
    if (window.crypto && crypto.getRandomValues) crypto.getRandomValues(a);
    else for (let i = 0; i < a.length; i++) a[i] = Math.random() * 256;
    return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function loadLocal(k, name) {
    const s = readSave(k);
    return s ? migrate(s, name) : newSave(name);
  }

  function beginLocal(k, name) {
    key = k; user = name; guest = false;
    save = loadLocal(k, name);
    write(K_SES, k);
  }

  async function registerLocal(name, pass) {
    const accs = read(K_ACC) || {};
    const k = name.toLowerCase();
    if (accs[k]) return { ok: false, error: 'Ese nombre ya existe.' };
    const salt = randomSalt();
    accs[k] = { name, salt, hash: await hash(pass, salt), created: Date.now() };
    if (!write(K_ACC, accs)) return { ok: false, error: 'El navegador no deja guardar datos (¿modo incógnito?).' };
    beginLocal(k, name);
    write(K_SAVE + k, save);
    return { ok: true, isNew: true };
  }

  async function loginLocal(name, pass) {
    const accs = read(K_ACC) || {};
    const acc = accs[name.toLowerCase()];
    if (!acc || acc.hash !== await hash(pass || '', acc.salt)) {
      return { ok: false, error: 'Usuario o contraseña incorrectos.' };
    }
    beginLocal(name.toLowerCase(), acc.name);
    return { ok: true, isNew: !save.partner };
  }

  function restoreLocal() {
    const k = read(K_SES);
    if (!k || typeof k !== 'string') {
      if (k != null) remove(K_SES);
      return false;
    }
    const accs = read(K_ACC) || {};
    if (!accs[k]) { remove(K_SES); return false; }
    beginLocal(k, accs[k].name);
    return true;
  }

  let readyP = null;

  function ready() {
    if (readyP) return readyP;
    readyP = Promise.resolve().then(() => { setSync('local'); return restoreLocal(); });
    return readyP;
  }

  async function register(name, pass) {
    name = (name || '').trim();
    if (!VALID.test(name)) return { ok: false, error: 'El nombre debe tener 3-16 letras, números o _.' };
    if ((pass || '').length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
    return registerLocal(name, pass);
  }

  async function login(name, pass) {
    name = (name || '').trim();
    return loginLocal(name, pass);
  }

  async function loginWithGoogle() {
    return { ok: false, error: 'No disponible en modo offline.' };
  }

  async function linkGoogle() {
    return { ok: false, error: 'No disponible en modo offline.' };
  }

  function setName(n) {
    if (!save || guest) return;
    save.name = n; user = n;
    commit();
  }

  function playAsGuest() {
    user = 'Invitado'; key = null; guest = true;
    save = newSave('Invitado');
    remove(K_SES);
    return { ok: true, isNew: true };
  }

  function commit(urgent = false) {
    if (guest || !key || !save) return false;
    save.updated = Date.now();
    save.product = PRODUCT;
    save.schemaVersion = SCHEMA_VERSION;
    return write(K_SAVE + key, save);
  }

  async function logout() {
    for (const fn of leaveHooks) { try { await fn('logout'); } catch (e) { /* nada */ } }
    if (!guest) commit();
    remove(K_SES);
    user = key = save = null; guest = false;
    setSync('local');
  }

  async function deleteAccount(pass) {
    if (guest || !key) return { ok: false, error: 'No hay cuenta que borrar.' };
    const accs = read(K_ACC) || {};
    delete accs[key];
    write(K_ACC, accs);
    remove(K_SAVE + key); remove(K_SES);
    user = key = save = null;
    return { ok: true };
  }

  function owns(dex) { return !!(save && save.owned[dex]); }

  function grant(dex, from) {
    if (!save.owned[dex]) save.owned[dex] = { at: Date.now(), from };
  }

  function ownsShiny(dex) { return !!(save && save.shiny && save.shiny[dex]); }

  function upgradesOf(dex) {
    if (!save) return {};
    save.pupg = save.pupg || {};
    return save.pupg[dex] || (save.pupg[dex] = {});
  }

  function grantShiny(dex, from) {
    grant(dex, from);
    if (save.shiny[dex]) return false;
    save.shiny[dex] = { at: Date.now(), from };
    return true;
  }

  function consumeRecoveredFlag() {
    const v = saveRecovered;
    saveRecovered = false;
    return v;
  }

  return {
    ready, register, login, loginWithGoogle, playAsGuest, logout, commit, deleteAccount, flush: pushNow,
    owns, grant, ownsShiny, grantShiny, setName, upgradesOf, consumeRecoveredFlag,
    onSync(fn) { listeners.add(fn); },
    onLeave(fn) { leaveHooks.push(fn); },
    get fb() { return null; },
    get online() { return false; },
    get nameAccount() { return false; },
    get hasGoogle() { return false; }, linkGoogle,
    get mode() { return mode; },
    get localReason() { return localReason; },
    get syncState() { return syncState; },
    get user() { return user; },
    get guest() { return guest; },
    get save() { return save; },
    get loggedIn() { return !!save; },
    get storageOk() { return storageOk; },
    get PRODUCT() { return PRODUCT; },
    get SCHEMA_VERSION() { return SCHEMA_VERSION; },
    START_COINS
  };
})();
