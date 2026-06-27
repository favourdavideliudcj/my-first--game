const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Grid settings
const COLS = 25;
const ROWS = 25;
const CELL = 22;
const SPEED = 120; // ms per tick

canvas.width = COLS * CELL;
canvas.height = ROWS * CELL;

// Directions
const DIR = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y:  1 },
  LEFT:  { x: -1, y:  0 },
  RIGHT: { x:  1, y:  0 },
};

// Key bindings
const KEYS = {
  w: 'UP', a: 'LEFT', s: 'DOWN', d: 'RIGHT',
  ArrowUp: 'UP', ArrowLeft: 'LEFT', ArrowDown: 'DOWN', ArrowRight: 'RIGHT',
};

let snake1, snake2, food, loopId;
let score1 = 0, score2 = 0;

// ─── Snake factory ───────────────────────────────────────────────────────────

function makeSnake(startX, startY, dir, color, keySet) {
  return {
    body: [
      { x: startX,     y: startY },
      { x: startX - dir.x, y: startY - dir.y },
      { x: startX - dir.x * 2, y: startY - dir.y * 2 },
    ],
    dir,
    nextDir: dir,
    color,
    keySet,  // 'wasd' or 'arrows'
    alive: true,
    grow: false,
  };
}

// ─── Food ────────────────────────────────────────────────────────────────────

function spawnFood() {
  let pos;
  do {
    pos = {
      x: Math.floor(Math.random() * COLS),
      y: Math.floor(Math.random() * ROWS),
    };
  } while (
    snake1.body.some(c => c.x === pos.x && c.y === pos.y) ||
    snake2.body.some(c => c.x === pos.x && c.y === pos.y)
  );
  food = pos;
}

// ─── Input ───────────────────────────────────────────────────────────────────

const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

const WASD_KEYS  = new Set(['w','a','s','d']);
const ARROW_KEYS = new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);

document.addEventListener('keydown', e => {
  const dirName = KEYS[e.key];
  if (!dirName) return;

  if (WASD_KEYS.has(e.key) && snake1.alive) {
    if (dirName !== OPPOSITE[snake1.dir.name]) {
      snake1.nextDir = { ...DIR[dirName], name: dirName };
    }
  }

  if (ARROW_KEYS.has(e.key) && snake2.alive) {
    e.preventDefault();
    if (dirName !== OPPOSITE[snake2.dir.name]) {
      snake2.nextDir = { ...DIR[dirName], name: dirName };
    }
  }
});

// ─── Movement ────────────────────────────────────────────────────────────────

function moveSnake(snake) {
  if (!snake.alive) return;

  snake.dir = snake.nextDir;

  const head = snake.body[0];
  const newHead = {
    x: head.x + snake.dir.x,
    y: head.y + snake.dir.y,
  };

  snake.body.unshift(newHead);

  if (snake.grow) {
    snake.grow = false;
  } else {
    snake.body.pop();
  }
}

// ─── Collision ───────────────────────────────────────────────────────────────

function checkCollisions() {
  [snake1, snake2].forEach(snake => {
    if (!snake.alive) return;

    const head = snake.body[0];

    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      snake.alive = false;
      return;
    }

    // Self collision (skip the head itself at index 0)
    if (snake.body.slice(1).some(c => c.x === head.x && c.y === head.y)) {
      snake.alive = false;
      return;
    }
  });

  // Head-to-head collision
  if (snake1.alive && snake2.alive) {
    const h1 = snake1.body[0];
    const h2 = snake2.body[0];
    if (h1.x === h2.x && h1.y === h2.y) {
      snake1.alive = false;
      snake2.alive = false;
      return;
    }
  }

  // Snake 1 hits snake 2's body
  if (snake1.alive) {
    const head = snake1.body[0];
    if (snake2.body.some(c => c.x === head.x && c.y === head.y)) {
      snake1.alive = false;
    }
  }

  // Snake 2 hits snake 1's body
  if (snake2.alive) {
    const head = snake2.body[0];
    if (snake1.body.some(c => c.x === head.x && c.y === head.y)) {
      snake2.alive = false;
    }
  }
}

// ─── Food logic ──────────────────────────────────────────────────────────────

function checkFood() {
  [snake1, snake2].forEach((snake, i) => {
    if (!snake.alive) return;
    const head = snake.body[0];
    if (head.x === food.x && head.y === food.y) {
      snake.grow = true;
      if (i === 0) { score1++; document.getElementById('score1').textContent = score1; }
      else         { score2++; document.getElementById('score2').textContent = score2; }
      spawnFood();
    }
  });
}

// ─── Drawing ─────────────────────────────────────────────────────────────────

function drawCell(x, y, color, isHead) {
  const px = x * CELL;
  const py = y * CELL;
  const pad = isHead ? 1 : 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, isHead ? 4 : 3);
  ctx.fill();

  if (isHead) {
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.roundRect(px + pad + 2, py + pad + 2, CELL - pad * 2 - 4, (CELL - pad * 2) * 0.4, 2);
    ctx.fill();
  }
}

function draw() {
  // Background
  ctx.fillStyle = '#0d0d1f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grid dots
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      ctx.beginPath();
      ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Food
  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  ctx.fillStyle = '#f44';
  ctx.shadowColor = '#f44';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(fx, fy, CELL / 2 - 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snakes
  [snake1, snake2].forEach(snake => {
    snake.body.forEach((cell, i) => {
      const alpha = snake.alive ? 1 : 0.3;
      const baseColor = snake.color;
      const dim = snake.alive
        ? i === 0 ? baseColor : baseColor + 'cc'
        : '#555';
      drawCell(cell.x, cell.y, dim, i === 0);
    });
  });
}

// ─── Game loop ───────────────────────────────────────────────────────────────

function gameLoop() {
  moveSnake(snake1);
  moveSnake(snake2);
  checkCollisions();
  checkFood();
  draw();

  if (!snake1.alive || !snake2.alive) {
    clearInterval(loopId);
    setTimeout(showResult, 400);
  }
}

// ─── Round result ─────────────────────────────────────────────────────────────

function showResult() {
  const title = document.getElementById('overlayTitle');
  const msg   = document.getElementById('overlayMsg');
  const btn   = document.getElementById('overlayBtn');

  if (!snake1.alive && !snake2.alive) {
    title.textContent = "It's a draw!";
    msg.textContent = 'Both snakes crashed at the same time.';
  } else if (!snake1.alive) {
    title.textContent = '🎉 Player 2 wins!';
    msg.textContent = `Score — P1: ${score1}  P2: ${score2}`;
  } else {
    title.textContent = '🎉 Player 1 wins!';
    msg.textContent = `Score — P1: ${score1}  P2: ${score2}`;
  }

  btn.textContent = 'Play Again';
  document.getElementById('overlay').classList.remove('hidden');
}

// ─── Start / restart ─────────────────────────────────────────────────────────

function startGame() {
  score1 = 0; score2 = 0;
  document.getElementById('score1').textContent = '0';
  document.getElementById('score2').textContent = '0';

  snake1 = makeSnake(5, Math.floor(ROWS / 2), { ...DIR.RIGHT, name: 'RIGHT' }, '#4af');
  snake2 = makeSnake(COLS - 6, Math.floor(ROWS / 2), { ...DIR.LEFT, name: 'LEFT' }, '#f84');

  spawnFood();
  document.getElementById('overlay').classList.add('hidden');

  clearInterval(loopId);
  loopId = setInterval(gameLoop, SPEED);
}

document.getElementById('overlayBtn').addEventListener('click', startGame);

// Initial draw while on the start screen
ctx.fillStyle = '#0d0d1f';
ctx.fillRect(0, 0, canvas.width, canvas.height);
