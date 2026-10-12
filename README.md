# Z-Corps pour Foundry VTT (non officiel)

Système Foundry VTT **v13** pour Z-Corps, écrit avec les API actuelles (DataModels, ApplicationV2).

![Aperçu de la fiche](docs/apercu.png)

## Installation

**Manuelle (recommandée)** : copier le contenu du dépôt dans
`Data/systems/zcorps-vtt/` (le dossier doit s'appeler exactement `zcorps-vtt`
et contenir `system.json`), puis relancer Foundry.

**Par manifeste** (si le dépôt est public) : *Installer un système* →
`https://raw.githubusercontent.com/luminume/test/claude/busy-allen-wb750t/system.json`

## Contenu

- **Personnage** : identité, 6 attributs et toutes les compétences de la fiche officielle,
  compétences supplémentaires par attribut, blessures, échelle de stress, Cojones,
  points de personnage, bonus aux dégâts, mouvement, niveau de vie, équipement.
- **Accoutumance** : jauge de 0 à 30 (clic sur une case, ou −/+) avec paliers à 10, 20 et 30.
  Franchir un palier envoie un message dans le chat. Sous la jauge, une case sans titre
  avec 6 lignes « pouvoir / effet ».
- **PNJ / Zombie** : fiche simplifiée (attributs, compétences libres, blessures, armes).
- **Objets** : arme (compétence, dégâts, munitions, portées), équipement (protection),
  compétence.

## Jets

- Clic sur un attribut, une compétence ou une arme : fenêtre d'options (difficulté,
  modificateurs, malus de blessure, points de personnage, Cojones).
  **Maj+clic** : jet direct sans fenêtre.
- **Dé libre** (en rouge dans le chat) : explose sur 6 ; sur un 1, la carte signale la
  complication et donne le total sans le 1 et sans le dé le plus haut.
- **Dégâts** : le bouton du chat applique les dégâts aux jetons ciblés (ou sélectionnés) :
  jet de Puissance + protection portée, puis niveau de blessure selon la marge.
  « Encaisser des dégâts » sur la fiche fait la même chose à la main.
- **Initiative** : jet de Perception.
- Codes acceptés : `3D+1`, `+1D`, `2D-1`, `+2`.

## Hypothèses à vérifier avec le livre

Tout est regroupé dans `module/config.mjs` et `module/rules.mjs`.

| Point | Choix actuel |
|---|---|
| Malus de blessure | Sonné −1D, Blessé −1D, Gravement blessé −2D, Handicapé −3D |
| Aggravation | Une blessure ≤ à l'état actuel l'aggrave d'un cran (Blessé + Blessé = Gravement blessé) |
| Résistance aux dégâts | Puissance + protection des équipements portés |
| Point de Cojones | Double les dés du jet |
| Point de personnage | +1D explosif par point |
| Test de stress | Lance le dé du niveau actuel (d8 → d15), sans interprétation automatique |
| Effets du stress (−1D×1…) | Affichés pour mémoire, non appliqués |
| Dé libre sur dégâts/résistance | Désactivé par défaut (réglage du monde) |
| Difficultés | 5 / 10 / 15 / 20 / 25 / 30 |

## Développement

```bash
npm install
npm test   # règles, codes de dés, rendu des gabarits
```
