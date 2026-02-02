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
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/service/:id" element={<ServiceDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/createservice" element={<CreateService />} />
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
