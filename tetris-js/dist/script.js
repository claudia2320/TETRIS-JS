// Define shorthand for jQuery
var $ = jQuery;

// Class representing a position on the board
class Position {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

// Class representing a single block in a shape
class Block {
  constructor(x, y, colorClass) {
    this.x = x; // Vertical position
    this.y = y; // Horizontal position
    this.colorClass = colorClass; // Color style class for block

    // Create HTML element for the block
    let block = document.createElement("div");
    block.className = "block " + this.colorClass;
    block.innerHTML = "<div class='inner-tile'><div class='inner-inner-tile'></div></div>";
    this.element = block;
  }

  // Add block to the board
  init() {
    $("#board").append(this.element);
  }

  // Set the visual position of the block based on its coordinates
  render() {
    $(this.element).css({
      left: this.y * $(this.element).innerWidth() + "px",
      top: this.x * $(this.element).innerHeight() + "px"
    });
  }

  // Move block down by one row
  fall() {
    this.x += 1;
  }

  // Move block right
  moveRight() {
    this.y += 1;
  }

  // Move block left
  moveLeft() {
    this.y -= 1;
  }

  // Return position to the right of the current block
  rightPosition() {
    return new Position(this.x, this.y + 1);
  }

  // Return position to the left of the current block
  leftPosition() {
    return new Position(this.x, this.y - 1);
  }

  // Get the current position of the block
  getPosition() {
    return new Position(this.x, this.y);
  }

  // Trigger flash animation using Animate.css
  flash() {
    return window.animatelo.flash(this.element, {
      duration: 500
    });
  }

  // Remove block from DOM
  destroy() {
    $(this.element).remove();
  }
}

// Class for handling Tetris shapes (generic)
class Shape {
  constructor(blocks) {
    this.blocks = blocks;
  }

  getBlocks() {
    return Array.from(this.blocks);
  }

  init() {
    for (let block of this.blocks) {
      block.init();
    }
  }

  render() {
    for (let block of this.blocks) {
      block.render();
    }
  }

  // Get all positions after falling one unit
  fallingPositions() {
    return this.blocks
      .map(b => b.getPosition())
      .map(p => new Position(p.x + 1, p.y));
  }

  // Move all blocks down by one row
  fall() {
    for (let block of this.blocks) {
      block.fall();
    }
  }

  // Get positions if moved to the right
  rightPositions() {
    return this.blocks.map(b => b.rightPosition());
  }

  // Get positions if moved to the left
  leftPositions() {
    return this.blocks.map(b => b.leftPosition());
  }

  // Move all blocks right
  moveRight() {
    for (let block of this.blocks) {
      block.moveRight();
    }
  }

  // Move all blocks left
  moveLeft() {
    for (let block of this.blocks) {
      block.moveLeft();
    }
  }

  // Remove all blocks
  clear() {
    for (let block of this.blocks) {
      block.destroy();
    }
    this.blocks = [];
  }

  // Add new blocks to the shape
  addBlocks(blocks) {
    for (let block of blocks) {
      this.blocks.push(block);
    }
  }

  // Rotation methods to be overridden by subclasses
  rotate() {}

  rotatePositions() {}
}

// Define specific shape subclasses (e.g. Square, LShape, etc.)
// Each shape has its unique block configuration and rotation logic

// (Classes Square, LShape, TShape, ZShape, Line follow here)
// They override rotate() and rotatePositions() methods appropriately
// Use block coordinates to define shapes and update them on rotation

// The rest of the code defines the Board class and game logic
// Including shape spawning, game loop, rendering, movement, etc.

// Keyboard input handling and button events for gameplay controls

// Create new Board instance
let board = new Board();

// Handle keyboard input for movement and game controls
$(document).keydown(function(e) {
  switch (e.which) {
    case 37: // left arrow
      board.leftKeyPress();
      break;
    case 38: // up arrow
      board.upKeyPress();
      break;
    case 39: // right arrow
      board.rightKeyPress();
      break;
    case 40: // down arrow
      board.downKeyPress();
      break;
    case 78: // 'n' key for new game
      board.newGame();
      break;
    default:
      console.log(e.which);
      break;
  }
  e.preventDefault();
});

// Button click events for UI controls
$("#new-game").click(function() {
  board.newGame();
});

$("#down").click(function() {
  board.downKeyPress();
});

$("#rotate").click(function() {
  board.upKeyPress();
});

$("#left").click(function() {
  board.leftKeyPress();
});

$("#right").click(function() {
  board.rightKeyPress();
});
