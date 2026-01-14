"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Wallet, TrendingUp, Clock, Lock, Award, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

// Mock portfolio data
const MOCK_POSITIONS = [
  {
    dong: "오금동",
    gu: "송파구",
    deposited: 25000,
    vToken: 25000,
    points: 342.5,
    dailyPoints: 68.5,
    isLocked: true,
    lockEndDate: "2026-01-15",
    depositDate: "2025-01-15",
  },
  {
    dong: "구의동",
    gu: "광진구",
    deposited: 15000,
    vToken: 15000,
    points: 185.2,
    dailyPoints: 41.1,
    isLocked: false,
    lockEndDate: null,
    depositDate: "2025-02-20",
  },
  {
    dong: "청파동2가",
    gu: "용산구",
    deposited: 8000,
    vToken: 8000,
    points: 65.8,
    dailyPoints: 21.9,
    isLocked: true,
    lockEndDate: "2026-03-10",
    depositDate: "2025-03-10",
  },
];

const MOCK_TOTAL = {
  totalDeposited: 48000,
  totalVToken: 48000,
  totalPoints: 593.5,
  totalDailyPoints: 131.5,
  rank: 12,
  totalParticipants: 847,
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + "M";
  }
  if (num >= 1000) {
    return num.toLocaleString();
  }
  return num.toFixed(2);
}

export function PortfolioClient() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="container py-16">
        <div className="max-w-md mx-auto text-center">
          <Wallet className="h-16 w-16 mx-auto text-gray-300 mb-6" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            지갑을 연결하세요
          </h2>
          <p className="text-gray-600 mb-8">
            포트폴리오를 확인하려면 먼저 지갑을 연결해주세요
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border-2 border-gray-900 p-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <TrendingUp className="h-4 w-4" />
            총 예치액
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(MOCK_TOTAL.totalDeposited)} USDT0
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Wallet className="h-4 w-4" />
            총 Home credit
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(MOCK_TOTAL.totalVToken)} Home credit
          </div>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Award className="h-4 w-4" />
            누적 Points
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {formatNumber(MOCK_TOTAL.totalPoints)} Points
          </div>
          <p className="text-xs text-gray-500 mt-1">
            +{MOCK_TOTAL.totalDailyPoints.toFixed(1)} Points/일
          </p>
        </div>

        <div className="bg-white border-2 border-gray-200 p-6">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
            <Award className="h-4 w-4" />
            전체 순위
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {MOCK_TOTAL.rank}위
          </div>
          <p className="text-xs text-gray-500 mt-1">
            / {MOCK_TOTAL.totalParticipants}명 중
          </p>
        </div>
      </div>

      {/* Positions */}
      <div className="bg-white border-2 border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            동별 예치 현황
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {MOCK_POSITIONS.map((position) => (
            <Link
              key={position.dong}
              href={`/realfi/dong/${encodeURIComponent(position.dong)}`}
              className="block p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      {position.dong}
                    </h3>
                    <span className="text-sm text-gray-500">{position.gu}</span>
                    {position.isLocked && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-gray-900 text-white">
                        <Lock className="h-3 w-3" />
                        1년 락업
                      </span>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">예치액</span>
                      <p className="font-bold text-gray-900">
                        {formatNumber(position.deposited)} USDT0
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Home credit</span>
                      <p className="font-bold text-gray-900">
                        {formatNumber(position.vToken)} Home credit
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">누적 Points</span>
                      <p className="font-bold text-gray-900">
                        {formatNumber(position.points)} Points
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">일일 적립</span>
                      <p className="font-bold text-gray-900">
                        +{position.dailyPoints.toFixed(1)} Points/일
                        {position.isLocked && (
                          <span className="text-gray-500 ml-1">(+10%)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {position.isLocked && position.lockEndDate && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>락업 해제: {position.lockEndDate}</span>
                    </div>
                  )}
                </div>

                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-2" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Points History (simplified) */}
      <div className="mt-8 bg-white border-2 border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Points 적립 내역
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {[
            { date: "2025-12-27", dong: "오금동", points: 68.5, type: "daily" },
            { date: "2025-12-27", dong: "구의동", points: 41.1, type: "daily" },
            { date: "2025-12-27", dong: "청파동2가", points: 21.9, type: "daily" },
            { date: "2025-12-26", dong: "오금동", points: 68.5, type: "daily" },
            { date: "2025-12-26", dong: "구의동", points: 41.1, type: "daily" },
          ].map((entry, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">{entry.date}</div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{entry.dong}</span>
                </div>
              </div>
              <div className="font-bold text-gray-900">
                +{entry.points.toFixed(1)} Points
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 text-center border-t border-gray-100">
          <button className="text-sm text-gray-500 hover:text-gray-900">
            전체 내역 보기
          </button>
        </div>
      </div>

      {/* Empty state hint */}
      <div className="mt-8 p-6 bg-gray-50 border-2 border-gray-200 text-center">
        <p className="text-gray-600 mb-4">
          더 많은 동에 예치하고 Points를 쌓아보세요
        </p>
        <Link
          href="/realfi/invest"
          className="inline-block px-6 py-3 bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
        >
          동별 Vault 둘러보기
        </Link>
      </div>
    </div>
  );
}
