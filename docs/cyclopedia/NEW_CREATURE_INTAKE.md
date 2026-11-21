# NEW CREATURE INTAKE — Workflow obligatorio (Cursor)

Cuando el usuario pida **añadir una criatura** (o equivalente), **no implementar** hasta completar este intake y recibir aprobación explícita.

---

## Flujo

1. Buscar especificación previa en `docs/`, issues, o mensajes del chat.
2. Listar qué datos ya entregó el usuario.
3. Preguntar solo lo faltante (**agrupar** preguntas; no una por mensaje).
4. Presentar resumen de diseño.
5. Esperar aprobación.
6. Implementar siguiendo `CREATURE_AND_BOSS_DATA_STANDARD.md` y fases CYC activas.
7. Validar: datos, spawn aislado, combate, muerte, bestiary, save, segunda run.

---

## Cuestionario (obligatorio)

Marcar cada respuesta como: **obligatorio** | **recomendación** | **provisional** | **derivado** | **desconocido**.

### Bloque A — IDENTIDAD

| # | Pregunta | Opciones / notas |
|---|----------|------------------|
| A1 | ID interno propuesto (`snake_case`) | Validar no duplicado en `G.CREATURE_BY_ID` |
| A2 | Nombre visible / `nameKey` | |
| A3 | Descripción corta | |
| A4 | Familia | beast, humanoid, demon, undead, … (cerrar con lista registry) |
| A5 | Tags | melee, ground, ranged, … |
| A6 | Bioma(s) | p. ej. `plains_of_havoc` |
| A7 | Rol (ROLE enum) | fodder, swarm, … — recomendación si dudan |
| A8 | Tipo de entrada | Normal bestiary / Elite very rare / **No** miniboss sin intake boss |

### Bloque B — APARICIÓN

| # | Pregunta | Opciones |
|---|----------|----------|
| B1 | Momento de la run (segundos o tier) | early / mid / late |
| B2 | Condiciones especiales | ninguna / evento / oleada |
| B3 | Peso de spawn (0 = solo manual) | |
| B4 | Min–max por spawn event | usualmente 1 |
| B5 | Máximo simultáneo | default engine |
| B6 | Ocurrencia declarada | common → very_rare |
| B7 | Elegible Daily Boost | sí/no + `boostExcluded` |
| B8 | Variantes | ninguna / elite skin / … |

### Bloque C — MOVIMIENTO Y BEHAVIOUR

| # | Pregunta |
|---|----------|
| C1 | Behaviour principal | chase, ranged, runner, … |
| C2 | Behaviours secundarios | opcional |
| C3 | Velocidad relativa | usar `speed` en creatures o tier |
| C4 | Distancia preferida / ranged | si aplica |
| C5 | Reacción al daño / huida | runner flee threshold |
| C6 | Cambios por vida/tiempo | opcional |

### Bloque D — TARGETING

| # | Pregunta | Default |
|---|----------|---------|
| D1 | Modo de objetivo | nearest |
| D2 | Retargeting | cada N s |
| D3 | Si pierde objetivo | wander / despawn |

### Bloque E — COMBATE (por ataque)

Repetir filas si hay más de un ataque distinto:

| Campo | Pregunta |
|-------|----------|
| E.id | ID ataque |
| E.kind | ATTACK_KIND |
| E.trigger | cooldown / on hit / phase |
| E.damage | tipo + magnitud |
| E.telegraph | sí/no + duración |
| E.status | slow, burn, … |
| E.VFX/SFX | asset o placeholder |

Si el usuario no conoce términos, ofrecer: **“contacto cuerpo a cuerpo”**, **“proyectil único”**, **“zona en el suelo”**.

### Bloque F — DEFENSA

| # | Pregunta |
|---|----------|
| F1 | HP base (o tier) |
| F2 | Armor conceptual | opcional MVP |
| F3 | Resistencias / debilidades / inmunidades | `damage-types` |
| F4 | Knockback / control immune | boss? |

### Bloque G — RECOMPENSAS

| # | Pregunta |
|---|----------|
| G1 | XP (o derivar de tier) |
| G2 | Drops | ninguno / coins / items |
| G3 | Modificadores si potenciada | pendiente daily boost |

### Bloque H — BESTIARY

| # | Pregunta |
|---|----------|
| H1 | Dificultad declarada | harmless…challenging |
| H2 | Difficulty score estimado | derivado o validador |
| H3 | Ocurrencia | enum |
| H4 | Umbrales custom | null = tabla global |
| H5 | Charm points al completar | rewardPoints |
| H6 | Revelación por etapa | usar reveal estándar o custom |
| H7 | Consejo táctico (`tipKeys`) | |
| H8 | Elegible como potenciada | flags |

### Bloque I — PRESENTACIÓN

| # | Pregunta |
|---|----------|
| I1 | lookType / sprite Tibia | legacyId band |
| I2 | Placeholder aceptable | sí/no |
| I3 | Silueta en unknown | sí |

### Bloque J — VALIDACIÓN (post-implementación)

| Check |
|-------|
| `G.Bestiary.validate(true)` en ?dev |
| Spawn ?dev o spawn test |
| Muerte → kill counter |
| Save reload |
| Segunda run |
| Sin timers/listeners huérfanos |

---

## Plantilla de resumen pre-aprobación

```text
CREATURE INTAKE SUMMARY
ID: ...
Name: ...
Rol / familia / bioma: ...
Spawn: weight ..., tier ..., occurrence ...
Combate: behavior ..., ataques: [...]
Bestiary: difficulty ..., points ..., section bestiary
Riesgos: ...
Pendiente decisión: ...
```

---

## Reglas Cursor

- No inventar ataques, loot ni dificultad en silencio.
- Distinguir **boss** → redirigir a `NEW_BOSS_INTAKE.md`.
- Si falta arte, declarar provisional y usar tuning existente (`tibia-sprite-tuning.js`).

---

## Herramientas (CYC-11, post-aprobación)

| Paso | Comando / archivo |
|------|-------------------|
| Plantilla datos | Copiar `tools/templates/creature.template.js` dentro de `G.CREATURES` |
| Validación cyclopedia | `node tools/validate-cyclopedia.js` |
| Inventario IDs | `node tools/report-cyclopedia-content.js` |
| MVP / combate | `node tools/validate-mvp.js` (regresión slice) |
| Save / charms | `node tools/validate-bestiary-save.js`, `node tools/validate-charms.js` |

La validación incluye una **criatura fixture ficticia** que debe fallar; si el dataset real ya tiene errores, el gate no pasa.