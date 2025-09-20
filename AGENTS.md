# AGENTS.md - AI Agent Rules for AGE (Attestation-Gated Escrow)

## Core Development Principles

### 1. Security-First Development
- **Never hardcode private keys or sensitive data** in any file
- **Always use OpenZeppelin SafeERC20** for ERC-20 token transfers
- **Implement reentrancy guards** on all payout and refund functions
- **Validate all EAS attestations** thoroughly before releasing funds
- **Use Solidity 0.8.x** for built-in overflow/underflow protection
- **Never bypass security checks** for convenience during development

### 2. EAS Integration Standards
- **Always validate attestation schema UID** matches expected `TASK_COMPLETED_SCHEMA_UID`
- **Verify attestation attester** matches the designated task attestor
- **Check attestation recipient** matches the task worker
- **Decode and validate taskId** from attestation data
- **Confirm attestation is not expired/revoked** before processing
- **Use EAS SDK properly** with correct chain-specific addresses

### 3. Smart Contract Architecture
- **Follow the exact struct definitions** from PRD:
  ```solidity
  struct Task {
    address client;
    address worker; 
    address attestor;
    address token; // address(0) = ETH
    uint256 amount;
    uint64 deadline;
    Status status;
    string workUri;
    bytes32 attestationUid;
  }
  ```
- **Implement all required events** for frontend integration
- **Use descriptive custom errors** instead of generic require messages
- **Maintain state consistency** across all operations

### 4. Frontend Development Rules
- **Use exact tech stack**: Next.js 14, TypeScript, Tailwind, shadcn/ui, wagmi/viem, RainbowKit
- **Implement role-based UI gating** - show actions only to appropriate addresses
- **Always validate network** - enforce Sepolia testnet usage
- **Handle all transaction states** - pending, success, error with proper toasts
- **Use proper TypeScript types** matching the contract structs
- **Implement wallet connection** via RainbowKit only

### 5. User Experience Guidelines
- **Keep interactions under 3 clicks** per flow
- **Show clear transaction status** at all times
- **Provide helpful error messages** with actionable guidance
- **Use proper empty states** - "No tasks yet — create one in seconds"
- **Implement proper loading states** for all async operations
- **Guard against wrong network** with clear switch prompts

### 6. Environment & Configuration
- **Use environment variables** for all configuration:
  - `NEXT_PUBLIC_CHAIN_ID=11155111` (Sepolia)
  - `NEXT_PUBLIC_EAS_ADDRESS`
  - `NEXT_PUBLIC_SCHEMA_UID`
  - `NEXT_PUBLIC_ALCHEMY_API_KEY`
  - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
- **Never commit sensitive keys** to version control
- **Validate environment variables** on app startup

### 7. Testing Requirements
- **Write unit tests** for all contract functions
- **Test both ETH and ERC-20** token flows
- **Test edge cases**: deadline expiry, invalid attestations, wrong roles
- **Test all user flows** end-to-end manually
- **Verify contract deployment** on Sepolia before frontend integration

### 8. Code Organization
- **Follow the file structure** specified in PRD section 20
- **Separate concerns properly**: contract logic, UI components, utilities
- **Use consistent naming conventions** matching existing patterns
- **Document complex functions** with clear comments
- **Keep components small and focused** on single responsibilities

### 9. Integration Patterns
- **Use wagmi hooks** for all contract interactions
- **Implement proper error handling** for all blockchain operations
- **Cache contract reads** appropriately to avoid unnecessary calls
- **Handle gas estimation** and transaction failures gracefully
- **Support both ETH and ERC-20 tokens** with proper allowance handling

### 10. Debugging & Monitoring
- **Log important state changes** during development
- **Use proper error boundaries** in React components
- **Implement transaction receipt verification** for all mutations
- **Test on Sepolia testnet** thoroughly before considering complete
- **Verify EAS attestations** can be created and validated properly

## Development Workflow Rules

### Phase 1: Smart Contracts (Hours 5-14)
1. Implement core AgeEscrow.sol with all specified functions
2. Add comprehensive unit tests covering happy and edge cases
3. Deploy to Sepolia and verify contract on Etherscan
4. Register TaskCompleted schema with EAS

### Phase 2: Frontend Foundation (Hours 15-20)
1. Set up Next.js with RainbowKit and wagmi configuration
2. Implement wallet connection and network validation
3. Create basic UI components following shadcn/ui patterns
4. Set up proper TypeScript types matching contract structures

### Phase 3: Core Features (Hours 21-30)
1. Build task creation and funding flows
2. Implement work submission functionality
3. Add attestation verification and payment release
4. Implement refund mechanism with deadline checks

### Phase 4: Polish & Testing (Hours 31-48)
1. Add proper error handling and user feedback
2. Implement loading states and transaction toasts
3. Test all flows end-to-end on Sepolia
4. Write deployment scripts and documentation

## Critical Success Factors

- **Attestation validation must be bulletproof** - funds depend on it
- **All transaction states must be handled** - no silent failures
- **Role-based access must be enforced** - security critical
- **Both ETH and ERC-20 flows must work** - per acceptance criteria
- **Network enforcement must be strict** - Sepolia only
- **Error messages must be actionable** - guide users to solutions

## Immediate Next Steps for AI Agents

1. **Read the PRD thoroughly** before making any implementation decisions
2. **Start with contract implementation** - it's the foundation
3. **Test extensively on Sepolia** - don't assume localhost testing is sufficient
4. **Follow the exact tech stack** - no substitutions without explicit approval
5. **Implement security measures first** - never compromise on safety

Remember: This is a 48-hour hackathon build focused on demonstrating attestation-gated escrow. Prioritize core functionality over advanced features, but never compromise on security or user experience quality.