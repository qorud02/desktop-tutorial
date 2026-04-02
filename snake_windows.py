"""
Snake Game - 윈도우 CMD 뱀 게임
Python 3.x에서 실행 가능 (외부 라이브러리 불필요)

실행 방법: python snake_windows.py
조작: W/A/S/D 또는 방향키, P=일시정지, Q=종료
"""

import os
import sys
import time
import random
import threading
import msvcrt

# 게임 설정
WIDTH = 40
HEIGHT = 22
INITIAL_SPEED = 0.15

# 심볼
SNAKE_HEAD = '@'
SNAKE_BODY = 'O'
FOOD = '*'
WALL = '#'
EMPTY = ' '

# 방향
UP    = (0, -1)
DOWN  = (0,  1)
LEFT  = (-1, 0)
RIGHT = (1,  0)


class Snake:
    def __init__(self):
        sx = WIDTH // 2
        sy = HEIGHT // 2
        self.body = [(sx, sy), (sx-1, sy), (sx-2, sy)]
        self.direction = RIGHT
        self.next_dir   = RIGHT
        self.alive  = True
        self.score  = 0

    def head(self):
        return self.body[0]

    def set_direction(self, d):
        opposite = (-self.direction[0], -self.direction[1])
        if d != opposite:
            self.next_dir = d

    def move(self, food):
        self.direction = self.next_dir
        hx, hy = self.head()
        nx, ny = hx + self.direction[0], hy + self.direction[1]

        if nx <= 0 or nx >= WIDTH-1 or ny <= 0 or ny >= HEIGHT-1:
            self.alive = False
            return False

        if (nx, ny) in self.body[:-1]:
            self.alive = False
            return False

        self.body.insert(0, (nx, ny))

        if (nx, ny) == food:
            self.score += 10
            return True
        else:
            self.body.pop()
            return False


class Game:
    def __init__(self):
        self.snake   = Snake()
        self.food    = self._spawn_food()
        self.running = True
        self.paused  = False
        self.speed   = INITIAL_SPEED
        self._key    = None
        self._lock   = threading.Lock()

    # ── 음식 생성 ──────────────────────────────────
    def _spawn_food(self):
        while True:
            x = random.randint(1, WIDTH-2)
            y = random.randint(1, HEIGHT-2)
            if not hasattr(self, 'snake') or (x, y) not in self.snake.body:
                return (x, y)

    # ── 레벨 / 속도 ────────────────────────────────
    def level(self):
        return self.snake.score // 50 + 1

    def _update_speed(self):
        self.speed = max(0.05, INITIAL_SPEED - (self.level()-1) * 0.02)

    # ── 화면 렌더링 ────────────────────────────────
    def _render(self):
        board = [[EMPTY]*WIDTH for _ in range(HEIGHT)]
        for x in range(WIDTH):
            board[0][x] = board[HEIGHT-1][x] = WALL
        for y in range(HEIGHT):
            board[y][0] = board[y][WIDTH-1] = WALL

        fx, fy = self.food
        board[fy][fx] = FOOD

        for i, (x, y) in enumerate(self.snake.body):
            if 0 < x < WIDTH-1 and 0 < y < HEIGHT-1:
                board[y][x] = SNAKE_HEAD if i == 0 else SNAKE_BODY

        os.system('cls')
        bar = '=' * (WIDTH + 2)
        print(bar)
        print(f"  뱀 게임   점수: {self.snake.score:<6} 레벨: {self.level()}   길이: {len(self.snake.body)}")
        print(bar)
        for row in board:
            print(''.join(row))
        print(bar)
        print("  W/A/S/D 또는 방향키  |  P: 일시정지  |  Q: 종료")
        if self.paused:
            print("\n  *** 일시정지 중 — P 를 눌러 계속 ***")

    # ── 키 입력 (별도 스레드) ─────────────────────
    def _input_loop(self):
        while self.running:
            if msvcrt.kbhit():
                ch = msvcrt.getwch()
                if ch in ('\x00', '\xe0'):   # 방향키 (2-byte)
                    ext = msvcrt.getwch()
                    mapping = {
                        'H': UP, 'P': DOWN, 'K': LEFT, 'M': RIGHT
                    }
                    if ext in mapping:
                        with self._lock:
                            self._key = ('dir', mapping[ext])
                else:
                    with self._lock:
                        self._key = ('char', ch.lower())
            time.sleep(0.01)

    # ── 입력 처리 ──────────────────────────────────
    def _process_input(self):
        with self._lock:
            ev = self._key
            self._key = None
        if ev is None:
            return
        kind, val = ev
        if kind == 'char':
            if val == 'q':
                self.running = False
            elif val == 'p':
                self.paused = not self.paused
            elif not self.paused:
                {'w': UP, 's': DOWN, 'a': LEFT, 'd': RIGHT}.get(val) and \
                    self.snake.set_direction({'w': UP, 's': DOWN, 'a': LEFT, 'd': RIGHT}[val])
        elif kind == 'dir' and not self.paused:
            self.snake.set_direction(val)

    # ── 메인 루프 ──────────────────────────────────
    def run(self):
        t = threading.Thread(target=self._input_loop, daemon=True)
        t.start()

        while self.running and self.snake.alive:
            self._process_input()
            if not self.paused:
                if self.snake.move(self.food):
                    self.food = self._spawn_food()
                    self._update_speed()
            self._render()
            time.sleep(self.speed)

        self.running = False
        self._game_over()

    # ── 게임 오버 ──────────────────────────────────
    def _game_over(self):
        os.system('cls')
        lines = [
            "",
            "  ╔══════════════════════════╗",
            "  ║        게 임  오 버       ║",
            "  ╠══════════════════════════╣",
            f"  ║  최종 점수 : {self.snake.score:<13}║",
            f"  ║  도달 레벨 : {self.level():<13}║",
            f"  ║  뱀  길이 : {len(self.snake.body):<13}║",
            "  ╠══════════════════════════╣",
        ]
        if self.snake.score >= 200:
            lines.append("  ║  완벽합니다! 전설적인 실력!  ║")
        elif self.snake.score >= 100:
            lines.append("  ║  훌륭해요! 대단한 실력입니다!║")
        elif self.snake.score >= 50:
            lines.append("  ║  잘 하셨어요! 계속 도전!    ║")
        else:
            lines.append("  ║  다시 도전해보세요!          ║")
        lines += [
            "  ╚══════════════════════════╝",
            "",
            "  아무 키나 눌러 종료...",
        ]
        print('\n'.join(lines))
        msvcrt.getwch()


# ── 시작 화면 ──────────────────────────────────────
def intro():
    os.system('cls')
    print("""
  ╔══════════════════════════════════════╗
  ║      뱀 게임 (Snake Game) v1.0       ║
  ╠══════════════════════════════════════╣
  ║  조작 방법                           ║
  ║    W / ↑  : 위로 이동               ║
  ║    S / ↓  : 아래로 이동             ║
  ║    A / ←  : 왼쪽 이동              ║
  ║    D / →  : 오른쪽 이동             ║
  ║    P      : 일시정지 / 재개          ║
  ║    Q      : 종료                    ║
  ╠══════════════════════════════════════╣
  ║  * = 음식 (+10점)                   ║
  ║  @ = 뱀 머리   O = 뱀 몸통          ║
  ║  # = 벽 (닿으면 게임 오버)           ║
  ╠══════════════════════════════════════╣
  ║  음식을 먹을수록 속도가 빨라집니다!  ║
  ╚══════════════════════════════════════╝

  아무 키나 눌러 시작...
""")
    msvcrt.getwch()


if __name__ == '__main__':
    if os.name != 'nt':
        print("이 파일은 Windows 전용입니다.")
        print("Linux/Mac 에서는 snake_game.py 를 사용하세요.")
        sys.exit(1)
    while True:
        intro()
        Game().run()
        os.system('cls')
        print("\n  다시 플레이하시겠습니까? (Y/N)")
        ch = msvcrt.getwch().lower()
        if ch != 'y':
            break
    os.system('cls')
    print("  게임을 종료합니다. 감사합니다!\n")
