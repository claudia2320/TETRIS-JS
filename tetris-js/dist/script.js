// Tetris Game JavaScript - With Rotation Support

// jQuery alias
var $ = jQuery;

// Class to represent grid positions
class Position {
  constructor(x, y) {
    this.x = x; // Row index
    this.y = y; // Column index
  }
}

// Class to represent a single block in the game
class Block {
  constructor(x, y, colorClass) {
    this.x = x;
    this.y = y;
    this.colorClass = colorClass;

    // Create the HTML for the block
    let block = document.createElement("div");
    block.className = "block " + this.colorClass;
    block.innerHTML = "<div class='inner-tile'><div class='inner-inner-tile'></div></div>";
    this.element = block;
  }

  // Add block to the board
  init() {
    $("#board").append(this.element);
  }

  // Update block position visually on screen
  render() {
    $(this.element).css({
      left: this.y * $(this.element).innerWidth() + "px",
      top: this.x * $(this.element).innerHeight() + "px"
    });
  }

  // Movement methods
  fall() { this.x += 1; }
  moveRight() { this.y += 1; }
  moveLeft() { this.y -= 1; }

  // Position helpers
  rightPosition() { return new Position(this.x, this.y + 1); }
  leftPosition() { return new Position(this.x, this.y - 1); }
  getPosition() { return new Position(this.x, this.y); }

  // Animation and destruction
  flash() { return window.animatelo.flash(this.element, { duration: 500 }); }
  destroy() { $(this.element).remove(); }
}

// Base class for Tetris shapes
class Shape {
  constructor(blocks) {
    this.blocks = blocks;
  }

  getBlocks() {
    return Array.from(this.blocks);
  }

  init() {
    this.blocks.forEach(block => block.init());
  }

  render() {
    this.blocks.forEach(block => block.render());
  }

  fall() {
    this.blocks.forEach(block => block.fall());
  }

  moveRight() {
    this.blocks.forEach(block => block.moveRight());
  }

  moveLeft() {
    this.blocks.forEach(block => block.moveLeft());
  }

  clear() {
    this.blocks.forEach(block => block.destroy());
    this.blocks = [];
  }

  addBlocks(blocks) {
    this.blocks.push(...blocks);
  }

  fallingPositions() {
    return this.blocks.map(b => new Position(b.x + 1, b.y));
  }

  rightPositions() {
    return this.blocks.map(b => b.rightPosition());
  }

  leftPositions() {
    return this.blocks.map(b => b.leftPosition());
  }

  /**
   * Rotate the shape 90° clockwise using second block as pivot.
   */
  rotate() {
    const pivot = this.blocks[1]; // Use second block as the pivot center

    // Calculate rotated positions for each block
    const newPositions = this.blocks.map(block => {
      const dx = block.x - pivot.x;
      const dy = block.y - pivot.y;
      return new Position(pivot.x - dy, pivot.y + dx); // Apply rotation matrix
    });

    // Only rotate if all new positions are within bounds and not occupied
    if (board.arePositionsValid(newPositions)) {
      this.blocks.forEach((block, i) => {
        block.x = newPositions[i].x;
        block.y = newPositions[i].y;
      });
      this.render(); // Re-render the rotated shape
    }
  }
}

// Shapes: Square (no rotation)
class Square extends Shape {
  constructor(x, y) {
    super([
      new Block(x, y, 'color-2'),
      new Block(x, y + 1, 'color-2'),
      new Block(x + 1, y, 'color-2'),
      new Block(x + 1, y + 1, 'color-2')
    ]);
  }

  // Square doesn't rotate visually, so we override rotate
  rotate() {}
}

// Shapes: Line
class Line extends Shape {
  constructor(x, y) {
    super([
      new Block(x - 1, y, 'color-1'),
      new Block(x, y, 'color-1'),
      new Block(x + 1, y, 'color-1'),
      new Block(x + 2, y, 'color-1')
    ]);
  }
}

// Shapes: L Shape
class LShape extends Shape {
  constructor(x, y) {
    super([
      new Block(x - 1, y, 'color-6'),
      new Block(x, y, 'color-6'),
      new Block(x + 1, y, 'color-6'),
      new Block(x + 1, y + 1, 'color-6')
    ]);
  }
}

// Shapes: T Shape
class TShape extends Shape {
  constructor(x, y) {
    super([
      new Block(x, y - 1, 'color-3'),
      new Block(x, y, 'color-3'),
      new Block(x, y + 1, 'color-3'),
      new Block(x + 1, y, 'color-3')
    ]);
  }
}

// Shapes: Z Shape
class ZShape extends Shape {
  constructor(x, y) {
    super([
      new Block(x, y, 'color-5'),
      new Block(x, y + 1, 'color-5'),
      new Block(x + 1, y - 1, 'color-5'),
      new Block(x + 1, y, 'color-5')
    ]);
  }
}

// Board manages the state of the game
class Board {
  constructor() {
    this.blocks = [];      // All static blocks on the board
    this.shapes = [];      // Active falling shape
    this.interval = undefined;
    this.loopInterval = 1000;
    this.loopIntervalFast = 1000 / 27;
    this.moveFast = false;
    this.gameOver = true;
    this.score = 0;
    this.init();
  }

  // Set up initial empty board and UI message
  init() {
    $(".empty").each(function(index, ele) {
      let x = Math.floor(index / 10);
      let y = index % 10;
      $(ele).css({
        left: y * $(ele).innerWidth() + "px",
        top: x * $(ele).innerHeight() + "px"
      });
    });
    $("#message").text("Tetris");
    window.animatelo.flash("#new-game", { duration: 2500, iterations: Infinity });
  }

  // Start new game
  newGame() {
    this.shapes.forEach(shape => this.addBlocks(shape.getBlocks()));
    this.shapes = [];
    this.blocks.forEach(b => b.destroy());
    this.blocks = [];
    this.setScore(0);
    this.gameOver = false;
    this.initGameLoop(this.loopInterval);
    $("#banner").hide();
  }

  // Set and display score
  setScore(v) { this.score = v; $("#score").text(this.score); }
  getScore() { return this.score; }

  // Start the game loop
  initGameLoop(delay) {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.gameLoop(), delay);
  }

  // Main game loop
  gameLoop() {
    this.renderShapes();
    this.renderBlocks();
    this.spawnShapes();
    this.clearFullRows();
    this.checkGameOver();
  }

  // Game over if a block is in top row
  checkGameOver() {
    if (this.blocks.some(b => b.getPosition().x === 0 && b.getPosition().y === 4)) {
      this.gameOver = true;
      clearInterval(this.interval);
      this.interval = undefined;
      $("#banner").show();
      $("#message").text("Game Over!");
      $("#new-game").text("Tap here to start again!");
    }
  }

  // Spawn a new shape if none is falling
  spawnShapes() {
    if (this.shapes.length === 0) {
      let shape;
      const rand = this.getRandomRange(0, 4);
      if (rand === 0) shape = new Square(0, 4);
      else if (rand === 1) shape = new Line(1, 4);
      else if (rand === 2) shape = new LShape(1, 4);
      else if (rand === 3) shape = new TShape(0, 4);
      else shape = new ZShape(0, 4);

      shape.init();
      shape.render();
      this.shapes.push(shape);

      // Reset speed if fast drop was triggered before
      if (this.moveFast) {
        this.initGameLoop(this.loopInterval);
        this.moveFast = false;
      }
    }
  }

  // Clear complete rows and animate score
  clearFullRows() {
    for (let x = 15; x >= 0; x--) {
      const rowBlocks = this.blocks.filter(b => b.x === x);
      if (rowBlocks.length === 10) {
        this.removeBlocks(rowBlocks);
        rowBlocks.forEach(b => b.flash()[0].onfinish = () => {
          b.destroy();
          this.fallAbove(x);
          this.setScore(this.getScore() + 10);
        });
      }
    }
  }

  // Drop blocks above cleared line
  fallAbove(row) {
    for (let i = row - 1; i >= 0; i--) {
      this.blocks.forEach(b => {
        if (b.x === i) {
          b.fall();
          b.render();
        }
      });
    }
  }

  // Render moving shape and detect if it can fall
  renderShapes() {
    for (let shape of this.getShapes()) {
      if (this.arePositionsValid(shape.fallingPositions())) {
        shape.fall();
        shape.render();
      } else {
        this.removeShape(shape);
        this.addBlocks(shape.getBlocks());
      }
    }
  }

  renderBlocks() {
    this.blocks.forEach(b => b.render());
  }

  getShapes() { return Array.from(this.shapes); }
  getBlock(x, y) { return this.blocks.find(b => b.x === x && b.y === y); }
  addBlocks(blocks) { this.blocks.push(...blocks); }
  removeBlocks(blocks) { this.blocks = this.blocks.filter(b => !blocks.includes(b)); }
  removeShape(shape) { this.shapes = this.shapes.filter(s => s !== shape); }

  arePositionsValid(positions) {
    return positions.every(pos =>
      pos.x < 16 && pos.y >= 0 && pos.y < 10 &&
      !this.getBlock(pos.x, pos.y)
    );
  }

  // Left key moves shape left
  leftKeyPress() {
    this.shapes.forEach(shape => {
      if (this.arePositionsValid(shape.leftPositions())) {
        shape.moveLeft();
        shape.render();
      }
    });
  }

  // Right key moves shape right
  rightKeyPress() {
    this.shapes.forEach(shape => {
      if (this.arePositionsValid(shape.rightPositions())) {
        shape.moveRight();
        shape.render();
      }
    });
  }

  // Down key speeds up the fall
  downKeyPress() {
    if (!this.gameOver && !this.moveFast) {
      this.initGameLoop(this.loopIntervalFast);
      this.moveFast = true;
    }
  }

  // Up key (or rotate button) triggers rotation
  upKeyPress() {
    this.shapes.forEach(shape => shape.rotate?.());
  }

  // Random number generator for spawning shapes
  getRandomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// Initialize game
let board = new Board();

// Keyboard controls
$(document).keydown(function(e) {
  switch (e.which) {
    case 37: board.leftKeyPress(); break;     // ←
    case 38: board.upKeyPress(); break;       // ↑
    case 39: board.rightKeyPress(); break;    // →
    case 40: board.downKeyPress(); break;     // ↓
    case 78: board.newGame(); break;          // N key
    default: console.log(e.which); break;
  }
  e.preventDefault(); // Prevent default scrolling behavior
});

// Button click controls
$("#new-game").click(() => board.newGame());
$("#down").click(() => board.downKeyPress());
$("#rotate").click(() => board.upKeyPress());
$("#left").click(() => board.leftKeyPress());
$("#right").click(() => board.rightKeyPress());
