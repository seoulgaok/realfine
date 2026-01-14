# RealFiNE - The On-chain Housing Vault Protocol

> 🏠 **Priority over Ownership** - A revolutionary approach to housing access in Seoul

[![Mantle Sepolia](https://img.shields.io/badge/Network-Mantle%20Sepolia-blue)](https://sepolia.mantlescan.xyz)
[![License](https://img.shields.io/badge/License-Proprietary-red)](LICENSE)

## Overview

RealFiNE is an on-chain housing vault protocol that tokenizes Seoul's neighborhood-based housing subscription system. Instead of competing in lotteries with uncertain outcomes, users deposit stablecoins into dong-specific vaults, receive rent subsidies from DeFi yields, and gain priority access to housing projects.

### Key Innovation: Regional Vault System

Seoul has **426 administrative dongs** (neighborhoods). Each dong gets its own dedicated vault:

- Deposits are stablecoin (USDT0) based
- 6% annual rent subsidy from DeFi yields
- Home Credits serve as DAO governance tokens

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    RealFiNE Protocol                        │
├─────────────────────────────────────────────────────────────┤
│  User deposits USDT0 → Receives Home Credit 1:1             │
│  While waiting: 6% annual rent subsidy                      │
│  Points accumulate: Deposit × Time                          │
│  When building completed: Points decide housing priority    │
└─────────────────────────────────────────────────────────────┘
```

### Double Benefit Model

| Benefit | Description |
|---------|-------------|
| 🏦 **Rent Subsidy** | 6% annual rent subsidy while waiting |
| 🏠 **Housing Priority** | Points decide unit selection order when building is completed |

### Yield Model: Rent Subsidy from DeFi

```
100M KRW Home Credit → 500K KRW/month rent subsidy (6% annual return)
```

**Fund Portfolio Allocation:**
| Allocation | Strategy | APY |
|------------|----------|-----|
| 50% | mETH Staking | 2% |
| 50% | ETH Delta-Neutral (Funding Fee) | 10.95% |
| **Blended** | | **6.5%** |

**Capital Flow:**
- 6.0% → Rent subsidy to residents
- 0.5% → DAO reserve & operations
- 35% of TVL → Construction capital (via mETH 70% LTV collateral)

> *"Home Credit is a fixed-income housing bond where 6% interest is paid as rent discount, and principal builds the city through DeFi leverage."*

## Architecture

### Smart Contracts (Mantle Sepolia)

| Contract | Address | Description |
|----------|---------|-------------|
| USDT0 | `0xa45d94eb6752b5b465e62f128c8d10771b7fde0a` | Test stablecoin (6 decimals) |
| KYCRegistry | `0x364ac44b504458303c3a9b8faff6ef806590000c` | KYC verification registry |
| DongVaultFactory | `0x40f304876e71867bc54324256eea9f125ff958b4` | Factory for dong vaults |
| 오금동 Vault | `0x7488f44BF19A3cbCa70cd4117f05F46D127aF93A` | First live dong vault |
| 오금동 vToken | `0xf846e3ffc2eff1adaf17dcd68579db9fb9ac4a9c` | Investment token |

### Tech Stack

- **Blockchain**: Mantle Network (L2)
- **Smart Contracts**: Solidity 0.8.28
- **Frontend**: Next.js 14, React 18, TypeScript
- **Web3**: wagmi, viem
- **Styling**: Tailwind CSS
- **i18n**: next-intl (Korean/English)

## Project Structure

```
realfine-protocol/
├── contracts/           # Solidity smart contracts
│   ├── DongVault.sol
│   ├── DongVaultFactory.sol
│   ├── VToken.sol
│   ├── USDT0.sol
│   └── KYCRegistry.sol
│
├── cli/                 # CLI deployment tools
│   ├── src/
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── deployer.ts
│   │   └── commands/
│   └── package.json
│
├── shared/              # Shared configuration
│   └── dongs.ts
│
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── lib/wagmi/
│   └── package.json
│
└── deployed-addresses.json
```

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- MetaMask or compatible wallet
- Mantle Sepolia testnet MNT (for gas)

### 1. Clone & Install

```bash
git clone https://github.com/seoulgaok/realfine.git
cd realfine-protocol

# Install CLI dependencies
cd cli && pnpm install && cd ..

# Install frontend dependencies
cd frontend && pnpm install && cd ..
```

### 2. Environment Setup

```bash
# CLI (.env in cli/)
cp cli/.env.example cli/.env
# Add: REALFI_DEPLOYER_PRIVATE_KEY=your_private_key

# Frontend (.env.local in frontend/)
cp frontend/.env.example frontend/.env.local
```

### 3. Run Frontend

```bash
cd frontend
pnpm dev
# Open http://localhost:3000
```

### 4. Deploy Contracts (Optional)

```bash
cd cli
pnpm realfi deploy        # Deploy full system
pnpm realfi status        # Check deployment
pnpm realfi dong:list     # List all vaults
```

## CLI Commands

```bash
# Deployment
pnpm realfi deploy                    # Deploy all contracts
pnpm realfi deploy:token              # Deploy USDT0 only

# Dong Vault Management
pnpm realfi dong:list                 # List all dongs
pnpm realfi dong:create --name 오금동 --gu 송파구
pnpm realfi dong:status --name 오금동
pnpm realfi dong:seed                 # Seed initial dongs

# Admin
pnpm realfi whitelist --action add --address 0x...
pnpm realfi mint-test-tokens --to 0x... --amount 1000
pnpm realfi status                    # Show all info
```

## Points System (Housing Priority)

When the building is completed, points determine unit selection order.

```
Points = Deposit Amount × (Days Held / 365)
```

### Example
- Deposit: 100,000 USDT0
- Duration: 365 days (1 year)
- Points: 100,000 × 1 = **100,000 points**

Higher points = Earlier unit selection when building is done.

## Governance

Each Home Credit equals one vote in the DAO:

- **Proposal Creation**: Minimum 1,000 Home Credits
- **Voting Period**: 7 days
- **Quorum**: 10% of total Home Credit supply
- **Execution**: 48-hour timelock

## Security

- ✅ KYC verification required for deposits
- ✅ Reentrancy protection on all state-changing functions
- ✅ Pausable contracts for emergency stops
- ✅ Factory pattern isolates risk per dong

## Active Dongs

| Dong | Gu (District) | Status |
|------|---------------|--------|
| 오금동 | 송파구 | 🟢 Live |
| 광장동 | 광진구 | 🟡 Coming Soon |
| 동숭동 | 종로구 | 🟡 Coming Soon |
| 신정동 | 양천구 | 🟡 Coming Soon |

## Roadmap

- [x] Phase 1: Core contracts & factory system
- [x] Phase 2: Frontend MVP with wallet integration
- [x] Phase 3: KYC flow implementation
- [ ] Phase 4: mETH yield integration
- [ ] Phase 5: Cross-vault bridge
- [ ] Phase 6: DAO governance launch

## Network Configuration

### Mantle Sepolia Testnet
- **Chain ID**: 5003
- **RPC URL**: `https://rpc.sepolia.mantle.xyz`
- **Explorer**: `https://sepolia.mantlescan.xyz`
- **Native Currency**: MNT

### Get Test Tokens
1. Get MNT from [Mantle Faucet](https://faucet.sepolia.mantle.xyz/)
2. Use in-app faucet to get 1,000 USDT0

## Links

- 📜 [Whitepaper](./docs/WHITEPAPER.md)
- 🔍 [Mantle Explorer](https://sepolia.mantlescan.xyz)
- 📊 [Integration Roadmap](./docs/INTEGRATION_ROADMAP.md)

## Team

Built for Mantle Hackathon 2026

## License

Proprietary - All Rights Reserved. See [LICENSE](LICENSE) for details.

---

**"Many homes, our network, one giant block"**
