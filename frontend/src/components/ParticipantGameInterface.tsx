'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAccount } from 'wagmi';
import { useGameMaster } from '@/hooks/useGameMaster';
import { Target, Users, Loader2, CheckCircle, Trophy, Play } from 'lucide-react';

interface ParticipantGameInterfaceProps {
    gameId: number;
    onBack: () => void;
}

export const ParticipantGameInterface = memo(function ParticipantGameInterface({ gameId, onBack }: ParticipantGameInterfaceProps) {
    const { address } = useAccount();

    // Use a more stable approach - only get what we need
    const gameMasterHook = useGameMaster(true); // Pass true for player mode
    const {
        gameInfo,
        players,
        hasJoined,
        canMakeGuess,
        makeGuess,
        joinGame,
        isLoading,
        refreshGameInfo,
        getPlayerGuessCount,
        endGame,
        getSecretNumber
    } = gameMasterHook;

    // Add state stabilization for players
    const [isPlayerMode, setIsPlayerMode] = useState(true);
    const [lastGameId, setLastGameId] = useState<number>(0);
    const [isInitialized, setIsInitialized] = useState(false);

    // Only update when gameId actually changes
    useEffect(() => {
        if (gameId !== lastGameId) {

            setLastGameId(gameId);
            setIsPlayerMode(true);
            setIsInitialized(true);
            // Reset alert states for new game
            setHasShownAutoEndAlert(false);
            setHasAutoEnded(false);
            setSecretNumber(null);
        }
    }, [gameId, lastGameId]);

    // Prevent unnecessary re-renders by stabilizing the component
    const [stableGameInfo, setStableGameInfo] = useState(gameInfo);
    const [stableHasJoined, setStableHasJoined] = useState(hasJoined);
    const [stableCanMakeGuess, setStableCanMakeGuess] = useState(canMakeGuess);

    // Only update stable state when values actually change
    useEffect(() => {
        if (gameInfo !== stableGameInfo) {
            setStableGameInfo(gameInfo);
        }
        if (hasJoined !== stableHasJoined) {
            setStableHasJoined(hasJoined);
        }
        if (canMakeGuess !== stableCanMakeGuess) {
            setStableCanMakeGuess(canMakeGuess);
        }
    }, [gameInfo, hasJoined, canMakeGuess, stableGameInfo, stableHasJoined, stableCanMakeGuess]);

    // Add error boundary for crashes
    if (!gameId || gameId <= 0) {
        return (
            <div className="card">
                <div className="text-center py-8">
                    <p className="text-red-600 mb-4">Invalid Game ID: {gameId}</p>
                    <button onClick={onBack} className="btn-outline">
                        ← Back to Games
                    </button>
                </div>
            </div>
        );
    }

    const [secretGuess, setSecretGuess] = useState<string>('');
    const [totalGuess, setTotalGuess] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isEnding, setIsEnding] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [guessCount, setGuessCount] = useState<number>(0);
    const [showNotification, setShowNotification] = useState<boolean>(false);
    const [notificationMessage, setNotificationMessage] = useState<string>('');
    const [hasShownAutoEndAlert, setHasShownAutoEndAlert] = useState<boolean>(false);
    const [hasAutoEnded, setHasAutoEnded] = useState<boolean>(false);
    const [secretNumber, setSecretNumber] = useState<number | null>(null);
    const [isRevealingSecret, setIsRevealingSecret] = useState<boolean>(false);

    // Fetch guess count for current user
    const fetchGuessCount = useCallback(async () => {
        if (gameId > 0 && address) {
            try {
                const count = await getPlayerGuessCount(gameId, address);
                setGuessCount(count);
            } catch (err) {
                console.error('Failed to fetch guess count:', err);
                setGuessCount(0);
            }
        }
    }, [gameId, address, getPlayerGuessCount]);

    // Refresh game info when component mounts or gameId changes
    useEffect(() => {
        if (gameId > 0) {



            // Add a small delay to prevent rapid calls
            const timeoutId = setTimeout(() => {

                refreshGameInfo(gameId);
                fetchGuessCount();
            }, 100);

            return () => clearTimeout(timeoutId);
        } else {

        }
    }, [gameId, refreshGameInfo, fetchGuessCount]);

    // Debug game info changes
    useEffect(() => {
        console.log('🎮 Participant Game Interface - Game Info Changed:', {
            gameId,
            gameInfo: stableGameInfo,
            hasJoined: stableHasJoined,
            canMakeGuess: stableCanMakeGuess,
            isLoading,
            gameStatus: stableGameInfo?.status,
            gameWon: stableGameInfo?.gameWon,
            isInitialized
        });
    }, [stableGameInfo, stableHasJoined, stableCanMakeGuess, isLoading, isInitialized]);

    // Auto-refresh game info periodically (only if game is active)
    useEffect(() => {
        if (gameId > 0 && gameInfo?.status === 1) { // Only refresh active games
            const interval = setInterval(() => {
                refreshGameInfo(gameId);
                fetchGuessCount();
            }, 30000); // Refresh every 30 seconds (reduced frequency)

            return () => clearInterval(interval);
        }
    }, [gameId, gameInfo?.status, refreshGameInfo, fetchGuessCount]);

    // Auto-end game when all players have made maximum guesses
    useEffect(() => {
        if (gameInfo && gameInfo.status === 1 && !gameInfo.gameWon && players.length > 0 && !hasAutoEnded) {
            const maxGuessesPerPlayer = gameInfo.maxGuessesPerPlayer || 3;
            const totalPossibleGuesses = players.length * maxGuessesPerPlayer;

            // Check if we should auto-end the game
            // Only auto-end if:
            // 1. We've reached the theoretical maximum guesses
            // 2. Game has been active for at least 10 seconds (to allow players to join)
            // 3. All players have actually joined (no empty slots)
            const gameActiveTime = Date.now() - (gameInfo.gameStartTime * 1000);
            const allPlayersJoined = gameInfo.playerCount >= gameInfo.maxPlayers;
            const shouldAutoEnd = gameInfo.totalGuesses >= totalPossibleGuesses && 
                                 gameActiveTime > 10000 && // 10 seconds
                                 allPlayersJoined; // All players must have joined

            if (shouldAutoEnd && !hasShownAutoEndAlert) {
                // Show notification that game will end (only once)
                setNotificationMessage('🎯 All players have made their maximum guesses! Winner will be announced and game will end automatically.');
                setShowNotification(true);
                setHasShownAutoEndAlert(true);

                setTimeout(() => setShowNotification(false), 5000);

                // Auto-end the game after a short delay
                setTimeout(async () => {
                    if (address && gameInfo.gameMaster?.toLowerCase() === address.toLowerCase() && !hasAutoEnded) {
                        try {
                            setHasAutoEnded(true);
                            await endGame(gameId);

                            // Add game to history after auto-ending
                            const gameHistoryItem = {
                                gameId: gameId,
                                gameMaster: gameInfo.gameMaster,
                                winner: gameInfo.winner || gameInfo.closestGuesser || 'No Winner',
                                totalGuesses: gameInfo.totalGuesses,
                                maxPlayers: gameInfo.maxPlayers,
                                playerCount: gameInfo.playerCount,
                                winType: gameInfo.winType || 2, // Default to closest guess for auto-ended games
                                completedAt: Date.now(),
                                range: { min: gameInfo.minRange, max: gameInfo.maxRange }
                            };

                            // Add to history using the global function
                            if ((window as any).addGameToHistory) {
                                (window as any).addGameToHistory(gameHistoryItem);
                            }
                        } catch (error) {
                            console.error('Failed to auto-end game:', error);
                            setHasAutoEnded(false); // Reset on error
                        }
                    }
                }, 3000);
            }
        }
    }, [gameInfo, players.length, address, gameId, endGame, hasShownAutoEndAlert, hasAutoEnded]);

    // Handle joining the game if not already joined
    const handleJoinGame = async () => {
        if (!stableHasJoined) {
            try {
                setIsJoining(true);
                setError(null);

                await joinGame(gameId);

                // Refresh game info after joining
                await refreshGameInfo(gameId);

            } catch (err) {
                console.error('❌ Failed to join game:', err);
                setError(err instanceof Error ? err.message : 'Failed to join game');
            } finally {
                setIsJoining(false);
            }
        }
    };

    // Handle making a guess
    const handleMakeGuess = async () => {
        if (!secretGuess || !totalGuess) {
            setError('Please enter both guesses');
            return;
        }

        const secretNum = parseInt(secretGuess);
        const totalNum = parseInt(totalGuess);

        if (isNaN(secretNum) || isNaN(totalNum)) {
            setError('Please enter valid numbers');
            return;
        }

        if (!gameInfo) {
            setError('Game information not available.');
            return;
        }

        if (secretNum < gameInfo.minRange || secretNum > gameInfo.maxRange) {
            setError(`Secret guess must be between ${gameInfo.minRange} and ${gameInfo.maxRange}`);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            await makeGuess(gameId, totalNum, secretNum);
            setSecretGuess('');
            setTotalGuess('');
            // Refresh guess count after making a guess
            await fetchGuessCount();

            // Show success notification
            setNotificationMessage('🎯 Your guess has been registered successfully!');
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to make guess');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle ending the game (for game masters)
    const handleEndGame = async () => {
        try {
            setIsEnding(true);
            setError(null);
            await endGame(gameId);

            // Add game to history if it was won
            if (gameInfo && gameInfo.gameWon && gameInfo.winner) {
                const gameHistoryItem = {
                    gameId: gameId,
                    gameMaster: gameInfo.gameMaster,
                    winner: gameInfo.winner,
                    totalGuesses: gameInfo.totalGuesses,
                    maxPlayers: gameInfo.maxPlayers,
                    playerCount: gameInfo.playerCount,
                    winType: gameInfo.winType || 1,
                    completedAt: Date.now(),
                    range: { min: gameInfo.minRange, max: gameInfo.maxRange }
                };

                // Add to history using the global function
                if ((window as any).addGameToHistory) {
                    (window as any).addGameToHistory(gameHistoryItem);
                }
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to end game');
        } finally {
            setIsEnding(false);
        }
    };

    // Handle revealing the secret number (for game masters)
    const handleRevealSecret = async () => {
        try {
            setIsRevealingSecret(true);
            setError(null);

            if (!getSecretNumber) {
                throw new Error('Secret number function not available');
            }

            const secret = await getSecretNumber(gameId);
            setSecretNumber(secret);

            setNotificationMessage(`🔐 Secret number revealed: ${secret}`);
            setShowNotification(true);
            setTimeout(() => setShowNotification(false), 5000);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reveal secret number');
        } finally {
            setIsRevealingSecret(false);
        }
    };

    if (!gameInfo) {
        return (
            <div className="card">
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading game information...</p>
                    <p className="text-sm text-gray-500 mt-2">Game ID: {gameId}</p>
                    <p className="text-xs text-gray-400 mt-1">Loading state: {isLoading ? 'Yes' : 'No'}</p>
                    {error && (
                        <p className="text-red-600 mt-2">Error: {error}</p>
                    )}
                    <div className="mt-4 space-y-2">
                        <button
                            onClick={() => {

                                refreshGameInfo(gameId);
                            }}
                            className="btn-outline"
                        >
                            Retry Loading Game
                        </button>
                        <button
                            onClick={() => {

                                setTimeout(() => refreshGameInfo(gameId), 1000);
                            }}
                            className="btn-secondary"
                        >
                            Force Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const getStatusText = () => {
        if (!gameInfo) return 'Loading...';
        if (gameInfo.gameWon) return 'Game Finished';
        switch (gameInfo.status) {
            case 0: return 'Waiting for Activation';
            case 1: return 'Game Active';
            case 2: return 'Game Finished';
            default: return 'Unknown Status';
        }
    };

    const getStatusColor = () => {
        if (!gameInfo) return 'text-gray-600';
        if (gameInfo.gameWon) return 'text-green-600';
        switch (gameInfo.status) {
            case 0: return 'text-yellow-600';
            case 1: return 'text-blue-600';
            case 2: return 'text-gray-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Notification */}
            {showNotification && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in">
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>{notificationMessage}</span>
                    </div>
                </div>
            )}

            {/* Back Button */}
            <button
                onClick={onBack}
                className="btn-secondary flex items-center space-x-2"
            >
                ← Back to Game Rooms
            </button>

            {/* Game Header */}
            <div className="card">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gradient mb-2">
                            Game #{gameId}
                        </h2>
                        <p className={`text-lg font-semibold ${getStatusColor()}`}>
                            {getStatusText()}
                        </p>
                    </div>
                    {gameInfo?.gameWon && (
                        <div className="text-right">
                            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                            <p className="text-sm text-green-600 font-semibold">Winner!</p>
                        </div>
                    )}
                </div>

                {/* Game Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                        <p className="text-sm text-gray-600">Range</p>
                        <p className="font-semibold">{gameInfo?.minRange || 0} - {gameInfo?.maxRange || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Players</p>
                        <p className="font-semibold">{players.length}/{gameInfo?.maxPlayers || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Total Guesses</p>
                        <p className="font-semibold">{gameInfo?.totalGuesses || 0}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600">Invite Code</p>
                        <p className="font-mono text-sm">{gameInfo?.inviteCode || 'Loading...'}</p>
                    </div>
                </div>

                {/* Winner Info */}
                {gameInfo?.gameWon && gameInfo?.winner && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2">
                            <Trophy className="w-5 h-5 text-yellow-500" />
                            <span className="font-semibold text-green-800">Game Won!</span>
                        </div>
                        <p className="text-green-700 mt-1">
                            Winner: <span className="font-mono">{gameInfo.winner.slice(0, 6)}...{gameInfo.winner.slice(-4)}</span>
                        </p>
                        <p className="text-green-600 text-sm mt-1">
                            Total Guesses: {gameInfo.totalGuesses}
                        </p>
                        {gameInfo.winner.toLowerCase() === address?.toLowerCase() ? (
                            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                                <p className="text-yellow-800 font-semibold">🎉 Congratulations! You won!</p>
                            </div>
                        ) : (
                            <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                                <p className="text-red-800 font-semibold">😔 You lost this game</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Secret Number Reveal (Game Master Only) */}
                {gameInfo?.status === 2 && address && gameInfo?.gameMaster && gameInfo.gameMaster.toLowerCase() === address.toLowerCase() && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-3">
                            <span className="font-semibold text-blue-800">🔐 Game Master Tools</span>
                        </div>

                        {secretNumber !== null ? (
                            <div className="p-3 bg-white border border-blue-300 rounded-lg">
                                <p className="text-blue-800 font-semibold">Secret Number:</p>
                                <p className="text-2xl font-bold text-blue-600 mt-1">{secretNumber}</p>
                                <p className="text-blue-600 text-sm mt-1">This was the number players were trying to guess!</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-blue-700 text-sm mb-3">
                                    As the game master, you can reveal the secret number that players were trying to guess.
                                </p>
                                <button
                                    onClick={handleRevealSecret}
                                    disabled={isRevealingSecret || !getSecretNumber}
                                    className="btn-primary flex items-center space-x-2"
                                >
                                    {isRevealingSecret ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <span>🔐</span>
                                    )}
                                    <span>{isRevealingSecret ? 'Revealing...' : 'Reveal Secret Number'}</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Players List */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Players ({players.length})</span>
                </h3>
                {players.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No players yet</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {players.map((player, index) => (
                            <div
                                key={player}
                                className={`p-3 rounded-lg border ${player === address
                                    ? 'bg-blue-50 border-blue-200'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center space-x-2">
                                    {player === address && <CheckCircle className="w-4 h-4 text-blue-500" />}
                                    <span className="font-mono text-sm">
                                        {player === address ? 'You' : `${player.slice(0, 6)}...${player.slice(-4)}`}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-500 font-mono break-all mt-1">
                                    {player.slice(0, 6)}...{player.slice(-4)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {/* Game Actions */}
            {!stableHasJoined ? (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Join Game</h3>
                    <p className="text-gray-600 mb-4">
                        You need to join this game before you can participate.
                    </p>
                    <button
                        onClick={handleJoinGame}
                        disabled={isJoining || isLoading || gameInfo?.status !== 1}
                        className="btn-primary flex items-center space-x-2"
                    >
                        {isJoining ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Users className="w-5 h-5" />
                        )}
                        <span>{isJoining ? 'Joining...' : 'Join Game'}</span>
                    </button>
                    {gameInfo?.status !== 1 && (
                        <p className="text-sm text-gray-500 mt-2">
                            Game must be active to join
                        </p>
                    )}
                </div>
            ) : stableHasJoined && (stableCanMakeGuess || (stableGameInfo?.status === 1 && !stableGameInfo?.gameWon)) ? (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                        <Target className="w-5 h-5" />
                        <span>Make Your Guess</span>
                    </h3>
                    <p className="text-gray-600 mb-2">
                        Make two predictions:
                    </p>
                    <p className="text-sm text-blue-600 mb-4">
                        Guesses made: {guessCount}/{gameInfo?.maxGuessesPerPlayer || 3}
                    </p>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                What is the secret number? ({gameInfo?.minRange || 0} - {gameInfo?.maxRange || 0})
                            </label>
                            <input
                                type="number"
                                min={gameInfo?.minRange || 0}
                                max={gameInfo?.maxRange || 0}
                                value={secretGuess}
                                onChange={(e) => setSecretGuess(e.target.value)}
                                className="input w-full"
                                placeholder={`Enter number between ${gameInfo?.minRange || 0} and ${gameInfo?.maxRange || 0}`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                How many total guesses will be made before someone wins?
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={totalGuess}
                                onChange={(e) => setTotalGuess(e.target.value)}
                                className="input w-full"
                                placeholder="Enter your prediction"
                            />
                        </div>

                        <button
                            onClick={handleMakeGuess}
                            disabled={isSubmitting || !secretGuess || !totalGuess || guessCount >= (gameInfo?.maxGuessesPerPlayer || 3)}
                            className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Target className="w-5 h-5" />
                            )}
                            <span>{guessCount >= (gameInfo?.maxGuessesPerPlayer || 3) ? 'Guess Limit Reached' : 'Submit Guess'}</span>
                        </button>
                        {guessCount >= (gameInfo?.maxGuessesPerPlayer || 3) && (
                            <p className="text-sm text-red-600 mt-2 text-center">
                                You have reached the maximum of {gameInfo?.maxGuessesPerPlayer || 3} guesses per game.
                            </p>
                        )}
                    </div>

                    {/* End Game Button for Game Master */}
                    {address && gameInfo?.gameMaster && gameInfo.gameMaster.toLowerCase() === address.toLowerCase() && gameInfo?.status === 1 && !gameInfo?.gameWon && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <button
                                onClick={handleEndGame}
                                disabled={isEnding}
                                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {isEnding ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Play className="w-4 h-4" />
                                )}
                                <span>{isEnding ? 'Ending Game...' : 'End Game'}</span>
                            </button>
                            <p className="text-xs text-gray-500 mt-2 text-center">
                                As the game master, you can end this game at any time
                            </p>
                        </div>
                    )}
                </div>
            ) : stableHasJoined ? (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Game Status</h3>
                    <p className="text-gray-600">
                        {stableGameInfo?.status === 0
                            ? "Game is waiting to be activated by the game master."
                            : stableGameInfo?.gameWon
                                ? "Game has ended. Check the winner above!"
                                : !stableCanMakeGuess && stableGameInfo?.status === 1
                                    ? "You can make a guess! Use the interface above."
                                    : !stableCanMakeGuess
                                        ? "Game is not accepting new guesses at this time."
                                        : "Game is full or not available for new guesses."
                        }
                    </p>
                    {stableGameInfo?.gameWon && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 text-sm">
                                🎉 Thanks for playing! The game has concluded.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Waiting for Game</h3>
                    <p className="text-gray-600">
                        {gameInfo?.status === 0
                            ? "Game is waiting to be activated by the game master."
                            : gameInfo?.gameWon
                                ? "Game has ended."
                                : "Game is full or not available for new guesses."
                        }
                    </p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="card bg-red-50 border-red-200">
                    <p className="text-red-800">{error}</p>
                </div>
            )}
        </div>
    );
});
