export interface Testimonial {
  name: string;
  role: string;
  image: string;
  quote: string;
}

/** A testimonial before translation: `id` picks its role and quote from the messages. */
export interface TestimonialSource {
  id: string;
  name: string;
  image: string;
}

export interface ProcessStep {
  title: string;
  description: string;
  img: string;
  accents: [string, string];
}
