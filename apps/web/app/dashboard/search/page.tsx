import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPosts } from "@/lib/supabase/queries";
import { SearchView } from "@/components/search-view";

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const posts = await fetchUserPosts(supabase, user.id);

  return <SearchView posts={posts} />;
}
