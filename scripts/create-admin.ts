// Creates an admin, or promotes an existing user and resets their password.
// Usage: pnpm admin:create you@example.com   (prompts for the password)
import 'dotenv/config';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { Role } from '@/lib/generated/prisma/enums';
import { hashPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';

async function promptHidden(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });
  stdout.write(question);
  // Swallow echoed keystrokes so the password isn't shown.
  (rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = () => {};
  const answer = await rl.question('');
  rl.close();
  stdout.write('\n');
  return answer;
}

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Usage: pnpm admin:create <email>');
    process.exit(1);
  }

  const password = await promptHidden('Password (min 12 chars): ');
  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, passwordHash, role: Role.ADMIN },
    update: { passwordHash, role: Role.ADMIN },
    select: { id: true, email: true },
  });
  console.log(`Admin ready: ${user.email} (${user.id})`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
