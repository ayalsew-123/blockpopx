"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const rows = 6;
const cols = 6;
const maxMoves = 20;
const colors = ["red", "blue", "green", "yellow", "purple"];

type Block = {
  id: string;
  color: string;
};

function createBoard(): Block[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      id: `${row}-${col}-${Math.random()}`,
      color: colors[Math.floor(Math.random() * colors.length)],
    }))
  );
}

function getColorClass(color: string) {
  switch (color) {
    case "red":
      return "bg-red-500";
    case "blue":
      return "bg-blue-500";
    case "green":
      return "bg-green-500";
    case "yellow":
      return "bg-yellow-400";
    case "purple":
      return "bg-purple-500";
    default:
      return "bg-slate-500";
  }
}

export default function PlayPage() {
  const [board, setBoard] = useState<Block[][]>(createBoard);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(maxMoves);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedHighScore = localStorage.getItem("blockpopx-high-score");

    if (savedHighScore) {
      setHighScore(Number(savedHighScore));
    }
  }, []);

  function handleBlockClick(rowIndex: number, colIndex: number) {
    if (gameOver) return;

    const selectedColor = board[rowIndex][colIndex].color;
    const connected = findConnectedBlocks(rowIndex, colIndex, selectedColor);

    if (connected.length < 2) {
      setMessage("Tap 2 or more matching blocks.");
      return;
    }

    const pointsEarned = connected.length * connected.length * 10;
    const newScore = score + pointsEarned;
    const newMovesLeft = movesLeft - 1;

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    setMessage(`Nice! +${pointsEarned} points`);

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("blockpopx-high-score", String(newScore));
    }

    const newBoard = board.map((row) =>
      row.map((block) => ({
        ...block,
      }))
    );

    connected.forEach(([r, c]) => {
      newBoard[r][c] = {
        id: `${r}-${c}-${Math.random()}`,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });

    setBoard(newBoard);

    if (newMovesLeft === 0) {
      setGameOver(true);
      setMessage("Game Over! Great job.");
    }
  }

  function findConnectedBlocks(
    rowIndex: number,
    colIndex: number,
    color: string
  ) {
    const visited = new Set<string>();
    const result: [number, number][] = [];

    function search(r: number, c: number) {
      const key = `${r}-${c}`;

      if (r < 0 || r >= rows) return;
      if (c < 0 || c >= cols) return;
      if (visited.has(key)) return;
      if (board[r][c].color !== color) return;

      visited.add(key);
      result.push([r, c]);

      search(r - 1, c);
      search(r + 1, c);
      search(r, c - 1);
      search(r, c + 1);
    }

    search(rowIndex, colIndex);
    return result;
  }

  function restartGame() {
    setBoard(createBoard());
    setScore(0);
    setMovesLeft(maxMoves);
    setGameOver(false);
    setMessage("");
  }

  function resetHighScore() {
    localStorage.removeItem("blockpopx-high-score");
    setHighScore(0);
    setMessage("High score reset.");
  }

  async function shareScore() {
    const shareUrl = "https://www.blockpopx.com/play";
    const shareText = `🎮 I scored ${score} points on BlockPopX! Can you beat me? ${shareUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BlockPopX",
          text: `🎮 I scored ${score} points on BlockPopX! Can you beat me?`,
          url: shareUrl,
        });

        setMessage("Thanks for sharing BlockPopX!");
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        setMessage("Share link copied!");
        return;
      }

      setMessage("Copy this link: https://www.blockpopx.com/play");
    } catch {
      setMessage("Share canceled or not supported.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-black tracking-wide">
            <span className="text-cyan-400">Block</span>PopX
          </Link>

          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <Link href="/play" className="text-cyan-400">
              Play
            </Link>

            <Link href="/how-to-play" className="hover:text-cyan-400">
              How to Play
            </Link>

            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-6">
        <div className="mx-auto max-w-[330px]">
          <section className="text-center mb-3">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Play Now
            </p>

            <h1 className="mt-2 text-3xl font-black">BlockPopX</h1>

            <p className="mt-2 text-sm text-slate-400">
              Tap 2 or more matching blocks to score.
            </p>
          </section>

          <section className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-slate-900 p-3 text-center">
              <p className="text-xs text-slate-400">Score</p>
              <p className="text-xl font-bold">{score}</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-3 text-center">
              <p className="text-xs text-slate-400">High Score</p>
              <p className="text-xl font-bold">{highScore}</p>
            </div>

            <div className="rounded-2xl bg-slate-900 p-3 text-center">
              <p className="text-xs text-slate-400">Moves</p>
              <p className="text-xl font-bold">{movesLeft}</p>
            </div>
          </section>

          {gameOver && (
            <section className="mb-3 rounded-2xl border border-cyan-400 bg-slate-900 p-4 text-center">
              <h2 className="text-2xl font-bold text-cyan-400">Game Over</h2>
              <p className="mt-1 text-sm text-slate-300">
                Final Score: {score}
              </p>

              <button
                type="button"
                onClick={restartGame}
                className="mt-3 rounded-full bg-cyan-400 px-5 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
              >
                Play Again
              </button>
            </section>
          )}

          <section className="rounded-3xl bg-slate-900 p-2 shadow-xl">
            <div
              className="grid gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((block, colIndex) => (
                  <button
                    type="button"
                    key={block.id}
                    onClick={() => handleBlockClick(rowIndex, colIndex)}
                    disabled={gameOver}
                    className={`${getColorClass(
                      block.color
                    )} aspect-square rounded-lg shadow-md transition hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60`}
                    aria-label={`${block.color} block`}
                  />
                ))
              )}
            </div>
          </section>

          {message && (
            <p className="mt-2 text-center text-sm font-semibold text-cyan-400">
              {message}
            </p>
          )}

          <div className="mt-3 flex justify-center gap-2">
            <button
              type="button"
              onClick={restartGame}
              className="rounded-full bg-slate-800 px-3 py-2 text-xs font-bold hover:bg-slate-700"
            >
              Restart
            </button>

            <button
              type="button"
              onClick={resetHighScore}
              className="rounded-full bg-slate-800 px-3 py-2 text-xs font-bold hover:bg-slate-700"
            >
              Reset Score
            </button>

            <button
              type="button"
              onClick={shareScore}
              className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
            >
              Share
            </button>
          </div>

          <p className="mt-2 text-center text-xs text-slate-500">
            You have 20 moves. Bigger groups give bigger points.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">
        <p>© 2026 BlockPopX. All rights reserved.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>

          <Link href="/how-to-play" className="hover:text-cyan-400">
            How to Play
          </Link>

          <Link href="/privacy" className="hover:text-cyan-400">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </main>
  );
}