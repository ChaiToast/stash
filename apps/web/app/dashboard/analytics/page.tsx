import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPosts, fetchUserProfile } from "@/lib/supabase/queries";
import { computeLibraryStats } from "@/lib/library";
import { DashboardShell } from "@/components/dashboard-shell";
import { StreakBadge } from "@/components/stash-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, posts] = await Promise.all([
    fetchUserProfile(supabase, user.id),
    fetchUserPosts(supabase, user.id),
  ]);

  const stats = computeLibraryStats(posts, profile!, null);

  return (
    <DashboardShell
      title="Library Analytics"
      subtitle="Progress visibility across Your Library."
      active="/dashboard/analytics"
    >
      <div className="mb-6">
        <StreakBadge streakDays={stats.streakDays} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total posts", value: stats.totalPosts },
          {
            label: "Completion",
            value: `${formatPercent(stats.donePosts, stats.totalPosts)}%`,
          },
          { label: "Categories explored", value: stats.categoriesExplored },
          { label: "Weekly wins", value: stats.weeklyWins },
        ].map((item) => (
          <Card key={item.label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-4">
        {stats.categoryStats
          .filter((stat) => stat.total > 0)
          .map((stat) => (
            <Card key={stat.category}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{stat.category.replace("_", " ")}</p>
                  <p className="text-sm text-muted-foreground">
                    {stat.done} / {stat.total} completed
                  </p>
                </div>
                <ProgressBar value={formatPercent(stat.done, stat.total)} />
              </CardContent>
            </Card>
          ))}
      </div>
    </DashboardShell>
  );
}
