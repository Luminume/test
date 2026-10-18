import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Handlebars from "handlebars";
import { ATTRIBUTES, SKILLS, WOUNDS, STRESS, DIFFICULTIES } from "../module/config.mjs";

// Équivalents minimaux des helpers fournis par Foundry.
Handlebars.registerHelper("checked", v => (v ? "checked" : ""));
Handlebars.registerHelper("selectOptions", (choices, opts) => new Handlebars.SafeString(
  Object.entries(choices).map(([k, l]) =>
    `<option value="${k}"${String(k) === String(opts.hash.selected) ? " selected" : ""}>${l}</option>`).join("")
));
const root = path.resolve(import.meta.dirname, "..");
const read = p => fs.readFileSync(path.join(root, p), "utf8");
Handlebars.registerPartial("systems/zcorps-vtt/templates/actor/parts/weapons.hbs", read("templates/actor/parts/weapons.hbs"));
Handlebars.registerPartial("systems/zcorps-vtt/templates/actor/parts/powers.hbs", read("templates/actor/parts/powers.hbs"));
const render = (p, ctx) => Handlebars.compile(read(p), { strict: false })(ctx);

function actorContext() {
  return {
    actor: { name: "Joe", img: "icons/svg/mystery-man.svg" },
    editable: true,
    system: { pseudo: "", cojones: { value: 1 }, cp: { value: 3 }, stress: { value: 2, trauma: "" }, notes: "", equipmentNotes: "" },
    attributeBlocks: Object.entries(ATTRIBUTES).map(([key, label]) => ({
      key, label, attr: { code: "3D", valid: true },
      skills: Object.entries(SKILLS).filter(([, s]) => s.attribute === key)
        .map(([k, s]) => ({ key: k, label: s.label, selected: true, bonus: "", total: "3D", valid: true })),
      custom: [{ id: "abc", name: "Kung-fu", bonus: "+1D", total: "4D", valid: true }]
    })),
    wounds: WOUNDS.slice(1).map(w => ({ ...w, checked: w.level <= 2, current: w.level === 2, penaltyLabel: "-1D" })),
    stress: STRESS.map((s, i) => ({ ...s, level: i, current: i === 2, reached: i <= 2 })),
    stressCurrent: STRESS[2],
    accoutumance: { value: 12, max: 30, tier: 2, cells: Array.from({ length: 30 }, (_, i) => ({
      value: i + 1, filled: i < 12, tier: i < 10 ? 1 : i < 20 ? 2 : 3, threshold: (i + 1) % 10 === 0 })),
    zones: [1, 2, 3].map(t => ({ tier: t, label: `Seuil ${t}`, range: "", current: t === 2 })) },
    occult: Array.from({ length: 6 }, (_, i) => ({ key: `p${i + 1}`, name: "", effect: "" })),
    weapons: [{ id: "w1", name: "Fusil", skill: "Armes à feu", damage: "4D", hasAmmo: true, ammo: { value: 2, max: 6 }, range: {} }],
    equipment: [{ id: "e1", name: "Gilet", quantity: 1, protection: "+1D", equipped: true }],
    powers: [
      { id: "p1", name: "La voix familière", tier: "◆", cost: "", mechanic: "Murmure.", revealed: false },
      { id: "p2", name: "L'Écho", tier: "◆◆", cost: "+1 influence", mechanic: "Sent le danger.", revealed: true }
    ]
  };
}

test("fiche personnage", () => {
  const html = render("templates/actor/personnage.hbs", actorContext());
  assert.equal((html.match(/class="zc-cell/g) || []).length, 30);
  assert.equal((html.match(/zc-tick/g) || []).length, 3);
  assert.equal((html.match(/zc-cell zc-zone-2/g) || []).length, 10);
  assert.ok(html.includes("seuil 2") && html.includes("zc-zone-label zc-zone-2 current"));
  assert.equal((html.match(/class="zc-occult-row"/g) || []).length, 6);
  assert.ok(html.includes('name="system.skills.armesAFeu.bonus"'));
  assert.ok(html.includes('name="system.skills.armesAFeu.selected" checked'));
  assert.ok(html.includes("Ajouter une compétence"));
  assert.ok(html.includes('data-zc') === false);
});

test("mode progression", () => {
  const ctx = actorContext();
  assert.ok(!render("templates/actor/personnage.hbs", ctx).includes('data-action="improve"'));
  ctx.progression = true;
  const html = render("templates/actor/personnage.hbs", ctx);
  // 6 Caractéristiques + 48 compétences de base + 6 compétences ajoutées
  assert.equal((html.match(/data-action="improve"/g) || []).length, 6 + 48 + 6);
  assert.ok(html.includes("Terminer la progression"));
  assert.ok(!html.includes('data-action="itemEdit" data-tooltip="Modifier"><i class="fa-solid fa-pen"></i></a>\n              <a data-action="itemDelete"'));
});

test("fiche PNJ, objet, dialogue, chat", () => {
  assert.ok(render("templates/actor/pnj.hbs", actorContext()).includes("Kung-fu"));
  const item = render("templates/item/item.hbs", {
    item: { name: "Fusil" }, system: { skill: "armesAFeu", ammo: {}, range: {} }, isArme: true,
    skillChoices: { armesAFeu: "Armes à feu" }
  });
  assert.ok(item.includes('value="armesAFeu" selected'));
  assert.ok(render("templates/dialog/roll-options.hbs", { code: "3D", isTest: true, difficulties: DIFFICULTIES, hasResources: true }).includes("Héroïque"));
  const chat = render("templates/chat/roll.hbs", {
    label: "Tir", normal: [3, 4], wild: [1], cp: [], total: 8, difficulty: 10, outcome: "failure",
    outcomeLabel: "Échec", marginLabel: "-2", critical: true, altTotal: 4, altOutcomeLabel: "échec",
    notes: ["note"], isDamage: true, canReroll: true
  });
  assert.ok(chat.includes("Échec critique") && chat.includes('data-zc-apply-damage="8"'));
  assert.ok(chat.includes("data-zc-reroll"));
});

test("pouvoirs sur la fiche : outils MJ seulement pour le MJ", () => {
  const ctx = actorContext();
  const player = render("templates/actor/personnage.hbs", ctx);
  assert.ok(player.includes("La voix familière"));          // le contexte filtre déjà pour le joueur
  assert.ok(!player.includes('data-mode="pouvoirs"'));
  assert.ok(!player.includes("togglePowerRevealed"));
  // 2 pouvoirs + 6 lignes libres fournies par le contexte de test
  assert.equal((player.match(/class="zc-occult-row/g) || []).length, 8);
  ctx.isGM = true;
  const gm = render("templates/actor/personnage.hbs", ctx);
  assert.ok(gm.includes('data-mode="pouvoirs"') && gm.includes("fa-eye-slash"));
  assert.ok(gm.includes('data-action="showPortrait"'));
  const pnj = render("templates/actor/pnj.hbs", { ...ctx, showPowers: true });
  assert.ok(pnj.includes("Pouvoirs occultes") && pnj.includes('data-action="showPortrait"'));
});

test("fenêtre de recherche", () => {
  const entry = { uuid: "Compendium.x.y.Item.a", name: "L'Écho", tier: "◆◆", tags: ["Campagne", "Katrina"],
    cost: "+1 influence", details: "Sent le danger.", search: "l'echo campagne", owned: true, origin: "Livre" };
  const html = render("templates/apps/browser.hbs", {
    isPowers: true, canEdit: true, isGM: true, groups: [{ label: "Seuil 2", entries: [entry] }],
    groupChoices: [{ value: "Seuil 2", label: "Seuil 2" }]
  });
  assert.ok(html.includes('data-action="toggle" checked'));
  assert.ok(html.includes("Campagne") && html.includes("Tous les seuils"));
  const items = render("templates/apps/browser.hbs", {
    isPowers: false, canEdit: true, actor: { name: "Joe" },
    groups: [{ label: "Fusils", entries: [{ ...entry, tier: "", tags: [], stats: ["Dégâts 7D"] }] }]
  });
  assert.ok(items.includes('data-action="add"') && items.includes("Dégâts 7D"));
});

test("fiche d'objet pouvoir", () => {
  const html = render("templates/item/item.hbs", {
    item: { name: "L'Écho" }, system: { tier: 2, tags: "Campagne", cost: "+1 influence", mechanic: "", narrative: "" },
    isPouvoir: true, isGM: true, tierChoices: { 1: "Seuil 1", 2: "Seuil 2", 3: "Seuil 3" }
  });
  assert.ok(html.includes('value="2" selected') && html.includes("system.revealed") && !html.includes("system.notes"));
});

test("bouton Utiliser, aide à la création, fiche limitée", () => {
  const ctx = { ...actorContext(), isOwner: true };
  assert.equal((render("templates/actor/personnage.hbs", ctx).match(/data-action="usePower"/g) || []).length, 2);
  ctx.creation = {
    rows: [{ label: "Caractéristiques", value: "17D", target: "18D", ok: false }],
    warnings: ["Agilité doit être entre 2D et 5D."],
    archetypes: [{ uuid: "Compendium.zcorps-vtt.archetypes.Actor.x", name: "Geek" }]
  };
  const html = render("templates/actor/personnage.hbs", ctx);
  assert.ok(html.includes("Aide à la création (p. 22)") && html.includes("fa-circle-exclamation") && html.includes("Geek"));
  assert.ok(html.includes("Terminer la création"));
  const limited = render("templates/actor/limited.hbs", { actor: { name: "Joe", img: "x.png" }, system: { carriere: "Flic" } });
  assert.ok(limited.includes("Joe") && limited.includes("Flic") && !limited.includes("input"));
});

test("fiches véhicule et groupe", () => {
  const vehicle = render("templates/actor/vehicule.hbs", {
    actor: { name: "Pick-up", img: "x" }, editable: true, system: { speed: "60/160 km/h" },
    resistanceTotal: "5D+2", manoeuvreTotal: "+0",
    levels: [{ level: 1, label: "Très léger", range: "1-3", share: "—", checked: true, current: true }]
  });
  assert.ok(vehicle.includes("5D+2") && vehicle.includes('data-action="vehicleDamage"') && vehicle.includes("Très léger"));
  const group = render("templates/actor/groupe.hbs", {
    actor: { name: "Unité 7", img: "x" }, editable: true, system: {},
    members: [{ uuid: "Actor.a", name: "Katrina", img: "x", visible: true, wounds: "Blessé", hurt: true, stress: "Calme", accoutumance: "12/30 (seuil 2)", cojones: 1, cp: 5 }]
  });
  assert.ok(group.includes("Katrina") && group.includes("zc-hurt") && group.includes("12/30 (seuil 2)"));
  const empty = render("templates/actor/groupe.hbs", { actor: { name: "Vide" }, system: {}, members: [] });
  assert.ok(empty.includes("Dépose des acteurs ici"));
});
