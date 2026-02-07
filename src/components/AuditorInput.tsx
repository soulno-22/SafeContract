"use client";

import { useState, useEffect, useRef } from "react";
import type { AuditRequest } from "@/lib/schema";

interface AuditorInputProps {
  onSubmit: (request: AuditRequest) => void;
  isLoading?: boolean;
}

export default function AuditorInput({
  onSubmit,
  isLoading = false,
}: AuditorInputProps) {
  const [code, setCode] = useState("");
  const [inputType, setInputType] = useState<"solidity" | "address">(
    "solidity"
  );
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keyboard shortcut: Ctrl/Cmd + Enter to submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "Enter" &&
        textareaRef.current === document.activeElement
      ) {
        e.preventDefault();
        if (!isLoading && code.trim()) {
          const fakeEvent = {
            preventDefault: () => {},
          } as React.FormEvent;
          handleSubmit(fakeEvent);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!code.trim()) {
      setError("Please enter Solidity code or a contract address");
      return;
    }

    // Basic validation for address format (0x followed by 40 hex chars)
    if (inputType === "address") {
      const addressPattern = /^0x[a-fA-F0-9]{40}$/;
      if (!addressPattern.test(code.trim())) {
        setError("Invalid Ethereum address format");
        return;
      }
    }

    onSubmit({
      code: code.trim(),
      inputType,
    });
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex gap-4 mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="input-type"
                value="solidity"
                checked={inputType === "solidity"}
                onChange={() => setInputType("solidity")}
                className="w-4 h-4 text-cyan-400 bg-slate-900 border-slate-700 focus:ring-cyan-400/60 focus:ring-2"
                disabled={isLoading}
              />
              <span className="text-sm text-slate-300">Paste Solidity</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer opacity-50">
              <input
                type="radio"
                name="input-type"
                value="address"
                checked={inputType === "address"}
                onChange={() => setInputType("address")}
                className="w-4 h-4 text-cyan-400 bg-slate-900 border-slate-700"
                disabled
              />
              <span className="text-sm text-slate-400">
                Paste address (coming soon)
              </span>
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="code-input"
            className="block text-xs font-mono text-slate-500 mb-2"
          >
            Solidity source code
          </label>
          <textarea
            id="code-input"
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="// Paste your Solidity contract code here\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    // ...\n}"
            className="w-full h-64 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/60 focus:border-cyan-400/60 transition resize-y disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <p className="mt-2 text-xs text-slate-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs">
              {navigator.platform.includes("Mac") ? "Cmd" : "Ctrl"}
            </kbd>{" "}
            + <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-xs">Enter</kbd> to run audit
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all duration-150 shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Run AI audit</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
