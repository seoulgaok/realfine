#!/usr/bin/env node
import { Command } from 'commander';
import { deployAll, deployToken, deployVault } from './commands/deploy.js';
import { whitelist } from './commands/whitelist.js';
import { pauseVault, unpauseVault } from './commands/pause.js';
import { mintTestTokens } from './commands/mint-tokens.js';
import { showStatus } from './commands/status.js';
import { dongList, dongCreate, dongStatus, dongSeed } from './commands/dong.js';

const program = new Command();

program
  .name('realfi')
  .description('RealFi Admin CLI for 동별 Vault management on Mantle')
  .version('2.0.0');

// ============================================
// Deploy Commands
// ============================================

program
  .command('deploy')
  .description('Deploy all RealFi contracts (USDT0, VToken, KYCRegistry, DongVaultFactory)')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(deployAll);

program
  .command('deploy:token')
  .description('Deploy only the USDT0 test token')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(deployToken);

program
  .command('deploy:vault')
  .description('Deploy DongVaultFactory contract (requires token addresses)')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .option('--usdt0 <address>', 'USDT0 contract address (required)')
  .option('--vtoken <address>', 'VToken contract address (required)')
  .option('--kyc <address>', 'KYC Registry address (required)')
  .action(deployVault);

// ============================================
// Dong Vault Commands
// ============================================

program
  .command('dong:list')
  .description('List all dong vaults')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .option('--gu <gu>', 'Filter by gu (e.g., 송파구)')
  .action(dongList);

program
  .command('dong:create')
  .description('Create a new dong vault')
  .requiredOption('--name <name>', 'Dong name (e.g., 오금동)')
  .requiredOption('--gu <gu>', 'Gu name (e.g., 송파구)')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(dongCreate);

program
  .command('dong:status')
  .description('Show status of a specific dong vault')
  .requiredOption('--name <name>', 'Dong name (e.g., 오금동)')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(dongStatus);

program
  .command('dong:seed')
  .description('Seed live dong vaults (오금동, 구의동, 청파동2가, 묵정동)')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(dongSeed);

// ============================================
// Admin Commands
// ============================================

program
  .command('whitelist')
  .description('Manage KYC whitelist (add or remove addresses)')
  .requiredOption('--action <action>', 'Action: add or remove')
  .requiredOption('--address <address>', 'User wallet address')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(whitelist);

program
  .command('pause')
  .description('Pause the vault (emergency)')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(pauseVault);

program
  .command('unpause')
  .description('Unpause the vault')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(unpauseVault);

program
  .command('mint-test-tokens')
  .description('Mint test USDT0 tokens to an address')
  .requiredOption('--to <address>', 'Recipient address')
  .requiredOption('--amount <amount>', 'Amount in USDT0 (e.g., 10000 for 10,000 USDT0)')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(mintTestTokens);

program
  .command('status')
  .description('Show deployed contract addresses, dong vaults, and states')
  .option('-n, --network <network>', 'Network: sepolia or mainnet', 'sepolia')
  .action(showStatus);

program.parse();
