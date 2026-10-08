import type { Metadata } from "next";
import { connection } from "next/server";
import PageHeader from "@/components/admin/PageHeader";
import UserForm from "@/components/admin/UserForm";
import { requireAdmin } from "@/lib/admin/auth";
import { createUser } from "@/lib/admin/actions/users";

export const metadata: Metadata = { title: "New user" };

export default async function NewUserPage() {
  await connection();
  await requireAdmin();

  return (
    <>
      <PageHeader title="New user" description="They sign in at /admin/login with this email and password." />
      <UserForm action={createUser} submitLabel="Create user" />
    </>
  );
}
