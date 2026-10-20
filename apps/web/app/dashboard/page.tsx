import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPosts, fetchUserProfile } from "@/lib/supabase/queries";
import { computeLibraryStats } from "@/lib/library";
import { DashboardShell } from "@/components/dashboard-shell";
import {
  CategoryCard,
  StreakBadge,
  ZeigarnikBanner,
} from "@/components/stash-cards";
import { DASHBOARD_CATEGORIES } from "@/lib/categories";
import { getPlanLimits, planLabel } from "@/lib/plans";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [profile, posts] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchUserPosts(supabase, user.id),
  ]);

  if (!profile) redirect("/login");

  const stats = computeLibraryStats(posts, profile, null);
  const limits = getPlanLimits(profile.plan);

  const visibleCategories = stats.categoryStats.filter((stat) =>
    DASHBOARD_CATEGORIES.includes(stat.category as typeof DASHBOARD_CATEGORIES[number]),
  );

  return (
    <DashboardShell
      title="Your Library"
      subtitle={`${stats.totalPosts} saves organized across your life categories · ${planLabel(profile.plan)} plan`}
      active="/dashboard"
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StreakBadge streakDays={stats.streakDays} />
        {limits.maxPosts ? (
          <span className="text-sm text-muted-foreground">
            {stats.totalPosts}/{limits.maxPosts} posts on Free
          </span>
        ) : null}
      </div>

      <div className="mb-8">
        <ZeigarnikBanner unsortedCount={stats.unsortedCount} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCategories.map((stat) => (
          <CategoryCard key={stat.category} data={stat} />
        ))}
      </div>

      {profile.plan === "free" ? (
        <Card className="mt-8 border-primary/30">
          <CardContent className="p-6">
            <p className="font-semibold">Upgrade Your Library</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Free includes 300 posts and 5 categories. Lifetime Solo unlocks
              unlimited imports, exports, and collections.
            </p>
            <a
              href="/dashboard/settings"
              className="mt-4 inline-block text-sm font-semibold text-primary"
            >
              View plans →
            </a>
          </CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}
