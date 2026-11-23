import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      'upload',
      'result',
      'contracts',
      'checklist',
      'reminders',
      'profile',
    ].map((view) => ({
      source: '/' + view,
      destination: '/#' + view,
      permanent: false,
    }));
  },
};

export default nextConfig;
