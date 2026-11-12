import { execFileSync } from 'node:child_process';

/** Fresh, known data before every run (the seed refuses anything but a local *_e2e database). */
export default function globalSetup() {
  execFileSync('npx', ['tsx', 'tests/e2e/seed-run.ts'], { stdio: 'inherit', env: process.env });
}
