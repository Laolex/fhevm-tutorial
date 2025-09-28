'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { useGameMaster } from '@/hooks/useGameMaster';
import { Copy, Share2, Crown, Users, Settings, Play, RotateCcw } from 'lucide-react';

export function GameMasterPanel() {
    const { address } = useAccount();
    const {
        isLoading,
        error,
        isGameMaster,
        hasActiveGame,
        currentGameId,
        gameInfo,
        players,
        hasJoined,
        canJoin,
        canMakeGuess,
        claimGameMaster,
        startGame,
        activateGame,
        joinGameWithInvite,
        joinGame,
        makeGuess,
        endGame,
        resetGame,
    } = useGameMaster();

    const [maxPlayersInput, setMaxPlayersInput] = useState<string>('5');
    const [minRangeInput, setMinRangeInput] = useState<string>('1');
    const [maxRangeInput, setMaxRangeInput] = useState<string>('100');
    const [localIsLoading, setLocalIsLoading] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    // Handle claiming game master status
    const handleClaimGameMaster = async () => {
        try {
            setLocalIsLoading(true);
            setLocalError(null);

            // Check if wallet is connected
            if (!address) {
                setLocalError('Wallet not connected. Please connect your wallet first.');
                return;
            }

            await claimGameMaster();
            console.log('✅ Game master status claimed successfully');
        } catch (err) {
            console.error('Failed to claim game master:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to claim game master');
        } finally {
            setLocalIsLoading(false);
        }
    };

    // Handle starting a new game
    const handleStartGame = async () => {
        if (!maxPlayersInput || !minRangeInput || !maxRangeInput) {
            setLocalError('Please fill in all fields');
            return;
        }

        const maxPlayersNum = parseInt(maxPlayersInput);
        const minRangeNum = parseInt(minRangeInput);
        const maxRangeNum = parseInt(maxRangeInput);

        if (maxPlayersNum < 2 || maxPlayersNum > 10) {
            setLocalError('Max players must be between 2 and 10');
            return;
        }

        if (minRangeNum >= maxRangeNum) {
            setLocalError('Min range must be less than max range');
            return;
        }

        if (maxRangeNum > 255) {
            setLocalError('Max range cannot exceed 255');
            return;
        }

        try {
            setLocalIsLoading(true);
            setLocalError(null);
            await startGame(maxPlayersNum, minRangeNum, maxRangeNum);
            console.log('✅ Game started successfully');
        } catch (err) {
            console.error('Failed to start game:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to start game');
        } finally {
            setLocalIsLoading(false);
        }
    };

    // Handle activating the game
    const handleActivateGame = async () => {
        try {
            setLocalIsLoading(true);
            setLocalError(null);
            await activateGame();
            console.log('✅ Game activated successfully');
        } catch (err) {
            console.error('Failed to activate game:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to activate game');
        } finally {
            setLocalIsLoading(false);
        }
    };

    // Handle resetting the game
    const handleEndGame = async () => {
        try {
            setLocalIsLoading(true);
            setLocalError(null);
            await endGame(currentGameId);
            console.log('✅ Game ended successfully');
        } catch (err) {
            console.error('Failed to end game:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to end game');
        } finally {
            setLocalIsLoading(false);
        }
    };

    const handleResetGame = async () => {
        try {
            setLocalIsLoading(true);
            setLocalError(null);
            await resetGame(currentGameId);
            console.log('✅ Game reset successfully');
        } catch (err) {
            console.error('Failed to reset game:', err);
            setLocalError(err instanceof Error ? err.message : 'Failed to reset game');
        } finally {
            setLocalIsLoading(false);
        }
    };

    // Copy invite code to clipboard
    const copyInviteCode = () => {
        if (gameInfo?.inviteCode) {
            navigator.clipboard.writeText(gameInfo.inviteCode);
            // You could add a toast notification here
        }
    };

    // Share invite code
    const shareInviteCode = () => {
        if (gameInfo?.inviteCode && navigator.share) {
            navigator.share({
                title: 'Join my Secret Number Game!',
                text: `Join my game using invite code: ${gameInfo.inviteCode}`,
            });
        }
    };

    // If user is not a game master, show claim button
    if (!isGameMaster) {
        return (
            <div className="card">
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Crown className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Become a Game Master</h2>
                    <p className="text-gray-600 mb-6">
                        Claim your game master status to create and manage your own games.
                        This will require signing a transaction and paying gas fees.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={handleClaimGameMaster}
                            disabled={localIsLoading || isLoading}
                            className="btn-primary w-full flex items-center justify-center space-x-2"
                        >
                            <Crown className="w-5 h-5" />
                            <span>{localIsLoading || isLoading ? 'Claiming...' : 'Claim Game Master Status'}</span>
                        </button>

                        <button
                            onClick={() => {
                                console.log('🔄 Manual refresh triggered');
                                // Force refresh the game master status
                                window.location.reload();
                            }}
                            className="btn-outline w-full flex items-center justify-center space-x-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Refresh Status</span>
                        </button>
                    </div>

                    {(error || localError) && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error || localError}</p>
                        </div>
                    )}

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2">🎮 What you'll get:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Create your own game rooms</li>
                            <li>• Set custom game rules and ranges</li>
                            <li>• Generate invite codes for players</li>
                            <li>• Manage game flow and reset games</li>
                            <li>• Participate in your own games</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // If user is game master but has no active game, show game creation form
    if (isGameMaster && !hasActiveGame) {
        return (
            <div className="card">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Settings className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Create New Game</h2>
                    <p className="text-gray-600">
                        Configure your game settings and create a new game room.
                    </p>
                </div>

                <div className="space-y-4">
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
                                className="input w-full"
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
                                className="input w-full"
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
                                className="input w-full"
                                placeholder="100"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleStartGame}
                        disabled={localIsLoading || isLoading}
                        className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                        <Settings className="w-5 h-5" />
                        <span>{localIsLoading || isLoading ? 'Creating Game...' : 'Create Game Room'}</span>
                    </button>

                    {(error || localError) && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-800 text-sm">{error || localError}</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // If user has an active game, show game management panel
    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Crown className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Game Master Panel</h2>
                        <p className="text-sm text-gray-600">Game ID: {currentGameId}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {gameInfo?.status === 1 && !gameInfo.gameWon && (
                        <button
                            onClick={handleEndGame}
                            disabled={localIsLoading || isLoading}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                            <Play className="w-4 h-4" />
                            <span>End Game</span>
                        </button>
                    )}
                    <button
                        onClick={handleResetGame}
                        disabled={localIsLoading || isLoading}
                        className="btn-outline flex items-center space-x-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset</span>
                    </button>
                </div>
            </div>

            {/* Game Status */}
            {gameInfo && (
                <div className="mb-6 space-y-4">
                    {/* Game Rules */}
                    <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
                            <Settings className="w-4 h-4" />
                            <span>Game Rules</span>
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p><strong>Max Players:</strong> {gameInfo.maxPlayers}</p>
                                <p><strong>Range:</strong> {gameInfo.minRange} - {gameInfo.maxRange}</p>
                            </div>
                            <div>
                                <p><strong>Current Players:</strong> {gameInfo.playerCount}/{gameInfo.maxPlayers}</p>
                                <p><strong>Status:</strong> {
                                    gameInfo.status === 0 ? "Waiting" :
                                        gameInfo.status === 1 ? "Active" : "Finished"
                                }</p>
                            </div>
                        </div>
                    </div>

                    {/* Invite Code */}
                    {gameInfo.inviteCode && (
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
                                <Share2 className="w-4 h-4" />
                                <span>Invite Code</span>
                            </h3>
                            <div className="flex items-center space-x-2">
                                <code className="flex-1 bg-white px-3 py-2 rounded border font-mono text-lg">
                                    {gameInfo.inviteCode}
                                </code>
                                <button
                                    onClick={copyInviteCode}
                                    className="btn-outline flex items-center space-x-1"
                                >
                                    <Copy className="w-4 h-4" />
                                    <span>Copy</span>
                                </button>
                                {typeof navigator !== 'undefined' && 'share' in navigator && (
                                    <button
                                        onClick={shareInviteCode}
                                        className="btn-outline flex items-center space-x-1"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span>Share</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-sm text-blue-700 mt-2">
                                Share this code with players to let them join your game!
                            </p>
                        </div>
                    )}

                    {/* Game Master Participation */}
                    {gameInfo?.status === 1 && !gameInfo.gameWon && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
                                <Play className="w-5 h-5" />
                                <span>Game Active!</span>
                            </h4>
                            <p className="text-green-700 text-sm mb-3">
                                Your game is now active and accepting players. You can also participate as a player!
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => {
                                        // Navigate to the game as a participant without refresh
                                        const event = new CustomEvent('navigateToGame', {
                                            detail: { gameId: currentGameId, mode: 'participant-game' }
                                        });
                                        window.dispatchEvent(event);
                                    }}
                                    className="btn-primary text-sm flex items-center space-x-1"
                                >
                                    <Play className="w-4 h-4" />
                                    <span>Join as Player</span>
                                </button>
                                <button
                                    onClick={() => {
                                        const event = new CustomEvent('navigateToGames');
                                        window.dispatchEvent(event);
                                    }}
                                    className="btn-outline text-sm flex items-center space-x-1"
                                >
                                    <Users className="w-4 h-4" />
                                    <span>View Games</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Game Status */}
                    {gameInfo.status === 0 && (
                        <div className="p-4 bg-yellow-50 rounded-lg">
                            <h3 className="font-semibold text-yellow-800 mb-2">Game Waiting</h3>
                            <p className="text-yellow-700 text-sm mb-3">
                                Your game room is ready! Activate it to start accepting players and begin the game.
                            </p>
                            <button
                                onClick={handleActivateGame}
                                disabled={localIsLoading || isLoading}
                                className="btn-primary flex items-center space-x-2"
                            >
                                <Play className="w-4 h-4" />
                                <span>{localIsLoading || isLoading ? 'Activating...' : 'Activate Game'}</span>
                            </button>
                        </div>
                    )}

                    {/* Players List */}
                    {players.length > 0 && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-800 mb-2 flex items-center space-x-2">
                                <Users className="w-4 h-4" />
                                <span>Players ({players.length}/{gameInfo.maxPlayers})</span>
                            </h3>
                            <div className="space-y-2">
                                {players.map((player, index) => (
                                    <div key={player} className="flex items-center justify-between bg-white px-3 py-2 rounded border">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                                            <span className="font-mono text-sm">{player}</span>
                                            {player === address && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">You</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Game Results */}
                    {gameInfo.gameWon && gameInfo.winner && (
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h3 className="font-semibold text-green-800 mb-2">🏆 Game Won!</h3>
                            <p className="text-green-700">
                                Winner: <span className="font-mono">{gameInfo.winner}</span>
                            </p>
                        </div>
                    )}
                </div>
            )}

            {(error || localError) && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 text-sm">{error || localError}</p>
                </div>
            )}

            {/* Game Master Features */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">✨ Game Master Features</h3>
                <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Create and manage your own game rooms</li>
                    <li>• Set custom game rules and number ranges</li>
                    <li>• Generate unique invite codes for players</li>
                    <li>• Control game activation and flow</li>
                    <li>• Reset games and start fresh</li>
                </ul>
            </div>
        </div>
    );
}