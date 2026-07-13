using TMPro;
using UnityEngine;
using UnityEngine.UI;

namespace BlockPopX
{
    public sealed class BlockPopXHud : MonoBehaviour
    {
        [SerializeField] private BlockPopXGame game;
        [SerializeField] private TMP_Text levelText;
        [SerializeField] private TMP_Text scoreText;
        [SerializeField] private TMP_Text bestText;
        [SerializeField] private TMP_Text foulsText;
        [SerializeField] private TMP_Text goalText;
        [SerializeField] private TMP_Text messageText;
        [SerializeField] private Button pauseButton;
        [SerializeField] private Button soundButton;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button nextLevelButton;
        [SerializeField] private GameObject overlayPanel;
        [SerializeField] private TMP_Text overlayTitleText;
        [SerializeField] private TMP_Text overlayBodyText;
        [SerializeField] private Button overlayPrimaryButton;
        [SerializeField] private Button overlaySecondaryButton;

        private bool overlayPrimaryIsNextLevel;

        private void OnEnable()
        {
            Attach(game);
        }

        private void OnDisable()
        {
            Detach();
        }

        public void Attach(BlockPopXGame nextGame)
        {
            if (game == nextGame && nextGame != null)
            {
                RefreshAll();
                return;
            }

            Detach();
            game = nextGame;

            if (game == null)
            {
                return;
            }

            game.LevelChanged.AddListener(OnLevelChanged);
            game.HighestLevelChanged.AddListener(OnHighestLevelChanged);
            game.ScoreChanged.AddListener(OnScoreChanged);
            game.BestScoreChanged.AddListener(OnBestScoreChanged);
            game.FoulsChanged.AddListener(OnFoulsChanged);
            game.MessageChanged.AddListener(OnMessageChanged);
            game.PauseChanged.AddListener(OnPauseChanged);
            game.SoundChanged.AddListener(OnSoundChanged);
            game.LevelComplete.AddListener(OnLevelComplete);
            game.GameOver.AddListener(OnGameOver);

            if (pauseButton != null)
            {
                pauseButton.onClick.AddListener(TogglePause);
            }

            if (soundButton != null)
            {
                soundButton.onClick.AddListener(ToggleSound);
            }

            if (restartButton != null)
            {
                restartButton.onClick.AddListener(RestartLevel);
            }

            if (nextLevelButton != null)
            {
                nextLevelButton.onClick.AddListener(NextLevel);
            }

            if (overlayPrimaryButton != null)
            {
                overlayPrimaryButton.onClick.AddListener(OverlayPrimaryAction);
            }

            if (overlaySecondaryButton != null)
            {
                overlaySecondaryButton.onClick.AddListener(RestartLevel);
            }

            RefreshAll();
        }

        private void Detach()
        {
            if (game != null)
            {
                game.LevelChanged.RemoveListener(OnLevelChanged);
                game.HighestLevelChanged.RemoveListener(OnHighestLevelChanged);
                game.ScoreChanged.RemoveListener(OnScoreChanged);
                game.BestScoreChanged.RemoveListener(OnBestScoreChanged);
                game.FoulsChanged.RemoveListener(OnFoulsChanged);
                game.MessageChanged.RemoveListener(OnMessageChanged);
                game.PauseChanged.RemoveListener(OnPauseChanged);
                game.SoundChanged.RemoveListener(OnSoundChanged);
                game.LevelComplete.RemoveListener(OnLevelComplete);
                game.GameOver.RemoveListener(OnGameOver);
            }

            if (pauseButton != null)
            {
                pauseButton.onClick.RemoveListener(TogglePause);
            }

            if (soundButton != null)
            {
                soundButton.onClick.RemoveListener(ToggleSound);
            }

            if (restartButton != null)
            {
                restartButton.onClick.RemoveListener(RestartLevel);
            }

            if (nextLevelButton != null)
            {
                nextLevelButton.onClick.RemoveListener(NextLevel);
            }

            if (overlayPrimaryButton != null)
            {
                overlayPrimaryButton.onClick.RemoveListener(OverlayPrimaryAction);
            }

            if (overlaySecondaryButton != null)
            {
                overlaySecondaryButton.onClick.RemoveListener(RestartLevel);
            }
        }

        private void RefreshAll()
        {
            if (game == null)
            {
                return;
            }

            OnLevelChanged(game.CurrentLevel);
            OnHighestLevelChanged(game.HighestLevel);
            OnScoreChanged(game.CurrentScore);
            OnBestScoreChanged(game.BestScore);
            OnFoulsChanged(game.CurrentFouls);
            OnMessageChanged(game.CurrentMessage);
            OnPauseChanged(game.IsPaused);
            OnSoundChanged(game.SoundEnabled);
            SetNextButtonVisible(false);
            UpdateOverlay();
        }

        private void OnLevelChanged(int level)
        {
            if (levelText != null)
            {
                levelText.text = $"Level {level}  {game.CurrentLevelTitle}  Best L{game.HighestLevel}";
            }

            UpdateGoalText();
            OnPauseChanged(game.IsPaused);

            if (game != null)
            {
                OnSoundChanged(game.SoundEnabled);
            }

            SetNextButtonVisible(false);
            HideOverlay();
        }

        private void OnScoreChanged(int score)
        {
            if (scoreText != null)
            {
                scoreText.text = $"Score {score}";
            }

            UpdateGoalText();
        }

        private void OnHighestLevelChanged(int highestLevel)
        {
            if (game != null)
            {
                OnLevelChanged(game.CurrentLevel);
            }
        }

        private void OnBestScoreChanged(int bestScore)
        {
            if (bestText != null)
            {
                bestText.text = $"Best {bestScore}";
            }
        }

        private void OnFoulsChanged(int fouls)
        {
            if (foulsText != null)
            {
                foulsText.text = game.MaxFouls > 0 ? $"Fouls {fouls}/{game.MaxFouls}" : $"Fouls {fouls}";
            }
        }

        private void OnMessageChanged(string message)
        {
            if (messageText != null)
            {
                messageText.text = message;
            }

            UpdateGoalText();
        }

        private void OnPauseChanged(bool isPaused)
        {
            SetButtonLabel(pauseButton, isPaused ? "Resume" : "Pause");
        }

        private void OnSoundChanged(bool isSoundEnabled)
        {
            SetButtonLabel(soundButton, isSoundEnabled ? "Sound" : "Muted");
        }

        private void OnLevelComplete()
        {
            SetNextButtonVisible(false);
            HideOverlay();
        }

        private void OnGameOver()
        {
            SetNextButtonVisible(false);
            OnPauseChanged(false);
            ShowOverlay(
                "Try Again",
                $"Score {game.CurrentScore}\nFouls {game.CurrentFouls}",
                "Restart",
                false,
                false);
        }

        private void TogglePause()
        {
            game?.TogglePause();
        }

        private void ToggleSound()
        {
            game?.ToggleSound();
        }

        private void RestartLevel()
        {
            game?.RestartLevel();
        }

        private void NextLevel()
        {
            game?.NextLevel();
        }

        private void OverlayPrimaryAction()
        {
            if (overlayPrimaryIsNextLevel)
            {
                NextLevel();
                return;
            }

            RestartLevel();
        }

        private void SetNextButtonVisible(bool isVisible)
        {
            if (nextLevelButton != null)
            {
                nextLevelButton.gameObject.SetActive(isVisible);
            }
        }

        private void UpdateOverlay()
        {
            if (game == null)
            {
                HideOverlay();
                return;
            }

            if (game.IsGameOver)
            {
                OnGameOver();
                return;
            }

            HideOverlay();
        }

        private void ShowOverlay(string title, string body, string primaryLabel, bool primaryIsNextLevel, bool showSecondary)
        {
            overlayPrimaryIsNextLevel = primaryIsNextLevel;

            if (overlayPanel != null)
            {
                overlayPanel.SetActive(true);
            }

            if (overlayTitleText != null)
            {
                overlayTitleText.text = title;
            }

            if (overlayBodyText != null)
            {
                overlayBodyText.text = body;
            }

            SetButtonLabel(overlayPrimaryButton, primaryLabel);

            if (overlaySecondaryButton != null)
            {
                overlaySecondaryButton.gameObject.SetActive(showSecondary);
                SetButtonLabel(overlaySecondaryButton, "Retry");
            }
        }

        private void HideOverlay()
        {
            if (overlayPanel != null)
            {
                overlayPanel.SetActive(false);
            }
        }

        private void UpdateGoalText()
        {
            if (goalText != null && game != null)
            {
                goalText.text = game.CurrentGoalText;
            }
        }

        private static void SetButtonLabel(Button button, string label)
        {
            if (button == null)
            {
                return;
            }

            var text = button.GetComponentInChildren<TMP_Text>();
            if (text != null)
            {
                text.text = label;
            }
        }
    }
}
