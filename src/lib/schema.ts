import { z } from "zod";

export const VulnerabilitySeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const RiskLevelSchema = z.enum(["low", "medium", "high", "critical"]);

export const VulnerabilitySchema = z.object({
  id: z.string(),
  title: z.string(),
  severity: VulnerabilitySeveritySchema,
  description: z.string(),
  codeContext: z.object({
    lineStart: z.number().optional(),
    lineEnd: z.number().optional(),
    snippet: z.string().optional(),
  }),
  suggestedFix: z.string(),
});

export const AuditMetricsSchema = z.object({
  totalVulnerabilities: z.number(),
  criticalCount: z.number(),
  highCount: z.number(),
  mediumCount: z.number(),
  lowCount: z.number(),
  linesOfCode: z.number(),
  functionCount: z.number(),
});

export const AuditResultSchema = z.object({
  riskScore: z.number().min(0).max(100),
  riskLevel: RiskLevelSchema,
  summary: z.string(),
  vulnerabilities: z.array(VulnerabilitySchema),
  metrics: AuditMetricsSchema,
});

export const AuditRequestSchema = z.object({
  code: z.string().min(1, "Code cannot be empty"),
  inputType: z.enum(["solidity", "address"]).default("solidity"),
});

export type VulnerabilitySeverity = z.infer<typeof VulnerabilitySeveritySchema>;
export type RiskLevel = z.infer<typeof RiskLevelSchema>;
export type Vulnerability = z.infer<typeof VulnerabilitySchema>;
export type AuditMetrics = z.infer<typeof AuditMetricsSchema>;
export type AuditResult = z.infer<typeof AuditResultSchema>;
export type AuditRequest = z.infer<typeof AuditRequestSchema>;

