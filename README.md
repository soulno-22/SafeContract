# SafeContract

> **AI-Powered Solidity Smart Contract Security Auditor**

SafeContract is an AI-powered smart contract auditor that uses Tambo Generative UI to turn Solidity into an interactive risk dashboard, vulnerability explorer, and explanation copilot.

**Built for: [The UI Strikes Back – Tambo x WeMakeDevs Hackathon](https://tambo.co)**

---

## 🎯 One-Line Pitch

Ship safer smart contracts with AI-powered audits. SafeContract uses Tambo's Generative UI to turn Solidity into an interactive risk dashboard, vulnerability cards, and an explanation chat—just paste a contract or address and start exploring.

## 🚀 How It Works

1. **You paste a Solidity contract** or load an example
2. **We run static heuristics** to extract potential risks and metadata
3. **We feed this into Tambo**, which decides which UI components to render
4. **You explore risks** through a dynamic dashboard and an explanation chat

## ✨ Features

- **Static Analysis**: Detects common vulnerabilities like reentrancy, integer overflow, access control issues, and unchecked external calls
- **Risk Scoring**: Calculates a 0-100 risk score with severity levels (low, medium, high, critical)
- **Tambo Generative UI**: The interface adapts based on your questions—not just chat, but the entire dashboard reorganizes
- **Interactive Vulnerability Cards**: Detailed findings with code context and suggested fixes
- **AI Copilot Chat**: Ask questions about vulnerabilities, fixes, or best practices
- **Example Contracts**: Try pre-loaded vulnerable contracts to see the auditor in action
- **Dark Theme**: Cyber-security aesthetic with cyan/orange accents

## 🛠️ Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **React 18**
- **Tailwind CSS**
- **Tambo Generative UI** (Component orchestration)
- **Zod** (Schema validation)

## 📦 Installation

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

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```bash
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

The app uses `gpt-4` by default. You can modify the model in `src/app/api/copilot/route.ts` if needed.

**Note:** The `OPENAI_API_KEY` is required for the Copilot feature to work. Without it, the copilot will fall back to hardcoded responses.

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with Inter font
│   ├── page.tsx            # Main page with hero, input, results, examples
│   └── globals.css         # Global styles (dark theme)
├── components/
│   ├── AuditorInput.tsx    # Code/address input with keyboard shortcuts
│   └── TamboChat.tsx      # AI chat interface with vulnerability seeding
└── lib/
    ├── audit.ts            # Core audit analysis logic (heuristic-based)
    ├── schema.ts           # Zod schemas for type safety
    ├── examples.ts         # Example vulnerable contracts
    └── tambo-components.tsx # Tambo Generative UI components
```

## 🎨 Tambo Generative UI Components

SafeContract registers several components with Tambo that can be dynamically rendered:

- **RiskOverviewCard**: Shows overall risk score, counts, and quick highlights
- **VulnerabilityList**: Detailed list of all vulnerabilities with descriptions
- **RecommendationList**: Focused view on fixes and actionable steps
- **CodeContextViewer**: Shows code snippets with context

The Tambo chat decides which components to show based on user queries, making the interface truly adaptive.

## 📸 Screenshots

<!-- TODO: Add screenshots after UI changes -->
- [ ] Hero view with gradient title
- [ ] Risk dashboard with Tambo components
- [ ] Vulnerability cards with code context
- [ ] Tambo chat explaining a vulnerability
- [ ] Example contracts section

## 🧪 Usage

1. **Paste your Solidity contract code** into the input area (or load an example)
2. **Click "Run AI audit"** (or press `Ctrl/Cmd + Enter`)
3. **Explore the results** through different tabs:
   - **Overview**: Risk score and key metrics
   - **Vulnerabilities**: Detailed list of all findings
   - **Recommendations**: Priority fixes
   - **Tambo Copilot**: Interactive chat
4. **Ask questions** in the Tambo chat about specific vulnerabilities or fixes
5. **Click "Explain in chat"** on any vulnerability card to seed the conversation

## 🔍 Current Analysis Capabilities

The current implementation uses heuristic-based static analysis to detect:

- **Reentrancy vulnerabilities**: External calls without protection
- **Integer overflow/underflow**: Unsafe arithmetic operations (Sol 0.7.x)
- **Missing access controls**: Public functions without modifiers
- **Unchecked external calls**: Calls without return value checks

## 🚧 Extending the Analysis

The `analyzeContract` function in `src/lib/audit.ts` is designed to be easily extended. You can:

- Replace mock analysis with OpenAI API calls
- Integrate with Etherscan API for address-based analysis
- Add more sophisticated vulnerability detection patterns
- Connect to professional security analysis tools

## 🎓 What We Learned

Building SafeContract during The UI Strikes Back hackathon taught us:

- **Tambo SDK Integration**: How to register components and let AI orchestrate the UI
- **Generative-First Design**: Building components that adapt to user intent
- **Static Analysis Heuristics**: Creating pattern-based vulnerability detection for Solidity
- **Dark Theme UX**: Designing a cyber-security aesthetic that's both functional and beautiful

## 🏆 Best Use Case of Tambo

SafeContract demonstrates Tambo's power by:

- **Dynamic Component Selection**: The chat decides which UI components to render based on questions
- **Context-Aware Responses**: Tambo uses audit results and code context to provide relevant explanations
- **Adaptive Interface**: Not just chat—the entire dashboard reorganizes based on user needs
- **Component Orchestration**: Multiple registered components work together to create a cohesive experience

## 🎯 Potential Impact

SafeContract helps developers:

- **Avoid catastrophic losses** from smart contract vulnerabilities
- **Make audits more accessible** to small teams and students
- **Learn security best practices** through interactive explanations
- **Ship contracts faster** with instant feedback

## 🏗️ Building for Production

```bash
npm run build
npm start
```

## 📝 License

MIT

## 🙏 Acknowledgments

- Built for [The UI Strikes Back – Tambo x WeMakeDevs Hackathon](https://tambo.co)
- Inspired by the need for accessible smart contract security tools
- Powered by Tambo Generative UI

---

**Made with ⚡ during The UI Strikes Back hackathon**
