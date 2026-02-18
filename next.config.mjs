/** @type {import('next').NextConfig} */
// Force re-deployment trigger for verification
const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    basePath: '/pqrs',
    assetPrefix: '/pqrs',
    trailingSlash: true,
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
