# TibiaSurvivor — Estándar de datos: criaturas, bosses y Cyclopedia

Convenciones: namespace `G.`; IDs string `snake_case` estables; textos vía `nameKey` / `descriptionKey`; persistencia solo IDs + contadores.

---

## 1. Contratos conceptuales → archivos destino

| Contrato | Propósito | Persistir | Archivo objetivo |
|----------|-----------|-----------|------------------|
| `CreatureDefinition` | Identidad, familia, rol, bioma, ocurrencia declarada | No | `js/data/creatures.js` → split CYC-2 |
| `CreatureCombatProfile` | hp/spd/dmg/xp para spawn | No | `neutral-roster.js` o embebido en definition |
| `CreatureBehaviourDefinition` | behaviors, targeting implícito | No | `creatures.js` + behaviors registry |
| `CreatureAttackDefinition` | Ataques data-driven (futuro) | No | `js/data/attacks/` (reservado) |
| `CreatureSpawnProfile` | weight, tier, unlock | No | `creatures.js` + `mvp-config.js` |
| `CreatureBestiaryProfile` | section, difficulty, reveal, tips | No | `bestiary` nested en creature |
| `BossDefinition` | Extiende creature; categoría encuentro | No | `js/data/bosses.js` (CYC-5) |
| `BossPhaseDefinition` | HP%/time triggers | No | bosses.js |
| `BossAttackDefinition` | id, telegraph, cooldown | No | bosses.js |
| `BossSpawnProfile` | timed, rift, final | No | bosses.js + spawner hooks |
| `BosstiaryProfile` | bossCategory, rewardPoints | No | nested bestiary |
| `CharmDefinition` | Catálogo charm | No | `bestiary.js` CHARMS |
| `BestiaryProgress` | kills, rewarded, timestamps | Sí | `save.cyclopedia` |
| `BosstiaryProgress` | igual schema, boss stats opcionales | Sí | save |
| `CharmLoadout` | equipped[] | Sí | save |
| `DailyBoostState` | day, picks, history | Sí | save |
| `CyclopediaSaveSection` | schemaVersion, blobs anteriores | Sí | `db.js` migrate |

---

## 2. CreatureDefinition (mínimo)

```javascript
{
  id: 'cat',                    // requerido, único
  legacyId: 99002,              // requerido sprite
  nameKey: 'creature.cat.name',
  descriptionKey: 'creature.cat.description',
  family: 'beast',              // enum Family (lore / filtros)
  bestiaryClass: 'mammal',      // enum Class (D3 charms); nombres TS, inspirado en Cyclopedia Classes
  role: 'enemy',                // enum Role
  biome: ['plains_of_havoc'],   // array
  occurrence: 'common',         // enum Occurrence
  difficultyDeclared: 'harmless',
  tags: ['melee', 'ground'],
  spawn: { weight: 1.2, maxSimultaneous: null, spawnModes: ['hp_band', 'fixed_event'] },
  hp: 20,                       // D7: HP literal = combate al spawn (bestiary muestra este valor)
  speed: 56,
  attack: 1.0,
  combat: { behavior: 'chase', dmg: null, xp: null }, // dmg/xp derivados o explícitos
  elemental: { damageTypes, weaknesses, resistances, immunities },
  bestiary: { enabled, section: 'bestiary', reveal, tipKeys },
  flags: { boostEligible: true, tutorial: false }
}
```

**Validaciones:** `id` único; `legacyId` en 99001–99099; si `bestiary.enabled` → `reveal` completo; `occurrence` coherente con `spawn.weight`.

**Consumidores runtime:** `NeutralRoster`, `Enemy`.  
**Consumidores UI:** `BestiaryUI`, `Cyclopedia.getDetail`.

**`legacyId`:** banda 99001–99099 es MVP; catálogo objetivo 2000+ criaturas → ampliar contrato de sprites (P1 en decisiones).

---

## 2.1 Spawn por bandas de HP (D7 — decisión cerrada)

**Modo:** `G.MvpConfig.SPAWN_MODE = 'hp_band'` (neutral).

| Concepto | Contrato |
|----------|----------|
| HP autoritativo | `creature.hp` (y daño declarado) |
| Presión de run | `H_target(t)` en config, no `hpMulRun` global |
| Selección | Criaturas con `hp ∈ [H_target - δ, H_target + δ]`, luego `spawnWeight` |
| Fallbacks | Ensanchar banda → criatura más cercana → log ?dev |
| Boss en banda | `spawnModes` incluye `hp_band` + `bossCategory`; puede compartir pool si HP encaja (Bane) |
| Encuentros fijos | `fixed_timer`, `rift`, `final_nemesis` fuera del pick aleatorio o con prioridad |

**Rango de HP de diseño (largo plazo):** desde criaturas iniciales (~15–40) hasta entradas de caza tardía (**5 000 – 20 000+** HP declarados), según import Tibia. La curva `H_target(t)` debe **acelerarse** para runs desafiantes de 10–15 min; `D_target(t)` y XP alineados en el mismo tramo de implementación (CYC-2).

**Validador:** para cada segundo bucket de la run, ∃ al menos una criatura registrada en banda; aviso si `H_target(max)` &gt; max `hp` del pool sin boss de banda.

**Deprecated en este modo:** `TIER_STATS` como origen de HP; multiplicador de cap 1.6× solo HP.

---

## 3. BossDefinition (mínimo)

```javascript
{
  id: 'orshabaal',
  combatCreatureId: 'orshabaal',
  bossCategory: 'nemesis',       // bane | archfoe | nemesis
  encounter: {
    kind: 'final_timer',         // enum SpawnType boss_encounter
    atRunSec: 780,
    arena: null,                 // futuro teletransporte
    cooldownRealHours: null      // offline: N/A for nemesis
  },
  phases: [
    { id: 'default', untilHpPct: 0.5, attacks: ['slam','rain','beam','summon'] },
    { id: 'fury', untilHpPct: 0, enrage: true }
  ],
  attacks: { /* ref AttackDefinition */ },
  rewards: { firstKillBonus: null, repeat: 'standard' },
  bestiary: { section: 'bosstiary', rewardPoints: 100 }
}
```

**Prohibido:** transiciones solo con booleans en `Enemy` sin tabla fases.  
**MVP bridge:** `Enemy.bossInit()` lee `G.BossRegistry.getPhaseKit(id)`.

---

## 4. Taxonomía cerrada

### ROLE
`fodder`, `swarm`, `bruiser`, `tank`, `ranged`, `artillery`, `assassin`, `controller`, `support`, `summoner`, `elite`, `miniboss`, `boss`

**Mapeo actual:** behaviors `chase`, `ranged`, `tank`, `summoner` → inferir role en CYC-2; `black_knight` → `elite`+boss kit.

### BEHAVIOUR
`chase`, `keep_distance`, `orbit`, `strafe`, `charge`, `flee`, `stationary`, `patrol`, `teleport`, `ambush`, `summon`, `phase_driven`, plus legacy `runner`, `jumper`, `fan`, `beamer`, `zoner`, `healer`, `bomber`, `thief`

**Reservado:** `phase_driven` hasta CYC-5.

### TARGETING
`nearest`, `lowest_health`, `highest_health`, `player_position`, `predicted_position`, `random_valid`, `fixed_direction`, `area_denial`

**Mapeo actual:** implícito nearest en `Enemy.update`.

### ATTACK_KIND
`contact`, `projectile`, `burst`, `cone`, `wave`, `beam`, `nova`, `ground_zone`, `charge`, `dash`, `summon`, `aura`, `delayed_strike`, `rotating_pattern`

**Boss actual:** slam, dash, leap, rain, beam → mapear a kinds.

### SPAWN_TYPE
`regular`, `timed`, `wave`, `event`, `ambush`, `conditional`, `elite_conversion`, `boss_encounter`, `summoned`

### DIFFICULTY (TibiaSurvivor escala original — compatible con existente)
`harmless`, `trivial`, `easy`, `medium`, `hard`, `challenging`, `elite` (very rare creature), reservado `boss` solo legacy rows.

### OCCURRENCE (nuevo)
`common`, `uncommon`, `rare`, `very_rare`

**Derivación sugerida:**

```text
occurrenceScore =
  normalize(spawnWeight) * 0.45
  + (1 - tier/3) * 0.25
  + unlockEarlyBonus * 0.15
  + eventGuaranteedBonus * 0.15

// Map score → band; warn if != declared occurrence
```

### Combinaciones prohibidas (advertencia validator)

| Combo | Razón |
|-------|-------|
| `role: boss` + `bestiary.section: bestiary` | Usar bosstiary |
| `bossCategory` sin `section: bosstiary` | Inválido |
| `spawn.weight: 0` + `boostEligible: true` | Imposible boost |
| `summoned` + `bestiary.enabled` | Salvo excepción documentada |

---

## 5. Cálculo difficulty score (validación)

```text
function estimateDifficultyScore(def, combatProfile):
  effHp = combatProfile.hp * armorFactor(def)
  dps = combatProfile.dmg * attackRate(def.behavior)
  burst = maxSingleHit(def) // boss beam etc.
  mobility = combatProfile.spd / 60
  control = countStatusEffects(def)
  summons = def.behaviors includes summoner ? 1 : 0
  score = log(effHp) * 1.2 + dps * 0.08 + burst * 0.05 + mobility * 0.4 + control * 0.5 + summons * 0.8
  return score

function validateDifficulty(declared, score):
  band = DIFFICULTY_BANDS[declared]  // min/max score per tier
  if score outside band → warning (no block en MVP)
```

Factores ya en datos: `hp`, `attack`, `speed`, resistencias, shotCd, tier.

---

## 6. Charms MVP propuestos (no implementados en CYC-0)

| ID | Nombre | Cat. | Trigger | Efecto (conceptual) | CD | P% | Elite | Boss | Riesgo |
|----|--------|------|---------|---------------------|----|----|-------|------|--------|
| `wound` | Persistent wound | ofensivo | onHit | % maxHp bonus dmg | 1s | 3% | half scale | cap 0.25% | bajo (exists) |
| `parry` | Steadfast parry | defensivo | onHitTaken | mitigate % | 2s | 2% | same | same | bajo |
| `stride` | Stride | movilidad | onPickup | speed burst | 1.5s | 4% | — | — | bajo |
| `hex` | Hex mark | control | onHit | slow 15% 0.8s | 2.5s | 5% | resist 50% | immune | medio |
| `sap` | Essence siphon | sustain | onKill | heal 0.3% maxHp | 0.5s | 100% kill | — | 0.1% | medio |
| `bounty` | Scavenger's eye | economía | onKill | +1 coin small | 0.2s | 15% | 2x coins | 0 | bajo (coins exist) |
| `flare` | Opening flare | ofensivo | onCast | next hit +8% dmg | 3s | 25% on cast | — | half | medio |
| `ward` | Hunt ward | defensivo | onSpawnNear | shield 4% hp once/30s | 30s | 100% | — | — | medio |

Telemetría: `procLock`, damage tag `charm`, tier split (ya en `bestiary-charms.js`).

---

## 7. Daily boost valores iniciales (config)

```javascript
// conceptual G.Cyclopedia.DAILY_BOOST_DEFAULTS
{
  creature: {
    xpMul: 1.10,
    bestiaryKillMul: 1.25,
    spawnWeightMul: 1.35,
    lootChanceMul: 1.15
  },
  boss: {
    bosstiaryKillMul: 1.5,
    extraBossPointOnKill: 5,      // si se separan boss points
    damageTakenMul: 1.05         // riesgo
  },
  rotation: { utc: true, noRepeatDays: 3 }
}
```

---

## 8. CyclopediaSaveSection (objetivo)

```javascript
{
  schemaVersion: 1,
  bestiary: { entries: {}, charmPoints: 0, spentCharmPoints: 0 },
  bosstiary: { entries: {}, bossPoints: 0 },
  charms: { unlocked: [], equippedByClass: {} },
  daily: { dayUtc: '20261121', creatureId, bossId, history: [] }
}
```

Migración v1: copiar `save.bestiary` → `cyclopedia.bestiary`; bosstiary entries = filter section en catálogo.

---

## 9. Herramientas de autoría (propuesta CYC-11)

| Herramienta | Función |
|-------------|---------|
| `validate-cyclopedia.js` | CreatureDefinition + refs |
| `validate-attacks.js` | cooldowns, telegraph |
| `validate-boss-phases.js` | transiciones |
| `report-cyclopedia-content.js` | listado IDs |
| Plantilla `tools/templates/creature.template.js` | copy-paste |
| Checklist | `NEW_CREATURE_INTAKE.md` |

Sin nueva toolchain: Node + vm como validadores actuales.