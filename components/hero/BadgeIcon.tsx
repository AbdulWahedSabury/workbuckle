import { ElementType, isValidElement, ReactNode } from "react";

export default function BadgeIcon({ icon }: { icon: unknown }) {
  if (!icon) return null;
  if (isValidElement(icon)) return icon as ReactNode;
  if (typeof icon === "string") {
    return <img src={icon} alt="" className="size-4" />;
  }
  const Icon = icon as ElementType;
  return <Icon className="size-4" aria-hidden="true" />;
}