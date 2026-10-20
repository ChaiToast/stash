import type { ScrapedPost } from "@stash/types";
import {
  BATCH_SIZE,
  DEFAULT_SUPABASE_URL,
  MAX_UNCHANGED_SCROLLS,
  SCROLL_DELAY_MS,
  SCROLL_JITTER_MS,
  type Message,
} from "./lib/constants";
import {
  dedupePosts,
  getStorage,
  normalizePostUrl,
  patchStorage,
  setSyncStatus,
  sleep,
} from "./lib/storage";

function isSavedPage(): boolean {
  return /instagram\.com\/[^/]+\/saved/.test(window.location.href);
}

function getCollectionName(): string | null {
  const collectionMatch = window.location.pathname.match(
    /\/saved\/([^/]+)\/?$/,
  );
  if (collectionMatch?.[1]) {
    return decodeURIComponent(collectionMatch[1].replace(/-/g, " "));
  }

  const header = document.querySelector("header h1, main h1, h1");
  const text = header?.textContent?.trim();
  if (text && text.toLowerCase() !== "saved") {
    return text;
  }

  return null;
}

function countPostLinks(): number {
  return document.querySelectorAll(
    'a[href*="/p/"], a[href*="/reel/"]',
  ).length;
}

async function scrollUntilComplete(
  onProgress: (found: number, scrolls: number) => void,
): Promise<void> {
  let unchangedScrolls = 0;
  let lastCount = countPostLinks();
  let scrolls = 0;

  onProgress(lastCount, scrolls);

  while (unchangedScrolls < MAX_UNCHANGED_SCROLLS) {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: "smooth",
    });

    const jitter = Math.floor(Math.random() * SCROLL_JITTER_MS);
    await sleep(SCROLL_DELAY_MS + jitter);
    scrolls += 1;

    const currentCount = countPostLinks();
    onProgress(currentCount, scrolls);

    if (currentCount === lastCount) {
      unchangedScrolls += 1;
    } else {
      unchangedScrolls = 0;
      lastCount = currentCount;
    }
  }
}

function extractAccountName(link: HTMLAnchorElement): string | null {
  const href = link.getAttribute("href");
  if (!href) {
    return null;
  }

  const match = href.match(/^\/([^/]+)\/(p|reel)\//);
  if (match?.[1] && match[1] !== "p" && match[1] !== "reel") {
    return match[1];
  }

  const label = link.getAttribute("aria-label");
  if (label) {
    const accountMatch = label.match(/^([^'"]+)/);
    if (accountMatch?.[1]) {
      return accountMatch[1].trim();
    }
  }

  return null;
}

function extractSavedAt(container: Element | null): string | null {
  if (!container) {
    return null;
  }

  const timeElement = container.querySelector("time");
  const datetime = timeElement?.getAttribute("datetime");
  return datetime ?? null;
}

function extractPosts(): ScrapedPost[] {
  const collectionName = getCollectionName();
  const posts: ScrapedPost[] = [];
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'a[href*="/p/"], a[href*="/reel/"]',
  );

  for (const link of Array.from(links)) {
    const href = link.getAttribute("href");
    if (!href) {
      continue;
    }

    const postUrl = normalizePostUrl(href);
    if (!postUrl) {
      continue;
    }

    const container =
      link.closest("article") ??
      link.closest('[role="presentation"]') ??
      link.parentElement;

    const image =
      link.querySelector("img") ??
      container?.querySelector("img") ??
      null;

    posts.push({
      post_url: postUrl,
      caption: image?.alt?.trim() || null,
      image_alt: image?.alt?.trim() || null,
      thumbnail_url: image?.src || null,
      account_name: extractAccountName(link),
      collection_name: collectionName,
      saved_at: extractSavedAt(container),
    });
  }

  return dedupePosts(posts);
}

async function runScrape(): Promise<ScrapedPost[]> {
  if (!isSavedPage()) {
    throw new Error("Open an Instagram Saved page before syncing.");
  }

  await chrome.runtime.sendMessage({ type: "SYNC_STARTED" });

  await scrollUntilComplete((found, scrolls) => {
    void chrome.runtime.sendMessage({
      type: "SCRAPE_PROGRESS",
      found,
      scrolls,
    });
  });

  const posts = extractPosts();

  await chrome.runtime.sendMessage({
    type: "POSTS_SCRAPED",
    posts,
  });

  return posts;
}

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type !== "START_SCRAPE") {
    return false;
  }

  runScrape()
    .then((posts) => {
      sendResponse({ ok: true, count: posts.length });
    })
    .catch((error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : "Scrape failed.";
      void setSyncStatus("error", { syncError: errorMessage });
      sendResponse({ ok: false, error: errorMessage });
    });

  return true;
});

console.info("[STASH] content script ready on saved page");
