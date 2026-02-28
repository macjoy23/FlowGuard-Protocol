import { useAccount, useSwitchChain } from "wagmi";
import { polygon } from "wagmi/chains";
import { POLYGON_CHAIN_ID } from "@/config/constants";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

interface NetworkGuardProps {
  children: React.ReactNode;
}

export function NetworkGuard({ children }: NetworkGuardProps) {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected) return <>{children}</>;

  if (chain?.id !== POLYGON_CHAIN_ID) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-xl">
        <div className="glass-panel p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-xl font-heading font-bold text-text-primary mb-2">
            Wrong Network
          </h2>
          <p className="text-sm text-text-muted mb-6">
            FlowGuard Protocol operates exclusively on Polygon Mainnet.
            Please switch your wallet to continue.
          </p>
          <Button
            variant="primary"
            loading={isPending}
            onClick={() => switchChain({ chainId: polygon.id })}
            className="w-full"
          >
            Switch to Polygon
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
