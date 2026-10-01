import { AdminEventTabs } from "@/components/admin-tabs";
import { ActionForm } from "@/components/action-form";
import { PageShell } from "@/components/ui";
import { assignJudgeAction, reopenScoreSheetAction } from "@/lib/actions";
import { getAdminEventBundle } from "@/lib/data";

export default async function JudgesPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, judges, progress, scoreSheets, contestants } = await getAdminEventBundle(eventId);

  return (
    <PageShell title={`${event.name}: judges`} eyebrow="Administrator">
      <AdminEventTabs eventId={eventId} />
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="card p-6">
          <h2 className="mb-4 text-xl font-black text-[#34124d]">Assign judge</h2>
          <ActionForm action={assignJudgeAction} submitLabel="Invite and assign">
            <input name="event_id" type="hidden" value={eventId} />
            <label className="block"><span className="mb-1 block text-sm font-bold">Judge name</span><input className="input" name="full_name" required /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold">Email</span><input className="input" name="email" type="email" required /></label>
          </ActionForm>
        </div>
        <div className="card overflow-x-auto p-2">
          <table className="table">
            <thead><tr><th>Judge</th><th>Completed</th><th>Status</th><th>Submitted at</th></tr></thead>
            <tbody>
              {progress.map((judge) => (
                <tr key={judge.judgeId}>
                  <td className="font-bold">{judge.judgeName}</td>
                  <td>{judge.completedContestants} / {judge.totalContestants}</td>
                  <td>{judge.submitted ? "Submitted" : judge.completedContestants > 0 ? "Started" : "Not started"}</td>
                  <td>{judge.submittedAt ? new Date(judge.submittedAt).toLocaleString("en-PH", { timeZone: "Asia/Manila" }) : "-"}</td>
                </tr>
              ))}
              {!judges.length ? <tr><td colSpan={4}>No judges assigned yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
      <div className="card mt-6 overflow-x-auto p-2">
        <h2 className="px-4 py-3 text-xl font-black text-[#34124d]">Reopen submitted score sheet</h2>
        <table className="table">
          <thead><tr><th>Judge</th><th>Contestant</th><th>Status</th><th>Reason</th><th /></tr></thead>
          <tbody>
            {scoreSheets.filter((sheet) => sheet.status === "submitted").map((sheet) => {
              const judge = judges.find((candidate) => candidate.judge_id === sheet.judge_id);
              const contestant = contestants.find((candidate) => candidate.id === sheet.contestant_id);
              return (
                <tr key={sheet.id}>
                  <td>{judge?.display_name ?? "Judge"}</td>
                  <td>{contestant?.full_name ?? sheet.contestant_id}</td>
                  <td>{sheet.status}</td>
                  <td colSpan={2}>
                    <ActionForm action={reopenScoreSheetAction} submitLabel="Reopen">
                      <input name="score_sheet_id" type="hidden" value={sheet.id} />
                      <label className="block">
                        <span className="sr-only">Reopen reason</span>
                        <input className="input" name="reason" placeholder="Required reason" />
                      </label>
                    </ActionForm>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
