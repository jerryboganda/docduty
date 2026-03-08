import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PageWrapper from "@/components/shared/PageWrapper";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const policies: Record<string, { title: string; content: string }> = {
  privacy: { title: "Privacy Policy", content: `DocDuty ("we," "us," "our") is committed to protecting the privacy of all users — doctors, facility administrators, and platform staff.\n\nInformation We Collect: We collect personal identification information (name, CNIC, PMDC number, contact details), professional credentials, location data (for geofence attendance verification), device information, and transaction records.\n\nHow We Use Information: To verify doctor and facility identities, match doctors to shifts, verify attendance via geofence and QR systems, process payments and settlements, resolve disputes, improve platform reliability, and communicate important updates.\n\nData Security: All personal data is encrypted in transit and at rest. Financial data is processed through secure, audited channels. Access to user data is role-based and logged.\n\nData Sharing: We do not sell personal data. Information may be shared with verified facilities (for bookings), payment processors (for settlements), and law enforcement (when legally required).\n\nUser Rights: You may request access to, correction of, or deletion of your personal data by contacting support@docduty.pk.` },
  terms: { title: "Terms of Service", content: `By using DocDuty, you agree to these Terms of Service.\n\nPlatform Role: DocDuty is a marketplace platform connecting healthcare professionals with facilities. We facilitate matching, attendance verification, and payment processing but are not the employer of any doctor.\n\nUser Obligations: Doctors must maintain valid PMDC registration, provide accurate credentials, and honor confirmed bookings. Facilities must provide accurate shift details, maintain QR code systems, and process attendance fairly.\n\nPayments: All shift payments are processed through the platform's escrow system. Platform commission is deducted from each completed shift. Payout schedules and wallet terms are as specified in the Payout Policy.\n\nIntellectual Property: All platform content, design, and technology are owned by DocDuty. Users retain ownership of their professional credentials and reviews.\n\nLiability: DocDuty facilitates connections but does not guarantee shift outcomes. Our liability is limited to platform fees paid.` },
  cancellation: { title: "Cancellation & Refund Policy", content: `Cancellation by Doctor: Cancellations more than 12 hours before shift start incur no penalty. Cancellations within 12 hours may incur a fee and impact reliability score. No-shows result in full reliability penalty and potential suspension.\n\nCancellation by Facility: Facilities may cancel shifts with at least 6 hours notice. Late cancellations may incur a compensation fee to the assigned doctor.\n\nRefunds: Escrow funds are returned automatically for timely cancellations. Disputed cancellations go through the platform's dispute resolution process.\n\nForce Majeure: Emergency cancellations (natural disasters, facility emergencies) are handled case-by-case without reliability penalties.` },
  dispute: { title: "Dispute Policy", content: `Filing a Dispute: Either party may file a dispute within 48 hours of shift completion. Disputes must include a description of the issue and any supporting evidence.\n\nEvidence Review: The platform reviews attendance logs (geofence + QR data), communication records, booking terms, and submitted evidence from both parties.\n\nResolution Outcomes: Full payment release, partial refund, full refund, or re-arbitration. Both parties are notified of the decision with reasoning.\n\nAppeals: Either party may appeal within 7 days of the resolution with new evidence. Appeals are reviewed by a senior operations team member.\n\nReliability Impact: Dispute outcomes affect both parties' reliability scores based on the findings.` },
  payout: { title: "Payout Policy", content: `Payout Eligibility: Payouts are available for completed shifts where attendance has been verified through the platform's geofence + QR system.\n\nPlatform Fee: A transparent commission is deducted from each completed shift. The exact percentage is displayed before booking confirmation.\n\nWallet: Net amounts after platform fee deduction are credited to the doctor's DocDuty wallet. Wallet balance is available for withdrawal at any time.\n\nWithdrawal: Doctors may withdraw to their registered bank account. Processing time is typically 1–3 business days.\n\nDisputed Shifts: Payouts for disputed shifts are held until dispute resolution is complete.` },
};

const LegalPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "privacy";

  return (
    <PageWrapper title="Legal — DocDuty" description="DocDuty legal policies: privacy policy, terms of service, cancellation policy, dispute policy, and payout policy.">
    <div className="min-h-screen">
      <Navbar />
      <section className="pt-32 pb-20 bg-hero-pattern text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block text-[11px] font-bold tracking-[0.15em] uppercase mb-5 px-4 py-1.5 rounded-full bg-accent/15 text-accent border border-accent/20">Legal</span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">Legal &<br /><span className="text-gradient-shimmer">Policies</span></h1>
            <p className="text-lg text-primary-foreground/55 max-w-xl mx-auto">Transparent policies that protect all parties on the DocDuty platform.</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue={defaultTab}>
            <TabsList className="flex flex-wrap gap-1.5 h-auto mb-12 bg-transparent p-0">
              {Object.entries(policies).map(([key, pol]) => (
                <TabsTrigger key={key} value={key} className="text-xs font-semibold px-4 py-2.5 rounded-xl border border-border data-[state=active]:border-accent data-[state=active]:bg-accent/5 data-[state=active]:text-accent">{pol.title}</TabsTrigger>
              ))}
            </TabsList>
            {Object.entries(policies).map(([key, pol]) => (
              <TabsContent key={key} value={key}>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <h2 className="font-heading font-bold text-2xl text-foreground mb-8 flex items-center gap-3">
                    <div className="w-1 h-6 rounded-full bg-accent" />
                    {pol.title}
                  </h2>
                  <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line leading-relaxed space-y-4">{pol.content}</div>
                </motion.div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>
      <Footer />
    </div>
    </PageWrapper>
  );
};

export default LegalPage;
