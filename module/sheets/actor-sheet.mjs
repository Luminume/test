import { SYSTEM_ID, ATTRIBUTES, SKILLS, WOUNDS, STRESS, ACCOUTUMANCE, OCCULT_SLOTS, ADVANCEMENT } from "../config.mjs";
import { codeToPips, pipsToCode } from "../dice-code.mjs";
import { advancementCost } from "../rules.mjs";
import { ZCorpsBrowser } from "../apps/browser.mjs";

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

/** Affiche ou masque les boutons de progression. */
function onToggleProgression() {
  this.progression = !this.progression;
  return this.render();
}

function onImprove(event, target) {
  const { type, key } = target.dataset;
  const id = type === "custom" ? target.closest("[data-item-id]").dataset.itemId : key;
  return this.document.improve(type, id);
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

/** Change le portrait ; le jeton suit s'il utilisait encore l'ancienne image ou l'image par défaut. */
function onEditPortrait() {
  const actor = this.document;
  const FP = foundry.applications.apps.FilePicker.implementation;
  return new FP({
    type: "image",
    current: actor.img,
    callback: path => {
      const update = { img: path };
      const token = actor.prototypeToken.texture.src;
      if (!token || token === actor.img || token === CONST.DEFAULT_TOKEN) update["prototypeToken.texture.src"] = path;
      return actor.update(update);
    }
  }).browse();
}

/** Affiche le portrait en grand et le montre à tous les joueurs connectés. */
function onShowPortrait() {
  const actor = this.document;
  const popout = new foundry.applications.apps.ImagePopout({
    src: actor.img,
    uuid: actor.uuid,
    window: { title: actor.name }
  });
  popout.render({ force: true });
  popout.shareImage();
}

function onOpenBrowser(event, target) {
  return ZCorpsBrowser.open(this.document, target.dataset.mode);
}

function onTogglePowerRevealed(event, target) {
  const item = itemOf(this, target);
  if (item && game.user.isGM) return item.update({ "system.revealed": !item.system.revealed });
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
      editPortrait: onEditPortrait,
      toggleProgression: onToggleProgression,
      showPortrait: onShowPortrait,
      openBrowser: onOpenBrowser,
      togglePowerRevealed: onTogglePowerRevealed,
      improve: onImprove
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const system = actor.system;
    const items = actor.items.contents.sort((a, b) => (a.sort - b.sort) || a.name.localeCompare(b.name));

    const skillCost = pips => advancementCost(pips, ADVANCEMENT.skillMultiplier);

    Object.assign(context, {
      actor,
      system,
      editable: this.isEditable,
      progression: this.isEditable && actor.type === "personnage" && !!this.progression,
      attributeBlocks: Object.entries(ATTRIBUTES).map(([key, label]) => ({
        key,
        label,
        attr: system.attributes[key],
        cost: advancementCost(system.attributes[key].pips, ADVANCEMENT.attributeMultiplier),
        next: pipsToCode(system.attributes[key].pips + 1),
        skills: system.skills
          ? Object.entries(SKILLS).filter(([, s]) => s.attribute === key).map(([k]) => ({
            key: k,
            ...system.skills[k],
            cost: skillCost(system.skills[k].pips),
            next: pipsToCode(system.skills[k].pips + 1)
          }))
          : [],
        custom: items.filter(i => i.type === "competence" && i.system.attribute === key).map(i => {
          const bonus = codeToPips(i.system.bonus);
          const pips = actor.customSkillPips(i);
          return {
            id: i.id, name: i.name, bonus: i.system.bonus, valid: bonus.valid,
            total: pipsToCode(pips), cost: skillCost(pips), next: pipsToCode(pips + 1)
          };
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
      isGM: game.user.isGM,
      // Pouvoirs : le MJ les voit tous, les joueurs seulement ceux qui sont révélés.
      powers: items.filter(i => i.type === "pouvoir" && (game.user.isGM || i.system.revealed))
        .sort((a, b) => (a.system.tier - b.system.tier) || a.name.localeCompare(b.name, "fr"))
        .map(i => ({
          id: i.id, name: i.name, tier: "◆".repeat(i.system.tier), cost: i.system.cost,
          mechanic: i.system.mechanic, revealed: i.system.revealed
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

    context.showPowers = context.isGM || context.powers.length > 0;
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
        tier: system.accoutumance.tier,
        cells: Array.from({ length: ACCOUTUMANCE.max }, (_, i) => {
          const value = i + 1;
          const zone = ACCOUTUMANCE.zones.find(z => value >= z.from && value <= z.to);
          return {
            value,
            filled: value <= accou,
            tier: zone.tier,
            // Fin de seuil : trait épais et repère sous la case (10, 20, 30).
            threshold: value === zone.to
          };
        }),
        zones: ACCOUTUMANCE.zones.map(z => ({
          ...z, label: `Seuil ${z.tier}`, range: `${z.from}-${z.to}`, current: z.tier === system.accoutumance.tier
        }))
      },
      // Lignes libres : celles déjà remplies, puis des vides jusqu'à 6 lignes au total avec les pouvoirs.
      occult: (() => {
        const rows = Array.from({ length: OCCULT_SLOTS }, (_, i) => ({ key: `p${i + 1}`, ...system.occult[`p${i + 1}`] }));
        const filled = rows.filter(r => r.name || r.effect);
        const blanks = rows.filter(r => !r.name && !r.effect);
        const room = Math.max(0, OCCULT_SLOTS - context.powers.length - filled.length);
        return [...filled, ...blanks.slice(0, room)];
      })()
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
