/**
 * Jogo Labirinto Aventura
 * Desenvolvido em HTML5 Canvas e JavaScript puro
 */

// --- Configurações de Áudio (Web Audio API) ---
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('maze_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('maze_muted', this.muted);
    return this.muted;
  }

  playStep() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  playGem() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + i * 0.06;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.12, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.18);
    });
  }

  playBump() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'square';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.linearRampToValueAtTime(40, now + 0.04);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  playHint() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  playWin() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const start = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(start);
      osc.stop(start + 0.35);
    });
  }
}

// --- Gerador de Labirinto (DFS Recursive Backtracking) ---
class MazeGenerator {
  static generate(width, height) {
    // Garante que as dimensões sejam ímpares
    const cols = width % 2 === 0 ? width + 1 : width;
    const rows = height % 2 === 0 ? height + 1 : height;

    // 1 = Parede, 0 = Caminho
    const grid = Array.from({ length: rows }, () => Array(cols).fill(1));

    // Pilha para o DFS
    const stack = [];
    const startX = 1;
    const startY = 1;

    grid[startY][startX] = 0;
    stack.push({ x: startX, y: startY });

    const directions = [
      { dx: 0, dy: -2 }, // Cima
      { dx: 0, dy: 2 },  // Baixo
      { dx: -2, dy: 0 }, // Esquerda
      { dx: 2, dy: 0 }   // Direita
    ];

    while (stack.length > 0) {
      const current = stack[stack.length - 1];
      const neighbors = [];

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && grid[ny][nx] === 1) {
          neighbors.push({ x: nx, y: ny, dir });
        }
      }

      if (neighbors.length > 0) {
        // Escolhe um vizinho aleatório
        const chosen = neighbors[Math.floor(Math.random() * neighbors.length)];
        
        // Abre o caminho entre a célula atual e o vizinho
        const wallX = current.x + chosen.dir.dx / 2;
        const wallY = current.y + chosen.dir.dy / 2;
        grid[wallY][wallX] = 0;
        grid[chosen.y][chosen.x] = 0;

        stack.push({ x: chosen.x, y: chosen.y });
      } else {
        stack.pop();
      }
    }

    const endX = cols - 2;
    const endY = rows - 2;
    grid[endY][endX] = 0;

    return { grid, cols, rows, start: { x: startX, y: startY }, end: { x: endX, y: endY } };
  }
}

// --- Jogo Principal ---
class MazeGame {
  constructor() {
    this.canvas = document.getElementById('maze-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundSystem();

    // Elementos DOM
    this.timerEl = document.getElementById('timer');
    this.stepsEl = document.getElementById('steps-count');
    this.gemsEl = document.getElementById('gems-count');
    this.bestTimeEl = document.getElementById('best-time');
    this.diffSelect = document.getElementById('difficulty-select');
    this.hintBtn = document.getElementById('btn-hint');
    this.hintCountEl = document.getElementById('hint-count');
    this.fogBtn = document.getElementById('btn-fog');
    this.fogStatusEl = document.getElementById('fog-status');
    this.soundBtn = document.getElementById('btn-sound');
    this.victoryModal = document.getElementById('victory-modal');

    // Estado do jogo
    this.difficulty = 'medium';
    this.grid = [];
    this.cols = 21;
    this.rows = 21;
    this.cellSize = 20;
    this.player = { x: 1, y: 1, renderX: 1, renderY: 1 };
    this.exit = { x: 19, y: 19 };
    this.gems = [];
    this.totalGems = 0;
    this.collectedGems = 0;
    this.steps = 0;
    this.hintsRemaining = 3;
    this.activeHintPath = null;
    this.fogOfWar = false;
    this.isPlaying = false;
    this.startTime = null;
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.particles = [];

    // Dimensões de dificuldade
    this.sizes = {
      easy: 11,
      medium: 21,
      hard: 31
    };

    this.initEvents();
    this.updateSoundBtnIcon();
    this.newGame();
    this.gameLoop();
  }

  initEvents() {
    // Teclado
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }

      if (!this.isPlaying) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          this.movePlayer(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          this.movePlayer(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          this.movePlayer(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          this.movePlayer(1, 0);
          break;
      }
    });

    // Controles virtuais (D-Pad)
    const setupDpadBtn = (id, dx, dy) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const handlePress = (e) => {
        e.preventDefault();
        if (this.isPlaying) this.movePlayer(dx, dy);
      };
      btn.addEventListener('touchstart', handlePress, { passive: false });
      btn.addEventListener('mousedown', handlePress);
    };

    setupDpadBtn('ctrl-up', 0, -1);
    setupDpadBtn('ctrl-down', 0, 1);
    setupDpadBtn('ctrl-left', -1, 0);
    setupDpadBtn('ctrl-right', 1, 0);

    // Gestos de deslize (Swipe) no Canvas
    let touchStartX = 0;
    let touchStartY = 0;

    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.isPlaying || e.changedTouches.length === 0) return;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const minSwipeDistance = 20;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > minSwipeDistance) {
          this.movePlayer(diffX > 0 ? 1 : -1, 0);
        }
      } else {
        if (Math.abs(diffY) > minSwipeDistance) {
          this.movePlayer(0, diffY > 0 ? 1 : -1);
        }
      }
    }, { passive: true });

    // Botões da interface
    document.getElementById('btn-new-game').addEventListener('click', () => this.newGame());
    
    this.diffSelect.addEventListener('change', (e) => {
      this.difficulty = e.target.value;
      this.newGame();
    });

    this.hintBtn.addEventListener('click', () => this.useHint());

    this.fogBtn.addEventListener('click', () => {
      this.fogOfWar = !this.fogOfWar;
      this.fogStatusEl.textContent = this.fogOfWar ? 'Lig.' : 'Desl.';
      this.fogBtn.classList.toggle('btn-primary', this.fogOfWar);
      this.fogBtn.classList.toggle('btn-secondary', !this.fogOfWar);
    });

    this.soundBtn.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.updateSoundBtnIcon();
    });

    document.getElementById('btn-play-again').addEventListener('click', () => {
      this.victoryModal.classList.remove('active');
      this.newGame();
    });

    document.getElementById('btn-next-diff').addEventListener('click', () => {
      this.victoryModal.classList.remove('active');
      if (this.difficulty === 'easy') {
        this.difficulty = 'medium';
      } else if (this.difficulty === 'medium') {
        this.difficulty = 'hard';
      }
      this.diffSelect.value = this.difficulty;
      this.newGame();
    });

    // Ajuste de redimensionamento de janela
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  updateSoundBtnIcon() {
    this.soundBtn.textContent = this.sound.muted ? '🔇' : '🔊';
  }

  newGame() {
    const size = this.sizes[this.difficulty] || 21;
    const mazeData = MazeGenerator.generate(size, size);

    this.grid = mazeData.grid;
    this.cols = mazeData.cols;
    this.rows = mazeData.rows;
    this.player = {
      x: mazeData.start.x,
      y: mazeData.start.y,
      renderX: mazeData.start.x,
      renderY: mazeData.start.y
    };
    this.exit = mazeData.end;

    // Gerar Gemas em becos sem saída
    this.generateGems();

    // Resetar contadores
    this.steps = 0;
    this.collectedGems = 0;
    this.hintsRemaining = 3;
    this.activeHintPath = null;
    this.particles = [];
    this.isPlaying = true;
    this.elapsedSeconds = 0;

    // Atualizar UI
    this.stepsEl.textContent = '0';
    this.gemsEl.textContent = `0/${this.totalGems}`;
    this.hintCountEl.textContent = this.hintsRemaining;
    this.timerEl.textContent = '00:00';
    this.loadBestTime();

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      if (this.isPlaying) {
        this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        this.timerEl.textContent = this.formatTime(this.elapsedSeconds);
      }
    }, 1000);

    this.resizeCanvas();
  }

  generateGems() {
    this.gems = [];
    const deadEnds = [];

    // Localizar células com apenas 1 vizinho aberto
    for (let y = 1; y < this.rows - 1; y++) {
      for (let x = 1; x < this.cols - 1; x++) {
        if (this.grid[y][x] === 0) {
          // Não colocar no início nem na saída
          if ((x === this.player.x && y === this.player.y) || (x === this.exit.x && y === this.exit.y)) {
            continue;
          }

          let openNeighbors = 0;
          if (this.grid[y - 1][x] === 0) openNeighbors++;
          if (this.grid[y + 1][x] === 0) openNeighbors++;
          if (this.grid[y][x - 1] === 0) openNeighbors++;
          if (this.grid[y][x + 1] === 0) openNeighbors++;

          if (openNeighbors === 1) {
            deadEnds.push({ x, y });
          }
        }
      }
    }

    // Embaralha becos sem saída
    deadEnds.sort(() => Math.random() - 0.5);

    // Quantidade de gemas baseada na dificuldade
    const gemCounts = { easy: 3, medium: 6, hard: 10 };
    const maxGems = Math.min(gemCounts[this.difficulty] || 5, deadEnds.length);

    for (let i = 0; i < maxGems; i++) {
      this.gems.push({
        x: deadEnds[i].x,
        y: deadEnds[i].y,
        collected: false,
        pulse: Math.random() * Math.PI * 2
      });
    }

    this.totalGems = this.gems.length;
  }

  resizeCanvas() {
    const container = this.canvas.parentElement;
    const width = container.clientWidth || 500;
    const height = container.clientHeight || width || 500;

    // Resolução nítida em monitores High-DPI
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);

    this.canvasDisplayWidth = width;
    this.canvasDisplayHeight = height;

    this.cellSize = Math.floor(Math.min(width / this.cols, height / this.rows));
    this.offsetX = Math.floor((width - this.cols * this.cellSize) / 2);
    this.offsetY = Math.floor((height - this.rows * this.cellSize) / 2);
  }

  movePlayer(dx, dy) {
    const newX = this.player.x + dx;
    const newY = this.player.y + dy;

    // Verificar colisão com paredes ou limites
    if (newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows || this.grid[newY][newX] === 1) {
      this.sound.playBump();
      return;
    }

    this.player.x = newX;
    this.player.y = newY;
    this.steps++;
    this.stepsEl.textContent = this.steps;
    this.sound.playStep();

    // Adiciona partículas de rastro do jogador
    this.addMoveParticles(this.player.x, this.player.y);

    // Coletar gema
    this.gems.forEach((gem) => {
      if (!gem.collected && gem.x === this.player.x && gem.y === this.player.y) {
        gem.collected = true;
        this.collectedGems++;
        this.gemsEl.textContent = `${this.collectedGems}/${this.totalGems}`;
        this.sound.playGem();
        this.addGemParticles(gem.x, gem.y);
      }
    });

    // Se havia uma dica ativa, recalcula ou limpa se alcançou o objetivo
    if (this.activeHintPath) {
      this.activeHintPath = this.findShortestPath(this.player, this.exit);
    }

    // Verificar se chegou à saída
    if (this.player.x === this.exit.x && this.player.y === this.exit.y) {
      this.onWin();
    }
  }

  useHint() {
    if (!this.isPlaying || this.hintsRemaining <= 0) return;

    const path = this.findShortestPath(this.player, this.exit);
    if (path) {
      this.activeHintPath = path;
      this.hintsRemaining--;
      this.hintCountEl.textContent = this.hintsRemaining;
      this.sound.playHint();

      // Esconde a dica após 4 segundos automaticamente se o jogador preferir
      setTimeout(() => {
        this.activeHintPath = null;
      }, 4500);
    }
  }

  findShortestPath(start, goal) {
    // Algoritmo BFS para encontrar menor caminho
    const queue = [{ x: start.x, y: start.y, path: [] }];
    const visited = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    visited[start.y][start.x] = true;

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 }
    ];

    while (queue.length > 0) {
      const current = queue.shift();

      if (current.x === goal.x && current.y === goal.y) {
        return current.path.concat([{ x: current.x, y: current.y }]);
      }

      for (const dir of directions) {
        const nx = current.x + dir.dx;
        const ny = current.y + dir.dy;

        if (
          nx >= 0 && nx < this.cols &&
          ny >= 0 && ny < this.rows &&
          this.grid[ny][nx] === 0 &&
          !visited[ny][nx]
        ) {
          visited[ny][nx] = true;
          queue.push({
            x: nx,
            y: ny,
            path: current.path.concat([{ x: current.x, y: current.y }])
          });
        }
      }
    }

    return null;
  }

  onWin() {
    this.isPlaying = false;
    clearInterval(this.timerInterval);
    this.sound.playWin();

    // Explosão de confetes / partículas
    this.triggerWinConfetti();

    // Salvar recorde
    const recordKey = `maze_best_${this.difficulty}`;
    const previousBest = localStorage.getItem(recordKey);
    let isNewRecord = false;

    if (!previousBest || this.elapsedSeconds < parseInt(previousBest, 10)) {
      localStorage.setItem(recordKey, this.elapsedSeconds);
      isNewRecord = true;
      this.loadBestTime();
    }

    // Preencher Modal
    document.getElementById('v-time').textContent = this.formatTime(this.elapsedSeconds);
    document.getElementById('v-steps').textContent = this.steps;
    document.getElementById('v-gems').textContent = `${this.collectedGems}/${this.totalGems}`;
    document.getElementById('new-record-tag').style.display = isNewRecord ? 'block' : 'none';

    // Desabilitar o botão de aumentar dificuldade se já estiver no Hard
    const nextBtn = document.getElementById('btn-next-diff');
    if (this.difficulty === 'hard') {
      nextBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'block';
    }

    setTimeout(() => {
      this.victoryModal.classList.add('active');
    }, 600);
  }

  loadBestTime() {
    const recordKey = `maze_best_${this.difficulty}`;
    const best = localStorage.getItem(recordKey);
    this.bestTimeEl.textContent = best ? this.formatTime(parseInt(best, 10)) : '--:--';
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- Partículas e Efeitos Visuais ---
  addMoveParticles(gx, gy) {
    const px = this.offsetX + (gx + 0.5) * this.cellSize;
    const py = this.offsetY + (gy + 0.5) * this.cellSize;
    for (let i = 0; i < 4; i++) {
      this.particles.push({
        x: px + (Math.random() - 0.5) * (this.cellSize * 0.4),
        y: py + (Math.random() - 0.5) * (this.cellSize * 0.4),
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: 'rgba(56, 189, 248, 0.7)',
        radius: Math.random() * 2 + 1,
        life: 1.0,
        decay: 0.05
      });
    }
  }

  addGemParticles(gx, gy) {
    const px = this.offsetX + (gx + 0.5) * this.cellSize;
    const py = this.offsetY + (gy + 0.5) * this.cellSize;
    const colors = ['#f59e0b', '#fbbf24', '#fde047', '#ffffff'];

    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1.5;
      this.particles.push({
        x: px,
        y: py,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * 3 + 2,
        life: 1.0,
        decay: 0.03
      });
    }
  }

  triggerWinConfetti() {
    const w = this.canvasDisplayWidth;
    const h = this.canvasDisplayHeight;
    const colors = ['#38bdf8', '#818cf8', '#f43f5e', '#fbbf24', '#10b981', '#a855f7'];

    for (let i = 0; i < 120; i++) {
      this.particles.push({
        x: w / 2,
        y: h / 2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * 4 + 2,
        life: 1.0,
        decay: Math.random() * 0.015 + 0.008
      });
    }
  }

  // --- Loop de Renderização ---
  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // Interpolação suave de movimento do jogador
    const lerpSpeed = 0.35;
    this.player.renderX += (this.player.x - this.player.renderX) * lerpSpeed;
    this.player.renderY += (this.player.y - this.player.renderY) * lerpSpeed;

    // Atualiza partículas
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Animação das gemas
    this.gems.forEach((gem) => {
      gem.pulse += 0.05;
    });
  }

  render() {
    const ctx = this.ctx;
    const w = this.canvasDisplayWidth;
    const h = this.canvasDisplayHeight;

    if (!w || !h) return;

    // Fundo geral
    ctx.fillStyle = '#060a12';
    ctx.fillRect(0, 0, w, h);

    const cs = this.cellSize;
    const ox = this.offsetX;
    const oy = this.offsetY;

    // 1. Desenhar Labirinto (Paredes e Caminhos)
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const px = ox + x * cs;
        const py = oy + y * cs;

        if (this.grid[y][x] === 1) {
          // Parede com gradiente sutil e borda moderna
          ctx.fillStyle = '#111827';
          ctx.fillRect(px, py, cs, cs);

          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.strokeRect(px, py, cs, cs);
        } else {
          // Caminho
          ctx.fillStyle = '#0b1120';
          ctx.fillRect(px, py, cs, cs);
        }
      }
    }

    // 2. Desenhar Caminho da Dica (se ativo)
    if (this.activeHintPath && this.activeHintPath.length > 0) {
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = Math.max(2, cs * 0.25);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.setLineDash([4, 6]);

      ctx.beginPath();
      this.activeHintPath.forEach((pt, idx) => {
        const px = ox + (pt.x + 0.5) * cs;
        const py = oy + (pt.y + 0.5) * cs;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.stroke();
      ctx.restore();
    }

    // 3. Desenhar Ponto de Saída (Portal Reluzente)
    const exitX = ox + (this.exit.x + 0.5) * cs;
    const exitY = oy + (this.exit.y + 0.5) * cs;
    const exitRadius = cs * 0.38;

    ctx.save();
    // Brilho exterior pulsante
    const time = Date.now() / 300;
    const pulseFactor = Math.sin(time) * 0.15 + 1;

    const exitGlow = ctx.createRadialGradient(
      exitX, exitY, exitRadius * 0.2,
      exitX, exitY, exitRadius * pulseFactor * 1.5
    );
    exitGlow.addColorStop(0, '#a855f7');
    exitGlow.addColorStop(0.5, '#ec4899');
    exitGlow.addColorStop(1, 'rgba(236, 72, 153, 0)');

    ctx.fillStyle = exitGlow;
    ctx.beginPath();
    ctx.arc(exitX, exitY, exitRadius * pulseFactor * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Ícone da Saída (Portal ou Estrela)
    ctx.fillStyle = '#fdf2f8';
    ctx.beginPath();
    ctx.arc(exitX, exitY, exitRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `${Math.floor(cs * 0.5)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚪', exitX, exitY);
    ctx.restore();

    // 4. Desenhar Gemas Coletáveis
    this.gems.forEach((gem) => {
      if (!gem.collected) {
        const gx = ox + (gem.x + 0.5) * cs;
        const gy = oy + (gem.y + 0.5) * cs;
        const floatOffset = Math.sin(gem.pulse) * (cs * 0.08);

        ctx.save();
        ctx.font = `${Math.floor(cs * 0.55)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💎', gx, gy + floatOffset);
        ctx.restore();
      }
    });

    // 5. Desenhar Jogador
    const playerX = ox + (this.player.renderX + 0.5) * cs;
    const playerY = oy + (this.player.renderY + 0.5) * cs;
    const pRadius = cs * 0.38;

    ctx.save();
    // Brilho do Jogador
    const glowGrad = ctx.createRadialGradient(
      playerX, playerY, pRadius * 0.2,
      playerX, playerY, pRadius * 1.6
    );
    glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    glowGrad.addColorStop(0.5, 'rgba(14, 165, 233, 0.4)');
    glowGrad.addColorStop(1, 'rgba(14, 165, 233, 0)');

    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(playerX, playerY, pRadius * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // Corpo do Jogador (Esfera Neon Brilhante)
    const bodyGrad = ctx.createRadialGradient(
      playerX - pRadius * 0.3, playerY - pRadius * 0.3, pRadius * 0.1,
      playerX, playerY, pRadius
    );
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.3, '#38bdf8');
    bodyGrad.addColorStop(1, '#0284c7');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(playerX, playerY, pRadius, 0, Math.PI * 2);
    ctx.fill();

    // Borda do jogador
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 6. Modo Lanterna (Fog of War) - apenas ativo durante a partida
    if (this.fogOfWar && this.isPlaying) {
      ctx.save();
      const fogRadius = cs * 3.2; // Raio de visão do jogador

      // Cria máscara escura com furo na posição do jogador
      const fogGrad = ctx.createRadialGradient(
        playerX, playerY, fogRadius * 0.3,
        playerX, playerY, fogRadius
      );
      fogGrad.addColorStop(0, 'rgba(2, 6, 23, 0)');
      fogGrad.addColorStop(0.7, 'rgba(2, 6, 23, 0.75)');
      fogGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');

      ctx.fillStyle = fogGrad;
      ctx.fillRect(0, 0, w, h);

      // Bloqueia as bordas completamente
      ctx.fillStyle = 'rgba(2, 6, 23, 0.98)';
      // Desenha escuridão fora da visão
      ctx.beginPath();
      ctx.rect(0, 0, w, h);
      ctx.arc(playerX, playerY, fogRadius, 0, Math.PI * 2, true);
      ctx.fill();

      ctx.restore();
    }

    // 7. Desenhar Partículas
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

// Iniciar quando o DOM estiver carregado
window.addEventListener('DOMContentLoaded', () => {
  new MazeGame();
});
