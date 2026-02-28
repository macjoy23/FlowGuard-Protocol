import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import { Send, Plus, Trash2, DollarSign } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TxProgressModal } from "@/components/web3/TxProgressModal";
import { usePayroll } from "@/hooks/usePayroll";
import { useUSDCBalance } from "@/hooks/useUSDCBalance";
import { formatUSDC } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import { USDC_DECIMALS } from "@/config/constants";
import { parseUnits } from "viem";

interface PayrollEntry {
  address: string;
  amount: string;
}

export function Payroll() {
  const { address } = useAccount();
  const { balance } = useUSDCBalance(address);
  const { executePayroll, txState, resetTxState } = usePayroll();
  const [entries, setEntries] = useState<PayrollEntry[]>([
    { address: "", amount: "" },
  ]);
  const [showTxModal, setShowTxModal] = useState(false);

  const addEntry = () => {
    setEntries([...entries, { address: "", amount: "" }]);
  };

  const removeEntry = (index: number) => {
    if (entries.length === 1) return;
    setEntries(entries.filter((_, i) => i !== index));
  };

  const updateEntry = (index: number, field: keyof PayrollEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    setEntries(updated);
  };

  const totalAmount = entries.reduce((sum, e) => {
    const amt = parseFloat(e.amount) || 0;
    return sum + amt;
  }, 0);

  const isValid = entries.every(
    (e) => e.address.startsWith("0x") && e.address.length === 42 && parseFloat(e.amount) > 0
  );

  const handleExecute = async () => {
    if (!isValid) return;

    const recipients = entries.map((e) => e.address as `0x${string}`);
    const amounts = entries.map((e) => parseUnits(e.amount, USDC_DECIMALS));

    setShowTxModal(true);

    try {
      await executePayroll(recipients, amounts);
    } catch {
      // Error handled in hook
    }
  };

  return (
    <PageWrapper
      title="Payroll"
      subtitle="Create and execute batch USDC payments"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <motion.div variants={fadeInUp} className="lg:col-span-2">
          <Card variant="sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-heading font-semibold text-text-primary">
                Payment Recipients
              </h3>
              <Button variant="ghost" size="sm" onClick={addEntry}>
                <Plus className="w-4 h-4" />
                Add Recipient
              </Button>
            </div>

            <div className="space-y-4">
              {entries.map((entry, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="flex-1">
                    <Input
                      placeholder="0x... wallet address"
                      value={entry.address}
                      onChange={(e) => updateEntry(i, "address", e.target.value)}
                    />
                  </div>
                  <div className="w-40">
                    <Input
                      placeholder="Amount"
                      suffix="USDC"
                      type="number"
                      min="0"
                      step="0.01"
                      value={entry.amount}
                      onChange={(e) => updateEntry(i, "amount", e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => removeEntry(i)}
                    className="mt-2 p-2 text-text-dim hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
                    aria-label="Remove recipient"
                    disabled={entries.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-border-glow flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Amount</p>
                <p className="text-xl font-heading font-bold text-text-primary">
                  ${totalAmount.toFixed(2)} USDC
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                disabled={!isValid || totalAmount === 0}
                onClick={handleExecute}
              >
                <Send className="w-4 h-4" />
                Execute Payroll
              </Button>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Available Balance</p>
                <p className="text-lg font-heading font-bold text-text-primary">
                  ${formatUSDC(balance)} USDC
                </p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-text-muted">
                <span>Recipients</span>
                <span className="text-text-primary">{entries.length}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Total Payout</span>
                <span className="text-text-primary">${totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-muted">
                <span>Network</span>
                <span className="text-accent">Polygon</span>
              </div>
            </div>
          </Card>
        </motion.div>
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
