// Tetris Game JavaScript

// jQuery alias
var $ = jQuery;

// --------------- POSITION CLASS --------------------
// Represents a coordinate on the board
// Used to track the positions of blocks and test for collisions
class Position {
  constructor(x, y) {
    this.x = x; // Row index (i.e how far down the board position is)
    this.y = y; // Column index (i.e how far across the board it is)
  }
}

// --------------- BLOCK CLASS --------------------
// Class to represent a single block in the game
class Block {
  // creates a block at position (x,y) with specific colour
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

  // Append block's HTML element to the game board
  init() {
    $("#board").append(this.element);
  }

  // Moves the block to its current position using CSS top and left
  render() {
    $(this.element).css({
      left: this.y * $(this.element).innerWidth() + "px",
      top: this.x * $(this.element).innerHeight() + "px"
    });
  }

  // Movement methods
  fall() { this.x += 1; } // move down by one
  moveRight() { this.y += 1; } // move right by one
  moveLeft() { this.y -= 1; } // move left by 1

  // Position helpers
  // Return a new position representing the block's possible next location
  rightPosition() { return new Position(this.x, this.y + 1); } // Returns the coordinates where the block would be if it moved one space to the right.
  leftPosition() { return new Position(this.x, this.y - 1); } // Same idea, but checks the position one space to the left.
  getPosition() { return new Position(this.x, this.y); } // Returns the block’s current position.

  // Animation and destruction (visual)
  flash() { return window.animatelo.flash(this.element, { duration: 500 }); } // plays when a row clears
  destroy() { $(this.element).remove(); } // removes the block from the DOM
}

// --------------- SHAPE CLASS --------------------
// Represents a Tetris shape, made up of 4 blocks
class Shape {
  // Accepts an array of Block objects
  constructor(blocks) {
    this.blocks = blocks;
  }

  // Returns the shape's block
  getBlocks() {
    return Array.from(this.blocks);
  }

  // Adds all the blocks to the board
  init() {
    this.blocks.forEach(block => block.init());
  }

  // Updates each block's visual position
  render() {
    this.blocks.forEach(block => block.render());
  }

  // Apply movement to all blocks
  fall() {
    this.blocks.forEach(block => block.fall());
  }

  moveRight() {
    this.blocks.forEach(block => block.moveRight());
  }

  moveLeft() {
    this.blocks.forEach(block => block.moveLeft());
  }

  // Removes and deletes all blocks in the shape
  clear() {
    this.blocks.forEach(block => block.destroy());
    this.blocks = [];
  }

  // Appends more blocks to the shape
  addBlocks(blocks) {
    this.blocks.push(...blocks);
  }

  // Returns positions if the shape falls 1 row
  fallingPositions() {
    return this.blocks.map(b => new Position(b.x + 1, b.y));
  }

  // Moving horizontally
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

// --------------- SHAPE SUBCLASSES --------------------
// Each one defines the layout of a specific Tetris shape using the Block class
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

// --------------- BOARD CLASS --------------------
// Board manages the state of the game: shapes, score, falling, and logic
class Board {
  constructor() {          // Initialises variables: active shapes, fallen blocks, intervals, scores
    this.blocks = [];      // All static blocks on the board
    this.shapes = [];      // Active falling shape
    this.interval = undefined;
    this.loopInterval = 1000;
    this.loopIntervalFast = 1000 / 27;
    this.moveFast = false;
    this.gameOver = true;
    this.score = 0;
    this.init();          // Calls init() to position any background tiles
  }

// --------------- GAME SETUP AND LOOP --------------------
  // Set up initial empty board and UI message
  init() {          // Animates the start button and sets up the board visuals
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
  // Clears board, removes blocks, resets score, starts the loop
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
  // Sets the interval to repeatedly call gameLoop()
  initGameLoop(delay) {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => this.gameLoop(), delay);
  }

  // Main game loop
  /** Runs once per game tick
   * Tries to move shape down.
   * Spawns new shape if none is active.
   * Clears rows if full.
   * Checks for game over.
  */
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

  // --------------- ROW CLEANING --------------------
  /*
    Checks each row (x = 15 to 0).
    If 10 blocks are found, it’s full → flash + remove it.
    When all animations finish, calls fallAboveRows().
  */
  clearFullRows() {
    const rowsToClear = [];
  
    // Identify all rows that are full
    for (let x = 15; x >= 0; x--) {
      const rowBlocks = this.blocks.filter(b => b.x === x);
      if (rowBlocks.length === 10) {
        rowsToClear.push({ x, blocks: rowBlocks });
      }
    }
  
    if (rowsToClear.length === 0) return;
  
    // Sort bottom to top for proper clearing
    rowsToClear.sort((a, b) => b.x - a.x);
    const clearedXs = rowsToClear.map(r => r.x);
  
    let animationsLeft = rowsToClear.length;
  
    rowsToClear.forEach(({ x, blocks }) => {
      this.removeBlocks(blocks);
      blocks.forEach(b => {
        b.flash()[0].onfinish = () => {
          b.destroy();
          animationsLeft--;
  
          // Once all animations are done, apply falling
          if (animationsLeft === 0) {
            this.fallAboveRows(clearedXs);
          }
        };
      });
  
      // Add points for each row cleared
      this.setScore(this.getScore() + 10);
    });
  }

  /*
  Makes all blocks above the cleared rows fall down.
  Calculates how many rows below each block have cleared and shifts accordingly.
  */
  fallAboveRows(rows) {
    // Sort rows in ascending order (bottom-up)
    rows.sort((a, b) => a - b);
  
    this.blocks.forEach(block => {
      // Count how many cleared rows are below this block
      const shift = rows.filter(row => block.x < row).length;
      if (shift > 0) {
        block.x += shift; // Move block down
        block.render();   // Re-render it visually
      }
    });
  }

  // ------------------- SHAPE + BLOCK MANAGEMENT ---------------------
  // Render moving shape and detect if it can fall
  /*
  Tries to move active shape down by 1
  If it can't, it becomes part of the static block
  */
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

  // Updates the screen position of all static blocks
  renderBlocks() {
    this.blocks.forEach(b => b.render());
  }

  getShapes() { return Array.from(this.shapes); }
  getBlock(x, y) { return this.blocks.find(b => b.x === x && b.y === y); }
  addBlocks(blocks) { this.blocks.push(...blocks); }    // Adds blocks to the static list
  removeBlocks(blocks) { this.blocks = this.blocks.filter(b => !blocks.includes(b)); }    // Removes blocks to the static list
  removeShape(shape) { this.shapes = this.shapes.filter(s => s !== shape); }      // Removes blocks to the active list

  // Checks if all positions are within bounds and unoccupied
  arePositionsValid(positions) {
    return positions.every(pos =>
      pos.x < 16 && pos.y >= 0 && pos.y < 10 &&
      !this.getBlock(pos.x, pos.y)
    );
  }

  // ------------------- INPUT HANDLING ----------------------
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
  // Returns a random number between min and max
  // Used to randomly select the next shape
  getRandomRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}

// ------------------- GAME START AND KEYBOARD BINDINGS ----------------------
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
