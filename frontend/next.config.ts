import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Add CloudFront domain here when provisioned:
      // { protocol: 'https', hostname: '<id>.cloudfront.net' }
    ],
  },
}

export default nextConfig
