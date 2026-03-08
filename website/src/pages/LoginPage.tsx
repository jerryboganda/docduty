import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { Stethoscope, Building2, Shield, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getPortalRegisterUrl } from "@/lib/portal";

const LoginPage = () => {
  const portalRegisterUrl = getPortalRegisterUrl();

  return (
  <PageWrapper title="Login — DocDuty" description="Sign in to your DocDuty account. Access shifts, payments, and your dashboard.">
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden min-h-screen flex items-center">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(168_76%_36%/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(168_76%_36%/0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,hsl(168_76%_36%/0.06),transparent_50%)]" />

      <div className="relative max-w-md mx-auto px-4 w-full">
        <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-primary-foreground/10 bg-card p-8 shadow-2xl shadow-primary/30">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-heading font-bold text-sm">D</span>
              </div>
              <span className="font-heading font-bold text-xl text-foreground">Doc<span className="text-accent">Duty</span></span>
            </Link>
            <h1 className="font-heading text-2xl font-bold text-foreground">Welcome Back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <Tabs defaultValue="doctor">
            <TabsList className="grid w-full grid-cols-3 mb-8 h-11">
              <TabsTrigger value="doctor" className="text-xs font-semibold flex gap-1.5"><Stethoscope className="w-3.5 h-3.5" /> Doctor</TabsTrigger>
              <TabsTrigger value="facility" className="text-xs font-semibold flex gap-1.5"><Building2 className="w-3.5 h-3.5" /> Facility</TabsTrigger>
              <TabsTrigger value="admin" className="text-xs font-semibold flex gap-1.5"><Shield className="w-3.5 h-3.5" /> Admin</TabsTrigger>
            </TabsList>
            {["doctor", "facility", "admin"].map((role) => (
              <TabsContent key={role} value={role}>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <Label htmlFor={`${role}-email`} className="text-xs font-semibold">Email</Label>
                    <Input id={`${role}-email`} type="email" placeholder="you@example.com" className="mt-1.5 h-11" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <Label htmlFor={`${role}-password`} className="text-xs font-semibold">Password</Label>
                      <a href="#" className="text-[11px] text-accent hover:underline">Forgot password?</a>
                    </div>
                    <Input id={`${role}-password`} type="password" placeholder="••••••••" className="mt-1.5 h-11" />
                  </div>
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-teal-light font-semibold h-12 shadow-lg shadow-accent/20 group">
                    Sign In <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              </TabsContent>
            ))}
          </Tabs>

          <div className="mt-8 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{" "}
              <a href={portalRegisterUrl} className="text-accent hover:underline font-semibold">Get Started</a>
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  </div>
  </PageWrapper>
  );
};

export default LoginPage;
