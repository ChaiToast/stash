"use client";

import { useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { postsToCsv, type PostRow } from "@/lib/library";
import { downloadFile } from "@/lib/utils";
import { triggerExport } from "@/app/dashboard/export/actions";

export function ExportHub({
  posts,
  exportsEnabled,
}: {
  posts: PostRow[];
  exportsEnabled: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);

  async function handleExport(type: "csv" | "json") {
    if (!exportsEnabled) {
      setMessage("Exports require Lifetime Solo or Pro.");
      return;
    }

    await triggerExport(type);

    if (type === "csv") {
      downloadFile(
        "stash-library.csv",
        postsToCsv(posts),
        "text/csv;charset=utf-8",
      );
    } else {
      downloadFile(
        "stash-library.json",
        JSON.stringify(posts, null, 2),
        "application/json",
      );
    }

    setMessage(`${type.toUpperCase()} export downloaded.`);
  }

  return (
    <DashboardShell
      title="Export Hub"
      subtitle="Take Your Library anywhere."
      active="/dashboard/export"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {[
          {
            title: "CSV",
            body: "Spreadsheet-friendly export of Your Library.",
            action: () => handleExport("csv"),
          },
          {
            title: "JSON",
            body: "Full structured export including classification data.",
            action: () => handleExport("json"),
          },
          {
            title: "Notion",
            body: "Coming soon — sync collections to Notion.",
            action: () => setMessage("Notion export arrives in a future release."),
          },
          {
            title: "Google Sheets",
            body: "Coming soon — one-click Sheets sync.",
            action: () =>
              setMessage("Google Sheets export arrives in a future release."),
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle>{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{item.body}</p>
              <Button
                variant="secondary"
                onClick={item.action}
                disabled={!exportsEnabled && item.title !== "Notion" && item.title !== "Google Sheets"}
              >
                Export
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {!exportsEnabled ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Upgrade to Lifetime Solo to unlock CSV and JSON exports.
        </p>
      ) : null}

      {message ? (
        <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      ) : null}
    </DashboardShell>
  );
}
