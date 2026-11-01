/* ============ achievements.js — logros permanentes TibiaSurvivor ============
 * Progreso vía value(save); se comprueban en systems/progress.js.
 */
G.AchDefs = (() => {
  const st = k => s => (s.stats && s.stats[k]) || 0;
  const count = k => s => Object.keys(s[k] || {}).length;
  const minBest = s => Math.floor(st('bestTime')(s) / 60);
  const minVictory = s => Math.floor((st('bestVictoryTime')(s) || 0) / 60);

  const CATS = [
    ['expedicion', 'Expedición'],
    ['supervivencia', 'Supervivencia'],
    ['combate', 'Combate'],
    ['caceria', 'Cacería'],
    ['meta', 'Metas']
  ];

  const LIST = [
    { id: 'ts_first_run', cat: 'expedicion', tier: 1, name: 'Primera incursión',
      desc: 'Juega tu primera expedición.', value: st('runs'), goal: 1, reward: { coins: 80 } },
    { id: 'ts_first_win', cat: 'expedicion', tier: 2, name: 'Regreso a salvo',
      desc: 'Completa una expedición (sobrevive hasta el límite).', value: st('wins'), goal: 1,
      reward: { coins: 150 }, title: 'Superviviente' },
    { id: 'ts_runs10', cat: 'expedicion', tier: 1, name: 'Habitual de la cueva',
      desc: 'Juega 10 expediciones.', value: st('runs'), goal: 10, reward: { coins: 120 } },
    { id: 'ts_runs50', cat: 'expedicion', tier: 2, name: 'Explorador curtido',
      desc: 'Juega 50 expediciones.', value: st('runs'), goal: 50, reward: { coins: 300 }, title: 'Explorador' },

    { id: 'ts_time5', cat: 'supervivencia', tier: 1, name: 'Calentando',
      desc: 'Aguanta 5 minutos en una expedición.', value: minBest, goal: 5, reward: { coins: 100 } },
    { id: 'ts_time10', cat: 'supervivencia', tier: 2, name: 'Aguanta el pulso',
      desc: 'Aguanta 10 minutos en una expedición.', value: minBest, goal: 10, reward: { coins: 180 } },
    { id: 'ts_time15', cat: 'supervivencia', tier: 3, name: 'Cazador tenaz',
      desc: 'Aguanta 15 minutos (límite del MVP).', value: minVictory, goal: 15,
      reward: { coins: 400 }, title: 'Tenaz' },
    { id: 'ts_lvl12', cat: 'supervivencia', tier: 1, name: 'Subiendo de rango',
      desc: 'Alcanza el nivel 12 en una expedición.', value: st('bestLevel'), goal: 12, reward: { coins: 120 } },
    { id: 'ts_lvl20', cat: 'supervivencia', tier: 3, name: 'Poder creciente',
      desc: 'Alcanza el nivel 20 en una expedición.', value: st('bestLevel'), goal: 20,
      reward: { coins: 350 }, title: 'Imparable' },

    { id: 'ts_kills500', cat: 'combate', tier: 1, name: 'Primer botín',
      desc: 'Derrota a 500 criaturas (total).', value: st('totalKills'), goal: 500, reward: { coins: 100 } },
    { id: 'ts_kills5k', cat: 'combate', tier: 2, name: 'Veterano de la cacería',
      desc: 'Derrota a 5.000 criaturas.', value: st('totalKills'), goal: 5000, reward: { coins: 250 }, title: 'Veterano' },
    { id: 'ts_kills25k', cat: 'combate', tier: 3, name: 'Leyenda subterránea',
      desc: 'Derrota a 25.000 criaturas.', value: st('totalKills'), goal: 25000, reward: { coins: 500 }, title: 'Leyenda' },
    { id: 'ts_boss1', cat: 'combate', tier: 1, name: 'Rompeguardias',
      desc: 'Derrota a un jefe.', value: st('bossesTotal'), goal: 1, reward: { coins: 120 } },
    { id: 'ts_boss10', cat: 'combate', tier: 2, name: 'Cazajefes',
      desc: 'Derrota a 10 jefes.', value: st('bossesTotal'), goal: 10, reward: { coins: 280 }, title: 'Cazajefes' },
    { id: 'ts_items3', cat: 'combate', tier: 1, name: 'Botín útil',
      desc: 'Encuentra 3 objetos distintos.', value: count('itemsFound'), goal: 3, reward: { coins: 100 } },

    { id: 'ts_coins1k', cat: 'caceria', tier: 1, name: 'Monedas en el morral',
      desc: 'Gana 1.000 monedas en total (expediciones).', value: st('coinsEarned'), goal: 1000, reward: { coins: 80 } },
    { id: 'ts_coins10k', cat: 'caceria', tier: 2, name: 'Ahorrador de la guild',
      desc: 'Gana 10.000 monedas en total.', value: st('coinsEarned'), goal: 10000, reward: { coins: 200 } },
    { id: 'ts_mis5', cat: 'meta', tier: 1, name: 'Contratos cumplidos',
      desc: 'Completa 5 misiones (recoge el premio).', value: st('missionsDone'), goal: 5, reward: { coins: 100 } },
    { id: 'ts_mis25', cat: 'meta', tier: 2, name: 'Mercenario fiable',
      desc: 'Completa 25 misiones.', value: st('missionsDone'), goal: 25, reward: { coins: 220 }, title: 'Fiable' }
  ];

  const BY = {};
  for (const a of LIST) BY[a.id] = a;

  return { CATS, LIST, BY };
})();
