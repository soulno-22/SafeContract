"use client";

import { useState, useEffect, useRef } from "react";
import AuditorInput from "@/components/AuditorInput";
import TamboChat from "@/components/TamboChat";
import { analyzeContract } from "@/lib/audit";
import { exampleContracts } from "@/lib/examples";
import {
  RiskOverviewCard,
  VulnerabilityList,
  CodeContextViewer,
} from "@/lib/tambo-components";
import RecommendationsTab from "@/components/RecommendationsTab";
import type { AuditRequest, AuditResult, Vulnerability } from "@/lib/schema";

type TabType = "overview" | "vulnerabilities" | "recommendations" | "tambo";

export default function Home() {
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [originalCode, setOriginalCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedVulnerability, setSelectedVulnerability] =
    useState<Vulnerability | null>(null);
  const examplesRef = useRef<HTMLDivElement>(null);

  const handleAuditSubmit = async (request: AuditRequest) => {
    setIsLoading(true);
    setError(null);
    setOriginalCode(request.code);
    setActiveTab("overview");

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

  const handleLoadExample = (code: string) => {
    handleAuditSubmit({ code, inputType: "solidity" });
    // Scroll to results
    setTimeout(() => {
      window.scrollTo({ top: 600, behavior: "smooth" });
    }, 100);
  };

  const handleExplainVulnerability = (vuln: Vulnerability) => {
    setSelectedVulnerability(vuln);
    setActiveTab("tambo");
    // This will be handled by TamboChat to seed the conversation
  };

  const scrollToExamples = () => {
    examplesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-x-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-20 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl opacity-40" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl opacity-30" />
      </div>

      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-slate-100">
                SafeContract
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-Powered Security Auditor
              </p>
            </div>
            {auditResult && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Risk:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    auditResult.riskLevel === "critical" || auditResult.riskLevel === "high"
                      ? "bg-rose-500/15 text-rose-300 border-rose-500/40"
                      : auditResult.riskLevel === "medium"
                      ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                      : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {auditResult.riskLevel.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 lg:px-6 py-10 lg:py-14">
        {/* Hero Section */}
        <section className="mb-10 lg:mb-14">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300 mb-4">
                <span>✦</span>
                <span>Built for The UI Strikes Back</span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-semibold tracking-tight text-slate-100 mb-4">
                Ship safer smart contracts with{" "}
                <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 bg-clip-text text-transparent">
                  AI‑powered audits
                </span>
              </h2>

              <p className="text-sm leading-relaxed text-slate-300 mb-6">
                SafeContract uses Tambo&apos;s Generative UI to turn Solidity into an
                interactive risk dashboard, vulnerability cards, and an
                explanation chat—just paste a contract or address and start
                exploring.
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={scrollToExamples}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all duration-150 shadow-lg shadow-cyan-500/30"
                >
                  Try an example contract
                </button>
                <button
                  onClick={() => {
                    document
                      .getElementById("code-input")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-slate-200 border border-slate-700 hover:border-slate-500 bg-slate-900/60 transition-all duration-150"
                >
                  Paste your own contract
                </button>
              </div>
            </div>

            {/* Live preview card */}
            {auditResult ? (
              <div className="w-full lg:w-80 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/70 via-slate-950 to-slate-950 p-5 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-slate-400">Risk Score</span>
                  <span className="text-2xl font-bold text-slate-100">
                    {auditResult.riskScore}
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500"
                    style={{ width: `${auditResult.riskScore}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Issues</span>
                    <p className="text-slate-100 font-semibold">
                      {auditResult.metrics.totalVulnerabilities}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Critical</span>
                    <p className="text-rose-400 font-semibold">
                      {auditResult.metrics.criticalCount}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full lg:w-80 rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/70 via-slate-950 to-slate-950 p-5 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
                <div className="text-center py-8">
                  <p className="text-sm text-slate-400">
                    Run an audit to see live results
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Problem → Solution Strip */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 lg:mb-14">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <h3 className="font-semibold text-slate-100 mb-2">The problem</h3>
            <p>
              Security reviews are slow, expensive, and hard to understand.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <h3 className="font-semibold text-slate-100 mb-2">Our approach</h3>
            <p>
              Static analysis + Generative UI + explanations in one adaptive
              interface.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
            <h3 className="font-semibold text-slate-100 mb-2">Who it&apos;s for</h3>
            <p>
              Solidity devs, small teams, and students shipping contracts fast.
            </p>
          </div>
        </section>

        {/* Main Tool Section */}
        <section className="mb-10 lg:mb-14">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left: Input Panel */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/80 backdrop-blur p-4 sm:p-5 lg:p-6 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
              <h3 className="text-xl lg:text-2xl font-semibold text-slate-100 mb-4">
                Audit a smart contract
              </h3>
              <AuditorInput onSubmit={handleAuditSubmit} isLoading={isLoading} />
              {error && (
                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-sm text-rose-300">
                  {error}
                </div>
              )}
            </div>

            {/* Right: Results Panel */}
            <div className="rounded-2xl border border-white/5 bg-slate-950/80 backdrop-blur p-4 sm:p-5 lg:p-6 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
              <h3 className="text-xl lg:text-2xl font-semibold text-slate-100 mb-4">
                Audit Results
              </h3>

              {!auditResult && !isLoading && (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-sm">Run an audit to see results here</p>
                </div>
              )}

              {isLoading && (
                <div className="space-y-4">
                  <div className="animate-pulse space-y-3">
                    <div className="h-20 bg-slate-900/60 rounded-xl" />
                    <div className="h-32 bg-slate-900/60 rounded-xl" />
                    <div className="h-24 bg-slate-900/60 rounded-xl" />
                  </div>
                </div>
              )}

              {auditResult && (
                <>
                  {/* Tabs */}
                  <div className="flex gap-2 mb-4 border-b border-slate-800">
                    {(
                      [
                        { id: "overview", label: "Overview" },
                        { id: "vulnerabilities", label: "Vulnerabilities" },
                        { id: "recommendations", label: "Recommendations" },
                        { id: "tambo", label: "Tambo Copilot" },
                      ] as const
                    ).map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-all duration-150 border-b-2 ${
                          activeTab === tab.id
                            ? "border-cyan-400 text-cyan-400"
                            : "border-transparent text-slate-400 hover:text-slate-300"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="mt-4">
                    {activeTab === "overview" && (
                      <RiskOverviewCard
                        auditResult={auditResult}
                        originalCode={originalCode}
                      />
                    )}

                    {activeTab === "vulnerabilities" && (
                      <VulnerabilityList
                        auditResult={auditResult}
                        originalCode={originalCode}
                        onExplainVulnerability={handleExplainVulnerability}
                      />
                    )}

                    {activeTab === "recommendations" && (
                      <RecommendationsTab auditResult={auditResult} />
                    )}

                    {activeTab === "tambo" && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-xs text-slate-500">
                            Powered by Tambo Generative UI – this panel decides
                            which components to show based on your questions.
                          </span>
                        </div>
                        <div className="h-96">
                          <TamboChat
                            auditResult={auditResult}
                            originalCode={originalCode}
                            seedVulnerability={selectedVulnerability}
                            onVulnerabilitySeeded={() =>
                              setSelectedVulnerability(null)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Example Contracts Section */}
        <section ref={examplesRef} className="mb-10 lg:mb-14">
          <h3 className="text-xl lg:text-2xl font-semibold text-slate-100 mb-4">
            Try it instantly
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {exampleContracts.map((example) => (
              <div
                key={example.id}
                className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 hover:border-slate-700 transition-all duration-150"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-slate-100 text-sm">
                    {example.name}
                  </h4>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      example.riskLevel === "high" || example.riskLevel === "critical"
                        ? "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                        : "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                    }`}
                  >
                    {example.riskLevel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                  {example.description}
                </p>
                <button
                  onClick={() => handleLoadExample(example.code)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all duration-150"
                >
                  Load into auditor
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Generative UI Explanation */}
        <section className="mb-10 lg:mb-14">
          <div className="rounded-2xl border border-white/5 bg-slate-950/80 backdrop-blur p-4 sm:p-5 lg:p-6 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
            <h3 className="text-xl font-semibold text-slate-100 mb-3">
              Generative UI in action
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              SafeContract uses Tambo to choose the right UI components based
              on your questions. Ask about risk, specific vulnerabilities, or
              mitigation strategies, and the interface adapts dynamically—not
              just chat, but the entire dashboard reorganizes to show what you
              need.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500 mb-2">
            Built during The UI Strikes Back hackathon
          </p>
          <p className="text-xs text-slate-600">
            SafeContract • AI-Powered Solidity Security Auditor
          </p>
        </footer>
      </main>
    </div>
  );
}
