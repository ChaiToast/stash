import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CollectionsView } from "@/components/collections-view";
import { fetchUserProfile } from "@/lib/supabase/queries";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, collectionsResult] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    supabase.from("collections").select("*").eq("user_id", user.id),
  ]);

  const collections = collectionsResult.data ?? [];

  return (
    <CollectionsView
      collections={collections}
      username={profile?.username ?? "user"}
      enabled={profile?.plan !== "free"}
    />
  );
}
