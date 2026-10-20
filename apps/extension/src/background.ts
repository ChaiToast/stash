import type { ScrapedPost } from "@stash/types";
import {
  BATCH_SIZE,
  DEFAULT_SUPABASE_URL,
  type Message,
} from "./lib/constants";
import { getStorage, patchStorage, setSyncStatus } from "./lib/storage";

function mapPostForApi(post: ScrapedPost) {
  return {
    ig_url: post.post_url,
    caption: post.caption,
    image_alt: post.image_alt,
    thumbnail_url: post.thumbnail_url,
    source_account: post.account_name,
    collection_name: post.collection_name,
    ig_saved_at: post.saved_at,
  };
}

async function uploadPosts(posts: ScrapedPost[]): Promise<void> {
  const storage = await getStorage();
  const supabaseUrl = storage.supabaseUrl ?? DEFAULT_SUPABASE_URL;
  const { supabaseAccessToken, userId } = storage;

  if (!supabaseAccessToken || !userId) {
    throw new Error(
      "Connect your STASH account in the popup before uploading.",
    );
  }

  await setSyncStatus("uploading", {
    syncError: null,
    uploadProgress: { sent: 0, total: posts.length },
  });

  for (let index = 0; index < posts.length; index += BATCH_SIZE) {
    const batch = posts.slice(index, index + BATCH_SIZE);

    const response = await fetch(`${supabaseUrl}/functions/v1/classify-posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAccessToken}`,
      },
      body: JSON.stringify({
        user_id: userId,
        posts: batch.map(mapPostForApi),
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Upload failed with status ${response.status}`);
    }

    await patchStorage({
      uploadProgress: {
        sent: Math.min(index + batch.length, posts.length),
        total: posts.length,
      },
    });
  }

  await setSyncStatus("classifying");

  await patchStorage({
    syncStatus: "complete",
    lastSyncCount: posts.length,
    lastSyncDate: new Date().toISOString(),
    syncError: null,
    uploadProgress: { sent: posts.length, total: posts.length },
  });
}

async function handlePostsScraped(posts: ScrapedPost[]): Promise<void> {
  if (posts.length === 0) {
    await setSyncStatus("error", {
      syncError: "No saved posts found on this page.",
    });
    return;
  }

  try {
    await uploadPosts(posts);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Upload failed.";
    await setSyncStatus("error", { syncError: errorMessage });
  }
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  switch (message.type) {
    case "SYNC_STARTED":
      void setSyncStatus("scraping", {
        syncError: null,
        scrapeProgress: { found: 0, scrolls: 0 },
        uploadProgress: { sent: 0, total: 0 },
      });
      sendResponse({ ok: true });
      return false;

    case "SCRAPE_PROGRESS":
      void patchStorage({
        scrapeProgress: {
          found: message.found,
          scrolls: message.scrolls,
        },
      });
      sendResponse({ ok: true });
      return false;

    case "POSTS_SCRAPED":
      void handlePostsScraped(message.posts);
      sendResponse({ ok: true });
      return false;

    case "GET_SYNC_STATE":
      void getStorage().then((state) => {
        sendResponse({ ok: true, state });
      });
      return true;

    case "SAVE_AUTH":
      void patchStorage({
        supabaseUrl: message.supabaseUrl,
        supabaseAccessToken: message.supabaseAccessToken,
        userId: message.userId,
        syncError: null,
      }).then((state) => {
        sendResponse({ ok: true, state });
      });
      return true;

    case "RESET_SYNC":
      void patchStorage({
        syncStatus: "idle",
        syncError: null,
        scrapeProgress: { found: 0, scrolls: 0 },
        uploadProgress: { sent: 0, total: 0 },
      }).then((state) => {
        sendResponse({ ok: true, state });
      });
      return true;

    default:
      return false;
  }
});

console.info("[STASH] background service worker ready");

function handleSaveAuth(message: Extract<Message, { type: "SAVE_AUTH" }>) {
  return patchStorage({
    supabaseUrl: message.supabaseUrl,
    supabaseAccessToken: message.supabaseAccessToken,
    userId: message.userId,
    syncError: null,
  });
}

chrome.runtime.onMessageExternal.addListener(
  (message: Message, _sender, sendResponse) => {
    if (message.type === "SAVE_AUTH") {
      void handleSaveAuth(message).then((state) => {
        sendResponse({ ok: true, state });
      });
      return true;
    }

    if (message.type === "GET_SYNC_STATE") {
      void getStorage().then((state) => {
        sendResponse({ ok: true, state });
      });
      return true;
    }

    return false;
  },
);
