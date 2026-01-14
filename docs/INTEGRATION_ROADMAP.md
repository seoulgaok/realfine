# 청약통장의 온체인화, 서울가옥

동별 Vault 기반 주거 접근권 시스템 통합 로드맵

---

## Core Concept: 동별 Vault

```
기존 청약통장                    서울가옥 RealFi
────────────────────────────────────────────────────
은행에 매월 납입                  동별 Vault에 USDT0 예치
가점 = 납입액 × 기간             Points = 예치액 × 기간
전국 분양 1회 사용                해당 동 프로젝트 우선권
중도 해지 시 손해                 vToken 담보 대출로 유동성 확보
분양 성공까지 대기                DAO 참여, 부지 선정부터 결정
```

---

## 동별 Vault 구조

```
서울시
├── 성동구
│   ├── 성수동 Vault ← 성수동 예비 입주자들의 USDT0 풀
│   │   ├── Total Value Locked: 500,000 USDT0
│   │   ├── Participants: 47명
│   │   ├── Points Leaderboard
│   │   └── DAO Governance
│   │
│   └── 금호동 Vault
│
├── 마포구
│   ├── 연남동 Vault
│   ├── 망원동 Vault
│   └── 합정동 Vault
│
└── [Other 구/동...]
```

---

## Points System

```
Points 계산식:
Points = Σ (예치금액 × 예치일수 / 365)

예시:
- 10,000 USDT0 × 1년 = 10,000 Points
- 5,000 USDT0 × 2년 = 10,000 Points
- 50,000 USDT0 × 6개월 = 25,000 Points

Points 순위에 따른 혜택:
1. 세대 선택 우선권 (층, 향, 면적)
2. 분양가 할인율
3. DAO 투표 가중치
```

---

## vToken Liquidity

```
예치 시:
USDT0 → DongVault → vToken (1:1) 발행

유동성 필요 시:
vToken을 담보로 USDT0 대출 (LTV 70%)
담보 유지 시 Points 계속 적립
청산 시 Points 비례 차감

예시:
- 10,000 vToken 보유
- 최대 7,000 USDT0 대출 가능
- 이자율: 5% APR
- Points 계속 적립 (담보 가치 기준)
```

---

## Smart Contracts Architecture

### 1. DongVault.sol (Per-Dong Vault)

```solidity
contract DongVault {
string public dongName;        // "성수동"
string public guName;          // "성동구"

mapping(address => uint256) public deposits;
mapping(address => uint256) public depositTimestamp;
mapping(address => uint256) public points;

IERC20 public usdt0;
VToken public vToken;

// 예치
function deposit(uint256 amount) external;

// 출금 (Points 비례 차감)
function withdraw(uint256 amount) external;

// Points 계산 (실시간)
function calculatePoints(address user) public view returns (uint256);

// Points 리더보드
function getLeaderboard() external view returns (UserPoints[] memory);
}
```

### 2. VToken.sol (Points Token)

```solidity
contract VToken is ERC20 {
DongVault public vault;

// vToken 담보 대출
function borrow(uint256 amount) external;

// 대출 상환
function repay(uint256 amount) external;

// 담보 청산
function liquidate(address borrower) external;

// 담보율 조회
function getHealthFactor(address user) external view returns (uint256);
}
```

### 3. DongDAO.sol (Per-Dong Governance)

```solidity
contract DongDAO {
VToken public votingToken;

// 제안 생성
function propose(
    string memory title,
    string memory description,
    ProposalType proposalType,
    bytes memory data
) external;

// 투표 (vToken 가중)
function vote(uint256 proposalId, bool support) external;

// 제안 실행
function execute(uint256 proposalId) external;

// 제안 유형
enum ProposalType {
    LAND_ACQUISITION,      // 토지 매입
    ARCHITECT_SELECTION,   // 건축사 선정
    DESIGN_APPROVAL,       // 설계안 승인
    BUDGET_ALLOCATION,     // 예산 집행
    CONTRACTOR_SELECTION   // 시공사 선정
}
}
```

### 4. DongVaultFactory.sol

```solidity
contract DongVaultFactory {
mapping(string => address) public dongVaults; // "성수동" => vault address

// 새 동 Vault 생성 (Admin only)
function createDongVault(
    string memory dongName,
    string memory guName
) external returns (address);

// 모든 동 Vault 조회
function getAllDongVaults() external view returns (DongVaultInfo[] memory);
}
```

---

## Database Schema (Supabase)

### 1. dong_vaults 테이블

```sql
CREATE TABLE public.dong_vaults (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
dong_name TEXT NOT NULL,           -- "성수동"
gu_name TEXT NOT NULL,             -- "성동구"
lat DECIMAL(10, 6) NOT NULL,
lon DECIMAL(10, 6) NOT NULL,
vault_address TEXT,                -- 온체인 vault 주소
dao_address TEXT,                  -- 온체인 DAO 주소
vtoken_address TEXT,               -- vToken 주소
total_value_locked BIGINT DEFAULT 0,
participant_count INTEGER DEFAULT 0,
is_active BOOLEAN DEFAULT TRUE,
network TEXT DEFAULT 'sepolia',
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW(),

UNIQUE(dong_name, gu_name)
);

CREATE INDEX idx_dong_vaults_gu ON public.dong_vaults(gu_name);
CREATE INDEX idx_dong_vaults_active ON public.dong_vaults(is_active);
```

### 2. dong_deposits 테이블

```sql
CREATE TABLE public.dong_deposits (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
dong_vault_id UUID NOT NULL REFERENCES public.dong_vaults(id),
user_id UUID REFERENCES public.user_profiles(id),
wallet_address TEXT NOT NULL,
amount BIGINT NOT NULL,
deposit_timestamp TIMESTAMPTZ NOT NULL,
current_points BIGINT DEFAULT 0,
tx_hash TEXT NOT NULL,
status TEXT DEFAULT 'active', -- 'active' | 'withdrawn' | 'liquidated'
created_at TIMESTAMPTZ DEFAULT NOW(),
updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dong_deposits_vault ON public.dong_deposits(dong_vault_id);
CREATE INDEX idx_dong_deposits_wallet ON public.dong_deposits(wallet_address);
CREATE INDEX idx_dong_deposits_points ON public.dong_deposits(current_points DESC);
```

### 3. dong_proposals 테이블

```sql
CREATE TABLE public.dong_proposals (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
dong_vault_id UUID NOT NULL REFERENCES public.dong_vaults(id),
proposal_type TEXT NOT NULL,     -- 'land' | 'architect' | 'design' | 'budget' | 'contractor'
title TEXT NOT NULL,
description TEXT,
proposer_address TEXT NOT NULL,
onchain_proposal_id BIGINT,
for_votes BIGINT DEFAULT 0,
against_votes BIGINT DEFAULT 0,
status TEXT DEFAULT 'pending',   -- 'pending' | 'active' | 'passed' | 'rejected' | 'executed'
execution_data JSONB,
voting_ends_at TIMESTAMPTZ,
created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. dong_projects 테이블 (프로젝트 = 동 내 특정 부지)

```sql
CREATE TABLE public.dong_projects (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
dong_vault_id UUID NOT NULL REFERENCES public.dong_vaults(id),
workspace_id UUID REFERENCES public.workspaces(id), -- 기존 workspace와 연결
name TEXT NOT NULL,
land_address TEXT,
land_area DECIMAL,
target_units INTEGER,            -- 목표 세대수 (10-20)
status TEXT DEFAULT 'planning',  -- 'planning' | 'approved' | 'construction' | 'completed'
architect_name TEXT,
floor_plans JSONB,
timeline JSONB,
created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Frontend Pages

### 1. RealFi Landing Page (/realfi)

**Title: "청약통장의 온체인화, 서울가옥"**

Content sections:
1. Hero: 동별 Vault 개념 소개
2. Points 시스템 설명
3. vToken 유동성 설명
4. DAO 거버넌스 설명
5. 참여 방법

### 2. Dong Explorer (/realfi/invest)

- 서울시 지도 (마포구, 성동구 등 구별 표시)
- 동별 Vault 카드 리스트
- 각 카드: TVL, 참여자 수, 활성 프로젝트 수
- 클릭 시 동 상세 페이지로 이동

### 3. Dong Detail (/realfi/dong/[dong])

- 예치/출금 인터페이스
- Points 리더보드
- 진행 중인 프로젝트
- DAO 제안 목록
- 최근 거래 내역

### 4. My Points (/realfi/portfolio)

- 동별 예치 현황
- 총 Points
- 동별 순위
- vToken 담보 현황
- 대출 상태

---

## CLI Commands Update

```bash
# 동 Vault 관리
realfi dong:list                    # 모든 동 Vault 조회
realfi dong:create --name "성수동" --gu "성동구"
realfi dong:status --name "성수동"
realfi dong:tvl                     # 전체 TVL 조회

# 테스트 시드 데이터
realfi seed:popular-dongs           # 인기 동 Vault 생성 (성수동, 연남동, 망원동 등)
realfi seed:deposits --dong "성수동" --count 10  # 테스트 예치 생성

# 기존 명령어
realfi deploy                       # Factory + 기본 컨트랙트 배포
realfi mint-test-tokens             # USDT0 테스트 토큰
realfi whitelist                    # KYC 화이트리스트
```

---

## Implementation Priority

### Phase 1: Core Contracts (Week 1-2)
- [ ] DongVaultFactory.sol
- [ ] DongVault.sol (deposit, withdraw, points calculation)
- [ ] VToken.sol (ERC20 + basic lending)
- [ ] Deploy to Mantle Sepolia

### Phase 2: Database & Sync (Week 2-3)
- [ ] Supabase schema migration
- [ ] dongData.ts → dong_vaults 시드
- [ ] Event indexer for deposits

### Phase 3: Frontend - Landing (Week 3)
- [ ] Update RealFiLanding.tsx with new narrative
- [ ] "청약통장의 온체인화" hero section
- [ ] Points system visualization
- [ ] vToken liquidity explanation

### Phase 4: Frontend - Dong Explorer (Week 3-4)
- [ ] Seoul map with gu/dong markers
- [ ] Dong vault cards with TVL, participants
- [ ] Deposit/withdraw modal
- [ ] Points leaderboard component

### Phase 5: DAO Governance (Week 4-5)
- [ ] DongDAO.sol
- [ ] Proposal creation UI
- [ ] Voting interface
- [ ] Execution flow

### Phase 6: vToken Lending (Week 5-6)
- [ ] Borrow/repay interface
- [ ] Health factor display
- [ ] Liquidation alerts
- [ ] Interest rate display

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. 동 선택                                                      │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  서울 지도                                                  │  │
│   │  ┌─────┐ ┌─────┐ ┌─────┐                                 │  │
│   │  │성수동│ │연남동│ │망원동│ ...                             │  │
│   │  └──┬──┘ └─────┘ └─────┘                                 │  │
│   │     │                                                      │  │
│   └─────┼──────────────────────────────────────────────────────┘  │
│         ▼                                                        │
│   2. 예치                                                         │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  성수동 Vault                                               │  │
│   │  ├── TVL: 500,000 USDT0                                   │  │
│   │  ├── 참여자: 47명                                           │  │
│   │  └── [10,000 USDT0 예치하기]                                │  │
│   │         │                                                   │  │
│   │         ▼                                                   │  │
│   │      USDT0 → DongVault → vToken 발행                        │  │
│   └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│   3. Points 적립                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  내 현황                                                     │  │
│   │  ├── 예치액: 10,000 USDT0                                  │  │
│   │  ├── 예치 기간: 180일                                       │  │
│   │  ├── Points: 4,932                                         │  │
│   │  └── 성수동 순위: 12위 / 47명                                │  │
│   └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│   4. DAO 참여                                                     │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  활성 제안                                                   │  │
│   │  ┌────────────────────────────────────────────────────┐   │  │
│   │  │ 📋 성수동 00-00번지 토지 매입 승인                       │   │  │
│   │  │    찬성: 320,000 vToken | 반대: 45,000 vToken          │   │  │
│   │  │    [찬성 투표] [반대 투표]                               │   │  │
│   │  └────────────────────────────────────────────────────┘   │  │
│   └──────────────────────────────────────────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│   5. 주거권 행사                                                   │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  프로젝트 완료 시                                             │  │
│   │  ├── Points 순위대로 세대 선택권 부여                         │  │
│   │  ├── 1순위: 501호 (로프트, 남향)                             │  │
│   │  ├── 2순위: 502호 (복층, 동향)                               │  │
│   │  └── ...                                                    │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start for Development

### 1. Seed Popular Dongs

```typescript
// Using dongData.ts
const POPULAR_DONGS = [
{ name: "성수동", gu: "성동구" },
{ name: "연남동", gu: "마포구" },
{ name: "망원동", gu: "마포구" },
{ name: "합정동", gu: "마포구" },
{ name: "한남동", gu: "용산구" },
{ name: "이태원동", gu: "용산구" },
{ name: "삼청동", gu: "종로구" },
{ name: "익선동", gu: "종로구" },
];

// Get coordinates from DONG_LIST
import { DONG_LIST } from '@/components/NaverMap/dongData';
const dong = DONG_LIST.find(d => d.name === "성수동");
// { name: "성수동", gu: "성동구", lat: 37.xxx, lon: 127.xxx }
```

### 2. Deploy Contracts

```bash
cd realfi/cli
pnpm realfi deploy --network sepolia
pnpm realfi dong:create --name "성수동" --gu "성동구"
```

### 3. Test Frontend

```bash
# Start development server
pnpm dev

# Navigate to /realfi
# Connect wallet, deposit to 성수동 vault
```

---

## Contracts Deployed (Mantle Sepolia)

```
DongVaultFactory:  TBD
USDT0:             0x1dbe1ff54c193388ce6d72c90149d0f9e1d079f3
KYCRegistry:       0x9898ee2236717ca8139c171fa97d7baf49bcf6db

Per-Dong Vaults:
성수동:            TBD
연남동:            TBD
망원동:            TBD
```

---

## References

- [Compound](https://compound.finance) - Points calculation
- [청약통장 제도](https://www.hf.go.kr) - Traditional housing subscription
- [dongData.ts](/src/components/NaverMap/dongData.ts) - Seoul dong coordinates
