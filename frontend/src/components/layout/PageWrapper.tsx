import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { pageTransition } from "@/lib/animations";

interface PageWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function PageWrapper({ children, title, subtitle }: PageWrapperProps) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-[calc(100vh-4rem)] p-6 md:p-8"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-heading font-bold text-text-primary tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-text-muted">{subtitle}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}
