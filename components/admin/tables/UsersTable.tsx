import Link from "next/link";
import { Pencil, SearchX } from "lucide-react";
import { deleteUser } from "@/lib/admin/actions/users";
import { requireView } from "@/lib/admin/auth";
import { parseListParams } from "@/lib/admin/list-params";
import { USER_SORT_KEYS, listUsers, type UserListRow, type UserSortKey } from "@/lib/admin/queries";
import { roleLabel } from "@/lib/auth/roles";
import { Role } from "@/lib/generated/prisma/enums";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import EmptyState from "@/components/admin/EmptyState";
import StatusBadge, { type StatusTone } from "@/components/admin/StatusBadge";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const ROLE_TONE: Record<Role, StatusTone> = {
  [Role.ADMIN]: "brand",
  [Role.EMPLOYER]: "success",
  [Role.VIEWER]: "neutral",
  [Role.USER]: "danger",
};

// Built per request: the signed-in admin's own row can't be deleted.
function getColumns(currentUserId: string): Column<UserListRow, UserSortKey>[] {
  return [
    {
      id: "email",
      header: "User",
      sortKey: "email",
      cell: (user) => (
        <div className="flex flex-col">
          <span className="font-semibold text-ink">
            {user.email}
            {user.id === currentUserId && <span className="font-normal text-gray-2"> (you)</span>}
          </span>
          {user.name && <span className="text-xs text-gray-2">{user.name}</span>}
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      sortKey: "role",
      cell: (user) => <StatusBadge tone={ROLE_TONE[user.role]}>{roleLabel(user.role)}</StatusBadge>,
    },
    {
      id: "createdAt",
      header: "Added",
      sortKey: "createdAt",
      hideBelow: "md",
      cell: (user) => (
        <time dateTime={user.createdAt.toISOString()} className="whitespace-nowrap">
          {formatDate(user.createdAt)}
        </time>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      hideHeader: true,
      align: "right",
      className: "w-px py-2",
      cell: (user) => (
        <div className="flex justify-end gap-1">
          <Link
            href={`/admin/users/${user.id}/edit`}
            aria-label={`Edit ${user.email}`}
            title="Edit"
            className={iconButtonClass}
          >
            <Pencil aria-hidden="true" />
          </Link>
          <DeleteButton
            action={deleteUser.bind(null, user.id)}
            title="Delete this user?"
            description={
              <>
                <strong>{user.email}</strong> will lose access to the admin panel immediately.
              </>
            }
            label={`Delete ${user.email}`}
            successMessage="User deleted."
            disabledReason={
              user.id === currentUserId ? "You can't delete your own account" : undefined
            }
          />
        </div>
      ),
    },
  ];
}

export default async function UsersTable({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await requireView("users");
  const params = parseListParams(await searchParams, USER_SORT_KEYS);
  const { rows, ...pageInfo } = await listUsers(params);

  return (
    <DataTable
      caption="Users"
      columns={getColumns(me.id)}
      rows={rows}
      getRowKey={(user) => user.id}
      pagination={{ ...pageInfo, itemLabel: "users" }}
      empty={
        params.q ? (
          <EmptyState
            icon={SearchX}
            title={`No users match “${params.q}”`}
            description="Try a different email or name."
          />
        ) : (
          <EmptyState title="No users yet" description="Add the first user to get started." />
        )
      }
    />
  );
}
