// Game Settings & State
let currentDifficulty = "easy";
let score = 0;
let timeLeft = 35;
let gameRunning = false;

let dropMakerInterval = null; 
let gameCountdownInterval = null; 
let milestoneTracker = [];

// Configuration Matrix for Difficulty Modes
const difficultyConfig = {
  easy: { duration: 35, spawnRate: 750, speedMin: 2.5, speedMax: 4.0, winScore: 15 },
  normal: { duration: 30, spawnRate: 600, speedMin: 1.8, speedMax: 3.0, winScore: 20 },
  hard: { duration: 25, spawnRate: 450, speedMin: 1.2, speedMax: 2.2, winScore: 25 }
};

// Milestone Messages Array
const milestones = [
  { score: 5, message: "Off to a great start! Keep going!" },
  { score: 10, message: "Halfway there! Keep collecting clean water!" },
  { score: 15, message: "Amazing effort! Clean water for all!" }
];

// Audio Context initialized safely inside user interactions
let audioCtx = null;

function playSound(type) {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "catch") {
      osc.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === "obstacle") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === "click") {
      osc.frequency.setValueAtTime(300, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } else if (type === "win") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    }
  } catch (err) {
    // Graceful fallback if browser restricts audio
  }
}

// Ensure DOM elements are fully loaded before attaching events
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-btn");
  const resetBtn = document.getElementById("reset-btn");
  const scoreDisplay = document.getElementById("score");
  const timeDisplay = document.getElementById("time");
  const gameContainer = document.getElementById("game-container");
  const scorePanel = document.getElementById("score-panel");
  const milestoneBanner = document.getElementById("milestone-banner");
  const diffButtons = document.querySelectorAll(".diff-btn");

  diffButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      if (gameRunning) return;
      playSound("click");
      diffButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentDifficulty = btn.dataset.mode;
      timeDisplay.textContent = difficultyConfig[currentDifficulty].duration;
    });
  });

  startBtn.addEventListener("click", () => {
    playSound("click");
    startGame();
  });

  resetBtn.addEventListener("click", () => {
    playSound("click");
    resetGame();
  });

  function startGame() {
    if (gameRunning) return;

    const config = difficultyConfig[currentDifficulty];
    gameRunning = true;
    score = 0;
    timeLeft = config.duration;
    milestoneTracker = [];
    
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    gameContainer.innerHTML = "";
    gameContainer.appendChild(milestoneBanner);
    milestoneBanner.classList.add("hidden");
    
    startBtn.disabled = true;

    if (dropMakerInterval) clearInterval(dropMakerInterval);
    if (gameCountdownInterval) clearInterval(gameCountdownInterval);

    dropMakerInterval = setInterval(spawnGameElement, config.spawnRate);
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
    const isObstacle = Math.random() < 0.25;
    const config = difficultyConfig[currentDifficulty];
    
    if (isObstacle) {
      element.className = "game-element pollution-can";
      element.style.width = "36px";
      element.style.height = "46px";
    } else {
      element.className = "game-element water-drop";
      const initialSize = 36;
      const computedSize = initialSize * (Math.random() * 0.4 + 0.8);
      element.style.width = `${computedSize}px`;
      element.style.height = `${computedSize}px`;
    }

    const containerWidth = gameContainer.offsetWidth || 800;
    const targetX = Math.random() * (containerWidth - 50);
    element.style.left = `${targetX}px`;

    const fallSpeed = Math.random() * (config.speedMax - config.speedMin) + config.speedMin;
    element.style.animationDuration = `${fallSpeed}s`;

    element.addEventListener("mousedown", (e) => {
      if (!gameRunning) return;
      e.stopPropagation();

      let pointsChanged = 0;
      let feedbackColor = "";

      if (isObstacle) {
        pointsChanged = -3;
        score = Math.max(0, score + pointsChanged);
        feedbackColor = "#F5402C";
        playSound("obstacle");
        triggerScorePanelFlash("negative");
      } else {
        pointsChanged = 1;
        score += pointsChanged;
        feedbackColor = "#2E9DF7";
        playSound("catch");
        triggerScorePanelFlash("positive");
        checkMilestones(score);
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

  function checkMilestones(currentScore) {
    milestones.forEach(m => {
      if (currentScore >= m.score && !milestoneTracker.includes(m.score)) {
        milestoneTracker.push(m.score);
        showMilestoneBanner(m.message);
      }
    });
  }

  function showMilestoneBanner(msg) {
    milestoneBanner.textContent = msg;
    milestoneBanner.classList.remove("hidden");
    setTimeout(() => {
      milestoneBanner.classList.add("hidden");
    }, 2000);
  }

  function createFloatingFeedback(clientX, clientY, value, color) {
    const feedback = document.createElement("span");
    feedback.className = "click-feedback";
    feedback.style.color = color;
    feedback.textContent = value > 0 ? `+${value}` : value;

    const rect = gameContainer.getBoundingClientRect();
    feedback.style.left = `${clientX - rect.left}px`;
    feedback.style.top = `${clientY - rect.top}px`;

    gameContainer.appendChild(feedback);
    setTimeout(() => feedback.remove(), 600);
  }

  function triggerScorePanelFlash(type) {
    const activeClass = type === "positive" ? "score-flash-positive" : "score-flash-negative";
    scorePanel.classList.add(activeClass);
    setTimeout(() => scorePanel.classList.remove(activeClass), 150);
  }

  function endGame() {
    gameRunning = false;
    clearInterval(dropMakerInterval);
    clearInterval(gameCountdownInterval);
    
    const config = difficultyConfig[currentDifficulty];
    const playerWon = score >= config.winScore;

    if (playerWon) {
      playSound("win");
    }

    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      background: rgba(255, 255, 255, 0.98);
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      width: 80%;
      max-width: 420px;
      border-top: 6px solid ${playerWon ? '#159A48' : '#F5402C'};
      z-index: 20;
    `;

    overlay.innerHTML = `
      <h2 style="color: ${playerWon ? '#159A48' : '#F5402C'}; font-size: 1.8rem; margin-bottom: 10px;">
        ${playerWon ? 'Goal Reached!' : 'Game Over'}
      </h2>
      <p style="font-size: 1rem; color: #444; margin-bottom: 15px;">
        ${playerWon ? 'Fantastic job bringing clean water to families!' : 'Keep practicing to help clean up the water supply!'}
      </p>
      <p style="font-size: 1.2rem; font-weight: 700; color: #1C252C;">Final Score: ${score}</p>
    `;

    gameContainer.appendChild(overlay);
    startBtn.disabled = false;
  }

  function resetGame() {
    gameRunning = false;
    clearInterval(dropMakerInterval);
    clearInterval(gameCountdownInterval);
    
    score = 0;
    timeLeft = difficultyConfig[currentDifficulty].duration;
    scoreDisplay.textContent = score;
    timeDisplay.textContent = timeLeft;
    
    gameContainer.innerHTML = "";
    gameContainer.appendChild(milestoneBanner);
    milestoneBanner.classList.add("hidden");
    startBtn.disabled = false;
  }
});