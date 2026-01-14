import { getClients, getExplorerUrl, saveDeployedAddresses, updateWagmiConfig } from './config.js';
import { compileContract, compileAll, type CompiledContract } from './compiler.js';

// Nonce manager to handle sequential transactions
class NonceManager {
  private currentNonce: number | null = null;
  private publicClient: any;
  private account: any;

  constructor(publicClient: any, account: any) {
    this.publicClient = publicClient;
    this.account = account;
  }

  async getNonce(): Promise<number> {
    if (this.currentNonce === null) {
      this.currentNonce = await this.publicClient.getTransactionCount({
        address: this.account.address,
      });
    }
    const nonce = this.currentNonce!;
    this.currentNonce = this.currentNonce! + 1;
    return nonce;
  }

  reset(): void {
    this.currentNonce = null;
  }
}

export async function deployContract(
  network: string,
  compiled: CompiledContract,
  args: any[] = [],
  nonceManager?: NonceManager
): Promise<`0x${string}`> {
  const { publicClient, walletClient, account } = getClients(network);

  const deployOptions: any = {
    abi: compiled.abi,
    bytecode: compiled.bytecode as `0x${string}`,
    args,
    account,
  };

  // Use managed nonce if provided
  if (nonceManager) {
    deployOptions.nonce = await nonceManager.getNonce();
  }

  const hash = await walletClient.deployContract(deployOptions);

  console.log(`  Transaction: ${getExplorerUrl(network)}/tx/${hash}`);
  console.log('  Waiting for confirmation...');

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (!receipt.contractAddress) {
    throw new Error('Contract deployment failed - no address returned');
  }

  console.log(`  Deployed at: ${receipt.contractAddress}`);
  return receipt.contractAddress;
}

export { NonceManager };

export async function deployAllContracts(network: string) {
  console.log(`\n========================================`);
  console.log(`  Deploying RealFi contracts to ${network}`);
  console.log(`========================================\n`);

  const { publicClient, account, chain } = getClients(network);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer: ${account.address}`);
  console.log(`Network: ${chain.name} (Chain ID: ${chain.id})`);
  console.log(`Balance: ${Number(balance) / 1e18} MNT\n`);

  if (balance < BigInt(1e16)) {
    throw new Error('Insufficient balance. Need at least 0.01 MNT for deployment.');
  }

  // Compile all contracts
  const compiled = compileAll();

  // 1. Deploy USDT0
  console.log('1. Deploying USDT0...');
  const usdt0Address = await deployContract(network, compiled.USDT0);

  // 2. Deploy RealFiToken
  console.log('\n2. Deploying RealFiToken...');
  const tokenAddress = await deployContract(network, compiled.RealFiToken);

  // 3. Deploy KYCRegistry
  console.log('\n3. Deploying KYCRegistry...');
  const kycAddress = await deployContract(network, compiled.KYCRegistry);

  // 4. Deploy RealFiVault
  console.log('\n4. Deploying RealFiVault...');
  const vaultAddress = await deployContract(network, compiled.RealFiVault, [
    usdt0Address,
    tokenAddress,
    kycAddress,
  ]);

  // 5. Set vault in RealFiToken
  console.log('\n5. Setting vault address in RealFiToken...');
  const { walletClient } = getClients(network);
  const setVaultHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: compiled.RealFiToken.abi,
    functionName: 'setVault',
    args: [vaultAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: setVaultHash });
  console.log('  Vault set successfully');

  // Save deployed addresses
  const addresses = {
    network,
    USDT0: usdt0Address,
    RealFiToken: tokenAddress,
    KYCRegistry: kycAddress,
    RealFiVault: vaultAddress,
    deployedAt: new Date().toISOString(),
  };
  saveDeployedAddresses(addresses);
  console.log('\n6. Addresses saved to deployed-addresses.json');

  // Update wagmi config
  console.log('\n7. Updating wagmi config...');
  try {
    updateWagmiConfig({
      USDT0: usdt0Address,
      VAULT: vaultAddress,
      INVESTMENT_TOKEN: tokenAddress,
    });
    console.log('  wagmi config updated successfully');
  } catch (error) {
    console.warn('  Could not update wagmi config:', error);
  }

  // Summary
  console.log(`\n========================================`);
  console.log(`  Deployment Complete!`);
  console.log(`========================================`);
  console.log(`
Contract Addresses (${network}):
  USDT0:         ${usdt0Address}
  RealFiToken:   ${tokenAddress}
  KYCRegistry:   ${kycAddress}
  RealFiVault:   ${vaultAddress}

Explorer: ${getExplorerUrl(network)}
`);

  return addresses;
}

export async function deploySingleContract(
  network: string,
  contractName: string,
  args: any[] = []
): Promise<`0x${string}`> {
  console.log(`\nDeploying ${contractName} to ${network}...`);

  const compiled = compileContract(contractName);
  const address = await deployContract(network, compiled, args);

  console.log(`\n${contractName} deployed at: ${address}`);
  console.log(`Explorer: ${getExplorerUrl(network)}/address/${address}`);

  return address;
}

// ============================================
// Per-Dong Vault Factory Deployment
// ============================================

// Simple dong config for deployment (only needs name and gu)
interface DeployDongConfig {
  name: string;
  gu: string;
}

// Default dongs for deployment
const DEFAULT_DONGS: DeployDongConfig[] = [
  { name: "오금동", gu: "송파구" },
  { name: "구의동", gu: "광진구" },
  { name: "청파동2가", gu: "용산구" },
  { name: "묵정동", gu: "중구" },
];

export async function deployFactorySystem(network: string, dongs: DeployDongConfig[] = DEFAULT_DONGS) {
  console.log(`\n========================================`);
  console.log(`  Deploying DongVault Factory System`);
  console.log(`========================================\n`);

  const { publicClient, walletClient, account, chain } = getClients(network);

  // Check balance
  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer: ${account.address}`);
  console.log(`Network: ${chain.name} (Chain ID: ${chain.id})`);
  console.log(`Balance: ${Number(balance) / 1e18} MNT\n`);

  if (balance < BigInt(5e16)) {
    throw new Error('Insufficient balance. Need at least 0.05 MNT for factory deployment.');
  }

  // Create nonce manager to handle sequential transactions
  const nonceManager = new NonceManager(publicClient, account);

  // Compile contracts
  const usdt0Compiled = compileContract('USDT0');
  const kycCompiled = compileContract('KYCRegistry');
  const factoryCompiled = compileContract('DongVaultFactory');
  const vTokenCompiled = compileContract('VToken');

  // 1. Deploy USDT0
  console.log('1. Deploying USDT0...');
  const usdt0Address = await deployContract(network, usdt0Compiled, [], nonceManager);

  // 2. Deploy KYCRegistry
  console.log('\n2. Deploying KYCRegistry...');
  const kycAddress = await deployContract(network, kycCompiled, [], nonceManager);

  // 3. Deploy DongVaultFactory
  console.log('\n3. Deploying DongVaultFactory...');
  const factoryAddress = await deployContract(network, factoryCompiled, [
    usdt0Address,
    kycAddress,
  ], nonceManager);

  // 4. Deploy VTokens and create vaults for each dong
  console.log('\n4. Creating per-dong vaults...');
  const dongVaults: Record<string, { vaultAddress: string; vTokenAddress: string }> = {};

  for (const dong of dongs) {
    console.log(`\n   Creating vault for ${dong.name} (${dong.gu})...`);

    // Deploy VToken for this dong
    console.log(`   - Deploying VToken for ${dong.name}...`);
    const vTokenAddress = await deployContract(network, vTokenCompiled, [dong.name], nonceManager);

    // Create vault via factory
    console.log(`   - Creating DongVault via factory...`);
    const createVaultNonce = await nonceManager.getNonce();
    const createVaultHash = await walletClient.writeContract({
      address: factoryAddress,
      abi: factoryCompiled.abi,
      functionName: 'createVault',
      args: [dong.name, dong.gu, vTokenAddress, BigInt(0)], // 0 = use default target
      nonce: createVaultNonce,
    });
    await publicClient.waitForTransactionReceipt({ hash: createVaultHash });

    // Get vault address from factory
    const vaultAddress = (await publicClient.readContract({
      address: factoryAddress,
      abi: factoryCompiled.abi,
      functionName: 'getVault',
      args: [dong.name],
    })) as unknown as `0x${string}`;

    // Set vault address in VToken
    console.log(`   - Linking VToken to vault...`);
    const setVaultNonce = await nonceManager.getNonce();
    const setVaultHash = await walletClient.writeContract({
      address: vTokenAddress,
      abi: vTokenCompiled.abi,
      functionName: 'setVault',
      args: [vaultAddress],
      nonce: setVaultNonce,
    });
    await publicClient.waitForTransactionReceipt({ hash: setVaultHash });

    dongVaults[dong.name] = {
      vaultAddress: vaultAddress,
      vTokenAddress: vTokenAddress,
    };

    console.log(`   ✓ ${dong.name} vault: ${vaultAddress}`);
  }

  // Save deployed addresses
  const addresses = {
    network,
    USDT0: usdt0Address,
    KYCRegistry: kycAddress,
    DongVaultFactory: factoryAddress,
    dongVaults,
    deployedAt: new Date().toISOString(),
  };
  saveDeployedAddresses(addresses);
  console.log('\n5. Addresses saved to deployed-addresses.json');

  // Summary
  console.log(`\n========================================`);
  console.log(`  Factory Deployment Complete!`);
  console.log(`========================================`);
  console.log(`
Core Contracts:
  USDT0:             ${usdt0Address}
  KYCRegistry:       ${kycAddress}
  DongVaultFactory:  ${factoryAddress}

Dong Vaults:`);

  for (const [dongName, addrs] of Object.entries(dongVaults)) {
    console.log(`  ${dongName}:`);
    console.log(`    Vault:  ${addrs.vaultAddress}`);
    console.log(`    VToken: ${addrs.vTokenAddress}`);
  }

  console.log(`\nExplorer: ${getExplorerUrl(network)}\n`);

  return addresses;
}

export async function addDongVault(network: string, dong: DeployDongConfig) {
  console.log(`\nAdding new dong vault: ${dong.name} (${dong.gu})`);

  const { publicClient, walletClient, account } = getClients(network);

  // Load existing addresses
  const fs = await import('fs');
  const path = await import('path');
  const addressesPath = path.join(process.cwd(), '..', 'deployed-addresses.json');
  const existingAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf-8'));

  if (!existingAddresses.DongVaultFactory) {
    throw new Error('DongVaultFactory not deployed. Run deploy:factory first.');
  }

  // Create nonce manager for sequential transactions
  const nonceManager = new NonceManager(publicClient, account);

  const factoryAddress = existingAddresses.DongVaultFactory as `0x${string}`;
  const factoryCompiled = compileContract('DongVaultFactory');
  const vTokenCompiled = compileContract('VToken');

  // Deploy VToken
  console.log(`Deploying VToken for ${dong.name}...`);
  const vTokenAddress = await deployContract(network, vTokenCompiled, [dong.name], nonceManager);

  // Create vault
  console.log(`Creating vault via factory...`);
  const createVaultNonce = await nonceManager.getNonce();
  const createVaultHash = await walletClient.writeContract({
    address: factoryAddress,
    abi: factoryCompiled.abi,
    functionName: 'createVault',
    args: [dong.name, dong.gu, vTokenAddress, BigInt(0)],
    nonce: createVaultNonce,
  });
  await publicClient.waitForTransactionReceipt({ hash: createVaultHash });

  // Get vault address
  const vaultAddress = (await publicClient.readContract({
    address: factoryAddress,
    abi: factoryCompiled.abi,
    functionName: 'getVault',
    args: [dong.name],
  })) as unknown as `0x${string}`;

  // Link VToken
  console.log(`Linking VToken to vault...`);
  const setVaultNonce = await nonceManager.getNonce();
  const setVaultHash = await walletClient.writeContract({
    address: vTokenAddress,
    abi: vTokenCompiled.abi,
    functionName: 'setVault',
    args: [vaultAddress],
    nonce: setVaultNonce,
  });
  await publicClient.waitForTransactionReceipt({ hash: setVaultHash });

  // Update saved addresses
  existingAddresses.dongVaults = existingAddresses.dongVaults || {};
  existingAddresses.dongVaults[dong.name] = {
    vaultAddress,
    vTokenAddress,
  };
  fs.writeFileSync(addressesPath, JSON.stringify(existingAddresses, null, 2));

  console.log(`\n✓ Vault created for ${dong.name}`);
  console.log(`  Vault:  ${vaultAddress}`);
  console.log(`  VToken: ${vTokenAddress}`);

  return { vaultAddress, vTokenAddress };
}
