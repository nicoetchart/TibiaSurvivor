/* ============ vocation-ui.js — elección de vocación (Fase 3D) ============
 * Sustituye al test de personalidad en cuentas sin compañero (DEC-019, DEC-021).
 * Guarda el id numérico 99001 en save.partner, sin subir schemaVersion.
 */
G.VocationUI = (() => {
  const $ = G.UI.$;

  function init() {
    $('voc-ok').onclick = confirm;
  }

  function start() {
    const v = G.Vocations.defaultVocation();
    const ids = v.startingSpellIds && v.startingSpellIds.length ? v.startingSpellIds : [v.startingAbility];
    const names = ids.map(id => {
      const a = G.Abilities.BY_ID[id];
      if (!a) return id;
      const inc = a.incantation ? ' («' + a.incantation + '»)' : '';
      return a.name + inc;
    });
    $('voc-name').textContent = v.name;
    $('voc-text').textContent = v.description;
    $('voc-ability').textContent = names.length
      ? 'Empiezas con ' + names.join(' y ') + '.'
      : '';
    G.UI.chrome(false);
    G.UI.show('scr-vocation');
  }

  function confirm() {
    const v = G.Vocations.defaultVocation();
    const save = G.DB.save;
    const id = v.legacyPartnerId;
    if (!G.Content.getCreature(id) || !G.DEX_BY[id]) {
      G.UI.toast('No se pudo preparar la vocación.');
      return;
    }
    save.starter = id;
    save.partner = id;
    save.partnerShiny = false;
    save.personality = null;
    G.DB.grant(id, 'vocation');
    if (G.TibiaOutfits) G.DB.save.playerOutfit = G.TibiaOutfits.defaultLook();
    G.DB.commit();
    G.Content.syncFromSave(save);
    G.UI.toast(v.name + ' está listo.');
    G.Flow.goMenu();
  }

  return { init, start };
})();
