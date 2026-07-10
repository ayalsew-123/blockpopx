using UnityEngine;

namespace BlockPopX
{
    [RequireComponent(typeof(SpriteRenderer))]
    public sealed class BallView : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private GameObject lockedBadge;
        [SerializeField] private GameObject pipBadge;

        public int Row { get; private set; }
        public int Column { get; private set; }
        public BlockPopXGame Game { get; private set; }

        private void Awake()
        {
            if (spriteRenderer == null)
            {
                spriteRenderer = GetComponent<SpriteRenderer>();
            }
        }

        private void OnMouseDown()
        {
            Game?.TapCell(Row, Column);
        }

        public void Bind(BlockPopXGame game, int row, int column, BallCell cell)
        {
            Game = game;
            Row = row;
            Column = column;
            name = $"Ball {row},{column} {cell.Color}";
            spriteRenderer.color = BlockPopXColorPalette.ToUnityColor(cell.Color);

            if (lockedBadge != null)
            {
                lockedBadge.SetActive(cell.Special == BallSpecial.Locked);
            }

            if (pipBadge != null)
            {
                pipBadge.SetActive(cell.Special == BallSpecial.Pip);
            }
        }
    }
}

