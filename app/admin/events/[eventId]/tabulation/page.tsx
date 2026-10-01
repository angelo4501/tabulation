import Link from "next/link";
import { AdminEventTabs } from "@/components/admin-tabs";
import { ActionForm } from "@/components/action-form";
import { ResultsTable } from "@/components/results-table";
import { PageShell, StatusBadge } from "@/components/ui";
import { updateEventStatusAction } from "@/lib/actions";
import { getAdminEventBundle } from "@/lib/data";

export default async function TabulationPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, contestants, judges, progress, tabulation } = await getAdminEventBundle(eventId);
  const submittedJudges = progress.filter((judge) => judge.submitted).length;
  const pendingJudges = Math.max(progress.length - submittedJudges, 0);

  return (
    <PageShell title={`${event.name}: tabulation`} eyebrow="Administrator">
      <AdminEventTabs eventId={eventId} />
      <div className="grid gap-4 md:grid-cols-5">
        <div className="card p-4"><p className="text-sm text-slate-500">Contestants</p><p className="text-3xl font-black">{contestants.length}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Judges</p><p className="text-3xl font-black">{judges.length}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Submitted</p><p className="text-3xl font-black">{submittedJudges}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-3xl font-black">{pendingJudges}</p></div>
        <div className="card p-4"><p className="text-sm text-slate-500">Status</p><StatusBadge status={event.status} /></div>
      </div>

      <div className="no-print card mt-6 p-6">
        <h2 className="mb-4 text-xl font-black text-[#34124d]">Event controls</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {(["open", "closed", "published", "draft"] as const).map((status) => (
            <ActionForm action={updateEventStatusAction} key={status} submitLabel={`Set ${status}`}>
              <input name="event_id" type="hidden" value={eventId} />
              <input name="status" type="hidden" value={status} />
            </ActionForm>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="btn btn-secondary" href={`/api/admin/events/${eventId}/rankings.csv`}>Export rankings CSV</Link>
          <Link className="btn btn-secondary" href={`/api/admin/events/${eventId}/detailed-scores.csv`}>Export detailed scores CSV</Link>
          <Link className="btn btn-gold" href={`/results/${eventId}`}>Public result page</Link>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto p-2">
        <h2 className="px-4 py-3 text-xl font-black text-[#34124d]">Judge progress</h2>
        <table className="table">
          <thead><tr><th>Judge</th><th>Contestants completed</th><th>Status</th><th>Submission time</th></tr></thead>
          <tbody>
            {progress.map((judge) => (
              <tr key={judge.judgeId}>
                <td className="font-bold">{judge.judgeName}</td>
                <td>{judge.completedContestants} / {judge.totalContestants}</td>
                <td>{judge.submitted ? "Submitted" : "Pending"}</td>
                <td>{judge.submittedAt ? new Date(judge.submittedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="print-card card mt-6 p-6">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#8b6a18]">Official result sheet</p>
          <h2 className="elegant-heading text-3xl font-black text-[#34124d]">{event.name}</h2>
          <p>{event.event_date ?? "Date TBD"} · {event.venue ?? "Venue TBD"}</p>
          <p className="mt-2 font-semibold">{tabulation.complete ? "Complete" : "Incomplete until every assigned judge submits."}</p>
        </div>
        <ResultsTable results={tabulation.results} />
        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="border-t border-slate-400 pt-3">Tabulator signature</div>
          <div className="border-t border-slate-400 pt-3">Event administrator signature</div>
        </div>
        <p className="mt-8 text-sm text-slate-500">
          Generated <time suppressHydrationWarning>{new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}</time>
        </p>
      </section>
    </PageShell>
  );
}
