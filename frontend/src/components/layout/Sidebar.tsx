import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Banknote,
  Vault,
  Users,
  Shield,
  BarChart3,
  Settings,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const sidebarLinks = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Payroll", href: "/app/payroll", icon: Banknote },
  { label: "Vault", href: "/app/vault", icon: Vault },
  { label: "Recipients", href: "/app/recipients", icon: Users },
  { label: "Compliance", href: "/app/compliance", icon: Shield },
  { label: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { label: "Settings", href: "/app/settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "fixed left-0 top-16 bottom-0 z-40 glass-panel-sm border-r border-border-glow rounded-none transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex flex-col h-full py-4">
        <nav className="flex-1 px-2 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              link.href === "/app"
                ? location.pathname === "/app"
                : location.pathname.startsWith(link.href);

            return (
              <NavLink
                key={link.href}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20"
                    : "text-text-muted hover:text-text-primary hover:bg-white/5"
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-2 pt-4 border-t border-border-glow">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-text-dim hover:text-text-muted transition-colors rounded-lg hover:bg-white/5"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 transition-transform",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
