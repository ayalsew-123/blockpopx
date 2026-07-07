import Link from "next/link";

export default function HowToPlayPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-cyan-400 hover:text-cyan-300">
          ← Back Home
        </Link>

        <h1 className="mt-8 text-4xl font-bold">How to Play BlockPopX</h1>

        <p className="mt-4 text-slate-300">
          BlockPopX is a simple block puzzle game. Your goal is to pop matching
          blocks, score points, and beat your high score before your moves run
          out.
        </p>

        <section className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-slate-900 p-6">
            <div className="mb-4 text-3xl font-bold text-cyan-400">1</div>
            <h2 className="text-xl font-bold">Find Matching Blocks</h2>
            <p className="mt-3 text-slate-400">
              Look for 2 or more blocks with the same color touching each other.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6">
            <div className="mb-4 text-3xl font-bold text-cyan-400">2</div>
            <h2 className="text-xl font-bold">Tap to Pop</h2>
            <p className="mt-3 text-slate-400">
              Tap a matching group to pop the blocks and earn points.
            </p>
          </div>

          <div className="rounded-3xl bg-slate-900 p-6">
            <div className="mb-4 text-3xl font-bold text-cyan-400">3</div>
            <h2 className="text-xl font-bold">Use Your Moves</h2>
            <p className="mt-3 text-slate-400">
              You have 20 moves. Bigger groups give bigger points, so choose
              carefully.
            </p>
          </div>
        </section>

        <section className="mt-10 rounded-3xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Scoring</h2>

          <p className="mt-3 text-slate-300">
            The more blocks you pop at one time, the more points you earn.
          </p>

          <ul className="mt-4 space-y-2 text-slate-400">
            <li>2 blocks = small points</li>
            <li>3 or more blocks = better points</li>
            <li>Large groups = big score bonus</li>
          </ul>
        </section>

        <section className="mt-10 rounded-3xl bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Game Tips</h2>

          <ul className="mt-4 space-y-2 text-slate-400">
            <li>Try to pop bigger groups instead of small groups.</li>
            <li>Save your moves for high-value block groups.</li>
            <li>Watch your score and try to beat your high score.</li>
            <li>Use the Share Score button to challenge your friends.</li>
          </ul>
        </section>

        <div className="mt-10">
          <Link
            href="/play"
            className="rounded-full bg-cyan-400 px-8 py-4 font-bold text-slate-950 hover:bg-cyan-300 transition"
          >
            Play Now
          </Link>
        </div>
      </div>
    </main>
  );
}