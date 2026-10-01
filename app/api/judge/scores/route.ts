import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { saveScoresForJudge } from "@/lib/score-submission";
import { scoreDraftSchema } from "@/lib/validation";
import { z } from "zod";

const requestSchema = z.object({
  submit: z.boolean(),
  payload: scoreDraftSchema
});

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "judge") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = requestSchema.parse(await request.json());
    await saveScoresForJudge(profile.id, body.payload, body.submit);
    revalidatePath(`/judge/events/${body.payload.event_id}`);
    revalidatePath(`/admin/events/${body.payload.event_id}/tabulation`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scores could not be saved.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
