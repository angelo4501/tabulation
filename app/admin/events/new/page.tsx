import { ActionForm } from "@/components/action-form";
import { PageShell } from "@/components/ui";
import { createEventAction } from "@/lib/actions";

export default function NewEventPage() {
  return (
    <PageShell title="Create event" eyebrow="Administrator">
      <div className="card mx-auto max-w-2xl p-6">
        <ActionForm action={createEventAction} submitLabel="Create event">
          <label className="block"><span className="mb-1 block text-sm font-bold text-[#34124d]">Event name</span><input className="input" name="name" required /></label>
          <label className="block"><span className="mb-1 block text-sm font-bold text-[#34124d]">Description</span><textarea className="input min-h-28" name="description" /></label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block"><span className="mb-1 block text-sm font-bold text-[#34124d]">Venue</span><input className="input" name="venue" /></label>
            <label className="block"><span className="mb-1 block text-sm font-bold text-[#34124d]">Event date</span><input className="input" name="event_date" type="datetime-local" /></label>
          </div>
          <label className="block"><span className="mb-1 block text-sm font-bold text-[#34124d]">Organizer</span><input className="input" name="organizer" /></label>
        </ActionForm>
      </div>
    </PageShell>
  );
}
