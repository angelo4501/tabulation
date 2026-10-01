import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProfileRecord, ProfileRole } from "@/lib/types";

export async function getCurrentProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .eq("id", user.id)
    .single<ProfileRecord>();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function requireProfile(role?: ProfileRole) {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/auth/sign-in");
  }

  if (role && profile.role !== role) {
    redirect(profile.role === "administrator" ? "/admin/dashboard" : "/judge/events");
  }

  return profile;
}

export async function requireAdmin() {
  return requireProfile("administrator");
}

export async function requireJudge() {
  return requireProfile("judge");
}
