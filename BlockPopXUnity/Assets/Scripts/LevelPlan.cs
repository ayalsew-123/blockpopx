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
                    Hint = "Clear the whole starter board.",
                    GoalKind = LevelGoalKind.ClearBalls,
                    GoalTarget = 100,
                    ScoreTarget = 0,
                    MinimumGroupSize = 2
                };
            }

            if (level == 2)
            {
                return new LevelPlan
                {
                    Title = "Color Paths",
                    Hint = "Clear every path group.",
                    GoalKind = LevelGoalKind.ClearBalls,
                    GoalTarget = 100,
                    ScoreTarget = 0,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true
                };
            }

            if (level == 3)
            {
                return new LevelPlan
                {
                    Title = "Zigzag Steps",
                    Hint = "Clear every zigzag group.",
                    GoalKind = LevelGoalKind.ClearBalls,
                    GoalTarget = 100,
                    ScoreTarget = 0,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true,
                    GravityUnlocked = true
                };
            }

            if (level == 4)
            {
                return new LevelPlan
                {
                    Title = "Lock Gates",
                    Hint = "Open the gates, then clear the board.",
                    GoalKind = LevelGoalKind.ClearBalls,
                    GoalTarget = 100,
                    ScoreTarget = 0,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true,
                    GravityUnlocked = true,
                    LocksUnlocked = true
                };
            }

            return new LevelPlan
            {
                Title = level == 5 ? "Pip Maze" : level == 6 ? "Rocket Lines" : "Prize Maze",
                Hint = level == 5 ? "Clear the pip maze board." : level == 6 ? "Rockets clear full lines when popped." : "Prize balls give big rewards, but the board is tighter.",
                GoalKind = level == 5 ? LevelGoalKind.ClearBalls : level == 6 ? LevelGoalKind.FireRockets : LevelGoalKind.FindPrizes,
                GoalTarget = level == 5 ? 100 : level == 6 ? 3 : 2 + (level - 7) / 2,
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
