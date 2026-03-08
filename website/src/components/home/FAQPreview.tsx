import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import SectionHeader from "@/components/shared/SectionHeader";
import { motion } from "framer-motion";

const faqs = [
  { q: "How quickly can a shift be filled?", a: "Most urgent shifts are matched within 1–3 hours. Our automated matching system prioritizes by specialty, proximity, availability, and reliability score to find the best candidate fast." },
  { q: "How is doctor identity verified?", a: "All doctors undergo PMDC license verification, CNIC identity check, and credential review. Only verified doctors can accept shifts on the platform." },
  { q: "How does the attendance proof system work?", a: "Doctors check in using a dual-layer system: their GPS must be within the facility's geofence, and they must scan a time-limited rotating QR code displayed at the facility. Both signals must validate for attendance to be confirmed." },
  { q: "How are payments handled?", a: "When a booking is confirmed, funds are held in escrow. After the shift is completed and attendance verified, the platform fee is deducted and the remaining amount is released to the doctor's wallet for withdrawal." },
  { q: "What happens if there's a dispute?", a: "Disputes are resolved through an evidence-based review process. The platform examines attendance logs, geofence data, QR scans, and communication records to reach a fair resolution." },
  { q: "Is DocDuty available across all of Pakistan?", a: "DocDuty is operational in major cities including Karachi, Lahore, Islamabad, Rawalpindi, Peshawar, Faisalabad, Multan, and Quetta — with rapid expansion planned across all provinces." },
];

const FAQPreview = () => (
  <section className="py-24 lg:py-32 bg-section-alt">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <SectionHeader
        badge="FAQ"
        title="Frequently Asked"
        titleAccent="Questions"
      />

      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
          >
            <AccordionItem value={`faq-${i}`} className="border rounded-xl px-6 bg-card hover:border-accent/20 transition-colors data-[state=open]:border-accent/30 data-[state=open]:shadow-lg data-[state=open]:shadow-accent/5">
              <AccordionTrigger className="text-left font-heading font-semibold text-sm hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.4 }}
        className="text-center mt-10"
      >
        <Link to="/faq" className="text-sm text-accent hover:underline inline-flex items-center gap-1 font-medium">
          View all FAQs <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </motion.div>
    </div>
  </section>
);

export default FAQPreview;
