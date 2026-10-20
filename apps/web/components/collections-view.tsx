"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createCollection } from "@/app/dashboard/collections/actions";

type CollectionRow = {
  id: string;
  name: string;
  is_public: boolean;
  share_slug: string | null;
};

export function CollectionsView({
  collections,
  username,
  enabled,
}: {
  collections: CollectionRow[];
  username: string;
  enabled: boolean;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function handleCreate() {
    if (!enabled) {
      setMessage("Collections require Lifetime Solo or Pro.");
      return;
    }

    const result = await createCollection(name, slug);
    setMessage(result.message);
    setName("");
    setSlug("");
  }

  return (
    <DashboardShell
      title="Your Collections"
      subtitle="Curate public share pages from Your Library."
      active="/dashboard/collections"
    >
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Create collection</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Collection name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            placeholder="share-slug"
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
          />
          <Button onClick={handleCreate}>Create</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {collections.map((collection) => (
          <Card key={collection.id}>
            <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{collection.name}</p>
                <p className="text-sm text-muted-foreground">
                  {collection.is_public && collection.share_slug
                    ? `/u/${username}/${collection.share_slug}`
                    : "Private collection"}
                </p>
              </div>
              {collection.is_public && collection.share_slug ? (
                <Link
                  href={`/u/${username}/${collection.share_slug}`}
                  className="text-sm font-semibold text-primary"
                >
                  View public page
                </Link>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
    </DashboardShell>
  );
}
