// Ce fichier gère l'initialisation du jeu Phaser.

import MainScene from './phaser-main.js';

let phaserGame = null;

function startPhaserGame(container) {
    if (phaserGame) {
        // Si le jeu existe déjà, on le détruit avant d'en créer un nouveau
        // pour éviter les conflits de contexte WebGL.
        phaserGame.destroy(true);
        phaserGame = null;
    }

    const config = {
        type: Phaser.AUTO,
        width: 960,
        height: 540,
        backgroundColor: '#34673b',
        parent: container, // Utilise le conteneur fourni
        scene: [MainScene],
    };

    phaserGame = new Phaser.Game(config);
}

export { startPhaserGame };
