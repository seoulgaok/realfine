/**
 * Single source of truth for all dong (neighborhood) configurations
 * Used by both CLI and frontend
 */

export interface DongConfig {
  name: string;
  gu: string;
  lat: number;
  lon: number;
  // Contract addresses (populated after deployment)
  vault?: `0x${string}`;
  vToken?: `0x${string}`;
}

// Live dongs with active workspace projects
export const LIVE_DONGS: DongConfig[] = [
  {
    name: "오금동",
    gu: "송파구",
    lat: 37.504004,
    lon: 127.135110,
    vault: "0x7488f44BF19A3cbCa70cd4117f05F46D127aF93A",
    vToken: "0xf846e3ffc2eff1adaf17dcd68579db9fb9ac4a9c",
  },
  {
    name: "광장동",
    gu: "광진구",
    lat: 37.5441,
    lon: 127.1040,
    // Vault not yet deployed
  },
  {
    name: "동숭동",
    gu: "종로구",
    lat: 37.5820,
    lon: 127.0030,
    // Vault not yet deployed
  },
  {
    name: "신정동",
    gu: "양천구",
    lat: 37.5168,
    lon: 126.8656,
    // Vault not yet deployed
  },
];

// Helper functions
export function getDongByName(name: string): DongConfig | undefined {
  return LIVE_DONGS.find(d => d.name === name);
}

export function getDongsByGu(gu: string): DongConfig[] {
  return LIVE_DONGS.filter(d => d.gu === gu);
}

export function getAllDongNames(): string[] {
  return LIVE_DONGS.map(d => d.name);
}

export function getAllGus(): string[] {
  return [...new Set(LIVE_DONGS.map(d => d.gu))];
}

// For CLI deployment (without contract addresses)
export function getDongsForDeployment(): { name: string; gu: string }[] {
  return LIVE_DONGS.map(({ name, gu }) => ({ name, gu }));
}

// Type for dong names (for TypeScript)
export type DongName = typeof LIVE_DONGS[number]['name'];