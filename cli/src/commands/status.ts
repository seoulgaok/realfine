import chalk from 'chalk';
import ora from 'ora';
import { getClients, loadDeployedAddresses, getExplorerUrl, type FactoryDeployedAddresses, type DeployedAddresses } from '../config.js';
import { loadABI } from '../compiler.js';

// Live dongs with active workspace projects
const LIVE_DONGS = [
  { name: "오금동", gu: "송파구", projectName: "오금동 다세대주택" },
  { name: "구의동", gu: "광진구", projectName: "구의동 타운하우스" },
  { name: "청파동2가", gu: "용산구", projectName: "청파동 협소주택" },
  { name: "묵정동", gu: "중구", projectName: "묵정동 도시형생활주택" },
];

// Helper to check if addresses are factory pattern
function isFactoryDeployment(addresses: any): addresses is FactoryDeployedAddresses {
  return 'DongVaultFactory' in addresses && 'dongVaults' in addresses;
}

export async function showStatus(options: { network: string }) {
  const spinner = ora('Fetching contract status...').start();

  try {
    const addresses = loadDeployedAddresses();

    if (!addresses) {
      spinner.warn('No deployed contracts found');
      console.log(chalk.yellow('\nRun "realfi deploy" to deploy contracts first.'));

      // Still show live dongs info
      console.log(chalk.blue(`\n========================================`));
      console.log(chalk.blue(`  Live 동별 Vault 현황`));
      console.log(chalk.blue(`========================================\n`));

      console.log(chalk.cyan(`현재 ${LIVE_DONGS.length}개 동에서 프로젝트 진행 중:\n`));
      for (const dong of LIVE_DONGS) {
        console.log(chalk.green('  ●') + ` ${dong.name} (${dong.gu})`);
        console.log(chalk.gray(`    프로젝트: ${dong.projectName}`));
        console.log(chalk.gray(`    Vault 주소: (배포 필요)`));
        console.log('');
      }
      return;
    }

    const { publicClient, account, chain } = getClients(options.network);

    console.log(chalk.blue(`\n========================================`));
    console.log(chalk.blue(`  RealFi 동별 Vault Status`));
    console.log(chalk.blue(`========================================\n`));

    console.log(`Network: ${chain.name} (${chain.id})`);
    console.log(`Admin: ${account.address}`);
    console.log(`Deployed at: ${addresses.deployedAt}\n`);

    if (isFactoryDeployment(addresses)) {
      // Factory pattern - per-dong vaults
      console.log(chalk.cyan('Core Contract Addresses:'));
      console.log(`  USDT0:             ${addresses.USDT0}`);
      console.log(`  KYCRegistry:       ${addresses.KYCRegistry}`);
      console.log(`  DongVaultFactory:  ${addresses.DongVaultFactory}`);
      console.log(`\nExplorer: ${getExplorerUrl(options.network)}\n`);

      // Load ABIs
      let usdt0Abi, vaultAbi;
      try {
        usdt0Abi = loadABI('USDT0');
        vaultAbi = loadABI('DongVault');
      } catch {
        spinner.warn('ABIs not found. Run deploy to generate them.');
        return;
      }

      // USDT0 total supply
      const usdt0Supply = (await publicClient.readContract({
        address: addresses.USDT0 as `0x${string}`,
        abi: usdt0Abi,
        functionName: 'totalSupply',
        args: [],
      })) as unknown as bigint;

      console.log(chalk.cyan('Token Stats:'));
      console.log(`  USDT0 Total Supply: ${Number(usdt0Supply) / 1e6} USDT0\n`);

      // Dong vault statuses
      console.log(chalk.cyan('Dong Vault Status:'));
      console.log('');

      for (const [dongName, vaultData] of Object.entries(addresses.dongVaults)) {
        const vaultAddress = vaultData.vaultAddress as `0x${string}`;
        const vTokenAddress = vaultData.vTokenAddress as `0x${string}`;

        spinner.text = `Fetching ${dongName} vault status...`;

        try {
          const [dongInfo, isPaused, totalDeposited, participantCount] = await Promise.all([
            publicClient.readContract({
              address: vaultAddress,
              abi: vaultAbi,
              functionName: 'dongName',
              args: [],
            }),
            publicClient.readContract({
              address: vaultAddress,
              abi: vaultAbi,
              functionName: 'paused',
              args: [],
            }),
            publicClient.readContract({
              address: vaultAddress,
              abi: vaultAbi,
              functionName: 'totalDeposited',
              args: [],
            }),
            publicClient.readContract({
              address: vaultAddress,
              abi: vaultAbi,
              functionName: 'participantCount',
              args: [],
            }),
          ]) as unknown as [string, boolean, bigint, bigint];

          console.log(chalk.bold(`  ${dongName}:`));
          console.log(`    Status: ${isPaused ? chalk.red('PAUSED') : chalk.green('ACTIVE')}`);
          console.log(`    TVL: ${Number(totalDeposited) / 1e6} USDT0`);
          console.log(`    Participants: ${participantCount}`);
          console.log(chalk.gray(`    Vault: ${vaultAddress}`));
          console.log(chalk.gray(`    VToken: ${vTokenAddress}`));
          console.log('');
        } catch (error: any) {
          console.log(chalk.bold(`  ${dongName}:`));
          console.log(chalk.yellow(`    Error: ${error.message}`));
          console.log(chalk.gray(`    Vault: ${vaultAddress}`));
          console.log('');
        }
      }
    } else {
      // Legacy single vault pattern
      console.log(chalk.cyan('Contract Addresses:'));
      console.log(`  USDT0:         ${addresses.USDT0}`);
      console.log(`  RealFiToken:   ${(addresses as DeployedAddresses).RealFiToken}`);
      console.log(`  KYCRegistry:   ${addresses.KYCRegistry}`);
      console.log(`  RealFiVault:   ${(addresses as DeployedAddresses).RealFiVault}`);
      console.log(`\nExplorer: ${getExplorerUrl(options.network)}\n`);

      // Load ABIs
      let vaultAbi, tokenAbi, usdt0Abi;
      try {
        vaultAbi = loadABI('RealFiVault');
        tokenAbi = loadABI('RealFiToken');
        usdt0Abi = loadABI('USDT0');
      } catch {
        spinner.warn('ABIs not found. Run deploy to generate them.');
        return;
      }

      // Vault status
      spinner.text = 'Fetching vault status...';

      const [isPaused, projectCount, activeProjectId] = (await Promise.all([
        publicClient.readContract({
          address: (addresses as DeployedAddresses).RealFiVault as `0x${string}`,
          abi: vaultAbi,
          functionName: 'paused',
          args: [],
        }),
        publicClient.readContract({
          address: (addresses as DeployedAddresses).RealFiVault as `0x${string}`,
          abi: vaultAbi,
          functionName: 'projectCount',
          args: [],
        }),
        publicClient.readContract({
          address: (addresses as DeployedAddresses).RealFiVault as `0x${string}`,
          abi: vaultAbi,
          functionName: 'activeProjectId',
          args: [],
        }),
      ])) as unknown as [boolean, bigint, bigint];

      console.log(chalk.cyan('Vault Status:'));
      console.log(`  Status: ${isPaused ? chalk.red('PAUSED') : chalk.green('ACTIVE')}`);
      console.log(`  Total Projects: ${projectCount}`);
      console.log(`  Active Project ID: ${activeProjectId || 'None'}`);

      // Token stats
      spinner.text = 'Fetching token stats...';

      const [usdt0Supply, tokenSupply] = (await Promise.all([
        publicClient.readContract({
          address: addresses.USDT0 as `0x${string}`,
          abi: usdt0Abi,
          functionName: 'totalSupply',
          args: [],
        }),
        publicClient.readContract({
          address: (addresses as DeployedAddresses).RealFiToken as `0x${string}`,
          abi: tokenAbi,
          functionName: 'totalSupply',
          args: [],
        }),
      ])) as unknown as [bigint, bigint];

      console.log(chalk.cyan('\nToken Stats:'));
      console.log(`  USDT0 Total Supply: ${Number(usdt0Supply) / 1e6} USDT0`);
      console.log(`  aToken Total Supply: ${Number(tokenSupply) / 1e6} aRFI`);

      // Vault balance
      const vaultBalance = (await publicClient.readContract({
        address: addresses.USDT0 as `0x${string}`,
        abi: usdt0Abi,
        functionName: 'balanceOf',
        args: [(addresses as DeployedAddresses).RealFiVault as `0x${string}`],
      })) as unknown as bigint;

      console.log(`  Vault USDT0 Balance: ${Number(vaultBalance) / 1e6} USDT0`);
    }

    spinner.succeed('Status fetched successfully');
  } catch (error: any) {
    spinner.fail('Failed to fetch status');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}