import Link from "next/link";
import type { ReactNode } from "react";
import type { EventStatus } from "@/lib/types";

export function PageShell({ children, title, eyebrow }: { children: ReactNode; title: string; eyebrow?: string }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        {eyebrow ? <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em] text-[#8b6a18]">{eyebrow}</p> : null}
        <h1 className="elegant-heading text-4xl font-black text-[#34124d] md:text-5xl">{title}</h1>
      </div>
      {children}
    </main>
  );
}

export function EmptyState({ title, message, actionHref, actionLabel }: {
  title: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="card p-8 text-center">
      <h2 className="text-xl font-bold text-[#34124d]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-slate-600">{message}</p>
      {actionHref && actionLabel ? (
        <Link className="btn btn-primary mt-5" href={actionHref}>{actionLabel}</Link>
      ) : null}
    </div>
  );
}

export function StatusBadge({ status }: { status: EventStatus }) {
  const tone = {
    draft: "bg-slate-100 text-slate-700",
    open: "bg-emerald-100 text-emerald-800",
    closed: "bg-amber-100 text-amber-800",
    published: "bg-purple-100 text-purple-800"
  }[status];

  return <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${tone}`}>{status}</span>;
}

export function SubmitButton({ children }: { children: ReactNode }) {
  return <button className="btn btn-primary" type="submit">{children}</button>;
}
