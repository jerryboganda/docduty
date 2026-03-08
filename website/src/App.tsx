import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PageSkeleton from "./components/shared/PageSkeleton";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import PortalLoginRedirect from "./components/shared/PortalLoginRedirect";
import PortalRegisterRedirect from "./components/shared/PortalRegisterRedirect";

const ProductOverview = lazy(() => import("./pages/ProductOverview"));
const HowItWorksPage = lazy(() => import("./pages/HowItWorksPage"));
const ForDoctors = lazy(() => import("./pages/ForDoctors"));
const ForHospitals = lazy(() => import("./pages/ForHospitals"));
const TrustSafety = lazy(() => import("./pages/TrustSafety"));
const AttendanceProofPage = lazy(() => import("./pages/AttendanceProofPage"));
const PaymentsEscrowPage = lazy(() => import("./pages/PaymentsEscrowPage"));
const DisputesReliability = lazy(() => import("./pages/DisputesReliability"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const FAQPage = lazy(() => import("./pages/FAQPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/product" element={<ProductOverview />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/for-doctors" element={<ForDoctors />} />
                <Route path="/for-hospitals" element={<ForHospitals />} />
                <Route path="/trust-safety" element={<TrustSafety />} />
                <Route path="/attendance-proof" element={<AttendanceProofPage />} />
                <Route path="/payments-escrow" element={<PaymentsEscrowPage />} />
                <Route path="/disputes-reliability" element={<DisputesReliability />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/legal" element={<LegalPage />} />
                <Route path="/get-started" element={<PortalRegisterRedirect />} />
                <Route path="/login" element={<PortalLoginRedirect />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
