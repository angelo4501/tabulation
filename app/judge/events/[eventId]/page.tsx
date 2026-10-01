import Link from "next/link";
import { JudgeScoringForm } from "@/components/judge-scoring-form";
import { PageShell, StatusBadge } from "@/components/ui";
import { getJudgeScoringBundle } from "@/lib/data";

export default async function JudgeScoringPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const bundle = await getJudgeScoringBundle(eventId);

  return (
    <PageShell title={bundle.event.name} eyebrow="Judge scoring">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4">
        <StatusBadge status={bundle.event.status} />
        <Link className="font-bold text-[#34124d] underline" href={`/judge/events/${eventId}/summary`}>Submission summary</Link>
      </div>
      <JudgeScoringForm {...bundle} />
    </PageShell>
  );
}
