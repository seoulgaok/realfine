"use client";

import { useState, useEffect } from "react";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check, AlertCircle, Coins } from "lucide-react";
import { useAccount, useConnect, useDisconnect, useBalance, useNetwork, useSwitchNetwork, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { mantleSepolia, getExplorerAddressUrl, getExplorerTxUrl, CONTRACTS, ERC20_ABI } from "@/lib/wagmi/config";
import { formatUnits } from "viem";
import { useTranslations } from "next-intl";

// USDT0 Faucet ABI (just the faucet function)
const USDT0_ABI = [
  ...ERC20_ABI,
  {
    inputs: [],
    name: 'faucet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export function WalletConnect() {
  const t = useTranslations("realfi.wallet");
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, isLoading: isConnectLoading } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConnectorModal, setShowConnectorModal] = useState(false);

  // Get native balance (MNT on Mantle)
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Get USDT0 balance
  const { data: usdt0Balance, refetch: refetchUsdt0 } = useContractRead({
    address: CONTRACTS.USDT0,
    abi: USDT0_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Prepare faucet transaction
  const { config: faucetConfig } = usePrepareContractWrite({
    address: CONTRACTS.USDT0,
    abi: USDT0_ABI,
    functionName: 'faucet',
    enabled: isConnected,
  });

  const { data: faucetTx, write: claimFaucet, isLoading: isFaucetLoading } = useContractWrite(faucetConfig);

  const { isLoading: isFaucetConfirming } = useWaitForTransaction({
    hash: faucetTx?.hash,
    onSuccess: () => {
      refetchUsdt0();
    },
  });

  const isFaucetPending = isFaucetLoading || isFaucetConfirming;

  // Check if on correct network
  const isWrongNetwork = isConnected && chain?.id !== mantleSepolia.id;

  const handleConnect = () => {
    setShowConnectorModal(true);
  };

  const handleConnectorSelect = async (connector: typeof connectors[0]) => {
    try {
      connect({ connector });
      setShowConnectorModal(false);
    } catch (error) {
      console.error("Connection error:", error);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setIsDropdownOpen(false);
  };

  const handleSwitchNetwork = () => {
    switchNetwork?.(mantleSepolia.id);
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsDropdownOpen(false);
    if (isDropdownOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Not connected state
  if (!isConnected) {
    return (
      <>
        <button
          onClick={handleConnect}
          disabled={isConnecting || isConnectLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Wallet className="h-4 w-4" />
          {isConnecting || isConnectLoading ? t("connecting") : t("connect")}
        </button>

        {/* Connector Selection Modal */}
        {showConnectorModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white border-2 border-gray-900 p-6 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">{t("selectWallet")}</h3>
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => handleConnectorSelect(connector)}
                    disabled={!connector.ready}
                    className="w-full flex items-center gap-3 p-3 border-2 border-gray-200 hover:border-gray-900 transition-colors disabled:opacity-50"
                  >
                    <Wallet className="h-5 w-5 text-gray-600" />
                    <span className="font-medium">{connector.name}</span>
                    {!connector.ready && <span className="text-xs text-gray-400">({t("notInstalled")})</span>}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowConnectorModal(false)}
                className="w-full mt-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                {t("cancel")}
              </button>
              <p className="mt-4 text-xs text-gray-500 text-center">
                {t("connectToTestnet")}
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  // Wrong network warning
  if (isWrongNetwork) {
    return (
      <button
        onClick={handleSwitchNetwork}
        className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white text-sm font-medium hover:bg-yellow-600 transition-colors"
      >
        <AlertCircle className="h-4 w-4" />
        {t("switchNetwork")}
      </button>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-900 text-gray-900 text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="font-mono">{address && truncateAddress(address)}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
      </button>

      {isDropdownOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 bg-white border-2 border-gray-900 shadow-lg z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Network & Address */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{t("network")}</span>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {chain?.name || 'Mantle Sepolia'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{address && truncateAddress(address)}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyAddress}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title={t("copyAddress")}
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
                <a
                  href={address ? getExplorerAddressUrl(chain?.id || mantleSepolia.id, address) : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-gray-600 p-1"
                  title={t("viewOnExplorer")}
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Balances */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("mntGas")}</span>
              <span className="font-mono font-bold text-gray-900">
                {nativeBalance ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4) : "0.0000"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">USDT0</span>
              <span className="font-mono font-bold text-gray-900">
                {usdt0Balance ? parseFloat(formatUnits(usdt0Balance as bigint, 6)).toFixed(2) : "0.00"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{t("investmentToken")}</span>
              <span className="font-mono font-bold text-gray-900">0</span>
            </div>
          </div>

          {/* Get Test Tokens */}
          <div className="p-3 bg-blue-50 border-b border-gray-200 space-y-2">
            <button
              onClick={() => claimFaucet?.()}
              disabled={isFaucetPending || !claimFaucet}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isFaucetPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t("processing")}
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  {t("getUsdt0")}
                </>
              )}
            </button>
            {faucetTx?.hash && (
              <a
                href={getExplorerTxUrl(chain?.id || mantleSepolia.id, faucetTx.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1"
              >
                {t("viewTransaction")}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a
              href="https://faucet.sepolia.mantle.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-500 hover:underline flex items-center justify-center gap-1"
            >
              {t("getTestMnt")}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Actions */}
          <div className="p-2">
            <a
              href={address ? getExplorerAddressUrl(chain?.id || mantleSepolia.id, address) : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              {t("viewOnExplorer")}
            </a>
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
            >
              <LogOut className="h-4 w-4" />
              {t("disconnect")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Vault ABI for deposit
const VAULT_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'claimRewards',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'pendingRewards',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'activeProjectId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'projectId', type: 'uint256' }],
    name: 'getProject',
    outputs: [
      { name: 'name', type: 'string' },
      { name: 'targetAmount', type: 'uint256' },
      { name: 'raisedAmount', type: 'uint256' },
      { name: 'aprBps', type: 'uint256' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Vault component for deposit/withdraw
export function Vault({ projectTitle, apr }: { projectTitle: string; apr: number }) {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<'input' | 'approve' | 'deposit'>('input');
  const [txHash, setTxHash] = useState<string | null>(null);

  // Get user's USDT0 balance
  const { data: usdt0Balance, refetch: refetchUsdt0 } = useContractRead({
    address: CONTRACTS.USDT0,
    abi: USDT0_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Get user's allowance for vault
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: CONTRACTS.USDT0,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACTS.VAULT] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Get user's deposit in vault
  const { data: vaultBalance, refetch: refetchVaultBalance } = useContractRead({
    address: CONTRACTS.VAULT,
    abi: VAULT_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Get pending rewards
  const { data: pendingRewards } = useContractRead({
    address: CONTRACTS.VAULT,
    abi: VAULT_ABI,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  const formattedBalance = usdt0Balance
    ? parseFloat(formatUnits(usdt0Balance as bigint, 6))
    : 0;

  const formattedVaultBalance = vaultBalance
    ? parseFloat(formatUnits(vaultBalance as bigint, 6))
    : 0;

  const formattedPendingRewards = pendingRewards
    ? parseFloat(formatUnits(pendingRewards as bigint, 6))
    : 0;

  const depositAmount = amount ? BigInt(Math.floor(parseFloat(amount) * 1e6)) : BigInt(0);

  // Check if approval is needed
  const needsApproval = allowance !== undefined && depositAmount > 0 && (allowance as bigint) < depositAmount;

  // Prepare approve transaction
  const { config: approveConfig } = usePrepareContractWrite({
    address: CONTRACTS.USDT0,
    abi: ERC20_ABI,
    functionName: 'approve',
    args: [CONTRACTS.VAULT, depositAmount],
    enabled: isConnected && needsApproval && depositAmount > 0,
  });

  const { write: approveWrite, isLoading: isApproving, data: approveTx } = useContractWrite(approveConfig);

  const { isLoading: isApproveConfirming } = useWaitForTransaction({
    hash: approveTx?.hash,
    onSuccess: () => {
      refetchAllowance();
      setStep('deposit');
    },
  });

  // Prepare deposit transaction
  const { config: depositConfig } = usePrepareContractWrite({
    address: CONTRACTS.VAULT,
    abi: VAULT_ABI,
    functionName: 'deposit',
    args: [depositAmount],
    enabled: isConnected && !needsApproval && depositAmount > 0,
  });

  const { write: depositWrite, isLoading: isDepositing, data: depositTx } = useContractWrite(depositConfig);

  const { isLoading: isDepositConfirming } = useWaitForTransaction({
    hash: depositTx?.hash,
    onSuccess: () => {
      refetchUsdt0();
      refetchVaultBalance();
      setTxHash(depositTx?.hash || null);
      setAmount("");
      setStep('input');
    },
  });

  const handleDeposit = () => {
    if (!amount || parseFloat(amount) <= 0 || !isConnected) return;

    if (needsApproval) {
      setStep('approve');
      approveWrite?.();
    } else {
      setStep('deposit');
      depositWrite?.();
    }
  };

  const isLoading = isApproving || isApproveConfirming || isDepositing || isDepositConfirming;

  return (
    <div className="bg-white border-2 border-gray-900 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Vault</h3>
        <span className="px-2 py-1 text-xs font-bold bg-green-100 text-green-700 border border-green-300">
          APR {apr}%
        </span>
      </div>

      <div className="space-y-4">
        {/* My Deposit Display */}
        {formattedVaultBalance > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700 font-medium">내 예치금</span>
              <span className="text-xs text-blue-600">투자중</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold font-mono text-blue-900">
                {formattedVaultBalance.toFixed(2)}
              </span>
              <span className="text-sm font-medium text-blue-700">USDT0</span>
            </div>
            {formattedPendingRewards > 0 && (
              <div className="mt-2 pt-2 border-t border-blue-200 flex items-center justify-between">
                <span className="text-xs text-blue-600">미수령 수익</span>
                <span className="text-sm font-bold text-green-600">+{formattedPendingRewards.toFixed(4)} USDT0</span>
              </div>
            )}
          </div>
        )}

        {/* Available Balance Display */}
        <div className="p-4 bg-gray-50 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">예치 가능</span>
            <span className="text-xs text-gray-500">Mantle Sepolia</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold font-mono text-gray-900">
              {formattedBalance.toFixed(2)}
            </span>
            <span className="text-sm font-medium text-gray-600">USDT0</span>
          </div>
        </div>

        {/* Connection Required */}
        {!isConnected && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 text-center">
            <p className="text-sm text-yellow-700">
              예치하려면 먼저 지갑을 연결해주세요
            </p>
          </div>
        )}

        {/* Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            예치 금액
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              disabled={!isConnected || isLoading}
              className="w-full px-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none font-mono text-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <button
                onClick={() => {
                  if (formattedBalance > 0) {
                    setAmount(formattedBalance.toFixed(2));
                  }
                }}
                disabled={!isConnected || formattedBalance <= 0 || isLoading}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                MAX
              </button>
              <span className="text-sm font-medium text-gray-500">USDT0</span>
            </div>
          </div>
        </div>

        {/* Expected Returns */}
        {amount && parseFloat(amount) > 0 && (
          <div className="p-3 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700">예상 수익 (1년)</span>
              <span className="font-bold text-green-700">
                +{(parseFloat(amount) * apr / 100).toFixed(2)} USDT0
              </span>
            </div>
          </div>
        )}

        {/* Step Indicator */}
        {isLoading && (
          <div className="p-3 bg-blue-50 border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {step === 'approve' && '1/2: USDT0 승인 중...'}
              {step === 'deposit' && '2/2: 예치 진행 중...'}
            </div>
          </div>
        )}

        {/* Deposit Button */}
        <button
          onClick={handleDeposit}
          disabled={isLoading || !amount || !isConnected || parseFloat(amount) > formattedBalance || parseFloat(amount) <= 0}
          className="w-full py-4 text-lg font-bold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              처리중...
            </span>
          ) : !isConnected ? (
            "지갑 연결 필요"
          ) : parseFloat(amount || '0') > formattedBalance ? (
            "잔액 부족"
          ) : needsApproval ? (
            "승인 후 예치하기"
          ) : (
            "예치하기"
          )}
        </button>

        {/* Transaction Hash */}
        {txHash && (
          <div className="p-3 bg-green-50 border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-xs text-green-700 font-medium">예치 완료!</span>
              <a
                href={getExplorerTxUrl(chain?.id || mantleSepolia.id, txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-blue-600 hover:underline flex items-center gap-1"
              >
                {txHash.slice(0, 10)}...{txHash.slice(-6)}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Info */}
        <p className="text-xs text-gray-500 text-center">
          Mantle Sepolia 테스트넷에서 실제 컨트랙트와 상호작용합니다.
        </p>
      </div>
    </div>
  );
}

// Token balance display
export function TokenBalance() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();

  // Get native balance
  const { data: nativeBalance } = useBalance({
    address,
  });

  // Get USDT0 balance
  const { data: usdt0Balance, refetch: refetchUsdt0 } = useContractRead({
    address: CONTRACTS.USDT0,
    abi: USDT0_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Get aToken balance
  const { data: aTokenBalance } = useContractRead({
    address: CONTRACTS.INVESTMENT_TOKEN,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // Prepare faucet transaction
  const { config: faucetConfig } = usePrepareContractWrite({
    address: CONTRACTS.USDT0,
    abi: USDT0_ABI,
    functionName: 'faucet',
    enabled: isConnected,
  });

  const { data: faucetTx, write: claimFaucet, isLoading: isFaucetLoading } = useContractWrite(faucetConfig);

  const { isLoading: isFaucetConfirming } = useWaitForTransaction({
    hash: faucetTx?.hash,
    onSuccess: () => {
      refetchUsdt0();
    },
  });

  const isFaucetPending = isFaucetLoading || isFaucetConfirming;

  return (
    <div className="bg-gray-900 text-white p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">내 투자 현황</h3>

      {!isConnected ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400">지갑을 연결해주세요</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">보유 USDT0</div>
              <div className="text-2xl font-bold font-mono">
                {usdt0Balance ? parseFloat(formatUnits(usdt0Balance as bigint, 6)).toFixed(2) : "0.00"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">투자 토큰 (aRFI)</div>
              <div className="text-2xl font-bold font-mono">
                {aTokenBalance ? parseFloat(formatUnits(aTokenBalance as bigint, 6)).toFixed(2) : "0.00"}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-700" />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">보유 MNT</div>
              <div className="font-mono">
                {nativeBalance ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4) : "0.0000"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-400">수익률</div>
              <div className="font-mono text-green-400">0.00%</div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => claimFaucet?.()}
              disabled={isFaucetPending || !claimFaucet}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isFaucetPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  처리중...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4" />
                  USDT0 받기 (1,000 USDT0)
                </>
              )}
            </button>
            {faucetTx?.hash && (
              <a
                href={getExplorerTxUrl(chain?.id || mantleSepolia.id, faucetTx.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center justify-center gap-1"
              >
                트랜잭션 보기
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            <a
              href="https://faucet.sepolia.mantle.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline flex items-center justify-center gap-1"
            >
              테스트 MNT 받기 (가스비용)
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}