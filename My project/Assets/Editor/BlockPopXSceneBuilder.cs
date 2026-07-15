using System;
using BlockPopX;
using TMPro;
using UnityEditor;
using UnityEditor.Build;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.EventSystems;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

[InitializeOnLoad]
public static class BlockPopXSceneBuilder
{
    private static bool isSettingUpScene;

    static BlockPopXSceneBuilder()
    {
        EditorApplication.playModeStateChanged -= OnPlayModeStateChanged;
        EditorApplication.playModeStateChanged += OnPlayModeStateChanged;
        EditorApplication.delayCall += AutoRepairOpenScene;
    }

    [MenuItem("Tools/BlockPopX/Setup Play Scene")]
    public static void SetupPlayScene()
    {
        if (isSettingUpScene)
        {
            return;
        }

        isSettingUpScene = true;
        try
        {
            CleanMissingScriptsInScene();
            ApplyMobileSettings();

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
            serializedGame.FindProperty("level").intValue = 1;
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
            if (camera.GetComponent<Physics2DRaycaster>() == null)
            {
                camera.gameObject.AddComponent<Physics2DRaycaster>();
            }

            SetupHud(game);

            Selection.activeGameObject = gameObject;
            EditorUtility.SetDirty(gameObject);
            EditorUtility.SetDirty(boardRoot);
            EditorUtility.SetDirty(camera);
            MarkSceneDirtyWhenEditable(EditorSceneManager.GetActiveScene());

            Debug.Log("BlockPopX play scene is ready. Press Play to test the board.");
        }
        finally
        {
            isSettingUpScene = false;
        }
    }

    [MenuItem("Tools/BlockPopX/Apply Mobile Settings")]
    public static void ApplyMobileSettings()
    {
        PlayerSettings.companyName = "BlockPopX";
        PlayerSettings.productName = "BlockPopX";
        PlayerSettings.bundleVersion = "0.1.0";
        PlayerSettings.defaultScreenWidth = 1080;
        PlayerSettings.defaultScreenHeight = 1920;
        PlayerSettings.defaultInterfaceOrientation = UIOrientation.Portrait;
        PlayerSettings.allowedAutorotateToPortrait = true;
        PlayerSettings.allowedAutorotateToPortraitUpsideDown = false;
        PlayerSettings.allowedAutorotateToLandscapeLeft = false;
        PlayerSettings.allowedAutorotateToLandscapeRight = false;
        PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Standalone, "com.blockpopx.game");
        PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.Android, "com.blockpopx.game");
        PlayerSettings.SetApplicationIdentifier(NamedBuildTarget.iOS, "com.blockpopx.game");
        PlayerSettings.Android.bundleVersionCode = 1;
        PlayerSettings.iOS.buildNumber = "1";
        AssetDatabase.SaveAssets();
    }

    [MenuItem("Tools/BlockPopX/Clean Missing Scripts")]
    public static void CleanMissingScriptsInScene()
    {
        var scene = SceneManager.GetActiveScene();
        var removedCount = 0;

        foreach (var rootObject in scene.GetRootGameObjects())
        {
            removedCount += CleanMissingScriptsRecursive(rootObject);
        }

        if (removedCount > 0)
        {
            MarkSceneDirtyWhenEditable(scene);
            Debug.Log($"BlockPopX removed {removedCount} missing script component(s).");
        }
        else
        {
            Debug.Log("BlockPopX found no missing script components in the open scene.");
        }
    }

    private static int CleanMissingScriptsRecursive(GameObject gameObject)
    {
        var missingCount = GameObjectUtility.GetMonoBehavioursWithMissingScriptCount(gameObject);
        if (missingCount > 0)
        {
            GameObjectUtility.RemoveMonoBehavioursWithMissingScript(gameObject);
        }

        for (var i = 0; i < gameObject.transform.childCount; i++)
        {
            missingCount += CleanMissingScriptsRecursive(gameObject.transform.GetChild(i).gameObject);
        }

        return missingCount;
    }

    private static void SetupHud(BlockPopXGame game)
    {
        var existingCanvas = GameObject.Find("BlockPopXHudCanvas");
        if (existingCanvas != null)
        {
            UnityEngine.Object.DestroyImmediate(existingCanvas);
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

        var eventSystem = UnityEngine.Object.FindAnyObjectByType<EventSystem>();
        if (eventSystem == null)
        {
            var eventSystemObject = new GameObject("EventSystem");
            eventSystem = eventSystemObject.AddComponent<EventSystem>();
        }

        ConfigureInputModule(eventSystem.gameObject);

        var hudObject = CreateUiObject("BlockPopXHud", canvasObject.transform);
        Stretch(hudObject.GetComponent<RectTransform>());
        var hud = hudObject.AddComponent<BlockPopXHud>();

        var topPanel = CreatePanel("TopPanel", hudObject.transform, new Color(0.02f, 0.03f, 0.08f, 0.72f));
        var topRect = topPanel.GetComponent<RectTransform>();
        topRect.anchorMin = new Vector2(0f, 1f);
        topRect.anchorMax = new Vector2(1f, 1f);
        topRect.pivot = new Vector2(0.5f, 1f);
        topRect.sizeDelta = new Vector2(0f, 300f);
        topRect.anchoredPosition = Vector2.zero;

        var levelText = CreateText("LevelText", topPanel.transform, "Level 1: Starter Pop", 50f, TextAlignmentOptions.Center);
        SetRect(levelText.rectTransform, new Vector2(0f, 1f), new Vector2(1f, 1f), new Vector2(24f, -80f), new Vector2(-24f, -16f));
        levelText.color = new Color(0.18f, 0.93f, 1f);

        var bestText = CreateText("BestText", topPanel.transform, "Best 0", 38f, TextAlignmentOptions.Right);
        SetRect(bestText.rectTransform, new Vector2(0.62f, 1f), new Vector2(1f, 1f), new Vector2(8f, -142f), new Vector2(-24f, -84f));

        var scoreText = CreateText("ScoreText", topPanel.transform, "Score 0", 46f, TextAlignmentOptions.Center);
        SetRect(scoreText.rectTransform, new Vector2(0f, 1f), new Vector2(0.38f, 1f), new Vector2(24f, -142f), new Vector2(-8f, -84f));

        var foulsText = CreateText("FoulsText", topPanel.transform, "Fouls 0/3", 42f, TextAlignmentOptions.Right);
        SetRect(foulsText.rectTransform, new Vector2(0.38f, 1f), new Vector2(0.62f, 1f), new Vector2(8f, -142f), new Vector2(-8f, -84f));

        var goalText = CreateText("GoalText", topPanel.transform, "Goal 0/0", 32f, TextAlignmentOptions.Center);
        SetRect(goalText.rectTransform, new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(24f, 90f), new Vector2(-24f, 150f));
        goalText.color = new Color(1f, 0.9f, 0.38f);

        var messageText = CreateText("MessageText", topPanel.transform, "Tap matching balls.", 30f, TextAlignmentOptions.Center);
        SetRect(messageText.rectTransform, new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(24f, 20f), new Vector2(-24f, 82f));
        messageText.color = new Color(0.75f, 0.92f, 1f);

        var bottomPanel = CreatePanel("BottomPanel", hudObject.transform, new Color(0.02f, 0.03f, 0.08f, 0.58f));
        var bottomRect = bottomPanel.GetComponent<RectTransform>();
        bottomRect.anchorMin = new Vector2(0f, 0f);
        bottomRect.anchorMax = new Vector2(1f, 0f);
        bottomRect.pivot = new Vector2(0.5f, 0f);
        bottomRect.sizeDelta = new Vector2(0f, 200f);
        bottomRect.anchoredPosition = Vector2.zero;

        var pauseButton = CreateButton("PauseButton", bottomPanel.transform, "Pause", new Color(0.1f, 0.85f, 1f));
        SetRect(pauseButton.GetComponent<RectTransform>(), new Vector2(0f, 0.5f), new Vector2(0.25f, 0.5f), new Vector2(24f, -52f), new Vector2(-8f, 52f));

        var restartButton = CreateButton("RestartButton", bottomPanel.transform, "Restart", new Color(0.1f, 0.85f, 1f));
        SetRect(restartButton.GetComponent<RectTransform>(), new Vector2(0.25f, 0.5f), new Vector2(0.5f, 0.5f), new Vector2(8f, -52f), new Vector2(-8f, 52f));

        var soundButton = CreateButton("SoundButton", bottomPanel.transform, "Sound", new Color(1f, 0.82f, 0.12f));
        SetRect(soundButton.GetComponent<RectTransform>(), new Vector2(0.5f, 0.5f), new Vector2(0.75f, 0.5f), new Vector2(8f, -52f), new Vector2(-8f, 52f));

        var nextButton = CreateButton("NextButton", bottomPanel.transform, "Next", new Color(0.93f, 0.25f, 0.83f));
        SetRect(nextButton.GetComponent<RectTransform>(), new Vector2(0.75f, 0.5f), new Vector2(1f, 0.5f), new Vector2(8f, -52f), new Vector2(-24f, 52f));

        var overlayPanel = CreatePanel("ResultOverlay", hudObject.transform, new Color(0f, 0f, 0f, 0.68f));
        Stretch(overlayPanel.GetComponent<RectTransform>());

        var overlayCard = CreatePanel("ResultCard", overlayPanel.transform, new Color(0.03f, 0.05f, 0.12f, 0.96f));
        SetRect(overlayCard.GetComponent<RectTransform>(), new Vector2(0.08f, 0.36f), new Vector2(0.92f, 0.66f), new Vector2(0f, 0f), new Vector2(0f, 0f));

        var overlayTitleText = CreateText("OverlayTitle", overlayCard.transform, "Try Again", 64f, TextAlignmentOptions.Center);
        SetRect(overlayTitleText.rectTransform, new Vector2(0f, 0.58f), new Vector2(1f, 1f), new Vector2(32f, 0f), new Vector2(-32f, -28f));
        overlayTitleText.color = new Color(0.18f, 0.93f, 1f);

        var overlayBodyText = CreateText("OverlayBody", overlayCard.transform, "Score 0", 38f, TextAlignmentOptions.Center);
        SetRect(overlayBodyText.rectTransform, new Vector2(0f, 0.34f), new Vector2(1f, 0.62f), new Vector2(32f, 0f), new Vector2(-32f, 0f));
        overlayBodyText.color = new Color(0.86f, 0.93f, 1f);
        overlayBodyText.textWrappingMode = TextWrappingModes.Normal;

        var overlayPrimaryButton = CreateButton("OverlayPrimaryButton", overlayCard.transform, "Restart", new Color(0.1f, 0.85f, 1f));
        SetRect(overlayPrimaryButton.GetComponent<RectTransform>(), new Vector2(0.34f, 0.08f), new Vector2(0.66f, 0.28f), Vector2.zero, Vector2.zero);

        var serializedHud = new SerializedObject(hud);
        serializedHud.FindProperty("game").objectReferenceValue = game;
        serializedHud.FindProperty("levelText").objectReferenceValue = levelText;
        serializedHud.FindProperty("scoreText").objectReferenceValue = scoreText;
        serializedHud.FindProperty("bestText").objectReferenceValue = bestText;
        serializedHud.FindProperty("foulsText").objectReferenceValue = foulsText;
        serializedHud.FindProperty("goalText").objectReferenceValue = goalText;
        serializedHud.FindProperty("messageText").objectReferenceValue = messageText;
        serializedHud.FindProperty("pauseButton").objectReferenceValue = pauseButton;
        serializedHud.FindProperty("soundButton").objectReferenceValue = soundButton;
        serializedHud.FindProperty("restartButton").objectReferenceValue = restartButton;
        serializedHud.FindProperty("nextButton").objectReferenceValue = nextButton;
        serializedHud.FindProperty("overlayPanel").objectReferenceValue = overlayPanel;
        serializedHud.FindProperty("overlayTitleText").objectReferenceValue = overlayTitleText;
        serializedHud.FindProperty("overlayBodyText").objectReferenceValue = overlayBodyText;
        serializedHud.FindProperty("overlayPrimaryButton").objectReferenceValue = overlayPrimaryButton;
        serializedHud.ApplyModifiedPropertiesWithoutUndo();

        overlayPanel.SetActive(false);
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
        label.textWrappingMode = TextWrappingModes.NoWrap;
        label.overflowMode = TextOverflowModes.Ellipsis;
        return label;
    }

    private static Button CreateButton(string name, Transform parent, string label, Color color)
    {
        var buttonObject = CreatePanel(name, parent, color);
        var button = buttonObject.AddComponent<Button>();
        button.targetGraphic = buttonObject.GetComponent<Image>();

        var text = CreateText("Label", buttonObject.transform, label, 30f, TextAlignmentOptions.Center);
        Stretch(text.rectTransform);
        text.color = new Color(0.02f, 0.03f, 0.08f);

        return button;
    }

    private static void ConfigureInputModule(GameObject eventSystemObject)
    {
#if ENABLE_INPUT_SYSTEM && !ENABLE_LEGACY_INPUT_MANAGER
        foreach (var standaloneInput in eventSystemObject.GetComponents<StandaloneInputModule>())
        {
            UnityEngine.Object.DestroyImmediate(standaloneInput);
        }

        var inputSystemModuleType = FindType("UnityEngine.InputSystem.UI.InputSystemUIInputModule");
        if (inputSystemModuleType != null)
        {
            if (eventSystemObject.GetComponent(inputSystemModuleType) == null)
            {
                eventSystemObject.AddComponent(inputSystemModuleType);
            }

            return;
        }
#endif

        if (eventSystemObject.GetComponent<StandaloneInputModule>() == null)
        {
            eventSystemObject.AddComponent<StandaloneInputModule>();
        }
    }

    private static Type FindType(string fullName)
    {
        foreach (var assembly in AppDomain.CurrentDomain.GetAssemblies())
        {
            var type = assembly.GetType(fullName);
            if (type != null)
            {
                return type;
            }
        }

        return null;
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

    private static void MarkSceneDirtyWhenEditable(Scene scene)
    {
        if (EditorApplication.isPlayingOrWillChangePlaymode)
        {
            return;
        }

        EditorSceneManager.MarkSceneDirty(scene);
    }

    private static void OnPlayModeStateChanged(PlayModeStateChange state)
    {
        if (state == PlayModeStateChange.ExitingEditMode)
        {
            SetupPlayScene();
        }
    }

    private static void AutoRepairOpenScene()
    {
        if (EditorApplication.isPlayingOrWillChangePlaymode)
        {
            return;
        }

        var scene = EditorSceneManager.GetActiveScene();
        if (!scene.IsValid() || !scene.isLoaded)
        {
            return;
        }

        CleanMissingScriptsInScene();

        if (GameObject.Find("BlockPopXGame") == null || GameObject.Find("BlockPopXHudCanvas") == null)
        {
            SetupPlayScene();
        }
    }
}
