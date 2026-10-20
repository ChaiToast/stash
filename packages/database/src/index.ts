import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "./database.types";

export type { Database };
export type {
  ActivityAction,
  PostCategory,
  UserPlan,
} from "@stash/types";
export {
  ACTIVITY_ACTIONS,
  POST_CATEGORIES,
  USER_PLANS,
} from "@stash/types";
export type DbClient = SupabaseClient<Database>;

export function createBrowserClient(
  supabaseUrl: string,
  supabaseAnonKey: string
): DbClient {
  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export function createServerClient(
  supabaseUrl: string,
  supabaseServiceKey: string
): DbClient {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Log an activity event for the current user */
export async function logActivity(
  client: DbClient,
  userId: string,
  action: string,
  metadata: Record<string, unknown> = {},
) {
  return client.from("activity_log").insert({
    user_id: userId,
    action,
    metadata: metadata as Json,
  });
}

/** Upsert posts by (user_id, ig_url) for idempotent syncs */
export async function upsertPosts(
  client: DbClient,
  posts: Database["public"]["Tables"]["posts"]["Insert"][]
) {
  return client
    .from("posts")
    .upsert(posts, { onConflict: "user_id,ig_url", ignoreDuplicates: false });
}

/** Full-text search across a user's posts */
export async function searchPosts(
  client: DbClient,
  userId: string,
  query: string,
  options?: { category?: string; limit?: number }
) {
  let q = client
    .from("posts")
    .select("*")
    .eq("user_id", userId)
    .textSearch("title", query, { type: "websearch", config: "english" });

  if (options?.category) {
    q = q.eq("category", options.category as Database["public"]["Enums"]["post_category"]);
  }

  return q.limit(options?.limit ?? 50);
}

/** Category stats for dashboard cards */
export async function getCategoryStats(client: DbClient, userId: string) {
  const { data, error } = await client
    .from("posts")
    .select("category, is_done")
    .eq("user_id", userId);

  if (error) throw error;

  const stats = new Map<
    string,
    { total: number; done: number }
  >();

  for (const row of data ?? []) {
    const current = stats.get(row.category) ?? { total: 0, done: 0 };
    current.total += 1;
    if (row.is_done) current.done += 1;
    stats.set(row.category, current);
  }

  return stats;
}
