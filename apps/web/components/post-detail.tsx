"use client";

import Link from "next/link";
import type { PostCategory } from "@stash/types";
import { getCategoryMeta } from "@/lib/categories";
import { isGemPost } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PostRow } from "@/lib/library";
import { markPostDone, savePostNotes } from "@/app/dashboard/post/actions";

function StructuredSection({ post }: { post: PostRow }) {
  const data = (post.structured_data ?? {}) as Record<string, unknown>;

  if (post.category === "RECIPE") {
    const ingredients = (data.ingredients as string[]) ?? [];
    const steps = (data.steps as string[]) ?? [];
    return (
      <div className="space-y-4">
        {ingredients.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Ingredients</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ingredients.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" />
                  {item}
                </label>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {steps.length ? (
          <Card>
            <CardHeader>
              <CardTitle>Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, index) => (
                <p key={step} className="text-sm">
                  {index + 1}. {step}
                </p>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  if (post.category === "WORKOUT") {
    const exercises = (data.exercises as string[]) ?? [];
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground">
                <th className="pb-2">Exercise</th>
                <th className="pb-2">Sets</th>
                <th className="pb-2">Reps</th>
              </tr>
            </thead>
            <tbody>
              {exercises.map((exercise) => (
                <tr key={exercise} className="border-t border-border">
                  <td className="py-2">{exercise}</td>
                  <td className="py-2">—</td>
                  <td className="py-2">—</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    );
  }

  if (post.category === "BOOK") {
    return (
      <Card>
        <CardContent className="space-y-2 p-6 text-sm">
          <p>
            <strong>Author:</strong> {String(data.author ?? "Unknown")}
          </p>
          <p>
            <strong>Genre:</strong> {String(data.genre ?? "Unknown")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (post.category === "TRAVEL") {
    const highlights = (data.highlights as string[]) ?? [];
    return (
      <Card>
        <CardContent className="space-y-2 p-6 text-sm">
          <p>
            <strong>Location:</strong> {String(data.location ?? "Unknown")}
          </p>
          {highlights.length ? (
            <ul className="list-disc pl-5">
              {highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 text-sm text-muted-foreground">
        Structured details will appear here once classified.
      </CardContent>
    </Card>
  );
}

export function PostDetail({ post }: { post: PostRow }) {
  const meta = getCategoryMeta(post.category as PostCategory);
  const gem = isGemPost(post.confidence, post.category);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt=""
            className="max-h-96 w-full rounded-xl object-cover"
          />
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge>{meta.label}</Badge>
          {gem ? <Badge className="bg-primary/20 text-primary">Gem Save ✨</Badge> : null}
          {post.is_done ? <Badge className="bg-green-500/15 text-green-300">Done</Badge> : null}
        </div>

        <div>
          <h2 className="text-3xl font-bold">{post.title ?? "Untitled save"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {post.source_account ? `@${post.source_account}` : "Instagram"} ·{" "}
            {Math.round(post.confidence * 100)}% confidence
          </p>
        </div>

        {post.caption ? (
          <Card>
            <CardHeader>
              <CardTitle>Caption</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {post.caption}
            </CardContent>
          </Card>
        ) : null}

        <StructuredSection post={post} />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <form action={markPostDone.bind(null, post.id, !post.is_done)}>
              <Button type="submit" className="w-full">
                {post.is_done ? "Mark undone" : "Mark done"}
              </Button>
            </form>
            <Link href={post.ig_url} target="_blank">
              <Button variant="secondary" className="w-full">
                View on Instagram
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your notes</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={savePostNotes.bind(null, post.id)} className="space-y-3">
              <textarea
                name="notes"
                defaultValue={post.notes ?? ""}
                className="min-h-32 w-full rounded-lg border border-border bg-background p-3 text-sm"
              />
              <Button type="submit" variant="secondary">
                Save notes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
