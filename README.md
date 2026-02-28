<div align="center">

# 🛡️ FlowGuard Protocol

### Private Payroll for the Global Economy

[![Polygon Mainnet](https://img.shields.io/badge/Network-Polygon%20Mainnet-8247E5?style=for-the-badge&logo=polygon)](https://polygon.technology)
[![USDC](https://img.shields.io/badge/Currency-USDC-2775CA?style=for-the-badge&logo=circle)](https://www.circle.com/usdc)
[![Aave V3](https://img.shields.io/badge/Yield-Aave%20V3-B6509E?style=for-the-badge&logo=aave)](https://aave.com)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636?style=for-the-badge&logo=solidity)](https://soliditylang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-00E0C7?style=for-the-badge)](LICENSE)

**Secure • Compliant • Real-Time USDC Settlement on Polygon**

*Batch payroll, stealth payments, yield optimization, on-chain compliance — all in one protocol.*

[Launch App](#-getting-started) · [Smart Contracts](#-smart-contracts) · [Architecture](#-architecture) · [Features](#-features)

</div>

---

## 🌍 The Problem

Traditional payroll is slow, expensive, and opaque. Cross-border payments take 3-5 days, cost 3-7% in fees, and expose sensitive salary data. Crypto payroll solutions exist but lack compliance tooling, privacy features, and treasury optimization.

## ✅ The Solution

**FlowGuard Protocol** is a production-grade, privacy-first payroll platform deployed on **Polygon Mainnet** that settles payments in **native USDC** with sub-second finality and near-zero gas costs. It combines:

- **Batch payroll** — pay up to 200 recipients in a single transaction
- **Stealth payments** — privacy-preserving payment channels with ephemeral key cryptography
- **Yield optimization** — idle treasury earns yield through Aave V3 automatically
- **On-chain compliance** — immutable document registry with IPFS hashing, audit-ready
- **Agent automation** — scheduled payroll execution with signature verification

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FlowGuard Frontend                       │
│         React 18 · Vite 6 · wagmi v2 · viem v2             │
│       Framer Motion · Recharts · Tailwind CSS 3.4           │
└──────────────────────────┬──────────────────────────────────┘
                           │ JSON-RPC via WalletConnect / MetaMask
┌──────────────────────────▼──────────────────────────────────┐
│               Polygon Mainnet (Chain ID: 137)               │
│                                                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │  FlowGuardCore  │  │ StealthPayments  │  │ YieldVault│  │
│  │  Batch Payroll   │  │ Private Payments │  │ Aave V3   │  │
│  └────────┬────────┘  └──────────────────┘  └─────┬─────┘  │
│           │                                       │         │
│  ┌────────▼────────┐  ┌──────────────────┐  ┌─────▼─────┐  │
│  │AgentPayGateway  │  │ComplianceRegistry│  │ Aave Pool │  │
│  │ Scheduled Pay   │  │ Doc Verification │  │  (0x794…) │  │
│  └─────────────────┘  └──────────────────┘  └───────────┘  │
│                                                             │
│                    Native USDC (0x3c4…)                     │
└─────────────────────────────────────────────────────────────┘
```

All smart contracts are **UUPS upgradeable proxies** with **role-based access control** (OpenZeppelin v5.6.1) and **transient storage reentrancy guards** (EIP-1153).

---

## 📜 Smart Contracts

All contracts are **live on Polygon Mainnet** and deployed as UUPS proxies.

### 1. FlowGuardCore — Batch Payroll Engine

| | Address |
|---|---|
| **Proxy** | [`0x14fE638867383b162B8C08B97Dd7eBE15a9819BE`](https://polygonscan.com/address/0x14fE638867383b162B8C08B97Dd7eBE15a9819BE) |
| **Implementation** | [`0x2253e207f4bD5256F678403133670BE2EC659A5A`](https://polygonscan.com/address/0x2253e207f4bD5256F678403133670BE2EC659A5A) |

The core payroll engine. Handles batch USDC transfers to up to 200 recipients in a single transaction.

| Function | Access | Description |
|---|---|---|
| `initialize(usdc, admin)` | Initializer | Sets USDC token, grants DEFAULT_ADMIN, ADMIN, PAYER roles |
| `executePayroll(recipients[], amounts[])` | `PAYER_ROLE` | Pulls total USDC from caller, distributes to each recipient |
| `addRecipient(address, label)` | `ADMIN_ROLE` | Registers a payroll recipient with a label |
| `removeRecipient(address)` | `ADMIN_ROLE` | Removes a recipient (swap-and-pop) |
| `pause() / unpause()` | `ADMIN_ROLE` | Emergency pause for payroll execution |
| `getRecipients()` | View | Returns all registered recipient addresses |
| `getBatch(batchId)` | View | Returns batch details (payer, amount, count, timestamp) |
| `getTotalDisbursed()` | View | Cumulative USDC disbursed across all batches |
| `getBatchCount()` | View | Total number of executed payroll batches |

**Events:** `PayrollExecuted` · `RecipientAdded` · `RecipientRemoved`

---

### 2. StealthPayments — Privacy-Preserving Payments

| | Address |
|---|---|
| **Proxy** | [`0x76243030cD06350D37eE75c58C32F162Bb47AC34`](https://polygonscan.com/address/0x76243030cD06350D37eE75c58C32F162Bb47AC34) |
| **Implementation** | [`0x83E0D2786636DF984989F3E83187DC0071B47646`](https://polygonscan.com/address/0x83E0D2786636DF984989F3E83187DC0071B47646) |

Enables private payments using ephemeral key cryptography. Funds are held in the contract until the intended recipient claims them with a cryptographic proof.

| Function | Access | Description |
|---|---|---|
| `sendStealthPayment(amount, ephemeralPubKeyHash, stealthMetadata)` | Anyone | Pulls USDC, stores payment with encrypted metadata |
| `claimStealthPayment(paymentId, recipient, proof)` | Anyone | Verifies EIP-191 signature proof, releases USDC to recipient |
| `getPayment(paymentId)` | View | Returns payment details (sender, amount, claimed status) |
| `getTotalStealthVolume()` | View | Cumulative USDC transacted via stealth channels |
| `getPaymentCount()` | View | Total stealth payments created |

**Events:** `StealthPaymentSent` · `StealthPaymentClaimed`

---

### 3. YieldVault — Aave V3 Treasury Optimization

| | Address |
|---|---|
| **Proxy** | [`0x13bEA23ED1d2fF7e4a60c5e80c4D4cB3C9921Ba5`](https://polygonscan.com/address/0x13bEA23ED1d2fF7e4a60c5e80c4D4cB3C9921Ba5) |
| **Implementation** | [`0x1503b33aBCCBaE3291E6bDAE89a909CDCd83Bf55`](https://polygonscan.com/address/0x1503b33aBCCBaE3291E6bDAE89a909CDCd83Bf55) |

Deposits idle USDC into Aave V3 Pool on Polygon to earn yield. Tracks per-user principal and calculates proportional yield.

| Function | Access | Description |
|---|---|---|
| `deposit(amount)` | Anyone | Pulls USDC, supplies to Aave V3, tracks principal |
| `withdraw(amount)` | Anyone | Withdraws from Aave, returns USDC + accrued yield |
| `getDeposit(user)` | View | User's deposited principal |
| `getYield(user)` | View | User's proportional accrued yield |
| `getTotalDeposits()` | View | Sum of all user principals |
| `getTotalBalance()` | View | Current aToken balance (principal + yield) |
| `pause() / unpause()` | `ADMIN_ROLE` | Emergency pause |

**Yield Formula:** `userYield = (userDeposit / totalDeposits) × (aTokenBalance − totalDeposits)`

**Events:** `Deposited` · `Withdrawn` · `YieldClaimed`

---

### 4. ComplianceRegistry — On-Chain Document Verification

| | Address |
|---|---|
| **Proxy** | [`0xDf7d92C0f29c587515b444Dc2bB6880233500915`](https://polygonscan.com/address/0xDf7d92C0f29c587515b444Dc2bB6880233500915) |
| **Implementation** | [`0xFaFFB5649506977d0fFA3035Edc72aD2aCD86591`](https://polygonscan.com/address/0xFaFFB5649506977d0fFA3035Edc72aD2aCD86591) |

Immutable compliance document registry. Stores SHA-256 document hashes with IPFS CIDs for verifiable, audit-ready compliance records.

| Function | Access | Description |
|---|---|---|
| `registerDocument(docHash, ipfsCid)` | `COMPLIANCE_OFFICER` | Stores document hash + IPFS CID on-chain |
| `verifyDocument(docHash)` | `COMPLIANCE_OFFICER` | Marks a document as verified |
| `setEntityVerification(entity, verified)` | `COMPLIANCE_OFFICER` | Sets KYC/KYB verification for a wallet |
| `getDocument(docHash)` | View | Returns document record (registrant, timestamp, verified) |
| `isEntityVerified(entity)` | View | Check entity's verification status |
| `getTotalDocuments() / getVerifiedDocuments()` | View | Document counters |

**Events:** `DocumentRegistered` · `DocumentVerified` · `EntityVerificationUpdated`

---

### 5. AgentPayGateway — Automated Scheduled Payroll

| | Address |
|---|---|
| **Proxy** | [`0x39AFFC98a2a29bB990a1A7Fec5a777cFbA2E8177`](https://polygonscan.com/address/0x39AFFC98a2a29bB990a1A7Fec5a777cFbA2E8177) |
| **Implementation** | [`0xd544F2E0cB3f9334Da3313F4456D21433852EC19`](https://polygonscan.com/address/0xd544F2E0cB3f9334Da3313F4456D21433852EC19) |

Enables automated, scheduled payroll execution through registered agent wallets with EIP-191 signature verification and nonce replay protection.

| Function | Access | Description |
|---|---|---|
| `registerAgent(agent)` | `ADMIN_ROLE` | Grants `AGENT_ROLE` to an address |
| `revokeAgent(agent)` | `ADMIN_ROLE` | Revokes agent authorization |
| `schedulePayroll(recipients[], amounts[], executeAfter)` | `ADMIN_ROLE` | Creates a time-locked payroll batch |
| `executeScheduledPayroll(payrollId, nonce, signature)` | `AGENT_ROLE` | Executes with EIP-191 signature + nonce check |
| `getPayroll(payrollId)` | View | Scheduled payroll details |
| `getTotalScheduled() / getTotalExecuted()` | View | Counters |
| `isNonceUsed(nonce)` | View | Replay protection check |

**Events:** `AgentRegistered` · `AgentRevoked` · `PayrollScheduled` · `PayrollExecutedByAgent`

---

## 🖥️ Frontend Pages

| Page | Route | Description |
|---|---|---|
| 🏠 **Landing** | `/` | Cinematic hero with video background, particle effects, feature showcase |
| 📊 **Dashboard** | `/app` | Live stats: USDC balance, total disbursed, vault APY, compliance score, batch count |
| 💸 **Payroll** | `/app/payroll` | Build & execute batch payments. Role check (PAYER_ROLE), real-time USDC balance |
| 🏦 **Vault** | `/app/vault` | Deposit/withdraw USDC to Aave V3. Live APY, yield tracking, deposit history |
| 👥 **Recipients** | `/app/recipients` | Manage payroll recipients. Add labels, search, view on PolygonScan |
| 📋 **Compliance** | `/app/compliance` | Register documents (SHA-256 hash + IPFS CID), verify, compliance score gauge |
| 📈 **Analytics** | `/app/analytics` | Payroll volume charts, vault TVL breakdown, APY gauge, KPI cards |
| ⚙️ **Settings** | `/app/settings` | Wallet info, disconnect, protocol configuration, contract addresses |

---

## 🔥 Key Features

| Feature | Details |
|---|---|
| **Batch Payroll** | Up to 200 recipients per transaction, single USDC approval |
| **Stealth Payments** | Ephemeral key cryptography + EIP-191 claim proofs for privacy |
| **Aave V3 Yield** | Idle USDC earns yield automatically, proportional distribution |
| **On-Chain Compliance** | SHA-256 document hashing, IPFS storage, KYC/KYB verification |
| **Agent Automation** | Time-locked scheduled payroll with signature-verified execution |
| **UUPS Upgradeable** | All 5 contracts are proxy-upgradeable for future improvements |
| **Role-Based Access** | Granular roles: ADMIN, PAYER, AGENT, COMPLIANCE_OFFICER |
| **EIP-1153 Transient Storage** | Gas-efficient reentrancy guards using Cancun opcodes |
| **Real-Time APY** | Live Aave V3 liquidity rate displayed in the UI |
| **Glass UI** | Cinematic dark theme with glass morphism, Framer Motion animations |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Blockchain** | Polygon Mainnet (Chain ID: 137) |
| **Smart Contracts** | Solidity 0.8.24, OpenZeppelin v5.6.1, Hardhat |
| **Token** | Native USDC (`0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359`) |
| **DeFi** | Aave V3 Pool (`0x794a61358D6845594F94dc1DB02A252b5b4814aD`) |
| **Frontend** | React 18, TypeScript, Vite 6 |
| **Web3** | wagmi v2, viem v2, WalletConnect, MetaMask |
| **Styling** | Tailwind CSS 3.4, Framer Motion, Recharts |
| **Proxy Pattern** | UUPS (EIP-1822) with OpenZeppelin Upgrades Plugin |
| **Security** | ReentrancyGuardTransient (EIP-1153), SafeERC20 |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MetaMask or WalletConnect-compatible wallet
- MATIC for gas on Polygon
- USDC on Polygon for payroll/vault operations

### Installation

```bash
# Clone the repository
git clone https://github.com/macjoy23/FlowGuard-Protocol.git
cd FlowGuard-Protocol

# Install frontend dependencies
cd frontend
npm install

# Start development server
npm run dev
```

### Smart Contract Development

```bash
cd contracts
npm install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Polygon Mainnet
npx hardhat run scripts/deploy-mainnet.ts --network polygon
```

### Grant Payroll Roles

```bash
cd contracts
GRANT_TO=0xYourWalletAddress npx hardhat run scripts/grant-roles.ts --network polygon
```

### Environment Variables

Create a `.env` file at the project root:

```env
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
POLYGON_RPC_URL=https://polygon.drpc.org

VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
VITE_POLYGON_RPC=https://polygon.drpc.org
VITE_USDC_ADDRESS=0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
VITE_AAVE_POOL=0x794a61358D6845594F94dc1DB02A252b5b4814aD

VITE_FLOWGUARD_CORE=0x14fE638867383b162B8C08B97Dd7eBE15a9819BE
VITE_STEALTH_PAYMENTS=0x76243030cD06350D37eE75c58C32F162Bb47AC34
VITE_YIELD_VAULT=0x13bEA23ED1d2fF7e4a60c5e80c4D4cB3C9921Ba5
VITE_COMPLIANCE_REGISTRY=0xDf7d92C0f29c587515b444Dc2bB6880233500915
VITE_AGENT_GATEWAY=0x39AFFC98a2a29bB990a1A7Fec5a777cFbA2E8177
```

---

## 📁 Project Structure

```
FlowGuard-Protocol/
├── contracts/
│   ├── contracts/
│   │   ├── FlowGuardCore.sol          # Batch payroll engine
│   │   ├── StealthPayments.sol        # Privacy payments
│   │   ├── YieldVault.sol             # Aave V3 yield vault
│   │   ├── ComplianceRegistry.sol     # Document registry
│   │   ├── AgentPayGateway.sol        # Scheduled automation
│   │   └── interfaces/               # Contract interfaces
│   ├── scripts/
│   │   ├── deploy-mainnet.ts          # Production deployment
│   │   └── grant-roles.ts            # Role management
│   ├── test/                          # Hardhat test suites
│   └── hardhat.config.ts
├── frontend/
│   ├── src/
│   │   ├── pages/                     # 8 route pages
│   │   ├── hooks/                     # Contract interaction hooks
│   │   ├── components/                # UI components
│   │   ├── lib/                       # ABIs, utils, animations
│   │   └── config/                    # Constants, addresses
│   └── vite.config.ts
└── .env                               # Environment variables
```

---

## 🔒 Security

- **UUPS Proxy Pattern** — upgradeable by DEFAULT_ADMIN_ROLE only
- **Role-Based Access Control** — separate ADMIN, PAYER, AGENT, COMPLIANCE_OFFICER roles
- **ReentrancyGuardTransient** — gas-efficient EIP-1153 transient storage reentrancy protection
- **SafeERC20** — safe token transfer wrappers prevent silent failures
- **EIP-191 Signature Verification** — stealth claims and agent execution require valid signatures
- **Nonce Replay Protection** — prevents double-execution of scheduled payrolls
- **Pausable** — all critical contracts can be paused by admins in emergencies
- **NetworkGuard** — frontend enforces Polygon Mainnet connection

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

**Built with 🛡️ on Polygon Mainnet**

*FlowGuard Protocol — Where payroll meets privacy, compliance, and DeFi yield.*

</div>
