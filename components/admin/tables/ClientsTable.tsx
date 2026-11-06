import Link from "next/link";
import { Pencil, SearchX } from "lucide-react";
import { deleteClient } from "@/lib/admin/actions/clients";
import { parseListParams } from "@/lib/admin/list-params";
import { CLIENT_SORT_KEYS, listClients, type ClientSortKey, type ClientWithCount } from "@/lib/admin/queries";
import { DataTable, type Column } from "@/components/admin/data-table";
import { DeleteButton } from "@/components/admin/buttons";
import { viewerCanEdit } from "@/lib/admin/auth";
import EmptyState from "@/components/admin/EmptyState";
import { iconButtonClass } from "@/components/admin/styles";
import { formatDate } from "./format";

const columns: Column<ClientWithCount, ClientSortKey>[] = [
  { id: "name", header: "Name", sortKey: "name", cell: (client) => <span className="font-semibold text-ink">{client.name}</span> },
  { id: "contactName", header: "Contact", sortKey: "contactName", cell: (client) => client.contactName ? <span className="whitespace-nowrap">{client.contactName}</span> : <span className="text-gray-2/60">—</span> },
  { id: "email", header: "Email", sortKey: "email", cell: (client) => client.email ? <a className="text-primary-dark underline-offset-2 hover:underline" href={`mailto:${client.email}`}>{client.email}</a> : <span className="text-gray-2/60">—</span> },
  { id: "phone", header: "Phone", sortKey: "phone", hideBelow: "md", cell: (client) => client.phone ? <a className="whitespace-nowrap" href={`tel:${client.phone}`}>{client.phone}</a> : <span className="text-gray-2/60">—</span> },
  { id: "jobs", header: "Jobs", sortKey: "jobs", cell: (client) => <Link className="font-semibold text-primary-dark hover:underline" href={`/admin/jobs?q=${encodeURIComponent(client.name)}`}>{client._count.jobs}</Link> },
  { id: "updatedAt", header: "Updated", sortKey: "updatedAt", hideBelow: "lg", cell: (client) => <time dateTime={client.updatedAt.toISOString()} className="whitespace-nowrap">{formatDate(client.updatedAt)}</time> },
  { id: "actions", header: "Actions", hideHeader: true, align: "right", className: "w-px py-2", cell: (client) => <div className="flex justify-end gap-1"><Link href={`/admin/clients/${client.id}/edit`} aria-label={`Edit ${client.name}`} title="Edit" className={iconButtonClass}><Pencil aria-hidden="true" /></Link><DeleteButton action={deleteClient.bind(null, client.id)} title="Delete this client?" description={<><strong>{client.name}</strong> will be permanently removed from the client list.</>} label={`Delete ${client.name}`} successMessage="Client deleted." disabledReason={client._count.jobs > 0 ? "In use by jobs — reassign them first" : undefined} /></div> },
];

export default async function ClientsTable({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = parseListParams(await searchParams, CLIENT_SORT_KEYS);
  const { rows, ...pageInfo } = await listClients(params);
  const canEdit = await viewerCanEdit();
  return <DataTable caption="Clients" columns={canEdit ? columns : columns.filter((column) => column.id !== "actions")} rows={rows} getRowKey={(client) => client.id} pagination={{ ...pageInfo, itemLabel: "clients" }} empty={params.q ? <EmptyState icon={SearchX} title={`No clients match “${params.q}”`} description="Try another name, contact, email or phone number." /> : <EmptyState title="No clients yet" description="Add a client before creating a job." />} />;
}
