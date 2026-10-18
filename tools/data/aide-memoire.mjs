/**
 * Aide-mémoire du système (journal « Aide-mémoire Z-Corps »).
 * Résumés des règles telles qu'elles sont appliquées par le système, avec les pages du livre.
 */
export const PAGES = [
  {
    name: "Utiliser le système",
    content: `
<h2>Raccourcis</h2>
<ul>
  <li><strong>Clic</strong> sur une Caractéristique, une compétence ou une arme : fenêtre d'options puis jet. <strong>Maj + clic</strong> : jet direct.</li>
  <li><strong>Glisser</strong> une Caractéristique, une compétence ou une arme dans la barre de macros : jet en un clic.</li>
  <li>Portrait : clic pour le changer, bouton <em>écran</em> pour le montrer aux joueurs.</li>
  <li>Loupe des blocs Armes / Équipement : banque d'objets du livre.</li>
  <li>Case des pouvoirs : bouton <em>Pouvoirs occultes</em> (MJ), bouton <em>Utiliser</em> sur chaque pouvoir.</li>
  <li><em>Aide à la création</em> et <em>Progression</em> : sous les points de personnage.</li>
  <li>Carte de dégâts dans le chat : <em>Appliquer aux jetons ciblés</em> (ou sélectionnés).</li>
  <li>Acteur <em>Groupe</em> : glisser les personnages dedans pour suivre leur état d'un coup d'œil.</li>
</ul>`
  },
  {
    name: "Jets et dé Joker",
    content: `
<h2>Code D (p. 25)</h2>
<p>On lance autant de d6 que le chiffre devant le D, plus les tiers (+1, +2). 3 tiers = 1D.</p>
<h2>Dé Joker</h2>
<ul>
  <li>Un dé de chaque jet est le Joker (rouge dans le chat et avec Dice So Nice).</li>
  <li><strong>6</strong> : succès critique, on ajoute et on relance, tant qu'il fait 6.</li>
  <li><strong>1</strong> au premier jet : échec critique. Le MJ choisit : retirer le dé le plus haut, ou garder le total avec une complication.</li>
</ul>
<h2>Réussite (p. 37)</h2>
<p>Il faut <strong>dépasser</strong> la difficulté. Égalité : pas d'effet, ou avantage à celui qui a l'initiative.</p>
<table>
  <tr><th>Difficulté</th><th>Valeur</th></tr>
  <tr><td>Très facile</td><td>1-5</td></tr><tr><td>Facile</td><td>6-10</td></tr>
  <tr><td>Moyenne</td><td>11-15</td></tr><tr><td>Difficile</td><td>16-20</td></tr>
  <tr><td>Très difficile</td><td>21-25</td></tr><tr><td>Héroïque</td><td>26-30</td></tr>
  <tr><td>Légendaire</td><td>31+</td></tr>
</table>
<h2>Compétences (p. 22)</h2>
<p>Non sélectionnée : Caractéristique −1D. Sélectionnée : Caractéristique + dés ajoutés.</p>
<h2>Initiative (p. 28)</h2>
<p>Test d'Agilité avec Joker. Une action par tranche de 10 points.</p>`
  },
  {
    name: "Points de personnage et Cojones",
    content: `
<h2>Points de personnage (p. 26)</h2>
<ul>
  <li>+1D par point dépensé (dont un Joker qui explose mais sans échec critique).</li>
  <li>Maximum par jet fixé par le MJ (réglage du monde) : 2 aventure facile, 3 cinématique.</li>
  <li>Aussi utilisables pour progresser (bouton <em>Progression</em>).</li>
</ul>
<h2>Cojones (p. 26)</h2>
<ul>
  <li>Un par test, au choix : doubler dés et tiers, ou relancer un test raté (bouton dans le chat).</li>
  <li>Jamais cumulés avec des points de personnage sur le même jet.</li>
</ul>
<p>Départ : 5 points de personnage, 1 point de Cojones.</p>`
  },
  {
    name: "Blessures",
    content: `
<h2>Encaisser (p. 63)</h2>
<p>Résistance = Puissance + protection portée (sans malus de blessure). Résistance ≥ dégâts : rien.</p>
<table>
  <tr><th>Dégâts − Résistance</th><th>Niveau</th><th>Effet</th></tr>
  <tr><td>1-3</td><td>Sonné</td><td>−1D pour le reste du round et le suivant</td></tr>
  <tr><td>4-8</td><td>Blessé</td><td>−1D jusqu'à guérison</td></tr>
  <tr><td>4-8 (déjà Blessé)</td><td>Gravement blessé</td><td>−2D jusqu'à guérison</td></tr>
  <tr><td>9-12</td><td>Handicapé</td><td>Volonté/Endurance Moyen pour rester debout à −3D, sinon K.O. 10D minutes</td></tr>
  <tr><td>13-15</td><td>Mortellement blessé</td><td>Inconscient, test de Puissance chaque round</td></tr>
  <tr><td>16+</td><td>Mort</td><td>—</td></tr>
</table>
<p>Un coup inférieur au niveau actuel fait monter d'un niveau. Les malus ne se cumulent pas.</p>
<p>Bonus aux dégâts : dés de Puissance ÷ 2, arrondi au supérieur. Une arme notée « +xD » s'y ajoute.</p>`
  },
  {
    name: "Véhicules",
    content: `
<h2>Dégâts aux véhicules (p. 52)</h2>
<table>
  <tr><th>Dégâts − Résistance</th><th>Véhicule</th><th>Passagers</th></tr>
  <tr><td>1-3</td><td>Très léger : −1D Manœuvrabilité ce round et le suivant</td><td>aucun dégât</td></tr>
  <tr><td>4-8</td><td>Léger : −1D Manœuvrabilité jusqu'à réparation</td><td>1/4 des dégâts</td></tr>
  <tr><td>9-12</td><td>Lourd : −2D Manœuvrabilité jusqu'à réparation</td><td>1/2</td></tr>
  <tr><td>13-15</td><td>Grave : incontrôlable</td><td>3/4</td></tr>
  <tr><td>16+</td><td>Détruit</td><td>totalité</td></tr>
</table>
<p>Très léger et Léger se cumulent sans limite ; à partir de Lourd, tout dégât au-dessus de Très léger fait monter d'un niveau.
Pas de points de personnage ni de Cojones sur la Résistance d'un véhicule.</p>`
  },
  {
    name: "Accoutumance et pouvoirs",
    content: `
<h2>Accoutumance (règle de la campagne)</h2>
<p>Jauge de 0 à 30, visible des joueurs : seuil 1 de 0 à 10, seuil 2 de 11 à 20, seuil 3 de 21 à 30.
Le chat annonce l'entrée dans les seuils 2 et 3 et la jauge pleine.</p>
<h2>Test d'accoutumance</h2>
<p>Test de Volonté contre 15. Chaque réussite augmente de 3 la difficulté du test suivant ; au premier échec
(une égalité ne suffit pas), elle revient à 15. Une relance avec un point de Cojones suit la même règle.</p>
<h2>Pouvoirs occultes</h2>
<ul>
  <li>Seuil 1 : passifs, narrés par le MJ. Seuil 2 : actifs, +1 par utilisation. Seuil 3 : manifestes, +2 par utilisation.</li>
  <li>Le bouton <em>Utiliser</em> ajoute le coût à la jauge et l'annonce (au MJ seulement si le pouvoir n'est pas révélé).</li>
  <li>Un pouvoir reste invisible pour le joueur tant que le MJ ne l'a pas révélé (icône œil).</li>
</ul>`
  }
];
