// Gère la progression et le spawn des vagues d'ennemis
export default class WaveManager {
    constructor(scene, level) {
        this.scene = scene;
        this.level = level;
        this.currentWave = 0;
        this.inProgress = false;
        this.spawnQueue = [];
        this.spawnIndex = 0;
        this.elapsedGameTime = 0;
        this.spawnDelay = 700; // ms de base
        this.callback = null;
    }

    startNextWave(callback) {
        this.currentWave++;
        this.inProgress = true;
        this.callback = callback;
        const waveConfig = this.level.waves[this.currentWave - 1] || this.level.waves[this.level.waves.length - 1];
        this.spawnQueue = [];
        this.spawnIndex = 0;
        this.elapsedGameTime = 0;
        if (waveConfig) {
            Object.keys(waveConfig).forEach(type => {
                for (let i = 0; i < waveConfig[type]; i++) this.spawnQueue.push(type);
            });
        }
    }

    update(deltaMs) {
        if (!this.inProgress || this.spawnIndex >= this.spawnQueue.length) return;
        // On incrémente le temps de jeu écoulé (en temps de jeu, PAS multiplié par gameSpeed)
        this.elapsedGameTime += deltaMs;
        // Calculer combien d'ennemis auraient dû être spawnés
        const shouldHaveSpawned = Math.floor(this.elapsedGameTime / this.spawnDelay);
        while (this.spawnIndex < shouldHaveSpawned && this.spawnIndex < this.spawnQueue.length) {
            if (this.callback) this.callback(this.spawnQueue[this.spawnIndex]);
            this.spawnIndex++;
        }
    }

    isWaveInProgress() {
        return this.inProgress;
    }

    endWave() {
        this.inProgress = false;
        this.spawnQueue = [];
        this.spawnIndex = 0;
        this.elapsedGameTime = 0;
    }
}
