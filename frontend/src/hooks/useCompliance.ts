import { useReadContract, useWriteContract } from "wagmi";
import { COMPLIANCE_REGISTRY_ABI } from "@/lib/abi";
import { CONTRACT_ADDRESSES } from "@/config/constants";
import { useState, useCallback } from "react";
import type { TransactionState } from "@/types";

export function useCompliance() {
  const [txState, setTxState] = useState<TransactionState>({ status: "idle" });
  const { writeContractAsync } = useWriteContract();

  const { data: totalDocuments } = useReadContract({
    address: CONTRACT_ADDRESSES.complianceRegistry,
    abi: COMPLIANCE_REGISTRY_ABI,
    functionName: "getTotalDocuments",
    query: { enabled: !!CONTRACT_ADDRESSES.complianceRegistry },
  });

  const { data: verifiedDocuments } = useReadContract({
    address: CONTRACT_ADDRESSES.complianceRegistry,
    abi: COMPLIANCE_REGISTRY_ABI,
    functionName: "getVerifiedDocuments",
    query: { enabled: !!CONTRACT_ADDRESSES.complianceRegistry },
  });

  const complianceScore =
    totalDocuments && Number(totalDocuments) > 0
      ? Math.round((Number(verifiedDocuments ?? 0) / Number(totalDocuments)) * 100)
      : 0;

  const registerDocument = useCallback(
    async (docHash: `0x${string}`, ipfsCid: string) => {
      try {
        setTxState({ status: "pending" });
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.complianceRegistry,
          abi: COMPLIANCE_REGISTRY_ABI,
          functionName: "registerDocument",
          args: [docHash, ipfsCid],
        });
        setTxState({ status: "confirming", hash });
        return hash;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Registration failed";
        setTxState({ status: "failed", error: message });
        throw error;
      }
    },
    [writeContractAsync]
  );

  const verifyDocument = useCallback(
    async (docHash: `0x${string}`) => {
      try {
        setTxState({ status: "pending" });
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.complianceRegistry,
          abi: COMPLIANCE_REGISTRY_ABI,
          functionName: "verifyDocument",
          args: [docHash],
        });
        setTxState({ status: "confirming", hash });
        return hash;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Verification failed";
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
    totalDocuments: Number(totalDocuments ?? 0),
    verifiedDocuments: Number(verifiedDocuments ?? 0),
    complianceScore,
    registerDocument,
    verifyDocument,
    txState,
    resetTxState,
  };
}
