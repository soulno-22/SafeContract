"use client";

import { useState } from "react";
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
          <label
            htmlFor="input-type"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Input Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="input-type"
                value="solidity"
                checked={inputType === "solidity"}
                onChange={() => setInputType("solidity")}
                className="mr-2"
              />
              <span className="text-sm">Solidity Code</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="input-type"
                value="address"
                checked={inputType === "address"}
                onChange={() => setInputType("address")}
                className="mr-2"
                disabled
              />
              <span className="text-sm text-gray-400">Contract Address (Coming Soon)</span>
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="code-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {inputType === "solidity" ? "Solidity Code" : "Contract Address"}
          </label>
          <textarea
            id="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={
              inputType === "solidity"
                ? "// Paste your Solidity contract code here\npragma solidity ^0.8.0;\n\ncontract MyContract {\n    // ...\n}"
                : "0x..."
            }
            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-gray-500">
            {inputType === "solidity"
              ? "Paste your complete Solidity contract code for analysis"
              : "Enter a valid Ethereum contract address (0x...)"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "Analyzing..." : "Run Audit"}
        </button>
      </form>
    </div>
  );
}

