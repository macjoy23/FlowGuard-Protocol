import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import {
  DollarSign,
  Banknote,
  TrendingUp,
  Shield,
  Activity,
  Hash,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { ConnectButton } from "@/components/web3/ConnectButton";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { usePayroll } from "@/hooks/usePayroll";
import { useVault } from "@/hooks/useVault";
import { useCompliance } from "@/hooks/useCompliance";
import { formatUSDC, shortenAddress } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const { balance } = useUSDCBalance(address);
  const { totalDisbursed, batchCount } = usePayroll();
  const { yieldAmount, currentAPY } = useVault(address);
  const { complianceScore } = useCompliance();

  if (!isConnected) {
    return (
      <PageWrapper title="Dashboard" subtitle="Connect your wallet to view your overview">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="glass-panel p-10 text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
              <DollarSign className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-heading font-bold text-text-primary mb-2">
              Welcome to FlowGuard
            </h2>
            <p className="text-sm text-text-muted mb-6">
              Connect your wallet to access the payroll dashboard and manage your USDC operations on Polygon.
            </p>
            <ConnectButton />
          </div>
        </div>
      </PageWrapper>
    );
  }

  const stats = [
    {
      label: "USDC Balance",
      value: Number(formatUSDC(balance)),
      prefix: "$",
      icon: DollarSign,
      color: "text-accent",
    },
    {
      label: "Total Disbursed",
      value: Number(formatUSDC(totalDisbursed)),
      prefix: "$",
      icon: Banknote,
      color: "text-secondary",
    },
    {
      label: "Vault APY",
      value: currentAPY,
      suffix: "%",
      icon: TrendingUp,
      color: "text-emerald-400",
    },
    {
      label: "Compliance Score",
      value: complianceScore,
      suffix: "%",
      icon: Shield,
      color: "text-amber-400",
    },
    {
      label: "Payroll Batches",
      value: batchCount,
      decimals: 0,
      icon: Hash,
      color: "text-purple-400",
    },
    {
      label: "Vault Yield",
      value: Number(formatUSDC(yieldAmount)),
      prefix: "$",
      icon: Activity,
      color: "text-cyan-400",
    },
  ];

  return (
    <PageWrapper
      title="Dashboard"
      subtitle={`Connected: ${shortenAddress(address || "")}`}
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={fadeInUp}>
              <Card hoverable variant="sm">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${stat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="info">Live</Badge>
                </div>
                <p className="text-sm text-text-muted mb-1">{stat.label}</p>
                <AnimatedCounter
                  value={stat.value}
                  prefix={stat.prefix || ""}
                  suffix={stat.suffix || ""}
                  decimals={stat.decimals ?? 2}
                  className="text-2xl font-heading font-bold text-text-primary"
                />
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card variant="sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-heading font-semibold text-text-primary">
              Recent Activity
            </h3>
            <Badge>On-chain</Badge>
          </div>
          <div className="space-y-3">
            {batchCount > 0 ? (
              <p className="text-sm text-text-muted">
                {batchCount} payroll batch{batchCount !== 1 ? "es" : ""} executed.
                View detailed history in the Analytics section.
              </p>
            ) : (
              <div className="text-center py-8">
                <Activity className="w-8 h-8 text-text-dim mx-auto mb-3" />
                <p className="text-sm text-text-muted">
                  No transactions yet. Execute your first payroll to see activity here.
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </PageWrapper>
  );
}
