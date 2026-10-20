"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ChromeRuntime = {
  sendMessage: (
    extensionId: string,
    message: unknown,
    callback?: (response: unknown) => void,
  ) => void;
  lastError?: { message?: string };
};

function getChromeRuntime(): ChromeRuntime | undefined {
  return (window as Window & { chrome?: { runtime?: ChromeRuntime } }).chrome
    ?.runtime;
}

export function ConnectExtension({ userId }: { userId: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [sessionPreview, setSessionPreview] = useState<string>("");

  useEffect(() => {
    async function loadSession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        setSessionPreview(`${session.access_token.slice(0, 24)}...`);
      }
    }
    void loadSession();
  }, []);

  async function connectExtension() {
    const extensionId = process.env.NEXT_PUBLIC_EXTENSION_ID;
    if (!extensionId) {
      setStatus("Set NEXT_PUBLIC_EXTENSION_ID in apps/web/.env.local");
      return;
    }

    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setStatus("Sign in again to refresh your session.");
      return;
    }

    const runtime = getChromeRuntime();
    if (!runtime?.sendMessage) {
      setStatus(
        "Open this page in Chrome with the STASH extension installed.",
      );
      return;
    }

    runtime.sendMessage(
      extensionId,
      {
        type: "SAVE_AUTH",
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        supabaseAccessToken: session.access_token,
        userId,
      },
      (response) => {
        const error = getChromeRuntime()?.lastError?.message;
        if (error) {
          setStatus(error);
          return;
        }

        const result = response as { ok?: boolean };
        setStatus(
          result?.ok
            ? "Extension connected. Open Instagram Saved and start syncing."
            : "Could not connect extension.",
        );
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect extension</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          One click sends your Supabase session to the STASH Chrome extension so
          sync uploads work automatically.
        </p>
        {sessionPreview ? (
          <p className="rounded-lg bg-secondary p-3 font-mono text-xs">
            Session: {sessionPreview}
          </p>
        ) : null}
        <Button onClick={connectExtension}>Connect STASH Extension</Button>
        {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      </CardContent>
    </Card>
  );
}
