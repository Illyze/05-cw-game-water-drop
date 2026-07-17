// Game State Variables
let score = 0;
let timeLeft = 30;
let gameRunning = false;
let dropMaker; 
let gameTimer; 

// DOM Element Selectors
const startBtn = document.getElementById("start-btn");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");

// Randomized Message Arrays
const winningMessages = [
  "Fantastic job! You're a water-saving hero!",
  "Splashtastic! You crushed it!",
  "Amazing work! Clean water for everyone!",
  "Victory! Your quick reflexes saved the day!"
];

const losingMessages = [
  "Nice try! Give it another splash.",
  "Keep practicing! Every drop counts.",
  "So close! Can you beat your high score next time?",
  "Don't give up! The drops are fast, but you can be faster."
];

// Event Listeners
startBtn.addEventListener("click", startGame);

function startGame() {
  if (gameRunning) return;

  // Initialize and Reset Game State
  gameRunning = true;
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  
  // Wipe out any message boxes or old drops left on screen
  gameContainer.innerHTML = "";
  
  // Handle Button State Changes
  startBtn.disabled = true;
  startBtn.style.opacity = "0.5";
  startBtn.style.cursor = "not-allowed";

  // Intervals: Spawn a drop every 850ms, update countdown every 1s
  dropMaker = setInterval(createDrop, 850);
  gameTimer = setInterval(updateTimer, 1000);
}

function updateTimer() {
  timeLeft--;
  timeDisplay.textContent = timeLeft;

  if (timeLeft <= 0) {
    endGame();
  }
}

function createDrop() {
  const drop = document.createElement("div");
  
  // 25% Chance to generate a Bad Drop
  const isBadDrop = Math.random() < 0.25;
  if (isBadDrop) {
    drop.className = "water-drop bad-drop";
  } else {
    drop.className = "water-drop";
  }

  // Visual Variety Sizing Logic
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = `${size}px`;
  drop.style.height = `${size}px`;

  // Random Horizontal Positioning within Boundaries
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - size);
  drop.style.left = xPosition + "px";

  // Falling Speed Mechanics
  const fallDuration = Math.random() * 2 + 2.5; // Ranges from 2.5s to 4.5s
  drop.style.animationDuration = `${fallDuration}s`;

  // Clicking / Catching Mechanic
  drop.addEventListener("mousedown", (e) => {
    if (!gameRunning) return;
    
    e.stopPropagation(); // Stops double click behaviors

    if (isBadDrop) {
      score = Math.max(0, score - 2); // Penalize but don't drop below 0
    } else {
      score += 1;
    }
    
    scoreDisplay.textContent = score;
    drop.remove(); // Delete drop visually right away
  });

  gameContainer.appendChild(drop);

  // Animation Cleanup
  drop.addEventListener("animationend", () => {
    drop.remove(); 
  });
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  // Clean the map
  gameContainer.innerHTML = "";

  // Reset Button States
  startBtn.disabled = false;
  startBtn.style.opacity = "1";
  startBtn.style.cursor = "pointer";

  // Pick messaging arrays conditionally
  let finalMessage = "";
  if (score >= 20) {
    const randomIndex = Math.floor(Math.random() * winningMessages.length);
    finalMessage = winningMessages[randomIndex];
  } else {
    const randomIndex = Math.floor(Math.random() * losingMessages.length);
    finalMessage = losingMessages[randomIndex];
  }

  // Create an overlay inside the box
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.15);
    width: 75%;
    border-top: 5px solid ${score >= 20 ? '#4FCB53' : '#F5402C'};
  `;

  overlay.innerHTML = `
    <h2 style="color: ${score >= 20 ? '#4FCB53' : '#F5402C'}; font-size: 32px; margin-bottom: 10px;">
      ${score >= 20 ? 'You Win!' : 'Game Over'}
    </h2>
    <p style="font-size: 18px; color: #333; margin-bottom: 20px; line-height: 1.4;">${finalMessage}</p>
    <p style="font-size: 20px; font-weight: bold; color: #131313;">Final Score: ${score}</p>
  `;

  gameContainer.appendChild(overlay);
}