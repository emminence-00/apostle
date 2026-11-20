import {
  createPublicClient,
  decodeEventLog,
  erc20Abi,
  http,
  isAddressEqual,
  type Address,
  type Hex,
} from 'viem';

const HEX_TX = /^0x[a-fA-F0-9]{64}$/;
const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export class VerificationError extends Error {}

export type DepositConfig = {
  configured: boolean;
  chainId: number;
  chainName: string;
  usdcAddress: Address | null;
  walletAddress: Address | null;
  minDeposit: number;
  rpcUrl: string | null;
};

const CHAIN_NAMES: Record<number, string> = {
  1: 'Ethereum',
  137: 'Polygon',
  8453: 'Base',
  42161: 'Arbitrum',
  10: 'Optimism',
  11155111: 'Sepolia',
};

function address(value: string | undefined): Address | null {
  return value && EVM_ADDRESS.test(value) ? (value as Address) : null;
}

export function getDepositConfig(): DepositConfig {
  const chainId = Number(process.env.DEPOSIT_CHAIN_ID ?? 137);
  const usdcAddress = address(process.env.USDC_CONTRACT_ADDRESS);
  const walletAddress = address(process.env.APOSTLE_TRADING_WALLET);
  const rpcUrl = process.env.DEPOSIT_RPC_URL ?? null;
  const minDeposit = Number(process.env.MIN_DEPOSIT_USDC ?? 10);

  return {
    configured: Boolean(rpcUrl && usdcAddress && walletAddress && Number.isInteger(chainId)),
    chainId,
    chainName: CHAIN_NAMES[chainId] ?? `Chain ${chainId}`,
    usdcAddress,
    walletAddress,
    minDeposit,
    rpcUrl,
  };
}

/** Local development only. Never enabled when NODE_ENV=production. */
export function allowUnverifiedDeposits(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.ALLOW_UNVERIFIED_DEPOSITS === 'true';
}

/**
 * Confirms a real ERC-20 USDC transfer from one of the user's Privy-linked
 * wallets to the Apostle trading wallet. The amount is derived from the log,
 * never from the browser.
 */
export async function verifyDepositTransaction(
  txHash: string,
  senderAddresses: string[]
): Promise<{ amount: number; chainId: number }> {
  const config = getDepositConfig();
  if (!config.configured || !config.rpcUrl || !config.usdcAddress || !config.walletAddress) {
    throw new VerificationError('Deposit verification is not configured on the server');
  }
  if (!HEX_TX.test(txHash)) throw new VerificationError('Invalid transaction hash');

  const senders = senderAddresses
    .filter((value) => EVM_ADDRESS.test(value))
    .map((value) => value as Address);
  if (senders.length === 0) throw new VerificationError('No linked EVM wallet found for this account');

  const client = createPublicClient({ transport: http(config.rpcUrl) });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as Hex });
  } catch {
    throw new VerificationError('Could not read the transaction from the configured RPC');
  }
  if (!receipt || receipt.status !== 'success') {
    throw new VerificationError('Transaction is not mined or failed on-chain');
  }

  const chainId = await client.getChainId();
  if (chainId !== config.chainId) {
    throw new VerificationError(`Transaction is on chain ${chainId}; expected ${config.chainId}`);
  }

  let decimals: number;
  try {
    decimals = await client.readContract({
      address: config.usdcAddress,
      abi: erc20Abi,
      functionName: 'decimals',
    });
  } catch {
    throw new VerificationError('Could not read the USDC contract');
  }

  let total = BigInt(0);
  for (const log of receipt.logs) {
    if (!isAddressEqual(log.address, config.usdcAddress)) continue;
    try {
      const decoded = decodeEventLog({
        abi: erc20Abi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName !== 'Transfer') continue;
      const { from, to, value } = decoded.args;
      if (!senders.some((sender) => isAddressEqual(sender, from))) continue;
      if (!isAddressEqual(to, config.walletAddress)) continue;
      total += value;
    } catch {
      // Not a USDC Transfer log; ignore.
    }
  }

  if (total <= BigInt(0)) {
    throw new VerificationError(
      'No USDC transfer from a linked wallet to the Apostle trading wallet was found in this transaction'
    );
  }

  const amount = Math.round((Number(total) / 10 ** decimals) * 1e6) / 1e6;
  if (!Number.isFinite(amount) || amount < config.minDeposit) {
    throw new VerificationError(`Minimum deposit is ${config.minDeposit} USDC`);
  }

  return { amount, chainId };
}
