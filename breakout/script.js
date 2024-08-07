// =========================
// Game Configuration
// =========================
let board;
let boardWidth = 650 ;
let boardHeight = 750;
let context;

// =========================
// Player Configuration
// =========================
let playerWidth = 100; // 500 for testing, 80 normal
let playerHeight = 10;
let playerVelocityX = 25; // move 10 pixels each time
let lives = 3;
let player = {
  x: boardWidth / 2 - playerWidth / 2,
  y: boardHeight - playerHeight - 50,
  width: playerWidth,
  height: playerHeight,
  velocityX: playerVelocityX,
};

// =========================
// Ball Configuration
// =========================
let ballWidth = 10;
let ballHeight = 10;
let ballVelocityX = 4; // 15 for testing, 3 normal
let ballVelocityY = 3; // 10 for testing, 2 normal
let ball = {
  x: boardWidth / 2,
  y: boardHeight / 5,
  width: ballWidth,
  height: ballHeight,
  velocityX: ballVelocityX,
  velocityY: ballVelocityY,
};

// =========================
// Block Configuration
// =========================
let blockArray = [];
let blockWidth = 40;
let blockHeight = 14;
let blockColumns = 11;
let blockRows = 1; // add more as the game goes on
let blockMaxRows = 12; // limit the number of rows
let blockCount = 0;
let blockX = 55; // Starting block corners (top left)
let blockY = 100;

let score = 0;
let gameOver = false;

// =========================
// Sound Effects
// =========================
function playPaddleBounceSFX() {
  let sfx = new Audio("sfx/Ball-bounce-off-the-player-paddle.wav");
  sfx.play();
}

function playBrickBounceSFX() {
  let sfx = new Audio("sfx/Ball-bounce-off-normal-brick-destroy.wav");
  sfx.play();
}

function playBorderBounceSFX() {
  let sfx = new Audio("sfx/Ball-bounce-off-the-sides-of-the-screen.wav");
  sfx.play();
}

// Particle configuration
let particles = [];
// Particle class
class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 5 ; // Size of each particle
    this.velocityX = Math.random() * 2; // Random X velocity
    this.velocityY = Math.random() * 2; // Random Y velocity
    this.color = `hsl(${Math.random() * 360}, 100%, 50%)`; // Random color
    this.life = Math.random() * 30 + 30; // Lifespan of the particle
  }

  update() {
    this.x += this.velocityX;
    this.y += this.velocityY;
    this.life -= 1.5; // Reduce the lifespan
  }

  draw() {
    context.fillStyle = this.color;
    context.fillRect(this.x, this.y, this.size, this.size); // Draw square particle
  }
}

// Create particles on block break
function createParticles(x, y) {
  let particleCount = 50; // Number of particles
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle(x, y));
  }
}

// Update particles
function updateParticles() {
  particles.forEach((particle, index) => {
    particle.update();
    if (particle.life <= 0) {
      particles.splice(index, 1); // Remove dead particles
    }
  });
}

// Draw particles
function drawParticles() {
  particles.forEach(particle => {
    particle.draw();
  });
}

// =========================
// Initialization
// =========================
window.onload = function () {
  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d"); // used for drawing on the board

  // Draw initial player
  context.fillStyle = "red";
  context.fillRect(player.x, player.y, player.width, player.height);

  requestAnimationFrame(update);
  document.addEventListener("keydown", movePlayer);
  document.addEventListener("mousemove", movePlayerWithMouse);

  // Create initial blocks
  createBlocks();
};

// =========================
// Game Loop
// =========================
function update() {
  requestAnimationFrame(update);

  // Stop drawing if the game is over
  if (gameOver) {
    return;
  }
  context.clearRect(0, 0, board.width, board.height);

  drawGridLines(50);

  // Draw player paddle
  drawPlayerPaddle();

  // Move and draw ball
  moveBall();
  drawBall();

  // Handle ball collisions with paddle, borders, and blocks
  handleBallCollisions();

  // Draw blocks
  drawBlocks();

  // Update and draw particles
  updateParticles();
  drawParticles();

  // Check for level completion
  checkLevelCompletion();

  // Display score and lives
  displayScoreAndLives();
  document.getElementById(
    "velocity"
  ).innerHTML = `Velocity X: ${ball.velocityX} | Velocity Y: ${ball.velocityY}`;
}

// =========================
// Drawing Functions
// =========================
function drawGridLines(spacing) {
  context.strokeStyle = "#ccc"; // Set the color for the grid lines
  context.lineWidth = 0.5; // Set the line width

  // Draw vertical grid lines
  for (let x = spacing; x < boardWidth; x += spacing) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, boardHeight);
    context.stroke();
  }

  // Draw horizontal grid lines
  for (let y = spacing; y < boardHeight; y += spacing) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(boardWidth, y);
    context.stroke();
  }
}

function drawPlayerPaddle() {
  let paddleSectionWidth = player.width / 3;

  context.fillStyle = "red"; // Left section color
  context.fillRect(player.x, player.y, paddleSectionWidth, player.height);

  context.fillStyle = "green"; // Middle section color
  context.fillRect(
    player.x + paddleSectionWidth,
    player.y,
    paddleSectionWidth,
    player.height
  );

  context.fillStyle = "blue"; // Right section color
  context.fillRect(
    player.x + 2 * paddleSectionWidth,
    player.y,
    paddleSectionWidth,
    player.height
  );
}

function drawBall() {
  context.fillStyle = "white";
  context.fillRect(ball.x, ball.y, ball.width, ball.height);
}

function drawBlocks() {
  context.fillStyle = "red";
  for (let i = 0; i < blockArray.length; i++) {
    let block = blockArray[i];
    if (!block.break) {
      context.fillRect(block.x, block.y, block.width, block.height);
    }
  }
}
document.getElementById(
  "velocity"
).innerHTML = `Velocity X: ${ball.velocityX} | Velocity Y: ${ball.velocityY}`;

// =========================
// Game Logic Functions
// =========================
function moveBall() {
  ball.x += ball.velocityX;
  ball.y += ball.velocityY;
}

function handleBallCollisions() {
  // Bounce the ball off the player paddle
  if (topCollision(ball, player)) {
    handlePaddleCollision();
  }

  // Bounce the ball off the top border
  if (ball.y <= 0) {
    ball.y = 0; // Correct the ball's position
    ball.velocityY *= -1; // Reverse Y direction
    playBorderBounceSFX();
  }
  // Bounce the ball off the left and right borders
  else if (ball.x <= 0 || ball.x + ball.width >= boardWidth) {
    ball.velocityX *= -1; // Reverse X direction
    playBorderBounceSFX();
  }
  // Ball falls off the bottom border
  else if (ball.y + ball.height >= boardHeight) {
    handleBallOutOfBounds();
  }

  // Handle collisions with blocks
  for (let i = 0; i < blockArray.length; i++) {
    let block = blockArray[i];
    if (!block.break) {
      if (topCollision(ball, block) || bottomCollision(ball, block)) {
        block.break = true; // Block is broken
        ball.velocityY *= -1; // Reverse Y direction
        score += 100;
        blockCount -= 1;
        playBrickBounceSFX();

        // Create particles at the block's position
        createParticles(block.x + block.width / 2, block.y + block.height / 2);
      } else if (leftCollision(ball, block) || rightCollision(ball, block)) {
        block.break = true; // Block is broken
        ball.velocityX *= -1; // Reverse X direction
        score += 100;
        blockCount -= 1;
        playBrickBounceSFX();

        // Create particles at the block's position
        createParticles(block.x + block.width / 2, block.y + block.height / 2);
      }
    }
  }
}

function handlePaddleCollision() {
  // Calculate the relative position of the ball on the paddle
  let hitPosition = ball.x + ball.width / 2 - player.x;
  let paddleSection = player.width / 4; // Divide the paddle into 4 sections
  playPaddleBounceSFX();

  // Determine which section of the paddle was hit
  if (hitPosition < paddleSection) {
    // Left section
    ball.velocityX = -Math.abs(ball.velocityX); // Bounce left
  } else if (hitPosition > player.width - paddleSection) {
    // Right section
    ball.velocityX = Math.abs(ball.velocityX); // Bounce right
  } else {
    // Middle section: Bounce normally or add variance
    // Optionally add a slight variance to the X velocity
    // let variance = Math.random() * 2 - 1; // Random value between -1 and 1
    // ball.velocityX += variance;
  }

  // Reverse the Y direction (bounce up)
  ball.velocityY *= -1;
  // Optionally apply a random deviation
  // ball.velocityX = applyRandomDeviation(ball.velocityX, 3.5, 5.5, -3.5, -5.5);
}

function handleBallOutOfBounds() {
  if (lives <= 0) {
    context.font = "20px sans-serif";
    context.fillText("Game Over: Press 'Space' to Restart", 215, 500);
    gameOver = true;
    document.addEventListener("mousedown", resetGame);
  }
  lives -= 1;

  // Reset ball position
  ball.x = boardWidth / 2;
  ball.y = boardHeight / 5;
}

function checkLevelCompletion() {
  // Move to the next level if all blocks are destroyed
  if (blockCount == 0) {
    score += 100 * blockRows * blockColumns; // Bonus points :)
    blockRows = Math.min(blockRows + 1, blockMaxRows);
    createBlocks();
  }
}

function displayScoreAndLives() {
  context.font = "20px sans-serif";
  context.fillText(score, 10, 25);

  context.font = "20px sans-serif";
  context.fillText(lives, 10, 50);
}

// =========================
// Utility Functions
// =========================
function detectCollision(a, b) {
  return (
    a.x < b.x + b.width && // a's top left corner doesn't reach b's top right corner
    a.x + a.width > b.x && // a's top right corner passes b's top left corner
    a.y < b.y + b.height && // a's top left corner doesn't reach b's bottom left corner
    a.y + a.height > b.y // a's bottom left corner passes b's top left corner
  );
}

function topCollision(ball, block) {
  // Ball is above the block
  return detectCollision(ball, block) && ball.y + ball.height >= block.y;
}

function bottomCollision(ball, block) {
  // Ball is below the block
  return detectCollision(ball, block) && block.y + block.height >= ball.y;
}

function leftCollision(ball, block) {
  // Ball is to the left of the block
  return detectCollision(ball, block) && ball.x + ball.width >= block.x;
}

function rightCollision(ball, block) {
  // Ball is to the right of the block
  return detectCollision(ball, block) && block.x + block.width >= ball.x;
}

// =========================
// Player Control Functions
// =========================
function movePlayer(e) {
  if (gameOver) {
    if (e.code == "Space") {
      resetGame();
      console.log("RESET");
    }
    return;
  }

  if (e.code == "ArrowLeft" || e.code == "KeyA") {
    let nextPlayerX = player.x - player.velocityX;
    if (!outOfBounds(nextPlayerX)) {
      player.x = nextPlayerX;
    }
  } else if (e.code == "ArrowRight" || e.code == "KeyD") {
    let nextPlayerX = player.x + player.velocityX;
    if (!outOfBounds(nextPlayerX)) {
      player.x = nextPlayerX;
    }
  }
}

function movePlayerWithMouse(e) {
  if (gameOver) {
    if (e.code == "Space" || e.code == "MouseDown") {
      resetGame();
      console.log("RESET");
    }
    return;
  }

  let canvasRect = board.getBoundingClientRect();
  let mouseX = e.clientX - canvasRect.left;

  // Center the player paddle on the cursor, and ensure it stays within bounds
  player.x = mouseX - player.width / 2;

  // Prevent the player from going out of bounds
  if (player.x < 0) {
    player.x = 0;
  } else if (player.x + player.width > boardWidth) {
    player.x = boardWidth - player.width;
  }
}

// =========================
// Block Creation Function
// =========================
function createBlocks() {
  blockArray = []; // Clear blockArray
  for (let c = 0; c < blockColumns; c++) {
    for (let r = 0; r < blockRows; r++) {
      let block = {
        x: blockX + c * blockWidth + c * 10, // c*10 space 10 pixels apart columns
        y: blockY + r * blockHeight + r * 10, // r*10 space 10 pixels apart rows
        width: blockWidth,
        height: blockHeight,
        break: false,
      };
      blockArray.push(block);
    }
  }
  blockCount = blockArray.length;
}

// =========================
// Game Reset Function
// =========================
function resetGame() {
  gameOver = false;
  player = {
    x: boardWidth / 2 - playerWidth / 2,
    y: boardHeight - playerHeight - 50,
    width: playerWidth,
    height: playerHeight,
    velocityX: playerVelocityX,
  };
  ball = {
    x: boardWidth / 2,
    y: boardHeight / 5,
    width: ballWidth,
    height: ballHeight,
    velocityX: ballVelocityX,
    velocityY: ballVelocityY,
  };
  blockArray = [];
  blockRows = 1;
  score = 0;
  lives = 3;
  document.removeEventListener("mousedown", resetGame);
  createBlocks();
}

// =========================
// Helper Function
// =========================
function outOfBounds(xPosition) {
  return xPosition < 0 || xPosition + playerWidth > boardWidth;
}

