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
 * Niveaux de blessure (index = valeur stockée dans system.wounds.value).
 * `penalty` = dés retirés aux jets. À VÉRIFIER dans les règles.
 */
export const WOUNDS = [
  { level: 0, label: "Indemne", range: "", penalty: 0 },
  { level: 1, label: "Sonné", range: "0 à 3", penalty: 1 },
  { level: 2, label: "Blessé", range: "4 à 8", penalty: 1 },
  { level: 3, label: "Gravement blessé", range: "4 à 8", penalty: 2 },
  { level: 4, label: "Handicapé", range: "9 à 12", penalty: 3 },
  { level: 5, label: "Mortellement blessé", range: "13 à 15", penalty: 0, incapacitated: true },
  { level: 6, label: "Mort", range: "16+", penalty: 0, incapacitated: true }
];

/** Échelle de stress, reprise de la fiche (dé du test et effet indiqué sous la case). */
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
  thresholds: [10, 20, 30]
};

/** Nombre d'emplacements de pouvoirs occultes sous la jauge. */
export const OCCULT_SLOTS = 6;

/** Seuils de difficulté D6 classiques. À VÉRIFIER. */
export const DIFFICULTIES = {
  0: "Aucune",
  5: "Très facile (5)",
  10: "Facile (10)",
  15: "Moyenne (15)",
  20: "Difficile (20)",
  25: "Très difficile (25)",
  30: "Héroïque (30)"
};
