// a:/Tower defense/src/Level.js

const level1 = {
    // Chemin défini par des cases de grille (col, row)
path: [
    { col: 6, row: 17 },
    { col: 6, row: 16 },
    { col: 5, row: 15 },
    { col: 5, row: 14 },
    { col: 5, row: 13 },
    { col: 6, row: 12 },
    { col: 7, row: 11 },
    { col: 7, row: 10 },
    { col: 6, row: 9 },
    { col: 5, row: 8 },
    { col: 4, row: 7 },
    { col: 4, row: 6 },
    { col: 5, row: 5 },
    { col: 6, row: 4 },
    { col: 7, row: 4 },
    { col: 12, row: 4 },
    { col: 13, row: 5 },
    { col: 13, row: 6 },
    { col: 13, row: 7 },
    { col: 12, row: 8 },
    { col: 11, row: 9 },
    { col: 11, row: 10 },
    { col: 11, row: 11 },
    { col: 13, row: 12 },
    { col: 18, row: 12 },
    { col: 20, row: 11 },
    { col: 22, row: 10 },
    { col: 24, row: 10 },
    { col: 26, row: 10 },
    { col: 27, row: 11 },
    { col: 27, row: 13 },
    { col: 26, row: 14 },
    { col: 24, row: 15 },
    { col: 23, row: 16 },
    { col: 23, row: 17 }
],
    waves: [
        // Vague 1 : facile, que des brambles
        { 'bramble': 8, 'swarm': 0, 'mist': 0 },
        // Vague 2 : introduction des swarms
        { 'bramble': 10, 'swarm': 4, 'mist': 0 },
        // Vague 3 : plus de swarms
        { 'bramble': 8, 'swarm': 8, 'mist': 0 },
        // Vague 4 : apparition de la brume
        { 'bramble': 6, 'swarm': 8, 'mist': 2 },
        // Vague 5 : brume plus présente
        { 'bramble': 4, 'swarm': 8, 'mist': 4 },
        // Vague 6 : finale, mélange difficile
        { 'bramble': 6, 'swarm': 10, 'mist': 6 },
    ]
};

// Correction : vérification de la validité du path (grille fine 32x18)
level1.path = level1.path.filter(p =>
    Number.isInteger(p.col) && Number.isInteger(p.row) &&
    p.col >= 0 && p.col < 32 && p.row >= 0 && p.row < 18
);

export { level1 };
