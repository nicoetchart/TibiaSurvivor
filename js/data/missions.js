/* ============ missions.js — misiones diarias y semanales (TibiaSurvivor) ============
 * Plantillas medibles por G.Progress.event. Recompensas: monedas (y tickets legacy si aplica).
 *
 *   ev      evento (ver systems/progress.js)
 *   match   (datos, param) -> ¿cuenta?
 *   value   datos -> progreso; mode 'max' conserva el mayor
 *   param   'dtype' sortea un tipo de daño (G.DamageTypes)
 */
G.MissionDefs = (() => {
  const dtypeName = t => (G.DamageTypes && G.DamageTypes.NAME[t]) || t;
  const min = d => Math.floor((d.time || 0) / 60);

  const daily = [
    { id: 'ts_kill', ev: 'kill', goals: [120, 200, 350], reward: { coins: 120 },
      text: n => `Derrota a ${n} criaturas` },
    { id: 'ts_kill_dtype', ev: 'kill', param: 'dtype', goals: [25, 40, 60], reward: { coins: 150 },
      match: (d, t) => (d.types || []).includes(t),
      text: (n, t) => `Derrota a ${n} criaturas de daño ${dtypeName(t)}` },
    { id: 'ts_survive', ev: 'runEnd', mode: 'max', value: min, goals: [5, 8, 12], reward: { coins: 180 },
      text: n => `Aguanta ${n} minutos en una expedición` },
    { id: 'ts_level', ev: 'runEnd', mode: 'max', value: d => d.level || 0, goals: [8, 12, 16], reward: { coins: 160 },
      text: n => `Alcanza el nivel ${n} en una expedición` },
    { id: 'ts_boss', ev: 'kill', match: d => d.boss, goals: [1, 2], reward: { coins: 200 },
      text: n => (n === 1 ? 'Derrota a un jefe' : `Derrota a ${n} jefes`) },
    { id: 'ts_chest', ev: 'chest', goals: [1, 2], reward: { coins: 140 },
      text: n => (n === 1 ? 'Abre un cofre con candado' : `Abre ${n} cofres con candado`) },
    { id: 'ts_coins', ev: 'runEnd', mode: 'max', value: d => d.coins || 0, goals: [80, 150, 250], reward: { coins: 120 },
      text: n => `Recoge ${n} monedas en tus expediciones` },
    { id: 'ts_hunt_dtype', ev: 'runEnd', param: 'dtype', mode: 'max', value: min,
      match: (d, t) => (d.types || []).includes(t), goals: [4], reward: { coins: 180 },
      text: (n, t) => `Aguanta ${n} minutos cazando con daño ${dtypeName(t)}` },
    { id: 'ts_item', ev: 'item', goals: [1], reward: { coins: 130 },
      text: () => 'Encuentra un objeto equipable' },
    { id: 'ts_win', ev: 'runEnd', match: d => !!d.victory, goals: [1], reward: { coins: 220 },
      text: () => 'Completa una expedición (sobrevive hasta el final)' }
  ];

  const weekly = [
    { id: 'ts_wkill', ev: 'kill', goals: [2500, 4000], reward: { coins: 600 },
      text: n => `Derrota a ${n.toLocaleString('es')} criaturas` },
    { id: 'ts_wboss', ev: 'kill', match: d => d.boss, goals: [3, 5], reward: { coins: 700 },
      text: n => `Derrota a ${n} jefes` },
    { id: 'ts_wsurvive', ev: 'runEnd', mode: 'max', value: min, goals: [12, 15], reward: { coins: 750 },
      text: n => `Aguanta ${n} minutos en una sola expedición` },
    { id: 'ts_wlevel', ev: 'runEnd', mode: 'max', value: d => d.level || 0, goals: [18, 22], reward: { coins: 650 },
      text: n => `Alcanza el nivel ${n} en una expedición` },
    { id: 'ts_wdaily', ev: 'missionDone', match: d => d.daily, goals: [6, 10], reward: { coins: 550 },
      text: n => `Completa ${n} misiones diarias` },
    { id: 'ts_wins', ev: 'runEnd', match: d => !!d.victory, goals: [2, 4], reward: { coins: 800 },
      text: n => `Completa ${n} expediciones con éxito` }
  ];

  const BY = {};
  for (const m of daily.concat(weekly)) BY[m.id] = m;

  return { daily, weekly, BY };
})();
