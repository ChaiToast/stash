import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { ConnectExtension } from "@/components/connect-extension";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PLAN_PRICING, planLabel } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { fetchUserProfile } from "@/lib/supabase/queries";
import { upgradePlan } from "@/app/dashboard/settings/actions";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await fetchUserProfile(supabase, user.id);

  return (
    <DashboardShell
      title="Settings"
      subtitle="Manage Your Library, extension connection, and plan."
      active="/dashboard/settings"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ConnectExtension userId={user.id} />

        <Card>
          <CardHeader>
            <CardTitle>Your plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">
              {planLabel(profile?.plan ?? "free")}
            </p>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Lifetime Solo — ${PLAN_PRICING.lifetime_solo.earlyBird} early bird
                / ${PLAN_PRICING.lifetime_solo.standard} standard
              </p>
              <p>Pro — ${PLAN_PRICING.pro.standard}/mo features incl. API access</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={upgradePlan.bind(null, "lifetime_solo")}>
                <Button type="submit" variant="secondary">
                  Upgrade to Lifetime Solo
                </Button>
              </form>
              <form action={upgradePlan.bind(null, "pro")}>
                <Button type="submit">Upgrade to Pro</Button>
              </form>
            </div>
            <p className="text-xs text-muted-foreground">
              Demo upgrades apply instantly for local testing. Stripe billing
              can be wired in production.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
