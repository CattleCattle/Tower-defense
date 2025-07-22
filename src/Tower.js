import { distance } from './utils/helpers.js';
import Projectile from './Projectile.js';

class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.emoji = '';
        this.range = 0;
        this.cooldown = 0;
        this.lastActionTime = 0;

        switch (type) {
            case 'shooter':
                this.emoji = '🐗';
                this.range = 170; // portée augmentée
                this.cooldown = 900; // tir plus rapide
                break;
            case 'digger':
                this.emoji = '🐽';
                this.range = 0;
                this.cooldown = 4000; // génère plus souvent
                break;
            case 'swamp':
                this.emoji = '🐷';
                this.range = 110; // zone un peu plus large
                this.cooldown = 100; // ralentit en continu
                break;
        }
    }

    update(enemies, addGlands, projectiles) {
        const now = Date.now();
        if (now - this.lastActionTime < this.cooldown) {
            return;
        }

        this.lastActionTime = now;

        switch (this.type) {
            case 'shooter':
                const target = this.findTarget(enemies);
                if (target) {
                    projectiles.push(new Projectile(this.x, this.y, target));
                }
                break;
            case 'digger':
                addGlands(10); // Generate 10 glands
                break;
            case 'swamp':
                this.slowEnemies(enemies);
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