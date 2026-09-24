/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['127.0.0.1', 'localhost'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'lh3.googleusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: '*.githubusercontent.com',
            },
        ],
    },
};

export default nextConfig;
