/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (process.env.NODE_ENV === 'development') {
      const apiServer = process.env.API_SERVER_URL || 'http://localhost:5000';
      return [
        { source: '/api/:path*', destination: `${apiServer}/api/:path*` }
      ];
    }
    return [];
  },
  // allow preview hosts to request _next resources
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS ? process.env.ALLOWED_DEV_ORIGINS.split(',') : [],
};

module.exports = nextConfig;
