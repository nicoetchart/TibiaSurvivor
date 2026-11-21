# Cyclopedia — Decisiones requeridas del dueño

**Estado:** D1–D7 **cerradas** (2026-11-21). Pendientes no bloqueantes al final.

---

## D1 — Nomenclatura de etapas (UI) — **CERRADA**

**Decisión:**

| Volumen | Progresión (EN UI) |
|---------|-------------------|
| **Bestiary** | Unknown → **Sighted** → **Tracked** → **Studied** → **Mastered** |
| **Bosstiary** | Unknown → **Sighted** → **Prowess** → **Expertise** → **Mastery** |

- UI copy in **English** only (product language).
- Estados internos siguen derivándose de `kills` + umbrales (`discovered`, `stage_1`, …).

**Implementación:** CYC-4 (`bestiary-ui.js`, `bestiary-run-ui.js`).

---

## D2 — Economía de puntos — **CERRADA**

**Decisión:** Dos monedas de progreso Cyclopedia:

| Moneda | Fuente | Uso principal |
|--------|--------|----------------|
| **Charm Points** | Completar entradas **bestiary** | Desbloqueo/equipo de charms por **Class** (D3); shop de mejoras globales si sigue vigente |
| **Boss Points** | Progreso **bosstiary** (umbrales / victorias) | Recompensas y contenido de boss (definir gastos en CYC-6) |

- Migrar desde el único `currency` actual en `save.bestiary` con split explícito en `save.cyclopedia`.
- La tienda “Upgrades and unlocks” del menú Cyclopedia se paga con **Charm Points** salvo decisión futura.

**Implementación:** CYC-6 / CYC-7 / CYC-12 (save).

---

## D3 — Modelo Charms — **CERRADA**

**Decisión:** Charms asignados/equipados por **Class** de criatura (taxonomía tipo Tibia Bestiary/Classes: *https://tibia.fandom.com/wiki/Bestiary/Classes* — **nombres y enums originales** en TibiaSurvivor, sin copiar propiedad).

- Cada criatura declara `class` (o `bestiaryClass`) estable en datos.
- El jugador equipa charms **por class** (una o más ranuras por class, por definir en CYC-7).
- El proc en combate solo aplica si el objetivo tiene la misma class que el charm equipado (o reglas de inclusión documentadas).
- Los charms globales actuales (wound/parry/stride) migran a modelo por class o quedan como “Wilderness” class genérica en transición.

**Implementación:** CYC-7 (+ enums en CYC-1).

---

## D4 — Primer boss Archfoe — **CERRADA**

**Decisión:**

- **Reutilizar el sistema Rift renombrado** como entrada al primer encuentro **Archfoe** (sala instanciada).
- El **boss del Rift** (fase inicial de contenido) es categoría **Bane** en Bosstiary (repetible, aviso en mapa).
- Los bosses **Nemesis** / finales de run no sustituyen al Archfoe del Rift; conviven con reglas de banda/spawn propias (D7).
- `DISABLE_RIFTS` en MVP se levantará cuando el contenido Archfoe esté listo (CYC-5+), no antes de contrato boss.

**Implementación:** CYC-5 (boss + fases), CYC-9 (boost boss), reactivar rift tras rename/copy.

---

## D5 — Daily boost: zona horaria — **CERRADA**

**Decisión:** Rotación diaria en **UTC** (`YYYYMMDD`), semilla determinista offline (ver auditoría CYC-8).

**Implementación:** CYC-8 / CYC-9.

---

## D6 — Migración save — **CERRADA**

**Decisión:** **Migración automática silenciosa** al boot (`G.DB.migrate` + `Bestiary.sanitizeSave` / futuro `cyclopedia.migrate`); cuarentena `*.bak.*` solo si corrupto.

**Implementación:** CYC-12.

---

## D7 — Combate y progresión de run — **CERRADA (Opción D)**

### Contrato (Opción D — selección por bandas de HP)

1. **`creatures.hp` en datos / bestiary = HP real en combate** (al spawn), salvo reglas explícitas documentadas (summon `noBestiaryCredit`, multiplicadores de evento puntuales).
2. La **dificultad creciente de la run** viene de **qué criatura aparece**, no de inflar el mismo mob con `hpMulRun` global.
3. El spawner calcula **`H_target(t)`** (y opcionalmente **`D_target(t)`** daño) y elige criaturas cuyo HP cae en **`[H_target - δ, H_target + δ]`**, con peso `spawnWeight` y fallbacks en cascada.
4. **Escala agresiva permitida:** curva de `H_target(t)` más rápida que el MVP actual; ajuste de curva de daño/XP acoplado al diseño survivor 10–15 min.
5. **Catálogo a largo plazo:** el pool Tibia admite **2000+** criaturas elegibles; HP declarados desde ~15 hasta **5000–10000–20000+** según diseño; no limitar la visión al roster de 15 del slice.
6. **Bosses dentro de bandas:** un boss puede entrar en la selección por banda si su HP y reglas `spawnProfile` lo permiten (p. ej. Bane mid-run); otros siguen con encuentros fijos (timer, Rift, fin de run Nemesis).

### Qué deja de ser fuente de verdad

- `TIER_STATS` como origen de HP para normals (solo fallback transitorio si falta `hp`).
- `hpMulRun(t)` como curva principal (residual opcional < ~1.1 solo en fallback).
- Multiplicador de población **1.6× HP** por cap (sustituir por más spawn o +daño, no HP oculto).

### Riesgos aceptados y mitigación en diseño

| Riesgo | Mitigación planificada |
|--------|------------------------|
| Pool vacío en banda temprano | Ensanchar δ; elegir “más cercano”; garantías mínimas por bioma |
| Catálogo MVP pequeño hasta import masivo | Curva `H_target` acoplada al contenido **registrado**; validator avisa huecos |
| `legacyId` 99001–99099 estrecho | Ampliar rango o tabla de sprites en fase PSR-assets (ver pendiente P1) |

**Implementación:** CYC-2 (datos + roster), CYC-3 (telemetría coherente), `mvp-config.js` curvas, validadores de banda.

Detalle técnico: `docs/cyclopedia/CREATURE_AND_BOSS_DATA_STANDARD.md` § **Spawn por bandas de HP**.

---

## Pendiente no bloqueante

| ID | Tema | Notas |
|----|------|-------|
| P1 | Rango `legacyId` / pipeline arte | >2000 criaturas requiere ampliar contrato PSR-6 o IDs internos sin legacy |
| P2 | Ranuras de charm por Class | Cantidad y coste en Charm Points |
| P3 | Gasto de Boss Points | Recompensas Archfoe / podiums futuros |
| P4 | Nombres ES oficiales etapas D1 | EN cerrado |

## Default aceptado (sin cambio)

- Categorías `bane|archfoe|nemesis` por frecuencia de encuentro en TibiaSurvivor.
- Changelog solo cuando el dueño publique.

---

## Registro de respuestas

| ID | Decisión | Fecha | Notas |
|----|----------|-------|-------|
| D1 | Bestiary / Bosstiary nombres acordados | 2026-11-21 | Ver tabla D1 |
| D2 | Charm Points + Boss Points | 2026-11-21 | Shop con Charm Points por defecto |
| D3 | Charms por Bestiary Class | 2026-11-21 | Enums originales TS |
| D4 | Rift → Archfoe; boss Rift = Bane | 2026-11-21 | |
| D5 | UTC daily boost | 2026-11-21 | |
| D6 | Migración silenciosa | 2026-11-21 | |
| D7 | Opción D — HP literal + bandas | 2026-11-21 | Escala alta; bosses en banda permitidos |