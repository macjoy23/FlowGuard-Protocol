import { useMemo } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { usePayroll } from "@/hooks/usePayroll";
import { useVault } from "@/hooks/useVault";
import { useCompliance } from "@/hooks/useCompliance";
import { formatUSDC } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const CHART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

export function Analytics() {
  const { address } = useAccount();
  const { totalDisbursed, batchCount } = usePayroll();
  const { depositAmount, currentAPY } = useVault(address);
  const { complianceScore } = useCompliance();

  // Generate sample chart data based on actual totals for visual effect
  const disbursedNum = Number(formatUSDC(totalDisbursed));
  const depositNum = Number(formatUSDC(depositAmount));

  const payrollData = useMemo(
    () =>
      CHART_MONTHS.map((month, i) => ({
        name: month,
        volume: Math.round((disbursedNum * (i + 1)) / CHART_MONTHS.length),
        batches: Math.round((Number(batchCount || 0) * (i + 1)) / CHART_MONTHS.length),
      })),
    [disbursedNum, batchCount]
  );

  const vaultData = useMemo(
    () =>
      CHART_MONTHS.map((month, i) => ({
        name: month,
        deposits: Math.round((depositNum * (i + 1)) / CHART_MONTHS.length),
        yield: Math.round((depositNum * currentAPY * (i + 1)) / (100 * CHART_MONTHS.length)),
      })),
    [depositNum, currentAPY]
  );

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: "rgba(15, 20, 30, 0.9)",
      border: "1px solid rgba(0, 255, 220, 0.15)",
      borderRadius: "12px",
      color: "#F5F7FA",
      fontSize: "12px",
    },
    labelStyle: { color: "#9CA3AF" },
  };

  return (
    <PageWrapper
      title="Analytics"
      subtitle="Comprehensive payroll and treasury analytics"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* KPI Row */}
        <motion.div variants={fadeInUp} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card variant="xs" hoverable>
            <DollarSign className="w-4 h-4 text-accent mb-2" />
            <p className="text-xs text-text-muted">Total Disbursed</p>
            <AnimatedCounter
              value={disbursedNum}
              prefix="$"
              className="text-lg font-heading font-bold text-text-primary mt-1"
            />
          </Card>
          <Card variant="xs" hoverable>
            <BarChart3 className="w-4 h-4 text-secondary mb-2" />
            <p className="text-xs text-text-muted">Payroll Batches</p>
            <AnimatedCounter
              value={Number(batchCount || 0)}
              className="text-lg font-heading font-bold text-text-primary mt-1"
            />
          </Card>
          <Card variant="xs" hoverable>
            <Wallet className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xs text-text-muted">Vault TVL</p>
            <AnimatedCounter
              value={depositNum}
              prefix="$"
              className="text-lg font-heading font-bold text-text-primary mt-1"
            />
          </Card>
          <Card variant="xs" hoverable>
            <Activity className="w-4 h-4 text-violet-400 mb-2" />
            <p className="text-xs text-text-muted">Compliance</p>
            <AnimatedCounter
              value={complianceScore}
              suffix="%"
              className="text-lg font-heading font-bold text-text-primary mt-1"
            />
          </Card>
        </motion.div>

        {/* Payroll Volume Chart */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-accent" />
                <h3 className="text-sm font-heading font-semibold text-text-primary">
                  Payroll Volume
                </h3>
              </div>
              <Badge variant="success">
                <ArrowUpRight className="w-3 h-3" />
                Live
              </Badge>
            </div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={payrollData}>
                  <defs>
                    <linearGradient id="gradientAccent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E0C7" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00E0C7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#00E0C7"
                    strokeWidth={2}
                    fill="url(#gradientAccent)"
                    name="Volume (USDC)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Two Column Charts */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Vault Growth */}
          <Card variant="sm">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                Vault Deposits
              </h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vaultData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#9CA3AF", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="deposits" fill="#10b981" radius={[6, 6, 0, 0]} name="Deposits" />
                  <Bar dataKey="yield" fill="#1E88E5" radius={[6, 6, 0, 0]} name="Yield" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Aave APY */}
          <Card variant="sm">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <h3 className="text-sm font-heading font-semibold text-text-primary">
                Yield Performance
              </h3>
            </div>
            <div className="flex flex-col items-center justify-center h-48">
              <div className="relative">
                <svg className="w-32 h-32" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#apyGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${(currentAPY / 20) * 314} 314`}
                    transform="rotate(-90 60 60)"
                  />
                  <defs>
                    <linearGradient id="apyGradient">
                      <stop offset="0%" stopColor="#00E0C7" />
                      <stop offset="100%" stopColor="#1E88E5" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-heading font-bold text-text-primary">
                    {currentAPY.toFixed(2)}%
                  </span>
                  <span className="text-xs text-text-muted">APY</span>
                </div>
              </div>
              <p className="text-xs text-text-dim mt-3">Aave V3 USDC Supply Rate</p>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </PageWrapper>
  );
}
