const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:5000/api/:path*',
            },
        ];
    },
    webpack(config) {
        config.resolve.alias['@'] = path.join(__dirname, 'src');
        return config;
    },
};

module.exports = nextConfig;
