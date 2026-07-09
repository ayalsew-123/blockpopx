import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const puzzleHighlights = [
  "Ruby Sprint",
  "Pip Rush",
  "Lock Breaker",
  "Prize Chase",
  "Rocket Lab",
  "Gravity Twist",
  "Cascade Path",
  "Prize Vault",
  "Color Storm",
  "Mirror Drop",
  "Combo Forge",
  "Boss Board",
];

const faqs = [
  {
    question: "Is BlockPopX free to play?",
    answer:
      "Yes. BlockPopX is a free online block puzzle game that runs in your browser.",
  },
  {
    question: "Do I need to download BlockPopX?",
    answer:
      "No download is needed. Open BlockPopX on your phone, tablet, or computer and start playing.",
  },
  {
    question: "How do I score in BlockPopX?",
    answer:
      "Tap groups of two or more matching balls. Bigger groups, puzzle goals, prizes, and Pip Blast create stronger scores.",
  },
  {
    question: "What makes BlockPopX tricky?",
    answer:
      "The game mixes color goals, locks, prize balls, pips, gravity changes, and 12 puzzle missions so each level asks for a new plan.",
  },
];

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "BlockPopX",
    url: "https://www.blockpopx.com",
    description:
      "BlockPopX is a free online block puzzle game with matching balls, puzzle missions, Pip Blast, prizes, and high score runs.",
  },
  {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: "BlockPopX",
    url: "https://www.blockpopx.com/play",
    image: "https://www.blockpopx.com/blockpopx-logo.png",
    description:
      "Play BlockPopX free online. Pop matching balls on an 8x8 board, solve tricky puzzle missions, charge Pip Blast, avoid fouls, and chase your best score.",
    applicationCategory: "Game",
    gamePlatform: ["Web browser", "Mobile browser", "Desktop browser"],
    genre: ["Puzzle", "Arcade", "Matching"],
    playMode: "SinglePlayer",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
];

export const metadata: Metadata = {
  title: {
    absolute: "BlockPopX - Free Online Block Puzzle Game",
  },
  description:
    "Play BlockPopX free online. Pop matching balls, solve 12 tricky puzzle missions, charge Pip Blast, avoid fouls, and chase your high score.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BlockPopX - Free Online Block Puzzle Game",
    description:
      "Pop matching balls, solve 12 tricky puzzle missions, charge Pip Blast, avoid fouls, and chase your high score.",
    url: "https://www.blockpopx.com",
    images: [
      {
        url: "/blockpopx-logo.png",
        width: 1200,
        height: 675,
        alt: "BlockPopX free online block puzzle game",
      },
    ],
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />

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

            <Link href="/how-to-play" className="hover:text-cyan-400">
              How to Play
            </Link>

            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <Image
            src="/blockpopx-logo.svg"
            alt="BlockPopX logo"
            width={1200}
            height={675}
            priority
            className="mx-auto mb-8 w-full max-w-4xl rounded-3xl"
          />

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
            Free Online Puzzle Game
          </p>

          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            BlockPopX Free Online Block Puzzle Game
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300 md:text-xl">
            Pop matching balls, solve tricky puzzle missions, charge Pip Blast,
            dodge fouls, and keep your run alive for a bigger high score.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/play"
              className="rounded-full bg-cyan-400 px-9 py-4 font-bold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300"
            >
              Play Now
            </Link>

            <Link
              href="/how-to-play"
              className="rounded-full border border-slate-700 px-9 py-4 font-bold text-white transition hover:border-cyan-400 hover:text-cyan-400"
            >
              Learn How to Play
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/40 px-6 py-10">
        <div className="mx-auto grid max-w-5xl gap-4 text-center md:grid-cols-3">
          <div className="rounded-3xl bg-slate-950 p-6">
            <p className="text-3xl font-black text-cyan-400">8x8</p>
            <p className="mt-2 text-sm text-slate-400">Bigger puzzle board</p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6">
            <p className="text-3xl font-black text-cyan-400">12</p>
            <p className="mt-2 text-sm text-slate-400">Puzzle missions</p>
          </div>

          <div className="rounded-3xl bg-slate-950 p-6">
            <p className="text-3xl font-black text-cyan-400">Free</p>
            <p className="mt-2 text-sm text-slate-400">Play in your browser</p>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Play BlockPopX Online
            </p>

            <h2 className="mt-3 text-4xl font-black">
              A fast matching puzzle game with smarter goals
            </h2>

            <div className="mt-6 space-y-5 text-lg leading-8 text-slate-300">
              <p>
                BlockPopX is built for quick browser play: tap matching balls,
                clear color goals, unlock prize moments, and keep pushing as
                levels get harder.
              </p>

              <p>
                Every run mixes score targets, pips, locks, gravity shifts,
                special balls, and foul pressure. It feels simple on the first
                move, then turns into a real puzzle when you chase bigger
                groups and better streaks.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <h3 className="text-2xl font-black">Game Features</h3>

            <ul className="mt-6 space-y-3 leading-7 text-slate-300">
              <li>Free online puzzle game with no download required.</li>
              <li>8x8 board with more balls, prizes, locks, and pips.</li>
              <li>12 puzzle missions that rotate into harder challenges.</li>
              <li>Pip Blast rewards, rocket moments, and high-score play.</li>
              <li>Works on mobile, tablet, and desktop browsers.</li>
            </ul>
          </div>
        </div>
      </section>

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

              <h3 className="text-xl font-bold">Avoid Fouls</h3>

              <p className="mt-3 leading-7 text-slate-400">
                Bigger groups give bigger points. Bad taps build fouls, so play
                clean.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/how-to-play"
              className="font-bold text-cyan-400 hover:text-cyan-300"
            >
              Read full instructions &gt;
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/40 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              More Puzzle Variety
            </p>

            <h2 className="mt-3 text-4xl font-black">
              12 tricky missions to beat
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-400">
              Each BlockPopX mission changes the goals, pressure, and rewards
              so players have a fresh reason to try one more run.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {puzzleHighlights.map((puzzle, index) => (
              <div
                key={puzzle}
                className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Mission {index + 1}
                </p>
                <h3 className="mt-2 text-lg font-black">{puzzle}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              Questions
            </p>

            <h2 className="mt-3 text-4xl font-black">BlockPopX FAQ</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <section
                key={faq.question}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-6"
              >
                <h3 className="text-xl font-bold">{faq.question}</h3>
                <p className="mt-3 leading-7 text-slate-400">{faq.answer}</p>
              </section>
            ))}
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
