/**
 * Données de règles de Z-Corps.
 * Les valeurs marquées « À VÉRIFIER » viennent des règles D6 génériques :
 * ajuste-les ici si le livre de base dit autre chose.
 */

export const SYSTEM_ID = "zcorps-vtt";

/** Attributs, dans l'ordre d'affichage de la fiche (2 colonnes). */
export const ATTRIBUTES = {
  agilite: "Agilité",
  connaissances: "Connaissances",
  adresse: "Adresse",
  perception: "Perception",
  puissance: "Puissance",
  presence: "Présence"
};

/** Compétences de base de la fiche officielle, rattachées à leur attribut. */
export const SKILLS = {
  acrobaties: { label: "Acrobaties", attribute: "agilite" },
  bagarre: { label: "Bagarre", attribute: "agilite" },
  contorsion: { label: "Contorsion", attribute: "agilite" },
  discretion: { label: "Discrétion", attribute: "agilite" },
  equitation: { label: "Équitation", attribute: "agilite" },
  esquive: { label: "Esquive", attribute: "agilite" },
  grimper: { label: "Grimper", attribute: "agilite" },
  melee: { label: "Mêlée", attribute: "agilite" },
  sauter: { label: "Sauter", attribute: "agilite" },

  armesAFeu: { label: "Armes à feu", attribute: "adresse" },
  armesDeJet: { label: "Armes de jet", attribute: "adresse" },
  crochetage: { label: "Crochetage", attribute: "adresse" },
  dexterite: { label: "Dextérité", attribute: "adresse" },
  lancer: { label: "Lancer", attribute: "adresse" },
  pilotage: { label: "Pilotage", attribute: "adresse" },
  reparer: { label: "Réparer", attribute: "adresse" },

  courir: { label: "Courir", attribute: "puissance" },
  endurance: { label: "Endurance", attribute: "puissance" },
  nager: { label: "Nager", attribute: "puissance" },
  soulever: { label: "Soulever", attribute: "puissance" },

  affaires: { label: "Affaires", attribute: "connaissances" },
  contrefacon: { label: "Contrefaçon", attribute: "connaissances" },
  demolition: { label: "Démolition", attribute: "connaissances" },
  electronique: { label: "Électronique", attribute: "connaissances" },
  erudition: { label: "Érudition", attribute: "connaissances" },
  informatique: { label: "Informatique", attribute: "connaissances" },
  langues: { label: "Langues", attribute: "connaissances" },
  medecine: { label: "Médecine", attribute: "connaissances" },
  navigation: { label: "Navigation", attribute: "connaissances" },
  securite: { label: "Sécurité", attribute: "connaissances" },
  sciencesOccultes: { label: "Sciences occultes", attribute: "connaissances" },

  artiste: { label: "Artiste", attribute: "perception" },
  camouflage: { label: "Camouflage", attribute: "perception" },
  chercher: { label: "Chercher", attribute: "perception" },
  connaissanceRue: { label: "Connaissance de la rue", attribute: "perception" },
  investigation: { label: "Investigation", attribute: "perception" },
  jeux: { label: "Jeux", attribute: "perception" },
  pister: { label: "Pister", attribute: "perception" },
  survie: { label: "Survie", attribute: "perception" },

  charmer: { label: "Charmer", attribute: "presence" },
  commander: { label: "Commander", attribute: "presence" },
  deguisement: { label: "Déguisement", attribute: "presence" },
  dressage: { label: "Dressage", attribute: "presence" },
  empathie: { label: "Empathie", attribute: "presence" },
  escroquerie: { label: "Escroquerie", attribute: "presence" },
  intimidation: { label: "Intimidation", attribute: "presence" },
  persuasion: { label: "Persuasion", attribute: "presence" },
  volonte: { label: "Volonté", attribute: "presence" }
};

/**
 * Niveaux de blessure (index = valeur stockée dans system.wounds.value), p. 63.
 * `penalty` = dés retirés aux jets de Compétence et de Caractéristique (non cumulables).
 */
export const WOUNDS = [
  { level: 0, label: "Indemne", range: "", penalty: 0 },
  { level: 1, label: "Sonné", range: "1 à 3", penalty: 1,
    effect: "-1D aux actions restantes du round et au round suivant (ou seulement se défendre / battre en retraite)." },
  { level: 2, label: "Blessé", range: "4 à 8", penalty: 1, effect: "-1D à toutes les actions jusqu'à la guérison." },
  { level: 3, label: "Gravement blessé", range: "4 à 8", penalty: 2, effect: "-2D à toutes les actions jusqu'à la guérison." },
  { level: 4, label: "Handicapé", range: "9 à 12", penalty: 3,
    effect: "Test de Volonté ou d'Endurance Moyen (15) pour rester debout avec -3D, sinon K.O. pendant 10D minutes." },
  { level: 5, label: "Mortellement blessé", range: "13 à 15", penalty: 0, incapacitated: true,
    effect: "Inconscient. Test de Puissance chaque round : mort si le résultat est inférieur au nombre de minutes écoulées." },
  { level: 6, label: "Mort", range: "16+", penalty: 0, incapacitated: true, effect: "Désolé. Game over." }
];

/**
 * Échelle de stress, reprise de la fiche (dé du test et effet indiqué sous la case).
 * Le chapitre « Stress et Folies » n'a pas encore été intégré.
 */
export const STRESS = [
  { label: "Calme", die: "d8", effect: "" },
  { label: "Énervé", die: "d10", effect: "-1D×1" },
  { label: "Stressé", die: "d10", effect: "-1D×2" },
  { label: "Angoissé", die: "d12", effect: "-1D×4" },
  { label: "Paniqué", die: "d12", effect: "-2D×1 / -1D×4" },
  { label: "Choqué", die: "d15", effect: "Trauma" }
];

/** Jauge d'accoutumance. */
export const ACCOUTUMANCE = {
  max: 30,
  // Seuil 1 : 0-10, seuil 2 : 11-20, seuil 3 : 21-30.
  zones: [
    { tier: 1, from: 0, to: 10 },
    { tier: 2, from: 11, to: 20 },
    { tier: 3, from: 21, to: 30 }
  ],
  // Test d'accoutumance : Volonté contre 15, +3 après chaque réussite, retour à 15 après un échec.
  test: { skill: "volonte", base: 15, step: 3 }
};

/** Nombre d'emplacements de pouvoirs occultes sous la jauge. */
export const OCCULT_SLOTS = 6;

/** Difficultés standard (p. 37). Le jet doit être strictement supérieur. */
export const DIFFICULTIES = {
  0: "Aucune",
  5: "Très facile (5)",
  10: "Facile (10)",
  15: "Moyenne (15)",
  20: "Difficile (20)",
  25: "Très difficile (25)",
  30: "Héroïque (30)",
  35: "Légendaire (35)"
};

/** Valeurs de départ d'un personnage (p. 22-23). */
export const STARTING = {
  attribute: "3D",
  cojones: 1,
  cp: 5
};

/**
 * Progression permanente avec les points de personnage (p. 23 et 26).
 * Le barème détaillé est dans « Récompenser les joueurs » : valeurs OpenD6 par défaut, à ajuster ici.
 * Chaque achat ajoute 1 tiers (+1). Coût = chiffre devant le D de la valeur actuelle × multiplicateur.
 */
export const ADVANCEMENT = {
  skillMultiplier: 1,
  attributeMultiplier: 10
};

/** Création de personnage (p. 22). En crans : 1D = 3. */
export const CREATION = {
  attributeTotal: 54,      // 18D à répartir
  attributeMin: 6,         // 2D
  attributeMax: 15,        // 5D
  selectedSkills: 12,
  skillBonusTotal: 21,     // 7D
  skillBonusMax: 6         // 2D par compétence
};

/** Dégâts aux véhicules (p. 52) : niveau, effet, part des dégâts subie par les passagers. */
export const VEHICLE_DAMAGE = [
  { level: 0, label: "Intact", range: "", manoeuvre: 0, passengers: 0, effect: "" },
  { level: 1, label: "Très léger", range: "1-3", manoeuvre: 1, passengers: 0,
    effect: "-1D de Manœuvrabilité pour ce round et le suivant." },
  { level: 2, label: "Léger", range: "4-8", manoeuvre: 1, passengers: 0.25,
    effect: "-1D de Manœuvrabilité (ou vitesse max. -1 niveau à 0D) jusqu'à réparation." },
  { level: 3, label: "Lourd", range: "9-12", manoeuvre: 2, passengers: 0.5,
    effect: "-2D de Manœuvrabilité (ou vitesse max. -2 niveaux à 0D) jusqu'à réparation." },
  { level: 4, label: "Grave", range: "13-15", manoeuvre: 0, passengers: 0.75,
    effect: "Incontrôlable : décélère de deux niveaux par round jusqu'à l'arrêt ou l'impact." },
  { level: 5, label: "Détruit", range: "16+", manoeuvre: 0, passengers: 1,
    effect: "Le véhicule ne fonctionnera plus jamais." }
];
