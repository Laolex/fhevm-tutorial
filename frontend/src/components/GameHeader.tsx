'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function GameHeader() {
    const { address, isConnected } = useAccount();

    return (
        <header className="text-center space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div className="flex-1"></div>
                <div className="flex-1 text-center">
                    <h1 className="text-5xl font-bold text-gradient mb-2 animate-pulse-slow">
                        🎮 Hello FHEVM
                    </h1>
                    <p className="text-xl text-gray-600 font-medium">
                        Secret Number Guessing Game
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Powered by Fully Homomorphic Encryption
                    </p>
                </div>
                <div className="flex-1 flex justify-end">
                    <div className="glass-effect rounded-lg p-2">
                        <ConnectButton />
                    </div>
                </div>
            </div>

            {isConnected && (
                <div className="inline-flex items-center space-x-2 bg-green-50 text-green-700 px-4 py-2 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                        Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                </div>
            )}
        </header>
    );
}
