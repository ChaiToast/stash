import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard-shell";
import { PostDetail } from "@/components/post-detail";
import { getCategoryMeta } from "@/lib/categories";
import type { PostCategory } from "@stash/types";

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!post) notFound();

  const meta = getCategoryMeta(post.category as PostCategory);

  return (
    <DashboardShell
      title={post.title ?? "Untitled save"}
      subtitle={meta.vaultLabel}
      active={`/dashboard/category/${meta.slug}`}
    >
      <PostDetail post={post} />
    </DashboardShell>
  );
}
