import { useAccount, useConnect, useDisconnect } from "wagmi";
import { injected } from "wagmi/connectors";
import { Button } from "@/components/ui/Button";
import { shortenAddress } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react";

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
  const { connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        {chain && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 glass-panel-xs text-xs text-accent">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {chain.name}
          </div>
        )}
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-3 py-2 glass-panel-xs text-sm text-text-primary hover:border-border-glow-strong transition-colors"
        >
          <Wallet className="w-4 h-4 text-accent" />
          <span className="font-mono">{shortenAddress(address)}</span>
          <LogOut className="w-3.5 h-3.5 text-text-dim" />
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      size="sm"
      loading={isPending}
      onClick={() => connect({ connector: injected() })}
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}
