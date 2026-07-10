import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Read the BlockPopX terms of use for the free online puzzle game.",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
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
            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
            <Link href="/contact" className="hover:text-cyan-400">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Legal
          </p>
          <h1 className="mt-4 text-5xl font-black">Terms of Use</h1>
          <p className="mt-6 leading-8 text-slate-300">
            BlockPopX is provided as a free browser puzzle game. By playing the
            game or using this website, you agree to use it fairly and for
            personal entertainment.
          </p>

          <div className="mt-10 space-y-8">
            {[
              {
                title: "Game Access",
                body: "BlockPopX may change, improve, or pause features over time. We try to keep the game available, but we do not guarantee uninterrupted access.",
              },
              {
                title: "Fair Play",
                body: "Do not abuse, attack, copy, resell, or interfere with the website, game code, brand, or player experience.",
              },
              {
                title: "No Purchase Required",
                body: "The web game is currently free to play. Future ads or optional features may be added to support development.",
              },
              {
                title: "Limitation",
                body: "BlockPopX is offered as-is for entertainment. Use the game at your own discretion.",
              },
            ].map((section) => (
              <section
                key={section.title}
                className="rounded-3xl border border-slate-800 bg-slate-900 p-7"
              >
                <h2 className="text-2xl font-bold">{section.title}</h2>
                <p className="mt-3 leading-7 text-slate-300">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
