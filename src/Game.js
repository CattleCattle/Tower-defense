import Tower from './Tower.js';
import Enemy from './Enemy.js';
import { level1 } from './Level.js';
import { distance } from './utils/helpers.js';

class Game {
    constructor(canvas, onGameEnd) {
        // Image de fond
        this.bgImage = new window.Image();
        this.bgImageLoaded = false;
        this.bgImage.src = './assets/map.png';
        this.bgImage.onload = () => { this.bgImageLoaded = true; };
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onGameEnd = onGameEnd;
        // Pour le fantôme de tour
        this.ghost = { x: null, y: null, col: null, row: null };
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        this.towers = [];
        this.enemies = [];
        this.projectiles = [];

        this.glands = 100;
        this.wave = 0;
        this.lives = 20;

        this.running = true;
        this.level = level1;
        this.selectedTower = null;
        this.ui = null;

        // Grille tours (grosse)
        this.gridCols = 16;
        this.gridRows = 9;
        this.gridSize = Math.floor(this.canvas.width / this.gridCols); // 60px
        // Grille fine pour le chemin
        this.pathGridCols = this.gridCols * 2; // 32
        this.pathGridRows = this.gridRows * 2; // 18
        this.pathGridSize = Math.floor(this.canvas.width / this.pathGridCols); // 30px
        // Occupation des cases (0 = libre, 1 = tour, 2 = chemin)
        this.grid = Array.from({length: this.gridCols}, () => Array(this.gridRows).fill(0));

        this.markPathOnGrid();

        this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));

        // Mode édition de chemin
        this.isEditingPath = false;
        this.tempPath = [];
        this.editPathExportDiv = null;
        this.finishEditBtn = null;
    }
    togglePathEditMode() {
        this.isEditingPath = !this.isEditingPath;
        // Passe l'UI derrière le canvas en mode édition
        const uiDiv = document.querySelector('#game-container > div');
        if (this.isEditingPath) {
            this.tempPath = [];
            if (this.ui && typeof this.ui.hideEditPathButton === 'function') this.ui.hideEditPathButton();
            if (uiDiv) uiDiv.style.zIndex = 0;
            // Crée un div pour afficher l'export du chemin
            if (!this.editPathExportDiv) {
                this.editPathExportDiv = document.createElement('div');
                this.editPathExportDiv.style.position = 'absolute';
                this.editPathExportDiv.style.top = '60px';
                this.editPathExportDiv.style.right = '10px';
                this.editPathExportDiv.style.background = 'rgba(0,0,0,0.8)';
                this.editPathExportDiv.style.color = '#fff';
                this.editPathExportDiv.style.padding = '10px';
                this.editPathExportDiv.style.zIndex = 30;
                this.editPathExportDiv.style.maxWidth = '350px';
                this.editPathExportDiv.style.fontSize = '14px';
                this.editPathExportDiv.style.borderRadius = '8px';
                this.editPathExportDiv.style.display = 'none';
                document.getElementById('game-container').appendChild(this.editPathExportDiv);
            }
            this.editPathExportDiv.innerHTML = '';
            this.editPathExportDiv.style.display = 'none';
            // Ajoute bouton "Terminer l'édition"
            if (!this.finishEditBtn) {
                this.finishEditBtn = document.createElement('button');
                this.finishEditBtn.textContent = 'Terminer l\'édition';
                this.finishEditBtn.style.marginTop = '10px';
                this.finishEditBtn.onclick = () => this.finishPathEdit();
            }
            // Ajoute bouton "Effacer le chemin"
            if (!this.clearEditBtn) {
                this.clearEditBtn = document.createElement('button');
                this.clearEditBtn.textContent = 'Effacer le chemin';
                this.clearEditBtn.style.marginTop = '10px';
                this.clearEditBtn.style.marginLeft = '10px';
                this.clearEditBtn.onclick = () => {
                    this.tempPath = [];
                    if (this.editPathExportDiv) this.editPathExportDiv.innerHTML = '';
                };
            }
        } else {
            if (this.ui && typeof this.ui.showEditPathButton === 'function') this.ui.showEditPathButton();
            if (uiDiv) uiDiv.style.zIndex = 10;
            if (this.editPathExportDiv) this.editPathExportDiv.style.display = 'none';
        }
    }

    finishPathEdit() {
        if (this.tempPath.length > 1) {
            // Affiche le code à copier
            const code = `path: [\n${this.tempPath.map(p => `    { col: ${p.col}, row: ${p.row} }`).join(',\n')}\n],`;
            this.editPathExportDiv.innerHTML = `<b>Copie ce code dans Level.js :</b><br><pre style='white-space:pre-wrap;background:#222;color:#fff;padding:8px;border-radius:6px;'>${code}</pre>`;
            this.editPathExportDiv.style.display = '';
            // Ajoute bouton pour quitter
            const quitBtn = document.createElement('button');
            quitBtn.textContent = 'Quitter le mode édition';
            quitBtn.style.marginTop = '10px';
            quitBtn.onclick = () => {
                this.isEditingPath = false;
                if (this.ui && typeof this.ui.showEditPathButton === 'function') this.ui.showEditPathButton();
                if (this.editPathExportDiv) this.editPathExportDiv.style.display = 'none';
            };
            this.editPathExportDiv.appendChild(quitBtn);
        }
    }
    markPathOnGrid() {
        // Marque toutes les cases du chemin comme occupées (2) sur la grille fine
        // (on ne marque plus la grille des tours)
        // Si besoin d'empêcher le placement de tours sur le chemin, il faudra adapter la logique de placement
        // Ici, on ne fait rien pour la grille des tours
    }

    start() {
        this.spawnWave();
        if (this.ui) {
            this.ui.updateWave(this.wave);
            this.ui.updateLives(this.lives);
        }
        this.gameLoop();
    }

    gameLoop() {
        if (!this.running) return;

        this.update();
        this.draw();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update() {
        // Update Enemies
        this.enemies.forEach((enemy, index) => {
            enemy.update();
            if (enemy.hasReachedEnd()) {
                this.enemies.splice(index, 1);
                this.lives--;
                if (this.ui) this.ui.updateLives(this.lives);
                if (this.lives <= 0) {
                    this.endGame(false);
                }
            }
        });

        // Update Towers
        this.towers.forEach(tower => {
            tower.update(this.enemies, (glands) => {
                this.glands += glands;
                if (this.ui) {
                    this.ui.updateGlands(this.glands);
                }
            }, this.projectiles);
        });

        // Update Projectiles
        this.projectiles.forEach((p, pIndex) => {
            p.update();
            if (p.isOffscreen(this.canvas.width, this.canvas.height)) {
                this.projectiles.splice(pIndex, 1);
            } else {
                this.enemies.forEach((enemy, eIndex) => {
                    if (distance(p, enemy) < 10) { // Hit detection
                        enemy.health -= p.damage;
                        this.projectiles.splice(pIndex, 1);
                        if (enemy.health <= 0) {
                            this.enemies.splice(eIndex, 1);
                            this.glands += 5; // Reward for kill
                            if (this.ui) {
                                this.ui.updateGlands(this.glands);
                            }
                        }
                    }
                });
            }
        });


        // Check for next wave
        if (this.enemies.length === 0 && this.wave < this.level.waves.length) {
            this.spawnWave();
            if (this.ui) this.ui.updateWave(this.wave);
        } else if (this.enemies.length === 0 && this.wave >= this.level.waves.length) {
            this.endGame(true);
        }
    }

    draw() {
        // Affiche l'image de fond si chargée, sinon fond vert
        if (this.bgImageLoaded) {
            this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#34673b'; // Forest green background
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Affiche la grille fine en mode édition de chemin
        if (this.isEditingPath) {
            this.ctx.save();
            this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            this.ctx.lineWidth = 1;
            for (let col = 0; col <= this.pathGridCols; col++) {
                this.ctx.beginPath();
                this.ctx.moveTo(col * this.pathGridSize, 0);
                this.ctx.lineTo(col * this.pathGridSize, this.canvas.height);
                this.ctx.stroke();
            }
            for (let row = 0; row <= this.pathGridRows; row++) {
                this.ctx.beginPath();
                this.ctx.moveTo(0, row * this.pathGridSize);
                this.ctx.lineTo(this.canvas.width, row * this.pathGridSize);
                this.ctx.stroke();
            }
            this.ctx.restore();
        }

        // Draw grid as filled cells (checkerboard)
        this.ctx.save();
        for (let col = 0; col < this.gridCols; col++) {
            for (let row = 0; row < this.gridRows; row++) {
                // Checkerboard effect
                if ((col + row) % 2 === 0) {
                    this.ctx.fillStyle = 'rgba(255,255,255,0.07)';
                } else {
                    this.ctx.fillStyle = 'rgba(0,0,0,0.04)';
                }
                this.ctx.fillRect(col * this.gridSize, row * this.gridSize, this.gridSize, this.gridSize);
            }
        }
        this.ctx.restore();

        // Draw ghost tower if needed
        if (this.selectedTower && this.ghost.col !== null && this.ghost.row !== null) {
            const col = this.ghost.col;
            const row = this.ghost.row;
            const centerX = col * this.gridSize + this.gridSize / 2;
            const centerY = row * this.gridSize + this.gridSize / 2;
            let emoji = '';
            if (this.selectedTower === 'shooter') emoji = '🐗';
            if (this.selectedTower === 'digger') emoji = '🐽';
            if (this.selectedTower === 'swamp') emoji = '🐷';
            // Vérifie si la case est valide
            let valid = true;
            if (col < 0 || col >= this.gridCols || row < 0 || row >= this.gridRows) valid = false;
            else if (this.grid[col][row] !== 0) valid = false;
            // Vérifie si une tour est déjà là
            for (const t of this.towers) {
                const tCol = Math.floor(t.x / this.gridSize);
                const tRow = Math.floor(t.y / this.gridSize);
                if (tCol === col && tRow === row) valid = false;
            }
            this.ctx.save();
            this.ctx.globalAlpha = 0.5;
            this.ctx.font = '32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillStyle = valid ? '#0f0' : '#f00';
            this.ctx.fillText(emoji, centerX, centerY);
            this.ctx.restore();
        }

        // Draw path
        this.drawPath();

        // Draw Towers
        this.towers.forEach(tower => tower.draw(this.ctx));

        // Draw Enemies
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        
        // Draw Projectiles
        this.projectiles.forEach(p => p.draw(this.ctx));
    }

    drawPath() {
        this.ctx.save();
        const MAX_SEGMENTS = 500;
        let segmentCount = 0;
        if (this.isEditingPath && this.tempPath.length > 1) {
            // Affiche uniquement le chemin temporaire (édition) sur la grille fine
            for (let i = 0; i < this.tempPath.length - 1; i++) {
                const a = this.tempPath[i];
                const b = this.tempPath[i+1];
                const dCol = Math.sign(b.col - a.col);
                const dRow = Math.sign(b.row - a.row);
                let col = a.col, row = a.row;
                this.ctx.fillStyle = '#e53935';
                this.ctx.fillRect(col * this.pathGridSize, row * this.pathGridSize, this.pathGridSize, this.pathGridSize);
                while ((col !== b.col || row !== b.row) && segmentCount < MAX_SEGMENTS) {
                    if (col !== b.col) col += dCol;
                    else if (row !== b.row) row += dRow;
                    this.ctx.fillRect(col * this.pathGridSize, row * this.pathGridSize, this.pathGridSize, this.pathGridSize);
                    segmentCount++;
                }
                if (segmentCount >= MAX_SEGMENTS) break;
            }
        } else {
            // Affiche le chemin normal (marron) sur la grille fine
            const path = this.level.path;
            for (let i = 0; i < path.length - 1; i++) {
                const a = path[i];
                const b = path[i+1];
                const dCol = Math.sign(b.col - a.col);
                const dRow = Math.sign(b.row - a.row);
                let col = a.col, row = a.row;
                this.ctx.fillStyle = '#b97a56';
                this.ctx.fillRect(col * this.pathGridSize, row * this.pathGridSize, this.pathGridSize, this.pathGridSize);
                while ((col !== b.col || row !== b.row) && segmentCount < MAX_SEGMENTS) {
                    if (col !== b.col) col += dCol;
                    else if (row !== b.row) row += dRow;
                    this.ctx.fillRect(col * this.pathGridSize, row * this.pathGridSize, this.pathGridSize, this.pathGridSize);
                    segmentCount++;
                }
                if (segmentCount >= MAX_SEGMENTS) break;
            }
        }
        this.ctx.restore();
        // Affiche un message si trop de segments
        if (segmentCount >= MAX_SEGMENTS && this.isEditingPath && this.editPathExportDiv) {
            this.editPathExportDiv.innerHTML = `<span style='color:#ff5252'>Chemin trop long ou trop complexe ! (max ${MAX_SEGMENTS} cases affichées)</span><br>` + this.editPathExportDiv.innerHTML;
            this.editPathExportDiv.style.display = '';
        }
    }

    spawnWave() {
        if (this.wave >= this.level.waves.length) return;

        const waveData = this.level.waves[this.wave];
        let spawnDelay = 0;
        Object.keys(waveData).forEach(enemyType => {
            for (let i = 0; i < waveData[enemyType]; i++) {
                // Stagger enemy spawns
                setTimeout(() => {
                    this.enemies.push(new Enemy(enemyType, this.level.path));
                }, spawnDelay);
                spawnDelay += 500; // 0.5s between each enemy
            }
        });

        this.wave++;
    }

    selectTower(towerType) {
        // Coûts réajustés pour l'équilibrage
        const costs = { shooter: 60, digger: 120, swamp: 90 };
        if (this.glands >= costs[towerType]) {
            this.selectedTower = towerType;
            // TODO: feedback visuel
        } else {
            console.log("Pas assez de glands !");
        }
    }

    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (this.isEditingPath) {
            // Snap sur la grille fine pour le chemin
            const pathCol = Math.floor(x / this.pathGridSize);
            const pathRow = Math.floor(y / this.pathGridSize);
            if (pathCol < 0 || pathCol >= this.pathGridCols || pathRow < 0 || pathRow >= this.pathGridRows) return;
            // Ajoute le point au chemin temporaire (évite doublons consécutifs)
            if (this.tempPath.length === 0 || this.tempPath[this.tempPath.length-1].col !== pathCol || this.tempPath[this.tempPath.length-1].row !== pathRow) {
                this.tempPath.push({ col: pathCol, row: pathRow });
            } else {
                // Feedback si doublon
                if (this.editPathExportDiv) {
                    this.editPathExportDiv.innerHTML = `<span style='color:#ff5252'>Point déjà ajouté !</span><br>` + this.editPathExportDiv.innerHTML;
                    this.editPathExportDiv.style.display = '';
                }
            }
            // Affiche le chemin en cours
            if (this.editPathExportDiv) {
                let html = `<b>Points du chemin :</b><br>${this.tempPath.map(p => `[${p.col},${p.row}]`).join(' → ')}<br>`;
                if (this.finishEditBtn) html += this.finishEditBtn.outerHTML;
                if (this.clearEditBtn) html += this.clearEditBtn.outerHTML;
                this.editPathExportDiv.innerHTML = html;
                this.editPathExportDiv.style.display = '';
            }
            return;
        }
        // Placement des tours (grille grosse)
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        if (col < 0 || col >= this.gridCols || row < 0 || row >= this.gridRows) return;

        if (!this.selectedTower) return;

        // Vérifier occupation
        if (this.grid[col][row] !== 0) {
            alert('Impossible de placer une tour ici !');
            if (this.ui) {
                document.querySelectorAll('button.selected').forEach(btn => btn.classList.remove('selected'));
            }
            this.selectedTower = null;
            return;
        }

        // Vérifier qu'il n'y a pas déjà une tour sur cette case
        for (const t of this.towers) {
            const tCol = Math.floor(t.x / this.gridSize);
            const tRow = Math.floor(t.y / this.gridSize);
            if (tCol === col && tRow === row) {
                alert('Case déjà occupée par une tour !');
                if (this.ui) {
                    document.querySelectorAll('button.selected').forEach(btn => btn.classList.remove('selected'));
                }
                this.selectedTower = null;
                return;
            }
        }

        // Centrer la tour sur la case (toujours)
        const centerX = col * this.gridSize + this.gridSize / 2;
        const centerY = row * this.gridSize + this.gridSize / 2;

        const costs = { shooter: 60, digger: 120, swamp: 90 };
        this.glands -= costs[this.selectedTower];
        this.towers.push(new Tower(centerX, centerY, this.selectedTower));
        this.grid[col][row] = 1; // Marque la case comme occupée
        if (this.ui) {
            this.ui.updateGlands(this.glands);
            document.querySelectorAll('button.selected').forEach(btn => btn.classList.remove('selected'));
        }
        this.selectedTower = null;
    }

    handleMouseMove(event) {
        if (!this.selectedTower) {
            this.ghost = { x: null, y: null, col: null, row: null };
            return;
        }
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const col = Math.floor(x / this.gridSize);
        const row = Math.floor(y / this.gridSize);
        // Centre de la case
        const centerX = col * this.gridSize + this.gridSize / 2;
        const centerY = row * this.gridSize + this.gridSize / 2;
        this.ghost = { x: centerX, y: centerY, col, row };
    }

    endGame(win) {
        this.running = false;
        const result = {
            win: win,
            rewards: win ? { reputation: 20, glands: 50 } : { reputation: 0, glands: 0 }
        };
        if (this.onGameEnd) {
            this.onGameEnd(result);
        }
        console.log(win ? "You win!" : "Game Over");
    }
}

export default Game;