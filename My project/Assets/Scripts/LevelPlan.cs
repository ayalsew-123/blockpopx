namespace BlockPopX
{
    public enum LevelGoalKind
    {
        Score,
        ClearBalls,
        CrackLocks,
        CollectPips,
        FireRockets,
        FindPrizes
    }

    public sealed class LevelPlan
    {
        public string Title;
        public string Hint;
        public LevelGoalKind GoalKind;
        public int GoalTarget;
        public int ScoreTarget;
        public int MinimumGroupSize;
        public bool ShuffleUnlocked;
        public bool GravityUnlocked;
        public bool LocksUnlocked;
        public bool PipsUnlocked;
        public bool RocketsUnlocked;
        public bool PrizesUnlocked;

        public string GoalLabel
        {
            get
            {
                switch (GoalKind)
                {
                    case LevelGoalKind.ClearBalls:
                        return $"Clear {GoalTarget} balls";
                    case LevelGoalKind.CrackLocks:
                        return $"Crack {GoalTarget} locks";
                    case LevelGoalKind.CollectPips:
                        return $"Collect {GoalTarget} pips";
                    case LevelGoalKind.FireRockets:
                        return $"Fire {GoalTarget} rockets";
                    case LevelGoalKind.FindPrizes:
                        return $"Find {GoalTarget} prizes";
                    default:
                        return $"Score {ScoreTarget}";
                }
            }
        }

        public static LevelPlan ForLevel(int level)
        {
            if (level <= 1)
            {
                return new LevelPlan
                {
                    Title = "Starter Pop",
                    Hint = "Tap 2 or more same-color balls.",
                    GoalKind = LevelGoalKind.Score,
                    GoalTarget = 220,
                    ScoreTarget = 220,
                    MinimumGroupSize = 2
                };
            }

            if (level == 2)
            {
                return new LevelPlan
                {
                    Title = "Mix Practice",
                    Hint = "Clear enough balls before fouls run out.",
                    GoalKind = LevelGoalKind.ClearBalls,
                    GoalTarget = 24,
                    ScoreTarget = 0,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true
                };
            }

            if (level == 3)
            {
                return new LevelPlan
                {
                    Title = "Gravity Lesson",
                    Hint = "Bigger groups make the target much faster.",
                    GoalKind = LevelGoalKind.Score,
                    GoalTarget = 650,
                    ScoreTarget = 650,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true,
                    GravityUnlocked = true
                };
            }

            if (level == 4)
            {
                return new LevelPlan
                {
                    Title = "Lock Breaker",
                    Hint = "Locked balls must be cracked with nearby clears.",
                    GoalKind = LevelGoalKind.CrackLocks,
                    GoalTarget = 6,
                    ScoreTarget = 0,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true,
                    GravityUnlocked = true,
                    LocksUnlocked = true
                };
            }

            return new LevelPlan
            {
                Title = level == 5 ? "Pip Rush" : level == 6 ? "Rocket Lines" : "Prize Maze",
                Hint = level == 5 ? "Pop pip balls to collect dots." : level == 6 ? "Rockets clear full lines when popped." : "Prize balls give big rewards, but the board is tighter.",
                GoalKind = level == 5 ? LevelGoalKind.CollectPips : level == 6 ? LevelGoalKind.FireRockets : LevelGoalKind.FindPrizes,
                GoalTarget = level == 5 ? 12 : level == 6 ? 3 : 2 + (level - 7) / 2,
                ScoreTarget = 0,
                MinimumGroupSize = level >= 8 ? 3 : 2,
                ShuffleUnlocked = true,
                GravityUnlocked = true,
                LocksUnlocked = true,
                PipsUnlocked = true,
                RocketsUnlocked = level >= 6,
                PrizesUnlocked = level >= 7
            };
        }
    }
}
