// Keep in sync with packages/prompts/src/classify.ts (Deno-compatible copy).

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

export const CONFIDENCE_THRESHOLD = 0.6;
export const CLAUDE_HAIKU_MODEL = "claude-3-5-haiku-20241022";

export const CLASSIFICATION_SYSTEM_PROMPT = `You classify Instagram saved posts for STASH, a personal library product.

Return ONLY valid JSON. No markdown fences, no commentary.

Output shape:
{
  "results": [
    {
      "index": 0,
      "category": "RECIPE",
      "confidence": 0.91,
      "title": "Short descriptive title",
      "data": {}
    }
  ]
}

Allowed categories (exact strings):
${POST_CATEGORIES.join(", ")}

Category data schemas:
- RECIPE: { "ingredients": string[], "steps": string[], "cook_time": string, "cuisine": string }
- WORKOUT: { "exercises": string[], "muscle_group": string, "duration": string }
- BOOK: { "author": string, "genre": string }
- MOVIE: { "platform": string, "year": string }
- SHOW: { "platform": string, "genre": string }
- LIFE_ADVICE: { "theme": string, "takeaway": string }
- PRODUCT: { "brand": string, "product_type": string, "use_case": string }
- TRAVEL: { "location": string, "highlights": string[] }
- AESTHETIC: { "style": string, "mood": string }
- UNCATEGORIZED: {}

Rules:
1. Use caption, image alt text, account name, and URL context.
2. confidence is 0.0 to 1.0 reflecting classification certainty.
3. If confidence would be below 0.6, set category to UNCATEGORIZED, confidence to the raw score, and data to {}.
4. title should be concise and useful in a personal library (max 120 chars).
5. Preserve one result per input index, in order.
6. Never invent facts that are not reasonably implied by the post text.`;

export type ClassificationInputPost = {
  ig_url: string;
  caption?: string | null;
  image_alt?: string | null;
  thumbnail_url?: string | null;
  source_account?: string | null;
  collection_name?: string | null;
  ig_saved_at?: string | null;
};

export type ClassificationResult = {
  index: number;
  category: PostCategory;
  confidence: number;
  title: string;
  data: Record<string, unknown>;
};

export type ClassificationResponse = {
  results: ClassificationResult[];
};

export function buildClassificationUserPrompt(
  posts: ClassificationInputPost[],
): string {
  const payload = posts.map((post, index) => ({
    index,
    ig_url: post.ig_url,
    caption: post.caption ?? "",
    image_alt: post.image_alt ?? "",
    source_account: post.source_account ?? "",
    collection_name: post.collection_name ?? "",
    ig_saved_at: post.ig_saved_at ?? "",
  }));

  return `Classify each Instagram saved post below.

Posts JSON:
${JSON.stringify(payload, null, 2)}`;
}

export function isPostCategory(value: string): value is PostCategory {
  return (POST_CATEGORIES as readonly string[]).includes(value);
}

export function clampConfidence(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

export function applyConfidenceGate(
  result: ClassificationResult,
): ClassificationResult {
  const confidence = clampConfidence(result.confidence);

  if (confidence < CONFIDENCE_THRESHOLD) {
    return {
      ...result,
      confidence,
      category: "UNCATEGORIZED",
      data: {},
    };
  }

  return {
    ...result,
    confidence,
    category: isPostCategory(result.category) ? result.category : "UNCATEGORIZED",
    data: isPostCategory(result.category) ? result.data ?? {} : {},
  };
}

export function extractJsonPayload(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? trimmed;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not contain JSON.");
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

export function normalizeClassificationResponse(
  raw: unknown,
  expectedCount: number,
): ClassificationResult[] {
  if (!raw || typeof raw !== "object") {
    throw new Error("Classification response was not an object.");
  }

  const results = (raw as ClassificationResponse).results;
  if (!Array.isArray(results)) {
    throw new Error("Classification response missing results array.");
  }

  const byIndex = new Map<number, ClassificationResult>();

  for (const item of results) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const index = Number((item as ClassificationResult).index);
    if (!Number.isInteger(index) || index < 0 || index >= expectedCount) {
      continue;
    }

    const category = String((item as ClassificationResult).category ?? "UNCATEGORIZED");
    const title = String((item as ClassificationResult).title ?? "").slice(0, 120);
    const confidence = clampConfidence(Number((item as ClassificationResult).confidence));
    const data =
      (item as ClassificationResult).data && typeof (item as ClassificationResult).data === "object"
        ? ((item as ClassificationResult).data as Record<string, unknown>)
        : {};

    byIndex.set(
      index,
      applyConfidenceGate({
        index,
        category: isPostCategory(category) ? category : "UNCATEGORIZED",
        confidence,
        title: title || "Untitled save",
        data,
      }),
    );
  }

  const normalized: ClassificationResult[] = [];

  for (let index = 0; index < expectedCount; index += 1) {
    normalized.push(
      byIndex.get(index) ?? {
        index,
        category: "UNCATEGORIZED",
        confidence: 0,
        title: "Untitled save",
        data: {},
      },
    );
  }

  return normalized;
}

export function fallbackClassificationResults(
  count: number,
): ClassificationResult[] {
  return Array.from({ length: count }, (_, index) => ({
    index,
    category: "UNCATEGORIZED" as const,
    confidence: 0,
    title: "Untitled save",
    data: {},
  }));
}
