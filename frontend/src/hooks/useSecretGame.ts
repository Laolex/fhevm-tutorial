import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

// Contract ABI (simplified for this example)
const SECRET_GAME_ABI = [
    'function gameMaster() view returns (address)',
    'function gameId() view returns (uint256)',
    'function getGameStatus() view returns (uint8)',
    'function getPlayerCount() view returns (uint256)',
    'function getPlayers() view returns (address[])',
    'function startGame(bytes calldata _secretNumber) external',
    'function joinGame() external',
    'function makeGuess(bytes calldata _guess) external',
    'function checkWinner(address player) view returns (bool)',
    'function resetGame() external',
    'event GameCreated(uint256 indexed gameId, address indexed gameMaster)',
    'event PlayerJoined(address indexed player)',
    'event GameFinished(address indexed winner, uint8 secretNumber)',
];

export function useSecretGame() {
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const [gameStatus, setGameStatus] = useState<number>(0);
    const [gameMaster, setGameMaster] = useState<string>('');
    const [gameId, setGameId] = useState<string>('0');
    const [playerCount, setPlayerCount] = useState<number>(0);
    const [players, setPlayers] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalGuesses, setTotalGuesses] = useState<number>(0);
    const [playerGuesses, setPlayerGuesses] = useState<{ [key: string]: number[] }>({});
    const [gameWon, setGameWon] = useState<boolean>(false);
    const [winner, setWinner] = useState<string>('');

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    // For tutorial purposes, we'll simulate the contract
    const contract = contractAddress ? {
        address: contractAddress as `0x${string}`,
        abi: SECRET_GAME_ABI,
        publicClient,
    } : null;

    const fetchGameData = useCallback(async () => {


        if (!contract) {

            // For tutorial purposes, simulate game data when no contract is deployed
            setGameStatus(0); // Waiting
            const currentGameMaster = address || '0x0000000000000000000000000000000000000000';
            setGameMaster(currentGameMaster);

            setGameId('1234567890');
            setPlayerCount(0);
            setPlayers([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // For tutorial purposes, we'll simulate game data
            // In a real deployment, this would fetch from the actual contract


            // Simulate game data
            setGameStatus(0); // Waiting
            // Set the current address as game master (first connected address becomes game master)
            const currentGameMaster = address || '0x0000000000000000000000000000000000000000';
            setGameMaster(currentGameMaster);

            setGameId('1234567890');
            setPlayerCount(0);
            setPlayers([]);
        } catch (err) {
            console.error('Failed to fetch game data:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch game data');
        } finally {
            setIsLoading(false);
        }
    }, [contract, address]);

    const startGame = async (encryptedSecretNumber: string) => {


        if (!contract) {

            // For tutorial purposes, simulate the game start


            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update game status to active (1)
            setGameStatus(1);


            // Also update other game state
            setPlayerCount(1); // Game master is now a player
            setPlayers([address || '0x0000000000000000000000000000000000000000']);

            return;
        }

        try {
            // For tutorial purposes, we'll simulate the transaction
            // In a real deployment, this would call the actual contract


            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update game status to active (1)
            setGameStatus(1);


            await fetchGameData();
        } catch (err) {
            console.error('❌ Failed to start game:', err);
            throw err;
        }
    };

    const joinGame = async () => {
        if (!contract) {

            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        }

        try {
            // For tutorial purposes, we'll simulate the transaction


            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchGameData();
        } catch (err) {
            console.error('Failed to join game:', err);
            throw err;
        }
    };

    const makeGuess = async (encryptedGuess: string, actualGuess: number) => {


        if (!address) {
            throw new Error('Wallet not connected');
        }

        if (!contract) {


            // Simulate the guessing logic
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update guess tracking
            const currentPlayerGuesses = playerGuesses[address] || [];
            const newPlayerGuesses = [...currentPlayerGuesses, actualGuess];
            setPlayerGuesses(prev => ({
                ...prev,
                [address]: newPlayerGuesses
            }));

            // Increment total guesses
            setTotalGuesses(prev => prev + 1);

            console.log('✅ Guess recorded:', {
                player: address,
                guess: actualGuess,
                totalGuesses: totalGuesses + 1,
                playerGuesses: newPlayerGuesses.length
            });

            return;
        }

        try {
            // For tutorial purposes, we'll simulate the transaction


            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchGameData();
        } catch (err) {
            console.error('Failed to make guess:', err);
            throw err;
        }
    };

    const checkWinner = async (playerAddress: string): Promise<boolean> => {
        if (!contract) {
            // Simulation mode - check if the guess matches the total
            const playerGuess = playerGuesses[playerAddress];
            if (playerGuess && playerGuess.length > 0) {
                const lastGuess = playerGuess[playerGuess.length - 1];
                const isWinner = lastGuess === totalGuesses;

                if (isWinner) {
                    setGameWon(true);
                    setWinner(playerAddress);
                    setGameStatus(2); // Game finished

                }

                return isWinner;
            }
            return false;
        }

        try {
            const result = await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: SECRET_GAME_ABI,
                functionName: 'checkWinner',
                args: [playerAddress as `0x${string}`]
            });
            return Boolean(result);
        } catch (err) {
            console.error('Failed to check winner:', err);
            throw err;
        }
    };

    const resetGame = async () => {
        if (!contract) {

            await new Promise(resolve => setTimeout(resolve, 1000));
            setGameStatus(0);
            return;
        }

        try {
            // For tutorial purposes, we'll simulate the transaction


            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchGameData();
        } catch (err) {
            console.error('Failed to reset game:', err);
            throw err;
        }
    };

    // Set up event listeners
    useEffect(() => {


        // Always fetch game data, even without contract (for simulation mode)
        fetchGameData();

        // Set up polling for game data (only if we have a contract)
        if (contract && publicClient) {
            const interval = setInterval(() => {

                fetchGameData();
            }, 5000);

            return () => {

                clearInterval(interval);
            };
        }
    }, [contract, publicClient, address]);

    // Also fetch data when component mounts
    useEffect(() => {

        fetchGameData();
    }, []);

    // Update game master when address changes
    useEffect(() => {
        if (address) {

            setGameMaster(address);
        }
    }, [address]);

    // Also set game master on initial load
    useEffect(() => {
        if (address && !gameMaster) {

            setGameMaster(address);
        }
    }, [address, gameMaster]);

    // Computed properties
    const hasJoined = players.includes(address || '');
    const canJoinGame = gameStatus === 1 && !hasJoined;
    const canMakeGuess = gameStatus === 1 && hasJoined && !gameWon;

    return {
        gameStatus,
        gameMaster,
        gameId,
        playerCount,
        players,
        isLoading,
        error,
        totalGuesses,
        playerGuesses,
        gameWon,
        winner,
        hasJoined,
        canJoinGame,
        canMakeGuess,
        startGame,
        joinGame,
        makeGuess,
        checkWinner,
        resetGame,
        refreshGameData: fetchGameData,
    };
}
