/* ============ tibia-theme.js — tokens CSS ↔ canvas (Fase 3) ============
 * Fuente de verdad de color: variables --ts-* en css/tibia-ui.css.
 */
G.TibiaTheme = (() => {
  const LEGACY = {
    text: '#eaf2ff',
    sub: 'rgba(180,200,255,.75)',
    lv: '#ffcb3d',
    hp: '#ff5f6d',
    xp0: '#4fd1ff',
    xp1: '#a98bff',
    muted: '#8fa3c4',
    warn: '#ffb0b8',
    slot: 'rgba(10,16,28,.8)',
    slotOn: 'rgba(20,30,50,.95)',
    stroke: 'rgba(140,170,210,.22)',
    accent: '#ffcb3d',
    slotR: 12,
    pillR: 7,
  };

  const HUD_VARS = {
    text: '--ts-text',
    sub: '--ts-hud-sub',
    lv: '--ts-accent',
    hp: '--ts-hp',
    xp0: '--ts-xp0',
    xp1: '--ts-xp1',
    muted: '--ts-muted',
    warn: '--ts-danger-soft',
    slot: '--ts-hud-slot',
    slotOn: '--ts-hud-slot-on',
    stroke: '--ts-hud-stroke',
    accent: '--ts-accent',
  };

  let hudCache = null;

  function enabled() {
    return typeof document !== 'undefined' && document.documentElement.getAttribute('data-ui') === 'tibia';
  }

  function cssVar(name, fallback) {
    if (typeof document === 'undefined') return fallback;
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function invalidateHud() {
    hudCache = null;
  }

  function hudPalette() {
    if (!enabled()) return LEGACY;
    if (hudCache) return hudCache;
    const p = {
      text: cssVar(HUD_VARS.text, '#e8deca'),
      sub: cssVar(HUD_VARS.sub, '#a89f90'),
      lv: cssVar(HUD_VARS.lv, '#c9a227'),
      hp: cssVar(HUD_VARS.hp, '#c45c5c'),
      xp0: cssVar(HUD_VARS.xp0, '#5a6b3a'),
      xp1: cssVar(HUD_VARS.xp1, '#c9a227'),
      muted: cssVar(HUD_VARS.muted, '#a89f90'),
      warn: cssVar(HUD_VARS.warn, '#e8a0a0'),
      slot: cssVar(HUD_VARS.slot, 'rgba(18, 16, 14, 0.88)'),
      slotOn: cssVar(HUD_VARS.slotOn, 'rgba(36, 33, 28, 0.96)'),
      stroke: cssVar(HUD_VARS.stroke, 'rgba(154, 145, 131, 0.38)'),
      accent: cssVar(HUD_VARS.accent, '#c9a227'),
      slotR: 6,
      pillR: 4,
    };
    hudCache = p;
    return p;
  }

  const FONT_LEGACY = '"Crimson Pro",Georgia,"Times New Roman",serif';
  const FONT_FALLBACK = '"Crimson Pro",Georgia,"Times New Roman",serif';

  /** Extra px en todos los tamaños de fuente (DOM: ver --ts-font-bump en CSS). */
  const FONT_SIZE_BUMP = 2;

  /** Cadena ctx.font para canvas (lee --ts-font-family en modo Tibia). */
  function font(weight, sizePx) {
    const bump = FONT_SIZE_BUMP;
    const px = sizePx + bump;
    const fam = enabled()
      ? cssVar('--ts-font-family', FONT_FALLBACK)
      : FONT_LEGACY;
    return `${weight} ${px}px ${fam}`;
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('load', invalidateHud);
  }

  return { enabled, cssVar, hudPalette, invalidateHud, font, LEGACY };
})();
