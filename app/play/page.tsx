"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const rows = 6;
const cols = 6;
const maxMoves = 24;
const colors = ["red", "blue", "green", "yellow", "purple", "pink"];

type SpecialBlock = "bomb" | "rocket" | "lightning";

type Block = {
  id: string;
  color: string;
  special?: SpecialBlock;
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

function getColorClass(block: Block) {
  if (block.special === "bomb") {
    return "bg-gradient-to-br from-orange-300 via-red-500 to-rose-700";
  }

  if (block.special === "rocket") {
    return "bg-gradient-to-br from-cyan-300 via-blue-500 to-indigo-700";
  }

  if (block.special === "lightning") {
    return "bg-gradient-to-br from-yellow-200 via-amber-400 to-orange-600";
  }

  switch (block.color) {
    case "red":
      return "bg-gradient-to-br from-red-300 via-red-500 to-red-700";
    case "blue":
      return "bg-gradient-to-br from-sky-300 via-blue-500 to-blue-800";
    case "green":
      return "bg-gradient-to-br from-lime-300 via-emerald-500 to-green-700";
    case "yellow":
      return "bg-gradient-to-br from-yellow-200 via-yellow-400 to-orange-500";
    case "purple":
      return "bg-gradient-to-br from-violet-300 via-purple-500 to-fuchsia-800";
    case "pink":
      return "bg-gradient-to-br from-pink-300 via-rose-500 to-pink-700";
    default:
      return "bg-slate-500";
  }
}

function getSpecialIcon(block: Block) {
  if (block.special === "bomb") return "💣";
  if (block.special === "rocket") return "🚀";
  if (block.special === "lightning") return "⚡";
  return "";
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
  const [targetScore, setTargetScore] = useState(1800);
  const [streak, setStreak] = useState(0);
  const [bombsUsed, setBombsUsed] = useState(0);
  const [rocketsUsed, setRocketsUsed] = useState(0);
  const [lightningsUsed, setLightningsUsed] = useState(0);

  useEffect(() => {
    setBoard(createBoard());

    const savedHighScore = localStorage.getItem("blockpopx-high-score");

    if (savedHighScore) {
      setHighScore(Number(savedHighScore));
    }
  }, []);

  function handleBlockClick(rowIndex: number, colIndex: number) {
    if (!board || gameOver || levelComplete) return;

    const selectedBlock = board[rowIndex][colIndex];

    if (selectedBlock.special === "bomb") {
      activateBomb(rowIndex, colIndex);
      return;
    }

    if (selectedBlock.special === "rocket") {
      activateRocket(rowIndex);
      return;
    }

    if (selectedBlock.special === "lightning") {
      activateLightning(colIndex);
      return;
    }

    const connected = findConnectedBlocks(
      rowIndex,
      colIndex,
      selectedBlock.color
    );

    if (connected.length < 2) {
      setStreak(0);
      setMessage("Find 2 or more matching blocks!");
      return;
    }

    const newStreak = streak + 1;
    const streakMultiplier = 1 + newStreak * 0.12;

    let pointsEarned = Math.floor(
      connected.length * connected.length * 12 * streakMultiplier
    );

    if (connected.length >= 9) {
      pointsEarned += 450;
    } else if (connected.length >= 7) {
      pointsEarned += 250;
    } else if (connected.length >= 5) {
      pointsEarned += 120;
    }

    const newScore = score + pointsEarned;
    const newMovesLeft = movesLeft - 1;

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    setStreak(newStreak);

    const special =
      connected.length >= 9
        ? "lightning"
        : connected.length >= 7
        ? "rocket"
        : connected.length >= 5
        ? "bomb"
        : null;

    const newBoard = removeAndDropBlocks(board, connected, {
      row: rowIndex,
      col: colIndex,
      special,
      color: selectedBlock.color,
    });

    setBoard(newBoard);

    if (connected.length >= 9) {
      setMessage(`⚡ Power Pop! +${pointsEarned} Lightning created!`);
    } else if (connected.length >= 7) {
      setMessage(`🚀 Rocket Pop! +${pointsEarned} Rocket created!`);
    } else if (connected.length >= 5) {
      setMessage(`💣 Blast Pop! +${pointsEarned} Bomb created!`);
    } else if (newStreak >= 4) {
      setMessage(`🔥 Hot streak x${newStreak}! +${pointsEarned}`);
    } else {
      setMessage(`Nice Pop! +${pointsEarned}`);
    }

    finishMove(newScore, newMovesLeft);
  }

  function activateBomb(rowIndex: number, colIndex: number) {
    if (!board) return;

    const affected: [number, number][] = [];

    for (let r = rowIndex - 1; r <= rowIndex + 1; r++) {
      for (let c = colIndex - 1; c <= colIndex + 1; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols) {
          affected.push([r, c]);
        }
      }
    }

    const pointsEarned = affected.length * 90;
    const newScore = score + pointsEarned;
    const newMovesLeft = movesLeft - 1;

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    setStreak(streak + 1);
    setBombsUsed(bombsUsed + 1);
    setMessage(`💣 Bomb Blast! +${pointsEarned}`);

    setBoard(removeAndDropBlocks(board, affected));
    finishMove(newScore, newMovesLeft);
  }

  function activateRocket(rowIndex: number) {
    if (!board) return;

    const affected: [number, number][] = [];

    for (let col = 0; col < cols; col++) {
      affected.push([rowIndex, col]);
    }

    const pointsEarned = affected.length * 110;
    const newScore = score + pointsEarned;
    const newMovesLeft = movesLeft - 1;

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    setStreak(streak + 1);
    setRocketsUsed(rocketsUsed + 1);
    setMessage(`🚀 Rocket Row Clear! +${pointsEarned}`);

    setBoard(removeAndDropBlocks(board, affected));
    finishMove(newScore, newMovesLeft);
  }

  function activateLightning(colIndex: number) {
    if (!board) return;

    const affected: [number, number][] = [];

    for (let row = 0; row < rows; row++) {
      affected.push([row, colIndex]);
    }

    const pointsEarned = affected.length * 120;
    const newScore = score + pointsEarned;
    const newMovesLeft = movesLeft - 1;

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    setStreak(streak + 1);
    setLightningsUsed(lightningsUsed + 1);
    setMessage(`⚡ Lightning Column Clear! +${pointsEarned}`);

    setBoard(removeAndDropBlocks(board, affected));
    finishMove(newScore, newMovesLeft);
  }

  function finishMove(newScore: number, newMovesLeft: number) {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("blockpopx-high-score", String(newScore));
    }

    if (newScore >= targetScore) {
      setLevelComplete(true);
      setMessage("🎉 Level Complete! You reached the target!");
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
      if (board[r][c].special) return;
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
    connected: [number, number][],
    specialBlock?: {
      row: number;
      col: number;
      special: SpecialBlock | null;
      color: string;
    }
  ) {
    const removeSet = new Set(connected.map(([r, c]) => `${r}-${c}`));

    const temporaryBoard: (Block | null)[][] = currentBoard.map((row, r) =>
      row.map((block, c) => (removeSet.has(`${r}-${c}`) ? null : block))
    );

    if (specialBlock?.special) {
      temporaryBoard[specialBlock.row][specialBlock.col] = {
        id: `${specialBlock.row}-${specialBlock.col}-${Date.now()}-${Math.random()}`,
        color: specialBlock.color,
        special: specialBlock.special,
      };
    }

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
    setStreak(0);
    setBombsUsed(0);
    setRocketsUsed(0);
    setLightningsUsed(0);
  }

  function nextLevel() {
    const next = level + 1;

    setLevel(next);
    setTargetScore(1800 + next * 750);
    setBoard(createBoard());
    setScore(0);
    setMovesLeft(maxMoves);
    setGameOver(false);
    setLevelComplete(false);
    setMessage(`Level ${next} started!`);
    setStreak(0);
    setBombsUsed(0);
    setRocketsUsed(0);
    setLightningsUsed(0);
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
        <div className="mx-auto max-w-[390px]">
          <section className="mb-3 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
              Power Puzzle Mode
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Block<span className="text-fuchsia-400">PopX</span>
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Make combos, create boosters, and beat the level target.
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

          <section className="mb-3 grid grid-cols-4 gap-2">
            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Score</p>
              <p className="text-lg font-black text-cyan-300">{score}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Best</p>
              <p className="text-lg font-black text-yellow-300">{highScore}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Moves</p>
              <p className="text-lg font-black text-fuchsia-300">{movesLeft}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Streak</p>
              <p className="text-lg font-black text-green-300">{streak}</p>
            </div>
          </section>

          <section className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-2 text-center text-xs">
              💣 Bombs: {bombsUsed}
            </div>

            <div className="rounded-2xl bg-white/10 p-2 text-center text-xs">
              🚀 Rockets: {rocketsUsed}
            </div>

            <div className="rounded-2xl bg-white/10 p-2 text-center text-xs">
              ⚡ Bolts: {lightningsUsed}
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
                      block
                    )} relative aspect-square rounded-2xl border border-white/30 shadow-lg shadow-black/30 transition hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60`}
                    aria-label={`${block.color} block`}
                  >
                    {getSpecialIcon(block) && (
                      <span className="absolute inset-0 flex items-center justify-center text-xl">
                        {getSpecialIcon(block)}
                      </span>
                    )}
                  </button>
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
            5+ creates 💣. 7+ creates 🚀. 9+ creates ⚡. No rainbow blocks.
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