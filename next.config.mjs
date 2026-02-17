/** @type {import('next').NextConfig} */
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
