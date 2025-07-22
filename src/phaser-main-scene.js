// Affichage du terrain et de la grille Tower Defense dans Phaser.js
import Phaser from 'phaser';
import { level1 } from './Level.js';

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.gridCols = 16;
        this.gridRows = 9;
        this.gridSize = 50; // Adapté à 800x600
        this.pathGridCols = 32;
        this.pathGridRows = 18;
        this.pathGridSize = 25;
    }

    preload() {
        // Précharge les assets ici (ex: images, spritesheets)
        // TODO: Charger le fond si besoin
    }

    create() {
        console.log('Phaser MainScene create() appelé');
        
        // Test simple : fond bleu + gros rectangles colorés pour validation
        this.add.rectangle(400, 300, 800, 600, 0x0066cc);
        
        // Gros rectangles de test visibles
        this.add.rectangle(100, 100, 80, 80, 0xff0000); // Rouge
        this.add.rectangle(300, 200, 80, 80, 0x00ff00); // Vert
        this.add.rectangle(500, 300, 80, 80, 0xffff00); // Jaune
        this.add.rectangle(700, 400, 80, 80, 0xff00ff); // Magenta
        
        // Texte visible
        this.add.text(400, 50, 'PHASER TEST - Si tu vois ça, Phaser marche !', {
            font: 'bold 20px Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5);
        
        console.log('Phaser MainScene create() terminé');
    }

    update(time, delta) {
        // Logique de jeu à venir
    }
}

export default MainScene;
