/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "apod.nasa.gov" },
      { protocol: "https", hostname: "*.nasa.gov" },
      { protocol: "https", hostname: "cesium.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        module: false,
        worker_threads: false,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      };
    }

    config.module = config.module || {};
    config.module.unknownContextCritical = false;

    config.externals = [...(config.externals || []), { cesium: "Cesium" }];

    return config;
  },
};

export default nextConfig;
