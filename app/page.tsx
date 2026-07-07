import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-xl font-black tracking-wide">
            <span className="text-cyan-400">Block</span>PopX
          </Link>

          <nav className="flex items-center gap-6 text-sm text-slate-300">
            <Link href="/play" className="hover:text-cyan-400">
              Play
            </Link>
            <Link href="/how-to-play" className="hover:text-cyan-400">
              How to Play
            </Link>
            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 md:py-28">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Free Online Puzzle Game
          </p>

          <h1 className="text-5xl font-black leading-tight md:text-7xl">
            Pop the blocks.
            <br />
            Beat the score.
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
            BlockPopX is a fast and simple block puzzle game. Tap matching
            blocks, score points, use your moves wisely, and challenge your high
            score.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
           <Link
  href="/play"
  target="_blank"
  className="rounded-full bg-cyan-400 px-9 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
>
  Play Now
</Link>

            <Link
  href="/how-to-play"
  target="_blank"
  className="rounded-full border border-slate-700 px-9 py-4 font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
>
  Learn How to Play
</Link>
          </div>
        </div>
      </section>

      {/* Quick Stats / Features */}
      <section className="border-y border-slate-800 bg-slate-900/40 px-6 py-10">
        <div className="mx-auto grid max-w-5xl gap-4 text-center md:grid-cols-3">
          <div className="rounded-3xl bg-slate-950 p-6">
            <p className="text-3xl font-black text-cyan-400">20</p>
            <p className="mt-2 text-sm text-slate-400">Moves per game</p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6">
            <p className="text-3xl font-black text-cyan-400">Free</p>
            <p className="mt-2 text-sm text-slate-400">Play in your browser</p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6">
            <p className="text-3xl font-black text-cyan-400">Score</p>
            <p className="mt-2 text-sm text-slate-400">Beat your high score</p>
          </div>
        </div>
      </section>

      {/* How to Play Preview */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Simple Rules
            </p>
            <h2 className="mt-3 text-4xl font-black">How to Play</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              BlockPopX is easy to start, but your best score depends on smart
              moves.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
                1
              </div>
              <h3 className="text-xl font-bold">Find Matching Blocks</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Look for 2 or more same-color blocks touching each other.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
                2
              </div>
              <h3 className="text-xl font-bold">Tap to Pop</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Tap a matching group to pop blocks and earn points.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
                3
              </div>
              <h3 className="text-xl font-bold">Use Moves Wisely</h3>
              <p className="mt-3 leading-7 text-slate-400">
                Bigger groups give bigger points. You only have 20 moves.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/how-to-play"
              className="font-bold text-cyan-400 hover:text-cyan-300"
            >
              Read full instructions →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-slate-800 px-6 py-16">
        <div className="mx-auto max-w-4xl rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-950 p-10 text-center shadow-2xl">
          <h2 className="text-4xl font-black">Ready to play?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-400">
            Start a new game, pop matching blocks, and see how high you can
            score.
          </p>

          <Link
            href="/play"
            className="mt-8 inline-block rounded-full bg-cyan-400 px-9 py-4 font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Start Playing
          </Link>
        </div>
      </section>

      {/* Footer */}
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
