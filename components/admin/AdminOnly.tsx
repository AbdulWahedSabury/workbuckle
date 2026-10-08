import type { ReactNode } from "react";
import { viewerCanEdit } from "@/lib/admin/auth";

/**
 * Renders write controls (New / Edit / Delete) only for roles that can use
 * them. Cosmetic: the Server Actions and edit pages check on their own.
 */
export default async function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (await viewerCanEdit()) ? children : fallback;
}
