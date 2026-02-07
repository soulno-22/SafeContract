"use client";

import type { AuditResult, Vulnerability } from "./schema";

/**
 * Tambo Generative UI Component Registry
 * These components are registered with Tambo so it can dynamically choose
 * which UI to render based on user queries and context.
 */

export interface TamboComponentProps {
  auditResult: AuditResult;
  originalCode: string;
}

/**
 * RiskOverviewCard - Shows overall risk score, counts, and quick highlights
 * Use when: User asks about overall risk, security posture, or summary
 */
export function RiskOverviewCard({ auditResult }: TamboComponentProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "critical":
        return "bg-rose-500/15 text-rose-300 border-rose-500/40";
      case "high":
        return "bg-rose-500/15 text-rose-300 border-rose-500/40";
      case "medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      case "low":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-slate-950/80 backdrop-blur p-5 lg:p-6 shadow-[0_0_40px_rgba(15,23,42,0.9)]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-slate-100">Risk Overview</h3>
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(
            auditResult.riskLevel
          )}`}
        >
          {auditResult.riskLevel.toUpperCase()}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-4xl font-bold text-slate-100">
            {auditResult.riskScore}
          </span>
          <span className="text-slate-400">/100</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all duration-500"
            style={{ width: `${auditResult.riskScore}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-500 mb-1">Total Issues</p>
          <p className="text-2xl font-semibold text-slate-100">
            {auditResult.metrics.totalVulnerabilities}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-500 mb-1">Critical</p>
          <p className="text-2xl font-semibold text-rose-400">
            {auditResult.metrics.criticalCount}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-500 mb-1">High</p>
          <p className="text-2xl font-semibold text-orange-400">
            {auditResult.metrics.highCount}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
          <p className="text-xs text-slate-500 mb-1">Medium</p>
          <p className="text-2xl font-semibold text-amber-400">
            {auditResult.metrics.mediumCount}
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-300 leading-relaxed">
        {auditResult.summary}
      </p>
    </div>
  );
}

/**
 * VulnerabilityList - Shows detailed list of all vulnerabilities
 * Use when: User asks about specific vulnerabilities, wants to see all issues, or explore findings
 */
export function VulnerabilityList({
  auditResult,
  onExplainVulnerability,
}: TamboComponentProps & {
  onExplainVulnerability?: (vuln: Vulnerability) => void;
}) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-rose-500 bg-rose-500/5";
      case "high":
        return "border-l-orange-500 bg-orange-500/5";
      case "medium":
        return "border-l-amber-500 bg-amber-500/5";
      case "low":
        return "border-l-emerald-500 bg-emerald-500/5";
      default:
        return "border-l-slate-500 bg-slate-500/5";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-rose-500/15 text-rose-300 border-rose-500/40";
      case "high":
        return "bg-orange-500/15 text-orange-300 border-orange-500/40";
      case "medium":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40";
      case "low":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      default:
        return "bg-slate-500/15 text-slate-300 border-slate-500/40";
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">
        Vulnerabilities ({auditResult.vulnerabilities.length})
      </h3>
      {auditResult.vulnerabilities.map((vuln) => (
        <div
          key={vuln.id}
          className={`rounded-xl border-l-4 ${getSeverityColor(
            vuln.severity
          )} border border-white/5 bg-slate-950/80 p-4 sm:p-5 transition-all duration-150 hover:border-white/10`}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="font-semibold text-slate-100 text-sm sm:text-base">
              {vuln.title}
            </h4>
            <span
              className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityBadge(
                vuln.severity
              )}`}
            >
              {vuln.severity}
            </span>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed mb-3">
            {vuln.description}
          </p>

          {vuln.codeContext.snippet && (
            <div className="mb-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
              <p className="text-xs text-slate-500 mb-1 font-mono">
                Line {vuln.codeContext.lineStart}
                {vuln.codeContext.lineEnd &&
                  vuln.codeContext.lineStart !== vuln.codeContext.lineEnd &&
                  `-${vuln.codeContext.lineEnd}`}
              </p>
              <code className="text-xs text-slate-100 font-mono block whitespace-pre-wrap">
                {vuln.codeContext.snippet}
              </code>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-slate-800">
            <p className="text-xs font-medium text-slate-400 mb-1">
              Suggested Fix:
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              {vuln.suggestedFix}
            </p>
          </div>

          {onExplainVulnerability && (
            <button
              onClick={() => onExplainVulnerability(vuln)}
              className="mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium text-cyan-400 border border-cyan-400/30 hover:border-cyan-400/60 bg-cyan-400/10 hover:bg-cyan-400/20 transition-all duration-150"
            >
              Explain in chat
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * RecommendationList - Focused view on fixes and recommendations
 * Use when: User asks "how to fix", "what should I do", "recommendations", "mitigations", or wants actionable steps
 */
export function RecommendationList({ auditResult }: TamboComponentProps) {
  // Filter for high and critical severity issues
  const criticalVulns = auditResult.vulnerabilities.filter(
    (v) => v.severity === "critical" || v.severity === "high"
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">
        Priority Recommendations
      </h3>
      {criticalVulns.length > 0 ? (
        <div className="space-y-3">
          {criticalVulns.map((vuln) => (
            <div
              key={vuln.id}
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xs font-semibold text-amber-300">
                  !
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-100 text-sm mb-1">
                    Fix: {vuln.title}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {vuln.suggestedFix}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5">
          <p className="text-sm text-slate-300">
            No critical or high-severity issues found. Your contract appears to
            be relatively secure. Consider a professional audit before
            deployment.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * CodeContextViewer - Shows code snippets with context
 * Use when: User asks about specific code, wants to see where issues are, or needs code examples
 */
export function CodeContextViewer({
  auditResult,
  originalCode,
}: TamboComponentProps) {
  const vulnsWithCode = auditResult.vulnerabilities.filter(
    (v) => v.codeContext.snippet
  );

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold text-slate-100 mb-4">
        Code Context
      </h3>
      {vulnsWithCode.length > 0 ? (
        <div className="space-y-4">
          {vulnsWithCode.map((vuln) => (
            <div
              key={vuln.id}
              className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 sm:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-100 text-sm">
                  {vuln.title}
                </h4>
                <span className="text-xs text-slate-500 font-mono">
                  Line {vuln.codeContext.lineStart}
                </span>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800">
                <code className="text-xs sm:text-sm text-slate-100 font-mono block whitespace-pre-wrap">
                  {vuln.codeContext.snippet}
                </code>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
          <p className="text-sm text-slate-400">
            No code context available for the detected vulnerabilities.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Component registry metadata for Tambo
 * This helps Tambo understand when to use each component
 */
export const tamboComponentRegistry = {
  RiskOverviewCard: {
    name: "RiskOverviewCard",
    description:
      "Shows overall risk score, counts of vulnerabilities, and quick highlights. Use this when the user asks about overall risk, score, or a high-level summary of the contract's security.",
    props: {
      auditResult: {
        type: "object",
        description: "Complete audit result with risk score and metrics",
      },
    },
  },
  VulnerabilityList: {
    name: "VulnerabilityList",
    description:
      "Shows detailed list of all vulnerabilities with descriptions and fixes. Use when the user asks 'what are the issues', 'show vulnerabilities', or similar.",
    props: {
      auditResult: {
        type: "object",
        description: "Complete audit result with vulnerabilities array",
      },
    },
  },
  RecommendationList: {
    name: "RecommendationList",
    description:
      "Focused view on fixes and recommendations. Use when the user asks 'how to fix', 'what should I do', 'recommendations', or 'mitigations'.",
    props: {
      auditResult: {
        type: "object",
        description: "Complete audit result filtered for critical/high issues",
      },
    },
  },
  CodeContextViewer: {
    name: "CodeContextViewer",
    description:
      "Shows code snippets with context. Use when the user asks 'where in code', 'show me code', or mentions line numbers or functions.",
    props: {
      auditResult: {
        type: "object",
        description: "Complete audit result with code context",
      },
      originalCode: {
        type: "string",
        description: "Original Solidity source code",
      },
    },
  },
};

