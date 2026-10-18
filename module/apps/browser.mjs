import { SYSTEM_ID, SKILLS } from "../config.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/** Texte de recherche sans accents ni majuscules. */
export const normalize = s => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const MODES = {
  pouvoirs: {
    title: "Pouvoirs occultes",
    pack: `${SYSTEM_ID}.pouvoirs-occultes`,
    types: ["pouvoir"],
    gmOnly: true
  },
  objets: {
    title: "Banque d'objets",
    pack: `${SYSTEM_ID}.equipement`,
    types: ["arme", "equipement"],
    gmOnly: false
  }
};

/**
 * Fenêtre de recherche dans la compendie du système et dans les objets du monde.
 * - pouvoirs : une case à cocher par pouvoir, cochée = le personnage le possède ;
 * - objets   : un bouton « Ajouter » (une arme / un équipement en plus, ou +1 en quantité).
 */
export class ZCorpsBrowser extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor({ actor, mode = "objets", ...options } = {}) {
    super(options);
    this.actor = actor;
    this.mode = mode;
    this.query = "";
    this.group = "";
    this.ownedOnly = false;
    this._hooks = ["createItem", "updateItem", "deleteItem"].map(hook => [hook, Hooks.on(hook, item => {
      if (!item.parent || item.parent === this.actor) this.render();
    })]);
  }

  static DEFAULT_OPTIONS = {
    classes: ["zcorps", "zc-browser"],
    position: { width: 640, height: 720 },
    window: { resizable: true },
    actions: {
      toggle: ZCorpsBrowser.#onToggle,
      add: ZCorpsBrowser.#onAdd,
      open: ZCorpsBrowser.#onOpen,
      create: ZCorpsBrowser.#onCreate
    }
  };

  static PARTS = {
    body: { template: `systems/${SYSTEM_ID}/templates/apps/browser.hbs`, scrollable: [".zc-browser-list"] }
  };

  get title() {
    const base = MODES[this.mode].title;
    return this.actor ? `${base} — ${this.actor.name}` : base;
  }

  /** Ouvre (ou ramène au premier plan) la fenêtre pour un acteur et un mode. */
  static open(actor, mode) {
    const existing = foundry.applications.instances.get(`zc-browser-${mode}-${actor?.id ?? "monde"}`);
    if (existing) return existing.render({ force: true });
    if (MODES[mode].gmOnly && !game.user.isGM) {
      ui.notifications.warn("Réservé au MJ.");
      return null;
    }
    return new ZCorpsBrowser({ actor, mode, id: `zc-browser-${mode}-${actor?.id ?? "monde"}` }).render({ force: true });
  }

  async close(options) {
    for (const [hook, id] of this._hooks) Hooks.off(hook, id);
    return super.close(options);
  }

  /** Toutes les entrées disponibles : compendie du système + objets du monde. */
  async _loadEntries() {
    const { pack, types } = MODES[this.mode];
    const docs = [];
    const compendium = game.packs.get(pack);
    if (compendium?.testUserPermission(game.user, "OBSERVER")) {
      for (const doc of await compendium.getDocuments()) docs.push({ doc, origin: "Livre" });
    }
    for (const doc of game.items.filter(i => types.includes(i.type) && i.testUserPermission(game.user, "OBSERVER"))) {
      docs.push({ doc, origin: "Monde" });
    }
    return docs;
  }

  /** Objet de l'acteur issu de cette source (marqué à l'ajout, ou importé de la compendie). */
  _ownedFrom(uuid) {
    return this.actor?.items.find(i =>
      i.getFlag(SYSTEM_ID, "sourceUuid") === uuid || i._stats?.compendiumSource === uuid);
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const entries = (await this._loadEntries()).map(({ doc, origin }) => {
      const s = doc.system;
      const owned = this._ownedFrom(doc.uuid);
      const entry = {
        uuid: doc.uuid, name: doc.name, img: doc.img, origin,
        owned: !!owned,
        quantity: owned?.system.quantity
      };
      if (doc.type === "pouvoir") {
        Object.assign(entry, {
          group: `Seuil ${s.tier}`, groupSort: s.tier,
          tier: "◆".repeat(s.tier), tags: s.tagList, cost: s.cost,
          details: s.mechanic, extra: s.narrative
        });
      } else {
        const category = s.category || (doc.type === "arme" ? "Armes" : "Équipement");
        const stats = doc.type === "arme"
          ? [`Dégâts ${s.damage}`, SKILLS[s.skill]?.label,
            s.ammo.max ? `${s.ammo.max} coups` : "",
            [s.range.short, s.range.medium, s.range.long].filter(Boolean).join("/"),
            s.price].filter(Boolean)
          : [s.protection ? `Protection ${s.protection}` : "", s.availability ? `Dispo. ${s.availability}` : "", s.price].filter(Boolean);
        Object.assign(entry, { group: category, groupSort: category, stats, details: s.notes, tags: [] });
      }
      entry.search = normalize([entry.name, entry.group, ...entry.tags, entry.details, ...(entry.stats ?? [])].join(" "));
      return entry;
    });

    const groups = new Map();
    for (const e of entries.sort((a, b) => a.name.localeCompare(b.name, "fr"))) {
      if (!groups.has(e.group)) groups.set(e.group, { label: e.group, sort: e.groupSort, entries: [] });
      groups.get(e.group).entries.push(e);
    }
    const sorted = [...groups.values()].sort((a, b) =>
      typeof a.sort === "number" ? a.sort - b.sort : 0);

    return Object.assign(context, {
      isPowers: this.mode === "pouvoirs",
      actor: this.actor,
      canEdit: !!this.actor?.isOwner,
      isGM: game.user.isGM,
      groups: sorted,
      groupChoices: sorted.map(g => ({ value: g.label, label: g.label, selected: g.label === this.group })),
      query: this.query,
      ownedOnly: this.ownedOnly,
      empty: !entries.length
    });
  }

  _onRender(context, options) {
    super._onRender(context, options);
    const html = this.element;
    const search = html.querySelector("[name=query]");
    const group = html.querySelector("[name=group]");
    const owned = html.querySelector("[name=ownedOnly]");
    search?.addEventListener("input", () => { this.query = search.value; this._filter(); });
    group?.addEventListener("change", () => { this.group = group.value; this._filter(); });
    owned?.addEventListener("change", () => { this.ownedOnly = owned.checked; this._filter(); });
    this._filter();
  }

  /** Filtrage dans la page, sans nouveau rendu (la saisie n'est pas interrompue). */
  _filter() {
    const words = normalize(this.query).split(/\s+/).filter(Boolean);
    let shown = 0;
    for (const section of this.element.querySelectorAll(".zc-browser-group")) {
      const groupOk = !this.group || section.dataset.group === this.group;
      let visible = 0;
      for (const row of section.querySelectorAll(".zc-browser-entry")) {
        const ok = groupOk
          && words.every(w => row.dataset.search.includes(w))
          && (!this.ownedOnly || row.dataset.owned === "true");
        row.hidden = !ok;
        if (ok) visible++;
      }
      section.hidden = !visible;
      shown += visible;
    }
    const counter = this.element.querySelector(".zc-browser-count");
    if (counter) counter.textContent = `${shown} résultat${shown > 1 ? "s" : ""}`;
  }

  /** Copie d'un document source pour l'acteur, avec le lien vers sa source. */
  static async #copy(uuid) {
    const source = await fromUuid(uuid);
    const data = source.toObject();
    delete data._id;
    delete data.folder;
    foundry.utils.setProperty(data, `flags.${SYSTEM_ID}.sourceUuid`, uuid);
    return data;
  }

  /** Pouvoirs : cocher = ajouter au personnage, décocher = retirer. */
  static async #onToggle(event, target) {
    if (!this.actor?.isOwner) return;
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    const owned = this._ownedFrom(uuid);
    if (owned) await owned.delete();
    else await this.actor.createEmbeddedDocuments("Item", [await ZCorpsBrowser.#copy(uuid)]);
  }

  /** Objets : ajoute un exemplaire (ou +1 en quantité pour un équipement déjà possédé). */
  static async #onAdd(event, target) {
    if (!this.actor?.isOwner) return;
    const uuid = target.closest("[data-uuid]").dataset.uuid;
    const owned = this._ownedFrom(uuid);
    if (owned?.type === "equipement") {
      await owned.update({ "system.quantity": owned.system.quantity + 1 });
    } else {
      await this.actor.createEmbeddedDocuments("Item", [await ZCorpsBrowser.#copy(uuid)]);
    }
    ui.notifications.info(`${target.closest("[data-uuid]").dataset.name} ajouté à ${this.actor.name}.`);
  }

  static async #onOpen(event, target) {
    const doc = await fromUuid(target.closest("[data-uuid]").dataset.uuid);
    doc?.sheet.render(true);
  }

  /** Crée un nouvel objet du monde (il apparaît ensuite dans la liste). */
  static async #onCreate() {
    let type = "pouvoir";
    if (this.mode === "objets") {
      type = await foundry.applications.api.DialogV2.wait({
        window: { title: "Nouvel objet" },
        content: "<p>Quel type d'objet créer ?</p>",
        rejectClose: false,
        buttons: [
          { action: "arme", label: "Arme", icon: "fa-solid fa-crosshairs" },
          { action: "equipement", label: "Équipement", icon: "fa-solid fa-suitcase", default: true }
        ]
      });
      if (!type) return;
    }
    const names = { pouvoir: "Nouveau pouvoir", arme: "Nouvelle arme", equipement: "Nouvel équipement" };
    const item = await Item.implementation.create({ name: names[type], type });
    item?.sheet.render(true);
  }
}
