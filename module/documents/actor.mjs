import { SKILLS, STRESS, WOUNDS, ACCOUTUMANCE, ADVANCEMENT, VEHICLE_DAMAGE } from "../config.mjs";
import { codeToPips, pipsToCode, rollFormula } from "../dice-code.mjs";
import { nextWoundLevel, accoutumanceEvents, advancementCost, nextSkillBonus, powerCost, nextVehicleDamage, nextAccoutumanceDifficulty, hordeAfterWounds } from "../rules.mjs";
import { rollD6, rollSimple, postChat } from "../dice/roll.mjs";

const escape = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);

export class ZCorpsActor extends Actor {

  async _preCreate(data, options, user) {
    if ((await super._preCreate(data, options, user)) === false) return false;
    if (data.prototypeToken || this.type === "groupe") return;
    const token = {
      "prototypeToken.bar1.attribute": this.type === "vehicule" ? "damage" : "wounds",
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
    for (const event of accoutumanceEvents(change.before, change.after, ACCOUTUMANCE.zones, ACCOUTUMANCE.max)) {
      const text = event.type === "full"
        ? `a atteint le maximum d'accoutumance (${event.value}/${ACCOUTUMANCE.max}).`
        : `entre dans le <strong>seuil ${event.tier}</strong> d'accoutumance (${event.value}/${ACCOUTUMANCE.max}).`;
      postChat(this, `<div class="zc-roll zc-accou-alert zc-tier-${event.tier ?? 3}"><header class="zc-roll-title">Accoutumance</header>
        <p><strong>${escape(this.name)}</strong> ${text}</p></div>`);
    }
  }

  /** Initiative : Test d'Agilité avec dé Joker (p. 28). Une action par tranche de 10 points. */
  getRollData() {
    const data = Object.assign({}, super.getRollData());
    if (this.system.attributes) data.initiative = rollFormula(this.system.attributes.agilite.pips);
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

  /**
   * Compétence d'une arme : compétence ajoutée du même nom en priorité (spécialité comprise,
   * ex. « Bagarre (horde) »), sinon compétence de base.
   */
  weaponSkillPips(item) {
    const label = SKILLS[item.system.skill]?.label;
    const base = name => name.replace(/\s*\(.*\)\s*$/, "").trim();
    const custom = this.items.find(i => i.type === "competence" && i.name === label)
      ?? this.items.find(i => i.type === "competence" && base(i.name) === label);
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

  /** Un code de dégâts précédé de « + » ou « - » modifie le bonus aux dégâts (p. 57). */
  static addsDamageBonus(item) {
    return /^[+-]/.test(item.system.damage.trim());
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
        if (this.system.hp?.enabled) return this._applyHpDamage(margin, damage, result.total);
        const before = this.system.wounds.value;
        const after = nextWoundLevel(before, margin);
        const update = {};
        if (after !== before) update["system.wounds.value"] = after;
        const notes = [`Dégâts ${damage} − résistance ${result.total} = ${margin}`];
        // Horde : chaque niveau de blessure élimine environ 20 % des créatures.
        const horde = this.system.horde;
        if (horde?.enabled && after > before) {
          const count = after >= 6 ? 0 : hordeAfterWounds(horde.count, after - before);
          update["system.horde.count"] = count;
          notes.push(count ? `Horde réduite : ${horde.count} → ${count} créatures.` : "La horde est anéantie ou dispersée.");
        }
        if (Object.keys(update).length) await this.update(update);
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

  /** Profil PV : les points au-delà de la résistance sont retirés des Points de Vie. */
  async _applyHpDamage(margin, damage, resistance) {
    const hp = this.system.hp;
    const notes = [`Dégâts ${damage} − résistance ${resistance} = ${margin}`];
    if (margin <= 0) return { highlight: "Aucune blessure", notes };
    const after = Math.max(0, hp.value - margin);
    await this.update({ "system.hp.value": after });
    notes.push(`PV ${hp.value} → ${after}/${hp.max}`);
    return { highlight: this.system.hp.label, notes };
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

  /* -------------------------------------------- */
  /*  Test d'accoutumance                         */
  /* -------------------------------------------- */

  /**
   * Test de Volonté contre la difficulté courante (15 au départ).
   * Réussite : +3 pour le prochain test ; échec : retour à 15.
   * @param {object} [options]
   * @param {number} [options.difficulty]  difficulté imposée (relance avec un point de Cojones)
   * @param {object} [options.preset]      options de jet reprises lors d'une relance
   */
  rollAccoutumanceTest({ difficulty, preset, fast = false } = {}) {
    const { skill, base, step } = ACCOUTUMANCE.test;
    const target = difficulty ?? this.system.accoutumance.testDifficulty;
    const volonte = this.system.skills[skill];
    return rollD6(this, {
      label: `Test d'accoutumance (${volonte.label})`,
      pips: volonte.pips,
      fixedDifficulty: target,
      rerollKind: "accoutumance",
      preset,
      fast,
      notes: preset?.reroll ? ["Relance grâce à un point de Cojones"] : [],
      afterRoll: async result => {
        const success = result.outcome === "success";
        const next = nextAccoutumanceDifficulty(target, success, { base, step });
        const update = { "system.accoutumance.testDifficulty": next };
        const notes = [];
        const gain = ACCOUTUMANCE.test.failureGain;
        const before = this.system.accoutumance.value;
        if (preset?.reroll) {
          // Relance (Cojones) d'un échec déjà compté : une réussite annule le +1, un nouvel échec ne recompte rien.
          if (success) {
            update["system.accoutumance.value"] = Math.max(0, before - gain);
            notes.push(`Relance réussie : l'échec est annulé (accoutumance ${before} → ${Math.max(0, before - gain)}).`);
            notes.push(`Prochain test d'accoutumance : difficulté ${next}.`);
          } else {
            notes.push(`La difficulté du test d'accoutumance reste à ${next}.`);
          }
        } else if (success) {
          notes.push(`Prochain test d'accoutumance : difficulté ${next}.`);
        } else {
          // Échec : +1 d'accoutumance, et la difficulté revient à 15.
          const after = Math.min(ACCOUTUMANCE.max, before + gain);
          update["system.accoutumance.value"] = after;
          notes.push(`Échec : accoutumance ${before} → ${after}/${ACCOUTUMANCE.max}.`);
          notes.push(`La difficulté du test d'accoutumance revient à ${next}.`);
        }
        await this.update(update);
        return { highlight: !success && !preset?.reroll ? `+${gain} accoutumance` : "", notes };
      }
    });
  }

  /* -------------------------------------------- */
  /*  Pouvoirs occultes                           */
  /* -------------------------------------------- */

  /**
   * Utilise un pouvoir : ajoute son coût à l'accoutumance (personnages) et l'annonce.
   * Un pouvoir non révélé n'est annoncé qu'au MJ.
   */
  async usePower(item) {
    const cost = powerCost(item.system.cost);
    const lines = [];
    if (cost && this.type === "personnage") {
      const before = this.system.accoutumance.value;
      const after = Math.min(ACCOUTUMANCE.max, before + cost);
      await this.update({ "system.accoutumance.value": after });
      lines.push(`Accoutumance : ${before} → <strong>${after}</strong>/${ACCOUTUMANCE.max}`);
    } else if (cost) {
      lines.push(`Coût : ${escape(item.system.cost)}`);
    }
    const content = `<div class="zc-roll zc-power-card">
      <header class="zc-roll-title">${"◆".repeat(item.system.tier)} ${escape(item.name)}</header>
      ${item.system.mechanic ? `<p>${escape(item.system.mechanic)}</p>` : ""}
      ${lines.map(l => `<div class="zc-note">${l}</div>`).join("")}
    </div>`;
    const cls = ChatMessage.implementation;
    const data = { speaker: cls.getSpeaker({ actor: this }), content };
    if (!item.system.revealed) data.whisper = cls.getWhisperRecipients("GM").map(u => u.id);
    return cls.create(data);
  }

  /* -------------------------------------------- */
  /*  Véhicules                                   */
  /* -------------------------------------------- */

  rollVehicleResistance() {
    return rollD6(this, { label: `Résistance — ${this.name}`, pips: this.system.resistancePips, kind: "resistance" });
  }

  /** Dégâts à un véhicule (p. 52) : jet de Résistance, niveau de dégâts, part des passagers. */
  applyVehicleDamage(damage) {
    return rollD6(this, {
      label: `${this.name} encaisse ${damage} points de dégâts`,
      pips: this.system.resistancePips,
      kind: "resistance",
      afterRoll: async result => {
        const margin = damage - result.total;
        const before = this.system.damage.value;
        const after = nextVehicleDamage(before, margin);
        if (after !== before) await this.update({ "system.damage.value": after });
        const share = VEHICLE_DAMAGE[after].passengers;
        const notes = [`Dégâts ${damage} − résistance ${result.total} = ${margin}`];
        if (after !== before && VEHICLE_DAMAGE[after].effect) notes.push(VEHICLE_DAMAGE[after].effect);
        if (margin > 0 && share) notes.push(`Passagers : ${Math.round(damage * share)} points de dégâts (${share * 100} %), à moduler selon leur exposition.`);
        return { highlight: margin <= 0 ? "Aucun dégât" : VEHICLE_DAMAGE[after].label, notes };
      }
    });
  }

  /* -------------------------------------------- */
  /*  Archétypes                                  */
  /* -------------------------------------------- */

  /**
   * Remplace Caractéristiques, compétences et historique par ceux d'un archétype.
   * Les objets du personnage (armes, équipement, pouvoirs) sont conservés ; ses compétences ajoutées sont remplacées.
   */
  async applyArchetype(source) {
    const data = source.system.toObject();
    const keep = ["pseudo", "genre", "age", "taille", "poids", "cojones", "cp", "accoutumance", "wounds", "stress", "occult", "money", "equipmentNotes", "notes"];
    for (const key of keep) delete data[key];
    await this.update({ system: data });
    const oldSkills = this.items.filter(i => i.type === "competence").map(i => i.id);
    if (oldSkills.length) await this.deleteEmbeddedDocuments("Item", oldSkills);
    const newSkills = source.items.filter(i => i.type === "competence").map(i => {
      const obj = i.toObject();
      delete obj._id;
      return obj;
    });
    if (newSkills.length) await this.createEmbeddedDocuments("Item", newSkills);
  }
}
