
// You can write more code here

/* START OF COMPILED CODE */

class game extends Phaser.Scene {

	preload() {
		if (!this.textures.exists('map')) {
			this.load.image('map', 'assets/map.png');
		}
	}
	constructor() {
		super("game");

		/* START-USER-CTR-CODE */
		// Write your code here.
		/* END-USER-CTR-CODE */
	}

	/** @returns {void} */
	editorCreate() {

		// map
		this.add.image(402, 261, "map");

		this.events.emit("scene-awake");
	}

	/* START-USER-CODE */

	// Write your code here

	create() {

		this.editorCreate();
	}

	/* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
