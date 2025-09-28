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
        console.log('🔄 Fetching game data...', { contract: !!contract, address });

        if (!contract) {
            console.log('⚠️ Contract not available - using tutorial simulation mode');
            // For tutorial purposes, simulate game data when no contract is deployed
            setGameStatus(0); // Waiting
            const currentGameMaster = address || '0x0000000000000000000000000000000000000000';
            setGameMaster(currentGameMaster);
            console.log('🎮 Setting game master to:', currentGameMaster, 'for address:', address);
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
            console.log('Simulating game data fetch');

            // Simulate game data
            setGameStatus(0); // Waiting
            // Set the current address as game master (first connected address becomes game master)
            const currentGameMaster = address || '0x0000000000000000000000000000000000000000';
            setGameMaster(currentGameMaster);
            console.log('🎮 Setting game master to:', currentGameMaster);
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
        console.log('🎮 Starting game with encrypted secret:', encryptedSecretNumber);

        if (!contract) {
            console.log('⚠️ Contract not available - using tutorial simulation mode');
            // For tutorial purposes, simulate the game start
            console.log('✅ Simulating startGame transaction...');

            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update game status to active (1)
            setGameStatus(1);
            console.log('🎯 Game status updated to active (1)');

            // Also update other game state
            setPlayerCount(1); // Game master is now a player
            setPlayers([address || '0x0000000000000000000000000000000000000000']);

            return;
        }

        try {
            // For tutorial purposes, we'll simulate the transaction
            // In a real deployment, this would call the actual contract
            console.log('✅ Simulating startGame transaction...');

            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Update game status to active (1)
            setGameStatus(1);
            console.log('🎯 Game status updated to active (1)');

            await fetchGameData();
        } catch (err) {
            console.error('❌ Failed to start game:', err);
            throw err;
        }
    };

    const joinGame = async () => {
        if (!contract) {
            console.log('⚠️ Contract not available - simulating joinGame');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return;
        }

        try {
            // For tutorial purposes, we'll simulate the transaction
            console.log('Simulating joinGame transaction');

            // Simulate successful transaction
            await new Promise(resolve => setTimeout(resolve, 1000));
            await fetchGameData();
        } catch (err) {
            console.error('Failed to join game:', err);
            throw err;
        }
    };

    const makeGuess = async (encryptedGuess: string, actualGuess: number) => {
        console.log('🎯 Making guess:', { encryptedGuess, actualGuess, address });

        if (!address) {
            throw new Error('Wallet not connected');
        }

        if (!contract) {
            console.log('⚠️ Contract not available - simulating makeGuess with:', encryptedGuess);

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
            console.log('Simulating makeGuess transaction with encrypted guess:', encryptedGuess);

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
                    console.log('🎉 Winner found!', { player: playerAddress, correctGuess: lastGuess, totalGuesses });
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
            console.log('⚠️ Contract not available - simulating resetGame');
            await new Promise(resolve => setTimeout(resolve, 1000));
            setGameStatus(0);
            return;
        }

        try {
            // For tutorial purposes, we'll simulate the transaction
            console.log('Simulating resetGame transaction');

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
        console.log('Setting up game data fetching...', { contract: !!contract, publicClient: !!publicClient, address });

        // Always fetch game data, even without contract (for simulation mode)
        fetchGameData();

        // Set up polling for game data (only if we have a contract)
        if (contract && publicClient) {
            const interval = setInterval(() => {
                console.log('Polling for game data...');
                fetchGameData();
            }, 5000);

            return () => {
                console.log('Cleaning up game data polling...');
                clearInterval(interval);
            };
        }
    }, [contract, publicClient, address]);

    // Also fetch data when component mounts
    useEffect(() => {
        console.log('Component mounted, fetching initial game data...');
        fetchGameData();
    }, []);

    // Update game master when address changes
    useEffect(() => {
        if (address) {
            console.log('🎮 Address changed, updating game master to:', address);
            setGameMaster(address);
        }
    }, [address]);

    // Also set game master on initial load
    useEffect(() => {
        if (address && !gameMaster) {
            console.log('🎮 Setting initial game master to:', address);
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
