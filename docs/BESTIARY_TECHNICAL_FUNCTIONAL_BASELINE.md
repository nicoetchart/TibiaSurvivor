# TibiaSurvivor — Línea base técnica y funcional del Bestiario

**Estado:** línea base aprobable para implementación  
**Versión:** 1.0  
**Fecha:** 2026-11-05  
**Sistema:** Bestiario persistente  
**Producto:** TibiaSurvivor

<m-toc></m-toc>

## 1. Propósito del documento

Este documento define el contrato funcional y técnico del Bestiario de TibiaSurvivor. Su objetivo es permitir una implementación controlada, verificable y desacoplada del contenido concreto del primer bioma.

La implementación debe preservar el motor offline existente, el guardado local bajo el namespace `ts.*`, el modelo de contenido neutral y la duración objetivo de las runs. No autoriza una migración a TypeScript, ES modules, networking ni un rediseño general del motor.

La intención del sistema es adaptar de forma muy fiel la estructura conceptual del Bestiario de Tibia —registro de muertes, dificultad, tres etapas, puntos y charms— al ritmo, balance y UX de un survivor de partidas de 10–15 minutos.

## 2. Visión funcional

El Bestiario es un sistema de metaprogresión persistente que registra las criaturas derrotadas a través de múltiples runs. Cada criatura dispone de una entrada con tres etapas de conocimiento. Alcanzar cada etapa revela información táctica; completar la entrada concede puntos de bestiario.

Los puntos alimentan una economía mixta con tres destinos posibles:

1. **Mejoras globales moderadas:** ventajas persistentes pequeñas y limitadas.
2. **Charms universales:** efectos equipables que funcionan contra cualquier enemigo y no requieren asignación por criatura.
3. **Desbloqueos de contenido:** acceso a opciones definidas por otros sistemas, sin que el Bestiario deba poseer su lógica interna.

El sistema debe reforzar la fantasía central de TibiaSurvivor: “Un survivor de fantasía pixel art donde cada partida reproduce la tensión y progresión de una hunting session de un MMORPG clásico.”

## 3. Decisiones cerradas

<m-table>
|Decisión {ColumnType:"Text"}|Contrato {ColumnType:"Text"}|
|---|---|
|Propósito|Progresión persistente y recompensas.|
|Afinidad|Adaptación muy fiel a la estructura conceptual del Bestiario de Tibia.|
|Progreso|Tres etapas con umbrales escalados por dificultad.|
|Información|Revelación táctica gradual.|
|Crédito de muerte|Todas las muertes válidas de la run cuentan.|
|Persistencia|Perfil global local, compartido entre vocaciones.|
|Economía|Mixta: mejoras globales, charms y desbloqueos.|
|Poder persistente|Ventaja moderada, limitada y con topes estrictos.|
|Charms MVP|Universales.|
|Élites y jefes|Entradas especiales separadas.|
|UX en run|Notificación breve al descubrir una criatura o alcanzar una etapa.|
|MVP|10–15 enemigos del primer bioma, una élite y un jefe.|
</m-table>

## 4. Principios de diseño

### 4.1 La run sigue siendo la fuente principal de poder

La metaprogresión nunca debe garantizar una victoria ni reemplazar las decisiones de build. El nivel, las habilidades, las pasivas, el posicionamiento y la ejecución dentro de cada run deben seguir determinando el resultado.

### 4.2 El progreso debe ser visible, no invasivo

La run solo muestra avisos breves al descubrir una criatura o completar una etapa. La consulta detallada, la compra de recompensas y la configuración de charms ocurren fuera de la run.

### 4.3 Los datos mandan sobre la lógica específica

Dificultades, umbrales, recompensas, revelaciones y clasificación de criaturas deben definirse como datos. No se permiten condicionales por nombre visible ni IDs incrustados en UI o sistemas.

### 4.4 Compatibilidad hacia adelante

El contrato debe soportar más biomas, vocaciones, familias, élites y jefes sin alterar la forma del guardado ni reescribir el sistema de conteo.

### 4.5 IP y contenido original

La arquitectura puede inspirarse en conceptos sistémicos, pero no debe incorporar nombres, textos, sprites, cifras copiadas como balance definitivo ni assets propietarios de Tibia.

## 5. Alcance del MVP

### 5.1 Incluido

- Registro persistente de muertes por criatura.
- Primera detección o descubrimiento.
- Tres etapas de progreso.
- Dificultades configurables.
- Umbrales configurables por dificultad y tipo especial.
- Puntos de bestiario al completar entradas.
- Catálogo del vertical slice: 10–15 criaturas, una élite y un jefe.
- Pantalla de Bestiario accesible desde el menú.
- Filtros mínimos por estado, dificultad y tipo de entrada.
- Vista de detalle con información revelada y oculta.
- Notificaciones breves durante la run.
- Resumen de avances al finalizar la run.
- Persistencia local global al perfil.
- API de economía mixta.
- Implementación mínima de charms universales.
- Telemetría local de depuración y balance.

### 5.2 Fuera de alcance inicial

- Charms asignados por criatura.
- Bosstiary independiente.
- Rotaciones diarias o criaturas potenciadas.
- Sincronización cloud.
- Rankings, cuentas online o multiplayer.
- Importación de datos externos.
- Migración a TypeScript o ES modules.
- Rediseño general del menú o HUD.
- Roster completo de futuros biomas.
- Balance final de costes, umbrales y recompensas.
- Uso de assets propietarios.

## 6. Modelo de progresión

### 6.1 Estados de una entrada

Cada entrada debe derivar uno de los siguientes estados:

- `unknown`: nunca encontrada ni derrotada.
- `discovered`: encontrada o con al menos una muerte válida, pero sin primera etapa.
- `stage_1`: primer umbral alcanzado.
- `stage_2`: segundo umbral alcanzado.
- `completed`: tercer umbral alcanzado y recompensa concedida.

El estado se deriva de `kills` y los umbrales vigentes. No debe guardarse como una segunda fuente de verdad, salvo una versión de migración explícita.

### 6.2 Dificultades

El MVP debe declarar dificultades originales y estables. La siguiente taxonomía es una propuesta inicial, no un balance congelado:

<m-table>
|ID {ColumnType:"Text"}|Uso previsto {ColumnType:"Text"}|Relación esperada {ColumnType:"Text"}|
|---|---|---|
|`trivial`|Criaturas débiles y abundantes.|Más muertes, recompensa baja.|
|`easy`|Amenazas básicas frecuentes.|Progreso temprano.|
|`medium`|Amenazas regulares relevantes.|Progreso intermedio.|
|`hard`|Criaturas peligrosas o menos frecuentes.|Más puntos por finalización.|
|`elite`|Variante especial o élite separada.|Pocas apariciones, umbrales bajos.|
|`boss`|Jefe con entrada propia.|Muy pocas muertes, recompensa alta y controlada.|
</m-table>

No se exige implementar criaturas inofensivas ni una categoría equivalente a `challenging` hasta que el contenido lo necesite.

### 6.3 Umbrales iniciales de calibración

Los valores siguientes son parámetros de prueba para iniciar telemetría. Deben estar centralizados y poder cambiarse sin migrar el guardado.

<m-table>
|Dificultad {ColumnType:"Text"}|Etapa 1 {ColumnType:"Number"}|Etapa 2 {ColumnType:"Number"}|Final {ColumnType:"Number"}|Puntos base {ColumnType:"Number"}|
|---|---:|---:|---:|---:|
|`trivial`|10|50|150|1|
|`easy`|10|40|100|3|
|`medium`|5|25|75|5|
|`hard`|5|15|40|8|
|`elite`|1|5|15|10|
|`boss`|1|3|5|15|
</m-table>

Reglas:

- Los umbrales deben cumplir `stage1 < stage2 < final`.
- Los valores se ajustan según frecuencia real de aparición y muertes medias por run.
- La dificultad no puede calcularse únicamente desde HP o XP; debe declararse en los datos de contenido.
- Una criatura rara puede sobrescribir los umbrales de su dificultad mediante `bestiary.thresholds`.
- Los puntos se conceden una sola vez al completar la entrada.

### 6.4 Objetivo de ritmo

Como hipótesis de balance inicial:

- Una entrada frecuente de nivel bajo debería completar sus primeras etapas en las primeras runs y requerir varias runs para finalizar.
- Una criatura media o difícil debe progresar de forma perceptible sin exigir grind incompatible con el catálogo disponible.
- Una élite debe poder completarse durante una cantidad razonable de encuentros del vertical slice.
- Un jefe debe tener un objetivo bajo, pues normalmente aparece una vez por run o bajo condiciones especiales.

La Fase de balance debe sustituir estas hipótesis por datos observados.

## 7. Revelación táctica gradual

### 7.1 Desconocida

- Silueta o marcador oculto.
- Sin nombre real.
- Sin estadísticas.
- Puede mostrar `???` y la ubicación de la entrada en la categoría si el diseño lo requiere.

### 7.2 Descubierta

- Nombre.
- Sprite o retrato.
- Categoría o familia.
- Contador actual y próximo hito.
- Bioma donde fue encontrada, si el dato existe.

### 7.3 Etapa 1 — Identificación

- Descripción breve.
- Dificultad.
- Vida base o rango de vida.
- XP concedida.
- Patrón general: melee, ranged, charger, summoner u otro tag de comportamiento.

### 7.4 Etapa 2 — Análisis

- Daño o amenaza relativa.
- Velocidad.
- Habilidades relevantes.
- Tipos de daño usados.
- Resistencias y debilidades implementadas.
- Rasgos especiales: vuelo, intangibilidad, huida, invocación o telegraph.

### 7.5 Etapa 3 — Dominio

- Tabla de recompensas o pickups relevantes si existe.
- Consejos tácticos.
- Sinergias o counters.
- Estadísticas acumuladas: muertes, runs encontradas y muertes por fuente, cuando estén disponibles.
- Puntos concedidos.
- Estado completo.

Los campos no implementados por el motor deben omitirse o mostrarse como “No disponible”; nunca deben inventarse.

## 8. Crédito de muertes

### 8.1 Regla funcional

Toda muerte válida de una criatura activa durante una run incrementa exactamente una vez su contador, independientemente de si el daño final provino de:

- habilidad directa;
- proyectil;
- daño periódico;
- estado elemental;
- efecto de área;
- pasiva;
- summon o aliado controlado por el jugador;
- hazard generado por una habilidad del jugador.

### 8.2 Exclusiones

No cuentan:

- criaturas eliminadas por limpieza técnica;
- despawn por distancia, cambio de escena o fin de run;
- instancias de prueba marcadas `noBestiaryCredit`;
- duplicados visuales o proxies;
- muerte procesada más de una vez;
- enemigos creados fuera de una run válida, salvo herramientas de QA que lo habiliten expresamente.

### 8.3 Evento canónico

Debe existir un único evento de dominio emitido una sola vez después de confirmar la muerte:

```js
G.Events.emit('enemy:defeated', {
  creatureId,
  instanceId,
  isElite,
  isBoss,
  sourceKind,
  runId,
  timestamp
});
```

`creatureId` es la identidad persistente. `instanceId` permite deduplicar. El Bestiario consume este evento; no debe detectar muertes recorriendo arrays ni depender del HUD.

## 9. Contrato de datos

### 9.1 Definición de criatura

La entrada del Bestiario debe extender el modelo neutral de criatura, no duplicar sus estadísticas de combate.

```js
{
  id: 'cave_rat',
  nameKey: 'creature.cave_rat.name',
  descriptionKey: 'creature.cave_rat.description',
  family: 'beast',
  difficulty: 'trivial',
  tags: ['melee', 'ground'],
  bestiary: {
    enabled: true,
    entryType: 'normal', // normal | elite | boss
    thresholds: null,   // null = usar dificultad
    rewardPoints: null, // null = usar dificultad
    reveal: {
      stage1: ['hp', 'xp', 'behavior'],
      stage2: ['damage', 'speed', 'abilities', 'resistances'],
      stage3: ['drops', 'tips', 'statistics']
    },
    tipKeys: []
  }
}
```

### 9.2 Configuración central

Archivo sugerido: `js/data/bestiary.js`.

Debe contener:

- versión del contrato;
- dificultades;
- umbrales;
- puntos base;
- orden de categorías;
- reglas de entradas especiales;
- definiciones de charms universales;
- límites de mejoras globales;
- flags de depuración.

No debe contener progreso del jugador ni referencias al DOM.

### 9.3 Validación al cargar

La validación debe detectar y reportar:

- IDs duplicados;
- criatura habilitada sin dificultad válida;
- umbrales ausentes o desordenados;
- recompensa negativa o no finita;
- campos de revelación desconocidos;
- charm con ID duplicado;
- costes negativos;
- referencias a criaturas inexistentes;
- entrada especial sin `entryType` correcto.

En desarrollo, la validación debe fallar de forma visible. En producción, un registro inválido debe deshabilitarse sin bloquear el arranque completo.

## 10. Persistencia

### 10.1 Ámbito

El progreso pertenece al perfil local global y se comparte entre todas las vocaciones y runs. No debe guardarse dentro del estado temporal de una run.

### 10.2 Esquema sugerido

```js
save.bestiary = {
  version: 1,
  entries: {
    cave_rat: {
      kills: 0,
      rewarded: false,
      firstSeenAt: null,
      lastKilledAt: null,
      runsEncountered: 0
    }
  },
  currency: {
    earned: 0,
    spent: 0
  },
  charms: {
    unlocked: [],
    equipped: []
  },
  upgrades: {},
  unlocks: []
};
```

### 10.3 Invariantes

- `kills` es entero no negativo.
- `earned - spent` es el saldo disponible y nunca puede ser negativo.
- La finalización otorga puntos una sola vez.
- Equipar un charm no puede duplicarlo.
- IDs desconocidos en el guardado se conservan o migran de forma explícita; no deben provocar crash.
- El guardado inválido debe recuperarse con defaults seguros.
- Ninguna run debe reiniciar progreso persistente.
- Una segunda run debe funcionar sin recargar la página.

### 10.4 Namespace y escritura

La persistencia debe integrarse en el esquema `ts.*` ya establecido. No se permite leer ni mezclar progreso desde saves antiguos `ps.*`.

La escritura debe realizarse mediante la capa de base de datos local existente. La UI y el sistema de eventos no deben escribir directamente en `localStorage`.

## 11. Economía mixta

### 11.1 Moneda

Nombre de trabajo: `bestiaryPoints`. El nombre visible final debe definirse mediante i18n y no usarse como ID técnico.

Saldo:

```text
available = earned - spent
```

### 11.2 Mejoras globales

Condiciones obligatorias:

- topes estrictos;
- efectos pequeños;
- costes crecientes;
- ninguna mejora debe ser necesaria para completar una run;
- ninguna mejora puede anular la fragilidad de la vocación;
- efectos declarados como datos;
- aplicación idempotente al iniciar una run.

Categorías recomendadas para el MVP:

- utilidad: radio de pickup, reroll o información;
- supervivencia moderada: vida máxima limitada;
- movilidad moderada: velocidad limitada;
- economía de run: pequeña ventaja inicial.

Daño global permanente debe quedar deshabilitado inicialmente o sujeto a una revisión de balance específica.

### 11.3 Desbloqueos de contenido

El Bestiario solo registra la compra y emite un evento. El sistema dueño del contenido valida y aplica el desbloqueo.

```js
G.Events.emit('bestiary:unlock-purchased', {
  unlockId,
  cost
});
```

No se deben incrustar reglas de vocaciones, biomas o habilidades dentro de `bestiary.js`.

## 12. Charms universales

### 12.1 Principio

Los charms del MVP son universales: una vez equipados, pueden activarse contra cualquier enemigo válido. No se asignan a una especie ni requieren una entrada específica completada.

### 12.2 Contrato sugerido

```js
{
  id: 'wound',
  nameKey: 'charm.wound.name',
  descriptionKey: 'charm.wound.description',
  trigger: 'onHit',
  maxLevel: 1,
  cost: 20,
  procChance: 0.03,
  cooldownMs: 1000,
  effect: {
    kind: 'bonusDamage',
    damageType: 'physical',
    scale: 'targetMaxHp',
    value: 0.01,
    bossCap: 0.0025
  }
}
```

Todos los valores son de calibración y deben vivir en datos.

### 12.3 Reglas mínimas

- Número de slots inicial configurable; propuesta: uno.
- No se puede equipar un charm bloqueado.
- No se puede equipar el mismo charm dos veces.
- Los procs deben tener límites contra élites y jefes.
- Los procs no pueden encadenarse a sí mismos.
- Timers y estados se limpian al pausar, morir o terminar la run.
- El cambio de equipamiento ocurre fuera de la run.
- El sistema de combate recibe modificadores mediante hooks, no mediante condicionales por ID de criatura.

### 12.4 Charms iniciales recomendados para validar arquitectura

Implementar un catálogo mínimo, no definitivo:

1. Un charm ofensivo con daño adicional limitado.
2. Un charm defensivo con probabilidad limitada de mitigar un impacto.
3. Un charm de utilidad asociado a pickups o movilidad temporal.

La Fase MVP puede implementar solo uno y registrar los otros como datos bloqueados si eso reduce riesgo.

## 13. Arquitectura de runtime

### 13.1 Módulos sugeridos

<m-table>
|Archivo {ColumnType:"Text"}|Responsabilidad {ColumnType:"Text"}|
|---|---|
|`js/data/bestiary.js`|Configuración, dificultades, charms y validadores de datos.|
|`js/systems/bestiary.js`|Conteo, etapas, recompensas, consultas y eventos.|
|`js/ui/bestiary-ui.js`|Catálogo, filtros, detalle, economía y equipamiento.|
|`js/ui/run-ui.js`|Notificaciones breves y resumen de avances.|
|`js/core/db.js`|Defaults, saneamiento, carga, guardado y migración.|
|`js/entities/enemy.js`|Emisión única de derrota o integración con evento canónico.|
|`js/systems/progress.js`|Puente opcional de eventos y estadísticas de run.|
|`js/systems/combat.js`|Hooks de charms, sin poseer progreso del Bestiario.|
|`js/main.js` / `dev.html`|Orden de carga e inicialización.|
</m-table>

Los nombres finales deben confirmarse durante la auditoría de integración.

### 13.2 API mínima

```js
G.Bestiary.init(save);
G.Bestiary.onEnemyDefeated(payload);
G.Bestiary.getEntry(creatureId);
G.Bestiary.listEntries(filters);
G.Bestiary.getAvailablePoints();
G.Bestiary.purchaseUpgrade(upgradeId);
G.Bestiary.purchaseUnlock(unlockId);
G.Bestiary.unlockCharm(charmId);
G.Bestiary.equipCharm(charmId, slot);
G.Bestiary.getRunAdvances();
G.Bestiary.flush();
```

Cada operación de gasto debe ser atómica: validar, mutar, persistir y emitir resultado. Si falla la persistencia, no debe quedar una compra parcialmente aplicada.

### 13.3 Eventos de dominio

Eventos recomendados:

- `bestiary:creature-discovered`
- `bestiary:kill-recorded`
- `bestiary:stage-completed`
- `bestiary:entry-completed`
- `bestiary:points-changed`
- `bestiary:purchase-completed`
- `bestiary:charm-equipped`

Los consumidores de UI escuchan estos eventos; el sistema de Bestiario no manipula directamente pantallas durante el conteo.

### 13.4 Orden de carga

Orden conceptual:

1. utilidades y namespace `G`;
2. base de datos y settings;
3. datos de daño, criaturas y Bestiario;
4. sistemas de eventos, Bestiario y combate;
5. entidades;
6. UI;
7. flujo principal y boot.

El orden exacto debe validarse contra `dev.html`, `js/main.js` y la lista real de dependencias antes de modificar runtime.

## 14. Experiencia de usuario

### 14.1 Acceso desde menú

Agregar una entrada `Bestiario` en el menú offline. La pantalla debe abrir sin iniciar una run.

### 14.2 Vista de catálogo

Debe incluir:

- progreso total: entradas descubiertas, completadas y puntos;
- tarjetas o filas de criaturas;
- estado visual `unknown`, `discovered`, etapas y completada;
- contador `actual / próximo umbral`;
- filtros por estado, dificultad y tipo;
- orden estable;
- soporte de teclado, touch y resolución móvil.

### 14.3 Vista de detalle

Debe mostrar solo la información desbloqueada. Los campos futuros permanecen ocultos, no atenuados con su valor real en el DOM.

### 14.4 Notificación durante run

Mostrar únicamente cuando ocurra:

- primer descubrimiento;
- etapa alcanzada;
- entrada completada.

Reglas:

- no pausar la run;
- duración breve;
- cola con límite;
- agrupar múltiples muertes del mismo frame;
- no repetir el mismo hito;
- respetar reducción de efectos si existe.

### 14.5 Resumen final

La pantalla de fin de run debe mostrar:

- criaturas con avance;
- muertes ganadas en la run;
- etapas alcanzadas;
- puntos obtenidos;
- nuevas entradas completadas.

Una run sin avances no debe mostrar un bloque vacío.

## 15. Telemetría local de balance

Registrar durante desarrollo:

- muertes por criatura y por run;
- primera run de descubrimiento;
- runs hasta cada etapa;
- tiempo hasta cada etapa;
- frecuencia de aparición;
- puntos ganados por hora de juego;
- compras por categoría;
- charms equipados;
- activaciones, daño, mitigación y utilidad por charm;
- rendimiento contra élites y jefe.

La telemetría es local y no requiere red. Debe poder exportarse desde herramientas de desarrollo sin formar parte del guardado esencial.

## 16. Invariantes y controles de seguridad

- Una instancia muerta incrementa como máximo una vez.
- Completar una entrada otorga puntos exactamente una vez.
- Ningún contador puede ser `NaN`, infinito o negativo.
- Ningún gasto puede dejar saldo negativo.
- La UI no es fuente de verdad.
- Los nombres visibles no son IDs.
- El cambio de idioma no afecta progreso.
- Un roster reordenado no afecta progreso.
- Un ID eliminado no bloquea carga.
- Cerrar o recargar después de guardar conserva el progreso.
- Terminar una run limpia timers, procs y colas de notificaciones.
- Una segunda run funciona sin recargar.
- No se introducen assets propietarios.

## 17. Criterios de aceptación del MVP

### 17.1 Funcionales

- El menú abre el Bestiario.
- Las criaturas desconocidas están ocultas correctamente.
- Una muerte válida incrementa el ID correcto.
- Las tres etapas se alcanzan en sus umbrales.
- Cada etapa revela únicamente sus campos.
- La finalización entrega puntos una sola vez.
- Élites y jefe poseen entradas separadas.
- Los puntos persisten entre runs y recargas.
- La economía rechaza compras sin saldo.
- Al menos un charm universal puede desbloquearse, equiparse y activarse.
- El resumen de run refleja los avances reales.

### 17.2 Técnicos

- Sin `ReferenceError`, `TypeError` ni `NaN` nuevos.
- Sin doble conteo de muertes.
- Sin escritura directa a `localStorage` fuera de la capa autorizada.
- Sin dependencias online.
- Sin lógica dependiente del nombre visible.
- Sin timers o listeners residuales al terminar una run.
- El sistema soporta una segunda run sin recargar.
- El guardado inválido no bloquea el arranque.
- El build vigente continúa funcionando.

### 17.3 Balance

- El primer hito de criaturas frecuentes es alcanzable temprano.
- El catálogo no se completa totalmente en una sola run normal.
- El jefe no exige una cantidad incompatible con una aparición por run.
- Las mejoras persistentes no trivializan el vertical slice.
- Los charms no generan cadenas infinitas ni daño desproporcionado contra bosses.

## 18. Pruebas mínimas

### 18.1 Unitarias o de harness

- derivación de etapa para límites exactos;
- validación de configuración;
- deduplicación por `instanceId`;
- concesión única de puntos;
- saldo y compras atómicas;
- saneamiento del guardado;
- equipamiento de charms;
- cap y cooldown de procs;
- migración desde save sin `bestiary`.

### 18.2 Integración

- enemigo normal derrotado;
- daño periódico como fuente final;
- élite derrotada;
- jefe derrotado;
- múltiples muertes en el mismo frame;
- pausa durante una notificación;
- muerte del jugador con cola pendiente;
- fin de run y resumen;
- recarga de página;
- segunda run;
- cambio de idioma;
- criatura deshabilitada o ID desconocido.

### 18.3 Regresión transversal

- movimiento;
- spawn;
- combate;
- XP;
- level-up;
- pausa;
- muerte;
- retorno al menú;
- guardado local;
- carga;
- consola limpia.

## 19. Riesgos

<m-table>
|Riesgo {ColumnType:"Text"}|Mitigación {ColumnType:"Text"}|
|---|---|
|Doble conteo por múltiples rutas de muerte.|Evento canónico y deduplicación por instancia.|
|Acoplamiento a `G.DEX` o forma heredada.|Usar `creatureId` neutral y adaptador temporal documentado.|
|Corrupción o incompatibilidad del save.|Versión, defaults, saneamiento y migraciones explícitas.|
|Exceso de poder persistente.|Topes, costes crecientes y telemetría.|
|Charms desbalanceados contra bosses.|Caps, cooldowns y pruebas específicas.|
|Boot roto por orden concatenado.|Auditoría previa y cambio conjunto de HTML/NEED/init.|
|UI filtra datos bloqueados.|Construir el modelo visible desde campos desbloqueados.|
|Umbrales incompatibles con spawn real.|Centralización y calibración por muertes/run.|
|ID renombrado pierde progreso.|IDs técnicos inmutables y migración declarada.|
|Uso accidental de IP externa.|Contenido, nombres y assets originales.|
</m-table>

## 20. Parámetros pendientes de balance

La implementación puede comenzar sin cerrar estos valores, siempre que permanezcan configurables:

- nombre visible de los puntos;
- umbrales definitivos;
- puntos definitivos;
- catálogo final de mejoras;
- costes;
- cantidad final de slots de charm;
- charms definitivos;
- textos de lore y consejos;
- familias definitivas;
- iconografía y arte final.

No se debe bloquear la arquitectura esperando contenido final. Tampoco deben presentarse los valores provisionales como balance aprobado.

## 21. Definition of Done del sistema

El Bestiario se considera implementado para el vertical slice cuando:

1. El roster objetivo está registrado mediante datos válidos.
2. Todas las muertes válidas progresan una entrada correcta y una sola vez.
3. Las etapas, revelaciones y puntos funcionan y persisten.
4. La pantalla de menú y las notificaciones cumplen la UX definida.
5. Élites y jefe tienen entradas separadas.
6. La economía mixta posee contratos funcionales y al menos una ruta de cada categoría puede validarse o quedar explícitamente bloqueada por datos.
7. Al menos un charm universal funciona con límites seguros.
8. Todas las pruebas obligatorias pasan o están documentadas como `NOT TESTED` con motivo.
9. Una segunda run funciona sin recarga y sin estado residual.
10. El cierre de fase documenta cambios, pruebas, riesgos y rollback.
