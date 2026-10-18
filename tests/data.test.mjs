import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { SKILLS } from "../module/config.mjs";
import { codeToPips } from "../module/dice-code.mjs";
import { WEAPONS, ARMOR, GEAR, VEHICLES } from "../tools/data/equipement.mjs";

const root = path.resolve(import.meta.dirname, "..");
const powers = JSON.parse(fs.readFileSync(path.join(root, "tools/data/pouvoirs.json"), "utf8"));

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

test("compendiums compilés présents", () => {
  for (const pack of ["equipement", "pouvoirs-occultes"]) {
    assert.ok(fs.existsSync(path.join(root, "packs", pack, "CURRENT")), pack);
  }
});
