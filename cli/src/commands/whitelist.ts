import chalk from 'chalk';
import ora from 'ora';
import { getClients, loadDeployedAddresses, getExplorerUrl } from '../config.js';
import { loadABI } from '../compiler.js';

export async function whitelist(options: {
  network: string;
  action: string;
  address: string;
}) {
  const spinner = ora(`${options.action === 'add' ? 'Adding' : 'Removing'} address from whitelist...`).start();

  try {
    const addresses = loadDeployedAddresses();
    if (!addresses) {
      throw new Error('No deployed addresses found. Run "realfi deploy" first.');
    }

    if (options.action !== 'add' && options.action !== 'remove') {
      throw new Error('Action must be "add" or "remove"');
    }

    if (!options.address.startsWith('0x') || options.address.length !== 42) {
      throw new Error('Invalid address format');
    }

    const { publicClient, walletClient } = getClients(options.network);
    const kycAbi = loadABI('KYCRegistry');

    // Check current status
    spinner.text = 'Checking current KYC status...';
    const isVerified = await publicClient.readContract({
      address: addresses.KYCRegistry as `0x${string}`,
      abi: kycAbi,
      functionName: 'isVerified',
      args: [options.address as `0x${string}`],
    });

    console.log(`\nAddress: ${options.address}`);
    console.log(`Current status: ${isVerified ? 'Verified' : 'Not verified'}`);

    const functionName = options.action === 'add' ? 'verifyKYC' : 'revokeKYC';

    spinner.text = 'Sending transaction...';

    const hash = await walletClient.writeContract({
      address: addresses.KYCRegistry as `0x${string}`,
      abi: kycAbi,
      functionName,
      args: [options.address as `0x${string}`],
    });

    console.log(`\nTransaction: ${getExplorerUrl(options.network)}/tx/${hash}`);

    spinner.text = 'Waiting for confirmation...';
    await publicClient.waitForTransactionReceipt({ hash });

    spinner.succeed(`Address ${options.action === 'add' ? 'added to' : 'removed from'} whitelist!`);
    console.log(chalk.green(`\n${options.address} has been ${options.action === 'add' ? 'verified' : 'revoked'}`));
  } catch (error: any) {
    spinner.fail('Failed to update whitelist');
    console.error(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}
