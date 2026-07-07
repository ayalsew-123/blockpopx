"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const rows = 6;
const cols = 6;
const maxMoves = 20;
const maxFouls = 5;
const maxPrizeCharge = 100;
const maxPipCharge = 12;
const colors = ["red", "blue", "green", "yellow", "purple", "pink"] as const;

type SpecialBlock = "bomb" | "rocket" | "lightning";
type PrizeType = "moves" | "points" | "shuffle";
type GravityDirection = "down" | "up";
type MoveAnimation = "none" | "up" | "down" | "shuffle" | "relocate";
type SoundCue = "pop" | "goal" | "prize" | "blast" | "win" | "big" | "foul";
type BlockColor = (typeof colors)[number];
type ColorGoals = Record<BlockColor, number>;

type Position = {
  row: number;
  col: number;
};

type Block = {
  id: string;
  color: BlockColor;
  special?: SpecialBlock;
  locked?: boolean;
  prize?: PrizeType;
  pips?: number;
};

const colorLabels: Record<BlockColor, string> = {
  red: "Ruby",
  blue: "Aqua",
  green: "Lime",
  yellow: "Solar",
  purple: "Violet",
  pink: "Rose",
};

function randomBlock(row: number, col: number, currentLevel = 1): Block {
  const block: Block = {
    id: createBlockId(row, col),
    color: colors[Math.floor(Math.random() * colors.length)],
  };

  const lockChance = Math.min(0.025 + currentLevel * 0.008, 0.095);
  const prizeChance = 0.025;

  if (Math.random() < lockChance) {
    block.locked = true;
  } else if (Math.random() < prizeChance) {
    block.prize = randomPrizeType();
  } else if (Math.random() < 0.22) {
    block.pips = Math.floor(Math.random() * 3) + 1;
  }

  return block;
}

function createBlockId(row: number, col: number) {
  return `${row}-${col}-${Date.now()}-${Math.random()}`;
}

function createBoard(currentLevel = 1): Block[][] {
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) =>
      randomBlock(row, col, currentLevel)
    )
  );
}

function randomPrizeType(): PrizeType {
  const prizes: PrizeType[] = ["moves", "points", "shuffle"];
  return prizes[Math.floor(Math.random() * prizes.length)];
}

function getPrizeReward(prize: PrizeType) {
  switch (prize) {
    case "moves":
      return {
        score: 0,
        moves: 1,
        shuffles: 0,
        text: "-1 foul",
      };
    case "points":
      return {
        score: 450,
        moves: 0,
        shuffles: 0,
        text: "+450 points",
      };
    case "shuffle":
      return {
        score: 0,
        moves: 0,
        shuffles: 1,
        text: "+1 shuffle",
      };
  }
}

function playGameSound(cue: SoundCue) {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & {
        webkitAudioContext?: typeof AudioContext;
      }).webkitAudioContext;

    if (!AudioContextClass) return;

    const audioWindow = window as typeof window & {
      blockpopxAudio?: AudioContext;
    };
    const audioContext =
      audioWindow.blockpopxAudio ?? new AudioContextClass();
    audioWindow.blockpopxAudio = audioContext;

    const now = audioContext.currentTime;
    const notes: Record<SoundCue, number[]> = {
      pop: [520, 660],
      goal: [660, 880, 1100],
      prize: [740, 990],
      blast: [320, 520, 820],
      win: [520, 700, 940, 1250],
      big: [620, 860, 1180],
      foul: [190, 150],
    };

    notes[cue].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = now + index * 0.065;

      oscillator.type = cue === "blast" || cue === "foul" ? "sawtooth" : "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.045, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.18);
    });
  } catch {
    // Sound is optional and should never interrupt gameplay.
  }
}

function createEmptyGoals(): ColorGoals {
  return colors.reduce(
    (goals, color) => ({
      ...goals,
      [color]: 0,
    }),
    {} as ColorGoals
  );
}

function createLevelGoals(currentLevel: number): ColorGoals {
  const primaryColor = colors[(currentLevel - 1) % colors.length];
  const secondaryColor = colors[(currentLevel + 2) % colors.length];

  return {
    ...createEmptyGoals(),
    [primaryColor]: 8 + currentLevel * 2,
    [secondaryColor]: 5 + currentLevel,
  };
}

function getRemainingGoalCount(goals: ColorGoals) {
  return colors.reduce((total, color) => total + goals[color], 0);
}

function reduceColorGoals(goals: ColorGoals, collectedBlocks: Block[]) {
  const nextGoals = { ...goals };

  for (const block of collectedBlocks) {
    if (nextGoals[block.color] > 0) {
      nextGoals[block.color] -= 1;
    }
  }

  return nextGoals;
}

function getCompletedGoalSigns(previousGoals: ColorGoals, nextGoals: ColorGoals) {
  return colors
    .filter((color) => previousGoals[color] > 0 && nextGoals[color] === 0)
    .map((color) => `${colorLabels[color]} complete`);
}

function getGoalMilestones(
  previousScore: number,
  nextScore: number,
  targetScore: number,
  previousGoals: ColorGoals,
  nextGoals: ColorGoals
) {
  const signs = getCompletedGoalSigns(previousGoals, nextGoals);

  if (previousScore < targetScore && nextScore >= targetScore) {
    signs.push("Score goal hit");
  }

  return signs;
}

function countCollectedPips(collectedBlocks: Block[]) {
  return collectedBlocks.reduce((total, block) => total + (block.pips ?? 0), 0);
}

function choosePipBlastColor(currentBoard: Block[][], goals: ColorGoals) {
  const goalColor = colors.reduce<BlockColor | null>((bestColor, color) => {
    if (!bestColor || goals[color] > goals[bestColor]) {
      return color;
    }

    return bestColor;
  }, null);

  if (goalColor && goals[goalColor] > 0) {
    return goalColor;
  }

  const counts = createEmptyGoals();

  for (const row of currentBoard) {
    for (const block of row) {
      if (!block.locked && !block.prize && !block.special) {
        counts[block.color] += 1;
      }
    }
  }

  return colors.reduce((bestColor, color) =>
    counts[color] > counts[bestColor] ? color : bestColor
  );
}

function findPipBlastTargets(currentBoard: Block[][], color: BlockColor) {
  const targets: [number, number][] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const block = currentBoard[row][col];

      if (!block.locked && !block.prize && !block.special && block.color === color) {
        targets.push([row, col]);
      }
    }
  }

  return targets.slice(0, 9);
}

function getGoalTextColor(color: BlockColor) {
  switch (color) {
    case "red":
      return "text-red-200";
    case "blue":
      return "text-sky-200";
    case "green":
      return "text-emerald-200";
    case "yellow":
      return "text-yellow-200";
    case "purple":
      return "text-violet-200";
    case "pink":
      return "text-pink-200";
  }
}

function getColorClass(block: Block) {
  if (block.locked) {
    return "bg-gradient-to-br from-slate-400 via-slate-600 to-slate-950";
  }

  if (block.prize) {
    return "bg-gradient-to-br from-amber-200 via-yellow-400 to-orange-500";
  }

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
  if (block.locked) return "LOCK";
  if (block.prize === "moves") return "-1";
  if (block.prize === "points") return "450";
  if (block.prize === "shuffle") return "MIX";
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

function shuffleBoard(currentBoard: Block[][]) {
  const flatBlocks = currentBoard.flat().map((block) => ({ ...block }));

  for (let i = flatBlocks.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [flatBlocks[i], flatBlocks[randomIndex]] = [
      flatBlocks[randomIndex],
      flatBlocks[i],
    ];
  }

  const newBoard: Block[][] = [];

  for (let row = 0; row < rows; row++) {
    newBoard.push(flatBlocks.slice(row * cols, row * cols + cols));
  }

  return newBoard;
}

function getBlockLabel(block: Block) {
  if (block.locked) {
    return `locked ${block.color} block`;
  }

  if (block.prize) {
    return `${block.prize} prize block`;
  }

  if (block.special) {
    return `${block.special} ${block.color} block`;
  }

  return block.pips
    ? `${block.color} ball with ${block.pips} pips`
    : `${block.color} ball`;
}

function canRelocateBlock(block: Block) {
  return !block.locked && !block.prize && !block.special;
}

function relocateBoard(currentBoard: Block[][]) {
  const nextBoard = currentBoard.map((row) =>
    row.map((block) => ({ ...block }))
  );
  const candidates: Position[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (canRelocateBlock(nextBoard[row][col])) {
        candidates.push({ row, col });
      }
    }
  }

  if (candidates.length < 4) {
    return nextBoard;
  }

  for (let swapCount = 0; swapCount < 3; swapCount++) {
    const first = candidates[Math.floor(Math.random() * candidates.length)];
    const nearby = candidates.filter(
      (candidate) =>
        Math.abs(candidate.row - first.row) + Math.abs(candidate.col - first.col) <=
          3 &&
        (candidate.row !== first.row || candidate.col !== first.col)
    );
    const second =
      nearby.length > 0
        ? nearby[Math.floor(Math.random() * nearby.length)]
        : candidates[Math.floor(Math.random() * candidates.length)];

    const temporary = nextBoard[first.row][first.col];
    nextBoard[first.row][first.col] = {
      ...nextBoard[second.row][second.col],
      id: createBlockId(first.row, first.col),
    };
    nextBoard[second.row][second.col] = {
      ...temporary,
      id: createBlockId(second.row, second.col),
    };
  }

  return nextBoard;
}

function findAdjacentLockedBlocks(
  currentBoard: Block[][],
  positions: [number, number][]
) {
  const locked = new Set<string>();

  for (const [row, col] of positions) {
    const adjacent = [
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ];

    for (const [adjacentRow, adjacentCol] of adjacent) {
      if (
        adjacentRow >= 0 &&
        adjacentRow < rows &&
        adjacentCol >= 0 &&
        adjacentCol < cols &&
        currentBoard[adjacentRow][adjacentCol].locked
      ) {
        locked.add(`${adjacentRow}-${adjacentCol}`);
      }
    }
  }

  return [...locked].map((key) => {
    const [row, col] = key.split("-").map(Number);
    return [row, col] as [number, number];
  });
}

function mergePositions(...groups: [number, number][][]) {
  const seen = new Set<string>();
  const merged: [number, number][] = [];

  for (const group of groups) {
    for (const position of group) {
      const key = `${position[0]}-${position[1]}`;

      if (!seen.has(key)) {
        seen.add(key);
        merged.push(position);
      }
    }
  }

  return merged;
}

export default function PlayPage() {
  const ambientMoveStep = useRef(0);
  const [board, setBoard] = useState<Block[][] | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(maxMoves);
  const [fouls, setFouls] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(2200);
  const [colorGoals, setColorGoals] = useState<ColorGoals>(() =>
    createLevelGoals(1)
  );
  const [streak, setStreak] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<Position | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [gravity, setGravity] = useState<GravityDirection>("down");
  const [shufflesLeft, setShufflesLeft] = useState(2);
  const [prizeCharge, setPrizeCharge] = useState(0);
  const [pipCharge, setPipCharge] = useState(0);
  const [pipBlastsLeft, setPipBlastsLeft] = useState(0);
  const [goalSigns, setGoalSigns] = useState<string[]>([]);
  const [moveAnimation, setMoveAnimation] =
    useState<MoveAnimation>("none");

  useEffect(() => {
    const savedHighScore = localStorage.getItem("blockpopx-high-score");
    const boardTimer = window.setTimeout(() => {
      setBoard(createBoard(1));

      if (savedHighScore) {
        setHighScore(Number(savedHighScore));
      }
    }, 0);

    return () => window.clearTimeout(boardTimer);
  }, []);

  useEffect(() => {
    if (!board || isMoving || gameOver || levelComplete || selectedBlock) {
      return;
    }

    const ambientMoveTimer = window.setInterval(() => {
      const motionStep = ambientMoveStep.current % 4;
      ambientMoveStep.current += 1;
      const shouldFlipGravity = motionStep === 1;
      const shouldShuffle = motionStep === 2;
      const nextGravity = shouldFlipGravity
        ? gravity === "down"
          ? "up"
          : "down"
        : gravity;
      const animation: MoveAnimation = shouldShuffle
        ? "shuffle"
        : shouldFlipGravity
        ? nextGravity
        : "relocate";

      setIsMoving(true);
      setMoveAnimation(animation);

      if (shouldFlipGravity) {
        setGravity(nextGravity);
      }

      window.setTimeout(() => {
        setBoard((currentBoard) => {
          if (!currentBoard) return currentBoard;

          if (shouldShuffle) {
            return shuffleBoard(currentBoard);
          }

          if (shouldFlipGravity) {
            return relocateBoard(currentBoard);
          }

          return relocateBoard(currentBoard);
        });
      }, shouldShuffle ? 260 : 420);

      window.setTimeout(() => {
        setIsMoving(false);
        setMoveAnimation("none");
      }, shouldShuffle ? 980 : 1250);
    }, 4600);

    return () => window.clearInterval(ambientMoveTimer);
  }, [board, gameOver, gravity, isMoving, levelComplete, selectedBlock]);

  function showGoalSigns(signs: string[], cue: SoundCue = "goal") {
    if (signs.length === 0) return;

    setGoalSigns(signs);
    playGameSound(cue);

    window.setTimeout(() => {
      setGoalSigns([]);
    }, 1800);
  }

  function repairFouls(amount: number) {
    if (amount <= 0) return;
    setFouls((current) => Math.max(0, current - amount));
  }

  function addFoul(reason: string) {
    const nextFouls = Math.min(maxFouls, fouls + 1);

    setFouls(nextFouls);
    setSelectedBlock(null);
    setStreak(0);

    if (nextFouls >= maxFouls) {
      setGameOver(true);
      showGoalSigns(["Too many fouls"], "foul");
      setMessage("Too many fouls. Restart and try a cleaner run.");
      return;
    }

    showGoalSigns([`Foul ${nextFouls}/${maxFouls}`], "foul");
    setMessage(`${reason} Foul ${nextFouls}/${maxFouls}.`);
  }

  function handleBlockClick(rowIndex: number, colIndex: number) {
    if (!board || gameOver || levelComplete || isMoving) return;

    const clickedPosition = { row: rowIndex, col: colIndex };
    const clickedBlock = board[rowIndex][colIndex];

    if (clickedBlock.locked) {
      setSelectedBlock(null);
      addFoul("Locked blocks only crack when you pop beside them.");
      return;
    }

    if (clickedBlock.prize) {
      setSelectedBlock(null);
      activatePrize(rowIndex, colIndex, clickedBlock.prize);
      return;
    }

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
      setMessage("Ball selected. Tap a nearby ball to swap.");
      return;
    }

    const connected = findConnectedBlocks(
      board,
      rowIndex,
      colIndex,
      clickedBlock.color
    );

    if (connected.length >= 2) {
      popConnectedBlocks(
        board,
        connected,
        rowIndex,
        colIndex,
        clickedBlock.color
      );
      return;
    }

    setSelectedBlock(clickedPosition);
    setMessage("Ball selected. Tap a nearby ball to make a smart move.");
  }

  function trySwap(first: Position, second: Position) {
    if (!board) return;

    const oldBoard = board;
    const swappedBoard = board.map((row) => row.map((block) => ({ ...block })));

    const temp = swappedBoard[first.row][first.col];
    swappedBoard[first.row][first.col] = swappedBoard[second.row][second.col];
    swappedBoard[second.row][second.col] = temp;

    setBoard(swappedBoard);
    setSelectedBlock(null);
    setIsMoving(true);
    setMoveAnimation("shuffle");
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
        setBoard(oldBoard);
        setStreak(0);
        addFoul("No smart match. Balls moved back.");
        setIsMoving(false);
        setMoveAnimation("none");
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
    }, 450);
  }

  function popConnectedBlocks(
    currentBoard: Block[][],
    connected: [number, number][],
    rowIndex: number,
    colIndex: number,
    color: BlockColor,
    usedSwap = false
  ) {
    setIsMoving(true);
    setMoveAnimation(gravity === "down" ? "down" : "up");

    const newStreak = streak + 1;
    const streakMultiplier = 1 + newStreak * 0.15;

    let pointsEarned = Math.floor(
      connected.length * connected.length * 14 * streakMultiplier
    );

    if (usedSwap) pointsEarned += 150;

    const crackedLocks = findAdjacentLockedBlocks(currentBoard, connected);
    const clearedBlocks = mergePositions(connected, crackedLocks);

    pointsEarned += crackedLocks.length * 90;

    if (connected.length >= 9) {
      pointsEarned += 500;
    } else if (connected.length >= 7) {
      pointsEarned += 300;
    } else if (connected.length >= 5) {
      pointsEarned += 150;
    }

    const prizeResult = resolvePrizeCharge(
      connected.length * 8 + crackedLocks.length * 14 + (usedSwap ? 12 : 0)
    );
    const meterReward = prizeResult.prize
      ? getPrizeReward(prizeResult.prize)
      : null;
    const newScore = score + pointsEarned + (meterReward?.score ?? 0);
    const newMovesLeft = movesLeft + (meterReward?.moves ?? 0);
    const newShufflesLeft = shufflesLeft + (meterReward?.shuffles ?? 0);
    const collectedBlocks = clearedBlocks.map(
      ([row, col]) => currentBoard[row][col]
    );
    const newColorGoals = reduceColorGoals(colorGoals, collectedBlocks);
    const milestoneSigns = getGoalMilestones(
      score,
      newScore,
      targetScore,
      colorGoals,
      newColorGoals
    );
    const pipResult = resolvePipCharge(
      connected.length + countCollectedPips(collectedBlocks)
    );
    const newPipBlastsLeft = pipBlastsLeft + pipResult.blastsEarned;

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    repairFouls(meterReward?.moves ?? 0);
    setShufflesLeft(newShufflesLeft);
    setStreak(newStreak);
    setColorGoals(newColorGoals);
    setPrizeCharge(prizeResult.nextCharge);
    setPipCharge(pipResult.nextCharge);
    setPipBlastsLeft(newPipBlastsLeft);
    playGameSound(
      pointsEarned >= 850 || connected.length >= 7
        ? "big"
        : pipResult.blastsEarned > 0
        ? "blast"
        : "pop"
    );
    showGoalSigns(
      [
        ...milestoneSigns,
        ...(pipResult.blastsEarned > 0 ? ["Pip Blast ready"] : []),
      ],
      pipResult.blastsEarned > 0 ? "blast" : "goal"
    );

    const special =
      connected.length >= 9
        ? "lightning"
        : connected.length >= 7
        ? "rocket"
        : connected.length >= 5
        ? "bomb"
        : null;
    const prize = special || connected.length < 4 ? null : randomPrizeType();

    const newBoard = removeAndRearrangeBlocks(currentBoard, clearedBlocks, {
      row: rowIndex,
      col: colIndex,
      special,
      color,
      prize,
    });

    setTimeout(() => {
      setBoard(newBoard);
    }, 180);

    setTimeout(() => {
      setIsMoving(false);
      setMoveAnimation("none");
    }, 700);

    const lockText =
      crackedLocks.length > 0 ? ` ${crackedLocks.length} lock cracked!` : "";
    const prizeText = meterReward ? ` Prize meter: ${meterReward.text}!` : "";
    const pipText =
      pipResult.blastsEarned > 0 ? " Pip Blast charged!" : "";

    if (usedSwap && connected.length >= 5) {
      setMessage(
        `🧠 Smart trick! +${pointsEarned} Booster created!${lockText}${prizeText}${pipText}`
      );
    } else if (usedSwap) {
      setMessage(`🧠 Smart move! +${pointsEarned}${lockText}${prizeText}${pipText}`);
    } else if (connected.length >= 9) {
      setMessage(
        `⚡ Power trick! +${pointsEarned} Lightning created!${lockText}${prizeText}${pipText}`
      );
    } else if (connected.length >= 7) {
      setMessage(
        `🚀 Rocket trick! +${pointsEarned} Rocket created!${lockText}${prizeText}${pipText}`
      );
    } else if (connected.length >= 5) {
      setMessage(
        `💣 Blast trick! +${pointsEarned} Bomb created!${lockText}${prizeText}${pipText}`
      );
    } else if (prize) {
      setMessage(
        `Prize ball created! +${pointsEarned}${lockText}${prizeText}${pipText}`
      );
    } else if (newStreak >= 4) {
      setMessage(
        `🔥 Hot streak x${newStreak}! +${pointsEarned}${lockText}${prizeText}${pipText}`
      );
    } else {
      setMessage(`Nice pop! +${pointsEarned}${lockText}${prizeText}${pipText}`);
    }

    finishMove(newScore, newMovesLeft, newColorGoals);
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

    activateSpecialMove(affected, 100, "💣 Bomb blast!");
  }

  function activateRocket(rowIndex: number) {
    const affected: [number, number][] = [];

    for (let col = 0; col < cols; col++) {
      affected.push([rowIndex, col]);
    }

    activateSpecialMove(affected, 120, "🚀 Rocket row clear!");
  }

  function activateLightning(colIndex: number) {
    const affected: [number, number][] = [];

    for (let row = 0; row < rows; row++) {
      affected.push([row, colIndex]);
    }

    activateSpecialMove(affected, 130, "⚡ Lightning column clear!");
  }

  function activateSpecialMove(
    affected: [number, number][],
    pointValue: number,
    text: string
  ) {
    if (!board || isMoving) return;

    setIsMoving(true);
    setMoveAnimation(gravity === "down" ? "down" : "up");

    const prizeResult = resolvePrizeCharge(affected.length * 6);
    const meterReward = prizeResult.prize
      ? getPrizeReward(prizeResult.prize)
      : null;
    const pointsEarned = affected.length * pointValue;
    const newScore = score + pointsEarned + (meterReward?.score ?? 0);
    const newMovesLeft = movesLeft + (meterReward?.moves ?? 0);
    const newShufflesLeft = shufflesLeft + (meterReward?.shuffles ?? 0);
    const collectedBlocks = affected.map(([row, col]) => board[row][col]);
    const newColorGoals = reduceColorGoals(colorGoals, collectedBlocks);
    const milestoneSigns = getGoalMilestones(
      score,
      newScore,
      targetScore,
      colorGoals,
      newColorGoals
    );
    const pipResult = resolvePipCharge(
      Math.ceil(affected.length / 2) + countCollectedPips(collectedBlocks)
    );
    const newPipBlastsLeft = pipBlastsLeft + pipResult.blastsEarned;

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    repairFouls(meterReward?.moves ?? 0);
    setShufflesLeft(newShufflesLeft);
    setStreak(streak + 1);
    setColorGoals(newColorGoals);
    setPrizeCharge(prizeResult.nextCharge);
    setPipCharge(pipResult.nextCharge);
    setPipBlastsLeft(newPipBlastsLeft);
    playGameSound(pointsEarned >= 900 ? "big" : "blast");
    showGoalSigns(
      [
        ...milestoneSigns,
        ...(pipResult.blastsEarned > 0 ? ["Pip Blast ready"] : []),
      ],
      pipResult.blastsEarned > 0 ? "blast" : "goal"
    );

    const nextBoard = removeAndRearrangeBlocks(board, affected);

    setTimeout(() => {
      setBoard(nextBoard);
    }, 180);

    setTimeout(() => {
      setIsMoving(false);
      setMoveAnimation("none");
    }, 700);

    setMessage(
      `${text} +${pointsEarned}${
        meterReward ? ` Prize meter: ${meterReward.text}!` : ""
      }${pipResult.blastsEarned > 0 ? " Pip Blast charged!" : ""}`
    );
    finishMove(newScore, newMovesLeft, newColorGoals);
  }

  function flipGravity() {
    if (!board || isMoving || gameOver || levelComplete) return;

    const nextGravity = gravity === "down" ? "up" : "down";

    setGravity(nextGravity);
    setSelectedBlock(null);
    setIsMoving(true);
    setMoveAnimation(nextGravity === "down" ? "down" : "up");
    setMessage(nextGravity === "down" ? "Gravity down!" : "Gravity up!");

    const rearrangedBoard = rearrangeByGravity(board, nextGravity);

    setTimeout(() => {
      setBoard(rearrangedBoard);
    }, 180);

    setTimeout(() => {
      setIsMoving(false);
      setMoveAnimation("none");
    }, 750);

    finishMove(score, movesLeft, colorGoals);
  }

  function smartShuffle() {
    if (!board || isMoving || gameOver || levelComplete) return;

    if (shufflesLeft <= 0) {
      addFoul("No shuffles left. Use smart swaps.");
      return;
    }

    setShufflesLeft(shufflesLeft - 1);
    setSelectedBlock(null);
    setIsMoving(true);
    setMoveAnimation("shuffle");
    setStreak(0);
    setMessage("Balls rearranged. Find the best trick!");

    const shuffled = shuffleBoard(board);

    setTimeout(() => {
      setBoard(rearrangeByGravity(shuffled, gravity));
    }, 220);

    setTimeout(() => {
      setIsMoving(false);
      setMoveAnimation("none");
    }, 800);

    finishMove(score, movesLeft, colorGoals);
  }

  function resolvePrizeCharge(chargeAmount: number) {
    const totalCharge = prizeCharge + chargeAmount;

    if (totalCharge < maxPrizeCharge) {
      return {
        nextCharge: totalCharge,
        prize: null as PrizeType | null,
      };
    }

    return {
      nextCharge: totalCharge % maxPrizeCharge,
      prize: randomPrizeType(),
    };
  }

  function resolvePipCharge(pipsCollected: number) {
    const totalPips = pipCharge + pipsCollected;

    return {
      nextCharge: totalPips % maxPipCharge,
      blastsEarned: Math.floor(totalPips / maxPipCharge),
    };
  }

  function activatePrize(
    rowIndex: number,
    colIndex: number,
    prize: PrizeType
  ) {
    if (!board || isMoving) return;

    const reward = getPrizeReward(prize);
    const newScore = score + reward.score;
    const newMovesLeft = movesLeft + reward.moves;
    const newShufflesLeft = shufflesLeft + reward.shuffles;
    const nextBoard = removeAndRearrangeBlocks(board, [[rowIndex, colIndex]]);
    const milestoneSigns =
      score < targetScore && newScore >= targetScore ? ["Score goal hit"] : [];

    setBoard(nextBoard);
    setScore(newScore);
    setMovesLeft(newMovesLeft);
    repairFouls(reward.moves);
    setShufflesLeft(newShufflesLeft);
    setSelectedBlock(null);
    setPrizeCharge(Math.min(prizeCharge + 18, maxPrizeCharge));
    playGameSound("prize");
    showGoalSigns(milestoneSigns, "goal");
    setMessage(`Prize ball opened: ${reward.text}!`);
    finishMove(newScore, newMovesLeft, colorGoals);
  }

  function activatePipBlast() {
    if (!board || isMoving || gameOver || levelComplete) return;

    if (pipBlastsLeft <= 0) {
      addFoul("Pip Blast is not ready yet.");
      return;
    }

    const blastColor = choosePipBlastColor(board, colorGoals);
    const blastTargets = findPipBlastTargets(board, blastColor);

    if (blastTargets.length === 0) {
      addFoul("No clear path for Pip Blast yet.");
      return;
    }

    const crackedLocks = findAdjacentLockedBlocks(board, blastTargets);
    const clearedBlocks = mergePositions(blastTargets, crackedLocks);
    const collectedBlocks = clearedBlocks.map(([row, col]) => board[row][col]);
    const pointsEarned = blastTargets.length * 130 + crackedLocks.length * 120;
    const newScore = score + pointsEarned;
    const newColorGoals = reduceColorGoals(colorGoals, collectedBlocks);
    const milestoneSigns = getGoalMilestones(
      score,
      newScore,
      targetScore,
      colorGoals,
      newColorGoals
    );
    const nextBoard = removeAndRearrangeBlocks(board, clearedBlocks);

    setBoard(nextBoard);
    setScore(newScore);
    setColorGoals(newColorGoals);
    setPipBlastsLeft(pipBlastsLeft - 1);
    setSelectedBlock(null);
    setIsMoving(true);
    setMoveAnimation("shuffle");
    playGameSound(pointsEarned >= 900 ? "big" : "blast");
    showGoalSigns(milestoneSigns, "goal");

    setTimeout(() => {
      setIsMoving(false);
      setMoveAnimation("none");
    }, 650);

    setMessage(
      `Pip Blast cleared ${colorLabels[blastColor]} blocks! +${pointsEarned}${
        crackedLocks.length > 0 ? ` ${crackedLocks.length} lock cracked!` : ""
      }`
    );
    finishMove(newScore, movesLeft, newColorGoals);
  }

  function finishMove(
    newScore: number,
    _newMovesLeft: number,
    newColorGoals: ColorGoals
  ) {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("blockpopx-high-score", String(newScore));
    }

    if (newScore >= targetScore && getRemainingGoalCount(newColorGoals) === 0) {
      const next = level + 1;

      setLevel(next);
      setTargetScore(newScore + 1800 + next * 550);
      setColorGoals(createLevelGoals(next));
      showGoalSigns(["Milestone clear", "New goals open"], "win");
      setMessage("Milestone cleared! Keep playing for a bigger score.");
      return;
    }
  }

  function findConnectedBlocks(
    currentBoard: Block[][],
    rowIndex: number,
    colIndex: number,
    color: BlockColor
  ) {
    const visited = new Set<string>();
    const result: [number, number][] = [];

    function search(r: number, c: number) {
      const key = `${r}-${c}`;

      if (r < 0 || r >= rows) return;
      if (c < 0 || c >= cols) return;
      if (visited.has(key)) return;
      if (currentBoard[r][c].locked) return;
      if (currentBoard[r][c].prize) return;
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

  function removeAndRearrangeBlocks(
    currentBoard: Block[][],
    connected: [number, number][],
    specialBlock?: {
      row: number;
      col: number;
      special: SpecialBlock | null;
      color: BlockColor;
      prize?: PrizeType | null;
    }
  ) {
    const removeSet = new Set(connected.map(([r, c]) => `${r}-${c}`));

    const temporaryBoard: (Block | null)[][] = currentBoard.map((row, r) =>
      row.map((block, c) => (removeSet.has(`${r}-${c}`) ? null : block))
    );

    if (specialBlock?.special || specialBlock?.prize) {
      temporaryBoard[specialBlock.row][specialBlock.col] = {
        id: createBlockId(specialBlock.row, specialBlock.col),
        color: specialBlock.color,
        special: specialBlock.special ?? undefined,
        prize: specialBlock.prize ?? undefined,
      };
    }

    return fillEmptySpaces(temporaryBoard, gravity);
  }

  function rearrangeByGravity(
    currentBoard: Block[][],
    direction: GravityDirection
  ) {
    const temporaryBoard: (Block | null)[][] = currentBoard.map((row) =>
      row.map((block) => block)
    );

    return fillEmptySpaces(temporaryBoard, direction);
  }

  function fillEmptySpaces(
    temporaryBoard: (Block | null)[][],
    direction: GravityDirection
  ) {
    const nextBoard: Block[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => randomBlock(0, 0, level))
    );

    for (let col = 0; col < cols; col++) {
      const remainingBlocks: Block[] = [];

      if (direction === "down") {
        for (let row = rows - 1; row >= 0; row--) {
          const block = temporaryBoard[row][col];

          if (block) remainingBlocks.push(block);
        }

        let writeRow = rows - 1;

        for (const block of remainingBlocks) {
          nextBoard[writeRow][col] = {
            ...block,
            id: createBlockId(writeRow, col),
          };
          writeRow--;
        }

        while (writeRow >= 0) {
          nextBoard[writeRow][col] = randomBlock(writeRow, col, level);
          writeRow--;
        }
      } else {
        for (let row = 0; row < rows; row++) {
          const block = temporaryBoard[row][col];

          if (block) remainingBlocks.push(block);
        }

        let writeRow = 0;

        for (const block of remainingBlocks) {
          nextBoard[writeRow][col] = {
            ...block,
            id: createBlockId(writeRow, col),
          };
          writeRow++;
        }

        while (writeRow < rows) {
          nextBoard[writeRow][col] = randomBlock(writeRow, col, level);
          writeRow++;
        }
      }
    }

    return nextBoard;
  }

  function restartGame() {
    setBoard(createBoard(level));
    setScore(0);
    setMovesLeft(maxMoves);
    setFouls(0);
    setGameOver(false);
    setLevelComplete(false);
    setMessage("");
    setColorGoals(createLevelGoals(level));
    setStreak(0);
    setSelectedBlock(null);
    setIsMoving(false);
    setMoveAnimation("none");
    setGravity("down");
    setShufflesLeft(2);
    setPrizeCharge(0);
    setPipCharge(0);
    setPipBlastsLeft(0);
  }

  function nextLevel() {
    const next = level + 1;

    setLevel(next);
    setTargetScore(2200 + next * 850);
    setColorGoals(createLevelGoals(next));
    setBoard(createBoard(next));
    setScore(0);
    setMovesLeft(maxMoves);
    setFouls(0);
    setGameOver(false);
    setLevelComplete(false);
    setMessage(`Level ${next} started. Solve the new puzzle!`);
    setStreak(0);
    setSelectedBlock(null);
    setIsMoving(false);
    setMoveAnimation("none");
    setGravity(next % 2 === 0 ? "up" : "down");
    setShufflesLeft(2);
    setPrizeCharge(0);
    setPipCharge(0);
    setPipBlastsLeft(0);
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

  const scoreProgress = Math.min((score / targetScore) * 100, 100);
  const totalGoalCount = getRemainingGoalCount(createLevelGoals(level));
  const goalsRemaining = getRemainingGoalCount(colorGoals);
  const goalProgress = Math.min(
    ((totalGoalCount - goalsRemaining) / totalGoalCount) * 100,
    100
  );
  const prizeProgress = Math.min(prizeCharge, maxPrizeCharge);
  const pipProgress = Math.floor((pipCharge / maxPipCharge) * 100);
  const activeGoals = colors.filter((color) => colorGoals[color] > 0);

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#243c5a,transparent_36%),linear-gradient(135deg,#190f32_0%,#06333a_46%,#3a1021_100%)] text-white">
      <header className="border-b border-white/10 bg-black/25 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-black tracking-wide"
          >
            <Image
              src="/blockpopx-mark.svg"
              alt=""
              width={44}
              height={44}
              className="h-10 w-10"
            />
            <span>
              <span className="text-cyan-300">Block</span>
              <span className="text-white">Pop</span>
              <span className="text-fuchsia-300">X</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-xs text-slate-300 sm:gap-5 sm:text-sm">
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

      <section className="px-3 py-4 lg:px-5">
        <div className="mx-auto grid max-w-[1240px] gap-3 lg:grid-cols-[minmax(240px,330px)_minmax(360px,520px)_minmax(240px,300px)] lg:items-start">
          <div className="order-1 space-y-3">
          <section className="text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">
              Arcade Blast Puzzle
            </p>

            <h1 className="mt-2 text-4xl font-black lg:text-3xl">
              Block<span className="text-fuchsia-400">PopX</span>
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-200">
              Collect pips, fire Pip Blasts, and keep your run alive by
              avoiding fouls.
            </p>
          </section>

          <section className="rounded-3xl border border-white/15 bg-black/25 p-3 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-amber-200">Level {level}</p>
              <p className="text-sm text-slate-200">Score goal: {targetScore}</p>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-fuchsia-400 to-yellow-300 transition-all"
                style={{ width: `${scoreProgress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-slate-300">
              <span>Energy cells</span>
              <span>{goalsRemaining} left</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-amber-300 to-rose-300 transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {activeGoals.length > 0 ? (
                activeGoals.map((color) => (
                  <div
                    key={color}
                    className="rounded-2xl border border-white/10 bg-white/10 px-3 py-2"
                  >
                    <p
                      className={`text-xs font-black ${getGoalTextColor(
                        color
                      )}`}
                    >
                      {colorLabels[color]}
                    </p>
                    <p className="text-lg font-black">{colorGoals[color]}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 rounded-2xl border border-emerald-300/40 bg-emerald-300/10 px-3 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
                  Cells charged
                </p>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-amber-100">
              <span>Prize meter</span>
              <span>{prizeProgress}%</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-gradient-to-r from-yellow-200 via-orange-300 to-pink-300 transition-all"
                style={{ width: `${prizeProgress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-cyan-100">
              <span>Pip Blast</span>
              <span>
                {pipBlastsLeft > 0
                  ? `${pipBlastsLeft} ready`
                  : `${pipCharge}/${maxPipCharge}`}
              </span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 transition-all"
                style={{ width: `${pipBlastsLeft > 0 ? 100 : pipProgress}%` }}
              />
            </div>
          </section>
          </div>

          <div className="order-2 space-y-3 lg:order-3">
          <section className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Score</p>
              <p className="text-xl font-black text-cyan-300">{score}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Best</p>
              <p className="text-xl font-black text-yellow-300">{highScore}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Fouls</p>
              <p className="text-xl font-black text-fuchsia-300">
                {fouls}/{maxFouls}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Streak</p>
              <p className="text-xl font-black text-green-300">{streak}</p>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={flipGravity}
              disabled={isMoving || gameOver || levelComplete}
              className="rounded-2xl bg-white/10 p-2 text-center text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              {gravity === "down" ? "⬇ Down" : "⬆ Up"}
            </button>

            <button
              type="button"
              onClick={smartShuffle}
              disabled={isMoving || gameOver || levelComplete}
              className="rounded-2xl bg-white/10 p-2 text-center text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              🔀 {shufflesLeft}
            </button>

            <button
              type="button"
              onClick={activatePipBlast}
              disabled={isMoving || gameOver || levelComplete}
              className="rounded-2xl bg-white/10 p-2 text-center text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              Pip {pipBlastsLeft > 0 ? pipBlastsLeft : `${pipCharge}/${maxPipCharge}`}
            </button>
          </section>

          {message && (
            <p className="rounded-2xl bg-white/10 px-4 py-3 text-center text-sm font-bold text-cyan-200">
              {message}
            </p>
          )}

          <div className="flex justify-center gap-2">
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

          <p className="text-center text-xs leading-5 text-slate-400 lg:text-left">
            Pop pip balls to charge Pip Blast. Crack locks from the side.
            Prize balls are free rewards.
          </p>
          </div>

          <div className="order-3 lg:order-2 lg:w-[min(520px,calc(100vh-150px))] lg:justify-self-center">
          {(gameOver || levelComplete) && (
            <section className="mb-3 rounded-3xl border border-cyan-300 bg-slate-900 p-5 text-center shadow-2xl">
              <h2 className="text-3xl font-black text-cyan-300">
                {levelComplete ? "Puzzle Solved!" : "Game Over"}
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
                    Next Puzzle
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

          <section className="relative rounded-[2rem] border border-white/10 bg-slate-900/90 p-2 shadow-2xl lg:p-3">
            {goalSigns.length > 0 && (
              <div className="pointer-events-none absolute inset-x-3 top-4 z-10 flex flex-col items-center gap-2">
                {goalSigns.map((sign) => (
                  <p
                    key={sign}
                    className="goal-sign rounded-full border border-white/30 bg-gradient-to-r from-yellow-200 via-cyan-200 to-pink-200 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.18em] text-slate-950 shadow-2xl"
                  >
                    {sign}
                  </p>
                ))}
              </div>
            )}

            <div
              className={`grid gap-2 transition-all duration-300 ${
                isMoving ? "scale-95 opacity-90" : "scale-100 opacity-100"
              } ${
                moveAnimation === "down"
                  ? "ball-move-down"
                  : moveAnimation === "up"
                  ? "ball-move-up"
                  : moveAnimation === "shuffle"
                  ? "ball-shuffle"
                  : moveAnimation === "relocate"
                  ? "ball-relocate"
                  : ""
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
                      className={`game-ball ${getColorClass(
                        block
                      )} relative aspect-square rounded-full border shadow-lg shadow-black/30 transition-all duration-300 hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70 ${
                        isSelected
                          ? "border-yellow-300 ring-4 ring-yellow-300 scale-105"
                          : "border-white/40"
                      }`}
                      aria-label={getBlockLabel(block)}
                    >
                      <span className="absolute inset-1 rounded-full bg-white/20" />

                      {getSpecialIcon(block) && (
                        <span
                          className={`absolute inset-0 flex items-center justify-center font-black ${
                            block.locked || block.prize
                              ? "text-[0.56rem] tracking-wide text-white drop-shadow"
                              : "text-xl"
                          }`}
                        >
                          {getSpecialIcon(block)}
                        </span>
                      )}

                      {block.pips && !block.locked && !block.prize && (
                        <span className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                          {Array.from({ length: block.pips }, (_, pipIndex) => (
                            <span
                              key={pipIndex}
                              className="h-1.5 w-1.5 rounded-full bg-white shadow shadow-black/50"
                            />
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </section>
          </div>
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
