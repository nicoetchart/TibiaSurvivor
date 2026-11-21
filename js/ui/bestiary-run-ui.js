/* ============ bestiary-run-ui.js — avisos en run y resumen (BST-6) ============ */
G.BestiaryRunUI = (() => {
  const MAX_QUEUE = 8;
  const SHOW_MS = 2400;
  const HIDE_MS = 180;

  function stageToastLabel(stage, creatureId) {
    const cat = G.Bestiary && G.Bestiary.getCatalogEntry(creatureId);
    const sec = (cat && cat.section) || 'bestiary';
  return G.Bestiary ? G.Bestiary.stageLabel(stage, sec) : stage;
  }

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
          text: 'Bestiary · ' + catalogName(group[0].creatureId) + ' tracked'
        });
      } else {
        const names = group.slice(0, 2).map(g => catalogName(g.creatureId)).join(', ');
        const extra = group.length > 2 ? ' (+' + (group.length - 2) + ')' : '';
        out.push({
          key: 'disc-batch-' + group.map(g => g.creatureId).join(','),
          text: 'Bestiary · ' + group.length + ' creatures: ' + names + extra
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

  function onEncountered(payload) {
    if (!payload || !payload.creatureId) return;
    pushFrame({
      type: 'encountered',
      creatureId: payload.creatureId,
      key: payload.creatureId + ':encountered',
      text: 'Bestiary · ' + catalogName(payload.creatureId) + ' sighted'
    });
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
    const label = stageToastLabel(payload.stage, payload.creatureId);
    pushFrame({
      type: 'stage',
      creatureId: payload.creatureId,
      key: payload.creatureId + ':' + payload.stage,
      text: 'Bestiary · ' + catalogName(payload.creatureId) + ' — ' + label
    });
  }

  function onCompleted(payload) {
    if (!payload || !payload.creatureId) return;
    const kind = payload.section === 'bosstiary' ? ' boss' : '';
    const pts = payload.points > 0 ? ' (+' + payload.points + kind + ' pts)' : '';
    pushFrame({
      type: 'completed',
      creatureId: payload.creatureId,
      key: payload.creatureId + ':entry-completed',
      text: 'Bestiary · ' + catalogName(payload.creatureId) + ' mastered' + pts
    });
  }

  function wire() {
    if (wired || !G.Bestiary || !G.Bestiary.on) return;
    wired = true;
    G.Bestiary.on('bestiary:creature-encountered', onEncountered);
    G.Bestiary.on('bestiary:creature-discovered', onDiscovered);
    G.Bestiary.on('bestiary:stage-completed', onStage);
    G.Bestiary.on('bestiary:entry-completed', onCompleted);
    G.Bestiary.on('bestiary:boss-first-victory', onBossFirstVictory);
  }

  function onBossFirstVictory(payload) {
    if (!payload || !payload.creatureId) return;
    pushFrame({
      type: 'first_victory',
      creatureId: payload.creatureId,
      key: payload.creatureId + ':first-victory',
      text: 'Bosstiary · ' + catalogName(payload.creatureId) + ' — first victory'
    });
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
        row = { creatureId: a.creatureId, name: catalogName(a.creatureId), kills: 0, killsThisRun: 0, stages: [], completed: false, points: 0, encountered: false };
        byId.set(a.creatureId, row);
      }
      if (a.kind === 'encountered') row.encountered = true;
      if (a.kind === 'discovered') row.discovered = true;
      if (a.kind === 'first_victory') row.firstVictory = true;
      if (a.kind === 'kill' && a.killsThisRun != null) row.killsThisRun = Math.max(row.killsThisRun, a.killsThisRun);
      if (a.kind === 'stage_1' || a.kind === 'stage_2') {
        if (!row.stages.includes(a.kind)) row.stages.push(a.kind);
      }
      if (a.kind === 'completed') row.completed = true;
      if (a.kind === 'points' && a.points > 0) row.points += a.points;
      row.kills = Math.max(row.kills, a.kills || 0);
      if (a.killsThisRun != null) row.killsThisRun = Math.max(row.killsThisRun, a.killsThisRun);
    }
    const creatures = [...byId.values()].filter(r =>
      r.encountered || r.discovered || r.firstVictory || r.stages.length || r.completed || r.points > 0 || r.kills > 0 || r.killsThisRun > 0);
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
      const cat = G.Bestiary && G.Bestiary.getCatalogEntry(r.creatureId);
      const sec = (cat && cat.section) || 'bestiary';
      if (r.firstVictory) parts.push('first victory');
      if (r.encountered && !r.discovered) parts.push(G.Bestiary.stageLabel('discovered', sec));
      if (r.discovered) parts.push('tracked');
      for (const s of r.stages) parts.push(G.Bestiary.stageLabel(s, sec));
      if (r.completed) parts.push(G.Bestiary.stageLabel('completed', sec));
      if (r.killsThisRun > 0) parts.push(r.killsThisRun + ' kills (run)');
      else if (r.kills > 0) parts.push(r.kills + ' kills');
      if (r.points > 0) parts.push('+' + r.points + ' pts');
      return `<div class="bestiary-over-row"><b>${r.name}</b><span>${parts.join(' · ') || '—'}</span></div>`;
    }).join('');
    const bossPts = G.Bestiary.getRunBossPointsEarned ? G.Bestiary.getRunBossPointsEarned() : 0;
    const charmPts = G.Bestiary.getRunPointsEarned ? G.Bestiary.getRunPointsEarned() : summary.pointsEarned;
    const ptLines = [];
    if (charmPts > 0) ptLines.push(`Charm points: <b class="gold">+${charmPts.toLocaleString('en-US')}</b>`);
    if (bossPts > 0) ptLines.push(`Boss points: <b class="gold">+${bossPts.toLocaleString('en-US')}</b>`);
    const pts = ptLines.length
      ? `<div class="bestiary-over-pts">${ptLines.join(' · ')}</div>`
      : '';
    return `<div style="grid-column:1/-1" class="bestiary-over"><span>Bestiary</span>${rows}${pts}</div>`;
  }

  wire();
  return { onRunBegin, clear, snapshotForRunEnd, buildRunSummary, renderOverSummary, enqueue, pump };
})();
