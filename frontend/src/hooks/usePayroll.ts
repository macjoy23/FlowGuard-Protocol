import { useReadContract, useWriteContract } from "wagmi";
import { FLOWGUARD_CORE_ABI, ERC20_ABI } from "@/lib/abi";
import { CONTRACT_ADDRESSES, USDC_ADDRESS } from "@/config/constants";
import { useState, useCallback } from "react";
import type { TransactionState } from "@/types";

export function usePayroll() {
  const [txState, setTxState] = useState<TransactionState>({ status: "idle" });
  const { writeContractAsync } = useWriteContract();

  const { data: totalDisbursed } = useReadContract({
    address: CONTRACT_ADDRESSES.flowGuardCore,
    abi: FLOWGUARD_CORE_ABI,
    functionName: "getTotalDisbursed",
    query: { enabled: !!CONTRACT_ADDRESSES.flowGuardCore },
  });

  const { data: batchCount } = useReadContract({
    address: CONTRACT_ADDRESSES.flowGuardCore,
    abi: FLOWGUARD_CORE_ABI,
    functionName: "getBatchCount",
    query: { enabled: !!CONTRACT_ADDRESSES.flowGuardCore },
  });

  const { data: recipients } = useReadContract({
    address: CONTRACT_ADDRESSES.flowGuardCore,
    abi: FLOWGUARD_CORE_ABI,
    functionName: "getRecipients",
    query: { enabled: !!CONTRACT_ADDRESSES.flowGuardCore },
  });

  const executePayroll = useCallback(
    async (recipientAddresses: `0x${string}`[], amounts: bigint[]) => {
      try {
        setTxState({ status: "approving" });

        const totalAmount = amounts.reduce((sum, a) => sum + a, 0n);

        await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.flowGuardCore, totalAmount],
        });

        setTxState({ status: "pending" });

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.flowGuardCore,
          abi: FLOWGUARD_CORE_ABI,
          functionName: "executePayroll",
          args: [recipientAddresses, amounts],
        });

        setTxState({ status: "confirming", hash });
        return hash;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Transaction failed";
        setTxState({ status: "failed", error: message });
        throw error;
      }
    },
    [writeContractAsync]
  );

  const confirmTx = useCallback((hash: string) => {
    setTxState({ status: "confirmed", hash });
  }, []);

  const resetTxState = useCallback(() => {
    setTxState({ status: "idle" });
  }, []);

  return {
    totalDisbursed: totalDisbursed ?? 0n,
    batchCount: batchCount ? Number(batchCount) : 0,
    recipients: recipients ?? [],
    executePayroll,
    confirmTx,
    resetTxState,
    txState,
  };
}
