import { SKILLS, STRESS, WOUNDS, ACCOUTUMANCE, ADVANCEMENT } from "../config.mjs";
import { codeToPips, pipsToCode, rollFormula } from "../dice-code.mjs";
import { nextWoundLevel, thresholdsCrossed, advancementCost, nextSkillBonus } from "../rules.mjs";
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

  /** Initiative : Test d'Agilité avec dé Joker (p. 28). Une action par tranche de 10 points. */
  getRollData() {
    const data = Object.assign({}, super.getRollData());
    data.initiative = rollFormula(this.system.attributes.agilite.pips);
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
    // Compétence de base sans entrée sur la fiche (PNJ) : Caractéristique -1D (p. 22).
    const def = SKILLS[key];
    const attr = this.system.attributes[def.attribute];
    return rollD6(this, { label: def.label, pips: attr.pips - 3, fast, notes: [`Non sélectionnée : ${attr.label} -1D`] });
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
    return this.system.attributes[SKILLS[item.system.skill].attribute].pips - 3;
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

  /** Un code de dégâts précédé de « + » s'ajoute au bonus aux dégâts (p. 57). */
  static addsDamageBonus(item) {
    return item.system.damage.trim().startsWith("+");
  }

  weaponDamagePips(item) {
    let pips = codeToPips(item.system.damage).pips;
    if (ZCorpsActor.addsDamageBonus(item)) pips += this.system.damageBonusPips;
    return pips;
  }

  rollWeaponDamage(item, { fast = false } = {}) {
    const notes = ZCorpsActor.addsDamageBonus(item)
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
        const notes = [`Dégâts ${damage} − résistance ${result.total} = ${margin}`];
        if (after !== before && WOUNDS[after].effect) notes.push(WOUNDS[after].effect);
        return {
          highlight: after === before
            ? (margin <= 0 ? "Aucune blessure" : `Reste ${WOUNDS[after].label}`)
            : WOUNDS[after].label,
          notes
        };
      }
    });
  }

  /* -------------------------------------------- */
  /*  Progression (points de personnage)          */
  /* -------------------------------------------- */

  /**
   * Ce que coûte et rapporte +1 tiers sur une Caractéristique, une compétence de base
   * ou une compétence ajoutée.
   * @param {"attribute"|"skill"|"custom"} type
   * @param {string} id  clé de Caractéristique / de compétence, ou id de l'objet
   */
  advancementPlan(type, id) {
    const bonusCode = p => (p ? pipsToCode(p, { signed: true }) : "");
    if (type === "attribute") {
      const attr = this.system.attributes[id];
      return {
        label: attr.label,
        from: attr.pips,
        cost: advancementCost(attr.pips, ADVANCEMENT.attributeMultiplier),
        apply: () => this.update({ [`system.attributes.${id}.code`]: pipsToCode(attr.pips + 1) })
      };
    }
    if (type === "skill") {
      const skill = this.system.skills[id];
      const bonus = nextSkillBonus(codeToPips(skill.bonus).pips, skill.trained);
      return {
        label: skill.label,
        from: skill.pips,
        cost: advancementCost(skill.pips, ADVANCEMENT.skillMultiplier),
        note: skill.trained ? "" : "La compétence devient sélectionnée.",
        apply: () => this.update({ [`system.skills.${id}.selected`]: true, [`system.skills.${id}.bonus`]: bonusCode(bonus) })
      };
    }
    const item = this.items.get(id);
    const from = this.customSkillPips(item);
    return {
      label: item.name,
      from,
      cost: advancementCost(from, ADVANCEMENT.skillMultiplier),
      apply: () => item.update({ "system.bonus": bonusCode(codeToPips(item.system.bonus).pips + 1) })
    };
  }

  /** Dépense des points de personnage pour gagner 1 tiers, après confirmation. */
  async improve(type, id) {
    const plan = this.advancementPlan(type, id);
    const available = this.system.cp.value;
    const from = pipsToCode(plan.from);
    const to = pipsToCode(plan.from + 1);
    if (available < plan.cost) {
      ui.notifications.warn(`${plan.label} : il faut ${plan.cost} points de personnage (${available} disponibles).`);
      return false;
    }
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Progression" },
      content: `<p>Améliorer <strong>${escape(plan.label)}</strong> de ${from} à <strong>${to}</strong>
        pour <strong>${plan.cost}</strong> point(s) de personnage (${available} disponibles) ?</p>
        ${plan.note ? `<p>${plan.note}</p>` : ""}`,
      rejectClose: false
    });
    if (!ok) return false;
    await plan.apply();
    await this.update({ "system.cp.value": available - plan.cost });
    await postChat(this, `<div class="zc-roll"><header class="zc-roll-title">Progression</header>
      <p><strong>${escape(plan.label)}</strong> : ${from} → <strong>${to}</strong></p>
      <div class="zc-note">${plan.cost} point(s) de personnage dépensé(s), reste ${available - plan.cost}.</div></div>`);
    return true;
  }
}
