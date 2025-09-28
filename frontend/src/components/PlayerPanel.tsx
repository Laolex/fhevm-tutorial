'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useSecretGame } from '@/hooks/useSecretGame';
import { useFHEVM } from '@/hooks/useFHEVM';

export function PlayerPanel() {
    const { address } = useAccount();
    const {
        gameStatus,
        players,
        totalGuesses,
        playerGuesses,
        gameWon,
        winner,
        hasJoined,
        canJoinGame,
        canMakeGuess,
        joinGame,
        makeGuess,
        checkWinner,
        resetGame,
        isLoading,
        error
    } = useSecretGame();
    const { encryptNumber } = useFHEVM();

    const [guess, setGuess] = useState<string>('');
    const [localIsLoading, setLocalIsLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);
    const [hasGuessed, setHasGuessed] = useState(false);
    const [isWinner, setIsWinner] = useState<boolean | null>(null);
    const [myGuesses, setMyGuesses] = useState<number[]>([]);

    // hasJoined is now provided by the hook

    // Track player's guesses
    useEffect(() => {
        if (address && playerGuesses[address]) {
            setMyGuesses(playerGuesses[address]);
        }
    }, [address, playerGuesses]);

    // Check if player is winner when game ends
    useEffect(() => {
        if (gameStatus === 2 && address && hasJoined) {
            setIsWinner(address === winner);
        }
    }, [gameStatus, address, hasJoined, winner]);

    const handleJoinGame = async () => {
        try {
            setLocalIsLoading(true);
            setLocalError(null);
            await joinGame();
            // setHasJoined is handled by the hook
        } catch (err) {
            console.error('Failed to join game:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to join game');
        } finally {
            setLocalIsLoading(false);
        }
    };

    const handleMakeGuess = async () => {
        if (!guess) {
            setLocalError('Please enter your guess');
            return;
        }

        const number = parseInt(guess);
        if (isNaN(number) || number < 1) {
            setLocalError('Guess must be a positive number');
            return;
        }

        try {
            setLocalIsLoading(true);
            setLocalError(null);

            console.log('🎯 Player making guess:', { guess: number, totalGuesses });

            const encryptedGuess = encryptNumber(number);
            await makeGuess(encryptedGuess, number);

            setGuess('');
            setHasGuessed(true);

            // Check if this guess is a winner (handled by the contract)

        } catch (err) {
            console.error('Failed to make guess:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to make guess');
        } finally {
            setLocalIsLoading(false);
        }
    };

    return (
        <div className="card">
            <h2 className="text-2xl font-semibold mb-4">🎲 Player Panel</h2>

            {/* Game State Info */}
            {gameStatus === 1 && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-blue-800 font-medium">Total Guesses Made:</span>
                        <span className="text-blue-600 font-bold text-lg">{totalGuesses}</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-1">
                        Guess how many total guesses have been made in this game!
                    </p>
                </div>
            )}

            {/* Winner Announcement */}
            {gameWon && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                    <h3 className="text-yellow-800 font-bold text-lg mb-2">🎉 Game Won!</h3>
                    <p className="text-yellow-700">
                        {winner === address ? (
                            <span className="font-bold">🎊 Congratulations! You won!</span>
                        ) : (
                            <span>Player {winner.substring(0, 6)}...{winner.substring(38)} won!</span>
                        )}
                    </p>
                    <p className="text-yellow-600 text-sm mt-1">
                        The correct answer was: <span className="font-bold">{totalGuesses}</span> total guesses
                    </p>
                </div>
            )}

            {/* My Guesses */}
            {myGuesses.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-gray-800 font-medium mb-2">Your Guesses:</h4>
                    <div className="flex flex-wrap gap-2">
                        {myGuesses.map((guess, index) => (
                            <span
                                key={index}
                                className={`px-2 py-1 rounded text-sm ${guess === totalGuesses ? 'bg-green-100 text-green-800 font-bold' : 'bg-gray-100 text-gray-700'
                                    }`}
                            >
                                {guess}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {gameStatus === 0 && (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-medium">
                            ⏳ Waiting for Game Master
                        </p>
                        <p className="text-yellow-600 text-sm mt-1">
                            The game master needs to start the game first
                        </p>
                    </div>
                )}

                {gameStatus === 1 && !hasJoined && (
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 font-medium">
                                🎮 Game is Active!
                            </p>
                            <p className="text-blue-600 text-sm mt-1">
                                Join the game to start guessing
                            </p>
                        </div>

                        <button
                            onClick={handleJoinGame}
                            disabled={isLoading || localIsLoading}
                            className="btn-primary w-full"
                        >
                            {(isLoading || localIsLoading) ? 'Joining...' : 'Join Game'}
                        </button>
                    </div>
                )}

                {gameStatus === 1 && hasJoined && !gameWon && (
                    <div className="space-y-4">
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-800 font-medium">
                                ✅ You've joined the game!
                            </p>
                            <p className="text-green-600 text-sm mt-1">
                                Guess how many total guesses have been made in this game
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Your Guess (How many total guesses?)
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                className="input-field"
                                placeholder="Enter your guess for total guesses..."
                            />
                        </div>

                        <button
                            onClick={handleMakeGuess}
                            disabled={isLoading || localIsLoading || !guess}
                            className="btn-primary w-full"
                        >
                            {(isLoading || localIsLoading) ? 'Making Guess...' : 'Make Guess'}
                        </button>
                    </div>
                )}

                {gameStatus === 1 && hasJoined && hasGuessed && (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-purple-800 font-medium">
                            🎯 Guess Submitted!
                        </p>
                        <p className="text-purple-600 text-sm mt-1">
                            Waiting for other players or game to end
                        </p>
                    </div>
                )}

                {gameStatus === 2 && (
                    <div className="space-y-4">
                        {isWinner === true && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-yellow-800 font-medium text-lg">
                                    🏆 Congratulations! You Won!
                                </p>
                                <p className="text-yellow-600 text-sm mt-1">
                                    Your guess was correct!
                                </p>
                            </div>
                        )}

                        {isWinner === false && (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-gray-800 font-medium">
                                    😔 Better luck next time!
                                </p>
                                <p className="text-gray-600 text-sm mt-1">
                                    Your guess wasn't correct this time
                                </p>
                            </div>
                        )}

                        {isWinner === null && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-blue-800 font-medium">
                                    🎮 Game Finished
                                </p>
                                <p className="text-blue-600 text-sm mt-1">
                                    The winner has been revealed
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {(error || localError) && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-800 text-sm">{error || localError}</p>
                    </div>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                    <p><strong>Player Actions:</strong></p>
                    <p>• Join the game when it's active</p>
                    <p>• Make one guess (1-100)</p>
                    <p>• Wait for the game to end</p>
                </div>
            </div>
        </div>
    );
}
