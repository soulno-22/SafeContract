# SafeContract

> **AI-Powered Solidity Smart Contract Security Auditor**

SafeContract is an AI‑powered smart contract auditor that uses Tambo Generative UI to turn Solidity code into an interactive risk dashboard, vulnerability explorer, and explanation copilot.

**Built for: [The UI Strikes Back – Tambo x WeMakeDevs Hackathon](https://www.wemakedevs.org/hackathons/tambo)**

---

## One-Line Pitch

Ship safer smart contracts with AI-assisted audits. SafeContract turns any Solidity contract into an interactive risk report with a Tambo‑powered UI: risk score, vulnerability cards, and an explanation chat-just paste a contract or address(coming soon) and start exploring.

## How It Works

1. **You paste a Solidity contract** or load an example  
   - Start from your own contract or use one of the built‑in vulnerable examples to see SafeContract in action.

2. **We run static heuristics** to extract potential risks and metadata  
   - We generate a 0–100 risk score with severity levels (low, medium, high, critical) and detect common vulnerability patterns.

3. **We feed this into Tambo**, which decides which UI components to render  
   - Tambo’s Generative UI powers an adaptive dashboard with risk overviews, interactive vulnerability cards, and recommended fixes tailored to your contract.

4. **You explore risks** through a dynamic dashboard and an explanation chat  
   - Browse vulnerabilities with code context, suggested remediations, and “explain this in chat” actions.  
   - Ask the AI copilot to break down issues, trade‑offs, and best practices so audits feel more approachable for students, small teams, and new Solidity developers.


## Features

- **Static Analysis**: Detects common vulnerabilities like reentrancy, integer overflow, access control issues, and unchecked external calls
- **Risk Scoring**: Calculates a 0-100 risk score with severity levels (low, medium, high, critical)
- **Tambo Generative UI**: Tambo decides which UI components to render and how to arrange them, so the dashboard actually changes based on what you’re asking.
- **Interactive Vulnerability Cards**: Each finding includes a description, severity, code snippet, and suggested fix, with a one‑click “Explain in chat” action.
- **AI Copilot Chat**: Ask questions about vulnerabilities, fixes, or best practices and get tailored answers.
- **Example Contracts**: Try pre-loaded vulnerable contracts to see the auditor in action
- **Dark Theme**: Cyber-security aesthetic with cyan/orange accents that feels like a proper security console.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **React 18**
- **Tailwind CSS**
- **Tambo Generative UI** (Component orchestration)
- **Zod** (Schema validation)

## Getting started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Setup

1. Clone the repository:

```bash
git clone https://github.com/soulno-22/SafeContract.git
cd SafeContract
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

The app uses `gpt-4` by default. You can modify the model in `src/app/api/copilot/route.ts` if needed.

**Note:** Without OPENAI_API_KEY, the copilot falls back to simple hardcoded responses.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Inter font
│   ├── page.tsx            # Main page: hero, input, results, examples
│   └── globals.css         # Global styles (dark theme)
├── components/
│   ├── AuditorInput.tsx    # Code/address input with keyboard shortcuts
│   └── TamboChat.tsx       # AI chat interface with vulnerability seeding
└── lib/
    ├── audit.ts            # Core audit analysis logic (heuristic-based)
    ├── schema.ts           # Zod schemas for type safety
    ├── examples.ts         # Example vulnerable contracts
    └── tambo-components.tsx # Tambo Generative UI component definitions
```

## Tambo Generative UI Components

SafeContract registers several components with Tambo which can be rendered dynamically depending on the context:

- **RiskOverviewCard**: Shows overall risk score, counts, and quick highlights
- **VulnerabilityList**: Detailed list of all vulnerabilities with descriptions
- **RecommendationList**: Focused view on fixes and actionable steps
- **CodeContextViewer**: Shows code snippets with relevant context

The Tambo chat decides which components to show based on user queries, making the interface feel truly adaptive instead of static.

## How to use it

1. **Paste your Solidity contract code** into the input area (or load an example)
2. **Click "Run AI audit"** (or press `Ctrl/Cmd + Enter`)
3. **Explore the results** through different tabs:
   - **Overview**: Risk score and key metrics
   - **Vulnerabilities**: Detailed list of all findings
   - **Recommendations**: Priority fixes
   - **Tambo Copilot**: Interactive chat
4. **Ask questions** in the Tambo chat about specific vulnerabilities or fixes
5. **Click "Explain in chat"** on any vulnerability card to seed the conversation with that issue.

## Current Analysis Capabilities

The current implementation uses heuristic-based static analysis to detect:

- **Reentrancy vulnerabilities**: External calls without proper protection
- **Integer overflow/underflow**: Unsafe arithmetic operations (Sol 0.7.x)
- **Missing access controls**: Public functions without modifiers
- **Unchecked external calls**: Calls without return value checks​

This is meant as a learning and triage tool, not a replacement for a full professional audit (yet!).

## Extending the Analysis

The `analyzeContract` function in `src/lib/audit.ts` is designed to be easily extended. You can:

- Replace heuristic logic with OpenAI‑powered analysis.
- Integrate with Etherscan API for address-based analysis.
- Add more sophisticated vulnerability detection patterns and severity models.
- Connect to external professional security tools for deeper scans.

## What I Learnt

While building SafeContract for The UI Strikes Back hackathon, I learnt:

- **Tambo SDK Integration**: How to register components and let AI orchestrate the UI
- **Generative-First Design**: Building components that adapt to user intent
- **Static Analysis Heuristics**: Creating pattern-based vulnerability detection for Solidity
- **Dark Theme UX**: Designing a cyber-security aesthetic that's both functional and beautiful

## Why it's the best use case of Tambo

SafeContract demonstrates Tambo's power by:

- **Dynamic Component Selection**: Letting the AI choose and orchestrate components instead of only responding with text
- **Context-Aware Responses**: Tambo uses audit results and code context to provide context‑aware responses
- **Adaptive Interface**: Not just chat, the entire dashboard reorganizes based on user needs
- **Component Orchestration**: Multiple registered components work together to create a single cohesive "console"

## Potential Impact

SafeContract helps developers:

- **Avoid catastrophic losses** from smart contract vulnerabilities
- **Make audits more accessible** to small teams and students
- **Learn security best practices** through interactive explanations instead of static docs
- **Ship contracts faster** with immediate feedback loops

## Building for Production

```bash
npm run build
npm start
```

## License

MIT

## Acknowledgments

- Built for [The UI Strikes Back – Tambo x WeMakeDevs Hackathon](https://www.wemakedevs.org/hackathons/tambo)
- Inspired by the need for accessible smart contract security tools
- Powered by Tambo Generative UI

---

**Made with ⚡ during The UI Strikes Back hackathon**
