import chalk from 'chalk';
import ora from 'ora';
import { getClients, loadDeployedAddresses, getExplorerUrl, type FactoryDeployedAddresses } from '../config.js';
import { loadABI } from '../compiler.js';

// Helper to check if addresses are factory pattern
function isFactoryDeployment(addresses: any): addresses is FactoryDeployedAddresses {
  return 'DongVaultFactory' in addresses && 'dongVaults' in addresses;
}

export async function pauseVault(options: { network: string; dong?: string }) {
  const spinner = ora('Pausing vault...').start();

  try {
    const addresses = loadDeployedAddresses();
    if (!addresses) {
      throw new Error('No deployed addresses found. Run "realfi deploy" first.');
    }

    const { publicClient, walletClient } = getClients(options.network);

    if (isFactoryDeployment(addresses)) {
      // Factory pattern - need to specify which dong vault
      if (!options.dong) {
        spinner.fail('Factory deployment detected. Please specify --dong <dongName>');
        console.log(chalk.gray('\nAvailable dongs:'));
        for (const dongName of Object.keys(addresses.dongVaults)) {
          console.log(chalk.gray(`  - ${dongName}`));
        }
        return;
      }

      const dongVault = addresses.dongVaults[options.dong];
      if (!dongVault) {
        spinner.fail(`Dong vault "${options.dong}" not found`);
        return;
      }

      const vaultAbi = loadABI('DongVault');
      const vaultAddress = dongVault.vaultAddress as `0x${string}`;

      spinner.text = 'Checking current pause status...';
      const isPaused = (await publicClient.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'paused',
        args: [],
      })) as unknown as boolean;

      if (isPaused) {
        spinner.warn(`${options.dong} vault is already paused`);
        return;
      }

      spinner.text = 'Sending pause transaction...';
      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'pause',
        args: [],
      });

      console.log(`\nTransaction: ${getExplorerUrl(options.network)}/tx/${hash}`);

      spinner.text = 'Waiting for confirmation...';
      await publicClient.waitForTransactionReceipt({ hash });

      spinner.succeed(`${options.dong} vault paused!`);
      console.log(chalk.yellow(`\n${options.dong} vault is now PAUSED. Deposits and withdrawals are disabled.`));
    } else {
      // Legacy single vault pattern
      const vaultAbi = loadABI('RealFiVault');
      const vaultAddress = addresses.RealFiVault as `0x${string}`;

      spinner.text = 'Checking current pause status...';
      const isPaused = (await publicClient.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'paused',
        args: [],
      })) as unknown as boolean;

      if (isPaused) {
        spinner.warn('Vault is already paused');
        return;
      }

      spinner.text = 'Sending pause transaction...';
      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'pause',
        args: [],
      });

      console.log(`\nTransaction: ${getExplorerUrl(options.network)}/tx/${hash}`);

      spinner.text = 'Waiting for confirmation...';
      await publicClient.waitForTransactionReceipt({ hash });

      spinner.succeed('Vault paused!');
      console.log(chalk.yellow('\nVault is now PAUSED. Deposits and withdrawals are disabled.'));
    }
  } catch (error: any) {
    spinner.fail('Failed to pause vault');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

export async function unpauseVault(options: { network: string; dong?: string }) {
  const spinner = ora('Unpausing vault...').start();

  try {
    const addresses = loadDeployedAddresses();
    if (!addresses) {
      throw new Error('No deployed addresses found. Run "realfi deploy" first.');
    }

    const { publicClient, walletClient } = getClients(options.network);

    if (isFactoryDeployment(addresses)) {
      // Factory pattern - need to specify which dong vault
      if (!options.dong) {
        spinner.fail('Factory deployment detected. Please specify --dong <dongName>');
        console.log(chalk.gray('\nAvailable dongs:'));
        for (const dongName of Object.keys(addresses.dongVaults)) {
          console.log(chalk.gray(`  - ${dongName}`));
        }
        return;
      }

      const dongVault = addresses.dongVaults[options.dong];
      if (!dongVault) {
        spinner.fail(`Dong vault "${options.dong}" not found`);
        return;
      }

      const vaultAbi = loadABI('DongVault');
      const vaultAddress = dongVault.vaultAddress as `0x${string}`;

      spinner.text = 'Checking current pause status...';
      const isPaused = (await publicClient.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'paused',
        args: [],
      })) as unknown as boolean;

      if (!isPaused) {
        spinner.warn(`${options.dong} vault is already active`);
        return;
      }

      spinner.text = 'Sending unpause transaction...';
      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'unpause',
        args: [],
      });

      console.log(`\nTransaction: ${getExplorerUrl(options.network)}/tx/${hash}`);

      spinner.text = 'Waiting for confirmation...';
      await publicClient.waitForTransactionReceipt({ hash });

      spinner.succeed(`${options.dong} vault unpaused!`);
      console.log(chalk.green(`\n${options.dong} vault is now ACTIVE. Deposits and withdrawals are enabled.`));
    } else {
      // Legacy single vault pattern
      const vaultAbi = loadABI('RealFiVault');
      const vaultAddress = addresses.RealFiVault as `0x${string}`;

      spinner.text = 'Checking current pause status...';
      const isPaused = (await publicClient.readContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'paused',
        args: [],
      })) as unknown as boolean;

      if (!isPaused) {
        spinner.warn('Vault is already active');
        return;
      }

      spinner.text = 'Sending unpause transaction...';
      const hash = await walletClient.writeContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'unpause',
        args: [],
      });

      console.log(`\nTransaction: ${getExplorerUrl(options.network)}/tx/${hash}`);

      spinner.text = 'Waiting for confirmation...';
      await publicClient.waitForTransactionReceipt({ hash });

      spinner.succeed('Vault unpaused!');
      console.log(chalk.green('\nVault is now ACTIVE. Deposits and withdrawals are enabled.'));
    }
  } catch (error: any) {
    spinner.fail('Failed to unpause vault');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}