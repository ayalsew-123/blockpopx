import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white flex flex-col">
      <section className="flex flex-1 items-center justify-center px-6">
        <div className="max-w-3xl text-center">
          <p className="mb-4 text-sm font-semibold tracking-widest text-cyan-400 uppercase">
            BlockPopX
          </p>

          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Pop the blocks. Beat the score.
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10">
            Play a simple and fun block puzzle game. Tap matching blocks, earn
            points, and try to beat your high score.
          </p>

          <Link
            href="/play"
            className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-300 transition"
          >
            Play Now
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-400">
        <p>© 2026 BlockPopX. All rights reserved.</p>

        <div className="mt-3 flex justify-center gap-6">
          <Link href="/play" className="hover:text-cyan-400">
            Play
          </Link>

          <Link href="/privacy" className="hover:text-cyan-400">
            Privacy
          </Link>
        </div>
      </footer>
    </main>
  );
}