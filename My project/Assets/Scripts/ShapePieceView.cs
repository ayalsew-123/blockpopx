using System.Collections.Generic;
using UnityEngine;
#if ENABLE_INPUT_SYSTEM
using UnityEngine.InputSystem;
#endif

namespace BlockPopX
{
    [RequireComponent(typeof(BoxCollider2D))]
    public sealed class ShapePieceView : MonoBehaviour
    {
        private readonly List<GameObject> cells = new List<GameObject>();
        private BlockPopXGame game;
        private Vector2Int[] offsets;
        private BlockPopXColor color;
        private int shapeStyle;
        private Vector3 homePosition;
        private Vector3 dragOffset;
        private Vector3 anchorLocalPosition;
        private bool isDragging;

        public int SlotIndex { get; private set; }
        public IReadOnlyList<Vector2Int> Offsets => offsets;
        public BlockPopXColor Color => color;
        public int ShapeStyle => shapeStyle;

        public void Setup(BlockPopXGame owner, int slotIndex, Vector2Int[] shapeOffsets, BlockPopXColor shapeColor, int visualStyle, Vector3 position, float cellSpacing, Sprite sprite)
        {
            game = owner;
            SlotIndex = slotIndex;
            offsets = shapeOffsets;
            color = shapeColor;
            shapeStyle = visualStyle;
            homePosition = position;
            transform.position = homePosition;
            transform.localScale = Vector3.one;
            name = $"Shape {slotIndex + 1} {shapeColor} Style {shapeStyle}";

            ClearCells();

            var unityColor = BlockPopXColorPalette.ToUnityColor(shapeColor);
            var centerOffset = GetCenterOffset(cellSpacing);
            anchorLocalPosition = -centerOffset;

            foreach (var offset in offsets)
            {
                var cellObject = new GameObject($"ShapeCell {offset.x},{offset.y}");
                cellObject.transform.SetParent(transform, false);
                cellObject.transform.localPosition = new Vector3(offset.y * cellSpacing, -offset.x * cellSpacing, 0f) - centerOffset;
                cellObject.transform.localScale = Vector3.one * 0.88f;

                var renderer = cellObject.AddComponent<SpriteRenderer>();
                renderer.sprite = sprite;
                renderer.color = unityColor;
                renderer.sortingOrder = 40;
                cells.Add(cellObject);
            }

            ConfigureCollider(cellSpacing);
        }

        public void ReturnHome()
        {
            isDragging = false;
            transform.position = homePosition;
            transform.localScale = Vector3.one;
        }

        public void BeginDrag(Vector3 pointerWorldPosition)
        {
            if (game == null || !game.CanDragShape)
            {
                return;
            }

            dragOffset = transform.position - pointerWorldPosition;
            transform.localScale = Vector3.one * 1.08f;
            isDragging = true;
        }

        public void DragTo(Vector3 pointerWorldPosition)
        {
            if (!isDragging)
            {
                return;
            }

            transform.position = pointerWorldPosition + dragOffset;
        }

        public void EndDrag()
        {
            if (!isDragging)
            {
                return;
            }

            isDragging = false;
            transform.localScale = Vector3.one;
            game?.TryPlaceShape(this, transform.TransformPoint(anchorLocalPosition));
        }

        private void OnMouseDown()
        {
            BeginDrag(GetPointerWorldPosition());
        }

        private void OnMouseDrag()
        {
            DragTo(GetPointerWorldPosition());
        }

        private void OnMouseUp()
        {
            EndDrag();
        }

        private Vector3 GetPointerWorldPosition()
        {
            var camera = Camera.main;
            if (camera == null)
            {
                return transform.position;
            }

#if ENABLE_INPUT_SYSTEM
            var screenPosition = Mouse.current != null ? Mouse.current.position.ReadValue() : Vector2.zero;
            if (Touchscreen.current != null && Touchscreen.current.primaryTouch.press.isPressed)
            {
                screenPosition = Touchscreen.current.primaryTouch.position.ReadValue();
            }
#else
            var screenPosition = Input.mousePosition;
#endif
            var worldPosition = camera.ScreenToWorldPoint(new Vector3(screenPosition.x, screenPosition.y, -camera.transform.position.z));
            worldPosition.z = 0f;
            return worldPosition;
        }

        private void ConfigureCollider(float cellSpacing)
        {
            var collider = GetComponent<BoxCollider2D>();
            if (offsets == null || offsets.Length == 0)
            {
                collider.size = Vector2.one * cellSpacing;
                collider.offset = Vector2.zero;
                return;
            }

            var minRow = offsets[0].x;
            var maxRow = offsets[0].x;
            var minCol = offsets[0].y;
            var maxCol = offsets[0].y;

            foreach (var offset in offsets)
            {
                minRow = Mathf.Min(minRow, offset.x);
                maxRow = Mathf.Max(maxRow, offset.x);
                minCol = Mathf.Min(minCol, offset.y);
                maxCol = Mathf.Max(maxCol, offset.y);
            }

            var width = (maxCol - minCol + 1) * cellSpacing;
            var height = (maxRow - minRow + 1) * cellSpacing;
            collider.size = new Vector2(width + cellSpacing * 0.3f, height + cellSpacing * 0.3f);
            collider.offset = Vector2.zero;
        }

        private Vector3 GetCenterOffset(float cellSpacing)
        {
            if (offsets == null || offsets.Length == 0)
            {
                return Vector3.zero;
            }

            var minRow = offsets[0].x;
            var maxRow = offsets[0].x;
            var minCol = offsets[0].y;
            var maxCol = offsets[0].y;

            foreach (var offset in offsets)
            {
                minRow = Mathf.Min(minRow, offset.x);
                maxRow = Mathf.Max(maxRow, offset.x);
                minCol = Mathf.Min(minCol, offset.y);
                maxCol = Mathf.Max(maxCol, offset.y);
            }

            return new Vector3((minCol + maxCol) * cellSpacing * 0.5f, -(minRow + maxRow) * cellSpacing * 0.5f, 0f);
        }

        private void ClearCells()
        {
            foreach (var cell in cells)
            {
                if (cell != null)
                {
                    Destroy(cell);
                }
            }

            cells.Clear();
        }
    }
}
