import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import ServiceDetail from "./pages/ServiceDetail";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { wagmiConfig } from "../wagmi.config.ts";
import { WagmiProvider } from "wagmi";
import CreateService from "./pages/CreateService.tsx";
import TopSellers from "./pages/TopSellers.tsx";
import Relationship from "./pages/Relationship";
import SnapLinkPay from "./pages/SnapLinkPay";
import AIHub from "./pages/AIHub";
import CreateAgent from "./pages/CreateAgent";
import { OpenfortProvider, AuthProvider } from "@openfort/react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiConfig}>
      <OpenfortProvider
        publishableKey={import.meta.env.VITE_OPENFORT_PUBLIC_KEY}
        walletConfig={{
          shieldPublishableKey: import.meta.env.VITE_OPENFORT_SHIELD_PUBLIC_KEY,
          recoverWalletAutomaticallyAfterAuth: true,
        }}
        uiConfig={{
          authProviders: [
            AuthProvider.GUEST,
            AuthProvider.EMAIL_OTP,
            AuthProvider.WALLET,
          ],
          enforceSupportedChains: false,
        }}
      >
        <TooltipProvider>
          <BrowserRouter>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/createservice" element={<CreateService />} />
              <Route path="/ai" element={<AIHub />} />
              <Route path="/ai/create" element={<CreateAgent />} />
              <Route path="/top-sellers" element={<TopSellers />} />
              <Route path="/relationship/:sellerWallet" element={<Relationship />} />
              <Route path="/pay/:walletAddress/:amount?" element={<SnapLinkPay />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </OpenfortProvider>
    </WagmiProvider>
  </QueryClientProvider>
);

export default App;
