/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: __dirname,
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      buffer: false,
      path: false,
      global: false,
    };

    // Fix for "global is not defined" error
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        global: 'globalThis',
      };
    }
    
    // Handle WASM files for FHEVM
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Fix for Relayer SDK circular dependencies
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          relayer: {
            test: /[\\/]node_modules[\\/]@zama-fhe[\\/]relayer-sdk[\\/]/,
            name: 'relayer',
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };
    
    return config;
  },
  env: {
    NEXT_PUBLIC_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    NEXT_PUBLIC_ZAMA_TESTNET_RPC_URL: process.env.NEXT_PUBLIC_ZAMA_TESTNET_RPC_URL,
    NEXT_PUBLIC_CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  },
};

module.exports = nextConfig;
