/* ============ judgment-stub.js — PSR-3 (DEC-034): sin Judgment/Arceus ============ */
G.Judgment = (() => {
  const noop = () => {};
  return {
    reset: noop,
    update: noop,
    skip: noop,
    cineTick: noop,
    drawAir: noop,
    drawOverlay: noop,
    noteDmg: noop,
    bossDown: noop,
    summary: () => null,
    drawable: () => null,
    AT: 1e9,
    active: false,
    cinematic: false,
    music: null
  };
})();