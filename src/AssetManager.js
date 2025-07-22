// Centralise le chargement et l'accès aux assets (images, sons...)
export default class AssetManager {
    constructor(scene) {
        this.scene = scene;
    }
    preloadAssets() {
        this.scene.load.image('map', 'src/assets/map.png');
        // Ajouter ici d'autres assets (sons, sprites...)
    }
    // Pour les sons, images, etc. ajouter des méthodes d'accès si besoin
}
