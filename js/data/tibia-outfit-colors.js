/* ============ tibia-outfit-colors.js — paleta 0–132 (cliente Tibia / OTClient) ============ */
G.TibiaOutfitColors = (() => {
  const HSI_H_STEPS = 19;
  const HSI_SI_VALUES = 7;

  /**
   * Misma función que Outfit::getColor en otclient/src/client/outfit.cpp
   * (también coincide con la tabla estática OutfitColors[133]).
   */
  function getColor(color) {
    let c = color | 0;
    if (c >= HSI_H_STEPS * HSI_SI_VALUES) c = 0;

    let loc1 = 0;
    let loc2 = 0;
    let loc3 = 0;

    if (c % HSI_H_STEPS !== 0) {
      loc1 = (c % HSI_H_STEPS) / 18;
      loc2 = 1;
      loc3 = 1;
      switch (Math.floor(c / HSI_H_STEPS)) {
        case 0: loc2 = 0.25; loc3 = 1; break;
        case 1: loc2 = 0.25; loc3 = 0.75; break;
        case 2: loc2 = 0.5; loc3 = 0.75; break;
        case 3: loc2 = 0.667; loc3 = 0.75; break;
        case 4: loc2 = 1; loc3 = 1; break;
        case 5: loc2 = 1; loc3 = 0.75; break;
        case 6: loc2 = 1; loc3 = 0.5; break;
        default: break;
      }
    } else {
      loc1 = 0;
      loc2 = 0;
      loc3 = 1 - (c / HSI_H_STEPS) / HSI_SI_VALUES;
    }

    if (loc3 === 0) return [0, 0, 0];

    if (loc2 === 0) {
      const g = Math.round(loc3 * 255);
      return [g, g, g];
    }

    let red = 0;
    let green = 0;
    let blue = 0;

    if (loc1 < 1 / 6) {
      red = loc3;
      blue = loc3 * (1 - loc2);
      green = blue + (loc3 - blue) * 6 * loc1;
    } else if (loc1 < 2 / 6) {
      green = loc3;
      blue = loc3 * (1 - loc2);
      red = green - (loc3 - blue) * (6 * loc1 - 1);
    } else if (loc1 < 3 / 6) {
      green = loc3;
      red = loc3 * (1 - loc2);
      blue = red + (loc3 - red) * (6 * loc1 - 2);
    } else if (loc1 < 4 / 6) {
      blue = loc3;
      red = loc3 * (1 - loc2);
      green = blue - (loc3 - red) * (6 * loc1 - 3);
    } else if (loc1 < 5 / 6) {
      blue = loc3;
      green = loc3 * (1 - loc2);
      red = green + (loc3 - green) * (6 * loc1 - 4);
    } else {
      red = loc3;
      green = loc3 * (1 - loc2);
      blue = red - (loc3 - green) * (6 * loc1 - 5);
    }

    return [Math.round(red * 255), Math.round(green * 255), Math.round(blue * 255)];
  }

  /** Columna 0 de cada fila: escala de grises del cliente (OutfitColors[]). */
  const GRAY_COLUMN = [255, 128, 182, 145, 109, 72, 36];

  function rgb(index) {
    const i = Math.max(0, Math.min(132, index | 0));
    if (i % HSI_H_STEPS === 0) {
      const g = GRAY_COLUMN[Math.floor(i / HSI_H_STEPS)] ?? 0;
      return [g, g, g];
    }
    return getColor(i);
  }

  function css(index) {
    const [r, g, b] = rgb(index);
    return `rgb(${r},${g},${b})`;
  }

  return { getColor, rgb, css, HSI_H_STEPS, HSI_SI_VALUES };
})();
