import { Link } from "react-router-dom";
import { ArrowRight, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { getPortalRegisterUrl } from "@/lib/portal";
import { PUBLIC_SUPPORT_PHONE } from "@/lib/support";

const footerSections = [
  {
    title: "Platform",
    links: [
      { label: "Product Overview", href: "/product" },
      { label: "How It Works", href: "/how-it-works" },
      { label: "Attendance Proof", href: "/attendance-proof" },
      { label: "Payments & Escrow", href: "/payments-escrow" },
      { label: "Disputes & Reliability", href: "/disputes-reliability" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "For Doctors", href: "/for-doctors" },
      { label: "For Hospitals", href: "/for-hospitals" },
      { label: "Pricing", href: "/pricing" },
      { label: "Get Started", href: "/get-started" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Trust & Safety", href: "/trust-safety" },
      { label: "FAQ", href: "/faq" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/legal?tab=privacy" },
      { label: "Terms of Service", href: "/legal?tab=terms" },
      { label: "Cancellation Policy", href: "/legal?tab=cancellation" },
      { label: "Dispute Policy", href: "/legal?tab=dispute" },
    ],
  },
];

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/docduty" },
  { label: "Facebook", href: "https://www.facebook.com/docduty" },
];

const Footer = () => {
  const [email, setEmail] = useState("");
  const portalRegisterUrl = getPortalRegisterUrl();

  return (
    <footer role="contentinfo" aria-label="Site footer" className="bg-navy-gradient text-primary-foreground relative overflow-hidden">
      {/* Top gradient divider */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" aria-hidden="true" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter section */}
        <div className="py-12 lg:py-16 border-b border-primary-foreground/10">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-heading font-bold text-2xl lg:text-3xl text-primary-foreground">
                Stay Updated with <span className="text-accent">DocDuty</span>
              </h3>
              <p className="text-primary-foreground/60 mt-2 text-sm">
                Get the latest on healthcare staffing, platform updates, and shift opportunities.
              </p>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative min-w-0">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/30" aria-hidden="true" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  aria-label="Email address for newsletter"
                  className="w-full h-12 pl-10 pr-4 rounded-xl bg-primary-foreground/5 border border-primary-foreground/10 text-sm text-primary-foreground placeholder:text-primary-foreground/30 focus:outline-none focus:border-accent/50 focus:ring-2 focus:ring-accent/20 transition-colors"
                />
              </div>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-teal-light font-semibold h-12 px-6 shrink-0 shadow-lg shadow-accent/20">
                Subscribe <ArrowRight className="w-4 h-4 ml-1" aria-hidden="true" />
              </Button>
            </form>
          </div>
        </div>

        {/* Main footer grid */}
        <div className="py-12 lg:py-16 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-heading font-bold text-sm" aria-hidden="true">D</span>
              </div>
              <span className="font-heading font-bold text-xl">
                Doc<span className="text-accent">Duty</span>
              </span>
            </div>
            <p className="text-sm text-primary-foreground/60 leading-relaxed mb-6 max-w-xs">
              Pakistan's trusted doctor duty replacement and locum marketplace. Verified. Accountable. Secure.
            </p>
            {/* Contact info */}
            <address className="not-italic space-y-2.5">
              <div className="flex items-center gap-2 text-xs text-primary-foreground/55">
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                <span>hello@docduty.pk</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary-foreground/55">
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{PUBLIC_SUPPORT_PHONE}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-primary-foreground/55">
                <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Karachi, Pakistan</span>
              </div>
            </address>
          </div>

          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h4 className="font-heading font-semibold text-sm mb-4 text-primary-foreground/80 uppercase tracking-wider">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.href === "/get-started" ? (
                      <a
                        href={portalRegisterUrl}
                        className="text-sm text-primary-foreground/60 hover:text-accent transition-colors duration-200"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-primary-foreground/60 hover:text-accent transition-colors duration-200"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4" style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
          <p className="text-xs text-primary-foreground/50">
            © {new Date().getFullYear()} DocDuty. All rights reserved. Built for Pakistan's healthcare workforce.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs text-primary-foreground/50 hover:text-accent transition-colors"
                aria-label={`DocDuty on ${link.label}`}
              >
                {link.label}
              </a>
            ))}
            <span className="text-primary-foreground/10" aria-hidden="true">|</span>
            <Link to="/legal?tab=privacy" className="text-xs text-primary-foreground/50 hover:text-accent transition-colors">
              Privacy
            </Link>
            <Link to="/legal?tab=terms" className="text-xs text-primary-foreground/50 hover:text-accent transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
