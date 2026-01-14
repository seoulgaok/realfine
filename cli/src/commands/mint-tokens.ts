import chalk from 'chalk';
import ora from 'ora';
import { getClients, loadDeployedAddresses, getExplorerUrl } from '../config.js';
import { loadABI } from '../compiler.js';

export async function mintTestTokens(options: {
  network: string;
  to: string;
  amount: string;
}) {
  const spinner = ora('Minting test tokens...').start();

  try {
    const addresses = loadDeployedAddresses();
    if (!addresses) {
      throw new Error('No deployed addresses found. Run "realfi deploy" first.');
    }

    if (!options.to.startsWith('0x') || options.to.length !== 42) {
      throw new Error('Invalid address format');
    }

    const { publicClient, walletClient } = getClients(options.network);
    const tokenAbi = loadABI('USDT0');

    // Convert amount to proper decimals (USDT0 has 6 decimals)
    const amount = BigInt(parseFloat(options.amount) * 1e6);

    // Get current balance
    spinner.text = 'Checking current balance...';
    const currentBalance = (await publicClient.readContract({
      address: addresses.USDT0 as `0x${string}`,
      abi: tokenAbi,
      functionName: 'balanceOf',
      args: [options.to as `0x${string}`],
    })) as unknown as bigint;

    console.log(`\nRecipient: ${options.to}`);
    console.log(`Current balance: ${Number(currentBalance) / 1e6} USDT0`);
    console.log(`Minting: ${options.amount} USDT0`);

    spinner.text = 'Sending mint transaction...';

    const hash = await walletClient.writeContract({
      address: addresses.USDT0 as `0x${string}`,
      abi: tokenAbi,
      functionName: 'mint',
      args: [options.to as `0x${string}`, amount],
    });

    console.log(`\nTransaction: ${getExplorerUrl(options.network)}/tx/${hash}`);

    spinner.text = 'Waiting for confirmation...';
    await publicClient.waitForTransactionReceipt({ hash });

    // Get new balance
    const newBalance = (await publicClient.readContract({
      address: addresses.USDT0 as `0x${string}`,
      abi: tokenAbi,
      functionName: 'balanceOf',
      args: [options.to as `0x${string}`],
    })) as unknown as bigint;

    spinner.succeed('Tokens minted!');
    console.log(chalk.green(`\nNew balance: ${Number(newBalance) / 1e6} USDT0`));
  } catch (error: any) {
    spinner.fail('Failed to mint tokens');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
