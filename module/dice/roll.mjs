import { SYSTEM_ID, DIFFICULTIES, WOUNDS } from "../config.mjs";
import { pipsToCode, dicePlan } from "../dice-code.mjs";
import { outcome } from "../rules.mjs";

const TEMPLATES = {
  dialog: `systems/${SYSTEM_ID}/templates/dialog/roll-options.hbs`,
  chat: `systems/${SYSTEM_ID}/templates/chat/roll.hbs`
};

const OUTCOME_LABELS = { success: "Réussite", tie: "Égalité", failure: "Échec" };

export function renderTemplate(path, data) {
  return foundry.applications.handlebars.renderTemplate(path, data);
}

export async function postChat(actor, content, rolls = [], flags = {}) {
  const cls = ChatMessage.implementation;
  const data = { speaker: cls.getSpeaker({ actor }), content, rolls, flags };
  if (rolls.length) {
    data.sound = CONFIG.sounds.dice;
    cls.applyRollMode(data, game.settings.get("core", "rollMode"));
  }
  return cls.create(data);
}

/** Les Cojones ne s'utilisent que sur un Test propre au personnage (p. 26), pas sur les dégâts. */
const cojonesAllowed = kind => kind !== "damage";

/** Fenêtre d'options avant un jet. Renvoie null si le joueur annule. */
async function promptRollOptions(actor, { label, pips, kind, fixedDifficulty }) {
  const isTest = kind === "test";
  const hasResources = actor?.type === "personnage";
  const wound = actor?.system.woundState ?? WOUNDS[actor?.system.wounds?.value ?? 0];
  const maxCp = game.settings.get(SYSTEM_ID, "maxCpPerRoll");
  const cpAvailable = actor?.system.cp?.value ?? 0;
  const content = await renderTemplate(TEMPLATES.dialog, {
    code: pipsToCode(pips),
    isTest,
    fixedDifficulty,
    difficulties: DIFFICULTIES,
    woundPenalty: isTest ? wound.penalty : 0,
    woundLabel: wound.label,
    hasResources,
    cpAvailable,
    cpMax: maxCp > 0 ? Math.min(maxCp, cpAvailable) : cpAvailable,
    allowCojones: cojonesAllowed(kind),
    cojonesAvailable: actor?.system.cojones?.value ?? 0
  });

  const result = await foundry.applications.api.DialogV2.wait({
    window: { title: label },
    classes: ["zcorps", "zc-dialog"],
    content,
    rejectClose: false,
    buttons: [
      {
        action: "roll",
        label: "Lancer",
        icon: "fa-solid fa-dice",
        default: true,
        callback: (event, button) => {
          const f = button.form.elements;
          const num = name => Number(f.namedItem(name)?.value) || 0;
          const custom = num("customDifficulty");
          return {
            difficulty: fixedDifficulty ?? (custom > 0 ? custom : num("difficulty")),
            diceMod: num("diceMod"),
            flatMod: num("flatMod"),
            applyWound: f.namedItem("applyWound")?.checked ?? false,
            cp: num("cp"),
            cojones: f.namedItem("cojones")?.checked ?? false
          };
        }
      },
      { action: "cancel", label: "Annuler", icon: "fa-solid fa-xmark" }
    ]
  });
  return (result && typeof result === "object") ? result : null;
}

/** Couleurs du dé Joker pour Dice So Nice (rouge sang ; bleu pour celui des points de personnage). */
export const JOKER_COLORS = {
  "zcorps-joker": { description: "Z-Corps : dé Joker", foreground: "#ffffff", background: "#7d1414", outline: "#000000", edge: "#4a1010" },
  "zcorps-joker-cp": { description: "Z-Corps : Joker des points de personnage", foreground: "#ffffff", background: "#2b4a6b", outline: "#000000", edge: "#1a2e44" }
};

function jokerDie(cp = false) {
  const roll = new Roll("1d6x6");
  const colorset = cp ? "zcorps-joker-cp" : "zcorps-joker";
  const { foreground, background, outline, edge } = JOKER_COLORS[colorset];
  Object.assign(roll.dice[0].options, { colorset, appearance: { colorset, foreground, background, outline, edge } });
  return roll;
}

const resultsOf = roll => roll ? roll.dice.flatMap(d => d.results.filter(r => r.active).map(r => r.result)) : [];
const sum = arr => arr.reduce((a, b) => a + b, 0);

/**
 * Jet D6 complet : options, dé Joker, points dépensés, carte de chat.
 * @param {Actor} actor
 * @param {object} params
 * @param {string} params.label       Titre du jet
 * @param {number} params.pips        Code total, en crans
 * @param {"test"|"damage"|"resistance"} [params.kind]
 * @param {boolean} [params.fast]     Pas de fenêtre d'options (Maj+clic)
 * @param {object} [params.preset]    Options imposées (relance Cojones)
 * @param {string[]} [params.notes]   Lignes ajoutées à la carte
 * @param {Function} [params.afterRoll] async (result) => ({notes, highlight}) avant l'envoi au chat
 * @param {number} [params.fixedDifficulty] difficulté imposée (non modifiable dans la fenêtre)
 * @param {string} [params.rerollKind] type de jet à relancer avec les Cojones (« accoutumance »)
 * @returns {Promise<object|null>}
 */
export async function rollD6(actor, { label, pips, kind = "test", fast = false, preset, notes = [], afterRoll, fixedDifficulty, rerollKind } = {}) {
  const isTest = kind === "test";
  const isPersonnage = actor?.type === "personnage";
  let opts = { difficulty: fixedDifficulty ?? 0, diceMod: 0, flatMod: 0, applyWound: isTest, cp: 0, cojones: false, ...preset };
  // Les PNJ n'ont pas de points : inutile de demander pour leurs jets de résistance.
  const ask = !fast && !preset && (kind !== "resistance" || isPersonnage);
  if (ask) {
    const chosen = await promptRollOptions(actor, { label, pips, kind, fixedDifficulty });
    if (!chosen) return null;
    opts = { ...opts, ...chosen };
  }

  const lines = [...notes];
  let total = pips + opts.diceMod * 3 + opts.flatMod;
  if (opts.diceMod || opts.flatMod) {
    lines.push(`Modificateur : ${pipsToCode(opts.diceMod * 3 + opts.flatMod, { signed: true })}`);
  }

  // Malus de blessure : jets de Compétence et de Caractéristique uniquement (p. 63).
  const wound = actor?.system.woundState ?? WOUNDS[actor?.system.wounds?.value ?? 0];
  if (isTest && actor?.system.painless && wound.penalty) {
    lines.push("Insensible à la douleur : aucun malus de blessure");
  } else if (isTest && opts.applyWound && wound.penalty) {
    total -= wound.penalty * 3;
    lines.push(`Malus de blessure (${wound.label}) : -${wound.penalty}D`);
  }
  if (isTest && wound.incapacitated) lines.push(`Attention : ${wound.label}, le personnage ne devrait pas pouvoir agir.`);

  // Points de personnage OU Cojones, jamais les deux (p. 26).
  const update = {};
  let cp = 0;
  if (isPersonnage) {
    if (opts.cp > 0 && opts.cojones) {
      ui.notifications.warn("Points de personnage et Cojones ne se cumulent pas : seul le point de Cojones est utilisé.");
      opts.cp = 0;
    }
    const maxCp = game.settings.get(SYSTEM_ID, "maxCpPerRoll");
    cp = Math.max(0, Math.min(opts.cp, actor.system.cp.value, maxCp > 0 ? maxCp : Infinity));
    if (cp) {
      update["system.cp.value"] = actor.system.cp.value - cp;
      lines.push(`${cp} point(s) de personnage dépensé(s) : +${cp}D`);
    }
    if (opts.cojones && cojonesAllowed(kind)) {
      if (actor.system.cojones.value > 0) {
        update["system.cojones.value"] = actor.system.cojones.value - 1;
        total *= 2;
        lines.push("Point de Cojones dépensé : dés et tiers doublés");
      } else {
        ui.notifications.warn("Plus de points de Cojones.");
      }
    }
  }

  // Un seul dé Joker par jet, plus un Joker « doux » parmi les dés de points de personnage.
  // Horde : bonus de nombre ajouté au total (pas aux dés).
  const hordeFlat = isTest ? (actor?.system.hordeBonus ?? 0) : 0;
  if (hordeFlat) lines.push(`Horde de ${actor.system.horde.count} : +${hordeFlat} au total`);

  const { dice, flat } = dicePlan(total);
  const normalRoll = dice > 1 ? await new Roll(`${dice - 1}d6`).evaluate() : null;
  const jokerRoll = await jokerDie().evaluate();
  const cpNormalRoll = cp > 1 ? await new Roll(`${cp - 1}d6`).evaluate() : null;
  const cpJokerRoll = cp ? await jokerDie(true).evaluate() : null;
  const rolls = [normalRoll, jokerRoll, cpNormalRoll, cpJokerRoll].filter(Boolean);

  const normal = resultsOf(normalRoll);
  const wild = resultsOf(jokerRoll);
  const cpDice = [...resultsOf(cpNormalRoll), ...resultsOf(cpJokerRoll)];
  const result = {
    label,
    kind,
    code: pipsToCode(total),
    normal, wild, cp: cpDice, flat,
    total: sum(normal) + sum(wild) + sum(cpDice) + flat + hordeFlat,
    difficulty: opts.difficulty,
    isDamage: kind === "damage"
  };

  // Échec critique : 1 au premier jet du Joker (p. 25). Option 1 du MJ : on retire le dé le plus haut.
  if (wild[0] === 1) {
    result.critical = true;
    result.altTotal = result.total - Math.max(...normal, ...cpDice, 1);
  }
  if (wild[0] === 6) result.criticalSuccess = true;

  if (result.difficulty > 0) {
    result.outcome = outcome(result.total, result.difficulty);
    result.outcomeLabel = OUTCOME_LABELS[result.outcome];
    result.margin = result.total - result.difficulty;
    if (result.critical) result.altOutcomeLabel = OUTCOME_LABELS[outcome(result.altTotal, result.difficulty)].toLowerCase();
  }

  if (Object.keys(update).length) await actor.update(update);

  const extra = afterRoll ? await afterRoll(result) : null;
  if (extra?.notes) lines.push(...extra.notes);

  // Relance d'un Test échoué avec un point de Cojones (2e option, p. 26).
  const canReroll = isTest && isPersonnage && !opts.cojones && !preset?.reroll && result.outcome !== "success";

  const content = await renderTemplate(TEMPLATES.chat, {
    ...result,
    flatLabel: (flat + hordeFlat) ? `+${flat + hordeFlat}` : "",
    marginLabel: result.margin > 0 ? `+${result.margin}` : `${result.margin}`,
    highlight: extra?.highlight,
    notes: lines,
    canReroll
  });
  const flags = canReroll ? {
    [SYSTEM_ID]: {
      reroll: {
        actorUuid: actor.uuid,
        kind: rerollKind,
        label,
        pips,
        options: { difficulty: opts.difficulty, diceMod: opts.diceMod, flatMod: opts.flatMod, applyWound: opts.applyWound }
      }
    }
  } : {};
  await postChat(actor, content, rolls, flags);
  return result;
}

/** Relance un Test en dépensant un point de Cojones, à partir des données de la carte de chat. */
export async function rerollWithCojones(message) {
  const data = message.getFlag(SYSTEM_ID, "reroll");
  if (!data) return;
  const actor = await fromUuid(data.actorUuid);
  if (!actor?.isOwner) return ui.notifications.warn("Seul le propriétaire du personnage peut relancer.");
  if (actor.system.cojones.value <= 0) return ui.notifications.warn("Plus de points de Cojones.");
  await actor.update({ "system.cojones.value": actor.system.cojones.value - 1 });
  if (data.kind === "accoutumance") {
    return actor.rollAccoutumanceTest({ difficulty: data.options.difficulty, preset: { ...data.options, reroll: true } });
  }
  return rollD6(actor, {
    label: `${data.label} (relance)`,
    pips: data.pips,
    preset: { ...data.options, reroll: true },
    notes: ["Relance grâce à un point de Cojones"]
  });
}

/** Jet simple d'un seul dé (test de stress). */
export async function rollSimple(actor, { label, formula, notes = [] }) {
  const roll = await new Roll(formula).evaluate();
  const content = await renderTemplate(TEMPLATES.chat, {
    label,
    code: formula,
    normal: resultsOf(roll),
    wild: [],
    cp: [],
    total: roll.total,
    notes
  });
  await postChat(actor, content, [roll]);
  return roll;
}
