/**
 * Génère les compendiums du système à partir de tools/data, puis les compile en LevelDB.
 * Usage : npm run build:packs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { WEAPONS, ARMOR, GEAR, VEHICLES } from "./data/equipement.mjs";
import { BESTIARY } from "./data/bestiaire.mjs";
import { PNJ_GROUPS, SINS_AND_ELDERS } from "./data/pnj-campagne.mjs";
import { PAGES } from "./data/aide-memoire.mjs";
import { ATTRIBUTES, SKILLS } from "../module/config.mjs";
import { codeToPips, pipsToCode } from "../module/dice-code.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const SYSTEM = "zcorps-vtt";
const readJson = file => JSON.parse(fs.readFileSync(path.join(ROOT, "tools/data", file), "utf8"));
// Pouvoirs de la campagne puis bibliothèque générique (sans étiquette « Campagne »).
// `variant` distingue les identifiants quand un nom existe dans les deux listes.
// Pouvoirs des PNJ du bestiaire (Péchés, Anciens) : étiquettes Campagne, PNJ, nom du PNJ.
const NPC_POWERS = readJson("pouvoirs-pnj.json").map(p => ({ ...p, variant: `pnj:${p.tags[2]}` }));
const POWERS = [
  ...readJson("pouvoirs.json"),
  ...readJson("pouvoirs-generiques.json").map(p => ({ ...p, variant: "generique" })),
  ...NPC_POWERS
];

/** Identifiant Foundry stable (16 caractères alphanumériques) dérivé d'une clé. */
function id(key) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.createHash("sha256").update(key).digest();
  return Array.from(bytes.subarray(0, 16), b => alphabet[b % alphabet.length]).join("");
}

const stats = { coreVersion: "13.345", systemId: SYSTEM, systemVersion: "0.2.0" };

function folder(pack, name, sort, type = "Item") {
  const _id = id(`${pack}:folder:${name}`);
  return { _id, _key: `!folders!${_id}`, name, type, folder: null, sorting: "a", sort, color: null, description: "", flags: {} };
}

function item(pack, folderDoc, { name, type, img, system, variant }, sort) {
  const _id = id(`${pack}:item:${type}:${name}${variant ? `:${variant}` : ""}`);
  return {
    _id, _key: `!items!${_id}`, name, type, img, system, folder: folderDoc._id, sort,
    effects: [], flags: {}, ownership: { default: 0 }, _stats: stats
  };
}

/** Système d'une arme de la banque, à partir de son nom. */
function bankWeapon(name) {
  for (const group of WEAPONS) {
    const row = group.items.find(r => r[0] === name);
    if (!row) continue;
    const [, damage, ammo, short, medium, long, price, notes] = row;
    return {
      name, type: "arme", img: group.skill === "melee" ? "icons/svg/sword.svg" : "icons/svg/target.svg",
      system: {
        skill: group.skill, category: group.category, damage, price,
        ammo: { value: ammo, max: ammo }, range: { short, medium, long },
        notes: [notes, group.note].filter(Boolean).join("\n")
      }
    };
  }
  throw new Error(`Arme inconnue dans la banque : ${name}`);
}

function bankArmor(name) {
  const row = ARMOR.find(r => r[0] === name);
  if (!row) throw new Error(`Protection inconnue : ${name}`);
  return {
    name, type: "equipement", img: "icons/svg/shield.svg",
    system: { category: "Protections", quantity: 1, protection: row[1], availability: "", price: "", equipped: true, notes: row[2] }
  };
}

/* ---------------- Compétences écrites comme dans le livre ---------------- */

const norm = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const SKILL_ALIASES = { art: "artiste", "connaissance de la rue": "connaissanceRue" };
const SKILL_BY_NAME = Object.fromEntries(Object.entries(SKILLS).map(([k, s]) => [norm(s.label), k]));

/** « Pilotage (Moto) 4D+1 », « Médecine* 6D », « Survie » → { base, label, code } */
function parseSkill(text) {
  const m = /^(.+?)\*?(?:\s+(\d+D(?:\+\d)?))?$/.exec(text.trim());
  const label = m[1].replace(/\*$/, "").trim();
  const baseName = norm(label.replace(/\s*\(.*\)\s*$/, ""));
  const key = SKILL_ALIASES[baseName] ?? SKILL_BY_NAME[baseName];
  if (!key) throw new Error(`Compétence inconnue : ${text}`);
  return { key, label, special: label.includes("("), code: m[2] ?? null };
}

function embedded(actorId, data, i) {
  const _id = id(`${actorId}:item:${data.type}:${data.name}`);
  return { _id, _key: `!actors.items!${actorId}.${_id}`, effects: [], flags: {}, ownership: { default: 0 }, sort: i * 10, ...data };
}

function customSkill(name, attribute, attributePips, code) {
  const diff = code ? codeToPips(code).pips - attributePips : 0;
  return {
    name, type: "competence", img: "icons/svg/item-bag.svg",
    system: { attribute, bonus: diff ? pipsToCode(diff, { signed: true }) : "", notes: "" }
  };
}

function actorDoc(pack, folderDoc, { name, type, img, system, items = [], token = {} }, sort) {
  const _id = id(`${pack}:actor:${type}:${name}`);
  return {
    _id, _key: `!actors!${_id}`, name, type, img, system, folder: folderDoc._id, sort,
    items: items.map((it, i) => embedded(_id, it, i)),
    effects: [], flags: {}, ownership: { default: 0 }, _stats: stats,
    prototypeToken: { name, texture: { src: img }, displayBars: 20, ...token }
  };
}

const ATTR_BY_LABEL = Object.fromEntries(Object.entries(ATTRIBUTES).map(([k, l]) => [l, k]));

/** Archétypes du livre (p. 78-122) en personnages prêts à jouer. */
function archetypeDocs() {
  const pack = "archetypes";
  const archetypes = readJson("archetypes.json");
  const groups = [...new Set(archetypes.map(a => a.group))];
  const folders = Object.fromEntries(groups.map((g, i) => [g, folder(pack, g, (i + 1) * 100, "Actor")]));
  const docs = Object.values(folders);
  archetypes.forEach((a, i) => {
    const attributes = {}, skills = {}, items = [];
    for (const [label, { code, skills: list }] of Object.entries(a.attributes)) {
      const attr = ATTR_BY_LABEL[label];
      const attrPips = codeToPips(code).pips;
      attributes[attr] = { code };
      for (const text of list) {
        const s = parseSkill(text);
        if (s.special) items.push(customSkill(s.label, attr, attrPips, s.code));
        else {
          const diff = s.code ? codeToPips(s.code).pips - attrPips : 0;
          skills[s.key] = { selected: true, bonus: diff ? pipsToCode(diff, { signed: true }) : "" };
        }
      }
    }
    const puiDice = Math.floor(codeToPips(attributes.puissance.code).pips / 3);
    const agiDice = Math.floor(codeToPips(attributes.agilite.code).pips / 3);
    const autoMove = String(puiDice + agiDice);
    const autoBonus = `${Math.ceil(puiDice / 2)}D`;
    docs.push(actorDoc(pack, folders[a.group], {
      name: a.name, type: "personnage", img: "icons/svg/mystery-man.svg",
      system: {
        attributes, skills, carriere: a.name,
        historique: `${a.description}\n\nPsychologie : ${a.psychologie}\n\nPhrase type : ${a.phrase}`,
        movement: a.movement === autoMove ? "" : a.movement,
        damageBonus: a.damageBonus === autoBonus ? "" : a.damageBonus,
        cojones: { value: 1 }, cp: { value: 5 }
      },
      items,
      token: { actorLink: true, disposition: 1, bar1: { attribute: "wounds" }, bar2: { attribute: "accoutumance" } }
    }, i * 10));
  });
  return { pack, docs };
}

/** Bestiaire maison + véhicules du livre en acteurs prêts à poser sur la carte. */
function bestiaryDocs() {
  const pack = "bestiaire";
  const docs = [];
  [...BESTIARY, ...PNJ_GROUPS].forEach((group, g) => {
    const f = folder(pack, group.folder, (g + 1) * 100, "Actor");
    docs.push(f);
    group.actors.forEach((a, i) => {
      const items = [];
      for (const [text, code] of a.skills) {
        const s = parseSkill(text);
        const attr = SKILLS[s.key].attribute;
        items.push(customSkill(s.label, attr, codeToPips(a.attributes[attr]).pips, code));
      }
      for (const w of a.weapons) {
        items.push(typeof w === "string" ? bankWeapon(w) : {
          name: w.name, type: "arme", img: w.skill === "armesAFeu" ? "icons/svg/target.svg" : "icons/svg/blood.svg",
          system: {
            skill: w.skill, category: w.skill === "armesAFeu" ? "Armes" : "Attaques naturelles", damage: w.damage, price: "",
            ammo: { value: w.ammo ?? 0, max: w.ammo ?? 0 }, range: { short: "", medium: "", long: "", ...w.range }, notes: w.notes ?? ""
          }
        });
      }
      for (const e of a.equipment ?? []) {
        items.push(typeof e === "string" ? bankArmor(e) : {
          name: e.name, type: "equipement", img: "icons/svg/shield.svg",
          system: { category: "Protections", quantity: 1, protection: e.protection, availability: "", price: "", equipped: true, notes: e.notes ?? "" }
        });
      }
      docs.push(actorDoc(pack, f, {
        name: a.name, type: "pnj", img: a.img ?? group.img,
        system: {
          attributes: Object.fromEntries(Object.entries(a.attributes).map(([k, code]) => [k, { code }])),
          movement: a.movement ?? "", damageBonus: a.damageBonus ?? "", painless: a.painless ?? group.painless, notes: a.notes,
          horde: a.horde ? { enabled: a.horde.count > 1, count: a.horde.count, per: a.horde.per } : { enabled: false, count: 10, per: 10 }
        },
        items,
        token: { actorLink: false, disposition: -1, bar1: { attribute: "wounds" } }
      }, i * 10));
    });
  });
  // Péchés et Anciens : profil PV, pouvoirs occultes intégrés (liés à la compendie des pouvoirs).
  SINS_AND_ELDERS.forEach((group, g) => {
    const f = folder(pack, group.folder, 500 + g * 10, "Actor");
    docs.push(f);
    group.actors.forEach((a, i) => {
      const agiPips = codeToPips(a.initiative).pips;
      const items = [
        customSkill("Bagarre (attaque)", "agilite", agiPips, a.attack),
        customSkill("Esquive (défense)", "agilite", agiPips, a.defense)
      ];
      for (const w of a.weapons) {
        items.push({
          name: w.name, type: "arme", img: "icons/svg/blood.svg",
          system: { skill: "bagarre", category: "Attaques", damage: w.damage, price: "", ammo: { value: 0, max: 0 },
            range: { short: "", medium: "", long: "", ...w.range }, notes: w.notes ?? "" }
        });
      }
      for (const p of NPC_POWERS.filter(p => p.tags[2] === a.name)) {
        items.push({
          name: p.name, type: "pouvoir", img: "icons/svg/eye.svg", system: powerSystem(p),
          flags: { [SYSTEM]: { sourceUuid: `Compendium.${SYSTEM}.pouvoirs-occultes.Item.${powerId(p)}` } }
        });
      }
      docs.push(actorDoc(pack, f, {
        name: a.name, type: "pnj", img: group.img,
        system: {
          attributes: {
            agilite: { code: a.initiative }, puissance: { code: a.resistance },
            adresse: { code: "3D" }, connaissances: { code: "3D" }, perception: { code: "3D" }, presence: { code: "3D" }
          },
          hp: { enabled: true, value: a.hp, max: a.hp, thresholds: a.thresholds },
          notes: [
            `Profil PV du bestiaire de la campagne : PV ${a.hp}, Résistance ${a.resistance}, Attaque ${a.attack}, Défense ${a.defense}, `
              + `Initiative ${a.initiative}, seuils ${a.thresholds}.`,
            "Conversion : Initiative → Agilité, Résistance → Puissance ; Attaque et Défense en compétences. "
              + "Adresse, Connaissances, Perception et Présence non données : 3D par défaut.",
            group.elderNote, a.notes
          ].filter(Boolean).join("\n")
        },
        items,
        token: { actorLink: true, disposition: -1, bar1: { attribute: "hp" } }
      }, i * 10));
    });
  });

  const vf = folder(pack, "Véhicules (p. 74)", 900, "Actor");
  docs.push(vf);
  VEHICLES.forEach(([name, speed, passengers, resistance, manoeuvre, price], i) => docs.push(actorDoc(pack, vf, {
    name, type: "vehicule", img: "icons/svg/wing.svg",
    system: { category: "Véhicule", speed, passengers, resistance, manoeuvre, price },
    token: { actorLink: false, disposition: 0, bar1: { attribute: "damage" } }
  }, i * 10)));
  return { pack, docs };
}

/** Aide-mémoire : un journal, une page par thème. */
function journalDocs() {
  const pack = "aide-memoire";
  const _id = id(`${pack}:journal:Aide-mémoire Z-Corps`);
  const pages = PAGES.map((p, i) => {
    const pid = id(`${_id}:page:${p.name}`);
    return {
      _id: pid, _key: `!journal.pages!${_id}.${pid}`, name: p.name, type: "text", sort: (i + 1) * 100,
      title: { show: true, level: 1 }, text: { content: p.content.trim(), format: 1 }, flags: {}, ownership: { default: -1 }
    };
  });
  return {
    pack,
    docs: [{ _id, _key: `!journal!${_id}`, name: "Aide-mémoire Z-Corps", pages, folder: null, sort: 0, flags: {}, ownership: { default: 0 }, _stats: stats }]
  };
}

function equipmentDocs() {
  const pack = "equipement";
  const docs = [];
  let fSort = 0;
  for (const group of WEAPONS) {
    const f = folder(pack, group.category, fSort += 100);
    docs.push(f);
    const img = group.category === "Explosifs" ? "icons/svg/explosion.svg"
      : group.skill === "melee" ? "icons/svg/sword.svg" : "icons/svg/target.svg";
    group.items.forEach(([name, damage, ammo, short, medium, long, price, notes], i) => {
      docs.push(item(pack, f, {
        name, type: "arme", img,
        system: {
          skill: group.skill, category: group.category, damage, price,
          ammo: { value: ammo, max: ammo },
          range: { short, medium, long },
          notes: [notes, group.note].filter(Boolean).join("\n")
        }
      }, i * 10));
    });
  }
  const armor = folder(pack, "Protections", fSort += 100);
  docs.push(armor);
  ARMOR.forEach(([name, protection, notes], i) => docs.push(item(pack, armor, {
    name, type: "equipement", img: "icons/svg/shield.svg",
    system: { category: "Protections", quantity: 1, protection, availability: "", price: "", equipped: false, notes }
  }, i * 10)));

  const gear = folder(pack, "Matériel", fSort += 100);
  docs.push(gear);
  GEAR.forEach(([name, availability, price, notes], i) => docs.push(item(pack, gear, {
    name, type: "equipement", img: "icons/svg/item-bag.svg",
    system: { category: "Matériel", quantity: 1, protection: "", availability, price, equipped: false, notes }
  }, i * 10)));

  const vehicles = folder(pack, "Véhicules", fSort += 100);
  docs.push(vehicles);
  VEHICLES.forEach(([name, speed, passengers, resistance, manoeuvre, price], i) => docs.push(item(pack, vehicles, {
    name, type: "equipement", img: "icons/svg/wing.svg",
    system: {
      category: "Véhicules", quantity: 1, protection: "", availability: "", price, equipped: false,
      notes: `Vitesse : ${speed}\nPassagers : ${passengers}\nRésistance : ${resistance}\nManœuvrabilité : ${manoeuvre}`
    }
  }, i * 10)));
  return { pack, docs };
}

/** Identifiant d'un pouvoir dans la compendie (même calcul que item()). */
const powerId = p => id(`pouvoirs-occultes:item:pouvoir:${p.name}${p.variant ? `:${p.variant}` : ""}`);

const powerSystem = p => ({ tier: p.tier, tags: p.tags.join(", "), cost: p.cost, mechanic: p.mechanic, narrative: p.narrative, revealed: false });

function powerDocs() {
  const pack = "pouvoirs-occultes";
  const folders = [1, 2, 3].map(t => folder(pack, `Seuil ${t}`, t * 100));
  const docs = [...folders];
  POWERS.forEach((p, i) => docs.push(item(pack, folders[p.tier - 1], {
    name: p.name, type: "pouvoir", img: "icons/svg/eye.svg", variant: p.variant,
    system: powerSystem(p)
  }, i * 10)));
  return { pack, docs };
}

for (const { pack, docs } of [equipmentDocs(), powerDocs(), archetypeDocs(), bestiaryDocs(), journalDocs()]) {
  const src = path.join(ROOT, "packs/_source", pack);
  const dest = path.join(ROOT, "packs", pack);
  fs.rmSync(src, { recursive: true, force: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(src, { recursive: true });
  for (const doc of docs) {
    const kind = doc._key.startsWith("!folders") ? "folder" : doc._key.startsWith("!journal") ? "journal" : doc.type;
    const file = `${kind}_${doc._id}.json`;
    fs.writeFileSync(path.join(src, file), `${JSON.stringify(doc, null, 2)}\n`);
  }
  await compilePack(src, dest, { log: false });
  console.log(`${pack} : ${docs.length} documents`);
}
