"use client";

import { useEffect, useRef, useState } from "react";
import type { AuditResult } from "@/lib/schema";

interface TamboChatProps {
  auditResult: AuditResult | null;
  originalCode: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function TamboChat({
  auditResult,
  originalCode,
}: TamboChatProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !auditResult) return;

    const userMessage = input.trim();
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
        response = `Reentrancy attacks are dangerous because they allow an attacker to recursively call a function before the previous call completes. This can drain funds from a contract. ${reentrancyVuln.suggestedFix}`;
      } else {
        response =
          "Reentrancy attacks occur when external calls are made before state updates. Use the ReentrancyGuard pattern from OpenZeppelin or follow the checks-effects-interactions pattern.";
      }
    } else if (lowerMessage.includes("fix") || lowerMessage.includes("how")) {
      const firstVuln = auditResult.vulnerabilities[0];
      if (firstVuln) {
        response = `To fix "${firstVuln.title}": ${firstVuln.suggestedFix}`;
      } else {
        response = "Review the suggested fixes in the vulnerability cards above for detailed remediation steps.";
      }
    } else if (lowerMessage.includes("risk") || lowerMessage.includes("score")) {
      response = `The risk score of ${auditResult.riskScore}/100 (${auditResult.riskLevel}) is calculated based on the number and severity of vulnerabilities found. Critical issues add 30 points, high add 20, medium add 10, and low add 5 points each.`;
    } else if (lowerMessage.includes("vulnerability") || lowerMessage.includes("issue")) {
      response = `I found ${auditResult.vulnerabilities.length} potential vulnerability/vulnerabilities. The most critical ones are: ${auditResult.vulnerabilities
        .filter((v) => v.severity === "critical" || v.severity === "high")
        .map((v) => v.title)
        .join(", ")}. Check the vulnerability cards above for details.`;
    } else {
      response = `Based on the audit results, your contract has a ${auditResult.riskLevel} risk level with ${auditResult.vulnerabilities.length} issue(s) detected. I can help explain specific vulnerabilities, suggest fixes, or clarify the risk assessment. What would you like to know more about?`;
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: response },
    ]);
    setIsLoading(false);
  };

  if (!auditResult) {
    return (
      <div className="p-6 text-center text-gray-500 border border-gray-200 rounded-lg">
        Run an audit to start chatting about the results
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border border-gray-200 rounded-lg bg-white">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="font-semibold text-gray-900">Ask AI About This Audit</h3>
        <p className="text-xs text-gray-600 mt-1">
          Get explanations, code examples, and best practices
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-medium">Suggested questions:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Why is this reentrancy issue dangerous?</li>
              <li>Show me a safe pattern for this function</li>
              <li>How can I fix the access control vulnerability?</li>
              <li>Explain the risk score calculation</li>
            </ul>
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
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="text-sm text-gray-600">Thinking...</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about vulnerabilities, fixes, or best practices..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
          >
            Ask
          </button>
        </div>
      </form>
    </div>
  );
}

