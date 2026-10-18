/**
 * Règles pures (sans Foundry) : blessures et accoutumance.
 */

/**
 * Niveau de blessure infligé selon la marge (dégâts - résistance), p. 63.
 * Une résistance supérieure ou égale aux dégâts n'inflige rien.
 */
export function woundFromMargin(margin) {
  if (margin <= 0) return 0;
  if (margin <= 3) return 1;   // Sonné
  if (margin <= 8) return 2;   // Blessé
  if (margin <= 12) return 4;  // Handicapé
  if (margin <= 15) return 5;  // Mortellement blessé
  return 6;                    // Mort
}

/**
 * Nouveau niveau de blessure après un coup (p. 63) :
 * - un coup inférieur au niveau actuel fait monter d'un niveau ;
 * - Blessé sur un personnage déjà Blessé donne Gravement blessé ;
 * - sinon on garde le plus grave des deux.
 */
export function nextWoundLevel(current, margin) {
  const hit = woundFromMargin(margin);
  if (hit === 0) return current;
  if (hit < current) return Math.min(current + 1, 6);
  if (hit === 2 && current === 2) return 3;
  return Math.max(current, hit);
}

/** Bonus aux dégâts (p. 23) : dés de Puissance sans les tiers, divisés par 2, arrondi au supérieur. En crans. */
export function damageBonusPips(puissancePips) {
  return Math.ceil(Math.floor(Math.max(0, puissancePips) / 3) / 2) * 3;
}

/** Déplacement (p. 22) : dés de Puissance + dés d'Agilité, en mètres. */
export function movement(puissancePips, agilitePips) {
  return Math.floor(Math.max(0, puissancePips) / 3) + Math.floor(Math.max(0, agilitePips) / 3);
}

/** Issue d'un test (p. 37) : il faut dépasser la difficulté, l'égalité est un cas à part. */
export function outcome(total, difficulty) {
  if (total > difficulty) return "success";
  if (total === difficulty) return "tie";
  return "failure";
}

/**
 * Coût en points de personnage pour gagner 1 tiers :
 * chiffre devant le D de la valeur actuelle (minimum 1) × multiplicateur.
 */
export function advancementCost(currentPips, multiplier = 1) {
  return Math.max(1, Math.floor(currentPips / 3)) * multiplier;
}

/**
 * Nouveau bonus d'une compétence de base après +1 tiers.
 * Non sélectionnée (Caractéristique -1D) : elle devient sélectionnée à Caractéristique -1D+1 (bonus -2).
 */
export function nextSkillBonus(bonusPips, trained) {
  return trained ? bonusPips + 1 : -2;
}

/** Seuil (1 à 3) correspondant à une valeur d'accoutumance. */
export function accoutumanceTier(value, zones) {
  return (zones.find(z => value >= z.from && value <= z.to) ?? zones.at(-1)).tier;
}

/**
 * Événements à annoncer quand l'accoutumance monte :
 * entrée dans un nouveau seuil (11, 21…) et jauge pleine.
 */
export function accoutumanceEvents(before, after, zones, max) {
  const events = zones
    .filter(z => z.from > 0 && before < z.from && after >= z.from)
    .map(z => ({ type: "tier", tier: z.tier, value: z.from }));
  if (before < max && after >= max) events.push({ type: "full", value: max });
  return events;
}

/** Coût numérique d'un pouvoir (« +2 influence » → 2). */
export function powerCost(cost) {
  const m = /([+-]?\d+)/.exec(String(cost ?? ""));
  return m ? Math.abs(Number(m[1])) : 0;
}

/**
 * Contrôles de création (p. 22) sur des valeurs en crans.
 * @param {number[]} attributes        crans des 6 Caractéristiques
 * @param {number} selected            nombre de compétences sélectionnées
 * @param {number[]} bonuses           bonus positifs (crans) des compétences
 */
export function creationReport(attributes, selected, bonuses, rules) {
  const attributeTotal = attributes.reduce((a, b) => a + b, 0);
  const bonusTotal = bonuses.reduce((a, b) => a + b, 0);
  return {
    attributeTotal,
    attributesOk: attributeTotal === rules.attributeTotal,
    attributesInRange: attributes.every(p => p >= rules.attributeMin && p <= rules.attributeMax),
    selected,
    selectedOk: selected === rules.selectedSkills,
    bonusTotal,
    bonusOk: bonusTotal === rules.skillBonusTotal,
    bonusInRange: bonuses.every(p => p <= rules.skillBonusMax)
  };
}

/** Niveau de dégâts infligé à un véhicule selon la marge (p. 52). */
export function vehicleDamageFromMargin(margin) {
  if (margin <= 0) return 0;
  if (margin <= 3) return 1;
  if (margin <= 8) return 2;
  if (margin <= 12) return 3;
  if (margin <= 15) return 4;
  return 5;
}

/**
 * Nouvel état d'un véhicule : Très léger et Léger se cumulent sans limite ;
 * à partir de Lourd, tout dégât au-dessus de Très léger fait monter d'un niveau.
 */
export function nextVehicleDamage(current, margin) {
  const hit = vehicleDamageFromMargin(margin);
  if (hit === 0) return current;
  if (current >= 3 && hit >= 2) return Math.min(current + 1, 5);
  return Math.max(current, hit);
}

/**
 * Difficulté du prochain test d'accoutumance : +step après une réussite,
 * retour à la base après un échec (une égalité ne dépasse pas la difficulté : échec).
 */
export function nextAccoutumanceDifficulty(difficulty, success, { base, step }) {
  return success ? difficulty + step : base;
}

/**
 * Bonus de nombre d'une horde (Bestiaire II) : +5 au total toutes les `per` créatures
 * au-delà de la première. 25 créatures, per 10 → +10.
 */
export function hordeBonus(count, per) {
  if (!per || count <= 1) return 0;
  return Math.floor((count - 1) / per) * 5;
}

/** Réduction de horde : chaque niveau de blessure infligé élimine environ 20 % des créatures. */
export function hordeAfterWounds(count, levels) {
  if (levels <= 0) return count;
  return Math.max(0, Math.round(count * 0.8 ** levels));
}
