# Cyclopedia — Bestiary y Bosstiary (referencia Tibia → TibiaSurvivor)

**Fuente conceptual:** [Cyclopedia](https://tibia.fandom.com/wiki/Cyclopedia) y subpáginas *Bestiary/Difficulties* (Fandom).  
**Uso en TibiaSurvivor:** inspiración de **estructura y ritmo**, sin copiar nombres propietarios, tablas exactas de loot ni assets de Tibia/CipSoft.

---

## 1. Dos volúmenes (regla de oro)

| Volumen | Qué registra | En datos TS (`bestiary.section`) |
|---------|----------------|----------------------------------|
| **Bestiary** | Criaturas del mundo (spawn habitual, trash, elites menores) | `'bestiary'` |
| **Bosstiary** | **Jefes** con entrada propia (run boss, sentinelas tratadas como boss hasta decidir otra cosa) | `'bosstiary'` |

**Nunca** mezclar: una criatura del bestiary ordinario no va al bosstiary salvo que sea un **boss** de diseño.  
**Minotaur** (spawn normal) = Bestiary. **Minotaur Guard** y **Demon** (MVP) = Bosstiary (`bossCategory` editable).

---

## 2. Bestiary (criaturas)

### Progreso (wiki)
1. Primera muerte válida → entrada desbloqueada (nombre, sprite, dificultad).
2. Tres **etapas de detalle** por umbral de muertes.
3. Al completar la etapa final → **charm points** (en TS: puntos del libro / `rewardPoints`).

### Dificultades (ordinarias)
Harmless, Trivial, Easy, Medium, Hard, Challenging — con umbrales de kills y puntos como en wiki (implementados en `THRESHOLDS_BY_DIFFICULTY` en `js/data/bestiary.js`).

### Very Rare (wiki)
Misma dificultad base pero **2 / 3 / 5** kills y el doble de puntos. En TS reservado vía `difficulty: 'elite'` en bestiary o overrides `bestiary.thresholds` (futuro).

### Campos obligatorios por criatura
- `bestiary.enabled: true`
- `bestiary.section: 'bestiary'`
- `difficulty` ∈ dificultades de criatura (no bosstiary)

---

## 3. Bosstiary (bosses)

### Progreso (wiki)
Tres niveles: **Prowess**, **Expertise**, **Mastery** (en TS seguimos estados `stage_1` / `stage_2` / `completed` internamente; la UI puede mostrar los nombres tibianos).

### Categorías de boss (wiki)
| Categoría | Kills Prowess / Expertise / Mastery | Puntos boss (referencia wiki por nivel) |
|-----------|--------------------------------------|----------------------------------------|
| **Bane** | 25 / 100 / 300 | 5 + 15 + 30 |
| **Archfoe** | 5 / 20 / 60 | 10 + 30 + 60 |
| **Nemesis** | 1 / 3 / 5 | 10 + 30 + 60 |

En TS: `bestiary.bossCategory` = `'bane' | 'archfoe' | 'nemesis'` → `BOSSTIARY_THRESHOLDS` en `bestiary.js`.  
Los **puntos** al completar la entrada en MVP son un único bono (`rewardPoints`), calibrable por entrada.

### MVP actual (sujeto a cambio de diseño)
| id | section | bossCategory | Notas |
|----|---------|--------------|-------|
| `minotaur_guard` | bosstiary | `archfoe` | Centinela de élite de la run (EXTRA_ENTRIES + mapeo `sentinelElite`) |
| `demon` | bosstiary | `nemesis` | Jefe final de la run (`boss: true` en `creatures.js`) |

### Campos obligatorios por boss
- `bestiary.enabled: true`
- `bestiary.section: 'bosstiary'`
- `bestiary.bossCategory` obligatorio
- Puede existir fila en `G.CREATURES` solo para combate/sprites; el catálogo puede usar `EXTRA_ENTRIES` si el boss no debe duplicar bestiary normal (como Minotaur Guard vs Minotaur).

---

## 4. Contrato en código

| Concepto | Ubicación |
|----------|-----------|
| Umbrales bestiary | `G.Bestiary.THRESHOLDS_BY_DIFFICULTY` |
| Umbrales bosstiary | `G.Bestiary.BOSSTIARY_THRESHOLDS` |
| Sección | `bestiary.section` → `G.Bestiary.resolveSection(meta)` |
| Listado catálogo | `G.Bestiary.listEntries({ section: 'bestiary' \| 'bosstiary' })` |
| UI | `bestiary-ui.js` filtros **Bestiary** / **Bosstiary** |

### Deprecación
- `bestiary.entryType` (`normal` / `boss` / `elite`) — sustituido por `section` + `bossCategory`. Se acepta `entryType: 'boss'` solo como alias legacy en `resolveSection`.

---

## 5. Checklist al añadir contenido

**Criatura nueva de hunt**
1. `creatures.js` con `role: 'enemy'`, `bestiary: bestiaryMeta(id)` → section bestiary por defecto.
2. Elegir `difficulty` según tabla wiki.
3. No usar `boss: true` salvo que también tenga entrada bosstiary.

**Boss nuevo**
1. Definir combate en `creatures.js` o variante en roster.
2. Catálogo: `section: 'bosstiary'`, `bossCategory` según frecuencia prevista (Bane / Archfoe / Nemesis).
3. Si comparte cuerpo con una criatura normal (variante), usar `EXTRA_ENTRIES` + `baseCreatureId` y `bestiary.enabled: false` en la fila de combate auxiliar si hace falta evitar duplicados.

---

## 6. Fuera de alcance MVP (wiki, futuro)
- Boss slots / loot bonus %, podiums, boosted boss del día.
- Charms major/minor por criatura completada (parcialmente en charms globales TS).
- Clases del cyclopedia (Items, Map, etc.) salvo Bestiary/Bosstiary.