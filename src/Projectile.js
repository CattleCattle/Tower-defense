import { distance } from "./utils/helpers.js";

class Projectile {
    constructor(startX, startY, target) {
        this.x = startX;
        this.y = startY;
        this.target = target;
        this.speed = 5;
        this.damage = 8;
        this.emoji = '🌰';
    }

    update() {
        if (!this.target || this.target.health <= 0) {
            // Simple projectile, continues straight if target is gone
            // A more advanced version would retarget or fizzle.
            // For now, let's just make it disappear to avoid errors.
            this.x = -1000; // Effectively remove it
            return;
        }
        
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = distance(this, this.target);

        if (dist < this.speed) {
            // Hit logic is in Game.js to handle enemy health and removal
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    draw(ctx) {
        ctx.font = '15px Arial';
        ctx.fillText(this.emoji, this.x, this.y);
    }

    isOffscreen(width, height) {
        return this.x < 0 || this.x > width || this.y < 0 || this.y > height;
    }
}

export default Projectile;
