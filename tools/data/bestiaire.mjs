/**
 * Bestiaire : profils MAISON, construits avec les règles D6 et la description des Hostiles
 * (livre p. 103-104 : insensibles à la douleur, vue faible, ouïe et odorat excellents,
 * il faut détruire la tête). Les types de zombies du livre (partie MJ) ne figuraient pas
 * dans les extraits : remplacer ces valeurs par celles du livre si besoin.
 *
 * skills : [nom de compétence de base ou libre, code total] — converti en compétences ajoutées.
 * weapons : nom d'une arme de la banque (tools/data/equipement.mjs) ou arme décrite ici.
 */

const ZOMBIE_NOTES = "Profil maison. Hostile : insensible à la douleur, vue faible, ouïe et odorat excellents (p. 104). "
  + "Seule la destruction de la tête (hypophyse) l'arrête définitivement. Sang et salive contaminants.";

const BITE = { name: "Morsure", skill: "bagarre", damage: "+1D", notes: "Arme naturelle. Contamination possible : voir les règles du virus." };
const GRAB = { name: "Étreinte / griffes", skill: "bagarre", damage: "+1", notes: "Arme naturelle. Réussite : la cible est agrippée, la morsure suit." };

export const BESTIARY = [
  {
    folder: "Morts-vivants (profils maison)", img: "icons/svg/skull.svg", painless: true,
    actors: [
      {
        name: "Zombie rôdeur", movement: "4",
        attributes: { agilite: "2D", adresse: "1D", puissance: "3D", connaissances: "1D", perception: "2D", presence: "1D" },
        skills: [["Bagarre", "3D"], ["Chercher (ouïe, odorat)", "3D"]],
        weapons: [BITE, GRAB],
        notes: `${ZOMBIE_NOTES} Le plus courant : lent, obstiné, se déplace en groupe vers le bruit.`
      },
      {
        name: "Zombie frais (coureur)", movement: "8",
        attributes: { agilite: "3D", adresse: "1D+1", puissance: "3D", connaissances: "1D", perception: "2D+1", presence: "1D" },
        skills: [["Bagarre", "4D"], ["Courir", "4D"], ["Chercher (ouïe, odorat)", "3D+1"]],
        weapons: [BITE, GRAB],
        notes: `${ZOMBIE_NOTES} Contaminé récent, encore rapide et coordonné.`
      },
      {
        name: "Zombie colosse", movement: "4",
        attributes: { agilite: "2D", adresse: "1D", puissance: "5D", connaissances: "1D", perception: "2D", presence: "1D" },
        skills: [["Bagarre", "3D+2"], ["Soulever", "5D+1"]],
        weapons: [BITE, { ...GRAB, name: "Coup massif", damage: "+1D" }],
        notes: `${ZOMBIE_NOTES} Ancien colosse (catcheur, déménageur…) : encaisse énormément.`
      },
      {
        name: "Horde de zombies", movement: "4",
        attributes: { agilite: "2D", adresse: "1D", puissance: "4D", connaissances: "1D", perception: "2D", presence: "1D" },
        skills: [["Bagarre", "5D"]],
        weapons: [BITE],
        notes: `${ZOMBIE_NOTES} Un seul jeton pour 5 à 10 zombies. Chaque niveau de blessure = une partie de la horde abattue ; à Mort, elle est dispersée.`
      },
      {
        name: "Chien zombie", movement: "12",
        attributes: { agilite: "4D", adresse: "1D", puissance: "2D+2", connaissances: "1D", perception: "3D", presence: "1D" },
        skills: [["Bagarre", "4D+1"], ["Courir", "5D"], ["Pister", "4D"]],
        weapons: [{ ...BITE, damage: "+1D+1" }],
        notes: `${ZOMBIE_NOTES} Animal contaminé (les animaux peuvent l'être dans ce profil maison : à valider avec le livre).`
      }
    ]
  },
  {
    folder: "Humains (profils maison)", img: "icons/svg/mystery-man.svg", painless: false,
    actors: [
      {
        name: "Civil paniqué",
        attributes: { agilite: "2D+1", adresse: "2D", puissance: "2D", connaissances: "2D", perception: "2D", presence: "2D" },
        skills: [["Courir", "3D"], ["Discrétion", "2D+2"]],
        weapons: [],
        notes: "Profil maison. Fuit au premier coup de feu ; peut suivre un PJ qui le rassure (Persuasion, Commander)."
      },
      {
        name: "Pillard armé",
        attributes: { agilite: "3D", adresse: "3D", puissance: "3D", connaissances: "2D", perception: "3D", presence: "2D+1" },
        skills: [["Armes à feu", "4D"], ["Bagarre", "4D"], ["Mêlée", "3D+2"], ["Intimidation", "3D+1"], ["Connaissance de la rue", "3D+2"]],
        weapons: ["Smith & Wesson .38 revolver", "Machette"],
        notes: "Profil maison. En bande de 3 à 6, attaque les survivants isolés pour leurs vivres et leurs armes."
      },
      {
        name: "Soldat de l'US Army",
        attributes: { agilite: "3D", adresse: "3D+2", puissance: "3D", connaissances: "2D+1", perception: "3D", presence: "2D+2" },
        skills: [["Armes à feu", "5D"], ["Esquive", "4D"], ["Bagarre", "4D"], ["Démolition", "3D"], ["Volonté", "3D+1"]],
        weapons: ["Kalashnikov AK-47 (7.62x39mm)", "Couteau (survie, grand), dague"],
        equipment: ["Gilet pare-balles"],
        notes: "Profil maison. Garde un cordon de quarantaine ; ordre de tirer sur tout infecté. Arme d'épaule : profil du fusil d'assaut du livre."
      },
      {
        name: "Agent de sécurité OneWorld",
        attributes: { agilite: "3D", adresse: "3D+1", puissance: "3D", connaissances: "2D+2", perception: "3D", presence: "3D" },
        skills: [["Armes à feu", "4D+1"], ["Esquive", "3D+2"], ["Sécurité", "3D+2"], ["Commander", "3D+1"]],
        weapons: ["Glock 17 9mm", "Bâton, matraque, tisonnier"],
        equipment: ["Gilet pare-balles"],
        notes: "Profil maison. Protège les installations et le personnel de OneWorld ; peu enclin à partager ses informations."
      }
    ]
  }
];
