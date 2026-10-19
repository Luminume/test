import * as config from "./config.mjs";
import { PersonnageData, PnjData, VehiculeData, GroupeData } from "./data/actor.mjs";
import { ArmeData, EquipementData, CompetenceData, PouvoirData } from "./data/item.mjs";
import { ZCorpsActor } from "./documents/actor.mjs";
import { PersonnageSheet, PnjSheet } from "./sheets/actor-sheet.mjs";
import { VehiculeSheet, GroupeSheet } from "./sheets/other-sheets.mjs";
import { ZCorpsItemSheet } from "./sheets/item-sheet.mjs";
import { rollD6, rerollWithCojones, JOKER_COLORS } from "./dice/roll.mjs";
import { codeToPips, pipsToCode } from "./dice-code.mjs";

const { SYSTEM_ID } = config;

Hooks.once("init", () => {
  CONFIG.ZCORPS = config;
  game.zcorps = { config, rollD6, codeToPips, pipsToCode, rollFromMacro };

  CONFIG.Actor.documentClass = ZCorpsActor;
  CONFIG.Actor.dataModels = { personnage: PersonnageData, pnj: PnjData, vehicule: VehiculeData, groupe: GroupeData };
  CONFIG.Actor.typeLabels = { personnage: "Personnage", pnj: "PNJ / Zombie", vehicule: "Véhicule", groupe: "Groupe" };
  CONFIG.Actor.trackableAttributes = {
    personnage: { bar: ["wounds", "accoutumance"], value: ["cojones.value", "cp.value", "stress.value"] },
    pnj: { bar: ["wounds", "hp"], value: [] },
    vehicule: { bar: ["damage"], value: [] },
    groupe: { bar: [], value: [] }
  };

  CONFIG.Item.dataModels = { arme: ArmeData, equipement: EquipementData, competence: CompetenceData, pouvoir: PouvoirData };
  CONFIG.Item.typeLabels = { arme: "Arme", equipement: "Équipement", competence: "Compétence", pouvoir: "Pouvoir occulte" };

  CONFIG.Combat.initiative = { formula: "@initiative", decimals: 0 };

  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, PersonnageSheet, {
    types: ["personnage"], makeDefault: true, label: "Fiche Z-Corps"
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, PnjSheet, {
    types: ["pnj"], makeDefault: true, label: "Fiche PNJ Z-Corps"
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, VehiculeSheet, {
    types: ["vehicule"], makeDefault: true, label: "Fiche véhicule Z-Corps"
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, GroupeSheet, {
    types: ["groupe"], makeDefault: true, label: "Fiche de groupe Z-Corps"
  });
  DocumentSheetConfig.registerSheet(Item, SYSTEM_ID, ZCorpsItemSheet, {
    makeDefault: true, label: "Objet Z-Corps"
  });

  game.settings.register(SYSTEM_ID, "maxCpPerRoll", {
    name: "Maximum de points de personnage par jet",
    hint: "Fixé par le MJ selon le ton de l'aventure (p. 26) : 2 pour une aventure facile, 3 pour une aventure cinématique, 0 = pas de limite.",
    scope: "world", config: true, type: Number, default: 0
  });

  foundry.applications.handlebars.loadTemplates([
    `systems/${SYSTEM_ID}/templates/chat/roll.hbs`,
    `systems/${SYSTEM_ID}/templates/dialog/roll-options.hbs`,
    `systems/${SYSTEM_ID}/templates/actor/parts/weapons.hbs`,
    `systems/${SYSTEM_ID}/templates/actor/parts/powers.hbs`
  ]);
});

/** Boutons des cartes de chat : appliquer les dégâts, relancer avec un point de Cojones. */
Hooks.on("renderChatMessageHTML", (message, html) => {
  for (const button of html.querySelectorAll("[data-zc-reroll]")) {
    button.addEventListener("click", event => {
      event.preventDefault();
      rerollWithCojones(message);
    });
  }
  for (const button of html.querySelectorAll("[data-zc-apply-damage]")) {
    button.addEventListener("click", async event => {
      event.preventDefault();
      const damage = Number(button.dataset.zcApplyDamage);
      const tokens = game.user.targets.size ? [...game.user.targets] : canvas.tokens.controlled;
      if (!tokens.length) {
        ui.notifications.warn("Cible ou sélectionne au moins un jeton.");
        return;
      }
      for (const token of tokens) {
        const actor = token.actor;
        if (!actor) continue;
        if (!actor.isOwner) {
          ui.notifications.warn(`Tu n'as pas les droits sur ${actor.name} : demande au MJ d'appliquer les dégâts.`);
          continue;
        }
        await actor.applyDamage(damage);
      }
    });
  }
});

/* -------------------------------------------- */
/*  Macros                                      */
/* -------------------------------------------- */

/**
 * Lance un jet depuis une macro de la barre (créée en glissant une ligne de la fiche).
 * @param {{actorUuid: string, kind: string, key?: string, itemId?: string}} data
 */
async function rollFromMacro({ actorUuid, kind, key, itemId }) {
  const actor = await fromUuid(actorUuid);
  if (!actor) return ui.notifications.warn("Personnage introuvable pour cette macro.");
  if (!actor.isOwner) return ui.notifications.warn(`Tu n'as pas les droits sur ${actor.name}.`);
  const item = itemId ? actor.items.get(itemId) : null;
  if (itemId && !item) return ui.notifications.warn("Cet objet n'existe plus sur le personnage.");
  if (kind === "attribute") return actor.rollAttribute(key);
  if (kind === "skill") return actor.rollSkill(key);
  if (kind === "custom") return actor.rollCustomSkill(item);
  if (kind === "weapon") return actor.rollWeaponAttack(item);
}

Hooks.on("hotbarDrop", (bar, data, slot) => {
  if (data?.type !== "ZCorpsRoll") return;
  (async () => {
    const actor = await fromUuid(data.actorUuid);
    const name = `${actor?.name ?? ""} : ${data.label}`;
    const command = `game.zcorps.rollFromMacro(${JSON.stringify({
      actorUuid: data.actorUuid, kind: data.kind, key: data.key, itemId: data.itemId
    })});`;
    let macro = game.macros.find(m => m.name === name && m.command === command && m.isOwner);
    macro ??= await Macro.implementation.create({
      name, type: "script", command, img: data.img ?? actor?.img ?? "icons/svg/dice-target.svg"
    });
    await game.user.assignHotbarMacro(macro, slot);
  })();
  return false;
});

/* -------------------------------------------- */
/*  Dice So Nice et fiches de groupe            */
/* -------------------------------------------- */

Hooks.once("diceSoNiceReady", dice3d => {
  for (const [name, colors] of Object.entries(JOKER_COLORS)) {
    dice3d.addColorset({ name, category: "Z-Corps", texture: "none", material: "plastic", ...colors });
  }
});

/** Une fiche de groupe ouverte se met à jour quand l'un de ses membres change. */
Hooks.on("updateActor", actor => {
  for (const app of foundry.applications.instances.values()) {
    if (app instanceof GroupeSheet && app.document.system.members.includes(actor.uuid)) app.render();
  }
});
