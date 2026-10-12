import { SKILLS, STRESS, WOUNDS, ACCOUTUMANCE } from "../config.mjs";
import { codeToPips, pipsToCode, rollFormula } from "../dice-code.mjs";
import { nextWoundLevel, thresholdsCrossed } from "../rules.mjs";
import { rollD6, rollSimple, postChat } from "../dice/roll.mjs";

const escape = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

export class ZCorpsActor extends Actor {

  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    if (data.prototypeToken) return;
    const token = {
      "prototypeToken.bar1.attribute": "wounds",
      "prototypeToken.displayBars": CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER
    };
    if (this.type === "personnage") {
      Object.assign(token, {
        "prototypeToken.actorLink": true,
        "prototypeToken.disposition": CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        "prototypeToken.bar2.attribute": "accoutumance"
      });
    }
    this.updateSource(token);
  }

  async _preUpdate(changes, options, user) {
    if ((await super._preUpdate(changes, options, user)) === false) return false;
    const next = foundry.utils.getProperty(changes, "system.accoutumance.value");
    if (this.type === "personnage" && next !== undefined) {
      options.zcAccoutumance = { before: this.system.accoutumance.value, after: next };
    }
  }

  _onUpdate(changed, options, userId) {
    super._onUpdate(changed, options, userId);
    const change = options.zcAccoutumance;
    if (!change || userId !== game.user.id) return;
    for (const t of thresholdsCrossed(change.before, change.after, ACCOUTUMANCE.thresholds)) {
      const tier = ACCOUTUMANCE.thresholds.indexOf(t) + 1;
      postChat(this, `<div class="zc-roll zc-accou-alert"><header class="zc-roll-title">Accoutumance</header>
        <p><strong>${escape(this.name)}</strong> atteint le palier ${tier} (${t}/${ACCOUTUMANCE.max}).</p></div>`);
    }
  }

  /** Initiative : jet de Perception (dé libre compris). */
  getRollData() {
    const data = Object.assign({}, super.getRollData());
    data.initiative = rollFormula(this.system.attributes.perception.pips);
    return data;
  }

  /* -------------------------------------------- */
  /*  Jets                                        */
  /* -------------------------------------------- */

  rollAttribute(key, { fast = false } = {}) {
    const attr = this.system.attributes[key];
    return rollD6(this, { label: attr.label, pips: attr.pips, fast });
  }

  rollSkill(key, { fast = false } = {}) {
    const skill = this.system.skills?.[key];
    if (skill) return rollD6(this, { label: skill.label, pips: skill.pips, fast });
    // Compétence de base sans entrée sur la fiche (PNJ) : on lance l'attribut.
    const def = SKILLS[key];
    const attr = this.system.attributes[def.attribute];
    return rollD6(this, { label: def.label, pips: attr.pips, fast, notes: [`Non entraînée : ${attr.label} seul`] });
  }

  /** Total d'une compétence ajoutée en objet. */
  customSkillPips(item) {
    return this.system.attributes[item.system.attribute].pips + codeToPips(item.system.bonus).pips;
  }

  rollCustomSkill(item, { fast = false } = {}) {
    return rollD6(this, { label: item.name, pips: this.customSkillPips(item), fast });
  }

  /** Compétence d'une arme : compétence ajoutée du même nom en priorité, sinon compétence de base. */
  weaponSkillPips(item) {
    const custom = this.items.find(i => i.type === "competence" && i.name === SKILLS[item.system.skill]?.label);
    if (custom) return this.customSkillPips(custom);
    const skill = this.system.skills?.[item.system.skill];
    if (skill) return skill.pips;
    return this.system.attributes[SKILLS[item.system.skill].attribute].pips;
  }

  async rollWeaponAttack(item, { fast = false } = {}) {
    const ammo = item.system.ammo;
    if (ammo.max > 0) {
      if (ammo.value <= 0) {
        ui.notifications.warn(`${item.name} : plus de munitions.`);
        return null;
      }
    }
    const skillLabel = SKILLS[item.system.skill]?.label ?? "";
    const result = await rollD6(this, {
      label: `${item.name} — ${skillLabel}`,
      pips: this.weaponSkillPips(item),
      fast
    });
    if (result && ammo.max > 0) await item.update({ "system.ammo.value": ammo.value - 1 });
    return result;
  }

  weaponDamagePips(item) {
    let pips = codeToPips(item.system.damage).pips;
    if (item.system.addDamageBonus) pips += this.system.damageBonusPips;
    return pips;
  }

  rollWeaponDamage(item, { fast = false } = {}) {
    const notes = item.system.addDamageBonus && this.system.damageBonusPips
      ? [`Bonus aux dégâts inclus (${pipsToCode(this.system.damageBonusPips, { signed: true })})`] : [];
    return rollD6(this, { label: `Dégâts — ${item.name}`, pips: this.weaponDamagePips(item), kind: "damage", fast, notes });
  }

  rollStress() {
    const level = STRESS[this.system.stress.value];
    return rollSimple(this, {
      label: `Test de stress (${level.label})`,
      formula: `1${level.die}`
    });
  }

  /* -------------------------------------------- */
  /*  Dégâts                                      */
  /* -------------------------------------------- */

  /** Protection totale des équipements portés, en crans. */
  get protectionPips() {
    return this.items
      .filter(i => i.type === "equipement" && i.system.equipped)
      .reduce((sum, i) => sum + codeToPips(i.system.protection).pips, 0);
  }

  /**
   * Jet de résistance (Puissance + protection) contre des dégâts,
   * puis mise à jour du niveau de blessure.
   */
  applyDamage(damage) {
    const protection = this.protectionPips;
    const notes = protection ? [`Protection incluse : ${pipsToCode(protection, { signed: true })}`] : [];
    return rollD6(this, {
      label: `Encaisser ${damage} points de dégâts`,
      pips: this.system.attributes.puissance.pips + protection,
      kind: "resistance",
      notes,
      afterRoll: async result => {
        const margin = damage - result.total;
        const before = this.system.wounds.value;
        const after = nextWoundLevel(before, margin);
        if (after !== before) await this.update({ "system.wounds.value": after });
        return {
          highlight: after === before
            ? (margin < 0 ? "Aucun effet" : `Reste ${WOUNDS[after].label}`)
            : WOUNDS[after].label,
          notes: [`Dégâts ${damage} − résistance ${result.total} = marge ${margin}`]
        };
      }
    });
  }
}
