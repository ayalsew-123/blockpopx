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
    if (gameOver) {
      return;
    }

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
    const shareText = `I scored ${score} on BlockPopX! Play here: https://www.blockpopx.com`;

    try {
      await navigator.clipboard.writeText(shareText);
      setMessage("Score copied. Share it with your friends!");
    } catch {
      setMessage("Could not copy score. Try again.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-4">
      <div className="mx-auto max-w-md">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/" className="text-cyan-400 hover:text-cyan-300">
            ← Home
          </Link>

          <button
            type="button"
            onClick={restartGame}
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-bold hover:bg-slate-700"
          >
            Restart
          </button>
        </div>

        <section className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2">BlockPopX</h1>
          <p className="text-slate-400">
            Tap 2 or more matching blocks to score.
          </p>
        </section>

        <section className="mb-4 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-slate-900 p-4 text-center">
            <p className="text-sm text-slate-400">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4 text-center">
            <p className="text-sm text-slate-400">High Score</p>
            <p className="text-2xl font-bold">{highScore}</p>
          </div>

          <div className="rounded-2xl bg-slate-900 p-4 text-center">
            <p className="text-sm text-slate-400">Moves</p>
            <p className="text-2xl font-bold">{movesLeft}</p>
          </div>
        </section>

        {gameOver && (
          <section className="mb-4 rounded-3xl border border-cyan-400 bg-slate-900 p-5 text-center">
            <h2 className="text-3xl font-bold text-cyan-400">Game Over</h2>
            <p className="mt-2 text-slate-300">Final Score: {score}</p>

            <button
              type="button"
              onClick={restartGame}
              className="mt-4 rounded-full bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300"
            >
              Play Again
            </button>
          </section>
        )}

        <section className="rounded-3xl bg-slate-900 p-3 shadow-xl">
          <div
            className="grid gap-2"
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
          <p className="mt-4 text-center text-sm font-semibold text-cyan-400">
            {message}
          </p>
        )}

        <div className="mt-4 flex justify-center gap-3">
          <button
            type="button"
            onClick={resetHighScore}
            className="rounded-full bg-slate-800 px-4 py-2 text-sm font-bold hover:bg-slate-700"
          >
            Reset High Score
          </button>

          <button
            type="button"
            onClick={shareScore}
            className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
          >
            Share Score
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">
          You have 20 moves. Bigger groups give bigger points.
        </p>
      </div>
    </main>
  );
}