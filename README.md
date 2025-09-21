# AGE — Attestation-Gated Escrow

Attestation-gated escrow for micro-tasks. Clients fund work, workers submit deliverables, and funds release only after a valid [Ethereum Attestation Service (EAS)](https://attest.org/) completion attestation. Built with Solidity, Hardhat, Next.js 14 (App Router), wagmi/viem, RainbowKit, Tailwind, and shadcn/ui.

## Repository Layout

- `contracts/` — Solidity sources (`AgeEscrow.sol` + mocks for tests)
- `scripts/` — Hardhat deployment utilities
- `test/` — Hardhat test suite (covers ETH + ERC-20 flows, attestation guards, deadlines)
- `src/` — Next.js application (pending implementation per PRD)
- `docs/` — PRD and supporting documentation

## Prerequisites

- Node.js ≥ 18 (Bun optional)
- npm (or pnpm / yarn / bun) for dependency management
- Base Sepolia RPC endpoint (e.g., Alchemy) and funded deployer key for contract deployment

Install dependencies:

```bash
npm install
```

## Environment Variables

Copy `.env.example` to `.env` (or `.env.local` for Next.js) and provide at minimum:

```bash
# Hardhat / scripts
BASE_SEPOLIA_RPC_URL="https://base-sepolia.g.alchemy.com/v2/<API_KEY>"
BASE_SEPOLIA_PRIVATE_KEY="0xabc123..."  # deployer wallet (include 0x)
EAS_ADDRESS="0x..."
TASK_COMPLETED_SCHEMA_UID="0x..."  # set after schema registration

# Frontend (planned)
NEXT_PUBLIC_CHAIN_ID="84532"
NEXT_PUBLIC_EAS_ADDRESS="0x..."
NEXT_PUBLIC_SCHEMA_UID="0x..."
NEXT_PUBLIC_ESCROW_ADDRESS="0x..."  # Address output from scripts/01_deploy.ts
NEXT_PUBLIC_ALCHEMY_API_KEY=""
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=""
```

> **Note:** run the schema registration script (see below) to obtain `TASK_COMPLETED_SCHEMA_UID` / `NEXT_PUBLIC_SCHEMA_UID`.

## Hardhat Commands

Compile the contracts (uses local `solc` dependency; no remote download needed):

```bash
npx hardhat compile
```

Run the test suite (includes ETH & ERC-20, attestation validation, refunds):

```bash
npx hardhat test
```

### Deploy AgeEscrow

Deploy to Base Sepolia (or any configured network):

```bash
npx hardhat run scripts/01_deploy.ts --network baseSepolia
```

- Requires `EAS_ADDRESS` and `TASK_COMPLETED_SCHEMA_UID` in the environment
- Saves deployment metadata under `deployments/<network>-age-escrow.json`

### Register TaskCompleted Schema

Registers the canonical `TaskCompleted` schema on the target EAS registry and writes the resulting UID to `deployments/<network>-schema.json`.

```bash
npx hardhat run scripts/02_register_schema.ts --network baseSepolia
```

- Uses `EAS_ADDRESS` to resolve the registry on-chain
- Computes deterministic UID (`keccak256(schema, resolver, revocable)`) and skips registration if it already exists
- Copy the emitted UID into `TASK_COMPLETED_SCHEMA_UID` / `NEXT_PUBLIC_SCHEMA_UID`

## Frontend Development

The frontend follows the PRD stack (Next.js 14 App Router, RainbowKit/wagmi, Tailwind, shadcn/ui). Launch the dev server with:

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). Navigation quick links:

- **Home** — overview of flows, safeguards, and features
- **Create task** — end-to-end ETH/ERC-20 funding wizard
- **Issue attestation** — craft TaskCompleted attestations via the EAS SDK
- **My tasks** — cached list of client/worker tasks with quick links

### Issuing attestations

Use the official EAS tooling (e.g. [https://easscan.org](https://easscan.org)) to craft TaskCompleted attestations. The release flow on this dApp still validates the UID against the schema, attestor, worker, and task bindings before unlocking funds.

## Security & QA Checklist

- All token transfers use OpenZeppelin `SafeERC20`
- Reentrancy guard covers payout/refund paths
- Attestation release checks schema UID, attester, worker recipient, task binding, and expiry/revocation
- Hardhat tests cover ETH + ERC-20 funding, invalid attestations, deadline refunds, and role gating
- Additional checks (frontend validations, E2E flows) will be implemented per PRD as development continues

Refer to `docs/PRD.md` and `AGENTS.md` for the detailed build plan and guardrails.
