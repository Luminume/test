/**
 * Bestiaire du système.
 * - Zombie de Phase 1 : profil officiel du livre (rappelé dans le Bestiaire II de la campagne).
 * - Campagne Atica : Bestiaire II (faune, cultistes, créations, lac, aberration d'Eliah).
 * - Profils maison : créatures sans profil officiel disponible (à remplacer si besoin).
 *
 * Champs d'un acteur :
 *   attributes  codes des 6 Caractéristiques
 *   skills      [nom (base ou spécialité), code total] → compétences ajoutées
 *   weapons     nom d'une arme de la banque, ou { name, skill, damage, notes, ammo, range }
 *               (« Str+1D » du document = « +1D » : s'ajoute au bonus aux dégâts)
 *   equipment   nom d'une protection de la banque, ou { name, protection, notes }
 *   damageBonus bonus aux dégâts imposé (sinon calculé depuis la Puissance)
 *   horde       { count, per } : règle de horde (+5 toutes les `per` créatures au-delà de la première)
 */

const PHASE1 = "Hostile : insensible à la douleur, vue faible, ouïe et odorat excellents (p. 104). "
  + "Seule la destruction de l'hypophyse ou la décapitation l'arrête. Sang et salive contaminants.";

const HORDE_RULE = "RÈGLE DE HORDE : un seul jet d'attaque pour le groupe (bonus de nombre ajouté automatiquement). "
  + "Chaque niveau de blessure infligé à la horde élimine environ 20 % des créatures (appliqué automatiquement). "
  + "Une créature isolée se joue avec sa fiche individuelle.";

const ZOMBIE_BITE = { name: "Morsure", skill: "bagarre", damage: "+1D", notes: "Contamination possible : voir les règles du virus." };
const NO_RANGE = { short: "", medium: "", long: "" };

/** Profil officiel du zombie de Phase 1 (livre, rappelé dans le Bestiaire II). */
const ZOMBIE_PHASE1 = {
  attributes: { agilite: "3D", adresse: "1D", puissance: "3D", connaissances: "1D", perception: "1D", presence: "1D" },
  skills: [["Bagarre", "3D+2"], ["Soulever", "3D"], ["Chercher", "3D"], ["Pister", "3D"], ["Intimidation", "3D"]],
  movement: "4", damageBonus: "2D"
};

export const BESTIARY = [
  {
    folder: "Zombies (livre)", img: "icons/svg/skull.svg", painless: true,
    actors: [
      {
        name: "Zombie (Phase 1)", ...ZOMBIE_PHASE1,
        weapons: [ZOMBIE_BITE],
        notes: `Profil officiel du livre. ${PHASE1}`
      },
      {
        name: "Horde de zombies (Phase 1)", movement: "4", damageBonus: "2D",
        attributes: { agilite: "3D+2", adresse: "1D", puissance: "3D", connaissances: "1D", perception: "1D", presence: "1D" },
        skills: [["Bagarre (horde)", "3D+2"]],
        weapons: [{ ...ZOMBIE_BITE, name: "Morsures de la horde", damage: "+0" }],
        horde: { count: 10, per: 10 },
        notes: `Jet de horde 3D+2, Puissance de référence 3D. ${HORDE_RULE} ${PHASE1} `
          + "Une horde réduite à quelques unités peut être achevée sans nouveau jet si la description s'y prête."
      }
    ]
  },
  {
    folder: "Campagne Atica — Faune mutée & hordes", img: "icons/svg/terror.svg", painless: false,
    actors: [
      {
        name: "Lézard-lanterne", movement: "5 (9 dans les branches)", damageBonus: "2D",
        attributes: { agilite: "4D", adresse: "1D", puissance: "2D+1", connaissances: "1D", perception: "3D+1", presence: "1D" },
        skills: [["Grimper", "6D"], ["Discrétion", "5D"], ["Chercher", "4D"]],
        weapons: [{ name: "Morsure (chute en embuscade)", skill: "bagarre", damage: "+1D+1",
          notes: "Si la cible n'a pas détecté le lézard avant l'attaque : surprise, pas de défense possible au premier coup." }],
        notes: "Prédateur de forêt, embuscade par leurre lumineux. Grimpe aux arbres et laisse pendre une queue lumineuse pour attirer ses proies. "
          + "Chercher : repère les proies sous l'arbre. Nombreux sur le territoire de Jah'ste.\n"
          + "▸ Lanterne hypnotique : une cible qui fixe la lumière plus de quelques secondes doit réussir Volonté (diff. 10) ou s'approcher inconsciemment de l'arbre."
      },
      {
        name: "Horde de chiens", movement: "7", damageBonus: "2D",
        attributes: { agilite: "4D", adresse: "1D", puissance: "4D", connaissances: "1D", perception: "2D", presence: "1D" },
        skills: [["Bagarre (horde)", "4D"]],
        weapons: [{ name: "Morsures multiples", skill: "bagarre", damage: "+0", notes: "Ne transmet jamais le virus : uniquement des dégâts physiques." }],
        horde: { count: 10, per: 10 },
        notes: `Phase 3, necrobeast canin : chiens errants parasités par des restes de zombies. Jet de horde 4D, Puissance de référence 4D. ${HORDE_RULE}\n`
          + "▸ Pas de contagion.\n▸ Coordination de meute : si la horde encercle une cible isolée (3+ directions), +1D au jet de groupe."
      },
      {
        name: "Horde de rats", movement: "4", damageBonus: "1D",
        attributes: { agilite: "2D+1", adresse: "1D", puissance: "2D", connaissances: "1D", perception: "2D", presence: "1D" },
        skills: [["Bagarre (horde)", "2D+1"]],
        weapons: [{ name: "Morsures de l'essaim", skill: "bagarre", damage: "+0", notes: "" }],
        horde: { count: 25, per: 15 },
        notes: `Vermine mutée : nombre écrasant, faible dégât individuel. Jet de horde 2D+1 (+5 par 15 rats, essaim dense), Puissance de référence 2D. ${HORDE_RULE}\n`
          + "▸ Infiltration : traverse grilles, conduits, brèches minuscules.\n"
          + "▸ Panique de masse : un témoin non préparé doit réussir Volonté (diff. 8) ou perdre son action suivante à reculer."
      },
      {
        name: "Colosse", movement: "5", damageBonus: "4D", painless: true, img: "icons/svg/skull.svg",
        attributes: { agilite: "2D", adresse: "1D", puissance: "6D+2", connaissances: "1D", perception: "1D+2", presence: "2D" },
        skills: [["Soulever", "8D"], ["Endurance", "7D+1"], ["Intimidation", "5D"]],
        weapons: [
          { name: "Poing massif", skill: "bagarre", damage: "+2D", notes: "Peut projeter une cible humaine de 2-3 mètres en arrière." },
          { name: "Charge", skill: "bagarre", damage: "+3D", notes: "S'il a couru 3+ mètres en ligne droite avant l'impact. Une fois par round au maximum." }
        ],
        notes: "Zombie muté de 2 m 30, force surhumaine (virus + corruption de Paresse). Lent mais presque impossible à arrêter. Jamais en horde. Agilité : lent. "
          + "Intimidation : sa seule présence terrifie.\n"
          + "▸ Résistant aux dégâts mineurs : moins de 5 points après comparaison avec sa Puissance ne le ralentissent pas (pas d'accumulation de Sonné).\n"
          + "▸ Cible prioritaire si une horde l'accompagne.\nMini-boss de zone : ne pas en multiplier dans une même rencontre."
      }
    ]
  },
  {
    folder: "Campagne Atica — Cultistes des 7 Péchés", img: "icons/svg/mystery-man.svg", painless: false,
    actors: [
      {
        name: "Cannibale de Gourmandise", movement: "5", damageBonus: "1D",
        attributes: { agilite: "2D+2", adresse: "1D+2", puissance: "2D+1", connaissances: "1D", perception: "2D", presence: "1D+2" },
        skills: [["Bagarre", "3D+1"], ["Chercher", "3D"], ["Intimidation", "2D+2"]],
        weapons: [{ name: "Couperet ou lame de fortune", skill: "melee", damage: "+1D", notes: "Souvent rouillée, parfois encore couverte de sang séché." }],
        notes: "Cultiste de bas rang du territoire de Gourmandise : survivant brisé par la folie collective, non muté, en petites meutes opportunistes. "
          + "Chercher : odeur de chair fraîche.\n▸ Tactique de meute : à 3+ contre une cible isolée, +1D collectif aux tests d'Intimidation avant l'assaut."
      },
      {
        name: "Le Boucher", movement: "5", damageBonus: "2D",
        attributes: { agilite: "2D+1", adresse: "2D+2", puissance: "3D+2", connaissances: "2D", perception: "2D+1", presence: "3D" },
        skills: [["Dextérité", "3D+2"], ["Endurance", "4D"], ["Intimidation", "4D+1"]],
        weapons: [
          { name: "Hachoir de boucher", skill: "melee", damage: "+1D+2", notes: "Arme d'origine, parfaitement entretenue." },
          { name: "Crochets de boucherie (x2)", skill: "melee", damage: "+1D", notes: "Peut immobiliser un membre : Agilité diff. 14 pour se libérer." }
        ],
        notes: "Lieutenant de Gourmandise : prépare la « viande » des rites. Massif, calme, méthodique. Dextérité : précision du dépeçage ; Intimidation : calme terrifiant.\n"
          + "▸ Précision clinique : +1D aux dégâts s'il a observé sa cible un round complet.\n"
          + "▸ Sang-froid absolu : immunisé à la peur et à l'intimidation."
      },
      {
        name: "Cultiste de Colère / Orgueil", movement: "5", damageBonus: "1D",
        attributes: { agilite: "2D+2", adresse: "2D+1", puissance: "2D+2", connaissances: "1D+1", perception: "2D", presence: "2D+1" },
        skills: [["Bagarre", "3D+2"], ["Armes à feu", "2D+2"], ["Endurance", "3D"], ["Intimidation", "3D"]],
        weapons: [
          { name: "Arme de poing improvisée", skill: "armesAFeu", damage: "3D", ammo: 6, notes: "Munitions limitées : ressources rares sur le territoire de Colère." },
          { name: "Couteau ou batte cloutée", skill: "melee", damage: "+1D", notes: "Arme de réserve." }
        ],
        notes: "Membre de l'empire de violence de Colère (incluant l'ancien territoire d'Orgueil annexé), discipliné par la peur.\n"
          + "▸ Discipline par la peur : +1D à l'Initiative de groupe si un supérieur de Colère est visible."
      },
      {
        name: "Agile", movement: "9", damageBonus: "2D", img: "icons/svg/terror.svg",
        attributes: { agilite: "5D+1", adresse: "1D", puissance: "3D+2", connaissances: "1D", perception: "4D+1", presence: "1D+2" },
        skills: [["Bagarre", "6D"], ["Esquive", "6D+2"], ["Acrobaties", "6D"], ["Endurance", "4D+1"], ["Pister", "6D"], ["Intimidation", "4D"], ["Discrétion", "7D+1"]],
        weapons: [{ name: "Griffes et morsure", skill: "bagarre", damage: "+1D+2", notes: "Peut attaquer deux fois par round au prix de −1D sur chaque jet." }],
        notes: "Humain corrompu jusqu'à la moelle, type Wendigo : maigre, étiré, d'une rapidité dérangeante. Ne sert aucun Péché, chasse tout être humain. "
          + "Déplacement très rapide et erratique. Pister : odorat développé ; Intimidation : terreur instinctive.\n"
          + "▸ Traque obsessionnelle : ne fuit jamais, n'abandonne jamais une piste fraîche.\n"
          + "▸ Discrétion contre-nature : +2D à Discrétion (inclus dans la compétence)."
      }
    ]
  },
  {
    folder: "Campagne Atica — Créations de Luxure", img: "icons/svg/terror.svg", painless: false,
    actors: [
      {
        name: "Egg Bearer", movement: "4", damageBonus: "1D",
        attributes: { agilite: "2D", adresse: "1D", puissance: "2D+1", connaissances: "1D", perception: "2D+2", presence: "1D+1" },
        skills: [["Endurance", "3D"]],
        weapons: [{ name: "Étreinte parasitaire", skill: "bagarre", damage: "+1D",
          notes: "Immobilise une cible (Agilité diff. 13 pour se libérer), puis tente de transférer une partie de la couvée." }],
        notes: "Hôte parasité, vecteur de ponte. Ralenti par la couvée, protège la couvée avant tout, lucidité fragmentaire, sens accru de la chaleur corporelle.\n"
          + "▸ Ponte : étreinte réussie 2 rounds consécutifs = transfert de couvée. Conséquence grave : en discuter avec le joueur.\n"
          + "▸ Fragment d'humanité (MJ) : approché avec prudence, peut manifester une dernière lueur de reconnaissance."
      },
      {
        name: "Lust Minion", movement: "7 (murs compris)", damageBonus: "2D",
        attributes: { agilite: "4D+1", adresse: "2D+1", puissance: "3D+1", connaissances: "2D", perception: "3D", presence: "4D" },
        skills: [["Esquive", "5D+2"], ["Acrobaties", "5D"], ["Endurance", "4D"], ["Charmer", "5D+2"]],
        weapons: [{ name: "Membres arachnéens supplémentaires", skill: "bagarre", damage: "+1D+1", notes: "Attaque secondaire à −1D dans le même round." }],
        notes: "Humain-arachnide, élu de la beauté de Luxure. Peut grimper aux murs à déplacement complet.\n"
          + "▸ Charme résiduel : Perception (diff. 14) pour réaliser qu'il n'est pas humain.\n"
          + "▸ Loyauté absolue : immunisé à la peur tant que Luxure est à portée perceptible."
      },
      {
        name: "Mini Spider", movement: "6 (murs et plafonds)", damageBonus: "1D",
        attributes: { agilite: "3D+1", adresse: "1D", puissance: "2D", connaissances: "1D", perception: "2D+2", presence: "1D" },
        skills: [["Grimper", "5D"], ["Discrétion", "4D"]],
        weapons: [{ name: "Morsure venimeuse", skill: "bagarre", damage: "+1D",
          notes: "Venin léger : −1D aux actions pendant 1D3 rounds si la cible échoue Puissance (diff. 10)." }],
        horde: { count: 1, per: 5 },
        notes: "Araignée mutée de la taille d'un enfant de 6 ans, chasse en petits groupes. Détection vibratoire (toile).\n"
          + "▸ Embuscade de groupe : 3+ Mini Spiders sur la même cible → règle de horde simplifiée (+5 par tranche de 5). "
          + "Cocher « Horde » et indiquer le nombre pour l'appliquer."
      },
      {
        name: "Giga Spider", movement: "7 (murs et plafonds)", damageBonus: "3D",
        attributes: { agilite: "4D", adresse: "1D", puissance: "5D", connaissances: "1D", perception: "3D+2", presence: "3D" },
        skills: [["Grimper", "6D"], ["Endurance", "6D"], ["Soulever", "6D"], ["Intimidation", "5D"]],
        weapons: [
          { name: "Mandibules", skill: "bagarre", damage: "+1D+2", notes: "Dégâts perforants." },
          { name: "Toile lourde", skill: "lancer", damage: "0", notes: "Immobilise une cible : Agilité diff. 16 pour se libérer. 2 fois par combat." }
        ],
        notes: "Gardienne des zones critiques de Luxure. Détection vibratoire étendue (15 m).\n"
          + "▸ Gardienne : la vaincre ouvre généralement l'accès à ce que Luxure protégeait.\nMini-boss de zone."
      }
    ]
  },
  {
    folder: "Campagne Atica — Couronne intérieure & hôpitaux", img: "icons/svg/mystery-man.svg", painless: false,
    actors: [
      {
        name: "Scaphandrier", movement: "7", damageBonus: "2D",
        attributes: { agilite: "4D+2", adresse: "4D", puissance: "3D+1", connaissances: "2D", perception: "3D+2", presence: "2D+2" },
        skills: [["Esquive", "6D"], ["Bagarre", "5D"], ["Armes à feu", "5D+1"], ["Endurance", "4D"], ["Volonté", "3D+1"]],
        weapons: [{ name: "Fusil tactique", skill: "armesAFeu", damage: "4D", ammo: 20, notes: "Équipement standard de l'élite de Beans." }],
        equipment: [{ name: "Scaphandre modifié", protection: "+1D", notes: "Injection continue du produit Novatis tant que le scaphandre fonctionne." }],
        notes: "Élite de Michael Beans, scaphandre dopé au produit Novatis : réflexes chimiques.\n"
          + "▸ Réflexes surnaturels : gagne toujours l'initiative contre une cible humaine non préparée.\n"
          + "▸ Dépendance au scaphandre : endommagé ou retiré, il perd ses bonus et subit −1D à toutes ses actions pour la scène (sevrage)."
      },
      {
        name: "Infirmière zombie", ...ZOMBIE_PHASE1, painless: true, img: "icons/svg/skull.svg",
        weapons: [ZOMBIE_BITE],
        notes: `Phase 1, milieu hospitalier : zombie standard en uniforme d'infirmière. Mécaniquement identique au zombie du livre. ${PHASE1}`
      },
      {
        name: "Bébé zombie", movement: "1 (rampe)", damageBonus: "0D", painless: true, img: "icons/svg/skull.svg",
        attributes: { agilite: "1D", adresse: "1D", puissance: "1D", connaissances: "1D", perception: "1D", presence: "1D" },
        skills: [],
        weapons: [],
        notes: "Phase 1, maternités. NOTE MJ : volontairement pas conçu pour le combat, aucun test de dégâts substantiel. "
          + "À jouer comme un moment narratif, pour le poids émotionnel de la scène."
      },
      {
        name: "Mad Man", movement: "5", damageBonus: "1D",
        attributes: { agilite: "2D+2", adresse: "1D+2", puissance: "2D+1", connaissances: "1D+1", perception: "2D", presence: "2D+2" },
        skills: [["Bagarre", "4D"], ["Endurance", "3D+1"], ["Intimidation", "3D+2"]],
        weapons: [{ name: "Objet improvisé / mains nues", skill: "bagarre", damage: "+1D", notes: "Pas d'arme préparée : utilise ce qui traîne." }],
        notes: "Patient de l'aile psychiatrique, survivant non infecté et instable. Bagarre : accès de force erratique.\n"
          + "▸ Insensible à la douleur perçue : ignore les pénalités du niveau Sonné (à appliquer à la main).\n"
          + "▸ Imprévisibilité (MJ) : au début de chaque rencontre, choisir terreur passive, confusion ou violence active."
      }
    ]
  },
  {
    folder: "Campagne Atica — Profondeurs du lac", img: "icons/svg/terror.svg", painless: false,
    actors: [
      {
        name: "Banc d'anguilles", movement: "6 (en eau uniquement)", damageBonus: "1D+2",
        attributes: { agilite: "3D", adresse: "1D", puissance: "2D+2", connaissances: "1D", perception: "2D", presence: "1D" },
        skills: [["Bagarre (horde)", "3D"]],
        weapons: [{ name: "Morsures du banc", skill: "bagarre", damage: "+0", notes: "" }],
        horde: { count: 10, per: 10 },
        notes: `Faune lacustre corrompue par Paresse. Jet de horde 3D, Puissance de référence 2D+2. ${HORDE_RULE}\n`
          + "▸ Sens électrique : aucune pénalité de Perception dans l'obscurité ou l'eau trouble."
      },
      {
        name: "Noyés revenus à la vie", movement: "3 (5 en eau)", damageBonus: "2D",
        attributes: { agilite: "3D+1", adresse: "1D", puissance: "3D+1", connaissances: "1D", perception: "2D", presence: "1D" },
        skills: [["Bagarre (horde)", "3D+1"]],
        weapons: [{ name: "Étreinte noyeuse", skill: "bagarre", damage: "+0",
          notes: "En eau profonde, la cible saisie risque d'être entraînée vers le fond : Agilité diff. 14 pour se libérer." }],
        horde: { count: 10, per: 10 },
        notes: `Victimes de noyade ramenées par la corruption du lac (pas le virus). Jet de horde 3D+1, Puissance de référence 3D+1. ${HORDE_RULE}\n`
          + "▸ Attente immobile : indétectables sous l'eau sans Perception (diff. 15), puis embuscade."
      },
      {
        name: "Horreur marine", movement: "3 (8 en eau)", damageBonus: "2D",
        attributes: { agilite: "3D+2", adresse: "2D+1", puissance: "4D", connaissances: "2D+2", perception: "3D+1", presence: "2D+2" },
        skills: [["Nager", "6D"], ["Esquive", "4D"], ["Endurance", "5D"], ["Intimidation", "4D"]],
        weapons: [{ name: "Griffes palmées", skill: "bagarre", damage: "+1D+1", notes: "Dégâts perforants et lacérants combinés." }],
        notes: "Sous-fifre aquatique de Paresse, d'inspiration lovecraftienne. Connaissance fragmentaire de Paresse.\n"
          + "▸ Communication silencieuse : les Horreurs proches agissent en synchronisation parfaite.\n"
          + "▸ Écho de Paresse : Volonté (diff. 11) pour qui la regarde trop longtemps, sinon −1D aux actions ce round."
      },
      {
        name: "Kraken", movement: "4 (10 en eau)", damageBonus: "6D",
        attributes: { agilite: "5D", adresse: "1D", puissance: "9D", connaissances: "1D", perception: "5D", presence: "1D" },
        skills: [["Nager", "8D"], ["Endurance", "11D"]],
        weapons: [{ name: "Tentacule massif", skill: "bagarre", damage: "+3D", range: { short: "12 m", medium: "", long: "" },
          notes: "Peut saisir une embarcation entière ou un groupe : Puissance diff. 22 pour résister à l'étreinte." }],
        notes: "Manifestation majeure du lac, échelle d'Ancien mineur. STATISTIQUES DE RÉFÉRENCE UNIQUEMENT (Adresse, Connaissances et Présence non précisées). "
          + "AVERTISSEMENT MJ : pas un ennemi affrontable de front ; une confrontation prolongée doit se solder par la mort ou la fuite des PJ. "
          + "À utiliser comme menace environnementale ou obstacle de traversée.\n"
          + "▸ Présence avant le combat : l'eau qui bouillonne, l'ombre massive sous la surface suffisent à pousser à la fuite."
      }
    ]
  },
  {
    folder: "Campagne Atica — Aberration d'Eliah", img: "icons/svg/terror.svg", painless: false,
    actors: [
      {
        name: "Test biologique n°1", movement: "6 (9 en espace dégagé)", damageBonus: "4D",
        attributes: { agilite: "3D+1", adresse: "1D", puissance: "7D", connaissances: "1D", perception: "5D+2", presence: "3D" },
        skills: [["Endurance", "8D+1"], ["Soulever", "8D"], ["Intimidation", "6D"]],
        weapons: [
          { name: "Morsure massive", skill: "bagarre", damage: "+2D", notes: "Mâchoire démesurée, capable d'engloutir un membre entier." },
          { name: "Coup de queue", skill: "bagarre", damage: "+1D+2", range: { short: "4 m", medium: "", long: "" }, notes: "Peut toucher deux cibles alignées." }
        ],
        notes: "Création abandonnée d'Eliah, au fond des égouts : dragon aveugle sans écailles. Mini-boss de zone (entre les péchés mutants et les Anciens).\n"
          + "POUVOIRS OCCULTES\n▸ Écholocalisation vibratoire : aucune pénalité de Perception liée à l'obscurité ou à l'absence de vue.\n"
          + "▸ Peau sans écailles : les armes tranchantes font la moitié des dégâts (contondantes et perforantes normales).\n"
          + "▸ Vestige de conception (MJ) : Sciences occultes ou Médecine avancée peuvent reconnaître la signature d'Eliah.\n"
          + "FAIBLESSE\n▸ Silence et immobilité : Discrétion (diff. 18) maintenue chaque round rend une cible indétectable."
      }
    ]
  },
  {
    folder: "Profils maison", img: "icons/svg/mystery-man.svg", painless: false,
    actors: [
      {
        name: "Zombie frais (coureur)", movement: "8", painless: true, img: "icons/svg/skull.svg",
        attributes: { agilite: "3D+1", adresse: "1D", puissance: "3D", connaissances: "1D", perception: "1D", presence: "1D" },
        skills: [["Bagarre", "4D"], ["Courir", "4D"], ["Chercher", "3D"]],
        weapons: [ZOMBIE_BITE],
        notes: `Profil maison : contaminé récent, encore rapide. ${PHASE1}`
      },
      {
        name: "Civil paniqué",
        attributes: { agilite: "2D+1", adresse: "2D", puissance: "2D", connaissances: "2D", perception: "2D", presence: "2D" },
        skills: [["Courir", "3D"], ["Discrétion", "2D+2"]],
        weapons: [],
        notes: "Profil maison. Fuit au premier coup de feu ; peut suivre un PJ qui le rassure (Persuasion, Commander)."
      },
      {
        name: "Pillard armé",
        attributes: { agilite: "3D", adresse: "3D", puissance: "3D", connaissances: "2D", perception: "3D", presence: "2D+1" },
        skills: [["Armes à feu", "4D"], ["Bagarre", "4D"], ["Mêlée", "3D+2"], ["Intimidation", "3D+1"], ["Connaissance de la rue", "3D+2"]],
        weapons: ["Smith & Wesson .38 revolver", "Machette"],
        notes: "Profil maison. En bande de 3 à 6, attaque les survivants isolés pour leurs vivres et leurs armes."
      },
      {
        name: "Soldat de l'US Army",
        attributes: { agilite: "3D", adresse: "3D+2", puissance: "3D", connaissances: "2D+1", perception: "3D", presence: "2D+2" },
        skills: [["Armes à feu", "5D"], ["Esquive", "4D"], ["Bagarre", "4D"], ["Démolition", "3D"], ["Volonté", "3D+1"]],
        weapons: ["Kalashnikov AK-47 (7.62x39mm)", "Couteau (survie, grand), dague"],
        equipment: ["Gilet pare-balles"],
        notes: "Profil maison. Garde un cordon de quarantaine ; ordre de tirer sur tout infecté."
      },
      {
        name: "Agent de sécurité OneWorld",
        attributes: { agilite: "3D", adresse: "3D+1", puissance: "3D", connaissances: "2D+2", perception: "3D", presence: "3D" },
        skills: [["Armes à feu", "4D+1"], ["Esquive", "3D+2"], ["Sécurité", "3D+2"], ["Commander", "3D+1"]],
        weapons: ["Glock 17 9mm", "Bâton, matraque, tisonnier"],
        equipment: ["Gilet pare-balles"],
        notes: "Profil maison. Protège les installations et le personnel de OneWorld."
      }
    ]
  }
];

export { NO_RANGE };
