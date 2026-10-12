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
    accoutumance: { value: 12, max: 30, cells: Array.from({ length: 30 }, (_, i) => ({
      value: i + 1, filled: i < 12, threshold: (i + 1) % 10 === 0 })) },
    occult: Array.from({ length: 6 }, (_, i) => ({ key: `p${i + 1}`, name: "", effect: "" })),
    weapons: [{ id: "w1", name: "Fusil", skill: "Armes à feu", damage: "4D", hasAmmo: true, ammo: { value: 2, max: 6 }, range: {} }],
    equipment: [{ id: "e1", name: "Gilet", quantity: 1, protection: "+1D", equipped: true }]
  };
}

test("fiche personnage", () => {
  const html = render("templates/actor/personnage.hbs", actorContext());
  assert.equal((html.match(/class="zc-cell/g) || []).length, 30);
  assert.equal((html.match(/zc-tick/g) || []).length, 3);
  assert.equal((html.match(/class="zc-occult-row"/g) || []).length, 6);
  assert.ok(html.includes('name="system.skills.armesAFeu.bonus"'));
  assert.ok(html.includes('name="system.skills.armesAFeu.selected" checked'));
  assert.ok(html.includes("Ajouter une compétence"));
  assert.ok(html.includes('data-zc') === false);
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
