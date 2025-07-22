// Classe Projectile pour Tower Defense
export default class Projectile {
    constructor(scene, x, y, target, config) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.target = target;
        this.speed = config.speed;
        this.damage = config.damage;
        this.hasHit = false;
        this.distanceTraveled = 0;
        if (config.emoji) {
            this.sprite = scene.add.text(x, y, config.emoji, { font: '24px Arial' }).setOrigin(0.5);
        } else {
            this.sprite = scene.add.circle(x, y, 4, config.color || 0xffff00);
        }
    }

    update(deltaMs) {
        if (this.hasHit) return;
        const deltaSeconds = deltaMs / 1000;
        const dx = this.target.sprite.x - this.x;
        const dy = this.target.sprite.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 10) {
            this.hasHit = true;
            return;
        }
        const moveDistance = this.speed * deltaSeconds;
        this.x += (dx / distance) * moveDistance;
        this.y += (dy / distance) * moveDistance;
        this.distanceTraveled += moveDistance;
        this.sprite.setPosition(this.x, this.y);
    }

    destroy() {
        if (this.sprite) this.sprite.destroy();
    }
}
