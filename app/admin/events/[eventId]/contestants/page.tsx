import { AdminEventTabs } from "@/components/admin-tabs";
import { ActionForm } from "@/components/action-form";
import { TextField } from "@/components/form-field";
import { PageShell } from "@/components/ui";
import { addContestantAction, withdrawContestantAction } from "@/lib/actions";
import { getAdminEventBundle } from "@/lib/data";

export default async function ContestantsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, contestants } = await getAdminEventBundle(eventId);

  return (
    <PageShell title={`${event.name}: contestants`} eyebrow="Administrator">
      <AdminEventTabs eventId={eventId} />
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-6">
          <h2 className="mb-4 text-xl font-black text-[#34124d]">Add contestant</h2>
          <ActionForm action={addContestantAction} submitLabel="Save contestant">
            <input name="event_id" type="hidden" value={eventId} />
            <TextField label="Contestant number" name="contestant_number" required />
            <TextField label="Full name" name="full_name" required />
            <TextField label="Character or celebrity portrayed" name="character_name" required />
            <TextField label="Barangay / organization" name="organization" />
            <TextField label="Profile photo URL" name="profile_photo_url" type="url" />
            <TextField defaultValue={contestants.length + 1} label="Display order" name="display_order" type="number" />
          </ActionForm>
        </div>
        <div className="card overflow-x-auto p-2">
          <table className="table">
            <thead><tr><th>#</th><th>Name</th><th>Character</th><th>Status</th><th /></tr></thead>
            <tbody>
              {contestants.map((contestant) => (
                <tr key={contestant.id}>
                  <td className="font-black">{contestant.contestant_number}</td>
                  <td>{contestant.full_name}</td>
                  <td>{contestant.character_name}</td>
                  <td>{contestant.status}</td>
                  <td>
                    {contestant.status === "active" ? (
                      <form action={withdrawContestantAction.bind(null, contestant.id, eventId)}>
                        <button className="font-bold text-red-700 underline" type="submit">Withdraw</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
