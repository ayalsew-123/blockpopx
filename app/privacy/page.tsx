import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the BlockPopX privacy policy for the free online puzzle game, including local high score storage and sharing details.",
  alternates: {
    canonical: "/privacy",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
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

            <Link href="/how-to-play" className="hover:text-cyan-400">
              How to Play
            </Link>

            <Link href="/privacy" className="text-cyan-400">
              Privacy
            </Link>

            <Link href="/terms" className="hover:text-cyan-400">
              Terms
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

          <h1 className="mt-4 text-5xl font-black">Privacy Policy</h1>

          <p className="mt-6 leading-8 text-slate-300">
            BlockPopX is a simple puzzle game. This website does not ask users
            to create an account or submit personal information.
          </p>

          <div className="mt-10 space-y-8">
            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-2xl font-bold">High Score</h2>

              <p className="mt-3 leading-7 text-slate-300">
                Your high score is saved only in your browser using local
                storage. It is not sent to our server.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-2xl font-bold">Sharing</h2>

              <p className="mt-3 leading-7 text-slate-300">
                If you use the Share Score button, your browser may open a
                sharing option or copy a link to your clipboard. BlockPopX does
                not collect this information.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-2xl font-bold">Advertising</h2>

              <p className="mt-3 leading-7 text-slate-300">
                In the future, BlockPopX may show ads to support the free game.
              </p>
            </section>

            <section className="rounded-3xl border border-slate-800 bg-slate-900 p-7">
              <h2 className="text-2xl font-bold">Contact</h2>

              <p className="mt-3 leading-7 text-slate-300">
                For questions, email{" "}
                <a
                  href="mailto:support@blockpopx.com"
                  className="font-bold text-cyan-300 hover:text-cyan-200"
                >
                  support@blockpopx.com
                </a>
                .
              </p>
            </section>
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

          <Link href="/terms" className="hover:text-cyan-400">
            Terms
          </Link>

          <Link href="/contact" className="hover:text-cyan-400">
            Contact
          </Link>
        </div>
      </footer>
    </main>
  );
}
