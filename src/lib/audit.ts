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

  // Flow-aware analysis - detect common patterns
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
 * Simple function model for flow-aware analysis
 */
interface FunctionModel {
  name: string;
  visibility: "public" | "external" | "internal" | "private";
  payable: boolean;
  body: string;
  lineStart: number;
  lineEnd: number;
}

/**
 * Parse contract into functions (heuristic-based)
 */
function parseFunctions(code: string): FunctionModel[] {
  const functions: FunctionModel[] = [];
  const lines = code.split("\n");

  let currentFunction: Partial<FunctionModel> | null = null;
  let braceDepth = 0;
  let inFunction = false;
  let functionStartLine = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect function declaration
    const functionMatch = trimmed.match(
      /function\s+(\w+)\s*\([^)]*\)\s*(public|external|internal|private)?\s*(payable)?/
    );

    if (functionMatch && !inFunction) {
      currentFunction = {
        name: functionMatch[1],
        visibility: (functionMatch[2] as any) || "public",
        payable: !!functionMatch[3],
        body: "",
        lineStart: i + 1,
      };
      inFunction = true;
      functionStartLine = i + 1;
      braceDepth = 0;
    }

    if (inFunction && currentFunction) {
      // Count braces to find function end
      for (const char of line) {
        if (char === "{") braceDepth++;
        if (char === "}") braceDepth--;
      }

      currentFunction.body += line + "\n";

      // Function ended
      if (braceDepth === 0 && trimmed.includes("}")) {
        currentFunction.lineEnd = i + 1;
        functions.push(currentFunction as FunctionModel);
        currentFunction = null;
        inFunction = false;
      }
    }
  }

  return functions;
}

/**
 * Flow-aware vulnerability detection
 */
function detectVulnerabilities(code: string): Vulnerability[] {
  const vulnerabilities: Vulnerability[] = [];
  const lines = code.split("\n");
  const functions = parseFunctions(code);

  // Check for reentrancy: external call before state update
  for (const func of functions) {
    const funcLines = func.body.split("\n");
    let externalCallLines: number[] = [];      // Track ALL external calls
    let stateUpdateLines: number[] = [];       // Track ALL state updates
    let hasReentrancyGuard = false;

    // Check for ReentrancyGuard pattern
    if (
      func.body.includes("nonReentrant") ||
      code.includes("ReentrancyGuard")
    ) {
      hasReentrancyGuard = true;
    }

    for (let i = 0; i < funcLines.length; i++) {
      const line = funcLines[i];
      const trimmed = line.trim();

      // Skip comments
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/*")
      ) {
        continue;
      }

      // Detect external calls (improved regex)
      if (
        /\.call\{|\.call\(|\.send\(|\.transfer\(|\.delegatecall\(|\.staticcall\(/.test(
          trimmed
        )
      ) {
        externalCallLines.push(func.lineStart + i);
      }

      // Detect state updates (improved detection)
      const isStateUpdate =
        (trimmed.includes("=") &&
          !trimmed.includes("==") &&
          !trimmed.includes("!=") &&
          !trimmed.includes("memory") &&
          !trimmed.includes("calldata") &&
          !trimmed.includes("if") &&
          !trimmed.includes("require") &&
          !trimmed.includes("assert")) ||
        /balances\[.*\]\s*=|mapping\[.*\]\s*=|\+\+|\-\-/.test(trimmed);

      if (isStateUpdate) {
        stateUpdateLines.push(func.lineStart + i);
      }
    }

    // Check if ANY external call comes before ANY state update
    for (const callLine of externalCallLines) {
      for (const updateLine of stateUpdateLines) {
        if (callLine < updateLine) {
          // Found reentrancy pattern: external call before state update
          const severity: VulnerabilitySeverity = hasReentrancyGuard
            ? "medium"
            : "high";

          // Only add if not already added (prevent duplicates)
          const isDuplicate = vulnerabilities.some(
            (v) =>
              v.title.toLowerCase().includes("reentrancy") &&
              v.codeContext.lineStart === callLine
          );

          if (!isDuplicate) {
            vulnerabilities.push({
              id: `reentrancy-flow-${vulnerabilities.length + 1}`,
              title: "Reentrancy Vulnerability: External Call Before State Update",
              severity,
              description:
                "This function makes external calls before updating state variables. This pattern allows reentrancy attacks where an attacker recursively calls the function to drain funds or manipulate state before the balance is updated. The vulnerable pattern: external call (line " +
                callLine +
                ") → state update (line " +
                updateLine +
                ").",
              codeContext: {
                lineStart: callLine,
                lineEnd: updateLine,
                snippet: funcLines
                  .slice(
                    callLine - func.lineStart,
                    updateLine - func.lineStart + 1
                  )
                  .join("\n")
                  .trim(),
              },
              suggestedFix:
                "Follow the checks-effects-interactions pattern: (1) Validate inputs (checks), (2) Update state (effects) BEFORE external calls, (3) Then make external calls (interactions). Example:\n\n```solidity\nfunction withdraw(uint256 amount) public {\n  require(balances[msg.sender] >= amount, \"Insufficient balance\");\n  \n  // Update state FIRST\n  balances[msg.sender] -= amount;\n  \n  // Then make external call\n  (bool success, ) = msg.sender.call{value: amount}(\"\");\n  require(success, \"Transfer failed\");\n}\n```\n\nAlternatively, use OpenZeppelin's ReentrancyGuard: add `nonReentrant` modifier to the function.",
            });
          }
          break; // Exit inner loop once vulnerability found for this function
        }
      }
    }
  }

  // Check for unchecked external calls (improved detection)
  let lineNum = 1;
  for (const line of lines) {
    const trimmed = line.trim();

    // Match external calls: .call{, .call.value, .send(, .transfer(
    const callMatch = trimmed.match(
      /(\.call\{|\.call\(|\.send\(|\.transfer\()/
    );

    if (callMatch) {
      // Check if return value is used
      const hasReturnCheck =
        trimmed.includes("require") ||
        trimmed.includes("if") ||
        trimmed.includes("bool success") ||
        trimmed.includes("(bool,");

      // Check if result is assigned and checked later (basic heuristic)
      const nextLines = lines.slice(lineNum, Math.min(lineNum + 5, lines.length));
      const hasLaterCheck = nextLines.some((nextLine) =>
        /require\s*\(.*success|if\s*\(.*success/.test(nextLine)
      );

      if (!hasReturnCheck && !hasLaterCheck) {
        vulnerabilities.push({
          id: `external-call-${vulnerabilities.length + 1}`,
          title: "Unchecked External Call",
          severity: "high",
          description:
            "External call detected without checking return value. Failed calls could be silently ignored, leading to unexpected behavior or loss of funds.",
          codeContext: {
            lineStart: lineNum,
            lineEnd: lineNum,
            snippet: trimmed,
          },
          suggestedFix:
            "Always check the return value of external calls. Use pattern: (bool success, ) = recipient.call{value: amount}(\"\"); require(success, \"Transfer failed\"); Or use transfer()/send() which revert on failure.",
        });
      }
    }
    lineNum++;
  }

  // Check for integer overflow/underflow - ONLY for Solidity <0.8.0
  const hasSolidity08Plus =
    code.includes("pragma solidity ^0.8") ||
    code.includes("pragma solidity >=0.8") ||
    code.includes("pragma solidity >0.8");

  if (!hasSolidity08Plus) {
    // Only check if using older Solidity version
    let foundArithmetic = false;
    lineNum = 1;
    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and imports
      if (
        trimmed.startsWith("//") ||
        trimmed.startsWith("pragma") ||
        trimmed.startsWith("import")
      ) {
        lineNum++;
        continue;
      }

      // Only flag arithmetic in actual code (has { or ; or parentheses)
      const hasArithmetic =
        trimmed.includes("++") ||
        trimmed.includes("+=") ||
        trimmed.includes("-=") ||
        (trimmed.includes("*") && trimmed.includes("="));

      if (
        hasArithmetic &&
        !trimmed.includes("SafeMath") &&
        !trimmed.includes("unchecked") &&
        !foundArithmetic
      ) {
        // Check if this is actually a state variable operation
        if (
          trimmed.includes("=") &&
          (trimmed.includes(";") || trimmed.includes("}"))
        ) {
          vulnerabilities.push({
            id: `overflow-${vulnerabilities.length + 1}`,
            title: "Potential Integer Overflow/Underflow (Solidity <0.8.0)",
            severity: "low",
            description:
              "Arithmetic operations detected. Solidity versions before 0.8.0 do not have built-in overflow protection.",
            codeContext: {
              lineStart: lineNum,
              lineEnd: lineNum,
              snippet: trimmed,
            },
            suggestedFix:
              "Upgrade to Solidity 0.8.0+ for automatic overflow protection, or use OpenZeppelin's SafeMath library.",
          });
          foundArithmetic = true;
        }
      }
      lineNum++;
    }
  }

  // Check for missing access controls on payable/state-changing functions
  const publicFunctions = functions.filter((f) => f.visibility === "public");

  for (const func of publicFunctions) {
    const hasAccessControl =
      func.body.includes("onlyOwner") ||
      func.body.includes("onlyRole") ||
      func.body.includes("require(msg.sender") ||
      func.body.includes("require(_msgSender()");

    const isPayable = func.payable;
    const isStateChanging =
      (func.body.includes("=") && !func.body.includes("memory")) ||
      func.body.includes("transfer") ||
      func.body.includes("mint") ||
      func.body.includes("burn");

    if (!hasAccessControl && (isPayable || isStateChanging)) {
      // Determine severity based on function type
      let severity: VulnerabilitySeverity = "medium";
      let title = "Missing Access Control";

      if (isPayable) {
        severity = "high"; // Payable without access control is HIGH risk
        title = "Missing Access Control on Payable Function";
      }

      // Check if already reported (prevent duplicates)
      const isDuplicate = vulnerabilities.some(
        (v) =>
          v.title.includes("Missing Access Control") &&
          v.codeContext.lineStart === func.lineStart
      );

      if (!isDuplicate) {
        vulnerabilities.push({
          id: `access-${vulnerabilities.length + 1}`,
          title,
          severity,
          description: isPayable
            ? `Public payable function "${func.name}" lacks access control. Anyone can call this function and send funds to it. An attacker could repeatedly call this to drain the contract or transfer unauthorized amounts.`
            : `Public state-changing function "${func.name}" lacks access control. Unauthorized users could call this function and manipulate contract state.`,
          codeContext: {
            lineStart: func.lineStart,
            lineEnd: func.lineStart,
            snippet: func.body.split("\n").slice(0, 3).join("\n").trim(),
          },
          suggestedFix:
            "Add access control modifiers to restrict function access:\n\n```solidity\n// Option 1: Owner-only\nfunction " +
            func.name +
            "(...) public onlyOwner { ... }\n\n// Option 2: Role-based\nfunction " +
            func.name +
            "(...) public onlyRole(ADMIN_ROLE) { ... }\n\n// Option 3: Manual check\nfunction " +
            func.name +
            "(...) public {\n  require(msg.sender == owner, \"Unauthorized\");\n  ...\n}\n```\n\nUse OpenZeppelin's Ownable or AccessControl contracts for best practices.",
        });
      }
    }
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
 * Scoring: Critical +30, High +20, Medium +10, Low +5
 * 
 * Thresholds:
 * - Critical: 3+ high issues (65+) or 1+ critical
 * - High: 2+ high issues (40+) or 1+ high + 2+ medium
 * - Medium: 1+ high OR 2+ medium (20+)
 * - Low: Only low-severity findings
 */
function getRiskLevel(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 65) return "critical";  // 3+ high severity issues
  if (score >= 40) return "high";       // 2+ high severity issues OR 1+ high + 2+ medium
  if (score >= 20) return "medium";     // 1+ high severity OR 2+ medium
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
