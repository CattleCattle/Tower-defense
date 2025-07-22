// Gère les états du jeu (menu, en jeu, pause, game over)
export default class GameStateManager {
    constructor(scene) {
        this.scene = scene;
        this.state = 'menu'; // menu | playing | paused | gameover
    }
    setState(newState) {
        this.state = newState;
        // On pourrait émettre un événement ici
    }
    getState() {
        return this.state;
    }
    isPlaying() {
        return this.state === 'playing';
    }
}
