# BlockPopX Unity

Unity rebuild starter for BlockPopX.

Open this folder from Unity Hub:

1. Open Unity Hub.
2. Press Add, then choose `C:\Users\Ayal\blockpopx\BlockPopXUnity`.
3. Open it with Unity `6000.3.19f1`.
4. Create a 2D scene.
5. Create an empty GameObject named `BlockPopXGame`.
6. Add the `BlockPopXGame` script to it.
7. Create a circle sprite prefab, add `BallView` to it, then assign that prefab
   to the `Ball Prefab` field on `BlockPopXGame`.
8. Press Play.

The first Unity pass ports the core board idea:

- 10x10 ball board
- all BlockPopX colors
- tap matching connected balls
- empty spaces remain until the board is cleared
- level 1 to 5+ progression data
- harder puzzle arrangements as levels increase

Next porting steps:

- Build the Unity UI for score, level, fouls, best score, and messages.
- Add pop/drop animations with tweens.
- Add sound and vibration for mobile.
- Add Android/iOS build settings.
- Add Unity Ads or another ad network after the game is playable.
