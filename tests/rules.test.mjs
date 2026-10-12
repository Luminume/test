import { test } from "node:test";
import assert from "node:assert/strict";
import {
  woundFromMargin, nextWoundLevel, damageBonusPips, movement, outcome, advancementCost, nextSkillBonus,
  thresholdsCrossed, thresholdsReached
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

test("paliers d'accoutumance", () => {
  const t = [10, 20, 30];
  assert.deepEqual(thresholdsCrossed(8, 12, t), [10]);
  assert.deepEqual(thresholdsCrossed(9, 30, t), [10, 20, 30]);
  assert.deepEqual(thresholdsCrossed(12, 8, t), []);
  assert.equal(thresholdsReached(20, t), 2);
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
