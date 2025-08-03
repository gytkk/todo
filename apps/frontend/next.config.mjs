/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@calendar-todo/ui', '@calendar-todo/shared-types'],
  experimental: {
    optimizePackageImports: ['@calendar-todo/ui'],
  },
}

export default nextConfig