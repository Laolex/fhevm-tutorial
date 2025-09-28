'use client';

import { useAccount } from 'wagmi';
import { useEnhancedFHEVM } from '@/hooks/useEnhancedFHEVM';

export default function TestPage() {
    const { address, isConnected } = useAccount();
    const {
        gameStatus,
        gameMaster,
        isGameMaster,
        canStartGame,
        startGame,
        isFHEVMReady,
        fhevmInstance,
        lastEncryptedValue,
        lastDecryptedValue
    } = useEnhancedFHEVM();

    const handleStartGame = async () => {
        try {
            await startGame(3, 1, 50); // 3 players, range 1-50
            console.log('✅ Game started successfully!');
        } catch (error) {
            console.error('❌ Failed to start game:', error);
        }
    };

    return (
        <div className="min-h-screen p-8 bg-gray-50">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8">🧪 Enhanced FHEVM Game Test</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Connection Status */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">🔗 Connection Status</h2>
                        <div className="space-y-2">
                            <p><strong>Wallet Connected:</strong> {isConnected ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Address:</strong> {address || 'Not connected'}</p>
                            <p><strong>FHEVM Ready:</strong> {isFHEVMReady ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>FHEVM Instance:</strong> {fhevmInstance ? '✅ Yes' : '❌ No'}</p>
                            {fhevmInstance?.simulationMode && (
                                <p><strong>Mode:</strong> 🎭 Simulation Mode</p>
                            )}
                        </div>
                    </div>

                    {/* Game Status */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">🎮 Game Status</h2>
                        <div className="space-y-2">
                            <p><strong>Game Master:</strong> {gameMaster || 'Not set'}</p>
                            <p><strong>Is Game Master:</strong> {isGameMaster ? '✅ Yes' : '❌ No'}</p>
                            <p><strong>Game Status:</strong> {gameStatus}</p>
                            <p><strong>Can Start Game:</strong> {canStartGame ? '✅ Yes' : '❌ No'}</p>
                        </div>
                    </div>

                    {/* FHEVM Demo */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">🔐 FHEVM Demo</h2>
                        <div className="space-y-2">
                            {lastEncryptedValue && (
                                <p><strong>Last Encrypted:</strong> <code className="text-xs break-all">{lastEncryptedValue}</code></p>
                            )}
                            {lastDecryptedValue && (
                                <p><strong>Last Decrypted:</strong> <code>{lastDecryptedValue}</code></p>
                            )}
                        </div>
                    </div>

                    {/* Test Actions */}
                    <div className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-4">🚀 Test Actions</h2>
                        <div className="space-y-4">
                            {canStartGame && (
                                <button
                                    onClick={handleStartGame}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                                >
                                    🎮 Start Test Game
                                </button>
                            )}

                            <a
                                href="/"
                                className="block w-full bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700 text-center"
                            >
                                ← Back to Main Game
                            </a>
                        </div>
                    </div>
                </div>

                {/* Debug Info */}
                <div className="mt-8 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">🔧 Debug Info</h2>
                    <div className="text-sm space-y-1 text-gray-600">
                        <p>Contract Address: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}</p>
                        <p>Environment: {process.env.NODE_ENV}</p>
                        <p>FHEVM Instance: {JSON.stringify(fhevmInstance, null, 2)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
