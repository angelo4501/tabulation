"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { validateCriteriaWeights } from "@/lib/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type { CriterionRecord } from "@/lib/types";
import {
  contestantSchema,
  criterionSchema,
  eventSchema,
  eventStatusSchema,
  forgotPasswordSchema,
  judgeSchema,
  reopenSchema,
  signInSchema
} from "@/lib/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPublicSupabaseEnv } from "@/lib/env";

type ActionState = {
  ok: boolean;
  message: string;
};

const defaultError = "The request could not be completed. Please check your inputs and try again.";

function parseForm<T extends z.ZodType>(schema: T, formData: FormData): z.infer<T> {
  return schema.parse(Object.fromEntries(formData.entries()));
}

function safeMessage(error: unknown) {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? defaultError;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return defaultError;
}

export async function signInAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const payload = parseForm(signInSchema, formData);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword(payload);

    if (error) {
      return { ok: false, message: "Invalid email or password." };
    }
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }

  redirect("/admin/dashboard");
}

export async function forgotPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const payload = parseForm(forgotPasswordSchema, formData);
    const supabase = await createSupabaseServerClient();
    const env = getPublicSupabaseEnv();
    const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
      redirectTo: env ? `${env.appUrl}/auth/sign-in` : undefined
    });

    if (error) {
      return { ok: false, message: "Password reset could not be started." };
    }

    return { ok: true, message: "If the email exists, a password reset link has been sent." };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function createEventAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const payload = parseForm(eventSchema, formData);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("events")
      .insert({
        ...payload,
        description: payload.description || null,
        venue: payload.venue || null,
        event_date: payload.event_date || null,
        organizer: payload.organizer || null,
        created_by: admin.id,
        status: "draft"
      })
      .select("id")
      .single();

    if (error || !data) {
      return { ok: false, message: defaultError };
    }

    revalidatePath("/admin/events");
    return { ok: true, message: `Event created. Open /admin/events/${data.id}/contestants to continue setup.` };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

export async function addContestantAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const payload = parseForm(contestantSchema, formData);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("contestants").insert({
      ...payload,
      organization: payload.organization || null,
      profile_photo_url: payload.profile_photo_url || null,
      status: "active"
    });

    if (error) {
      return { ok: false, message: "Contestant number must be unique within the event." };
    }

    revalidatePath(`/admin/events/${payload.event_id}`);
    return { ok: true, message: "Contestant saved." };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

export async function withdrawContestantAction(contestantId: string, eventId: string) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  await supabase.from("contestants").update({ status: "withdrawn" }).eq("id", contestantId);
  revalidatePath(`/admin/events/${eventId}`);
}

export async function addCriterionAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const payload = parseForm(criterionSchema, formData);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("criteria").insert({
      ...payload,
      description: payload.description || null,
      is_active: true
    });

    if (error) {
      return { ok: false, message: defaultError };
    }

    revalidatePath(`/admin/events/${payload.event_id}/criteria`);
    return { ok: true, message: "Criterion saved." };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

export async function addDefaultCriteriaAction(eventId: string) {
  await requireAdmin();
  const supabase = createSupabaseAdminClient();
  const defaults = [
    ["Physical Resemblance", 40],
    ["Costume and Styling", 20],
    ["Mannerisms and Characterization", 20],
    ["Stage Presence", 10],
    ["Audience Impact", 10]
  ] as const;

  await supabase.from("criteria").insert(
    defaults.map(([name, weight], index) => ({
      event_id: eventId,
      name,
      weight,
      min_score: 1,
      max_score: 100,
      display_order: index + 1,
      is_active: true
    }))
  );
  revalidatePath(`/admin/events/${eventId}/criteria`);
}

export async function assignJudgeAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const payload = parseForm(judgeSchema, formData);
    const supabase = createSupabaseAdminClient();
    let judgeId: string | null = null;

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", payload.email)
      .maybeSingle();

    if (existingProfile?.id) {
      judgeId = existingProfile.id;
    } else {
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(payload.email, {
        data: {
          full_name: payload.full_name,
          role: "judge"
        }
      });

      if (error || !data.user) {
        return { ok: false, message: "Judge invitation could not be sent." };
      }

      judgeId = data.user.id;
      await supabase.from("profiles").upsert({
        id: judgeId,
        email: payload.email,
        full_name: payload.full_name,
        role: "judge"
      });
    }

    const { error } = await supabase.from("event_judges").insert({
      event_id: payload.event_id,
      judge_id: judgeId,
      display_name: payload.full_name,
      email: payload.email
    });

    if (error) {
      return { ok: false, message: "This judge is already assigned to the event." };
    }

    revalidatePath(`/admin/events/${payload.event_id}/judges`);
    return { ok: true, message: "Judge assigned and invited." };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

async function assertEventCanOpen(eventId: string) {
  const supabase = createSupabaseAdminClient();
  const [{ count: contestantCount }, { count: judgeCount }, { data: criteria }] = await Promise.all([
    supabase.from("contestants").select("id", { count: "exact", head: true }).eq("event_id", eventId).eq("status", "active"),
    supabase.from("event_judges").select("id", { count: "exact", head: true }).eq("event_id", eventId),
    supabase.from("criteria").select("*").eq("event_id", eventId).eq("is_active", true).returns<CriterionRecord[]>()
  ]);

  if (!contestantCount) {
    throw new Error("Add at least one active contestant before opening judging.");
  }

  if (!judgeCount) {
    throw new Error("Assign at least one judge before opening judging.");
  }

  if (!criteria?.length) {
    throw new Error("Add at least one active criterion before opening judging.");
  }

  if (!validateCriteriaWeights(criteria).valid) {
    throw new Error("Active criteria weights must total exactly 100% before opening judging.");
  }
}

export async function updateEventStatusAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    await requireAdmin();
    const payload = parseForm(eventStatusSchema, formData);
    const supabase = createSupabaseAdminClient();

    if (payload.status === "open") {
      await assertEventCanOpen(payload.event_id);
    }

    const { error } = await supabase.from("events").update({ status: payload.status }).eq("id", payload.event_id);
    if (error) {
      return { ok: false, message: defaultError };
    }

    revalidatePath(`/admin/events/${payload.event_id}`);
    revalidatePath(`/results/${payload.event_id}`);
    return { ok: true, message: `Event status changed to ${payload.status}.` };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

export async function reopenScoreSheetAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const admin = await requireAdmin();
    const payload = parseForm(reopenSchema, formData);
    const supabase = createSupabaseAdminClient();
    const { data: sheet } = await supabase
      .from("score_sheets")
      .select("id, event_id, status")
      .eq("id", payload.score_sheet_id)
      .single();

    if (!sheet || sheet.status !== "submitted") {
      return { ok: false, message: "Only submitted score sheets can be reopened." };
    }

    await supabase.from("score_reopen_logs").insert({
      score_sheet_id: payload.score_sheet_id,
      reopened_by: admin.id,
      reason: payload.reason
    });
    await supabase.from("score_sheets").update({ status: "draft", submitted_at: null }).eq("id", payload.score_sheet_id);

    revalidatePath(`/admin/events/${sheet.event_id}/judges`);
    return { ok: true, message: "Score sheet reopened." };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}
