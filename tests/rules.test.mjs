import { test } from "node:test";
import assert from "node:assert/strict";
import { woundFromMargin, nextWoundLevel, thresholdsCrossed, thresholdsReached } from "../module/rules.mjs";

test("tableau des blessures de la fiche", () => {
  assert.equal(woundFromMargin(-1), 0);
  assert.equal(woundFromMargin(0), 1);
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
  assert.equal(nextWoundLevel(3, 5), 4);   // puis Handicapé
  assert.equal(nextWoundLevel(2, 1), 2);   // Sonné n'aggrave pas
  assert.equal(nextWoundLevel(0, 1), 1);
  assert.equal(nextWoundLevel(1, 10), 4);
  assert.equal(nextWoundLevel(5, 20), 6);
  assert.equal(nextWoundLevel(4, -2), 4);
});

test("paliers d'accoutumance", () => {
  const t = [10, 20, 30];
  assert.deepEqual(thresholdsCrossed(8, 12, t), [10]);
  assert.deepEqual(thresholdsCrossed(9, 30, t), [10, 20, 30]);
  assert.deepEqual(thresholdsCrossed(12, 8, t), []);
  assert.equal(thresholdsReached(20, t), 2);
});
