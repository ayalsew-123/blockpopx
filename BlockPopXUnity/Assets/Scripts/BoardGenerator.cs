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

            AddLevelFeatures(board, level);
            BreakLargeEasyGroups(board, level);
            EnsureAllColors(board, level);
            SeedStrategicPairs(board, level);

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

        private static void AddLevelFeatures(BallCell[,] board, int level)
        {
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (level >= 4 && row > 0 && col > 0 && row < Rows - 1 && col < Columns - 1)
                    {
                        if ((row + col + level) % 9 == 0)
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
                }
            }
        }

        private static void BreakLargeEasyGroups(BallCell[,] board, int level)
        {
            var maxGroup = level == 1 ? 3 : 2;
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
            var pairCount = Mathf.Max(5, 11 - Mathf.Min(level, 6));

            for (var index = 0; index < pairCount; index++)
            {
                var row = 1 + PositiveModulo(index * 3 + level, Rows - 2);
                var col = 1 + PositiveModulo(index * 5 + level * 2, Columns - 2);
                var horizontal = index % 3 != 1;
                var secondRow = horizontal ? row : Mathf.Min(Rows - 2, row + 1);
                var secondCol = horizontal ? Mathf.Min(Columns - 2, col + 1) : col;
                var color = BlockPopXColorPalette.All[PositiveModulo(level + index * 3, BlockPopXColorPalette.All.Length)];

                if (board[row, col].Special == BallSpecial.Locked || board[secondRow, secondCol].Special == BallSpecial.Locked)
                {
                    continue;
                }

                board[row, col].Color = color;
                board[secondRow, secondCol].Color = color;
            }
        }

        private static int PositiveModulo(int value, int modulus)
        {
            return (value % modulus + modulus) % modulus;
        }
    }
}

