import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPosts, fetchUserProfile } from "@/lib/supabase/queries";
import { ExportHub } from "@/components/export-hub";
import { getPlanLimits } from "@/lib/plans";

export default async function ExportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, posts] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchUserPosts(supabase, user.id),
  ]);

  return (
    <ExportHub
      posts={posts}
      exportsEnabled={Boolean(profile && getPlanLimits(profile.plan).exports)}
    />
  );
}
