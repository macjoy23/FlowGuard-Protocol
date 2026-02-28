import { useReadContract } from "wagmi";
import { ERC20_ABI } from "@/lib/abi";
import { USDC_ADDRESS } from "@/config/constants";

export function useUSDCBalance(address?: `0x${string}`) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 15000,
    },
  });

  return {
    balance: data ?? 0n,
    isLoading,
    error,
    refetch,
  };
}
