# Tower Defense (Branche `phaser`)

Ce module est une version Phaser.js du mini-jeu Tower Defense, conçue pour être intégrée dans un projet web plus large (ex : Sanglier Idle).

## Fonctionnalités principales
- **Phaser.js** pour le rendu, la gestion des entités et l’UI.
- **Blocage de la construction sur le chemin des ennemis** (path) : impossible de placer une tour sur le trajet emprunté par les rats.
- **Système d’upgrades progressif** pour les tours.
- **Gestion dynamique des vagues** et des types d’ennemis variés.
- **Contrôle de la vitesse de jeu** (slider).
- **Popup stats et vente de tour par clic droit**.
- **Affichage de la portée lors du placement et de l’inspection des tours**.

## Installation & Lancement

1. **Cloner la branche phaser**
   ```bash
   git clone -b phaser https://github.com/CattleCattle/Tower-defense.git
   cd Tower-defense
   ```
2. **Installer les dépendances**
   ```bash
   npm install
   ```
3. **Lancer le serveur local**
   ```bash
   npx serve .
   ```
   (ou tout autre serveur statique, car le projet utilise des modules ES6)

4. **Ouvrir le jeu**
   Accède à [http://localhost:3000](http://localhost:3000) (ou le port affiché par `serve`).

## Intégration dans un projet externe

1. **Importer la fonction d’initialisation**
   ```js
   import { initTowerDefense } from './src/main.js';
   ```
2. **Préparer un conteneur HTML**
   ```html
   <div id="tower-defense-container" style="position: relative;"></div>
   ```
3. **Initialiser le jeu**
   ```js
   const container = document.getElementById('tower-defense-container');
   function handleGameEnd(result) {
     console.log('Game Over!', result);
     // result = { win: true/false, rewards: { ... } }
   }
   initTowerDefense(container, handleGameEnd);
   ```

## Structure du projet

```
src/
  Tower.js        # Classe Tour (Phaser)
  Enemy.js        # Classe Ennemi
  Level.js        # Données de niveau (chemin, vagues)
  ui/
    ui.js         # UI (boutons, stats, slider)
  utils/
    helpers.js    # Fonctions utilitaires
main.js           # Point d’entrée, exporte initTowerDefense
```

## Notes d’équilibrage
- Le jeu est faisable jusqu’à la vague 13-14 en jouant parfaitement.
- La vague 15 nécessite un ajustement (DPS max < flux de PV).
- Le spam de tours niveau 1 est plus efficace en DPS pur, mais moins flexible.

## Auteur
- Adaptation Phaser et équilibrage : [@ton-pseudo]

---

**Branche dédiée :** `phaser`

Pour toute question ou suggestion, ouvre une issue sur le dépôt GitHub.
