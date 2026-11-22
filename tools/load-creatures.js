/** Cargar G.CREATURES (+ extensión de roster) en validadores Node. */
function registerCreatures(loadFn) {
  loadFn('js/data/creatures-roster-ext.js');
  loadFn('js/data/creatures.js');
}

module.exports = { registerCreatures };