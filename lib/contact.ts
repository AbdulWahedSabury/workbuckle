/* Contact details: replace the placeholders with your real ones. Single source of truth. */
export const CONTACT = {
  facebook: "https://www.facebook.com/mavromatisemployment",
  instagram:
    "https://www.instagram.com/mavromatisemploymentbureau?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==",
  phone: "+357 77 776707",
  email: "info@mavromatisservices.com",
  address: "Larnaca, Cyprus",
};

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const mailHref = (email: string) => `mailto:${email}`;
