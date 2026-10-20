import type { Database } from "@stash/database";
import type { PostCategory } from "@stash/types";
import { DASHBOARD_CATEGORIES } from "@/lib/categories";
import { canAccessCategory, getPlanLimits } from "@/lib/plans";

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type UserRow = Database["public"]["Tables"]["users"]["Row"];

export type LibraryStats = {
  totalPosts: number;
  donePosts: number;
  unsortedCount: number;
  streakDays: number;
  categoriesExplored: number;
  weeklyWins: number;
  categoryStats: Array<{
    category: PostCategory;
    total: number;
    done: number;
    newSinceVisit: number;
    locked: boolean;
  }>;
};

export function computeLibraryStats(
  posts: PostRow[],
  user: UserRow,
  lastVisit: string | null,
): LibraryStats {
  const limits = getPlanLimits(user.plan);
  const lastVisitTime = lastVisit
    ? new Date(lastVisit).getTime()
    : Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const byCategory = new Map<PostCategory, { total: number; done: number; newSinceVisit: number }>();

  for (const category of DASHBOARD_CATEGORIES) {
    byCategory.set(category, { total: 0, done: 0, newSinceVisit: 0 });
  }
  byCategory.set("UNCATEGORIZED", { total: 0, done: 0, newSinceVisit: 0 });

  let donePosts = 0;
  let weeklyWins = 0;

  for (const post of posts) {
    const bucket = byCategory.get(post.category) ?? {
      total: 0,
      done: 0,
      newSinceVisit: 0,
    };
    bucket.total += 1;
    if (post.is_done) {
      bucket.done += 1;
      donePosts += 1;
      if (new Date(post.updated_at).getTime() >= weekAgo) {
        weeklyWins += 1;
      }
    }
    if (new Date(post.synced_at).getTime() > lastVisitTime) {
      bucket.newSinceVisit += 1;
    }
    byCategory.set(post.category, bucket);
  }

  const categoryStats = [...byCategory.entries()].map(([category, stats], index) => ({
    category,
    ...stats,
    locked:
      limits.maxCategories !== null &&
      category !== "UNCATEGORIZED" &&
      !canAccessCategory(
        user.plan,
        DASHBOARD_CATEGORIES.indexOf(
          category as (typeof DASHBOARD_CATEGORIES)[number],
        ),
      ),
  }));

  const categoriesExplored = categoryStats.filter(
    (stat) => stat.category !== "UNCATEGORIZED" && stat.total > 0,
  ).length;

  return {
    totalPosts: posts.length,
    donePosts,
    unsortedCount: byCategory.get("UNCATEGORIZED")?.total ?? 0,
    streakDays: user.streak_days,
    categoriesExplored,
    weeklyWins,
    categoryStats,
  };
}

export function filterPosts(
  posts: PostRow[],
  options: {
    category?: PostCategory;
    query?: string;
    filter?: "newest" | "oldest" | "done" | "undone";
    tag?: string;
  },
): PostRow[] {
  let filtered = [...posts];

  if (options.category) {
    filtered = filtered.filter((post) => post.category === options.category);
  }

  if (options.filter === "done") {
    filtered = filtered.filter((post) => post.is_done);
  } else if (options.filter === "undone") {
    filtered = filtered.filter((post) => !post.is_done);
  }

  if (options.tag) {
    filtered = filtered.filter((post) => post.tags.includes(options.tag!));
  }

  if (options.query) {
    const q = options.query.toLowerCase();
    filtered = filtered.filter(
      (post) =>
        post.title?.toLowerCase().includes(q) ||
        post.caption?.toLowerCase().includes(q) ||
        post.notes?.toLowerCase().includes(q) ||
        post.tags.some((tag) => tag.toLowerCase().includes(q)) ||
        post.category.toLowerCase().includes(q),
    );
  }

  filtered.sort((a, b) => {
    const aTime = new Date(a.synced_at).getTime();
    const bTime = new Date(b.synced_at).getTime();
    return options.filter === "oldest" ? aTime - bTime : bTime - aTime;
  });

  return filtered;
}

export function postsToCsv(posts: PostRow[]): string {
  const headers = [
    "id",
    "title",
    "category",
    "confidence",
    "is_done",
    "ig_url",
    "source_account",
    "caption",
    "notes",
    "tags",
    "synced_at",
  ];

  const rows = posts.map((post) =>
    [
      post.id,
      post.title,
      post.category,
      post.confidence,
      post.is_done,
      post.ig_url,
      post.source_account,
      post.caption,
      post.notes,
      post.tags.join("|"),
      post.synced_at,
    ]
      .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}
