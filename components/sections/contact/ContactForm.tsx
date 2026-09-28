"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const fieldClass =
  "w-full rounded-2xl border border-line bg-white px-5 py-4 text-ink transition-colors duration-300 outline-none hover:border-ink/40 focus:border-ink";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="rounded-card border border-gray-3 bg-white p-5 sm:p-[30px] lg:p-10">
      <h2 className="mb-2 text-2xl sm:text-3xl">Send us a message</h2>
      <p className="mb-8">Fill out the form and our team will get back to you shortly.</p>

      {submitted ? (
        <p className="rounded-2xl bg-gray-3 px-6 py-4 font-semibold text-ink" role="status">
          Thanks for reaching out! We&apos;ll be in touch soon.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input id="name" name="name" type="text" required placeholder="Name" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Email address"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="sr-only">
              Phone no
            </label>
            <input id="phone" name="phone" type="tel" placeholder="Phone no" className={fieldClass} />
          </div>

          <div>
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={5}
              placeholder="Message"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group inline-flex w-fit items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-6 font-semibold text-white"
          >
            Submit
            <span className="flex size-10 items-center justify-center rounded-full bg-primary text-ink transition-transform duration-500 group-hover:rotate-45">
              <ArrowUpRight className="size-4" />
            </span>
          </motion.button>
        </form>
      )}
    </div>
  );
}
