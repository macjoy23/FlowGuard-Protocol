import { useState } from "react";
import { useAccount } from "wagmi";
import { motion } from "framer-motion";
import {
  FileCheck,
  Upload,
  ShieldCheck,
  FileText,
  Hash,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { TxProgressModal } from "@/components/web3/TxProgressModal";
import { useCompliance } from "@/hooks/useCompliance";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export function Compliance() {
  const { isConnected } = useAccount();
  const {
    totalDocuments,
    verifiedDocuments,
    complianceScore,
    registerDocument,
    txState,
    resetTxState,
  } = useCompliance();

  const [documentHash, setDocumentHash] = useState("");
  const [ipfsCid, setIpfsCid] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [isHashing, setIsHashing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setIsHashing(true);

    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
      setDocumentHash("0x" + hex);
    } catch {
      setDocumentHash("");
    } finally {
      setIsHashing(false);
    }
  };

  const handleRegister = async () => {
    if (!documentHash) return;
    setShowTxModal(true);
    try {
      await registerDocument(documentHash as `0x${string}`, ipfsCid || "");
    } catch {
      // Error handled in hook
    }
  };

  if (!isConnected) {
    return (
      <PageWrapper
        title="Compliance"
        subtitle="Document registry and verification on-chain"
      >
        <Card variant="sm" className="text-center py-10">
          <ShieldCheck className="w-10 h-10 text-accent mx-auto mb-3" />
          <p className="text-text-muted">
            Connect your wallet to manage compliance documents
          </p>
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Compliance"
      subtitle="Document registry and verification on-chain"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Stats Row */}
        <motion.div variants={fadeInUp} className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-accent" />
              <span className="text-sm text-text-muted">Total Documents</span>
            </div>
            <AnimatedCounter
              value={Number(totalDocuments || 0)}
              className="text-2xl font-heading font-bold text-text-primary"
            />
          </Card>
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-text-muted">Verified</span>
            </div>
            <AnimatedCounter
              value={Number(verifiedDocuments || 0)}
              className="text-2xl font-heading font-bold text-emerald-400"
            />
          </Card>
          <Card variant="sm" hoverable>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span className="text-sm text-text-muted">Compliance Score</span>
            </div>
            <AnimatedCounter
              value={complianceScore}
              suffix="%"
              className="text-2xl font-heading font-bold text-secondary"
            />
          </Card>
        </motion.div>

        {/* Register Document */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Register Document
            </h3>

            <div className="space-y-4">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Upload Document
                </label>
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-glass-border rounded-xl hover:border-accent/30 transition-colors cursor-pointer bg-white/[0.02]">
                  <Upload className="w-6 h-6 text-text-dim mb-2" />
                  <span className="text-sm text-text-muted">
                    {selectedFile
                      ? selectedFile.name
                      : "Click to select a file for SHA-256 hashing"}
                  </span>
                  {selectedFile && (
                    <span className="text-xs text-text-dim mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Hash Display */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hash className="w-4 h-4 text-text-dim" />
                  <label className="text-sm font-medium text-text-muted">
                    Document Hash (SHA-256)
                  </label>
                  {isHashing && (
                    <Badge variant="info">
                      <Clock className="w-3 h-3 animate-spin" />
                      Hashing...
                    </Badge>
                  )}
                </div>
                <Input
                  placeholder="0x... or upload a file to auto-generate"
                  value={documentHash}
                  onChange={(e) => setDocumentHash(e.target.value)}
                />
              </div>

              {/* IPFS CID */}
              <Input
                label="IPFS CID (optional)"
                placeholder="bafybeig..."
                value={ipfsCid}
                onChange={(e) => setIpfsCid(e.target.value)}
              />

              <Button
                variant="primary"
                className="w-full"
                disabled={!documentHash || documentHash.length < 66}
                loading={isHashing}
                onClick={handleRegister}
              >
                <FileCheck className="w-4 h-4" />
                Register on Polygon
              </Button>
            </div>
          </Card>
        </motion.div>

        {/* Compliance Info */}
        <motion.div variants={fadeInUp}>
          <Card variant="sm">
            <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
              Verification Status
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-text-primary">
                    Document Integrity
                  </span>
                </div>
                <Badge variant={Number(totalDocuments || 0) > 0 ? "success" : "warning"}>
                  {Number(totalDocuments || 0) > 0 ? "Verified" : "Pending"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-text-primary">
                    Entity Verification
                  </span>
                </div>
                <Badge variant={complianceScore >= 80 ? "success" : "warning"}>
                  {complianceScore >= 80 ? "Active" : "Required"}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-text-dim" />
                  <span className="text-sm text-text-primary">
                    KYB Status
                  </span>
                </div>
                <Badge variant="info">Contact Support</Badge>
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
