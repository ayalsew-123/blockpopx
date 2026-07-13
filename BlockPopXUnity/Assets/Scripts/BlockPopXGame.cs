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
        [SerializeField] private int maxFouls = 3;

        [Header("Feedback")]
        [SerializeField] private bool soundEnabled = true;
        [SerializeField] private float boardPulseScale = 1.035f;

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
        public UnityEvent LevelComplete = new UnityEvent();

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
        private bool isGameOver;
        private bool isLevelComplete;
        private bool isPaused;
        private string currentMessage = "";
        private Sprite runtimeBallSprite;
        private AudioSource audioSource;
        private AudioClip popClip;
        private AudioClip foulClip;
        private AudioClip levelClip;
        private Coroutine boardFeedbackRoutine;
        private int lastTapFrame = -1;

        public int CurrentLevel => level;
        public int CurrentScore => score;
        public int BestScore => bestScore;
        public int HighestLevel => highestLevel;
        public int CurrentFouls => fouls;
        public int MaxFouls => maxFouls;
        public string CurrentMessage => currentMessage;
        public string CurrentLevelTitle => plan != null ? plan.Title : "";
        public string CurrentGoalText => GetGoalProgressText();
        public bool IsGameOver => isGameOver;
        public bool IsLevelComplete => isLevelComplete;
        public bool IsPaused => isPaused;
        public bool SoundEnabled => soundEnabled;

        private void Awake()
        {
            ConfigureRuntimeInputModule();
        }

        private void Start()
        {
            LoadProgress();
            EnsureAudioSource();
            FitCameraToBoard();
            StartLevel(level);
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

            foreach (var legacyModule in eventSystem.GetComponents<StandaloneInputModule>())
            {
                Destroy(legacyModule);
            }

            if (eventSystem.GetComponent<InputSystemUIInputModule>() == null)
            {
                eventSystem.gameObject.AddComponent<InputSystemUIInputModule>();
            }
#endif
        }

        private void OnValidate()
        {
            cellSpacing = Mathf.Max(0.32f, cellSpacing);
            ballScale = Mathf.Max(0.24f, ballScale);
            boardPadding = Mathf.Max(0.25f, boardPadding);
        }

        private void Update()
        {
            if (board == null || isGameOver || isLevelComplete || isPaused)
            {
                return;
            }

#if ENABLE_INPUT_SYSTEM
            if (Touchscreen.current != null && Touchscreen.current.primaryTouch.press.wasPressedThisFrame)
            {
                TryTapScreenPosition(Touchscreen.current.primaryTouch.position.ReadValue());
            }

            if (Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame)
            {
                TryTapScreenPosition(Mouse.current.position.ReadValue());
            }
#endif

#if ENABLE_LEGACY_INPUT_MANAGER
            if (Input.GetMouseButtonDown(0))
            {
                TryTapScreenPosition(Input.mousePosition);
            }
#endif
        }

        public void StartLevel(int nextLevel)
        {
            level = Mathf.Max(1, nextLevel);
            plan = LevelPlan.ForLevel(level);
            board = BoardGenerator.CreateBoard(level);
            views = new BallView[BoardGenerator.Rows, BoardGenerator.Columns];
            score = 0;
            fouls = 0;
            clearedBalls = 0;
            crackedLocks = 0;
            collectedPips = 0;
            firedRockets = 0;
            foundPrizes = 0;
            isGameOver = false;
            isLevelComplete = false;
            isPaused = false;

            if (level > highestLevel)
            {
                highestLevel = level;
                PlayerPrefs.SetInt(HighestLevelKey, highestLevel);
                PlayerPrefs.Save();
                HighestLevelChanged.Invoke(highestLevel);
            }

            ClearBoardViews();
            ResetBoardScale();
            RenderBoard();
            LevelChanged.Invoke(level);
            ScoreChanged.Invoke(score);
            BestScoreChanged.Invoke(bestScore);
            FoulsChanged.Invoke(fouls);
            PauseChanged.Invoke(isPaused);
            SetMessage($"Goal: {plan.GoalLabel}. {plan.Hint}");
        }

        public void TapCell(int row, int col)
        {
            if (lastTapFrame == Time.frameCount)
            {
                return;
            }

            lastTapFrame = Time.frameCount;

            if (board == null || isGameOver || isLevelComplete || isPaused)
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

            if (AllTouchableBallsGone() || IsGoalComplete())
            {
                isLevelComplete = true;
                PlayLevelCompleteFeedback();
                LevelComplete.Invoke();
                SetMessage($"Level {level} solved. Next level is ready.");
                return;
            }

            var boardShifted = EnsurePlayableMove();
            if (isLevelComplete)
            {
                return;
            }

            SetMessage(boardShifted ? $"+{points} points. New match opened." : $"+{points} points. {GetGoalProgressText()}");
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

        public void NextLevel()
        {
            StartLevel(level + 1);
        }

        public void RestartLevel()
        {
            StartLevel(level);
        }

        public void TogglePause()
        {
            if (isGameOver || isLevelComplete)
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
            SetSoundEnabled(!soundEnabled);
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

        private bool EnsurePlayableMove()
        {
            if (HasPlayableMove())
            {
                return false;
            }

            if (CountTouchableBalls() < plan.MinimumGroupSize)
            {
                isLevelComplete = true;
                PlayLevelCompleteFeedback();
                LevelComplete.Invoke();
                SetMessage($"Level {level} solved. Next level is ready.");
                return true;
            }

            return OpenNextPlayableMatch();
        }

        private bool HasPlayableMove()
        {
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (board[row, col].IsEmpty || board[row, col].Special == BallSpecial.Locked)
                    {
                        continue;
                    }

                    if (FindConnectedGroup(row, col).Count >= plan.MinimumGroupSize)
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private int CountTouchableBalls()
        {
            var count = 0;
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (!board[row, col].IsEmpty && board[row, col].Special != BallSpecial.Locked)
                    {
                        count++;
                    }
                }
            }

            return count;
        }

        private bool OpenNextPlayableMatch()
        {
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (board[row, col].IsEmpty || board[row, col].Special == BallSpecial.Locked)
                    {
                        continue;
                    }

                    var cluster = CollectNearbyTouchableCells(row, col);
                    var color = board[row, col].Color;

                    if (cluster.Count < plan.MinimumGroupSize)
                    {
                        var emptyCells = CollectNearbyEmptyCells(row, col);
                        while (cluster.Count < plan.MinimumGroupSize && emptyCells.Count > 0)
                        {
                            var newCell = emptyCells[0];
                            emptyCells.RemoveAt(0);
                            CreatePlayableCell(newCell.x, newCell.y, color);
                            cluster.Add(newCell);
                        }
                    }

                    if (cluster.Count < plan.MinimumGroupSize)
                    {
                        continue;
                    }

                    for (var index = 0; index < plan.MinimumGroupSize; index++)
                    {
                        var cell = cluster[index];
                        board[cell.x, cell.y].Color = color;
                        views[cell.x, cell.y]?.Bind(this, cell.x, cell.y, board[cell.x, cell.y]);
                    }

                    PulseBoard(1.045f, 0.16f);
                    return true;
                }
            }

            return false;
        }

        private List<Vector2Int> CollectNearbyTouchableCells(int startRow, int startCol)
        {
            var cells = new List<Vector2Int> { new Vector2Int(startRow, startCol) };

            for (var row = startRow - 1; row <= startRow + 1 && cells.Count < plan.MinimumGroupSize; row++)
            {
                for (var col = startCol - 1; col <= startCol + 1 && cells.Count < plan.MinimumGroupSize; col++)
                {
                    if (!IsInside(row, col) || (row == startRow && col == startCol))
                    {
                        continue;
                    }

                    if (!board[row, col].IsEmpty && board[row, col].Special != BallSpecial.Locked)
                    {
                        cells.Add(new Vector2Int(row, col));
                    }
                }
            }

            return cells;
        }

        private List<Vector2Int> CollectNearbyEmptyCells(int startRow, int startCol)
        {
            var cells = new List<Vector2Int>();

            for (var row = startRow - 1; row <= startRow + 1; row++)
            {
                for (var col = startCol - 1; col <= startCol + 1; col++)
                {
                    if (!IsInside(row, col) || (row == startRow && col == startCol))
                    {
                        continue;
                    }

                    if (board[row, col].IsEmpty)
                    {
                        cells.Add(new Vector2Int(row, col));
                    }
                }
            }

            return cells;
        }

        private void CreatePlayableCell(int row, int col, BlockPopXColor color)
        {
            board[row, col].Color = color;
            board[row, col].Special = BallSpecial.None;
            board[row, col].Pips = 0;
            board[row, col].IsEmpty = false;

            if (views[row, col] == null)
            {
                views[row, col] = CreateBallView(row, col);
            }

            views[row, col].Bind(this, row, col, board[row, col]);
        }

        private bool AllTouchableBallsGone()
        {
            for (var row = 0; row < BoardGenerator.Rows; row++)
            {
                for (var col = 0; col < BoardGenerator.Columns; col++)
                {
                    if (!board[row, col].IsEmpty && board[row, col].Special != BallSpecial.Locked)
                    {
                        return false;
                    }
                }
            }

            return true;
        }

        private void AddFoul(string message)
        {
            if (isGameOver || isLevelComplete)
            {
                return;
            }

            fouls++;
            PlayFoulFeedback();
            FoulsChanged.Invoke(fouls);
            SetMessage($"{message} Foul {fouls}/{maxFouls}");

            if (fouls >= maxFouls)
            {
                isGameOver = true;
                GameOver.Invoke();
                SetMessage("Game over. Restart to try again.");
            }
        }

        private void SetMessage(string message)
        {
            currentMessage = message;
            MessageChanged.Invoke(message);
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
                    return score >= plan.ScoreTarget;
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
                    return $"Goal {Mathf.Min(score, plan.ScoreTarget)}/{plan.ScoreTarget} score";
            }
        }

        private void RenderBoard()
        {
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

        private BallView CreateBallView(int row, int col)
        {
            if (ballPrefab != null)
            {
                return Instantiate(ballPrefab, GetWorldPosition(row, col), Quaternion.identity, boardRoot);
            }

            var ballObject = new GameObject($"Ball {row},{col}");
            ballObject.transform.SetParent(boardRoot, false);
            ballObject.transform.position = GetWorldPosition(row, col);
            ballObject.transform.localScale = Vector3.one * ballScale;

            var spriteRenderer = ballObject.AddComponent<SpriteRenderer>();
            spriteRenderer.sprite = GetRuntimeBallSprite();
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
            var boardHeight = (BoardGenerator.Rows - 1) * cellSpacing + ballScale + boardPadding;
            var aspect = Mathf.Max(0.1f, camera.aspect);
            var sizeForHeight = boardHeight * 0.5f;
            var sizeForWidth = boardWidth * 0.5f / aspect;

            camera.orthographic = true;
            camera.orthographicSize = Mathf.Max(sizeForHeight, sizeForWidth);
            camera.transform.position = new Vector3(0f, 0f, -10f);
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

        private Vector3 GetWorldPosition(int row, int col)
        {
            var x = (col - (BoardGenerator.Columns - 1) * 0.5f) * cellSpacing;
            var y = ((BoardGenerator.Rows - 1) * 0.5f - row) * cellSpacing;
            return new Vector3(x, y, 0f);
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

        private void PlayLevelCompleteFeedback()
        {
            PlayTone(ref levelClip, "BlockPopX Level Clear", 860f, 0.2f, 0.3f);
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
