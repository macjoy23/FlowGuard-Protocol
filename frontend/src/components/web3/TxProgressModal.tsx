import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { slideUp } from "@/lib/animations";
import { getPolygonscanUrl } from "@/lib/utils";
import type { TransactionState } from "@/types";

interface TxProgressModalProps {
  open: boolean;
  onClose: () => void;
  state: TransactionState;
}

export function TxProgressModal({ open, onClose, state }: TxProgressModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={state.status === "confirmed" || state.status === "failed" ? onClose : undefined}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              variants={slideUp}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="glass-panel w-full max-w-md p-6 relative"
              role="dialog"
              aria-modal="true"
              aria-label="Transaction Progress"
            >
              {(state.status === "confirmed" || state.status === "failed") && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-muted"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <div className="flex flex-col items-center text-center py-4">
                {state.status === "approving" && (
                  <>
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
                      Approving USDC
                    </h3>
                    <p className="text-sm text-text-muted">
                      Please confirm the approval in your wallet
                    </p>
                  </>
                )}

                {state.status === "pending" && (
                  <>
                    <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
                    <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
                      Transaction Pending
                    </h3>
                    <p className="text-sm text-text-muted">
                      Confirm the transaction in your wallet
                    </p>
                  </>
                )}

                {state.status === "confirming" && (
                  <>
                    <Loader2 className="w-12 h-12 text-secondary animate-spin mb-4" />
                    <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
                      Confirming
                    </h3>
                    <p className="text-sm text-text-muted">
                      Waiting for on-chain confirmation
                    </p>
                    {state.hash && (
                      <a
                        href={getPolygonscanUrl(state.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs text-accent hover:underline"
                      >
                        View on PolygonScan
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </>
                )}

                {state.status === "confirmed" && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
                      Transaction Confirmed
                    </h3>
                    <p className="text-sm text-text-muted mb-4">
                      Successfully executed on Polygon
                    </p>
                    {state.hash && (
                      <a
                        href={getPolygonscanUrl(state.hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
                      >
                        View on PolygonScan
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </>
                )}

                {state.status === "failed" && (
                  <>
                    <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-heading font-semibold text-text-primary mb-1">
                      Transaction Failed
                    </h3>
                    <p className="text-sm text-red-400/80">
                      {state.error || "An unexpected error occurred"}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
