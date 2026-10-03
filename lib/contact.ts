/* Contact details: replace the placeholders with your real ones. Single source of truth. */
export const CONTACT = {
  facebook: "https://www.facebook.com/M.MAVROMATIEMPLOYMENT",
  instagram:
    "https://www.instagram.com/mavromatisemploymentbureau?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==",
  phone: "+357 00 000 000",
  email: "info@example.com",
  address: "Nicosia, Cyprus",
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const mailHref = (email: string) => `mailto:${email}`;
