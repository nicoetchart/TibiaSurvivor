/* ============ geo-sprites.js — placeholders geométricos (Fase 3E) ============
 * Figuras originales para los ids 99001–99099. No cargan PNG ni arte de terceros.
 */
G.GeoSprites = (() => {
  const FRAMES = {
    Idle:   { n: 2, d: [20, 20] },
    Walk:   { n: 4, d: [8, 8, 8, 8] },
    Attack: { n: 4, d: [5, 5, 6, 8] },
    Shoot:  { n: 4, d: [5, 5, 6, 8] },
    Charge: { n: 3, d: [8, 8, 12] },
    Hurt:   { n: 2, d: [6, 10] },
    Faint:  { n: 3, d: [8, 10, 16] }
  };

  function isGeo(dex) {
    return !!(G.Content && G.Content.isNeutralLegacyId && G.Content.isNeutralLegacyId(dex));
  }

  function frameMeta(anim) {
    const f = FRAMES[anim] || FRAMES.Idle;
    return { n: f.n, d: f.d.slice(), w: 28, h: 32, ax: 14, ay: 30, r: 1 };
  }

  function look(dex) {
    const c = G.Content && G.Content.getCreature && G.Content.getCreature(dex);
    const type = (c && c.damageTypes && c.damageTypes[0]) || 'physical';
    const color = (G.DamageTypes && G.DamageTypes.COLOR[type]) || '#c8cdd8';
    let shape = 'orb';
    if (c && c.role === 'player') shape = 'caster';
    else if (c && c.behavior === 'tank') shape = 'block';
    else if (c && c.behavior === 'ranged') shape = 'diamond';
    else if (c && c.behavior === 'charger') shape = 'wedge';
    return { shape, color };
  }

  function poly(ctx, x, y, r, n, rot) {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rot + (i / n) * 6.2832;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  /**
   * Pies en (x, y). scale es el de Animator (el mundo usa 1; el menú lo agranda).
   */
  function draw(ctx, dex, x, y, scale, anim, frame, opts = {}) {
    const k = (G.Sprites ? G.Sprites.PX : 2) * (scale || 1);
    const { shape, color } = look(dex);
    const bob = anim === 'Walk' ? (frame % 2 === 0 ? -2 : 1) * k : 0;
    const pulse = (anim === 'Attack' || anim === 'Shoot' || anim === 'Charge') ? 1 + frame * 0.06 : 1;
    const cy = y - 14 * k + bob;
    const r = 8 * k * pulse;
    const alpha = opts.alpha == null ? 1 : opts.alpha;
    const faint = anim === 'Faint' ? Math.max(0.15, 1 - frame * 0.28) : 1;
    ctx.save();
    ctx.globalAlpha *= alpha * faint;
    ctx.fillStyle = opts.flash ? '#ffffff' : color;
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = Math.max(1, k);
    if (shape === 'caster') {
      ctx.beginPath();
      ctx.moveTo(x, cy - r * 1.35);
      ctx.lineTo(x + r * 0.85, cy + r * 0.55);
      ctx.lineTo(x - r * 0.85, cy + r * 0.55);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, cy - r * 0.15, r * 0.38, 0, 6.2832);
      ctx.fill();
    } else if (shape === 'block') {
      poly(ctx, x, cy, r * 1.05, 6, 0.52);
      ctx.fill(); ctx.stroke();
    } else if (shape === 'diamond') {
      poly(ctx, x, cy, r, 4, 0);
      ctx.fill(); ctx.stroke();
    } else if (shape === 'wedge') {
      ctx.beginPath();
      ctx.moveTo(x + r * 1.2, cy);
      ctx.lineTo(x - r * 0.8, cy - r * 0.85);
      ctx.lineTo(x - r * 0.8, cy + r * 0.85);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, 6.2832);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  return { isGeo, frameMeta, draw };
})();
