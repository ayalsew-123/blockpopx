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
                    Hint = "Easy pairs teach the first pops.",
                    GoalKind = LevelGoalKind.Score,
                    GoalTarget = 180,
                    ScoreTarget = 180,
                    MinimumGroupSize = 2
                };
            }

            if (level == 2)
            {
                return new LevelPlan
                {
                    Title = "Color Paths",
                    Hint = "Follow short lines and side pairs.",
                    GoalKind = LevelGoalKind.ClearBalls,
                    GoalTarget = 28,
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
                    Hint = "Use diagonal and zigzag groups for bigger points.",
                    GoalKind = LevelGoalKind.Score,
                    GoalTarget = 520,
                    ScoreTarget = 520,
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
                    Hint = "Open the gate by clearing beside locked balls.",
                    GoalKind = LevelGoalKind.CrackLocks,
                    GoalTarget = 5,
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
                Hint = level == 5 ? "Plan around pip clusters and maze gaps." : level == 6 ? "Rockets clear full lines when popped." : "Prize balls give big rewards, but the board is tighter.",
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
