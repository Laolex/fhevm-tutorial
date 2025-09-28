'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

// Extend Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
        };
    }
}

export function SimpleWalletConnect() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();
    const [isConnecting, setIsConnecting] = useState(false);

    // Debug MetaMask detection on mount
    useEffect(() => {
        console.log('🦊 MetaMask Detection Debug:', {
            hasWindow: typeof window !== 'undefined',
            hasEthereum: typeof window !== 'undefined' && !!window.ethereum,
            isMetaMask: typeof window !== 'undefined' && window.ethereum?.isMetaMask,
            providers: typeof window !== 'undefined' && window.ethereum?.providers?.length || 0,
            connectors: connectors.length
        });
    }, [connectors]);

    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            // Try to connect with MetaMask connector first (fastest)
            const metaMaskConnector = connectors.find(c => c.name === 'MetaMask' || c.id === 'metaMask');
            if (metaMaskConnector) {
                console.log('🦊 Connecting with MetaMask connector...');
                await connect({ connector: metaMaskConnector });
                return;
            }

            // Fallback to injected connector
            const injectedConnector = connectors.find(c => c.name === 'Injected' || c.id === 'injected');
            if (injectedConnector) {
                console.log('🦊 Connecting with Injected connector...');
                await connect({ connector: injectedConnector });
                return;
            }

            // Last resort: try the first available connector
            if (connectors.length > 0) {
                console.log('🦊 Connecting with first available connector...');
                await connect({ connector: connectors[0] });
                return;
            }

            throw new Error('No wallet connectors available');
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            alert(`Failed to connect wallet: ${error instanceof Error ? error.message : 'Unknown error'}. Please make sure MetaMask is installed and unlocked.`);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
    };

    if (isConnected && address) {
        return (
            <div className="card">
                <div className="text-center space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 font-semibold">✅ Wallet Connected</p>
                        <p className="text-green-700 text-sm font-mono break-all">{address}</p>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="btn-outline w-full"
                    >
                        Disconnect Wallet
                    </button>
                </div>
            </div>
        );
    }

    // Check if MetaMask is available
    const isMetaMaskAvailable = typeof window !== 'undefined' &&
        window.ethereum &&
        (window.ethereum.isMetaMask ||
            window.ethereum.providers?.find(provider => provider.isMetaMask));

    return (
        <div className="card">
            <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
                <p className="text-gray-600 text-sm">
                    Connect your MetaMask wallet to interact with the game.
                </p>

                {!isMetaMaskAvailable && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 text-sm">
                            ⚠️ MetaMask not detected. Please install MetaMask browser extension.
                        </p>
                        <details className="mt-2">
                            <summary className="text-xs text-yellow-700 cursor-pointer">Debug Info</summary>
                            <div className="text-xs text-yellow-600 mt-1 font-mono">
                                <p>window.ethereum: {typeof window !== 'undefined' && window.ethereum ? '✅' : '❌'}</p>
                                <p>isMetaMask: {typeof window !== 'undefined' && window.ethereum?.isMetaMask ? '✅' : '❌'}</p>
                                <p>providers: {typeof window !== 'undefined' && window.ethereum?.providers?.length || 0}</p>
                            </div>
                        </details>
                    </div>
                )}

                <div className="space-y-2">
                    <button
                        onClick={handleConnect}
                        disabled={isConnecting}
                        className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isConnecting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Connecting...</span>
                            </>
                        ) : (
                            <>
                                <span>🦊</span>
                                <span>Connect MetaMask</span>
                            </>
                        )}
                    </button>

                    {!isMetaMaskAvailable && (
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="btn-secondary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isConnecting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <span>🔧</span>
                                    <span>Try Manual Connection</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
                <p className="text-xs text-gray-500">
                    Make sure you're on Sepolia Testnet (Chain ID: 11155111)
                </p>
            </div>
        </div>
    );
}
