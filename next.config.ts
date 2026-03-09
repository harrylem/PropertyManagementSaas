import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Serve static prototypes from /prototypes/*
  async rewrites() {
    return [
      { source: '/prototype/manager', destination: '/prototypes/app.html' },
      { source: '/prototype/tenant', destination: '/prototypes/tenant.html' },
      { source: '/prototype/landing', destination: '/prototypes/index.html' },
    ]
  },
}

export default nextConfig
