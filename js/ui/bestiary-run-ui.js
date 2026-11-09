/* ============ bestiary-run-ui.js — avisos en run y resumen (BST-6) ============ */
G.BestiaryRunUI = (() => {
  const MAX_QUEUE = 8;
  const SHOW_MS = 2400;
  const HIDE_MS = 180;

  const STAGE_LABEL = {
    stage_1: 'Etapa I',
    stage_2: 'Etapa II',
    completed: 'Dominio'
  };

  let el = null;
  let queue = [];
  let showing = false;
  let hideT = null;
  let nextT = null;
  let shownKeys = new Set();
  let framePending = [];
  let rafFlush = 0;
  let wired = false;

  function catalogName(creatureId) {
    const c = G.Bestiary && G.Bestiary.getCatalogEntry(creatureId);
    return (c && c.displayName) || creatureId;
  }

  function ensureEl() {
    if (el) return el;
    el = document.createElement('div');
    el.id = 'bestiary-run-toast';
    el.className = 'bestiary-run-toast';
    el.setAttribute('aria-live', 'polite');
    document.body.appendChild(el);
    return el;
  }

  function scheduleFrameFlush() {
    if (rafFlush) return;
    rafFlush = requestAnimationFrame(() => {
      rafFlush = 0;
      flushFramePending();
    });
  }

  function pushFrame(item) {
    if (!item || !item.key || shownKeys.has(item.key)) return;
    framePending.push(item);
    scheduleFrameFlush();
  }

  function compressFrameMessages(batch) {
    const out = [];
    let i = 0;
    while (i < batch.length) {
      const it = batch[i];
      if (it.type !== 'discovered') {
        out.push({ key: it.key, text: it.text });
        i++;
        continue;
      }
      const group = [it];
      while (i + 1 < batch.length && batch[i + 1].type === 'discovered') {
        i++;
        group.push(batch[i]);
      }
      if (group.length === 1) {
        out.push({
          key: group[0].key,
          text: 'Bestiario · ' + catalogName(group[0].creatureId) + ' descubierta'
        });
      } else {
        const names = group.slice(0, 2).map(g => catalogName(g.creatureId)).join(', ');
        const extra = group.length > 2 ? ' (+' + (group.length - 2) + ')' : '';
        out.push({
          key: 'disc-batch-' + group.map(g => g.creatureId).join(','),
          text: 'Bestiario · ' + group.length + ' criaturas: ' + names + extra
        });
      }
      i++;
    }
    return out;
  }

  function flushFramePending() {
    if (!framePending.length) return;
    const batch = framePending;
    framePending = [];
    const messages = compressFrameMessages(batch);
    for (const m of messages) enqueue(m.text, m.key);
  }

  function enqueue(text, key) {
    if (!text || !key || shownKeys.has(key)) return;
    shownKeys.add(key);
    if (queue.length >= MAX_QUEUE) queue.shift();
    queue.push({ text, key });
    pump();
  }

  function pump() {
    if (showing || !queue.length) return;
    showing = true;
    const { text } = queue.shift();
    const node = ensureEl();
    node.textContent = text;
    node.classList.add('on');
    clearTimeout(hideT);
    clearTimeout(nextT);
    hideT = setTimeout(() => {
      node.classList.remove('on');
      nextT = setTimeout(() => {
        showing = false;
        pump();
      }, HIDE_MS);
    }, SHOW_MS);
  }

  function onDiscovered(payload) {
    if (!payload || !payload.creatureId) return;
    pushFrame({
      type: 'discovered',
      creatureId: payload.creatureId,
      key: payload.creatureId + ':discovered'
    });
  }

  function onStage(payload) {
    if (!payload || !payload.creatureId || !payload.stage) return;
    if (payload.stage === 'completed') return;
    const label = STAGE_LABEL[payload.stage] || payload.stage;
    pushFrame({
      type: 'stage',
      creatureId: payload.creatureId,
      key: payload.creatureId + ':' + payload.stage,
      text: 'Bestiario · ' + catalogName(payload.creatureId) + ' — ' + label
    });
  }

  function onCompleted(payload) {
    if (!payload || !payload.creatureId) return;
    const pts = payload.points > 0 ? ' (+' + payload.points + ' pts)' : '';
    pushFrame({
      type: 'completed',
      creatureId: payload.creatureId,
      key: payload.creatureId + ':entry-completed',
      text: 'Bestiario · ' + catalogName(payload.creatureId) + ' completada' + pts
    });
  }

  function wire() {
    if (wired || !G.Bestiary || !G.Bestiary.on) return;
    wired = true;
    G.Bestiary.on('bestiary:creature-discovered', onDiscovered);
    G.Bestiary.on('bestiary:stage-completed', onStage);
    G.Bestiary.on('bestiary:entry-completed', onCompleted);
  }

  function clear() {
    queue = [];
    showing = false;
    framePending = [];
    shownKeys = new Set();
    clearTimeout(hideT);
    clearTimeout(nextT);
    hideT = nextT = null;
    if (rafFlush) {
      cancelAnimationFrame(rafFlush);
      rafFlush = 0;
    }
    if (el) {
      el.classList.remove('on');
      el.textContent = '';
    }
  }

  function onRunBegin() {
    clear();
  }

  /** Resumen para pantalla de fin (llamar antes de Bestiary.endRun). */
  function buildRunSummary(advances, pointsEarned) {
    if (!advances || !advances.length) return null;
    const byId = new Map();
    for (const a of advances) {
      let row = byId.get(a.creatureId);
      if (!row) {
        row = { creatureId: a.creatureId, name: catalogName(a.creatureId), kills: 0, stages: [], completed: false, points: 0 };
        byId.set(a.creatureId, row);
      }
      if (a.kind === 'discovered') row.discovered = true;
      if (a.kind === 'stage_1' || a.kind === 'stage_2') {
        if (!row.stages.includes(a.kind)) row.stages.push(a.kind);
      }
      if (a.kind === 'completed') row.completed = true;
      if (a.kind === 'points' && a.points > 0) row.points += a.points;
      row.kills = Math.max(row.kills, a.kills || 0);
    }
    const creatures = [...byId.values()].filter(r =>
      r.discovered || r.stages.length || r.completed || r.points > 0 || r.kills > 0);
    if (!creatures.length) return null;
    return {
      creatures,
      pointsEarned: Math.max(0, intNonNeg(pointsEarned))
    };
  }

  function intNonNeg(n) {
    const x = Number(n);
    return !Number.isFinite(x) || x < 0 ? 0 : Math.floor(x);
  }

  function snapshotForRunEnd() {
    if (!G.Bestiary || !G.Bestiary.getRunAdvances) return null;
    return buildRunSummary(G.Bestiary.getRunAdvances(), G.Bestiary.getRunPointsEarned());
  }

  function renderOverSummary(summary) {
    if (!summary || !summary.creatures || !summary.creatures.length) return '';
    const rows = summary.creatures.map(r => {
      const parts = [];
      if (r.discovered) parts.push('descubierta');
      for (const s of r.stages) parts.push(STAGE_LABEL[s] || s);
      if (r.completed) parts.push('completada');
      if (r.kills > 0) parts.push(r.kills + ' bajas');
      if (r.points > 0) parts.push('+' + r.points + ' pts');
      return `<div class="bestiary-over-row"><b>${r.name}</b><span>${parts.join(' · ') || '—'}</span></div>`;
    }).join('');
    const pts = summary.pointsEarned > 0
      ? `<div class="bestiary-over-pts">Puntos del bestiario: <b class="gold">+${summary.pointsEarned.toLocaleString('es')}</b></div>`
      : '';
    return `<div style="grid-column:1/-1" class="bestiary-over"><span>Bestiario</span>${rows}${pts}</div>`;
  }

  wire();
  return { onRunBegin, clear, snapshotForRunEnd, buildRunSummary, renderOverSummary, enqueue, pump };
})();
