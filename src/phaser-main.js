import GameStateManager from './GameStateManager.js';
import UpgradeManager from './UpgradeManager.js';
import WaveManager from './WaveManager.js';
import Enemy from './Enemy.js';
import Projectile from './Projectile.js';
import { level1 } from './Level.js';
import Tower from './Tower.js';
import UIManager from './ui/ui.js';
import AssetManager from './AssetManager.js';
import EventBus from './EventBus.js';
// Point d'entrée Phaser.js pour migration progressive du jeu Tower Defense
// Phaser est chargé via CDN dans index.html

class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.assetManager = new AssetManager(this);
        this.eventBus = new EventBus();
        // plus de bind nécessaire
    }

    preload() {
        this.assetManager.preloadAssets();
    }

    create() {
        // Empêcher le menu contextuel natif sur le canvas Phaser
        this.game.canvas.addEventListener('contextmenu', function(e) { e.preventDefault(); });
        // Initialiser le niveau (obligatoire pour drawPath et l'UI)
        if (this.textures.exists('map')) {
            this.add.image(480, 270, 'map').setDisplaySize(960, 540).setDepth(-2);
        }
        this.gridCols = 16;
        this.gridRows = 9;
        this.gridSize = 60;

        // Grille fine pour le path des ennemis (2x plus précise)
        this.pathGridCols = 32;
        this.pathGridRows = 18;
        this.pathGridSize = 30;

        // Initialiser les variables de jeu
        this.glands = 130;
        this.lives = 20;
        this.wave = 0;
        this.selectedTower = null;
        this.sellMode = false;
        this.enemies = [];
        this.projectiles = [];
        this.gameSpeed = 1;
        this.waveInProgress = false;

        // Initialiser la grille de jeu
        this.grid = [];
        for (let col = 0; col < this.gridCols; col++) {
            this.grid[col] = [];
            for (let row = 0; row < this.gridRows; row++) {
                this.grid[col][row] = 0; // 0 = libre, 1 = occupé, 2 = path
            }
        }
        // Marquer les cases du path comme interdites à la construction (grille large)
        if (this.level && this.level.path) {
            for (let i = 0; i < this.level.path.length - 1; i++) {
                const a = this.level.path[i];
                const b = this.level.path[i + 1];
                // Convertir en coordonnées grille large
                let colA = Math.floor(a.col / 2);
                let rowA = Math.floor(a.row / 2);
                let colB = Math.floor(b.col / 2);
                let rowB = Math.floor(b.row / 2);
                // Tracer le segment entre a et b sur la grille large
                const dCol = Math.sign(colB - colA);
                const dRow = Math.sign(rowB - rowA);
                let col = colA, row = rowA;
                this.grid[col][row] = 2;
                while (col !== colB || row !== rowB) {
                    if (col !== colB) col += dCol;
                    else if (row !== rowB) row += dRow;
                    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
                        this.grid[col][row] = 2;
                    }
                }
            }
        }
        // Initialiser le niveau et les vagues
        this.level = level1;
        // Marquer chaque point du path sur la grille large (16x9)
        if (this.level && this.level.path) {
            this.level.path.forEach(p => {
                const col = Math.floor(p.col / 2);
                const row = Math.floor(p.row / 2);
                if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
                    this.grid[col][row] = 2;
                }
            });
        }
        // Marquer chaque segment du path sur la grille large (16x9)
        if (this.level && this.level.path) {
            for (let i = 0; i < this.level.path.length - 1; i++) {
                const a = this.level.path[i];
                const b = this.level.path[i + 1];
                let colA = Math.floor(a.col / 2);
                let rowA = Math.floor(a.row / 2);
                let colB = Math.floor(b.col / 2);
                let rowB = Math.floor(b.row / 2);
                // Tracer le segment entre a et b sur la grille large
                const dCol = Math.sign(colB - colA);
                const dRow = Math.sign(rowB - rowA);
                let col = colA, row = rowA;
                this.grid[col][row] = 2;
                while (col !== colB || row !== rowB) {
                    if (col !== colB) col += dCol;
                    if (row !== rowB) row += dRow;
                    if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
                        this.grid[col][row] = 2;
                    }
                }
            }
        }
        // --- Suppression complète de l'affichage visuel du path (cases rouges) ---
        // (on garde uniquement le marquage interne this.grid[col][row] = 2)

        // --- Tours ---
        this.towers = [];

        // Créer le fantôme de tour (invisible au début)
        this.ghostTower = this.add.text(0, 0, '', {
            font: '32px Arial'
        }).setOrigin(0.5).setAlpha(0.5).setVisible(false).setDepth(50);
        // Cercle de portée du fantôme
        this.ghostRangeCircle = this.add.circle(0, 0, 0, 0x00c3ff, 0.18).setStrokeStyle(2, 0x00c3ff, 0.5).setVisible(false).setDepth(1);

        // Dessiner la grille de jeu
        this.drawGrid();

        // Affichage visuel du path sur la grille large (debug)
        // for (let col = 0; col < this.gridCols; col++) {
        //     for (let row = 0; row < this.gridRows; row++) {
        //         if (this.grid[col][row] === 2) {
        //             const g = this.add.graphics();
        //             g.fillStyle(0xff0000, 0.18);
        //             g.fillRect(col * this.gridSize, row * this.gridSize, this.gridSize, this.gridSize);
        //             g.setDepth(2);
        //         }
        //     }
        // }

        // --- UI MANAGER ---
        this.ui = new UIManager(this, this.eventBus);
        this.ui.setGlands(this.glands);
        this.ui.setLives(this.lives);
        this.ui.setWave(this.wave + 1);

        // Boutons tours (uniquement lançeur de glands)
        const towerTypes = [
            { type: 'shooter', label: '🐗 Lançeur de glands (60g)' }
        ];
        this.ui.createTowerButtons(towerTypes, 240, 510, 180);

        // Mettre à jour l'affordabilité des boutons au démarrage
        this.updateTowerButtons();

        // --- WAVE MANAGER ---
        this.waveManager = new WaveManager(this, this.level);
        
        // --- GAME STATE MANAGER ---
        this.gameState = new GameStateManager(this, this.eventBus);
        
        // Bouton vague suivante (après l'init du waveManager !)
        this.ui.createNextWaveButton(this.game.config.width - 160, 510, () => {
            console.log('Bouton Vague Suivante cliqué', {
                inProgress: this.waveManager.isWaveInProgress(),
                nbEnnemis: this.enemies.length
            });
            if (!this.waveManager.isWaveInProgress() && this.enemies.length === 0) {
                console.log('Lancement de la vague...');
                this.waveManager.startNextWave((enemyType) => this.spawnEnemy(enemyType));
                this.wave = this.waveManager.currentWave;
                this.ui.setWave(this.wave);
            }
        });

        // Slider de vitesse (en haut à droite)
        this.ui.createSpeedSlider(this.game.config.width - 20, 20, 1);
        this.ui.onSpeedChange = (speed) => {
            this.gameSpeed = speed;
        };

        // (Suppression du bouton vendre, la vente sera intégrée dans le popup stats)


        // Callbacks UI -> logique jeu
        this.ui.onBuy = (type) => {
            const towerInfo = this.getTowerInfo(type);
            if (towerInfo && this.glands >= towerInfo.cost) {
                this.selectedTower = type;
                this.sellMode = false;
                this.updateGhostTower();
                this.updateSellButton();
                this.updateTowerButtons();
                // Afficher la range de toutes les tours déjà posées
                this.towers.forEach(t => t.showRangeCircle());
            } else {
                console.log("Pas assez de glands pour acheter cette tour !");
            }
        };
        this.ui.onSell = () => this.toggleSellMode();
        this.ui.onNextWave = () => {
            if (!this.waveManager.isWaveInProgress()) {
                this.waveManager.startNextWave((enemyType) => this.spawnEnemy(enemyType));
                this.wave = this.waveManager.currentWave;
                this.ui.setWave(this.wave);
            }
        };

        // Option pour afficher ou non le chemin des ennemis
        this.showPath = false; // ou true si tu veux l'afficher par défaut
        if (this.showPath) {
            this.drawPath();
        }
        

        
        // Titre et instructions - AVEC DEPTH ÉLEVÉ
        this.add.text(480, 30, 'Phaser.js - Tower Defense', {
            font: 'bold 24px Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setDepth(100);
        






        // --- GESTION CLIC SUR LA GRILLE ---
        this.input.on('pointerdown', (pointer, currentlyOver) => {
            // Ignore le clic si on clique sur un objet interactif UI (bouton)
            if (currentlyOver && currentlyOver.length > 0) {
                return;
            }
            const col = Math.floor(pointer.x / this.gridSize);
            const row = Math.floor(pointer.y / this.gridSize);
            console.log('Clic sur', col, row, 'valeur grille:', this.grid[col][row]);

            // Clic droit : afficher popup stats si tour présente
            if (pointer.rightButtonDown()) {
                const tower = this.towers.find(t => t.col === col && t.row === row);
                if (tower) {
                    this.showTowerStatsPopup(tower, pointer.x, pointer.y);
                }
                return;
            }

            // Clic gauche : gestion normale
            if (this.sellMode) {
                this.sellTower(col, row);
            } else if (this.selectedTower) {
                // Empêcher la pose sur le path
                if (this.grid[col][row] === 2) {
                    // Feedback visuel déjà géré par le fantôme
                    return;
                }
                this.placeTower(col, row);
            } else {
                // Désormais, plus d'upgrade par clic gauche direct
                this.hideTowerStatsPopup();
            }
        });

        // --- GESTION MOUVEMENT SOURIS POUR FANTÔME ---
        this.input.on('pointermove', (pointer) => {
            if (this.selectedTower && this.ghostTower.visible) {
                // Aligner le fantôme sur la grille
                const col = Math.floor(pointer.x / this.gridSize);
                const row = Math.floor(pointer.y / this.gridSize);
                if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
                    console.log('Survol', col, row, 'valeur grille:', this.grid[col][row]);
                    const centerX = col * this.gridSize + this.gridSize / 2;
                    const centerY = row * this.gridSize + this.gridSize / 2;
                    this.ghostTower.setPosition(centerX, centerY);
                    // Mettre à jour la position et la taille du cercle de portée
                    const towerInfo = this.getTowerInfo(this.selectedTower);
                    if (towerInfo) {
                        this.ghostRangeCircle.setVisible(true);
                        this.ghostRangeCircle.setRadius(towerInfo.range);
                        this.ghostRangeCircle.setPosition(centerX, centerY);
                    }
                    // Changer la couleur selon si la case est libre ET pas sur le path
                    const canPlace = this.grid[col][row] === 0;
                    this.ghostTower.setTint(canPlace ? 0xffffff : 0xff0000);
                } else {
                    // Hors grille, cacher le fantôme et le cercle
                    this.ghostTower.setTint(0xff0000);
                    this.ghostRangeCircle.setVisible(false);
                }
            } else {
                this.ghostRangeCircle.setVisible(false);
            }
        });
    }

    update(time, delta) {
        const scaledDelta = delta * this.gameSpeed;

        // Mettre à jour le spawn dynamique des ennemis
        if (this.waveManager && this.waveManager.update) {
            this.waveManager.update(scaledDelta);
        }

        // Mettre à jour les ennemis
        this.enemies.forEach(enemy => {
            this.updateEnemy(enemy, scaledDelta);
            
            // Vérifier si l'ennemi a atteint la fin
            if (enemy.pathIndex >= enemy.path.length - 1) {
                this.lives--;
                this.updateLivesDisplay();
                enemy.sprite.destroy();
                const index = this.enemies.indexOf(enemy);
                if (index > -1) this.enemies.splice(index, 1);
                
                // Vérifier si la vague est terminée après suppression d'ennemi
                this.checkWaveComplete();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
            }
        });

        // Mettre à jour les tours (OOP)
        this.towers.forEach(tower => {
            tower.update(scaledDelta, this.enemies, (projectile, enemies) => {
                // Callback de hit : appliquer les dégâts
                let closestEnemy = null;
                let minDistance = 20;
                enemies.forEach(enemy => {
                    const dist = Math.sqrt(
                        (projectile.target.sprite.x - enemy.sprite.x) ** 2 +
                        (projectile.target.sprite.y - enemy.sprite.y) ** 2
                    );
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestEnemy = enemy;
                    }
                });
                if (closestEnemy) {
                    closestEnemy.health -= projectile.damage;
                    if (closestEnemy.health <= 0) {
                        this.glands += 5;
                        this.updateGlandsDisplay();
                        closestEnemy.destroy();
                        const index = this.enemies.indexOf(closestEnemy);
                        if (index > -1) this.enemies.splice(index, 1);
                        this.checkWaveComplete();
                    }
                }
            });
        });

        // Mettre à jour les projectiles
        this.projectiles.forEach((projectile, index) => {
            projectile.update(scaledDelta);
            if (projectile.hasHit) {
                this.hitTarget(projectile);
                projectile.sprite.destroy();
                this.projectiles.splice(index, 1);
            }
        });

        // Met à jour l'emoji du fantôme si la sélection change
        if (this.lastGhostType !== this.selectedTower) {
            let emoji = '🐗'; // Default
            const towerInfo = this.getTowerInfo(this.selectedTower);
            // ... (logique à compléter si besoin)
        }
    }

    createProjectile(tower, target) {
        const towerInfo = this.getTowerInfo(tower.type);
        const config = towerInfo && towerInfo.projectileConfig ? towerInfo.projectileConfig : { speed: 300, damage: 1 };
        const projectile = new Projectile(this, tower.x, tower.y, target, config);
        this.projectiles.push(projectile);
    }

    handleClick(pointer) {
        const col = Math.floor(pointer.x / this.gridSize);
        const row = Math.floor(pointer.y / this.gridSize);
        
        if (col >= 0 && col < this.gridCols && row >= 0 && row < this.gridRows) {
            // La gestion du clic est maintenant dans le listener global de 'create'
            // pour différencier le mode vente du mode placement.
            // Ce code est conservé au cas où, mais ne devrait plus être appelé directement.
            if (this.grid[col][row] === 0 && !this.hasTowerAt(col, row)) {
                this.placeTower(col, row);
            }
        }
    }

    placeTower(col, row) {
        if (!this.selectedTower) return false;

        const towerInfo = this.getTowerInfo(this.selectedTower);
        if (!towerInfo) return false;

        // Vérifier que la case est dans la grille et libre
        if (col < 0 || col >= this.gridCols || row < 0 || row >= this.gridRows) return false;
        if (this.grid[col][row] !== 0) return false;

        // Vérifier si on a assez de glands
        if (this.glands < towerInfo.cost) {
            console.log("Pas assez de glands !");
            return false; // Pas assez de ressources
        }

        // Créer la tour et l'ajouter à la scène
        const tower = new Tower(this, this.selectedTower, col, row, {
            gridSize: this.gridSize,
            ...towerInfo
        });
        this.towers.push(tower);
        this.grid[col][row] = 1; // Marquer la case comme occupée

        // Déduire le coût
        this.glands -= towerInfo.cost;
        this.updateGlandsDisplay();

        // Réinitialiser la sélection pour éviter de placer la même tour en boucle
        this.selectedTower = null;
        this.ghostTower.setVisible(false);
        this.updateTowerButtons();
        // Après placement, cacher le cercle de portée du fantôme (toujours)
        this.ghostRangeCircle.setVisible(false);
        // Masquer la range de toutes les autres tours
        this.towers.forEach(t => t.hideRangeCircle());
        return true;
    }

    drawGrid() {
        // Dessiner les lignes de la grille LARGE (tours)
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x444444, 0.3);
        graphics.setDepth(0);

        // Lignes verticales pour grille tours
        for (let col = 0; col <= this.gridCols; col++) {
            const x = col * this.gridSize;
            graphics.moveTo(x, 0);
            graphics.lineTo(x, this.gridRows * this.gridSize);
        }

        // Lignes horizontales pour grille tours
        for (let row = 0; row <= this.gridRows; row++) {
            const y = row * this.gridSize;
            graphics.moveTo(0, y);
            graphics.lineTo(this.gridCols * this.gridSize, y);
        }

        graphics.strokePath();
    }


    drawPath() {
        // Optimisation : créer un seul objet graphique pour tout le chemin
        const pathGraphics = this.add.graphics();
        pathGraphics.fillStyle(0xb97a56, 1);
        pathGraphics.setDepth(1); // Au-dessus de la grille, en dessous de l'UI
        
        // Utiliser les données du niveau externe avec la grille FINE
        const path = this.level.path;
        for (let i = 0; i < path.length - 1; i++) {
            const a = path[i];
            const b = path[i+1];
            const dCol = Math.sign(b.col - a.col);
            const dRow = Math.sign(b.row - a.row);
            let col = a.col, row = a.row;
            pathGraphics.fillRect(
                col * this.pathGridSize, 
                row * this.pathGridSize, 
                this.pathGridSize, 
                this.pathGridSize
            );
            while (col !== b.col || row !== b.row) {
                if (col !== b.col) col += dCol;
                else if (row !== b.row) row += dRow;
                pathGraphics.fillRect(
                    col * this.pathGridSize, 
                    row * this.pathGridSize, 
                    this.pathGridSize, 
                    this.pathGridSize
                );
            }
        }
    }

    spawnEnemy(type = 'rat_basic', health, speed) {
        // Définir les types de rats
        const ratTypes = {
            'rat_basic':    { emoji: '🐀', name: 'Rat', color: 0x888888, health: 12, speed: 1.2 },
            'rat_fast':     { emoji: '🐁', name: 'Rat agile', color: 0x00bbff, health: 7, speed: 2.2 },
            'rat_tank':     { emoji: '🐀', name: 'Rat blindé', color: 0x444444, health: 30, speed: 0.7 },
            'rat_boss':     { emoji: '🐀', name: 'Rat boss', color: 0xffaa00, health: 60, speed: 1.1 },
            'rat_poison':   { emoji: '🦨', name: 'Rat toxique', color: 0x44ff44, health: 10, speed: 1.1 },
            'rat_vole':     { emoji: '🦝', name: 'Rat voleur', color: 0x996633, health: 10, speed: 1.3 },
            'rat_gros':     { emoji: '🐹', name: 'Rat dodu', color: 0xff66cc, health: 20, speed: 0.9 },
            'rat_fouisseur':{ emoji: '🦡', name: 'Rat fouisseur', color: 0xaaaaaa, health: 14, speed: 1.0 },
            'rat_rapide':   { emoji: '🐇', name: 'Rat sprinteur', color: 0xffffff, health: 8, speed: 2.7 }
        };
        const rat = ratTypes[type] || ratTypes['rat_basic'];
        // Utiliser les valeurs par défaut du type sauf si override
        const finalHealth = health !== undefined ? health : rat.health;
        const finalSpeed = speed !== undefined ? speed : rat.speed;
        // Position de départ
        if (!this.level || !this.level.path) {
            console.error('Level or path not defined for enemy spawn');
            return;
        }
        const path = this.level.path;
        const startPos = path[0];
        const startX = startPos.col * this.pathGridSize + this.pathGridSize/2;
        const startY = startPos.row * this.pathGridSize + this.pathGridSize/2;
        // Sprite avec couleur personnalisée
        const enemySprite = this.add.text(startX, startY, rat.emoji, {
            font: '24px Arial'
        }).setOrigin(0.5);
        if (rat.color) enemySprite.setTint(rat.color);
        const enemy = new Enemy(this, type, path, {
            emoji: rat.emoji,
            health: finalHealth,
            speed: finalSpeed,
            pathGridSize: this.pathGridSize
        });
        this.enemies.push(enemy);
    }

    defineWaves() {
        // Utiliser les données du niveau externe, mais avec un fallback
        if (this.level && this.level.waves) {
            // Convertir le format de Level.js vers le format Phaser
            this.wavesConfig = this.level.waves.map((waveData, index) => {
                const enemies = [];
                Object.keys(waveData).forEach(enemyType => {
                    for (let i = 0; i < waveData[enemyType]; i++) {
                        enemies.push(enemyType);
                    }
                });
                return {
                    enemies: enemies,
                    waveNumber: index + 1
                };
            });
        } else {
            // Fallback - vagues simples
            this.wavesConfig = [
                { enemies: ['bramble', 'bramble', 'bramble', 'bramble', 'bramble', 'bramble', 'bramble', 'bramble'], waveNumber: 1 },
                { enemies: ['bramble', 'bramble', 'bramble', 'bramble', 'bramble', 'bramble', 'swarm', 'swarm', 'swarm', 'swarm'], waveNumber: 2 },
                { enemies: ['bramble', 'bramble', 'bramble', 'bramble', 'swarm', 'swarm', 'swarm', 'swarm', 'swarm', 'swarm', 'swarm', 'swarm'], waveNumber: 3 },
            ];
        }
    }


    updateEnemy(enemy, deltaMs) {
        if (enemy.pathIndex >= enemy.path.length - 1) {
            return;
        }

        const deltaSeconds = deltaMs / 1000;
        let currentSpeed = enemy.speed * this.pathGridSize; // Vitesse en pixels/sec

        if (enemy.isSlowed) {
            currentSpeed *= 0.5;
        }

        let moveDistance = currentSpeed * deltaSeconds;

        while (moveDistance > 0 && enemy.pathIndex < enemy.path.length - 1) {
            const currentPoint = enemy.path[enemy.pathIndex];
            const nextPoint = enemy.path[enemy.pathIndex + 1];

            const startX = currentPoint.col * this.pathGridSize + this.pathGridSize / 2;
            const startY = currentPoint.row * this.pathGridSize + this.pathGridSize / 2;
            const endX = nextPoint.col * this.pathGridSize + this.pathGridSize / 2;
            const endY = nextPoint.row * this.pathGridSize + this.pathGridSize / 2;

            const segmentDx = endX - startX;
            const segmentDy = endY - startY;
            const segmentLength = Math.sqrt(segmentDx * segmentDx + segmentDy * segmentDy);

            const distanceToNextPoint = segmentLength * (1 - enemy.progress);

            if (moveDistance >= distanceToNextPoint) {
                moveDistance -= distanceToNextPoint;
                enemy.progress = 0;
                enemy.pathIndex++;
            } else {
                const progressThisFrame = moveDistance / segmentLength;
                enemy.progress += progressThisFrame;
                moveDistance = 0;
            }
        }

        if (enemy.pathIndex >= enemy.path.length - 1) {
            // L'ennemi est arrivé à la fin
            const lastPoint = enemy.path[enemy.path.length - 1];
            enemy.sprite.setPosition(
                lastPoint.col * this.pathGridSize + this.pathGridSize / 2,
                lastPoint.row * this.pathGridSize + this.pathGridSize / 2
            );
            return;
        }
        
        const currentPoint = enemy.path[enemy.pathIndex];
        const nextPoint = enemy.path[enemy.pathIndex + 1];
        
        const currentX = currentPoint.col * this.pathGridSize + this.pathGridSize/2;
        const currentY = currentPoint.row * this.pathGridSize + this.pathGridSize/2;
        const nextX = nextPoint.col * this.pathGridSize + this.pathGridSize/2;
        const nextY = nextPoint.row * this.pathGridSize + this.pathGridSize/2;
        
        const interpolatedX = currentX + (nextX - currentX) * enemy.progress;
        const interpolatedY = currentY + (nextY - currentY) * enemy.progress;
        
        enemy.sprite.setPosition(interpolatedX, interpolatedY);
        // Mettre à jour la barre de vie
        if (enemy.healthBar && enemy.healthBarBg) {
            const width = 24;
            const height = 4;
            const x = interpolatedX - width / 2;
            const y = interpolatedY - 20;
            enemy.healthBarBg.setPosition(0, 0);
            enemy.healthBar.setPosition(0, 0);
            enemy.healthBarBg.clear();
            enemy.healthBarBg.fillStyle(0x333333, 1);
            enemy.healthBarBg.fillRect(x, y, width, height);
            enemy.healthBar.clear();
            const percent = Math.max(0, enemy.health / enemy.maxHealth);
            const color = percent > 0.3 ? 0x00ff00 : 0xff0000;
            enemy.healthBar.fillStyle(color, 1);
            enemy.healthBar.fillRect(x, y, width * percent, height);
        }
        
        // Changer la couleur selon la santé
        const healthPercent = enemy.health / enemy.maxHealth;
        if (healthPercent < 0.3) {
            enemy.sprite.setTint(0xff0000); // Rouge si faible santé
        } else if (healthPercent < 0.7) {
            enemy.sprite.setTint(0xffaa00); // Orange si santé moyenne
        } else {
            enemy.sprite.clearTint(); // Normal si bonne santé
        }
    }
    
    getTowerInfo = (type) => {
        const towerData = {
            'shooter': {
                emoji: '🐗',
                cost: 60,
                range: 170,
                cooldown: 900,
                description: 'Lance des glands sur les ennemis.',
                projectileConfig: { speed: 350, damage: 1, color: 0xffff00, emoji: '🌰' }
            }
            // Les autres types de tours seront ajoutés plus tard
        };
        return towerData[type];
    }
    
    findTarget(tower) {
        let candidates = this.enemies.filter(enemy => {
            // Filtrer par portée
            return this.distance(tower, enemy) <= tower.range;
        });
        if (candidates.length === 0) return null;
        switch (tower.targetPriority) {
            case 'first': // le plus avancé sur le chemin
                return candidates.reduce((a, b) => (a.pathIndex + a.progress > b.pathIndex + b.progress ? a : b));
            case 'last': // le plus en arrière
                return candidates.reduce((a, b) => (a.pathIndex + a.progress < b.pathIndex + b.progress ? a : b));
            case 'strong': // le plus de vie
                return candidates.reduce((a, b) => (a.health > b.health ? a : b));
            case 'weak': // le moins de vie
                return candidates.reduce((a, b) => (a.health < b.health ? a : b));
            case 'close': // le plus proche de la tour
                return candidates.reduce((a, b) => (this.distance(tower, a) < this.distance(tower, b) ? a : b));
            case 'far': // le plus éloigné de la tour
                return candidates.reduce((a, b) => (this.distance(tower, a) > this.distance(tower, b) ? a : b));
            default:
                return candidates[0];
        }
    }
    
    distance(obj1, obj2) {
        const dx = obj1.x - obj2.sprite.x;
        const dy = obj1.y - obj2.sprite.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    

    
    hitTarget(projectile) {
        // Chercher l'ennemi le plus proche du point d'impact
        let closestEnemy = null;
        let minDistance = 20; // Rayon de détection
        this.enemies.forEach(enemy => {
            const dist = Math.sqrt(
                (projectile.targetX - enemy.sprite.x) ** 2 +
                (projectile.targetY - enemy.sprite.y) ** 2
            );
            if (dist < minDistance) {
                minDistance = dist;
                closestEnemy = enemy;
            }
        });
        if (closestEnemy) {
            closestEnemy.health -= projectile.damage;
            if (closestEnemy.health <= 0) {
                // Gain d'or variable selon la vague/type
                let reward = 5;
                if (this.wave >= 10) reward = 10;
                if (closestEnemy.type === 'rat_boss') reward = 20;
                this.glands += reward;
                this.updateGlandsDisplay();
                closestEnemy.destroy();
                const index = this.enemies.indexOf(closestEnemy);
                if (index > -1) this.enemies.splice(index, 1);
                this.checkWaveComplete();
            }
        }
    }
    
    slowEnemiesInRange(tower) {
        this.enemies.forEach(enemy => {
            if (enemy.type !== 'mist') { // La brume est immunisée au ralentissement
                const dist = this.distance(tower, enemy);
                if (dist < tower.range) {
                    enemy.isSlowed = true;
                } else {
                    enemy.isSlowed = false;
                }
            } else {
                enemy.isSlowed = false; // S'assurer que la brume n'est jamais ralentie
            }
        });
    }
    
    updateGlandsDisplay() {
        this.ui.setGlands(this.glands);
    }

    updateLivesDisplay() {
        this.ui.setLives(this.lives);
    }

    gameOver() {
        this.add.text(480, 270, 'GAME OVER', {
            font: 'bold 48px Arial',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5);
    }



    updateSellButton() {
        // Optionnel : à compléter pour changer le style du bouton vendre selon le mode
        // Par exemple : this.ui.sellButton.setBackgroundColor(this.sellMode ? '#f00' : '#555');
        if (this.ui && this.ui.sellButton) {
            this.ui.sellButton.setBackgroundColor(this.sellMode ? '#f00' : '#555');
        }
    }

    updateGhostTower() {
        if (this.selectedTower) {
            const towerInfo = this.getTowerInfo(this.selectedTower);
            if (towerInfo) {
                this.ghostTower.setText(towerInfo.emoji);
                this.ghostTower.setVisible(true);
                // Affiche le cercle de portée
                this.ghostRangeCircle.setVisible(true);
                this.ghostRangeCircle.setRadius(towerInfo.range);
                this.ghostRangeCircle.setPosition(this.ghostTower.x, this.ghostTower.y);
            }
        } else {
            this.ghostTower.setVisible(false);
            this.ghostRangeCircle.setVisible(false);
            // Masquer la range de toutes les autres tours
            this.towers.forEach(t => t.hideRangeCircle());
        }
    }

    toggleSellMode() {
        this.sellMode = !this.sellMode;
        this.selectedTower = null; // Désélectionner la tour quand on entre en mode vente
        this.ghostTower.setVisible(false);
        this.updateSellButton();
        this.updateTowerButtons();
    }

    checkWaveComplete() {
        // Vérifier périodiquement si tous les ennemis ont été spawnés ET qu'il n'y en a plus sur le terrain
        const checkInterval = setInterval(() => {
            if (
                this.waveManager.isWaveInProgress() &&
                this.waveManager.spawnIndex >= this.waveManager.spawnQueue.length &&
                this.enemies.length === 0
            ) {
                clearInterval(checkInterval);
                this.waveManager.endWave();
                console.log(`Vague ${this.wave} terminée !`);
            }
        }, 500);
    }

    sellTower(col, row, refundOverride) {
        // Trouver la tour à cette position
        const towerIndex = this.towers.findIndex(tower => tower.col === col && tower.row === row);
        if (towerIndex !== -1) {
            const tower = this.towers[towerIndex];
            let refund = refundOverride;
            if (typeof refund === 'undefined') {
                // Rembourser une partie du coût (par exemple 70%)
                refund = Math.floor((tower.cost || 0) * 0.7);
            }
            this.glands += refund;
            this.updateGlandsDisplay();
            // Supprimer le sprite
            tower.sprite.destroy();
            if (tower.levelText) tower.levelText.destroy();
            if (tower.rangeCircle) tower.rangeCircle.destroy();
            // Retirer de la liste et libérer la case
            this.towers.splice(towerIndex, 1);
            this.grid[col][row] = 0;
            console.log(`Tour vendue pour ${refund} glands`);
        }
    }

    updateTowerButtons() {
        // Mettre à jour l'affordabilité des boutons
        if (this.ui && this.ui.updateTowerButtonsAffordability) {
            this.ui.updateTowerButtonsAffordability(this.glands, type => this.getTowerInfo(type));
        }
    }

    // --- Méthodes de classe pour popup stats ---
    showTowerStatsPopup(tower, x, y) {
        this.hideTowerStatsPopup();
        // Afficher la range de toutes les tours déjà posées
        this.towers.forEach(t => t.showRangeCircle());
        // Cadre intermédiaire, ni trop grand ni trop petit
        const width = 240;
        const height = 290;
        this.towerStatsPopup = this.add.container(x, y);
        // Fond arrondi avec ombre
        const bg = this.add.graphics();
        bg.fillStyle(0x222a38, 0.97);
        bg.fillRoundedRect(-width/2, -height/2, width, height, 18);
        bg.lineStyle(3, 0x00c3ff, 0.7);
        bg.strokeRoundedRect(-width/2, -height/2, width, height, 18);
        bg.setDepth(100);
        // Ombre portée
        bg.shadowOffsetX = 0;
        bg.shadowOffsetY = 4;
        bg.shadowColor = 0x000000;
        bg.shadowBlur = 12;
        this.towerStatsPopup.add(bg);
        // Titre
        const titleY = -height/2 + 24;
        const title = this.add.text(0, titleY, 'Stats Tour', {
            font: 'bold 19px Arial', color: '#00c3ff', align: 'center', stroke: '#111', strokeThickness: 2
        }).setOrigin(0.5);
        this.towerStatsPopup.add(title);
        // Séparateur
        const sepY = titleY + 20;
        const sep = this.add.graphics();
        sep.lineStyle(1.5, 0x00c3ff, 0.5);
        sep.lineBetween(-width/2+18, sepY, width/2-18, sepY);
        this.towerStatsPopup.add(sep);
        // Texte stats centré, bien espacé
        const statsY = sepY + 18;
        const stats = `Niveau : ${tower.level}\nDégâts : ${tower.damage}\nPortée : ${tower.range}\nCooldown : ${tower.cooldown}ms`;
        const txt = this.add.text(0, statsY, stats, {
            font: '18px Arial', color: '#fff', align: 'center', padding: { left: 0, right: 0, top: 0, bottom: 0 }, lineSpacing: 9
        }).setOrigin(0.5, 0);
        this.towerStatsPopup.add(txt);
        // Bouton Upgrade stylé, bien espacé
        let btnY = statsY + txt.height + 28;
        if (tower.canUpgrade()) {
            const btnW = 130, btnH = 36;
            const btnBg = this.add.graphics();
            btnBg.fillStyle(0x00c3ff, 1);
            btnBg.fillRoundedRect(-btnW/2, 0, btnW, btnH, 14);
            btnBg.setAlpha(0.92);
            btnBg.setDepth(101);
            const btnText = this.add.text(0, btnH/2, `Upgrade (${tower.getUpgradeCost()}g)`, {
                font: 'bold 17px Arial', color: '#fff', align: 'center', stroke: '#111', strokeThickness: 2
            }).setOrigin(0.5);
            const btnContainer = this.add.container(0, btnY, [btnBg, btnText]);
            btnContainer.setSize(btnW, btnH);
            // Interactivité sur le container ET le fond
            btnContainer.setInteractive(new Phaser.Geom.Rectangle(-btnW/2, 0, btnW, btnH), Phaser.Geom.Rectangle.Contains);
            btnBg.setInteractive(new Phaser.Geom.Rectangle(-btnW/2, 0, btnW, btnH), Phaser.Geom.Rectangle.Contains);
            // Hover effet
            btnContainer.on('pointerover', () => btnBg.setFillStyle(0x0099cc, 1));
            btnContainer.on('pointerout', () => btnBg.setFillStyle(0x00c3ff, 1));
            btnBg.on('pointerover', () => btnBg.setFillStyle(0x0099cc, 1));
            btnBg.on('pointerout', () => btnBg.setFillStyle(0x00c3ff, 1));
            // Clic sur container ou fond = upgrade
            const handleUpgrade = () => {
                if (this.glands >= tower.getUpgradeCost()) {
                    this.glands -= tower.getUpgradeCost();
                    tower.upgrade();
                    // Ne pas modifier le texte du sprite ici (le niveau est déjà affiché en bas à droite)
                    this.updateGlandsDisplay();
                    this.showTowerStatsPopup(tower, x, y); // refresh popup
                    tower.sprite.setScale(1.2);
                    this.time.delayedCall(120 / (this.gameSpeed || 1), () => tower.sprite.setScale(1), [], this);
                    // Mettre à jour la range visuelle si elle est affichée
                    if (tower.rangeCircle && tower.rangeCircle.visible) {
                        tower.showRangeCircle();
                    }
                } else {
                    btnBg.setFillStyle(0xff0033, 1);
                    this.time.delayedCall(200 / (this.gameSpeed || 1), () => btnBg.setFillStyle(0x00c3ff, 1), [], this);
                }
            };
            btnContainer.on('pointerdown', handleUpgrade);
            btnBg.on('pointerdown', handleUpgrade);
            this.towerStatsPopup.add(btnContainer);
            btnY += btnH + 16;
        } else {
            const maxTxtY = btnY;
            const maxTxt = this.add.text(0, maxTxtY, 'Max level', {
                font: 'bold 15px Arial', color: '#aaa', align: 'center'
            }).setOrigin(0.5);
            this.towerStatsPopup.add(maxTxt);
            btnY += 36;
        }
        // Bouton Vendre Tour
        const sellBtnW = 130, sellBtnH = 36;
        const sellBtnBg = this.add.graphics();
        sellBtnBg.fillStyle(0xff0033, 1);
        sellBtnBg.fillRoundedRect(-sellBtnW/2, 0, sellBtnW, sellBtnH, 14);
        sellBtnBg.setAlpha(0.92);
        sellBtnBg.setDepth(101);
        const sellBtnText = this.add.text(0, sellBtnH/2, `Vendre Tour`, {
            font: 'bold 17px Arial', color: '#fff', align: 'center', stroke: '#111', strokeThickness: 2
        }).setOrigin(0.5);
        const sellBtnContainer = this.add.container(0, btnY, [sellBtnBg, sellBtnText]);
        sellBtnContainer.setSize(sellBtnW, sellBtnH);
        sellBtnContainer.setInteractive(new Phaser.Geom.Rectangle(-sellBtnW/2, 0, sellBtnW, sellBtnH), Phaser.Geom.Rectangle.Contains);
        sellBtnBg.setInteractive(new Phaser.Geom.Rectangle(-sellBtnW/2, 0, sellBtnW, sellBtnH), Phaser.Geom.Rectangle.Contains);
        sellBtnContainer.on('pointerover', () => { sellBtnBg.clear(); sellBtnBg.fillStyle(0xcc0033, 1); sellBtnBg.fillRoundedRect(-sellBtnW/2, 0, sellBtnW, sellBtnH, 14); });
        sellBtnContainer.on('pointerout', () => { sellBtnBg.clear(); sellBtnBg.fillStyle(0xff0033, 1); sellBtnBg.fillRoundedRect(-sellBtnW/2, 0, sellBtnW, sellBtnH, 14); });
        sellBtnBg.on('pointerover', () => { sellBtnBg.clear(); sellBtnBg.fillStyle(0xcc0033, 1); sellBtnBg.fillRoundedRect(-sellBtnW/2, 0, sellBtnW, sellBtnH, 14); });
        sellBtnBg.on('pointerout', () => { sellBtnBg.clear(); sellBtnBg.fillStyle(0xff0033, 1); sellBtnBg.fillRoundedRect(-sellBtnW/2, 0, sellBtnW, sellBtnH, 14); });
        // Clic = demander confirmation
        const handleSellClick = () => {
            // Afficher la confirmation dans le popup
            if (this.sellConfirmContainer) this.sellConfirmContainer.destroy();
            const confirmW = 150, confirmH = 60;
            const confirmBg = this.add.graphics();
            confirmBg.fillStyle(0x222a38, 0.97);
            confirmBg.fillRoundedRect(-confirmW/2, 0, confirmW, confirmH, 12);
            confirmBg.lineStyle(2, 0xff0033, 0.7);
            confirmBg.strokeRoundedRect(-confirmW/2, 0, confirmW, confirmH, 12);
            const confirmText = this.add.text(0, 16, 'Confirmer la vente ?', { font: '15px Arial', color: '#fff', align: 'center' }).setOrigin(0.5);
            // Bouton Oui
            const yesBg = this.add.graphics();
            yesBg.fillStyle(0xff0033, 1);
            yesBg.fillRoundedRect(-40, 0, 80, 28, 8);
            const yesText = this.add.text(0, 14, 'Oui', { font: 'bold 15px Arial', color: '#fff' }).setOrigin(0.5);
            const yesBtn = this.add.container(-40, 36, [yesBg, yesText]);
            yesBtn.setSize(80, 28);
            yesBtn.setInteractive(new Phaser.Geom.Rectangle(-40, 0, 80, 28), Phaser.Geom.Rectangle.Contains);
            yesBtn.on('pointerdown', () => {
                // Calcul du coût total investi dans la tour (base + upgrades)
                let totalCost = 0;
                const baseCost = this.getTowerInfo(tower.type).cost;
                totalCost += baseCost;
                if (window.Tower && window.Tower.LEVELS) {
                    for (let lvl = 2; lvl <= tower.level; lvl++) {
                        totalCost += window.Tower.LEVELS[lvl - 1].cost;
                    }
                } else if (typeof require !== 'undefined') {
                    try {
                        const TowerClass = require('./Tower.js').default;
                        for (let lvl = 2; lvl <= tower.level; lvl++) {
                            totalCost += TowerClass.LEVELS[lvl - 1].cost;
                        }
                    } catch {}
                }
                const refund = Math.floor(totalCost * 0.75);
                this.sellTower(tower.col, tower.row, refund);
                this.hideTowerStatsPopup();
                if (this.sellConfirmContainer) this.sellConfirmContainer.destroy();
            });
            // Bouton Non
            const noBg = this.add.graphics();
            noBg.fillStyle(0x00c3ff, 1);
            noBg.fillRoundedRect(-40, 0, 80, 28, 8);
            const noText = this.add.text(0, 14, 'Non', { font: 'bold 15px Arial', color: '#fff' }).setOrigin(0.5);
            const noBtn = this.add.container(40, 36, [noBg, noText]);
            noBtn.setSize(80, 28);
            noBtn.setInteractive(new Phaser.Geom.Rectangle(-40, 0, 80, 28), Phaser.Geom.Rectangle.Contains);
            noBtn.on('pointerdown', () => {
                if (this.sellConfirmContainer) this.sellConfirmContainer.destroy();
            });
            this.sellConfirmContainer = this.add.container(0, btnY + 10, [confirmBg, confirmText, yesBtn, noBtn]);
            this.towerStatsPopup.add(this.sellConfirmContainer);
            this.children.bringToTop(this.towerStatsPopup);
        };
        sellBtnContainer.on('pointerdown', handleSellClick);
        sellBtnBg.on('pointerdown', handleSellClick);
        this.towerStatsPopup.add(sellBtnContainer);
        this.children.bringToTop(this.towerStatsPopup);
    }

    hideTowerStatsPopup() {
        if (this.towerStatsPopup) {
            this.towerStatsPopup.destroy();
            this.towerStatsPopup = null;
        }
        // Masquer la range de toutes les autres tours
        this.towers.forEach(t => t.hideRangeCircle());
    }
}
export default MainScene;
