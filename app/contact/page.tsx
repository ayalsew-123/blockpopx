import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const contactEmail = "support@blockpopx.com";

export const metadata: Metadata = {
  title: "Contact BlockPopX",
  description:
    "Contact BlockPopX for questions about the free online puzzle game, privacy, support, ads, or app store readiness.",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
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
            <Link href="/terms" className="hover:text-cyan-400">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Support
          </p>
          <h1 className="mt-4 text-5xl font-black">Contact BlockPopX</h1>
          <p className="mt-6 leading-8 text-slate-300">
            Have a question about BlockPopX, privacy, ads, mobile app plans, or
            support? Send a message by email.
          </p>

          <section className="mt-10 rounded-3xl border border-slate-800 bg-slate-900 p-7">
            <h2 className="text-2xl font-bold">Email</h2>
            <p className="mt-3 leading-7 text-slate-300">
              Contact:{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="font-bold text-cyan-300 hover:text-cyan-200"
              >
                {contactEmail}
              </a>
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
