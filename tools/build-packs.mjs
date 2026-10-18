/**
 * Génère les compendiums du système à partir de tools/data, puis les compile en LevelDB.
 * Usage : npm run build:packs
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { WEAPONS, ARMOR, GEAR, VEHICLES } from "./data/equipement.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const SYSTEM = "zcorps-vtt";
const POWERS = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/data/pouvoirs.json"), "utf8"));

/** Identifiant Foundry stable (16 caractères alphanumériques) dérivé d'une clé. */
function id(key) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.createHash("sha256").update(key).digest();
  return Array.from(bytes.subarray(0, 16), b => alphabet[b % alphabet.length]).join("");
}

const stats = { coreVersion: "13.345", systemId: SYSTEM, systemVersion: "0.2.0" };

function folder(pack, name, sort) {
  const _id = id(`${pack}:folder:${name}`);
  return { _id, _key: `!folders!${_id}`, name, type: "Item", folder: null, sorting: "a", sort, color: null, description: "", flags: {} };
}

function item(pack, folderDoc, { name, type, img, system }, sort) {
  const _id = id(`${pack}:item:${type}:${name}`);
  return {
    _id, _key: `!items!${_id}`, name, type, img, system, folder: folderDoc._id, sort,
    effects: [], flags: {}, ownership: { default: 0 }, _stats: stats
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

function powerDocs() {
  const pack = "pouvoirs-occultes";
  const folders = [1, 2, 3].map(t => folder(pack, `Seuil ${t}`, t * 100));
  const docs = [...folders];
  POWERS.forEach((p, i) => docs.push(item(pack, folders[p.tier - 1], {
    name: p.name, type: "pouvoir", img: "icons/svg/eye.svg",
    system: { tier: p.tier, tags: p.tags.join(", "), cost: p.cost, mechanic: p.mechanic, narrative: p.narrative, revealed: false }
  }, i * 10)));
  return { pack, docs };
}

for (const { pack, docs } of [equipmentDocs(), powerDocs()]) {
  const src = path.join(ROOT, "packs/_source", pack);
  const dest = path.join(ROOT, "packs", pack);
  fs.rmSync(src, { recursive: true, force: true });
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(src, { recursive: true });
  for (const doc of docs) {
    const file = `${doc._key.startsWith("!folders") ? "folder" : doc.type}_${doc._id}.json`;
    fs.writeFileSync(path.join(src, file), `${JSON.stringify(doc, null, 2)}\n`);
  }
  await compilePack(src, dest, { log: false });
  console.log(`${pack} : ${docs.length} documents`);
}
