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

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/play"
              className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-300 transition"
            >
              Play Now
            </Link>

            <Link
              href="/how-to-play"
              className="rounded-full border border-slate-700 px-8 py-4 font-bold text-white hover:border-cyan-400 hover:text-cyan-400 transition"
            >
              How to Play
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800 px-6 py-14">
        <div className="mx-auto max-w-5xl text-center">
          <h2 className="text-3xl font-bold mb-4">Quick Instructions</h2>

          <p className="mx-auto max-w-2xl text-slate-400">
            Tap 2 or more same-color blocks that touch each other. Bigger groups
            give bigger points. You have 20 moves to beat your high score.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-slate-900 p-6">
              <h3 className="text-xl font-bold mb-2">Find Matches</h3>
              <p className="text-slate-400">
                Look for blocks with the same color touching side by side.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6">
              <h3 className="text-xl font-bold mb-2">Pop Blocks</h3>
              <p className="text-slate-400">
                Tap a matching group to score points and reduce your moves.
              </p>
            </div>

            <div className="rounded-3xl bg-slate-900 p-6">
              <h3 className="text-xl font-bold mb-2">Beat the Score</h3>
              <p className="text-slate-400">
                Use your moves wisely and challenge your high score.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">
        <p>© 2026 BlockPopX. All rights reserved.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <Link href="/play" className="hover:text-cyan-400">
            Play
          </Link>

          <Link href="/how-to-play" className="hover:text-cyan-400">
            How to Play
          </Link>

          <Link href="/privacy" className="hover:text-cyan-400">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </main>
  );
}