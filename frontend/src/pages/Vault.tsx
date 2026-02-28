import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { TrendingUp, ArrowDownToLine, ArrowUpFromLine, Percent } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { TxProgressModal } from "@/components/web3/TxProgressModal";
import { useVault } from "@/hooks/useVault";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { formatUSDC } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { USDC_DECIMALS } from "@/config/constants";
import { parseUnits } from "viem";

export function Vault() {
  const { address } = useAccount();
  const { balance } = useUSDCBalance(address);
  const {
    depositAmount,
    yieldAmount,
    currentAPY,
    deposit,
    withdraw,
    txState,
    resetTxState,
  } = useVault(address);

  const [depositInput, setDepositInput] = useState("");
  const [withdrawInput, setWithdrawInput] = useState("");
  const [showTxModal, setShowTxModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">("deposit");

  const handleDeposit = async () => {
    if (!depositInput || parseFloat(depositInput) <= 0) return;
    setShowTxModal(true);
    try {
      await deposit(parseUnits(depositInput, USDC_DECIMALS));
    } catch {
      // Error handled in hook
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawInput || parseFloat(withdrawInput) <= 0) return;
    setShowTxModal(true);
    try {
      await withdraw(parseUnits(withdrawInput, USDC_DECIMALS));
    } catch {
      // Error handled in hook
    }
  };

  return (
    <PageWrapper
      title="Yield Vault"
      subtitle="Earn yield on idle USDC via Aave V3 on Polygon"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8"
      >
        <motion.div variants={fadeInUp}>
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-3">
              <ArrowDownToLine className="w-4 h-4 text-accent" />
              <span className="text-sm text-text-muted">Deposited</span>
            </div>
            <AnimatedCounter
              value={Number(formatUSDC(depositAmount))}
              prefix="$"
              className="text-2xl font-heading font-bold text-text-primary"
            />
            <p className="text-xs text-text-dim mt-1">USDC</p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-text-muted">Accrued Yield</span>
            </div>
            <AnimatedCounter
              value={Number(formatUSDC(yieldAmount))}
              prefix="$"
              className="text-2xl font-heading font-bold text-emerald-400"
            />
            <p className="text-xs text-text-dim mt-1">USDC earned</p>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-3">
              <Percent className="w-4 h-4 text-secondary" />
              <span className="text-sm text-text-muted">Current APY</span>
              <Badge variant="success">Live</Badge>
            </div>
            <AnimatedCounter
              value={currentAPY}
              suffix="%"
              className="text-2xl font-heading font-bold text-secondary"
            />
            <p className="text-xs text-text-dim mt-1">Aave V3 Polygon</p>
          </Card>
        </motion.div>
      </motion.div>

      <motion.div variants={fadeInUp} initial="hidden" animate="visible">
        <Card variant="sm" className="max-w-lg">
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-white/5">
            <button
              onClick={() => setActiveTab("deposit")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "deposit"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab("withdraw")}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "withdraw"
                  ? "bg-accent/15 text-accent"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Withdraw
            </button>
          </div>

          {activeTab === "deposit" ? (
            <div className="space-y-4">
              <Input
                label="Deposit Amount"
                placeholder="0.00"
                suffix="USDC"
                type="number"
                min="0"
                step="0.01"
                value={depositInput}
                onChange={(e) => setDepositInput(e.target.value)}
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>Available: ${formatUSDC(balance)} USDC</span>
                <button
                  onClick={() =>
                    setDepositInput(formatUSDC(balance))
                  }
                  className="text-accent hover:underline"
                >
                  Max
                </button>
              </div>
              <Button
                variant="primary"
                className="w-full"
                disabled={!depositInput || parseFloat(depositInput) <= 0}
                onClick={handleDeposit}
              >
                <ArrowDownToLine className="w-4 h-4" />
                Deposit to Vault
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Withdraw Amount"
                placeholder="0.00"
                suffix="USDC"
                type="number"
                min="0"
                step="0.01"
                value={withdrawInput}
                onChange={(e) => setWithdrawInput(e.target.value)}
              />
              <div className="flex justify-between text-xs text-text-muted">
                <span>Deposited: ${formatUSDC(depositAmount)} USDC</span>
                <button
                  onClick={() =>
                    setWithdrawInput(formatUSDC(depositAmount))
                  }
                  className="text-accent hover:underline"
                >
                  Max
                </button>
              </div>
              <Button
                variant="primary"
                className="w-full"
                disabled={!withdrawInput || parseFloat(withdrawInput) <= 0}
                onClick={handleWithdraw}
              >
                <ArrowUpFromLine className="w-4 h-4" />
                Withdraw from Vault
              </Button>
            </div>
          )}
        </Card>
      </motion.div>

      <TxProgressModal
        open={showTxModal}
        onClose={() => {
          setShowTxModal(false);
          resetTxState();
        }}
        state={txState}
      />
    </PageWrapper>
  );
}
