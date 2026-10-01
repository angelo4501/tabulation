import Link from "next/link";
import { Crown, ShieldCheck, Trophy, Users } from "lucide-react";
import { getPublicSupabaseEnv } from "@/lib/env";

const features = [
  ["Live-event workflow", "Create events, configure criteria, assign judges, open scoring, close, publish.", Crown],
  ["Secure judging", "Judges sign in individually, save drafts, submit once, and never see rankings.", ShieldCheck],
  ["Official tabulation", "Server-calculated weighted scores, tie-breaks, CSV exports, and print sheets.", Trophy],
  ["Public results", "Published rankings only, with presentation mode for announcements.", Users]
];

export default function LandingPage() {
  const configured = Boolean(getPublicSupabaseEnv());

  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-black uppercase tracking-[0.3em] text-[#8b6a18]">Simple Pageant Tabulation App</p>
          <h1 className="elegant-heading text-6xl font-black leading-none text-[#34124d] md:text-7xl">
            KALOOK!
          </h1>
          <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-700">
            A focused MVP for Kalook-Alike and pageant competitions. Run scoring on phones, keep results private during judging, then publish official rankings when ready.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/auth/sign-in">Sign in</Link>
            <Link className="btn btn-secondary" href="/judge/events">Judge events</Link>
          </div>
          {!configured ? (
            <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              Supabase environment variables are not configured yet. See the README and docs/DEPLOYMENT.md before testing live data.
            </div>
          ) : null}
        </div>
        <div className="card p-6">
          <div className="rounded-3xl bg-[#34124d] p-6 text-white">
            <p className="text-sm uppercase tracking-[0.2em] text-[#d6a738]">Event status</p>
            <h2 className="mt-2 text-3xl font-black">Draft → Open → Closed → Published</h2>
            <p className="mt-4 text-white/80">Administrators control every transition. Public users only see official published results.</p>
          </div>
        </div>
      </section>
      <section className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {features.map(([title, text, Icon]) => (
          <article className="card p-5" key={title as string}>
            <Icon className="mb-4 h-8 w-8 text-[#d6a738]" />
            <h2 className="font-bold text-[#34124d]">{title as string}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text as string}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
