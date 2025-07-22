import { distance } from './utils/helpers.js';
import Projectile from './Projectile.js';


class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.emoji = '';
        this.range = 0;
        this.cooldown = 0; // cooldown duration in ms
        this.cooldownTimer = 0; // time left until next action (in ms)

        switch (type) {
            case 'shooter':
                this.emoji = '🐗';
                this.range = 170;
                this.cooldown = 900;
                break;
            case 'digger':
                this.emoji = '🐽';
                this.range = 0;
                this.cooldown = 4000;
                break;
            case 'swamp':
                this.emoji = '🐷';
                this.range = 110;
                this.cooldown = 100;
                break;
        }
        this.cooldownTimer = 0;
    }

    /**
     * @param {Array} enemies
     * @param {Function} addGlands
     * @param {Array} projectiles
     * @param {number} dt - time delta in ms (scaled by game speed)
     */
    update(enemies, addGlands, projectiles, dt = 16.67) {
        // dt is in ms, default to 16.67ms (1 frame at 60fps)
        this.cooldownTimer -= dt;
        if (this.cooldownTimer > 0) {
            // Not ready to act
            if (this.type === 'swamp') {
                // Swamp applies slow every frame
                this.slowEnemies(enemies);
            }
            return;
        }

        // Ready to act
        switch (this.type) {
            case 'shooter': {
                const target = this.findTarget(enemies);
                if (target) {
                    projectiles.push(new Projectile(this.x, this.y, target));
                    this.cooldownTimer = this.cooldown;
                } else {
                    // No target, try again next frame
                    this.cooldownTimer = 0;
                }
                break;
            }
            case 'digger':
                addGlands(10);
                this.cooldownTimer = this.cooldown;
                break;
            case 'swamp':
                this.slowEnemies(enemies);
                this.cooldownTimer = this.cooldown;
                break;
        }
    }

    findTarget(enemies) {
        let closestEnemy = null;
        let minDistance = this.range;

        enemies.forEach(enemy => {
            const dist = distance(this, enemy);
            if (dist < minDistance) {
                minDistance = dist;
                closestEnemy = enemy;
            }
        });
        return closestEnemy;
    }

    slowEnemies(enemies) {
        enemies.forEach(enemy => {
            if (enemy.type !== 'mist') { // Mist is immune
                const dist = distance(this, enemy);
                if (dist < this.range) {
                    enemy.isSlowed = true;
                } else {
                    enemy.isSlowed = false; // Reset if out of range
                }
            }
        });
    }

    draw(ctx) {
        // Dessine un fond discret pour la case occupée
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(this.x - 25, this.y - 25, 50, 50);
        ctx.restore();

        // Centre parfaitement l'emoji dans la case
        ctx.save();
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, this.x, this.y);
        ctx.restore();

        // Draw range indicator for shooter and swamp towers
        if (this.type === 'shooter' || this.type === 'swamp') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();
        }
    }
}

export default Tower;