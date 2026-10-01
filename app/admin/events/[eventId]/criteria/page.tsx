import { AdminEventTabs } from "@/components/admin-tabs";
import { ActionForm } from "@/components/action-form";
import { TextAreaField, TextField } from "@/components/form-field";
import { PageShell } from "@/components/ui";
import { addCriterionAction, addDefaultCriteriaAction } from "@/lib/actions";
import { getAdminEventBundle } from "@/lib/data";
import { validateCriteriaWeights } from "@/lib/scoring";

export default async function CriteriaPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const { event, criteria } = await getAdminEventBundle(eventId);
  const weight = validateCriteriaWeights(criteria);

  return (
    <PageShell title={`${event.name}: criteria`} eyebrow="Administrator">
      <AdminEventTabs eventId={eventId} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
        <p className={weight.valid ? "font-bold text-emerald-700" : "font-bold text-red-700"}>
          Active weight total: {weight.total}% {weight.valid ? "(ready)" : "(must equal 100%)"}
        </p>
        <form action={addDefaultCriteriaAction.bind(null, eventId)}>
          <button className="btn btn-gold" type="submit">Add default criteria</button>
        </form>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="card p-6">
          <h2 className="mb-4 text-xl font-black text-[#34124d]">Add criterion</h2>
          <ActionForm action={addCriterionAction} submitLabel="Save criterion">
            <input name="event_id" type="hidden" value={eventId} />
            <TextField label="Name" name="name" required />
            <TextAreaField label="Description" name="description" />
            <div className="grid gap-4 md:grid-cols-2">
              <TextField label="Weight" name="weight" required step="0.01" type="number" />
              <TextField defaultValue={criteria.length + 1} label="Display order" name="display_order" type="number" />
              <TextField defaultValue={1} label="Minimum score" name="min_score" type="number" />
              <TextField defaultValue={100} label="Maximum score" name="max_score" type="number" />
            </div>
          </ActionForm>
        </div>
        <div className="card overflow-x-auto p-2">
          <table className="table">
            <thead><tr><th>Name</th><th>Weight</th><th>Range</th><th>Order</th></tr></thead>
            <tbody>
              {criteria.map((criterion) => (
                <tr key={criterion.id}>
                  <td className="font-bold">{criterion.name}</td>
                  <td>{criterion.weight}%</td>
                  <td>{criterion.min_score} - {criterion.max_score}</td>
                  <td>{criterion.display_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
