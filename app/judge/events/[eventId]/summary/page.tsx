import Link from "next/link";
import { PageShell } from "@/components/ui";
import { getJudgeScoringBundle } from "@/lib/data";

export default async function SubmissionSummaryPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, contestants, scoreSheets } = await getJudgeScoringBundle(eventId);

  return (
    <PageShell title={`${event.name}: submission summary`} eyebrow="Judge">
      <div className="card overflow-x-auto p-2">
        <table className="table">
          <thead><tr><th>#</th><th>Contestant</th><th>Status</th><th>Submitted at</th></tr></thead>
          <tbody>
            {contestants.map((contestant) => {
              const sheet = scoreSheets.find((candidate) => candidate.contestant_id === contestant.id);
              return (
                <tr key={contestant.id}>
                  <td className="font-black">{contestant.contestant_number}</td>
                  <td>{contestant.full_name}</td>
                  <td>{sheet?.status ?? "not started"}</td>
                  <td>{sheet?.submitted_at ? new Date(sheet.submitted_at).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Link className="btn btn-primary mt-6" href={`/judge/events/${eventId}`}>Back to scoring</Link>
    </PageShell>
  );
}
