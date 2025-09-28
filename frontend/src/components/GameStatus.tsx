'use client';

interface GameStatusProps {
    status: number;
    playerCount: number;
    players: string[];
    totalGuesses?: number;
    gameWon?: boolean;
    winner?: string;
}

export function GameStatus({ status, playerCount, players, totalGuesses, gameWon, winner }: GameStatusProps) {
    const getStatusInfo = () => {
        switch (status) {
            case 0:
                return {
                    text: 'Waiting for Game Master',
                    description: 'The game master needs to start the game',
                    className: 'status-waiting',
                };
            case 1:
                return {
                    text: 'Game Active',
                    description: 'Players can join and make guesses',
                    className: 'status-active',
                };
            case 2:
                return {
                    text: 'Game Finished',
                    description: 'The game has ended',
                    className: 'status-finished',
                };
            default:
                return {
                    text: 'Unknown',
                    description: 'Unknown game status',
                    className: 'status-waiting',
                };
        }
    };

    const statusInfo = getStatusInfo();

    return (
        <div className="card">
            <h2 className="text-2xl font-semibold mb-4">Game Status</h2>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Status:</span>
                    <span className={`status-badge ${statusInfo.className}`}>
                        {statusInfo.text}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">Players:</span>
                    <span className="text-lg font-semibold text-primary-600">
                        {playerCount}
                    </span>
                </div>

                {totalGuesses !== undefined && status === 1 && (
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Total Guesses:</span>
                        <span className="text-lg font-semibold text-blue-600">
                            {totalGuesses}
                        </span>
                    </div>
                )}

                {gameWon && winner && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-yellow-800 font-medium">
                            🎉 Game Won!
                        </p>
                        <p className="text-yellow-600 text-sm mt-1">
                            Winner: {winner.substring(0, 6)}...{winner.substring(38)}
                        </p>
                        {totalGuesses !== undefined && (
                            <p className="text-yellow-600 text-sm">
                                Correct answer: {totalGuesses} total guesses
                            </p>
                        )}
                    </div>
                )}

                <div>
                    <p className="text-gray-600 mb-2">{statusInfo.description}</p>

                    {players.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Players:</p>
                            <div className="flex flex-wrap gap-2">
                                {players.map((player, index) => (
                                    <span
                                        key={player}
                                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                                    >
                                        {player.slice(0, 6)}...{player.slice(-4)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
