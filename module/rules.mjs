/**
 * Règles pures (sans Foundry) : blessures et accoutumance.
 */

/**
 * Niveau de blessure infligé selon la marge (dégâts - résistance),
 * d'après le tableau de la fiche. 0 = aucun effet.
 */
export function woundFromMargin(margin) {
  if (margin < 0) return 0;
  if (margin <= 3) return 1;   // Sonné
  if (margin <= 8) return 2;   // Blessé
  if (margin <= 12) return 4;  // Handicapé
  if (margin <= 15) return 5;  // Mortellement blessé
  return 6;                    // Mort
}

/**
 * Nouveau niveau de blessure après un coup.
 * Un coup égal ou inférieur à l'état actuel aggrave d'un cran
 * (Blessé + Blessé = Gravement blessé, comme les deux cases « 4 à 8 » de la fiche).
 * Sonné n'aggrave jamais une vraie blessure.
 */
export function nextWoundLevel(current, margin) {
  const hit = woundFromMargin(margin);
  if (hit === 0) return current;
  if (hit === 1) return Math.max(current, 1);
  if (hit === 6) return 6;
  if (current >= hit) return Math.min(current + 1, 6);
  return hit;
}

/** Paliers franchis à la hausse entre deux valeurs. */
export function thresholdsCrossed(before, after, thresholds) {
  return thresholds.filter(t => before < t && after >= t);
}

/** Nombre de paliers atteints. */
export function thresholdsReached(value, thresholds) {
  return thresholds.filter(t => value >= t).length;
}
