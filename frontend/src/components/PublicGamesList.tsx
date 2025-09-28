'use client';

import React, { useState, useEffect } from 'react';
import { Users, Clock, User, Gamepad2, RefreshCw } from 'lucide-react';

interface GameInfo {
    gameId: string;
    gameMaster: string;
    playerCount: number;
    maxPlayers: number;
    status: 'waiting' | 'active' | 'finished';
    createdAt: number;
}

interface PublicGamesListProps {
    onJoinGame: (gameId: string) => void;
    onBack: () => void;
}

export function PublicGamesList({ onJoinGame, onBack }: PublicGamesListProps) {
    const [games, setGames] = useState<GameInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Simulate fetching public games
    useEffect(() => {
        const fetchPublicGames = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Mock public games data
                const mockGames: GameInfo[] = [
                    {
                        gameId: '0x1234...5678',
                        gameMaster: '0xabcd...efgh',
                        playerCount: 2,
                        maxPlayers: 5,
                        status: 'waiting',
                        createdAt: Date.now() - 300000, // 5 minutes ago
                    },
                    {
                        gameId: '0x9876...5432',
                        gameMaster: '0xijkl...mnop',
                        playerCount: 1,
                        maxPlayers: 3,
                        status: 'active',
                        createdAt: Date.now() - 600000, // 10 minutes ago
                    },
                    {
                        gameId: '0x4567...8901',
                        gameMaster: '0xqrst...uvwx',
                        playerCount: 4,
                        maxPlayers: 6,
                        status: 'waiting',
                        createdAt: Date.now() - 900000, // 15 minutes ago
                    },
                ];

                setGames(mockGames);
            } catch (err) {
                setError('Failed to fetch public games');
                console.error('Error fetching public games:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPublicGames();
    }, []);

    const handleRefresh = () => {
        window.location.reload(); // Simple refresh for demo
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'waiting': return 'bg-yellow-100 text-yellow-800';
            case 'active': return 'bg-green-100 text-green-800';
            case 'finished': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'waiting': return <Clock className="w-4 h-4" />;
            case 'active': return <Gamepad2 className="w-4 h-4" />;
            case 'finished': return <Users className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);

        if (minutes < 60) {
            return `${minutes}m ago`;
        } else {
            return `${hours}h ago`;
        }
    };

    if (isLoading) {
        return (
            <div className="card">
                <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
                    <p className="text-gray-600">Loading public games...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="card">
                <div className="text-center py-8">
                    <p className="text-red-600 mb-4">{error}</p>
                    <button onClick={handleRefresh} className="btn-primary">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gradient flex items-center space-x-2">
                    <Users className="w-6 h-6" />
                    <span>Public Games</span>
                </h2>
                <button
                    onClick={handleRefresh}
                    className="btn-outline flex items-center space-x-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                </button>
            </div>

            {games.length === 0 ? (
                <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Public Games Available</h3>
                    <p className="text-gray-500 mb-4">
                        There are currently no public games to join. Start your own game or ask a friend for an invite code.
                    </p>
                    <button onClick={onBack} className="btn-primary">
                        Back to Game Mode Selection
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {games.map((game) => (
                        <div
                            key={game.gameId}
                            className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            Game {game.gameId.substring(0, 8)}...
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Master: {game.gameMaster.substring(0, 6)}...{game.gameMaster.substring(38)}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(game.status)}`}>
                                    {getStatusIcon(game.status)}
                                    <span className="capitalize">{game.status}</span>
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                    <div className="flex items-center space-x-1">
                                        <Users className="w-4 h-4" />
                                        <span>{game.playerCount}/{game.maxPlayers} players</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{formatTimeAgo(game.createdAt)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => onJoinGame(game.gameId)}
                                    disabled={game.status === 'finished' || game.playerCount >= game.maxPlayers}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {game.status === 'finished' ? 'Finished' :
                                        game.playerCount >= game.maxPlayers ? 'Full' : 'Join Game'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-200">
                <button onClick={onBack} className="btn-outline w-full">
                    Back to Game Mode Selection
                </button>
            </div>
        </div>
    );
}
