# SafeContract

AI-Powered Solidity Smart Contract Security Auditor

## Overview

SafeContract is a production-grade web application for analyzing Solidity smart contracts for security vulnerabilities. It provides instant vulnerability detection, risk assessment, and AI-powered explanations through an intuitive interface.

## Features

- **Static Analysis**: Detects common vulnerabilities like reentrancy, integer overflow, access control issues, and unchecked external calls
- **Risk Scoring**: Calculates a 0-100 risk score with severity levels (low, medium, high, critical)
- **Detailed Reports**: Provides vulnerability descriptions, code context, and suggested fixes
- **AI Chat Assistant**: Powered by Tambo AI, allows users to ask follow-up questions about audit results
- **Clean UI**: Professional, responsive design built with Tailwind CSS

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **React 18**
- **Tailwind CSS**
- **Tambo AI React SDK** (@tambo-ai/react)
- **Zod** (Schema validation)

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` and add your Tambo AI API key:

```
NEXT_PUBLIC_TAMBO_API_KEY=your_actual_api_key_here
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx      # Root layout with TamboProvider
│   ├── page.tsx        # Main page with input, results, and chat
│   └── globals.css     # Global styles
├── components/
│   ├── AuditorInput.tsx  # Code/address input component
│   └── TamboChat.tsx     # AI chat interface
└── lib/
    ├── audit.ts        # Core audit analysis logic
    └── schema.ts       # Zod schemas for type safety
```

## Usage

1. Paste your Solidity contract code into the input area
2. Click "Run Audit" to analyze the contract
3. Review the risk score, metrics, and vulnerability list
4. Use the AI chat to ask questions about specific vulnerabilities or get code examples

## Current Analysis Capabilities

The current implementation uses heuristic-based static analysis to detect:

- **Reentrancy vulnerabilities**: External calls without protection
- **Integer overflow/underflow**: Unsafe arithmetic operations
- **Missing access controls**: Public functions without modifiers
- **Unchecked external calls**: Calls without return value checks

## Extending the Analysis

The `analyzeContract` function in `src/lib/audit.ts` is designed to be easily extended. You can:

- Replace mock analysis with OpenAI API calls
- Integrate with Etherscan API for address-based analysis
- Add more sophisticated vulnerability detection patterns
- Connect to professional security analysis tools

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

