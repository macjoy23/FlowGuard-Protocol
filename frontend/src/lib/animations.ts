import type { Variants } from "framer-motion";
import { EASE_CURVE } from "./utils";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_CURVE as unknown as number[] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: EASE_CURVE as unknown as number[] },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: EASE_CURVE as unknown as number[] },
  },
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: "100%" },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_CURVE as unknown as number[] },
  },
  exit: {
    opacity: 0,
    y: "100%",
    transition: { duration: 0.25, ease: EASE_CURVE as unknown as number[] },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const glowPulse = {
  boxShadow: [
    "0 0 20px rgba(0, 224, 199, 0.1)",
    "0 0 40px rgba(0, 224, 199, 0.3)",
    "0 0 20px rgba(0, 224, 199, 0.1)",
  ],
  transition: { duration: 2, repeat: Infinity, ease: "easeInOut" },
};

export const hoverLift = {
  y: -2,
  transition: { duration: 0.25, ease: EASE_CURVE as unknown as number[] },
};

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE_CURVE as unknown as number[] },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: EASE_CURVE as unknown as number[] },
  },
};
