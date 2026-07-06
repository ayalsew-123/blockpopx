import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="max-w-4xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-widest text-cyan-400 uppercase">
            BlockPopX
          </p>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Pop the blocks. Beat the score.
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10">
            Play a simple and fun block puzzle game. Tap matching blocks, earn
            points, and try to beat your high score before your moves run out.
          </p>

          <Link
            href="/play"
            className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-300 transition"
          >
            Play Now
          </Link>
        </div>
      </section>

      <section className="border-t border-slate-800 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold mb-10">
            How to Play
          </h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-900 p-6">
              <div className="mb-4 text-3xl">1</div>
              <h3 className="text-xl font-bold mb-2">Find Matching Blocks</h3>
              <p className="text-slate-400">
                Look for 2 or more blocks with the same color touching each
                other.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6">
              <div className="mb-4 text-3xl">2</div>
              <h3 className="text-xl font-bold mb-2">Tap to Pop</h3>
              <p className="text-slate-400">
                Tap a matching group to pop the blocks and earn points.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6">
              <div className="mb-4 text-3xl">3</div>
              <h3 className="text-xl font-bold mb-2">Beat Your Score</h3>
              <p className="text-slate-400">
                Bigger groups give bigger points. Use your 20 moves wisely and
                beat your high score.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-10">Game Features</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-900 p-6">
              <h3 className="text-xl font-bold mb-2">Free to Play</h3>
              <p className="text-slate-400">
                Play BlockPopX anytime from your browser.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6">
              <h3 className="text-xl font-bold mb-2">High Score</h3>
              <p className="text-slate-400">
                Your best score is saved in your browser.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6">
              <h3 className="text-xl font-bold mb-2">Share Score</h3>
              <p className="text-slate-400">
                Copy or share your score and challenge your friends.
              </p>
            </div>
          </div>

          <div className="mt-10">
            <Link
              href="/play"
              className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-300 transition"
            >
              Start Playing
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">
        <p>© 2026 BlockPopX. All rights reserved.</p>

        <div className="mt-4 flex justify-center gap-6">
          <Link href="/play" className="hover:text-cyan-400">
            Play
          </Link>

          <Link href="/privacy" className="hover:text-cyan-400">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </main>
  );
}