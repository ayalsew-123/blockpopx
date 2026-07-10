import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Play BlockPopX - Free Puzzle Game Guide",
  description:
    "Learn how to play BlockPopX. Find matching balls, score bigger groups, use Pip Blast, solve puzzle missions, avoid fouls, and beat your high score.",
  alternates: {
    canonical: "/how-to-play",
  },
  openGraph: {
    title: "How to Play BlockPopX - Free Puzzle Game Guide",
    description:
      "Learn BlockPopX rules, scoring, puzzle missions, Pip Blast rewards, prizes, locks, and high-score tips.",
    url: "https://www.blockpopx.com/how-to-play",
  },
};

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-3 text-xl font-black tracking-wide"
          >
            <Image
              src="/blockpopx-mark.svg"
              alt=""
              width={44}
              height={44}
              className="h-11 w-11"
            />
            <span>
              <span className="text-cyan-300">Block</span>
              <span className="text-white">Pop</span>
              <span className="text-fuchsia-300">X</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 text-xs text-slate-300 sm:gap-6 sm:text-sm">
            <Link href="/play" className="hover:text-cyan-400">
              Play
            </Link>

            <Link href="/how-to-play" className="text-cyan-400">
              How to Play
            </Link>

            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Instructions
          </p>

          <h1 className="mt-4 text-5xl font-black">How to Play BlockPopX</h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            BlockPopX is a free online puzzle game with a 10x10 board, matching
            balls, prize blocks, locks, pips, and 12 tricky puzzle missions.
            Pop groups, score points, charge Pip Blast, and keep your run alive
            by avoiding fouls.
          </p>

          <div className="mt-10">
            <Link
              href="/play"
              className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-300 transition"
            >
              Play Now
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/40 px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-950 p-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
              1
            </div>

            <h2 className="text-xl font-bold">Find Matching Blocks</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Look for 2 or more blocks with the same color touching each other.
              Blocks must touch up, down, left, or right on the 10x10 board.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
              2
            </div>

            <h2 className="text-xl font-bold">Tap to Pop</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Tap a matching group to pop the blocks and earn points. Single
              blocks do not score, so wait for better groups when you can.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-7">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 font-black text-slate-950">
              3
            </div>

            <h2 className="text-xl font-bold">Avoid Fouls</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Bad taps and wasted power moves add fouls. Three fouls means a
              restart, so choose carefully and protect your best run.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-3xl font-black">Scoring</h2>

            <p className="mt-4 leading-8 text-slate-300">
              The more blocks you pop at one time, the more points you earn.
              Try to wait for bigger groups before using boosts, prizes, and
              Pip Blast.
            </p>

            <ul className="mt-6 space-y-3 text-slate-400">
              <li>2 blocks = small points</li>
              <li>3 or more blocks = better points</li>
              <li>Large groups = big score bonus</li>
              <li>Pip Blast = clear useful colors faster</li>
              <li>Prizes, locks, and gravity changes = trickier puzzles</li>
              <li>3 fouls = restart</li>
            </ul>
          </div>

          <div className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-3xl font-black">Game Tips</h2>

            <ul className="mt-6 space-y-3 text-slate-400">
              <li>Pop bigger groups instead of small groups.</li>
              <li>Save your moves for high-value block groups.</li>
              <li>Watch the puzzle mission goal before choosing a color.</li>
              <li>Use prizes and Pip Blast when the board is tight.</li>
              <li>Watch your score and try to beat your high score.</li>
              <li>Use the Share Score button to challenge your friends.</li>
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">
        <p>(c) 2026 BlockPopX. All rights reserved.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <Link href="/" className="hover:text-cyan-400">
            Home
          </Link>

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
