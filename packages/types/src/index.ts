export const POST_CATEGORIES = [
  "RECIPE",
  "WORKOUT",
  "BOOK",
  "MOVIE",
  "SHOW",
  "LIFE_ADVICE",
  "PRODUCT",
  "TRAVEL",
  "AESTHETIC",
  "UNCATEGORIZED",
] as const;

export type PostCategory = (typeof POST_CATEGORIES)[number];

export const USER_PLANS = ["free", "lifetime_solo", "pro"] as const;
export type UserPlan = (typeof USER_PLANS)[number];

export const ACTIVITY_ACTIONS = [
  "SYNC_STARTED",
  "SYNC_COMPLETE",
  "SYNC_FAILED",
  "POST_CLASSIFIED",
  "POST_RECLASSIFIED",
  "EXPORT_TRIGGERED",
] as const;

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export type ScrapedPost = {
  caption: string | null;
  image_alt: string | null;
  post_url: string;
  collection_name: string | null;
  account_name: string | null;
  thumbnail_url: string | null;
  saved_at: string | null;
};

export type ClassifiedPost = ScrapedPost & {
  category: string;
  confidence: number;
  title: string | null;
  structured_data: Record<string, unknown>;
};

export type {
  ClassifyPostsRequest,
  ClassifyPostsRequestPost,
  ClassifyPostsResponse,
  ClassifyPostsResult,
} from "./api";
