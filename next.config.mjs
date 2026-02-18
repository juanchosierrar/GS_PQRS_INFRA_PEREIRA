/** @type {import('next').NextConfig} */
// Trigger deployment after secrets setup
const nextConfig = {
    reactStrictMode: true,
    output: 'export',
    basePath: '/pqrs',
    assetPrefix: '/pqrs',
    images: {
        unoptimized: true,
    },
};

export default nextConfig;
