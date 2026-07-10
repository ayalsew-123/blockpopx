namespace BlockPopX
{
    public sealed class LevelPlan
    {
        public string Title;
        public string Hint;
        public int ScoreTarget;
        public int MinimumGroupSize;
        public bool ShuffleUnlocked;
        public bool GravityUnlocked;
        public bool LocksUnlocked;
        public bool PipsUnlocked;

        public static LevelPlan ForLevel(int level)
        {
            if (level <= 1)
            {
                return new LevelPlan
                {
                    Title = "Starter Pop",
                    Hint = "Tap 2 or more same-color balls.",
                    ScoreTarget = 220,
                    MinimumGroupSize = 2
                };
            }

            if (level == 2)
            {
                return new LevelPlan
                {
                    Title = "Mix Practice",
                    Hint = "More colors and tighter paths.",
                    ScoreTarget = 420,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true
                };
            }

            if (level == 3)
            {
                return new LevelPlan
                {
                    Title = "Gravity Lesson",
                    Hint = "Plan the board from both directions.",
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
                    ScoreTarget = 850,
                    MinimumGroupSize = 2,
                    ShuffleUnlocked = true,
                    GravityUnlocked = true,
                    LocksUnlocked = true
                };
            }

            return new LevelPlan
            {
                Title = level == 5 ? "Pip Rush" : "Advanced Rush",
                Hint = "Pips, locks, and complex color paths.",
                ScoreTarget = level == 5 ? 1050 : 1050 + (level - 5) * 420,
                MinimumGroupSize = 2,
                ShuffleUnlocked = true,
                GravityUnlocked = true,
                LocksUnlocked = true,
                PipsUnlocked = true
            };
        }
    }
}

