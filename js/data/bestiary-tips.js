/* ============ bestiary-tips.js — consejos tácticos (criaturas Tibia) ============ */
G.BESTIARY_TIPS = {
  'bestiary.cat.tip1': {
    es: 'Oleadas tempranas: un hechizo en área barato limpia gatos sin perder tempo.',
    en: 'Early swarms: a cheap area spell clears cats without losing tempo.'
  },
  'bestiary.dog.tip1': {
    es: 'Salta sobre tu hueco; no te plantes mientras canalizas un hechizo largo.',
    en: 'Jumps on your position; do not stand still during long casts.'
  },
  'bestiary.deer.tip1': {
    es: 'Muy rápido y frágil: elimínalo antes de que corte tu ruta de huida.',
    en: 'Very fast and fragile: drop it before it blocks your escape route.'
  },
  'bestiary.rabbit.tip1': {
    es: 'Corta tu retirada: no solo huyas en línea recta o te interceptará.',
    en: 'Cuts off your retreat: do not flee in a straight line or it will intercept.'
  },
  'bestiary.bug.tip1': {
    es: 'Resiste tierra; el fuego rompe su caparazón más rápido que golpes físicos.',
    en: 'Resists earth; fire breaks its shell faster than physical hits.'
  },
  'bestiary.troll.tip1': {
    es: 'Débil a muerte y tierra; persigue sin pausa pero es blando si lo kiteas.',
    en: 'Weak to death and earth; chases relentlessly but is soft if you kite it.'
  },
  'bestiary.wolf.tip1': {
    es: 'Embiste tras apuntar: esquiva lateral en el dash y contraataca.',
    en: 'Charges after aiming: sidestep the dash and punish.'
  },
  'bestiary.orc_shaman.tip1': {
    es: 'Cura al grupo; priorízalo antes de que revivan oleadas enteras.',
    en: 'Heals the pack; prioritize it before it refills whole waves.'
  },
  'bestiary.minotaur.tip1': {
    es: 'Cuerpo a cuerpo pesado; débil a hielo y muerte, resiste fuego.',
    en: 'Heavy melee bruiser; weak to ice and death, resists fire.'
  },
  'bestiary.wasp.tip1': {
    es: 'Muy rápida y frágil: acaba con ella antes de que te corte el paso.',
    en: 'Very fast and fragile: drop it before it blocks your path.'
  },
  'bestiary.fire_devil.tip1': {
    es: 'Inmune al fuego; hielo o sagrado. No pises las marcas flameantes del suelo.',
    en: 'Immune to fire—use ice or holy. Do not stand on burning floor marks.'
  },
  'bestiary.ghoul.tip1': {
    es: 'Inmune a muerte; sagrado penetra. Mucha vida: no lo dejes mientras curas.',
    en: 'Immune to death; holy penetrates. High HP: do not ignore it while you heal off.'
  },
  'bestiary.bonelord.tip1': {
    es: 'Abanico de rayos: gira para no recibir varios impactos seguidos.',
    en: 'Fan of beams: strafe so you do not eat several hits in a row.'
  },
  'bestiary.hero.tip1': {
    es: 'Tanque lento: necesita muchos golpes; usa daño sostenido, no bursts cortos.',
    en: 'Slow tank: takes many hits; use sustained damage, not short bursts.'
  },
  'bestiary.demon.tip1': {
    es: 'Jefe infernal: reserva defensas para embestidas y ráfagas del minuto final.',
    en: 'Infernal boss: save defensives for charges and late-minute bursts.'
  },
  'bestiary.minotaur_guard.tip1': {
    es: 'Very Rare: escuda a aliados; bórralo antes de cargar contra el jefe.',
    en: 'Very Rare: shields allies; delete it before you push the boss.'
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
