import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { classifyPostsWithClaude } from "./classifier.ts";
import type { ClassificationInputPost } from "../_shared/classify.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  user_id?: string;
  posts?: ClassificationInputPost[];
};

type ClassifyPostsResult = {
  ig_url: string;
  category: string;
  confidence: number;
  title: string;
  inserted: boolean;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function buildStructuredData(
  data: Record<string, unknown>,
  collectionName?: string | null,
): Record<string, unknown> {
  const structured = { ...data };

  if (collectionName) {
    structured._stash = {
      collection_name: collectionName,
    };
  }

  return structured;
}

function buildTags(collectionName?: string | null): string[] {
  if (!collectionName) {
    return [];
  }

  return [collectionName.toLowerCase().replace(/\s+/g, "-")];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ ok: false, error: "Missing Authorization header" }, 401);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const userId = body.user_id;
  const posts = body.posts;

  if (!userId || !Array.isArray(posts) || posts.length === 0) {
    return jsonResponse(
      { ok: false, error: "Expected user_id and a non-empty posts array" },
      400,
    );
  }

  if (posts.length > 20) {
    return jsonResponse(
      { ok: false, error: "Maximum batch size is 20 posts" },
      400,
    );
  }

  for (const post of posts) {
    if (!post?.ig_url || typeof post.ig_url !== "string") {
      return jsonResponse(
        { ok: false, error: "Each post must include ig_url" },
        400,
      );
    }
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse(
      { ok: false, error: "Supabase environment is not configured" },
      500,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return jsonResponse({ ok: false, error: "Unauthorized" }, 401);
  }

  if (user.id !== userId) {
    return jsonResponse(
      { ok: false, error: "user_id does not match authenticated user" },
      403,
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("plan, posts_synced")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return jsonResponse({ ok: false, error: "User profile not found" }, 404);
  }

  const existingUrls = new Set<string>();
  const { data: existingPosts, error: existingError } = await supabase
    .from("posts")
    .select("ig_url")
    .eq("user_id", userId)
    .in(
      "ig_url",
      posts.map((post) => post.ig_url),
    );

  if (existingError) {
    return jsonResponse({ ok: false, error: existingError.message }, 500);
  }

  for (const row of existingPosts ?? []) {
    existingUrls.add(row.ig_url);
  }

  if (profile.plan === "free") {
    const newPostCount = posts.filter((post) => !existingUrls.has(post.ig_url)).length;

    if (profile.posts_synced + newPostCount > 300) {
      return jsonResponse(
        {
          ok: false,
          error: "Free plan is limited to 300 posts. Upgrade to import more.",
        },
        403,
      );
    }
  }

  try {
    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "SYNC_STARTED",
      metadata: { batch_size: posts.length },
    });
  } catch (error) {
    console.error("[classify-posts] failed to log SYNC_STARTED", error);
  }

  let classifications;
  try {
    classifications = await classifyPostsWithClaude(posts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Classification failed";

    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "SYNC_FAILED",
      metadata: { batch_size: posts.length, error: message },
    });

    return jsonResponse({ ok: false, error: message }, 502);
  }

  const rows = posts.map((post, index) => {
    const result = classifications[index];
    return {
      user_id: userId,
      ig_url: post.ig_url,
      caption: post.caption ?? null,
      image_alt: post.image_alt ?? null,
      thumbnail_url: post.thumbnail_url ?? null,
      source_account: post.source_account ?? null,
      ig_saved_at: post.ig_saved_at ?? null,
      category: result.category,
      confidence: result.confidence,
      title: result.title,
      structured_data: buildStructuredData(result.data, post.collection_name),
      tags: buildTags(post.collection_name),
      synced_at: new Date().toISOString(),
    };
  });

  const { error: upsertError } = await supabase.from("posts").upsert(rows, {
    onConflict: "user_id,ig_url",
    ignoreDuplicates: false,
  });

  if (upsertError) {
    await supabase.from("activity_log").insert({
      user_id: userId,
      action: "SYNC_FAILED",
      metadata: {
        batch_size: posts.length,
        error: upsertError.message,
      },
    });

    return jsonResponse({ ok: false, error: upsertError.message }, 500);
  }

  await supabase
    .from("users")
    .update({ last_active: new Date().toISOString() })
    .eq("id", userId);

  const results: ClassifyPostsResult[] = rows.map((row) => ({
    ig_url: row.ig_url,
    category: row.category,
    confidence: row.confidence,
    title: row.title,
    inserted: !existingUrls.has(row.ig_url),
  }));

  const classified = results.filter((row) => row.category !== "UNCATEGORIZED").length;
  const uncategorized = results.length - classified;

  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "POST_CLASSIFIED",
    metadata: {
      batch_size: posts.length,
      classified,
      uncategorized,
      ig_urls: results.map((row) => row.ig_url),
    },
  });

  await supabase.from("activity_log").insert({
    user_id: userId,
    action: "SYNC_COMPLETE",
    metadata: {
      batch_size: posts.length,
      classified,
      uncategorized,
    },
  });

  return jsonResponse({
    ok: true,
    processed: results.length,
    classified,
    uncategorized,
    results,
  });
});
