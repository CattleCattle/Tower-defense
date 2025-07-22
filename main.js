import Game from './src/Game.js';
import { createUI } from './src/ui/ui.js';

/**
 * Initializes the Tower Defense game.
 * @param {HTMLElement} containerElement - The element to create the game canvas in.
 * @param {function} onGameEnd - Callback function executed when the game ends.
 */
function initTowerDefense(containerElement, onGameEnd) {

    // Ajoute un id pour compatibilité UI avancée
    containerElement.id = 'game-container';
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 540;
    containerElement.appendChild(canvas);

    // Style container
    containerElement.style.position = 'relative';

    // Create game instance
    const game = new Game(canvas, onGameEnd);

    // Crée un bloc global pour l'UI sous la zone de jeu
    let globalUI = document.getElementById('global-ui');
    if (!globalUI) {
        globalUI = document.createElement('div');
        globalUI.id = 'global-ui';
        globalUI.style.width = '100%';
        globalUI.style.display = 'flex';
        globalUI.style.justifyContent = 'center';
        globalUI.style.marginTop = '40px';
        document.body.appendChild(globalUI);
    }

    // Create UI dans le bloc global
    const ui = createUI(globalUI, game);
    game.ui = ui; // Give game a reference to the ui

    // Start the game
    game.start();

    return game; // Return the game instance for potential external control
}

export { initTowerDefense };
