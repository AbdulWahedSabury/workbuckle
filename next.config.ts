import { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Category image uploads go through a Server Action (default limit is 1 MB).
      bodySizeLimit: '5mb',
    },
  },
  images: {
    remotePatterns: [
      {
       protocol: "https",
        hostname: "vdftahzcoigzlnavtxou.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

// Explicitly define the path to your root i18n file
const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

export default withNextIntl(nextConfig);
