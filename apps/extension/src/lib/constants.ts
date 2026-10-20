import type { ScrapedPost } from "@stash/types";

export type SyncStatus =
  | "idle"
  | "scraping"
  | "uploading"
  | "classifying"
  | "complete"
  | "error";

export type ExtensionStorage = {
  lastSyncCount: number;
  lastSyncDate: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  scrapeProgress: {
    found: number;
    scrolls: number;
  };
  uploadProgress: {
    sent: number;
    total: number;
  };
  supabaseUrl: string | null;
  supabaseAccessToken: string | null;
  userId: string | null;
  dashboardUrl: string;
};

export type Message =
  | { type: "START_SCRAPE" }
  | { type: "SYNC_STARTED" }
  | { type: "SCRAPE_PROGRESS"; found: number; scrolls: number }
  | { type: "POSTS_SCRAPED"; posts: ScrapedPost[] }
  | { type: "GET_SYNC_STATE" }
  | { type: "SAVE_AUTH"; supabaseUrl: string; supabaseAccessToken: string; userId: string }
  | { type: "RESET_SYNC" };

export type MessageResponse =
  | { ok: true; state?: ExtensionStorage }
  | { ok: false; error: string };

export const DEFAULT_STORAGE: ExtensionStorage = {
  lastSyncCount: 0,
  lastSyncDate: null,
  syncStatus: "idle",
  syncError: null,
  scrapeProgress: { found: 0, scrolls: 0 },
  uploadProgress: { sent: 0, total: 0 },
  supabaseUrl: null,
  supabaseAccessToken: null,
  userId: null,
  dashboardUrl: "http://127.0.0.1:3000",
};

export const BATCH_SIZE = 15;
export const SCROLL_DELAY_MS = 1200;
export const SCROLL_JITTER_MS = 200;
export const MAX_UNCHANGED_SCROLLS = 2;

export const DEFAULT_SUPABASE_URL = "http://127.0.0.1:54321";
