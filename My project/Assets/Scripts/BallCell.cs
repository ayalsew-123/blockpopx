namespace BlockPopX
{
    public enum BallSpecial
    {
        None,
        Locked,
        Pip,
        Prize,
        Rocket
    }

    public sealed class BallCell
    {
        public BlockPopXColor Color;
        public BallSpecial Special;
        public int Pips;
        public int ShapeStyle;
        public bool IsEmpty;

        public BallCell(BlockPopXColor color)
        {
            Color = color;
            Special = BallSpecial.None;
            Pips = 0;
            IsEmpty = false;
        }

        public BallCell Clone()
        {
            return new BallCell(Color)
            {
                Special = Special,
                Pips = Pips,
                ShapeStyle = ShapeStyle,
                IsEmpty = IsEmpty
            };
        }
    }
}
