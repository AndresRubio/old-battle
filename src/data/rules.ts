// Glossary of 5th-edition special rules, shown when a player clicks a
// unit's ability tag. Descriptions are based on the 1996 Spanish "Manual de
// Batalla" (rulebook) + army books; refined against the book where possible.

export interface RuleDef {
  id: string
  /** Lowercase substrings matched against an ability tag (e.g. "causes fear" → "fear"). */
  aliases: string[]
  titleEn: string
  titleEs: string
  en: string
  es: string
}

// NOTE: order matters — findRule returns the FIRST entry whose alias is a
// substring of the tag, so more specific rules are listed before generic ones.
export const RULES: RuleDef[] = [
  {
    id: 'immune-psychology',
    aliases: ['immune to psychology', 'inmune a la psicología'],
    titleEn: 'Immune to Psychology',
    titleEs: 'Inmune a la psicología',
    en: 'The unit ignores all psychology rules: it never has to test for fear, terror, panic or similar, and is never forced to flee from them. It still takes Break tests as normal in combat.',
    es: 'La unidad ignora todas las reglas de psicología: nunca debe hacer chequeos de miedo, terror o pánico, ni huye por su causa. Sigue haciendo chequeos de desmoralización en combate con normalidad.',
  },
  {
    id: 'fear',
    aliases: ['fear', 'miedo'],
    titleEn: 'Fear',
    titleEs: 'Miedo',
    en: 'Creatures that cause fear are unsettling to face. A unit must pass a Leadership test to charge a fear-causing enemy; if outnumbered by fear-causers in close combat it must test or flee, and units that lose a combat to them may break more easily.',
    es: 'Las criaturas que causan miedo son aterradoras. Una unidad debe superar un chequeo de Liderazgo para cargar contra un enemigo que cause miedo; si es superada en número por enemigos que causan miedo debe chequear o huir, y desmoraliza con mayor facilidad al perder el combate contra ellos.',
  },
  {
    id: 'terror',
    aliases: ['terror'],
    titleEn: 'Terror',
    titleEs: 'Terror',
    en: 'Terror is a stronger form of fear. A unit charged by a terror-causing creature must pass a Leadership test or flee, and creatures that cause terror also cause fear. Units that are immune to fear are immune to terror.',
    es: 'El terror es una forma intensificada del miedo. Una unidad cargada por una criatura que causa terror debe superar un chequeo de Liderazgo o huirá, y las criaturas que causan terror también causan miedo. Quien es inmune al miedo es inmune al terror.',
  },
  {
    id: 'frenzy',
    aliases: ['frenzy', 'frenesí', 'frenesi'],
    titleEn: 'Frenzy',
    titleEs: 'Frenesí',
    en: 'Frenzied troops must charge the nearest enemy within charge reach, fight with double their normal Attacks, and always pursue a fleeing enemy. They are immune to all other psychology, but lose their frenzy for the rest of the battle if they are beaten in close combat.',
    es: 'Las tropas con frenesí deben cargar contra el enemigo más cercano que esté a distancia de carga, luchan con el doble de sus Ataques normales y siempre persiguen a un enemigo que huye. Son inmunes al resto de la psicología, pero pierden el frenesí durante el resto de la batalla si son derrotadas en combate cuerpo a cuerpo.',
  },
  {
    id: 'hatred',
    aliases: ['hatred', 'hatred of', 'odio'],
    titleEn: 'Hatred',
    titleEs: 'Odio',
    en: 'A unit that hates its enemy re-rolls all missed close-combat hits in the first round of any combat against the hated foe. Such troops also take Break tests using an unmodified Leadership of 10, and must always pursue a beaten, fleeing enemy.',
    es: 'Una unidad que odia a su enemigo repite todas las tiradas de impacto falladas en el primer turno de cualquier combate cuerpo a cuerpo contra el enemigo odiado. Estas tropas además efectúan los chequeos de desmoralización con un Liderazgo de 10 sin modificar, y deben perseguir siempre a un enemigo derrotado que huye.',
  },
  {
    id: 'stupidity',
    aliases: ['stupidity', 'estupidez', 'stupid'],
    titleEn: 'Stupidity',
    titleEs: 'Estupidez',
    en: 'At the start of its turn the unit must pass a Leadership test. If it fails, it lurches straight forward (or stands drooling), unable to act sensibly that turn.',
    es: 'Al principio de su turno la unidad debe superar un chequeo de Liderazgo. Si lo falla, avanza torpemente en línea recta (o se queda babeando), incapaz de actuar con sensatez ese turno.',
  },
  {
    id: 'animosity',
    aliases: ['animosity', 'animosidad'],
    titleEn: 'Animosity',
    titleEs: 'Animosidad',
    en: "Orcs, Goblins and other squabbling greenskins must roll for animosity each turn. A bad roll means the unit bickers and does nothing, or even moves toward the nearest other greenskin unit to start a fight, instead of following orders.",
    es: 'Orcos, Goblins y otros pieles verdes pendencieros deben tirar por animosidad cada turno. Una mala tirada hace que la unidad se enzarce y no haga nada, o que incluso avance hacia la unidad pielverde más cercana para pelearse, en lugar de obedecer órdenes.',
  },
  {
    id: 'flying',
    aliases: ['flying', 'flies', 'volar', 'volador'],
    titleEn: 'Flying',
    titleEs: 'Volar',
    en: 'Winged creatures may make a long flying move in the movement phase instead of their normal Move, soaring over terrain and intervening models. They may use this flying move to charge.',
    es: 'Las criaturas aladas pueden realizar un largo movimiento de vuelo en la fase de movimiento en lugar de su Movimiento normal, sobrevolando el terreno y las miniaturas intermedias. Pueden usar este movimiento de vuelo para cargar.',
  },
  {
    id: 'skirmish',
    aliases: ['skirmish', 'hostigador'],
    titleEn: 'Skirmishers',
    titleEs: 'Hostigadores',
    en: 'Skirmishers fight in a loose, open formation. They move freely without movement penalties for turning, may move through difficult terrain unhindered, and are harder to hit with shooting, but get little benefit from ranks.',
    es: 'Los hostigadores combaten en formación abierta y dispersa. Se mueven libremente sin penalizadores por girar, atraviesan el terreno difícil sin estorbo y son más difíciles de alcanzar con disparos, pero apenas se benefician de las filas.',
  },
  {
    id: 'fast-cavalry',
    aliases: ['fast cavalry', 'caballería ligera', 'caballeria ligera'],
    titleEn: 'Fast Cavalry',
    titleEs: 'Caballería ligera',
    en: 'Lightly armed riders that manoeuvre freely: they may turn without losing movement, are allowed to flee and rally more readily, and can feign flight. Like skirmishers, they gain no rank bonus.',
    es: 'Jinetes ligeros que maniobran con libertad: pueden girar sin perder movimiento, huyen y se reagrupan con más facilidad y pueden fingir la huida. Como los hostigadores, no obtienen bonificador por filas.',
  },
  {
    id: 'scouts',
    aliases: ['scout', 'explorador'],
    titleEn: 'Scouts',
    titleEs: 'Exploradores',
    en: 'Scouts deploy after both armies have set up, and may be placed anywhere on the table more than a set distance from the enemy — often used to seize cover or threaten flanks.',
    es: 'Los exploradores se despliegan después de que ambos ejércitos se hayan colocado, y pueden situarse en cualquier punto de la mesa a más de cierta distancia del enemigo; suelen usarse para tomar cobertura o amenazar los flancos.',
  },
  {
    id: 'large-target',
    aliases: ['large target', 'objetivo grande'],
    titleEn: 'Large Target',
    titleEs: 'Objetivo grande',
    en: 'A very big model (giants, dragons, war machines). It can always be seen and shot at over intervening troops, and enemy war machines and shooters gain bonuses to hit it.',
    es: 'Una miniatura muy grande (gigantes, dragones, máquinas de guerra). Siempre puede verse y dispararse por encima de las tropas intermedias, y las máquinas de guerra y tiradores enemigos obtienen bonificadores para impactarla.',
  },
  {
    id: 'regeneration',
    aliases: ['regeneration', 'regenera'],
    titleEn: 'Regeneration',
    titleEs: 'Regeneración',
    en: 'The creature knits its wounds back together. Roll for each wound suffered; on a successful roll the wound is recovered. Wounds caused by fire (and some magical attacks) cannot be regenerated.',
    es: 'La criatura cierra sus heridas. Tira por cada herida sufrida; con una tirada exitosa la herida se recupera. Las heridas causadas por fuego (y algunos ataques mágicos) no pueden regenerarse.',
  },
  {
    id: 'magic-resistance',
    aliases: ['magic resistance', 'resistencia a la magia'],
    titleEn: 'Magic Resistance',
    titleEs: 'Resistencia a la magia',
    en: 'The model (or its unit) is protected against sorcery, granting extra dispel attempts or saves against spells targeted at it.',
    es: 'La miniatura (o su unidad) está protegida contra la hechicería, lo que otorga intentos de dispersión o salvaciones adicionales contra los hechizos dirigidos contra ella.',
  },
  {
    // Must precede 'ward-save': the "5+ ward save" tag also contains "ward save",
    // so this more specific alias has to match first. Alias 'savage orc unit'
    // appears only in the two Savage Orc Shaman joining tags (book p.19).
    id: 'savage-orc-shaman-joined',
    aliases: ['savage orc unit'],
    titleEn: 'Savage Orc Shaman (joined to a unit)',
    titleEs: 'Shaman Orco Salvaje (unido a una Peña)',
    en: 'When a Savage Orc Shaman joins a unit of Savage Orcs (Warriors or Boar Boyz), he draws one extra magic card each Magic phase, usable only by him; and the tribal war-paint tattoos improve the ward save to 5+ (from 6+) for both the Shaman and the unit’s warriors.',
    es: 'Cuando un Shaman Orco Salvaje se une a una Peña de Orcos Salvajes (Guerreros o Jinetes de Jabalí), roba una carta de magia adicional cada fase de magia, que sólo él puede usar; y los tatuajes de pintura de guerra mejoran la salvación especial a 5+ (en vez de 6+) tanto para el Shaman como para los guerreros de la Peña.',
  },
  {
    // Alias 'mushroom' matches all four Night Goblin Shaman mushroom tags
    // (book printed p.18 / PDF p.20).
    id: 'night-goblin-shaman-mushrooms',
    aliases: ['mushroom'],
    titleEn: 'Night Goblin Shaman (Shaman Mushrooms)',
    titleEs: 'Shaman Goblin Nocturno (Setas Shaman)',
    en: 'A Night Goblin Shaman carries one Shaman Mushroom per level of magic (1/2/3/4 for Shaman/Paladin Shaman/Master Shaman/Grand Shaman), each usable once per battle. At the start of any Magic phase, before the Winds of Magic are rolled, he may eat one to draw 1D6 extra magic cards for that phase, usable only by him. The price: in a phase where he ate one, if he must make a Waaagh! check, subtract 1 from the die roll when consulting the Mental Burst table. A mushroom also lets him cast even with no Orcs & Goblins within 30cm — but with no Waaagh! energy source that close, he still draws no ordinary Winds of Magic cards, only the 1D6 from the mushroom.',
    es: 'Un Shaman Goblin Nocturno lleva una Seta Shaman por cada nivel de magia (1/2/3/4 para Shaman/Paladín Shaman/Maestro Shaman/Gran Shaman), cada una utilizable una sola vez por batalla. Al principio de cualquier fase de magia, antes de tirar los Vientos de la Magia, puede comerse una para robar 1D6 cartas de magia adicionales esa fase, que sólo él puede usar. El precio: en la fase en la que haya comido una, si debe hacer un chequeo por ¡Waaagh!, resta 1 al resultado del dado al consultar la Tabla de Estallido Mental. Una seta también le permite lanzar hechizos aunque no haya Orcos ni Goblins a 30 cm — pero si no hay ninguna fuente de energía ¡Waaagh! tan cerca, sigue sin recibir cartas normales de los Vientos de la Magia, sólo el 1D6 de la seta.',
  },
  {
    // Aliases match both Forest Goblin Shaman tags (book printed p.19 / PDF
    // p.21). Deliberately not 'waaagh': that word also appears inside the
    // generic 'Wizard (Waaagh! Magic)' tag shared by every Orc/Goblin caster.
    id: 'forest-goblin-shaman-venom',
    aliases: ['spider venom', 'stagger 2d6cm'],
    titleEn: 'Forest Goblin Shaman (Spider Venom)',
    titleEs: 'Shaman Goblin Silvano (Veneno de Araña)',
    en: 'A Forest Goblin Shaman makes Waaagh! checks like any other Goblin Shaman, but the venom of his pet spiders lets him add +1 to his roll on the Mental Burst table. A natural 6 on that roll leaves him unaffected entirely — treated as if he had passed the Waaagh! check even if he had not, with no downside; this means his worst possible result on the table is a 2 ("I think I’m going to…"), and he can never suffer the "Mental Burst" result itself. However, every time he actually fails a Waaagh! check — even one "saved" by that natural 6 — he immediately staggers 2D6cm in a random (scatter-die) direction, stopping at any impassable obstacle; if this brings him into contact with an enemy he is locked in combat and counts as having charged that turn (and again the following turn if already fighting).',
    es: 'Un Shaman Goblin Silvano hace chequeos por ¡Waaagh! como cualquier otro Shaman Goblin, pero el veneno de sus arañas mascota le permite sumar +1 a su tirada en la Tabla de Estallido Mental. Un resultado natural de 6 en esa tirada le deja completamente indemne: se le trata como si hubiera superado el chequeo por ¡Waaagh!, aunque no lo hubiera hecho, sin ningún efecto negativo; esto significa que su peor resultado posible en la tabla es un 2 ("Creo que voy a…") y jamás puede sufrir el resultado "Estallido Mental". Sin embargo, cada vez que falla de verdad un chequeo por ¡Waaagh! — incluso uno "salvado" por ese natural de 6 — se desplaza de inmediato el equivalente en centímetros de una tirada de 2D6 en una dirección aleatoria (dado de dispersión), deteniéndose ante cualquier obstáculo infranqueable; si con ello contacta con un enemigo queda trabado en combate y cuenta como si hubiera cargado ese turno (y de nuevo el turno siguiente si ya estaba luchando).',
  },
  {
    id: 'ward-save',
    aliases: ['ward save', 'ward vs', 'salvación especial', 'salvacion especial', 'salvación por protección'],
    titleEn: 'Ward Save',
    titleEs: 'Salvación especial',
    en: 'A special protective save (magical wards, daemonic auras, blessed fields) that is taken in addition to any armour save and is not modified by the attack’s Strength.',
    es: 'Una salvación protectora especial (protecciones mágicas, auras demoníacas, bendiciones) que se realiza además de la salvación por armadura y no se ve modificada por la Fuerza del ataque.',
  },
  {
    id: 'ethereal',
    aliases: ['ethereal', 'etéreo', 'etereo'],
    titleEn: 'Ethereal',
    titleEs: 'Etéreo',
    en: 'A ghostly, incorporeal creature. It moves through walls and terrain, and can only be harmed by magical weapons, spells or other magical attacks — ordinary weapons pass straight through it.',
    es: 'Una criatura espectral e incorpórea. Atraviesa muros y terreno, y sólo puede ser herida por armas mágicas, hechizos u otros ataques mágicos: las armas normales la atraviesan sin causarle daño.',
  },
  {
    id: 'undead',
    aliases: ['undead', 'no muerto'],
    titleEn: 'Undead',
    titleEs: 'No Muertos',
    en: 'Undead are immune to psychology and never flee or panic, but they cannot march and crumble away if the general/necromancer who animates them is slain. They cause fear.',
    es: 'Los No Muertos son inmunes a la psicología y nunca huyen ni cunden en pánico, pero no pueden marchar y se desmoronan si muere el general/nigromante que los anima. Causan miedo.',
  },
  {
    id: 'poisoned-attacks',
    aliases: ['poisoned', 'poison', 'envenenad'],
    titleEn: 'Poisoned Attacks',
    titleEs: 'Ataques envenenados',
    en: 'Weapons coated in deadly venom. The exact effect varies by army — most commonly the attacks gain a Strength bonus (e.g. +1 Strength), while some poisons allow no armour save or cause extra wounds. See the unit’s own entry.',
    es: 'Armas impregnadas de un veneno mortal. El efecto exacto varía según el ejército: lo más habitual es que los ataques ganen un bonificador de Fuerza (p. ej. +1 a la Fuerza), aunque algunos venenos no permiten salvación por armadura o causan heridas adicionales. Consulta la ficha de la unidad.',
  },
  {
    id: 'breath-weapon',
    aliases: ['breath weapon', 'breath', 'arma de aliento', 'aliento'],
    titleEn: 'Breath Weapon',
    titleEs: 'Arma de aliento',
    en: 'The creature breathes fire (or worse) over its foes during the shooting phase. Place the teardrop template; each model under it is hit on a 4+, wounding at Strength 4 (unless stated otherwise) with saves as normal.',
    es: 'La criatura exhala fuego (o algo peor) sobre sus enemigos en la fase de disparo. Coloca la plantilla en forma de lágrima; cada miniatura bajo ella es impactada con un 4+, hiriendo con Fuerza 4 (salvo que se indique otra cosa) y con salvaciones normales.',
  },
  {
    id: 'petrifying-gaze',
    aliases: ['petrifying gaze', 'petrify', 'mirada petrificante'],
    titleEn: 'Petrifying Gaze',
    titleEs: 'Mirada petrificante',
    en: 'A magical gaze (Basilisk, Gorgon) used in the magic phase at short range. The victim must beat its Initiative on a die or be turned to stone and slain — no armour save applies against petrification.',
    es: 'Una mirada mágica (Basilisco, Gorgona) usada en la fase de magia a corto alcance. La víctima debe superar su Iniciativa en un dado o quedará petrificada y morirá; no se aplica salvación por armadura contra la petrificación.',
  },
  {
    id: 'unbreakable',
    aliases: ['unbreakable', 'inquebrantable'],
    titleEn: 'Unbreakable',
    titleEs: 'Inquebrantable',
    en: 'The unit never has to take Break tests and never flees — it fights on until destroyed or victorious.',
    es: 'La unidad nunca hace chequeos de desmoralización y nunca huye: lucha hasta ser destruida o vencer.',
  },
  {
    id: 'killing-blow',
    aliases: ['killing blow', 'golpe mortal'],
    titleEn: 'Killing Blow',
    titleEs: 'Golpe mortal',
    en: 'On an unmodified to-wound roll of 6, the blow slays its victim outright (no armour save allowed), as long as the target is roughly man-sized.',
    es: 'Con un 6 sin modificar en la tirada para herir, el golpe mata a la víctima al instante (sin salvación por armadura), siempre que el objetivo sea de tamaño similar al de un hombre.',
  },
  {
    id: 'always-strikes-first',
    aliases: ['always strikes first', 'strikes first', 'ataca primero'],
    titleEn: 'Always Strikes First',
    titleEs: 'Ataca primero',
    en: 'The model strikes before troops with a lower Initiative regardless of who charged, and ties are usually resolved in its favour.',
    es: 'La miniatura ataca antes que las tropas con menor Iniciativa sin importar quién cargó, y los empates suelen resolverse a su favor.',
  },
  {
    id: 'cold-blooded',
    aliases: ['cold-blooded', 'cold blooded', 'sangre fría', 'sangre fria'],
    titleEn: 'Cold-Blooded',
    titleEs: 'Sangre fría',
    en: 'Lizardmen are unnervingly calm under pressure: when taking a Leadership test, roll 3D6 and discard the highest die.',
    es: 'Los Hombres Lagarto mantienen una calma inquietante bajo presión: al hacer un chequeo de Liderazgo, tira 3D6 y descarta el dado más alto.',
  },
  {
    id: 'chaos-armour',
    aliases: ['chaos armour', 'armadura del caos'],
    titleEn: 'Chaos Armour',
    titleEs: 'Armadura del Caos',
    en: 'Heavy, daemon-forged plate. It gives a strong armour save and, unlike normal armour, never hinders the wearer’s movement.',
    es: 'Pesada armadura forjada por demonios. Otorga una buena salvación por armadura y, a diferencia de la armadura normal, nunca penaliza el movimiento de quien la porta.',
  },
  {
    id: 'daemonic',
    aliases: ['daemonic', 'daemon', 'demoníaco', 'demoniaco'],
    titleEn: 'Daemonic',
    titleEs: 'Demoníaco',
    en: 'Daemons are immune to psychology and cause fear, and have an unholy aura that grants a ward save. They are banished if their host is broken or the magic sustaining them fails.',
    es: 'Los demonios son inmunes a la psicología y causan miedo, y poseen un aura impía que les concede una salvación especial. Son desterrados si su hueste se desmorona o falla la magia que los sostiene.',
  },
  {
    id: 'heavy-armour',
    aliases: ['heavy armour', 'armadura pesada'],
    titleEn: 'Heavy Armour',
    titleEs: 'Armadura pesada',
    en: 'Full plate or mail. Gives a 5+ armour save on foot (better when combined with a shield or while mounted), but its weight slows most troops.',
    es: 'Armadura completa de placas o malla. Otorga una salvación de 5+ a pie (mejor combinada con escudo o a caballo), pero su peso ralentiza a la mayoría de las tropas.',
  },
  {
    id: 'light-armour',
    aliases: ['light armour', 'armadura ligera'],
    titleEn: 'Light Armour',
    titleEs: 'Armadura ligera',
    en: 'Leather and partial mail giving a 6+ armour save (better with a shield or mount) without hampering movement.',
    es: 'Cuero y malla parcial que otorgan una salvación de 6+ (mejor con escudo o montura) sin entorpecer el movimiento.',
  },
  {
    id: 'shield',
    aliases: ['shield', 'escudo'],
    titleEn: 'Shield',
    titleEs: 'Escudo',
    en: 'A shield improves the bearer’s armour save by one point, and combines with worn armour.',
    es: 'Un escudo mejora en un punto la salvación por armadura de quien lo porta, y se combina con la armadura vestida.',
  },
  {
    id: 'great-weapon',
    aliases: ['great weapon', 'two-handed', 'arma a dos manos'],
    titleEn: 'Great Weapon',
    titleEs: 'Arma a dos manos',
    en: 'A massive two-handed weapon that adds +2 Strength, but the wielder always strikes last and cannot use a shield in combat.',
    es: 'Un arma enorme empuñada a dos manos que suma +2 a la Fuerza, pero quien la blande siempre ataca el último y no puede usar escudo en combate.',
  },
  {
    id: 'additional-hand-weapon',
    aliases: ['additional hand weapon', 'two hand weapons', 'two hand weapon', 'extra hand weapon', 'arma de mano adicional'],
    titleEn: 'Additional Hand Weapon',
    titleEs: 'Arma de mano adicional',
    en: 'A model fighting with a weapon in each hand (two single-handed weapons) gains +1 Attack in close combat, but cannot also use a shield while doing so.',
    es: 'Una miniatura que combate con un arma en cada mano (dos armas de una mano) gana +1 Ataque en el combate cuerpo a cuerpo, pero mientras lo hace no puede usar también un escudo.',
  },
  {
    id: 'spear',
    aliases: ['spear', 'lanza'],
    titleEn: 'Spear',
    titleEs: 'Lanza',
    en: 'Spears let a second rank of infantry fight in close combat, and give cavalry a bonus on the charge.',
    es: 'Las lanzas permiten que una segunda fila de infantería luche en combate cuerpo a cuerpo, y dan a la caballería un bonificador en la carga.',
  },
  {
    id: 'lance',
    aliases: ['lance', 'lanza de caballería', 'cavalry lance'],
    titleEn: 'Cavalry Lance',
    titleEs: 'Lanza de caballería',
    en: 'A heavy cavalry lance grants a Strength bonus to a mounted model in the turn it charges.',
    es: 'Una pesada lanza de caballería otorga un bonificador de Fuerza a la miniatura montada en el turno en que carga.',
  },
  {
    id: 'magic-items',
    aliases: ['magic item'],
    titleEn: 'Magic Items',
    titleEs: 'Objetos mágicos',
    en: 'How many magic items a character may carry depends on rank: a champion/level-1 wizard 1, a hero/level-2 wizard 2, a lord/level-3 wizard 3, a level-4 wizard 4 — with at most one item from each restricted category.',
    es: 'Cuántos objetos mágicos puede portar un personaje depende de su rango: un campeón/hechicero de nivel 1 lleva 1, un héroe/hechicero nivel 2 lleva 2, un señor/hechicero nivel 3 lleva 3, un hechicero nivel 4 lleva 4, con un máximo de un objeto por categoría restringida.',
  },
  {
    id: 'battle-standard',
    aliases: ['battle standard'],
    titleEn: 'Battle Standard',
    titleEs: 'Estandarte de batalla',
    en: 'The army’s Battle Standard Bearer inspires nearby troops, letting friendly units within range re-roll failed Break tests. There may be only one in the army.',
    es: 'El Portaestandarte de Batalla del ejército inspira a las tropas cercanas, permitiendo que las unidades amigas dentro del alcance repitan los chequeos de desmoralización fallidos. Sólo puede haber uno en el ejército.',
  },
  {
    id: 'wizard',
    aliases: ['wizard'],
    titleEn: 'Wizard',
    titleEs: 'Hechicero',
    en: 'A spellcaster. Its level (1–4) sets how many spell cards it draws and how many magic items it may carry; higher levels command more powerful magic.',
    es: 'Un lanzador de hechizos. Su nivel (1–4) determina cuántas cartas de hechizo roba y cuántos objetos mágicos puede portar; los niveles altos dominan magia más poderosa.',
  },
]

/** Find the glossary entry that best matches an ability tag, or undefined. */
export function findRule(tag: string): RuleDef | undefined {
  const t = tag.toLowerCase()
  for (const r of RULES) {
    if (r.aliases.some((a) => t.includes(a))) return r
  }
  return undefined
}
