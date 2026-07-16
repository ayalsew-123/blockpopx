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
        private const string BestScoreKey = "BlockPopX.BestScore";
        private const string HighestLevelKey = "BlockPopX.HighestLevel";
        private const string SoundEnabledKey = "BlockPopX.SoundEnabled";

        [Header("Board")]
        [SerializeField] private BallView ballPrefab;
        [SerializeField] private Transform boardRoot;
        [SerializeField] private float cellSpacing = 0.48f;
        [SerializeField] private float ballScale = 0.38f;
        [SerializeField] private float boardPadding = 0.9f;

        [Header("State")]
        [SerializeField] private int level = 1;
        [SerializeField] private bool classicBlockMode = true;
        [SerializeField] private bool unlimitedTaps = true;
        [SerializeField] private int maxFouls = 3;

        [Header("Feedback")]
        [SerializeField] private bool soundEnabled = true;
        [SerializeField] private float boardPulseScale = 1.035f;

        [Header("Shape Drag")]
        [SerializeField] private bool shapeDragEnabled = true;
        [SerializeField] private Transform shapeTrayRoot;
        [SerializeField] private float shapeTrayOffset = 0.8f;

        [Header("Events")]
        public UnityEvent<int> ScoreChanged = new UnityEvent<int>();
        public UnityEvent<int> BestScoreChanged = new UnityEvent<int>();
        public UnityEvent<int> LevelChanged = new UnityEvent<int>();
        public UnityEvent<int> HighestLevelChanged = new UnityEvent<int>();
        public UnityEvent<int> FoulsChanged = new UnityEvent<int>();
        public UnityEvent<string> MessageChanged = new UnityEvent<string>();
        public UnityEvent<bool> PauseChanged = new UnityEvent<bool>();
        public UnityEvent<bool> SoundChanged = new UnityEvent<bool>();
        public UnityEvent GameOver = new UnityEvent();

        private BallCell[,] board;
        private BallView[,] views;
        private LevelPlan plan;
        private int score;
        private int bestScore;
        private int highestLevel = 1;
        private int fouls;
        private int clearedBalls;
        private int crackedLocks;
        private int collectedPips;
        private int firedRockets;
        private int foundPrizes;
        private int classicLinesCleared;
        private int levelStartScore;
        private bool isGameOver;
        private bool isPaused;
        private bool isLevelComplete;
        private string currentMessage = "";
        private Sprite runtimeBallSprite;
        private Sprite runtimeBlockSprite;
        private AudioSource audioSource;
        private AudioClip popClip;
        private AudioClip foulClip;
        private AudioClip levelClip;
        private Coroutine boardFeedbackRoutine;
        private int lastTapFrame = -1;
        private int lastControlFrame = -1;
        private ShapePieceView[] shapePieces;
        private ShapePieceView activeShapePiece;

        private static readonly Vector2Int[][] ShapeLibrary =
        {
            new[] { new Vector2Int(0, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(1, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(1, 0), new Vector2Int(1, 1) },
            new[] { new Vector2Int(0, 1), new Vector2Int(1, 0), new Vector2Int(1, 1), new Vector2Int(1, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(1, 1), new Vector2Int(2, 1) },
            new[] { new Vector2Int(0, 1), new Vector2Int(1, 0), new Vector2Int(1, 1), new Vector2Int(1, 2), new Vector2Int(2, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(0, 3) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0), new Vector2Int(3, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0), new Vector2Int(2, 1) },
            new[] { new Vector2Int(0, 1), new Vector2Int(1, 1), new Vector2Int(2, 1), new Vector2Int(2, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(1, 1), new Vector2Int(1, 2) },
            new[] { new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(1, 0), new Vector2Int(1, 1) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(1, 1), new Vector2Int(1, 2), new Vector2Int(2, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 2), new Vector2Int(1, 0), new Vector2Int(1, 1), new Vector2Int(1, 2) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(1, 0), new Vector2Int(2, 0) },
            new[] { new Vector2Int(0, 0), new Vector2Int(0, 1), new Vector2Int(0, 2), new Vector2Int(0, 3), new Vector2Int(0, 4) },
            new[] { new Vector2Int(0, 0), new Vector2Int(1, 0), new Vector2Int(2, 0), new Vector2Int(3, 0), new Vector2Int(4, 0) }
        };

        public int CurrentLevel => level;
        public int CurrentScore => score;
        public int BestScore => bestScore;
        public int HighestLevel => highestLevel;
        public int CurrentFouls => fouls;
        public int MaxFouls => unlimitedTaps ? 0 : maxFouls;
        public string CurrentMessage => currentMessage;
        public string CurrentLevelTitle => classicBlockMode ? GetClassicLevelTitle() : plan != null && !string.IsNullOrEmpty(plan.Title) ? plan.Title : LevelPlan.ForLevel(level).Title;
        public string CurrentGoalText => classicBlockMode ? GetClassicGoalText() : GetGoalProgressText();
        public bool IsGameOver => isGameOver;
        public bool IsPaused => isPaused;
        public bool SoundEnabled => soundEnabled;
        public bool IsLevelComplete => isLevelComplete;
        public bool CanDragShape => classicBlockMode && shapeDragEnabled && !isGameOver && !isPaused && !isLevelComplete && board != null;

        private void Awake()
        {
            ConfigureRuntimeInputModule();
        }

        private void Start()
        {
            ApplyDefaultBoardSizing();
            LoadProgress();
            EnsureAudioSource();
            FitCameraToBoard();
            StartLevel(1);
            BestScoreChanged.Invoke(bestScore);
            HighestLevelChanged.Invoke(highestLevel);
            SoundChanged.Invoke(soundEnabled);
            PauseChanged.Invoke(isPaused);
        }

        private static void ConfigureRuntimeInputModule()
        {
#if ENABLE_INPUT_SYSTEM
            var eventSystem = EventSystem.current;
            if (eventSystem == null)
            {
                eventSystem = FindAnyObjectByType<EventSystem>();
            }

            if (eventSystem == null)
            {
                return;
            }

#if !ENABLE_LEGACY_INPUT_MANAGER
            foreach (var legacyModule in eventSystem.GetComponents<StandaloneInputModule>())
            {
                Destroy(legacyModule);
            }

            if (eventSystem.GetComponent<InputSystemUIInputModule>() == null)
            {
                eventSystem.gameObject.AddComponent<InputSystemUIInputModule>();
            }
#endif
#endif
        }

        private void OnValidate()
        {
            cellSpacing = Mathf.Max(0.32f, cellSpacing);
            ballScale = Mathf.Max(0.24f, ballScale);
            boardPadding = Mathf.Max(0.25f, boardPadding);
        }

        private void ApplyDefaultBoardSizing()
        {
            cellSpacing = 0.48f;
            ballScale = 0.38f;
            boardPadding = 0.9f;
        }

        private void Update()
        {
#if ENABLE_INPUT_SYSTEM
            if (TryReadInputSystemPointer(out var pointerPosition, out var pointerDown, out var pointerHeld, out var pointerUp))
            {
                if (pointerDown)
                {
                    HandlePointerDown(pointerPosition);
                }
                else if (pointerHeld)
                {
                    HandlePointerDrag(pointerPosition);
                }

                if (pointerUp)
                {
                    HandlePointerUp(pointerPosition);
                }
            }
#endif

#if ENABLE_LEGACY_INPUT_MANAGER
            if (Input.GetMouseButtonDown(0))
            {
                HandlePointerDown(Input.mousePosition);
            }

            if (Input.GetMouseButton(0))
            {
                HandlePointerDrag(Input.mousePosition);
            }

            if (Input.GetMouseButtonUp(0))
            {
                HandlePointerUp(Input.mousePosition);
            }
#endif
        }

#if ENABLE_INPUT_SYSTEM
        private static bool TryReadInputSystemPointer(out Vector2 position, out bool wasPressed, out bool isPressed, out bool wasReleased)
        {
            position = Vector2.zero;
            wasPressed = false;
            isPressed = false;
            wasReleased = false;

            if (Touchscreen.current != null)
            {
                var touch = Touchscreen.current.primaryTouch;
                if (touch.press.wasPressedThisFrame || touch.press.isPressed || touch.press.wasReleasedThisFrame)
                {
                    position = touch.position.ReadValue();
                    wasPressed = touch.press.wasPressedThisFrame;
                    isPressed = touch.press.isPressed;
                    wasReleased = touch.press.wasReleasedThisFrame;
                    return true;
                }
            }

            if (Mouse.current != null)
            {
                position = Mouse.current.position.ReadValue();
                wasPressed = Mouse.current.leftButton.wasPressedThisFrame;
                isPressed = Mouse.current.leftButton.isPressed;
                wasReleased = Mouse.current.leftButton.wasReleasedThisFrame;
                return wasPressed || isPressed || wasReleased;
            }

            return false;
        }
#endif

        public void StartLevel(int nextLevel)
        {
            StartLevel(nextLevel, true);
        }

        private void StartLevel(int nextLevel, bool resetRun)
        {
            level = Mathf.Max(1, nextLevel);
            plan = LevelPlan.ForLevel(level);
            board = classicBlockMode ? CreateClassicBoard(level) : BoardGenerator.CreateBoard(level);
            views = new BallView[BoardGenerator.Rows, BoardGenerator.Columns];
            if (resetRun)
            {
                score = 0;
                fouls = 0;
            }

            levelStartScore = score;
            clearedBalls = 0;
            crackedLocks = 0;
            collectedPips = 0;
            firedRockets = 0;
            foundPrizes = 0;
            classicLinesCleared = 0;
            isGameOver = false;
            isPaused = false;
            isLevelComplete = false;

            if (level > highestLevel)
            {
                highestLevel = level;
                PlayerPrefs.SetInt(HighestLevelKey, highestLevel);
                PlayerPrefs.Save();
                HighestLevelChanged.Invoke(highestLevel);
            }

            ClearBoardViews();
            ResetBoardScale();
            if (!classicBlockMode)
            {
                FillMissingBoardCells();
            }

            RenderBoard();
            RefreshShapeTray();
            LevelChanged.Invoke(level);
            ScoreChanged.Invoke(score);
            BestScoreChanged.Invoke(bestScore);
            FoulsChanged.Invoke(fouls);
            PauseChanged.Invoke(isPaused);
            SetMessage(classicBlockMode ? $"Clear {GetClassicLineTarget()} lines. Place all 3 shapes, then new shapes appear." : $"Goal: {plan.GoalLabel}. {plan.Hint}");
        }

        public void TapCell(int row, int col)
        {
            if (lastTapFrame == Time.frameCount)
            {
                return;
            }

            lastTapFrame = Time.frameCount;

            if (classicBlockMode)
            {
                return;
            }

            if (board == null || isGameOver || isPaused || isLevelComplete)
            {
                return;
            }

            if (!IsInside(row, col) || board[row, col].IsEmpty)
            {
                return;
            }

            if (board[row, col].Special == BallSpecial.Locked)
            {
                views[row, col]?.PlayInvalidPulse();
                AddFoul("Locked ball. Clear beside it first.");
                return;
            }

            var group = FindConnectedGroup(row, col);
            if (group.Count < plan.MinimumGroupSize)
            {
                views[row, col]?.PlayInvalidPulse();
                AddFoul($"Need {plan.MinimumGroupSize} or more matching balls.");
                return;
            }

            var cellsToClear = BuildClearSet(group);
            var pipsThisMove = CountPips(cellsToClear);
            var rocketsThisMove = CountSpecial(cellsToClear, BallSpecial.Rocket);
            var prizesThisMove = CountSpecial(cellsToClear, BallSpecial.Prize);
            var points = group.Count * group.Count * 10;
            points += Mathf.Max(0, cellsToClear.Count - group.Count) * 15;
            points += pipsThisMove * 30;
            points += rocketsThisMove * 120;
            points += prizesThisMove * 250;

            foreach (var cell in cellsToClear)
            {
                ClearCell(cell);
                CrackAdjacentLocks(cell.x, cell.y);
            }

            clearedBalls += cellsToClear.Count;
            collectedPips += pipsThisMove;
            firedRockets += rocketsThisMove;
            foundPrizes += prizesThisMove;

            PlayPopFeedback(cellsToClear.Count);
            score += points;
            SaveBestScoreIfNeeded();
            ScoreChanged.Invoke(score);

            ApplyGravityAndRefill();

            if (TryCompleteLevel(points))
            {
                ClearShapeTray();
                return;
            }

            RefreshShapeTray();
            SetMessage($"+{points} points. {GetGoalProgressText()}");
        }

        public void TryPlaceShape(ShapePieceView shapePiece, Vector3 worldPosition)
        {
            if (shapePiece == null || !CanDragShape)
            {
                shapePiece?.ReturnHome();
                return;
            }

            if (classicBlockMode)
            {
                TryPlaceClassicShape(shapePiece, worldPosition);
                return;
            }

            var anchor = WorldToBoardCell(worldPosition);
            if (!TryGetShapeCells(anchor.x, anchor.y, shapePiece.Offsets, shapePiece.Color, out var cellsToClear))
            {
                shapePiece.ReturnHome();
                AddFoul("Shape must cover matching color cells.");
                return;
            }

            foreach (var cell in cellsToClear)
            {
                ClearCell(cell);
                CrackAdjacentLocks(cell.x, cell.y);
            }

            var points = cellsToClear.Count * cellsToClear.Count * 12;
            clearedBalls += cellsToClear.Count;
            PlayPopFeedback(cellsToClear.Count);
            score += points;
            SaveBestScoreIfNeeded();
            ScoreChanged.Invoke(score);
            Destroy(shapePiece.gameObject);

            ApplyGravityAndRefill();

            if (TryCompleteLevel(points))
            {
                ClearShapeTray();
                return;
            }

            RefreshShapeTray();
            SetMessage($"+{points} shape points. {GetGoalProgressText()}");
        }

        private void TryPlaceClassicShape(ShapePieceView shapePiece, Vector3 worldPosition)
        {
            var anchor = WorldToBoardCell(worldPosition);
            if (!TryGetClassicPlacementCells(anchor.x, anchor.y, shapePiece.Offsets, out var placementCells))
            {
                shapePiece.ReturnHome();
                SetMessage("That shape does not fit there.");
                PlayFoulFeedback();
                return;
            }

            foreach (var cell in placementCells)
            {
                var nextCell = new BallCell(shapePiece.Color)
                {
                    IsEmpty = false
                };
                board[cell.x, cell.y] = nextCell;

                var view = CreateBallView(cell.x, cell.y);
                view.Bind(this, cell.x, cell.y, nextCell);
                views[cell.x, cell.y] = view;
            }

            var placedCount = placementCells.Count;
            Destroy(shapePiece.gameObject);
            if (shapePieces != null && shapePiece.SlotIndex >= 0 && shapePiece.SlotIndex < shapePieces.Length)
            {
                shapePieces[shapePiece.SlotIndex] = null;
            }

            var clearedCount = ClearCompletedClassicLines(out var lineCount);
            classicLinesCleared += lineCount;
            var points = placedCount * 10 + clearedCount * 25 + lineCount * lineCount * 100;
            score += points;
            clearedBalls += clearedCount;
            SaveBestScoreIfNeeded();
            ScoreChanged.Invoke(score);
            PlayPopFeedback(Mathf.Max(placedCount, clearedCount));

            if (TryCompleteClassicLevel(points))
            {
                return;
            }

            if (AreAllShapeSlotsEmpty())
            {
                RefreshShapeTray();
            }

            if (!HasAnyClassicMove())
            {
                isGameOver = true;
                GameOver.Invoke();
                SetMessage($"Game over. Score {score}. Restart to try again.");
                return;
            }

            var clearText = lineCount > 0 ? $" Cleared {lineCount} line{(lineCount == 1 ? "" : "s")}!" : "";
            SetMessage($"+{points} points.{clearText} {GetClassicGoalText()}");
        }

        private List<Vector2Int> BuildClearSet(List<Vector2Int> group)
        {
            var cellsToClear = new List<Vector2Int>();
            var included = new bool[BoardGenerator.Rows, BoardGenerator.Columns];

            foreach (var cell in group)
            {
                AddClearCell(cellsToClear, included, cell.x, cell.y);
            }

            foreach (var cell in group)
            {
                if (board[cell.x, cell.y].Special == BallSpecial.Rocket)
                {
                    for (var col = 0; col < BoardGenerator.Columns; col++)
                    {
                        AddClearCell(cellsToClear, included, cell.x, col);
                    }

                    for (var row = 0; row < BoardGenerator.Rows; row++)
                    {
                        AddClearCell(cellsToClear, included, row, cell.y);
                    }
                }

                if (board[cell.x, cell.y].Special == BallSpecial.Prize)
                {
                    for (var row = cell.x - 1; row <= cell.x + 1; row++)
                    {
                        for (var col = cell.y - 1; col <= cell.y + 1; col++)
                        {
                            AddClearCell(cellsToClear, included, row, col);
                        }
                    }
                }
            }

            return cellsToClear;
        }

        private void TryTapScreenPosition(Vector2 screenPosition)
        {
            if (board == null || isGameOver || isPaused)
            {
                return;
            }

            var camera = Camera.main;
            if (camera == null)
            {
                return;
            }

            var worldPosition = camera.ScreenToWorldPoint(new Vector3(screenPosition.x, screenPosition.y, -camera.transform.position.z));
            var hit = Physics2D.OverlapPoint(worldPosition);
            if (hit == null || !hit.TryGetComponent<BallView>(out var ballView) || ballView.Game != this)
            {
                return;
            }

            TapCell(ballView.Row, ballView.Column);
        }

        private void HandlePointerDown(Vector2 screenPosition)
        {
            if (TryBeginShapeDrag(screenPosition))
            {
                return;
            }

            if (TryHandleControlTap(screenPosition))
            {
                return;
            }

            TryTapScreenPosition(screenPosition);
        }

        private void HandlePointerDrag(Vector2 screenPosition)
        {
            if (activeShapePiece == null)
            {
                return;
            }

            activeShapePiece.DragTo(ScreenToWorldPosition(screenPosition));
        }

        private void HandlePointerUp(Vector2 screenPosition)
        {
            if (activeShapePiece == null)
            {
                return;
            }

            activeShapePiece.DragTo(ScreenToWorldPosition(screenPosition));
            activeShapePiece.EndDrag();
            activeShapePiece = null;
        }

        private bool TryBeginShapeDrag(Vector2 screenPosition)
        {
            if (!CanDragShape)
            {
                return false;
            }

            var worldPosition = ScreenToWorldPosition(screenPosition);
            var hit = Physics2D.OverlapPoint(worldPosition);
            if (hit == null || !hit.TryGetComponent<ShapePieceView>(out var shapePiece))
            {
                return false;
            }

            activeShapePiece = shapePiece;
            activeShapePiece.BeginDrag(worldPosition);
            return true;
        }

        private bool TryHandleControlTap(Vector2 screenPosition)
        {
            if (Screen.width <= 0 || Screen.height <= 0)
            {
                return false;
            }

            var controlHeight = Mathf.Max(90f, Screen.height * 0.13f);
            if (screenPosition.y > controlHeight)
            {
                return false;
            }

            var normalizedX = Mathf.Clamp01(screenPosition.x / Screen.width);
            if (normalizedX < 0.25f)
            {
                TogglePause();
                return true;
            }

            if (normalizedX < 0.5f)
            {
                RestartLevel();
                return true;
            }

            if (normalizedX < 0.75f)
            {
                ToggleSound();
                return true;
            }

            return false;
        }

        private static Vector3 ScreenToWorldPosition(Vector2 screenPosition)
        {
            var camera = Camera.main;
            if (camera == null)
            {
                return Vector3.zero;
            }

            var worldPosition = camera.ScreenToWorldPoint(new Vector3(screenPosition.x, screenPosition.y, -camera.transform.position.z));
            worldPosition.z = 0f;
            return worldPosition;
        }

        private void AddClearCell(List<Vector2Int> cellsToClear, bool[,] included, int row, int col)
        {
            if (!IsInside(row, col) || included[row, col] || board[row, col].IsEmpty || board[row, col].Special == BallSpecial.Locked)
            {
                return;
            }

            included[row, col] = true;
            cellsToClear.Add(new Vector2Int(row, col));
        }

        private void ClearCell(Vector2Int cell)
        {
            board[cell.x, cell.y].IsEmpty = true;

            if (views[cell.x, cell.y] != null)
            {
                views[cell.x, cell.y].PlayPopAndDestroy();
                views[cell.x, cell.y] = null;
            }
        }

        private int CountPips(List<Vector2Int> cells)
        {
            var total = 0;
            foreach (var cell in cells)
            {
                if (board[cell.x, cell.y].Special == BallSpecial.Pip)
                {
                    total += Mathf.Max(1, board[cell.x, cell.y].Pips);
                }
            }

            return total;
        }

        private int CountSpecial(List<Vector2Int> cells, BallSpecial special)
        {
            var total = 0;
            foreach (var cell in cells)
            {
                if (board[cell.x, cell.y].Special == special)
                {
                    total++;
                }
            }

            return total;
        }

        public void RestartLevel()
        {
            if (!TryBeginControlAction())
            {
                return;
            }

            StartLevel(level);
        }

        public void NextLevel()
        {
            if (!TryBeginControlAction())
            {
                return;
            }

            if (!isLevelComplete)
            {
                SetMessage("Finish this level first.");
                return;
            }

            StartLevel(level + 1, false);
            SetMessage($"Level {level}: {plan.GoalLabel}. {plan.Hint}");
        }

        public void TogglePause()
        {
            if (!TryBeginControlAction())
            {
                return;
            }

            if (isGameOver)
            {
                return;
            }

            SetPaused(!isPaused);
        }

        public void Resume()
        {
            SetPaused(false);
        }

        public void ToggleSound()
        {
            if (!TryBeginControlAction())
            {
                return;
            }

            SetSoundEnabled(!soundEnabled);
        }

        private bool TryBeginControlAction()
        {
            if (lastControlFrame == Time.frameCount)
            {
                return false;
            }

            lastControlFrame = Time.frameCount;
            return true;
        }

        public void SetSoundEnabled(bool isEnabled)
        {
            if (soundEnabled == isEnabled)
            {
                return;
            }

            soundEnabled = isEnabled;
            PlayerPrefs.SetInt(SoundEnabledKey, soundEnabled ? 1 : 0);
            PlayerPrefs.Save();
            SoundChanged.Invoke(soundEnabled);

            if (audioSource != null)
            {
                audioSource.mute = !soundEnabled;
            }

            if (soundEnabled)
            {
                EnsureAudioSource();
                SetMessage("Sound on.");
            }
            else
            {
                SetMessage("Sound off.");
            }
        }

        private List<Vector2Int> FindConnectedGroup(int startRow, int startCol)
        {
            var group = new List<Vector2Int>();
            var queue = new Queue<Vector2Int>();
            var visited = new bool[BoardGenerator.Rows, BoardGenerator.Columns];
            var color = board[startRow, startCol].Color;

            queue.Enqueue(new Vector2Int(startRow, startCol));
            visited[startRow, startCol] = true;

            while (queue.Count > 0)
            {
                var current = queue.Dequeue();
                group.Add(current);

                TryAdd(current.x - 1, current.y, color, visited, queue);
                TryAdd(current.x + 1, current.y, color, visited, queue);
                TryAdd(current.x, current.y - 1, color, visited, queue);
                TryAdd(current.x, current.y + 1, color, visited, queue);
                TryAdd(current.x - 1, current.y - 1, color, visited, queue);
                TryAdd(current.x - 1, current.y + 1, color, visited, queue);
                TryAdd(current.x + 1, current.y - 1, color, visited, queue);
                TryAdd(current.x + 1, current.y + 1, color, visited, queue);
            }

            return group;
        }

        private void TryAdd(int row, int col, BlockPopXColor color, bool[,] visited, Queue<Vector2Int> queue)
        {
            if (!IsInside(row, col) || visited[row, col] || board[row, col].IsEmpty)
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

        private void CrackAdjacentLocks(int row, int col)
        {
            CrackLock(row - 1, col);
            CrackLock(row + 1, col);
            CrackLock(row, col - 1);
            CrackLock(row, col + 1);
        }

        private void CrackLock(int row, int col)
        {
            if (!IsInside(row, col) || board[row, col].Special != BallSpecial.Locked)
            {
                return;
            }

            board[row, col].Special = BallSpecial.None;
            crackedLocks++;
            views[row, col]?.Bind(this, row, col, board[row, col]);
        }

        private bool TryCompleteLevel(int points)
        {
            if (!IsGoalComplete())
            {
                return false;
            }

            isLevelComplete = true;
            PlayRewardFeedback();
            SetMessage($"+{points} points. Level {level} complete! Tap Next.");
            return true;
        }

        private bool TryCompleteClassicLevel(int points)
        {
            if (classicLinesCleared < GetClassicLineTarget())
            {
                return false;
            }

            isLevelComplete = true;
            ClearShapeTray();
            PlayRewardFeedback();
            SetMessage($"+{points} points. {GetClassicLevelTitle()} complete! Tap Next.");
            return true;
        }

        private string GetClassicLevelTitle()
        {
            switch (Mathf.Clamp(level, 1, 6))
            {
                case 1:
                    return "Starter Blocks";
                case 2:
                    return "Line Builder";
                case 3:
                    return "Column Trap";
                case 4:
                    return "Corner Gates";
                case 5:
                    return "Center Puzzle";
                default:
                    return "Shape Master";
            }
        }

        private string GetClassicGoalText()
        {
            return $"Clear {Mathf.Min(classicLinesCleared, GetClassicLineTarget())}/{GetClassicLineTarget()} lines";
        }

        private int GetClassicLineTarget()
        {
            return Mathf.Clamp(2 + level, 3, 8);
        }

        private void RefreshShapeTray()
        {
            ClearShapeTray();

            if (!shapeDragEnabled || isLevelComplete || isGameOver)
            {
                return;
            }

            EnsureShapeTrayRoot();
            shapePieces = new ShapePieceView[3];

            for (var slot = 0; slot < shapePieces.Length; slot++)
            {
                if (!TryChooseShape(slot, out var offsets, out var color))
                {
                    continue;
                }

                var pieceObject = new GameObject($"DragShape {slot + 1}");
                pieceObject.transform.SetParent(shapeTrayRoot, false);
                var piece = pieceObject.AddComponent<ShapePieceView>();
                var trayCellSpacing = classicBlockMode ? cellSpacing * 0.78f : cellSpacing;
                piece.Setup(this, slot, offsets, color, GetShapeTrayPosition(slot), trayCellSpacing, classicBlockMode ? GetRuntimeBlockSprite() : GetRuntimeBallSprite());
                shapePieces[slot] = piece;
            }
        }

        private void ClearShapeTray()
        {
            if (shapePieces != null)
            {
                foreach (var piece in shapePieces)
                {
                    if (piece != null)
                    {
                        Destroy(piece.gameObject);
                    }
                }
            }

            shapePieces = null;

            if (shapeTrayRoot == null)
            {
                return;
            }

            for (var i = shapeTrayRoot.childCount - 1; i >= 0; i--)
            {
                Destroy(shapeTrayRoot.GetChild(i).gameObject);
            }
        }

        private bool TryChooseShape(int slot, out Vector2Int[] offsets, out BlockPopXColor color)
        {
            if (classicBlockMode)
            {
                return TryChooseClassicShape(slot, out offsets, out color);
            }

            var unlockedCount = Mathf.Clamp(2 + level + slot, 2, ShapeLibrary.Length);
            for (var attempt = 0; attempt < ShapeLibrary.Length; attempt++)
            {
                var index = PositiveModulo(level * 3 + slot * 5 + attempt, unlockedCount);
                offsets = ShapeLibrary[index];

                if (TryFindShapeColor(offsets, level + slot + attempt, out color))
                {
                    return true;
                }
            }

            offsets = ShapeLibrary[0];
            return TryFindShapeColor(offsets, level + slot, out color);
        }

        private bool TryChooseClassicShape(int slot, out Vector2Int[] offsets, out BlockPopXColor color)
        {
            var unlockedCount = Mathf.Clamp(5 + level * 2 + score / 700 + slot, 5, ShapeLibrary.Length);
            for (var attempt = 0; attempt < ShapeLibrary.Length; attempt++)
            {
                var index = PositiveModulo(score / 40 + level * 7 + slot * 4 + attempt, unlockedCount);
                offsets = ShapeLibrary[index];
                color = BlockPopXColorPalette.All[PositiveModulo(score / 70 + slot * 3 + attempt, BlockPopXColorPalette.All.Length)];

                if (TryShapeFitsAnywhere(offsets))
                {
                    return true;
                }
            }

            for (var index = 0; index < ShapeLibrary.Length; index++)
            {
                offsets = ShapeLibrary[index];
                color = BlockPopXColorPalette.All[PositiveModulo(score / 50 + slot + index, BlockPopXColorPalette.All.Length)];
                if (TryShapeFitsAnywhere(offsets))
                {
                    return true;
                }
            }

            offsets = ShapeLibrary[0];
            color = BlockPopXColor.Red;
            return false;
        }

        private bool TryFindShapeColor(IReadOnlyList<Vector2Int> offsets, int seed, out BlockPopXColor color)
        {
            for (var rowAttempt = 0; rowAttempt < BoardGenerator.Rows; rowAttempt++)
            {
                var row = PositiveModulo(seed + rowAttempt * 3, BoardGenerator.Rows);
                for (var colAttempt = 0; colAttempt < BoardGenerator.Columns; colAttempt++)
                {
                    var col = PositiveModulo(seed * 2 + colAttempt * 5, BoardGenerator.Columns);
                    if (TryReadShapeColor(row, col, offsets, out color))
                    {
                        return true;
                    }
                }
            }

            color = BlockPopXColor.Red;
            return false;
        }

        private bool TryReadShapeColor(int anchorRow, int anchorCol, IReadOnlyList<Vector2Int> offsets, out BlockPopXColor color)
        {
            color = BlockPopXColor.Red;

            if (offsets == null || offsets.Count == 0)
            {
                return false;
            }

            for (var index = 0; index < offsets.Count; index++)
            {
                var row = anchorRow + offsets[index].x;
                var col = anchorCol + offsets[index].y;
                if (!IsInside(row, col) || board[row, col].IsEmpty || board[row, col].Special == BallSpecial.Locked)
                {
                    return false;
                }

                if (index == 0)
                {
                    color = board[row, col].Color;
                }
                else if (board[row, col].Color != color)
                {
                    return false;
                }
            }

            return true;
        }

        private bool TryGetShapeCells(int anchorRow, int anchorCol, IReadOnlyList<Vector2Int> offsets, BlockPopXColor color, out List<Vector2Int> cells)
        {
            cells = new List<Vector2Int>();

            if (offsets == null || offsets.Count == 0)
            {
                return false;
            }

            foreach (var offset in offsets)
            {
                var row = anchorRow + offset.x;
                var col = anchorCol + offset.y;
                if (!IsInside(row, col) || board[row, col].IsEmpty || board[row, col].Special == BallSpecial.Locked || board[row, col].Color != color)
                {
                    cells.Clear();
                    return false;
                }

                cells.Add(new Vector2Int(row, col));
            }

            return cells.Count >= plan.MinimumGroupSize;
        }

        private bool TryGetClassicPlacementCells(int anchorRow, int anchorCol, IReadOnlyList<Vector2Int> offsets, out List<Vector2Int> cells)
        {
            cells = new List<Vector2Int>();
            if (offsets == null || offsets.Count == 0)
            {
                return false;
            }

            foreach (var offset in offsets)
            {
                var row = anchorRow + offset.x;
                var col = anchorCol + offset.y;
                if (!IsInside(row, col) || board[row, col] == null || !board[row, col].IsEmpty)
                {
                    cells.Clear();
                    return false;
                }

                cells.Add(new Vector2Int(row, col));
            }

            return true;
        }

        private bool TryShapeFitsAnywhere(IReadOnlyList<Vector2Int> offsets)
        {
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (TryGetClassicPlacementCells(row, col, offsets, out _))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private bool HasAnyClassicMove()
        {
            if (shapePieces == null)
            {
                return true;
            }

            foreach (var piece in shapePieces)
            {
                if (piece != null && TryShapeFitsAnywhere(piece.Offsets))
                {
                    return true;
                }
            }

            return false;
        }

        private bool AreAllShapeSlotsEmpty()
        {
            if (shapePieces == null || shapePieces.Length == 0)
            {
                return true;
            }

            foreach (var piece in shapePieces)
            {
                if (piece != null)
                {
                    return false;
                }
            }

            return true;
        }

        private int ClearCompletedClassicLines(out int lineCount)
        {
            var clearRows = new bool[BoardGenerator.Rows];
            var clearCols = new bool[BoardGenerator.Columns];
            lineCount = 0;

            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                var full = true;
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (board[row, col] == null || board[row, col].IsEmpty)
                    {
                        full = false;
                        break;
                    }
                }

                if (full)
                {
                    clearRows[row] = true;
                    lineCount++;
                }
            }

            for (var col = 0; col < BoardGenerator.Columns; col++)
            {
                var full = true;
                for (var row = 0; row < BoardGenerator.Rows; row++)
                {
                    if (board[row, col] == null || board[row, col].IsEmpty)
                    {
                        full = false;
                        break;
                    }
                }

                if (full)
                {
                    clearCols[col] = true;
                    lineCount++;
                }
            }

            var cleared = 0;
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (!clearRows[row] && !clearCols[col])
                    {
                        continue;
                    }

                    if (board[row, col] != null && !board[row, col].IsEmpty)
                    {
                        ClearCell(new Vector2Int(row, col));
                        cleared++;
                    }
                }
            }

            return cleared;
        }

        private Vector2Int WorldToBoardCell(Vector3 worldPosition)
        {
            var col = Mathf.RoundToInt(worldPosition.x / cellSpacing + (BoardGenerator.Columns - 1) * 0.5f);
            var row = Mathf.RoundToInt((BoardGenerator.Rows - 1) * 0.5f - worldPosition.y / cellSpacing);
            return new Vector2Int(row, col);
        }

        private Vector3 GetShapeTrayPosition(int slot)
        {
            var y = GetWorldPosition(BoardGenerator.Rows - 1, 0).y - (classicBlockMode ? 0.48f : shapeTrayOffset);
            var x = (slot - 1) * cellSpacing * 3.25f;
            return new Vector3(x, y, 0f);
        }

        private void EnsureShapeTrayRoot()
        {
            if (shapeTrayRoot != null)
            {
                return;
            }

            var trayObject = new GameObject("ShapeTrayRoot");
            trayObject.transform.SetParent(transform, false);
            shapeTrayRoot = trayObject.transform;
        }

        private void ApplyGravityAndRefill()
        {
            var refillSource = BoardGenerator.CreateBoard(level);

            for (var col = 0; col < BoardGenerator.Columns; col++)
            {
                var writeRow = BoardGenerator.Rows - 1;

                for (var row = BoardGenerator.Rows - 1; row >= 0; row--)
                {
                    if (board[row, col].IsEmpty)
                    {
                        continue;
                    }

                    var cellData = board[row, col];
                    var view = views[row, col];

                    if (writeRow != row)
                    {
                        board[writeRow, col] = cellData;
                        board[row, col] = CreateEmptyCell();
                        views[writeRow, col] = view;
                        views[row, col] = null;

                        if (view != null)
                        {
                            view.Bind(this, writeRow, col, cellData);
                            StartCoroutine(DropBallRoutine(view.transform, GetWorldPosition(writeRow, col), 0.16f + (writeRow - row) * 0.02f));
                        }
                    }

                    writeRow--;
                }

                for (var row = writeRow; row >= 0; row--)
                {
                    var refillCell = CreateRefillCell(refillSource, row, col);
                    board[row, col] = refillCell;

                    var view = CreateBallView(row, col);
                    var targetPosition = GetWorldPosition(row, col);
                    view.transform.position = targetPosition + Vector3.up * (cellSpacing * (BoardGenerator.Rows + 1 - row));
                    view.Bind(this, row, col, refillCell);
                    views[row, col] = view;
                    StartCoroutine(DropBallRoutine(view.transform, targetPosition, 0.22f + row * 0.015f));
                }
            }
        }

        private static BallCell CreateEmptyCell()
        {
            return new BallCell(BlockPopXColor.Blue)
            {
                IsEmpty = true
            };
        }

        private static BallCell CreateRefillCell(BallCell[,] source, int row, int col)
        {
            var cell = source[row, col].Clone();
            cell.IsEmpty = false;
            return cell;
        }

        private IEnumerator DropBallRoutine(Transform ballTransform, Vector3 targetPosition, float duration)
        {
            if (ballTransform == null)
            {
                yield break;
            }

            var startPosition = ballTransform.position;
            duration = Mathf.Max(0.08f, duration);

            for (var elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
            {
                if (ballTransform == null)
                {
                    yield break;
                }

                var t = Mathf.Clamp01(elapsed / duration);
                var eased = 1f - Mathf.Pow(1f - t, 3f);
                ballTransform.position = Vector3.Lerp(startPosition, targetPosition, eased);
                yield return null;
            }

            if (ballTransform != null)
            {
                ballTransform.position = targetPosition;
            }
        }

        private void AddFoul(string message)
        {
            if (isGameOver)
            {
                return;
            }

            fouls++;
            PlayFoulFeedback();
            FoulsChanged.Invoke(fouls);
            SetMessage(unlimitedTaps ? $"{message} Foul {fouls}. Keep playing." : $"{message} Foul {fouls}/{maxFouls}");

            if (!unlimitedTaps && maxFouls > 0 && fouls >= maxFouls)
            {
                isGameOver = true;
                GameOver.Invoke();
                SetMessage("Game over. Restart to try again.");
            }
        }

        private void SetMessage(string message)
        {
            currentMessage = $"L{level} Score {score} - {message}";
            MessageChanged.Invoke(currentMessage);
        }

        private void SetPaused(bool paused)
        {
            if (isPaused == paused)
            {
                return;
            }

            isPaused = paused;
            PauseChanged.Invoke(isPaused);
            SetMessage(isPaused ? "Paused. Tap Resume to continue." : GetGoalProgressText());
        }

        private void LoadProgress()
        {
            bestScore = Mathf.Max(0, PlayerPrefs.GetInt(BestScoreKey, 0));
            highestLevel = Mathf.Max(1, PlayerPrefs.GetInt(HighestLevelKey, 1));
            soundEnabled = PlayerPrefs.GetInt(SoundEnabledKey, soundEnabled ? 1 : 0) == 1;
        }

        private void SaveBestScoreIfNeeded()
        {
            if (score <= bestScore)
            {
                return;
            }

            bestScore = score;
            PlayerPrefs.SetInt(BestScoreKey, bestScore);
            PlayerPrefs.Save();
            BestScoreChanged.Invoke(bestScore);
        }

        private bool IsGoalComplete()
        {
            if (plan == null)
            {
                return false;
            }

            switch (plan.GoalKind)
            {
                case LevelGoalKind.ClearBalls:
                    return clearedBalls >= plan.GoalTarget;
                case LevelGoalKind.CrackLocks:
                    return crackedLocks >= plan.GoalTarget;
                case LevelGoalKind.CollectPips:
                    return collectedPips >= plan.GoalTarget;
                case LevelGoalKind.FireRockets:
                    return firedRockets >= plan.GoalTarget;
                case LevelGoalKind.FindPrizes:
                    return foundPrizes >= plan.GoalTarget;
                default:
                    return GetLevelScore() >= plan.ScoreTarget;
            }
        }

        private string GetGoalProgressText()
        {
            if (plan == null)
            {
                return "";
            }

            switch (plan.GoalKind)
            {
                case LevelGoalKind.ClearBalls:
                    return $"Goal {Mathf.Min(clearedBalls, plan.GoalTarget)}/{plan.GoalTarget} balls";
                case LevelGoalKind.CrackLocks:
                    return $"Goal {Mathf.Min(crackedLocks, plan.GoalTarget)}/{plan.GoalTarget} locks";
                case LevelGoalKind.CollectPips:
                    return $"Goal {Mathf.Min(collectedPips, plan.GoalTarget)}/{plan.GoalTarget} pips";
                case LevelGoalKind.FireRockets:
                    return $"Goal {Mathf.Min(firedRockets, plan.GoalTarget)}/{plan.GoalTarget} rockets";
                case LevelGoalKind.FindPrizes:
                    return $"Goal {Mathf.Min(foundPrizes, plan.GoalTarget)}/{plan.GoalTarget} prizes";
                default:
                    return $"Goal {Mathf.Min(GetLevelScore(), plan.ScoreTarget)}/{plan.ScoreTarget} score";
            }
        }

        private int GetLevelScore()
        {
            return Mathf.Max(0, score - levelStartScore);
        }

        private void RenderBoard()
        {
            if (classicBlockMode)
            {
                RenderClassicGrid();
            }

            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (board[row, col].IsEmpty)
                    {
                        continue;
                    }

                    var view = CreateBallView(row, col);
                    view.Bind(this, row, col, board[row, col]);
                    views[row, col] = view;
                }
            }
        }

        private void RenderClassicGrid()
        {
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    var gridObject = new GameObject($"Grid {row},{col}");
                    gridObject.transform.SetParent(boardRoot, false);
                    gridObject.transform.position = GetWorldPosition(row, col);
                    gridObject.transform.localScale = Vector3.one * ballScale;

                    var renderer = gridObject.AddComponent<SpriteRenderer>();
                    renderer.sprite = GetRuntimeBlockSprite();
                    renderer.color = new Color(0.1f, 0.15f, 0.27f, 0.78f);
                    renderer.sortingOrder = 1;
                }
            }
        }

        private static BallCell[,] CreateClassicBoard(int level)
        {
            var nextBoard = new BallCell[BoardGenerator.Rows, BoardGenerator.Columns];
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    nextBoard[row, col] = new BallCell(BlockPopXColor.Blue)
                    {
                        IsEmpty = true
                    };
                }
            }

            SeedClassicPuzzle(nextBoard, level);
            return nextBoard;
        }

        private static void SeedClassicPuzzle(BallCell[,] nextBoard, int level)
        {
            if (level <= 1)
            {
                return;
            }

            var colorIndex = level;
            if (level >= 2)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (col != 3 && col != 7)
                    {
                        SetClassicSeedBlock(nextBoard, 8, col, colorIndex++);
                    }
                }
            }

            if (level >= 3)
            {
                for (var row = 2; row < BoardGenerator.Rows; row++)
                {
                    if (row != 4 && row != 7)
                    {
                        SetClassicSeedBlock(nextBoard, row, 1, colorIndex++);
                    }
                }
            }

            if (level >= 4)
            {
                SetClassicSeedRun(nextBoard, 1, 7, 0, 1, 3, ref colorIndex);
                SetClassicSeedRun(nextBoard, 6, 6, 1, 0, 3, ref colorIndex);
                SetClassicSeedBlock(nextBoard, 2, 2, colorIndex++);
                SetClassicSeedBlock(nextBoard, 7, 7, colorIndex++);
            }

            if (level >= 5)
            {
                SetClassicSeedRun(nextBoard, 4, 3, 0, 1, 4, ref colorIndex);
                SetClassicSeedRun(nextBoard, 3, 4, 1, 0, 4, ref colorIndex);
            }

            if (level >= 6)
            {
                for (var index = 0; index < BoardGenerator.Rows; index += 2)
                {
                    SetClassicSeedBlock(nextBoard, index, PositiveModulo(index + level, BoardGenerator.Columns), colorIndex++);
                }
            }
        }

        private static void SetClassicSeedRun(BallCell[,] board, int row, int col, int rowStep, int colStep, int length, ref int colorIndex)
        {
            for (var index = 0; index < length; index++)
            {
                SetClassicSeedBlock(board, row + rowStep * index, col + colStep * index, colorIndex++);
            }
        }

        private static void SetClassicSeedBlock(BallCell[,] board, int row, int col, int colorIndex)
        {
            if (row < 0 || row >= BoardGenerator.Rows || col < 0 || col >= BoardGenerator.Columns)
            {
                return;
            }

            board[row, col] = new BallCell(BlockPopXColorPalette.All[PositiveModulo(colorIndex, BlockPopXColorPalette.All.Length)])
            {
                IsEmpty = false
            };
        }

        private void FillMissingBoardCells()
        {
            if (board == null)
            {
                board = BoardGenerator.CreateBoard(level);
            }

            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (board[row, col] == null)
                    {
                        board[row, col] = new BallCell(BlockPopXColorPalette.All[(row + col) % BlockPopXColorPalette.All.Length]);
                    }

                    board[row, col].IsEmpty = false;
                }
            }
        }

        private BallView CreateBallView(int row, int col)
        {
            if (ballPrefab != null && !classicBlockMode)
            {
                return Instantiate(ballPrefab, GetWorldPosition(row, col), Quaternion.identity, boardRoot);
            }

            var ballObject = new GameObject($"Ball {row},{col}");
            ballObject.transform.SetParent(boardRoot, false);
            ballObject.transform.position = GetWorldPosition(row, col);
            ballObject.transform.localScale = Vector3.one * ballScale;

            var spriteRenderer = ballObject.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = classicBlockMode ? GetRuntimeBlockSprite() : GetRuntimeBallSprite();
            spriteRenderer.sortingOrder = 10;
            ballObject.AddComponent<CircleCollider2D>();

            return ballObject.AddComponent<BallView>();
        }

        private void FitCameraToBoard()
        {
            var camera = Camera.main;
            if (camera == null)
            {
                return;
            }

            var boardWidth = (BoardGenerator.Columns - 1) * cellSpacing + ballScale + boardPadding;
            var boardHeight = (BoardGenerator.Rows - 1) * cellSpacing + ballScale + boardPadding + (shapeDragEnabled ? 1.4f : 0f);
            var aspect = Mathf.Max(0.1f, camera.aspect);
            var sizeForHeight = boardHeight * 0.5f;
            var sizeForWidth = boardWidth * 0.5f / aspect;

            camera.orthographic = true;
            camera.orthographicSize = Mathf.Max(sizeForHeight, sizeForWidth);
            camera.transform.position = new Vector3(0f, shapeDragEnabled ? -0.35f : 0f, -10f);
        }

        private Sprite GetRuntimeBallSprite()
        {
            if (runtimeBallSprite != null)
            {
                return runtimeBallSprite;
            }

            const int size = 96;
            const float radius = size * 0.46f;
            var center = new Vector2(size * 0.5f, size * 0.5f);
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false);

            for (var y = 0; y < size; y++)
            {
                for (var x = 0; x < size; x++)
                {
                    var distance = Vector2.Distance(new Vector2(x, y), center);
                    var alpha = Mathf.Clamp01(radius - distance + 1f);
                    var highlight = y > size * 0.58f && x < size * 0.48f ? 0.18f : 0f;
                    texture.SetPixel(x, y, new Color(1f, 1f, 1f, alpha * (0.82f + highlight)));
                }
            }

            texture.Apply();
            texture.filterMode = FilterMode.Bilinear;
            runtimeBallSprite = Sprite.Create(
                texture,
                new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f),
                size
            );
            runtimeBallSprite.name = "Runtime BlockPopX Ball";

            return runtimeBallSprite;
        }

        private Sprite GetRuntimeBlockSprite()
        {
            if (runtimeBlockSprite != null)
            {
                return runtimeBlockSprite;
            }

            const int size = 96;
            const int radius = 14;
            var texture = new Texture2D(size, size, TextureFormat.RGBA32, false);

            for (var y = 0; y < size; y++)
            {
                for (var x = 0; x < size; x++)
                {
                    var dx = Mathf.Max(radius - x, x - (size - radius - 1), 0);
                    var dy = Mathf.Max(radius - y, y - (size - radius - 1), 0);
                    var cornerDistance = Mathf.Sqrt(dx * dx + dy * dy);
                    var alpha = Mathf.Clamp01(radius - cornerDistance + 1f);
                    var shine = y > size * 0.58f && x < size * 0.42f ? 0.16f : 0f;
                    texture.SetPixel(x, y, new Color(1f, 1f, 1f, alpha * (0.86f + shine)));
                }
            }

            texture.Apply();
            texture.filterMode = FilterMode.Bilinear;
            runtimeBlockSprite = Sprite.Create(
                texture,
                new Rect(0, 0, size, size),
                new Vector2(0.5f, 0.5f),
                size
            );
            runtimeBlockSprite.name = "Runtime BlockPopX Classic Block";

            return runtimeBlockSprite;
        }

        private Vector3 GetWorldPosition(int row, int col)
        {
            var x = (col - (BoardGenerator.Columns - 1) * 0.5f) * cellSpacing;
            var y = ((BoardGenerator.Rows - 1) * 0.5f - row) * cellSpacing;
            return new Vector3(x, y, 0f);
        }

        private static int PositiveModulo(int value, int modulus)
        {
            return (value % modulus + modulus) % modulus;
        }

        private void ClearBoardViews()
        {
            if (boardRoot == null)
            {
                boardRoot = transform;
            }

            for (var i = boardRoot.childCount - 1; i >= 0; i--)
            {
                Destroy(boardRoot.GetChild(i).gameObject);
            }
        }

        private void PlayPopFeedback(int clearedCount)
        {
            PlayTone(ref popClip, "BlockPopX Pop", 620f + Mathf.Min(clearedCount, 10) * 18f, 0.08f, 0.28f);
            PulseBoard(boardPulseScale, 0.12f);
        }

        private void PlayFoulFeedback()
        {
            PlayTone(ref foulClip, "BlockPopX Foul", 170f, 0.13f, 0.22f);
            PulseBoard(0.965f, 0.13f);
        }

        private void PlayRewardFeedback()
        {
            PlayTone(ref levelClip, "BlockPopX Reward", 860f, 0.2f, 0.3f);
            PulseBoard(1.08f, 0.22f);
        }

        private void PulseBoard(float targetScale, float duration)
        {
            if (boardRoot == null)
            {
                return;
            }

            if (boardFeedbackRoutine != null)
            {
                StopCoroutine(boardFeedbackRoutine);
            }

            boardFeedbackRoutine = StartCoroutine(BoardPulseRoutine(targetScale, duration));
        }

        private IEnumerator BoardPulseRoutine(float targetScale, float duration)
        {
            var originalScale = Vector3.one;
            var punchedScale = Vector3.one * targetScale;
            duration = Mathf.Max(0.05f, duration);

            for (var elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
            {
                var t = elapsed / duration;
                var wave = Mathf.Sin(t * Mathf.PI);
                boardRoot.localScale = Vector3.Lerp(originalScale, punchedScale, wave);
                yield return null;
            }

            boardRoot.localScale = originalScale;
            boardFeedbackRoutine = null;
        }

        private void ResetBoardScale()
        {
            if (boardRoot == null)
            {
                return;
            }

            if (boardFeedbackRoutine != null)
            {
                StopCoroutine(boardFeedbackRoutine);
                boardFeedbackRoutine = null;
            }

            boardRoot.localScale = Vector3.one;
        }

        private void PlayTone(ref AudioClip clip, string clipName, float frequency, float seconds, float volume)
        {
            if (!soundEnabled)
            {
                return;
            }

            EnsureAudioSource();
            if (audioSource == null)
            {
                return;
            }

            clip = CreateTone(clipName, frequency, seconds, volume);
            audioSource.PlayOneShot(clip);
        }

        private void EnsureAudioSource()
        {
            if (!soundEnabled || audioSource != null)
            {
                return;
            }

            audioSource = GetComponent<AudioSource>();
            if (audioSource == null)
            {
                audioSource = gameObject.AddComponent<AudioSource>();
            }

            audioSource.playOnAwake = false;
            audioSource.mute = !soundEnabled;
        }

        private static AudioClip CreateTone(string clipName, float frequency, float seconds, float volume)
        {
            const int sampleRate = 44100;
            var sampleCount = Mathf.Max(1, Mathf.CeilToInt(sampleRate * seconds));
            var samples = new float[sampleCount];

            for (var i = 0; i < sampleCount; i++)
            {
                var time = i / (float)sampleRate;
                var fade = 1f - (i / (float)sampleCount);
                samples[i] = Mathf.Sin(2f * Mathf.PI * frequency * time) * volume * fade;
            }

            var clip = AudioClip.Create(clipName, sampleCount, 1, sampleRate, false);
            clip.SetData(samples, 0);
            return clip;
        }

        private static bool IsInside(int row, int col)
        {
            return row >= 0 && row < BoardGenerator.Rows && col >= 0 && col < BoardGenerator.Columns;
        }
    }
}
