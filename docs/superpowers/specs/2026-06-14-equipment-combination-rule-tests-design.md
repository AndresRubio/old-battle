# Tests de combinaciones de equipamiento contra el reglamento de 5ª ed.

**Fecha:** 2026-06-14
**Estado:** Diseño aprobado (pendiente de revisión de spec)

## Contexto y problema

La app es un creador de ejércitos de Warhammer 5ª edición. Cada unidad ofrece
opciones de equipamiento (`EquipmentOption`) que se activan como **casillas
independientes** (`toggleOption` en `src/state/rosterOps.ts:66`); lo único
mutuamente excluyente hoy son los niveles de hechicero.

`validateRoster` (`src/rules/validate.ts`) valida puntos, General, composición
por porcentajes, tamaños de unidad y objetos mágicos — pero **no comprueba
nada sobre combinaciones de equipo**. En consecuencia, hoy se puede construir,
p. ej., un modelo con "Lanza" + "Alabarda" + "Arma a dos manos" a la vez, o
"Ballesta (en vez de arco)" junto con "Arco", lo que infringe el reglamento.

## Objetivo

Una batería de tests (Vitest) que verifique que las combinaciones de
equipamiento posibles no infringen las reglas de 5ª edición, **codificando
esas reglas** en un módulo que los tests puedan consultar. El deliverable es
**solo tests + el módulo de reglas que consumen**; no se modifican datos ni UI.

## Alcance

**Dentro:**
- Módulo de reglas `src/rules/equipment.ts` (clasificador + checker + cobertura).
- Suite de tests `src/rules/equipment.test.ts` en tres capas.
- Un fichero baseline versionado con las combinaciones ilegales hoy construibles.
- Cuatro familias de reglas: exclusividad de armas CaC, exclusividad de
  proyectiles, armadura/escudo, una sola montura.

**Fuera (YAGNI):**
- Sin cambios en los datos de los ejércitos (`src/data/armies/*.ts`).
- Sin metadatos estructurados en `EquipmentOption` (se usa clasificación por nombre).
- Sin restricciones en la UI (radios, deshabilitar casillas).
- Sin cablear el checker a `validateRoster`. *(Anotado como extensión futura
  opcional, no se implementa aquí.)*

## Mecanismo elegido

**Clasificación por nombre**, mismo patrón que `findRule` en `src/data/rules.ts`
(emparejado por subcadena/palabra clave sobre el `name` de la opción). Sin
migración de datos. La cobertura del clasificador se vigila con un test (capa a)
para que las tablas no se queden cortas al crecer los datos.

Las cuatro familias son predicados por conteo/pares sobre el conjunto de
opciones elegidas; no requieren enumerar 2^n para evaluarse. La enumeración
exhaustiva de subconjuntos (capa c) se usa para honrar literalmente "todas las
combinaciones" y agregar las ilegales construibles, con un tope de seguridad.

## Diseño del módulo `src/rules/equipment.ts`

API pública (módulo puro, sin estado ni React):

```ts
export type EquipSlot =
  | 'melee' | 'missile' | 'armourBody' | 'shield' | 'mount' | 'barding'

/** Clasifica el nombre de una opción en una categoría, o undefined si no se reconoce. */
export function classifyOption(name: string): EquipSlot | undefined

/** Infracciones de equipo para una combinación elegida en una unidad concreta. */
export function checkEquipmentCombo(optionIds: string[], unit: UnitProfile): RuleViolation[]

/** Nombres de opciones del ejército que el clasificador NO reconoce (informe de cobertura). */
export function unclassifiedOptions(army: Army): string[]
```

- Reutiliza el tipo `RuleViolation` de `src/data/types.ts`. Cada infracción
  lleva `severity`, `rule` (id estable, p. ej. `'equip-melee-multiple'`) y
  `message`. Los mensajes pueden ser solo en inglés (uso interno de test); no
  se requiere i18n para este módulo.
- `checkEquipmentCombo` recibe `optionIds` (no nombres); resuelve cada id contra
  `unit.options` para obtener el `name` y lo clasifica. Ignora ids que no existan
  en la unidad.

### Clasificador (tablas de palabras clave)

El emparejado es por **subcadena sobre el `name` en minúsculas** (igual que
`findRule`), no por palabra completa anclada — así los plurales del dato real
(`Spears`, `Bows`, `Halberds`, `Shields`, `Cavalry lances`) caen solos
(`"spears".includes("spear")`). Tablas por categoría (primer match gana, orden
de específico a genérico para evitar solapes como "short bow" vs "bow"):

- `melee`: `spear`, `halberd`, `great weapon`, `two-handed`, `double-handed`,
  `additional hand weapon`, `two hand weapons`, `lance`.
- `missile`: `bow`, `longbow`, `short bow`, `crossbow`, `sling`, `javelin`,
  `throwing star`, `pistol`, `blowpipe`. Las entradas de pólvora/máquina
  (`handgun`/`gun`, p. ej. "Handgunners", "Organ Gun", "Helblaster Volley Gun")
  se tratan, por defecto, como **ignoradas a propósito** (allowlist de la capa a),
  no como `missile`: son armas de unidades/máquinas distintas, no upgrades de
  proyectil excluyentes de un mismo modelo. La capa (a) las saca a la luz para
  confirmar esta decisión en implementación.
- `armourBody`: `light armour`, `heavy armour`.
- `shield`: `shield`.
- `barding`: `barding`.
- `mount`: nombres de monturas (`warhorse`, `elven steed`, `cold one`,
  `giant wolf`, `war boar`, `pegasus`, `dragon`, …) y patrones `may ride`,
  `rides a`.

Notas de clasificación:
- `lance`/`cavalry lance` cuentan como `melee` (arma de carga). "Lance formation"
  no es un arma; el clasificador opera sobre nombres de opción, y "Lance
  formation" no aparece como opción de equipo, así que no genera falso positivo.
- "Additional hand weapon"/"Two hand weapons" = `melee` (configuración de armas).
- Si una opción encaja en ninguna tabla, queda **sin clasificar** y aparece en
  `unclassifiedOptions` (no se asume nada sobre ella).

### Predicados de regla (las 4 familias)

`checkEquipmentCombo` evalúa sobre las opciones elegidas (tras clasificarlas):

1. **CaC** (`equip-melee-multiple`): a lo sumo 1 opción `melee`. ≥2 → infracción.
2. **Proyectil** (`equip-missile-multiple`): a lo sumo 1 opción `missile`. ≥2 →
   infracción (cubre "ballesta en vez de arco" + "arco").
3. **Armadura** (`equip-armour-multiple`): a lo sumo 1 `armourBody`
   (ligera XOR pesada). Y (`equip-greatweapon-shield`): si hay un `melee` cuyo
   nombre indica arma a dos manos (`great weapon`/`two-handed`/`double-handed`)
   **y** un `shield`, → infracción.
4. **Montura** (`equip-mount-multiple`): a lo sumo 1 `mount`.
   (`equip-barding-no-mount`): si hay `barding` y no hay `mount` seleccionado y
   el perfil base de la unidad no está montado, → infracción. *(Heurística de
   "perfil montado": se documenta y se trata como no-montado salvo que la unidad
   tenga una opción `mount`; los casos de monturas base se listan en el baseline
   si generan ruido.)*

Todas las infracciones de este módulo son `severity: 'warning'` salvo que se
decida lo contrario en implementación; la severidad no afecta a la lógica de
los tests (que se basan en el `rule` id y el conteo).

## Suite de tests `src/rules/equipment.test.ts`

Tres capas:

### (a) Cobertura del clasificador — verde
Para cada ejército de `ALL_ARMIES`, `unclassifiedOptions(army)` devuelve `[]`.
Si aparece una opción no reconocida, el test falla y nombra la opción, forzando
a actualizar las tablas. *(Si en la primera ejecución hay opciones legítimamente
irrelevantes —p. ej. "Command group", monturas especiales— se añaden a una
allowlist explícita de "ignoradas a propósito" documentada en el test, en lugar
de clasificarlas a la fuerza.)*

### (b) Corrección del checker — verde
Casos hechos a mano sobre unidades sintéticas o reales, afirmando el conjunto
exacto de `rule` ids devueltos:
- Lanza sola → sin infracciones.
- Lanza + Alabarda → `equip-melee-multiple`.
- Arco + Ballesta → `equip-missile-multiple`.
- Ligera + Pesada → `equip-armour-multiple`.
- Arma a dos manos + Escudo → `equip-greatweapon-shield`.
- Barda sin montura → `equip-barding-no-mount`.
- Montura A + Montura B → `equip-mount-multiple`.
- Combinación legal típica (p. ej. Escudo + Armadura ligera + Lanza) → sin infracciones.

### (c) Auditoría exhaustiva sobre datos reales — verde con baseline
Para cada unidad de cada ejército:
- Enumerar **todos los subconjuntos** de `unit.options` (potencia del conjunto),
  con un **tope de seguridad** de N opciones (p. ej. N=14 → 16384 subconjuntos).
  Si una unidad supera N, se evalúan en su lugar los predicados directamente
  (equivalentes) y se emite un `console.warn`/anotación nombrando la unidad.
- Pasar cada subconjunto por `checkEquipmentCombo` y recopilar las unidades para
  las que **existe** al menos un subconjunto ilegal (clave: `armyId/unitId` +
  `rule` id). Esto es el conjunto de "combinaciones ilegales hoy construibles".
- Comparar ese conjunto con un **baseline** versionado
  (`src/rules/__baselines__/equipment-combos.json` o similar). El test:
  - **verde** si coincide exactamente con el baseline;
  - **rojo** si aparece una infracción nueva (regresión) o desaparece una
    existente (mejora no registrada) — el mensaje indica cómo regenerar el
    baseline (script/env var, p. ej. `UPDATE_BASELINE=1`).
- Además, invariantes estructurales sobre cada subconjunto (verde):
  `checkEquipmentCombo` nunca lanza excepción. Para el invariante de puntos, el
  test construye una `RosterEntry` sintética mínima
  (`{ id, unitId: unit.id, size: unit.minSize ?? 1, optionIds: subconjunto, magicItemIds: [] }`)
  y afirma que `entryPoints(entry, army)` (de `src/rules/points.ts`) es un número
  finito ≥ 0. (`checkEquipmentCombo` por sí mismo no maneja `RosterEntry`; esta
  entrada sintética existe solo para el invariante de puntos del test.)

El baseline se genera en la implementación a partir de la primera ejecución y se
revisa manualmente para confirmar que las entradas son huecos reales (no falsos
positivos del clasificador).

## Layout de ficheros

- `src/rules/equipment.ts` — módulo de reglas (nuevo).
- `src/rules/equipment.test.ts` — suite de tests (nuevo).
- `src/rules/__baselines__/equipment-combos.json` — baseline versionado (nuevo).

## Manejo de errores y casos límite

- Opciones con `flat: true` (grupo de mando, estandarte de batalla) se clasifican
  normalmente; las de mando quedan sin clasificar y van a la allowlist de
  ignoradas (no participan en las 4 familias).
- Ids de opción inexistentes en la unidad: se ignoran sin lanzar.
- Unidades sin `options`: no producen subconjuntos ni infracciones.
- Solapes de subcadena en el clasificador (p. ej. "short bow" contiene "bow"):
  se resuelven con orden de tablas (específico antes que genérico) o anclando
  patrones; cubierto por la capa (b).
- Falsos positivos del clasificador: cualquier entrada del baseline que resulte
  ser un falso positivo se corrige ajustando el clasificador, no añadiéndola al
  baseline como "esperada".

## Criterios de éxito

1. `npm test` pasa con las tres capas en verde.
2. La capa (a) garantiza que toda opción está clasificada o explícitamente ignorada.
3. La capa (b) documenta y bloquea el comportamiento del checker para las 4 familias.
4. La capa (c) deja un baseline revisado de las combinaciones ilegales hoy
   construibles, y se pone roja ante cualquier regresión futura.
5. Ningún cambio en datos de ejércitos, `EquipmentOption`, UI ni `validateRoster`.

## Nota sobre control de versiones

El proyecto **no es un repositorio git** (`git rev-parse` falla). El documento de
diseño y el código se escriben en el árbol de trabajo; no se ejecuta `git commit`.
Si se inicializa git más adelante, este spec y la suite deberían commitearse.
