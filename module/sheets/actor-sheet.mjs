import { SYSTEM_ID, ATTRIBUTES, SKILLS, WOUNDS, STRESS, ACCOUTUMANCE, OCCULT_SLOTS } from "../config.mjs";
import { codeToPips, pipsToCode } from "../dice-code.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const escape = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const itemOf = (sheet, target) => sheet.document.items.get(target.closest("[data-item-id]")?.dataset.itemId);

/* -------------------------------------------- */
/*  Actions (this = la fiche)                   */
/* -------------------------------------------- */

function onRollAttribute(event, target) {
  return this.document.rollAttribute(target.dataset.attribute, { fast: event.shiftKey });
}

function onRollSkill(event, target) {
  return this.document.rollSkill(target.dataset.skill, { fast: event.shiftKey });
}

function onRollCustomSkill(event, target) {
  const item = itemOf(this, target);
  if (item) return this.document.rollCustomSkill(item, { fast: event.shiftKey });
}

function onWeaponAttack(event, target) {
  const item = itemOf(this, target);
  if (item) return this.document.rollWeaponAttack(item, { fast: event.shiftKey });
}

function onWeaponDamage(event, target) {
  const item = itemOf(this, target);
  if (item) return this.document.rollWeaponDamage(item, { fast: event.shiftKey });
}

function onWeaponReload(event, target) {
  const item = itemOf(this, target);
  if (item) return item.update({ "system.ammo.value": item.system.ammo.max });
}

/** Clic sur une case déjà cochée (la plus haute) = on la décoche. */
function toggleLevel(current, clicked) {
  return current === clicked ? clicked - 1 : clicked;
}

function onSetWound(event, target) {
  const level = Number(target.dataset.level);
  return this.document.update({ "system.wounds.value": toggleLevel(this.document.system.wounds.value, level) });
}

function onSetStress(event, target) {
  const level = Number(target.dataset.level);
  const current = this.document.system.stress.value;
  return this.document.update({ "system.stress.value": current === level ? Math.max(0, level - 1) : level });
}

function onRollStress() {
  return this.document.rollStress();
}

function onSetAccoutumance(event, target) {
  const value = Number(target.dataset.value);
  return this.document.update({
    "system.accoutumance.value": toggleLevel(this.document.system.accoutumance.value, value)
  });
}

function onStepAccoutumance(event, target) {
  const value = this.document.system.accoutumance.value + Number(target.dataset.step);
  return this.document.update({
    "system.accoutumance.value": Math.max(0, Math.min(ACCOUTUMANCE.max, value))
  });
}

async function onTakeDamage() {
  const damage = await DialogV2.prompt({
    window: { title: "Encaisser des dégâts" },
    classes: ["zcorps", "zc-dialog"],
    content: `<div class="form-group"><label>Total des dégâts</label>
      <input type="number" name="damage" min="0" value="0" autofocus></div>`,
    ok: {
      label: "Encaisser",
      icon: "fa-solid fa-heart-crack",
      callback: (event, button) => Number(button.form.elements.damage.value) || 0
    },
    rejectClose: false
  });
  if (damage > 0) return this.document.applyDamage(damage);
}

async function onItemCreate(event, target) {
  const { type, attribute } = target.dataset;
  const names = { arme: "Nouvelle arme", equipement: "Nouvel équipement", competence: "Nouvelle compétence" };
  const data = { name: names[type], type };
  if (attribute) data.system = { attribute };
  const [item] = await this.document.createEmbeddedDocuments("Item", [data]);
  item?.sheet.render(true);
}

function onItemEdit(event, target) {
  itemOf(this, target)?.sheet.render(true);
}

async function onItemDelete(event, target) {
  const item = itemOf(this, target);
  if (!item) return;
  const ok = await DialogV2.confirm({
    window: { title: "Supprimer" },
    content: `<p>Supprimer <strong>${escape(item.name)}</strong> ?</p>`,
    rejectClose: false
  });
  if (ok) return item.delete();
}

function onEditPortrait() {
  const FP = foundry.applications.apps.FilePicker.implementation;
  return new FP({
    type: "image",
    current: this.document.img,
    callback: path => this.document.update({ img: path })
  }).browse();
}

/* -------------------------------------------- */
/*  Fiches                                      */
/* -------------------------------------------- */

class ZCorpsActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["zcorps", "zc-actor"],
    position: { width: 920, height: 900 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollAttribute: onRollAttribute,
      rollSkill: onRollSkill,
      rollCustomSkill: onRollCustomSkill,
      weaponAttack: onWeaponAttack,
      weaponDamage: onWeaponDamage,
      weaponReload: onWeaponReload,
      setWound: onSetWound,
      setStress: onSetStress,
      rollStress: onRollStress,
      setAccoutumance: onSetAccoutumance,
      stepAccoutumance: onStepAccoutumance,
      takeDamage: onTakeDamage,
      itemCreate: onItemCreate,
      itemEdit: onItemEdit,
      itemDelete: onItemDelete,
      editPortrait: onEditPortrait
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;
    const items = actor.items.contents.sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name));

    Object.assign(context, {
      actor,
      system,
      editable: this.isEditable,
      attributeBlocks: Object.entries(ATTRIBUTES).map(([key, label]) => ({
        key,
        label,
        attr: system.attributes[key],
        skills: system.skills
          ? Object.entries(SKILLS).filter(([, s]) => s.attribute === key).map(([k]) => ({ key: k, ...system.skills[k] }))
          : [],
        custom: items.filter(i => i.type === "competence" && i.system.attribute === key).map(i => {
          const bonus = codeToPips(i.system.bonus);
          return { id: i.id, name: i.name, bonus: i.system.bonus, valid: bonus.valid, total: pipsToCode(actor.customSkillPips(i)) };
        })
      })),
      wounds: WOUNDS.slice(1).map(w => ({
        ...w,
        checked: system.wounds.value >= w.level,
        current: system.wounds.value === w.level,
        penaltyLabel: w.penalty ? `-${w.penalty}D` : ""
      })),
      weapons: items.filter(i => i.type === "arme").map(i => ({
        id: i.id,
        name: i.name,
        img: i.img,
        skill: SKILLS[i.system.skill]?.label ?? "",
        damage: pipsToCode(actor.weaponDamagePips(i)),
        hasAmmo: i.system.ammo.max > 0,
        ammo: i.system.ammo,
        range: i.system.range
      })),
      equipment: items.filter(i => i.type === "equipement").map(i => ({
        id: i.id,
        name: i.name,
        img: i.img,
        quantity: i.system.quantity,
        protection: i.system.protection,
        equipped: i.system.equipped
      }))
    });

    if (actor.type === "personnage") this._preparePersonnage(context);
    return context;
  }

  _preparePersonnage(context) {
    const system = context.system;
    const accou = system.accoutumance.value;
    Object.assign(context, {
      stress: STRESS.map((s, i) => ({ ...s, level: i, current: system.stress.value === i, reached: i <= system.stress.value })),
      stressCurrent: STRESS[system.stress.value],
      accoutumance: {
        value: accou,
        max: ACCOUTUMANCE.max,
        cells: Array.from({ length: ACCOUTUMANCE.max }, (_, i) => {
          const value = i + 1;
          const threshold = ACCOUTUMANCE.thresholds.includes(value);
          return {
            value,
            filled: value <= accou,
            threshold,
            tier: threshold ? ACCOUTUMANCE.thresholds.indexOf(value) + 1 : 0
          };
        })
      },
      occult: Array.from({ length: OCCULT_SLOTS }, (_, i) => ({ key: `p${i + 1}`, ...system.occult[`p${i + 1}`] }))
    });
  }

  /** Champs d'objets modifiables directement depuis la fiche (data-item-field). */
  _onRender(context, options) {
    super._onRender(context, options);
    for (const input of this.element.querySelectorAll("[data-item-field]")) {
      input.addEventListener("change", event => {
        event.stopPropagation();
        const item = itemOf(this, input);
        if (!item) return;
        let value = input.value;
        if (input.type === "checkbox") value = input.checked;
        else if (input.type === "number") value = Number(value) || 0;
        item.update({ [input.dataset.itemField]: value });
      });
    }
  }
}

export class PersonnageSheet extends ZCorpsActorSheet {
  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/actor/personnage.hbs`, scrollable: [""] }
  };
}

export class PnjSheet extends ZCorpsActorSheet {
  static DEFAULT_OPTIONS = {
    position: { width: 760, height: 760 }
  };

  static PARTS = {
    sheet: { template: `systems/${SYSTEM_ID}/templates/actor/pnj.hbs`, scrollable: [""] }
  };
}
