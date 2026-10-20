"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPlan } from "@/lib/supabase/queries";
import { getPlanLimits } from "@/lib/plans";

export async function createCollection(name: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const plan = await fetchUserPlan(supabase, user.id);

  if (!plan || !getPlanLimits(plan).collections) {
    return { message: "Collections require Lifetime Solo or Pro." };
  }

  const cleanSlug = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");

  const { error } = await supabase.from("collections").insert({
    user_id: user.id,
    name: name.trim(),
    is_public: true,
    share_slug: cleanSlug || null,
  });

  revalidatePath("/dashboard/collections");

  return {
    message: error ? error.message : "Collection created.",
  };
}
