/* ============ missions.js — daily and weekly missions (TibiaSurvivor) ============
 * Measurable via G.Progress.event. Rewards: coins (and legacy tickets if applicable).
 */
G.MissionDefs = (() => {
  const dtypeName = t => (G.DamageTypes && G.DamageTypes.NAME[t]) || t;
  const min = d => Math.floor((d.time || 0) / 60);

  const daily = [
    { id: 'ts_kill', ev: 'kill', goals: [120, 200, 350], reward: { coins: 120 },
      text: n => `Defeat ${n} creatures` },
    { id: 'ts_kill_dtype', ev: 'kill', param: 'dtype', goals: [25, 40, 60], reward: { coins: 150 },
      match: (d, t) => (d.types || []).includes(t),
      text: (n, t) => `Defeat ${n} ${dtypeName(t)} damage creatures` },
    { id: 'ts_survive', ev: 'runEnd', mode: 'max', value: min, goals: [5, 8, 12], reward: { coins: 180 },
      text: n => `Last ${n} minutes in a hunt` },
    { id: 'ts_level', ev: 'runEnd', mode: 'max', value: d => d.level || 0, goals: [8, 12, 16], reward: { coins: 160 },
      text: n => `Reach level ${n} in a hunt` },
    { id: 'ts_boss', ev: 'kill', match: d => d.boss, goals: [1, 2], reward: { coins: 200 },
      text: n => (n === 1 ? 'Defeat a boss' : `Defeat ${n} bosses`) },
    { id: 'ts_chest', ev: 'chest', goals: [1, 2], reward: { coins: 140 },
      text: n => (n === 1 ? 'Open a locked chest' : `Open ${n} locked chests`) },
    { id: 'ts_coins', ev: 'runEnd', mode: 'max', value: d => d.coins || 0, goals: [80, 150, 250], reward: { coins: 120 },
      text: n => `Earn ${n} coins in your hunts` },
    { id: 'ts_hunt_dtype', ev: 'runEnd', param: 'dtype', mode: 'max', value: min,
      match: (d, t) => (d.types || []).includes(t), goals: [4], reward: { coins: 180 },
      text: (n, t) => `Hunt ${n} minutes with ${dtypeName(t)} damage` },
    { id: 'ts_item', ev: 'item', goals: [1], reward: { coins: 130 },
      text: () => 'Find a held item' },
    { id: 'ts_win', ev: 'runEnd', match: d => !!d.victory, goals: [1], reward: { coins: 220 },
      text: () => 'Complete a hunt (survive until the end)' }
  ];

  const weekly = [
    { id: 'ts_wkill', ev: 'kill', goals: [2500, 4000], reward: { coins: 600 },
      text: n => `Defeat ${n.toLocaleString('en-US')} creatures` },
    { id: 'ts_wboss', ev: 'kill', match: d => d.boss, goals: [3, 5], reward: { coins: 700 },
      text: n => `Defeat ${n} bosses` },
    { id: 'ts_wsurvive', ev: 'runEnd', mode: 'max', value: min, goals: [12, 15], reward: { coins: 750 },
      text: n => `Last ${n} minutes in a single hunt` },
    { id: 'ts_wlevel', ev: 'runEnd', mode: 'max', value: d => d.level || 0, goals: [18, 22], reward: { coins: 650 },
      text: n => `Reach level ${n} in a hunt` },
    { id: 'ts_wdaily', ev: 'missionDone', match: d => d.daily, goals: [6, 10], reward: { coins: 550 },
      text: n => `Complete ${n} daily missions` },
    { id: 'ts_wins', ev: 'runEnd', match: d => !!d.victory, goals: [2, 4], reward: { coins: 800 },
      text: n => `Complete ${n} hunts successfully` }
  ];

  const BY = {};
  for (const m of daily.concat(weekly)) BY[m.id] = m;

  return { daily, weekly, BY };
})();