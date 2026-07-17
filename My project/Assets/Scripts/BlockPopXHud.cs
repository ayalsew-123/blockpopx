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
        [SerializeField] private TMP_Text progressText;
        [SerializeField] private TMP_Text rewardText;
        [SerializeField] private TMP_Text messageText;
        [SerializeField] private Button pauseButton;
        [SerializeField] private Button soundButton;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button nextButton;
        [SerializeField] private GameObject overlayPanel;
        [SerializeField] private TMP_Text overlayTitleText;
        [SerializeField] private TMP_Text overlayBodyText;
        [SerializeField] private Button overlayPrimaryButton;

        private void OnEnable()
        {
            if (game == null)
            {
                game = FindAnyObjectByType<BlockPopXGame>();
            }

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
            game.RewardChanged.AddListener(OnRewardChanged);
            game.PauseChanged.AddListener(OnPauseChanged);
            game.SoundChanged.AddListener(OnSoundChanged);
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

            if (nextButton != null)
            {
                nextButton.onClick.AddListener(NextLevel);
            }

            if (overlayPrimaryButton != null)
            {
                overlayPrimaryButton.onClick.AddListener(RestartLevel);
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
                game.RewardChanged.RemoveListener(OnRewardChanged);
                game.PauseChanged.RemoveListener(OnPauseChanged);
                game.SoundChanged.RemoveListener(OnSoundChanged);
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

            if (nextButton != null)
            {
                nextButton.onClick.RemoveListener(NextLevel);
            }

            if (overlayPrimaryButton != null)
            {
                overlayPrimaryButton.onClick.RemoveListener(RestartLevel);
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
            OnRewardChanged(game.CurrentReward);
            OnPauseChanged(game.IsPaused);
            OnSoundChanged(game.SoundEnabled);
            UpdateOverlay();
        }

        private void OnLevelChanged(int level)
        {
            if (levelText != null)
            {
                levelText.text = $"Level {level}: {game.CurrentLevelTitle}";
            }

            UpdateGoalText();
            UpdateProgressText();
            OnPauseChanged(game.IsPaused);

            if (game != null)
            {
                OnSoundChanged(game.SoundEnabled);
            }

            HideOverlay();
        }

        private void OnScoreChanged(int score)
        {
            if (scoreText != null)
            {
                scoreText.text = $"Score {score}";
            }

            UpdateGoalText();
            UpdateProgressText();
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
                foulsText.text = game.MaxFouls > 0 ? $"Fouls {fouls}/{game.MaxFouls}" : $"Moves {fouls}";
            }

            UpdateProgressText();
        }

        private void OnMessageChanged(string message)
        {
            if (messageText != null)
            {
                messageText.text = message;
            }

            UpdateGoalText();
            UpdateProgressText();
        }

        private void OnRewardChanged(string reward)
        {
            if (rewardText != null)
            {
                rewardText.text = string.IsNullOrEmpty(reward) ? "Reward: clear lines for bonus points" : reward;
            }
        }

        private void OnPauseChanged(bool isPaused)
        {
            SetButtonLabel(pauseButton, isPaused ? "Play" : "Pause");
        }

        private void OnSoundChanged(bool isSoundEnabled)
        {
            SetButtonLabel(soundButton, isSoundEnabled ? "Sound" : "Muted");
        }

        private void OnGameOver()
        {
            OnPauseChanged(false);
            ShowOverlay(
                "Try Again",
                $"Score {game.CurrentScore}\nLevel {game.CurrentLevel}\nMoves {game.CurrentFouls}",
                "Restart");
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

        private void ShowOverlay(string title, string body, string primaryLabel)
        {
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

        private void UpdateProgressText()
        {
            if (progressText != null && game != null)
            {
                progressText.text = game.CurrentProgressText;
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
