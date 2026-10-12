// Writes the single SiteSetting row (id 1) directly, bypassing the admin form.
// Usage: pnpm settings:update --logo public/images/logo.png --name "Work Buckle" --email hi@example.com --phone "+49 30 123"
//   Also: --meta-title, --meta-description, --facebook, --linkedin, --instagram, --about
// Only the flags you pass are changed; an empty value ("") clears an optional field.
// --logo takes a local file (uploaded to Supabase Storage) or an existing https:// URL.
import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { parseArgs } from 'node:util';
import { prisma } from '@/lib/prisma';
import { siteSettingSchema } from '@/schemas/AdminSchemas';

// Mirrors SITE_SETTING_ID in lib/site-settings.ts.
const SITE_SETTING_ID = 1;
// Same public bucket the category images use (lib/admin/actions/categories.ts).
const IMAGE_BUCKET = 'images';

const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

async function uploadLogo(filePath: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const ext = extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) throw new Error(`Unsupported logo type "${ext}" (use png, jpg, webp or svg).`);

  const objectPath = `settings/logo-${Date.now()}${ext}`;
  const body = new FormData();
  body.append('file', new Blob([await readFile(filePath)], { type: contentType }), basename(filePath));

  const res = await fetch(`${supabaseUrl}/storage/v1/object/${IMAGE_BUCKET}/${objectPath}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey, 'x-upsert': 'false' },
    body,
  });
  if (!res.ok) throw new Error(`Logo upload failed (${res.status}): ${await res.text()}`);

  return `${supabaseUrl}/storage/v1/object/public/${IMAGE_BUCKET}/${objectPath}`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' },
      logo: { type: 'string' },
      'meta-title': { type: 'string' },
      'meta-description': { type: 'string' },
      facebook: { type: 'string' },
      linkedin: { type: 'string' },
      instagram: { type: 'string' },
      about: { type: 'string' },
    },
  });

  if (Object.keys(values).length === 0) {
    console.error(
      'Usage: pnpm settings:update [--name] [--email] [--phone] [--logo <file or URL>] ' +
        '[--meta-title] [--meta-description] [--facebook] [--linkedin] [--instagram] [--about]'
    );
    process.exit(1);
  }

  let logoUrl = values.logo;
  if (logoUrl && !/^https?:\/\//.test(logoUrl)) {
    logoUrl = await uploadLogo(logoUrl);
    console.log(`Logo uploaded: ${logoUrl}`);
  }

  // Same rules as the admin Settings form, limited to the flags passed.
  const input = {
    siteName: values.name,
    contactEmail: values.email,
    contactPhone: values.phone,
    logoUrl,
    metaTitle: values['meta-title'],
    metaDescription: values['meta-description'],
    facebookUrl: values.facebook,
    linkedinUrl: values.linkedin,
    instagramUrl: values.instagram,
    about: values.about,
  };
  const keys = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined).map(([k]) => [k, true])
  ) as { [K in keyof typeof input]?: true };
  const result = siteSettingSchema.pick(keys).safeParse(input);
  if (!result.success) {
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  const row = await prisma.siteSetting.upsert({
    where: { id: SITE_SETTING_ID },
    create: { id: SITE_SETTING_ID, ...result.data },
    update: result.data,
  });
  console.log('Site settings saved:', row);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
