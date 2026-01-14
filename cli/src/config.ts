import { createPublicClient, createWalletClient, http, type Chain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local from project root
dotenv.config({ path: path.join(__dirname, '../../..', '.env.local') });

// Mantle Sepolia Testnet
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
    default: { http: ['https://rpc.sepolia.mantle.xyz'] },
    public: { http: ['https://rpc.sepolia.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Sepolia Explorer', url: 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
};

// Mantle Mainnet
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
    default: { http: ['https://rpc.mantle.xyz'] },
    public: { http: ['https://rpc.mantle.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: 'https://explorer.mantle.xyz' },
  },
};

export function getChain(network: string): Chain {
  return network === 'mainnet' ? mantleMainnet : mantleSepolia;
}

export function getNetworkConfig(network: string): Chain {
  return getChain(network);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function getClients(network: string): any {
  const chain = getChain(network);
  const privateKey = process.env.REALFI_DEPLOYER_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('REALFI_DEPLOYER_PRIVATE_KEY not set in .env.local');
  }

  const account = privateKeyToAccount(`0x${privateKey.replace('0x', '')}`);

  const publicClient = createPublicClient({
    chain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(),
  });

  return { publicClient, walletClient, account, chain };
}

export function getExplorerUrl(network: string): string {
  const chain = getChain(network);
  return chain.blockExplorers?.default.url || 'https://sepolia.mantlescan.xyz';
}

// Path to deployed addresses file
const ADDRESSES_FILE = path.join(__dirname, '../..', 'deployed-addresses.json');

// Legacy single vault pattern
export interface DeployedAddresses {
  network: string;
  USDT0: string;
  RealFiToken: string;
  KYCRegistry: string;
  RealFiVault: string;
  deployedAt: string;
}

// Factory pattern with per-dong vaults
export interface FactoryDeployedAddresses {
  network: string;
  USDT0: string;
  KYCRegistry: string;
  DongVaultFactory: string;
  dongVaults: Record<string, { vaultAddress: string; vTokenAddress: string }>;
  deployedAt: string;
}

export function saveDeployedAddresses(addresses: DeployedAddresses | FactoryDeployedAddresses): void {
  fs.writeFileSync(ADDRESSES_FILE, JSON.stringify(addresses, null, 2));
}

export function loadDeployedAddresses(): DeployedAddresses | FactoryDeployedAddresses | null {
  if (!fs.existsSync(ADDRESSES_FILE)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(ADDRESSES_FILE, 'utf8'));
}

// Update wagmi config with deployed addresses
export function updateWagmiConfig(addresses: {
  USDT0: string;
  VAULT: string;
  INVESTMENT_TOKEN: string;
}): void {
  const configPath = path.join(__dirname, '../../../src/lib/wagmi/config.ts');

  if (!fs.existsSync(configPath)) {
    console.warn('wagmi config not found at:', configPath);
    return;
  }

  let content = fs.readFileSync(configPath, 'utf8');

  // Replace mock addresses with real ones
  content = content.replace(
    /USDT0: '0x[0-9a-fA-F]+' as `0x\$\{string\}`/,
    `USDT0: '${addresses.USDT0}' as \`0x\${string}\``
  );
  content = content.replace(
    /VAULT: '0x[0-9a-fA-F]+' as `0x\$\{string\}`/,
    `VAULT: '${addresses.VAULT}' as \`0x\${string}\``
  );
  content = content.replace(
    /INVESTMENT_TOKEN: '0x[0-9a-fA-F]+' as `0x\$\{string\}`/,
    `INVESTMENT_TOKEN: '${addresses.INVESTMENT_TOKEN}' as \`0x\${string}\``
  );

  fs.writeFileSync(configPath, content);
}
