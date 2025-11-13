/** @type {import('next').NextConfig} */
const envSchema = require('./env.schema');
const { generateEnv } = require('typed-env-generator');
generateEnv(envSchema);
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tryjobsite.com',
        port: '',
      },
    ],
  },
  headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          { key: 'content-type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/.well-known/assetlinks',
        headers: [
          { key: 'content-type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          { key: 'content-type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
      {
        source: '/apple-app-site-association',
        headers: [
          { key: 'content-type', value: 'application/json' },
          { key: 'Cache-Control', value: 'no-cache' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
