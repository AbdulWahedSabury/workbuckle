"use client";

import { motion, type Variants } from "framer-motion";
import ContactForm from "@/components/sections/contact/ContactForm";
import ContactInfo from "@/components/sections/contact/ContactInfo";
import { EASE_OUT_QUART } from "@/lib/motion";

const container: Variants = {
  hidden: {},
  show: { transition: { delayChildren: 0.1 } },
};

const left: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT_QUART } },
};

const right: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT_QUART, delay: 0.2 } },
};

export default function ContactMain() {
  return (
    <section className="section-spacing pt-0">
      <div className="container-site">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-[50px]"
        >
          <motion.div variants={left}>
            <ContactForm />
          </motion.div>
          <motion.div variants={right}>
            <ContactInfo />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
