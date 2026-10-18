// Glossary of 5th-edition special rules, shown when a player clicks a
// unit's ability tag. Descriptions are based on the 1996 Spanish "Manual de
// Batalla" (rulebook) + army books; refined against the book where possible.

export interface RuleDef {
  id: string
  /**
   * Lowercase words matched against an ability tag (e.g. "causes fear" → "fear").
   * Matching is word-aware, not substring: see `findRule`.
   */
  aliases: string[]
  titleEn: string
  titleEs: string
  en: string
  es: string
}

// Order is only a tie-breaker now: findRule picks the alias that appears
// EARLIEST in the tag, not the first entry in this array (see findRule).
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
    // OLD-36 — High Elves, printed p.78. Listed HERE, well before the generic
    // 'spear' / 'lance' entries: the tag names Lancer regiments, and 'lance' is
    // a substring of "Lancer", so without this entry the ⓘ glossary would show
    // the cavalry-lance weapon rule for an army-composition restriction.
    id: 'shadow-warrior-ratio',
    aliases: ['shadow warrior regiments'],
    titleEn: 'Shadow Warrior regiments (army-list limit)',
    titleEs: 'Regimientos de Guerreros Sombríos (límite de lista)',
    en: 'The High Elf army may include as many Shadow Warrior regiments as it includes Lancer and Archer regiments. The restriction is lifted when the opponent is a Dark Elf army, in which case any number of Shadow Warrior regiments may be taken — Shadow Warriors from every corner of Ulthuan gather to fight their ancestral enemy. The army builder cannot know who the opponent will be, so it always checks the ratio: ignore the warning when you are facing Dark Elves.',
    es: 'El ejército Alto Elfo puede incluir tantos regimientos de Guerreros Sombríos como regimientos de Lanceros y Arqueros incluya. Esta restricción se ignora cuando el adversario es un ejército de Elfos Oscuros, en cuyo caso pueden incluirse tantos regimientos de Guerreros Sombríos como se desee: los Guerreros Sombríos de todos los rincones de Ulthuan se reúnen para combatir a sus enemigos ancestrales. El creador de listas no puede saber contra quién jugarás, así que comprueba siempre la proporción: ignora el aviso si te enfrentas a Elfos Oscuros.',
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
    // OLD-59 — Astragoth, Enanos del Caos printed p.64 = PDF 66.
    id: 'astragoth-walking-machine',
    aliases: ['walking machine'],
    titleEn: 'Walking Machine (Astragoth)',
    titleEs: 'Máquina andante (Astragoth)',
    en: 'Astragoth is installed inside a machine that lets him walk despite his petrified legs. His armour and the machine’s protection together give him an armour save of 3+.',
    es: 'Astragoth se encuentra instalado en el interior de una máquina que le permite andar a pesar de sus petrificadas piernas. La combinación de la protección de su máquina y su armadura le proporciona una tirada de salvación por armadura de 3+.',
  },
  {
    id: 'astragoth-movement',
    aliases: ['mechanical movement'],
    titleEn: 'Movement (Astragoth)',
    titleEs: 'Movimiento (Astragoth)',
    en: 'Astragoth moves faster than an ordinary Chaos Dwarf thanks to his half-mechanical body, which is why his Movement is 15cm rather than the usual 8cm. The machine will not let him go any faster than that, though: he moves only 15cm when he charges, and he cannot double his Movement to march. The one exception is pursuing and fleeing, where he moves the usual 5D6 centimetres.',
    es: 'Astragoth puede moverse más rápidamente que un Enano del Caos normal gracias a su cuerpo semimecánico, y por eso su Movimiento es de 15 cm en vez de los 8 habituales. Sin embargo, la máquina no le permite moverse más deprisa: tan sólo podrá desplazarse 15 centímetros al efectuar un movimiento de carga, y no podrá duplicar su capacidad de movimiento al efectuar movimiento de marcha. La única excepción es que al perseguir y huir moverá los 5D6 centímetros habituales.',
  },
  {
    id: 'astragoth-deadly-attack',
    // Alias deliberately narrow. A bare 'deadly attack' also matched the
    // Empire tag "Protected by Sigmar: ... Strength 10 Deadly Attack in close
    // combat", which is a different rule in a different book.
    aliases: ['attacks it again with all of them'],
    titleEn: 'Deadly Attack (Astragoth)',
    titleEs: 'Ataque mortífero (Astragoth)',
    en: 'The steam-driven pistons that replaced Astragoth’s muscles and tendons let him strike with deadly Strength. Besides the increased Strength shown in his profile, he has a special attack called the Deadly Attack: if he hits the same target with all three of his Attacks, his mechanical arms accelerate almost out of control into a savage rain of blows, and he may immediately attack that same target again with all of his attacks.',
    es: 'Los pistones accionados por vapor que han reemplazado los músculos y tendones de Astragoth le permiten atacar al enemigo con una Fuerza mortífera. Además de aumentar su Fuerza, como puede observarse en su perfil de atributos, Astragoth puede llevar a cabo un ataque especial denominado Ataque Mortífero: si impacta al mismo objetivo con los tres Ataques de que dispone, sus brazos mecánicos se habrán acelerado casi sin control, descargando una salvaje lluvia de golpes, y podrá atacar de nuevo inmediatamente al mismo objetivo con todos sus ataques.',
  },
  {
    // OLD-62 — Gorduz, Enanos del Caos printed p.63 = PDF 65. Alias kept to the
    // one word, which appears in no other army's tag; the tag leads with it, so
    // it matches at index 0 and nothing later in the tag can outrank it.
    id: 'gorduz-predestined',
    aliases: ['predestined'],
    titleEn: 'Predestined! (Gorduz)',
    titleEs: '¡Predestinado! (Gorduz)',
    en: 'Predestined… Lucky… Slippery…! Call it what you like, Gorduz Backstabber has a special knack for surviving. When he suffers his last wound — the one that would be fatal to anybody else — he may make an unmodified save roll of 4, 5 or 6 on 1D6. He may make and pass this roll every time he suffers his last wound, staying alive until his luck runs out.',
    es: '¡Predestinado... Afortunado... Escurridizo...! Llámese como se quiera, Gorduz el Traicionero tiene una habilidad especial para sobrevivir. Al sufrir su última (y para otros fatal) herida, puede efectuar una tirada de salvación sin modificar de 4, 5 ó 6 en 1D6. Podrá efectuar y superar esta tirada siempre que sufra su última herida ¡siguiendo vivo hasta que se le acabe la suerte!',
  },
  {
    // OLD-53 — the greenskin troops a Chaos Dwarf army may field, from the
    // same bestiary: Black Orcs printed p.12 = PDF 14, Orcs and Goblins
    // printed p.13 = PDF 15. Specific aliases again, for the same reason as
    // the Hobgoblin block below.
    id: 'cd-orc-animosity',
    aliases: ['orc animosity'],
    titleEn: 'Animosity (Orcs)',
    titleEs: 'Animosidad (Orcos)',
    en: 'Orcs are subject to the Orc and Goblin animosity rule as described in the Warhammer bestiary and in the Orcs & Goblins army supplement. If the army includes mobs of Hobgoblins, the Orcs pass their animosity rolls automatically, with no dice rolled at all: they are busier keeping an eye on the treacherous Hobgoblins than on quarrelling among themselves.',
    es: 'Los Orcos se ven afectados por la regla de Animosidad de Orcos y Goblins, tal y como se describe en el Bestiario de Warhammer o en el suplemento de Ejércitos Orcos y Goblins. Si el ejército incluye peñas de Hobgoblins, los Orcos superarán automáticamente la tirada de Animosidad: no es necesario tirar los dados. Los Orcos están más pendientes de vigilar a los traicioneros Hobgoblins que de pelearse entre ellos.',
  },
  {
    id: 'cd-orc-panic',
    aliases: ['orc panic'],
    titleEn: 'Panic (Orcs)',
    titleEs: 'Pánico (Orcos)',
    en: 'Orcs know perfectly well that Goblins are cowards who will run as soon as the fighting turns serious, so it hardly surprises them when it happens. The sight of a few Goblins fleeing in panic does not worry an Orc; it just reminds him that he is better than they are. When a Goblin unit breaks and flees near a unit of Orcs during a turn, the Orcs take no panic test.',
    es: 'Los Orcos tienen muy claro que los Goblins son unos cobardes que saldrán corriendo tan pronto como la lucha empiece en serio, por lo que no les sorprende demasiado cuando ocurre. La visión de unos cuantos Goblins huyendo presos del pánico no preocupa a los Orcos: simplemente les recuerda que son mejores que ellos. Cuando una unidad de Goblins se desmoralice y huya durante un turno cerca de una unidad de Orcos, éstos no tendrán que llevar a cabo un chequeo de pánico.',
  },
  {
    id: 'cd-black-orc-animosity',
    aliases: ['black orc animosity'],
    titleEn: 'Animosity (Black Orcs)',
    titleEs: 'Animosidad (Orcos Negros)',
    en: 'Black Orcs are untouched by the constant squabbling and brawling that marks the other Orcs and Goblins, so they never take Animosity checks. And because they are not subject to Animosity, they can never be the victim of another greenskin unit’s animosity either.',
    es: 'Los Orcos Negros no se ven afectados por las continuas trifulcas y peleas que caracterizan a los otros Orcos y Goblins, por lo que nunca tienen que llevar a cabo chequeos de Animosidad. Ten en cuenta que, puesto que no están sujetos a Animosidad, tampoco podrán ser víctimas de la Animosidad de otra unidad de goblinoides.',
  },
  {
    id: 'cd-black-orc-leaders',
    aliases: ['black orc leaders'],
    titleEn: 'Black Orc Leaders',
    titleEs: 'Líderes Orcos Negros',
    en: 'A Black Orc character may join any unit of ordinary Orcs or Goblins and take command of it. With a Black Orc in charge the unit would rather not squabble, so it is not subject to the Animosity rule while he leads it. Black Orcs want nothing to do with Hobgoblins, so they cannot be chosen to command a Hobgoblin unit.',
    es: 'Los Personajes Orcos Negros pueden unirse a cualquier unidad de Orcos normales o Goblins y ponerles bajo sus órdenes. Puesto que la unidad está bajo el mando de un Orco Negro, sus miembros preferirán no pelearse entre sí: la unidad no estará sujeta a la regla especial de Animosidad. Los Orcos Negros no quieren saber nada de los Hobgoblins, así que no pueden ser elegidos para mandar una unidad de Hobgoblins.',
  },
  {
    id: 'cd-black-orc-panic',
    aliases: ['black orc panic'],
    titleEn: 'Panic (Black Orcs)',
    titleEs: 'Pánico (Orcos Negros)',
    en: 'Black Orcs care so little about what happens to ordinary Orcs or Goblins that they take no panic test when they see a broken greenskin unit flee past them. It simply confirms what they already believed: that they are the best. The rule covers the Black Orcs themselves only, not the Orc or Goblin units led by a Black Orc character.',
    es: 'A los Orcos Negros les importa tan poco lo que les pase a los Orcos normales o a los Goblins que no tendrán que efectuar un chequeo de pánico si ven huir cerca a una unidad de goblinoides desmoralizada: simplemente les convence aún más de que son los mejores. Esta regla se aplica únicamente a los Orcos Negros, no a las unidades de Orcos o Goblins que estén bajo el mando de un personaje Orco Negro.',
  },
  {
    id: 'cd-goblin-fear-elves',
    aliases: ['goblin fear of elves'],
    titleEn: 'Fear of Elves (Goblins)',
    titleEs: 'Miedo a los Elfos (Goblins)',
    en: 'Goblins dread fighting Elves, partly because of that race’s formidable reputation as warriors and partly because the natural aura of the Elves stirs an irrational terror in them. A Goblin unit fears any Elf unit it does not outnumber by at least two to one, and suffers the effects of fear as described in the psychology rules.',
    es: 'Los Goblins sienten una gran aprensión a luchar contra los Elfos, en parte por la formidable reputación de esta raza como guerreros y en parte porque el aura natural de los Elfos provoca un temor irracional entre ellos. Cualquier unidad Goblin siente miedo de cualquier unidad de Elfos a la que no supere en número como mínimo en relación de dos a uno, y sufrirá los efectos del miedo tal y como se describe en las Reglas de Psicología.',
  },
  {
    id: 'cd-goblin-animosity',
    aliases: ['goblin animosity'],
    titleEn: 'Animosity (Goblins)',
    titleEs: 'Animosidad (Goblins)',
    en: 'Goblins are subject to Orc and Goblin animosity. If the army includes mobs of Hobgoblins, the Goblins pass their animosity rolls automatically, with no dice rolled: they distrust the Hobgoblins so deeply that they stop squabbling among themselves and concentrate on watching them closely.',
    es: 'Los Goblins están afectados por la animosidad de Orcos y Goblins. Si el ejército incluye peñas de Hobgoblins, los Goblins superarán automáticamente las tiradas de animosidad, sin tirar los dados: desconfían tanto de los Hobgoblins que dejarán de pelearse entre ellos y se concentrarán en vigilarlos de cerca.',
  },
  {
    // OLD-52 — Hobgoblins, bestiary printed p.11 = PDF 13, and the Sneaky Gitz
    // on printed p.12 = PDF 14. Every alias below is deliberately specific:
    // bare 'animosity', 'panic' or 'poisoned' would reach across the other
    // fifteen armies and re-point tags that have nothing to do with this book.
    id: 'hobgoblin-animosity',
    aliases: ['hobgoblin animosity'],
    titleEn: 'Animosity (Hobgoblins)',
    titleEs: 'Animosidad (Hobgoblins)',
    en: 'Hobgoblins suffer animosity like Orcs and Goblins. If the army fields Hobgoblins alongside other Orcs or Goblins, those other greenskins pass their animosity checks automatically, with no roll at all: they distrust the Hobgoblins so deeply that they stop squabbling among themselves and concentrate on watching the treacherous creatures. The Hobgoblins themselves test as normal, and may end up attacking or shooting at Goblins, Orcs or each other.',
    es: 'Los Hobgoblins están afectados por la animosidad como los Orcos y los Goblins. Si tu ejército incluye unidades de Hobgoblins y algunos tipos de Orcos o Goblins, estos otros tipos de criaturas goblinoides superarán inmediatamente sus chequeos de animosidad: no se precisa ninguna tirada. Esto se debe a que los goblinoides desconfían tanto de los Hobgoblins que dejarán de pelearse entre ellos y se concentrarán en vigilar de cerca a los traicioneros Hobgoblins. Los Hobgoblins deben efectuar los chequeos de animosidad normalmente, pudiendo atacar o disparar a Goblins, Orcos y entre ellos.',
  },
  {
    id: 'hobgoblin-panic',
    aliases: ['hobgoblin panic'],
    titleEn: 'Panic (Hobgoblins)',
    titleEs: 'Pánico (Hobgoblins)',
    en: 'The panic rule runs one way only. If Hobgoblins break or flee past a unit of any kind of Orcs or Goblins, that unit takes no panic test: watching Hobgoblins run and die brings the other greenskins nothing but grins and roars of laughter. The Hobgoblins get no such favour. They cannot ignore fleeing Goblins the way Orcs can, so they must test for panic whenever an Orc or Goblin unit breaks nearby.',
    es: 'La regla del pánico funciona en un solo sentido. Si los Hobgoblins se desmoralizan o huyen pasando cerca de una unidad de cualquier tipo de Orcos o Goblins, esa unidad no efectúa ningún chequeo de pánico: ver correr a los Hobgoblins y contemplar cómo caen muertos no provoca en los demás goblinoides nada más que sonrisas de alegría y estallidos de risa. Los Hobgoblins no tienen esa ventaja: no pueden ignorar a los Goblins que huyen (como sí pueden los Orcos), por lo que deben realizar un chequeo de pánico si alguna unidad de Orcos o Goblins resulta desmoralizada cerca de ellos.',
  },
  {
    id: 'black-orc-officers',
    aliases: ['black orc officers'],
    titleEn: 'Black Orc Officers',
    titleEs: 'Oficiales Orcos Negros',
    en: 'Black Orc Great Chiefs and Warlords may take command of units of other greenskins, but they will never agree to lead a unit of Hobgoblins. Nobody can blame them.',
    es: 'Los Grandes Jefes y Caudillos Orcos Negros pueden tener bajo su mando a unidades de otros goblinoides, pero nunca aceptarán ponerse al mando de una unidad de Hobgoblins. Nadie puede reprochárselo.',
  },
  {
    id: 'sneaky-gitz-envelop',
    aliases: ['envelop the flank'],
    titleEn: 'Envelop the Flank (Sneaky Gitz)',
    titleEs: 'Envolver el flanco (Escurridizos)',
    en: 'The first round of close combat is resolved normally. After it, the Sneaky Gitz may envelop the flank whether they won the combat or lost it, moving models from their rear ranks around the sides of the enemy unit. The enemy regiment can never envelop the Sneaky Gitz, not even if it won the combat. And where an ordinary unit may send at most two models around each enemy flank, the Sneaky Gitz may send any number. If more than five models end up surrounding an enemy unit, the flank or rear combat modifier applies (+1 for a flank or +2 for the rear, and the two are not cumulative).',
    es: 'El primer turno de combate cuerpo a cuerpo se resuelve normalmente. Después, la unidad de Escurridizos podrá envolver el flanco tanto si ha ganado como si ha perdido el combate, desplazando las miniaturas de las filas posteriores contra los flancos de la unidad enemiga. El regimiento enemigo nunca podrá envolver el flanco de los Escurridizos, ¡ni aunque haya ganado el combate! Además, mientras una unidad normal sólo puede envolver con un máximo de dos miniaturas por cada flanco, los Escurridizos pueden hacerlo con un número ilimitado de miniaturas de sus últimas filas. Si hay más de cinco miniaturas rodeando a una unidad enemiga, podrá aplicarse el modificador por atacar por el flanco o la retaguardia (+1 por el flanco ó +2 por retaguardia, no acumulativos).',
  },
  {
    // Alias 'poisoned daggers' shares its starting position with the generic
    // 'poisoned' alias, and the longer one wins the tie.
    id: 'sneaky-gitz-daggers',
    aliases: ['poisoned daggers'],
    titleEn: 'Poisoned Daggers (Sneaky Gitz)',
    titleEs: 'Dagas envenenadas (Escurridizos)',
    en: 'The daggers of the Sneaky Gitz are steeped in a deadly poison, because the slightest cut can kill. Any wound they cause is resolved with an extra -1 to the enemy’s armour save.',
    es: 'Las dagas de los Escurridizos están empapadas de un veneno mortal, ya que el más ligero corte puede ser mortal. Cualquier herida causada por estas dagas reduce en -1 adicional la tirada de salvación por armadura del enemigo.',
  },
  {
    id: 'sneaky-gitz-attacks',
    aliases: ['sneaky gitz attacks'],
    titleEn: 'Sneaky Gitz Attacks',
    titleEs: 'Ataques de los Escurridizos',
    en: 'Each Sneaky Git carries a second dagger, so he makes one extra attack: two attacks instead of one.',
    es: 'Los Escurridizos están equipados con un arma adicional, por lo que pueden efectuar un ataque adicional: dos ataques en vez de sólo uno.',
  },
  {
    id: 'sneaky-git-boss',
    aliases: ['sneaky git boss'],
    titleEn: 'Sneaky Git Boss',
    titleEs: 'Jefe Escurridizo',
    en: 'A Sneaky Git Boss is an exception to the Paladin rules. He has the same characteristics and the same points value as any other Hobgoblin Boss, and may be armed either with the two poisoned daggers the rest of the unit carries (+1 point for the daggers) or with a hand weapon and shield (+1 point for the shield).',
    es: 'Un Jefe Escurridizo es una excepción a las reglas de Paladines. Tiene los mismos atributos y el mismo valor en puntos que cualquier otro Jefe Hobgoblin, y puede estar armado con las dos dagas envenenadas habituales de los Escurridizos (+1 punto por las dagas) o con arma de mano y escudo (+1 punto por el escudo).',
  },
  {
    // OLD-51 — Enanos del Caos bestiary, printed p.9 = PDF 11. The three rules
    // every Chaos Dwarf model carries, plus the Sorcerers' own deck. All four
    // tags are pinned through TAG_RULE_OVERRIDES: they open with ordinary words
    // like "Armour" and "Magic", and the Magic one would otherwise be stolen by
    // the 'magic resistance' alias and tell players the exact opposite of what
    // the rule says.
    id: 'chaos-dwarf-armour',
    aliases: ['whatever armour is worn'],
    titleEn: 'Armour (Chaos Dwarfs)',
    titleEs: 'Armadura (Enanos del Caos)',
    en: 'Chaos Dwarfs are sturdy creatures who bear the weight of armour more easily than frail humans and other races. A Chaos Dwarf therefore has a Movement of 8cm (3"), whatever kind of armour he is equipped with.',
    es: 'Los Enanos del Caos son seres robustos que pueden soportar más fácilmente que los frágiles humanos y otras razas el peso de las armaduras. Por ello, los Enanos del Caos poseen un Atributo de Movimiento de 8 centímetros, independientemente del tipo de armadura con el que estén equipados.',
  },
  {
    id: 'chaos-dwarf-pursuit',
    // Alias deliberately narrow. A bare 'pursuit' also matched the Norse tag
    // "Dwarfs — hate all Orcs and Goblins, Elf Grudge, Dwarf movement/pursuit
    // rules", which has nothing to do with this article.
    aliases: ['pursues and flees'],
    titleEn: 'Pursuit and Flight (Chaos Dwarfs)',
    titleEs: 'Persecución y huída (Enanos del Caos)',
    en: 'Chaos Dwarfs are not especially fast, even when running for their lives or chasing a fleeing enemy. They pursue and flee 3cm less than other troops, the equivalent of 5D6 minus 3 centimetres instead of 5D6.',
    es: 'Los Enanos del Caos no son especialmente rápidos, incluso aunque corran por sus vidas o persigan a un enemigo que huye. Perseguirán y huirán 3 cm menos que las demás tropas, o sea, el equivalente de 5D6-3 centímetros en vez de 5D6.',
  },
  {
    id: 'chaos-dwarf-magic',
    aliases: ['no dwarf magic resistance'],
    titleEn: 'Magic (Chaos Dwarfs)',
    titleEs: 'Magia (Enanos del Caos)',
    en: 'Ordinary Dwarfs benefit from a natural resistance to magic: their Dispel Magic always works on a 4 or more, even with no wizard to cast it. This rule does NOT apply to Chaos Dwarfs. They use Dispel Magic exactly like humans and every other army.',
    es: 'Como se describe en Warhammer Magia de Batalla, los Enanos se benefician de su resistencia mágica natural: las Dispersiones de Magia siempre funcionan si se obtiene un resultado de 4+ aunque no tengan hechiceros para lanzarlas. Esta regla NO se aplica a los Enanos del Caos; pueden emplear Dispersiones de Magia igual que los humanos o los demás ejércitos.',
  },
  {
    id: 'chaos-dwarf-sorcerers',
    aliases: ['chaos dwarf sorcerers'],
    titleEn: 'Chaos Dwarf Sorcerers (spell deck)',
    titleEs: 'Brujos Enanos del Caos (mazo de hechizos)',
    en: 'Chaos Dwarf Sorcerers do not use the spell cards the other Chaos sorcerers use. They have a deck of ten spell cards of their own, dealt the way a single colour of magic is dealt: shuffle the deck, then deal each sorcerer his due (one card for a Sorcerer, two for a Sorcerer Paladin, three for a Master Sorcerer, four for a Great Sorcerer). After looking at them, the player may discard any he wishes and be dealt replacements from the same deck in the same way.',
    es: 'Los Brujos Enanos del Caos no emplean las mismas cartas de hechizos que los demás Hechiceros del Caos, sino que disponen de su propio mazo de diez cartas de hechizo. Las cartas se reparten de la misma forma que a los hechiceros de un color: primero se mezclan y a continuación se reparte la cantidad precisa a cada brujo (una para un Brujo, dos para un Paladín Brujo, tres para un Maestro Brujo y cuatro para un Gran Brujo). Después de examinar las cartas, el jugador puede descartar las que quiera a cambio de otras repartidas de la misma forma y del mismo mazo.',
  },
  {
    // OLD-57 — Enanos del Caos printed p.11. Alias 'magical breath' matches at
    // index 0 of the tag and so beats the generic 'breath' further along it.
    // The old tag only mentioned the 4+ dispel and left out the second half of
    // the rule, the -1 to hit with magic weapons.
    id: 'lammasu-magical-breath',
    aliases: ['magical breath'],
    titleEn: 'Magical Breath (Lammasu)',
    titleEs: 'Respiración mágica (Lammasu)',
    en: 'A Lammasu breathes rippling strands of magic that wreathe it in a cloud of magical protection, and the rule does two things. First, a spell cast at the Lammasu or its rider has no effect on a 4, 5 or 6 on 1D6, exactly as if a Dispel Magic card had been played by a wizard. Only one such roll may be attempted per spell cast at the creature; if the spell is not dispelled this way, Dispel Magic cards may still be used as normal. Second, the smoking black strands of sorcery can block or deflect any attack made against the Lammasu or its rider in close combat with a magic weapon: the chance to hit is always reduced by 1, whatever the other modifiers or special considerations, so it is impossible to need better than a 2+, and a weapon that would normally hit automatically must roll a 2 or more. An enemy carrying a magic weapon may choose to use an ordinary weapon instead. This second ability works only against weapons used in close combat, not against fireballs, lightning or other magical effects the weapon may produce: those are cast as spells, and can be stopped by the Lammasu’s basic ability to dispel spells described above.',
    es: 'Los Lammasu respiran ondulantes fibras mágicas que los rodean en una nube de protección mágica, y la regla hace dos cosas. Primero, si se lanza un hechizo contra un Lammasu o su jinete, el hechizo no surtirá efecto si se obtiene un resultado de 4, 5 ó 6 en una tirada de 1D6, como si se tratara de una carta de Dispersión de Magia lanzada por un hechicero. Sólo podrá intentarse una tirada como ésta por cada hechizo lanzado contra la criatura; si no se consigue dispersar el hechizo de esta forma, podrán emplearse cartas de Dispersión de Magia normalmente. Segundo, las humeantes fibras negras de hechicería que lo rodean pueden obstruir o desviar cualquier ataque de un arma mágica efectuado contra él o contra su jinete en combate cuerpo a cuerpo: la posibilidad de impactar siempre se reduce en -1 sin tener en cuenta los demás modificadores o consideraciones especiales, por lo que es imposible obtener una probabilidad de impactar superior a 2+, y un arma que normalmente impactaría automáticamente deberá obtener un resultado de 2+. Un enemigo armado con un arma mágica puede usar, si quiere, un arma normal. Esta segunda habilidad sólo sirve contra armas usadas en combate cuerpo a cuerpo y no contra bolas de fuego, rayos u otros efectos mágicos que pueda producir el arma: esos efectos se lanzan como hechizos y pueden ser anulados por la capacidad básica de dispersar hechizos del Lammasu descrita arriba.',
  },
  {
    // OLD-56 — Enanos del Caos printed p.10. Listed BEFORE 'breath-weapon': the
    // tag reads "Fire Breath — ...", so alias 'fire breath' matches at index 0
    // and beats the generic 'breath' at index 5. The generic article says the
    // hits are Strength 4; the Great Taurus breathes at Strength 3, so it needs
    // its own entry rather than the shared one.
    id: 'great-taurus-fire-breath',
    aliases: ['fire breath'],
    titleEn: 'Fire Breath (Great Taurus)',
    titleEs: 'Aliento de fuego (Gran Tauro)',
    en: 'The Great Taurus can blow flames over its enemies. Use the teardrop template, with the narrow end against the creature’s mouth and the wide end over the target. Any model under the template is hit on a 4 or more on 1D6, and each model hit takes a single Strength 3 attack. Damage and saves are resolved normally. The fire may also set buildings alight, as described in the Warhammer rulebook, and causes extra wounds to easily flammable targets such as Treemen and Mummies.',
    es: 'El Gran Tauro puede soplar llamaradas sobre sus enemigos. Emplea la plantilla en forma de lágrima, colocando la parte estrecha junto a la boca de la criatura y el extremo ancho sobre el objetivo. Cualquier miniatura que se encuentre bajo la plantilla será alcanzada con un resultado de 4 o más en 1D6, y cada miniatura alcanzada recibirá un único ataque de Fuerza 3. El daño y las tiradas de salvación se resuelven normalmente. Además el fuego puede incendiar edificios, tal y como se describe en el reglamento de Warhammer, y causa heridas adicionales a los objetivos fácilmente inflamables como los Hombres Árbol y las Momias.',
  },
  {
    // OLD-56 — Enanos del Caos printed p.10. The book calls this an armour save
    // ("como si fuera una armadura"), not a ward save, which is what the tag
    // used to claim.
    id: 'great-taurus-burning-hide',
    aliases: ['burning hide'],
    titleEn: 'Burning Hide (Great Taurus)',
    titleEs: 'Piel ardiente (Gran Tauro)',
    en: 'The hide of a Great Taurus glows red-hot and is wreathed in sparks. Its tough skin stops weapon blows as if it were armour, so the creature has an armour save of 4, 5 or 6.',
    es: 'La piel de los Grandes Tauros brilla al rojo vivo y está rodeada de chispas. Su duro pellejo puede detener los golpes de las armas como si fuera una armadura, por lo que disponen de una tirada de salvación de 4, 5 ó 6.',
  },
  {
    id: 'breath-weapon',
    aliases: ['breath weapon', 'breath', 'breathe', 'arma de aliento', 'aliento'],
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
    aliases: ['great weapon', 'two-handed', 'double-handed', 'arma a dos manos', 'armas a dos manos'],
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
    id: 'halberd',
    aliases: ['halberd', 'alabarda'],
    titleEn: 'Halberd',
    titleEs: 'Alabarda',
    en: 'A heavy polearm that adds +1 Strength in close combat. It takes both hands, so the wielder cannot also use a shield in combat.',
    es: 'Un arma de asta pesada que suma +1 a la Fuerza en combate cuerpo a cuerpo. Se empuña con ambas manos, así que quien la lleva no puede usar también escudo en combate.',
  },
  {
    // FAQ 1996 §3.1 / §4.2: "troops with flails need to add the strength bonus
    // for the first round of hand to hand combat".
    id: 'flail',
    aliases: ['flail', 'mangual', 'mayal'],
    titleEn: 'Flail',
    titleEs: 'Mangual',
    en: 'Heavy balls or spiked heads on chains. A flail adds +2 Strength, but only in the first round of each close combat; after that the wielder fights at normal Strength.',
    es: 'Bolas o cabezas con pinchos unidas por cadenas. El mangual suma +2 a la Fuerza, pero sólo en el primer turno de cada combate cuerpo a cuerpo; después se lucha con la Fuerza normal.',
  },
  {
    id: 'bow',
    aliases: ['bow', 'arco'],
    titleEn: 'Bow',
    titleEs: 'Arco',
    en: 'Missile weapon: range 24", Strength 3.',
    es: 'Arma de proyectiles: alcance 24", Fuerza 3.',
  },
  {
    id: 'short-bow',
    aliases: ['short bow', 'arco corto', 'arcos cortos'],
    titleEn: 'Short Bow',
    titleEs: 'Arco corto',
    en: 'Missile weapon: range 16", Strength 3.',
    es: 'Arma de proyectiles: alcance 16", Fuerza 3.',
  },
  {
    id: 'longbow',
    aliases: ['longbow', 'long bow', 'arco largo', 'arcos largos'],
    titleEn: 'Longbow',
    titleEs: 'Arco largo',
    en: 'Missile weapon: range 30", Strength 3.',
    es: 'Arma de proyectiles: alcance 30", Fuerza 3.',
  },
  {
    id: 'crossbow',
    aliases: ['crossbow', 'ballesta'],
    titleEn: 'Crossbow',
    titleEs: 'Ballesta',
    en: 'Missile weapon: range 30", Strength 4.',
    es: 'Arma de proyectiles: alcance 30", Fuerza 4.',
  },
  {
    id: 'sling',
    aliases: ['sling', 'honda'],
    titleEn: 'Sling',
    titleEs: 'Honda',
    en: 'Missile weapon: range 18", Strength 3.',
    es: 'Arma de proyectiles: alcance 18", Fuerza 3.',
  },
  {
    // FAQ 1996 §8.1 (Rule Book pp.20, 95): barding −1 M; with heavy armour and
    // shield as well, −2 M.
    id: 'barding',
    aliases: ['barding', 'barda'],
    titleEn: 'Barding',
    titleEs: 'Barda',
    en: 'Armour for the mount. It improves the rider’s armour save by +1, but the weight costs the mount 1 point of Movement (2 if the rider also carries heavy armour and shield).',
    es: 'Armadura para la montura. Mejora en +1 la salvación por armadura del jinete, pero su peso resta 1 punto de Movimiento a la montura (2 si el jinete lleva además armadura pesada y escudo).',
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
    aliases: ['battle standard', 'portaestandarte de batalla'],
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

/**
 * Tags whose glossary article the heuristic gets wrong, pinned by hand.
 *
 * `null` suppresses the ⓘ entirely. These are the cases word-aware matching
 * cannot reach, because the alias really is a word of the tag — it just does not
 * mean the rule. Two kinds show up:
 *
 *  - **negations** — the tag says the model does NOT have the rule
 *    ("Living — not Undead; does not cause fear");
 *  - **proper names** — a rule's word inside the name of a weapon, a formation
 *    or a troop type ("Lance formation", "the Storm Daemon" halberd).
 *
 * Keyed by the English tag verbatim, exactly like `RULE_PHRASE_ES`: a tag IS its
 * own key. Editing a tag's English text orphans its entry here — the pinning
 * test in `ruleTags.test.ts` fails when that happens.
 */
export const TAG_RULE_OVERRIDES: Record<string, string | null> = {
  // OLD-51 — the four Chaos Dwarf bestiary rules (printed p.9). Pinned rather
  // than left to the alias search: "Magic — no Dwarf magic resistance…" would
  // otherwise open the Magic Resistance article and claim the very thing the
  // rule denies, which is the OLD-16 failure all over again.
  'Armour — moves 3" (8cm) whatever armour is worn': 'chaos-dwarf-armour',
  'Pursuit & Flight — pursues and flees 5D6 minus 3cm': 'chaos-dwarf-pursuit',
  'Magic — no Dwarf magic resistance; dispels like any other army': 'chaos-dwarf-magic',
  'Chaos Dwarf Sorcerers — their own deck of ten spell cards': 'chaos-dwarf-sorcerers',
  // Negations — the tag denies the very rule its words name.
  'Living — not Undead; does not cause fear': null,
  'Living — not Undead; subject to psychology': null,
  'Has yet to develop its breath weapon, so has no breath attack': null,
  'Fixed Scientific Items (not magic items): Sphere of Alchemy, Prism of Power, Compass of Meteoric Silver':
    null,
  // Proper names that merely contain a rule word.
  'Lance formation': null, // the Bretonnian FORMATION, not the cavalry weapon
  'Breath of Life — regains a wound on 4+ each Chaos turn; can even reincarnate': null,
  'Must take the Storm Daemon as his first magic item (+25 pts); up to 4 magic items': 'magic-items',
  'The Storm Daemon (Tormenta Demoníaca) halberd: S6, casts Warp Lightning (1D6 hits)': null,
  'May include any number of Slayer Paladins (Giant/Dragon/Daemon Slayers)': null,
  'Cloud of Flies (-1 to hit them)': null,
  'Cloud of Flies — enemies in base contact suffer -1 to hit in close combat': null,
  'Fearfrost magic sword (+100 pts) — fixed magic item': 'magic-items',
  // Special saves named "Shield" — not the mundane shield the article describes.
  'Mighty Shield of the Old Ones — 3+ special save against each wound': null,
  'Shield of Sotek — 4+ special save against each wound (cannot be reduced by Strength); wounds from armour-ignoring attacks can still be saved':
    null,
  'Shield of the Old Ones — 4+ special save against each wound': null,
  'Shield of the Old Ones — 4+ special save against each wound (whole palanquin model)': null,
  // Weapon words that name something other than the mundane weapon.
  'Repeater Crossbow': null, // not the 30"/S4 crossbow
  'Genius — before battle choose one: Artillery Accuracy, Crossbow Accuracy or Battle Strategy': null,
  'Accompanied by Hugo le Petit (longbow hits at S5) and Gui le Gros': null,
  'Citizen Levy — shoot with two ranks of bows': null,
  'Runefang (+30 pts) and Dragon Bow (+40 pts) — fixed magic items': 'magic-items',
  'Bow or javelin poison tips +1 pt (hits at +1 Strength)': 'poisoned-attacks',
  'Shoot on the Wing — may shoot crossbows while flying with no move penalty (cannot shoot on foot)': 'flying',
  // Named mounts whose barding is part of a special profile.
  'Rides Malhandir (M12" WS4 S4 T3 W1 I5 A2 Ld7) with Dragon Armour barding (2+ save)': null,
  "Rides W'Soraych, the Apocalypse Steed (M30→12\", WS6, S5, T4, I6, A3) with barding": null,
}

/**
 * English inflections an alias may carry and still count as the same word.
 *
 * This is the whole reason matching is not a bare `\b`: the tags are prose, so
 * the glossary's singular "shield" has to reach "shields" and "skirmish" has to
 * reach "skirmisher"/"skirmishers", and "armour" has to reach "light armoured
 * jackets". What it must NOT reach is a different word that merely starts the
 * same — "lance" inside "Lancers", "spear" inside "Spearmen", "fear" inside
 * "Fearfrost". Those are the bug.
 *
 * Kept deliberately tiny. Every entry earns its place by a tag that exists:
 * widening it is how "lance" would creep back into "Lancers".
 */
const INFLECTIONS = ['s', 'es', 'ed', 'er', 'ers', 'ing']

const ALIAS_RE = new Map<string, RegExp>()

function aliasRegExp(alias: string): RegExp {
  let re = ALIAS_RE.get(alias)
  if (!re) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    // Both ends sit on a word boundary that understands accented letters, which
    // `\b` does not — 'lanza' must not match inside 'lanzavirotes'.
    //
    // The leading edge is a CONSUMING group rather than a lookbehind, and that
    // is deliberate: Safari only learned lookbehind in 16.4, and a `new RegExp`
    // the engine cannot parse throws a SyntaxError where it is built — here,
    // inside a render — instead of degrading. Nothing else in this app needs
    // anything newer than Safari 14, so a lookbehind would be the single
    // construct that breaks it, and it would break it hard: every unit with
    // special rules would fail to expand. `aliasIndex` adds the group back.
    re = new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}(?:${INFLECTIONS.join('|')})?(?![\\p{L}\\p{N}])`, 'u')
    ALIAS_RE.set(alias, re)
  }
  return re
}

/** Index at which `alias` appears in `text` as a whole word, or -1. */
function aliasIndex(text: string, alias: string): number {
  const m = aliasRegExp(alias).exec(text)
  // m[1] is the character consumed before the alias: '' at the start of the
  // string, otherwise the single non-word character that precedes it.
  return m ? m.index + m[1].length : -1
}

/**
 * Find the glossary entry that best matches an ability tag, or undefined.
 *
 * Two rules, in order:
 *  1. An explicit `TAG_RULE_OVERRIDES` entry always wins (and may suppress).
 *  2. Otherwise the alias that appears EARLIEST in the tag wins. The tags are
 *     written lead-first ("Causes fear; Hatred when in the front rank..."), so
 *     position is what identifies the subject. Ties go to the longer alias, then
 *     to the earlier `RULES` entry.
 *
 * Position beats array order deliberately: relying on array order meant a new
 * entry could silently steal another's ⓘ by being inserted above it.
 */
export function findRule(tag: string): RuleDef | undefined {
  if (Object.prototype.hasOwnProperty.call(TAG_RULE_OVERRIDES, tag)) {
    const id = TAG_RULE_OVERRIDES[tag]
    return id === null ? undefined : RULES.find((r) => r.id === id)
  }
  const t = tag.toLowerCase()
  let best: { rule: RuleDef; at: number; len: number } | undefined
  for (const r of RULES) {
    for (const a of r.aliases) {
      const at = aliasIndex(t, a)
      if (at < 0) continue
      if (!best || at < best.at || (at === best.at && a.length > best.len)) {
        best = { rule: r, at, len: a.length }
      }
    }
  }
  return best?.rule
}

/**
 * Option ids whose glossary article `findRule` gets wrong from the option's
 * name, pinned by hand — `null` suppresses the ⓘ. Keyed by option id, so one
 * entry covers every army that reuses the id.
 */
export const OPTION_RULE_OVERRIDES: Record<string, string | null> = {
  // "Repeater Crossbows" are not the 30"/S4 crossbow the article describes.
  rxbow: null,
  // The Lizardmen giant bow is its own weapon (36", S5), not a 24"/S3 bow.
  'giant-bow': null,
}

/**
 * The glossary article explaining an equipment option (halberd, flail, bows…),
 * or undefined. Options carrying their own `description` don't need this —
 * the caller shows that instead.
 */
export function findOptionRule(option: { id: string; name: string }): RuleDef | undefined {
  if (Object.prototype.hasOwnProperty.call(OPTION_RULE_OVERRIDES, option.id)) {
    const id = OPTION_RULE_OVERRIDES[option.id]
    return id === null ? undefined : RULES.find((r) => r.id === id)
  }
  return findRule(option.name)
}
