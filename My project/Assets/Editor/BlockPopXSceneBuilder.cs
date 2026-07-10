using BlockPopX;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

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

        Selection.activeGameObject = gameObject;
        EditorUtility.SetDirty(gameObject);
        EditorUtility.SetDirty(boardRoot);
        EditorUtility.SetDirty(camera);
        EditorSceneManager.MarkSceneDirty(EditorSceneManager.GetActiveScene());

        Debug.Log("BlockPopX play scene is ready. Press Play to test the board.");
    }
}
