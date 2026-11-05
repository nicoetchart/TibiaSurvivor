# TibiaSurvivor — Implementación del Bestiario por fases controladas

**Estado:** plan ejecutable  
**Versión:** 1.0  
**Fecha:** 2026-11-05  
**Documento rector:** `BESTIARY_TECHNICAL_FUNCTIONAL_BASELINE.md`

<m-toc></m-toc>

## 1. Objetivo

Implementar el Bestiario persistente de TibiaSurvivor mediante cambios pequeños, auditables y reversibles. Cada fase debe producir un incremento funcional verificable, evitar mezclar riesgos y detenerse para aprobación antes de comenzar la siguiente.

La secuencia parte de una auditoría sin cambios de runtime, establece contratos de datos y persistencia, integra el conteo, añade la UI y termina con economía, charms, balance y validación del vertical slice.

## 2. Reglas obligatorias de ejecución

1. No modificar runtime durante la Fase BST-0.
2. No comenzar una fase sin cerrar y aprobar la anterior.
3. No ampliar el alcance por conveniencia técnica.
4. No migrar a TypeScript ni ES modules.
5. No introducir networking, cloud, rankings ni multiplayer.
6. No escribir directamente en `localStorage` fuera de la capa existente.
7. No usar nombres visibles como identidad persistente.
8. No usar assets, textos o datos propietarios.
9. No modificar archivos generados manualmente.
10. No implementar contenido final no definido; usar datos provisionales claramente marcados.
11. Toda fase debe tener rollback limitado a sus propios cambios.
12. Si la implementación real contradice el plan, detenerse y proponer la actualización documental antes de programar.

## 3. Contrato de cierre de cada fase

Al terminar cada fase, entregar exactamente:

### 3.1 Resumen de cambios

- Qué se implementó.
- Qué se dejó fuera.
- Diferencias respecto del alcance aprobado.

### 3.2 Archivos modificados

Por cada archivo:

- ruta;
- símbolos afectados;
- tipo de cambio: nuevo, modificado o retirado;
- motivo.

### 3.3 Pruebas ejecutadas

Por cada prueba:

- comando o procedimiento;
- resultado;
- evidencia observada;
- limitaciones.

### 3.4 Validación de criterios

Marcar cada criterio como:

- `PASS`;
- `FAIL`;
- `NOT TESTED`.

No se permite convertir `NOT TESTED` en `PASS` por inferencia.

### 3.5 Riesgos y deuda

- posibles regresiones;
- supuestos;
- deuda introducida;
- comportamiento pendiente;
- datos provisionales.

### 3.6 Rollback

Explicar cómo deshacer únicamente la fase actual sin revertir trabajo previo aprobado.

### 3.7 Propuesta de siguiente fase

- alcance exacto;
- archivos previstos;
- símbolos previstos;
- riesgos;
- pruebas previstas.

Después del informe, detenerse y esperar aprobación expresa.

## 4. Mapa general

<m-table>
|Fase {ColumnType:"Text"}|Resultado principal {ColumnType:"Text"}|Runtime {ColumnType:"Text"}|
|---|---|---|
|BST-0|Auditoría e integración exacta.|Sin cambios.|
|BST-1|Contrato de datos y validación.|Datos y boot controlado.|
|BST-2|Esquema de persistencia y migración.|Guardado local.|
|BST-3|Conteo canónico y etapas.|Enemy/eventos/Bestiario.|
|BST-4|Recompensas y puntos.|Economía base.|
|BST-5|Pantalla de catálogo y detalle.|UI de menú.|
|BST-6|Notificaciones y resumen de run.|UI durante y después de run.|
|BST-7|Mejoras y desbloqueos.|Economía mixta.|
|BST-8|Charms universales.|Combate y equipamiento.|
|BST-9|Vertical slice y contenido.|Roster completo del primer bioma.|
|BST-10|Telemetría, balance y validación.|Ajustes y cierre.|
</m-table>

## 5. Fase BST-0 — Auditoría de integración

### 5.1 Objetivo

Inspeccionar la implementación real y producir el mapa exacto requerido para BST-1. No modificar archivos de runtime.

### 5.2 Preguntas que debe responder

- ¿Cuál es la identidad neutral vigente de una criatura?
- ¿Dónde se define el roster activo?
- ¿Cómo se crea y destruye una instancia de enemigo?
- ¿Cuál es la única ruta confiable de muerte?
- ¿Existen varias llamadas de muerte, despawn o limpieza?
- ¿Qué event bus existe y qué firma usa?
- ¿Cómo se carga y guarda el perfil `ts.*`?
- ¿Cuál es el esquema actual del save?
- ¿Dónde se inicializan los sistemas y en qué orden?
- ¿Cómo se construye el menú y se registran pantallas?
- ¿Cómo se presentan toasts o avisos durante la run?
- ¿Cómo se construye la pantalla de fin de run?
- ¿Qué adaptadores hacia `G.DEX` siguen activos?
- ¿Qué módulos de progreso, logros o estadísticas pueden reutilizarse?
- ¿Cómo se limpian listeners, timers y estado entre runs?

### 5.3 Archivos mínimos a inspeccionar

Confirmar existencia y contenido antes de asumir nombres:

- `dev.html`;
- `js/main.js`;
- `js/game.js`;
- `js/core/db.js`;
- `js/data/creatures.js`;
- `js/data/enemies.js`;
- `js/entities/enemy.js`;
- `js/systems/combat.js`;
- `js/systems/spawner.js`;
- `js/systems/progress.js`;
- módulo real de eventos;
- `js/ui/menu.js`;
- `js/ui/ui.js`;
- `js/ui/run-ui.js`;
- `js/ui/hud.js`;
- checklist y documentos de decisiones vigentes.

### 5.4 Entregables

- Inventario de archivos y símbolos.
- Flujo de muerte de enemigo, desde daño hasta retiro de instancia.
- Flujo de carga y escritura de save.
- Orden real de scripts y boot.
- Modelo actual de criatura y enemigo.
- Puntos de extensión de UI.
- Diferencias entre código y línea base.
- Lista de riesgos.
- Plan exacto de BST-1.

### 5.5 Criterios de cierre

- Cero archivos de runtime modificados.
- Todas las rutas de muerte identificadas.
- Contrato actual del save documentado.
- Orden de carga confirmado.
- Lista exacta de archivos de BST-1 confirmada.
- Cualquier contradicción con la línea base está documentada.

### 5.6 Rollback

No aplica: la fase es de solo lectura. Eliminar únicamente notas o artefactos temporales generados por la auditoría si fuese necesario.

## 6. Fase BST-1 — Modelo de datos y configuración

### 6.1 Objetivo

Crear el contrato central de Bestiario y registrar entradas declarativas sin implementar todavía progreso persistente ni UI final.

### 6.2 Alcance

- Crear la configuración central.
- Definir dificultades, umbrales provisionales y puntos.
- Extender criaturas con metadatos de Bestiario.
- Definir entradas normales, élite y jefe.
- Añadir validadores.
- Integrar el archivo al orden de carga.
- Añadir consultas de datos puras.

### 6.3 Archivos previstos

Sujetos a BST-0:

- nuevo `js/data/bestiary.js`;
- `js/data/creatures.js`;
- opcional `js/systems/bestiary.js` con funciones puras iniciales;
- `dev.html`;
- `js/main.js` si mantiene una lista `NEED`;
- archivos de i18n si se requieren claves mínimas.

### 6.4 Contratos

- IDs técnicos únicos e inmutables.
- Dificultad válida.
- Tres umbrales crecientes.
- Puntos finitos y no negativos.
- `entryType`: `normal`, `elite` o `boss`.
- Revelaciones declaradas por etapa.
- Sobrescritura opcional por criatura.

### 6.5 Pruebas

- Carga del juego sin errores.
- Validación positiva del roster registrado.
- Casos negativos de ID duplicado, umbral inválido y dificultad desconocida.
- Run existente completa sin usar todavía progreso de Bestiario.
- Segunda run sin recargar.

### 6.6 Criterios de cierre

- Configuración cargada antes de consumidores.
- Todos los IDs son únicos.
- No hay `ReferenceError`, `TypeError` ni `NaN`.
- Las entradas del vertical slice pueden declararse como datos.
- No hay lógica de UI ni persistencia acoplada al archivo de datos.
- Una run existente no se rompe.

### 6.7 Rollback

Retirar los scripts nuevos del orden de carga, revertir extensiones de criaturas y eliminar únicamente los archivos creados en BST-1.

## 7. Fase BST-2 — Persistencia y migración segura

### 7.1 Objetivo

Introducir `save.bestiary` versionado, con defaults, saneamiento, migración y API de escritura local.

### 7.2 Alcance

- Añadir defaults de Bestiario.
- Migrar save existente sin campo `bestiary`.
- Sanear contadores, moneda, compras y equipamiento.
- Conservar IDs desconocidos de forma segura o registrarlos para migración.
- Exponer operaciones de lectura/escritura mediante la capa de DB.
- Mantener `ts.*` como único namespace.

### 7.3 Archivos previstos

- `js/core/db.js`;
- `js/systems/bestiary.js`;
- pruebas o harness de save;
- documentación de esquema.

### 7.4 Pruebas

- Perfil nuevo.
- Save previo sin Bestiario.
- Save con Bestiario válido.
- Save con `kills` negativo, decimal, `NaN`, string o infinito.
- Save con saldo inconsistente.
- Save con charms duplicados.
- Save con criatura desconocida.
- Recarga de página.
- Segunda run.

### 7.5 Criterios de cierre

- El perfil nuevo obtiene defaults válidos.
- Un save previo migra sin perder otros datos.
- El save inválido no bloquea el arranque.
- No se leen saves `ps.*`.
- Ningún consumidor escribe directamente a `localStorage`.
- El progreso persistente no se reinicia al comenzar una run.

### 7.6 Rollback

Revertir el esquema y las funciones de BST-2. Documentar que los campos `bestiary` escritos en saves de prueba pueden permanecer como datos no consumidos.

## 8. Fase BST-3 — Conteo canónico, descubrimiento y etapas

### 8.1 Objetivo

Conectar las muertes válidas al progreso persistente mediante un único evento canónico y conceder etapas sin recompensas económicas todavía.

### 8.2 Alcance

- Confirmar el punto único de muerte.
- Emitir `enemy:defeated` una vez por instancia.
- Distinguir muerte de despawn o cleanup.
- Consumir el evento en `G.Bestiary`.
- Incrementar `kills`.
- Registrar descubrimiento y fechas si corresponden.
- Derivar etapas.
- Emitir eventos de hito.
- Mantener un resumen temporal de avances de la run.

### 8.3 Archivos previstos

- `js/entities/enemy.js`;
- módulo real de eventos;
- `js/systems/bestiary.js`;
- posible integración en `js/systems/progress.js`;
- `js/game.js` para lifecycle, solo si BST-0 lo confirma.

### 8.4 Pruebas

- Muerte por ataque directo.
- Muerte por proyectil.
- Muerte por daño periódico.
- Muerte por efecto de área.
- Múltiples muertes en el mismo frame.
- Intento de procesar dos veces una instancia.
- Despawn sin muerte.
- Cleanup al terminar la run.
- Enemigo marcado sin crédito.
- Élites y jefe.
- Segunda run.

### 8.5 Criterios de cierre

- Cada muerte válida suma exactamente una vez.
- Despawn y cleanup no suman.
- Las tres etapas se derivan correctamente.
- El sistema emite eventos de descubrimiento y etapa una sola vez.
- El progreso persiste tras recarga.
- El resumen temporal se limpia entre runs.
- No hay búsqueda periódica de enemigos muertos ni polling de arrays.

### 8.6 Rollback

Retirar el consumidor de Bestiario y la emisión del evento añadido por la fase. Restaurar la ruta de muerte anterior sin alterar datos de criaturas ni esquema de save.

## 9. Fase BST-4 — Puntos y finalización de entradas

### 9.1 Objetivo

Conceder puntos una sola vez al completar la tercera etapa y exponer una economía segura de solo lectura y recompensa.

### 9.2 Alcance

- Marcar entrada recompensada.
- Incrementar `currency.earned`.
- Calcular saldo disponible.
- Emitir eventos de finalización y cambio de puntos.
- Registrar puntos obtenidos durante la run.
- Añadir herramientas de desarrollo para fijar kills y probar límites.

### 9.3 Pruebas

- Kill justo antes del umbral final.
- Kill exacta del umbral final.
- Kills posteriores al final.
- Recarga y nueva muerte.
- Save con `rewarded: false` y kills sobre el umbral.
- Save con `rewarded: true`.
- Dos criaturas completadas en el mismo frame.
- Entrada normal, élite y jefe.

### 9.4 Criterios de cierre

- Los puntos se conceden exactamente una vez.
- `earned` y saldo son enteros no negativos.
- No existe doble recompensa tras recarga.
- El saldo no depende de la UI.
- Los eventos contienen IDs técnicos y valores correctos.

### 9.5 Rollback

Desactivar la concesión de puntos y eventos de economía, conservando conteo y etapas de BST-3.

## 10. Fase BST-5 — Catálogo y detalle en menú

### 10.1 Objetivo

Añadir una pantalla de Bestiario consultable fuera de la run, con progreso, filtros y revelación gradual.

### 10.2 Alcance

- Agregar acceso desde menú.
- Crear pantalla de catálogo.
- Mostrar progreso total.
- Renderizar estados desconocido, descubierto, etapas y completo.
- Añadir filtros por estado, dificultad y tipo.
- Añadir vista de detalle.
- Ocultar realmente campos no revelados.
- Soportar teclado, mouse y touch.

### 10.3 Archivos previstos

- nuevo `js/ui/bestiary-ui.js`;
- `js/ui/menu.js`;
- `js/ui/ui.js`;
- `dev.html` o shell de pantallas;
- iconos y estilos existentes;
- i18n ES/EN.

### 10.4 Pruebas

- Abrir y cerrar desde menú.
- Perfil sin criaturas descubiertas.
- Estados de todas las etapas.
- Filtros combinados.
- Entrada élite y jefe.
- Cambio de idioma.
- Navegación teclado.
- Touch y viewport pequeño.
- Reiniciar una run después de visitar la pantalla.

### 10.5 Criterios de cierre

- La pantalla abre sin iniciar una run.
- El catálogo refleja el save actual.
- La UI no muta progreso.
- Los datos bloqueados no aparecen en texto ni atributos visibles.
- Los filtros no alteran el orden persistente.
- No hay nombres o referencias heredadas.
- El flujo de menú y una run posterior funcionan.

### 10.6 Rollback

Retirar la entrada de menú, pantalla y script de UI. El progreso y los datos permanecen intactos.

## 11. Fase BST-6 — Notificaciones y resumen de run

### 11.1 Objetivo

Comunicar descubrimientos e hitos sin interrumpir el combate y mostrar un resumen consolidado al finalizar la run.

### 11.2 Alcance

- Cola limitada de notificaciones.
- Avisos de descubrimiento, etapa y finalización.
- Agrupación o secuenciación segura de hitos simultáneos.
- Resumen final de avances.
- Limpieza al pausar, morir, terminar o iniciar una segunda run.

### 11.3 Archivos previstos

- `js/ui/run-ui.js`;
- posible `js/ui/hud.js`;
- `js/systems/bestiary.js`;
- `js/game.js` para lifecycle si procede.

### 11.4 Pruebas

- Un descubrimiento.
- Varias criaturas descubiertas juntas.
- Dos etapas en un mismo frame por herramienta de QA.
- Pausa con aviso visible.
- Muerte con cola pendiente.
- Fin de run con avances.
- Fin de run sin avances.
- Segunda run.

### 11.5 Criterios de cierre

- Los avisos no pausan ni bloquean input.
- Ningún hito se repite.
- La cola tiene límite y se limpia.
- El resumen coincide con el progreso real de la run.
- Una run sin avances no muestra un panel vacío.
- No quedan timers ni DOM residual.

### 11.6 Rollback

Retirar listeners y UI de notificaciones/resumen, preservando el progreso persistente y los eventos.

## 12. Fase BST-7 — Economía mixta

### 12.1 Objetivo

Permitir gastar puntos en mejoras globales moderadas y desbloqueos de contenido mediante transacciones atómicas.

### 12.2 Alcance

- Definir catálogo mínimo de mejoras.
- Definir catálogo mínimo de desbloqueos o stubs validados.
- Implementar compra, coste, nivel y topes.
- Aplicar mejoras de forma idempotente al inicio de run.
- Emitir evento para desbloqueos cuyo dueño sea otro sistema.
- Añadir UI de compra y confirmación.

### 12.3 Restricciones

- No añadir daño global permanente sin aprobación específica.
- No superar topes de balance.
- No duplicar efectos al cargar o iniciar otra run.
- No permitir compra con saldo insuficiente.
- No aplicar parcialmente una compra fallida.

### 12.4 Pruebas

- Compra válida.
- Saldo exacto.
- Saldo insuficiente.
- Compra al nivel máximo.
- Doble clic o doble solicitud.
- Error de persistencia simulado.
- Recarga.
- Segunda run.
- Aplicación una sola vez de cada nivel.

### 12.5 Criterios de cierre

- Toda compra es atómica.
- El saldo nunca es negativo.
- Los topes se respetan.
- Los efectos no se duplican.
- El sistema dueño recibe desbloqueos mediante evento o API documentada.
- Una run sin mejoras sigue siendo viable.

### 12.6 Rollback

Deshabilitar compras y aplicación de efectos. Conservar puntos ganados. Documentar cómo restaurar puntos gastados en saves de prueba si se requiere.

## 13. Fase BST-8 — Charms universales

### 13.1 Objetivo

Implementar equipamiento persistente y al menos un charm universal conectado al combate con límites seguros.

### 13.2 Alcance

- Definiciones de charms como datos.
- Desbloqueo con puntos.
- Slots configurables.
- Equipamiento fuera de la run.
- Hooks de combate.
- Cooldowns, caps y limpieza.
- Métricas de activación y efecto.

### 13.3 Estrategia de entrega

Subdividir si el riesgo lo requiere:

- **BST-8A:** datos, compra, equipamiento y UI sin efectos.
- **BST-8B:** un charm ofensivo.
- **BST-8C:** un charm defensivo o de utilidad.

### 13.4 Pruebas

- Equipar charm bloqueado.
- Equipar charm válido.
- Duplicado.
- Cambio de slot.
- Inicio de run.
- Proc normal.
- Cooldown.
- Múltiples hits en un frame.
- Élites.
- Boss cap.
- Pausa, muerte y fin de run.
- Segunda run.

### 13.5 Criterios de cierre

- Solo charms desbloqueados pueden equiparse.
- No hay duplicados.
- Los procs no se encadenan a sí mismos.
- Los caps contra élite y jefe funcionan.
- Los timers se limpian.
- El equipamiento persiste.
- Las métricas coinciden con el comportamiento observado.
- El charm no trivializa el vertical slice.

### 13.6 Rollback

Deshabilitar hooks de combate y equipamiento, preservando definiciones y puntos. Si hubo compras de prueba, documentar devolución o migración.

## 14. Fase BST-9 — Contenido del vertical slice

### 14.1 Objetivo

Registrar y validar el catálogo completo del primer bioma: 10–15 enemigos, una élite y un jefe.

### 14.2 Alcance

Para cada entrada:

- ID técnico;
- claves i18n;
- familia;
- dificultad;
- tipo normal, élite o jefe;
- umbrales o herencia;
- puntos;
- campos revelables;
- descripción;
- comportamiento;
- habilidades;
- resistencias existentes;
- drops existentes;
- consejos tácticos originales.

### 14.3 Restricciones

- No inventar estadísticas ausentes.
- No duplicar valores de combate: referenciar el modelo de criatura.
- No introducir criaturas aún no jugables.
- No usar nombres, lore o assets propietarios.
- No cerrar el balance solo por intuición.

### 14.4 Pruebas

- Validación completa del roster.
- Spawn y muerte de cada criatura.
- Visualización de cada etapa.
- Entrada élite.
- Entrada de jefe.
- Filtros y orden.
- i18n.
- Save con todo el catálogo.

### 14.5 Criterios de cierre

- Todas las criaturas jugables del vertical slice tienen entrada.
- No existen entradas huérfanas.
- No existen IDs duplicados.
- Élites y jefe están separados.
- Todas las entradas pueden descubrirse y completarse mediante QA.
- La UI no muestra campos inexistentes como datos reales.

### 14.6 Rollback

Revertir únicamente las definiciones de contenido añadidas en BST-9; mantener el sistema genérico.

## 15. Fase BST-10 — Telemetría, balance y validación final

### 15.1 Objetivo

Medir el ritmo real, ajustar parámetros y validar que el Bestiario complementa la run sin dominarla.

### 15.2 Escenarios mínimos

- Varias runs completas con el build base.
- Build fire.
- Build energy.
- Build death.
- Build híbrida.
- Build defensiva.
- Runs con alta y baja densidad de spawn.
- Runs con y sin charm.
- Runs después de compras persistentes.
- Muerte temprana.
- Victoria o final normal.
- Segunda run sin recargar.

### 15.3 Métricas

- kills por criatura/run;
- runs hasta etapas 1, 2 y final;
- puntos por hora;
- porcentaje del catálogo completado;
- frecuencia de élite y jefe;
- gasto por categoría;
- impacto de mejoras en supervivencia;
- activaciones y efecto de charms;
- daño de charms contra normales, élites y jefe;
- errores, duplicados y estado residual.

### 15.4 Preguntas de balance

- ¿Las primeras etapas llegan suficientemente pronto?
- ¿La etapa final requiere varias runs sin convertirse en grind excesivo?
- ¿Las criaturas raras usan umbrales compatibles con su aparición?
- ¿El jefe progresa a un ritmo razonable?
- ¿Los puntos crean elecciones reales?
- ¿Las mejoras respetan la ventaja moderada?
- ¿El charm tiene impacto visible sin ser obligatorio?
- ¿El sistema incentiva jugar el bioma sin distorsionar el objetivo de la run?

### 15.5 Criterios finales

- Cada entrada progresa al ritmo previsto o tiene ajuste documentado.
- Ninguna entrada frecuente se completa accidentalmente demasiado rápido.
- Ninguna entrada del vertical slice tiene un objetivo prácticamente inalcanzable.
- Las mejoras no son obligatorias.
- Los charms no son obligatorios ni desproporcionados.
- No hay doble conteo ni doble recompensa.
- No hay errores nuevos de consola.
- No hay `NaN`.
- No hay listeners, timers o colas residuales.
- Una segunda run funciona.
- Guardado y carga funcionan.
- El build vigente funciona.

### 15.6 Rollback

Revertir únicamente ajustes de configuración y cambios de balance. No retirar la arquitectura validada salvo defecto estructural demostrado.

## 16. Pruebas transversales obligatorias

Repetir cuando corresponda en todas las fases de runtime:

- arranque;
- menú;
- inicio de run;
- movimiento;
- spawn;
- combate;
- muertes;
- pickups;
- XP;
- level-up;
- pausa;
- muerte del jugador;
- resumen final;
- retorno al menú;
- segunda run;
- guardado local;
- carga;
- cambio de idioma;
- consola sin errores nuevos.

Validaciones especiales:

- sin `ReferenceError`;
- sin `TypeError`;
- sin `NaN`;
- sin doble conteo;
- sin doble recompensa;
- sin saldo negativo;
- sin listeners duplicados;
- sin timers activos tras la run;
- sin arrays o colas de crecimiento indefinido;
- sin lógica por nombres visibles;
- sin dependencias online;
- sin assets propietarios.

## 17. Matriz de dependencias

<m-table>
|Fase {ColumnType:"Text"}|Depende de {ColumnType:"Text"}|Puede dividirse {ColumnType:"Text"}|
|---|---|---|
|BST-0|Línea base aprobada.|No.|
|BST-1|BST-0.|Sí, datos y boot.|
|BST-2|BST-1.|Sí, esquema y migraciones.|
|BST-3|BST-2.|Sí, evento y consumidor.|
|BST-4|BST-3.|No recomendado.|
|BST-5|BST-2 y consultas estables.|Sí, catálogo y detalle.|
|BST-6|BST-3 y lifecycle confirmado.|Sí, avisos y resumen.|
|BST-7|BST-4 y BST-5.|Sí, mejoras y desbloqueos.|
|BST-8|BST-4, BST-5 y hooks de combate.|Sí, 8A–8C.|
|BST-9|BST-1 y contenido jugable estable.|Sí, por lotes de criaturas.|
|BST-10|BST-3 a BST-9.|Sí, medición y ajustes.|
</m-table>

## 18. Condiciones de detención inmediata

Detener la fase y reportar antes de continuar si ocurre cualquiera de estas condiciones:

- La ruta de muerte no puede garantizar exactamente un evento.
- El esquema de save real contradice la línea base.
- Un cambio exige leer o mezclar `ps.*`.
- El boot requiere retirar o reactivar sistemas online.
- La fase exige una migración tecnológica no autorizada.
- La UI existente no puede ampliarse sin rediseño general.
- Los datos de criatura carecen de identidad persistente estable.
- Una prueba transversal rompe una run previamente funcional.
- Se detecta contenido o asset propietario en la ruta nueva.
- El rollback de la fase no puede aislarse.

El informe debe explicar el bloqueo, evidencia, alternativas y recomendación. No se debe improvisar una arquitectura alternativa dentro de la misma fase.

## 19. Definition of Done del proyecto de implementación

El plan se considera completado cuando:

1. BST-0 a BST-10 están cerradas o una fase posterior está explícitamente descartada con aprobación.
2. El vertical slice posee Bestiario funcional para todas sus criaturas.
3. El progreso persiste globalmente al perfil.
4. Las tres etapas revelan información táctica gradual.
5. Élites y jefe tienen entradas separadas.
6. Los puntos se conceden exactamente una vez.
7. La economía mixta funciona dentro de límites moderados.
8. Al menos un charm universal está validado.
9. La UI de menú, avisos y resumen funciona en teclado y touch.
10. Guardado, recarga y segunda run pasan.
11. No hay errores nuevos, dobles conteos ni estado residual.
12. La documentación refleja el código final y los valores que siguen provisionales.

## 20. Prompt de inicio recomendado

```text
Quiero comenzar la implementación del Bestiario de TibiaSurvivor.

Lee completos y trata como documentos rectores, en este orden:
1. BESTIARY_TECHNICAL_FUNCTIONAL_BASELINE.md
2. BESTIARY_CONTROLLED_IMPLEMENTATION_PHASES.md
3. MIGRATION_PLAN.md
4. CAVERN_ARCHITECTURE_AUDIT.md
5. MASTER_SORCERER_BASELINE.md

Ejecuta únicamente la Fase BST-0 — Auditoría de integración.

Reglas obligatorias:
- No modifiques ningún archivo de runtime, datos, UI, configuración ni build.
- No implementes todavía el Bestiario.
- No crees stubs funcionales ni cambies el orden de carga.
- No migres a TypeScript ni ES modules.
- No introduzcas networking, cloud, rankings, multiplayer ni assets propietarios.
- No asumas que los nombres de archivos sugeridos existen: confirma la implementación real.
- Si el código contradice los documentos, reporta la diferencia; no la resuelvas programando.

Audita como mínimo:
- identidad persistente actual de criaturas;
- roster activo y contratos de datos;
- ciclo de creación, daño, muerte, despawn y cleanup de enemigos;
- punto único posible para emitir enemy:defeated;
- event bus y firmas existentes;
- esquema real del save ts.* y capa autorizada de persistencia;
- lifecycle de inicio, pausa, muerte, fin y segunda run;
- orden de carga en dev.html y js/main.js;
- integración del menú y registro de pantallas;
- mecanismos actuales de toast, HUD y resumen final;
- adaptadores heredados hacia G.DEX;
- sistemas reutilizables de progreso, estadísticas, logros o upgrades;
- limpieza de timers, listeners, arrays y estado entre runs.

Entrega al finalizar:
1. Resumen ejecutivo de la arquitectura encontrada.
2. Inventario de archivos y símbolos relevantes.
3. Diagrama textual del flujo de muerte de un enemigo.
4. Diagrama textual del flujo de carga y guardado.
5. Orden real de carga e inicialización.
6. Diferencias entre el código y la línea base.
7. Riesgos técnicos y bloqueos.
8. Plan exacto para BST-1 con archivos, símbolos, cambios, pruebas y rollback previstos.
9. Validación de cada criterio de cierre de BST-0 como PASS, FAIL o NOT TESTED.
10. Confirmación explícita de que no se modificó runtime.

Después del informe, detente y espera mi aprobación antes de iniciar BST-1.
```
