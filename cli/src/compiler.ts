import solc from 'solc';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const contractsDir = path.join(__dirname, '../../contracts');
const abiDir = path.join(__dirname, '../abis');

export interface CompiledContract {
  abi: any[];
  bytecode: string;
}

function findImports(importPath: string): { contents: string } | { error: string } {
  // Handle local imports
  const localPath = path.join(contractsDir, importPath);
  if (fs.existsSync(localPath)) {
    return { contents: fs.readFileSync(localPath, 'utf8') };
  }

  return { error: `File not found: ${importPath}` };
}

export function compileContract(contractName: string): CompiledContract {
  const contractPath = path.join(contractsDir, `${contractName}.sol`);

  if (!fs.existsSync(contractPath)) {
    throw new Error(`Contract not found: ${contractPath}`);
  }

  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      [`${contractName}.sol`]: { content: source },
    },
    settings: {
      optimizer: { enabled: true, runs: 200 },
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
    },
  };

  console.log(`  Compiling ${contractName}.sol...`);

  const output = JSON.parse(
    solc.compile(JSON.stringify(input), { import: findImports })
  );

  // Check for errors
  if (output.errors) {
    const errors = output.errors.filter((e: any) => e.severity === 'error');
    if (errors.length > 0) {
      console.error('Compilation errors:');
      errors.forEach((e: any) => console.error(e.formattedMessage));
      throw new Error(`Compilation failed for ${contractName}`);
    }

    // Show warnings
    const warnings = output.errors.filter((e: any) => e.severity === 'warning');
    if (warnings.length > 0) {
      warnings.forEach((w: any) => console.warn(`  Warning: ${w.message}`));
    }
  }

  const contract = output.contracts[`${contractName}.sol`][contractName];

  if (!contract) {
    throw new Error(`Contract ${contractName} not found in compilation output`);
  }

  // Save ABI
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(abiDir, `${contractName}.json`),
    JSON.stringify(contract.abi, null, 2)
  );

  console.log(`  ${contractName} compiled successfully`);

  return {
    abi: contract.abi,
    bytecode: `0x${contract.evm.bytecode.object}`,
  };
}

export function compileAll(): Record<string, CompiledContract> {
  // Factory pattern contracts for per-dong vaults
  const contracts = ['USDT0', 'KYCRegistry', 'VToken', 'DongVault', 'DongVaultFactory'];
  const compiled: Record<string, CompiledContract> = {};

  console.log('\nCompiling contracts...');

  for (const name of contracts) {
    compiled[name] = compileContract(name);
  }

  console.log('All contracts compiled.\n');

  return compiled;
}

export function loadABI(contractName: string): any[] {
  const abiPath = path.join(abiDir, `${contractName}.json`);
  if (!fs.existsSync(abiPath)) {
    throw new Error(`ABI not found: ${abiPath}. Run deploy first.`);
  }
  return JSON.parse(fs.readFileSync(abiPath, 'utf8'));
}
