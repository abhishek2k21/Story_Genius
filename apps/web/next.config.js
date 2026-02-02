/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@repo/ui", "@repo/shared", "@repo/database", "@repo/ai"],
    images: {
        domains: ["localhost", "images.clerk.dev"],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: "10mb",
        },
    },
};

module.exports = nextConfig;
