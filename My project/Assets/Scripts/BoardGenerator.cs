using System.Collections.Generic;
using UnityEngine;

namespace BlockPopX
{
    public static class BoardGenerator
    {
        public const int Rows = 10;
        public const int Columns = 10;

        public static BallCell[,] CreateBoard(int level)
        {
            var board = new BallCell[Rows, Columns];

            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    var color = ChooseColor(row, col, level);
                    board[row, col] = new BallCell(color);
                }
            }

            BreakLargeEasyGroups(board, level);
            EnsureAllColors(board, level);
            AddLevelFeatures(board, level);
            SeedStrategicPairs(board, level);
            PaintLevelPuzzleLayout(board, level);

            return board;
        }

        private static BlockPopXColor ChooseColor(int row, int col, int level)
        {
            var centerRow = Rows / 2;
            var centerCol = Columns / 2;
            var ring = Mathf.Max(Mathf.Abs(row - centerRow), Mathf.Abs(col - centerCol));
            var diamond = Mathf.Abs(row - centerRow) + Mathf.Abs(col - centerCol);
            var pattern = ((level - 1) * 41) % 12;
            var index = row * 3 + col * 5 + level;

            switch (pattern)
            {
                case 0:
                    index = Mathf.FloorToInt(row / 2f) * 2 + Mathf.FloorToInt(col / 2f) + level;
                    break;
                case 1:
                    index = row + col * 2 + ring + level;
                    break;
                case 2:
                    index = Mathf.Abs(row - col) * 2 + Mathf.FloorToInt(col / 2f) + level;
                    break;
                case 3:
                    index = diamond * 2 + row % 3 + level;
                    break;
                case 4:
                    index = (row % 2 == 0 ? col : Columns - 1 - col) + row * 2 + level;
                    break;
                case 5:
                    index = row * row + col * 7 + row * col + level;
                    break;
                case 6:
                    index = (row == centerRow || col == centerCol ? 0 : 5) + ring + row + col;
                    break;
                case 7:
                    index = Mathf.Abs(row + col - (Columns - 1)) * 2 + row + level;
                    break;
                case 8:
                    index = Mathf.FloorToInt(row / 2f) * 5 + Mathf.FloorToInt(col / 2f) * 3 + diamond;
                    break;
                case 9:
                    index = (row % 3) * 4 + (col % 4) * 2 + ring + level;
                    break;
                case 10:
                    index = Mathf.FloorToInt((row * 5 + col * 2 + Mathf.Abs(row - col) * 3) / 4f);
                    break;
                case 11:
                    index = row * row + col * col + row * col + ring * 3;
                    break;
            }

            return BlockPopXColorPalette.All[PositiveModulo(index, BlockPopXColorPalette.All.Length)];
        }

        private static void PaintLevelPuzzleLayout(BallCell[,] board, int level)
        {
            var stage = Mathf.Clamp(level, 1, 5);
            if (stage <= 5)
            {
                ClearSpecials(board);
            }

            FillPuzzleBackground(board, level);

            if (stage == 1)
            {
                PaintStarterPairs(board);
                return;
            }

            if (stage == 2)
            {
                PaintColorPaths(board);
                return;
            }

            if (stage == 3)
            {
                PaintZigzagSteps(board);
                return;
            }

            if (stage == 4)
            {
                PaintLockGates(board);
                return;
            }

            PaintPipMaze(board);
        }

        private static void PaintStarterPairs(BallCell[,] board)
        {
            PaintRun(board, 1, 1, 0, 1, 3, BlockPopXColor.Red);
            PaintRun(board, 1, 6, 0, 1, 2, BlockPopXColor.Blue);
            PaintRun(board, 3, 2, 0, 1, 2, BlockPopXColor.Green);
            PaintRun(board, 3, 6, 0, 1, 3, BlockPopXColor.Yellow);
            PaintRun(board, 5, 1, 0, 1, 2, BlockPopXColor.Purple);
            PaintRun(board, 5, 5, 0, 1, 2, BlockPopXColor.Pink);
            PaintRun(board, 7, 2, 0, 1, 3, BlockPopXColor.Orange);
            PaintRun(board, 8, 6, 0, 1, 2, BlockPopXColor.Teal);
        }

        private static void PaintColorPaths(BallCell[,] board)
        {
            PaintRun(board, 1, 1, 0, 1, 4, BlockPopXColor.Red);
            PaintRun(board, 2, 4, 1, 0, 3, BlockPopXColor.Red);
            PaintRun(board, 1, 7, 1, 0, 4, BlockPopXColor.Blue);
            PaintRun(board, 4, 4, 0, 1, 3, BlockPopXColor.Blue);
            PaintRun(board, 6, 1, 0, 1, 4, BlockPopXColor.Green);
            PaintRun(board, 6, 4, 1, 0, 3, BlockPopXColor.Green);
            PaintRun(board, 8, 5, 0, 1, 4, BlockPopXColor.Purple);
            PaintRun(board, 4, 1, 1, 1, 3, BlockPopXColor.Yellow);
        }

        private static void PaintZigzagSteps(BallCell[,] board)
        {
            PaintRun(board, 1, 1, 1, 1, 4, BlockPopXColor.Red);
            PaintRun(board, 4, 4, -1, 1, 4, BlockPopXColor.Red);
            PaintRun(board, 1, 8, 1, -1, 4, BlockPopXColor.Blue);
            PaintRun(board, 4, 5, 1, 1, 4, BlockPopXColor.Blue);
            PaintRun(board, 6, 1, 0, 1, 3, BlockPopXColor.Green);
            PaintRun(board, 7, 3, 1, 1, 3, BlockPopXColor.Green);
            PaintRun(board, 7, 8, 0, -1, 3, BlockPopXColor.Purple);
            PaintRun(board, 8, 6, -1, -1, 3, BlockPopXColor.Purple);
            PaintRun(board, 2, 2, 0, 1, 2, BlockPopXColor.Yellow);
            PaintRun(board, 5, 6, 1, 0, 2, BlockPopXColor.Orange);
        }

        private static void PaintLockGates(BallCell[,] board)
        {
            SetLocked(board, 3, 4);
            SetLocked(board, 3, 5);
            SetLocked(board, 4, 4);
            SetLocked(board, 5, 5);
            SetLocked(board, 6, 4);
            SetLocked(board, 6, 5);

            PaintRun(board, 2, 3, 0, 1, 2, BlockPopXColor.Red);
            PaintRun(board, 2, 5, 0, 1, 2, BlockPopXColor.Blue);
            PaintRun(board, 4, 2, 0, 1, 2, BlockPopXColor.Green);
            PaintRun(board, 4, 5, 0, 1, 3, BlockPopXColor.Yellow);
            PaintRun(board, 5, 2, 0, 1, 2, BlockPopXColor.Purple);
            PaintRun(board, 6, 6, 0, 1, 2, BlockPopXColor.Pink);
            PaintRun(board, 7, 3, 0, 1, 2, BlockPopXColor.Orange);
            PaintRun(board, 7, 5, 0, 1, 2, BlockPopXColor.Teal);
        }

        private static void PaintPipMaze(BallCell[,] board)
        {
            SetLocked(board, 2, 4);
            SetLocked(board, 3, 4);
            SetLocked(board, 4, 4);
            SetLocked(board, 5, 5);
            SetLocked(board, 6, 5);
            SetLocked(board, 7, 5);
            SetLocked(board, 4, 7);
            SetLocked(board, 5, 2);

            PaintPipRun(board, 1, 1, 0, 1, 3, BlockPopXColor.Red, 2);
            PaintPipRun(board, 1, 6, 1, 0, 3, BlockPopXColor.Blue, 2);
            PaintPipRun(board, 3, 1, 1, 1, 3, BlockPopXColor.Green, 3);
            PaintPipRun(board, 5, 7, 1, -1, 3, BlockPopXColor.Purple, 2);
            PaintPipRun(board, 7, 1, 0, 1, 4, BlockPopXColor.Pink, 1);
            PaintPipRun(board, 8, 6, 0, 1, 3, BlockPopXColor.Orange, 2);
            PaintRun(board, 2, 6, 0, 1, 2, BlockPopXColor.Teal);
            PaintRun(board, 6, 2, 0, 1, 2, BlockPopXColor.Yellow);
        }

        private static void PaintPipRun(BallCell[,] board, int row, int col, int rowStep, int colStep, int length, BlockPopXColor color, int pips)
        {
            PaintRun(board, row, col, rowStep, colStep, length, color);
            MarkRunAsPips(board, row, col, rowStep, colStep, length, pips);
        }

        private static void ClearSpecials(BallCell[,] board)
        {
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    board[row, col].Special = BallSpecial.None;
                    board[row, col].Pips = 0;
                }
            }
        }

        private static void SetLocked(BallCell[,] board, int row, int col)
        {
            if (row < 0 || row >= Rows || col < 0 || col >= Columns)
            {
                return;
            }

            board[row, col].Special = BallSpecial.Locked;
            board[row, col].Pips = 0;
        }

        private static void FillPuzzleBackground(BallCell[,] board, int level)
        {
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (board[row, col].Special == BallSpecial.Locked)
                    {
                        continue;
                    }

                    board[row, col].Color = ChooseSeparatedColor(board, row, col, level);
                }
            }
        }

        private static BlockPopXColor ChooseSeparatedColor(BallCell[,] board, int row, int col, int level)
        {
            var palette = BlockPopXColorPalette.All;
            var start = PositiveModulo(level * 7 + row * 3 + col * 5, palette.Length);

            for (var offset = 0; offset < palette.Length; offset++)
            {
                var color = palette[PositiveModulo(start + offset, palette.Length)];
                if (!MatchesPreviousNeighbor(board, row, col, color))
                {
                    return color;
                }
            }

            return palette[start];
        }

        private static bool MatchesPreviousNeighbor(BallCell[,] board, int row, int col, BlockPopXColor color)
        {
            for (var checkRow = row - 1; checkRow <= row; checkRow++)
            {
                for (var checkCol = col - 1; checkCol <= col + 1; checkCol++)
                {
                    if (checkRow == row && checkCol >= col)
                    {
                        continue;
                    }

                    if (checkRow < 0 || checkCol < 0 || checkCol >= Columns)
                    {
                        continue;
                    }

                    if (board[checkRow, checkCol].Special != BallSpecial.Locked && board[checkRow, checkCol].Color == color)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private static void PaintRun(BallCell[,] board, int row, int col, int rowStep, int colStep, int length, BlockPopXColor color)
        {
            for (var index = 0; index < length; index++)
            {
                SetGuideColor(board, row + rowStep * index, col + colStep * index, color);
            }
        }

        private static void SetGuideColor(BallCell[,] board, int row, int col, BlockPopXColor color)
        {
            if (row < 0 || row >= Rows || col < 0 || col >= Columns || board[row, col].Special == BallSpecial.Locked)
            {
                return;
            }

            board[row, col].Color = color;
        }

        private static void MarkRunAsPips(BallCell[,] board, int row, int col, int rowStep, int colStep, int length, int pips)
        {
            for (var index = 0; index < length; index++)
            {
                var nextRow = row + rowStep * index;
                var nextCol = col + colStep * index;
                if (nextRow < 0 || nextRow >= Rows || nextCol < 0 || nextCol >= Columns || board[nextRow, nextCol].Special == BallSpecial.Locked)
                {
                    continue;
                }

                board[nextRow, nextCol].Special = BallSpecial.Pip;
                board[nextRow, nextCol].Pips = pips;
            }
        }

        private static void AddLevelFeatures(BallCell[,] board, int level)
        {
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (level >= 4 && row > 0 && col > 0 && row < Rows - 1 && col < Columns - 1)
                    {
                        var isGate = (row + col + level) % 9 == 0;
                        var isZigZag = level >= 7 && row % 2 == 0 && col == PositiveModulo(row + level, Columns - 2) + 1;
                        if (isGate || isZigZag)
                        {
                            board[row, col].Special = BallSpecial.Locked;
                        }
                    }

                    if (level >= 5 && board[row, col].Special == BallSpecial.None)
                    {
                        if ((row * 2 + col + level) % 11 == 0)
                        {
                            board[row, col].Special = BallSpecial.Pip;
                            board[row, col].Pips = 1 + PositiveModulo(row + col + level, 3);
                        }
                    }

                    if (level >= 6 && board[row, col].Special == BallSpecial.None)
                    {
                        if (row > 0 && col > 0 && row < Rows - 1 && col < Columns - 1 && (row * 7 + col * 5 + level) % 23 == 0)
                        {
                            board[row, col].Special = BallSpecial.Rocket;
                        }
                    }

                    if (level >= 7 && board[row, col].Special == BallSpecial.None)
                    {
                        if ((row * 11 + col * 3 + level) % 31 == 0)
                        {
                            board[row, col].Special = BallSpecial.Prize;
                        }
                    }
                }
            }

            EnsurePipTotal(board, level >= 5 ? 12 : 0, level);
            EnsureSpecialCount(board, BallSpecial.Rocket, level >= 6 ? 3 : 0, level);
            EnsureSpecialCount(board, BallSpecial.Prize, level >= 7 ? 2 + (level - 7) / 2 : 0, level);
        }

        private static void EnsurePipTotal(BallCell[,] board, int targetPips, int level)
        {
            var currentPips = 0;
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (board[row, col].Special == BallSpecial.Pip)
                    {
                        currentPips += Mathf.Max(1, board[row, col].Pips);
                    }
                }
            }

            var seed = 0;
            while (currentPips < targetPips && seed < Rows * Columns * 2)
            {
                var row = 1 + PositiveModulo(level * 5 + seed * 3, Rows - 2);
                var col = 1 + PositiveModulo(level * 7 + seed * 4, Columns - 2);
                if (board[row, col].Special == BallSpecial.None)
                {
                    board[row, col].Special = BallSpecial.Pip;
                    board[row, col].Pips = 2;
                    currentPips += 2;
                }

                seed++;
            }
        }

        private static void EnsureSpecialCount(BallCell[,] board, BallSpecial special, int targetCount, int level)
        {
            var currentCount = 0;
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (board[row, col].Special == special)
                    {
                        currentCount++;
                    }
                }
            }

            var seed = 0;
            while (currentCount < targetCount && seed < Rows * Columns * 2)
            {
                var row = 1 + PositiveModulo(level * 3 + seed * 5, Rows - 2);
                var col = 1 + PositiveModulo(level * 11 + seed * 2, Columns - 2);
                if (board[row, col].Special == BallSpecial.None)
                {
                    board[row, col].Special = special;
                    currentCount++;
                }

                seed++;
            }
        }

        private static void BreakLargeEasyGroups(BallCell[,] board, int level)
        {
            var maxGroup = level == 1 ? 3 : level >= 8 ? 3 : 2;
            var visited = new bool[Rows, Columns];

            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (visited[row, col])
                    {
                        continue;
                    }

                    var group = FindGroup(board, row, col, visited);
                    if (group.Count <= maxGroup)
                    {
                        continue;
                    }

                    for (var index = maxGroup; index < group.Count; index++)
                    {
                        var cell = group[index];
                        var shift = 1 + PositiveModulo(cell.x * 2 + cell.y * 3 + level + index, BlockPopXColorPalette.All.Length - 1);
                        var colorIndex = System.Array.IndexOf(BlockPopXColorPalette.All, board[cell.x, cell.y].Color);
                        board[cell.x, cell.y].Color = BlockPopXColorPalette.All[PositiveModulo(colorIndex + shift, BlockPopXColorPalette.All.Length)];
                    }
                }
            }
        }

        private static List<Vector2Int> FindGroup(BallCell[,] board, int startRow, int startCol, bool[,] visited)
        {
            var group = new List<Vector2Int>();
            var queue = new Queue<Vector2Int>();
            var color = board[startRow, startCol].Color;

            queue.Enqueue(new Vector2Int(startRow, startCol));
            visited[startRow, startCol] = true;

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                group.Add(current);

                TryAdd(board, queue, visited, current.x - 1, current.y, color);
                TryAdd(board, queue, visited, current.x + 1, current.y, color);
                TryAdd(board, queue, visited, current.x, current.y - 1, color);
                TryAdd(board, queue, visited, current.x, current.y + 1, color);
            }

            return group;
        }

        private static void TryAdd(BallCell[,] board, Queue<Vector2Int> queue, bool[,] visited, int row, int col, BlockPopXColor color)
        {
            if (row < 0 || row >= Rows || col < 0 || col >= Columns || visited[row, col])
            {
                return;
            }

            if (board[row, col].Special == BallSpecial.Locked || board[row, col].Color != color)
            {
                return;
            }

            visited[row, col] = true;
            queue.Enqueue(new Vector2Int(row, col));
        }

        private static void EnsureAllColors(BallCell[,] board, int level)
        {
            for (var colorIndex = 0; colorIndex < BlockPopXColorPalette.All.Length; colorIndex++)
            {
                var color = BlockPopXColorPalette.All[colorIndex];
                var found = false;

                for (var row = 0; row < Rows; row++)
                {
                    for (var col = 0; col < Columns; col++)
                    {
                        if (board[row, col].Color == color)
                        {
                            found = true;
                        }
                    }
                }

                if (!found)
                {
                    var row = PositiveModulo(level * 3 + colorIndex * 2, Rows);
                    var col = PositiveModulo(level * 5 + colorIndex * 4, Columns);
                    board[row, col].Color = color;
                    board[row, col].Special = BallSpecial.None;
                    board[row, col].Pips = 0;
                }
            }
        }

        private static void SeedStrategicPairs(BallCell[,] board, int level)
        {
            var pairCount = level >= 8 ? 8 : Mathf.Max(5, 11 - Mathf.Min(level, 6));

            for (var index = 0; index < pairCount; index++)
            {
                var row = 1 + PositiveModulo(index * 3 + level, Rows - 2);
                var col = 1 + PositiveModulo(index * 5 + level * 2, Columns - 2);
                var horizontal = index % 3 != 1;
                row = horizontal ? row : Mathf.Min(Rows - 3, row);
                col = horizontal ? Mathf.Min(Columns - 3, col) : col;

                var secondRow = horizontal ? row : row + 1;
                var secondCol = horizontal ? col + 1 : col;
                var thirdRow = horizontal ? row : row + 2;
                var thirdCol = horizontal ? col + 2 : col;
                var color = BlockPopXColorPalette.All[PositiveModulo(level + index * 3, BlockPopXColorPalette.All.Length)];

                if (board[row, col].Special != BallSpecial.None || board[secondRow, secondCol].Special != BallSpecial.None)
                {
                    continue;
                }

                board[row, col].Color = color;
                board[secondRow, secondCol].Color = color;

                if (level >= 8 && board[thirdRow, thirdCol].Special == BallSpecial.None)
                {
                    board[thirdRow, thirdCol].Color = color;
                }
            }
        }

        private static int PositiveModulo(int value, int modulus)
        {
            return (value % modulus + modulus) % modulus;
        }
    }
}
