/**
 * Campagne Atica : PNJ principaux (profils D6 classiques) et
 * Péchés / Anciens secondaires (profil « PV » du bestiaire de la campagne).
 * Même format que tools/data/bestiaire.mjs pour PNJ_GROUPS.
 */

export const PNJ_GROUPS = [
  {
    folder: "Campagne Atica — Michael Beans & la Couronne", img: "icons/svg/mystery-man.svg", painless: false,
    actors: [
      {
        name: "Michael Beans (phase Vulnérable)", movement: "5", damageBonus: "1D",
        attributes: { agilite: "2D", adresse: "2D+1", puissance: "2D", connaissances: "3D", perception: "3D+1", presence: "3D" },
        skills: [["Esquive", "2D+1"], ["Armes à feu", "2D+2"], ["Endurance", "2D+1"], ["Électronique", "4D"], ["Volonté", "2D"]],
        weapons: [
          { name: "Pistolet automatique", skill: "armesAFeu", damage: "3D+1", ammo: 12, notes: "Toujours porté, rarement utilisé en phase Vulnérable (tremblements)." },
          { name: "Mains nues / objet improvisé", skill: "bagarre", damage: "+1D", notes: "" }
        ],
        notes: "Ancien employé d'entretien Novatis, autoproclamé maître de la Couronne Intérieure. Phase Vulnérable (1-3 sur 1D6) : sevrage, épuisement, tremblements. "
          + "Électronique : ancien employé. Volonté fragile.\n"
          + "JET DE PHASE : au début de chaque scène de tension, 1D6 : 1-3 Vulnérable, 4-5 Stable, 6 Crise (trois fiches).\n"
          + "▸ Visions interprétées : transmet parfois sans le savoir des informations vraies sur Paresse.\n"
          + "▸ Garde rapprochée : 2 à 4 gardes l'accompagnent en permanence (profil Garde de Beans).\n"
          + "▸ Fenêtre de lucidité (MJ) : redevient presque l'homme qu'il était, le temps de transmettre une information cruciale."
      },
      {
        name: "Michael Beans (phase Stable)", movement: "6", damageBonus: "2D",
        attributes: { agilite: "2D+2", adresse: "2D+2", puissance: "2D+2", connaissances: "3D", perception: "3D+1", presence: "4D" },
        skills: [["Armes à feu", "3D"], ["Persuasion", "5D"], ["Intimidation", "4D+2"]],
        weapons: [
          { name: "Pistolet automatique", skill: "armesAFeu", damage: "3D+1", ammo: 12, notes: "" },
          { name: "Mains nues / objet improvisé", skill: "bagarre", damage: "+1D", notes: "" }
        ],
        notes: "Phase Stable (4-5 sur 1D6). Voir la fiche « phase Vulnérable » pour le jet de phase et les particularités."
      },
      {
        name: "Michael Beans (phase Crise)", movement: "7", damageBonus: "3D", painless: true,
        attributes: { agilite: "3D+2", adresse: "2D+2", puissance: "4D", connaissances: "2D", perception: "2D", presence: "4D+2" },
        skills: [["Bagarre", "5D"], ["Armes à feu", "3D"], ["Endurance", "5D"], ["Intimidation", "6D"]],
        weapons: [
          { name: "Pistolet automatique", skill: "armesAFeu", damage: "3D+1", ammo: 12, notes: "" },
          { name: "Mains nues / objet improvisé", skill: "bagarre", damage: "+1D", notes: "Force disproportionnée à sa carrure." }
        ],
        notes: "Phase Crise (6 sur 1D6) : rage chimique, insensible à la douleur, lucidité altérée, hallucinations actives, terrifiant. "
          + "Voir la fiche « phase Vulnérable » pour le jet de phase et les particularités."
      },
      {
        name: "Garde de Beans", movement: "6", damageBonus: "2D",
        attributes: { agilite: "2D+1", adresse: "2D+2", puissance: "2D+2", connaissances: "1D+2", perception: "2D", presence: "2D" },
        skills: [["Bagarre", "3D"], ["Armes à feu", "3D+1"], ["Intimidation", "3D"]],
        weapons: ["Glock 17 9mm"],
        notes: "Profil type. 2 à 4 gardes accompagnent Beans en permanence dans la Couronne Intérieure. Arme : profil d'arme de poing du livre (non précisée)."
      }
    ]
  },
  {
    folder: "Campagne Atica — Les Illuminés du pont Ouest", img: "icons/svg/mystery-man.svg", painless: false,
    actors: [
      {
        name: "Le Prélat des Cendres", movement: "5", damageBonus: "2D",
        attributes: { agilite: "2D+2", adresse: "2D+1", puissance: "3D", connaissances: "2D+2", perception: "3D", presence: "4D+1" },
        skills: [["Endurance", "4D"], ["Sciences occultes", "3D+1"], ["Persuasion", "6D"], ["Volonté", "5D+2"]],
        weapons: [
          { name: "Torche rituelle", skill: "melee", damage: "2D+2", notes: "Toujours allumée. Symbole autant qu'arme." },
          { name: "Lance-flammes improvisé", skill: "armesAFeu", damage: "4D", ammo: 1, range: { short: "courte" },
            notes: "Bricolé avec de l'équipement de chantier. 1 utilisation par scène (recharge)." }
        ],
        notes: "Chef des Illuminés, ancien pasteur (peut-être). Endurance : résistance à la chaleur par habitude ; Sciences occultes : interprétation déformée ; charisme messianique.\n"
          + "▸ Voix qui apaise : +2D en Persuasion face à des gens en détresse ou en deuil.\n"
          + "▸ Conviction totale : immunisé à la peur et à l'intimidation.\n"
          + "▸ Négociation possible (MJ) : seule porte d'entrée non violente vers le pont Ouest."
      },
      {
        name: "Illuminé", movement: "5", damageBonus: "1D",
        attributes: { agilite: "2D+1", adresse: "2D", puissance: "2D+2", connaissances: "1D+2", perception: "2D+1", presence: "2D+2" },
        skills: [["Endurance", "3D"], ["Volonté", "3D+1"]],
        weapons: [
          { name: "Torche", skill: "melee", damage: "2D", notes: "Arme standard du groupe." },
          { name: "Bidon d'accélérant + briquet", skill: "lancer", damage: "3D+1", ammo: 1,
            notes: "Zone d'effet réduite (2 m). Risque pour l'utilisateur si raté (Agilité diff. 12)." },
          { name: "Arme de fortune (barre, pioche)", skill: "melee", damage: "+1D", notes: "Si à court de feu." }
        ],
        notes: "Fidèle du Prélat (profil type). Volonté : fidélité au Prélat.\n"
          + "▸ Détermination collective : +1D aux tests de Volonté tant que le Prélat est visible et en vie.\n"
          + "▸ Pas de discernement : aucune distinction entre menace réelle et passant (défaut narratif)."
      }
    ]
  },
  {
    folder: "Campagne Atica — Le groupe Macbury", img: "icons/svg/mystery-man.svg", painless: false,
    actors: [
      {
        name: "Jane Macbury", movement: "6", damageBonus: "2D",
        attributes: { agilite: "3D+1", adresse: "3D+2", puissance: "3D+1", connaissances: "2D+2", perception: "3D+2", presence: "3D+2" },
        skills: [["Esquive", "4D"], ["Bagarre", "4D"], ["Armes à feu", "5D"], ["Endurance", "4D"], ["Investigation", "4D+1"],
          ["Connaissance de la rue", "4D"], ["Intimidation", "4D+2"], ["Persuasion", "4D"], ["Volonté", "4D"]],
        weapons: [
          { name: "Pistolet de service (Glock)", skill: "armesAFeu", damage: "3D+1", ammo: 17, notes: "Munitions limitées (ressource narrative)." },
          { name: "Matraque télescopique", skill: "melee", damage: "+1D", notes: "Privilégie le non-létal sur les humains." }
        ],
        equipment: [{ name: "Gilet pare-balles (police)", protection: "+1D", notes: "Contre les armes à feu uniquement : à retirer du jet de résistance sinon." }],
        notes: "35 ans, ex-policière, cheffe du groupe. Connaissances : tactique, droit, procédures.\n"
          + "▸ Commandement tactique : un ordre clair donne +1D à la prochaine action d'un allié qui le suit (une fois par round).\n"
          + "▸ Lecture de terrain : +2D en Perception pour repérer une embuscade, une issue ou une faiblesse structurelle."
      },
      {
        name: "Jared Conery", movement: "8 (+2 en environnement vertical)", damageBonus: "1D",
        attributes: { agilite: "4D+2", adresse: "3D+1", puissance: "2D+2", connaissances: "1D+2", perception: "3D+2", presence: "2D" },
        skills: [["Acrobaties", "6D"], ["Esquive", "5D+1"], ["Discrétion", "5D+2"], ["Dextérité", "4D"], ["Endurance", "3D+1"],
          ["Pister", "5D"], ["Chercher", "4D+1"], ["Connaissance de la rue", "4D"], ["Volonté", "3D"]],
        weapons: [
          { name: "Couteau de combat", skill: "melee", damage: "+1D+1", notes: "Arme principale et de prédilection." },
          { name: "Couteaux de lancer (x3)", skill: "lancer", damage: "+1", ammo: 3, range: { short: "courte", medium: "moyenne" },
            notes: "Récupérables après le combat si la scène le permet." }
        ],
        notes: "22 ans, éclaireur, frère de Mila.\n"
          + "▸ Premier coup : dans une embuscade qu'il a repérée, gagne l'initiative et +1D aux dégâts de sa première attaque.\n"
          + "▸ Reconnaissance silencieuse : explore une zone dangereuse avant le groupe (narratif)."
      },
      {
        name: "Mila Conery", movement: "3 (réduit par la maladie)", damageBonus: "1D",
        attributes: { agilite: "1D+2", adresse: "1D+1", puissance: "1D", connaissances: "4D+2", perception: "4D", presence: "2D+2" },
        skills: [["Endurance", "1D"], ["Érudition", "6D"], ["Investigation", "5D+1"], ["Chercher", "5D"], ["Persuasion", "3D+2"], ["Volonté", "4D"]],
        weapons: [{ name: "Pistolet léger (dernier recours)", skill: "armesAFeu", damage: "2D+1", ammo: 8, notes: "Le recul même la déstabilise physiquement." }],
        notes: "17 ans, stratégiste, sœur de Jared ; maladie grave, dégénérative. Érudition : géopolitique, tactique, histoire.\n"
          + "NOTE MJ — Fragilité : avec 1D en Puissance, tout coup direct la met en danger de mort. Jamais en première ligne.\n"
          + "▸ Analyse stratégique : +1D à l'Initiative du groupe au premier round après une scène de préparation.\n"
          + "▸ Mémoire géopolitique : +3D aux tests de Connaissances sur l'organisation humaine.\n"
          + "▸ Vulnérabilité assumée : un allié qui s'interpose subit l'attaque à sa place sans test."
      },
      {
        name: "Vlad Roubanovitch", movement: "6", damageBonus: "3D",
        attributes: { agilite: "2D+2", adresse: "3D+1", puissance: "4D+2", connaissances: "1D+2", perception: "2D+1", presence: "2D+2" },
        skills: [["Bagarre", "4D"], ["Armes à feu", "4D+2"], ["Dextérité", "3D+2"], ["Endurance", "6D"], ["Soulever", "5D+1"],
          ["Intimidation", "4D+1"], ["Volonté", "3D+2"]],
        weapons: [
          { name: "Fusil d'assaut (pillé policier/SWAT)", skill: "armesAFeu", damage: "4D+2", ammo: 30, notes: "Pièce maîtresse du groupe. Munitions précieuses." },
          "Machette"
        ],
        notes: "37 ans, la force du groupe, protecteur de Mila.\n"
          + "▸ Mur humain : se place pour couvrir un allié.\n"
          + "▸ Polyvalence : aucune pénalité de changement d'arme en combat."
      }
    ]
  }
];

/**
 * Péchés et Anciens secondaires : profil « PV » (Points de Vie, Résistance, Attaque, Défense, Initiative,
 * seuils de blessure). Conversion : Initiative → Agilité, Résistance → Puissance, Attaque et Défense →
 * compétences « Bagarre (attaque) » et « Esquive (défense) ». Les autres Caractéristiques ne sont pas
 * données par le document : 3D par défaut.
 */
export const SINS_AND_ELDERS = [
  {
    folder: "Campagne Atica — Péchés humains", img: "icons/svg/terror.svg",
    actors: [
      {
        name: "Colère", hp: 28, resistance: "4D+1", attack: "5D", defense: "4D", initiative: "3D+2", thresholds: "8/16/24",
        weapons: [
          { name: "Couteau de boucher", damage: "4D+1", notes: "Arme de prédilection. Toujours à portée." },
          { name: "Matraque improvisée", damage: "3D+2", notes: "Dégâts contondants, peut étourdir (diff. 14)." }
        ],
        notes: "Chef de guerre, dirigeant territorial. Le plus fonctionnel des sept ; sa peur secrète de Luxure est son unique fissure."
      },
      {
        name: "Gourmandise", hp: 24, resistance: "3D+2", attack: "4D+2", defense: "3D+1", initiative: "3D", thresholds: "7/14/21",
        weapons: [
          { name: "Lame dentée artisanale", damage: "4D", notes: "Déchire plutôt que coupe. +2 aux dégâts si la cible est déjà blessée." },
          { name: "Morsure", damage: "3D", notes: "Seulement si désarmé ou en frénésie." }
        ],
        notes: "Tyran cannibale. Lucidité décroissante : il sait ce qu'il fait et n'y voit plus de mal."
      }
    ]
  },
  {
    folder: "Campagne Atica — Péchés mutants & Envie", img: "icons/svg/terror.svg",
    actors: [
      {
        name: "Luxure", hp: 36, resistance: "4D", attack: "3D+2", defense: "5D+1", initiative: "4D+2", thresholds: "10/20/30",
        weapons: [
          { name: "Pattes arachnéennes", damage: "4D+1", range: { short: "3 m" }, notes: "Peut agripper (Athlétisme diff. 16 pour se libérer)." },
          { name: "Mandibules", damage: "5D", notes: "Seulement sur une cible immobilisée. Dégâts perforants." }
        ],
        notes: "L'Araignée, tisseuse d'illusions. Apparence féminine, pattes arachnéennes dans le dos. Ne combat pas directement : piège, attire, délègue."
      },
      {
        name: "Greed", hp: 48, resistance: "5D+2", attack: "5D", defense: "3D+1", initiative: "2D+2", thresholds: "14/28/42",
        weapons: [
          { name: "Membres allongés", damage: "5D+2", range: { short: "4 m" }, notes: "Peut frapper deux cibles adjacentes en une action." },
          { name: "Assimilation", damage: "4D", notes: "Sur une cible à 0 PV, intègre son visage à sa peau (Volonté diff. 13 pour les témoins)." }
        ],
        notes: "L'Aberration, corps-palimpseste. Plus proche de Paresse que tout humain encore conscient. Le feu stoppe sa régénération pour le tour."
      },
      {
        name: "Envie", hp: 32, resistance: "4D", attack: "5D+1", defense: "5D+2", initiative: "5D+1", thresholds: "9/18/27",
        weapons: [
          { name: "Fouet d'ombre", damage: "4D+2", range: { short: "6 m" }, notes: "Peut saisir une arme ou désarmer (Force diff. 15 pour résister)." },
          { name: "Impact d'ombre", damage: "3D+2", notes: "Contondant, peut projeter la cible (Athlétisme diff. 14)." }
        ],
        notes: "L'Ombre souriante : masque peint d'un sourire, a perdu la voix. Observe, cartographie, élimine les perturbateurs discrets."
      }
    ]
  },
  {
    folder: "Campagne Atica — Anciens secondaires", img: "icons/svg/eye.svg",
    elderNote: "Aucun Ancien ne peut attaquer en premier sans attirer l'attention de Paresse : ces statistiques ne s'appliquent que s'il est attaqué. "
      + "Les Anciens (sauf Elah O Ikim) cherchent à neutraliser, pas à tuer.",
    actors: [
      {
        name: "Eliah", hp: 80, resistance: "7D+2", attack: "6D+1", defense: "7D", initiative: "6D+2", thresholds: "22/44/66", weapons: [],
        notes: "« He who seeks truth ». Gardien du pont Nord, observateur, scelle la ville. Réponse chirurgicale : préfère immobiliser que détruire. "
          + "Seuls le feu et les armes imprégnées de corruption lui font des dégâts complets."
      },
      {
        name: "Jah'ste", hp: 72, resistance: "6D+2", attack: "6D", defense: "7D+1", initiative: "7D", thresholds: "20/40/60", weapons: [],
        notes: "« She who listens ». Errante, ralentit l'éveil, indifférence froide. Ne cherche pas à tuer, seulement à ne plus être dérangée."
      },
      {
        name: "Kôhle", hp: 68, resistance: "6D+1", attack: "5D+2", defense: "6D", initiative: "5D", thresholds: "18/36/54", weapons: [],
        notes: "« He who seeks redemption ». Torturé, guide indirect. Combat à contrecœur et cherche à mettre fin aux hostilités."
      },
      {
        name: "Elah O Ikim", hp: 76, resistance: "7D", attack: "6D+2", defense: "6D+1", initiative: "6D", thresholds: "21/42/63", weapons: [],
        notes: "« She who follows ». Fidèle de Paresse, accélératrice de l'éveil. Chaleureuse, curieuse, fascinante — la plus dangereuse. "
          + "Défend l'éveil, pas sa vie ; utilise les PJ comme leviers. La seule Ancienne qui cherche la mort des PJ."
      }
    ]
  }
];
