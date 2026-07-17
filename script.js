// Game Parameters & State
let score = 0;
let timeLeft = 30;
let gameRunning = false;
let dropMakerInterval = null; 
let gameCountdownInterval = null; 
let celebrationInterval = null;

// Select DOM Elements
const startBtn = document.getElementById("start-btn");
const resetBtn = document.getElementById("reset-btn");
const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");
const scorePanel = document.getElementById("score-panel");

// Stakeholder Inspired Message Libraries
const winningMessages = [
  "Fantastic job! You're a clean water champion!",
  "Splashtastic! You kept the water systems clean!",
  "Amazing work! You brought clean water to those in need!",
  "Victory! Your quick reflexes saved the project ecosystem!"
];

const losingMessages = [
  "Nice attempt! Give it another splash to clean up.",
  "Keep practicing! Every single drop counts.",
  "So close! Can you bypass the pollution challenges next time?",
  "Don't give up! Clean water grids need your help."
];

// Event Hooks
startBtn.addEventListener("click", startGame);
resetBtn.addEventListener("click", resetGame);

function startGame() {
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  
  gameContainer.innerHTML = "";
  stopCelebration();
  
  startBtn.disabled = true;

  // Clear any loose intervals safely before assigning new ones
  if (dropMakerInterval) clearInterval(dropMakerInterval);
  if (gameCountdownInterval) clearInterval(gameCountdownInterval);

  dropMakerInterval = setInterval(spawnGameElement, 700);
  gameCountdownInterval = setInterval(tickTimer, 1000);
}

function tickTimer() {
  if (!gameRunning) return;
  
  timeLeft--;
  timeDisplay.textContent = timeLeft;

  if (timeLeft <= 0) {
    endGame();
  }
}

function spawnGameElement() {
  if (!gameRunning) return;

  const element = document.createElement("div");
  
  // 75% Chance Water Drop, 25% Chance Toxic Can Challenge
  const isObstacle = Math.random() < 0.25;
  
  if (isObstacle) {
    element.className = "game-element pollution-can";
    element.style.width = "40px";
    element.style.height = "55px";
  } else {
    element.className = "game-element water-drop";
    const initialSize = 55;
    const sizeMultiplier = Math.random() * 0.6 + 0.6;
    const computedSize = initialSize * sizeMultiplier;
    element.style.width = `${computedSize}px`;
    element.style.height = `${computedSize}px`;
  }

  const containerWidth = gameContainer.offsetWidth || 800;
  const elementWidth = isObstacle ? 40 : 55;
  const targetX = Math.random() * (containerWidth - elementWidth);
  element.style.left = `${targetX}px`;

  const fallSpeed = Math.random() * 1.8 + 2.2; 
  element.style.animationDuration = `${fallSpeed}s`;

  // Standardized Click Engine
  element.addEventListener("click", (e) => {
    if (!gameRunning) return;
    e.stopPropagation();

    let pointsChanged = 0;
    let feedbackColor = "";

    if (isObstacle) {
      pointsChanged = -3;
      score = Math.max(0, score + pointsChanged); 
      feedbackColor = "#F5402C"; 
      triggerScorePanelFlash("negative");
    } else {
      pointsChanged = 1;
      score += pointsChanged;
      feedbackColor = "#2E9DF7"; 
      triggerScorePanelFlash("positive");
    }

    scoreDisplay.textContent = score;
    createFloatingFeedback(e.clientX, e.clientY, pointsChanged, feedbackColor);
    element.remove();
  });

  gameContainer.appendChild(element);

  element.addEventListener("animationend", () => {
    element.remove();
  });
}

function createFloatingFeedback(clientX, clientY, value, color) {
  const feedback = document.createElement("span");
  feedback.className = "click-feedback";
  feedback.style.color = color;
  feedback.textContent = value > 0 ? `+${value}` : value;

  const rect = gameContainer.getBoundingClientRect();
  const insideX = clientX - rect.left;
  const insideY = clientY - rect.top;

  feedback.style.left = `${insideX}px`;
  feedback.style.top = `${insideY}px`;

  gameContainer.appendChild(feedback);
  setTimeout(() => feedback.remove(), 600);
}

function triggerScorePanelFlash(type) {
  const activeClass = type === "positive" ? "score-flash-positive" : "score-flash-negative";
  scorePanel.classList.add(activeClass);
  setTimeout(() => {
    scorePanel.classList.remove(activeClass);
  }, 150);
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMakerInterval);
  clearInterval(gameCountdownInterval);
  gameContainer.innerHTML = "";
  startBtn.disabled = false;

  let chosenPhrase = "";
  const playerWon = score >= 20;

  if (playerWon) {
    const pick = Math.floor(Math.random() * winningMessages.length);
    chosenPhrase = winningMessages[pick];
    startCelebration(); 
  } else {
    const pick = Math.floor(Math.random() * losingMessages.length);
    chosenPhrase = losingMessages[pick];
  }

  const box = document.createElement("div");
  box.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    background: rgba(255, 255, 255, 0.98);
    padding: 35px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    width: 80%;
    max-width: 450px;
    border-top: 6px solid ${playerWon ? '#4FCB53' : '#F5402C'};
    z-index: 20;
  `;

  box.innerHTML = `
    <h2 style="color: ${playerWon ? '#4FCB53' : '#F5402C'}; font-size: 2rem; margin-bottom: 12px;">
      ${playerWon ? 'You Win!' : 'Game Over'}
    </h2>
    <p style="font-size: 1.1rem; color: #333; margin-bottom: 20px; line-height: 1.4;">${chosenPhrase}</p>
    <p style="font-size: 1.3rem; font-weight: bold; color: #131313;">Final Score Collected: ${score}</p>
  `;

  gameContainer.appendChild(box);
}

function resetGame() {
  gameRunning = false;
  clearInterval(dropMakerInterval);
  clearInterval(gameCountdownInterval);
  stopCelebration();
  
  score = 0;
  timeLeft = 30;
  scoreDisplay.textContent = score;
  timeDisplay.textContent = timeLeft;
  
  gameContainer.innerHTML = "";
  startBtn.disabled = false;
}

function startCelebration() {
  const brandColors = ['#FFC907', '#2E9DF7', '#8BD1CB', '#4FCB53', '#FF902A'];
  if (celebrationInterval) clearInterval(celebrationInterval);
  
  celebrationInterval = setInterval(() => {
    if (gameRunning) return; 
    const particle = document.createElement("div");
    particle.className = "celebration-particle";
    particle.style.backgroundColor = brandColors[Math.floor(Math.random() * brandColors.length)];
    particle.style.left = `${Math.random() * (gameContainer.offsetWidth || 800)}px`;
    
    if (Math.random() > 0.5) {
        particle.style.borderRadius = "50%";
    }
    
    const size = Math.random() * 8 + 6;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    const speed = Math.random() * 2 + 2; 
    particle.style.animationDuration = `${speed}s`;
    
    gameContainer.appendChild(particle);
    setTimeout(() => particle.remove(), speed * 1000);
  }, 40);
}

function stopCelebration() {
  if (celebrationInterval) {
    clearInterval(celebrationInterval);
    celebrationInterval = null;
  }
}