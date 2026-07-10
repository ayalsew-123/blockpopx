using BlockPopX;
using TMPro;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.UI;

public static class BlockPopXSceneBuilder
{
    [MenuItem("Tools/BlockPopX/Setup Play Scene")]
    public static void SetupPlayScene()
    {
        var gameObject = GameObject.Find("BlockPopXGame");
        if (gameObject == null)
        {
            gameObject = new GameObject("BlockPopXGame");
        }

        var game = gameObject.GetComponent<BlockPopXGame>();
        if (game == null)
        {
            game = gameObject.AddComponent<BlockPopXGame>();
        }

        var boardRoot = GameObject.Find("BoardRoot");
        if (boardRoot == null)
        {
            boardRoot = new GameObject("BoardRoot");
        }

        boardRoot.transform.SetParent(gameObject.transform, false);
        boardRoot.transform.localPosition = Vector3.zero;

        var serializedGame = new SerializedObject(game);
        serializedGame.FindProperty("boardRoot").objectReferenceValue = boardRoot.transform;
        serializedGame.FindProperty("cellSpacing").floatValue = 0.48f;
        serializedGame.FindProperty("ballScale").floatValue = 0.38f;
        serializedGame.FindProperty("boardPadding").floatValue = 0.9f;
        serializedGame.ApplyModifiedPropertiesWithoutUndo();

        var camera = Camera.main;
        if (camera == null)
        {
            var cameraObject = new GameObject("Main Camera");
            cameraObject.tag = "MainCamera";
            camera = cameraObject.AddComponent<Camera>();
        }

        camera.transform.position = new Vector3(0f, 0f, -10f);
        camera.orthographic = true;
        camera.orthographicSize = 5.2f;
        camera.clearFlags = CameraClearFlags.SolidColor;
        camera.backgroundColor = new Color(0.04f, 0.06f, 0.12f);

        SetupHud(game);

        Selection.activeGameObject = gameObject;
        EditorUtility.SetDirty(gameObject);
        EditorUtility.SetDirty(boardRoot);
        EditorUtility.SetDirty(camera);
        EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());

        Debug.Log("BlockPopX play scene is ready. Press Play to test the board.");
    }

    private static void SetupHud(BlockPopXGame game)
    {
        var existingCanvas = GameObject.Find("BlockPopXHudCanvas");
        if (existingCanvas != null)
        {
            Object.DestroyImmediate(existingCanvas);
        }

        var canvasObject = new GameObject("BlockPopXHudCanvas");
        var canvas = canvasObject.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 100;

        var scaler = canvasObject.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1080f, 1920f);
        scaler.matchWidthOrHeight = 0.5f;

        canvasObject.AddComponent<GraphicRaycaster>();

        if (Object.FindObjectOfType<EventSystem>() == null)
        {
            var eventSystemObject = new GameObject("EventSystem");
            eventSystemObject.AddComponent<EventSystem>();
            eventSystemObject.AddComponent<StandaloneInputModule>();
        }

        var hudObject = CreateUiObject("BlockPopXHud", canvasObject.transform);
        Stretch(hudObject.GetComponent<RectTransform>());
        var hud = hudObject.AddComponent<BlockPopXHud>();

        var topPanel = CreatePanel("TopPanel", hudObject.transform, new Color(0.02f, 0.03f, 0.08f, 0.72f));
        var topRect = topPanel.GetComponent<RectTransform>();
        topRect.anchorMin = new Vector2(0f, 1f);
        topRect.anchorMax = new Vector2(1f, 1f);
        topRect.pivot = new Vector2(0.5f, 1f);
        topRect.sizeDelta = new Vector2(0f, 220f);
        topRect.anchoredPosition = Vector2.zero;

        var levelText = CreateText("LevelText", topPanel.transform, "Level 1", 42f, TextAlignmentOptions.Left);
        SetRect(levelText.rectTransform, new Vector2(0f, 1f), new Vector2(0.36f, 1f), new Vector2(24f, -24f), new Vector2(-8f, -86f));

        var scoreText = CreateText("ScoreText", topPanel.transform, "Score 0", 46f, TextAlignmentOptions.Center);
        SetRect(scoreText.rectTransform, new Vector2(0.32f, 1f), new Vector2(0.68f, 1f), new Vector2(8f, -24f), new Vector2(-8f, -86f));

        var foulsText = CreateText("FoulsText", topPanel.transform, "Fouls 0/3", 42f, TextAlignmentOptions.Right);
        SetRect(foulsText.rectTransform, new Vector2(0.64f, 1f), new Vector2(1f, 1f), new Vector2(8f, -24f), new Vector2(-24f, -86f));

        var messageText = CreateText("MessageText", topPanel.transform, "Tap matching balls.", 30f, TextAlignmentOptions.Center);
        SetRect(messageText.rectTransform, new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(24f, 22f), new Vector2(-24f, 92f));
        messageText.color = new Color(0.75f, 0.92f, 1f);

        var bottomPanel = CreatePanel("BottomPanel", hudObject.transform, new Color(0.02f, 0.03f, 0.08f, 0.58f));
        var bottomRect = bottomPanel.GetComponent<RectTransform>();
        bottomRect.anchorMin = new Vector2(0f, 0f);
        bottomRect.anchorMax = new Vector2(1f, 0f);
        bottomRect.pivot = new Vector2(0.5f, 0f);
        bottomRect.sizeDelta = new Vector2(0f, 180f);
        bottomRect.anchoredPosition = Vector2.zero;

        var restartButton = CreateButton("RestartButton", bottomPanel.transform, "Restart", new Color(0.1f, 0.85f, 1f));
        SetRect(restartButton.GetComponent<RectTransform>(), new Vector2(0f, 0.5f), new Vector2(0.48f, 0.5f), new Vector2(24f, -50f), new Vector2(-8f, 50f));

        var nextLevelButton = CreateButton("NextLevelButton", bottomPanel.transform, "Next Level", new Color(1f, 0.28f, 0.86f));
        SetRect(nextLevelButton.GetComponent<RectTransform>(), new Vector2(0.52f, 0.5f), new Vector2(1f, 0.5f), new Vector2(8f, -50f), new Vector2(-24f, 50f));

        var serializedHud = new SerializedObject(hud);
        serializedHud.FindProperty("game").objectReferenceValue = game;
        serializedHud.FindProperty("levelText").objectReferenceValue = levelText;
        serializedHud.FindProperty("scoreText").objectReferenceValue = scoreText;
        serializedHud.FindProperty("foulsText").objectReferenceValue = foulsText;
        serializedHud.FindProperty("messageText").objectReferenceValue = messageText;
        serializedHud.FindProperty("restartButton").objectReferenceValue = restartButton;
        serializedHud.FindProperty("nextLevelButton").objectReferenceValue = nextLevelButton;
        serializedHud.ApplyModifiedPropertiesWithoutUndo();

        EditorUtility.SetDirty(canvasObject);
        EditorUtility.SetDirty(hudObject);
    }

    private static GameObject CreateUiObject(string name, Transform parent)
    {
        var gameObject = new GameObject(name, typeof(RectTransform));
        gameObject.transform.SetParent(parent, false);
        return gameObject;
    }

    private static GameObject CreatePanel(string name, Transform parent, Color color)
    {
        var panel = CreateUiObject(name, parent);
        var image = panel.AddComponent<Image>();
        image.color = color;
        return panel;
    }

    private static TMP_Text CreateText(string name, Transform parent, string text, float size, TextAlignmentOptions alignment)
    {
        var textObject = CreateUiObject(name, parent);
        var label = textObject.AddComponent<TextMeshProUGUI>();
        label.text = text;
        label.fontSize = size;
        label.fontStyle = FontStyles.Bold;
        label.alignment = alignment;
        label.color = Color.white;
        label.enableWordWrapping = false;
        label.overflowMode = TextOverflowModes.Ellipsis;
        return label;
    }

    private static Button CreateButton(string name, Transform parent, string label, Color color)
    {
        var buttonObject = CreatePanel(name, parent, color);
        var button = buttonObject.AddComponent<Button>();
        button.targetGraphic = buttonObject.GetComponent<Image>();

        var text = CreateText("Label", buttonObject.transform, label, 36f, TextAlignmentOptions.Center);
        Stretch(text.rectTransform);
        text.color = new Color(0.02f, 0.03f, 0.08f);

        return button;
    }

    private static void Stretch(RectTransform rect)
    {
        rect.anchorMin = Vector2.zero;
        rect.anchorMax = Vector2.one;
        rect.offsetMin = Vector2.zero;
        rect.offsetMax = Vector2.zero;
    }

    private static void SetRect(RectTransform rect, Vector2 anchorMin, Vector2 anchorMax, Vector2 offsetMin, Vector2 offsetMax)
    {
        rect.anchorMin = anchorMin;
        rect.anchorMax = anchorMax;
        rect.offsetMin = offsetMin;
        rect.offsetMax = offsetMax;
    }
}
