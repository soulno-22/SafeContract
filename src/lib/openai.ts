export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CopilotRequest {
  systemPrompt: string;
  contextMessage: string;
  userMessage: string;
  conversationHistory: ChatMessage[];
}

/**
 * Call OpenAI API for copilot responses via API route
 * Uses environment variable: OPENAI_API_KEY
 */
export async function callOpenAiForCopilot(
  request: CopilotRequest
): Promise<string> {
  try {
    const response = await fetch("/api/copilot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get copilot response");
    }

    const data = await response.json();
    return data.content;
  } catch (error) {
    console.error("OpenAI call failed:", error);
    throw error;
  }
}

