"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { UserPlan } from "@stash/types";
import { createClient } from "@/lib/supabase/server";

export async function upgradePlan(plan: UserPlan) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (plan === "free") {
    return;
  }

  await supabase.from("users").update({ plan }).eq("id", user.id);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}
