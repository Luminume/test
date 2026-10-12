import { SYSTEM_ID, DIFFICULTIES, WOUNDS } from "../config.mjs";
import { pipsToCode, dicePlan } from "../dice-code.mjs";

const TEMPLATES = {
  dialog: `systems/${SYSTEM_ID}/templates/dialog/roll-options.hbs`,
  chat: `systems/${SYSTEM_ID}/templates/chat/roll.hbs`
};

export function renderTemplate(path, data) {
  return foundry.applications.handlebars.renderTemplate(path, data);
}

export async function postChat(actor, content, rolls = []) {
  const cls = ChatMessage.implementation;
  const data = { speaker: cls.getSpeaker({ actor }), content, rolls };
  if (rolls.length) {
    data.sound = CONFIG.sounds.dice;
    cls.applyRollMode(data, game.settings.get("core", "rollMode"));
  }
  return cls.create(data);
}

/** Fenêtre d'options avant un jet. Renvoie null si le joueur annule. */
async function promptRollOptions(actor, { label, pips, kind }) {
  const isTest = kind === "test";
  const hasResources = actor?.type === "personnage";
  const wound = WOUNDS[actor?.system.wounds?.value ?? 0];
  const content = await renderTemplate(TEMPLATES.dialog, {
    code: pipsToCode(pips),
    isTest,
    difficulties: DIFFICULTIES,
    woundPenalty: wound.penalty,
    woundLabel: wound.label,
    hasResources,
    cpAvailable: actor?.system.cp?.value ?? 0,
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
            difficulty: custom > 0 ? custom : num("difficulty"),
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

const resultsOf = roll => roll ? roll.dice.flatMap(d => d.results.filter(r => r.active).map(r => r.result)) : [];

/**
 * Jet D6 complet : options, dé libre, points dépensés, carte de chat.
 * @param {Actor} actor
 * @param {object} params
 * @param {string} params.label       Titre du jet
 * @param {number} params.pips        Code total, en crans
 * @param {"test"|"damage"|"resistance"} [params.kind]
 * @param {boolean} [params.fast]     Pas de fenêtre d'options (Maj+clic)
 * @param {string[]} [params.notes]   Lignes ajoutées à la carte
 * @param {Function} [params.afterRoll] async (result) => ({notes, highlight}) avant l'envoi au chat
 * @returns {Promise<object|null>}
 */
export async function rollD6(actor, { label, pips, kind = "test", fast = false, notes = [], afterRoll } = {}) {
  const isTest = kind === "test";
  let opts = { difficulty: 0, diceMod: 0, flatMod: 0, applyWound: isTest, cp: 0, cojones: false };
  if (!fast && kind !== "resistance") {
    const chosen = await promptRollOptions(actor, { label, pips, kind });
    if (!chosen) return null;
    opts = { ...opts, ...chosen };
  }

  const lines = [...notes];
  let total = pips + opts.diceMod * 3 + opts.flatMod;
  if (opts.diceMod || opts.flatMod) {
    lines.push(`Modificateur : ${pipsToCode(opts.diceMod * 3 + opts.flatMod, { signed: true })}`);
  }

  const wound = WOUNDS[actor?.system.wounds?.value ?? 0];
  if (opts.applyWound && wound.penalty) {
    total -= wound.penalty * 3;
    lines.push(`Malus de blessure (${wound.label}) : -${wound.penalty}D`);
  }
  if (isTest && wound.incapacitated) lines.push(`Attention : ${wound.label}, le personnage ne devrait pas pouvoir agir.`);

  // Dépense des points (personnages uniquement)
  const update = {};
  let cp = 0;
  if (actor?.type === "personnage") {
    cp = Math.max(0, Math.min(opts.cp, actor.system.cp.value));
    if (cp) {
      update["system.cp.value"] = actor.system.cp.value - cp;
      lines.push(`${cp} point(s) de personnage dépensé(s) : +${cp}D`);
    }
    if (opts.cojones) {
      if (actor.system.cojones.value > 0) {
        update["system.cojones.value"] = actor.system.cojones.value - 1;
        total *= 2;
        lines.push("Point de Cojones dépensé : dés doublés");
      } else {
        ui.notifications.warn("Plus de points de Cojones.");
      }
    }
  }

  const useWild = isTest || game.settings.get(SYSTEM_ID, "wildDieOnDamage");
  const { dice, flat } = dicePlan(total);
  const normalCount = useWild ? dice - 1 : dice;

  const normalRoll = normalCount > 0 ? await new Roll(`${normalCount}d6`).evaluate() : null;
  const wildRoll = useWild ? await new Roll("1d6x6").evaluate() : null;
  const cpRoll = cp ? await new Roll(`${cp}d6x6`).evaluate() : null;
  const rolls = [normalRoll, wildRoll, cpRoll].filter(Boolean);

  const normal = resultsOf(normalRoll);
  const wild = resultsOf(wildRoll);
  const cpDice = resultsOf(cpRoll);
  const sum = arr => arr.reduce((a, b) => a + b, 0);
  const result = {
    label,
    code: pipsToCode(total),
    normal, wild, cp: cpDice, flat,
    total: sum(normal) + sum(wild) + sum(cpDice) + flat,
    difficulty: opts.difficulty,
    isDamage: kind === "damage"
  };

  if (useWild && isTest && wild[0] === 1 && game.settings.get(SYSTEM_ID, "complicationOnOne")) {
    result.complication = true;
    result.altTotal = result.total - 1 - (normal.length ? Math.max(...normal) : 0);
  }
  if (result.difficulty > 0) {
    result.margin = result.total - result.difficulty;
    result.success = result.margin >= 0;
    if (result.complication) result.altSuccess = result.altTotal >= result.difficulty;
  }

  if (Object.keys(update).length) await actor.update(update);

  const extra = afterRoll ? await afterRoll(result) : null;
  if (extra?.notes) lines.push(...extra.notes);

  const content = await renderTemplate(TEMPLATES.chat, {
    ...result,
    flatLabel: flat ? `+${flat}` : "",
    marginLabel: result.margin >= 0 ? `+${result.margin}` : `${result.margin}`,
    highlight: extra?.highlight,
    notes: lines
  });
  await postChat(actor, content, rolls);
  return result;
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
