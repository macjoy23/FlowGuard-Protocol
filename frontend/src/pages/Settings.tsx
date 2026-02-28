import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { motion } from "framer-motion";
import {
  Settings2,
  Wallet,
  Shield,
  Bell,
  Palette,
  Copy,
  ExternalLink,
  CheckCircle2,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { shortenAddress, getPolygonscanUrl } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Settings() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();

  const [copiedAddr, setCopiedAddr] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoApprove, setAutoApprove] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  if (!isConnected) {
    return (
      <PageWrapper title="Settings" subtitle="Manage your account and preferences">
        <Card variant="sm" className="text-center py-10">
          <Settings2 className="w-10 h-10 text-accent mx-auto mb-3" />
          <p className="text-text-muted">Connect your wallet to access settings</p>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Settings" subtitle="Manage your account and preferences">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="max-w-2xl space-y-6"
      >
        {/* Wallet Section */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-accent" />
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                Connected Wallet
              </h3>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-glass-border">
              <div>
                <p className="text-sm font-mono text-text-primary">
                  {shortenAddress(address!)}
                </p>
                <p className="text-xs text-text-dim mt-0.5">
                  via {connector?.name || "Unknown"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="success">Polygon</Badge>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-primary transition-colors"
                  title="Copy address"
                >
                  {copiedAddr ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <a
                  href={getPolygonscanUrl(address!, "address")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-primary transition-colors"
                  title="View on PolygonScan"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-3"
              onClick={() => disconnect()}
            >
              <LogOut className="w-4 h-4" />
              Disconnect Wallet
            </Button>
          </Card>
        </motion.div>

        {/* Security Section */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                Security
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-text-primary">Auto-approve Transactions</p>
                  <p className="text-xs text-text-dim">
                    Skip approval confirmation for small amounts
                  </p>
                </div>
                <button
                  onClick={() => setAutoApprove(!autoApprove)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    autoApprove ? "bg-accent" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      autoApprove ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {autoApprove && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-200">
                    Enabling auto-approve reduces security. Transactions will be
                    submitted without explicit confirmation.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Notifications */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                Notifications
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-text-primary">Transaction Alerts</p>
                  <p className="text-xs text-text-dim">
                    Get notified when transactions complete
                  </p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    notifications ? "bg-accent" : "bg-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      notifications ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Appearance */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                Appearance
              </h3>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm text-text-primary">Theme</p>
                <p className="text-xs text-text-dim">Visual theme preference</p>
              </div>
              <Badge variant="info">Dark Glass</Badge>
            </div>
          </Card>
        </motion.div>

        {/* Protocol Info */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4 text-text-dim" />
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                Protocol
              </h3>
            </div>
            <div className="space-y-2 text-xs text-text-dim">
              <div className="flex justify-between">
                <span>Network</span>
                <span className="text-text-muted">Polygon Mainnet (137)</span>
              </div>
              <div className="flex justify-between">
                <span>USDC Token</span>
                <span className="text-text-muted font-mono">0x3c499c...3359</span>
              </div>
              <div className="flex justify-between">
                <span>Aave V3 Pool</span>
                <span className="text-text-muted font-mono">0x794a61...14aD</span>
              </div>
              <div className="flex justify-between">
                <span>Version</span>
                <span className="text-text-muted">1.0.0</span>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
