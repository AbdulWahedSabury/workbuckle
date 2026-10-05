import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Read directly (not via `env()`) so `prisma generate` works without a DB.
    url: process.env.DATABASE_URL,
  },
});
