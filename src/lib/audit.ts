import type {
  AuditRequest,
  AuditResult,
  Vulnerability,
  VulnerabilitySeverity,
} from "./schema";

/**
 * Analyzes Solidity code for security vulnerabilities.
 * Currently uses mock/heuristic analysis. Can be swapped with real API calls.
 */
export async function analyzeContract(
  request: AuditRequest
): Promise<AuditResult> {
  const { code, inputType } = request;

  // If inputType is address, we would fetch code from Etherscan here
  // For now, we assume code is provided directly
  if (inputType === "address") {
    // TODO: Implement Etherscan API integration
    throw new Error("Address lookup not yet implemented");
  }

  // Mock analysis - detect common patterns
  const vulnerabilities = detectVulnerabilities(code);
  const metrics = calculateMetrics(code, vulnerabilities);
  const riskScore = calculateRiskScore(vulnerabilities);
  const riskLevel = getRiskLevel(riskScore);

  const summary = generateSummary(riskLevel, vulnerabilities.length, metrics);

  return {
    riskScore,
    riskLevel,
    summary,
    vulnerabilities,
    metrics,
  };
}

/**
 * Heuristic-based vulnerability detection
 */
function detectVulnerabilities(code: string): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const lines = code.split("\n");

  // Check for reentrancy patterns
  const reentrancyPattern = /\.call\(|\.send\(|\.transfer\(/g;
  let reentrancyMatch;
  let lineNum = 1;
  for (const line of lines) {
    if (reentrancyPattern.test(line) && !line.includes("nonReentrant")) {
      vulnerabilities.push({
        id: `reentrancy-${vulnerabilities.length + 1}`,
        title: "Potential Reentrancy Vulnerability",
        severity: "high",
        description:
          "External calls (call, send, transfer) detected without reentrancy protection. Attackers could recursively call functions to drain funds.",
        codeContext: {
          lineStart: lineNum,
          lineEnd: lineNum,
          snippet: line.trim(),
        },
        suggestedFix:
          "Use the ReentrancyGuard pattern from OpenZeppelin or implement checks-effects-interactions pattern.",
      });
    }
    lineNum++;
  }

  // Check for integer overflow/underflow
  const arithmeticPattern = /(\+\+|\+\s*[0-9]|-\s*[0-9]|\*|\/)/g;
  lineNum = 1;
  for (const line of lines) {
    if (
      arithmeticPattern.test(line) &&
      !line.includes("SafeMath") &&
      !line.includes("unchecked")
    ) {
      vulnerabilities.push({
        id: `overflow-${vulnerabilities.length + 1}`,
        title: "Potential Integer Overflow/Underflow",
        severity: "medium",
        description:
          "Arithmetic operations detected. Solidity 0.8+ includes built-in overflow checks; this issue is informational unless using older compiler versions.",
        codeContext: {
          lineStart: lineNum,
          lineEnd: lineNum,
          snippet: line.trim(),
        },
        suggestedFix:
          "Use Solidity 0.8+ or import SafeMath from OpenZeppelin for older versions.",
      });
      break; // Only flag once
    }
    lineNum++;
  }

  // Check for missing access controls
  const payablePattern = /function\s+\w+\s*\([^)]*\)\s*public\s*payable/g;
  lineNum = 1;
  for (const line of lines) {
    if (payablePattern.test(line) && !line.includes("onlyOwner")) {
      vulnerabilities.push({
        id: `access-${vulnerabilities.length + 1}`,
        title: "Missing Access Control",
        severity: "medium",
        description:
          "Public payable function detected without access control modifiers. Unauthorized users could call critical functions.",
        codeContext: {
          lineStart: lineNum,
          lineEnd: lineNum,
          snippet: line.trim(),
        },
        suggestedFix:
          "Add access control modifiers (e.g., onlyOwner, onlyRole) to restrict function access.",
      });
      break;
    }
    lineNum++;
  }

  // Check for unchecked external calls
  const externalCallPattern = /\.call\([^)]*\)/g;
  lineNum = 1;
  for (const line of lines) {
    if (externalCallPattern.test(line) && !line.includes("require")) {
      vulnerabilities.push({
        id: `external-call-${vulnerabilities.length + 1}`,
        title: "Unchecked External Call",
        severity: "high",
        description:
          "External call detected without checking return value. Failed calls could be silently ignored.",
        codeContext: {
          lineStart: lineNum,
          lineEnd: lineNum,
          snippet: line.trim(),
        },
        suggestedFix:
          "Always check the return value of external calls or use transfer/send which revert on failure.",
      });
      break;
    }
    lineNum++;
  }

  // If no vulnerabilities found, add a low-severity informational note
  if (vulnerabilities.length === 0) {
    vulnerabilities.push({
      id: "info-1",
      title: "No Critical Issues Detected",
      severity: "low",
      description:
        "Basic static analysis did not detect common vulnerability patterns. However, a full security audit should include manual review and advanced analysis.",
      codeContext: {},
      suggestedFix:
        "Consider professional security audit for production contracts.",
    });
  }

  return vulnerabilities;
}

/**
 * Calculate code metrics
 */
function calculateMetrics(
  code: string,
  vulnerabilities: Vulnerability[]
): {
  totalVulnerabilities: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  linesOfCode: number;
  functionCount: number;
} {
  const lines = code.split("\n").filter((line) => line.trim().length > 0);
  const functionMatches = code.match(/function\s+\w+/g) || [];

  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  for (const vuln of vulnerabilities) {
    counts[vuln.severity as keyof typeof counts]++;
  }

  return {
    totalVulnerabilities: vulnerabilities.length,
    criticalCount: counts.critical,
    highCount: counts.high,
    mediumCount: counts.medium,
    lowCount: counts.low,
    linesOfCode: lines.length,
    functionCount: functionMatches.length,
  };
}

/**
 * Calculate risk score (0-100) based on vulnerabilities
 */
function calculateRiskScore(vulnerabilities: Vulnerability[]): number {
  if (vulnerabilities.length === 0) return 10;

  let score = 0;
  for (const vuln of vulnerabilities) {
    switch (vuln.severity) {
      case "critical":
        score += 30;
        break;
      case "high":
        score += 20;
        break;
      case "medium":
        score += 10;
        break;
      case "low":
        score += 5;
        break;
    }
  }

  return Math.min(100, score);
}

/**
 * Determine risk level from score
 */
function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  riskLevel: "low" | "medium" | "high" | "critical",
  vulnCount: number,
  metrics: ReturnType<typeof calculateMetrics>
): string {
  const levelText = {
    low: "relatively secure",
    medium: "moderately risky",
    high: "highly risky",
    critical: "critically vulnerable",
  };

  return `The contract analysis indicates a ${levelText[riskLevel]} security posture. Found ${vulnCount} potential vulnerability/vulnerabilities across ${metrics.linesOfCode} lines of code. ${metrics.functionCount} function(s) analyzed.`;
}

