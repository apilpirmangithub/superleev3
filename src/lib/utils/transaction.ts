import type { PublicClient, Hex } from "viem";

/**
 * Wait for transaction confirmation with polling fallback
 */
export async function waitForTxConfirmation(
  publicClient: PublicClient | undefined,
  txHash: Hex,
  options: {
    confirmations?: number;
    timeoutMs?: number;
    pollIntervalMs?: number;
  } = {}
) {
  const { confirmations = 1, timeoutMs = 90_000, pollIntervalMs = 1500 } = options;
  
  if (!publicClient) {
    throw new Error("Public client not available");
  }

  let confirmed = false;

  // Try using built-in waitForTransactionReceipt first
  try {
    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations,
    });
    confirmed = true;
  } catch {
    // Fall back to polling
  }

  if (!confirmed) {
    // Fallback polling with timeout
    const deadline = Date.now() + timeoutMs;
    
    while (Date.now() < deadline && !confirmed) {
      try {
        const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
        if (receipt) {
          confirmed = true;
          break;
        }
      } catch {
        // Still pending
      }
      
      if (!confirmed) {
        await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
      }
    }
  }

  return confirmed;
}
