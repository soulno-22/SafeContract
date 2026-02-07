"use client";

import { useEffect, useRef, useState } from "react";
import type { AuditResult, Vulnerability } from "@/lib/schema";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Seed conversation with vulnerability when user clicks "Explain in chat"
  useEffect(() => {
    if (seedVulnerability && auditResult) {
      const seedMessage = `Explain this vulnerability: ${seedVulnerability.title}. Why is it dangerous and how can I fix it?`;
      setInput(seedMessage);
      // Auto-submit after a brief delay
      setTimeout(() => {
        const fakeEvent = {
          preventDefault: () => {},
        } as React.FormEvent;
        handleSubmit(fakeEvent, seedMessage);
        onVulnerabilitySeeded?.();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedVulnerability]);

  const handleSubmit = async (
    e: React.FormEvent,
    overrideMessage?: string
  ) => {
    e.preventDefault();
    if (!auditResult) return;

    const userMessage = (overrideMessage || input.trim()).trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setIsLoading(true);

    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);

    // Simulate AI response delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate contextual response based on audit results
    let response = "";
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("reentrancy")) {
      const reentrancyVuln = auditResult.vulnerabilities.find(
        (v) => v.title.toLowerCase().includes("reentrancy")
      );
      if (reentrancyVuln) {
        response = `Reentrancy attacks are dangerous because they allow an attacker to recursively call a function before the previous call completes. This can drain funds from a contract.\n\n**Fix:** ${reentrancyVuln.suggestedFix}\n\n**Code location:** Line ${reentrancyVuln.codeContext.lineStart || "N/A"}`;
      } else {
        response =
          "Reentrancy attacks occur when external calls are made before state updates. Use the ReentrancyGuard pattern from OpenZeppelin or follow the checks-effects-interactions pattern.";
      }
    } else if (lowerMessage.includes("fix") || lowerMessage.includes("how")) {
      const firstVuln = auditResult.vulnerabilities[0];
      if (firstVuln) {
        response = `To fix **${firstVuln.title}**:\n\n${firstVuln.suggestedFix}\n\nThis is a ${firstVuln.severity}-severity issue that ${firstVuln.description}`;
      } else {
        response =
          "Review the suggested fixes in the vulnerability cards above for detailed remediation steps.";
      }
    } else if (lowerMessage.includes("risk") || lowerMessage.includes("score")) {
      response = `The risk score of **${auditResult.riskScore}/100** (${auditResult.riskLevel}) is calculated based on the number and severity of vulnerabilities found:\n\n- Critical issues: +30 points each\n- High issues: +20 points each\n- Medium issues: +10 points each\n- Low issues: +5 points each\n\nYour contract has ${auditResult.metrics.criticalCount} critical, ${auditResult.metrics.highCount} high, ${auditResult.metrics.mediumCount} medium, and ${auditResult.metrics.lowCount} low severity issues.`;
    } else if (
      lowerMessage.includes("vulnerability") ||
      lowerMessage.includes("issue")
    ) {
      const criticalVulns = auditResult.vulnerabilities.filter(
        (v) => v.severity === "critical" || v.severity === "high"
      );
      if (criticalVulns.length > 0) {
        response = `I found **${auditResult.vulnerabilities.length}** potential vulnerability/vulnerabilities. The most critical ones are:\n\n${criticalVulns
          .map((v, i) => `${i + 1}. **${v.title}** (${v.severity}) - ${v.description}`)
          .join("\n\n")}\n\nCheck the vulnerability cards above for detailed fixes.`;
      } else {
        response = `I found ${auditResult.vulnerabilities.length} issue(s) in your contract. While none are critical, it's still important to address them before deployment.`;
      }
    } else if (lowerMessage.includes("explain") && seedVulnerability) {
      response = `**${seedVulnerability.title}**\n\n${seedVulnerability.description}\n\n**Why it's dangerous:** This is a ${seedVulnerability.severity}-severity issue that could lead to ${seedVulnerability.severity === "critical" || seedVulnerability.severity === "high" ? "significant financial loss or contract compromise" : "potential security weaknesses"}.\n\n**How to fix:** ${seedVulnerability.suggestedFix}`;
    } else {
      response = `Based on the audit results, your contract has a **${auditResult.riskLevel}** risk level with **${auditResult.vulnerabilities.length}** issue(s) detected.\n\nI can help you:\n- Explain specific vulnerabilities in detail\n- Suggest fixes and best practices\n- Clarify the risk assessment\n- Provide code examples for secure patterns\n\nWhat would you like to know more about?`;
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: response },
    ]);
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
    "Why is this contract high risk?",
    "How can I fix the reentrancy issues?",
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
            placeholder="Ask about vulnerabilities, fixes, or best practices..."
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
