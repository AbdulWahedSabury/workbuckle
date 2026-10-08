import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/admin/PageHeader";
import UserForm from "@/components/admin/UserForm";
import { requireAdmin } from "@/lib/admin/auth";
import { updateUser } from "@/lib/admin/actions/users";
import { getUser } from "@/lib/admin/queries";

export const metadata: Metadata = { title: "Edit user" };

export default async function EditUserPage({ params }: PageProps<"/admin/users/[id]/edit">) {
  const me = await requireAdmin();
  const { id } = await params;
  const user = await getUser(id);
  if (!user) notFound();

  return (
    <>
      <PageHeader title="Edit user" description={user.email} />
      <UserForm
        action={updateUser.bind(null, user.id)}
        user={{ email: user.email, name: user.name, role: user.role }}
        isSelf={user.id === me.id}
        submitLabel="Save changes"
      />
    </>
  );
}
