// Client-safe pure helper (no server imports): who receives a client's candidate emails.

/** The client's own logins; the client's email only when it has none. Lower-cased, no duplicates. */
export function clientRecipients(client: { email: string | null; users: { email: string }[] }): string[] {
  const logins = client.users.map((u) => u.email.toLowerCase());
  const list = logins.length ? logins : client.email ? [client.email.toLowerCase()] : [];
  return [...new Set(list)];
}
