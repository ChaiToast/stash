"use client";

import Link from "next/link";
import type { PostCategory } from "@stash/types";
import { getCategoryMeta } from "@/lib/categories";
import { cn, formatPercent, isGemPost } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/badge";

export type CategoryCardData = {
  category: PostCategory;
  total: number;
  done: number;
  newSinceVisit: number;
  locked?: boolean;
};

export function CategoryCard({ data }: { data: CategoryCardData }) {
  const meta = getCategoryMeta(data.category);
  const Icon = meta.icon;
  const progress = formatPercent(data.done, data.total);

  return (
    <Link href={data.locked ? "/dashboard/settings" : `/dashboard/category/${meta.slug}`}>
      <Card
        className={cn(
          "transition hover:border-primary/50",
          data.locked && "opacity-60",
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            {data.newSinceVisit > 0 ? (
              <Badge className="bg-primary/20 text-primary">
                +{data.newSinceVisit} new
              </Badge>
            ) : null}
          </div>
          <CardTitle>{meta.vaultLabel}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-end justify-between">
            <span className="text-3xl font-bold">{data.total}</span>
            <span className="text-sm text-muted-foreground">
              {data.done} done
            </span>
          </div>
          <ProgressBar value={progress} />
          <p className="text-xs text-muted-foreground">
            {progress}% completed
            {data.locked ? " · Upgrade to unlock" : ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function PostCard({
  post,
}: {
  post: {
    id: string;
    title: string | null;
    category: PostCategory;
    confidence: number;
    thumbnail_url: string | null;
    is_done: boolean;
    source_account: string | null;
  };
}) {
  const gem = isGemPost(post.confidence, post.category);

  return (
    <Link href={`/dashboard/post/${post.id}`}>
      <Card className={cn("overflow-hidden transition hover:border-primary/50", gem && "gem-glow")}>
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt=""
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="flex h-36 items-center justify-center bg-secondary text-sm text-muted-foreground">
            No preview
          </div>
        )}
        <CardContent className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge>{post.category.replace("_", " ")}</Badge>
            {gem ? <span className="text-xs text-primary">Gem Save ✨</span> : null}
          </div>
          <h3 className="line-clamp-2 font-semibold">
            {post.title ?? "Untitled save"}
          </h3>
          <p className="text-xs text-muted-foreground">
            {post.source_account ? `@${post.source_account}` : "Instagram"}
            {post.is_done ? " · Done" : ""}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ZeigarnikBanner({ unsortedCount }: { unsortedCount: number }) {
  if (unsortedCount <= 0) return null;

  return (
    <Card className="border-primary/30 bg-primary/10">
      <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">
            {unsortedCount} unsorted saves waiting
          </p>
          <p className="text-sm text-muted-foreground">
            Open Your Unsorted Saves and turn passive bookmarks into progress.
          </p>
        </div>
        <Link
          href="/dashboard/category/unsorted"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Sort now
        </Link>
      </CardContent>
    </Card>
  );
}

export function StreakBadge({ streakDays }: { streakDays: number }) {
  return (
    <Badge className="bg-orange-500/15 text-orange-300">
      🔥 {streakDays} day streak
    </Badge>
  );
}
