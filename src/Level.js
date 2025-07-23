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
        // Vague 1
        { 'rat_basic': 8 },
        // Vague 2
        { 'rat_basic': 10 },
        // Vague 3
        { 'rat_basic': 9, 'rat_fast': 3 },
        // Vague 4
        { 'rat_basic': 9, 'rat_fast': 4 },
        // Vague 5
        { 'rat_basic': 9, 'rat_fast': 5 },
        // Vague 6
        { 'rat_basic': 6, 'rat_fast': 4, 'rat_tank': 2 },
        // Vague 7
        { 'rat_basic': 4, 'rat_fast': 4, 'rat_tank': 3 },
        // Vague 8
        { 'rat_basic': 2, 'rat_fast': 6, 'rat_tank': 4 },
        // Vague 9
        { 'rat_basic': 2, 'rat_fast': 4, 'rat_tank': 3, 'rat_poison': 3 },
        // Vague 10
        { 'rat_basic': 3, 'rat_fast': 5, 'rat_tank': 3, 'rat_poison': 3 },
        // Vague 11
        { 'rat_basic': 3, 'rat_fast': 3, 'rat_tank': 3, 'rat_poison': 3, 'rat_vole': 2 },
        // Vague 12
        { 'rat_basic': 3, 'rat_fast': 3, 'rat_tank': 3, 'rat_poison': 3, 'rat_vole': 3 },
        // Vague 13
        { 'rat_basic': 2, 'rat_fast': 2, 'rat_tank': 2, 'rat_poison': 2, 'rat_vole': 2, 'rat_gros': 1, 'rat_fouisseur': 2 },
        // Vague 14
        { 'rat_basic': 2, 'rat_fast': 2, 'rat_tank': 2, 'rat_poison': 2, 'rat_vole': 2, 'rat_gros': 2, 'rat_fouisseur': 2 },
        // Vague 15
        { 'rat_basic': 2, 'rat_fast': 3, 'rat_tank': 2, 'rat_poison': 2, 'rat_vole': 2, 'rat_gros': 2, 'rat_fouisseur': 2, 'rat_rapide': 2, 'rat_boss': 1 },
    ]
};

// Correction : vérification de la validité du path (grille fine 32x18)
level1.path = level1.path.filter(p =>
    Number.isInteger(p.col) && Number.isInteger(p.row) &&
    p.col >= 0 && p.col < 32 && p.row >= 0 && p.row < 18
);

export { level1 };
