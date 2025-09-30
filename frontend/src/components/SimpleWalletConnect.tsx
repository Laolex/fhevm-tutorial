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


    const handleConnect = async () => {
        setIsConnecting(true);
        try {
            // Try to connect with MetaMask connector first (fastest)
            const metaMaskConnector = connectors.find(c => c.name === 'MetaMask' || c.id === 'metaMask');
            if (metaMaskConnector) {
                await connect({ connector: metaMaskConnector });
                return;
            }

            // Fallback to injected connector
            const injectedConnector = connectors.find(c => c.name === 'Injected' || c.id === 'injected');
            if (injectedConnector) {
                await connect({ connector: injectedConnector });
                return;
            }

            // Last resort: try the first available connector
            if (connectors.length > 0) {
                await connect({ connector: connectors[0] });
                return;
            }

            throw new Error('No wallet connectors available');
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            // Show user-friendly error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage.includes('User rejected')) {
                alert('Connection cancelled. Please try again if you want to connect your wallet.');
            } else if (errorMessage.includes('Already processing')) {
                alert('Wallet connection is already in progress. Please wait...');
            } else {
                alert(`Failed to connect wallet: ${errorMessage}. Please make sure MetaMask is installed and unlocked.`);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        disconnect();
    };

    if (isConnected && address) {
        return (
            <div className="card-glass">
                <div className="text-center space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="text-green-800 font-semibold">Wallet Connected</p>
                        </div>
                        <p className="text-green-700 text-sm font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</p>
                        <p className="text-green-600 text-xs mt-1">Ready to play!</p>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="btn-outline w-full text-sm"
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
        ((window.ethereum as any).isMetaMask ||
            (window.ethereum as any).providers?.find((provider: any) => provider.isMetaMask));

    return (
        <div className="card-glass">
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
