import { useState } from "react";
import { useAccount } from "wagmi";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Users,
  Search,
  Copy,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { isAddress } from "viem";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { usePayroll } from "@/hooks/usePayroll";
import { shortenAddress, getPolygonscanUrl } from "@/lib/utils";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface RecipientDisplay {
  address: string;
  label?: string;
  addedAt: string;
}

export function Recipients() {
  const { isConnected } = useAccount();
  const { recipients } = usePayroll();

  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  // Mock local recipient labels (in production, store in contract or local storage)
  const [localRecipients, setLocalRecipients] = useState<RecipientDisplay[]>([]);

  const allRecipients: RecipientDisplay[] = [
    ...(recipients || []).map((addr: string) => ({
      address: addr,
      label: localRecipients.find((r) => r.address.toLowerCase() === addr.toLowerCase())?.label,
      addedAt: new Date().toISOString(),
    })),
    ...localRecipients.filter(
      (lr) => !(recipients || []).some(
        (addr: string) => addr.toLowerCase() === lr.address.toLowerCase()
      )
    ),
  ];

  const filtered = allRecipients.filter(
    (r) =>
      r.address.toLowerCase().includes(search.toLowerCase()) ||
      r.label?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    if (!newAddress || !isAddress(newAddress)) return;
    setLocalRecipients((prev) => [
      ...prev,
      {
        address: newAddress,
        label: newLabel || undefined,
        addedAt: new Date().toISOString(),
      },
    ]);
    setNewAddress("");
    setNewLabel("");
    setShowAddModal(false);
  };

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  if (!isConnected) {
    return (
      <PageWrapper
        title="Recipients"
        subtitle="Manage your payroll recipient wallet addresses"
      >
        <Card variant="sm" className="text-center py-10">
          <Users className="w-10 h-10 text-accent mx-auto mb-3" />
          <p className="text-text-muted">
            Connect your wallet to manage recipients
          </p>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Recipients"
      subtitle="Manage your payroll recipient wallet addresses"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-accent" />
              <span className="text-sm text-text-muted">Total Recipients</span>
            </div>
            <AnimatedCounter
              value={allRecipients.length}
              className="text-2xl font-heading font-bold text-text-primary"
            />
          </Card>
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-text-muted">On-chain Registered</span>
            </div>
            <AnimatedCounter
              value={(recipients || []).length}
              className="text-2xl font-heading font-bold text-emerald-400"
            />
          </Card>
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4 text-secondary" />
              <span className="text-sm text-text-muted">Local Only</span>
            </div>
            <AnimatedCounter
              value={localRecipients.filter(
                (lr) => !(recipients || []).some(
                  (addr: string) => addr.toLowerCase() === lr.address.toLowerCase()
                )
              ).length}
              className="text-2xl font-heading font-bold text-secondary"
            />
          </Card>
        </motion.div>

        {/* Search + Add */}
        <motion.div variants={fadeInUp} className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input
              type="text"
              placeholder="Search by address or label..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input w-full pl-10 pr-4 py-2.5 text-sm"
            />
          </div>
          <Button variant="primary" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4" />
            Add
          </Button>
        </motion.div>

        {/* Recipient List */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            {filtered.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-8 h-8 text-text-dim mx-auto mb-2" />
                <p className="text-text-muted text-sm">
                  {search ? "No recipients match your search" : "No recipients added yet"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                <AnimatePresence>
                  {filtered.map((r, i) => {
                    const isOnChain = (recipients || []).some(
                      (addr: string) => addr.toLowerCase() === r.address.toLowerCase()
                    );
                    return (
                      <motion.div
                        key={r.address}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-secondary/20 flex items-center justify-center text-xs font-bold text-accent">
                            {(r.label || r.address.slice(2, 4)).toUpperCase().slice(0, 2)}
                          </div>
                          <div>
                            {r.label && (
                              <p className="text-sm font-medium text-text-primary">
                                {r.label}
                              </p>
                            )}
                            <p className="text-xs text-text-muted font-mono">
                              {shortenAddress(r.address as `0x${string}`)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isOnChain ? "success" : "info"}>
                            {isOnChain ? "On-chain" : "Local"}
                          </Badge>
                          <button
                            onClick={() => handleCopy(r.address)}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-primary transition-colors"
                            title="Copy address"
                          >
                            {copiedAddr === r.address ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <a
                            href={getPolygonscanUrl(r.address as `0x${string}`, "address")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg hover:bg-white/5 text-text-dim hover:text-text-primary transition-colors"
                            title="View on PolygonScan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </Card>
        </motion.div>
      </motion.div>

      {/* Add Recipient Modal */}
      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Recipient"
      >
        <div className="space-y-4">
          <Input
            label="Wallet Address"
            placeholder="0x..."
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            error={
              newAddress && !isAddress(newAddress)
                ? "Invalid Ethereum address"
                : undefined
            }
          />
          <Input
            label="Label (optional)"
            placeholder="e.g. Alice, Marketing Team"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
          />
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAdd}
              disabled={!newAddress || !isAddress(newAddress)}
              className="flex-1"
            >
              <UserPlus className="w-4 h-4" />
              Add Recipient
            </Button>
          </div>
        </div>
      </Modal>
    </PageWrapper>
  );
}
