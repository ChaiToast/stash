import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicPostCard } from "@/components/public-post-card";
import type { PostRow } from "@/lib/library";
import type { PostCategory } from "@stash/types";

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const supabase = await createClient();

  const { data: owner } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!owner) notFound();

  const { data: collection } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", owner.id)
    .eq("share_slug", slug)
    .eq("is_public", true)
    .single();

  if (!collection) notFound();

  const { data: links } = await supabase
    .from("collection_posts")
    .select("post_id")
    .eq("collection_id", collection.id);

  const postIds = links?.map((link: { post_id: string }) => link.post_id) ?? [];

  const { data: postsData } = postIds.length
    ? await supabase.from("posts").select("*").in("id", postIds)
    : { data: [] as PostRow[] };

  const posts = (postsData ?? []) as PostRow[];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-sm text-primary">STASH public collection</p>
          <h1 className="mt-2 text-3xl font-bold">{collection.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Curated by @{owner.username}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PublicPostCard
              key={post.id}
              post={{
                title: post.title,
                category: post.category as PostCategory,
                confidence: post.confidence,
                thumbnail_url: post.thumbnail_url,
                source_account: post.source_account,
                ig_url: post.ig_url,
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
