import { ATTRIBUTES, SKILLS, WOUNDS, STRESS, ACCOUTUMANCE, OCCULT_SLOTS, STARTING, VEHICLE_DAMAGE } from "../config.mjs";
import { codeToPips, pipsToCode } from "../dice-code.mjs";
import { accoutumanceTier, damageBonusPips, movement } from "../rules.mjs";

const fields = foundry.data.fields;

const text = (initial = "") => new fields.StringField({ required: true, blank: true, initial });
const int = (initial, min, max) => new fields.NumberField({
  required: true, nullable: false, integer: true, initial, min, max
});

function attributesSchema() {
  const schema = {};
  for (const key of Object.keys(ATTRIBUTES)) schema[key] = new fields.SchemaField({ code: text(STARTING.attribute) });
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
      // Vides = calcul automatique ; une valeur saisie remplace le calcul.
      damageBonus: text(""),
      movement: text(""),
      notes: text("")
    };
  }

  prepareDerivedData() {
    prepareAttributes(this);
    prepareWounds(this);
    const puissance = this.attributes.puissance.pips;
    const autoBonus = damageBonusPips(puissance);
    this.damageBonusAuto = pipsToCode(autoBonus);
    this.damageBonusPips = this.damageBonus.trim() ? codeToPips(this.damageBonus).pips : autoBonus;
    this.movementAuto = String(movement(puissance, this.attributes.agilite.pips));
    this.movementValue = this.movement.trim() || this.movementAuto;
  }
}

export class PersonnageData extends BaseActorData {
  static defineSchema() {
    const skills = {};
    for (const key of Object.keys(SKILLS)) {
      skills[key] = new fields.SchemaField({
        selected: new fields.BooleanField({ initial: false }),
        bonus: text("")
      });
    }

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
      cojones: new fields.SchemaField({ value: int(STARTING.cojones, 0) }),
      cp: new fields.SchemaField({ value: int(STARTING.cp, 0) }),
      lifeLevel: text(""),
      money: text(""),
      accoutumance: new fields.SchemaField({
        value: int(0, 0, ACCOUTUMANCE.max),
        max: int(ACCOUTUMANCE.max, 0, ACCOUTUMANCE.max),
        testDifficulty: int(ACCOUTUMANCE.test.base, 0)
      }),
      occult: new fields.SchemaField(occult),
      equipmentNotes: text("")
    };
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    // p. 22 : compétence non sélectionnée = Caractéristique -1D ;
    // sélectionnée = Caractéristique + dés ajoutés.
    for (const [key, def] of Object.entries(SKILLS)) {
      const skill = this.skills[key];
      const bonus = codeToPips(skill.bonus);
      const trained = skill.selected || bonus.pips > 0;
      const pips = this.attributes[def.attribute].pips + (trained ? bonus.pips : -3);
      Object.assign(skill, {
        label: def.label,
        attribute: def.attribute,
        valid: bonus.valid,
        trained,
        pips,
        total: pipsToCode(pips)
      });
    }
    this.accoutumance.tier = accoutumanceTier(this.accoutumance.value, ACCOUTUMANCE.zones);
  }
}

/** PNJ et zombies : attributs, blessures, compétences en objets. */
export class PnjData extends BaseActorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      // Morts-vivants : aucun malus de blessure.
      painless: new fields.BooleanField({ initial: false })
    };
  }
}

/** Véhicule (p. 51-52, 74). */
export class VehiculeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      category: text(""),
      speed: text(""),
      passengers: text(""),
      resistance: text("4D"),
      manoeuvre: text("0"),
      protection: text(""),
      price: text(""),
      damage: new fields.SchemaField({
        value: int(0, 0, VEHICLE_DAMAGE.length - 1),
        max: int(VEHICLE_DAMAGE.length - 1, 0, VEHICLE_DAMAGE.length - 1)
      }),
      crew: text(""),
      notes: text("")
    };
  }

  prepareDerivedData() {
    const state = VEHICLE_DAMAGE[this.damage.value] ?? VEHICLE_DAMAGE[0];
    this.damageLabel = state.label;
    this.resistancePips = codeToPips(this.resistance).pips + codeToPips(this.protection).pips;
    this.manoeuvrePips = codeToPips(this.manoeuvre).pips - state.manoeuvre * 3;
  }
}

/** Groupe de personnages : un coup d'œil sur l'état de chacun. */
export class GroupeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      members: new fields.ArrayField(new fields.StringField({ required: true, blank: false })),
      inventory: text(""),
      notes: text("")
    };
  }
}
