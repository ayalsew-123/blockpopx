using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.Events;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
using UnityEngine.InputSystem.UI;
#endif

namespace BlockPopX
{
    public sealed class BlockPopXGame : MonoBehaviour
    {
        private const int Rows = 10;
        private const int Columns = 10;
        private const string BestScoreKey = "BlockPopX.BestScore";
        private const string HighestLevelKey = "BlockPopX.HighestLevel";
        private const string SoundEnabledKey = "BlockPopX.SoundEnabled";

        [Header("Board")]
        [SerializeField] private BallView ballPrefab;
        [SerializeField] private Transform boardRoot;
        [SerializeField] private float cellSpacing = 0.48f;
        [SerializeField] private float ballScale = 0.38f;
        [SerializeField] private float boardPadding = 0.9f;

        [Header("Game")]
        [SerializeField] private int level = 1;
        [SerializeField] private bool soundEnabled = true;
        [SerializeField] private float boardPulseScale = 1.035f;

        [Header("Shapes")]
        [SerializeField] private bool shapeDragEnabled = true;
        [SerializeField] private Transform shapeTrayRoot;
        [SerializeField] private float shapeTrayOffset = 0.8f;

        public UnityEvent<int> ScoreChanged = new UnityEvent<int>();
        public UnityEvent<int> BestScoreChanged = new UnityEvent<int>();
        public UnityEvent<int> LevelChanged = new UnityEvent<int>();
        public UnityEvent<int> HighestLevelChanged = new UnityEvent<int>();
        public UnityEvent<int> FoulsChanged = new UnityEvent<int>();
        public UnityEvent<string> MessageChanged = new UnityEvent<string>();
        public UnityEvent<bool> PauseChanged = new UnityEvent<bool>();
        public UnityEvent<bool> SoundChanged = new UnityEvent<bool>();
        public UnityEvent GameOver = new UnityEvent();

        private static readonly Vector2Int[][] ShapeLibrary =
        {
            new[] { new Vector2Int(0, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(1, 0), new Vector2Int(1, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(1, 1) },
            new[] { new Vector2Int(0, 1), new Vector2Int(1, 0), new Vector2Int(1, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(1, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0), new Vector2Int(2, 1) },
            new[] { new Vector2Int(0, 1), new Vector2Int(1, 1), new Vector2Int(2, 1), new Vector2Int(2, 0) },
            new[] { new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(1, 0), new Vector2Int(1, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(1, 1), new Vector2Int(1, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(1, 1), new Vector2Int(1, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(1, 0), new Vector2Int(1, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(0, 3) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0), new Vector2Int(3, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(0, 3), new Vector2Int(0, 4) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0), new Vector2Int(3, 0), new Vector2Int(4, 0) }
        };

        private BallCell[,] board;
        private BallView[,] views;
        private ShapePieceView[] shapePieces;
        private ShapePieceView activeShapePiece;
        private Sprite runtimeBlockSprite;
        private AudioSource audioSource;
        private AudioClip popClip;
        private AudioClip failClip;
        private AudioClip rewardClip;
        private Coroutine boardFeedbackRoutine;

        private int score;
        private int bestScore;
        private int highestLevel = 1;
        private int fouls;
        private int linesClearedThisLevel;
        private bool isGameOver;
        private bool isPaused;
        private bool isLevelComplete;
        private string currentMessage = "";
        private int lastControlFrame = -1;

        public int CurrentLevel => level;
        public int CurrentScore => score;
        public int BestScore => bestScore;
        public int HighestLevel => highestLevel;
        public int CurrentFouls => fouls;
        public int MaxFouls => 0;
        public string CurrentMessage => currentMessage;
        public string CurrentLevelTitle => GetLevelTitle(level);
        public string CurrentGoalText => $"Clear {linesClearedThisLevel}/{GetLineTarget(level)} lines";
        public bool IsGameOver => isGameOver;
        public bool IsPaused => isPaused;
        public bool SoundEnabled => soundEnabled;
        public bool IsLevelComplete => isLevelComplete;
        public bool CanDragShape => shapeDragEnabled && !isGameOver && !isPaused && !isLevelComplete && board != null;

        private void Awake()
        {
            if (boardRoot == null)
            {
                boardRoot = transform;
            }

            runtimeBlockSprite = CreateRoundedBlockSprite();
            audioSource = gameObject.GetComponent<AudioSource>();
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
            }

            audioSource.playOnAwake = false;
            popClip = CreateToneClip(650f, 0.08f, 0.18f);
            failClip = CreateToneClip(150f, 0.1f, 0.14f);
            rewardClip = CreateToneClip(880f, 0.16f, 0.22f);
            ConfigureRuntimeInputModule();
        }

        private void Start()
        {
            bestScore = PlayerPrefs.GetInt(BestScoreKey, 0);
            highestLevel = Mathf.Max(1, PlayerPrefs.GetInt(HighestLevelKey, 1));
            soundEnabled = PlayerPrefs.GetInt(SoundEnabledKey, soundEnabled ? 1 : 0) == 1;

            ApplyDefaultBoardSizing();
            StartLevel(1, true);

            BestScoreChanged.Invoke(bestScore);
            HighestLevelChanged.Invoke(highestLevel);
            SoundChanged.Invoke(soundEnabled);
            PauseChanged.Invoke(isPaused);
        }

        private void OnValidate()
        {
            cellSpacing = Mathf.Max(0.28f, cellSpacing);
            ballScale = Mathf.Clamp(ballScale, 0.18f, 0.7f);
            boardPadding = Mathf.Max(0.1f, boardPadding);
            shapeTrayOffset = Mathf.Max(0.3f, shapeTrayOffset);
            level = Mathf.Max(1, level);
        }

        private void Update()
        {
            if (!TryReadPointer(out var screenPosition, out var pressedThisFrame, out var isPressed, out var releasedThisFrame))
            {
                return;
            }

            if (pressedThisFrame)
            {
                var worldPosition = ScreenToWorldPosition(screenPosition);
                activeShapePiece = FindShapeUnderPointer(worldPosition);

                if (activeShapePiece != null)
                {
                    activeShapePiece.BeginDrag(worldPosition);
                }
                else
                {
                    TryHandleBottomControl(screenPosition);
                }
            }

            if (isPressed && activeShapePiece != null)
            {
                activeShapePiece.DragTo(ScreenToWorldPosition(screenPosition));
            }

            if (releasedThisFrame && activeShapePiece != null)
            {
                activeShapePiece.DragTo(ScreenToWorldPosition(screenPosition));
                activeShapePiece.EndDrag();
                activeShapePiece = null;
            }
        }

        public void StartLevel(int nextLevel)
        {
            StartLevel(nextLevel, true);
        }

        public void RestartLevel()
        {
            StartLevel(level, true);
        }

        public void NextLevel()
        {
            if (!isLevelComplete)
            {
                SetMessage("Clear the line goal first.");
                return;
            }

            StartLevel(level + 1, false);
        }

        public void TogglePause()
        {
            if (isGameOver || isLevelComplete)
            {
                return;
            }

            isPaused = !isPaused;
            PauseChanged.Invoke(isPaused);
            SetMessage(isPaused ? "Paused." : "Place shapes. Clear full rows and columns.");
        }

        public void Resume()
        {
            if (!isPaused)
            {
                return;
            }

            isPaused = false;
            PauseChanged.Invoke(false);
            SetMessage("Place shapes. Clear full rows and columns.");
        }

        public void ToggleSound()
        {
            SetSoundEnabled(!soundEnabled);
        }

        public void SetSoundEnabled(bool isEnabled)
        {
            soundEnabled = isEnabled;
            PlayerPrefs.SetInt(SoundEnabledKey, soundEnabled ? 1 : 0);
            PlayerPrefs.Save();
            SoundChanged.Invoke(soundEnabled);
        }

        public void TapCell(int row, int col)
        {
            if (row < 0 || row >= Rows || col < 0 || col >= Columns || views == null)
            {
                return;
            }

            if (views[row, col] != null)
            {
                views[row, col].PlayInvalidPulse();
            }

            SetMessage("Drag a shape from the tray onto the board.");
        }

        public void TryPlaceShape(ShapePieceView shapePiece, Vector3 worldPosition)
        {
            if (shapePiece == null || !CanDragShape)
            {
                shapePiece?.ReturnHome();
                return;
            }

            var anchor = WorldToBoardPosition(worldPosition);
            if (!CanPlaceShape(shapePiece.Offsets, anchor.x, anchor.y))
            {
                PlaySound(failClip);
                shapePiece.ReturnHome();
                SetMessage("That shape does not fit there.");
                return;
            }

            PlaceShape(shapePiece, anchor.x, anchor.y);
            Destroy(shapePiece.gameObject);
            shapePieces[shapePiece.SlotIndex] = null;

            var placedCount = shapePiece.Offsets.Count;
            var clearedCount = ClearCompletedLines(out var lineCount);
            var gained = placedCount * 10 + clearedCount * 25 + lineCount * lineCount * 100;
            AddScore(gained);

            if (lineCount > 0)
            {
                linesClearedThisLevel += lineCount;
                PlayRewardFeedback();
                SetMessage($"+{gained} points. Cleared {lineCount} line{(lineCount == 1 ? "" : "s")}.");
            }
            else
            {
                PlaySound(popClip);
                SetMessage($"+{gained} points. Build full rows or columns.");
            }

            if (linesClearedThisLevel >= GetLineTarget(level))
            {
                CompleteLevel();
                return;
            }

            if (!HasAnyShapePieces())
            {
                RefreshShapeTray();
            }

            if (!AnyShapeCanFit())
            {
                EndGame("No space left for any shape.");
            }
        }

        private void StartLevel(int nextLevel, bool resetRun)
        {
            level = Mathf.Max(1, nextLevel);
            linesClearedThisLevel = 0;
            fouls = 0;
            isGameOver = false;
            isPaused = false;
            isLevelComplete = false;

            if (resetRun)
            {
                score = 0;
            }

            if (level > highestLevel)
            {
                highestLevel = level;
                PlayerPrefs.SetInt(HighestLevelKey, highestLevel);
                PlayerPrefs.Save();
                HighestLevelChanged.Invoke(highestLevel);
            }

            CreateBoard();
            SeedLevelPattern(level);
            ClearBoardViews();
            RenderGrid();
            RenderOccupiedCells();
            RefreshShapeTray();

            ScoreChanged.Invoke(score);
            LevelChanged.Invoke(level);
            FoulsChanged.Invoke(fouls);
            PauseChanged.Invoke(isPaused);
            SetMessage("Place shapes. Clear full rows and columns.");
        }

        private void CreateBoard()
        {
            board = new BallCell[Rows, Columns];
            views = new BallView[Rows, Columns];

            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    board[row, col] = new BallCell(BlockPopXColor.Blue)
                    {
                        IsEmpty = true
                    };
                }
            }
        }

        private void SeedLevelPattern(int currentLevel)
        {
            if (currentLevel <= 1)
            {
                AddStarterRuns();
                return;
            }

            AddStarterRuns();
            AddNearlyCompleteRow(1, 7, currentLevel);

            if (currentLevel >= 3)
            {
                AddNearlyCompleteColumn(0, 8, currentLevel + 1);
                AddCornerPuzzle(currentLevel);
            }

            if (currentLevel >= 4)
            {
                AddNearlyCompleteRow(5, 4, currentLevel + 2);
                AddPocketPuzzle(currentLevel);
            }

            if (currentLevel >= 5)
            {
                AddCrossPuzzle(currentLevel);
                AddDiagonalPuzzle(currentLevel);
            }

            if (currentLevel >= 6)
            {
                AddAdvancedGaps(currentLevel);
            }
        }

        private void AddStarterRuns()
        {
            FillCell(1, 0, BlockPopXColor.Red);
            FillCell(1, 1, BlockPopXColor.Red);
            FillCell(1, 3, BlockPopXColor.Yellow);
            FillCell(1, 4, BlockPopXColor.Yellow);
            FillCell(1, 5, BlockPopXColor.Yellow);
            FillCell(3, 0, BlockPopXColor.Red);
            FillCell(4, 0, BlockPopXColor.Red);
            FillCell(3, 5, BlockPopXColor.Orange);
            FillCell(3, 6, BlockPopXColor.Orange);
            FillCell(5, 3, BlockPopXColor.Yellow);
        }

        private void AddNearlyCompleteRow(int row, int missingColumn, int seed)
        {
            for (var col = 0; col < Columns; col++)
            {
                if (col == missingColumn || col == (missingColumn + 3) % Columns)
                {
                    continue;
                }

                FillCell(row, col, PickColor(seed + col));
            }
        }

        private void AddNearlyCompleteColumn(int column, int missingRow, int seed)
        {
            for (var row = 0; row < Rows; row++)
            {
                if (row == missingRow || row == (missingRow + 4) % Rows)
                {
                    continue;
                }

                FillCell(row, column, PickColor(seed + row));
            }
        }

        private void AddCornerPuzzle(int seed)
        {
            FillCell(0, 8, PickColor(seed));
            FillCell(0, 9, PickColor(seed + 1));
            FillCell(1, 8, PickColor(seed + 2));
            FillCell(8, 0, PickColor(seed + 3));
            FillCell(8, 1, PickColor(seed + 4));
            FillCell(9, 0, PickColor(seed + 5));
        }

        private void AddPocketPuzzle(int seed)
        {
            FillCell(6, 6, PickColor(seed));
            FillCell(6, 7, PickColor(seed + 1));
            FillCell(7, 6, PickColor(seed + 2));
            FillCell(7, 8, PickColor(seed + 3));
            FillCell(8, 7, PickColor(seed + 4));
        }

        private void AddCrossPuzzle(int seed)
        {
            for (var col = 2; col <= 7; col++)
            {
                if (col != 4)
                {
                    FillCell(4, col, PickColor(seed + col));
                }
            }

            for (var row = 2; row <= 7; row++)
            {
                if (row != 5)
                {
                    FillCell(row, 5, PickColor(seed + row + 6));
                }
            }
        }

        private void AddDiagonalPuzzle(int seed)
        {
            for (var index = 0; index < 8; index++)
            {
                var row = index + 1;
                var col = (index + 2) % Columns;
                if ((index + seed) % 3 != 0)
                {
                    FillCell(row, col, PickColor(seed + index));
                }
            }
        }

        private void AddAdvancedGaps(int seed)
        {
            for (var row = 2; row <= 8; row += 2)
            {
                for (var col = 2; col <= 8; col += 3)
                {
                    if ((row + col + seed) % 4 != 0)
                    {
                        FillCell(row, col, PickColor(seed + row + col));
                    }
                }
            }
        }

        private void FillCell(int row, int col, BlockPopXColor color)
        {
            if (row < 0 || row >= Rows || col < 0 || col >= Columns)
            {
                return;
            }

            board[row, col] = new BallCell(color)
            {
                IsEmpty = false
            };
        }

        private void PlaceShape(ShapePieceView shapePiece, int anchorRow, int anchorCol)
        {
            foreach (var offset in shapePiece.Offsets)
            {
                var row = anchorRow + offset.x;
                var col = anchorCol + offset.y;
                board[row, col] = new BallCell(shapePiece.Color)
                {
                    IsEmpty = false
                };

                CreateBlockView(row, col);
            }
        }

        private int ClearCompletedLines(out int lineCount)
        {
            var rowsToClear = new List<int>();
            var colsToClear = new List<int>();

            for (var row = 0; row < Rows; row++)
            {
                var full = true;
                for (var col = 0; col < Columns; col++)
                {
                    if (board[row, col].IsEmpty)
                    {
                        full = false;
                        break;
                    }
                }

                if (full)
                {
                    rowsToClear.Add(row);
                }
            }

            for (var col = 0; col < Columns; col++)
            {
                var full = true;
                for (var row = 0; row < Rows; row++)
                {
                    if (board[row, col].IsEmpty)
                    {
                        full = false;
                        break;
                    }
                }

                if (full)
                {
                    colsToClear.Add(col);
                }
            }

            lineCount = rowsToClear.Count + colsToClear.Count;
            if (lineCount == 0)
            {
                return 0;
            }

            var cleared = 0;
            var marked = new bool[Rows, Columns];
            foreach (var row in rowsToClear)
            {
                for (var col = 0; col < Columns; col++)
                {
                    marked[row, col] = true;
                }
            }

            foreach (var col in colsToClear)
            {
                for (var row = 0; row < Rows; row++)
                {
                    marked[row, col] = true;
                }
            }

            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (!marked[row, col])
                    {
                        continue;
                    }

                    board[row, col].IsEmpty = true;
                    if (views[row, col] != null)
                    {
                        views[row, col].PlayPopAndDestroy(0.16f);
                        views[row, col] = null;
                    }

                    cleared++;
                }
            }

            return cleared;
        }

        private bool CanPlaceShape(IReadOnlyList<Vector2Int> offsets, int anchorRow, int anchorCol)
        {
            if (offsets == null || board == null)
            {
                return false;
            }

            foreach (var offset in offsets)
            {
                var row = anchorRow + offset.x;
                var col = anchorCol + offset.y;
                if (row < 0 || row >= Rows || col < 0 || col >= Columns || !board[row, col].IsEmpty)
                {
                    return false;
                }
            }

            return true;
        }

        private bool AnyShapeCanFit()
        {
            if (shapePieces == null)
            {
                return false;
            }

            foreach (var shapePiece in shapePieces)
            {
                if (shapePiece == null)
                {
                    continue;
                }

                for (var row = 0; row < Rows; row++)
                {
                    for (var col = 0; col < Columns; col++)
                    {
                        if (CanPlaceShape(shapePiece.Offsets, row, col))
                        {
                            return true;
                        }
                    }
                }
            }

            return false;
        }

        private bool HasAnyShapePieces()
        {
            if (shapePieces == null)
            {
                return false;
            }

            foreach (var shapePiece in shapePieces)
            {
                if (shapePiece != null)
                {
                    return true;
                }
            }

            return false;
        }

        private void RefreshShapeTray()
        {
            ClearShapeTray();
            shapePieces = new ShapePieceView[3];

            var root = shapeTrayRoot != null ? shapeTrayRoot : transform;
            var trayY = boardRoot.TransformPoint(new Vector3(0f, -Rows * cellSpacing * 0.5f - shapeTrayOffset, 0f)).y;
            var slotSpacing = cellSpacing * 3.2f;
            var levelSeed = level * 17 + score / 10;

            for (var slot = 0; slot < shapePieces.Length; slot++)
            {
                var shapeObject = new GameObject($"ShapeSlot {slot + 1}");
                shapeObject.transform.SetParent(root, true);
                shapeObject.transform.position = new Vector3((slot - 1) * slotSpacing, trayY, 0f);

                var shape = shapeObject.AddComponent<ShapePieceView>();
                var offsets = PickShapeOffsets(levelSeed + slot * 5);
                var color = PickColor(levelSeed + slot * 3);
                shape.Setup(this, slot, offsets, color, shapeObject.transform.position, cellSpacing, runtimeBlockSprite);
                shapePieces[slot] = shape;
            }
        }

        private Vector2Int[] PickShapeOffsets(int seed)
        {
            var maxIndex = Mathf.Clamp(5 + level * 2, 6, ShapeLibrary.Length);
            var index = Mathf.Abs(seed * 31 + level * 7) % maxIndex;
            var source = ShapeLibrary[index];
            var result = new Vector2Int[source.Length];
            for (var i = 0; i < source.Length; i++)
            {
                result[i] = source[i];
            }

            return result;
        }

        private void ClearShapeTray()
        {
            if (shapePieces != null)
            {
                foreach (var shapePiece in shapePieces)
                {
                    if (shapePiece != null)
                    {
                        Destroy(shapePiece.gameObject);
                    }
                }
            }

            shapePieces = null;
            activeShapePiece = null;
        }

        private void CompleteLevel()
        {
            isLevelComplete = true;
            ClearShapeTray();
            PlayRewardFeedback();
            SetMessage($"Level {level} complete! Tap Next.");
            LevelChanged.Invoke(level);
        }

        private void EndGame(string reason)
        {
            isGameOver = true;
            isPaused = false;
            ClearShapeTray();
            PlaySound(failClip);
            SetMessage($"{reason} Game over.");
            PauseChanged.Invoke(false);
            GameOver.Invoke();
        }

        private void AddScore(int amount)
        {
            score += Mathf.Max(0, amount);
            if (score > bestScore)
            {
                bestScore = score;
                PlayerPrefs.SetInt(BestScoreKey, bestScore);
                PlayerPrefs.Save();
                BestScoreChanged.Invoke(bestScore);
            }

            ScoreChanged.Invoke(score);
        }

        private void SetMessage(string message)
        {
            currentMessage = $"L{level} Score {score} - {message}";
            MessageChanged.Invoke(currentMessage);
        }

        private string GetLevelTitle(int value)
        {
            switch (Mathf.Clamp(value, 1, 6))
            {
                case 1:
                    return "Classic Blocks";
                case 2:
                    return "Row Builder";
                case 3:
                    return "Column Gates";
                case 4:
                    return "Corner Pockets";
                case 5:
                    return "Cross Puzzle";
                default:
                    return "Expert Blocks";
            }
        }

        private int GetLineTarget(int value)
        {
            return Mathf.Clamp(2 + value, 3, 8);
        }

        private BlockPopXColor PickColor(int seed)
        {
            var colors = BlockPopXColorPalette.All;
            return colors[Mathf.Abs(seed) % colors.Length];
        }

        private void RenderGrid()
        {
            var gridColor = new Color(0.09f, 0.16f, 0.28f, 0.82f);
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    var gridObject = new GameObject($"Grid {row},{col}");
                    gridObject.transform.SetParent(boardRoot, false);
                    gridObject.transform.localPosition = BoardToLocalPosition(row, col, 0.04f);
                    gridObject.transform.localScale = Vector3.one * (ballScale * 1.04f);

                    var renderer = gridObject.AddComponent<SpriteRenderer>();
                    renderer.sprite = runtimeBlockSprite;
                    renderer.color = gridColor;
                    renderer.sortingOrder = 1;
                }
            }
        }

        private void RenderOccupiedCells()
        {
            for (var row = 0; row < Rows; row++)
            {
                for (var col = 0; col < Columns; col++)
                {
                    if (!board[row, col].IsEmpty)
                    {
                        CreateBlockView(row, col);
                    }
                }
            }
        }

        private void CreateBlockView(int row, int col)
        {
            if (views[row, col] != null)
            {
                Destroy(views[row, col].gameObject);
            }

            BallView view;
            if (ballPrefab != null)
            {
                view = Instantiate(ballPrefab, boardRoot);
                view.transform.localPosition = BoardToLocalPosition(row, col, -0.02f);
            }
            else
            {
                var blockObject = new GameObject($"Block {row},{col}");
                blockObject.transform.SetParent(boardRoot, false);
                blockObject.transform.localPosition = BoardToLocalPosition(row, col, -0.02f);

                var renderer = blockObject.AddComponent<SpriteRenderer>();
                renderer.sprite = runtimeBlockSprite;
                renderer.sortingOrder = 12;
                blockObject.AddComponent<CircleCollider2D>();
                view = blockObject.AddComponent<BallView>();
            }

            view.transform.localScale = Vector3.one * ballScale;
            view.Bind(this, row, col, board[row, col]);
            views[row, col] = view;
        }

        private void ClearBoardViews()
        {
            if (boardRoot == null)
            {
                return;
            }

            for (var i = boardRoot.childCount - 1; i >= 0; i--)
            {
                Destroy(boardRoot.GetChild(i).gameObject);
            }
        }

        private Vector3 BoardToLocalPosition(int row, int col, float z)
        {
            var x = (col - (Columns - 1) * 0.5f) * cellSpacing;
            var y = ((Rows - 1) * 0.5f - row) * cellSpacing;
            return new Vector3(x, y, z);
        }

        private Vector2Int WorldToBoardPosition(Vector3 worldPosition)
        {
            var local = boardRoot.InverseTransformPoint(worldPosition);
            var col = Mathf.RoundToInt(local.x / cellSpacing + (Columns - 1) * 0.5f);
            var row = Mathf.RoundToInt((Rows - 1) * 0.5f - local.y / cellSpacing);
            return new Vector2Int(row, col);
        }

        private ShapePieceView FindShapeUnderPointer(Vector3 worldPosition)
        {
            var collider = Physics2D.OverlapPoint(worldPosition);
            if (collider == null)
            {
                return null;
            }

            return collider.GetComponentInParent<ShapePieceView>();
        }

        private Vector3 ScreenToWorldPosition(Vector2 screenPosition)
        {
            var camera = Camera.main;
            if (camera == null)
            {
                return Vector3.zero;
            }

            var zDistance = -camera.transform.position.z;
            var world = camera.ScreenToWorldPoint(new Vector3(screenPosition.x, screenPosition.y, zDistance));
            world.z = 0f;
            return world;
        }

        private bool TryHandleBottomControl(Vector2 screenPosition)
        {
            if (Time.frameCount == lastControlFrame || screenPosition.y > 95f)
            {
                return false;
            }

            lastControlFrame = Time.frameCount;
            var hasNext = isLevelComplete;
            var zones = hasNext ? 4 : 3;
            var index = Mathf.Clamp(Mathf.FloorToInt(screenPosition.x / Mathf.Max(1f, Screen.width / (float)zones)), 0, zones - 1);

            if (index == 0)
            {
                TogglePause();
            }
            else if (index == 1)
            {
                RestartLevel();
            }
            else if (index == 2)
            {
                ToggleSound();
            }
            else
            {
                NextLevel();
            }

            return true;
        }

        private bool TryReadPointer(out Vector2 screenPosition, out bool pressedThisFrame, out bool isPressed, out bool releasedThisFrame)
        {
            screenPosition = Vector2.zero;
            pressedThisFrame = false;
            isPressed = false;
            releasedThisFrame = false;

#if ENABLE_INPUT_SYSTEM
            if (Touchscreen.current != null)
            {
                var touch = Touchscreen.current.primaryTouch;
                if (touch.press.isPressed || touch.press.wasPressedThisFrame || touch.press.wasReleasedThisFrame)
                {
                    screenPosition = touch.position.ReadValue();
                    pressedThisFrame = touch.press.wasPressedThisFrame;
                    isPressed = touch.press.isPressed;
                    releasedThisFrame = touch.press.wasReleasedThisFrame;
                    return true;
                }
            }

            if (Mouse.current == null)
            {
                return false;
            }

            screenPosition = Mouse.current.position.ReadValue();
            pressedThisFrame = Mouse.current.leftButton.wasPressedThisFrame;
            isPressed = Mouse.current.leftButton.isPressed;
            releasedThisFrame = Mouse.current.leftButton.wasReleasedThisFrame;
            return pressedThisFrame || isPressed || releasedThisFrame;
#else
            screenPosition = Input.mousePosition;
            pressedThisFrame = Input.GetMouseButtonDown(0);
            isPressed = Input.GetMouseButton(0);
            releasedThisFrame = Input.GetMouseButtonUp(0);
            return pressedThisFrame || isPressed || releasedThisFrame;
#endif
        }

        private void ApplyDefaultBoardSizing()
        {
            if (boardRoot != null)
            {
                boardRoot.localScale = Vector3.one;
            }

            var camera = Camera.main;
            if (camera != null)
            {
                camera.orthographic = true;
                camera.orthographicSize = Mathf.Max(5.1f, (Rows * cellSpacing + boardPadding * 2f) * 0.65f);
                camera.transform.position = new Vector3(0f, 0f, -10f);
                camera.backgroundColor = new Color(0.015f, 0.04f, 0.08f);
            }
        }

        private void ConfigureRuntimeInputModule()
        {
            var eventSystem = FindAnyObjectByType<EventSystem>();
            if (eventSystem == null)
            {
                var eventSystemObject = new GameObject("EventSystem");
                eventSystem = eventSystemObject.AddComponent<EventSystem>();
            }

#if ENABLE_INPUT_SYSTEM
            if (eventSystem.GetComponent<InputSystemUIInputModule>() == null)
            {
                eventSystem.gameObject.AddComponent<InputSystemUIInputModule>();
            }
#else
            if (eventSystem.GetComponent<StandaloneInputModule>() == null)
            {
                eventSystem.gameObject.AddComponent<StandaloneInputModule>();
            }
#endif
        }

        private Sprite CreateRoundedBlockSprite()
        {
            const int size = 96;
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false);
            texture.filterMode = FilterMode.Bilinear;

            var center = new Vector2(size * 0.5f, size * 0.5f);
            var radius = size * 0.43f;
            var corner = size * 0.17f;

            for (var y = 0; y < size; y++)
            {
                for (var x = 0; x < size; x++)
                {
                    var dx = Mathf.Abs(x - center.x);
                    var dy = Mathf.Abs(y - center.y);
                    var inside = dx <= radius && dy <= radius;

                    if (dx > radius - corner && dy > radius - corner)
                    {
                        var cornerCenter = new Vector2(radius - corner, radius - corner);
                        var cornerDelta = new Vector2(dx, dy) - cornerCenter;
                        inside = cornerDelta.magnitude <= corner;
                    }

                    if (!inside)
                    {
                        texture.SetPixel(x, y, Color.clear);
                        continue;
                    }

                    var shade = 0.9f + 0.1f * Mathf.Clamp01((float)(x + y) / (size * 2f));
                    texture.SetPixel(x, y, new Color(shade, shade, shade, 1f));
                }
            }

            texture.Apply();
            return Sprite.Create(texture, new Rect(0f, 0f, size, size), new Vector2(0.5f, 0.5f), size);
        }

        private AudioClip CreateToneClip(float frequency, float duration, float volume)
        {
            const int sampleRate = 44100;
            var sampleCount = Mathf.CeilToInt(sampleRate * duration);
            var data = new float[sampleCount];

            for (var index = 0; index < sampleCount; index++)
            {
                var t = index / (float)sampleRate;
                var fade = 1f - index / (float)sampleCount;
                data[index] = Mathf.Sin(2f * Mathf.PI * frequency * t) * volume * fade;
            }

            var clip = AudioClip.Create($"Tone {frequency}", sampleCount, 1, sampleRate, false);
            clip.SetData(data, 0);
            return clip;
        }

        private void PlaySound(AudioClip clip)
        {
            if (!soundEnabled || clip == null || audioSource == null)
            {
                return;
            }

            audioSource.PlayOneShot(clip);
        }

        private void PlayRewardFeedback()
        {
            PlaySound(rewardClip);

            if (boardFeedbackRoutine != null)
            {
                StopCoroutine(boardFeedbackRoutine);
            }

            boardFeedbackRoutine = StartCoroutine(BoardPulseRoutine());
        }

        private IEnumerator BoardPulseRoutine()
        {
            if (boardRoot == null)
            {
                yield break;
            }

            var originalScale = boardRoot.localScale;
            var targetScale = originalScale * boardPulseScale;
            const float duration = 0.18f;

            for (var elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
            {
                var t = Mathf.Clamp01(elapsed / duration);
                var wave = Mathf.Sin(t * Mathf.PI);
                boardRoot.localScale = Vector3.Lerp(originalScale, targetScale, wave);
                yield return null;
            }

            boardRoot.localScale = originalScale;
            boardFeedbackRoutine = null;
        }
    }
}
