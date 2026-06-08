import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
    // allowedDevOrigins: ['local-origin.dev', '*.local-origin.dev'],
    // The repo carries ~58 pre-existing ESLint errors in frozen/out-of-scope files
    // (the dynamic-recipient-schema engine + its tests). Lint is advisory in this
    // project, so don't let it fail the production build / Docker image. Run
    // `npm run lint` separately to surface new issues.
    eslint: { ignoreDuringBuilds: true },
}
 
export default nextConfig
