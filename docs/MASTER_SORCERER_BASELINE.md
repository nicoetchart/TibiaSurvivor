# TibiaSurvivor — Master Sorcerer Baseline

## Propósito

Este documento es la línea base funcional y técnica para diseñar e implementar la primera vocación completa de **TibiaSurvivor**:

> **Master Sorcerer**

Descripción central del producto:

> “Un survivor de fantasía pixel art donde cada partida reproduce la tensión y progresión de una hunting session de un MMORPG clásico.”

Este archivo debe cargarse en Cursor junto con el repositorio y los documentos de arquitectura y migración existentes. Su función es controlar el alcance, evitar cambios improvisados y permitir que la implementación avance una fase a la vez.

---

## 1. Reglas obligatorias de trabajo

1. Trabajar **una sola fase por iteración**.
2. Mantener el proyecto ejecutable al cerrar cada fase.
3. No comenzar la fase siguiente sin validación explícita del usuario.
4. Antes de modificar código:
   - inspeccionar los archivos reales;
   - identificar símbolos y dependencias;
   - presentar un plan breve de cambios;
   - esperar autorización si la fase puede afectar más archivos de los previstos.
5. No realizar refactors generales fuera del alcance de Master Sorcerer.
6. Mantener JavaScript vanilla y la carga concatenada actual.
7. No introducir TypeScript, ES modules, frameworks ni un bundler nuevo.
8. Respetar el orden de scripts de `dev.html`, porque funciona como grafo de dependencias.
9. No editar manualmente `index.html` ni `js/app.min.js` si son archivos generados.
10. No ejecutar el proceso de publicación o build de producción salvo autorización explícita.
11. No crear commits, tags, ramas ni hacer push sin autorización.
12. No eliminar contenido legacy durante estas fases salvo que una fase lo indique expresamente.
13. No usar sprites, sonidos, mapas, iconos ni otros assets extraídos de Tibia.
14. Los nombres e incantations indicados en este documento se utilizarán como referencia funcional del prototipo. Deben mantenerse centralizados en datos para permitir una futura revisión o sustitución.
15. Nunca depender del texto visible de un spell para ejecutar lógica. La lógica debe usar IDs internos estables.
16. Si la arquitectura real contradice esta línea base, detenerse, documentar la diferencia y proponer una adaptación antes de modificar código.

---

## 2. Contexto técnico conocido

La migración de TibiaSurvivor mantiene inicialmente:

- JavaScript vanilla.
- Namespace global `G`.
- Carga de scripts concatenada mediante `dev.html`.
- Sistemas reutilizables de:
  - game loop;
  - jugador;
  - enemigos;
  - proyectiles;
  - combate;
  - VFX;
  - spawner;
  - pickups;
  - experiencia;
  - level-up con tres cartas;
  - guardado local;
  - HUD y run UI.

La capa neutral de contenido ya contempla o debe contemplar:

- `js/data/vocations.js`
- `js/data/abilities.js`
- `js/data/damage-types.js`
- `js/data/upgrades.js`

Antes de implementar, verificar los nombres y contratos reales existentes. No asumir que los archivos conservan exactamente esta estructura.

### Sistemas que probablemente deberán revisarse

- `js/data/vocations.js`
- `js/data/abilities.js`
- `js/data/damage-types.js`
- `js/data/upgrades.js`
- `js/entities/player.js`
- `js/entities/projectile.js`
- `js/entities/enemy.js`
- `js/entities/vfx.js`
- `js/systems/combat.js`
- `js/systems/levelup.js`
- `js/ui/hud.js`
- `js/ui/run-ui.js`
- `js/game.js`
- `js/main.js`
- `dev.html`

Esta lista es orientativa. Cursor debe confirmar el alcance real antes de tocar cualquier archivo.

---

## 3. Identidad de Master Sorcerer

### Fantasía de juego

Master Sorcerer es una vocación de **alto daño mágico, baja resistencia y control de área**, centrada en mantener distancia y destruir grupos de enemigos mediante fire, energy y death damage.

La progresión de una run debe comenzar con ataques mágicos simples y terminar con waves, beams y ultimate spells capaces de dominar grandes sectores de la pantalla.

### Fortalezas

- Alto daño elemental.
- Excelente limpieza de hordas.
- Buen daño contra objetivos individuales mediante death damage.
- Proyectiles rápidos y penetrantes con energy damage.
- Daño persistente y explosiones con fire damage.
- Gran escalamiento ofensivo.
- Variedad de builds especializadas o híbridas.

### Debilidades

- Maximum Health bajo.
- Armor inicial nulo o muy bajo.
- Dependencia del movimiento y posicionamiento.
- Vulnerabilidad cuando queda rodeado.
- Cooldowns altos en ultimate spells.
- Menor tolerancia a errores que futuras vocaciones defensivas.

### Estadísticas iniciales de referencia

Estos valores son una línea base de balance y deben quedar configurables:

| Estadística | Valor inicial |
|---|---:|
| Maximum Health | 75 |
| Movement Speed | 100% |
| Base Damage Multiplier | 110% |
| Attack Speed | 100% |
| Cooldown Reduction | 0% |
| Critical Chance | 5% |
| Pickup Radius | 100% |
| Armor | 0 |
| Starting Spell | `flame_strike` |

No ajustar estos valores silenciosamente. Cualquier cambio de balance debe quedar registrado en el cierre de la fase correspondiente.

---

## 4. Elementos y estados

La primera versión completa de Master Sorcerer utiliza exactamente tres elementos:

### Fire

Rol:

- daño de área;
- daño persistente;
- explosiones;
- limpieza de hordas.

Estado asociado: **Burning**

- Inflige daño periódico.
- Puede renovar duración.
- No debe acumular daño de forma ilimitada.
- Algunas mejoras pueden hacer explotar a enemigos derrotados mientras están burning.

### Energy

Rol:

- proyectiles rápidos;
- penetración;
- ataques lineales;
- cadenas entre enemigos;
- alta cadencia.

Estado asociado: **Electrified**

- Permite encadenamientos o efectos adicionales de energy.
- Puede aplicar una reducción breve y moderada de velocidad.
- No debe producir cadenas infinitas.

### Death

Rol:

- daño individual elevado;
- debilitamiento;
- ejecución;
- daño contra elites y bosses.

Estado asociado: **Curse**

- Aumenta el death damage recibido o reduce resistencia elemental.
- Debe tener duración limitada.
- La ejecución debe excluir o limitarse contra bosses.

### Regla inicial de resistencias

Durante la primera implementación, los multiplicadores elementales de los enemigos pueden mantenerse en `1.0`. Primero debe validarse el funcionamiento de spells y estados; las resistencias específicas se equilibrarán posteriormente.

---

## 5. Contrato de datos recomendado

Los nombres exactos del contrato deben adaptarse al modelo existente, pero la separación conceptual es obligatoria.

```js
{
  id: "flame_strike",
  displayName: "Flame Strike",
  incantation: "exori flam",
  vocationId: "master_sorcerer",
  element: "fire",
  kind: "projectile",
  maxLevel: 5,
  baseDamage: 18,
  cooldown: 1.4,
  levels: [
    { level: 1, ... },
    { level: 2, ... },
    { level: 3, ... },
    { level: 4, ... },
    { level: 5, ... }
  ]
}
```

### Campos conceptuales mínimos

- `id`: identificador interno estable.
- `displayName`: nombre visible.
- `incantation`: palabras del spell.
- `vocationId`: vocación habilitada.
- `element`: `fire`, `energy` o `death`.
- `kind`: implementación de combate.
- `maxLevel`: siempre `5` para este alcance.
- `baseDamage`: daño base configurable.
- `cooldown`: cooldown base configurable.
- `levels`: definición de cada nivel.
- `rarity` o `weight`: peso de aparición, si el sistema ya lo soporta.
- `requirements`: requisitos para aparecer.
- `tags`: clasificación para filtros y sinergias.

### Reglas del contrato

1. No crear cinco spells diferentes para representar sus cinco niveles.
2. El nivel actual debe vivir en el estado de la run.
3. Los efectos finales deben calcularse desde la definición base y el nivel.
4. Los spells en nivel 5 deben salir del pool.
5. Las cartas no pueden ofrecer dos veces el mismo upgrade.
6. La lógica no debe comparar `displayName` ni `incantation`.

---

## 6. Spells activos

Master Sorcerer debe tener **10 spells activos**, todos con cinco niveles.

### 6.1 Flame Strike — `exori flam`

- ID: `flame_strike`
- Elemento: fire
- Tipo: proyectil automático
- Rol: ataque inicial y consistente.

| Nivel | Mejora |
|---|---|
| 1 | Dispara contra el enemigo válido más cercano. |
| 2 | +25% damage. |
| 3 | +1 projectile, con selección de objetivo independiente cuando sea posible. |
| 4 | -20% cooldown. |
| 5 | Aplica Burning y los enemigos derrotados mientras arden generan una explosión pequeña. |

### 6.2 Energy Strike — `exori vis`

- ID: `energy_strike`
- Elemento: energy
- Tipo: proyectil rápido
- Rol: penetración y cadencia.

| Nivel | Mejora |
|---|---|
| 1 | Dispara un proyectil rápido contra el enemigo válido más cercano. |
| 2 | +25% damage. |
| 3 | Perfora 1 enemigo adicional. |
| 4 | -20% cooldown. |
| 5 | El impacto se encadena hacia 2 enemigos adicionales. |

### 6.3 Death Strike — `exori mort`

- ID: `death_strike`
- Elemento: death
- Tipo: ataque concentrado
- Rol: elites, bosses y objetivos resistentes.

| Nivel | Mejora |
|---|---|
| 1 | Ataca al objetivo válido con mayor vida dentro del rango. |
| 2 | +30% damage. |
| 3 | Aplica Curse durante 3 segundos. |
| 4 | -20% cooldown. |
| 5 | Ejecuta enemigos normales bajo 15% de vida; contra bosses aplica daño adicional limitado. |

### 6.4 Fire Wave — `exevo flam hur`

- ID: `fire_wave`
- Elemento: fire
- Tipo: cono frontal
- Rol: control de grupos cercanos.

| Nivel | Mejora |
|---|---|
| 1 | Emite una wave frontal corta. |
| 2 | +25% damage. |
| 3 | +30% área y alcance. |
| 4 | -20% cooldown. |
| 5 | Deja una zona de fuego durante 3 segundos. |

### 6.5 Energy Wave — `exevo vis hur`

- ID: `energy_wave`
- Elemento: energy
- Tipo: onda frontal penetrante
- Rol: limpiar líneas de enemigos.

| Nivel | Mejora |
|---|---|
| 1 | Lanza una onda frontal que atraviesa enemigos. |
| 2 | +25% damage. |
| 3 | +35% ancho. |
| 4 | -20% cooldown. |
| 5 | La wave se divide en tres direcciones controladas. |

### 6.6 Great Fire Wave — `exevo gran flam hur`

- ID: `great_fire_wave`
- Elemento: fire
- Tipo: gran cono frontal
- Rol: daño pesado de área.

| Nivel | Mejora |
|---|---|
| 1 | Emite un gran cono frontal de fire damage. |
| 2 | +30% damage. |
| 3 | +30% alcance. |
| 4 | -20% cooldown. |
| 5 | Emite una segunda wave más pequeña en la dirección opuesta. |

### 6.7 Energy Beam — `exevo vis lux`

- ID: `energy_beam`
- Elemento: energy
- Tipo: rayo lineal penetrante
- Rol: daño preciso a distancia.

| Nivel | Mejora |
|---|---|
| 1 | Dispara un rayo lineal que atraviesa enemigos. |
| 2 | +25% damage. |
| 3 | +40% longitud. |
| 4 | -20% cooldown. |
| 5 | El rayo persiste brevemente y puede golpear una segunda vez. |

### 6.8 Great Energy Beam — `exevo gran vis lux`

- ID: `great_energy_beam`
- Elemento: energy
- Tipo: rayo ancho
- Rol: cobertura de largo alcance.

| Nivel | Mejora |
|---|---|
| 1 | Dispara un rayo ancho y de largo alcance. |
| 2 | +30% damage. |
| 3 | +35% ancho. |
| 4 | -20% cooldown. |
| 5 | Dispara simultáneamente en cuatro direcciones cardinales. |

### 6.9 Hell's Core — `exevo gran mas flam`

- ID: `hells_core`
- Elemento: fire
- Tipo: ultimate radial
- Rol: limpiar una gran zona alrededor del jugador.

| Nivel | Mejora |
|---|---|
| 1 | Produce una gran explosión radial con cooldown alto. |
| 2 | +30% damage. |
| 3 | +25% radio. |
| 4 | -20% cooldown. |
| 5 | Produce una segunda detonación después de 1 segundo. |

### 6.10 Rage of the Skies — `exevo gran mas vis`

- ID: `rage_of_the_skies`
- Elemento: energy
- Tipo: ultimate de rayos
- Rol: daño distribuido en pantalla.

| Nivel | Mejora |
|---|---|
| 1 | Invoca múltiples rayos sobre enemigos válidos distribuidos por la pantalla. |
| 2 | +30% damage. |
| 3 | +3 lightning strikes. |
| 4 | -20% cooldown. |
| 5 | Activa una tormenta de 3 segundos que prioriza elites y bosses sin ignorar completamente la horda. |

---

## 7. Mejoras pasivas

Todas las pasivas tienen cinco niveles y deben usar el mismo sistema de cartas.

| ID | Nombre | Efecto acumulado por nivel |
|---|---|---|
| `master_of_flames` | Master of Flames | +8% fire damage por nivel; máximo +40%. |
| `master_of_thunder` | Master of Thunder | +8% energy damage por nivel; máximo +40%. |
| `master_of_decay` | Master of Decay | +8% death damage por nivel; máximo +40%. |
| `strong_haste` | Strong Haste | +4% movement speed por nivel; máximo +20%. |
| `avatar_of_storm` | Avatar of Storm | +5% attack speed por nivel; máximo +25%. |
| `ultimate_healing` | Ultimate Healing | +8% Maximum Health por nivel; máximo +40%. |
| `intense_healing` | Intense Healing | +0.2 HP por segundo por nivel; máximo +1 HP/s. |
| `magic_shield` | Magic Shield | Shield regenerable equivalente a 5% de Maximum Health por nivel; máximo 25%. |
| `aura_of_exposed_weakness` | Aura of Exposed Weakness | +3% elemental penetration por nivel; máximo +15%. |

### Reglas de pasivas

- Usar bonificaciones aditivas inicialmente.
- Definir un mínimo absoluto de cooldown.
- `Magic Shield` se regenera solo después de un periodo sin recibir daño.
- `Magic Shield` no concede invulnerabilidad.
- Aumentar Maximum Health debe conservar correctamente la proporción o aplicar una regla documentada.
- Las pasivas en nivel 5 salen del pool.

---

## 8. Sistema de level-up

En cada level-up aparecen tres cartas.

### Reglas

1. No repetir una opción en la misma selección.
2. No ofrecer contenido en nivel máximo.
3. Garantizar oportunidades ofensivas durante los primeros niveles.
4. Evitar tres opciones defensivas cuando el jugador solo tiene un spell.
5. Dar un peso moderadamente mayor a mejorar spells adquiridos.
6. Mantener una probabilidad menor de desbloquear un elemento nuevo.
7. Mostrar:
   - nombre;
   - incantation;
   - elemento;
   - nivel actual;
   - nivel siguiente;
   - cambio exacto.
8. Las ultimate spells deben tener requisitos y menor peso.

### Requisitos iniciales para ultimate spells

- Player level mínimo: 10.
- Al menos 2 spells ofensivos adquiridos.
- Al menos un spell previo del mismo elemento.
- Peso inferior al de strikes, waves y beams.

### Ritmo objetivo

| Momento | Progresión esperada |
|---|---|
| 0–2 min | Starting spell y primera mejora. |
| 2–4 min | Segundo spell o primera wave. |
| 4–7 min | Especialización elemental. |
| 7–10 min | Beam o great wave. |
| 10–12 min | Primera ultimate. |
| 12–15 min | Niveles 4–5, elites y boss. |

---

## 9. Fases controladas de implementación

### Fase MS-0 — Auditoría de integración

Objetivo:

- inspeccionar la implementación real;
- mapear contratos y dependencias;
- no modificar runtime.

Entregables:

- archivos relevantes;
- símbolos relevantes;
- modelo actual de abilities y upgrades;
- diferencias respecto de este documento;
- plan exacto de Fase MS-1;
- riesgos;
- pruebas previstas.

Criterio de cierre:

- cero archivos de runtime modificados;
- alcance de la siguiente fase confirmado.

### Fase MS-1 — Modelo de datos

Objetivo:

- registrar `master_sorcerer`;
- registrar elementos;
- definir los 10 spells y 9 pasivas como datos;
- no implementar todavía todos los comportamientos.

Criterios:

- todas las definiciones cargan;
- todos los spells tienen cinco niveles;
- todos los IDs son únicos;
- no hay `ReferenceError`;
- no hay valores `NaN`;
- no se rompe una run existente.

### Fase MS-2 — Vocación y Flame Strike

Objetivo:

- iniciar una run como Master Sorcerer;
- aplicar estadísticas base;
- usar Flame Strike como starting spell;
- completar sus cinco niveles.

Criterios:

- run jugable;
- Flame Strike funciona en niveles 1–5;
- HUD identifica vocación, spell y elemento;
- segunda run funciona sin recargar;
- sin efectos residuales.

### Fase MS-3 — Energy Strike y Death Strike

Objetivo:

- completar los tres strikes;
- añadir Electrified y Curse;
- probar selección de objetivos.

Criterios:

- los tres strikes llegan a nivel 5;
- no existen cadenas infinitas;
- ejecución no elimina bosses instantáneamente;
- estados expiran y se limpian correctamente.

### Fase MS-4 — Fire Wave y Energy Wave

Objetivo:

- añadir ataques direccionales;
- alinear VFX y hitboxes;
- validar orientación.

Criterios:

- áreas visuales coinciden con daño;
- cada enemigo recibe una cantidad controlada de impactos por cast;
- no hay daño fuera del área representada.

### Fase MS-5 — Beams y Great Fire Wave

Objetivo:

- Energy Beam;
- Great Energy Beam;
- Great Fire Wave.

Criterios:

- penetración estable;
- límites de impactos;
- orientación consistente;
- rendimiento aceptable con hordas.

### Fase MS-6 — Ultimate spells

Objetivo:

- Hell's Core;
- Rage of the Skies;
- requisitos de aparición;
- telegraphs y limpieza de efectos.

Criterios:

- no aparecen antes de cumplir requisitos;
- cooldown respetado;
- efectos se limpian al pausar, morir o terminar la run;
- no trivializan bosses sin inversión.

### Fase MS-7 — Pasivas

Objetivo:

- implementar las nueve pasivas;
- completar cinco niveles;
- integrar filtros del pool.

Criterios:

- efectos aplicados una sola vez por nivel;
- guardado o reinicio no duplica estadísticas;
- minimum cooldown respetado;
- pasivas máximas dejan de aparecer.

### Fase MS-8 — UI, telemetría y balance

Objetivo:

- mejorar cartas;
- agregar comparativa actual → siguiente;
- registrar métricas por spell;
- ajustar la run de 10–15 minutos.

Métricas mínimas:

- damage total;
- casts;
- hits;
- kills;
- damage contra elites;
- damage contra boss;
- nivel de adquisición;
- nivel final.

### Fase MS-9 — Validación vertical slice

Ejecutar como mínimo:

1. Build fire.
2. Build energy.
3. Build death.
4. Build híbrida fire/energy.
5. Build defensiva con health, movement speed y Magic Shield.

Criterios finales:

- cada especialización puede completar una run;
- ninguna habilidad es obligatoria en todas las builds;
- la vocación sigue siendo frágil si queda rodeada;
- no hay errores de consola;
- no hay `NaN`;
- no hay proyectiles o VFX huérfanos;
- no hay upgrades sobre nivel 5;
- una segunda partida funciona correctamente.

---

## 10. Protocolo de cierre de cada fase

Al finalizar cada fase, Cursor debe detenerse y entregar:

1. **Resumen de cambios**
   - qué se implementó;
   - qué se dejó fuera.

2. **Archivos modificados**
   - archivo;
   - símbolos afectados;
   - motivo.

3. **Pruebas ejecutadas**
   - comando o procedimiento;
   - resultado;
   - limitaciones.

4. **Validación de criterios**
   - PASS;
   - FAIL;
   - NOT TESTED.

5. **Riesgos y deuda**
   - regresiones posibles;
   - supuestos;
   - comportamiento pendiente.

6. **Rollback**
   - cómo deshacer únicamente esa fase.

7. **Propuesta de siguiente fase**
   - alcance exacto;
   - archivos previstos;
   - riesgos.

Después de entregar este informe, Cursor debe **detenerse y esperar aprobación**.

---

## 11. Pruebas transversales obligatorias

Repetir cuando corresponda:

- iniciar run;
- movimiento;
- spawn de enemigos;
- casts;
- colisiones;
- XP;
- level-up;
- pausa;
- muerte;
- retorno al menú;
- segunda run;
- guardado local;
- carga de guardado;
- consola sin errores nuevos.

Validaciones especiales:

- sin `ReferenceError`;
- sin `TypeError`;
- sin `NaN`;
- sin timers activos después de terminar la run;
- sin arrays que crezcan indefinidamente;
- sin spells duplicados;
- sin cartas duplicadas;
- sin niveles superiores a 5;
- sin lógica dependiente de nombres visibles;
- sin modificación manual de archivos generados;
- sin uso de assets propietarios.

---

## 12. Fuera de alcance inicial

No implementar durante estas fases salvo autorización expresa:

- otras vocaciones;
- runas consumibles;
- mana como recurso completo;
- Wheel of Destiny;
- sistema de equipment;
- imbuements;
- charms;
- resistencias complejas por enemigo;
- networking;
- rankings;
- multiplayer;
- gacha;
- migración a TypeScript;
- migración a ES modules;
- rediseño general del motor;
- publicación.

---

## 13. Prompt inicial para Cursor

Copiar y pegar el siguiente prompt en Cursor después de añadir este archivo y los documentos técnicos del repositorio al contexto:

```text
Estoy trabajando en TibiaSurvivor.

Descripción central:
“Un survivor de fantasía pixel art donde cada partida reproduce la tensión y progresión de una hunting session de un MMORPG clásico.”

Usa MASTER_SORCERER_BASELINE.md como especificación funcional y de control.
Usa también los documentos reales de arquitectura, migración y reglas del repositorio que encuentres en el proyecto.

OBJETIVO DE ESTA ITERACIÓN
Ejecuta únicamente la Fase MS-0 — Auditoría de integración.

REGLAS OBLIGATORIAS
1. No modifiques archivos de runtime en esta iteración.
2. No implementes spells todavía.
3. No realices refactors.
4. No agregues dependencias.
5. No cambies JavaScript vanilla, el namespace global G ni la carga concatenada.
6. No edites index.html ni js/app.min.js si son generados.
7. No ejecutes publicación, commit, push, merge o eliminación de archivos.
8. No avances a MS-1.
9. Si los documentos y el código difieren, considera el código actual como verdad técnica y reporta la diferencia.
10. Detente al terminar el informe y espera mi aprobación.

TRABAJO REQUERIDO
A. Lee primero:
- MASTER_SORCERER_BASELINE.md
- el plan de migración existente;
- la auditoría de arquitectura existente;
- CLAUDE.md, README o reglas equivalentes del repositorio;
- dev.html;
- los módulos actuales de vocations, abilities, damage types, upgrades y level-up;
- player, combat, projectile, VFX, HUD, run UI, game y main cuando existan.

B. Mapea el estado actual:
- cómo se define una vocación;
- cómo se define una ability;
- cómo se almacena el nivel de una ability durante una run;
- cómo se construye el pool de tres cartas;
- cómo se calcula damage y cooldown;
- cómo se seleccionan objetivos;
- qué clases de ataques ya existen: projectile, wave, beam, area u otras;
- cómo se crean y limpian timers, projectiles y VFX;
- cómo comienza y termina una run;
- qué datos se guardan de forma permanente.

C. Compara el código actual con MASTER_SORCERER_BASELINE.md:
- elementos reutilizables;
- elementos faltantes;
- incompatibilidades;
- cambios mínimos necesarios;
- riesgos de regresión;
- posibles cambios de contrato de datos.

D. Diseña la Fase MS-1, pero no la implementes:
- lista exacta de archivos a crear o modificar;
- símbolos que cambiarían;
- forma final propuesta del contrato de datos;
- orden de carga requerido;
- pruebas previstas;
- criterios de aceptación verificables;
- rollback.

FORMATO OBLIGATORIO DEL INFORME
1. Estado actual encontrado.
2. Mapa de archivos y símbolos.
3. Flujo actual de abilities y level-up.
4. Diferencias con la línea base.
5. Riesgos técnicos.
6. Plan exacto de Fase MS-1.
7. Pruebas y criterios de aceptación.
8. Preguntas o decisiones bloqueantes.

No hagas cambios. No avances de fase. Finaliza con:
“Fase MS-0 completada. Esperando autorización para MS-1.”
```

---

## 14. Prompt reutilizable para autorizar cada fase

Después de revisar el informe anterior, usar esta plantilla:

```text
Autorizo únicamente la Fase [MS-X] definida en MASTER_SORCERER_BASELINE.md y refinada en tu informe anterior.

Antes de editar:
1. Reconfirma el alcance exacto.
2. Enumera los archivos que modificarás.
3. Indica los riesgos principales.

Durante la ejecución:
- limita los cambios a esta fase;
- conserva compatibilidad con el motor actual;
- no hagas refactors no solicitados;
- no edites archivos generados;
- no ejecutes publicación, commit o push;
- no avances a la fase siguiente.

Después de implementar:
1. Ejecuta las pruebas posibles.
2. Verifica todos los criterios de aceptación.
3. Entrega el informe de cierre exigido por MASTER_SORCERER_BASELINE.md.
4. Detente y espera mi aprobación.

Si aparece un bloqueo o el alcance debe ampliarse, detente antes de modificar archivos adicionales y explícame:
- el problema;
- la causa;
- las alternativas;
- tu recomendación.
```

---

## 15. Decisiones que deben permanecer registradas

- Nombre del proyecto: **TibiaSurvivor**.
- Primera vocación completa: **Master Sorcerer**.
- Tres elementos iniciales: fire, energy y death.
- Diez spells activos.
- Nueve pasivas.
- Cinco niveles por spell y pasiva.
- Tres cartas por level-up.
- Una fase por iteración.
- Validación y aprobación antes de avanzar.
- Assets visuales y de audio originales.
- Nombres e incantations centralizados y desacoplados de la lógica.

