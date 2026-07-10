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
        [SerializeField] private TMP_Text foulsText;
        [SerializeField] private TMP_Text messageText;
        [SerializeField] private Button restartButton;
        [SerializeField] private Button nextLevelButton;

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
            game.ScoreChanged.AddListener(OnScoreChanged);
            game.FoulsChanged.AddListener(OnFoulsChanged);
            game.MessageChanged.AddListener(OnMessageChanged);
            game.LevelComplete.AddListener(OnLevelComplete);
            game.GameOver.AddListener(OnGameOver);

            if (restartButton != null)
            {
                restartButton.onClick.AddListener(RestartLevel);
            }

            if (nextLevelButton != null)
            {
                nextLevelButton.onClick.AddListener(NextLevel);
            }

            RefreshAll();
        }

        private void Detach()
        {
            if (game != null)
            {
                game.LevelChanged.RemoveListener(OnLevelChanged);
                game.ScoreChanged.RemoveListener(OnScoreChanged);
                game.FoulsChanged.RemoveListener(OnFoulsChanged);
                game.MessageChanged.RemoveListener(OnMessageChanged);
                game.LevelComplete.RemoveListener(OnLevelComplete);
                game.GameOver.RemoveListener(OnGameOver);
            }

            if (restartButton != null)
            {
                restartButton.onClick.RemoveListener(RestartLevel);
            }

            if (nextLevelButton != null)
            {
                nextLevelButton.onClick.RemoveListener(NextLevel);
            }
        }

        private void RefreshAll()
        {
            if (game == null)
            {
                return;
            }

            OnLevelChanged(game.CurrentLevel);
            OnScoreChanged(game.CurrentScore);
            OnFoulsChanged(game.CurrentFouls);
            OnMessageChanged(game.CurrentMessage);
            SetNextButtonVisible(game.IsLevelComplete);
        }

        private void OnLevelChanged(int level)
        {
            if (levelText != null)
            {
                levelText.text = $"Level {level}  {game.CurrentLevelTitle}";
            }

            SetNextButtonVisible(false);
        }

        private void OnScoreChanged(int score)
        {
            if (scoreText != null)
            {
                scoreText.text = $"Score {score}";
            }
        }

        private void OnFoulsChanged(int fouls)
        {
            if (foulsText != null)
            {
                foulsText.text = $"Fouls {fouls}/{game.MaxFouls}";
            }
        }

        private void OnMessageChanged(string message)
        {
            if (messageText != null)
            {
                messageText.text = message;
            }
        }

        private void OnLevelComplete()
        {
            SetNextButtonVisible(true);
        }

        private void OnGameOver()
        {
            SetNextButtonVisible(false);
        }

        private void RestartLevel()
        {
            game?.RestartLevel();
        }

        private void NextLevel()
        {
            game?.NextLevel();
        }

        private void SetNextButtonVisible(bool isVisible)
        {
            if (nextLevelButton != null)
            {
                nextLevelButton.gameObject.SetActive(isVisible);
            }
        }
    }
}
