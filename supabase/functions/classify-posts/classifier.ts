import {
  buildClassificationUserPrompt,
  CLAUDE_HAIKU_MODEL,
  CLASSIFICATION_SYSTEM_PROMPT,
  extractJsonPayload,
  fallbackClassificationResults,
  normalizeClassificationResponse,
  type ClassificationInputPost,
  type ClassificationResult,
} from "../_shared/classify.ts";

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
};

export async function classifyPostsWithClaude(
  posts: ClassificationInputPost[],
): Promise<ClassificationResult[]> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const userPrompt = buildClassificationUserPrompt(posts);

  const callModel = async (repair = false) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: CLAUDE_HAIKU_MODEL,
        max_tokens: 8192,
        temperature: 0,
        system: CLASSIFICATION_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: repair
              ? `${userPrompt}\n\nYour previous answer was invalid JSON. Return ONLY the JSON object.`
              : userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Anthropic API error (${response.status}): ${body}`);
    }

    const payload = (await response.json()) as AnthropicResponse;
    const text = payload.content?.find((part) => part.type === "text")?.text;

    if (!text) {
      throw new Error("Anthropic response did not include text content.");
    }

    return text;
  };

  try {
    const text = await callModel(false);
    const raw = extractJsonPayload(text);
    return normalizeClassificationResponse(raw, posts.length);
  } catch (firstError) {
    console.error("[classify-posts] first classification attempt failed", firstError);

    try {
      const text = await callModel(true);
      const raw = extractJsonPayload(text);
      return normalizeClassificationResponse(raw, posts.length);
    } catch (secondError) {
      console.error("[classify-posts] retry classification failed", secondError);
      return fallbackClassificationResults(posts.length);
    }
  }
}
