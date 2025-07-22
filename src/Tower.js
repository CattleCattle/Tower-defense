import Projectile from './Projectile.js';
// Classe Tower pour Tower Defense
export default class Tower {
    static LEVELS = [
        { damage: 1, range: 170, cooldown: 900, cost: 60 },
        { damage: 2, range: 170, cooldown: 850, cost: 90 },
        { damage: 3, range: 180, cooldown: 800, cost: 130 },
        { damage: 4, range: 190, cooldown: 750, cost: 180 },
        { damage: 6, range: 200, cooldown: 700, cost: 250 },
        { damage: 8, range: 210, cooldown: 650, cost: 350 },
        { damage: 11, range: 220, cooldown: 600, cost: 500 },
    ];

    constructor(scene, type, col, row, config) {
        this.scene = scene;
        this.type = type;
        this.col = col;
        this.row = row;
        this.x = col * config.gridSize + config.gridSize / 2;
        this.y = row * config.gridSize + config.gridSize / 2;
        this.range = config.range;
        this.cooldown = config.cooldown;
        this.level = 1;
        this.cooldownTimer = 0;
        this.targetPriority = config.targetPriority || 'first'; // 'first', 'last', 'strong', 'weak', 'close', 'far'
        // Affiche uniquement l'emoji de la tour
        this.sprite = scene.add.text(this.x, this.y, config.emoji, { font: '32px Arial' }).setOrigin(0.5);
        // Ajoute le niveau en petit en bas à droite
        this.levelText = scene.add.text(this.x + 14, this.y + 14, this.level.toString(), { font: '14px Arial', color: '#fff', backgroundColor: '#222', padding: { x: 2, y: 0 } }).setOrigin(0, 0);
        this.projectiles = [];
        // On prend la couleur et la vitesse du projectile du config, mais damage dépend du level
        this.projectileConfig = config.projectileConfig || { speed: 300, color: 0xffff00 };
        this.damage = Tower.LEVELS[0].damage;
    }

    update(deltaMs, enemies, hitCallback) {
        this.cooldownTimer -= deltaMs;
        // Met à jour la position du niveau si la tour bouge (sécurité)
        if (this.sprite && this.levelText) {
            this.levelText.setPosition(this.sprite.x + 14, this.sprite.y + 14);
        }

        // Tir automatique si cooldown écoulé et cible trouvée
        if (this.cooldownTimer <= 0 && this.range > 0) {
            const target = this.scene.findTarget(this);
            if (target) {
                this.shoot(target);
                this.cooldownTimer = this.cooldown;
            }
        }

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.update(deltaMs);
            // Collision check
            if (projectile.hasHit || projectile.distanceTraveled > 500) {
                if (projectile.hasHit && hitCallback) {
                    hitCallback(projectile, enemies);
                }
                projectile.destroy();
                this.projectiles.splice(i, 1);
            }
        }
    }

    shoot(target) {
        // On passe les dégâts actuels à la config du projectile
        const config = { ...this.projectileConfig, damage: this.damage };
        const projectile = new Projectile(this.scene, this.x, this.y, target, config);
        this.projectiles.push(projectile);
    }

    canUpgrade() {
        return this.level < Tower.LEVELS.length;
    }

    getUpgradeCost() {
        if (!this.canUpgrade()) return null;
        return Tower.LEVELS[this.level].cost;
    }

    upgrade() {
        if (!this.canUpgrade()) return false;
        this.level++;
        const lvl = Tower.LEVELS[this.level - 1];
        this.damage = lvl.damage;
        this.range = lvl.range;
        this.cooldown = lvl.cooldown;
        if (this.levelText) this.levelText.setText(this.level.toString());
        return true;
    }

    showRangeCircle() {
        if (!this.rangeCircle) {
            this.rangeCircle = this.scene.add.circle(this.x, this.y, this.range, 0x00c3ff, 0.18).setStrokeStyle(2, 0x00c3ff, 0.5).setDepth(1);
        } else {
            this.rangeCircle.setVisible(true);
            this.rangeCircle.setRadius(this.range);
            this.rangeCircle.setPosition(this.x, this.y);
        }
    }
    hideRangeCircle() {
        if (this.rangeCircle) {
            this.rangeCircle.setVisible(false);
        }
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.levelText) this.levelText.destroy();
        if (this.rangeCircle) this.rangeCircle.destroy();
        this.projectiles.forEach(p => p.destroy());
        this.projectiles = [];
    }
}
