"use client";

import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import { CONTRACTS, DONG_VAULTS, DONG_VAULT_ABI, VTOKEN_ABI, ERC20_ABI } from "@/lib/wagmi/config";

interface UseDongVaultOptions {
  dongName: string;
}

export function useDongVault({ dongName }: UseDongVaultOptions) {
  const { address, isConnected } = useAccount();
  const dongVault = DONG_VAULTS[dongName];

  if (!dongVault) {
    throw new Error(`Vault not found for dong: ${dongName}`);
  }

  const vaultAddress = dongVault.vault;
  const vTokenAddress = dongVault.vToken;

  // ============================================
  // Read: USDT0 Balance
  // ============================================
  const { data: usdt0Balance, refetch: refetchUsdt0 } = useContractRead({
    address: CONTRACTS.USDT0,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // ============================================
  // Read: USDT0 Allowance for Vault
  // ============================================
  const { data: usdt0Allowance, refetch: refetchAllowance } = useContractRead({
    address: CONTRACTS.USDT0,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, vaultAddress] : undefined,
    enabled: !!address,
    watch: true,
  });

  // ============================================
  // Read: vToken Balance
  // ============================================
  const { data: vTokenBalance, refetch: refetchVToken } = useContractRead({
    address: vTokenAddress,
    abi: VTOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // ============================================
  // Read: Vault Total Deposits (TVL)
  // ============================================
  const { data: totalDeposits } = useContractRead({
    address: vaultAddress,
    abi: DONG_VAULT_ABI,
    functionName: "totalDeposits",
    watch: true,
  });

  // ============================================
  // Read: Vault Target Amount
  // ============================================
  const { data: targetAmount } = useContractRead({
    address: vaultAddress,
    abi: DONG_VAULT_ABI,
    functionName: "targetAmount",
  });

  // ============================================
  // Read: Investor Count
  // ============================================
  const { data: investorCount } = useContractRead({
    address: vaultAddress,
    abi: DONG_VAULT_ABI,
    functionName: "investorCount",
    watch: true,
  });

  // ============================================
  // Read: User's deposited balance in vault
  // ============================================
  const { data: userVaultBalance, refetch: refetchUserBalance } = useContractRead({
    address: vaultAddress,
    abi: DONG_VAULT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    enabled: !!address,
    watch: true,
  });

  // ============================================
  // Read: Vault paused status
  // ============================================
  const { data: isPaused } = useContractRead({
    address: vaultAddress,
    abi: DONG_VAULT_ABI,
    functionName: "paused",
  });

  // ============================================
  // Format values for display
  // ============================================
  const formattedUsdt0Balance = usdt0Balance
    ? formatUnits(usdt0Balance as bigint, 6)
    : "0";

  const formattedVTokenBalance = vTokenBalance
    ? formatUnits(vTokenBalance as bigint, 6)
    : "0";

  const formattedUserDeposit = userVaultBalance
    ? formatUnits(userVaultBalance as bigint, 6)
    : "0";

  const formattedTvl = totalDeposits
    ? formatUnits(totalDeposits as bigint, 6)
    : "0";

  const formattedTarget = targetAmount
    ? formatUnits(targetAmount as bigint, 6)
    : "1000000";

  // Points calculation: deposit * (days / 365)
  // For now, just use vToken balance as points approximation
  const points = vTokenBalance
    ? Number(formatUnits(vTokenBalance as bigint, 6)) * 0.1
    : 0;

  // Voting power = vToken balance
  const votingPower = vTokenBalance
    ? Number(formatUnits(vTokenBalance as bigint, 6))
    : 0;

  // Check if approval is needed
  const needsApproval = (amount: string) => {
    if (!usdt0Allowance || !amount) return true;
    const amountBigInt = parseUnits(amount, 6);
    return (usdt0Allowance as bigint) < amountBigInt;
  };

  // Refetch all balances
  const refetchAll = async () => {
    await Promise.all([
      refetchUsdt0(),
      refetchAllowance(),
      refetchVToken(),
      refetchUserBalance(),
    ]);
  };

  return {
    // Connection
    address,
    isConnected,

    // Vault info
    vaultAddress,
    vTokenAddress,
    dongName,
    gu: dongVault.gu,

    // Raw balances
    usdt0Balance: usdt0Balance as bigint | undefined,
    usdt0Allowance: usdt0Allowance as bigint | undefined,
    vTokenBalance: vTokenBalance as bigint | undefined,
    userVaultBalance: userVaultBalance as bigint | undefined,
    totalDeposits: totalDeposits as bigint | undefined,
    targetAmount: targetAmount as bigint | undefined,
    investorCount: investorCount as bigint | undefined,
    isPaused: isPaused as boolean | undefined,

    // Formatted values
    formattedUsdt0Balance,
    formattedVTokenBalance,
    formattedUserDeposit,
    formattedTvl,
    formattedTarget,
    points,
    votingPower,

    // Helpers
    needsApproval,
    refetchAll,
  };
}

// ============================================
// Hook for Approve USDT0
// ============================================
export function useApproveUsdt0(vaultAddress: `0x${string}`, amount: string) {
  const amountBigInt = amount ? parseUnits(amount, 6) : BigInt(0);

  const { config } = usePrepareContractWrite({
    address: CONTRACTS.USDT0,
    abi: ERC20_ABI,
    functionName: "approve",
    args: [vaultAddress, amountBigInt],
    enabled: !!amount && Number(amount) > 0,
  });

  const { data, write, isLoading: isWriting } = useContractWrite(config);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return {
    approve: write,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
  };
}

// ============================================
// Hook for Deposit to Vault
// ============================================
export function useDeposit(vaultAddress: `0x${string}`, amount: string, withLockup: boolean) {
  const amountBigInt = amount ? parseUnits(amount, 6) : BigInt(0);

  // DongVault.deposit(amount, withLockup)
  const { config } = usePrepareContractWrite({
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
    args: [amountBigInt, withLockup],
    enabled: !!amount && Number(amount) > 0,
  });

  const { data, write, isLoading: isWriting, error } = useContractWrite(config);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return {
    deposit: write,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
    error,
  };
}

// ============================================
// Hook for Withdraw from Vault
// ============================================
export function useWithdraw(vaultAddress: `0x${string}`, amount: string) {
  const amountBigInt = amount ? parseUnits(amount, 6) : BigInt(0);

  const { config } = usePrepareContractWrite({
    address: vaultAddress,
    abi: DONG_VAULT_ABI,
    functionName: "withdraw",
    args: [amountBigInt],
    enabled: !!amount && Number(amount) > 0,
  });

  const { data, write, isLoading: isWriting, error } = useContractWrite(config);

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  return {
    withdraw: write,
    isLoading: isWriting || isConfirming,
    isSuccess,
    txHash: data?.hash,
    error,
  };
}