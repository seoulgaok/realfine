import { configureChains, createConfig } from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { Chain } from 'wagmi/chains';

// Define Mantle Sepolia Testnet
export const mantleSepolia: Chain = {
  id: 5003,
  name: 'Mantle Sepolia Testnet',
  network: 'mantle-sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
    public: {
      http: ['https://rpc.sepolia.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Sepolia Explorer',
      url: 'https://sepolia.mantlescan.xyz',
    },
  },
  testnet: true,
};

// Define Mantle Mainnet
export const mantleMainnet: Chain = {
  id: 5000,
  name: 'Mantle',
  network: 'mantle',
  nativeCurrency: {
    decimals: 18,
    name: 'MNT',
    symbol: 'MNT',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.mantle.xyz'],
    },
    public: {
      http: ['https://rpc.mantle.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mantle Explorer',
      url: 'https://explorer.mantle.xyz',
    },
  },
};

// Configure chains with public provider
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [mantleSepolia, mantleMainnet],
  [publicProvider()]
);

export { chains };

// Create wagmi config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors: [
    new InjectedConnector({
      chains,
      options: {
        name: 'Injected',
        shimDisconnect: true,
      },
    }),
  ],
  publicClient,
  webSocketPublicClient,
});

// Contract addresses on Mantle Sepolia (deployed 2026-01-03)
export const CONTRACTS = {
  // USDT0 Test Token
  USDT0: '0xa45d94eb6752b5b465e62f128c8d10771b7fde0a' as `0x${string}`,
  // KYC Registry Contract
  KYC_REGISTRY: '0x364ac44b504458303c3a9b8faff6ef806590000c' as `0x${string}`,
  // DongVaultFactory
  DONG_VAULT_FACTORY: '0x40f304876e71867bc54324256eea9f125ff958b4' as `0x${string}`,
  // Default Vault (오금동)
  VAULT: '0x7488f44BF19A3cbCa70cd4117f05F46D127aF93A' as `0x${string}`,
  // Default Investment Token / VToken (오금동)
  INVESTMENT_TOKEN: '0xf846e3ffc2eff1adaf17dcd68579db9fb9ac4a9c' as `0x${string}`,
} as const;

// Dong vault configurations (hardcoded)
export interface DongConfig {
  name: string;
  gu: string;
  lat: number;
  lon: number;
  vault: `0x${string}`;
  vToken: `0x${string}`;
}

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
    vault: "0x0000000000000000000000000000000000000000", // Not yet deployed
    vToken: "0x0000000000000000000000000000000000000000", // Not yet deployed
  },
  {
    name: "동숭동",
    gu: "종로구",
    lat: 37.5820,
    lon: 127.0030,
    vault: "0x0000000000000000000000000000000000000000", // Not yet deployed
    vToken: "0x0000000000000000000000000000000000000000", // Not yet deployed
  },
];

export function getDongByName(name: string): DongConfig | undefined {
  return LIVE_DONGS.find(d => d.name === name);
}

export function getAllDongNames(): string[] {
  return LIVE_DONGS.map(d => d.name);
}

export function getAllGus(): string[] {
  return Array.from(new Set(LIVE_DONGS.map(d => d.gu)));
}

export type DongName = typeof LIVE_DONGS[number]['name'];

export const DONG_VAULTS = Object.fromEntries(
  LIVE_DONGS.map(d => [
    d.name,
    {
      vault: d.vault,
      vToken: d.vToken,
      gu: d.gu,
      lat: d.lat,
      lon: d.lon,
    },
  ])
) as Record<string, { vault: `0x${string}`; vToken: `0x${string}`; gu: string; lat: number; lon: number }>;

// ERC20 ABI for token interactions
export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      { name: '_spender', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: '_owner', type: 'address' },
      { name: '_spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    type: 'function',
  },
] as const;

// DongVault ABI for deposit/withdraw interactions
export const DONG_VAULT_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'shares', type: 'uint256' }],
    name: 'withdraw',
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
    inputs: [],
    name: 'totalDeposits',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'targetAmount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'dongName',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'guName',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paused',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'investorCount',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// VToken ABI
export const VTOKEN_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'dongName',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Helper to get dong vault config by name
export function getDongVault(dongName: string) {
  return DONG_VAULTS[dongName];
}

// Network configuration helper
export function getExplorerUrl(chainId: number): string {
  switch (chainId) {
    case mantleSepolia.id:
      return 'https://sepolia.mantlescan.xyz';
    case mantleMainnet.id:
      return 'https://explorer.mantle.xyz';
    default:
      return 'https://sepolia.mantlescan.xyz';
  }
}

export function getExplorerTxUrl(chainId: number, txHash: string): string {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

export function getExplorerAddressUrl(chainId: number, address: string): string {
  return `${getExplorerUrl(chainId)}/address/${address}`;
}
