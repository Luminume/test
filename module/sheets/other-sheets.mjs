import { SYSTEM_ID, VEHICLE_DAMAGE, WOUNDS, STRESS, ACCOUTUMANCE } from "../config.mjs";
import { pipsToCode } from "../dice-code.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

function onEditPortrait() {
  const FP = foundry.applications.apps.FilePicker.implementation;
  return new FP({ type: "image", current: this.document.img, callback: path => this.document.update({ img: path }) }).browse();
}

/* -------------------------------------------- */
/*  Véhicule                                    */
/* -------------------------------------------- */

function onSetDamage(event, target) {
  const level = Number(target.dataset.level);
  const current = this.document.system.damage.value;
  return this.document.update({ "system.damage.value": current === level ? level - 1 : level });
}

async function onVehicleDamage() {
  const damage = await DialogV2.prompt({
    window: { title: "Dégâts au véhicule" },
    classes: ["zcorps", "zc-dialog"],
    content: `<div class="form-group"><label>Total des dégâts (arme ou collision)</label>
      <input type="number" name="damage" min="0" value="0" autofocus></div>`,
    ok: { label: "Encaisser", icon: "fa-solid fa-car-burst", callback: (event, button) => Number(button.form.elements.damage.value) || 0 },
    rejectClose: false
  });
  if (damage > 0) return this.document.applyVehicleDamage(damage);
}

function onVehicleResistance() {
  return this.document.rollVehicleResistance();
}

export class VehiculeSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["zcorps", "zc-actor", "zc-vehicle"],
    position: { width: 620, height: 640 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { setDamage: onSetDamage, vehicleDamage: onVehicleDamage, vehicleResistance: onVehicleResistance, editPortrait: onEditPortrait }
  };

  static PARTS = { sheet: { template: `systems/${SYSTEM_ID}/templates/actor/vehicule.hbs`, scrollable: [""] } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.document.system;
    return Object.assign(context, {
      actor: this.document,
      system,
      editable: this.isEditable,
      resistanceTotal: pipsToCode(system.resistancePips),
      manoeuvreTotal: pipsToCode(system.manoeuvrePips, { signed: true }),
      levels: VEHICLE_DAMAGE.slice(1).map(l => ({
        ...l, checked: system.damage.value >= l.level, current: system.damage.value === l.level,
        share: l.passengers ? `${l.passengers * 100} %` : "—"
      }))
    });
  }
}

/* -------------------------------------------- */
/*  Groupe                                      */
/* -------------------------------------------- */

const memberOf = (sheet, target) => target.closest("[data-uuid]")?.dataset.uuid;

async function onOpenMember(event, target) {
  (await fromUuid(memberOf(this, target)))?.sheet.render(true);
}

function onRemoveMember(event, target) {
  const uuid = memberOf(this, target);
  return this.document.update({ "system.members": this.document.system.members.filter(m => m !== uuid) });
}

export class GroupeSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["zcorps", "zc-actor", "zc-group"],
    position: { width: 760, height: 640 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: { openMember: onOpenMember, removeMember: onRemoveMember, editPortrait: onEditPortrait }
  };

  static PARTS = { sheet: { template: `systems/${SYSTEM_ID}/templates/actor/groupe.hbs`, scrollable: [""] } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const members = [];
    for (const uuid of this.document.system.members) {
      const actor = await fromUuid(uuid);
      if (!actor) {
        members.push({ uuid, missing: true, name: "(personnage supprimé)" });
        continue;
      }
      const s = actor.system;
      const visible = actor.testUserPermission(game.user, "OBSERVER");
      members.push({
        uuid, name: actor.name, img: actor.img, visible,
        type: CONFIG.Actor.typeLabels[actor.type] ?? actor.type,
        wounds: s.wounds ? (WOUNDS[s.wounds.value]?.label ?? "") : (s.damageLabel ?? ""),
        hurt: (s.wounds?.value ?? s.damage?.value ?? 0) > 0,
        stress: s.stress ? STRESS[s.stress.value]?.label : "",
        accoutumance: s.accoutumance ? `${s.accoutumance.value}/${ACCOUTUMANCE.max} (seuil ${s.accoutumance.tier})` : "",
        cojones: s.cojones?.value,
        cp: s.cp?.value
      });
    }
    return Object.assign(context, { actor: this.document, system: this.document.system, editable: this.isEditable, members });
  }

  /** Glisser un acteur depuis la barre latérale pour l'ajouter au groupe. */
  _onRender(context, options) {
    super._onRender(context, options);
    const zone = this.element.querySelector(".zc-group-members");
    zone?.addEventListener("dragover", event => event.preventDefault());
    zone?.addEventListener("drop", async event => {
      event.preventDefault();
      event.stopPropagation();
      if (!this.isEditable) return;
      const data = foundry.applications.ux.TextEditor.implementation.getDragEventData(event);
      if (data?.type !== "Actor" || !data.uuid) return;
      const actor = await fromUuid(data.uuid);
      if (!actor || actor === this.document || actor.type === "groupe") return;
      const members = this.document.system.members;
      if (!members.includes(actor.uuid)) await this.document.update({ "system.members": [...members, actor.uuid] });
    });
  }
}
