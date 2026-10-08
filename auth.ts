import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { z } from 'zod';
import { authConfig } from '@/auth.config';
import { isPanelRole } from '@/lib/auth/roles';
import { getDummyHash, verifyPassword } from '@/lib/auth/password';
import { prisma } from '@/lib/prisma';

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // Stores users/accounts for OAuth providers added later. Credentials
  // sign-ins don't touch it; they're looked up in `authorize` below.
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: { id: true, email: true, name: true, image: true, role: true, passwordHash: true },
        });
        const valid = await verifyPassword(password, user?.passwordHash ?? (await getDummyHash()));

        // Only panel roles have anything to sign in to. Same `null` for every
        // failure so the form can't be used to probe which emails exist.
        if (!user?.passwordHash || !valid || !isPanelRole(user.role)) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],
});
