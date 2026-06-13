#!/usr/bin/env python3
"""
Snake Game - 터미널 뱀 게임
방향키 또는 WASD로 뱀을 조종하세요!
"""

import os
import sys
import time
import random
import threading

try:
    import termios
    import tty
    UNIX = True
except ImportError:
    UNIX = False

# 게임 설정
WIDTH = 30
HEIGHT = 20
INITIAL_SPEED = 0.15

# 심볼
SNAKE_HEAD = '@'
SNAKE_BODY = 'O'
FOOD = '*'
WALL = '#'
EMPTY = ' '

# 방향
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)


class Snake:
    def __init__(self):
        start_x = WIDTH // 2
        start_y = HEIGHT // 2
        self.body = [(start_x, start_y), (start_x - 1, start_y), (start_x - 2, start_y)]
        self.direction = RIGHT
        self.next_direction = RIGHT
        self.alive = True
        self.score = 0

    def head(self):
        return self.body[0]

    def set_direction(self, direction):
        # 반대 방향으로는 이동 불가
        opposite = (-self.direction[0], -self.direction[1])
        if direction != opposite:
            self.next_direction = direction

    def move(self, food_pos):
        self.direction = self.next_direction
        head_x, head_y = self.head()
        new_head = (head_x + self.direction[0], head_y + self.direction[1])

        # 벽 충돌 확인
        if new_head[0] <= 0 or new_head[0] >= WIDTH - 1 or \
           new_head[1] <= 0 or new_head[1] >= HEIGHT - 1:
            self.alive = False
            return False

        # 자기 몸과 충돌 확인
        if new_head in self.body[:-1]:
            self.alive = False
            return False

        self.body.insert(0, new_head)

        # 음식 먹었는지 확인
        if new_head == food_pos:
            self.score += 10
            return True  # 음식 먹음
        else:
            self.body.pop()
            return False  # 음식 못 먹음


class Game:
    def __init__(self):
        self.snake = Snake()
        self.food = self.spawn_food()
        self.running = True
        self.paused = False
        self.speed = INITIAL_SPEED
        self.input_buffer = None
        self.lock = threading.Lock()

    def spawn_food(self):
        while True:
            x = random.randint(1, WIDTH - 2)
            y = random.randint(1, HEIGHT - 2)
            if not hasattr(self, 'snake') or (x, y) not in self.snake.body:
                return (x, y)

    def render(self):
        # 게임판 초기화
        board = [[EMPTY for _ in range(WIDTH)] for _ in range(HEIGHT)]

        # 벽 그리기
        for x in range(WIDTH):
            board[0][x] = WALL
            board[HEIGHT - 1][x] = WALL
        for y in range(HEIGHT):
            board[y][0] = WALL
            board[y][WIDTH - 1] = WALL

        # 음식 그리기
        fx, fy = self.food
        board[fy][fx] = FOOD

        # 뱀 그리기
        for i, (x, y) in enumerate(self.snake.body):
            if 0 < x < WIDTH - 1 and 0 < y < HEIGHT - 1:
                board[y][x] = SNAKE_HEAD if i == 0 else SNAKE_BODY

        # 화면 출력
        os.system('clear' if os.name == 'posix' else 'cls')
        print("=" * (WIDTH + 2))
        print(f"  뱀 게임 (Snake)   점수: {self.snake.score}   레벨: {self.get_level()}")
        print("=" * (WIDTH + 2))
        for row in board:
            print(''.join(row))
        print("=" * (WIDTH + 2))
        print("조작: WASD 또는 방향키  |  P: 일시정지  |  Q: 종료")
        if self.paused:
            print("\n  *** 일시정지 (P 키를 눌러 계속) ***")

    def get_level(self):
        return self.snake.score // 50 + 1

    def update_speed(self):
        level = self.get_level()
        self.speed = max(0.05, INITIAL_SPEED - (level - 1) * 0.02)

    def run(self):
        if UNIX:
            self._run_unix()
        else:
            print("이 게임은 Unix/Linux/Mac 터미널에서 실행해주세요.")
            sys.exit(1)

    def _get_key_unix(self):
        """Unix에서 키 입력 읽기"""
        fd = sys.stdin.fileno()
        old_settings = termios.tcgetattr(fd)
        try:
            tty.setraw(sys.stdin.fileno())
            ch = sys.stdin.read(1)
            if ch == '\x1b':
                ch2 = sys.stdin.read(1)
                ch3 = sys.stdin.read(1)
                return ch + ch2 + ch3
            return ch
        finally:
            termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)

    def _input_thread(self):
        """별도 스레드에서 입력 처리"""
        while self.running:
            try:
                key = self._get_key_unix()
                with self.lock:
                    self.input_buffer = key
            except Exception:
                break

    def _process_input(self):
        with self.lock:
            key = self.input_buffer
            self.input_buffer = None

        if key is None:
            return

        key_lower = key.lower()

        if key_lower == 'q' or key == '\x03':  # Q 또는 Ctrl+C
            self.running = False
        elif key_lower == 'p':
            self.paused = not self.paused
        elif not self.paused:
            if key_lower == 'w' or key == '\x1b[A':
                self.snake.set_direction(UP)
            elif key_lower == 's' or key == '\x1b[B':
                self.snake.set_direction(DOWN)
            elif key_lower == 'a' or key == '\x1b[D':
                self.snake.set_direction(LEFT)
            elif key_lower == 'd' or key == '\x1b[C':
                self.snake.set_direction(RIGHT)

    def _run_unix(self):
        # 입력 스레드 시작
        input_thread = threading.Thread(target=self._input_thread, daemon=True)
        input_thread.start()

        while self.running and self.snake.alive:
            self._process_input()

            if not self.paused:
                ate_food = self.snake.move(self.food)
                if ate_food:
                    self.food = self.spawn_food()
                    self.update_speed()

            self.render()
            time.sleep(self.speed)

        self.running = False

        # 게임 오버 화면
        os.system('clear' if os.name == 'posix' else 'cls')
        print("\n" + "=" * 40)
        print("         게임 오버!")
        print("=" * 40)
        print(f"  최종 점수: {self.snake.score}")
        print(f"  도달 레벨: {self.get_level()}")
        snake_len = len(self.snake.body)
        print(f"  뱀 길이:   {snake_len}")
        print("=" * 40)
        if self.snake.score >= 100:
            print("  훌륭해요! 대단한 실력입니다!")
        elif self.snake.score >= 50:
            print("  잘 하셨어요!")
        else:
            print("  다시 도전해보세요!")
        print("=" * 40)
        print("\n엔터를 눌러 종료...")
        input()


def main():
    print("=" * 40)
    print("     뱀 게임에 오신 것을 환영합니다!")
    print("=" * 40)
    print()
    print("조작 방법:")
    print("  W / 위 방향키  : 위로 이동")
    print("  S / 아래 방향키: 아래로 이동")
    print("  A / 왼쪽 방향키: 왼쪽 이동")
    print("  D / 오른쪽 방향키: 오른쪽 이동")
    print("  P           : 일시정지/재개")
    print("  Q           : 종료")
    print()
    print(f"  {FOOD} = 음식 (먹으면 +10점)")
    print(f"  {SNAKE_HEAD} = 뱀 머리")
    print(f"  {SNAKE_BODY} = 뱀 몸통")
    print(f"  {WALL} = 벽 (닿으면 게임 오버)")
    print()
    print("음식을 먹을수록 속도가 빨라집니다!")
    print()
    input("엔터를 눌러 시작...")

    game = Game()
    game.run()


if __name__ == '__main__':
    main()
