import { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { hoverLift } from "@/lib/animations";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
  variant?: "default" | "sm" | "xs";
}

const variantClasses = {
  default: "glass-panel p-6",
  sm: "glass-panel-sm p-5",
  xs: "glass-panel-xs p-4",
};

export function Card({
  children,
  className,
  hoverable = false,
  variant = "default",
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? hoverLift : undefined}
      className={cn(variantClasses[variant], className)}
    >
      {children}
    </motion.div>
  );
}
