import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async rewrites() {
    return [
      {
        source: '/customer',
        destination: '/index.html',
      },
      {
        source: '/login',
        destination: '/login.html',
      },
      {
        source: '/kasir',
        destination: '/kasir.html',
      },
      {
        source: '/owner-statistik',
        destination: '/owner-statistik.html',
      },
      {
        source: '/owner-menu',
        destination: '/owner-menu.html',
      },
      {
        source: '/owner-kasir',
        destination: '/owner-kasir.html',
      },
      {
        source: '/owner',
        destination: '/owner-statistik.html',
      },
    ];
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**', // This allows any path under the hostname
      },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify—file watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
