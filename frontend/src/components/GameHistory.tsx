'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Trophy, Clock, Users, Target, Award } from 'lucide-react';

interface GameHistoryItem {
    gameId: number;
    gameMaster: string;
    winner: string;
    totalGuesses: number;
    maxPlayers: number;
    playerCount: number;
    winType: number; // 1=correct guess, 2=closest guess, 3=speed bonus
    completedAt: number;
    range: { min: number; max: number };
}

const GAME_HISTORY_KEY = 'fhevm-game-history';

export function GameHistory() {
    const { address } = useAccount();
    const [gameHistory, setGameHistory] = useState<GameHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load game history from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(GAME_HISTORY_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setGameHistory(parsed);
            }
        } catch (error) {
            console.error('Failed to load game history:', error);
        }
    }, []);

    // Function to add a completed game to history
    const addGameToHistory = (gameData: GameHistoryItem) => {
        try {
            const currentHistory = JSON.parse(localStorage.getItem(GAME_HISTORY_KEY) || '[]');
            const newHistory = [gameData, ...currentHistory].slice(0, 50); // Keep only last 50 games
            localStorage.setItem(GAME_HISTORY_KEY, JSON.stringify(newHistory));
            setGameHistory(newHistory);
        } catch (error) {
            console.error('Failed to save game history:', error);
        }
    };

    // Expose the function globally so other components can use it
    useEffect(() => {
        (window as any).addGameToHistory = addGameToHistory;
        return () => {
            delete (window as any).addGameToHistory;
        };
    }, []);

    const getWinTypeText = (winType: number) => {
        switch (winType) {
            case 1: return 'Correct Guess';
            case 2: return 'Closest Guess';
            case 3: return 'Speed Bonus';
            default: return 'Unknown';
        }
    };

    const getWinTypeIcon = (winType: number) => {
        switch (winType) {
            case 1: return <Target className="w-4 h-4 text-green-500" />;
            case 2: return <Award className="w-4 h-4 text-blue-500" />;
            case 3: return <Trophy className="w-4 h-4 text-yellow-500" />;
            default: return <Trophy className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatTimeAgo = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);

        if (hours > 0) {
            return `${hours}h ago`;
        } else if (minutes > 0) {
            return `${minutes}m ago`;
        } else {
            return 'Just now';
        }
    };

    if (gameHistory.length === 0) {
        return (
            <div className="card-glass">
                <div className="text-center py-8">
                    <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Game History</h3>
                    <p className="text-gray-500 text-sm">
                        Completed games will appear here once you start playing!
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="card-glass">
            <div className="flex items-center space-x-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-800">Game History</h3>
                <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                    {gameHistory.length} games
                </span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
                {gameHistory.map((game) => (
                    <div key={game.gameId} className="history-item">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                                {getWinTypeIcon(game.winType)}
                                <span className="text-sm font-medium text-gray-700">
                                    Game #{game.gameId}
                                </span>
                            </div>

                            <div className="flex items-center space-x-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeAgo(game.completedAt)}</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4 text-xs text-gray-600">
                            <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{game.playerCount}/{game.maxPlayers}</span>
                            </div>

                            <div className="flex items-center space-x-1">
                                <Target className="w-3 h-3" />
                                <span>{game.totalGuesses} guesses</span>
                            </div>

                            <div className="text-xs">
                                Range: {game.range.min}-{game.range.max}
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">
                                Winner: {game.winner}
                            </div>
                            <div className="text-xs font-medium text-blue-600">
                                {getWinTypeText(game.winType)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Total Games Played: {gameHistory.length}</span>
                    <span>Win Rate: {Math.round((gameHistory.filter(g => g.winner === address).length / gameHistory.length) * 100)}%</span>
                </div>
            </div>
        </div>
    );
}
