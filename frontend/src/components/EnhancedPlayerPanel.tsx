'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useEnhancedFHEVM } from '@/hooks/useEnhancedFHEVM';

export function EnhancedPlayerPanel() {
    const { address } = useAccount();
    const {
        gameStatus,
        players,
        totalGuesses,
        playerTotalGuesses,
        gameWon,
        winner,
        hasJoined,
        canJoin,
        canMakeGuess,
        maxPlayers,
        minRange,
        maxRange,
        joinGame,
        makeGuess,
        isFHEVMReady,
        lastEncryptedValue,
        lastDecryptedValue
    } = useEnhancedFHEVM();

    const [totalGuessInput, setTotalGuessInput] = useState<string>('');
    const [secretGuessInput, setSecretGuessInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [myGuesses, setMyGuesses] = useState<number[]>([]);
    const [isWinner, setIsWinner] = useState<boolean | null>(null);

    // Track player's guesses
    useEffect(() => {
        if (address && playerTotalGuesses[address]) {
            setMyGuesses(playerTotalGuesses[address]);
        }
    }, [address, playerTotalGuesses]);

    // Check if player is winner when game ends
    useEffect(() => {
        if (gameStatus === 2 && address && hasJoined) {
            setIsWinner(address === winner);
        }
    }, [gameStatus, address, hasJoined, winner]);

    const handleJoinGame = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await joinGame();
            console.log('✅ Joined enhanced game successfully');
        } catch (err) {
            console.error('Failed to join enhanced game:', err);
            setError(err instanceof Error ? err.message : 'Failed to join game');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMakeGuess = async () => {
        if (!totalGuessInput || !secretGuessInput) {
            setError('Please fill in both guess fields');
            return;
        }

        const totalGuess = parseInt(totalGuessInput);
        const secretGuess = parseInt(secretGuessInput);

        if (isNaN(totalGuess) || totalGuess < 1) {
            setError('Total guess must be at least 1');
            return;
        }

        if (isNaN(secretGuess) || secretGuess < minRange || secretGuess > maxRange) {
            setError(`Secret guess must be between ${minRange} and ${maxRange}`);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);
            await makeGuess(totalGuess, secretGuess);
            setTotalGuessInput('');
            setSecretGuessInput('');
            console.log('✅ Enhanced dual guess submitted successfully');
        } catch (err) {
            console.error('Failed to make enhanced guess:', err);
            setError(err instanceof Error ? err.message : 'Failed to make guess');
        } finally {
            setIsLoading(false);
        }
    };

    if (gameStatus === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Enhanced Player Panel</h2>
                <div className="text-center text-gray-600">
                    <p>Waiting for Game Master to start the game...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Enhanced Player Panel</h2>

            {/* Game Info */}
            {gameStatus === 1 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-2">📋 Game Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p><strong>Max Players:</strong> {maxPlayers}</p>
                            <p><strong>Current Players:</strong> {players.length}/{maxPlayers}</p>
                        </div>
                        <div>
                            <p><strong>Guess Range:</strong> {minRange} - {maxRange}</p>
                            <p><strong>Total Guesses:</strong> {totalGuesses}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* FHEVM Status */}
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">🔐 FHEVM Status</h3>
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

            {/* Join Game */}
            {canJoin && (
                <div className="mb-4">
                    <button
                        onClick={handleJoinGame}
                        disabled={isLoading}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Joining...' : '🎮 Join Enhanced Game'}
                    </button>
                </div>
            )}

            {/* Make Guess */}
            {canMakeGuess && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">🎯 Make Dual Guess</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Guesses Prediction
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={totalGuessInput}
                                onChange={(e) => setTotalGuessInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="How many total guesses?"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Guess how many total guesses will be made by all players
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Secret Number Guess
                            </label>
                            <input
                                type="number"
                                min={minRange}
                                max={maxRange}
                                value={secretGuessInput}
                                onChange={(e) => setSecretGuessInput(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder={`${minRange}-${maxRange}`}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Guess the secret number (will be encrypted)
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleMakeGuess}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Making Guess...' : '🔐 Submit Encrypted Dual Guess'}
                    </button>
                </div>
            )}

            {/* My Guesses */}
            {hasJoined && myGuesses.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">📊 My Total Guess Predictions</h3>
                    <div className="flex flex-wrap gap-2">
                        {myGuesses.map((guess, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 rounded text-sm font-mono ${guess === totalGuesses ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
                                    }`}
                            >
                                Guess {index + 1}: {guess}
                                {guess === totalGuesses && ' ✅'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Game Status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Game Status</h3>
                <div className="text-sm space-y-1">
                    <p>Status: <span className="font-semibold">
                        {gameStatus === 0 ? "Waiting" : gameStatus === 1 ? "Active" : "Finished"}
                    </span></p>
                    <p>Joined: <span className={hasJoined ? "text-green-600" : "text-red-600"}>
                        {hasJoined ? "✅ Yes" : "❌ No"}
                    </span></p>
                    {gameWon && winner && (
                        <div className="mt-2 p-2 bg-green-100 rounded">
                            <p className="text-green-800 font-semibold">🏆 Game Finished!</p>
                            <p className="text-green-700">
                                Winner: <span className="font-mono">{winner}</span>
                            </p>
                            {isWinner && (
                                <p className="text-green-700 font-bold">🎉 Congratulations! You won!</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Features Info */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">✨ Enhanced Features</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Dual guessing: predict both total guesses AND secret number</li>
                    <li>• Secret number guesses are encrypted with FHEVM</li>
                    <li>• Win by guessing either the total count OR the secret number</li>
                    <li>• Game Master can participate in their own game</li>
                    <li>• Blockchain-random secret number selection</li>
                </ul>
            </div>

            {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}
        </div>
    );
}
