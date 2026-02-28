import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { scaleIn } from "@/lib/animations";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export function GlassPanel({
  children,
  className,
  maxWidth = "max-w-4xl",
}: GlassPanelProps) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="visible"
      className={cn("glass-panel p-8 md:p-12 w-full", maxWidth, "mx-auto", className)}
    >
      {children}
    </motion.div>
  );
}
