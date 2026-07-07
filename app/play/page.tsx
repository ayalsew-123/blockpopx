"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const rows = 6;
const cols = 6;
const maxMoves = 24;
const colors = ["red", "blue", "green", "yellow", "purple", "pink"];

type SpecialBlock = "bomb" | "rocket" | "lightning";

type Position = {
  row: number;
  col: number;
};

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

function isAdjacent(first: Position, second: Position) {
  const rowDistance = Math.abs(first.row - second.row);
  const colDistance = Math.abs(first.col - second.col);

  return rowDistance + colDistance === 1;
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
  const [selectedBlock, setSelectedBlock] = useState<Position | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  useEffect(() => {
    setBoard(createBoard());

    const savedHighScore = localStorage.getItem("blockpopx-high-score");

    if (savedHighScore) {
      setHighScore(Number(savedHighScore));
    }
  }, []);

  function handleBlockClick(rowIndex: number, colIndex: number) {
    if (!board || gameOver || levelComplete || isMoving) return;

    const clickedPosition = { row: rowIndex, col: colIndex };
    const clickedBlock = board[rowIndex][colIndex];

    if (clickedBlock.special === "bomb") {
      setSelectedBlock(null);
      activateBomb(rowIndex, colIndex);
      return;
    }

    if (clickedBlock.special === "rocket") {
      setSelectedBlock(null);
      activateRocket(rowIndex);
      return;
    }

    if (clickedBlock.special === "lightning") {
      setSelectedBlock(null);
      activateLightning(colIndex);
      return;
    }

    if (selectedBlock) {
      if (selectedBlock.row === rowIndex && selectedBlock.col === colIndex) {
        setSelectedBlock(null);
        setMessage("Selection canceled.");
        return;
      }

      if (isAdjacent(selectedBlock, clickedPosition)) {
        trySwap(selectedBlock, clickedPosition);
        return;
      }

      setSelectedBlock(clickedPosition);
      setMessage("Block selected. Tap a nearby block to swap.");
      return;
    }

    const connected = findConnectedBlocks(
      board,
      rowIndex,
      colIndex,
      clickedBlock.color
    );

    if (connected.length >= 2) {
      popConnectedBlocks(board, connected, rowIndex, colIndex, clickedBlock.color);
      return;
    }

    setSelectedBlock(clickedPosition);
    setMessage("Block selected. Tap a nearby block to swap.");
  }

  function trySwap(first: Position, second: Position) {
    if (!board) return;

    const swappedBoard = board.map((row) => row.map((block) => ({ ...block })));

    const temp = swappedBoard[first.row][first.col];
    swappedBoard[first.row][first.col] = swappedBoard[second.row][second.col];
    swappedBoard[second.row][second.col] = temp;

    setBoard(swappedBoard);
    setSelectedBlock(null);
    setIsMoving(true);
    setMessage("Smart swap...");

    setTimeout(() => {
      const firstBlock = swappedBoard[first.row][first.col];
      const secondBlock = swappedBoard[second.row][second.col];

      const firstMatch = findConnectedBlocks(
        swappedBoard,
        first.row,
        first.col,
        firstBlock.color
      );

      const secondMatch = findConnectedBlocks(
        swappedBoard,
        second.row,
        second.col,
        secondBlock.color
      );

      const bestMatch =
        firstMatch.length >= secondMatch.length ? firstMatch : secondMatch;

      if (bestMatch.length < 2) {
        setBoard(board);
        setStreak(0);
        setMessage("No match. Blocks moved back.");
        setIsMoving(false);
        return;
      }

      popConnectedBlocks(
        swappedBoard,
        bestMatch,
        bestMatch[0][0],
        bestMatch[0][1],
        swappedBoard[bestMatch[0][0]][bestMatch[0][1]].color,
        true
      );

      setIsMoving(false);
    }, 250);
  }

  function popConnectedBlocks(
    currentBoard: Block[][],
    connected: [number, number][],
    rowIndex: number,
    colIndex: number,
    color: string,
    usedSwap = false
  ) {
    setIsMoving(true);

    const newStreak = streak + 1;
    const streakMultiplier = 1 + newStreak * 0.12;

    let pointsEarned = Math.floor(
      connected.length * connected.length * 12 * streakMultiplier
    );

    if (usedSwap) {
      pointsEarned += 100;
    }

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

    const newBoard = removeAndDropBlocks(currentBoard, connected, {
      row: rowIndex,
      col: colIndex,
      special,
      color,
    });

    setTimeout(() => {
      setBoard(newBoard);
      setIsMoving(false);
    }, 150);

    if (usedSwap && connected.length >= 5) {
      setMessage(`🧠 Smart combo! +${pointsEarned} Booster created!`);
    } else if (usedSwap) {
      setMessage(`🧠 Smart move! +${pointsEarned}`);
    } else if (connected.length >= 9) {
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

    setIsMoving(true);

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

    const nextBoard = removeAndDropBlocks(board, affected);

    setTimeout(() => {
      setBoard(nextBoard);
      setIsMoving(false);
    }, 150);

    finishMove(newScore, newMovesLeft);
  }

  function activateRocket(rowIndex: number) {
    if (!board) return;

    setIsMoving(true);

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

    const nextBoard = removeAndDropBlocks(board, affected);

    setTimeout(() => {
      setBoard(nextBoard);
      setIsMoving(false);
    }, 150);

    finishMove(newScore, newMovesLeft);
  }

  function activateLightning(colIndex: number) {
    if (!board) return;

    setIsMoving(true);

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

    const nextBoard = removeAndDropBlocks(board, affected);

    setTimeout(() => {
      setBoard(nextBoard);
      setIsMoving(false);
    }, 150);

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
    currentBoard: Block[][],
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
      if (currentBoard[r][c].special) return;
      if (currentBoard[r][c].color !== color) return;

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
    setSelectedBlock(null);
    setIsMoving(false);
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
    setSelectedBlock(null);
    setIsMoving(false);
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
              Smart Puzzle Mode
            </p>

            <h1 className="mt-2 text-4xl font-black">
              Block<span className="text-fuchsia-400">PopX</span>
            </h1>

            <p className="mt-2 text-sm text-slate-300">
              Pop groups or swap nearby blocks to create smart combos.
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

          <section className="mb-3 grid grid-cols-2 gap-2">
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

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Streak</p>
              <p className="text-xl font-black text-green-300">{streak}</p>
            </div>
          </section>

          <section className="mb-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/10 p-2 text-center text-xs">
              💣 {bombsUsed}
            </div>

            <div className="rounded-2xl bg-white/10 p-2 text-center text-xs">
              🚀 {rocketsUsed}
            </div>

            <div className="rounded-2xl bg-white/10 p-2 text-center text-xs">
              ⚡ {lightningsUsed}
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
              className={`grid gap-2 transition-all duration-300 ${
                isMoving ? "scale-95 opacity-90" : "scale-100 opacity-100"
              }`}
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((block, colIndex) => {
                  const isSelected =
                    selectedBlock?.row === rowIndex &&
                    selectedBlock?.col === colIndex;

                  return (
                    <button
                      type="button"
                      key={block.id}
                      onClick={() => handleBlockClick(rowIndex, colIndex)}
                      disabled={gameOver || levelComplete || isMoving}
                      className={`${getColorClass(
                        block
                      )} relative aspect-square rounded-2xl border shadow-lg shadow-black/30 transition-all duration-300 hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70 ${
                        isSelected
                          ? "border-yellow-300 ring-4 ring-yellow-300 scale-105"
                          : "border-white/30"
                      }`}
                      aria-label={`${block.color} block`}
                    >
                      {getSpecialIcon(block) && (
                        <span className="absolute inset-0 flex items-center justify-center text-xl">
                          {getSpecialIcon(block)}
                        </span>
                      )}
                    </button>
                  );
                })
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
            Tap groups to pop. Tap one block then nearby block to swap smart.
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