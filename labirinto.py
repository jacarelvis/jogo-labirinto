"""
Jogo Labirinto Aventura (Versão Python Desktop / Tkinter)
Gera labirintos procedurais usando o algoritmo DFS (Recursive Backtracker).
Inclui sistema de gemas, cronômetro, contador de passos e sistema de dicas com BFS.
"""

import tkinter as tk
from tkinter import messagebox
import random
import time
from collections import deque


class MazeGenerator:
    @staticmethod
    def generate(width: int, height: int):
        cols = width if width % 2 != 0 else width + 1
        rows = height if height % 2 != 0 else height + 1

        # 1 = Parede, 0 = Caminho
        grid = [[1 for _ in range(cols)] for _ in range(rows)]

        stack = [(1, 1)]
        grid[1][1] = 0

        directions = [(0, -2), (0, 2), (-2, 0), (2, 0)]

        while stack:
            cx, cy = stack[-1]
            neighbors = []

            for dx, dy in directions:
                nx, ny = cx + dx, cy + dy
                if 0 < nx < cols - 1 and 0 < ny < rows - 1 and grid[ny][nx] == 1:
                    neighbors.append((nx, ny, dx, dy))

            if neighbors:
                nx, ny, dx, dy = random.choice(neighbors)
                grid[cy + dy // 2][cx + dx // 2] = 0
                grid[ny][nx] = 0
                stack.append((nx, ny))
            else:
                stack.pop()

        grid[rows - 2][cols - 2] = 0
        return grid, cols, rows, (1, 1), (cols - 2, rows - 2)


class MazeGameApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Labirinto Aventura")
        self.root.geometry("680x760")
        self.root.configure(bg="#0a0e17")
        self.root.resizable(False, False)

        # Configurações de dificuldades
        self.diff_options = {
            "Fácil (11x11)": 11,
            "Médio (21x21)": 21,
            "Difícil (31x31)": 31
        }
        self.current_diff = "Médio (21x21)"

        # Estado do jogo
        self.grid = []
        self.cols = 21
        self.rows = 21
        self.player_x = 1
        self.player_y = 1
        self.exit_x = 19
        self.exit_y = 19
        self.gems = set()
        self.total_gems = 0
        self.collected_gems = 0
        self.steps = 0
        self.hints_left = 3
        self.hint_path = []
        self.start_time = None
        self.elapsed = 0
        self.is_playing = False
        self.timer_job = None

        self.cell_size = 25
        self.offset_x = 10
        self.offset_y = 10

        self.setup_ui()
        self.setup_events()
        self.new_game()

    def setup_ui(self):
        # Top Header
        header = tk.Frame(self.root, bg="#0a0e17", pady=10)
        header.pack(fill=tk.X)

        title = tk.Label(
            header,
            text="LABIRINTO AVENTURA",
            font=("Segoe UI", 18, "bold"),
            fg="#38bdf8",
            bg="#0a0e17"
        )
        title.pack()

        # Stats Bar
        stats_frame = tk.Frame(self.root, bg="#161e31", padx=15, pady=8, relief=tk.RIDGE, bd=1)
        stats_frame.pack(fill=tk.X, padx=20, pady=5)

        self.lbl_time = tk.Label(stats_frame, text="⏱️ Tempo: 00:00", font=("Segoe UI", 10, "bold"), fg="#f8fafc", bg="#161e31")
        self.lbl_time.pack(side=tk.LEFT, padx=12)

        self.lbl_steps = tk.Label(stats_frame, text="👣 Passos: 0", font=("Segoe UI", 10, "bold"), fg="#f8fafc", bg="#161e31")
        self.lbl_steps.pack(side=tk.LEFT, padx=12)

        self.lbl_gems = tk.Label(stats_frame, text="💎 Gemas: 0/0", font=("Segoe UI", 10, "bold"), fg="#fbbf24", bg="#161e31")
        self.lbl_gems.pack(side=tk.LEFT, padx=12)

        self.lbl_hints = tk.Label(stats_frame, text="💡 Dicas: 3", font=("Segoe UI", 10, "bold"), fg="#c084fc", bg="#161e31")
        self.lbl_hints.pack(side=tk.RIGHT, padx=12)

        # Toolbar
        toolbar = tk.Frame(self.root, bg="#0a0e17", pady=5)
        toolbar.pack(fill=tk.X, padx=20)

        # Dificuldade
        lbl_diff = tk.Label(toolbar, text="Dificuldade:", font=("Segoe UI", 9), fg="#94a3b8", bg="#0a0e17")
        lbl_diff.pack(side=tk.LEFT, padx=5)

        self.diff_var = tk.StringVar(value=self.current_diff)
        diff_menu = tk.OptionMenu(toolbar, self.diff_var, *self.diff_options.keys(), command=self.on_diff_change)
        diff_menu.config(bg="#1e293b", fg="#ffffff", activebackground="#334155", highlightthickness=0, font=("Segoe UI", 9))
        diff_menu["menu"].config(bg="#1e293b", fg="#ffffff")
        diff_menu.pack(side=tk.LEFT, padx=5)

        # Botões
        btn_new = tk.Button(
            toolbar,
            text="🔄 Novo Jogo",
            command=self.new_game,
            bg="#0284c7",
            fg="white",
            font=("Segoe UI", 9, "bold"),
            relief=tk.FLAT,
            padx=10,
            pady=4,
            cursor="hand2"
        )
        btn_new.pack(side=tk.RIGHT, padx=5)

        self.btn_hint = tk.Button(
            toolbar,
            text="💡 Usar Dica",
            command=self.use_hint,
            bg="#4338ca",
            fg="white",
            font=("Segoe UI", 9, "bold"),
            relief=tk.FLAT,
            padx=10,
            pady=4,
            cursor="hand2"
        )
        self.btn_hint.pack(side=tk.RIGHT, padx=5)

        # Canvas do Labirinto
        self.canvas_size = 560
        self.canvas = tk.Canvas(
            self.root,
            width=self.canvas_size,
            height=self.canvas_size,
            bg="#020617",
            highlightthickness=2,
            highlightbackground="#38bdf8"
        )
        self.canvas.pack(pady=10)

        # Dica de Teclado no Rodapé
        footer = tk.Label(
            self.root,
            text="Controles: Setas do Teclado ou Teclas W, A, S, D",
            font=("Segoe UI", 9),
            fg="#64748b",
            bg="#0a0e17"
        )
        footer.pack(pady=4)

    def setup_events(self):
        self.root.bind("<Up>", lambda e: self.move_player(0, -1))
        self.root.bind("<Down>", lambda e: self.move_player(0, 1))
        self.root.bind("<Left>", lambda e: self.move_player(-1, 0))
        self.root.bind("<Right>", lambda e: self.move_player(1, 0))

        self.root.bind("<w>", lambda e: self.move_player(0, -1))
        self.root.bind("<s>", lambda e: self.move_player(0, 1))
        self.root.bind("<a>", lambda e: self.move_player(-1, 0))
        self.root.bind("<d>", lambda e: self.move_player(1, 0))

        self.root.bind("<W>", lambda e: self.move_player(0, -1))
        self.root.bind("<S>", lambda e: self.move_player(0, 1))
        self.root.bind("<A>", lambda e: self.move_player(-1, 0))
        self.root.bind("<D>", lambda e: self.move_player(1, 0))

    def on_diff_change(self, val):
        self.current_diff = val
        self.new_game()

    def new_game(self):
        dim = self.diff_options[self.current_diff]
        self.grid, self.cols, self.rows, start, end = MazeGenerator.generate(dim, dim)
        self.player_x, self.player_y = start
        self.exit_x, self.exit_y = end

        # Cálculo do tamanho das células
        self.cell_size = self.canvas_size // max(self.cols, self.rows)
        self.offset_x = (self.canvas_size - self.cols * self.cell_size) // 2
        self.offset_y = (self.canvas_size - self.rows * self.cell_size) // 2

        # Gerar gemas em becos sem saída
        self.gems.clear()
        dead_ends = []
        for y in range(1, self.rows - 1):
            for x in range(1, self.cols - 1):
                if self.grid[y][x] == 0:
                    if (x, y) == (self.player_x, self.player_y) or (x, y) == (self.exit_x, self.exit_y):
                        continue
                    neighbors = sum(1 for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)] if self.grid[y + dy][x + dx] == 0)
                    if neighbors == 1:
                        dead_ends.append((x, y))

        random.shuffle(dead_ends)
        gem_counts = {"Fácil (11x11)": 3, "Médio (21x21)": 5, "Difícil (31x31)": 8}
        num_gems = min(gem_counts.get(self.current_diff, 5), len(dead_ends))
        self.gems = set(dead_ends[:num_gems])
        self.total_gems = len(self.gems)
        self.collected_gems = 0

        # Resetar contadores
        self.steps = 0
        self.hints_left = 3
        self.hint_path = []
        self.is_playing = True
        self.start_time = time.time()
        self.elapsed = 0

        self.update_stats()
        self.draw_maze()

        if self.timer_job:
            self.root.after_cancel(self.timer_job)
        self.tick_timer()

    def tick_timer(self):
        if self.is_playing:
            self.elapsed = int(time.time() - self.start_time)
            mins = self.elapsed // 60
            secs = self.elapsed % 60
            self.lbl_time.config(text=f"⏱️ Tempo: {mins:02d}:{secs:02d}")
            self.timer_job = self.root.after(1000, self.tick_timer)

    def update_stats(self):
        self.lbl_steps.config(text=f"👣 Passos: {self.steps}")
        self.lbl_gems.config(text=f"💎 Gemas: {self.collected_gems}/{self.total_gems}")
        self.lbl_hints.config(text=f"💡 Dicas: {self.hints_left}")

    def move_player(self, dx: int, dy: int):
        if not self.is_playing:
            return

        nx = self.player_x + dx
        ny = self.player_y + dy

        # Colisão com parede
        if nx < 0 or nx >= self.cols or ny < 0 or ny >= self.rows or self.grid[ny][nx] == 1:
            return

        self.player_x = nx
        self.player_y = ny
        self.steps += 1

        # Coleta de gemas
        if (nx, ny) in self.gems:
            self.gems.remove((nx, ny))
            self.collected_gems += 1

        self.update_stats()

        # Limpar dica se moveu
        if self.hint_path:
            self.hint_path = self.find_path((self.player_x, self.player_y), (self.exit_x, self.exit_y))

        self.draw_maze()

        # Condição de Vitória
        if (self.player_x, self.player_y) == (self.exit_x, self.exit_y):
            self.is_playing = False
            mins = self.elapsed // 60
            secs = self.elapsed % 60
            time_str = f"{mins:02d}:{secs:02d}"

            msg = (
                f"🎉 PARABÉNS! Você escapou do labirinto!\n\n"
                f"⏱️ Tempo: {time_str}\n"
                f"👣 Passos: {self.steps}\n"
                f"💎 Gemas: {self.collected_gems}/{self.total_gems}\n\n"
                f"Deseja jogar uma nova partida?"
            )
            if messagebox.askyesno("Vitória!", msg):
                self.new_game()

    def use_hint(self):
        if not self.is_playing or self.hints_left <= 0:
            return

        path = self.find_path((self.player_x, self.player_y), (self.exit_x, self.exit_y))
        if path:
            self.hint_path = path
            self.hints_left -= 1
            self.update_stats()
            self.draw_maze()

    def find_path(self, start, goal):
        # BFS para caminho mais curto
        queue = deque([(start[0], start[1], [])])
        visited = {start}

        while queue:
            x, y, path = queue.popleft()
            current_path = path + [(x, y)]

            if (x, y) == goal:
                return current_path

            for dx, dy in [(0, -1), (0, 1), (-1, 0), (1, 0)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < self.cols and 0 <= ny < self.rows and self.grid[ny][nx] == 0:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        queue.append((nx, ny, current_path))
        return []

    def draw_maze(self):
        self.canvas.delete("all")
        cs = self.cell_size
        ox = self.offset_x
        oy = self.offset_y

        # Desenhar Paredes e Caminhos
        for y in range(self.rows):
            for x in range(self.cols):
                px1 = ox + x * cs
                py1 = oy + y * cs
                px2 = px1 + cs
                py2 = py1 + cs

                if self.grid[y][x] == 1:
                    self.canvas.create_rectangle(px1, py1, px2, py2, fill="#111827", outline="#1e293b")
                else:
                    self.canvas.create_rectangle(px1, py1, px2, py2, fill="#0b1120", outline="")

        # Desenhar Caminho de Dica
        if self.hint_path:
            for x, y in self.hint_path:
                cx = ox + x * cs + cs // 2
                cy = oy + y * cs + cs // 2
                r = max(2, cs // 6)
                self.canvas.create_oval(cx - r, cy - r, cx + r, cy + r, fill="#38bdf8", outline="")

        # Desenhar Gemas
        for gx, gy in self.gems:
            cx = ox + gx * cs + cs // 2
            cy = oy + gy * cs + cs // 2
            r = max(3, cs // 3)
            self.canvas.create_oval(cx - r, cy - r, cx + r, cy + r, fill="#f59e0b", outline="#fbbf24")

        # Desenhar Saída (Portal Dourado / Roxo)
        ex = ox + self.exit_x * cs + cs // 2
        ey = oy + self.exit_y * cs + cs // 2
        er = max(4, int(cs * 0.4))
        self.canvas.create_oval(ex - er, ey - er, ex + er, ey + er, fill="#ec4899", outline="#f43f5e", width=2)
        self.canvas.create_text(ex, ey, text="🚪", font=("Segoe UI", max(8, cs // 2)))

        # Desenhar Jogador
        px = ox + self.player_x * cs + cs // 2
        py = oy + self.player_y * cs + cs // 2
        pr = max(4, int(cs * 0.38))
        self.canvas.create_oval(px - pr, py - pr, px + pr, py + pr, fill="#38bdf8", outline="#e0f2fe", width=2)


if __name__ == "__main__":
    root = tk.Tk()
    app = MazeGameApp(root)
    root.mainloop()
