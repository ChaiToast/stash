"use client";

import { useMemo, useState } from "react";
import type { PostCategory } from "@stash/types";
import { DashboardShell } from "@/components/dashboard-shell";
import { PostCard } from "@/components/stash-cards";
import { filterPosts, type PostRow } from "@/lib/library";
import { Input } from "@/components/ui/input";

export function SearchView({ posts }: { posts: PostRow[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(
    () => filterPosts(posts, { query, filter: "newest" }),
    [posts, query],
  );

  return (
    <DashboardShell
      title="Search Your Library"
      subtitle="Search titles, captions, tags, notes, and categories."
      active="/dashboard/search"
    >
      <Input
        placeholder="Search everything you've saved..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-6 max-w-xl"
      />

      <p className="mb-4 text-sm text-muted-foreground">
        {results.length} result{results.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {results.map((post) => (
          <PostCard
            key={post.id}
            post={{
              id: post.id,
              title: post.title,
              category: post.category as PostCategory,
              confidence: post.confidence,
              thumbnail_url: post.thumbnail_url,
              is_done: post.is_done,
              source_account: post.source_account,
            }}
          />
        ))}
      </div>
    </DashboardShell>
  );
}
