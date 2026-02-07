"use client";

import { useState } from "react";
import AuditorInput from "@/components/AuditorInput";
import TamboChat from "@/components/TamboChat";
import { analyzeContract } from "@/lib/audit";
import type { AuditRequest, AuditResult } from "@/lib/schema";

export default function Home() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [originalCode, setOriginalCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuditSubmit = async (request: AuditRequest) => {
    setIsLoading(true);
    setError(null);
    setOriginalCode(request.code);

    try {
      const result = await analyzeContract(request);
      setAuditResult(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during analysis"
      );
      setAuditResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-red-600 text-white";
      case "high":
        return "bg-orange-600 text-white";
      case "medium":
        return "bg-yellow-500 text-white";
      case "low":
        return "bg-green-600 text-white";
      default:
        return "bg-gray-600 text-white";
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">SafeContract</h1>
          <p className="text-sm text-gray-600 mt-1">
            AI-Powered Solidity Smart Contract Security Auditor
          </p>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Secure Your Smart Contracts
          </h2>
          <p className="text-gray-700 mb-1">
            Professional-grade security analysis for Solidity contracts
          </p>
          <p className="text-sm text-gray-600">
            Paste your contract code to receive instant vulnerability detection,
            risk assessment, and AI-powered explanations
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left: Input */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contract Input
            </h3>
            <AuditorInput onSubmit={handleAuditSubmit} isLoading={isLoading} />
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>

          {/* Right: Results */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Audit Results
            </h3>
            {!auditResult && !isLoading && (
              <div className="text-center py-12 text-gray-500">
                <p>Run an audit to see results here</p>
              </div>
            )}
            {isLoading && (
              <div className="text-center py-12">
                <p className="text-gray-600">Analyzing contract...</p>
              </div>
            )}
            {auditResult && (
              <div className="space-y-6">
                {/* Risk Score & Badge */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Risk Score</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {auditResult.riskScore}
                      <span className="text-lg text-gray-500">/100</span>
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-lg font-semibold text-sm ${getRiskBadgeColor(
                      auditResult.riskLevel
                    )}`}
                  >
                    {auditResult.riskLevel.toUpperCase()}
                  </span>
                </div>

                {/* Summary */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">{auditResult.summary}</p>
                </div>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Total Issues</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {auditResult.metrics.totalVulnerabilities}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Lines of Code</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {auditResult.metrics.linesOfCode}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Functions</p>
                    <p className="text-xl font-semibold text-gray-900">
                      {auditResult.metrics.functionCount}
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">Critical</p>
                    <p className="text-xl font-semibold text-red-600">
                      {auditResult.metrics.criticalCount}
                    </p>
                  </div>
                </div>

                {/* Severity Breakdown */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Severity Breakdown
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {auditResult.metrics.criticalCount > 0 && (
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium border ${getSeverityBadgeColor(
                          "critical"
                        )}`}
                      >
                        Critical: {auditResult.metrics.criticalCount}
                      </span>
                    )}
                    {auditResult.metrics.highCount > 0 && (
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium border ${getSeverityBadgeColor(
                          "high"
                        )}`}
                      >
                        High: {auditResult.metrics.highCount}
                      </span>
                    )}
                    {auditResult.metrics.mediumCount > 0 && (
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium border ${getSeverityBadgeColor(
                          "medium"
                        )}`}
                      >
                        Medium: {auditResult.metrics.mediumCount}
                      </span>
                    )}
                    {auditResult.metrics.lowCount > 0 && (
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium border ${getSeverityBadgeColor(
                          "low"
                        )}`}
                      >
                        Low: {auditResult.metrics.lowCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vulnerabilities List */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Vulnerabilities
                  </p>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {auditResult.vulnerabilities.map((vuln) => (
                      <div
                        key={vuln.id}
                        className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 text-sm">
                            {vuln.title}
                          </h4>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityBadgeColor(
                              vuln.severity
                            )}`}
                          >
                            {vuln.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">
                          {vuln.description}
                        </p>
                        {vuln.codeContext.snippet && (
                          <div className="mb-2 p-2 bg-gray-50 rounded font-mono text-xs text-gray-800">
                            <p className="text-xs text-gray-500 mb-1">
                              Line {vuln.codeContext.lineStart}
                            </p>
                            <code>{vuln.codeContext.snippet}</code>
                          </div>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs font-medium text-gray-600 mb-1">
                            Suggested Fix:
                          </p>
                          <p className="text-xs text-gray-700">
                            {vuln.suggestedFix}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            AI Chat Assistant
          </h3>
          <div className="h-96">
            <TamboChat
              auditResult={auditResult}
              originalCode={originalCode}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

