/* ============ achievements.js — permanent achievements TibiaSurvivor ============
 * Progress via value(save); checked in systems/progress.js.
 */
G.AchDefs = (() => {
  const st = k => s => (s.stats && s.stats[k]) || 0;
  const count = k => s => Object.keys(s[k] || {}).length;
  const minBest = s => Math.floor(st('bestTime')(s) / 60);
  const minVictory = s => Math.floor((st('bestVictoryTime')(s) || 0) / 60);

  const CATS = [
    ['expedicion', 'Expedition'],
    ['supervivencia', 'Survival'],
    ['combate', 'Combat'],
    ['caceria', 'Hunting'],
    ['meta', 'Goals']
  ];

  const LIST = [
    { id: 'ts_first_run', cat: 'expedicion', tier: 1, name: 'First incursion',
      desc: 'Play your first hunt.', value: st('runs'), goal: 1, reward: { coins: 80 } },
    { id: 'ts_first_win', cat: 'expedicion', tier: 2, name: 'Back in one piece',
      desc: 'Complete a hunt (survive until the time limit).', value: st('wins'), goal: 1,
      reward: { coins: 150 }, title: 'Survivor' },
    { id: 'ts_runs10', cat: 'expedicion', tier: 1, name: 'Cave regular',
      desc: 'Play 10 hunts.', value: st('runs'), goal: 10, reward: { coins: 120 } },
    { id: 'ts_runs50', cat: 'expedicion', tier: 2, name: 'Seasoned explorer',
      desc: 'Play 50 hunts.', value: st('runs'), goal: 50, reward: { coins: 300 }, title: 'Explorer' },

    { id: 'ts_time5', cat: 'supervivencia', tier: 1, name: 'Warming up',
      desc: 'Last 5 minutes in a hunt.', value: minBest, goal: 5, reward: { coins: 100 } },
    { id: 'ts_time10', cat: 'supervivencia', tier: 2, name: 'Hold the line',
      desc: 'Last 10 minutes in a hunt.', value: minBest, goal: 10, reward: { coins: 180 } },
    { id: 'ts_time15', cat: 'supervivencia', tier: 3, name: 'Tenacious hunter',
      desc: 'Last 15 minutes (MVP limit).', value: minVictory, goal: 15,
      reward: { coins: 400 }, title: 'Tenacious' },
    { id: 'ts_lvl12', cat: 'supervivencia', tier: 1, name: 'Rising rank',
      desc: 'Reach level 12 in a hunt.', value: st('bestLevel'), goal: 12, reward: { coins: 120 } },
    { id: 'ts_lvl20', cat: 'supervivencia', tier: 3, name: 'Growing power',
      desc: 'Reach level 20 in a hunt.', value: st('bestLevel'), goal: 20,
      reward: { coins: 350 }, title: 'Unstoppable' },

    { id: 'ts_kills500', cat: 'combate', tier: 1, name: 'First spoils',
      desc: 'Defeat 500 creatures (total).', value: st('totalKills'), goal: 500, reward: { coins: 100 } },
    { id: 'ts_kills5k', cat: 'combate', tier: 2, name: 'Hunt veteran',
      desc: 'Defeat 5,000 creatures.', value: st('totalKills'), goal: 5000, reward: { coins: 250 }, title: 'Veteran' },
    { id: 'ts_kills25k', cat: 'combate', tier: 3, name: 'Underground legend',
      desc: 'Defeat 25,000 creatures.', value: st('totalKills'), goal: 25000, reward: { coins: 500 }, title: 'Legend' },
    { id: 'ts_boss1', cat: 'combate', tier: 1, name: 'Guard breaker',
      desc: 'Defeat a boss.', value: st('bossesTotal'), goal: 1, reward: { coins: 120 } },
    { id: 'ts_boss10', cat: 'combate', tier: 2, name: 'Boss slayer',
      desc: 'Defeat 10 bosses.', value: st('bossesTotal'), goal: 10, reward: { coins: 280 }, title: 'Boss slayer' },
    { id: 'ts_items3', cat: 'combate', tier: 1, name: 'Useful loot',
      desc: 'Find 3 different items.', value: count('itemsFound'), goal: 3, reward: { coins: 100 } },

    { id: 'ts_coins1k', cat: 'caceria', tier: 1, name: 'Coins in the bag',
      desc: 'Earn 1,000 coins total (from hunts).', value: st('coinsEarned'), goal: 1000, reward: { coins: 80 } },
    { id: 'ts_coins10k', cat: 'caceria', tier: 2, name: 'Guild saver',
      desc: 'Earn 10,000 coins total.', value: st('coinsEarned'), goal: 10000, reward: { coins: 200 } },
    { id: 'ts_mis5', cat: 'meta', tier: 1, name: 'Contracts fulfilled',
      desc: 'Complete 5 missions (claim the reward).', value: st('missionsDone'), goal: 5, reward: { coins: 100 } },
    { id: 'ts_mis25', cat: 'meta', tier: 2, name: 'Reliable mercenary',
      desc: 'Complete 25 missions.', value: st('missionsDone'), goal: 25, reward: { coins: 220 }, title: 'Reliable' }
  ];

  const BY = {};
  for (const a of LIST) BY[a.id] = a;

  return { CATS, LIST, BY };
})();