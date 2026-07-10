import Image from "next/image";
import Link from "next/link";

type SeoGamePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: {
    title: string;
    body: string;
  }[];
};

export function SeoGamePage({
  eyebrow,
  title,
  description,
  sections,
}: SeoGamePageProps) {
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
            <Link href="/privacy" className="hover:text-cyan-400">
              Privacy
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-black leading-tight md:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            {description}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
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
              Learn Rules
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/40 px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-slate-800 bg-slate-950 p-7"
            >
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-4 leading-7 text-slate-400">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-400">
        <p>(c) 2026 BlockPopX. All rights reserved.</p>

        <div className="mt-4 flex flex-wrap justify-center gap-6">
          <Link href="/privacy" className="hover:text-cyan-400">
            Privacy
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
