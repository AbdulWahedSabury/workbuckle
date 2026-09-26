import { ReactNode } from "react";

export default function Accent({ children }: { children: ReactNode }) {
  return <span className="text-primary">{children}</span>;
}
