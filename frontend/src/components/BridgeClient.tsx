"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ArrowDown, Wallet, AlertCircle, Info } from "lucide-react";

// Active vaults for bridging
const VAULTS = [
  { dong: "오금동", gu: "송파구", balance: 25000 },
  { dong: "구의동", gu: "광진구", balance: 15000 },
  { dong: "청파동2가", gu: "용산구", balance: 8000 },
  { dong: "묵정동", gu: "중구", balance: 0 },
];

export function BridgeClient() {
  const { isConnected } = useAccount();
  const [fromVault, setFromVault] = useState<string>("");
  const [toVault, setToVault] = useState<string>("");
  const [amount, setAmount] = useState("");

  const fromVaultData = VAULTS.find(v => v.dong === fromVault);
  const toVaultData = VAULTS.find(v => v.dong === toVault);

  const handleSwap = () => {
    const temp = fromVault;
    setFromVault(toVault);
    setToVault(temp);
  };

  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <Wallet className="h-16 w-16 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            지갑을 연결하세요
          </h2>
          <p className="text-gray-600 mb-8">
            Bridge를 이용하려면 먼저 지갑을 연결해주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-lg mx-auto">
        {/* Bridge Card */}
        <div className="bg-white border-2 border-gray-900 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Vault 간 Home credit 이동
          </h2>

          {/* From Vault */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              From
            </label>
            <select
              value={fromVault}
              onChange={(e) => setFromVault(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 focus:border-gray-900 outline-none bg-white"
            >
              <option value="">Vault 선택</option>
              {VAULTS.filter(v => v.dong !== toVault && v.balance > 0).map((vault) => (
                <option key={vault.dong} value={vault.dong}>
                  {vault.dong} ({vault.gu}) - {vault.balance.toLocaleString()} Home credit
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full p-4 border-2 border-gray-200 focus:border-gray-900 outline-none text-xl"
              />
              <button
                onClick={() => {
                  if (fromVaultData) {
                    setAmount(fromVaultData.balance.toString());
                  }
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900"
              >
                MAX
              </button>
            </div>
            {fromVaultData && (
              <p className="text-sm text-gray-500">
                가용: {fromVaultData.balance.toLocaleString()} Home credit
              </p>
            )}
          </div>

          {/* Swap Button */}
          <div className="flex justify-center my-4">
            <button
              onClick={handleSwap}
              className="p-2 border-2 border-gray-200 hover:border-gray-900 transition-colors"
            >
              <ArrowDown className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* To Vault */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              To
            </label>
            <select
              value={toVault}
              onChange={(e) => setToVault(e.target.value)}
              className="w-full p-4 border-2 border-gray-200 focus:border-gray-900 outline-none bg-white"
            >
              <option value="">Vault 선택</option>
              {VAULTS.filter(v => v.dong !== fromVault).map((vault) => (
                <option key={vault.dong} value={vault.dong}>
                  {vault.dong} ({vault.gu})
                </option>
              ))}
            </select>
          </div>

          {/* Summary */}
          {fromVault && toVault && amount && (
            <div className="bg-gray-50 p-4 border border-gray-200 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">이동 수량</span>
                <span className="font-medium">{Number(amount).toLocaleString()} Home credit</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">From</span>
                <span className="font-medium">{fromVault}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">To</span>
                <span className="font-medium">{toVault}</span>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="bg-yellow-50 p-4 border border-yellow-200 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">주의사항</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-700">
                  <li>Bridge 시 해당 동의 Points는 이동되지 않습니다</li>
                  <li>락업된 Home credit은 Bridge할 수 없습니다</li>
                  <li>새 동에서 Points 적립은 이동 후부터 시작됩니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Bridge Button */}
          <button
            disabled={!fromVault || !toVault || !amount || Number(amount) <= 0}
            className="w-full py-4 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Bridge
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white border-2 border-gray-200 p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Bridge란?</h3>
              <p className="text-sm text-gray-600">
                Bridge를 통해 한 동의 Vault에서 다른 동의 Vault로 Home credit을 이동할 수 있습니다.
                관심 있는 동이 바뀌었거나, 여러 동에 분산 투자하고 싶을 때 사용하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}