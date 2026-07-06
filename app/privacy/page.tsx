import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-cyan-400 hover:text-cyan-300">
          ← Back Home
        </Link>

        <h1 className="mt-8 text-4xl font-bold">Privacy Policy</h1>

        <p className="mt-6 text-slate-300">
          BlockPopX is a simple puzzle game. This website does not ask users to
          create an account or submit personal information.
        </p>

        <h2 className="mt-8 text-2xl font-bold">High Score</h2>
        <p className="mt-3 text-slate-300">
          Your high score is saved only in your browser using local storage. It
          is not sent to our server.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Advertising</h2>
        <p className="mt-3 text-slate-300">
          In the future, BlockPopX may show ads to support the free game.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Contact</h2>
        <p className="mt-3 text-slate-300">
          For questions, contact us through BlockPopX.com.
        </p>
      </div>
    </main>
  );
}