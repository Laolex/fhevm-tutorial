'use client';

import React, { useState, useEffect, memo } from 'react';
import { useAccount } from 'wagmi';
import { useGameMaster } from '@/hooks/useGameMaster';
import { Gamepad2, Users, Clock, Play, Loader2 } from 'lucide-react';

interface GameRoom {
    gameId: number;
    gameMaster: string;
    status: number; // 0: Waiting, 1: Active, 2: Finished
    maxPlayers: number;
    minRange: number;
    maxRange: number;
    totalGuesses: number;
    winner: string;
    gameWon: boolean;
    inviteCode: string;
    playerCount: number;
    hasJoined: boolean;
    canJoin: boolean;
    canMakeGuess: boolean;
}

export const DynamicGamesList = memo(function DynamicGamesList({ onJoinGame }: { onJoinGame: (gameId: number) => void }) {
    const { address } = useAccount();
    const {
        publicClient,
        contractAddress,
        joinGame,
        joinGameWithInvite,
        getGameIdByInviteCode,
        isLoading
    } = useGameMaster();

    const [games, setGames] = useState<GameRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState('');
    const [joiningGameId, setJoiningGameId] = useState<number | null>(null);

    // Fetch all available games
    const fetchAllGames = async () => {
        if (!publicClient || !contractAddress) return;

        try {
            setLoading(true);

            // Get the next game ID to know how many games exist
            const nextGameId = await publicClient.readContract({
                address: contractAddress,
                abi: [
                    {
                        "type": "function",
                        "name": "nextGameId",
                        "inputs": [],
                        "outputs": [{ "name": "", "type": "uint256" }],
                        "stateMutability": "view"
                    }
                ],
                functionName: 'nextGameId'
            });

            const totalGames = Number(nextGameId as bigint);
            const gamePromises: Promise<GameRoom | null>[] = [];

            // Fetch all games
            for (let gameId = 1; gameId < totalGames; gameId++) {
                gamePromises.push(fetchGameInfo(gameId));
            }

            const gameResults = await Promise.all(gamePromises);
            const validGames = gameResults.filter((game): game is GameRoom => game !== null);

            // Sort games: Active first, then Waiting, then Finished
            const sortedGames = validGames.sort((a, b) => {
                if (a.status === 1 && b.status !== 1) return -1; // Active games first
                if (b.status === 1 && a.status !== 1) return 1;
                if (a.status === 0 && b.status === 2) return -1; // Waiting before Finished
                if (a.status === 2 && b.status === 0) return 1;
                return a.gameId - b.gameId; // Then by game ID
            });

            setGames(sortedGames);
        } catch (error) {
            console.error('Failed to fetch games:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch individual game info
    const fetchGameInfo = async (gameId: number): Promise<GameRoom | null> => {
        if (!publicClient || !contractAddress || !address) return null;

        try {
            const [gameInfoResult, playersResult, hasJoined, canJoin, canMakeGuess] = await Promise.all([
                publicClient.readContract({
                    address: contractAddress,
                    abi: [
                        {
                            "type": "function",
                            "name": "getGameInfo",
                            "inputs": [{ "name": "_gameId", "type": "uint256" }],
                            "outputs": [
                                { "name": "gameMaster", "type": "address" },
                                { "name": "status", "type": "uint8" },
                                { "name": "maxPlayers", "type": "uint8" },
                                { "name": "minRange", "type": "uint8" },
                                { "name": "maxRange", "type": "uint8" },
                                { "name": "totalGuesses", "type": "uint8" },
                                { "name": "winner", "type": "address" },
                                { "name": "gameWon", "type": "bool" },
                                { "name": "inviteCode", "type": "string" },
                                { "name": "playerCount", "type": "uint256" }
                            ],
                            "stateMutability": "view"
                        }
                    ],
                    functionName: 'getGameInfo',
                    args: [BigInt(gameId)]
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi: [
                        {
                            "type": "function",
                            "name": "getPlayers",
                            "inputs": [{ "name": "_gameId", "type": "uint256" }],
                            "outputs": [{ "name": "", "type": "address[]" }],
                            "stateMutability": "view"
                        }
                    ],
                    functionName: 'getPlayers',
                    args: [BigInt(gameId)]
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi: [
                        {
                            "type": "function",
                            "name": "hasPlayerJoined",
                            "inputs": [
                                { "name": "_gameId", "type": "uint256" },
                                { "name": "_player", "type": "address" }
                            ],
                            "outputs": [{ "name": "", "type": "bool" }],
                            "stateMutability": "view"
                        }
                    ],
                    functionName: 'hasPlayerJoined',
                    args: [BigInt(gameId), address]
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi: [
                        {
                            "type": "function",
                            "name": "canJoinGame",
                            "inputs": [{ "name": "_gameId", "type": "uint256" }],
                            "outputs": [{ "name": "", "type": "bool" }],
                            "stateMutability": "view"
                        }
                    ],
                    functionName: 'canJoinGame',
                    args: [BigInt(gameId)]
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi: [
                        {
                            "type": "function",
                            "name": "canMakeGuess",
                            "inputs": [{ "name": "_gameId", "type": "uint256" }],
                            "outputs": [{ "name": "", "type": "bool" }],
                            "stateMutability": "view"
                        }
                    ],
                    functionName: 'canMakeGuess',
                    args: [BigInt(gameId)]
                })
            ]);

            const [
                gameMaster,
                status,
                maxPlayers,
                minRange,
                maxRange,
                totalGuesses,
                winner,
                gameWon,
                inviteCode,
                playerCount
            ] = gameInfoResult as readonly [string, number, number, number, number, number, string, boolean, string, bigint];

            return {
                gameId,
                gameMaster,
                status,
                maxPlayers,
                minRange,
                maxRange,
                totalGuesses,
                winner,
                gameWon,
                inviteCode,
                playerCount: Number(playerCount),
                hasJoined: hasJoined as boolean,
                canJoin: canJoin as boolean,
                canMakeGuess: canMakeGuess as boolean
            };
        } catch (error) {
            console.error(`Failed to fetch game ${gameId}:`, error);
            return null;
        }
    };

    // Handle joining a game
    const handleJoinGame = async (gameId: number) => {
        setJoiningGameId(gameId);
        try {
            await joinGame(gameId);
            onJoinGame(gameId);
            // Refresh the games list
            await fetchAllGames();
        } catch (error) {
            console.error('Failed to join game:', error);
        } finally {
            setJoiningGameId(null);
        }
    };

    // Handle joining with invite code
    const handleJoinWithInvite = async () => {
        if (!inviteCode.trim()) return;

        setJoiningGameId(-1); // Special ID for invite code
        try {
            // First get the game ID from the invite code
            const gameId = await getGameIdByInviteCode(inviteCode.trim());
            console.log('🎮 Found game ID for invite code:', gameId);

            if (gameId > 0) {
                await joinGameWithInvite(inviteCode.trim());
                onJoinGame(gameId);
            } else {
                throw new Error('Invalid invite code - no game found');
            }
            // Refresh the games list
            await fetchAllGames();
        } catch (error) {
            console.error('Failed to join game with invite:', error);
        } finally {
            setJoiningGameId(null);
            setInviteCode('');
        }
    };

    // Load games on mount and periodically refresh
    useEffect(() => {
        if (publicClient && contractAddress) {
            fetchAllGames();
            const interval = setInterval(fetchAllGames, 30000); // Refresh every 30 seconds (reduced frequency)
            return () => clearInterval(interval);
        }
    }, [publicClient, contractAddress]); // Removed address dependency to prevent unnecessary refreshes

    const getStatusBadge = (status: number, gameWon: boolean, winner: string) => {
        if (gameWon) {
            return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">🏆 Finished</span>;
        }
        switch (status) {
            case 0:
                return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">⏳ Waiting</span>;
            case 1:
                return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">🎮 Active</span>;
            case 2:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">✅ Finished</span>;
            default:
                return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Unknown</span>;
        }
    };

    if (loading) {
        return (
            <div className="card">
                <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading available games...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Invite Code Section */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Gamepad2 className="w-5 h-5" />
                    <span>Join with Invite Code</span>
                </h3>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        placeholder="Enter invite code (e.g., GM1234)"
                        className="input flex-1"
                    />
                    <button
                        onClick={handleJoinWithInvite}
                        disabled={!inviteCode.trim() || joiningGameId === -1}
                        className="btn-primary flex items-center space-x-2"
                    >
                        {joiningGameId === -1 ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        <span>Join</span>
                    </button>
                </div>
            </div>

            {/* Available Games */}
            <div className="card">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Available Game Rooms ({games.length})</span>
                </h3>

                {games.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No games available at the moment.</p>
                        <p className="text-sm mt-2">Check back later or create your own game!</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {games.map((game) => (
                            <div
                                key={game.gameId}
                                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h4 className="font-semibold text-gray-900">
                                                Game #{game.gameId}
                                            </h4>
                                            {getStatusBadge(game.status, game.gameWon, game.winner)}
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                            <div>
                                                <span className="font-medium">Game Master:</span>
                                                <p className="font-mono text-xs break-all">{game.gameMaster}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Players:</span>
                                                <p>{game.playerCount}/{game.maxPlayers}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Range:</span>
                                                <p>{game.minRange}-{game.maxRange}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Invite Code:</span>
                                                <p className="font-mono text-xs">{game.inviteCode}</p>
                                            </div>
                                        </div>

                                        {game.gameWon && game.winner && (
                                            <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded">
                                                <p className="text-green-800 text-sm">
                                                    🏆 Winner: <span className="font-mono">{game.winner}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="ml-4 flex flex-col space-y-2">
                                        {game.hasJoined ? (
                                            <button
                                                onClick={() => onJoinGame(game.gameId)}
                                                className="btn-secondary text-sm"
                                            >
                                                View Game
                                            </button>
                                        ) : game.canJoin ? (
                                            <button
                                                onClick={() => handleJoinGame(game.gameId)}
                                                disabled={joiningGameId === game.gameId}
                                                className="btn-primary text-sm flex items-center space-x-1"
                                            >
                                                {joiningGameId === game.gameId ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Play className="w-4 h-4" />
                                                )}
                                                <span>Join Game</span>
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-500 px-2 py-1">
                                                {game.status === 0 ? 'Not Active' : 'Full'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});
