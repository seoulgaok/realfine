"use client";

import { useState } from "react";
import { MapPin, Users, TrendingUp, Search, ChevronRight, Building2, Map as MapIcon, List } from "lucide-react";
import { DONG_LIST, GU_LIST, type LocInfo } from "@/components/NaverMap/dongData";
import Link from "next/link";
import { VaultMap, type VaultInfo, type DongBoundary } from "./VaultMap";
import { useTranslations } from "next-intl";

// Active dongs with workspace projects
const ACTIVE_DONGS = [
  { name: "오금동", gu: "송파구" },
  { name: "광장동", gu: "광진구" },
  { name: "동숭동", gu: "종로구" },
];

// Vault data
const VAULT_DATA: Record<string, {
  tvl: number;
  participants: number;
  projects: number;
  projectName?: string;
}> = {
  "오금동": {
    tvl: 523400,
    participants: 47,
    projects: 2,
    projectName: "오금동 다세대주택"
  },
  "광장동": {
    tvl: 312800,
    participants: 31,
    projects: 1,
    projectName: "광장동 타운하우스"
  },
  "동숭동": {
    tvl: 189500,
    participants: 18,
    projects: 1,
    projectName: "동숭동 도시주택"
  },
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + "K";
  }
  return num.toString();
}

interface VaultCardProps {
  dong: LocInfo;
  vaultData: typeof VAULT_DATA[string];
  isActive: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function VaultCard({ dong, vaultData, isActive, t }: VaultCardProps) {
  if (!isActive) {
    // Disabled card for non-active dongs
    return (
      <div className="block p-6 bg-gray-100 border-2 border-gray-200 opacity-60 cursor-not-allowed">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-xl font-bold text-gray-400">
              {dong.name}
            </h3>
            <span className="text-sm text-gray-400">{dong.gu}</span>
          </div>
        </div>
        <p className="text-sm text-gray-400">{t("vaultComingSoon")}</p>
      </div>
    );
  }

  return (
    <Link
      href={`/realfi/dong/${encodeURIComponent(dong.name)}`}
      className="block p-6 bg-white border-2 border-gray-200 hover:border-gray-900 transition-all hover:shadow-lg group"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-gray-700">
            {dong.name}
          </h3>
          <span className="text-sm text-gray-500">{dong.gu}</span>
        </div>
        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-900 transition-colors" />
      </div>

      {/* Project Name */}
      {vaultData.projectName && (
        <div className="mb-3 p-2 bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{vaultData.projectName}</span>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <TrendingUp className="h-4 w-4" />
            TVL
          </span>
          <span className="font-bold text-gray-900">
            {formatNumber(vaultData.tvl)} USDT0
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <Users className="h-4 w-4" />
            {t("participants")}
          </span>
          <span className="font-bold text-gray-900">
            {t("participantCount", { count: vaultData.participants })}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {t("activeProjects")}
          </span>
          <span className="font-bold text-gray-900">
            {t("projectCount", { count: vaultData.projects })}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gray-900 h-full rounded-full transition-all"
            style={{ width: `${Math.min((vaultData.tvl / 1000000) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-1">
          {t("goalTvl")}
        </p>
      </div>
    </Link>
  );
}

export function DongVaultExplorer() {
  const t = useTranslations("realfi.explorer");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGu, setSelectedGu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  // Get active dong names
  const activeDongNames = ACTIVE_DONGS.map(d => d.name);

  // Prepare vault data for map - include all dongs for choropleth display
  const vaultInfoForMap: VaultInfo[] = DONG_LIST.map(dong => {
    const isActive = activeDongNames.includes(dong.name);
    const data = VAULT_DATA[dong.name] || { tvl: 0, participants: 0, projects: 0 };
    return {
      dong: dong.name,
      gu: dong.gu || "",
      tvl: isActive ? data.tvl : 0,
      participants: isActive ? data.participants : 0,
      projects: isActive ? data.projects : 0,
      isOpen: isActive,
      projectName: isActive ? data.projectName : undefined,
    };
  });

  // Prepare boundaries for choropleth map - only for active/open vaults
  const boundariesForMap: DongBoundary[] = DONG_LIST
    .filter(dong => activeDongNames.includes(dong.name))
    .map(dong => ({
      dong: dong.name,
      gu: dong.gu || "",
      land_count: dong.landCount || 0,
      center_lat: dong.lat,
      center_lon: dong.lon,
      boundary_geojson: dong.boundary || null,
    }));

  // Filter dongs based on search and gu selection
  const filteredDongs = DONG_LIST.filter((dong) => {
    const matchesSearch = dong.name.includes(searchQuery) ||
                          (dong.gu && dong.gu.includes(searchQuery));
    const matchesGu = !selectedGu || dong.gu === selectedGu;
    const isActive = activeDongNames.includes(dong.name);

    // Show only active dongs if no search/filter
    if (!searchQuery && !selectedGu) {
      return isActive;
    }

    return matchesSearch && matchesGu;
  });

  // Get unique gus for filter (prioritize gus with active projects)
  const activeGus = ACTIVE_DONGS.map(d => d.gu);
  const allGus = [...activeGus, ...GU_LIST.map(g => g.name)];
  const uniqueGus = Array.from(new Set(allGus));

  return (
    <div className="container py-8">
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 focus:border-gray-900 outline-none transition-colors"
          />
        </div>

        {/* Gu Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedGu(null)}
            className={`px-3 py-1.5 text-sm border-2 transition-colors ${
              !selectedGu
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-600 hover:border-gray-400"
            }`}
          >
            {t("all")}
          </button>
          {uniqueGus.map((gu) => (
            <button
              key={gu}
              onClick={() => setSelectedGu(selectedGu === gu ? null : gu)}
              className={`px-3 py-1.5 text-sm border-2 transition-colors ${
                selectedGu === gu
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
            >
              {gu}
            </button>
          ))}
        </div>
      </div>

      {/* Section Header with View Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {!searchQuery && !selectedGu ? (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t("activeProjectsTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("activeProjectsSubtitle")}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            {t("showingDongs", { count: filteredDongs.length })}
          </p>
        )}

        {/* View Toggle */}
        <div className="flex border-2 border-gray-200">
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === "map"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            <MapIcon className="h-4 w-4" />
            Map
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === "map" && (
        <div className="mb-8">
          <VaultMap
            vaults={vaultInfoForMap}
            boundaries={boundariesForMap}
            className="h-[500px] border-2 border-gray-200"
          />
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <>
          {/* Vault Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredDongs.map((dong) => {
              const isActive = activeDongNames.includes(dong.name);
              const vaultData = VAULT_DATA[dong.name] || {
                tvl: 0,
                participants: 0,
                projects: 0,
              };

              return (
                <VaultCard
                  key={`${dong.gu}-${dong.name}`}
                  dong={dong}
                  vaultData={vaultData}
                  isActive={isActive}
                  t={t}
                />
              );
            })}
          </div>

          {/* Empty state */}
          {filteredDongs.length === 0 && (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {t("noResults")}
              </h3>
              <p className="text-gray-500">
                {t("tryDifferentSearch")}
              </p>
            </div>
          )}
        </>
      )}

      {/* Coming Soon Section */}
      {!searchQuery && !selectedGu && (
        <div className="mt-12 p-6 bg-gray-50 border-2 border-gray-200 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{t("comingSoonTitle")}</h3>
          <p className="text-sm text-gray-600 mb-4">
            {t("comingSoonDesc", { guCount: GU_LIST.length, dongCount: DONG_LIST.length })}
          </p>
          <p className="text-xs text-gray-500">
            {t("comingSoonHint")}
          </p>
        </div>
      )}
    </div>
  );
}
