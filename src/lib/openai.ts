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
    // Use relative URL for client-side calls (works in both dev and prod)
    const url = "/api/copilot";
    
    console.log("[OpenAI] Calling copilot API...", { url });
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    console.log("[OpenAI] Response received:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("[OpenAI] API error:", error);
      throw new Error(error.error || "Failed to get copilot response");
    }

    const data = await response.json();
    console.log("[OpenAI] Response content received");
    return data.content;
  } catch (error) {
    console.error("[OpenAI] Call failed:", error);
    throw error;
  }
}

