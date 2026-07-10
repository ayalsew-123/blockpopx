using System.Collections;
using UnityEngine;
using UnityEngine.EventSystems;

namespace BlockPopX
{
    [RequireComponent(typeof(SpriteRenderer))]
    [RequireComponent(typeof(CircleCollider2D))]
    public sealed class BallView : MonoBehaviour, IPointerClickHandler
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
        private TextMesh specialLabel;

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

        private void OnMouseUpAsButton()
        {
            Game?.TapCell(Row, Column);
        }

        public void OnPointerClick(PointerEventData eventData)
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
                circleCollider.radius = 0.62f;
            }

            if (lockedBadge != null)
            {
                lockedBadge.SetActive(cell.Special == BallSpecial.Locked);
            }

            if (pipBadge != null)
            {
                pipBadge.SetActive(cell.Special == BallSpecial.Pip);
            }

            SetSpecialLabel(cell);
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

        private void SetSpecialLabel(BallCell cell)
        {
            var label = GetSpecialLabel(cell);
            if (string.IsNullOrEmpty(label))
            {
                if (specialLabel != null)
                {
                    specialLabel.gameObject.SetActive(false);
                }

                return;
            }

            if (specialLabel == null)
            {
                var labelObject = new GameObject("SpecialLabel");
                labelObject.transform.SetParent(transform, false);
                labelObject.transform.localPosition = new Vector3(0f, 0f, -0.01f);
                specialLabel = labelObject.AddComponent<TextMesh>();
                specialLabel.anchor = TextAnchor.MiddleCenter;
                specialLabel.alignment = TextAlignment.Center;
                specialLabel.characterSize = 0.18f;
                specialLabel.fontSize = 48;

                var labelRenderer = specialLabel.GetComponent<MeshRenderer>();
                labelRenderer.sortingOrder = 30;
            }

            specialLabel.gameObject.SetActive(true);
            specialLabel.text = label;
            specialLabel.color = cell.Special == BallSpecial.Locked ? Color.white : new Color(0.02f, 0.03f, 0.08f);
        }

        private static string GetSpecialLabel(BallCell cell)
        {
            switch (cell.Special)
            {
                case BallSpecial.Locked:
                    return "LOCK";
                case BallSpecial.Pip:
                    return cell.Pips > 1 ? cell.Pips.ToString() : ".";
                case BallSpecial.Rocket:
                    return "R";
                case BallSpecial.Prize:
                    return "$";
                default:
                    return "";
            }
        }
    }
}
