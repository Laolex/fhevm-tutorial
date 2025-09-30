'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { GameHeader } from '@/components/GameHeader';
import { GameStatus } from '@/components/GameStatus';
import { GameMasterPanel } from '@/components/GameMasterPanel';
import { EnhancedPlayerPanel } from '@/components/EnhancedPlayerPanel';
import { GameModeSelector } from '@/components/GameModeSelector';
import { PublicGamesList } from '@/components/PublicGamesList';
import { SimpleWalletConnect } from '@/components/SimpleWalletConnect';
import { DynamicGamesList } from '@/components/DynamicGamesList';
import { ParticipantGameInterface } from '@/components/ParticipantGameInterface';
import { GameHistory } from '@/components/GameHistory';
import { useGameMaster } from '@/hooks/useGameMaster';

export default function Home() {
    const { address, isConnected } = useAccount();
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
        resetGame,
    } = useGameMaster();
    const [gameMode, setGameMode] = useState<'selector' | 'master' | 'player' | 'public-games' | 'participant-game'>('selector');
    const [selectedGameId, setSelectedGameId] = useState<number>(0);


    // Game mode handlers
    const handleStartAsGameMaster = () => {
        setGameMode('master');
        setSelectedGameId(0); // Reset selected game ID
        // Force a small delay to ensure state is cleared before rendering
        setTimeout(() => {
            // This ensures we start fresh
        }, 100);
    };

    const handleJoinGame = () => {
        setGameMode('public-games');
    };

    const handleJoinWithInvite = (inviteCode: string) => {
        setGameMode('player');
        setSelectedGameId(0); // Reset selected game ID
        // TODO: Handle invite code logic
    };

    const handleJoinPublicGame = (gameId: string) => {
        setSelectedGameId(parseInt(gameId));
        setGameMode('participant-game');
    };

    const handleJoinSelectedGame = useCallback((gameId: number) => {
        // Prevent unnecessary updates if already in the same state
        if (selectedGameId === gameId && gameMode === 'participant-game') {
            return;
        }

        setSelectedGameId(gameId);
        setGameMode('participant-game');
    }, [selectedGameId, gameMode]);

    const handleBackToPublicGames = useCallback(() => {
        setGameMode('public-games');
        setSelectedGameId(0);
    }, []);

    const handleBackToSelector = useCallback(() => {
        setGameMode('selector');
        setSelectedGameId(0); // Reset selected game ID
    }, []);


    // Listen for custom navigation events
    useEffect(() => {
        const handleNavigateToGame = (event: any) => {
            const { gameId, mode } = event.detail;
            setSelectedGameId(gameId);
            setGameMode(mode);
        };

        const handleNavigateToGames = () => {
            setGameMode('public-games');
            setSelectedGameId(0);
        };

        window.addEventListener('navigateToGame', handleNavigateToGame);
        window.addEventListener('navigateToGames', handleNavigateToGames);

        return () => {
            window.removeEventListener('navigateToGame', handleNavigateToGame);
            window.removeEventListener('navigateToGames', handleNavigateToGames);
        };
    }, []);

    if (!isConnected) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-bold text-gradient">
                            🎮 Hello FHEVM
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Welcome to the Secret Number Guessing Game!
                            This tutorial demonstrates confidential computing with FHEVM.
                        </p>
                    </div>

                    <div className="card max-w-md mx-auto">
                        <h2 className="text-2xl font-semibold mb-4 text-center">
                            Tutorial Mode
                        </h2>
                        <p className="text-gray-600 mb-6 text-center">
                            This is a demonstration of FHEVM concepts.
                            Connect your wallet to see the full interactive experience.
                        </p>
                        <SimpleWalletConnect />
                    </div>

                    <div className="text-sm text-gray-500 max-w-lg mx-auto">
                        <p className="mb-2">
                            <strong>What is FHEVM?</strong> FHEVM enables confidential smart contracts
                            where you can compute on encrypted data without revealing the inputs.
                        </p>
                        <p>
                            In this game, your guesses are encrypted and only the winner is revealed publicly!
                        </p>
                    </div>

                    <div className="card max-w-lg mx-auto">
                        <h3 className="text-lg font-semibold mb-3">🎯 Tutorial Features</h3>
                        <div className="text-left space-y-2 text-sm">
                            <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span>Smart contract with FHEVM syntax</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span>Encrypted number guessing game</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-green-500">✅</span>
                                <span>Complete tutorial documentation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-600">Loading game data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen game-bg py-8">
            <div className="max-w-6xl mx-auto px-4 space-y-8">
                <GameHeader />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        {gameInfo && (
                            <GameStatus
                                status={gameInfo.status}
                                playerCount={players.length}
                                players={players}
                                totalGuesses={gameInfo.totalGuesses}
                                gameWon={gameInfo.gameWon}
                                winner={gameInfo.winner}
                            />
                        )}

                        {gameMode === 'selector' ? (
                            <GameModeSelector
                                onStartAsGameMaster={handleStartAsGameMaster}
                                onJoinGame={handleJoinGame}
                                onJoinWithInvite={handleJoinWithInvite}
                            />
                        ) : gameMode === 'public-games' ? (
                            <DynamicGamesList
                                onJoinGame={handleJoinSelectedGame}
                            />
                        ) : gameMode === 'participant-game' ? (
                            selectedGameId > 0 ? (
                                <ParticipantGameInterface
                                    gameId={selectedGameId}
                                    onBack={handleBackToPublicGames}
                                />
                            ) : (
                                <div className="card">
                                    <div className="text-center py-8">
                                        <p className="text-red-600 mb-4">No game selected</p>
                                        <button onClick={handleBackToPublicGames} className="btn-outline">
                                            ← Back to Games
                                        </button>
                                    </div>
                                </div>
                            )
                        ) : (() => {
                            // Show game master panel if:
                            // 1. User is a game master AND has an active game, OR
                            // 2. Game mode is explicitly set to 'master'
                            const shouldShowGameMaster = (isGameMaster && hasActiveGame && gameInfo?.status === 1) || gameMode === 'master';

                            if (shouldShowGameMaster) {
                                return <GameMasterPanel />;
                            } else {
                                return <EnhancedPlayerPanel />;
                            }
                        })()}

                        {/* Back to Game Mode Selection */}
                        {gameMode !== 'selector' && (
                            <div className="card">
                                <button
                                    onClick={handleBackToSelector}
                                    className="btn-outline w-full"
                                >
                                    ← Back to Game Mode Selection
                                </button>
                            </div>
                        )}


                    </div>

                    <div className="space-y-6">
                        {/* Game History */}
                        <GameHistory />

                        {/* Game Master Features Info */}
                        <div className="card-gradient">
                            <h3 className="text-lg font-semibold mb-4">🎮 Game Master Features</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h4 className="font-semibold text-blue-600 mb-2">For Game Masters:</h4>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>• Claim game master status</li>
                                        <li>• Create custom game rooms</li>
                                        <li>• Set game rules and ranges</li>
                                        <li>• Generate invite codes</li>
                                        <li>• Manage game flow</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-green-600 mb-2">For Players:</h4>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>• Join games with invite codes</li>
                                        <li>• Make guesses at secret numbers</li>
                                        <li>• Compete with other players</li>
                                        <li>• Win by guessing correctly</li>
                                        <li>• Participate in multiple games</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-xl font-semibold mb-4">🎯 How It Works</h3>
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                                    <p>Game master sets a secret number (1-100)</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                                    <p>Players join and make encrypted guesses</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                                    <p>Contract checks guesses privately</p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">4</span>
                                    <p>Only the winner is revealed publicly!</p>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 className="text-xl font-semibold mb-4">🔐 FHEVM Magic</h3>
                            <div className="space-y-3 text-sm text-gray-600">
                                <p>
                                    <strong>Confidential Computing:</strong> Your guesses are encrypted
                                    and computed on without revealing the actual numbers.
                                </p>
                                <p>
                                    <strong>Privacy by Design:</strong> Even the game master can't see
                                    individual guesses until the game ends.
                                </p>
                                <p>
                                    <strong>Transparent Results:</strong> Only the final winner and
                                    secret number are revealed publicly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
