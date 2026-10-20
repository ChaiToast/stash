import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { PostCategory } from "@stash/types";

export function PublicPostCard({
  post,
}: {
  post: {
    title: string | null;
    category: PostCategory;
    confidence: number;
    thumbnail_url: string | null;
    source_account: string | null;
    ig_url: string;
  };
}) {
  return (
    <Card className="overflow-hidden">
      {post.thumbnail_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.thumbnail_url}
          alt=""
          className="h-36 w-full object-cover"
        />
      ) : (
        <div className="flex h-36 items-center justify-center bg-secondary text-sm text-muted-foreground">
          No preview
        </div>
      )}
      <CardContent className="space-y-2 p-4">
        <Badge>{post.category.replace("_", " ")}</Badge>
        <h3 className="line-clamp-2 font-semibold">
          {post.title ?? "Untitled save"}
        </h3>
        <a
          href={post.ig_url}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-primary"
        >
          View on Instagram
        </a>
      </CardContent>
    </Card>
  );
}
