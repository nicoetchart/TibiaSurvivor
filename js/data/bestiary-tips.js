/* ============ bestiary-tips.js — consejos tácticos del vertical slice (BST-9) ============ */
G.BESTIARY_TIPS = {
  'bestiary.cave_filament.tip1': {
    es: 'Aparece en oleadas: un hechizo en área limpia varios sin gastar mucho tiempo.',
    en: 'It spawns in packs: an area spell clears several without much downtime.'
  },
  'bestiary.ember_wisp.tip1': {
    es: 'Carga en línea recta; esquiva lateral y contraataca cuando frena.',
    en: 'Charges in a straight line; sidestep and punish when it stops.'
  },
  'bestiary.pit_scuttler.tip1': {
    es: 'Es muy rápido pero frágil: priorízalo antes de que te corte la retirada.',
    en: 'Very fast but fragile: deal with it before it cuts off your escape.'
  },
  'bestiary.gravel_mite.tip1': {
    es: 'Aguanta más de lo que parece; no lo dejes vivo mientras curas a otros.',
    en: 'Tougher than it looks; do not leave it up while you heal off others.'
  },
  'bestiary.spore_puff.tip1': {
    es: 'Mantén obstáculos entre tú y el proyectil; no persigas en campo abierto.',
    en: 'Keep obstacles between you and its shots; avoid chasing in the open.'
  },
  'bestiary.dust_spirit.tip1': {
    es: 'Daño energético a distancia: acércate en ventanas tras cada ráfaga.',
    en: 'Energy damage at range: close in during gaps between bursts.'
  },
  'bestiary.flint_crawler.tip1': {
    es: 'Te persigue sin pausa; retrocede hacia zonas donde los proyectiles colisionan.',
    en: 'Relentless chase; kite backward into spots where spells collide with terrain.'
  },
  'bestiary.seam_speaker.tip1': {
    es: 'Abanico de tiros: gira para no recibir varios impactos a la vez.',
    en: 'Fan of shots: strafe so you do not eat multiple hits at once.'
  },
  'bestiary.rune_guard.tip1': {
    es: 'Refuerza a otros constructos; elimínalo si ves aliados con escudo o curación.',
    en: 'Bolsters other constructs; delete it when you see shields or healing nearby.'
  },
  'bestiary.brood_hatcher.tip1': {
    es: 'Corta la cadena matando al incubador antes de que sature la sala.',
    en: 'Break the chain by killing the hatcher before it floods the room.'
  },
  'bestiary.cinder_wraith.tip1': {
    es: 'Marca zonas de fuego en el suelo; no vuelvas sobre las mismas baldosas.',
    en: 'Marks fire on the ground; do not step back on the same tiles.'
  },
  'bestiary.crystal_shade.tip1': {
    es: 'Rayo sostenido: rompe la línea de visión un instante y vuelve a presionar.',
    en: 'Sustained beam: break line of sight briefly, then pressure again.'
  },
  'bestiary.ash_mender.tip1': {
    es: 'Si cura a la élite o al grupo, convierte al mender en objetivo principal.',
    en: 'If it heals elites or clusters, make the mender your primary target.'
  },
  'bestiary.iron_stalker.tip1': {
    es: 'Salta sobre tu posición: no te plantes al disparar un hechizo largo.',
    en: 'Jumps on your position; do not stand still during long casts.'
  },
  'bestiary.vault_warden.tip1': {
    es: 'Jefe del umbral: reserva defensas para las embestidas y ráfagas del minuto final.',
    en: 'Threshold boss: save defensives for charges and late-minute bursts.'
  },
  'bestiary.sentinel_elite.tip1': {
    es: 'Centinela único por run: derrotarlo abre el vínculo de hechizos si tienes huecos.',
    en: 'One sentinel per run: beating it opens spell fusion when you have room.'
  }
};

G.BestiaryTips = {
  text(key) {
    const row = G.BESTIARY_TIPS && G.BESTIARY_TIPS[key];
    if (!row) return null;
    const en = typeof G === 'object' && G.I18n && G.I18n.lang === 'en';
    return en ? (row.en || row.es) : (row.es || row.en);
  },
  has(key) {
    return !!(G.BESTIARY_TIPS && G.BESTIARY_TIPS[key]);
  }
};
