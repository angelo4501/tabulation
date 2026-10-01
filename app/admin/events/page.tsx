import Link from "next/link";
import { PageShell, StatusBadge } from "@/components/ui";
import { getAdminEvents } from "@/lib/data";

export default async function EventsPage() {
  const events = await getAdminEvents();

  return (
    <PageShell title="Events" eyebrow="Administrator">
      <div className="mb-5 flex justify-end">
        <Link className="btn btn-primary" href="/admin/events/new">Create event</Link>
      </div>
      <div className="card overflow-x-auto p-2">
        <table className="table">
          <thead><tr><th>Name</th><th>Status</th><th>Venue</th><th>Organizer</th><th /></tr></thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className="font-bold">{event.name}</td>
                <td><StatusBadge status={event.status} /></td>
                <td>{event.venue ?? "TBD"}</td>
                <td>{event.organizer ?? "TBD"}</td>
                <td><Link className="font-bold text-[#34124d] underline" href={`/admin/events/${event.id}/contestants`}>Open</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
