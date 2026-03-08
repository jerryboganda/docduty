import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "@/components/shared/ThemeToggle";
import SkipToContent from "@/components/shared/SkipToContent";
import { getPortalLoginUrl, getPortalRegisterUrl } from "@/lib/portal";

const productLinks = [
  { label: "Product Overview", href: "/product", desc: "Complete platform walkthrough" },
  { label: "How It Works", href: "/how-it-works", desc: "Step-by-step shift lifecycle" },
  { label: "Attendance Proof", href: "/attendance-proof", desc: "Geofence + QR verification" },
  { label: "Payments & Escrow", href: "/payments-escrow", desc: "Secure financial settlement" },
  { label: "Disputes & Reliability", href: "/disputes-reliability", desc: "Evidence-based resolution" },
];

const navLinks = [
  { label: "For Doctors", href: "/for-doctors" },
  { label: "For Hospitals", href: "/for-hospitals" },
  { label: "Pricing", href: "/pricing" },
  { label: "Trust & Safety", href: "/trust-safety" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const location = useLocation();
  const portalLoginUrl = getPortalLoginUrl();
  const portalRegisterUrl = getPortalRegisterUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setMegaOpen(false); }, [location]);

  return (
    <>
      <SkipToContent />
      <nav
        role="navigation"
        aria-label="Main navigation"
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-primary/95 backdrop-blur-xl shadow-xl shadow-primary/10 border-b border-accent/5"
            : "bg-transparent"
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="DocDuty home">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center transition-transform group-hover:scale-105">
                <span className="text-accent-foreground font-heading font-bold text-sm" aria-hidden="true">D</span>
              </div>
              <span className="font-heading font-bold text-xl text-primary-foreground">
                Doc<span className="text-accent">Duty</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {/* Product mega-menu trigger */}
              <div
                className="relative"
                onMouseEnter={() => setMegaOpen(true)}
                onMouseLeave={() => setMegaOpen(false)}
              >
                <button
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary-foreground/70 hover:text-accent transition-colors"
                  aria-expanded={megaOpen}
                  aria-haspopup="true"
                >
                  Product <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", megaOpen && "rotate-180")} aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {megaOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 mt-1 w-80 rounded-xl bg-card border border-border shadow-2xl shadow-primary/20 p-2 overflow-hidden"
                      role="menu"
                    >
                      {productLinks.map((link) => (
                        <Link
                          key={link.href}
                          to={link.href}
                          className="block px-4 py-3 rounded-lg hover:bg-accent/5 transition-colors group/item"
                          role="menuitem"
                          aria-current={location.pathname === link.href ? "page" : undefined}
                        >
                          <p className="text-sm font-medium text-card-foreground group-hover/item:text-accent transition-colors">
                            {link.label}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{link.desc}</p>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  aria-current={location.pathname === link.href ? "page" : undefined}
                  className={cn(
                    "px-3 py-2 text-sm font-medium transition-colors relative",
                    location.pathname === link.href
                      ? "text-accent"
                      : "text-primary-foreground/70 hover:text-accent"
                  )}
                >
                  {link.label}
                  {location.pathname === link.href && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute -bottom-0.5 left-3 right-3 h-0.5 bg-accent rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* CTAs */}
            <div className="hidden lg:flex items-center gap-2">
              <ThemeToggle />
              <a href={portalLoginUrl}>
                <Button variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10">
                  Login
                </Button>
              </a>
              <a href={portalRegisterUrl}>
                <Button className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold px-6 shadow-lg shadow-accent/20">
                  Get Started
                </Button>
              </a>
            </div>

            {/* Mobile Toggle */}
            <div className="flex items-center gap-1 lg:hidden">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="text-primary-foreground p-2"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="lg:hidden bg-primary/98 backdrop-blur-xl border-t border-primary-foreground/10 overflow-hidden"
              role="menu"
            >
              <div className="px-4 py-4 space-y-1" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
                <p className="text-xs text-primary-foreground/50 font-semibold uppercase tracking-wider px-3 py-2">Product</p>
                {productLinks.map((link, i) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-3 text-sm font-medium text-primary-foreground/70 hover:text-accent transition-colors"
                      role="menuitem"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="section-divider my-3" />
                {navLinks.map((link, i) => (
                  <motion.div key={link.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 + i * 0.05 }}>
                    <Link
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={location.pathname === link.href ? "page" : undefined}
                      className={cn(
                        "block px-3 py-3 text-sm font-medium transition-colors",
                        location.pathname === link.href ? "text-accent" : "text-primary-foreground/70 hover:text-accent"
                      )}
                      role="menuitem"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
                <div className="pt-4 flex flex-col gap-2">
                  <a href={portalLoginUrl} onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20">
                      Login
                    </Button>
                  </a>
                  <a href={portalRegisterUrl} onClick={() => setMobileOpen(false)}>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-teal-light font-semibold shadow-lg shadow-accent/20">
                      Get Started
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
