import { ATTRIBUTES, SKILLS } from "../config.mjs";

const fields = foundry.data.fields;

const text = (initial = "") => new fields.StringField({ required: true, blank: true, initial });
const int = (initial, min = 0) => new fields.NumberField({
  required: true, nullable: false, integer: true, initial, min
});

export class ArmeData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      skill: new fields.StringField({
        required: true, blank: false, initial: "armesAFeu", choices: Object.keys(SKILLS)
      }),
      // « +1D » = s'ajoute au bonus aux dégâts du porteur (armes de mêlée, p. 57).
      damage: text("3D"),
      ammo: new fields.SchemaField({ value: int(0), max: int(0) }),
      range: new fields.SchemaField({ short: text(""), medium: text(""), long: text("") }),
      notes: text("")
    };
  }
}

export class EquipementData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      quantity: int(1),
      protection: text(""),
      equipped: new fields.BooleanField({ initial: false }),
      notes: text("")
    };
  }
}

/** Compétence ajoutée à la main (lignes vides de la fiche, ou compétences de PNJ). */
export class CompetenceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      attribute: new fields.StringField({
        required: true, initial: "agilite", choices: Object.keys(ATTRIBUTES)
      }),
      bonus: text("+1D"),
      notes: text("")
    };
  }
}
