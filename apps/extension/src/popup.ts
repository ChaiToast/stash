import {
  DEFAULT_SUPABASE_URL,
  type ExtensionStorage,
  type Message,
  type SyncStatus,
} from "./lib/constants";
import { isSavedPageUrl } from "./lib/storage";

const syncStatusEl = document.getElementById("sync-status")!;
const postsFoundEl = document.getElementById("posts-found")!;
const progressLabelEl = document.getElementById("progress-label")!;
const progressPercentEl = document.getElementById("progress-percent")!;
const progressBarEl = document.getElementById("progress-bar")!;
const syncMessageEl = document.getElementById("sync-message")!;
const syncErrorEl = document.getElementById("sync-error")!;
const lastSyncEl = document.getElementById("last-sync")!;
const syncButton = document.getElementById("sync-button") as HTMLButtonElement;
const dashboardButton = document.getElementById(
  "dashboard-button",
) as HTMLButtonElement;
const saveAuthButton = document.getElementById(
  "save-auth-button",
) as HTMLButtonElement;
const supabaseUrlInput = document.getElementById(
  "supabase-url",
) as HTMLInputElement;
const userIdInput = document.getElementById("user-id") as HTMLInputElement;
const accessTokenInput = document.getElementById(
  "access-token",
) as HTMLInputElement;

const STATUS_LABELS: Record<SyncStatus, string> = {
  idle: "Idle",
  scraping: "Scraping",
  uploading: "Uploading",
  classifying: "Classifying",
  complete: "Complete",
  error: "Error",
};

function formatLastSync(date: string | null): string {
  if (!date) {
    return "Never synced";
  }

  return `Last sync: ${new Date(date).toLocaleString()}`;
}

function getProgress(state: ExtensionStorage): number {
  switch (state.syncStatus) {
    case "idle":
      return 0;
    case "scraping":
      return Math.min(35, Math.max(8, state.scrapeProgress.scrolls * 4));
    case "uploading":
      if (state.uploadProgress.total === 0) {
        return 45;
      }
      return (
        40 +
        (state.uploadProgress.sent / state.uploadProgress.total) * 45
      );
    case "classifying":
      return 92;
    case "complete":
      return 100;
    case "error":
      return 0;
    default:
      return 0;
  }
}

function getProgressLabel(state: ExtensionStorage): string {
  switch (state.syncStatus) {
    case "idle":
      return "Ready to sync";
    case "scraping":
      return `Reading saved posts (${state.scrapeProgress.found} found)...`;
    case "uploading":
      return `Uploading batch ${state.uploadProgress.sent}/${state.uploadProgress.total}...`;
    case "classifying":
      return "Classifying with AI...";
    case "complete":
      return "Sync complete";
    case "error":
      return "Sync failed";
    default:
      return "Ready to sync";
  }
}

function renderState(state: ExtensionStorage): void {
  syncStatusEl.textContent = STATUS_LABELS[state.syncStatus];
  syncStatusEl.className = `status-pill status-${state.syncStatus}`;

  const foundCount =
    state.syncStatus === "complete"
      ? state.lastSyncCount
      : state.scrapeProgress.found;

  postsFoundEl.textContent = String(foundCount);

  const progress = getProgress(state);
  progressBarEl.style.width = `${progress}%`;
  progressPercentEl.textContent = `${Math.round(progress)}%`;
  progressLabelEl.textContent = getProgressLabel(state);

  syncMessageEl.textContent =
    state.syncStatus === "complete"
      ? `${state.lastSyncCount} posts synced to your library.`
      : state.syncStatus === "scraping"
        ? "Scrolling Instagram Saved to load every post..."
        : state.syncStatus === "uploading"
          ? "Sending posts to STASH in batches..."
          : state.syncStatus === "classifying"
            ? "Building your library..."
            : "Open Instagram Saved, then start a sync.";

  if (state.syncError) {
    syncErrorEl.textContent = state.syncError;
    syncErrorEl.classList.remove("hidden");
  } else {
    syncErrorEl.textContent = "";
    syncErrorEl.classList.add("hidden");
  }

  lastSyncEl.textContent = formatLastSync(state.lastSyncDate);

  const busy = ["scraping", "uploading", "classifying"].includes(
    state.syncStatus,
  );
  syncButton.disabled = busy;
  syncButton.textContent = busy ? "Syncing..." : "Start Sync";

  supabaseUrlInput.value = state.supabaseUrl ?? DEFAULT_SUPABASE_URL;
  userIdInput.value = state.userId ?? "";
  accessTokenInput.value = state.supabaseAccessToken ?? "";
}

async function loadState(): Promise<ExtensionStorage> {
  const response = (await chrome.runtime.sendMessage({
    type: "GET_SYNC_STATE",
  })) as { ok: boolean; state?: ExtensionStorage };

  if (!response.ok || !response.state) {
    throw new Error("Could not load sync state.");
  }

  return response.state;
}

async function refresh(): Promise<void> {
  const state = await loadState();
  renderState(state);
}

async function getActiveTabUrl(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab?.url ?? null;
}

syncButton.addEventListener("click", async () => {
  const tabUrl = await getActiveTabUrl();

  if (!tabUrl || !isSavedPageUrl(tabUrl)) {
    syncErrorEl.textContent =
      "Open instagram.com/yourname/saved before starting a sync.";
    syncErrorEl.classList.remove("hidden");
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    return;
  }

  syncButton.disabled = true;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: "START_SCRAPE",
    } satisfies Message);

    if (!response?.ok) {
      throw new Error(response?.error ?? "Could not start scrape.");
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not reach the Instagram page. Refresh the Saved tab and try again.";
    syncErrorEl.textContent = message;
    syncErrorEl.classList.remove("hidden");
    syncButton.disabled = false;
  }
});

dashboardButton.addEventListener("click", async () => {
  const state = await loadState();
  await chrome.tabs.create({ url: state.dashboardUrl });
});

saveAuthButton.addEventListener("click", async () => {
  const supabaseUrl = supabaseUrlInput.value.trim() || DEFAULT_SUPABASE_URL;
  const userId = userIdInput.value.trim();
  const supabaseAccessToken = accessTokenInput.value.trim();

  if (!userId || !supabaseAccessToken) {
    syncErrorEl.textContent = "User ID and access token are required.";
    syncErrorEl.classList.remove("hidden");
    return;
  }

  await chrome.runtime.sendMessage({
    type: "SAVE_AUTH",
    supabaseUrl,
    supabaseAccessToken,
    userId,
  } satisfies Message);

  syncErrorEl.classList.add("hidden");
  await refresh();
});

chrome.storage.onChanged.addListener((_changes, areaName) => {
  if (areaName === "local") {
    void refresh();
  }
});

void refresh();
