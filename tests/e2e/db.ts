// Read-only checks against the E2E database from the browser tests.
import { Client } from 'pg';

export type AppRow = {
  id: string;
  status: string;
  interview_status: string;
  interview_at: Date | null;
  candidate_status: string;
  filled_positions: number;
  total_positions: number;
  job_status: string;
};

let client: Client | null = null;
async function db(): Promise<Client> {
  if (!client) {
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();
  }
  return client;
}

export async function application(firstName: string, jobTitle: string): Promise<AppRow> {
  const { rows } = await (await db()).query<AppRow>(
    `SELECT a.id, a.status, a.interview_status, a.interview_at, c.status AS candidate_status,
            j.filled_positions, j.total_positions, j.status AS job_status
       FROM job_applications a
       JOIN candidates c ON c.id = a.candidate_id
       JOIN jobs j ON j.id = a.job_id
      WHERE c.first_name = $1 AND j.title = $2`,
    [firstName, jobTitle]
  );
  if (rows.length !== 1) throw new Error(`Expected one application for ${firstName} / ${jobTitle}, got ${rows.length}`);
  return rows[0];
}

export async function notificationCount(title: string): Promise<number> {
  const { rows } = await (await db()).query<{ n: string }>('SELECT COUNT(*) AS n FROM admin_notifications WHERE title = $1', [title]);
  return Number(rows[0].n);
}

export async function closeDb() {
  await client?.end();
  client = null;
}
