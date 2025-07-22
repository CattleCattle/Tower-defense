// a:/Tower defense/src/ui/ui.js

function createUI(container, game) {
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'relative';
    uiContainer.style.margin = '0 auto';
    uiContainer.style.top = '0';
    uiContainer.style.left = '0';
    uiContainer.style.width = '960px';
    uiContainer.style.display = 'flex';
    uiContainer.style.justifyContent = 'center';
    uiContainer.style.alignItems = 'center';
    uiContainer.style.gap = '30px';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'Arial, sans-serif';
    uiContainer.style.background = 'rgba(30,30,30,0.95)';
    uiContainer.style.borderRadius = '0 0 16px 16px';
    uiContainer.style.padding = '16px 0 12px 0';
    uiContainer.style.zIndex = 10;


    const glandsCounter = document.createElement('div');
    glandsCounter.id = 'glands-counter';
    glandsCounter.innerText = `Glands: ${game.glands}`;

    const waveCounter = document.createElement('div');
    waveCounter.id = 'wave-counter';
    waveCounter.innerText = `Vague : 1`;

    const livesCounter = document.createElement('div');
    livesCounter.id = 'lives-counter';
    livesCounter.innerText = `Vies : 20`;

    const towerButtons = document.createElement('div');
    towerButtons.style.marginTop = '10px';


    // Coûts synchronisés avec Game.js
    const costs = { shooter: 60, digger: 120, swamp: 90 };

    const shooterButton = document.createElement('button');
    shooterButton.innerHTML = `🐗 (${costs.shooter})`;
    shooterButton.onclick = () => select('shooter');

    const diggerButton = document.createElement('button');
    diggerButton.innerHTML = `🐽 (${costs.digger})`;
    diggerButton.onclick = () => select('digger');

    const swampButton = document.createElement('button');
    swampButton.innerHTML = `🐷 (${costs.swamp})`;
    swampButton.onclick = () => select('swamp');

    function select(type) {
        game.selectTower(type);
        [shooterButton, diggerButton, swampButton].forEach(btn => btn.classList.remove('selected'));
        if (type === 'shooter') shooterButton.classList.add('selected');
        if (type === 'digger') diggerButton.classList.add('selected');
        if (type === 'swamp') swampButton.classList.add('selected');
    }



    // Ajout du bouton d'édition de chemin
    const editPathButton = document.createElement('button');
    editPathButton.textContent = 'Éditer le chemin';
    editPathButton.style.marginLeft = '20px';
    editPathButton.onclick = () => {
        if (typeof game.togglePathEditMode === 'function') {
            game.togglePathEditMode();
        } else {
            alert('Mode édition de chemin non disponible.');
        }
    };

    towerButtons.append(shooterButton, diggerButton, swampButton, editPathButton);
    uiContainer.append(glandsCounter, waveCounter, livesCounter, towerButtons);
    // Place l'UI sous le canvas
    if (container.querySelector('canvas')) {
        container.appendChild(uiContainer);
    } else {
        container.append(uiContainer);
    }

    return {
        updateGlands: (glands) => {
            glandsCounter.innerText = `Glands: ${glands}`;
            shooterButton.disabled = glands < costs.shooter;
            diggerButton.disabled = glands < costs.digger;
            swampButton.disabled = glands < costs.swamp;
        },
        updateWave: (wave) => {
            waveCounter.innerText = `Vague : ${wave}`;
        },
        updateLives: (lives) => {
            livesCounter.innerText = `Vies : ${lives}`;
        },
        showEditPathButton: () => {
            editPathButton.style.display = '';
        },
        hideEditPathButton: () => {
            editPathButton.style.display = 'none';
        }
    };
// Style pour le bouton sélectionné
const style = document.createElement('style');
style.innerHTML = `
button.selected {
    outline: 3px solid #fff200;
    background: #444;
    color: #fff200;
}`;
document.head.appendChild(style);
}

export { createUI };
