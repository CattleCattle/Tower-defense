// UIManager centralise la gestion de l'interface du jeu (textes, boutons, achats, upgrades, etc.)
export default class UIManager {
    constructor(scene) {
        this.scene = scene;
        // Textes ressources
        this.glandsText = scene.add.text(20, 20, '', this.textStyle()).setDepth(100);
        this.livesText = scene.add.text(20, 50, '', this.textStyle()).setDepth(100);
        this.waveText = scene.add.text(20, 80, '', this.textStyle()).setDepth(100);
        // Boutons tours
        this.towerButtons = [];
        // Bouton vague suivante
        this.nextWaveButton = null;
        // Bouton vendre
        this.sellButton = null;
        // Callbacks externes
        this.onBuy = null;
        this.onSell = null;
        this.onNextWave = null;
        this.onUpgrade = null;
    }

    textStyle() {
        return {
            font: 'bold 18px Arial',
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 8, y: 4 }
        };
    }

    setGlands(value) {
        this.glandsText.setText(`Glands: ${value}`);
    }
    setLives(value) {
        this.livesText.setText(`Vies: ${value}`);
    }
    setWave(value) {
        this.waveText.setText(`Wave: ${value}`);
    }

    createTowerButtons(towerTypes, startX, y, spacing) {
        this.towerButtons.forEach(btn => btn.destroy());
        this.towerButtons = [];
        towerTypes.forEach((info, i) => {
            const btn = this.scene.add.text(startX + i * spacing, y, info.label, {
                font: '16px Arial',
                color: '#fff',
                backgroundColor: '#444',
                padding: { x: 10, y: 5 }
            }).setOrigin(0.5).setInteractive().setDepth(100);
            btn.on('pointerdown', () => this.onBuy && this.onBuy(info.type));
            this.towerButtons.push({ button: btn, type: info.type });
        });
    }

    updateTowerButtonsAffordability(glands, getTowerInfoCallback) {
        this.towerButtons.forEach(btnInfo => {
            const towerInfo = getTowerInfoCallback(btnInfo.type);
            if (towerInfo) {
                const canAfford = glands >= towerInfo.cost;
                btnInfo.button.setTint(canAfford ? 0xffffff : 0x666666);
                btnInfo.button.setAlpha(canAfford ? 1.0 : 0.6);
            }
        });
    }

    createNextWaveButton(x, y, callback) {
        if (this.nextWaveButton) this.nextWaveButton.destroy();
        this.nextWaveButton = this.scene.add.text(x, y, 'Vague Suivante', {
            font: '20px Arial', fill: '#fff', backgroundColor: '#000'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(200);
        if (callback) {
            this.nextWaveButton.on('pointerdown', callback);
        }
    }

    createSellButton(x, y) {
        if (this.sellButton) this.sellButton.destroy();
        this.sellButton = this.scene.add.text(x, y, 'Vendre Tour', {
            font: '20px Arial', fill: '#fff', backgroundColor: '#555'
        }).setPadding(10).setInteractive().setDepth(100);
        this.sellButton.on('pointerdown', () => this.onSell && this.onSell());
    }

    // Pour upgrades, à compléter selon besoins
    createUpgradeButton(x, y, label) {
        const btn = this.scene.add.text(x, y, label, {
            font: '16px Arial', color: '#fff', backgroundColor: '#228', padding: { x: 10, y: 5 }
        }).setOrigin(0.5).setInteractive().setDepth(100);
        btn.on('pointerdown', () => this.onUpgrade && this.onUpgrade());
        return btn;
    }

    createSpeedSlider(x, y, initialSpeed = 1) {
        if (this.speedSlider) this.speedSlider.destroy();
        const speeds = [1, 2, 3, 4];
        this.currentSpeed = initialSpeed;
        this.speedSlider = this.scene.add.container(x, y);
        this.speedSlider.setDepth(200);
        const label = this.scene.add.text(0, 0, 'Vitesse', { font: '16px Arial', color: '#fff', backgroundColor: '#228', padding: { x: 8, y: 2 } }).setOrigin(1, 0).setDepth(201);
        this.speedSlider.add(label);
        const sliderY = 28;
        const sliderW = 120;
        const sliderH = 18;
        const sliderBg = this.scene.add.graphics();
        sliderBg.fillStyle(0x222a38, 0.8);
        sliderBg.fillRoundedRect(-sliderW, sliderY, sliderW, sliderH, 8);
        sliderBg.setDepth(200);
        this.speedSlider.add(sliderBg);
        // Créer les 4 steps
        this.speedSlider.steps = [];
        speeds.forEach((s, i) => {
            const stepX = -sliderW + (i * (sliderW / 3));
            const circle = this.scene.add.circle(stepX, sliderY + sliderH/2, 10, s === this.currentSpeed ? 0x00c3ff : 0x888888, 1).setDepth(201);
            circle.setInteractive({ useHandCursor: true });
            circle.on('pointerdown', () => {
                this.currentSpeed = s;
                this.speedSlider.steps.forEach((c, j) => c.setFillStyle(j+1 === s ? 0x00c3ff : 0x888888, 1));
                if (this.onSpeedChange) this.onSpeedChange(s);
            });
            this.speedSlider.add(circle);
            this.speedSlider.steps.push(circle);
            const txt = this.scene.add.text(stepX, sliderY + sliderH/2 + 13, `×${s}`, { font: '13px Arial', color: '#fff' }).setOrigin(0.5, 0).setDepth(201);
            this.speedSlider.add(txt);
        });
        this.speedSlider.setSize(sliderW, sliderY + sliderH + 30);
        this.speedSlider.setInteractive(new Phaser.Geom.Rectangle(-sliderW, 0, sliderW, sliderY + sliderH + 30), Phaser.Geom.Rectangle.Contains);
    }
}
