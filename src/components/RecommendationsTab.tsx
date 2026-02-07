"use client";

import type { AuditResult } from "@/lib/schema";

export interface RecommendationsTabProps {
  auditResult: AuditResult;
}

export default function RecommendationsTab({
  auditResult,
}: RecommendationsTabProps) {
  const criticalVulns = auditResult.vulnerabilities.filter(
    (v) => v.severity === "critical"
  );
  const highVulns = auditResult.vulnerabilities.filter(
    (v) => v.severity === "high"
  );
  const mediumVulns = auditResult.vulnerabilities.filter(
    (v) => v.severity === "medium"
  );

  if (criticalVulns.length === 0 && highVulns.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
        <h3 className="font-semibold text-emerald-300">✓ No Critical Issues</h3>
        <p className="text-sm text-emerald-200 mt-2">
          Your contract has no critical or high-severity issues. Review the
          medium and low-severity findings before deployment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {criticalVulns.length > 0 && (
        <div>
          <h3 className="font-semibold text-rose-300 mb-2">
            🔴 Critical Fixes Required ({criticalVulns.length})
          </h3>
          <div className="space-y-2">
            {criticalVulns.map((vuln) => (
              <div
                key={vuln.id}
                className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3"
              >
                <p className="font-medium text-rose-300">{vuln.title}</p>
                <p className="text-sm text-rose-200 mt-1">
                  {vuln.suggestedFix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {highVulns.length > 0 && (
        <div>
          <h3 className="font-semibold text-orange-300 mb-2">
            🟠 High Priority Fixes ({highVulns.length})
          </h3>
          <div className="space-y-2">
            {highVulns.map((vuln) => (
              <div
                key={vuln.id}
                className="rounded-lg border border-orange-500/40 bg-orange-500/10 p-3"
              >
                <p className="font-medium text-orange-300">{vuln.title}</p>
                <p className="text-sm text-orange-200 mt-1">
                  {vuln.suggestedFix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {mediumVulns.length > 0 && (
        <div>
          <h3 className="font-semibold text-amber-300 mb-2">
            🟡 Medium Severity ({mediumVulns.length})
          </h3>
          <div className="space-y-2">
            {mediumVulns.map((vuln) => (
              <div
                key={vuln.id}
                className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3"
              >
                <p className="font-medium text-amber-300">{vuln.title}</p>
                <p className="text-sm text-amber-200 mt-1">
                  {vuln.suggestedFix}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

