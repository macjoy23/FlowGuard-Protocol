# FlowGuard Protocol

**Private Payroll. Global Settlement.**

Production-grade Web3 payroll platform on Polygon Mainnet. Secure, compliant, real-time USDC settlement with Aave V3 yield integration.

## Architecture

```
flowguard-protocol/
├── frontend/          Vite + React + TypeScript
├── contracts/         Hardhat v2 + Solidity
├── package.json       Root scripts
└── README.md
```

## Network

- **Chain:** Polygon Mainnet (chainId 137)
- **USDC:** `0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359` (Native USDC)
- **Aave V3 Pool:** `0x794a61358D6845594F94dc1DB02A252b5b4814aD`

## Smart Contracts

| Contract | Description |
|----------|-------------|
| FlowGuardCore | Core payroll engine with batch USDC transfers |
| StealthPayments | Privacy-preserving payment channel |
| YieldVault | Aave V3 yield optimization for idle funds |
| ComplianceRegistry | On-chain compliance document registry |
| AgentPayGateway | Automated payroll trigger gateway |

## Getting Started

### Contracts

```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```
DEPLOYER_PRIVATE_KEY=
POLYGONSCAN_API_KEY=
VITE_WALLETCONNECT_PROJECT_ID=
```

## Deployment

```bash
cd contracts
npx hardhat run scripts/deploy-mainnet.ts --network polygon
```

## License

MIT
