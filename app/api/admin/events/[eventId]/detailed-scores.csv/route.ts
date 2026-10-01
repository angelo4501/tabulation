import { NextResponse } from "next/server";
import { buildDetailedScoresCsv } from "@/lib/csv";
import { getAdminEventBundle } from "@/lib/data";

export async function GET(_: Request, { params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const bundle = await getAdminEventBundle(eventId);
  const csv = buildDetailedScoresCsv({
    judges: bundle.judges,
    criteria: bundle.criteria,
    scoreSheets: bundle.scoreSheets,
    criterionScores: bundle.criterionScores
  });

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${bundle.event.name.replaceAll(/[^a-z0-9]+/gi, "-").toLowerCase()}-detailed-scores.csv"`
    }
  });
}
