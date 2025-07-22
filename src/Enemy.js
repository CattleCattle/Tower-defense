import { distance } from './utils/helpers.js';

class Enemy {
    constructor(type, path) {
        this.type = type;
        this.path = path;
        this.pathIndex = 0;
        // Grille fine : 32x18, case = 30px
        this.gridSize = 30;
        // On part du centre de la première case fine
        this.x = path[0].col * this.gridSize + this.gridSize / 2;
        this.y = path[0].row * this.gridSize + this.gridSize / 2;
        this.emoji = '';
        this.speed = 0;
        this.health = 0;
        this.isSlowed = false;

        switch (type) {
            case 'bramble':
                this.emoji = '🌿';
                this.speed = 0.9; // lent
                this.health = 16; // résistant
                break;
            case 'swarm':
                this.emoji = '🐝';
                this.speed = 2.2; // rapide
                this.health = 6; // fragile
                break;
            case 'mist':
                this.emoji = '🌫️';
                this.speed = 1.3; // intermédiaire
                this.health = 12; // moyenne
                break;
        }
    }

    update(dt = 1) {
        const target = this.path[this.pathIndex];
        if (!target) return;
        // Vise le centre de la case fine cible
        const tx = target.col * this.gridSize + this.gridSize / 2;
        const ty = target.row * this.gridSize + this.gridSize / 2;
        const dx = tx - this.x;
        const dy = ty - this.y;
        const dist = distance({x: this.x, y: this.y}, {x: tx, y: ty});

        // Brume insensible au ralentissement
        let currentSpeed = this.speed;
        if (this.type !== 'mist' && this.isSlowed) {
            currentSpeed = this.speed * 0.5;
        }
        currentSpeed *= dt;

        if (dist < currentSpeed) {
            this.pathIndex++;
        } else {
            this.x += (dx / dist) * currentSpeed;
            this.y += (dy / dist) * currentSpeed;
        }
    }

    draw(ctx) {
        ctx.font = '20px Arial';
        ctx.fillText(this.emoji, this.x - 10, this.y + 10); // Center emoji
        
        // Health bar
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x - 15, this.y - 15, 30, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x - 15, this.y - 15, 30 * (this.health / this.getMaxHealth()), 5);
    }

    getMaxHealth() {
        switch (this.type) {
            case 'bramble': return 16;
            case 'swarm': return 6;
            case 'mist': return 12;
            default: return 1;
        }
    }

    hasReachedEnd() {
        return this.pathIndex >= this.path.length;
    }
}

export default Enemy;