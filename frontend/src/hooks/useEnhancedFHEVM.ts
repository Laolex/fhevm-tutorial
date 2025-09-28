import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

// Enhanced Regular contract ABI (works on Sepolia)
const ENHANCED_REGULAR_ABI = [
    // Game state
    {
        "inputs": [],
        "name": "gameMaster",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "gameId",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "gameStatus",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxPlayers",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "minRange",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "maxRange",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalGuesses",
        "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "winner",
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "gameWon",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Player data
    {
        "inputs": [],
        "name": "getPlayers",
        "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
        "name": "getPlayerTotalGuesses",
        "outputs": [{ "internalType": "uint8[]", "name": "", "type": "uint8[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
        "name": "getPlayerSecretGuessesCount",
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "player", "type": "address" }],
        "name": "hasJoined",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Game actions
    {
        "inputs": [
            { "internalType": "uint8", "name": "_maxPlayers", "type": "uint8" },
            { "internalType": "uint8", "name": "_minRange", "type": "uint8" },
            { "internalType": "uint8", "name": "_maxRange", "type": "uint8" }
        ],
        "name": "startGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "joinGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint8", "name": "_totalGuessPrediction", "type": "uint8" },
            { "internalType": "uint8", "name": "_secretNumberGuess", "type": "uint8" }
        ],
        "name": "makeGuess",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "resetGame",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },

    // Utility
    {
        "inputs": [],
        "name": "getGameInfo",
        "outputs": [
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "uint256", "name": "", "type": "uint256" },
            { "internalType": "uint8", "name": "", "type": "uint8" },
            { "internalType": "uint8", "name": "", "type": "uint8" },
            { "internalType": "uint8", "name": "", "type": "uint8" },
            { "internalType": "uint8", "name": "", "type": "uint8" },
            { "internalType": "uint8", "name": "", "type": "uint8" },
            { "internalType": "address", "name": "", "type": "address" },
            { "internalType": "bool", "name": "", "type": "bool" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "canJoin",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "canMakeGuess",
        "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    },

    // Events
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" },
            { "indexed": true, "internalType": "address", "name": "gameMaster", "type": "address" },
            { "indexed": false, "internalType": "uint8", "name": "maxPlayers", "type": "uint8" },
            { "indexed": false, "internalType": "uint8", "name": "minRange", "type": "uint8" },
            { "indexed": false, "internalType": "uint8", "name": "maxRange", "type": "uint8" }
        ],
        "name": "GameStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }
        ],
        "name": "PlayerJoined",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "player", "type": "address" },
            { "indexed": false, "internalType": "uint8", "name": "totalGuess", "type": "uint8" },
            { "indexed": false, "internalType": "uint256", "name": "totalGuesses", "type": "uint256" }
        ],
        "name": "GuessMade",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "address", "name": "winner", "type": "address" },
            { "indexed": false, "internalType": "uint8", "name": "secretNumber", "type": "uint8" },
            { "indexed": false, "internalType": "uint8", "name": "totalGuesses", "type": "uint8" }
        ],
        "name": "GameWon",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "internalType": "uint256", "name": "gameId", "type": "uint256" }
        ],
        "name": "GameReset",
        "type": "event"
    }
];

export function useEnhancedFHEVM() {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [gameMaster, setGameMaster] = useState<string>(
        process.env.NEXT_PUBLIC_DEFAULT_GAME_MASTER || '0x0000000000000000000000000000000000000000'
    );
    const [gameId, setGameId] = useState<string>('1');
    const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
    const [gameStatus, setGameStatus] = useState<number>(0); // 0: Waiting, 1: Active, 2: Finished
    const [maxPlayers, setMaxPlayers] = useState<number>(0);
    const [minRange, setMinRange] = useState<number>(1);
    const [maxRange, setMaxRange] = useState<number>(100);
    const [totalGuesses, setTotalGuesses] = useState<number>(0);
    const [winner, setWinner] = useState<string>('');
    const [gameWon, setGameWon] = useState<boolean>(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [playerTotalGuesses, setPlayerTotalGuesses] = useState<Record<string, number[]>>({});
    const [hasJoined, setHasJoined] = useState<boolean>(false);
    const [canJoin, setCanJoin] = useState<boolean>(false);
    const [canMakeGuess, setCanMakeGuess] = useState<boolean>(false);

    // FHEVM state
    const [fhevmInstance, setFhevmInstance] = useState<any>(null);
    const [isFHEVMReady, setIsFHEVMReady] = useState<boolean>(false);
    const [lastEncryptedValue, setLastEncryptedValue] = useState<string>('');
    const [lastDecryptedValue, setLastDecryptedValue] = useState<string>('');

    // Get contract instance
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
    const contract = contractAddress && publicClient ? {
        address: contractAddress,
        abi: ENHANCED_REGULAR_ABI,
    } : null;

    // Debug contract creation
    console.log('🔧 Contract Debug:', {
        contractAddress,
        hasPublicClient: !!publicClient,
        hasContract: !!contract,
        contractAddressLength: contractAddress?.length
    });

    // Initialize FHEVM
    const initializeFHEVM = useCallback(async () => {
        try {
            if (typeof window === 'undefined') return;

            console.log('🔐 Initializing FHEVM with Zama Relayer SDK...');

            if (!contractAddress) {
                console.log('⚠️ No contract address available, using simulation mode');
                setIsFHEVMReady(true);
                return;
            }

            // For now, use simulation mode since Zama Relayer SDK has import issues
            // In a production environment, you would use the real FHEVM SDK
            console.log('🔄 Using simulation mode for demo purposes');
            setIsFHEVMReady(true);

            // Simulate FHEVM instance
            const mockInstance = {
                simulationMode: true,
                createEncryptedInput: async (address: string, value: number) => {
                    return `simulated_encrypted_${value}_${address}`;
                }
            };
            setFhevmInstance(mockInstance);

            console.log('✅ FHEVM simulation mode initialized successfully');
        } catch (err) {
            console.error('Failed to initialize FHEVM:', err);
            console.log('🔄 Falling back to simulation mode');
            setIsFHEVMReady(true); // Allow simulation mode
        }
    }, [contractAddress]);

    // Encrypt number for FHEVM
    const encryptNumber = useCallback(async (number: number): Promise<string> => {
        try {
            if (!fhevmInstance || !contractAddress) {
                console.log('🔄 FHEVM not available, using simulation');
                const simulated = `simulated_encrypted_${number}`;
                setLastEncryptedValue(simulated);
                setLastDecryptedValue(number.toString());
                return simulated;
            }

            console.log('🔐 Encrypting number:', number);

            // Create encrypted input using the proper FHEVM API
            const encryptedInput = await fhevmInstance.createEncryptedInput(contractAddress, number);
            const encryptedHex = encryptedInput.toString();

            setLastEncryptedValue(encryptedHex);
            setLastDecryptedValue(number.toString());

            console.log('✅ Number encrypted successfully');
            return encryptedHex;
        } catch (err) {
            console.error('Failed to encrypt number:', err);
            // Fallback to simulation if encryption fails
            const simulated = `simulated_encrypted_${number}`;
            setLastEncryptedValue(simulated);
            setLastDecryptedValue(number.toString());
            return simulated;
        }
    }, [fhevmInstance, contractAddress]);

    const fetchGameData = useCallback(async () => {
        console.log('🔄 Fetching enhanced game data...', {
            contract: !!contract,
            address,
            contractAddress,
            publicClient: !!publicClient,
            isOfflineMode
        });

        // If in offline mode, use demo data
        if (isOfflineMode) {
            console.log('🔄 Using offline demo data');
            setGameMaster(process.env.NEXT_PUBLIC_DEFAULT_GAME_MASTER || '0x0000000000000000000000000000000000000000');
            setGameId('1');
            setGameStatus(1); // Active game
            setMaxPlayers(4);
            setMinRange(1);
            setMaxRange(100);
            setTotalGuesses(0);
            setPlayers(address ? [address] : []);
            setHasJoined(!!address);
            setError(null);
            setIsLoading(false);
            return;
        }

        if (!contract || !publicClient) {
            console.log('⚠️ No contract or client available - switching to offline mode', {
                contract: !!contract,
                publicClient: !!publicClient,
                contractAddress
            });
            setIsOfflineMode(true);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Fetch game info with timeout protection
            const gameInfo = await Promise.race([
                publicClient.readContract({
                    address: contractAddress,
                    abi: ENHANCED_REGULAR_ABI,
                    functionName: 'getGameInfo'
                }),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Contract call timeout after 10 seconds')), 10000)
                )
            ]);

            const [
                _gameMaster, _gameId, _gameStatus, _maxPlayers,
                _minRange, _maxRange, _totalGuesses, _winner, _gameWon, _playerCount
            ] = gameInfo as [string, bigint, number, number, number, number, number, string, boolean, bigint];

            setGameMaster(_gameMaster);
            setGameId(_gameId.toString());
            setGameStatus(_gameStatus);
            setMaxPlayers(_maxPlayers);
            setMinRange(_minRange);
            setMaxRange(_maxRange);
            setTotalGuesses(_totalGuesses);
            setWinner(_winner);
            setGameWon(_gameWon);

            // Fetch players
            const playersList = await publicClient.readContract({
                address: contractAddress,
                abi: ENHANCED_REGULAR_ABI,
                functionName: 'getPlayers'
            }) as string[];

            setPlayers(playersList);

            // Check if current user has joined (only if address is available)
            if (address) {
                const joined = await publicClient.readContract({
                    address: contractAddress,
                    abi: ENHANCED_REGULAR_ABI,
                    functionName: 'hasJoined',
                    args: [address]
                }) as boolean;

                setHasJoined(joined);

                // Check permissions
                const canJoinResult = await publicClient.readContract({
                    address: contractAddress,
                    abi: ENHANCED_REGULAR_ABI,
                    functionName: 'canJoin'
                }) as boolean;

                const canMakeGuessResult = await publicClient.readContract({
                    address: contractAddress,
                    abi: ENHANCED_REGULAR_ABI,
                    functionName: 'canMakeGuess'
                }) as boolean;

                setCanJoin(canJoinResult);
                setCanMakeGuess(canMakeGuessResult);

                // Fetch player's total guesses if joined
                if (joined) {
                    const guesses = await publicClient.readContract({
                        address: contractAddress,
                        abi: ENHANCED_REGULAR_ABI,
                        functionName: 'getPlayerTotalGuesses',
                        args: [address]
                    }) as bigint[];

                    setPlayerTotalGuesses(prev => ({
                        ...prev,
                        [address]: guesses.map(g => Number(g))
                    }));
                }
            } else {
                // Reset user-specific state when no address
                setHasJoined(false);
                setCanJoin(false);
                setCanMakeGuess(false);
            }

            console.log('✅ Enhanced game data fetched successfully:', {
                gameMaster: _gameMaster,
                gameStatus: _gameStatus,
                maxPlayers: _maxPlayers,
                range: `${_minRange}-${_maxRange}`,
                totalGuesses: _totalGuesses,
                players: playersList.length,
                hasJoined: hasJoined
            });

        } catch (err) {
            console.error('Failed to fetch game data:', err);

            // Handle different types of errors with specific categorization
            if (err instanceof Error) {
                if (err.message.includes('timeout') || err.message.includes('Contract call timeout')) {
                    console.log('🔄 Network timeout detected - switching to offline demo mode');
                    setIsOfflineMode(true);
                    setError('Network timeout - using demo mode for testing');
                } else if (err.message.includes('Internal error') || err.message.includes('execution reverted')) {
                    console.log('🔄 Contract execution error - switching to offline demo mode');
                    setIsOfflineMode(true);
                    setError('Contract error - using demo mode for testing');
                } else if (err.message.includes('network') || err.message.includes('connection')) {
                    console.log('🔄 Network connection issues - switching to offline demo mode');
                    setIsOfflineMode(true);
                    setError('Network connection issues - using demo mode for testing');
                } else if (err.message.includes('user rejected') || err.message.includes('User denied')) {
                    setError('Transaction was rejected by user');
                } else if (err.message.includes('insufficient funds')) {
                    setError('Insufficient funds for transaction');
                } else {
                    setError(`Failed to fetch game data: ${err.message}`);
                }
            } else {
                setError('Failed to fetch game data - unknown error');
            }

            // Set fallback values to prevent UI breaking
            setGameStatus(0);
            setMaxPlayers(0);
            setMinRange(0);
            setMaxRange(0);
            setTotalGuesses(0);
            setPlayers([]);

            // Set a default game master if we can't fetch it
            if (contractAddress) {
                // Try to get the deployer address from the contract address
                // This is a fallback when we can't read from the contract
                setGameMaster(process.env.NEXT_PUBLIC_DEFAULT_GAME_MASTER || '0x0000000000000000000000000000000000000000');
                setGameId('1');
            }
        } finally {
            setIsLoading(false);
        }
    }, [contract, publicClient, address, contractAddress]);

    const startGame = async (maxPlayers: number, minRange: number, maxRange: number) => {
        console.log('🎮 Starting enhanced game:', { maxPlayers, minRange, maxRange });

        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: ENHANCED_REGULAR_ABI,
                functionName: 'startGame',
                args: [maxPlayers, minRange, maxRange]
            });

            console.log('✅ Enhanced game started, transaction hash:', hash);

            await publicClient.waitForTransactionReceipt({ hash });
            await fetchGameData();

        } catch (err) {
            console.error('Failed to start game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const joinGame = async () => {
        console.log('🎮 Joining enhanced game...');

        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: ENHANCED_REGULAR_ABI,
                functionName: 'joinGame'
            });

            console.log('✅ Joined enhanced game, transaction hash:', hash);

            await publicClient.waitForTransactionReceipt({ hash });
            await fetchGameData();

        } catch (err) {
            console.error('Failed to join game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const makeGuess = async (totalGuessPrediction: number, secretNumberGuess: number) => {
        console.log('🎯 Making enhanced dual guess:', { totalGuessPrediction, secretNumberGuess });

        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            // For regular contract, we pass the secret number directly (not encrypted)
            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: ENHANCED_REGULAR_ABI,
                functionName: 'makeGuess',
                args: [totalGuessPrediction, secretNumberGuess]
            });

            console.log('✅ Enhanced dual guess made, transaction hash:', hash);

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
        console.log('🔄 Resetting enhanced game...');

        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: ENHANCED_REGULAR_ABI,
                functionName: 'resetGame'
            });

            console.log('✅ Enhanced game reset, transaction hash:', hash);

            await publicClient.waitForTransactionReceipt({ hash });
            await fetchGameData();

        } catch (err) {
            console.error('Failed to reset game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Initialize FHEVM on mount
    useEffect(() => {
        initializeFHEVM();
    }, [initializeFHEVM]);

    // Set up data fetching
    useEffect(() => {
        if (contract && publicClient) {
            fetchGameData();

            // Set up polling for game updates
            const interval = setInterval(() => {
                fetchGameData();
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [contract, publicClient, fetchGameData]);

    return {
        // State
        isLoading,
        error,
        gameMaster,
        gameId,
        gameStatus,
        maxPlayers,
        minRange,
        maxRange,
        totalGuesses,
        winner,
        gameWon,
        players,
        playerTotalGuesses,
        hasJoined,
        canJoin,
        canMakeGuess,

        // FHEVM State
        fhevmInstance,
        isFHEVMReady,
        lastEncryptedValue,
        lastDecryptedValue,
        isOfflineMode,

        // Actions
        startGame,
        joinGame,
        makeGuess,
        resetGame,
        fetchGameData,
        encryptNumber,

        // Utils
        isGameMaster: address === gameMaster,
        canStartGame: address === gameMaster && gameStatus === 0,
    };
}
