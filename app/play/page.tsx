"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const rows = 6;
const cols = 6;
const maxMoves = 20;
const colors = ["red", "blue", "green", "yellow", "purple", "pink"];

type Block = {
  id: string;
  color: string;
};

function randomBlock(row: number, col: number): Block {
  return {
    id: `${row}-${col}-${Date.now()}-${Math.random()}`,
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function createBoard(): Block[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => randomBlock(row, col))
  );
}

function getColorClass(color: string) {
  switch (color) {
    case "red":
      return "bg-gradient-to-br from-red-400 to-red-600";
    case "blue":
      return "bg-gradient-to-br from-blue-400 to-blue-700";
    case "green":
      return "bg-gradient-to-br from-emerald-300 to-green-600";
    case "yellow":
      return "bg-gradient-to-br from-yellow-300 to-orange-400";
    case "purple":
      return "bg-gradient-to-br from-purple-400 to-fuchsia-700";
    case "pink":
      return "bg-gradient-to-br from-pink-300 to-rose-600";
    default:
      return "bg-slate-500";
  }
}

export default function PlayPage() {
  const [board, setBoard] = useState<Block[][] | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(maxMoves);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(1200);

  useEffect(() => {
    setBoard(createBoard());

    const savedHighScore = localStorage.getItem("blockpopx-high-score");

    if (savedHighScore) {
      setHighScore(Number(savedHighScore));
    }
  }, []);

  function handleBlockClick(rowIndex: number, colIndex: number) {
    if (!board || gameOver || levelComplete) return;

    const selectedColor = board[rowIndex][colIndex].color;
    const connected = findConnectedBlocks(rowIndex, colIndex, selectedColor);

    if (connected.length < 2) {
      setMessage("Find 2 or more matching blocks!");
      return;
    }

    const comboBonus = connected.length >= 6 ? 2 : connected.length >= 4 ? 1.5 : 1;
    const pointsEarned = Math.floor(
      connected.length * connected.length * 10 * comboBonus
    );

    const newScore = score + pointsEarned;
    const newMovesLeft = movesLeft - 1;

    setScore(newScore);
    setMovesLeft(newMovesLeft);

    if (connected.length >= 8) {
      setMessage(`🔥 Mega Pop! +${pointsEarned}`);
    } else if (connected.length >= 6) {
      setMessage(`💥 Super Combo! +${pointsEarned}`);
    } else if (connected.length >= 4) {
      setMessage(`⭐ Great Pop! +${pointsEarned}`);
    } else {
      setMessage(`Nice Pop! +${pointsEarned}`);
    }

    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("blockpopx-high-score", String(newScore));
    }

    const newBoard = removeAndDropBlocks(board, connected);
    setBoard(newBoard);

    if (newScore >= targetScore) {
      setLevelComplete(true);
      setMessage("🎉 Level Complete!");
      return;
    }

    if (newMovesLeft === 0) {
      setGameOver(true);
      setMessage("Game Over! Try again.");
    }
  }

  function findConnectedBlocks(
    rowIndex: number,
    colIndex: number,
    color: string
  ) {
    if (!board) return [];

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

  function removeAndDropBlocks(
    currentBoard: Block[][],
    connected: [number, number][]
  ) {
    const removeSet = new Set(connected.map(([r, c]) => `${r}-${c}`));

    const temporaryBoard: (Block | null)[][] = currentBoard.map((row, r) =>
      row.map((block, c) => (removeSet.has(`${r}-${c}`) ? null : block))
    );

    const nextBoard: Block[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => randomBlock(0, 0))
    );

    for (let col = 0; col < cols; col++) {
      const remainingBlocks: Block[] = [];

      for (let row = rows - 1; row >= 0; row--) {
        const block = temporaryBoard[row][col];

        if (block) {
          remainingBlocks.push(block);
        }
      }

      let writeRow = rows - 1;

      for (const block of remainingBlocks) {
        nextBoard[writeRow][col] = {
          ...block,
          id: `${writeRow}-${col}-${Date.now()}-${Math.random()}`,
        };
        writeRow--;
      }

      while (writeRow >= 0) {
        nextBoard[writeRow][col] = randomBlock(writeRow, col);
        writeRow--;
      }
    }

    return nextBoard;
  }

  function restartGame() {
    setBoard(createBoard());
    setScore(0);
    setMovesLeft(maxMoves);
    setGameOver(false);
    setLevelComplete(false);
    setMessage("");
  }

  function nextLevel() {
    const next = level + 1;
    setLevel(next);
    setTargetScore(1200 + next * 500);
    setBoard(createBoard());
    setScore(0);
    setMovesLeft(maxMoves);
    setGameOver(false);
    setLevelComplete(false);
    setMessage(`Level ${next} started!`);
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

  const progress = Math.min((score / targetScore) * 100, 100);

  if (!board) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <section className="flex min-h-screen items-center justify-center">
          <p className="font-bold text-cyan-400">Loading BlockPopX...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-black tracking-wide">
            <span className="text-cyan-400">Block</span>
            <span className="text-fuchsia-400">PopX</span>
          </Link>

          <nav className="flex items-center gap-5 text-sm text-slate-300">
            <Link href="/play" className="text-cyan-400">
              Play
            </Link>

            <Link href="/how-to-play" className="hover:text-cyan-400">
              How
            </Link>

            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-6">
        <div className="mx-auto max-w-[360px]">
          <section className="mb-3 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Arcade Puzzle Mode
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Block<span className="text-fuchsia-400">PopX</span>
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Pop blocks, hit the target, unlock the next level.
            </p>
          </section>

          <section className="mb-3 rounded-3xl border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-cyan-300">Level {level}</p>
              <p className="text-sm text-slate-300">Target: {targetScore}</p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </section>

          <section className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Score</p>
              <p className="text-xl font-black text-cyan-300">{score}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Best</p>
              <p className="text-xl font-black text-yellow-300">{highScore}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Moves</p>
              <p className="text-xl font-black text-fuchsia-300">{movesLeft}</p>
            </div>
          </section>

          {(gameOver || levelComplete) && (
            <section className="mb-3 rounded-3xl border border-cyan-300 bg-slate-900 p-5 text-center shadow-2xl">
              <h2 className="text-3xl font-black text-cyan-300">
                {levelComplete ? "Level Complete!" : "Game Over"}
              </h2>

              <p className="mt-2 text-sm text-slate-300">
                Final Score: {score}
              </p>

              <div className="mt-4 flex justify-center gap-2">
                {levelComplete ? (
                  <button
                    type="button"
                    onClick={nextLevel}
                    className="rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-5 py-2 text-sm font-black text-slate-950"
                  >
                    Next Level
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={restartGame}
                    className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-black text-slate-950"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </section>
          )}

          <section className="rounded-[2rem] border border-white/10 bg-slate-900/90 p-3 shadow-2xl">
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
                    disabled={gameOver || levelComplete}
                    className={`${getColorClass(
                      block.color
                    )} aspect-square rounded-2xl border border-white/30 shadow-lg shadow-black/30 transition hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60`}
                    aria-label={`${block.color} block`}
                  />
                ))
              )}
            </div>
          </section>

          {message && (
            <p className="mt-3 rounded-full bg-white/10 px-4 py-2 text-center text-sm font-bold text-cyan-200">
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
              Reset
            </button>

            <button
              type="button"
              onClick={shareScore}
              className="rounded-full bg-gradient-to-r from-cyan-300 to-fuchsia-400 px-3 py-2 text-xs font-black text-slate-950"
            >
              Share
            </button>
          </div>

          <p className="mt-3 text-center text-xs text-slate-400">
            Bigger groups = bigger bonus. Reach the target before moves run out.
          </p>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
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