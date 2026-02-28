import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/Button";
import { ConnectButton } from "@/components/web3/ConnectButton";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Get Started", href: "/app" },
  { label: "Developers", href: "/app/settings" },
  { label: "Features", href: "/app/vault" },
  { label: "Resources", href: "/app/analytics" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isConnected } = useAccount();
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border-glow"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="w-4 h-4" fill="none">
              <path d="M4 10L8 6L12 10L8 14L4 10Z" fill="#00E0C7" opacity="0.9" />
              <path d="M8 10L12 6L16 10L12 14L8 10Z" fill="#1E88E5" opacity="0.7" />
            </svg>
          </div>
          <span className="font-heading font-bold text-lg text-text-primary tracking-tight">
            FlowGuard
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="flex items-center gap-1 px-3 py-2 text-sm text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/5"
            >
              {link.label}
              <ChevronDown className="w-3.5 h-3.5 opacity-50" />
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isConnected || !isLanding ? (
            <ConnectButton />
          ) : (
            <Link to="/app">
              <Button variant="outline" size="sm">
                Launch App
              </Button>
            </Link>
          )}
        </div>

        <button
          className="md:hidden p-2 text-text-muted hover:text-text-primary"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:hidden glass-panel-sm mx-4 mb-4 p-4"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className="block px-4 py-3 text-sm text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-border-glow mt-2">
            <ConnectButton />
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
}
