// Refuse to run against anything but a local *_test database: the suite truncates tables.
const url = new URL(process.env.DATABASE_URL ?? '');
const local = ['127.0.0.1', 'localhost'].includes(url.hostname);
if (!local || !url.pathname.endsWith('_test')) {
  throw new Error(`Tests must use a local *_test database, got ${url.hostname}${url.pathname}.`);
}
