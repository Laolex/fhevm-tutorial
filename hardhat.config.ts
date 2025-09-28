import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// FHEVM plugin configuration
// Note: This requires @zama/fhevm-hardhat-plugin to be installed
// For now, we'll add the configuration structure

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            // FHEVM compatibility
            viaIR: true,
        },
    },
    networks: {
        // Sepolia Testnet with FHEVM support
        "sepolia": {
            url: `https://sepolia.infura.io/v3/f0e9af63d05c4f25b758d24320d7959c`, // Using your Infura endpoint
            chainId: 11155111,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 1000000000, // 1 gwei
        },
        // Zama Testnet for FHEVM functionality
        "zama-testnet": {
            url: process.env.ZAMA_TESTNET_RPC_URL || "https://devnet.zama.ai",
            chainId: 8009,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
            gasPrice: 1000000000, // 1 gwei
        },
        // Local FHEVM development network
        "localhost": {
            url: "http://127.0.0.1:8545",
            chainId: 31337,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
        // Local development network
        hardhat: {
            chainId: 31337,
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    typechain: {
        outDir: "./typechain-types",
        target: "ethers-v6",
    },

    // FHEVM configuration (when plugin is available)
    // fhevm: {
    //     network: "zama-testnet",
    //     publicKey: process.env.FHEVM_PUBLIC_KEY,
    // },
};

export default config;
