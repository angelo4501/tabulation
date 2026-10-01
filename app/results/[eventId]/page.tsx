import Link from "next/link";
import { ResultsTable } from "@/components/results-table";
import { PageShell } from "@/components/ui";
import { getPublishedResults } from "@/lib/data";

export default async function PublishedResultsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, tabulation } = await getPublishedResults(eventId);

  return (
    <PageShell title={`${event.name}: official results`} eyebrow="Published results">
      <div className="card p-6">
        <p className="mb-4 text-slate-600">{event.venue ?? "Venue TBD"} · {event.event_date ?? "Date TBD"}</p>
        <ResultsTable publicView results={tabulation.results.filter((result) => result.status === "active")} />
        <Link className="btn btn-gold mt-6" href={`/results/${eventId}/presentation`}>Presentation mode</Link>
      </div>
    </PageShell>
  );
}
