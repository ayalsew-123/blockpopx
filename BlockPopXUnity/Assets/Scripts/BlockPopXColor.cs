using UnityEngine;

namespace BlockPopX
{
    public enum BlockPopXColor
    {
        Red,
        Blue,
        Green,
        Yellow,
        Purple,
        Pink,
        Orange,
        Teal,
        White,
        Indigo
    }

    public static class BlockPopXColorPalette
    {
        public static readonly BlockPopXColor[] All =
        {
            BlockPopXColor.Red,
            BlockPopXColor.Blue,
            BlockPopXColor.Green,
            BlockPopXColor.Yellow,
            BlockPopXColor.Purple,
            BlockPopXColor.Pink,
            BlockPopXColor.Orange,
            BlockPopXColor.Teal,
            BlockPopXColor.White,
            BlockPopXColor.Indigo
        };

        public static Color ToUnityColor(BlockPopXColor color)
        {
            switch (color)
            {
                case BlockPopXColor.Red:
                    return new Color(1f, 0.18f, 0.22f);
                case BlockPopXColor.Blue:
                    return new Color(0.2f, 0.54f, 1f);
                case BlockPopXColor.Green:
                    return new Color(0.1f, 0.78f, 0.47f);
                case BlockPopXColor.Yellow:
                    return new Color(1f, 0.82f, 0.12f);
                case BlockPopXColor.Purple:
                    return new Color(0.68f, 0.3f, 1f);
                case BlockPopXColor.Pink:
                    return new Color(1f, 0.18f, 0.5f);
                case BlockPopXColor.Orange:
                    return new Color(1f, 0.48f, 0.08f);
                case BlockPopXColor.Teal:
                    return new Color(0.05f, 0.82f, 0.78f);
                case BlockPopXColor.White:
                    return new Color(0.92f, 0.96f, 1f);
                case BlockPopXColor.Indigo:
                    return new Color(0.27f, 0.32f, 0.95f);
                default:
                    return Color.white;
            }
        }
    }
}

