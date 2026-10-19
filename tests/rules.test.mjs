import { test } from "node:test";
import assert from "node:assert/strict";
import {
  woundFromMargin, nextWoundLevel, damageBonusPips, movement, outcome, advancementCost, nextSkillBonus,
  accoutumanceTier, accoutumanceEvents, powerCost, vehicleDamageFromMargin, nextVehicleDamage, creationReport, nextAccoutumanceDifficulty, hordeBonus, hordeAfterWounds, parseThresholds, hpLevel
} from "../module/rules.mjs";

test("table des niveaux de blessure (p. 63)", () => {
  assert.equal(woundFromMargin(-1), 0);
  assert.equal(woundFromMargin(0), 0);   // résistance >= dégâts : rien
  assert.equal(woundFromMargin(1), 1);
  assert.equal(woundFromMargin(3), 1);
  assert.equal(woundFromMargin(4), 2);
  assert.equal(woundFromMargin(8), 2);
  assert.equal(woundFromMargin(9), 4);
  assert.equal(woundFromMargin(13), 5);
  assert.equal(woundFromMargin(16), 6);
});

test("aggravation des blessures", () => {
  assert.equal(nextWoundLevel(0, 5), 2);   // Blessé
  assert.equal(nextWoundLevel(2, 5), 3);   // Blessé + Blessé = Gravement blessé
  assert.equal(nextWoundLevel(3, 5), 4);   // coup inférieur : un niveau de plus
  assert.equal(nextWoundLevel(2, 1), 3);   // Sonné sur Blessé : un niveau de plus
  assert.equal(nextWoundLevel(1, 1), 1);   // Sonné sur Sonné
  assert.equal(nextWoundLevel(0, 2), 1);
  assert.equal(nextWoundLevel(1, 10), 4);
  assert.equal(nextWoundLevel(5, 20), 6);
  assert.equal(nextWoundLevel(4, 0), 4);
});

test("bonus aux dégâts et déplacement (p. 22-23)", () => {
  assert.equal(damageBonusPips(9), 6);    // 3D -> 2D
  assert.equal(damageBonusPips(20), 9);   // 6D+2 -> 3D
  assert.equal(damageBonusPips(7), 3);    // 2D+1 -> 1D
  assert.equal(movement(9, 9), 6);        // Chasseur de primes : Déplacement 6
  assert.equal(movement(7, 10), 5);
});

test("issue d'un test : il faut dépasser la difficulté", () => {
  assert.equal(outcome(16, 15), "success");
  assert.equal(outcome(15, 15), "tie");
  assert.equal(outcome(14, 15), "failure");
});

test("seuils d'accoutumance : 0-10, 11-20, 21-30", () => {
  const zones = [{ tier: 1, from: 0, to: 10 }, { tier: 2, from: 11, to: 20 }, { tier: 3, from: 21, to: 30 }];
  assert.deepEqual([0, 10, 11, 20, 21, 30].map(v => accoutumanceTier(v, zones)), [1, 1, 2, 2, 3, 3]);
  assert.deepEqual(accoutumanceEvents(9, 10, zones, 30), []);
  assert.deepEqual(accoutumanceEvents(10, 11, zones, 30), [{ type: "tier", tier: 2, value: 11 }]);
  assert.deepEqual(accoutumanceEvents(5, 30, zones, 30), [
    { type: "tier", tier: 2, value: 11 }, { type: "tier", tier: 3, value: 21 }, { type: "full", value: 30 }
  ]);
  assert.deepEqual(accoutumanceEvents(25, 12, zones, 30), []);
});

test("progression avec les points de personnage", () => {
  assert.equal(advancementCost(13), 4);        // compétence 4D+1 -> 4 PP
  assert.equal(advancementCost(2), 1);         // minimum 1
  assert.equal(advancementCost(9, 10), 30);    // attribut 3D -> 30 PP
  assert.equal(nextSkillBonus(0, false), -2);  // non sélectionnée : -1D devient -1D+1
  assert.equal(nextSkillBonus(-2, true), -1);
  assert.equal(nextSkillBonus(-1, true), 0);   // retour au niveau de la Caractéristique
  assert.equal(nextSkillBonus(5, true), 6);    // +1D+2 -> +2D
});

test("coût d'un pouvoir", () => {
  assert.equal(powerCost("+2 influence"), 2);
  assert.equal(powerCost("+1 résonance par échange"), 1);
  assert.equal(powerCost(""), 0);
});

test("dégâts aux véhicules (p. 52)", () => {
  assert.deepEqual([0, 1, 4, 9, 13, 16].map(vehicleDamageFromMargin), [0, 1, 2, 3, 4, 5]);
  assert.equal(nextVehicleDamage(2, 5), 2);   // Léger + Léger : pas d'aggravation
  assert.equal(nextVehicleDamage(1, 10), 3);
  assert.equal(nextVehicleDamage(3, 2), 3);   // Lourd + Très léger : rien
  assert.equal(nextVehicleDamage(3, 5), 4);   // Lourd + Léger : un niveau de plus
  assert.equal(nextVehicleDamage(4, 20), 5);
});

test("rapport de création", () => {
  const rules = { attributeTotal: 54, attributeMin: 6, attributeMax: 15, selectedSkills: 12, skillBonusTotal: 21, skillBonusMax: 6 };
  const ok = creationReport([9, 9, 9, 9, 9, 9], 12, [6, 6, 6, 3], rules);
  assert.ok(ok.attributesOk && ok.attributesInRange && ok.selectedOk && ok.bonusOk && ok.bonusInRange);
  const ko = creationReport([18, 9, 9, 9, 6, 3], 10, [9], rules);
  assert.ok(!ko.attributesInRange && !ko.selectedOk && !ko.bonusInRange);
});

test("test d'accoutumance : 15, +3 par réussite, retour à 15 après un échec", () => {
  const rule = { base: 15, step: 3 };
  let d = 15;
  d = nextAccoutumanceDifficulty(d, true, rule);   // réussite
  assert.equal(d, 18);
  d = nextAccoutumanceDifficulty(d, true, rule);
  assert.equal(d, 21);
  d = nextAccoutumanceDifficulty(d, false, rule);  // échec
  assert.equal(d, 15);
});

test("règle de horde (Bestiaire II)", () => {
  assert.equal(hordeBonus(25, 10), 10);   // exemple du document : 25 rats → +10
  assert.equal(hordeBonus(10, 10), 0);
  assert.equal(hordeBonus(11, 10), 5);
  assert.equal(hordeBonus(25, 15), 5);    // essaim dense : +5 par 15
  assert.equal(hordeBonus(1, 10), 0);
  assert.equal(hordeAfterWounds(25, 1), 20);  // −20 % par niveau
  assert.equal(hordeAfterWounds(25, 2), 16);
  assert.equal(hordeAfterWounds(25, 0), 25);
});

test("profil PV : seuils de blessure", () => {
  assert.deepEqual(parseThresholds("8 / 16 / 24"), [8, 16, 24]);
  const t = [8, 16, 24];
  assert.deepEqual([0, 7, 8, 15, 16, 24, 40].map(d => hpLevel(d, t)), [0, 0, 1, 1, 2, 3, 3]);
});
