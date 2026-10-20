"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { PostCategory } from "@stash/types";
import { DashboardShell } from "@/components/dashboard-shell";
import { PostCard } from "@/components/stash-cards";
import { categoryFromSlug, getCategoryMeta } from "@/lib/categories";
import { filterPosts, type PostRow } from "@/lib/library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CategoryView({
  slug,
  posts,
  locked,
}: {
  slug: string;
  posts: PostRow[];
  locked: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = categoryFromSlug(slug);

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const filter = (searchParams.get("filter") as
    | "newest"
    | "oldest"
    | "done"
    | "undone"
    | null) ?? "newest";

  const meta = category ? getCategoryMeta(category) : null;

  const filtered = useMemo(
    () =>
      filterPosts(posts, {
        category: category ?? undefined,
        query,
        filter,
      }),
    [posts, category, query, filter],
  );

  if (!category || !meta) {
    return <p>Category not found.</p>;
  }

  function setFilter(next: typeof filter) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("filter", next);
    router.replace(`?${params.toString()}`);
  }

  if (locked) {
    return (
      <DashboardShell
        title={meta.vaultLabel}
        subtitle="Upgrade to unlock this category on the Free plan."
        active={`/dashboard/category/${slug}`}
      >
        <Button onClick={() => router.push("/dashboard/settings")}>
          View upgrade options
        </Button>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={meta.vaultLabel}
      subtitle={`${filtered.length} saves · ${meta.description}`}
      active={`/dashboard/category/${slug}`}
    >
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Input
          placeholder={`Search inside ${meta.label.toLowerCase()}...`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="max-w-md"
        />
        <div className="flex flex-wrap gap-2">
          {(["newest", "oldest", "done", "undone"] as const).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={filter === item ? "default" : "secondary"}
              onClick={() => setFilter(item)}
            >
              {item}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">No saves in this category yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post) => (
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
      )}
    </DashboardShell>
  );
}
