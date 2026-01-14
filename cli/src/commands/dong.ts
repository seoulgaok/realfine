// Dong Vault Management Commands
import chalk from 'chalk';
import ora from 'ora';
import { getClients, getNetworkConfig } from '../config.js';
import { deployFactorySystem, addDongVault } from '../deployer.js';
import { LIVE_DONGS, getDongByName, getDongsByGu, type DongConfig } from '../dongs.js';

interface DongListOptions {
  network: string;
  gu?: string;
}

interface DongCreateOptions {
  network: string;
  name: string;
  gu: string;
}

interface DongStatusOptions {
  network: string;
  name: string;
}

interface DongSeedOptions {
  network: string;
}

export async function dongList(options: DongListOptions): Promise<void> {
  const spinner = ora('Fetching dong vaults...').start();

  try {
    const config = getNetworkConfig(options.network);

    console.log('\n');
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.bold('                    동별 Vault 목록                      '));
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.gray(`Network: ${config.name}`));
    console.log('');

    // Filter by gu if specified
    const dongs = options.gu
      ? LIVE_DONGS.filter(d => d.gu === options.gu)
      : LIVE_DONGS;

    if (dongs.length === 0) {
      spinner.warn('No dong vaults found');
      return;
    }

    spinner.succeed(`Found ${dongs.length} dong vaults`);
    console.log('');

    for (const dong of dongs) {
      console.log(chalk.green('●') + chalk.bold(` ${dong.name}`));
      console.log(chalk.gray(`  구: ${dong.gu}`));
      console.log(chalk.gray(`  좌표: ${dong.lat}, ${dong.lon}`));
      console.log(chalk.cyan(`  상태: LIVE`));
      console.log('');
    }

    console.log(chalk.bold('═══════════════════════════════════════════════════════'));

  } catch (error) {
    spinner.fail('Failed to list dong vaults');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export async function dongCreate(options: DongCreateOptions): Promise<void> {
  const spinner = ora(`Creating ${options.name} vault...`).start();

  try {
    const config = getNetworkConfig(options.network);

    console.log('\n');
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.bold(`          Creating ${options.name} Vault                `));
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.gray(`Network: ${config.name}`));
    console.log('');

    spinner.text = 'Deploying VToken and creating vault...';

    // Deploy VToken and create vault via factory
    const result = await addDongVault(options.network, {
      name: options.name,
      gu: options.gu,
    });

    spinner.succeed(`${options.name} vault created successfully!`);

    console.log('');
    console.log(chalk.green('Deployed Contracts:'));
    console.log(chalk.gray(`  DongVault: ${result.vaultAddress}`));
    console.log(chalk.gray(`  VToken:    ${result.vTokenAddress}`));
    console.log('');

    console.log(chalk.bold('═══════════════════════════════════════════════════════'));

  } catch (error) {
    spinner.fail(`Failed to create ${options.name} vault`);
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export async function dongStatus(options: DongStatusOptions): Promise<void> {
  const spinner = ora(`Fetching ${options.name} vault status...`).start();

  try {
    const config = getNetworkConfig(options.network);

    // Find dong
    const dong = LIVE_DONGS.find(d => d.name === options.name);
    if (!dong) {
      spinner.fail(`${options.name} vault not found`);
      console.log(chalk.gray('\nAvailable dongs:'));
      LIVE_DONGS.forEach(d => console.log(chalk.gray(`  - ${d.name} (${d.gu})`)));
      return;
    }

    spinner.succeed(`Found ${options.name} vault`);

    console.log('\n');
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.bold(`             ${options.name} Vault Status                `));
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.gray(`Network: ${config.name}`));
    console.log('');

    console.log(chalk.bold('기본 정보'));
    console.log(chalk.gray(`  동: ${dong.name}`));
    console.log(chalk.gray(`  구: ${dong.gu}`));
    console.log(chalk.gray(`  좌표: ${dong.lat}, ${dong.lon}`));
    console.log('');

    console.log(chalk.bold('Vault 상태'));
    console.log(chalk.green(`  상태: LIVE`));
    console.log(chalk.gray(`  TVL: (on-chain data pending)`));
    console.log(chalk.gray(`  참여자: (on-chain data pending)`));
    console.log(chalk.gray(`  프로젝트: 1개`));
    console.log('');

    console.log(chalk.bold('컨트랙트 주소'));
    console.log(chalk.gray(`  DongVault: (TBD)`));
    console.log(chalk.gray(`  VToken: (TBD)`));
    console.log('');

    console.log(chalk.bold('═══════════════════════════════════════════════════════'));

  } catch (error) {
    spinner.fail(`Failed to get ${options.name} vault status`);
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}

export async function dongSeed(options: DongSeedOptions): Promise<void> {
  const spinner = ora('Seeding live dong vaults...').start();

  try {
    const config = getNetworkConfig(options.network);

    console.log('\n');
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.bold('             Seeding Live Dong Vaults                   '));
    console.log(chalk.bold('═══════════════════════════════════════════════════════'));
    console.log(chalk.gray(`Network: ${config.name}`));
    console.log('');

    console.log(chalk.bold('Live 동 목록 (4개):'));
    for (const dong of LIVE_DONGS) {
      console.log(chalk.green('  ●') + ` ${dong.name} (${dong.gu})`);
    }
    console.log('');

    spinner.text = 'Deploying factory system with all dong vaults...';

    // Convert LIVE_DONGS to the format expected by deployFactorySystem
    const dongConfigs = LIVE_DONGS.map(d => ({ name: d.name, gu: d.gu }));

    // Deploy the full factory system with all dongs
    const result = await deployFactorySystem(options.network, dongConfigs);

    spinner.succeed('Factory system deployed successfully!');

    console.log('');
    console.log(chalk.green('Core Contracts:'));
    console.log(chalk.gray(`  USDT0:            ${result.USDT0}`));
    console.log(chalk.gray(`  KYCRegistry:      ${result.KYCRegistry}`));
    console.log(chalk.gray(`  DongVaultFactory: ${result.DongVaultFactory}`));
    console.log('');

    console.log(chalk.green('Dong Vaults:'));
    for (const [dongName, addrs] of Object.entries(result.dongVaults)) {
      console.log(chalk.bold(`  ${dongName}:`));
      console.log(chalk.gray(`    Vault:  ${addrs.vaultAddress}`));
      console.log(chalk.gray(`    VToken: ${addrs.vTokenAddress}`));
    }
    console.log('');

    console.log(chalk.bold('═══════════════════════════════════════════════════════'));

  } catch (error) {
    spinner.fail('Failed to seed dong vaults');
    console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    process.exit(1);
  }
}
