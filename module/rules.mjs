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

/** Paliers franchis à la hausse entre deux valeurs. */
export function thresholdsCrossed(before, after, thresholds) {
  return thresholds.filter(t => before < t && after >= t);
}

/** Nombre de paliers atteints. */
export function thresholdsReached(value, thresholds) {
  return thresholds.filter(t => value >= t).length;
}
