// Gère la logique d'upgrade des tours
export default class UpgradeManager {
    constructor() {}
    getUpgradeCost(tower) {
        return 50 + 50 * (tower.level || 1);
    }
    canUpgrade(tower, glands) {
        return glands >= this.getUpgradeCost(tower);
    }
    upgrade(tower) {
        tower.level = (tower.level || 1) + 1;
        tower.damage = (tower.damage || 1) + 1;
        tower.range = (tower.range || 100) + 10;
        // Ajouter d'autres effets d'upgrade ici
    }
}
