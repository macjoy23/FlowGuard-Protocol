import { useReadContract, useWriteContract } from "wagmi";
import { YIELD_VAULT_ABI, ERC20_ABI, AAVE_POOL_ABI } from "@/lib/abi";
import { CONTRACT_ADDRESSES, USDC_ADDRESS, AAVE_POOL_ADDRESS } from "@/config/constants";
import { useState, useCallback } from "react";
import type { TransactionState } from "@/types";

export function useVault(userAddress?: `0x${string}`) {
  const [txState, setTxState] = useState<TransactionState>({ status: "idle" });
  const { writeContractAsync } = useWriteContract();

  const { data: depositAmount } = useReadContract({
    address: CONTRACT_ADDRESSES.yieldVault,
    abi: YIELD_VAULT_ABI,
    functionName: "getDeposit",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!CONTRACT_ADDRESSES.yieldVault && !!userAddress, refetchInterval: 30000 },
  });

  const { data: yieldAmount } = useReadContract({
    address: CONTRACT_ADDRESSES.yieldVault,
    abi: YIELD_VAULT_ABI,
    functionName: "getYield",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!CONTRACT_ADDRESSES.yieldVault && !!userAddress, refetchInterval: 30000 },
  });

  const { data: totalDeposits } = useReadContract({
    address: CONTRACT_ADDRESSES.yieldVault,
    abi: YIELD_VAULT_ABI,
    functionName: "getTotalDeposits",
    query: { enabled: !!CONTRACT_ADDRESSES.yieldVault },
  });

  const { data: reserveData } = useReadContract({
    address: AAVE_POOL_ADDRESS,
    abi: AAVE_POOL_ABI,
    functionName: "getReserveData",
    args: [USDC_ADDRESS],
    query: { refetchInterval: 60000 },
  });

  // Aave V3 getReserveData returns a struct; currentLiquidityRate is in RAY (1e27)
  const currentAPY = reserveData
    ? Number((reserveData as { currentLiquidityRate: bigint }).currentLiquidityRate) / 1e25
    : 0;

  const deposit = useCallback(
    async (amount: bigint) => {
      try {
        setTxState({ status: "approving" });

        await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [CONTRACT_ADDRESSES.yieldVault, amount],
        });

        setTxState({ status: "pending" });

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.yieldVault,
          abi: YIELD_VAULT_ABI,
          functionName: "deposit",
          args: [amount],
        });

        setTxState({ status: "confirming", hash });
        return hash;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Deposit failed";
        setTxState({ status: "failed", error: message });
        throw error;
      }
    },
    [writeContractAsync]
  );

  const withdraw = useCallback(
    async (amount: bigint) => {
      try {
        setTxState({ status: "pending" });

        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.yieldVault,
          abi: YIELD_VAULT_ABI,
          functionName: "withdraw",
          args: [amount],
        });

        setTxState({ status: "confirming", hash });
        return hash;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Withdrawal failed";
        setTxState({ status: "failed", error: message });
        throw error;
      }
    },
    [writeContractAsync]
  );

  const resetTxState = useCallback(() => {
    setTxState({ status: "idle" });
  }, []);

  return {
    depositAmount: depositAmount ?? 0n,
    yieldAmount: yieldAmount ?? 0n,
    totalDeposits: totalDeposits ?? 0n,
    currentAPY,
    deposit,
    withdraw,
    txState,
    resetTxState,
  };
}
