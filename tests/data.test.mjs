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
    assert.ok(a.items.some(i => i.type === "arme") || ["Civil paniqué", "Bébé zombie"].includes(a.name) || a.system.hp?.enabled, a.name);
    for (const i of a.items) assert.ok(i._key.startsWith(`!actors.items!${a._id}.`), i.name);
  }
  // Tous les zombies sont insensibles à la douleur
  assert.ok(pnj.filter(a => a.img.includes("skull")).every(a => a.system.painless));
  // Zombie officiel du livre et créatures de la campagne
  const zombie = pnj.find(a => a.name === "Zombie (Phase 1)");
  assert.equal(zombie.system.attributes.agilite.code, "3D");
  assert.equal(zombie.items.find(i => i.name === "Bagarre").system.bonus, "+2");
  const bestiaryII = ["Faune mutée & hordes", "Cultistes des 7 Péchés", "Créations de Luxure", "Couronne intérieure & hôpitaux",
    "Profondeurs du lac", "Aberration d'Eliah"].map(f => `Campagne Atica — ${f}`);
  assert.equal(pnj.filter(a => bestiaryII.includes(docs.find(f => f._id === a.folder).name)).length, 21);
  const hordes = pnj.filter(a => a.system.horde?.enabled).map(a => a.name).sort();
  assert.deepEqual(hordes, ["Banc d'anguilles", "Horde de chiens", "Horde de rats", "Horde de zombies (Phase 1)", "Noyés revenus à la vie"]);
  assert.equal(pnj.find(a => a.name === "Horde de rats").system.horde.per, 15);
});

test("pouvoirs des PNJ : 71 pouvoirs étiquetés Campagne, PNJ et nom, liés aux fiches", () => {
  const npcPowers = JSON.parse(fs.readFileSync(path.join(root, "tools/data/pouvoirs-pnj.json"), "utf8"));
  assert.equal(npcPowers.length, 71);
  for (const p of npcPowers) {
    assert.equal(p.tags[0], "Campagne");
    assert.equal(p.tags[1], "PNJ");
    assert.ok([1, 2, 3].includes(p.tier) && p.mechanic.length > 20, p.name);
  }
  const counts = {};
  for (const p of npcPowers) counts[p.tags[2]] = (counts[p.tags[2]] ?? 0) + 1;
  assert.deepEqual(counts, { "Colère": 2, "Gourmandise": 2, "Luxure": 5, "Greed": 5, "Envie": 5, "Eliah": 13, "Jah'ste": 13, "Kôhle": 13, "Elah O Ikim": 13 });

  const packPowers = readPack("pouvoirs-occultes").filter(d => d.type === "pouvoir");
  assert.equal(packPowers.length, 30 + 60 + 71);
  const ids = new Set(packPowers.map(d => d._id));
  const actors = readPack("bestiaire").filter(d => d.type === "pnj" && d.system.hp?.enabled);
  assert.equal(actors.length, 9);
  for (const a of actors) {
    const powers = a.items.filter(i => i.type === "pouvoir");
    assert.equal(powers.length, counts[a.name], a.name);
    for (const p of powers) {
      const source = p.flags["zcorps-vtt"].sourceUuid.split(".").pop();
      assert.ok(ids.has(source), `${a.name} : ${p.name}`);
    }
    assert.ok(a.items.some(i => i.name === "Bagarre (attaque)"), a.name);
  }
});

test("PNJ principaux de la campagne", () => {
  const pnj = readPack("bestiaire").filter(d => d.type === "pnj");
  for (const name of ["Michael Beans (phase Vulnérable)", "Michael Beans (phase Stable)", "Michael Beans (phase Crise)",
    "Garde de Beans", "Le Prélat des Cendres", "Illuminé", "Jane Macbury", "Jared Conery", "Mila Conery", "Vlad Roubanovitch"]) {
    assert.ok(pnj.some(a => a.name === name), name);
  }
  const mila = pnj.find(a => a.name === "Mila Conery");
  assert.equal(mila.system.attributes.puissance.code, "1D");
});
