"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPlan } from "@/lib/supabase/queries";
import { getPlanLimits } from "@/lib/plans";

export async function triggerExport(type: "csv" | "json") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plan = await fetchUserPlan(supabase, user.id);

  if (!plan || !getPlanLimits(plan).exports) {
    throw new Error("Exports are not enabled on your plan.");
  }

  await supabase.from("activity_log").insert({
    user_id: user.id,
    action: "EXPORT_TRIGGERED",
    metadata: { type },
  });
}
