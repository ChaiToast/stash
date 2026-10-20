import { Suspense } from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryView } from "@/components/category-view";
import { categoryFromSlug, DASHBOARD_CATEGORIES } from "@/lib/categories";
import { canAccessCategory, getPlanLimits } from "@/lib/plans";
import { fetchUserProfile } from "@/lib/supabase/queries";
import type { PostRow } from "@/lib/library";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categoryFromSlug(slug);
  if (!category) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, postsResult] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    supabase
      .from("posts")
      .select("*")
      .eq("user_id", user.id)
      .eq("category", category),
  ]);

  const profileData = profile;
  const posts = (postsResult.data ?? []) as PostRow[];

  const categoryIndex = DASHBOARD_CATEGORIES.indexOf(
    category as (typeof DASHBOARD_CATEGORIES)[number],
  );
  const locked =
    profileData &&
    getPlanLimits(profileData.plan).maxCategories !== null &&
    category !== "UNCATEGORIZED" &&
    !canAccessCategory(profileData.plan, categoryIndex);

  return (
    <Suspense fallback={<div className="p-8">Loading category...</div>}>
      <CategoryView slug={slug} posts={posts ?? []} locked={Boolean(locked)} />
    </Suspense>
  );
}
