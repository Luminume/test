import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SKILLS, CREATION, ATTRIBUTES } from "../module/config.mjs";
import { codeToPips } from "../module/dice-code.mjs";
import { creationReport } from "../module/rules.mjs";
import { WEAPONS, ARMOR, GEAR, VEHICLES } from "../tools/data/equipement.mjs";

const root = path.resolve(import.meta.dirname, "..");
const powers = JSON.parse(fs.readFileSync(path.join(root, "tools/data/pouvoirs.json"), "utf8"));
const generic = JSON.parse(fs.readFileSync(path.join(root, "tools/data/pouvoirs-generiques.json"), "utf8"));

test("banque d'objets : compétences et codes valides", () => {
  let count = 0;
  for (const group of WEAPONS) {
    assert.ok(SKILLS[group.skill], group.category);
    for (const [name, damage] of group.items) {
      assert.ok(codeToPips(damage).valid, `${name} : ${damage}`);
      count++;
    }
  }
  for (const [name, protection] of ARMOR) assert.ok(codeToPips(protection).valid, name);
  assert.ok(count >= 50 && GEAR.length >= 50 && VEHICLES.length === 17);
});

test("pouvoirs occultes : 30 pouvoirs, seuils 1 à 3, étiquette Campagne", () => {
  assert.equal(powers.length, 30);
  for (const p of powers) {
    assert.ok([1, 2, 3].includes(p.tier), p.name);
    assert.ok(p.tags.includes("Campagne"), p.name);
    assert.ok(p.mechanic.length > 20 && p.narrative.length > 20, p.name);
  }
  assert.deepEqual([1, 2, 3].map(t => powers.filter(p => p.tier === t).length), [11, 11, 8]);
  // Bill n'a pas de seuil 3 (conception narrative)
  assert.ok(!powers.some(p => p.tags.includes("Bill") && p.tier === 3));
});

test("bibliothèque générique : 60 pouvoirs, 20 par seuil, sans étiquette Campagne", () => {
  assert.equal(generic.length, 60);
  assert.deepEqual([1, 2, 3].map(t => generic.filter(p => p.tier === t).length), [20, 20, 20]);
  for (const p of generic) {
    assert.ok(!p.tags.includes("Campagne"), p.name);
    assert.ok(p.name.length > 2 && p.mechanic.length > 20, p.name);
  }
  assert.deepEqual(generic.filter(p => p.tier > 1).map(p => p.cost).filter((c, i, a) => a.indexOf(c) === i), ["+1 influence", "+2 influence"]);
});

test("compendiums compilés présents", () => {
  for (const pack of ["equipement", "pouvoirs-occultes"]) {
    assert.ok(fs.existsSync(path.join(root, "packs", pack, "CURRENT")), pack);
  }
});

const readPack = pack => fs.readdirSync(path.join(root, "packs/_source", pack))
  .map(f => JSON.parse(fs.readFileSync(path.join(root, "packs/_source", pack, f), "utf8")));

test("archétypes : règles de création vérifiées (avec les écarts du livre)", () => {
  // Le livre lui-même s'écarte de ses règles pour trois pré-tirés : on garde ses valeurs.
  const bookExceptions = {
    "Geek": { attributeTotal: 51 },
    "Chanteuse de country": { attributeTotal: 55, bonusTotal: 15 },
    "Aumônier": { bonusTotal: 18 }
  };
  const actors = readPack("archetypes").filter(d => d.type === "personnage");
  assert.equal(actors.length, 10);
  for (const a of actors) {
    const attrs = Object.keys(ATTRIBUTES).map(k => codeToPips(a.system.attributes[k].code).pips);
    const standard = Object.values(a.system.skills);
    const custom = a.items.filter(i => i.type === "competence");
    const bonuses = [...standard.map(s => codeToPips(s.bonus).pips), ...custom.map(i => codeToPips(i.system.bonus).pips)];
    const r = creationReport(attrs, standard.length + custom.length, bonuses, CREATION);
    const expected = { attributeTotal: CREATION.attributeTotal, bonusTotal: CREATION.skillBonusTotal, ...bookExceptions[a.name] };
    assert.equal(r.selected, CREATION.selectedSkills, `${a.name} : compétences`);
    assert.equal(r.attributeTotal, expected.attributeTotal, `${a.name} : Caractéristiques`);
    assert.equal(r.bonusTotal, expected.bonusTotal, `${a.name} : dés de compétences`);
    assert.ok(r.attributesInRange && r.bonusInRange, a.name);
  }
});

test("bestiaire : PNJ valides, zombies insensibles à la douleur, véhicules", () => {
  const docs = readPack("bestiaire");
  const pnj = docs.filter(d => d.type === "pnj");
  const vehicles = docs.filter(d => d.type === "vehicule");
  assert.ok(pnj.length >= 9);
  assert.equal(vehicles.length, 17);
  for (const a of pnj) {
    assert.ok(a.items.some(i => i.type === "arme") || ["Civil paniqué", "Bébé zombie"].includes(a.name), a.name);
    for (const i of a.items) assert.ok(i._key.startsWith(`!actors.items!${a._id}.`), i.name);
  }
  assert.ok(pnj.filter(a => a.system.painless).every(a => a.img.includes("skull")));
  // Zombie officiel du livre et créatures de la campagne
  const zombie = pnj.find(a => a.name === "Zombie (Phase 1)");
  assert.equal(zombie.system.attributes.agilite.code, "3D");
  assert.equal(zombie.items.find(i => i.name === "Bagarre").system.bonus, "+2");
  assert.equal(pnj.filter(a => a.folder && docs.find(f => f._id === a.folder).name.startsWith("Campagne Atica")).length, 21);
  const hordes = pnj.filter(a => a.system.horde.enabled).map(a => a.name).sort();
  assert.deepEqual(hordes, ["Banc d'anguilles", "Horde de chiens", "Horde de rats", "Horde de zombies (Phase 1)", "Noyés revenus à la vie"]);
  assert.equal(pnj.find(a => a.name === "Horde de rats").system.horde.per, 15);
});
