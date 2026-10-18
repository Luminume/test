/**
 * Banque d'objets du livre de base (Équipements, p. 67-76).
 * Source de la compendie « Équipement Z-Corps » : modifier ici puis lancer `npm run build:packs`.
 *
 * Armes : [nom, dégâts, munitions (0 = aucune), courte, moyenne, longue, prix, notes]
 * Dégâts précédés de « + » ou « - » : s'ajoutent au bonus aux dégâts du porteur (p. 57).
 */

const FIREARM_NOTE = "Disponibilité de l'arme (entre parenthèses : munitions). TF très facile, F facile, M moyenne, D difficile, TD très difficile.";

export const WEAPONS = [
  {
    category: "Armes de poing", skill: "armesAFeu", note: FIREARM_NOTE,
    items: [
      ["Colt Snub .38 revolver", "3D+2", 6, "10", "20", "40", "F (TF)", "Discret, facile à dissimuler, dégainé plus vite. Munitions .38 spécial."],
      ["Colt .45 Peacemaker", "4D+1", 6, "15", "30", "45", "F (TF)", "Archaïque mais solide. Il faut armer le chien à chaque coup."],
      ["Glock 17 9mm", "3D+2", 17, "8", "16", "24", "D (F)", "Semi-automatique léger et compact, fiable, faible recul."],
      ["Luger P08 9mm", "3D+2", 7, "10", "20", "30", "F (TF)", "Semi-automatique, surtout apprécié des collectionneurs."],
      ["Derringer .45 pistolet", "2D+2", 2, "2", "5", "10", "F (TF)", "La plus petite des armes de poing, se cache dans un sac à main."],
      ["Smith & Wesson .38 revolver", "3D+2", 6, "15", "30", "45", "F (TF)", "Le célèbre M&P Modèle 10 des policiers et militaires."],
      ["Smith & Wesson .357 Magnum", "5D", 6, "20", "35", "50", "F (TF)", "Version .357 Magnum, utilisée par le F.B.I."],
      ["Walter PPK 9mm", "3D", 7, "7", "14", "21", "M (F)", "Semi-automatique allemand léger (astérisque dans le tableau du livre)."],
      ["Desert Eagle IMI .50 AE", "5D", 7, "15", "30", "50", "M (D)", "Encombrant et lourd, calibre inhabituel, peu de recul."]
    ]
  },
  {
    category: "Fusils", skill: "armesAFeu", note: FIREARM_NOTE,
    items: [
      ["Springfield M1903 Rifle (.30-06)", "7D", 5, "40", "80", "160", "F (TF)", ""],
      ["Remington Mod 30", "5D+1", 6, "20", "75", "200", "F (TF)", ""],
      ["Winchester 94 lever action (30-30)", "6D+1", 6, "30", "60", "120", "F (TF)", ""]
    ]
  },
  {
    category: "Fusils à pompe", skill: "armesAFeu", note: FIREARM_NOTE,
    items: [
      ["Remington 1100 TAC4", "6D", 5, "20", "40", "60", "F (TF)", "Semi-automatique très fiable, chargeur d'appoint de 4 cartouches et viseur possibles."],
      ["Canon scié (SPAS-15 Franchi) Cal.12", "6D", 5, "15", "20", "30", "M (TF)", "Les fusils à double canon peuvent tirer deux fois par action."]
    ]
  },
  {
    category: "Fusils d'assaut", skill: "armesAFeu", note: FIREARM_NOTE,
    items: [
      ["Kalashnikov AK-47 (7.62x39mm)", "6D", 30, "45", "85", "170", "D (D)", "Rafales de 3-4 cartouches (1 coup), coup par coup ou automatique ; jusqu'à 3 cibles par action. Ne s'enraye jamais."]
    ]
  },
  {
    category: "Pistolets mitrailleurs", skill: "armesAFeu", note: FIREARM_NOTE,
    items: [
      ["TEC-9 (9mm)", "3D+2", 30, "15", "30", "45", "D (D)", "Un tir simple envoie environ 1/5 du chargeur ; jusqu'à 3 cibles par round."],
      ["Uzi (9mm)", "3D+2", 30, "20", "40", "60", "TD (D)", "Un tir simple envoie environ 1/5 du chargeur ; jusqu'à 3 cibles par round."]
    ]
  },
  {
    category: "Armes à impulsions électriques", skill: "armesAFeu", note: "",
    items: [
      ["Lectro-volt « Taser » X-26", "8D", 2, "2", "4", "6", "TD", "Assomme seulement. Sans effet sur les morts-vivants ; ne traverse pas les armures non conductrices (Kevlar…)."],
      ["« Shocker » auto-défense", "4D", 2, "Contact", "", "", "F", "Assomme seulement, au contact. Sans effet sur les morts-vivants."]
    ]
  },
  {
    category: "Armes de trait", skill: "armesDeJet", note: "Une action pour recharger (sauf arbalètes : un round).",
    items: [
      ["Sarbacane et fléchette", "1D", 0, "10", "40", "100", "$50", "Utilisée en général avec du poison, dont les dégâts s'ajoutent."],
      ["Arc composite avec flèche", "3D+1", 0, "10", "60", "250", "$350", ""],
      ["Arbalète légère et carreau", "4D", 0, "10", "100", "200", "$350/600", ""],
      ["Arbalète lourde et carreau", "4D+1", 0, "10", "100", "300", "$400", "Exige un round entier pour recharger."],
      ["Arbalète sur poignet et carreau", "4D", 0, "10", "25", "50", "$150", ""]
    ]
  },
  {
    category: "Armes de lancer", skill: "lancer", note: "PUI = Puissance du lanceur (en mètres).",
    items: [
      ["Boomerang (lourd)", "1D+1", 0, "5", "40", "100", "$150", ""],
      ["Fléchette", "+1", 0, "PUI", "PUI+1", "PUI+2", "$20", ""],
      ["Cocktail Molotov", "6D+2", 0, "PUI-3", "PUI-2", "PUI-1", "—", ""],
      ["Disque vinyle", "-1D", 0, "PUI-3", "PUI-2", "PUI-1", "$5/200", ""],
      ["Javeline", "+2D", 0, "5", "25", "40", "$100", "Plus de 60 cm : modificateur d'encombrement possible."],
      ["Pierre (taille poing)", "+1", 0, "PUI-2", "PUI-1", "PUI", "—", ""],
      ["Dague de lancer", "+1D", 0, "5", "10", "15", "$25", ""],
      ["Shuriken", "+1D", 0, "5", "10", "15", "$80", ""]
    ]
  },
  {
    category: "Explosifs", skill: "lancer", note: "Rayon de déflagration (m) : dégâts complets / moitié / quart.",
    items: [
      ["Grenade à fragmentation", "6D", 0, "PUI-4", "PUI-3", "PUI+3", "F", "Déflagration 0-3 / 3-8 / 8-16 m. Explose 3 secondes après dégoupillage."],
      ["Dynamite (bâton)", "5D", 0, "PUI-3", "PUI-2", "PUI+1", "TF", "Déflagration 0-2 / 2-5 / 5-10 m. Détonateur ou minuteur obligatoire."],
      ["Grenade fumigène / lacrymogène", "0", 0, "PUI-4", "PUI-3", "PUI+3", "F", "Nuage de 10 m² : -1D aux Tests de Perception (vue), d'Agilité et d'Adresse. L'armure ne protège pas, il faut un masque à gaz."],
      ["Plastic", "5D", 0, "", "", "", "F", "Déflagration 0-3 m. Détonateur obligatoire ; 60 g suffisent. Utilise Démolition pour le poser."],
      ["Mortier 81mm", "5D", 0, "400", "700", "1000", "M", "Déflagration 0-3 / 3-8 / 8-16 m."]
    ]
  },
  {
    category: "Armes de mêlée", skill: "melee", note: "Les dégâts s'ajoutent au bonus aux dégâts du porteur.",
    items: [
      ["Pic à glace, ciseaux, couteau de poche, tournevis, pieu", "+2", 0, "", "", "", "$15", ""],
      ["Flèche, carreau d'arbalète, fléchette (en main)", "+1", 0, "", "", "", "$10", ""],
      ["Hache (grande)", "+3D", 0, "", "", "", "$40", "Plus de 60 cm : modificateur d'encombrement possible."],
      ["Bâton, matraque, tisonnier", "+1D+1", 0, "", "", "", "$50", ""],
      ["Poing américain", "+1D+1", 0, "", "", "", "$10", ""],
      ["Fouet", "+1D", 0, "", "", "", "$25", "Plus de 60 cm : modificateur d\'encombrement possible."],
      ["Massue, batte de baseball, canne", "+1D+1", 0, "", "", "", "$50", "Plus de 60 cm : modificateur d\'encombrement possible."],
      ["Hachette", "+1D+1", 0, "", "", "", "$50", ""],
      ["Taille-haies, sécateur", "+1D", 0, "", "", "", "$25", ""],
      ["Katana", "+3D", 0, "", "", "", "$100", "Plus de 60 cm : modificateur d\'encombrement possible."],
      ["Couteau (survie, grand), dague", "+1D", 0, "", "", "", "$50", ""],
      ["Baïonnette", "+1D", 0, "", "", "", "$50", ""],
      ["Masse", "+1D+1", 0, "", "", "", "$50", "Plus de 60 cm : modificateur d\'encombrement possible."],
      ["Machette", "+1D+2", 0, "", "", "", "$20", "Plus de 60 cm : modificateur d\'encombrement possible."],
      ["Nunchaku", "+1D+2", 0, "", "", "", "$50", "Plus de 60 cm : modificateur d\'encombrement possible."],
      ["Marteau (outil)", "+1D", 0, "", "", "", "$20", ""],
      ["Épée standard", "+2D+2", 0, "", "", "", "$100", ""],
      ["Tonfa", "+1D+2", 0, "", "", "", "$25", ""]
    ]
  }
];

/** Protections : [nom, protection, notes] */
export const ARMOR = [
  ["Cuir souple, tissu épais", "+2", "Se porte sous ou sur n'importe quelle armure ; ajoute au maximum +1 à la combinaison."],
  ["Cuir renforcé, blouson d'aviateur", "+1D+1", "Ne se porte pas sous une autre armure ; peut se porter sur du cuir souple."],
  ["Gilet pare-balles", "+3D", "Kevlar, céramique… Ne se porte pas sous une autre armure. Chaque couche supplémentaire : +4 ou plus aux difficultés basées sur l'Agilité."]
];

/** Matériel : [nom, disponibilité, prix, effet] */
export const GEAR = [
  ["Réveil mécanique", "TF", "$25", ""],
  ["Kit premiers secours", "F", "$50", "Petite trousse : +1 à 5-10 Tests de Médecine. Grande trousse : +1D à 2-5 Tests de Médecine."],
  ["Matériel de pêche", "TF", "$50", ""],
  ["Holster spécial", "F", "$80", "Dégainer ne compte pas comme une action ; +1D à l'Initiative pour « celui qui dégaine le premier »."],
  ["Radio portable", "TF", "$30", ""],
  ["Fournitures d'art", "TF", "$100", "+1D aux Tests d'Art ou de Contrefaçon adéquats."],
  ["Sac à dos", "F", "$30", ""],
  ["Vêtements, tenue de base", "TF", "$100", ""],
  ["Torche électrique, grande", "TF", "$25", "Réduit les modificateurs d'obscurité de 2D dans un cône de 5 m."],
  ["Masque anti-gaz", "M", "$200/300", "+2D aux Tests de résistance contre les gaz ; annule jusqu'à 1D de modificateurs."],
  ["Réchaud à gaz", "TF", "$50", ""],
  ["Viseur pour fusil", "M/D", "$100", "+2 aux Tests d'Armes à feu à moyenne ou longue portée en visant toute une action."],
  ["Corde de chanvre, 50 m", "TF", "$15", "+2 aux dégâts pour étrangler. Résistance totale 5."],
  ["Corde de nylon, 50 m", "TF", "$15", ""],
  ["Rations de terrain, 8 jours", "TF", "$150", ""],
  ["Jumelles", "F", "$90", "+1D aux Tests basés sur la vue au-delà de 2 m, de jour."],
  ["Couverture polaire", "TF", "$30", ""],
  ["Appareil photo numérique", "F", "$150", ""],
  ["Compteur Geiger", "D", "$200", ""],
  ["Menottes", "M", "$50", "Clé ou Test de Crochetage Moyen pour les enlever. Résistance totale 15."],
  ["Pelle", "TF", "$20", "+1D pour creuser ; attaques brutales avec +2 au bonus aux dégâts."],
  ["Sac de couchage", "TF", "$50", ""],
  ["Pellicule couleur", "F", "$35", ""],
  ["Outils de charpentier", "F", "$200", "Kit d'outils : +1D à la Compétence adéquate si on la possède."],
  ["Boussole", "F", "$20", ""],
  ["Crochets de fer et pitons", "F", "$25", "+1D pour grimper une surface dure (avec une corde). En arme : +1 aux dégâts."],
  ["Chauffage à pétrole", "F", "$200", ""],
  ["Lampe à pétrole", "F", "$50", ""],
  ["Malle", "F", "$200", ""],
  ["Enregistreur numérique (cartes SD)", "F", "$150", ""],
  ["Cartes SD 32 Go", "F", "$40", ""],
  ["Barre levier en fer", "F", "$30", "+1D aux tentatives par surprise, ou +2 au bonus aux dégâts pour les attaques brutales."],
  ["Briquet", "F", "$5", ""],
  ["Magazine", "F", "$2,5/5", ""],
  ["Journal", "F", "$2,5", ""],
  ["Outils de serrurier", "M", "$40", "+1D au Crochetage si l'utilisateur possède la Compétence."],
  ["Télescope", "F", "$200", "+2D aux Tests de Chercher basés sur la vision ; une action pour le régler."],
  ["Tente, 1 personne", "F", "$150", ""],
  ["Tente, 3 personnes", "F", "$250", ""],
  ["Ruban adhésif « Chatterton », 10 m", "TF", "$10", "Supporte environ 90 kg. Résistance totale 10."],
  ["Sac de gym", "F", "$30", ""],
  ["Ustensiles de cuisine, kit", "TF", "$50", ""],
  ["Outils de mécanicien", "M", "$200", "Kit d'outils : +1D à Réparer si on possède la Compétence."],
  ["Caméra numérique", "F", "$400", ""],
  ["Détecteur de signal", "F", "$150", "Détecte les traceurs ; indique la direction (les plus chers : sur une carte)."],
  ["Traceur", "F", "", "Transmetteur miniature à utiliser avec un détecteur de signal."],
  ["Ordinateur portable", "F", "$500/1000", ""],
  ["Ordinateur de bureau", "F", "$500/1000", ""],
  ["Imprimante", "F", "$100", ""],
  ["Kit d'électricien", "M", "$250", "Kit d'outils : +1D à Électronique si on possède la Compétence."],
  ["Kit police scientifique", "TD", "—", ""],
  ["Émetteur-récepteur radio militaire", "TD", "—", ""],
  ["Parachute", "M", "$600", ""],
  ["Montre", "F", "$50", ""],
  ["Trousse de toilette", "TF", "$25", ""]
];

/** Véhicules : [nom, vitesse, passagers, résistance, manœuvrabilité, prix] */
export const VEHICLES = [
  ["Vélo", "voir livre", "1-2", "2D", "+2D+2", "$150/700"],
  ["Moto 260cc", "60/170 km/h", "1-2", "2D+1", "+3D", "$1000/3000"],
  ["Moto 1200cc", "100/200 km/h", "1-2", "4D", "+2D", "$7000/15 000"],
  ["Voiture, coupé", "60/180 km/h", "3-4", "4D+1", "+2D", "$15 000/20 000"],
  ["Voiture, berline", "70/200 km/h", "4-5", "4D+2", "+1D+1", "$25 000/30 000"],
  ["Voiture, 4x4", "60/180 km/h", "6-7", "5D+2", "0", "$25 000/35 000"],
  ["Mini-van (avec sièges)", "60/180 km/h", "7", "5D+2", "0", "$25 000/45 000"],
  ["Pick-up", "60/160 km/h", "3 (cabine)", "5D+2", "0", "$18 000/30 000"],
  ["Camionnette de livraison", "60/160 km/h", "2 (cabine)", "6D", "-1D", "$20 000/30 000"],
  ["Bus de ville", "50/120 km/h", "80", "5D+2", "-4D", "$80 000/100 000"],
  ["Car MCI", "50/130 km/h", "40", "5D+2", "-6D", "—"],
  ["Canoë", "Test de Puissance", "4", "2D", "+1D", "$900/2000"],
  ["Canot", "Test de Puissance", "6", "3D+2", "0", "$1500/4000"],
  ["Bateau à voile (petit)", "vent +25 %, Test de Pilotage", "2", "4D", "+2D", "$6500/10 000"],
  ["Hors-bord", "40/100 km/h", "9", "4D+2", "+1D", "$20 000/35 000"],
  ["Hélicoptère civil", "120/150 km/h", "5", "6D+1", "+3D", "$200 000/900 000"],
  ["Petit avion à hélice", "100/230 km/h", "4", "5D", "+1D", "$75 000/500 000"]
];
