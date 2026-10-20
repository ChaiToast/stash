import type { PostCategory } from "@stash/types";

export type ClassifyPostsRequestPost = {
  ig_url: string;
  caption?: string | null;
  image_alt?: string | null;
  thumbnail_url?: string | null;
  source_account?: string | null;
  collection_name?: string | null;
  ig_saved_at?: string | null;
};

export type ClassifyPostsRequest = {
  user_id: string;
  posts: ClassifyPostsRequestPost[];
};

export type ClassifyPostsResult = {
  ig_url: string;
  category: PostCategory;
  confidence: number;
  title: string;
  inserted: boolean;
};

export type ClassifyPostsResponse = {
  ok: boolean;
  processed: number;
  classified: number;
  uncategorized: number;
  results: ClassifyPostsResult[];
  error?: string;
};
