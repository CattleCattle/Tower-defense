// Classe Enemy pour Tower Defense
export default class Enemy {
    constructor(scene, type, path, config) {
        this.scene = scene;
        this.type = type;
        this.path = path;
        this.pathIndex = 0;
        this.progress = 0;
        this.speed = config.speed;
        this.health = config.health;
        this.maxHealth = config.health;
        this.isSlowed = false;
        this.emoji = config.emoji;
        const start = path[0];
        this.sprite = scene.add.text(
            start.col * config.pathGridSize + config.pathGridSize / 2,
            start.row * config.pathGridSize + config.pathGridSize / 2,
            config.emoji,
            { font: '24px Arial' }
        ).setOrigin(0.5);

        // Ajout de la barre de vie
        this.healthBarBg = scene.add.graphics();
        this.healthBar = scene.add.graphics();
        this.updateHealthBar();
    }

    updateHealthBar() {
        const width = 24;
        const height = 4;
        const x = this.sprite.x - width / 2;
        const y = this.sprite.y - 20;
        // Fond
        this.healthBarBg.clear();
        this.healthBarBg.fillStyle(0x333333, 1);
        this.healthBarBg.fillRect(x, y, width, height);
        // Barre de vie
        this.healthBar.clear();
        const percent = Math.max(0, this.health / this.maxHealth);
        const color = percent > 0.3 ? 0x00ff00 : 0xff0000;
        this.healthBar.fillStyle(color, 1);
        this.healthBar.fillRect(x, y, width * percent, height);
    }

    update(deltaMs) {
        // Déplacement et gestion de la progression sur le chemin à implémenter dans la scène
        // La position de la barre de vie sera mise à jour dans updateEnemy côté scène
        this.updateHealthBar();
    }

    takeDamage(amount) {
        this.health -= amount;
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
    }
}
