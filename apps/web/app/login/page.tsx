"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DEMO_USER, isDemoMode } from "@/lib/demo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithMagicLink(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);
    setMessage(
      error
        ? error.message
        : "Check your email for a magic link to open Your Library.",
    );
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function signInWithDemo() {
    setLoading(true);
    setMessage(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: DEMO_USER.email,
      password: DEMO_USER.password,
    });

    setLoading(false);

    if (error) {
      setMessage(
        `${error.message} — run npm run db:reset locally to load demo data.`,
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Link href="/" className="text-sm text-primary">
            STASH
          </Link>
          <CardTitle className="mt-2">Sign in to Your Library</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDemoMode ? (
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-semibold">Try the demo library</p>
              <p className="mt-1 text-xs text-muted-foreground">
                27 pre-classified saves across every category. No Instagram
                required.
              </p>
              <Button
                type="button"
                className="mt-3 w-full"
                onClick={signInWithDemo}
                disabled={loading}
              >
                Open demo as demo@stash.app
              </Button>
            </div>
          ) : null}

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={signInWithGoogle}
          >
            Continue with Google
          </Button>

          <div className="relative py-2 text-center text-xs text-muted-foreground">
            or use email magic link
          </div>

          <form onSubmit={signInWithMagicLink} className="space-y-3">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send magic link"}
            </Button>
          </form>

          {message ? (
            <p className="text-sm text-muted-foreground">{message}</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
