import { ATTRIBUTES, SKILLS, WOUNDS, STRESS, ACCOUTUMANCE, OCCULT_SLOTS } from "../config.mjs";
import { codeToPips, pipsToCode } from "../dice-code.mjs";
import { thresholdsReached } from "../rules.mjs";

const fields = foundry.data.fields;

const text = (initial = "") => new fields.StringField({ required: true, blank: true, initial });
const int = (initial, min, max) => new fields.NumberField({
  required: true, nullable: false, integer: true, initial, min, max
});

function attributesSchema() {
  const schema = {};
  for (const key of Object.keys(ATTRIBUTES)) schema[key] = new fields.SchemaField({ code: text("2D") });
  return new fields.SchemaField(schema);
}

/** Calcule les crans et le code total de chaque attribut. */
function prepareAttributes(system) {
  for (const [key, label] of Object.entries(ATTRIBUTES)) {
    const attr = system.attributes[key];
    const { pips, valid } = codeToPips(attr.code);
    Object.assign(attr, { label, pips, valid, total: pipsToCode(pips) });
  }
}

function prepareWounds(system) {
  const wound = WOUNDS[system.wounds.value] ?? WOUNDS[0];
  system.wounds.label = wound.label;
  system.woundPenalty = wound.penalty;
}

/** Données communes aux personnages et aux PNJ. */
class BaseActorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attributes: attributesSchema(),
      wounds: new fields.SchemaField({
        value: int(0, 0, WOUNDS.length - 1),
        max: int(WOUNDS.length - 1, 0, WOUNDS.length - 1)
      }),
      damageBonus: text(""),
      movement: text("10"),
      notes: text("")
    };
  }

  prepareDerivedData() {
    prepareAttributes(this);
    prepareWounds(this);
    this.damageBonusPips = codeToPips(this.damageBonus).pips;
  }
}

export class PersonnageData extends BaseActorData {
  static defineSchema() {
    const skills = {};
    for (const key of Object.keys(SKILLS)) skills[key] = new fields.SchemaField({ bonus: text("") });

    const occult = {};
    for (let i = 1; i <= OCCULT_SLOTS; i++) {
      occult[`p${i}`] = new fields.SchemaField({ name: text(""), effect: text("") });
    }

    return {
      ...super.defineSchema(),
      pseudo: text(""),
      genre: text(""),
      age: text(""),
      taille: text(""),
      poids: text(""),
      carriere: text(""),
      historique: text(""),
      skills: new fields.SchemaField(skills),
      stress: new fields.SchemaField({
        value: int(0, 0, STRESS.length - 1),
        trauma: text("")
      }),
      cojones: new fields.SchemaField({ value: int(0, 0) }),
      cp: new fields.SchemaField({ value: int(0, 0) }),
      lifeLevel: text(""),
      accoutumance: new fields.SchemaField({
        value: int(0, 0, ACCOUTUMANCE.max),
        max: int(ACCOUTUMANCE.max, 0, ACCOUTUMANCE.max)
      }),
      occult: new fields.SchemaField(occult),
      equipmentNotes: text("")
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    for (const [key, def] of Object.entries(SKILLS)) {
      const skill = this.skills[key];
      const bonus = codeToPips(skill.bonus);
      const pips = this.attributes[def.attribute].pips + bonus.pips;
      Object.assign(skill, {
        label: def.label,
        attribute: def.attribute,
        valid: bonus.valid,
        trained: bonus.pips !== 0,
        pips,
        total: pipsToCode(pips)
      });
    }
    this.accoutumance.tier = thresholdsReached(this.accoutumance.value, ACCOUTUMANCE.thresholds);
  }
}

/** PNJ et zombies : attributs, blessures, compétences en objets. */
export class PnjData extends BaseActorData {}
