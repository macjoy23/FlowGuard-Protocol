import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Shield, Zap, Globe, Lock, TrendingUp } from "lucide-react";
import { VideoBackground } from "@/components/shared/VideoBackground";
import { ParticlesOverlay } from "@/components/shared/ParticlesOverlay";
import { GlassPanel } from "@/components/layout/GlassPanel";
import { Button } from "@/components/ui/Button";
import { fadeInUp, staggerContainer } from "@/lib/animations";

const features = [
  {
    icon: Shield,
    title: "Privacy-First Payroll",
    description:
      "Stealth payment channels ensure recipient privacy while maintaining full compliance auditability.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "Real-time USDC transfers on Polygon with sub-second finality and minimal gas costs.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description:
      "Pay anyone, anywhere. No borders, no intermediaries, no delays. True global settlement.",
  },
  {
    icon: TrendingUp,
    title: "Yield Optimization",
    description:
      "Idle payroll funds earn yield through Aave V3 integration. Your treasury works while you wait.",
  },
  {
    icon: Lock,
    title: "On-Chain Compliance",
    description:
      "Immutable compliance registry with IPFS document hashing. Audit-ready from day one.",
  },
  {
    icon: FileText,
    title: "Automated Execution",
    description:
      "Agent gateway enables scheduled, signature-verified payroll execution without manual triggers.",
  },
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <VideoBackground />
      <ParticlesOverlay />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pt-24 pb-16">
        <GlassPanel className="text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeInUp} className="mb-8">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border-glow bg-accent-dim text-xs font-medium text-accent">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Early access available from May 1, 2026
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-text-primary tracking-tighter leading-[1.1] mb-6"
            >
              Private Payroll for the
              <br />
              <span className="text-gradient">Global Economy</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-base sm:text-lg text-text-muted max-w-xl mx-auto mb-10 leading-relaxed"
            >
              Secure, compliant, real-time USDC settlement on Polygon.
              Enabling fluid interactions and instant connections for
              the modern workforce.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link to="/app">
                <Button variant="primary" size="lg">
                  Launch App
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a
                href="https://github.com/flowguard"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg">
                  <FileText className="w-4 h-4" />
                  View Docs
                </Button>
              </a>
            </motion.div>
          </motion.div>
        </GlassPanel>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-24 max-w-6xl mx-auto w-full"
        >
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                whileHover={{ y: -4, transition: { duration: 0.25 } }}
                className="glass-panel-sm p-6 group cursor-default"
              >
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:border-accent/40 transition-colors">
                  <Icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-heading font-semibold text-text-primary mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-24 text-center"
        >
          <p className="text-xs text-text-dim">
            Built on Polygon Mainnet &middot; Powered by USDC &middot; Aave V3 Yield
          </p>
        </motion.div>
      </div>
    </div>
  );
}
