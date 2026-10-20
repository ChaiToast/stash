import {
  DEFAULT_STORAGE,
  type ExtensionStorage,
  type SyncStatus,
} from "./constants";

export async function getStorage(): Promise<ExtensionStorage> {
  const result = await chrome.storage.local.get(null);
  return { ...DEFAULT_STORAGE, ...result } as ExtensionStorage;
}

export async function patchStorage(
  patch: Partial<ExtensionStorage>,
): Promise<ExtensionStorage> {
  const current = await getStorage();
  const next = { ...current, ...patch };
  await chrome.storage.local.set(next);
  return next;
}

export async function setSyncStatus(
  syncStatus: SyncStatus,
  extra: Partial<ExtensionStorage> = {},
): Promise<void> {
  await patchStorage({ syncStatus, ...extra });
}

export function isSavedPageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "www.instagram.com" &&
      /\/[^/]+\/saved/.test(parsed.pathname)
    );
  } catch {
    return false;
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizePostUrl(href: string): string | null {
  try {
    const url = new URL(href, "https://www.instagram.com");
    if (!url.pathname.includes("/p/") && !url.pathname.includes("/reel/")) {
      return null;
    }
    return `${url.origin}${url.pathname}`.replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function dedupePosts<T extends { post_url: string }>(posts: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const post of posts) {
    if (seen.has(post.post_url)) {
      continue;
    }
    seen.add(post.post_url);
    result.push(post);
  }

  return result;
}
