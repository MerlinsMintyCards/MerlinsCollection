import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // pokemontcg.io card art (returned by the inventory backend)
      { protocol: 'https', hostname: 'images.pokemontcg.io' },
      // Add CloudFront domain here when provisioned:
      // { protocol: 'https', hostname: '<id>.cloudfront.net' }
    ],
  },
}

export default nextConfig
