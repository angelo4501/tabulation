import Link from "next/link";
import { EmptyState, PageShell, StatusBadge } from "@/components/ui";
import { getJudgeEvents } from "@/lib/data";

export default async function JudgeEventsPage() {
  const events = await getJudgeEvents();

  return (
    <PageShell title="Assigned events" eyebrow="Judge">
      {events.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {events.map((event) => (
            <article className="card p-6" key={event.id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-black text-[#34124d]">{event.name}</h2>
                <StatusBadge status={event.status} />
              </div>
              <p className="mt-2 text-slate-600">{event.venue ?? "Venue TBD"}</p>
              <Link className="btn btn-primary mt-5" href={`/judge/events/${event.id}`}>Open scoring</Link>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState title="No assigned events" message="Ask the administrator to assign your judge account to an event." />
      )}
    </PageShell>
  );
}
