/**
 * Codes de dés D6 (« 3D+1 »). En interne tout est compté en « crans » :
 * 1D = 3 crans, +1 = 1 cran.
 * Ce module n'utilise pas Foundry pour pouvoir être testé avec Node.
 */

/**
 * Convertit un code (« 3D+1 », « +1D », « 2D-1 », « +2 », « ») en crans.
 * @param {string} code
 * @returns {{pips: number, valid: boolean}}
 */
export function codeToPips(code) {
  const s = String(code ?? "").replace(/\s+/g, "").toUpperCase();
  if (!s) return { pips: 0, valid: true };

  let m = /^([+-]?)(\d+)$/.exec(s);
  if (m) return { pips: (m[1] === "-" ? -1 : 1) * Number(m[2]), valid: true };

  m = /^([+-]?)(\d+)D6?(?:([+-])(\d+))?$/.exec(s);
  if (!m) return { pips: 0, valid: false };
  const dice = (m[1] === "-" ? -1 : 1) * Number(m[2]);
  const extra = m[4] ? (m[3] === "-" ? -1 : 1) * Number(m[4]) : 0;
  return { pips: dice * 3 + extra, valid: true };
}

/**
 * Convertit des crans en code lisible.
 * @param {number} pips
 * @param {{signed?: boolean}} [options]  signed : préfixe « + » pour les bonus (« +1D »)
 */
export function pipsToCode(pips, { signed = false } = {}) {
  if (!pips) return signed ? "+0" : "0D";
  const abs = Math.abs(pips);
  const dice = Math.floor(abs / 3);
  const rest = abs % 3;
  const sign = pips < 0 ? "-" : "+";
  let out;
  if (dice && rest) out = `${dice}D${sign}${rest}`;
  else if (dice) out = `${dice}D`;
  else out = `${rest}`;
  if (pips < 0) return `-${out}`;
  if (signed) return `+${out}`;
  return dice ? out : `0D+${rest}`;
}

/**
 * Nombre de dés à lancer et bonus fixe pour un total de crans.
 * On lance toujours au moins 1 dé.
 */
export function dicePlan(pips) {
  const dice = Math.max(1, Math.floor(pips / 3));
  const flat = pips >= 3 ? pips - dice * 3 : 0;
  return { dice, flat };
}

/** Formule Foundry équivalente (dé libre explosif inclus), utilisée pour l'initiative. */
export function rollFormula(pips) {
  const { dice, flat } = dicePlan(pips);
  const parts = [];
  if (dice > 1) parts.push(`${dice - 1}d6`);
  parts.push("1d6x6");
  if (flat) parts.push(String(flat));
  return parts.join(" + ");
}
