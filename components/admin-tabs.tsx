import Link from "next/link";

export function AdminEventTabs({ eventId }: { eventId: string }) {
  const tabs = [
    ["Contestants", "contestants"],
    ["Criteria", "criteria"],
    ["Judges", "judges"],
    ["Tabulation", "tabulation"]
  ];

  return (
    <div className="no-print mb-6 flex flex-wrap gap-2">
      {tabs.map(([label, segment]) => (
        <Link className="btn btn-secondary py-2" href={`/admin/events/${eventId}/${segment}`} key={segment}>
          {label}
        </Link>
      ))}
    </div>
  );
}
