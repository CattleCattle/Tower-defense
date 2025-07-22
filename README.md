# Sanglier Idle - Tower Defense Module

This is a tower defense mini-game module designed to be integrated into the main "Sanglier Idle" web game.

## How to Integrate

1.  **Import the main function:**

    ```javascript
    import { initTowerDefense } from './path/to/your/td-game/main.js'; 
    ```

2.  **Prepare a container element:**

    The game needs a container element in your HTML to create the canvas inside.

    ```html
    <div id="tower-defense-container" style="position: relative;"></div>
    ```

3.  **Initialize the game:**

    Call `initTowerDefense` with the container element and a callback function. The callback will be executed when the game ends.

    ```javascript
    const container = document.getElementById('tower-defense-container');

    function handleGameEnd(result) {
        console.log('Game Over!', result);
        // result will be { win: true/false, rewards: { ... } }
        // Here you can give the rewards to the player in the main game.
    }

    initTowerDefense(container, handleGameEnd);
    ```

## Project Structure

```
src/
  Game.js       # Main game logic
  Tower.js      # Tower class and behaviors
  Enemy.js      # Enemy class and behaviors
  Level.js      # Level data (paths, waves)
  ui/
    ui.js       # UI elements (buttons, counters)
  utils/
    helpers.js  # Utility functions
main.js         # Entry point, exports initTowerDefense
```
