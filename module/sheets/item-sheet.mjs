import { SYSTEM_ID, ATTRIBUTES, SKILLS } from "../config.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

function onEditImage() {
  const FP = foundry.applications.apps.FilePicker.implementation;
  return new FP({
    type: "image",
    current: this.document.img,
    callback: path => this.document.update({ img: path })
  }).browse();
}

export class ZCorpsItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["zcorps", "zc-item"],
    position: { width: 480, height: "auto" },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { editPortrait: onEditImage }
  };

  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/item/item.hbs`, scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    const skillChoices = {};
    for (const [key, s] of Object.entries(SKILLS)) skillChoices[key] = `${s.label} (${ATTRIBUTES[s.attribute]})`;
    return Object.assign(context, {
      item,
      system: item.system,
      editable: this.isEditable,
      isArme: item.type === "arme",
      isEquipement: item.type === "equipement",
      isCompetence: item.type === "competence",
      skillChoices,
      attributeChoices: ATTRIBUTES
    });
  }
}
