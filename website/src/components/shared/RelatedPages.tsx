import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface RelatedPage {
  label: string;
  href: string;
  desc: string;
  icon: LucideIcon;
}

interface Props {
  pages: RelatedPage[];
  title?: string;
}

const RelatedPages = ({ pages, title = "Explore Related" }: Props) => (
  <section className="py-16 bg-secondary/30">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="font-heading font-bold text-xl text-foreground mb-8 text-center">{title}</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pages.map((page, i) => (
          <motion.div
            key={page.href}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <Link
              to={page.href}
              className="group flex items-start gap-4 p-5 rounded-xl border border-border bg-card hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 group-hover:bg-accent/20 transition-colors">
                <page.icon className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                  {page.label}
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{page.desc}</p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default RelatedPages;
