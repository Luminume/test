import { test } from "node:test";
import assert from "node:assert/strict";
import { codeToPips, pipsToCode, dicePlan, rollFormula } from "../module/dice-code.mjs";

test("codeToPips lit les codes D6", () => {
  assert.deepEqual(codeToPips("3D+1"), { pips: 10, valid: true });
  assert.deepEqual(codeToPips("3d"), { pips: 9, valid: true });
  assert.deepEqual(codeToPips(" +1D "), { pips: 3, valid: true });
  assert.deepEqual(codeToPips("2D-1"), { pips: 5, valid: true });
  assert.deepEqual(codeToPips("-1D"), { pips: -3, valid: true });
  assert.deepEqual(codeToPips("+2"), { pips: 2, valid: true });
  assert.deepEqual(codeToPips(""), { pips: 0, valid: true });
  assert.deepEqual(codeToPips(undefined), { pips: 0, valid: true });
  assert.equal(codeToPips("trois").valid, false);
});

test("pipsToCode et aller-retour", () => {
  assert.equal(pipsToCode(10), "3D+1");
  assert.equal(pipsToCode(9), "3D");
  assert.equal(pipsToCode(2), "0D+2");
  assert.equal(pipsToCode(0), "0D");
  assert.equal(pipsToCode(3, { signed: true }), "+1D");
  assert.equal(pipsToCode(-4), "-1D-1");
  for (let p = -10; p <= 30; p++) assert.equal(codeToPips(pipsToCode(p)).pips, p);
});

test("dicePlan lance au moins un dé", () => {
  assert.deepEqual(dicePlan(10), { dice: 3, flat: 1 });
  assert.deepEqual(dicePlan(2), { dice: 1, flat: 0 });
  assert.deepEqual(dicePlan(-5), { dice: 1, flat: 0 });
});

test("rollFormula inclut le dé libre", () => {
  assert.equal(rollFormula(10), "2d6 + 1d6x6 + 1");
  assert.equal(rollFormula(3), "1d6x6");
});
