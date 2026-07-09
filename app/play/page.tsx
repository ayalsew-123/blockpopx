"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

const rows = 10;
const cols = 10;
const maxMoves = 20;
const maxFouls = 5;
const maxPrizeCharge = 100;
const maxPipCharge = 12;
const maxPileDanger = 100;
const startingDropStock = 620;
const minVisibleBeforeWaveDrop = 16;
const colors = ["red", "blue", "green", "yellow", "purple", "pink"] as const;

type SpecialBlock = "bomb" | "rocket" | "lightning";
type PrizeType = "moves" | "points" | "shuffle";
type GravityDirection = "down" | "up";
type MoveAnimation =
  | "none"
  | "up"
  | "down"
  | "settleUp"
  | "settleDown"
  | "shuffle"
  | "relocate"
  | "rise"
  | "zigzag";
type SoundCue = "pop" | "goal" | "prize" | "blast" | "win" | "big" | "foul";
type BlockColor = (typeof colors)[number];
type ColorGoals = Record<BlockColor, number>;
type PuzzleKind =
  | "color"
  | "pip"
  | "lock"
  | "prize"
  | "rocket"
  | "twist"
  | "cascade"
  | "vault"
  | "storm"
  | "mirror"
  | "combo"
  | "boss";

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

type ClearingBurst = {
  key: string;
  row: number;
  col: number;
  colorClass: string;
};

type PuzzleTemplate = {
  title: string;
  badge: string;
  kind: PuzzleKind;
  hint: string;
  scoreBase: number;
  scoreStep: number;
  colorOffsets: number[];
  goalCounts: number[];
  startingGravity: GravityDirection;
  startingShuffles: number;
  startingPrizeCharge: number;
  startingPipCharge: number;
  lockBonus?: number;
  prizeChance?: number;
  pipChance?: number;
  specialChance?: number;
};

type RushMode = {
  title: string;
  badge: string;
  hint: string;
  waveBase: number;
  levelScale: number;
  clearRelief: number;
};

const colorLabels: Record<BlockColor, string> = {
  red: "Ruby",
  blue: "Aqua",
  green: "Lime",
  yellow: "Solar",
  purple: "Violet",
  pink: "Rose",
};

const puzzleTemplates: PuzzleTemplate[] = [
  {
    title: "Ruby Sprint",
    badge: "Color Chase",
    kind: "color",
    hint: "Clear two hot color goals and keep the streak alive.",
    scoreBase: 2200,
    scoreStep: 840,
    colorOffsets: [0, 3],
    goalCounts: [10, 6],
    startingGravity: "down",
    startingShuffles: 2,
    startingPrizeCharge: 0,
    startingPipCharge: 0,
  },
  {
    title: "Pip Rush",
    badge: "Blast Build",
    kind: "pip",
    hint: "More pip balls appear. Charge Pip Blast faster.",
    scoreBase: 2500,
    scoreStep: 880,
    colorOffsets: [1, 4],
    goalCounts: [9, 8],
    startingGravity: "down",
    startingShuffles: 2,
    startingPrizeCharge: 10,
    startingPipCharge: 4,
  },
  {
    title: "Lock Breaker",
    badge: "Crack Cells",
    kind: "lock",
    hint: "Extra locks are on the board. Pop beside them to crack through.",
    scoreBase: 2800,
    scoreStep: 920,
    colorOffsets: [2, 5, 0],
    goalCounts: [8, 7, 5],
    startingGravity: "down",
    startingShuffles: 3,
    startingPrizeCharge: 0,
    startingPipCharge: 2,
  },
  {
    title: "Prize Chase",
    badge: "Reward Hunt",
    kind: "prize",
    hint: "Prize balls show up more often. Open them for big swings.",
    scoreBase: 2600,
    scoreStep: 900,
    colorOffsets: [3, 0],
    goalCounts: [11, 7],
    startingGravity: "down",
    startingShuffles: 2,
    startingPrizeCharge: 45,
    startingPipCharge: 0,
  },
  {
    title: "Rocket Lab",
    badge: "Big Groups",
    kind: "rocket",
    hint: "Build larger groups to create bombs, rockets, and lightning.",
    scoreBase: 3100,
    scoreStep: 960,
    colorOffsets: [4, 1, 3],
    goalCounts: [9, 7, 6],
    startingGravity: "down",
    startingShuffles: 3,
    startingPrizeCharge: 20,
    startingPipCharge: 3,
    specialChance: 0.025,
  },
  {
    title: "Gravity Twist",
    badge: "Upside Puzzle",
    kind: "twist",
    hint: "The board starts upward. Flip gravity when the path gets tight.",
    scoreBase: 3000,
    scoreStep: 940,
    colorOffsets: [5, 2],
    goalCounts: [12, 8],
    startingGravity: "up",
    startingShuffles: 2,
    startingPrizeCharge: 15,
    startingPipCharge: 1,
  },
  {
    title: "Cascade Path",
    badge: "Chain Puzzle",
    kind: "cascade",
    hint: "More colors matter. Plan two pops ahead for long cascades.",
    scoreBase: 3400,
    scoreStep: 980,
    colorOffsets: [0, 2, 4],
    goalCounts: [10, 9, 7],
    startingGravity: "down",
    startingShuffles: 2,
    startingPrizeCharge: 20,
    startingPipCharge: 5,
    pipChance: 0.29,
    specialChance: 0.018,
  },
  {
    title: "Prize Vault",
    badge: "Risk Reward",
    kind: "vault",
    hint: "Prizes and locks mix together. Crack a path to reach rewards.",
    scoreBase: 3600,
    scoreStep: 1020,
    colorOffsets: [1, 3, 5],
    goalCounts: [10, 8, 8],
    startingGravity: "down",
    startingShuffles: 3,
    startingPrizeCharge: 60,
    startingPipCharge: 2,
    lockBonus: 0.035,
    prizeChance: 0.065,
  },
  {
    title: "Color Storm",
    badge: "Triple Target",
    kind: "storm",
    hint: "Three goals are active. Smaller mistakes cost more time.",
    scoreBase: 3900,
    scoreStep: 1060,
    colorOffsets: [2, 4, 0],
    goalCounts: [12, 10, 8],
    startingGravity: "down",
    startingShuffles: 1,
    startingPrizeCharge: 10,
    startingPipCharge: 4,
    lockBonus: 0.02,
    pipChance: 0.28,
  },
  {
    title: "Mirror Drop",
    badge: "Reverse Read",
    kind: "mirror",
    hint: "The board starts upward with more pip pressure.",
    scoreBase: 3700,
    scoreStep: 1040,
    colorOffsets: [3, 5],
    goalCounts: [14, 10],
    startingGravity: "up",
    startingShuffles: 2,
    startingPrizeCharge: 25,
    startingPipCharge: 6,
    pipChance: 0.32,
  },
  {
    title: "Combo Forge",
    badge: "Power Craft",
    kind: "combo",
    hint: "Make big groups to forge specials and clear thick goals.",
    scoreBase: 4100,
    scoreStep: 1100,
    colorOffsets: [4, 0, 2],
    goalCounts: [13, 10, 9],
    startingGravity: "down",
    startingShuffles: 3,
    startingPrizeCharge: 35,
    startingPipCharge: 5,
    prizeChance: 0.04,
    pipChance: 0.27,
    specialChance: 0.035,
  },
  {
    title: "Boss Board",
    badge: "Hard Puzzle",
    kind: "boss",
    hint: "Locks, pips, and prizes all collide. Use every tool.",
    scoreBase: 4600,
    scoreStep: 1180,
    colorOffsets: [5, 1, 3],
    goalCounts: [14, 11, 10],
    startingGravity: "up",
    startingShuffles: 3,
    startingPrizeCharge: 50,
    startingPipCharge: 7,
    lockBonus: 0.045,
    prizeChance: 0.05,
    pipChance: 0.31,
    specialChance: 0.04,
  },
];

const rushModes: RushMode[] = [
  {
    title: "Drop Rush",
    badge: "Falling Balls",
    hint: "Hundreds of balls are waiting above the table. Clear groups before the pile danger fills.",
    waveBase: 12,
    levelScale: 1.2,
    clearRelief: 2.4,
  },
  {
    title: "Zigzag Rain",
    badge: "Side Drift",
    hint: "New balls slide in with crooked drops. Big groups slow the pile fastest.",
    waveBase: 15,
    levelScale: 1.45,
    clearRelief: 2.2,
  },
  {
    title: "Lock Flood",
    badge: "Pressure Locks",
    hint: "More locked balls enter the rush. Crack them from the side to keep space open.",
    waveBase: 17,
    levelScale: 1.65,
    clearRelief: 2,
  },
  {
    title: "Prize Storm",
    badge: "Reward Waves",
    hint: "Prize balls can rescue the table, but small clears let the pile push down.",
    waveBase: 19,
    levelScale: 1.8,
    clearRelief: 1.95,
  },
  {
    title: "Boss Rain",
    badge: "Overflow Run",
    hint: "Fast drops, hard goals, and a tight danger meter. Use every blast.",
    waveBase: 22,
    levelScale: 2,
    clearRelief: 1.85,
  },
];

function getPuzzlePlan(currentLevel: number) {
  const template =
    puzzleTemplates[(currentLevel - 1) % puzzleTemplates.length];
  const cycle = Math.floor((currentLevel - 1) / puzzleTemplates.length);
  const goals = createEmptyGoals();

  template.colorOffsets.forEach((offset, index) => {
    if (offset === undefined) return;

    const color = colors[(currentLevel - 1 + offset) % colors.length];
    const baseCount = template.goalCounts[index] ?? template.goalCounts[0] ?? 8;
    goals[color] += baseCount + currentLevel + cycle * 3 + 2;
  });

  return {
    ...template,
    goals,
    scoreTarget: Math.floor(
      (template.scoreBase + currentLevel * template.scoreStep) * 1.18
    ),
  };
}

function getRushMode(currentLevel: number) {
  return rushModes[(currentLevel - 1) % rushModes.length];
}

function getDropStockForLevel(currentLevel: number) {
  return startingDropStock + (currentLevel - 1) * 74;
}

function choosePuzzleColor(row: number, col: number, currentLevel = 1): BlockColor {
  const pattern = (currentLevel - 1) % 24;
  const shift = currentLevel - 1;
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);
  const rowDistance = Math.abs(row - centerRow);
  const colDistance = Math.abs(col - centerCol);
  const ring = Math.max(rowDistance, colDistance);
  const mirrorRow = row <= centerRow ? row : rows - 1 - row;
  const mirrorCol = col <= centerCol ? col : cols - 1 - col;
  const diamond = rowDistance + colDistance;

  if (pattern === 0) {
    return colors[(Math.floor(col / 2) + shift + (row % 2)) % colors.length];
  }

  if (pattern === 1) {
    return colors[(Math.floor(row / 2) + shift + (col % 2)) % colors.length];
  }

  if (pattern === 2) {
    return colors[(Math.floor(row / 2) + Math.floor(col / 2) + shift) % colors.length];
  }

  if (pattern === 3) {
    return colors[(row + col + shift) % colors.length];
  }

  if (pattern === 4) {
    return colors[(Math.floor((row + col) / 2) + shift) % colors.length];
  }

  if (pattern === 5) {
    return colors[(Math.abs(row - col) + Math.floor(col / 3) + shift) % colors.length];
  }

  if (pattern === 6) {
    const crossLane = row === centerRow || col === centerCol ? 0 : 2;
    return colors[(crossLane + Math.floor((row + col) / 2) + shift) % colors.length];
  }

  if (pattern === 7) {
    return colors[(ring + shift + (row + col) % 2) % colors.length];
  }

  if (pattern === 8) {
    return colors[(Math.floor(row / 2) + mirrorCol + shift) % colors.length];
  }

  if (pattern === 9) {
    const stair = Math.floor((row + Math.max(0, col - row)) / 2);
    return colors[(stair + shift + (col % 3 === 0 ? 1 : 0)) % colors.length];
  }

  if (pattern === 10) {
    const lane = col < centerCol ? row + col : row + (cols - 1 - col);
    return colors[(Math.floor(lane / 2) + shift) % colors.length];
  }

  const spiralBand =
    ring + Math.floor((row + col + Math.abs(row - col)) / 4);

  if (pattern === 11) {
    return colors[(spiralBand + shift) % colors.length];
  }

  if (pattern === 12) {
    return colors[((row % 3) * 2 + (col % 3) + shift) % colors.length];
  }

  if (pattern === 13) {
    const hourglass =
      Math.abs(row - col) + Math.abs(row + col - (cols - 1));
    return colors[(Math.floor(hourglass / 2) + shift) % colors.length];
  }

  if (pattern === 14) {
    const rail = row % 4 === 1 || col % 4 === 1 ? 1 : 3;
    return colors[(rail + Math.floor((row + col) / 3) + shift) % colors.length];
  }

  if (pattern === 15) {
    return colors[(ring + Math.floor(row / 3) + Math.floor(col / 3) + shift) % colors.length];
  }

  if (pattern === 16) {
    const arrow = row < centerRow ? centerRow - row + (col % 3) : row - centerRow + ((cols - 1 - col) % 3);
    return colors[(arrow + shift) % colors.length];
  }

  if (pattern === 17) {
    const island = Math.floor(row / 3) * 2 + Math.floor(col / 3) + ((row + col) % 2);
    return colors[(island + shift) % colors.length];
  }

  if (pattern === 18) {
    const xGate =
      Math.abs(row - col) <= 1 || Math.abs(row + col - (cols - 1)) <= 1
        ? 0
        : 3;
    return colors[(xGate + ring + shift) % colors.length];
  }

  if (pattern === 19) {
    const maze = row * 2 + col + Math.floor(row / 3) + Math.floor(col / 4);
    return colors[(maze + shift) % colors.length];
  }

  if (pattern === 20) {
    return colors[(Math.floor((row + 2 * col) / 3) + shift) % colors.length];
  }

  if (pattern === 21) {
    const bracket = mirrorRow + Math.floor(Math.abs(col - centerCol) / 2);
    return colors[(bracket + shift) % colors.length];
  }

  if (pattern === 22) {
    return colors[(diamond + Math.floor((row + col) / 4) + shift) % colors.length];
  }

  const snake = row % 2 === 0 ? col : cols - 1 - col;
  return colors[(Math.floor(snake / 2) + Math.floor(row / 2) + shift) % colors.length];
}

function addPuzzleFixture(block: Block, row: number, col: number, currentLevel = 1) {
  if (block.locked || block.prize || block.special) return block;

  const pattern = (currentLevel - 1) % 24;
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);
  const rowDistance = Math.abs(row - centerRow);
  const colDistance = Math.abs(col - centerCol);
  const mirrorRow = row <= centerRow ? row : rows - 1 - row;
  const mirrorCol = col <= centerCol ? col : cols - 1 - col;
  const nextBlock = { ...block };

  if (
    pattern === 6 &&
    (row === centerRow || col === centerCol) &&
    (row + col + currentLevel) % 5 === 0
  ) {
    nextBlock.pips = Math.max(nextBlock.pips ?? 0, 3);
  }

  if (
    pattern === 7 &&
    Math.max(Math.abs(row - centerRow), Math.abs(col - centerCol)) === 2 &&
    (row + col + currentLevel) % 6 === 0
  ) {
    nextBlock.locked = true;
    delete nextBlock.pips;
  }

  if (
    pattern === 8 &&
    col === centerCol &&
    row > 0 &&
    row < rows - 1 &&
    (row + currentLevel) % 4 === 0
  ) {
    nextBlock.prize = randomPrizeType();
    delete nextBlock.pips;
  }

  if (
    pattern === 9 &&
    Math.abs(row - col) <= 1 &&
    (row + col + currentLevel) % 4 === 0
  ) {
    nextBlock.pips = Math.max(nextBlock.pips ?? 0, 2);
  }

  if (
    pattern === 10 &&
    (col === 1 || col === cols - 2) &&
    row % 3 === currentLevel % 3
  ) {
    nextBlock.locked = true;
    delete nextBlock.pips;
  }

  if (
    pattern === 11 &&
    (row === 1 || row === rows - 2 || col === 1 || col === cols - 2) &&
    (row + col + currentLevel) % 7 === 0
  ) {
    nextBlock.special = randomSpecialType();
    delete nextBlock.pips;
  }

  if (
    pattern === 12 &&
    row % 3 === 1 &&
    col % 3 === 1 &&
    (row + col + currentLevel) % 4 === 0
  ) {
    nextBlock.locked = true;
    delete nextBlock.pips;
  }

  if (
    pattern === 13 &&
    (Math.abs(row - col) <= 1 || Math.abs(row + col - (cols - 1)) <= 1) &&
    (row + currentLevel) % 5 === 0
  ) {
    nextBlock.pips = Math.max(nextBlock.pips ?? 0, 3);
  }

  if (
    pattern === 14 &&
    (row % 4 === 1 || col % 4 === 1) &&
    row > 0 &&
    col > 0 &&
    row < rows - 1 &&
    col < cols - 1 &&
    (row + col + currentLevel) % 6 === 0
  ) {
    nextBlock.special = randomSpecialType();
    delete nextBlock.pips;
  }

  if (
    pattern === 15 &&
    Math.max(rowDistance, colDistance) === 3 &&
    (row + col + currentLevel) % 5 === 0
  ) {
    nextBlock.locked = true;
    delete nextBlock.pips;
  }

  if (
    pattern === 16 &&
    (col === centerCol - 1 || col === centerCol) &&
    row % 3 === currentLevel % 3
  ) {
    nextBlock.prize = randomPrizeType();
    delete nextBlock.pips;
  }

  if (
    pattern === 17 &&
    mirrorRow % 3 === 1 &&
    mirrorCol % 3 === 1 &&
    (row + col + currentLevel) % 2 === 0
  ) {
    nextBlock.pips = Math.max(nextBlock.pips ?? 0, 2);
  }

  if (
    pattern === 18 &&
    (Math.abs(row - col) === 2 || Math.abs(row + col - (cols - 1)) === 2) &&
    (row + col + currentLevel) % 4 === 0
  ) {
    nextBlock.locked = true;
    delete nextBlock.pips;
  }

  if (
    pattern === 19 &&
    row > 1 &&
    col > 1 &&
    row < rows - 2 &&
    col < cols - 2 &&
    (row * 2 + col + currentLevel) % 8 === 0
  ) {
    nextBlock.prize = randomPrizeType();
    delete nextBlock.pips;
  }

  if (
    pattern === 20 &&
    (row + 2 * col + currentLevel) % 9 === 0
  ) {
    nextBlock.pips = Math.max(nextBlock.pips ?? 0, 3);
  }

  if (
    pattern === 21 &&
    (mirrorRow === 1 || mirrorCol === 1) &&
    (row + col + currentLevel) % 5 === 0
  ) {
    nextBlock.locked = true;
    delete nextBlock.pips;
  }

  if (
    pattern === 22 &&
    rowDistance + colDistance === 3 &&
    (row + col + currentLevel) % 3 === 0
  ) {
    nextBlock.special = randomSpecialType();
    delete nextBlock.pips;
  }

  if (
    pattern === 23 &&
    row % 2 === 1 &&
    (col === 2 || col === cols - 3) &&
    (row + currentLevel) % 3 === 0
  ) {
    nextBlock.locked = true;
    delete nextBlock.pips;
  }

  return nextBlock;
}

function randomBlock(row: number, col: number, currentLevel = 1): Block {
  const puzzle = getPuzzlePlan(currentLevel);
  const block: Block = {
    id: createBlockId(row, col),
    color: choosePuzzleColor(row, col, currentLevel),
  };

  const lockChance = Math.min(
    0.025 +
      currentLevel * 0.008 +
      (puzzle.kind === "lock" ? 0.045 : 0) +
      (puzzle.lockBonus ?? 0),
    0.16
  );
  const prizeChance =
    puzzle.prizeChance ?? (puzzle.kind === "prize" ? 0.055 : 0.025);
  const pipChance = puzzle.pipChance ?? (puzzle.kind === "pip" ? 0.34 : 0.22);
  const specialChance = puzzle.specialChance ?? 0;

  if (Math.random() < lockChance) {
    block.locked = true;
  } else if (Math.random() < prizeChance) {
    block.prize = randomPrizeType();
  } else if (Math.random() < specialChance) {
    block.special = randomSpecialType();
  } else if (Math.random() < pipChance) {
    block.pips = Math.floor(Math.random() * 3) + 1;
  }

  return addPuzzleFixture(block, row, col, currentLevel);
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

function randomSpecialType(): SpecialBlock {
  const specials: SpecialBlock[] = ["bomb", "rocket", "lightning"];
  return specials[Math.floor(Math.random() * specials.length)];
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
  return getPuzzlePlan(currentLevel).goals;
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

function choosePipBlastColor(
  currentBoard: Block[][],
  goals: ColorGoals,
  emptyKeys: string[] = []
) {
  const hidden = new Set(emptyKeys);
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

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const block = currentBoard[row][col];

      if (hidden.has(`${row}-${col}`)) continue;

      if (!block.locked && !block.prize && !block.special) {
        counts[block.color] += 1;
      }
    }
  }

  return colors.reduce((bestColor, color) =>
    counts[color] > counts[bestColor] ? color : bestColor
  );
}

function findPipBlastTargets(
  currentBoard: Block[][],
  color: BlockColor,
  emptyKeys: string[] = []
) {
  const hidden = new Set(emptyKeys);
  const targets: [number, number][] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const block = currentBoard[row][col];

      if (hidden.has(`${row}-${col}`)) continue;
      if (!block.locked && !block.prize && !block.special && block.color === color) {
        targets.push([row, col]);
      }
    }
  }

  return targets.slice(0, 9);
}

function hasUsefulVisibleMove(currentBoard: Block[][], emptyKeys: string[] = []) {
  const hidden = new Set(emptyKeys);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (hidden.has(`${row}-${col}`)) continue;

      const block = currentBoard[row][col];

      if (!block.locked && (block.prize || block.special)) {
        return true;
      }

      if (block.locked || block.prize || block.special) continue;

      const neighbors = [
        [row + 1, col],
        [row, col + 1],
      ];

      for (const [nextRow, nextCol] of neighbors) {
        if (nextRow >= rows || nextCol >= cols) continue;
        if (hidden.has(`${nextRow}-${nextCol}`)) continue;

        const nextBlock = currentBoard[nextRow][nextCol];

        if (
          !nextBlock.locked &&
          !nextBlock.prize &&
          !nextBlock.special &&
          nextBlock.color === block.color
        ) {
          return true;
        }
      }
    }
  }

  return false;
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

function shuffleVisibleBoard(currentBoard: Block[][], emptyKeys: string[]) {
  const hidden = new Set(emptyKeys);
  const visiblePositions: [number, number][] = [];
  const visibleBlocks: Block[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (hidden.has(`${row}-${col}`)) continue;

      visiblePositions.push([row, col]);
      visibleBlocks.push({ ...currentBoard[row][col] });
    }
  }

  for (let i = visibleBlocks.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [visibleBlocks[i], visibleBlocks[randomIndex]] = [
      visibleBlocks[randomIndex],
      visibleBlocks[i],
    ];
  }

  const nextBoard = currentBoard.map((row) => row.map((block) => ({ ...block })));

  visiblePositions.forEach(([row, col], index) => {
    nextBoard[row][col] = {
      ...visibleBlocks[index],
      id: createBlockId(row, col),
    };
  });

  return nextBoard;
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

function findAdjacentLockedBlocks(
  currentBoard: Block[][],
  positions: [number, number][],
  emptyKeys: string[] = []
) {
  const locked = new Set<string>();
  const hidden = new Set(emptyKeys);

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
          !hidden.has(`${adjacentRow}-${adjacentCol}`) &&
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
  const showtimeTimers = useRef<number[]>([]);
  const lastShowtimeScore = useRef(0);
  const firstPuzzle = getPuzzlePlan(1);
  const [board, setBoard] = useState<Block[][] | null>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [movesLeft, setMovesLeft] = useState(maxMoves);
  const [fouls, setFouls] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [message, setMessage] = useState("");
  const [level, setLevel] = useState(1);
  const [targetScore, setTargetScore] = useState(firstPuzzle.scoreTarget);
  const [colorGoals, setColorGoals] = useState<ColorGoals>(() =>
    createLevelGoals(1)
  );
  const [streak, setStreak] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<Position | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [gravity, setGravity] = useState<GravityDirection>(
    firstPuzzle.startingGravity
  );
  const [shufflesLeft, setShufflesLeft] = useState(
    firstPuzzle.startingShuffles
  );
  const [prizeCharge, setPrizeCharge] = useState(
    firstPuzzle.startingPrizeCharge
  );
  const [pipCharge, setPipCharge] = useState(firstPuzzle.startingPipCharge);
  const [pipBlastsLeft, setPipBlastsLeft] = useState(0);
  const [dropStock, setDropStock] = useState(getDropStockForLevel(1));
  const [pileDanger, setPileDanger] = useState(18);
  const [wavesSurvived, setWavesSurvived] = useState(0);
  const [lastDropWave, setLastDropWave] = useState(0);
  const [goalSigns, setGoalSigns] = useState<string[]>([]);
  const [showtimeSigns] = useState<string[]>([]);
  const [clearingBlockKeys, setClearingBlockKeys] = useState<string[]>([]);
  const [clearingBursts, setClearingBursts] = useState<ClearingBurst[]>([]);
  const [emptyBlockKeys, setEmptyBlockKeys] = useState<string[]>([]);
  const [moveAnimation, setMoveAnimation] =
    useState<MoveAnimation>("none");

  useEffect(() => {
    const savedHighScore = localStorage.getItem("blockpopx-high-score");
    const boardTimer = window.setTimeout(() => {
      setBoard(createBoard(1));

      if (savedHighScore) {
        const parsedHighScore = Number(savedHighScore);
        setHighScore(parsedHighScore);
        lastShowtimeScore.current = parsedHighScore;
      }
    }, 0);

    return () => window.clearTimeout(boardTimer);
  }, []);

  useEffect(() => {
    return () => {
      showtimeTimers.current.forEach((timer) => window.clearTimeout(timer));
      showtimeTimers.current = [];
    };
  }, []);

  function showGoalSigns(signs: string[], cue: SoundCue = "goal") {
    if (signs.length === 0) return;

    setGoalSigns(signs);
    playGameSound(cue);

    window.setTimeout(() => {
      setGoalSigns([]);
    }, 1800);
  }

  function queueShowtimeTimer(callback: () => void, delay: number) {
    const timer = window.setTimeout(() => {
      showtimeTimers.current = showtimeTimers.current.filter(
        (activeTimer) => activeTimer !== timer
      );
      callback();
    }, delay);

    showtimeTimers.current.push(timer);
  }

  function uniqueSigns(signs: string[]) {
    return Array.from(new Set(signs.filter(Boolean)));
  }

  function getCellKey(row: number, col: number) {
    return `${row}-${col}`;
  }

  function getNextEmptyKeys(positions: [number, number][]) {
    const nextKeys = new Set(emptyBlockKeys);

    for (const [row, col] of positions) {
      nextKeys.add(getCellKey(row, col));
    }

    return Array.from(nextKeys);
  }

  function isCellEmpty(row: number, col: number, keys = emptyBlockKeys) {
    return keys.includes(getCellKey(row, col));
  }

  function filterVisiblePositions(positions: [number, number][]) {
    return positions.filter(([row, col]) => !isCellEmpty(row, col));
  }

  function findCutDropBlocks(clearedPositions: [number, number][]) {
    const hidden = new Set(emptyBlockKeys);

    for (const [row, col] of clearedPositions) {
      hidden.add(getCellKey(row, col));
    }

    const supported = new Set<string>();
    const queue: [number, number][] = [];

    for (let col = 0; col < cols; col++) {
      const key = getCellKey(0, col);

      if (!hidden.has(key)) {
        supported.add(key);
        queue.push([0, col]);
      }
    }

    for (let index = 0; index < queue.length; index++) {
      const [row, col] = queue[index];
      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1],
      ];

      for (const [nextRow, nextCol] of neighbors) {
        if (nextRow < 0 || nextRow >= rows) continue;
        if (nextCol < 0 || nextCol >= cols) continue;

        const key = getCellKey(nextRow, nextCol);

        if (hidden.has(key) || supported.has(key)) continue;

        supported.add(key);
        queue.push([nextRow, nextCol]);
      }
    }

    const dropped: [number, number][] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const key = getCellKey(row, col);

        if (!hidden.has(key) && !supported.has(key)) {
          dropped.push([row, col]);
        }
      }
    }

    return dropped;
  }

  function getCutDropBonus(droppedCount: number) {
    if (droppedCount <= 0) return 0;

    return droppedCount * 115 + (droppedCount >= 8 ? 350 : droppedCount >= 5 ? 180 : 0);
  }

  function getPuzzleCutInsight(
    clearedPositions: [number, number][],
    droppedPositions: [number, number][]
  ) {
    if (clearedPositions.length === 0) {
      return {
        mindBonus: 0,
        mindSigns: [] as string[],
      };
    }

    const clearedRows = clearedPositions.map(([row]) => row);
    const clearedCols = clearedPositions.map(([, col]) => col);
    const minRow = Math.min(...clearedRows);
    const maxRow = Math.max(...clearedRows);
    const minCol = Math.min(...clearedCols);
    const maxCol = Math.max(...clearedCols);
    const rowSpan = maxRow - minRow + 1;
    const colSpan = maxCol - minCol + 1;
    const uniqueRows = new Set(clearedRows);
    const uniqueCols = new Set(clearedCols);
    const centerRows = [Math.floor((rows - 1) / 2), Math.ceil((rows - 1) / 2)];
    const centerCols = [Math.floor((cols - 1) / 2), Math.ceil((cols - 1) / 2)];
    const touchesCenterGate = clearedPositions.some(
      ([row, col]) => centerRows.includes(row) || centerCols.includes(col)
    );
    const diagonalCut =
      clearedPositions.length >= 3 &&
      (new Set(clearedPositions.map(([row, col]) => row - col)).size === 1 ||
        new Set(clearedPositions.map(([row, col]) => row + col)).size === 1);
    const horizontalCut = uniqueRows.size === 1 && colSpan >= 4;
    const verticalCut = uniqueCols.size === 1 && rowSpan >= 4;
    const bridgeCut = minCol <= 1 && maxCol >= cols - 2 && rowSpan <= 3;
    const deepCut = minRow >= Math.floor(rows * 0.55) && droppedPositions.length >= 4;
    const precisionCut =
      clearedPositions.length <= 4 && droppedPositions.length >= clearedPositions.length * 3;
    const avalancheCut = droppedPositions.length >= Math.floor(rows * cols * 0.18);

    const rewards = [
      {
        active: precisionCut,
        sign: "Precision cut",
        bonus: 520,
      },
      {
        active: bridgeCut,
        sign: "Bridge cut",
        bonus: 470,
      },
      {
        active: horizontalCut,
        sign: "Lane cut",
        bonus: 320,
      },
      {
        active: verticalCut,
        sign: "Pillar cut",
        bonus: 320,
      },
      {
        active: diagonalCut,
        sign: "Diagonal cut",
        bonus: 360,
      },
      {
        active: touchesCenterGate && droppedPositions.length >= 5,
        sign: "Gate cut",
        bonus: 390,
      },
      {
        active: deepCut,
        sign: "Deep cut",
        bonus: 300,
      },
      {
        active: avalancheCut,
        sign: "Avalanche",
        bonus: 680,
      },
    ].filter((reward) => reward.active);

    return {
      mindBonus: rewards.reduce((total, reward) => total + reward.bonus, 0),
      mindSigns: rewards.map((reward) => reward.sign),
    };
  }

  function formatCutDropText(
    cutDropBlocks: [number, number][],
    cutDropBonus: number,
    mindSigns: string[]
  ) {
    if (cutDropBlocks.length === 0 && mindSigns.length === 0) return "";

    const mainSign = mindSigns[0] ?? "Cut drop";
    const extraSigns = mindSigns.slice(1, 3);
    const extraText = extraSigns.length > 0 ? ` (${extraSigns.join(", ")})` : "";

    if (cutDropBlocks.length === 0) {
      return ` ${mainSign}${extraText}! +${cutDropBonus}`;
    }

    return ` ${mainSign}${extraText}: ${cutDropBlocks.length} balls! +${cutDropBonus}`;
  }

  function expandClearWithCutDrop(clearedPositions: [number, number][]) {
    const cutDropBlocks = findCutDropBlocks(clearedPositions);
    const insight = getPuzzleCutInsight(clearedPositions, cutDropBlocks);

    return {
      clearedBlocks: mergePositions(clearedPositions, cutDropBlocks),
      cutDropBlocks,
      cutDropBonus: getCutDropBonus(cutDropBlocks.length) + insight.mindBonus,
      mindSigns: insight.mindSigns,
    };
  }

  function countVisibleCells(keys = emptyBlockKeys) {
    return rows * cols - new Set(keys).size;
  }

  function createWaveBoard() {
    return createBoard(level);
  }

  function getShowtimeSigns(
    newScore: number,
    milestoneSigns: string[],
    bonusSigns: string[] = []
  ) {
    const crossedBest = newScore > highScore;
    const crossedThousand =
      Math.floor(score / 1000) < Math.floor(newScore / 1000);
    const hasShowtimeReason =
      crossedThousand || milestoneSigns.length > 0 || bonusSigns.length > 0;
    const shouldCelebrateBest = crossedBest && hasShowtimeReason;

    return uniqueSigns([
      ...(crossedThousand ? ["1000 points"] : []),
      ...bonusSigns,
      ...(milestoneSigns.length > 0 ? ["Goal hit", "Rocket fire"] : []),
      ...(shouldCelebrateBest ? ["New best", "Fire boost"] : []),
    ]);
  }

  function triggerBoardShowtime(
    signs: string[],
    newScore: number,
    cue: SoundCue = "big",
    delay = 940
  ) {
    const showtime = uniqueSigns(signs);

    if (showtime.length === 0) return;

    lastShowtimeScore.current = Math.max(lastShowtimeScore.current, newScore);
    void cue;
    void delay;
  }

  function markClearingBlocks(
    currentBoard: Block[][],
    positions: [number, number][]
  ) {
    void currentBoard;
    setSelectedBlock(null);
    setClearingBlockKeys([]);
    setClearingBursts([]);
    setEmptyBlockKeys(getNextEmptyKeys(positions));
  }

  function settleBoardAfterClear(clearedPositions: [number, number][]) {
    const nextEmptyKeys = getNextEmptyKeys(clearedPositions);
    const visibleCells = countVisibleCells(nextEmptyKeys);
    const boardHasMove = board
      ? hasUsefulVisibleMove(board, nextEmptyKeys)
      : true;
    const shouldDropNewWave =
      visibleCells <= minVisibleBeforeWaveDrop || !boardHasMove;

    setEmptyBlockKeys(nextEmptyKeys);
    setClearingBlockKeys([]);
    setClearingBursts([]);

    if (!shouldDropNewWave) {
      setIsMoving(false);
      setMoveAnimation("none");
      return;
    }

    window.setTimeout(() => {
      setBoard(createWaveBoard());
      setEmptyBlockKeys([]);
      setMoveAnimation("settleDown");
      setPileDanger((current) => Math.max(8, Math.floor(current * 0.5)));
      setLastDropWave(rows * cols);
      setMessage("New puzzle wave dropped from the top. Keep clearing.");
      playGameSound("blast");
    }, 260);

    window.setTimeout(() => {
      setIsMoving(false);
      setMoveAnimation("none");
      setLastDropWave(0);
    }, 1760);
  }

  function repairFouls(amount: number) {
    if (amount <= 0) return;
    setFouls((current) => Math.max(0, current - amount));
  }

  function addFoul(reason: string) {
    const nextFouls = Math.min(maxFouls, fouls + 1);
    const nextDanger = Math.min(maxPileDanger, pileDanger + 8);

    setFouls(nextFouls);
    setPileDanger(nextDanger);
    setSelectedBlock(null);
    setStreak(0);

    if (nextFouls >= maxFouls || nextDanger >= maxPileDanger) {
      setGameOver(true);
      showGoalSigns(
        [nextDanger >= maxPileDanger ? "Pile overflow" : "Too many fouls"],
        "foul"
      );
      setMessage(
        nextDanger >= maxPileDanger
          ? "The pile reached the bottom. Clear bigger groups next run."
          : "Too many fouls. Restart and try a cleaner run."
      );
      return;
    }

    showGoalSigns([`Foul ${nextFouls}/${maxFouls}`], "foul");
    setMessage(`${reason} Foul ${nextFouls}/${maxFouls}.`);
  }

  function applyRushDrop(clearedCount: number) {
    if (clearedCount <= 0) {
      return {
        overflow: false,
        nextDropStock: dropStock,
      };
    }

    const rushMode = getRushMode(level);
    const waveSize = Math.min(
      dropStock,
      Math.ceil(
        rushMode.waveBase +
          level * rushMode.levelScale +
          Math.floor(wavesSurvived / 3)
      )
    );
    const clearPower =
      clearedCount * rushMode.clearRelief + (streak >= 3 ? 5 : 0);
    const dangerChange = Math.ceil(waveSize - clearPower);
    const nextDanger = Math.max(
      0,
      Math.min(maxPileDanger, pileDanger + dangerChange)
    );
    const nextDropStock = Math.max(0, dropStock - clearedCount);

    setDropStock(nextDropStock);
    setPileDanger(nextDanger);
    setWavesSurvived(wavesSurvived + 1);
    setLastDropWave(waveSize);

    queueShowtimeTimer(() => {
      setLastDropWave(0);
    }, 1200);

    if (nextDanger >= maxPileDanger) {
      setPileDanger(86);
      showGoalSigns(["Pressure max", "Keep clearing"], "foul");
      setMessage("Pressure is high, but the run continues while balls remain.");
    }

    if (dangerChange <= -8) {
      showGoalSigns(["Pile pushed back"], "big");
    } else if (dangerChange >= 10) {
      showGoalSigns(["Fast drop incoming"], "foul");
    }

    return {
      overflow: false,
      nextDropStock,
    };
  }

  function handleBlockClick(rowIndex: number, colIndex: number) {
    if (!board || gameOver || levelComplete || isMoving) return;

    const clickedPosition = { row: rowIndex, col: colIndex };
    const clickedBlock = board[rowIndex][colIndex];

    if (isCellEmpty(rowIndex, colIndex)) {
      setSelectedBlock(null);
      return;
    }

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
      clickedBlock.color,
      emptyBlockKeys
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
    if (isCellEmpty(first.row, first.col) || isCellEmpty(second.row, second.col)) {
      setSelectedBlock(null);
      return;
    }

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
        firstBlock.color,
        emptyBlockKeys
      );

      const secondMatch = findConnectedBlocks(
        swappedBoard,
        second.row,
        second.col,
        secondBlock.color,
        emptyBlockKeys
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
    setMoveAnimation("none");

    const newStreak = streak + 1;
    const streakMultiplier = 1 + newStreak * 0.15;

    let pointsEarned = Math.floor(
      connected.length * connected.length * 14 * streakMultiplier
    );

    if (usedSwap) pointsEarned += 150;

    const crackedLocks = findAdjacentLockedBlocks(
      currentBoard,
      connected,
      emptyBlockKeys
    );
    const directClearedBlocks = mergePositions(connected, crackedLocks);
    const { clearedBlocks, cutDropBlocks, cutDropBonus, mindSigns } =
      expandClearWithCutDrop(directClearedBlocks);

    pointsEarned += crackedLocks.length * 90 + cutDropBonus;

    if (connected.length >= 9) {
      pointsEarned += 500;
    } else if (connected.length >= 7) {
      pointsEarned += 300;
    } else if (connected.length >= 5) {
      pointsEarned += 150;
    }

    const prizeResult = resolvePrizeCharge(
      connected.length * 8 +
        crackedLocks.length * 14 +
        cutDropBlocks.length * 5 +
        (usedSwap ? 12 : 0)
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
        ...mindSigns,
        ...(cutDropBlocks.length > 0
          ? [`Cut drop x${cutDropBlocks.length}`]
          : []),
        ...(pipResult.blastsEarned > 0 ? ["Pip Blast ready"] : []),
      ],
      mindSigns.length > 0 || cutDropBlocks.length > 0 || pipResult.blastsEarned > 0
        ? "blast"
        : "goal"
    );

    const popShowtimeSigns = getShowtimeSigns(
      newScore,
      milestoneSigns,
      [
        ...(meterReward ? ["Prize won"] : []),
        ...mindSigns,
        ...(cutDropBlocks.length > 0 ? ["Cut drop"] : []),
        ...(pipResult.blastsEarned > 0 ? ["Pip blast charged"] : []),
      ]
    );
    triggerBoardShowtime(
      popShowtimeSigns,
      newScore,
      connected.length >= 7 || pipResult.blastsEarned > 0 ? "big" : "blast"
    );

    markClearingBlocks(currentBoard, clearedBlocks);
    settleBoardAfterClear(clearedBlocks);

    const lockText =
      crackedLocks.length > 0 ? ` ${crackedLocks.length} lock cracked!` : "";
    const prizeText = meterReward ? ` Prize meter: ${meterReward.text}!` : "";
    const pipText =
      pipResult.blastsEarned > 0 ? " Pip Blast charged!" : "";
    const cutText =
      formatCutDropText(cutDropBlocks, cutDropBonus, mindSigns);

    if (usedSwap && connected.length >= 5) {
      setMessage(
        `Smart trick! +${pointsEarned}${cutText}${lockText}${prizeText}${pipText}`
      );
    } else if (usedSwap) {
      setMessage(
        `Smart move! +${pointsEarned}${cutText}${lockText}${prizeText}${pipText}`
      );
    } else if (connected.length >= 9) {
      setMessage(
        `Power clear! +${pointsEarned}${cutText}${lockText}${prizeText}${pipText}`
      );
    } else if (connected.length >= 7) {
      setMessage(
        `Rocket-size clear! +${pointsEarned}${cutText}${lockText}${prizeText}${pipText}`
      );
    } else if (connected.length >= 5) {
      setMessage(
        `Big clear! +${pointsEarned}${cutText}${lockText}${prizeText}${pipText}`
      );
    } else if (newStreak >= 4) {
      setMessage(
        `Hot streak x${newStreak}! +${pointsEarned}${cutText}${lockText}${prizeText}${pipText}`
      );
    } else {
      setMessage(
        `Nice pop! +${pointsEarned}${cutText}${lockText}${prizeText}${pipText}`
      );
    }

    finishMove(newScore, newMovesLeft, newColorGoals, clearedBlocks.length);
  }

  function activateBomb(rowIndex: number, colIndex: number) {
    if (!board) return;

    const affected: [number, number][] = [];

    for (let r = rowIndex - 1; r <= rowIndex + 1; r++) {
      for (let c = colIndex - 1; c <= colIndex + 1; c++) {
        if (r >= 0 && r < rows && c >= 0 && c < cols && !isCellEmpty(r, c)) {
          affected.push([r, c]);
        }
      }
    }

    activateSpecialMove(affected, 100, "💣 Bomb blast!");
  }

  function activateRocket(rowIndex: number) {
    const affected: [number, number][] = [];

    for (let col = 0; col < cols; col++) {
      if (!isCellEmpty(rowIndex, col)) {
        affected.push([rowIndex, col]);
      }
    }

    activateSpecialMove(affected, 120, "🚀 Rocket row clear!");
  }

  function activateLightning(colIndex: number) {
    const affected: [number, number][] = [];

    for (let row = 0; row < rows; row++) {
      if (!isCellEmpty(row, colIndex)) {
        affected.push([row, colIndex]);
      }
    }

    activateSpecialMove(affected, 130, "⚡ Lightning column clear!");
  }

  function activateSpecialMove(
    affected: [number, number][],
    pointValue: number,
    text: string
  ) {
    if (!board || isMoving) return;
    const visibleAffected = filterVisiblePositions(affected);

    if (visibleAffected.length === 0) {
      setIsMoving(false);
      setMoveAnimation("none");
      return;
    }

    setIsMoving(true);
    setMoveAnimation("none");

    const { clearedBlocks, cutDropBlocks, cutDropBonus, mindSigns } =
      expandClearWithCutDrop(visibleAffected);
    const prizeResult = resolvePrizeCharge(
      visibleAffected.length * 6 + cutDropBlocks.length * 5
    );
    const meterReward = prizeResult.prize
      ? getPrizeReward(prizeResult.prize)
      : null;
    const pointsEarned = visibleAffected.length * pointValue + cutDropBonus;
    const newScore = score + pointsEarned + (meterReward?.score ?? 0);
    const newMovesLeft = movesLeft + (meterReward?.moves ?? 0);
    const newShufflesLeft = shufflesLeft + (meterReward?.shuffles ?? 0);
    const collectedBlocks = clearedBlocks.map(([row, col]) => board[row][col]);
    const newColorGoals = reduceColorGoals(colorGoals, collectedBlocks);
    const milestoneSigns = getGoalMilestones(
      score,
      newScore,
      targetScore,
      colorGoals,
      newColorGoals
    );
    const pipResult = resolvePipCharge(
      Math.ceil(clearedBlocks.length / 2) + countCollectedPips(collectedBlocks)
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
        ...mindSigns,
        ...(cutDropBlocks.length > 0
          ? [`Cut drop x${cutDropBlocks.length}`]
          : []),
        ...(pipResult.blastsEarned > 0 ? ["Pip Blast ready"] : []),
      ],
      mindSigns.length > 0 || cutDropBlocks.length > 0 || pipResult.blastsEarned > 0
        ? "blast"
        : "goal"
    );
    triggerBoardShowtime(
      getShowtimeSigns(newScore, milestoneSigns, [
        "Rocket fire",
        ...mindSigns,
        ...(cutDropBlocks.length > 0 ? ["Cut drop"] : []),
        ...(pipResult.blastsEarned > 0 ? ["Pip blast charged"] : []),
      ]),
      newScore,
      "big"
    );

    markClearingBlocks(board, clearedBlocks);
    settleBoardAfterClear(clearedBlocks);

    setMessage(
      `${text} +${pointsEarned}${
        formatCutDropText(cutDropBlocks, cutDropBonus, mindSigns)
      }${
        meterReward ? ` Prize meter: ${meterReward.text}!` : ""
      }${pipResult.blastsEarned > 0 ? " Pip Blast charged!" : ""}`
    );
    finishMove(newScore, newMovesLeft, newColorGoals, clearedBlocks.length);
  }

  function flipGravity() {
    if (!board || isMoving || gameOver || levelComplete) return;

    const nextGravity = gravity === "down" ? "up" : "down";

    setGravity(nextGravity);
    setSelectedBlock(null);
    setMoveAnimation("none");
    setMessage(
      nextGravity === "down"
        ? "Next full wave will drop from the top."
        : "Puzzle direction saved. New balls still drop from the top."
    );

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

    const shuffled = shuffleVisibleBoard(board, emptyBlockKeys);

    setTimeout(() => {
      setBoard(shuffled);
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
    if (isCellEmpty(rowIndex, colIndex)) return;

    const reward = getPrizeReward(prize);
    const { clearedBlocks, cutDropBlocks, cutDropBonus, mindSigns } =
      expandClearWithCutDrop([[rowIndex, colIndex]]);
    const collectedBlocks = clearedBlocks.map(([row, col]) => board[row][col]);
    const newColorGoals = reduceColorGoals(colorGoals, collectedBlocks);
    const newScore = score + reward.score + cutDropBonus;
    const newMovesLeft = movesLeft + reward.moves;
    const newShufflesLeft = shufflesLeft + reward.shuffles;
    const milestoneSigns = getGoalMilestones(
      score,
      newScore,
      targetScore,
      colorGoals,
      newColorGoals
    );

    setScore(newScore);
    setMovesLeft(newMovesLeft);
    repairFouls(reward.moves);
    setShufflesLeft(newShufflesLeft);
    setSelectedBlock(null);
    setIsMoving(true);
    setMoveAnimation("none");
    setPrizeCharge(Math.min(prizeCharge + 18, maxPrizeCharge));
    playGameSound("prize");
    showGoalSigns(
      [
        ...milestoneSigns,
        ...mindSigns,
        ...(cutDropBlocks.length > 0
          ? [`Cut drop x${cutDropBlocks.length}`]
          : []),
      ],
      mindSigns.length > 0 || cutDropBlocks.length > 0 ? "blast" : "goal"
    );
    triggerBoardShowtime(
      getShowtimeSigns(newScore, milestoneSigns, [
        "Prize fire",
        ...mindSigns,
        ...(cutDropBlocks.length > 0 ? ["Cut drop"] : []),
      ]),
      newScore,
      "prize",
      940
    );
    setColorGoals(newColorGoals);

    markClearingBlocks(board, clearedBlocks);
    settleBoardAfterClear(clearedBlocks);
    setMessage(
      `Prize ball opened: ${reward.text}!${
        formatCutDropText(cutDropBlocks, cutDropBonus, mindSigns)
      }`
    );
    finishMove(newScore, newMovesLeft, newColorGoals, clearedBlocks.length);
  }

  function activatePipBlast() {
    if (!board || isMoving || gameOver || levelComplete) return;

    if (pipBlastsLeft <= 0) {
      addFoul("Pip Blast is not ready yet.");
      return;
    }

    const blastColor = choosePipBlastColor(board, colorGoals, emptyBlockKeys);
    const blastTargets = findPipBlastTargets(board, blastColor, emptyBlockKeys);

    if (blastTargets.length === 0) {
      addFoul("No clear path for Pip Blast yet.");
      return;
    }

    const crackedLocks = findAdjacentLockedBlocks(
      board,
      blastTargets,
      emptyBlockKeys
    );
    const directClearedBlocks = mergePositions(blastTargets, crackedLocks);
    const { clearedBlocks, cutDropBlocks, cutDropBonus, mindSigns } =
      expandClearWithCutDrop(directClearedBlocks);
    const collectedBlocks = clearedBlocks.map(([row, col]) => board[row][col]);
    const pointsEarned =
      blastTargets.length * 130 + crackedLocks.length * 120 + cutDropBonus;
    const newScore = score + pointsEarned;
    const newColorGoals = reduceColorGoals(colorGoals, collectedBlocks);
    const milestoneSigns = getGoalMilestones(
      score,
      newScore,
      targetScore,
      colorGoals,
      newColorGoals
    );
    setScore(newScore);
    setColorGoals(newColorGoals);
    setPipBlastsLeft(pipBlastsLeft - 1);
    setSelectedBlock(null);
    setIsMoving(true);
    setMoveAnimation("none");
    playGameSound(pointsEarned >= 900 ? "big" : "blast");
    showGoalSigns(
      [
        ...milestoneSigns,
        ...mindSigns,
        ...(cutDropBlocks.length > 0
          ? [`Cut drop x${cutDropBlocks.length}`]
          : []),
      ],
      mindSigns.length > 0 || cutDropBlocks.length > 0 ? "blast" : "goal"
    );
    triggerBoardShowtime(
      getShowtimeSigns(newScore, milestoneSigns, [
        "Pip blast",
        "Rocket fire",
        ...mindSigns,
        ...(cutDropBlocks.length > 0 ? ["Cut drop"] : []),
      ]),
      newScore,
      "big",
      940
    );

    markClearingBlocks(board, clearedBlocks);
    settleBoardAfterClear(clearedBlocks);

    setMessage(
      `Pip Blast cleared ${colorLabels[blastColor]} blocks! +${pointsEarned}${
        formatCutDropText(cutDropBlocks, cutDropBonus, mindSigns)
      }${
        crackedLocks.length > 0 ? ` ${crackedLocks.length} lock cracked!` : ""
      }`
    );
    finishMove(newScore, movesLeft, newColorGoals, clearedBlocks.length);
  }

  function finishMove(
    newScore: number,
    _newMovesLeft: number,
    newColorGoals: ColorGoals,
    clearedCount = 0
  ) {
    if (newScore > highScore) {
      setHighScore(newScore);
      localStorage.setItem("blockpopx-high-score", String(newScore));
    }

    const rushResult = applyRushDrop(clearedCount);

    if (rushResult.overflow) {
      return;
    }

    const rushStockCleared = rushResult.nextDropStock <= 0;
    const puzzleGoalsCleared =
      newScore >= targetScore && getRemainingGoalCount(newColorGoals) === 0;

    if (rushStockCleared || puzzleGoalsCleared) {
      const next = level + 1;
      const nextPuzzle = getPuzzlePlan(next);
      const nextRushMode = getRushMode(next);

      setLevel(next);
      setTargetScore(nextPuzzle.scoreTarget);
      setColorGoals(nextPuzzle.goals);
      setDropStock(getDropStockForLevel(next));
      setPileDanger(Math.max(8, Math.floor(pileDanger * 0.35)));
      setWavesSurvived(0);
      showGoalSigns(["Milestone clear", "New goals open"], "win");
      triggerBoardShowtime(
        [
          "Milestone clear",
          nextRushMode.badge,
          "More balls above",
          "Fire boost",
        ],
        newScore,
        "win",
        420
      );
      setMessage(
        `${nextRushMode.title} unlocked! ${nextPuzzle.title} is open with more falling balls.`
      );
      return;
    }
  }

  function findConnectedBlocks(
    currentBoard: Block[][],
    rowIndex: number,
    colIndex: number,
    color: BlockColor,
    emptyKeys: string[] = []
  ) {
    const visited = new Set<string>();
    const hidden = new Set(emptyKeys);
    const result: [number, number][] = [];

    function search(r: number, c: number) {
      const key = `${r}-${c}`;

      if (r < 0 || r >= rows) return;
      if (c < 0 || c >= cols) return;
      if (visited.has(key)) return;
      if (hidden.has(key)) return;
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

  function restartGame() {
    const puzzle = getPuzzlePlan(level);

    setBoard(createBoard(level));
    setScore(0);
    setMovesLeft(maxMoves);
    setFouls(0);
    setGameOver(false);
    setLevelComplete(false);
    setMessage("");
    setTargetScore(puzzle.scoreTarget);
    setColorGoals(puzzle.goals);
    setStreak(0);
    setSelectedBlock(null);
    setIsMoving(false);
    setMoveAnimation("none");
    setClearingBlockKeys([]);
    setClearingBursts([]);
    setEmptyBlockKeys([]);
    setGravity(puzzle.startingGravity);
    setShufflesLeft(puzzle.startingShuffles);
    setPrizeCharge(puzzle.startingPrizeCharge);
    setPipCharge(puzzle.startingPipCharge);
    setPipBlastsLeft(0);
    setDropStock(getDropStockForLevel(level));
    setPileDanger(18);
    setWavesSurvived(0);
    setLastDropWave(0);
  }

  function nextLevel() {
    const next = level + 1;
    const nextPuzzle = getPuzzlePlan(next);

    setLevel(next);
    setTargetScore(nextPuzzle.scoreTarget);
    setColorGoals(nextPuzzle.goals);
    setBoard(createBoard(next));
    setScore(0);
    setMovesLeft(maxMoves);
    setFouls(0);
    setGameOver(false);
    setLevelComplete(false);
    setMessage(`Level ${next}: ${nextPuzzle.title}. ${nextPuzzle.hint}`);
    setStreak(0);
    setSelectedBlock(null);
    setIsMoving(false);
    setMoveAnimation("none");
    setClearingBlockKeys([]);
    setClearingBursts([]);
    setEmptyBlockKeys([]);
    setGravity(nextPuzzle.startingGravity);
    setShufflesLeft(nextPuzzle.startingShuffles);
    setPrizeCharge(nextPuzzle.startingPrizeCharge);
    setPipCharge(nextPuzzle.startingPipCharge);
    setPipBlastsLeft(0);
    setDropStock(getDropStockForLevel(next));
    setPileDanger(18);
    setWavesSurvived(0);
    setLastDropWave(0);
  }

  function resetHighScore() {
    localStorage.removeItem("blockpopx-high-score");
    setHighScore(0);
    lastShowtimeScore.current = 0;
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

  const puzzlePlan = getPuzzlePlan(level);
  const rushMode = getRushMode(level);
  const scoreProgress = Math.min((score / targetScore) * 100, 100);
  const totalGoalCount = getRemainingGoalCount(puzzlePlan.goals);
  const goalsRemaining = getRemainingGoalCount(colorGoals);
  const goalProgress = Math.min(
    ((totalGoalCount - goalsRemaining) / totalGoalCount) * 100,
    100
  );
  const prizeProgress = Math.min(prizeCharge, maxPrizeCharge);
  const pipProgress = Math.floor((pipCharge / maxPipCharge) * 100);
  const dropStockTotal = getDropStockForLevel(level);
  const dropStockProgress = Math.max(
    0,
    Math.min(100, (dropStock / dropStockTotal) * 100)
  );
  const pileDangerProgress = Math.min(pileDanger, maxPileDanger);
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
        <div className="mx-auto grid max-w-[1300px] gap-3 lg:grid-cols-[minmax(240px,330px)_minmax(360px,560px)_minmax(240px,300px)] lg:items-start">
          <div className="order-1 space-y-3">
          <section className="text-center lg:text-left">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-200">
              Falling Ball Rush
            </p>

            <h1 className="mt-2 text-4xl font-black lg:text-3xl">
              Block<span className="text-fuchsia-400">PopX</span>
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-200">
              Clear waves from the table before hundreds of falling balls push
              the pile to the bottom.
            </p>
          </section>

          <section className="rounded-3xl border border-white/15 bg-black/25 p-3 shadow-2xl backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-amber-200">Level {level}</p>
              <p className="text-sm text-slate-200">Score goal: {targetScore}</p>
            </div>

            <div className="mb-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                  {puzzlePlan.badge}
                </p>
                <p className="rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-black uppercase tracking-wide text-amber-100">
                  Puzzle {((level - 1) % puzzleTemplates.length) + 1}/
                  {puzzleTemplates.length}
                </p>
              </div>

              <p className="mt-1 text-lg font-black text-white">
                {puzzlePlan.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-200">
                {puzzlePlan.hint}
              </p>
            </div>

            <div className="mb-3 rounded-2xl border border-amber-300/25 bg-amber-300/10 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                  {rushMode.badge}
                </p>
                <p className="rounded-full bg-black/20 px-2 py-1 text-[0.65rem] font-black uppercase tracking-wide text-cyan-100">
                  Wave {wavesSurvived + 1}
                </p>
              </div>

              <p className="mt-1 text-lg font-black text-white">
                {rushMode.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-200">
                {rushMode.hint}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-sky-100">
              <span>Balls above</span>
              <span>{dropStock}</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-200 via-cyan-300 to-emerald-300 transition-all"
                style={{ width: `${dropStockProgress}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-rose-100">
              <span>Pile danger</span>
              <span>{pileDangerProgress}%</span>
            </div>

            <div className="mt-2 h-3 overflow-hidden rounded-full bg-black/35">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-yellow-300 to-rose-500 transition-all"
                style={{ width: `${pileDangerProgress}%` }}
              />
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

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Balls</p>
              <p className="text-xl font-black text-sky-300">{dropStock}</p>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-3 text-center shadow-lg">
              <p className="text-xs text-slate-400">Danger</p>
              <p className="text-xl font-black text-rose-300">
                {pileDangerProgress}%
              </p>
            </div>
          </section>

          <section className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={flipGravity}
              disabled={isMoving || gameOver || levelComplete}
              className="rounded-2xl bg-white/10 p-2 text-center text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              {gravity === "down" ? "Down" : "Up"}
            </button>

            <button
              type="button"
              onClick={smartShuffle}
              disabled={isMoving || gameOver || levelComplete}
              className="rounded-2xl bg-white/10 p-2 text-center text-xs font-bold hover:bg-white/20 disabled:opacity-50"
            >
              Mix {shufflesLeft}
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
            Clear the puzzle screen. Solve gates, islands, rails, rings, and
            zigzags by cutting support for bigger drops.
          </p>
          </div>

          <div className="order-3 lg:order-2 lg:w-[min(620px,calc(100vh-104px))] lg:justify-self-center">
          {(gameOver || levelComplete) && (
            <section className="mb-3 rounded-3xl border border-cyan-300 bg-slate-900 p-5 text-center shadow-2xl">
              <h2 className="text-3xl font-black text-cyan-300">
                {levelComplete ? "Puzzle Solved!" : "Rush Over"}
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
            {lastDropWave > 0 && (
              <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[2rem]">
                <div className="absolute left-3 top-3 rounded-full border border-cyan-200/40 bg-slate-950/75 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 shadow-lg">
                  +{lastDropWave} falling
                </div>
                {Array.from({ length: 18 }, (_, dropIndex) => (
                  <span
                    key={dropIndex}
                    className={`drop-rain-ball absolute h-3 w-3 rounded-full ${
                      dropIndex % 5 === 0
                        ? "bg-rose-400"
                        : dropIndex % 5 === 1
                        ? "bg-cyan-300"
                        : dropIndex % 5 === 2
                        ? "bg-emerald-300"
                        : dropIndex % 5 === 3
                        ? "bg-violet-400"
                        : "bg-yellow-300"
                    } shadow-lg shadow-white/20`}
                    style={
                      {
                        left: `${8 + ((dropIndex * 17) % 86)}%`,
                        "--drop-delay": `${dropIndex * 0.045}s`,
                        "--drop-drift":
                          dropIndex % 2 === 0 ? "28px" : "-28px",
                      } as CSSProperties
                    }
                  />
                ))}
              </div>
            )}

            {showtimeSigns.length > 0 && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[2rem]">
                <div className="showtime-flare absolute h-28 w-28 rounded-full bg-cyan-300/25 blur" />
                <div className="showtime-rocket absolute text-5xl drop-shadow">
                  🚀
                </div>
                <div className="showtime-burst flex flex-col items-center gap-2 rounded-3xl border border-white/30 bg-slate-950/80 px-5 py-4 text-center shadow-2xl backdrop-blur">
                  <p className="text-3xl font-black">🔥</p>
                  {showtimeSigns.map((sign) => (
                    <p
                      key={sign}
                      className="text-xs font-black uppercase tracking-[0.18em] text-cyan-100"
                    >
                      {sign}
                    </p>
                  ))}
                </div>
              </div>
            )}

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

            <div className="relative">
              <div
                className={`grid gap-1 transition-all duration-300 sm:gap-1.5 ${
                  isMoving ? "scale-95 opacity-90" : "scale-100 opacity-100"
                } ${
                  moveAnimation === "down"
                    ? "ball-move-down"
                    : moveAnimation === "up"
                    ? "ball-move-up"
                    : moveAnimation === "settleDown"
                    ? "ball-settle-down"
                    : moveAnimation === "settleUp"
                    ? "ball-settle-up"
                    : moveAnimation === "shuffle"
                    ? "ball-shuffle"
                    : moveAnimation === "relocate"
                    ? "ball-relocate"
                    : moveAnimation === "rise"
                    ? "ball-rise-away"
                    : moveAnimation === "zigzag"
                    ? "ball-zigzag-return"
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
                    const isClearing = clearingBlockKeys.includes(
                      `${rowIndex}-${colIndex}`
                    );
                    const isEmpty = emptyBlockKeys.includes(
                      `${rowIndex}-${colIndex}`
                    );

                    if (isEmpty) {
                      return (
                        <div
                          key={`empty-${rowIndex}-${colIndex}`}
                          className="empty-cell relative aspect-square rounded-full border border-cyan-200/15 bg-slate-950/45 shadow-inner shadow-black"
                          aria-hidden="true"
                        />
                      );
                    }

                    return (
                      <button
                        type="button"
                        key={block.id}
                        onClick={() => handleBlockClick(rowIndex, colIndex)}
                        disabled={gameOver || levelComplete || isMoving}
                        className={`game-ball ${getColorClass(
                          block
                        )} relative aspect-square rounded-full border shadow-lg shadow-black/30 transition-all duration-300 hover:scale-110 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70 ${
                          isClearing
                            ? "ball-clearing border-white/70"
                            : ""
                        } ${
                          isSelected
                            ? "border-yellow-300 ring-4 ring-yellow-300 scale-105"
                            : "border-white/40"
                        }`}
                        aria-label={getBlockLabel(block)}
                        style={
                          {
                            "--ball-row": rowIndex,
                            "--ball-col": colIndex,
                            "--settle-up-row": rows - 1 - rowIndex,
                            "--zigzag-start-x":
                              colIndex % 2 === 0 ? "-72px" : "72px",
                            "--zigzag-mid-x":
                              (rowIndex + colIndex) % 2 === 0
                                ? "42px"
                                : "-42px",
                            "--zigzag-cross-x":
                              (rowIndex + colIndex) % 2 === 0
                                ? "-24px"
                                : "24px",
                          } as CSSProperties
                        }
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

              {clearingBursts.length > 0 && (
                <div
                  className="pointer-events-none absolute inset-0 grid gap-1 sm:gap-1.5"
                  style={{
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                  }}
                >
                  {clearingBursts.map((burst) => (
                    <div
                      key={burst.key}
                      className={`clearing-ball ball-clearing ${burst.colorClass} relative aspect-square rounded-full border border-white/80 shadow-xl shadow-cyan-400/30`}
                      style={{
                        gridColumn: burst.col + 1,
                        gridRow: burst.row + 1,
                      }}
                    >
                      <span className="absolute inset-1 rounded-full bg-white/25" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-slate-400">
        <p>(c) 2026 BlockPopX. All rights reserved.</p>

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
