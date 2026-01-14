"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { ArrowDown, Wallet, AlertCircle, Info, Coins, DollarSign } from "lucide-react";

// Mock user points data per vault
const USER_POINTS: Record<string, number> = {
  "오금동": 15420,
  "구의동": 8350,
  "청파동2가": 3200,
  "묵정동": 1100,
};

// Swap rate: 1 Point = 0.001 USDT0
const POINTS_TO_USDT_RATE = 0.001;

export function SwapClient() {
  const { isConnected } = useAccount();
  const [selectedVault, setSelectedVault] = useState<string>("");
  const [pointsAmount, setPointsAmount] = useState("");

  const availablePoints = selectedVault ? USER_POINTS[selectedVault] || 0 : 0;
  const usdt0Amount = Number(pointsAmount) * POINTS_TO_USDT_RATE;
  const totalPoints = Object.values(USER_POINTS).reduce((a, b) => a + b, 0);

  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <Wallet className="h-16 w-16 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            지갑을 연결하세요
          </h2>
          <p className="text-gray-600 mb-8">
            Swap을 이용하려면 먼저 지갑을 연결해주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="max-w-lg mx-auto">
        {/* Points Summary */}
        <div className="bg-white border-2 border-gray-200 p-6 mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">내 Points 현황</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(USER_POINTS).map(([dong, points]) => (
              <div key={dong} className="flex justify-between items-center p-3 bg-gray-50">
                <span className="text-sm text-gray-700">{dong}</span>
                <span className="font-bold text-gray-900">{points.toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="font-medium text-gray-700">Total Points</span>
            <span className="text-xl font-bold text-gray-900">{totalPoints.toLocaleString()}</span>
          </div>
        </div>

        {/* Swap Card */}
        <div className="bg-white border-2 border-gray-900 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            Points → USDT0 Swap
          </h2>

          {/* Select Vault */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Vault 선택
            </label>
            <select
              value={selectedVault}
              onChange={(e) => {
                setSelectedVault(e.target.value);
                setPointsAmount("");
              }}
              className="w-full p-4 border-2 border-gray-200 focus:border-gray-900 outline-none bg-white"
            >
              <option value="">Vault 선택</option>
              {Object.entries(USER_POINTS).filter(([, points]) => points > 0).map(([dong, points]) => (
                <option key={dong} value={dong}>
                  {dong} - {points.toLocaleString()} Points
                </option>
              ))}
            </select>
          </div>

          {/* From: Points */}
          <div className="space-y-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <Coins className="h-4 w-4" />
              From (Points)
            </label>
            <div className="relative">
              <input
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                placeholder="0"
                disabled={!selectedVault}
                className="w-full p-4 border-2 border-gray-200 focus:border-gray-900 outline-none text-xl disabled:bg-gray-50"
              />
              <button
                onClick={() => setPointsAmount(availablePoints.toString())}
                disabled={!selectedVault}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-900 disabled:opacity-50"
              >
                MAX
              </button>
            </div>
            {selectedVault && (
              <p className="text-sm text-gray-500">
                가용: {availablePoints.toLocaleString()} Points
              </p>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center my-4">
            <div className="p-2 border-2 border-gray-200">
              <ArrowDown className="h-5 w-5 text-gray-600" />
            </div>
          </div>

          {/* To: USDT0 */}
          <div className="space-y-2 mb-6">
            <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              To (USDT0)
            </label>
            <div className="w-full p-4 border-2 border-gray-200 bg-gray-50 text-xl font-bold text-gray-900">
              {usdt0Amount.toFixed(2)} USDT0
            </div>
            <p className="text-sm text-gray-500">
              환율: 1 Point = {POINTS_TO_USDT_RATE} USDT0
            </p>
          </div>

          {/* Summary */}
          {selectedVault && pointsAmount && Number(pointsAmount) > 0 && (
            <div className="bg-gray-50 p-4 border border-gray-200 mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Swap 수량</span>
                <span className="font-medium">{Number(pointsAmount).toLocaleString()} Points</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">From Vault</span>
                <span className="font-medium">{selectedVault}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">환율</span>
                <span className="font-medium">1 Point = {POINTS_TO_USDT_RATE} USDT0</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">수령 금액</span>
                <span className="font-bold text-gray-900">{usdt0Amount.toFixed(2)} USDT0</span>
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
                  <li>Swap한 Points는 복구할 수 없습니다</li>
                  <li>Points가 줄어들면 해당 동의 주거 우선순위도 하락합니다</li>
                  <li>최소 Swap 수량: 1,000 Points</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Swap Button */}
          <button
            disabled={!selectedVault || !pointsAmount || Number(pointsAmount) < 1000 || Number(pointsAmount) > availablePoints}
            className="w-full py-4 bg-gray-900 text-white font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {Number(pointsAmount) < 1000 && pointsAmount ? "최소 1,000 Points 이상" : "Swap"}
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-white border-2 border-gray-200 p-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Points Swap이란?</h3>
              <p className="text-sm text-gray-600 mb-3">
                Vault에 예치하여 적립한 Points를 USDT0으로 교환할 수 있습니다.
                Points는 주거 우선권을 결정하는 지표이므로, Swap 시 해당 동의 순위가 하락할 수 있습니다.
              </p>
              <h4 className="font-medium text-gray-900 mb-1 text-sm">환율 안내</h4>
              <p className="text-sm text-gray-600">
                현재 환율: <span className="font-bold">1 Point = {POINTS_TO_USDT_RATE} USDT0</span><br />
                환율은 시장 상황에 따라 변동될 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
