'use client';

import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { mainnet, goerli, sepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Sepolia Testnet configuration (more stable than Zama Testnet)
const sepoliaTestnet = {
    id: 11155111,
    name: 'Sepolia Testnet',
    network: 'sepolia',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        public: {
            http: [
                'https://eth-sepolia.g.alchemy.com/v2/knSF5BWiIjxRpI4e7ELZsH0Jk5Yf9Wi2',
                'https://sepolia.infura.io/v3/f0e9af63d05c4f25b758d24320d7959c',
                'https://ethereum-sepolia-rpc.publicnode.com',
                'https://rpc.sepolia.org',
                'https://sepolia.drpc.org',
                'https://1rpc.io/sepolia'
            ]
        },
        default: {
            http: [
                'https://eth-sepolia.g.alchemy.com/v2/knSF5BWiIjxRpI4e7ELZsH0Jk5Yf9Wi2',
                'https://sepolia.infura.io/v3/f0e9af63d05c4f25b758d24320d7959c',
                'https://ethereum-sepolia-rpc.publicnode.com',
                'https://rpc.sepolia.org',
                'https://sepolia.drpc.org',
                'https://1rpc.io/sepolia'
            ]
        },
    },
    blockExplorers: {
        default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' },
    },
    testnet: true,
};

const { chains, publicClient, webSocketPublicClient } = configureChains(
    [sepoliaTestnet, mainnet, goerli, sepolia],
    [
        publicProvider()
    ]
);

const { connectors } = getDefaultWallets({
    appName: 'Hello FHEVM Tutorial',
    projectId: 'demo-project-id', // Simple demo ID
    chains,
});

const config = createConfig({
    autoConnect: true, // Enable auto-connect for better UX
    connectors,
    publicClient,
    // Disable WebSocket to avoid WalletConnect connection issues
    webSocketPublicClient: undefined,
});

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiConfig config={config}>
            <RainbowKitProvider
                chains={chains}
                modalSize="compact"
                showRecentTransactions={false}
            >
                {children}
            </RainbowKitProvider>
        </WagmiConfig>
    );
}