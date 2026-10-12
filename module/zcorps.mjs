import * as config from "./config.mjs";
import { PersonnageData, PnjData } from "./data/actor.mjs";
import { ArmeData, EquipementData, CompetenceData } from "./data/item.mjs";
import { ZCorpsActor } from "./documents/actor.mjs";
import { PersonnageSheet, PnjSheet } from "./sheets/actor-sheet.mjs";
import { ZCorpsItemSheet } from "./sheets/item-sheet.mjs";
import { rollD6, rerollWithCojones } from "./dice/roll.mjs";
import { codeToPips, pipsToCode } from "./dice-code.mjs";

const { SYSTEM_ID } = config;

Hooks.once("init", () => {
  CONFIG.ZCORPS = config;
  game.zcorps = { config, rollD6, codeToPips, pipsToCode };

  CONFIG.Actor.documentClass = ZCorpsActor;
  CONFIG.Actor.dataModels = { personnage: PersonnageData, pnj: PnjData };
  CONFIG.Actor.typeLabels = { personnage: "Personnage", pnj: "PNJ / Zombie" };
  CONFIG.Actor.trackableAttributes = {
    personnage: { bar: ["wounds", "accoutumance"], value: ["cojones.value", "cp.value", "stress.value"] },
    pnj: { bar: ["wounds"], value: [] }
  };

  CONFIG.Item.dataModels = { arme: ArmeData, equipement: EquipementData, competence: CompetenceData };
  CONFIG.Item.typeLabels = { arme: "Arme", equipement: "Équipement", competence: "Compétence" };

  CONFIG.Combat.initiative = { formula: "@initiative", decimals: 0 };

  const { DocumentSheetConfig } = foundry.applications.apps;
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, PersonnageSheet, {
    types: ["personnage"], makeDefault: true, label: "Fiche Z-Corps"
  });
  DocumentSheetConfig.registerSheet(Actor, SYSTEM_ID, PnjSheet, {
    types: ["pnj"], makeDefault: true, label: "Fiche PNJ Z-Corps"
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
    `systems/${SYSTEM_ID}/templates/actor/parts/weapons.hbs`
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
