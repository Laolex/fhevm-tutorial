'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useEnhancedFHEVM } from '@/hooks/useEnhancedFHEVM';

export function EnhancedGameMasterPanel() {
    const { address } = useAccount();
    const {
        gameStatus,
        gameMaster,
        isGameMaster,
        canStartGame,
        startGame,
        resetGame,
        maxPlayers,
        minRange,
        maxRange,
        players,
        totalGuesses,
        gameWon,
        winner,
        isFHEVMReady,
        lastEncryptedValue,
        lastDecryptedValue
    } = useEnhancedFHEVM();

    const [maxPlayersInput, setMaxPlayersInput] = useState<string>('5');
    const [minRangeInput, setMinRangeInput] = useState<string>('1');
    const [maxRangeInput, setMaxRangeInput] = useState<string>('100');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleStartGame = async () => {
        if (!maxPlayersInput || !minRangeInput || !maxRangeInput) {
            setError('Please fill in all fields');
            return;
        }

        const maxPlayersNum = parseInt(maxPlayersInput);
        const minRangeNum = parseInt(minRangeInput);
        const maxRangeNum = parseInt(maxRangeInput);

        if (maxPlayersNum < 2 || maxPlayersNum > 10) {
            setError('Max players must be between 2 and 10');
            return;
        }

        if (minRangeNum >= maxRangeNum) {
            setError('Min range must be less than max range');
            return;
        }

        if (maxRangeNum > 255) {
            setError('Max range cannot exceed 255');
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await startGame(maxPlayersNum, minRangeNum, maxRangeNum);

        } catch (err) {
            console.error('Failed to start enhanced game:', err);
            setError(err instanceof Error ? err.message : 'Failed to start game');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetGame = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await resetGame();

        } catch (err) {
            console.error('Failed to reset enhanced game:', err);
            setError(err instanceof Error ? err.message : 'Failed to reset game');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isGameMaster) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 Game Master Panel</h2>
                <div className="text-center text-gray-600">
                    <p>You are not the Game Master.</p>
                    <p className="text-sm mt-2">
                        Game Master: <span className="font-mono">{gameMaster?.slice(0, 6)}...{gameMaster?.slice(-4)}</span>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🎮 Enhanced Game Master Panel</h2>

            {/* FHEVM Status */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🔐 FHEVM Status</h3>
                <div className="text-sm space-y-1">
                    <p>FHEVM Ready: <span className={isFHEVMReady ? "text-green-600" : "text-red-600"}>
                        {isFHEVMReady ? "✅ Yes" : "❌ No"}
                    </span></p>
                    {lastEncryptedValue && (
                        <p>Last Encrypted: <span className="font-mono text-xs break-all">{lastEncryptedValue.slice(0, 20)}...</span></p>
                    )}
                    {lastDecryptedValue && (
                        <p>Last Decrypted: <span className="font-mono">{lastDecryptedValue}</span></p>
                    )}
                </div>
            </div>

            {/* Game Rules Display */}
            {gameStatus === 1 && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-2">📋 Current Game Rules</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><strong>Max Players:</strong> {maxPlayers}</p>
                            <p><strong>Range:</strong> {minRange} - {maxRange}</p>
                        </div>
                        <div>
                            <p><strong>Current Players:</strong> {players.length}/{maxPlayers}</p>
                            <p><strong>Total Guesses:</strong> {totalGuesses}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Game Status</h3>
                <div className="text-sm space-y-1">
                    <p>Status: <span className="font-semibold">
                        {gameStatus === 0 ? "Waiting" : gameStatus === 1 ? "Active" : "Finished"}
                    </span></p>
                    {gameWon && winner && (
                        <p className="text-green-600">🏆 Winner: <span className="font-mono">{winner}</span></p>
                    )}
                </div>
            </div>

            {/* Start Game */}
            {canStartGame && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">🚀 Start New Enhanced Game</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Players (2-10)
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="10"
                                value={maxPlayersInput}
                                onChange={(e) => setMaxPlayersInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="5"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Range
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="254"
                                value={minRangeInput}
                                onChange={(e) => setMinRangeInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="1"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Range
                            </label>
                            <input
                                type="number"
                                min="2"
                                max="255"
                                value={maxRangeInput}
                                onChange={(e) => setMaxRangeInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleStartGame}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Starting Game...' : '🎲 Start Enhanced Game'}
                    </button>
                </div>
            )}

            {/* Reset Game */}
            {gameStatus !== 0 && (
                <div className="mt-4">
                    <button
                        onClick={handleResetGame}
                        disabled={isLoading}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Resetting...' : '🔄 Reset Game'}
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Enhanced Features Info */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">✨ Enhanced Features</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Blockchain-random secret number selection</li>
                    <li>• Game Master can participate in their own game</li>
                    <li>• Dual guessing system (total guesses + secret number)</li>
                    <li>• Fully encrypted computations with FHEVM</li>
                    <li>• Customizable game rules and ranges</li>
                </ul>
            </div>
        </div>
    );
}
