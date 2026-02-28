import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { NetworkGuard } from "@/components/web3/NetworkGuard";
import { Landing } from "@/pages/Landing";
import { Dashboard } from "@/pages/Dashboard";
import { Payroll } from "@/pages/Payroll";
import { Vault } from "@/pages/Vault";
import { Recipients } from "@/pages/Recipients";
import { Compliance } from "@/pages/Compliance";
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 ml-16 lg:ml-[260px]">
        <Navbar />
        <main className="pt-16">
          <NetworkGuard>{children}</NetworkGuard>
        </main>
      </div>
    </div>
  );
}

export function App() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  if (isLanding) {
    return (
      <>
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Landing />} />
          </Routes>
        </AnimatePresence>
      </>
    );
  }

  return (
    <AppLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payroll" element={<Payroll />} />
          <Route path="/vault" element={<Vault />} />
          <Route path="/recipients" element={<Recipients />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AnimatePresence>
    </AppLayout>
  );
}
