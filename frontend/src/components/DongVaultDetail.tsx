"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Users, TrendingUp, Award, Vote, Wallet, ArrowUpRight, ArrowDownRight, ExternalLink, Plus, ChevronRight, Check, Loader2, Coins, AlertCircle } from "lucide-react";
import { Link } from "@/i18n/routing";
 import { useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { parseUnits } from "viem";
import { CONTRACTS, DONG_VAULTS, ERC20_ABI } from "@/lib/wagmi/config";
import { useDongVault } from "@/hooks/useDongVault";
import type { LocInfo } from "@/components/NaverMap/dongData";
import { formatPrice, formatArea } from "@/utils/price";

interface DongVaultDetailProps {
  dongName: string;
  dongData: LocInfo;
}

interface Land {
  id: string;
  land_location: string;
  road_location: string | null;
  price: number;
  garea: number;
  zone_nm: string | null;
}

interface Workspace {
  id: string;
  name: string;
  slug: string;
  cover_image: string | null;
  status: string;
  tags: string[];
  summary: string[];
  target_participant: number | null;
  price_per_one: number | null;
}

interface VoteData {
  [id: string]: { yes: number; no: number };
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

// KYC Registry ABI for checking verification status
const KYC_REGISTRY_ABI = [
  {
    inputs: [{ name: "user", type: "address" }],
    name: "isVerified",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Deposit Form Component
function DepositForm({ dongName, vaultAddress }: { dongName: string; vaultAddress: `0x${string}` }) {
  const t = useTranslations("realfi.vaultDetail");
  const [amount, setAmount] = useState("");
  const [is1YearLockup, setIs1YearLockup] = useState(false);
  const [step, setStep] = useState<"input" | "approving" | "depositing">("input");
  const [approvalComplete, setApprovalComplete] = useState(false);

  const vault = useDongVault({ dongName });
  const needsApproval = !approvalComplete && vault.needsApproval(amount);

  // Check KYC status
  const { data: isKYCVerified } = useContractRead({
    address: CONTRACTS.KYC_REGISTRY,
    abi: KYC_REGISTRY_ABI,
    functionName: "isVerified",
    args: vault.address ? [vault.address] : undefined,
    enabled: !!vault.address,
    watch: true,
  });

  // Approve hook - approve max amount to avoid needing multiple approvals
  const { config: approveConfig } = usePrepareContractWrite({
    address: CONTRACTS.USDT0,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [vaultAddress, BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")], // max uint256
    enabled: !!amount && Number(amount) > 0 && needsApproval,
  });
  const { write: approve, data: approveData, isLoading: isApproving } = useContractWrite(approveConfig);
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } = useWaitForTransaction({
    hash: approveData?.hash,
  });

  // Deposit hook - always prepare when amount is valid
  const { config: depositConfig, refetch: refetchDepositConfig, error: depositPrepareError, isError: isDepositPrepareError } = usePrepareContractWrite({
    address: vaultAddress,
    abi: [
      {
        inputs: [
          { name: "amount", type: "uint256" },
          { name: "withLockup", type: "bool" },
        ],
        name: "deposit",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "deposit",
    args: [amount ? parseUnits(amount, 6) : BigInt(0), is1YearLockup],
    enabled: !!amount && Number(amount) > 0 && (!needsApproval || approvalComplete),
  });
  const { write: deposit, data: depositData, isLoading: isDepositing, error: depositWriteError } = useContractWrite(depositConfig);

  // Debug logging
  useEffect(() => {
    if (depositPrepareError) {
      console.error("Deposit prepare error:", depositPrepareError);
    }
    if (depositWriteError) {
      console.error("Deposit write error:", depositWriteError);
    }
  }, [depositPrepareError, depositWriteError]);
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransaction({
    hash: depositData?.hash,
  });

  // After approval success, refetch and enable deposit
  useEffect(() => {
    if (isApproveSuccess) {
      setApprovalComplete(true);
      vault.refetchAll().then(() => {
        refetchDepositConfig();
      });
      setStep("input");
    }
  }, [isApproveSuccess]);

  useEffect(() => {
    if (isDepositSuccess) {
      vault.refetchAll();
      setAmount("");
      setStep("input");
      setApprovalComplete(false);
    }
  }, [isDepositSuccess]);

  // Reset approval state when amount changes
  useEffect(() => {
    setApprovalComplete(false);
  }, [amount]);

  const handleAction = () => {
    if (needsApproval) {
      setStep("approving");
      approve?.();
    } else {
      setStep("depositing");
      deposit?.();
    }
  };

  const isLoading = isApproving || isApproveConfirming || isDepositing || isDepositConfirming;
  const canDeposit = amount && Number(amount) > 0 && Number(amount) <= Number(vault.formattedUsdt0Balance);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("depositAmount")}</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-4 border-2 border-gray-200 focus:border-gray-900 outline-none text-xl"
            disabled={isLoading}
          />
          <button
            onClick={() => setAmount(vault.formattedUsdt0Balance)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900"
            disabled={isLoading}
          >
            MAX
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t("balance")}: {vault.formattedUsdt0Balance} USDT0</p>
      </div>

      <label className="flex items-start gap-3 p-4 border-2 border-gray-200 cursor-pointer hover:border-gray-400">
        <input
          type="checkbox"
          checked={is1YearLockup}
          onChange={(e) => setIs1YearLockup(e.target.checked)}
          className="mt-1 w-5 h-5"
          disabled={isLoading}
        />
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900">{t("yearLockup")}</span>
            <span className="px-2 py-0.5 text-xs font-bold bg-gray-900 text-white">+10% Points</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{t("lockupNote")}</p>
        </div>
      </label>

      {/* KYC Not Verified Warning */}
      {isKYCVerified === false && (
        <div className="p-4 bg-red-50 border-2 border-red-200">
          <div className="flex items-center gap-2 font-medium text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            KYC 인증이 필요합니다
          </div>
          <p className="mt-2 text-sm text-red-700">
            예치하려면 먼저 KYC 인증을 완료해야 합니다.
          </p>
          <Link
            href="/realfi/kyc"
            className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            KYC 인증하기 <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {needsApproval && amount && Number(amount) > 0 && isKYCVerified && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          USDT0 승인이 필요합니다
        </div>
      )}

      {isDepositPrepareError && depositPrepareError && isKYCVerified && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            예치 오류
          </div>
          <p className="mt-1 text-xs break-all">
            {(depositPrepareError as Error).message?.slice(0, 200) || "알 수 없는 오류가 발생했습니다."}
          </p>
        </div>
      )}

      <button
        onClick={handleAction}
        disabled={!canDeposit || isLoading || isKYCVerified === false}
        className="w-full py-4 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {step === "approving" ? "승인 중..." : "예치 중..."}
          </>
        ) : isKYCVerified === false ? (
          "KYC 인증 필요"
        ) : needsApproval ? (
          <>
            <Check className="h-5 w-5" />
            USDT0 승인
          </>
        ) : (
          t("depositToVault", { dong: dongName })
        )}
      </button>

      {(approveData?.hash || depositData?.hash) && (
        <a
          href={`https://sepolia.mantlescan.xyz/tx/${approveData?.hash || depositData?.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          트랜잭션 확인 <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

// Withdraw Form Component
function WithdrawForm({ dongName, vaultAddress }: { dongName: string; vaultAddress: `0x${string}` }) {
  const t = useTranslations("realfi.vaultDetail");
  const [amount, setAmount] = useState("");
  const vault = useDongVault({ dongName });

  const { config } = usePrepareContractWrite({
    address: vaultAddress,
    abi: [
      {
        inputs: [{ name: "amount", type: "uint256" }],
        name: "withdraw",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
    ],
    functionName: "withdraw",
    args: [amount ? parseUnits(amount, 6) : BigInt(0)],
    enabled: !!amount && Number(amount) > 0,
  });
  const { write: withdraw, data: withdrawData, isLoading: isWithdrawing } = useContractWrite(config);
  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({ hash: withdrawData?.hash });

  useEffect(() => {
    if (isSuccess) {
      vault.refetchAll();
      setAmount("");
    }
  }, [isSuccess]);

  const isLoading = isWithdrawing || isConfirming;
  const canWithdraw = amount && Number(amount) > 0 && Number(amount) <= Number(vault.formattedVTokenBalance);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">{t("withdrawAmount")}</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full p-4 border-2 border-gray-200 focus:border-gray-900 outline-none text-xl"
            disabled={isLoading}
          />
          <button
            onClick={() => setAmount(vault.formattedVTokenBalance)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900"
            disabled={isLoading}
          >
            MAX
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">Home credit 잔액: {vault.formattedVTokenBalance}</p>
      </div>

      {amount && Number(amount) > 0 && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">출금 시 포인트가 차감됩니다</p>
            <p className="text-xs mt-1 text-yellow-700">Home credit을 출금하면 해당 금액에 대한 포인트와 투표권이 사라집니다.</p>
          </div>
        </div>
      )}

      <button
        onClick={() => withdraw?.()}
        disabled={!canWithdraw || isLoading}
        className="w-full py-4 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            출금 중...
          </>
        ) : (
          t("withdrawBtn")
        )}
      </button>

      {withdrawData?.hash && (
        <a
          href={`https://sepolia.mantlescan.xyz/tx/${withdrawData.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          트랜잭션 확인 <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}

export function DongVaultDetail({ dongName, dongData }: DongVaultDetailProps) {
  const t = useTranslations("realfi.vaultDetail");
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");
  const [lands, setLands] = useState<Land[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoadingLands, setIsLoadingLands] = useState(true);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [workspaceVotes, setWorkspaceVotes] = useState<VoteData>({});
  const [votedWorkspaces, setVotedWorkspaces] = useState<Set<string>>(new Set());

  const dongVault = DONG_VAULTS[dongName];

  // Always call hook - we'll handle missing vault in render
  const vault = useDongVault({ dongName: dongVault ? dongName : "오금동" });

  useEffect(() => {
    async function fetchLands() {
      setIsLoadingLands(true);
      try {
        const params = new URLSearchParams();
        params.set('emdNm', dongName);
        params.set('limit', '3');
        // Apply "원클릭 추천" filters for RealFi-suitable lands
        params.set('groundSpace', '150-300');
        params.set('ageRange', '30+');
        params.set('zone', '제1종일반주거지역,제2종일반주거지역,제3종일반주거지역');
        params.set('terrainHeight', '평지');
        params.set('useEtc', '주택,단독,다세대,다가구');
        const res = await fetch(`/api/lands?${params.toString()}`);
        const data = await res.json();
        setLands(data.lands || []);
      } catch (error) {
        console.error("Error fetching lands:", error);
      } finally {
        setIsLoadingLands(false);
      }
    }
    fetchLands();
  }, [dongName]);

  useEffect(() => {
    async function fetchWorkspaces() {
      setIsLoadingWorkspaces(true);
      try {
        const res = await fetch(`/api/realfi/workspaces?limit=5&dong=${encodeURIComponent(dongName)}`);
        const data = await res.json();
        setWorkspaces(data.workspaces || []);
        const votes: VoteData = {};
        (data.workspaces || []).forEach((ws: Workspace) => {
          votes[ws.id] = { yes: Math.floor(Math.random() * 200000) + 50000, no: Math.floor(Math.random() * 100000) + 20000 };
        });
        setWorkspaceVotes(votes);
      } catch (error) {
        console.error("Error fetching workspaces:", error);
      } finally {
        setIsLoadingWorkspaces(false);
      }
    }
    fetchWorkspaces();
  }, [dongName]);

  const handleVote = (workspaceId: string, voteType: 'yes' | 'no') => {
    if (!vault.votingPower || votedWorkspaces.has(workspaceId)) return;
    setWorkspaceVotes(prev => ({
      ...prev,
      [workspaceId]: {
        ...prev[workspaceId],
        [voteType]: (prev[workspaceId]?.[voteType] || 0) + vault.votingPower
      }
    }));
    setVotedWorkspaces(prev => new Set(prev).add(workspaceId));
  };

  if (!dongVault) {
    return (
      <div className="container py-8">
        <div className="bg-red-50 border-2 border-red-200 p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-red-800 mb-2">Vault Not Found</h2>
          <p className="text-red-600">No vault deployed for {dongName}</p>
        </div>
      </div>
    );
  }

  const tvl = Number(vault.formattedTvl);
  const target = Number(vault.formattedTarget);
  const progress = target > 0 ? (tvl / target) * 100 : 0;

  return (
    <div className="container py-8">
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white border-2 border-gray-200 p-6">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <TrendingUp className="h-4 w-4" />
                Total Value Locked
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(tvl)} USDT0</div>
              <div className="mt-2">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                </div>
                <p className="text-xs text-gray-500 mt-1">목표: {formatNumber(target)} USDT0 ({progress.toFixed(1)}%)</p>
              </div>
            </div>
            <div className="bg-white border-2 border-gray-200 p-6">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Users className="h-4 w-4" />
                {t("participants")}
              </div>
              <div className="text-2xl font-bold text-gray-900">{vault.investorCount?.toString() || "0"}명</div>
            </div>
            <div className="bg-white border-2 border-gray-200 p-6">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                <Coins className="h-4 w-4" />
                Home credit 발행량
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatNumber(tvl)}</div>
            </div>
          </div>

          {/* Deposit/Withdraw */}
          <div className="bg-white border-2 border-gray-900 p-6">
            <div className="flex border-b border-gray-200 mb-6">
              <button
                onClick={() => setActiveTab("deposit")}
                className={`px-4 py-2 font-medium ${activeTab === "deposit" ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500"}`}
              >
                <ArrowUpRight className="h-4 w-4 inline mr-1" />
                {t("deposit")}
              </button>
              <button
                onClick={() => setActiveTab("withdraw")}
                className={`px-4 py-2 font-medium ${activeTab === "withdraw" ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500"}`}
              >
                <ArrowDownRight className="h-4 w-4 inline mr-1" />
                {t("withdraw")}
              </button>
            </div>

            {!vault.isConnected ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">{t("connectWallet")}</p>
              </div>
            ) : activeTab === "deposit" ? (
              <DepositForm dongName={dongName} vaultAddress={dongVault.vault} />
            ) : (
              <WithdrawForm dongName={dongName} vaultAddress={dongVault.vault} />
            )}
          </div>

          {/* Land Proposals */}
          <div className="bg-white border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-100 text-green-800"><MapPin className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t("proposeLand")}</h3>
                  <p className="text-sm text-gray-500">{t("proposeLandDesc")}</p>
                </div>
              </div>
            </div>

            {isLoadingLands ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : lands.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>{t("noLands")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lands.map((land) => (
                  <Link key={land.id} href={`/lands/${land.id}`} className="block p-4 border-2 border-gray-200 hover:border-gray-900 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{land.land_location}</div>
                        <div className="text-sm text-gray-500">{formatArea(land.garea)} · {formatPrice(land.price)}</div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Plus className="h-4 w-4" />
                        {t("propose")}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link href={`/lands?emdNm=${encodeURIComponent(dongName)}&groundSpace=150-300&ageRange=30%2B&zone=${encodeURIComponent('제1종일반주거지역,제2종일반주거지역,제3종일반주거지역')}&terrainHeight=${encodeURIComponent('평지')}&useEtc=${encodeURIComponent('주택,단독,다세대,다가구')}`} className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-500 hover:text-gray-900">
              {t("viewMoreLands")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Project Voting */}
          <div className="bg-white border-2 border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-800"><Vote className="h-5 w-5" /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{t("projectVoting")}</h3>
                  <p className="text-sm text-gray-500">{t("projectVotingDesc")}</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800">{t("inProgress", { count: workspaces.length })}</span>
            </div>

            {isLoadingWorkspaces ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : workspaces.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Vote className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>{t("noProjects")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {workspaces.map((workspace) => {
                  const votes = workspaceVotes[workspace.id] || { yes: 0, no: 0 };
                  const total = votes.yes + votes.no;
                  const yesPercent = total > 0 ? (votes.yes / total) * 100 : 50;
                  const hasVotedThis = votedWorkspaces.has(workspace.id);

                  return (
                    <div key={workspace.id} className="p-4 border-2 border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <Link href={`/workspace/${workspace.slug}`} className="hover:underline flex-1">
                          <div className="font-medium text-gray-900">{workspace.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{workspace.tags?.slice(0, 3).join(" · ") || "프로젝트"}</div>
                        </Link>
                        {hasVotedThis && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800">
                            <Check className="h-3 w-3 inline mr-1" />
                            {t("voted")}
                          </span>
                        )}
                      </div>

                      <div className="mb-3">
                        <div className="flex h-3 rounded-full overflow-hidden">
                          <div className="bg-green-500 transition-all" style={{ width: `${yesPercent}%` }} />
                          <div className="bg-red-400 transition-all" style={{ width: `${100 - yesPercent}%` }} />
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-green-700">찬성 {yesPercent.toFixed(1)}%</span>
                          <span className="text-red-600">반대 {(100 - yesPercent).toFixed(1)}%</span>
                        </div>
                      </div>

                      {vault.isConnected && !hasVotedThis && (
                        <div className="flex gap-2">
                          <button onClick={() => handleVote(workspace.id, 'yes')} disabled={!vault.votingPower} className="flex-1 py-2 border-2 border-green-600 text-green-700 hover:bg-green-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">{t("voteYes")}</button>
                          <button onClick={() => handleVote(workspace.id, 'no')} disabled={!vault.votingPower} className="flex-1 py-2 border-2 border-red-500 text-red-600 hover:bg-red-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed">{t("voteNo")}</button>
                        </div>
                      )}

                      {!vault.isConnected && <p className="text-xs text-gray-400 text-center">{t("connectToVote")}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <Link href="/explore" className="flex items-center justify-center gap-1 mt-4 text-sm text-gray-500 hover:text-gray-900">
              {t("viewAllProjects")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {vault.isConnected && (
            <div className="bg-white border-2 border-gray-900 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t("myStatus")}</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-600">{t("deposited")}</span>
                  <span className="font-bold">{vault.formattedUserDeposit} USDT0</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <span className="text-gray-600">Home credit</span>
                    <span className="text-xs text-gray-400 ml-1">({t("votingPower")})</span>
                  </div>
                  <span className="font-bold">{vault.formattedVTokenBalance}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Points</span>
                  <span className="font-bold">{vault.points.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <a href={`https://sepolia.mantlescan.xyz/address/${dongVault.vault}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                  Vault Contract <ExternalLink className="h-3 w-3" />
                </a>
                <a href={`https://sepolia.mantlescan.xyz/address/${dongVault.vToken}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                  Home credit Contract <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          <div className="bg-white border-2 border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t("leaderboard")}
            </h2>
            <div className="text-center py-8 text-gray-400">
              <Award className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">리더보드 준비 중</p>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              {t("locationInfo")}
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t("dong")}</span>
                <span className="font-medium">{dongName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{t("gu")}</span>
                <span className="font-medium">{dongVault.gu}</span>
              </div>
            </div>
            <a href={`https://map.naver.com/p/search/${encodeURIComponent(dongVault.gu + " " + dongName)}`} target="_blank" rel="noopener noreferrer" className="mt-4 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-gray-900">
              {t("viewOnNaverMap")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}