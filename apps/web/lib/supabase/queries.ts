import type { PostRow, UserRow } from "@/lib/library";

type AppClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createClient>
>;

export async function fetchUserProfile(
  client: AppClient,
  userId: string,
): Promise<UserRow | null> {
  const { data, error } = await client
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UserRow;
}

export async function fetchUserPosts(
  client: AppClient,
  userId: string,
): Promise<PostRow[]> {
  const { data, error } = await client
    .from("posts")
    .select("*")
    .eq("user_id", userId);

  if (error || !data) {
    return [];
  }

  return data as PostRow[];
}

export async function fetchUserPlan(
  client: AppClient,
  userId: string,
): Promise<UserRow["plan"] | null> {
  const profile = await fetchUserProfile(client, userId);
  return profile?.plan ?? null;
}
