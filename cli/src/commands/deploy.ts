import chalk from 'chalk';
import ora from 'ora';
import { deployFactorySystem, deploySingleContract, addDongVault } from '../deployer.js';
import { compileContract } from '../compiler.js';
import { getClients, getExplorerUrl } from '../config.js';

export async function deployAll(options: { network: string }) {
  const spinner = ora('Starting factory deployment...').start();

  try {
    spinner.text = 'Checking wallet balance...';
    const { publicClient, account, chain } = getClients(options.network);
    const balance = await publicClient.getBalance({ address: account.address });

    spinner.succeed('Wallet ready');

    console.log(chalk.blue(`\nDeployer: ${account.address}`));
    console.log(chalk.blue(`Network: ${chain.name} (${chain.id})`));
    console.log(chalk.blue(`Balance: ${Number(balance) / 1e18} MNT\n`));

    if (balance < BigInt(5e16)) {
      throw new Error('Insufficient balance for deployment. Need at least 0.05 MNT');
    }

    // Deploy factory system with per-dong vaults
    await deployFactorySystem(options.network);

    console.log(chalk.green('\nFactory system deployed successfully!'));
  } catch (error: any) {
    spinner.fail('Deployment failed');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

export async function deployToken(options: { network: string }) {
  const spinner = ora('Deploying USDT0...').start();

  try {
    const { publicClient, account } = getClients(options.network);
    const balance = await publicClient.getBalance({ address: account.address });

    if (balance < BigInt(1e15)) {
      throw new Error('Insufficient balance. Need at least 0.001 MNT');
    }

    spinner.succeed('Wallet ready');

    const address = await deploySingleContract(options.network, 'USDT0');

    console.log(chalk.green(`\nUSDT0 deployed at: ${address}`));
    console.log(chalk.blue(`Explorer: ${getExplorerUrl(options.network)}/address/${address}`));
  } catch (error: any) {
    spinner.fail('Deployment failed');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

export async function deployVault(options: {
  network: string;
  usdt0?: string;
  atoken?: string;
  kyc?: string;
}) {
  if (!options.usdt0 || !options.atoken || !options.kyc) {
    console.error(chalk.red('Error: --usdt0, --atoken, and --kyc addresses are required'));
    console.log('\nUsage:');
    console.log('  realfi deploy:vault --usdt0 0x... --atoken 0x... --kyc 0x...');
    process.exit(1);
  }

  const spinner = ora('Deploying RealFiVault...').start();

  try {
    const { publicClient, account } = getClients(options.network);
    const balance = await publicClient.getBalance({ address: account.address });

    if (balance < BigInt(1e15)) {
      throw new Error('Insufficient balance. Need at least 0.001 MNT');
    }

    spinner.succeed('Wallet ready');

    const compiled = compileContract('RealFiVault');
    const { walletClient } = getClients(options.network);

    console.log('\nDeploying RealFiVault with:');
    console.log(`  USDT0: ${options.usdt0}`);
    console.log(`  aToken: ${options.atoken}`);
    console.log(`  KYC: ${options.kyc}`);

    const hash = await walletClient.deployContract({
      abi: compiled.abi,
      bytecode: compiled.bytecode as `0x${string}`,
      args: [options.usdt0, options.atoken, options.kyc],
    });

    console.log(`\nTransaction: ${getExplorerUrl(options.network)}/tx/${hash}`);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(chalk.green(`\nRealFiVault deployed at: ${receipt.contractAddress}`));
    console.log(chalk.blue(`Explorer: ${getExplorerUrl(options.network)}/address/${receipt.contractAddress}`));
  } catch (error: any) {
    spinner.fail('Deployment failed');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
