import Link from "next/link";
import { CalendarDays, ClipboardList, Trophy, Users } from "lucide-react";
import { PageShell, StatusBadge } from "@/components/ui";
import { getAdminEvents } from "@/lib/data";

export default async function AdminDashboardPage() {
  const events = await getAdminEvents();
  const latest = events[0];

  return (
    <PageShell title="Administrator dashboard" eyebrow="KALOOK operations">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="card p-5"><CalendarDays className="mb-3 text-[#d6a738]" /><p className="text-sm text-slate-500">Events</p><p className="text-3xl font-black">{events.length}</p></div>
        <div className="card p-5"><Users className="mb-3 text-[#d6a738]" /><p className="text-sm text-slate-500">Setup</p><p className="text-xl font-black">Contestants</p></div>
        <div className="card p-5"><ClipboardList className="mb-3 text-[#d6a738]" /><p className="text-sm text-slate-500">Scoring</p><p className="text-xl font-black">Secure drafts</p></div>
        <div className="card p-5"><Trophy className="mb-3 text-[#d6a738]" /><p className="text-sm text-slate-500">Results</p><p className="text-xl font-black">CSV + Print</p></div>
      </div>
      <div className="card mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-[#34124d]">Events</h2>
            <p className="text-slate-600">Create an event, configure setup, then open judging.</p>
          </div>
          <Link className="btn btn-primary" href="/admin/events/new">Create event</Link>
        </div>
        {latest ? (
          <div className="mt-6 overflow-x-auto">
            <table className="table">
              <thead><tr><th>Name</th><th>Status</th><th>Date</th><th /></tr></thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="font-bold">{event.name}</td>
                    <td><StatusBadge status={event.status} /></td>
                    <td>{event.event_date ?? "Not set"}</td>
                    <td><Link className="font-bold text-[#34124d] underline" href={`/admin/events/${event.id}/tabulation`}>Manage</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-slate-50 p-5 text-slate-600">No events yet. Create the first Kalook-Alike event to begin.</p>
        )}
      </div>
    </PageShell>
  );
}
