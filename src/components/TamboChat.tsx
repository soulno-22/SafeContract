"use client";

import { useEffect, useRef, useState } from "react";
import type { AuditResult, Vulnerability } from "@/lib/schema";
import { callOpenAiForCopilot } from "@/lib/openai";

interface TamboChatProps {
  auditResult: AuditResult | null;
  originalCode: string;
  seedVulnerability?: Vulnerability | null;
  onVulnerabilitySeeded?: () => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Builds system message for AI assistant
 */
function buildSystemMessage(seedVulnerability?: Vulnerability | null): string {
  let systemMsg = `You are SafeContract Copilot, an AI smart contract security expert.

You receive:
- The Solidity contract source code
- A structured list of findings (each with name, severity, description, and location)
- The current risk score and summary

You must answer in clear, conversational English, directly addressing the user's question.
Always reference concrete findings when possible.
Use short paragraphs, avoid excessive bullet points unless the user asks.
Keep tone educational but friendly.
Do not just restate the finding; add explanation of why it is dangerous and how to mitigate it.
If the user question is vague, ask a brief clarifying question instead of guessing.`;

  if (seedVulnerability) {
    systemMsg += `\n\nFocus on explaining this specific finding: "${seedVulnerability.title}" (${seedVulnerability.severity} severity).`;
  }

  return systemMsg;
}

/**
 * Builds context message with contract and audit data
 */
function buildContextMessage(
  auditResult: AuditResult,
  originalCode: string,
  seedVulnerability?: Vulnerability | null
): string {
  // Truncate code to avoid token limits (first 50 and last 50 lines)
  const codeLines = originalCode.split("\n");
  const codePreview =
    codeLines.length > 100
      ? [
          ...codeLines.slice(0, 50),
          "\n// ... (code truncated) ...\n",
          ...codeLines.slice(-50),
        ].join("\n")
      : originalCode;

  const findingsSummary = auditResult.vulnerabilities
    .map(
      (v) =>
        `- ${v.title} (${v.severity}): ${v.description}. Location: Line ${v.codeContext.lineStart || "N/A"}. Fix: ${v.suggestedFix}`
    )
    .join("\n");

  let context = `CONTRACT AUDIT RESULTS:

Risk Score: ${auditResult.riskScore}/100 (${auditResult.riskLevel})
Summary: ${auditResult.summary}

FINDINGS:
${findingsSummary}

CONTRACT CODE (preview):
\`\`\`solidity
${codePreview}
\`\`\``;

  if (seedVulnerability) {
    context += `\n\nFOCUS FINDING:
Title: ${seedVulnerability.title}
Severity: ${seedVulnerability.severity}
Description: ${seedVulnerability.description}
Suggested Fix: ${seedVulnerability.suggestedFix}
Code Location: Line ${seedVulnerability.codeContext.lineStart || "N/A"}
${seedVulnerability.codeContext.snippet ? `Code:\n${seedVulnerability.codeContext.snippet}` : ""}`;
  }

  return context;
}

/**
 * Generate intelligent response based on user question and context
 */
function generateResponse(
  userMessage: string,
  auditResult: AuditResult,
  originalCode: string,
  seedVulnerability: Vulnerability | null,
  conversationHistory: ChatMessage[]
): string {
  const lowerMessage = userMessage.toLowerCase();
  const systemMsg = buildSystemMessage(seedVulnerability);
  const contextMsg = buildContextMessage(
    auditResult,
    originalCode,
    seedVulnerability
  );

  // If there's a seed vulnerability, focus on it
  if (seedVulnerability) {
    return `**${seedVulnerability.title}** (${seedVulnerability.severity} severity)

${seedVulnerability.description}

**Why this is dangerous:** ${
      seedVulnerability.severity === "critical" || seedVulnerability.severity === "high"
        ? "This vulnerability could lead to significant financial loss or complete contract compromise. Attackers could exploit this to drain funds, manipulate state, or gain unauthorized access."
        : "This issue could lead to unexpected behavior, potential security weaknesses, or make the contract more vulnerable to other attacks."
    }

**How to fix it:** ${seedVulnerability.suggestedFix}

${seedVulnerability.codeContext.snippet ? `**Vulnerable code (Line ${seedVulnerability.codeContext.lineStart}):**\n\`\`\`solidity\n${seedVulnerability.codeContext.snippet}\n\`\`\`` : ""}

Would you like me to explain any specific part of this vulnerability or show you a complete secure implementation?`;
  }

  // Handle specific question types with contextual responses
  if (
    lowerMessage.includes("risk") ||
    lowerMessage.includes("score") ||
    lowerMessage.includes("overall") ||
    lowerMessage.includes("summary")
  ) {
    const highSeverityCount =
      auditResult.metrics.criticalCount + auditResult.metrics.highCount;
    return `Your contract has a **${auditResult.riskLevel}** risk level with a score of **${auditResult.riskScore}/100**.

The risk score is calculated by assigning points based on severity:
- Critical issues: +30 points each
- High issues: +20 points each  
- Medium issues: +10 points each
- Low issues: +5 points each

Your contract has:
- ${auditResult.metrics.criticalCount} critical issue(s)
- ${auditResult.metrics.highCount} high-severity issue(s)
- ${auditResult.metrics.mediumCount} medium-severity issue(s)
- ${auditResult.metrics.lowCount} low-severity issue(s)

${highSeverityCount > 0 ? `⚠️ **Warning:** You have ${highSeverityCount} high or critical severity issue(s) that should be addressed before deployment.` : "✅ Your contract has no critical or high-severity issues, but review all findings before deployment."}

${auditResult.summary}`;
  }

  if (
    lowerMessage.includes("fix") ||
    lowerMessage.includes("how to") ||
    lowerMessage.includes("what should i do") ||
    lowerMessage.includes("recommendation")
  ) {
    const highSeverityVulns = auditResult.vulnerabilities.filter(
      (v) => v.severity === "critical" || v.severity === "high"
    );

    if (highSeverityVulns.length === 0) {
      return `Good news! Your contract doesn't have any critical or high-severity issues. However, I still recommend:

1. Review all ${auditResult.vulnerabilities.length} finding(s) in the Vulnerabilities tab
2. Address medium-severity issues before deployment
3. Consider a professional security audit for production contracts

Would you like me to explain any specific finding in more detail?`;
    }

    let response = `Here are the **priority fixes** for your contract's ${highSeverityVulns.length} high-severity issue(s):\n\n`;

    highSeverityVulns.forEach((vuln, idx) => {
      response += `${idx + 1}. **${vuln.title}** (${vuln.severity})\n`;
      response += `   ${vuln.suggestedFix}\n\n`;
    });

    response += `I recommend fixing these in order of severity (critical first, then high). Each fix addresses a specific security vulnerability that could be exploited.`;

    return response;
  }

  if (
    lowerMessage.includes("vulnerability") ||
    lowerMessage.includes("issue") ||
    lowerMessage.includes("problem") ||
    lowerMessage.includes("finding")
  ) {
    const criticalVulns = auditResult.vulnerabilities.filter(
      (v) => v.severity === "critical" || v.severity === "high"
    );

    if (criticalVulns.length > 0) {
      let response = `I found **${auditResult.vulnerabilities.length}** security issue(s) in your contract. Here are the most critical ones:\n\n`;

      criticalVulns.forEach((vuln, idx) => {
        response += `${idx + 1}. **${vuln.title}** (${vuln.severity})\n`;
        response += `   ${vuln.description}\n`;
        response += `   Location: Line ${vuln.codeContext.lineStart || "N/A"}\n\n`;
      });

      response += `You can click "Explain in chat" on any vulnerability card for a detailed explanation and fix.`;

      return response;
    }

    return `I found ${auditResult.vulnerabilities.length} issue(s) in your contract. While none are critical or high-severity, it's still important to review them. Check the Vulnerabilities tab for details on each finding.`;
  }

  if (
    lowerMessage.includes("reentrancy") ||
    lowerMessage.includes("reentrant")
  ) {
    const reentrancyVuln = auditResult.vulnerabilities.find(
      (v) => v.title.toLowerCase().includes("reentrancy")
    );

    if (reentrancyVuln) {
      return `**Reentrancy Vulnerability Detected**

${reentrancyVuln.description}

**Why this is dangerous:** Reentrancy attacks allow an attacker to recursively call a function before the previous call completes. In your contract, this happens because external calls are made before state is updated. An attacker could drain funds by repeatedly calling the function before the balance is set to zero.

**How to fix:** ${reentrancyVuln.suggestedFix}

**Secure pattern example:**
\`\`\`solidity
function withdraw() public nonReentrant {
    uint256 amount = balances[msg.sender];
    require(amount > 0, "No balance");
    
    // Update state FIRST
    balances[msg.sender] = 0;
    
    // Then make external call
    (bool success, ) = msg.sender.call{value: amount}("");
    require(success, "Transfer failed");
}
\`\`\`

This follows the checks-effects-interactions pattern: validate, update state, then interact externally.`;
    }

    return `Reentrancy attacks occur when external calls are made before state updates. While I didn't detect a clear reentrancy pattern in your contract, always follow the checks-effects-interactions pattern: validate inputs, update state variables, then make external calls.`;
  }

  if (
    lowerMessage.includes("code") ||
    lowerMessage.includes("where") ||
    lowerMessage.includes("line") ||
    lowerMessage.includes("function")
  ) {
    const vulnsWithCode = auditResult.vulnerabilities.filter(
      (v) => v.codeContext.snippet
    );

    if (vulnsWithCode.length > 0) {
      let response = `Here are the code locations with issues:\n\n`;

      vulnsWithCode.slice(0, 3).forEach((vuln) => {
        response += `**${vuln.title}** (Line ${vuln.codeContext.lineStart}):\n`;
        response += `\`\`\`solidity\n${vuln.codeContext.snippet}\n\`\`\`\n\n`;
      });

      if (vulnsWithCode.length > 3) {
        response += `... and ${vulnsWithCode.length - 3} more. Check the Vulnerabilities tab for all code locations.`;
      }

      return response;
    }

    return `I can help you find specific code locations. Which vulnerability would you like to see the code for? You can also check the Vulnerabilities tab where each finding shows its code context.`;
  }

  // Default contextual response
  return `Based on the audit, your contract has a **${auditResult.riskLevel}** risk level with **${auditResult.vulnerabilities.length}** finding(s).

I can help you:
- Understand why your contract is ${auditResult.riskLevel === "high" || auditResult.riskLevel === "critical" ? "risky" : "relatively secure"}
- Explain specific vulnerabilities in detail
- Show you how to fix each issue
- Provide secure code patterns
- Answer questions about smart contract security

What would you like to know more about? Try asking:
- "Why is this contract risky?"
- "How can I fix the high severity issues?"
- "Where is the reentrancy issue?"
- Or click "Explain in chat" on any vulnerability card`;
}

export default function TamboChat({
  auditResult,
  originalCode,
  seedVulnerability,
  onVulnerabilitySeeded,
}: TamboChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [currentSeedVuln, setCurrentSeedVuln] =
    useState<Vulnerability | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Seed conversation with vulnerability when user clicks "Explain in chat"
  useEffect(() => {
    if (seedVulnerability && auditResult && !currentSeedVuln) {
      setCurrentSeedVuln(seedVulnerability);
      const seedMessage = `Explain the "${seedVulnerability.title}" vulnerability in this contract and how to fix it.`;
      setInput(seedMessage);
      // Auto-submit after a brief delay
      setTimeout(() => {
        const fakeEvent = {
          preventDefault: () => {},
        } as React.FormEvent;
        handleSubmit(fakeEvent, seedMessage, seedVulnerability);
        onVulnerabilitySeeded?.();
      }, 100);
    }
  }, [seedVulnerability, auditResult, currentSeedVuln, onVulnerabilitySeeded]);

  const handleSubmit = async (
    e: React.FormEvent,
    overrideMessage?: string,
    overrideSeedVuln?: Vulnerability | null
  ) => {
    e.preventDefault();
    if (!auditResult) return;

    const userMessage = (overrideMessage || input.trim()).trim();
    if (!userMessage || isLoading) return;

    const seedVuln = overrideSeedVuln || currentSeedVuln;
    setInput("");
    setIsLoading(true);

    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    try {
      // Call OpenAI for real intelligent response
      const response = await callOpenAiForCopilot({
        systemPrompt: buildSystemMessage(seedVuln),
        contextMessage: buildContextMessage(auditResult, originalCode, seedVuln),
        userMessage: userMessage,
        conversationHistory: messages,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response },
      ]);
    } catch (error) {
      console.error("Copilot error:", error);
      // Fallback to generateResponse if OpenAI fails
      const fallback = generateResponse(
        userMessage,
        auditResult,
        originalCode,
        seedVuln,
        messages
      );
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback },
      ]);
    }

    // Clear seed vulnerability after first use
    if (seedVuln) {
      setCurrentSeedVuln(null);
    }

    setIsLoading(false);
  };

  if (!auditResult) {
    return (
      <div className="p-6 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/60">
        Run an audit to start chatting about the results
      </div>
    );
  }

  const suggestionChips = [
    "Why is this contract risky?",
    "How can I fix the high severity issues?",
    "Where are the vulnerabilities in the code?",
  ];

  return (
    <div className="flex flex-col h-full border border-slate-800 rounded-xl bg-slate-950/80">
      <div className="p-4 border-b border-slate-800 bg-slate-900/60">
        <h3 className="font-semibold text-slate-100">Tambo Copilot</h3>
        <p className="text-xs text-slate-400 mt-1">
          Ask anything about this contract's security...
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-slate-400 space-y-3">
            <p className="font-medium text-slate-300">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestionChips.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(suggestion);
                    const fakeEvent = {
                      preventDefault: () => {},
                    } as React.FormEvent;
                    handleSubmit(fakeEvent, suggestion);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-cyan-400 border border-cyan-400/30 hover:border-cyan-400/60 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all duration-150"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2.5 ${
                message.role === "user"
                  ? "bg-cyan-500/10 text-cyan-100 border border-cyan-500/20"
                  : "bg-slate-900/80 text-slate-100 border border-slate-800"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-900/80 rounded-xl px-4 py-2.5 border border-slate-800">
              <p className="text-sm text-slate-400">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={(e) => handleSubmit(e)}
        className="p-4 border-t border-slate-800 bg-slate-900/40"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl+Enter or Cmd+Enter to submit
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                const fakeEvent = {
                  preventDefault: () => {},
                } as React.FormEvent;
                handleSubmit(fakeEvent);
              }
            }}
            placeholder="Ask about vulnerabilities, fixes, or best practices... (Ctrl+Enter)"
            className="flex-1 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all duration-150 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}
