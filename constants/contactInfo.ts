import { MailOpen, MapPin, Megaphone, PhoneCall, type LucideIcon } from "lucide-react";
import { CONTACT, mailHref, telHref } from "@/lib/contact";

export interface ContactInfoItem {
  /** Key under `pages.contact.info` in lang/*.json that holds the card title. */
  id: "phone" | "email" | "address" | "social";
  icon: LucideIcon;
  /** Text shown in the card (unused by "social", which renders the social links). */
  value?: string;
  /** Makes `value` a link. */
  href?: string;
}

export const CONTACT_INFO_ITEMS: ContactInfoItem[] = [
  { id: "phone", icon: PhoneCall, value: CONTACT.phone, href: telHref(CONTACT.phone) },
  { id: "email", icon: MailOpen, value: CONTACT.email, href: mailHref(CONTACT.email) },
  { id: "address", icon: MapPin, value: CONTACT.address },
  { id: "social", icon: Megaphone },
];
