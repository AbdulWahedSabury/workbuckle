// `tsx tests/e2e/seed-run.ts`: Prisma's generated client loads under tsx, not Playwright's loader.
import { prisma } from '@/lib/prisma';
import { seedE2e } from './seed';

seedE2e()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
