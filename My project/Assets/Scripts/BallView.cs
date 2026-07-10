using System.Collections;
using UnityEngine;

namespace BlockPopX
{
    [RequireComponent(typeof(SpriteRenderer))]
    [RequireComponent(typeof(CircleCollider2D))]
    public sealed class BallView : MonoBehaviour
    {
        [SerializeField] private SpriteRenderer spriteRenderer;
        [SerializeField] private GameObject lockedBadge;
        [SerializeField] private GameObject pipBadge;

        public int Row { get; private set; }
        public int Column { get; private set; }
        public BlockPopXGame Game { get; private set; }

        private CircleCollider2D circleCollider;
        private Coroutine feedbackRoutine;
        private Vector3 baseScale;

        private void Awake()
        {
            if (spriteRenderer == null)
            {
                spriteRenderer = GetComponent<SpriteRenderer>();
            }

            circleCollider = GetComponent<CircleCollider2D>();
            baseScale = transform.localScale;
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
            baseScale = transform.localScale;

            if (circleCollider != null)
            {
                circleCollider.enabled = !cell.IsEmpty;
            }

            if (lockedBadge != null)
            {
                lockedBadge.SetActive(cell.Special == BallSpecial.Locked);
            }

            if (pipBadge != null)
            {
                pipBadge.SetActive(cell.Special == BallSpecial.Pip);
            }
        }

        public void PlayInvalidPulse()
        {
            if (feedbackRoutine != null)
            {
                StopCoroutine(feedbackRoutine);
            }

            feedbackRoutine = StartCoroutine(InvalidPulseRoutine());
        }

        public void PlayPopAndDestroy(float duration = 0.18f)
        {
            if (feedbackRoutine != null)
            {
                StopCoroutine(feedbackRoutine);
            }

            feedbackRoutine = StartCoroutine(PopRoutine(duration));
        }

        private IEnumerator InvalidPulseRoutine()
        {
            var originalScale = baseScale == Vector3.zero ? transform.localScale : baseScale;
            var bigScale = originalScale * 1.18f;
            const float duration = 0.16f;

            for (var elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
            {
                var t = elapsed / duration;
                var wave = Mathf.Sin(t * Mathf.PI);
                transform.localScale = Vector3.Lerp(originalScale, bigScale, wave);
                yield return null;
            }

            transform.localScale = originalScale;
            feedbackRoutine = null;
        }

        private IEnumerator PopRoutine(float duration)
        {
            if (circleCollider != null)
            {
                circleCollider.enabled = false;
            }

            var originalScale = baseScale == Vector3.zero ? transform.localScale : baseScale;
            var startColor = spriteRenderer.color;
            duration = Mathf.Max(0.05f, duration);

            for (var elapsed = 0f; elapsed < duration; elapsed += Time.deltaTime)
            {
                var t = Mathf.Clamp01(elapsed / duration);
                var punch = 1f + (0.35f * Mathf.Sin(t * Mathf.PI));
                transform.localScale = originalScale * Mathf.Lerp(1f, 0.08f, t) * punch;
                spriteRenderer.color = new Color(startColor.r, startColor.g, startColor.b, Mathf.Lerp(startColor.a, 0f, t));
                yield return null;
            }

            Destroy(gameObject);
        }
    }
}
