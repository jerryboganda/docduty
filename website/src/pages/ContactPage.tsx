import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Clock,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Shield,
  Stethoscope,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import RelatedPages from "@/components/shared/RelatedPages";
import PageWrapper from "@/components/shared/PageWrapper";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { PUBLIC_SUPPORT_PHONE } from "@/lib/support";

const contactInfo = [
  { icon: Mail, label: "Email", value: "support@docduty.pk", desc: "For general inquiries" },
  { icon: Phone, label: "Phone", value: PUBLIC_SUPPORT_PHONE, desc: "Mon-Sat, 9AM-6PM PKT" },
  { icon: MapPin, label: "Office", value: "Karachi, Pakistan", desc: "Headquarters" },
  { icon: Clock, label: "Response Time", value: "Within 24 hours", desc: "Typical response" },
];

const initialFormState = {
  name: "",
  email: "",
  role: "Doctor",
  message: "",
};

const ContactPage = () => {
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    setIsSubmitting(true);
    try {
      const response = await apiRequest("/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: `Website contact (${formData.role})`,
          message: formData.message,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit your message right now.");
      }

      toast({
        title: "Message sent",
        description: "Thanks. The DocDuty team will get back to you shortly.",
      });
      setFormData(initialFormState);
    } catch (error) {
      toast({
        title: "Message not sent",
        description: error instanceof Error ? error.message : "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageWrapper
      title="Contact Us - DocDuty"
      description="Get in touch with DocDuty. Email, phone, and office contact for healthcare staffing inquiries in Pakistan."
    >
      <div className="min-h-screen">
        <Navbar />
        <section className="relative overflow-hidden bg-hero-pattern pb-20 pt-32 text-primary-foreground">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_80%,hsl(168_76%_36%/0.06),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="mb-5 inline-block rounded-full border border-accent/20 bg-accent/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-accent">
                Contact
              </span>
              <h1 className="mb-6 font-heading text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                Get in
                <br />
                <span className="text-gradient-shimmer">Touch</span>
              </h1>
              <p className="mx-auto max-w-xl text-lg text-primary-foreground/55">
                Whether you&apos;re a doctor, facility, or enterprise, we&apos;d love to hear from you.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="bg-card py-24">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Send Us a Message</h2>
                <p className="mb-8 text-sm text-muted-foreground">
                  Fill out the form and we&apos;ll get back to you within 24 hours.
                </p>
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name" className="text-xs font-semibold">Name</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        className="mt-1.5 h-11"
                        value={formData.name}
                        onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        className="mt-1.5 h-11"
                        value={formData.email}
                        onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="role" className="text-xs font-semibold">I am a...</Label>
                    <select
                      id="role"
                      className="mt-1.5 flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={formData.role}
                      onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))}
                    >
                      <option>Doctor</option>
                      <option>Facility Admin</option>
                      <option>Enterprise</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-xs font-semibold">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      rows={5}
                      className="mt-1.5"
                      value={formData.message}
                      onChange={(event) => setFormData((current) => ({ ...current, message: event.target.value }))}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="group h-12 w-full bg-accent font-semibold text-accent-foreground shadow-lg shadow-accent/20 hover:bg-teal-light"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Message"}
                    {!isSubmitting && (
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    )}
                  </Button>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">Contact Information</h2>
                <p className="mb-8 text-sm text-muted-foreground">
                  Reach out through any of these channels.
                </p>
                <div className="space-y-6">
                  {contactInfo.map((contact, index) => (
                    <motion.div
                      key={contact.label}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-4 rounded-xl border border-border bg-background p-4 transition-colors hover:border-accent/20"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-accent/10 bg-accent/10">
                        <contact.icon className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{contact.label}</p>
                        <p className="text-sm font-medium text-foreground">{contact.value}</p>
                        <p className="text-xs text-muted-foreground">{contact.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex h-48 items-center justify-center rounded-2xl border border-border bg-secondary/50">
                  <div className="text-center">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-accent/30" />
                    <p className="text-xs text-muted-foreground">Karachi, Pakistan</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <RelatedPages
          pages={[
            { label: "FAQ", href: "/faq", desc: "Find answers to common questions", icon: HelpCircle },
            { label: "Trust & Safety", href: "/trust-safety", desc: "Platform trust architecture", icon: Shield },
            { label: "For Doctors", href: "/for-doctors", desc: "Benefits and getting started", icon: Stethoscope },
          ]}
        />
        <Footer />
      </div>
    </PageWrapper>
  );
};

export default ContactPage;
