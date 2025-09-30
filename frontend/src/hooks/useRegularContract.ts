import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

// Regular contract ABI (simplified for demonstration)
const REGULAR_CONTRACT_ABI = [
    // Game state
    "function gameMaster() view returns (address)",
    "function gameId() view returns (uint256)",
    "function gameStatus() view returns (uint8)",
    "function secretNumber() view returns (uint256)",
    "function totalGuesses() view returns (uint256)",
    "function winner() view returns (address)",
    "function gameWon() view returns (bool)",

    // Player data
    "function getPlayers() view returns (address[])",
    "function getPlayerGuesses(address player) view returns (uint256[])",
    "function hasJoined(address player) view returns (bool)",

    // Game actions
    "function startGame(uint256 _secretNumber) external",
    "function joinGame() external",
    "function makeGuess(uint256 _guess) external",
    "function resetGame() external",

    // Utility
    "function getGameInfo() view returns (address,uint256,uint8,uint256,address,bool,uint256)",

    // Events
    "event GameStarted(uint256 indexed gameId, address indexed gameMaster, uint256 secretNumber)",
    "event PlayerJoined(address indexed player, uint256 indexed gameId)",
    "event GuessMade(address indexed player, uint256 guess, uint256 totalGuesses)",
    "event GameWon(address indexed winner, uint256 totalGuesses)",
    "event GameReset(uint256 indexed gameId)"
];

export function useRegularContract() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameMaster, setGameMaster] = useState<string>('');
    const [gameId, setGameId] = useState<string>('');
    const [gameStatus, setGameStatus] = useState<number>(0); // 0: Waiting, 1: Active, 2: Finished
    const [secretNumber, setSecretNumber] = useState<number>(0);
    const [totalGuesses, setTotalGuesses] = useState<number>(0);
    const [winner, setWinner] = useState<string>('');
    const [gameWon, setGameWon] = useState<boolean>(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [playerGuesses, setPlayerGuesses] = useState<Record<string, number[]>>({});
    const [hasJoined, setHasJoined] = useState<boolean>(false);

    // Get contract instance
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
    const contract = contractAddress && publicClient ? {
        address: contractAddress,
        abi: REGULAR_CONTRACT_ABI,
        publicClient,
    } : null;

    const fetchGameData = useCallback(async () => {


        if (!contract || !publicClient || !address) {

            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Fetch game info
            const gameInfo = await publicClient.readContract({
                address: contractAddress,
                abi: REGULAR_CONTRACT_ABI,
                functionName: 'getGameInfo'
            });

            const [_gameMaster, _gameId, _gameStatus, _totalGuesses, _winner, _gameWon, _playerCount] = gameInfo as [string, bigint, number, bigint, string, boolean, bigint];

            setGameMaster(_gameMaster);
            setGameId(_gameId.toString());
            setGameStatus(_gameStatus);
            setTotalGuesses(Number(_totalGuesses));
            setWinner(_winner);
            setGameWon(_gameWon);

            // Fetch players
            const playersList = await publicClient.readContract({
                address: contractAddress,
                abi: REGULAR_CONTRACT_ABI,
                functionName: 'getPlayers'
            }) as string[];

            setPlayers(playersList);

            // Check if current user has joined
            const joined = await publicClient.readContract({
                address: contractAddress,
                abi: REGULAR_CONTRACT_ABI,
                functionName: 'hasJoined',
                args: [address]
            }) as boolean;

            setHasJoined(joined);

            // Fetch player guesses if joined
            if (joined) {
                const guesses = await publicClient.readContract({
                    address: contractAddress,
                    abi: REGULAR_CONTRACT_ABI,
                    functionName: 'getPlayerGuesses',
                    args: [address]
                }) as bigint[];

                setPlayerGuesses(prev => ({
                    ...prev,
                    [address]: guesses.map(g => Number(g))
                }));
            }

            console.log('✅ Game data fetched successfully:', {
                gameMaster: _gameMaster,
                gameStatus: _gameStatus,
                totalGuesses: Number(_totalGuesses),
                players: playersList.length,
                hasJoined: joined
            });

        } catch (err) {
            console.error('Failed to fetch game data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch game data');
        } finally {
            setIsLoading(false);
        }
    }, [contract, publicClient, address, contractAddress]);

    const startGame = async (secretNumber: number) => {


        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            // Start the game
            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: REGULAR_CONTRACT_ABI,
                functionName: 'startGame',
                args: [BigInt(secretNumber)]
            });



            // Wait for transaction confirmation
            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh game data
            await fetchGameData();

        } catch (err) {
            console.error('Failed to start game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const joinGame = async () => {


        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: REGULAR_CONTRACT_ABI,
                functionName: 'joinGame'
            });



            await publicClient.waitForTransactionReceipt({ hash });
            await fetchGameData();

        } catch (err) {
            console.error('Failed to join game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const makeGuess = async (guess: number) => {


        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: REGULAR_CONTRACT_ABI,
                functionName: 'makeGuess',
                args: [BigInt(guess)]
            });



            await publicClient.waitForTransactionReceipt({ hash });
            await fetchGameData();

        } catch (err) {
            console.error('Failed to make guess:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const resetGame = async () => {


        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: REGULAR_CONTRACT_ABI,
                functionName: 'resetGame'
            });



            await publicClient.waitForTransactionReceipt({ hash });
            await fetchGameData();

        } catch (err) {
            console.error('Failed to reset game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Set up data fetching
    useEffect(() => {
        if (contract && publicClient && address) {
            fetchGameData();

            // Set up polling for game updates
            const interval = setInterval(() => {
                fetchGameData();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [contract, publicClient, address, fetchGameData]);

    return {
        // State
        isLoading,
        error,
        gameMaster,
        gameId,
        gameStatus,
        secretNumber,
        totalGuesses,
        winner,
        gameWon,
        players,
        playerGuesses,
        hasJoined,

        // Actions
        startGame,
        joinGame,
        makeGuess,
        resetGame,
        fetchGameData,

        // Utils
        isGameMaster: address === gameMaster,
        canStartGame: address === gameMaster && gameStatus === 0,
        canJoinGame: gameStatus === 1 && !hasJoined,
        canMakeGuess: gameStatus === 1 && hasJoined,
        canResetGame: address === gameMaster,
    };
}
