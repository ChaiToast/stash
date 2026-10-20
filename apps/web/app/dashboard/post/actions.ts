"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function markPostDone(postId: string, isDone: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("posts")
    .update({ is_done: isDone })
    .eq("id", postId)
    .eq("user_id", user.id);

  const { data: profile } = await supabase
    .from("users")
    .select("last_active, streak_days")
    .eq("id", user.id)
    .single();

  const now = new Date();
  let streakDays = profile?.streak_days ?? 0;
  const lastActive = profile?.last_active ? new Date(profile.last_active) : null;

  if (!lastActive) {
    streakDays = 1;
  } else {
    const dayMs = 24 * 60 * 60 * 1000;
    const diffDays = Math.floor(
      (now.setHours(0, 0, 0, 0) - new Date(lastActive).setHours(0, 0, 0, 0)) / dayMs,
    );
    if (diffDays === 0) {
      streakDays = Math.max(streakDays, 1);
    } else if (diffDays === 1) {
      streakDays += 1;
    } else {
      streakDays = 1;
    }
  }

  await supabase
    .from("users")
    .update({
      last_active: new Date().toISOString(),
      streak_days: streakDays,
    })
    .eq("id", user.id);

  await supabase.from("activity_log").insert({
    user_id: user.id,
    action: isDone ? "POST_CLASSIFIED" : "POST_RECLASSIFIED",
    metadata: { post_id: postId, marked_done: isDone },
  });

  revalidatePath(`/dashboard/post/${postId}`);
  revalidatePath("/dashboard");
}

export async function savePostNotes(postId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const notes = String(formData.get("notes") ?? "");

  await supabase
    .from("posts")
    .update({ notes })
    .eq("id", postId)
    .eq("user_id", user.id);

  await supabase.from("activity_log").insert({
    user_id: user.id,
    action: "POST_RECLASSIFIED",
    metadata: { post_id: postId, note_added: true },
  });

  revalidatePath(`/dashboard/post/${postId}`);
}
