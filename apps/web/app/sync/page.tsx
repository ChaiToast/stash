import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { fetchUserPosts, fetchUserProfile } from "@/lib/supabase/queries";
import { computeLibraryStats } from "@/lib/library";
import { DashboardShell } from "@/components/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/badge";
import { formatPercent } from "@/lib/utils";
import { ConnectExtension } from "@/components/connect-extension";

export default async function SyncPage() {
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
  const completion = formatPercent(stats.donePosts, stats.totalPosts);

  return (
    <DashboardShell
      title="Sync Your Saves"
      subtitle="Connect the extension, open Instagram Saved, and build Your Library."
      active="/sync"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sync status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-secondary p-4">
              <p className="text-3xl font-bold">{stats.totalPosts}</p>
              <p className="text-sm text-muted-foreground">posts in Your Library</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Building your library</span>
                <span>{completion}% complete</span>
              </div>
              <ProgressBar value={completion} />
            </div>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Connect the STASH extension below</li>
              <li>2. Open instagram.com/yourname/saved</li>
              <li>3. Click Start Sync in the extension popup</li>
            </ol>
            <Link
              href="https://www.instagram.com/"
              className="inline-block text-sm font-semibold text-primary"
            >
              Open Instagram →
            </Link>
          </CardContent>
        </Card>

        <ConnectExtension userId={user.id} />
      </div>
    </DashboardShell>
  );
}
