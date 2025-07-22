import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Charger l'image de la map si besoin (déjà chargée ailleurs ?)
        if (!this.textures.exists('map')) {
            this.load.image('map', 'assets/map.png');
        }
    }

    create() {
        // Afficher la map au centre comme dans l'ancien code
        this.add.image(402, 261, 'map');
    }
}
