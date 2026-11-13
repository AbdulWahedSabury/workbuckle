/**
 * For scripts that write fake data: stops unless DATABASE_URL is on this machine.
 * `.env` points at production, so a script run without the local
 * DATABASE_URL=... prefix would otherwise write there. Returns the host.
 */
export function requireLocalDatabase(): string {
  let host = '';
  try {
    host = new URL(process.env.DATABASE_URL ?? '').hostname;
  } catch {
    // Not a URL: refused below.
  }
  if (!['127.0.0.1', 'localhost'].includes(host)) {
    throw new Error(
      `Fake data goes in a local database only; DATABASE_URL points at ${host || 'an unknown host'}. ` +
        'Prefix the command with DATABASE_URL=... DIRECT_URL=... for your local database.'
    );
  }
  return host;
}

/**
 * For scripts that write real data (admins, settings, translations): stops when
 * DATABASE_URL isn't on this machine unless the command was run with --yes, so
 * production is only ever written on purpose. Returns the host.
 */
export function requireConfirmedDatabase(): string {
  let host = '';
  try {
    host = new URL(process.env.DATABASE_URL ?? '').hostname;
  } catch {
    // Not a URL: refused below.
  }
  const local = ['127.0.0.1', 'localhost'].includes(host);
  if (!local && !process.argv.includes('--yes')) {
    throw new Error(
      `DATABASE_URL points at ${host || 'an unknown host'}, not this machine. ` +
        'Re-run with --yes to write there, or prefix the command with DATABASE_URL=... DIRECT_URL=... for your local database.'
    );
  }
  console.log(`Database: ${host}`);
  return host;
}
