import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { ethers } from 'ethers';

// Extend Window interface to include ethereum
declare global {
    interface Window {
        ethereum?: {
            request: (args: { method: string; params?: any[] }) => Promise<any>;
        };
    }
}

// Game Master Contract ABI
const GAME_MASTER_ABI = [
    // Game Master functions
    {
        "type": "function",
        "name": "claimGameMaster",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "startGame",
        "inputs": [
            { "name": "_maxPlayers", "type": "uint8" },
            { "name": "_minRange", "type": "uint8" },
            { "name": "_maxRange", "type": "uint8" },
            { "name": "_maxGuessesPerPlayer", "type": "uint8" },
            { "name": "_speedBonusThreshold", "type": "uint8" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "activateGame",
        "inputs": [],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "resetGame",
        "inputs": [{ "name": "_gameId", "type": "uint256" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "endGame",
        "inputs": [{ "name": "_gameId", "type": "uint256" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    },

    // Player functions
    {
        "type": "function",
        "name": "joinGameWithInvite",
        "inputs": [{ "name": "_inviteCode", "type": "string" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "joinGame",
        "inputs": [{ "name": "_gameId", "type": "uint256" }],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "makeGuess",
        "inputs": [
            { "name": "_gameId", "type": "uint256" },
            { "name": "_totalGuessPrediction", "type": "uint8" },
            { "name": "_secretNumberGuess", "type": "uint8" }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },

    // View functions
    {
        "type": "function",
        "name": "isGameMaster",
        "inputs": [{ "name": "", "type": "address" }],
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hasActiveGame",
        "inputs": [{ "name": "", "type": "address" }],
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "gameMasterGameId",
        "inputs": [{ "name": "", "type": "address" }],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view"
    },
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
            { "name": "playerCount", "type": "uint256" },
            { "name": "maxGuessesPerPlayer", "type": "uint8" },
            { "name": "winType", "type": "uint8" },
            { "name": "closestGuesser", "type": "address" },
            { "name": "closestGuess", "type": "uint8" },
            { "name": "speedBonusThreshold", "type": "uint8" },
            { "name": "hintsGiven", "type": "uint8" },
            { "name": "gameStartTime", "type": "uint256" }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getPlayers",
        "inputs": [{ "name": "_gameId", "type": "uint256" }],
        "outputs": [{ "name": "", "type": "address[]" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "hasPlayerJoined",
        "inputs": [
            { "name": "_gameId", "type": "uint256" },
            { "name": "_player", "type": "address" }
        ],
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "canJoinGame",
        "inputs": [{ "name": "_gameId", "type": "uint256" }],
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "canMakeGuess",
        "inputs": [{ "name": "_gameId", "type": "uint256" }],
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getGameIdByInviteCode",
        "inputs": [{ "name": "_inviteCode", "type": "string" }],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getPlayerGuessCount",
        "inputs": [
            { "name": "_gameId", "type": "uint256" },
            { "name": "_player", "type": "address" }
        ],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getSecretNumber",
        "inputs": [{ "name": "_gameId", "type": "uint256" }],
        "outputs": [{ "name": "", "type": "uint8" }],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "nextGameId",
        "inputs": [],
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "view"
    },

    // Events
    {
        "type": "event",
        "name": "GameMasterClaimed",
        "inputs": [{ "name": "gameMaster", "type": "address", "indexed": true }]
    },
    {
        "type": "event",
        "name": "GameCreated",
        "inputs": [
            { "name": "gameId", "type": "uint256", "indexed": true },
            { "name": "gameMaster", "type": "address", "indexed": true },
            { "name": "inviteCode", "type": "string" }
        ]
    },
    {
        "type": "event",
        "name": "PlayerJoined",
        "inputs": [
            { "name": "player", "type": "address", "indexed": true },
            { "name": "gameId", "type": "uint256", "indexed": true }
        ]
    },
    {
        "type": "event",
        "name": "GuessMade",
        "inputs": [
            { "name": "player", "type": "address", "indexed": true },
            { "name": "totalGuess", "type": "uint8" },
            { "name": "secretGuess", "type": "uint8" },
            { "name": "totalGuesses", "type": "uint256" }
        ]
    },
    {
        "type": "event",
        "name": "GameWon",
        "inputs": [
            { "name": "winner", "type": "address", "indexed": true },
            { "name": "secretNumber", "type": "uint8" },
            { "name": "totalGuesses", "type": "uint8" }
        ]
    },
    {
        "type": "event",
        "name": "GameReset",
        "inputs": [{ "name": "gameId", "type": "uint256", "indexed": true }]
    }
] as const;

export function useGameMaster(isPlayerMode: boolean = false) {
    const { address } = useAccount();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    // Debounce tracking
    let lastFetchTime: number | null = null;
    let lastHookCallTime: number | null = null;

    // Throttle hook calls to prevent excessive re-renders
    const now = Date.now();
    const throttleTime = isPlayerMode ? 2000 : 1000; // 2 seconds for players, 1 second for game masters
    if (lastHookCallTime && now - lastHookCallTime < throttleTime) {

        // Return cached values or minimal state
        return {
            isLoading: false,
            error: null,
            isGameMaster: false,
            hasActiveGame: false,
            currentGameId: 0,
            gameInfo: null,
            players: [],
            hasJoined: false,
            canJoin: false,
            canMakeGuess: false,
            claimGameMaster: async () => { },
            startGame: async () => { },
            activateGame: async () => { },
            joinGameWithInvite: async () => { },
            joinGame: async () => { },
            makeGuess: async () => { },
            resetGame: async () => { },
            endGame: async () => { },
            refreshGameMasterStatus: async () => { },
            refreshGameInfo: async () => { },
            getGameIdByInviteCode: async () => 0,
            getPlayerGuessCount: async () => 0,
            publicClient,
            contractAddress: '0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d',
        };
    }
    lastHookCallTime = now;

    // Debug wallet client (only log when values change)
    const [lastDebugState, setLastDebugState] = useState<{
        walletClient: boolean;
        address: string | undefined;
        hasPublicClient: boolean;
    } | null>(null);

    const currentDebugState = {
        walletClient: !!walletClient,
        address,
        hasPublicClient: !!publicClient
    };

    if (!lastDebugState ||
        lastDebugState.walletClient !== currentDebugState.walletClient ||
        lastDebugState.address !== currentDebugState.address ||
        lastDebugState.hasPublicClient !== currentDebugState.hasPublicClient) {

        setLastDebugState(currentDebugState);
    }

    // State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Game Master state
    const [isGameMaster, setIsGameMaster] = useState<boolean>(false);
    const [hasActiveGame, setHasActiveGame] = useState<boolean>(false);
    const [currentGameId, setCurrentGameId] = useState<number>(0);

    // Game state
    const [gameInfo, setGameInfo] = useState<{
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
        maxGuessesPerPlayer: number;
        winType: number; // 1=correct guess, 2=closest guess, 3=speed bonus
        closestGuesser: string;
        closestGuess: number;
        speedBonusThreshold: number;
        hintsGiven: number;
        gameStartTime: number;
    } | null>(null);

    const [players, setPlayers] = useState<string[]>([]);
    const [hasJoined, setHasJoined] = useState<boolean>(false);
    const [canJoin, setCanJoin] = useState<boolean>(false);
    const [canMakeGuess, setCanMakeGuess] = useState<boolean>(false);

    // Get contract instance
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
    const contract = contractAddress && publicClient ? {
        address: contractAddress,
        abi: GAME_MASTER_ABI,
        publicClient,
    } : null;

    // Debug contract setup
    console.log('🔧 Contract Setup:', {
        contractAddress,
        hasPublicClient: !!publicClient,
        hasWalletClient: !!walletClient,
        hasContract: !!contract
    });

    // Fetch user's game master status
    const fetchGameMasterStatus = useCallback(async () => {
        if (!contract || !contractAddress) {

            return;
        }

        // Skip game master status fetching for players
        if (isPlayerMode) {

            return;
        }

        // Get the current connected address from multiple sources
        let currentAddress = address;
        if (!currentAddress && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    currentAddress = accounts[0];

                }
            } catch (err) {
                console.error('Failed to get accounts from MetaMask:', err);
            }
        }

        if (!currentAddress) {

            return;
        }

        try {


            const [isGM, hasActive, gameId] = await Promise.all([
                publicClient.readContract({
                    address: contractAddress,
                    abi: GAME_MASTER_ABI,
                    functionName: 'isGameMaster',
                    args: [currentAddress]
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi: GAME_MASTER_ABI,
                    functionName: 'hasActiveGame',
                    args: [currentAddress]
                }),
                publicClient.readContract({
                    address: contractAddress,
                    abi: GAME_MASTER_ABI,
                    functionName: 'gameMasterGameId',
                    args: [currentAddress]
                })
            ]);

            // Only update state if values have changed
            const newIsGM = Boolean(isGM);
            const newHasActive = Boolean(hasActive);
            const newGameId = Number(gameId as bigint);

            if (newIsGM !== isGameMaster) {
                setIsGameMaster(newIsGM);
            }
            if (newHasActive !== hasActiveGame) {
                setHasActiveGame(newHasActive);
            }
            if (newGameId !== currentGameId) {
                setCurrentGameId(newGameId);
            }

            // If user has an active game, fetch game info
            if (hasActive && Number(gameId as bigint) > 0) {
                await fetchGameInfo(Number(gameId as bigint));
            }
        } catch (err) {
            console.error('Failed to fetch game master status:', err);

            // Handle different types of errors gracefully
            if (err instanceof Error) {
                if (err.message.includes('401') || err.message.includes('HTTP request failed')) {
                    setError('Network connection issue. Please check your internet connection and try again.');
                } else if (err.message.includes('timeout')) {
                    setError('Request timeout. Please try again.');
                } else {
                    setError(`Failed to fetch game master status: ${err.message}`);
                }
            } else {
                setError('Failed to fetch game master status');
            }
        }
    }, [contract, address, publicClient, contractAddress]);

    // Fetch game info with debouncing
    const fetchGameInfo = useCallback(async (gameId: number) => {
        if (!contract || gameId <= 0) {

            return;
        }

        // Debounce rapid successive calls
        const now = Date.now();
        if (lastFetchTime && now - lastFetchTime < 2000) { // 2 second debounce

            return;
        }
        lastFetchTime = now;

        try {


            // Add timeout to prevent hanging requests
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), 15000)
            );

            // First check if the game exists by getting basic info

            const gameInfoResult = await Promise.race([
                publicClient.readContract({
                    address: contractAddress,
                    abi: GAME_MASTER_ABI,
                    functionName: 'getGameInfo',
                    args: [BigInt(gameId)]
                }),
                timeoutPromise
            ]);


            // If we get here, the game exists, now get players

            const playersResult = await Promise.race([
                publicClient.readContract({
                    address: contractAddress,
                    abi: GAME_MASTER_ABI,
                    functionName: 'getPlayers',
                    args: [BigInt(gameId)]
                }),
                timeoutPromise
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
                playerCount,
                maxGuessesPerPlayer,
                winType,
                closestGuesser,
                closestGuess,
                speedBonusThreshold,
                hintsGiven,
                gameStartTime
            ] = gameInfoResult as readonly [string, number, number, number, number, number, string, boolean, string, bigint, number, number, string, number, number, number, bigint];

            setGameInfo({
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
                maxGuessesPerPlayer,
                winType,
                closestGuesser,
                closestGuess,
                speedBonusThreshold,
                hintsGiven,
                gameStartTime: Number(gameStartTime)
            });

            setPlayers(playersResult as string[]);

            // Check player status if address is available
            if (address) {
                try {
                    const [joined, canJoinResult, canGuessResult] = await Promise.all([
                        Promise.race([
                            publicClient.readContract({
                                address: contractAddress,
                                abi: GAME_MASTER_ABI,
                                functionName: 'hasPlayerJoined',
                                args: [BigInt(gameId), address]
                            }),
                            timeoutPromise
                        ]),
                        Promise.race([
                            publicClient.readContract({
                                address: contractAddress,
                                abi: GAME_MASTER_ABI,
                                functionName: 'canJoinGame',
                                args: [BigInt(gameId)]
                            }),
                            timeoutPromise
                        ]),
                        Promise.race([
                            publicClient.readContract({
                                address: contractAddress,
                                abi: GAME_MASTER_ABI,
                                functionName: 'canMakeGuess',
                                args: [BigInt(gameId)]
                            }),
                            timeoutPromise
                        ])
                    ]);

                    console.log('🔍 Contract call results for game', gameId, ':', {
                        address,
                        joined: Boolean(joined),
                        canJoin: Boolean(canJoinResult),
                        canGuess: Boolean(canGuessResult)
                    });

                    setHasJoined(Boolean(joined));
                    setCanJoin(Boolean(canJoinResult));
                    setCanMakeGuess(Boolean(canGuessResult));
                } catch (playerStatusError) {
                    console.error('Failed to fetch player status:', playerStatusError);
                    // Set default values on error
                    setHasJoined(false);
                    setCanJoin(false);
                    setCanMakeGuess(false);
                }
            }
        } catch (err) {
            console.error('Failed to fetch game info:', err);
            if (err instanceof Error) {
                if (err.message.includes('Invalid game ID') || err.message.includes('Game does not exist')) {
                    setError('Game not found. This game may have been deleted or never existed.');
                } else if (err.message.includes('execution reverted')) {
                    setError('Game not found or invalid game ID.');
                } else if (err.message.includes('Internal error')) {
                    setError('Network error. Please check your connection and try again.');
                } else if (err.message.includes('Request timeout')) {
                    setError('Request timed out. Please try again.');
                } else {
                    setError(`Failed to fetch game info: ${err.message}`);
                }
            } else {
                setError('Failed to fetch game info');
            }
            // Clear game info on error
            setGameInfo(null);
            setPlayers([]);
            setHasJoined(false);
            setCanJoin(false);
            setCanMakeGuess(false);
        }
    }, [contract, address, publicClient, contractAddress]);

    // Claim game master status
    const claimGameMaster = async () => {
        if (!contract || !contractAddress) {
            throw new Error('Contract not available');
        }

        // Get the current connected address from multiple sources
        let currentAddress = address;
        if (!currentAddress && window.ethereum) {
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                if (accounts && accounts.length > 0) {
                    currentAddress = accounts[0];

                }
            } catch (err) {
                console.error('Failed to get accounts from MetaMask:', err);
            }
        }

        if (!currentAddress) {
            throw new Error('Wallet not connected. Please connect your wallet first.');
        }

        // Check if we have a wallet client or can use direct MetaMask
        if (!walletClient && !window.ethereum) {
            throw new Error('No wallet available. Please install MetaMask or connect your wallet.');
        }

        try {
            setIsLoading(true);
            setError(null);



            let hash: string;

            if (walletClient) {

                // Use wagmi wallet client
                hash = await walletClient.writeContract({
                    address: contractAddress,
                    abi: GAME_MASTER_ABI,
                    functionName: 'claimGameMaster'
                });
            } else {
                // Fallback to direct MetaMask interaction


                // Check if MetaMask is available
                if (!window.ethereum) {
                    throw new Error('MetaMask not detected. Please install MetaMask.');
                }

                // Encode the function call
                const iface = new ethers.Interface(GAME_MASTER_ABI);
                const data = iface.encodeFunctionData('claimGameMaster', []);

                console.log('📝 Transaction data:', {
                    from: currentAddress,
                    to: contractAddress,
                    data: data
                });

                // Send transaction directly through MetaMask
                const tx = await window.ethereum.request({
                    method: 'eth_sendTransaction',
                    params: [{
                        from: currentAddress,
                        to: contractAddress,
                        data: data,
                        gas: '0x5208', // 21000 gas limit
                    }]
                });
                hash = tx as `0x${string}`;
            }


            await publicClient.waitForTransactionReceipt({ hash: hash as `0x${string}` });

            // Refresh status
            await fetchGameMasterStatus();

        } catch (err) {
            console.error('Failed to claim game master:', err);

            // Provide more specific error messages
            if (err instanceof Error) {
                if (err.message.includes('User rejected')) {
                    throw new Error('Transaction was rejected by user. Please try again.');
                } else if (err.message.includes('insufficient funds')) {
                    throw new Error('Insufficient funds for gas. Please add more ETH to your wallet.');
                } else if (err.message.includes('network')) {
                    throw new Error('Network error. Please check your connection and try again.');
                } else {
                    throw new Error(`Transaction failed: ${err.message}`);
                }
            } else {
                throw new Error('Transaction failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Start a new game
    const startGame = async (maxPlayers: number, minRange: number, maxRange: number, maxGuessesPerPlayer: number, speedBonusThreshold: number) => {
        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);



            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'startGame',
                args: [maxPlayers, minRange, maxRange, maxGuessesPerPlayer, speedBonusThreshold]
            });


            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh status and clear any previous game state
            await fetchGameMasterStatus();

            // Clear any previous game info to prevent routing to old games
            setGameInfo(null);
            setPlayers([]);
            setHasJoined(false);
            setCanJoin(false);
            setCanMakeGuess(false);

        } catch (err) {
            console.error('Failed to start game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Activate the game
    const activateGame = async () => {
        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);



            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'activateGame'
            });


            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh game info
            if (currentGameId > 0) {
                await fetchGameInfo(currentGameId);
            }

        } catch (err) {
            console.error('Failed to activate game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Join game with invite code
    const joinGameWithInvite = async (inviteCode: string) => {
        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);



            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'joinGameWithInvite',
                args: [inviteCode]
            });


            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh status - we need to find the game ID first
            // For now, we'll refresh the game master status
            await fetchGameMasterStatus();

        } catch (err) {
            console.error('Failed to join game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Join game by ID
    const joinGame = async (gameId: number) => {
        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);



            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'joinGame',
                args: [BigInt(gameId)]
            });


            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh game info
            await fetchGameInfo(gameId);

        } catch (err) {
            console.error('Failed to join game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Make a guess
    const makeGuess = async (gameId: number, totalGuess: number, secretGuess: number) => {
        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);



            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'makeGuess',
                args: [BigInt(gameId), totalGuess, secretGuess]
            });


            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh game info
            await fetchGameInfo(gameId);

        } catch (err) {
            console.error('Failed to make guess:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // End game
    const endGame = async (gameId: number) => {
        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get game info before ending to save to history
            const currentGameInfo = gameInfo;

            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'endGame',
                args: [BigInt(gameId)]
            });

            await publicClient.waitForTransactionReceipt({ hash });

            // Add game to history if it was won
            if (currentGameInfo && currentGameInfo.gameWon && currentGameInfo.winner) {
                const gameHistoryItem = {
                    gameId: gameId,
                    gameMaster: currentGameInfo.gameMaster,
                    winner: currentGameInfo.winner,
                    totalGuesses: currentGameInfo.totalGuesses,
                    maxPlayers: currentGameInfo.maxPlayers,
                    playerCount: currentGameInfo.playerCount,
                    winType: currentGameInfo.winType || 1,
                    completedAt: Date.now(),
                    range: { min: currentGameInfo.minRange, max: currentGameInfo.maxRange }
                };

                // Add to history using the global function
                if ((window as any).addGameToHistory) {
                    (window as any).addGameToHistory(gameHistoryItem);
                }
            }

            // Refresh game master status
            await fetchGameMasterStatus();

        } catch (err) {
            console.error('Failed to end game:', err);
            const errorMessage = `Failed to end game: ${err instanceof Error ? err.message : String(err)}`;
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Reset game
    const resetGame = async (gameId: number) => {
        if (!contract || !walletClient || !address) {
            throw new Error('Contract or wallet not available');
        }

        try {
            setIsLoading(true);
            setError(null);



            const hash = await walletClient.writeContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'resetGame',
                args: [BigInt(gameId)]
            });


            await publicClient.waitForTransactionReceipt({ hash });

            // Refresh status
            await fetchGameMasterStatus();

        } catch (err) {
            console.error('Failed to reset game:', err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Get game ID by invite code
    const getGameIdByInviteCode = useCallback(async (inviteCode: string): Promise<number> => {
        if (!contract || !publicClient) {
            throw new Error('Contract not available');
        }

        try {
            const gameId = await publicClient.readContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'getGameIdByInviteCode',
                args: [inviteCode]
            });

            return Number(gameId as bigint);
        } catch (err) {
            console.error('Failed to get game ID by invite code:', err);
            throw err;
        }
    }, [contract, publicClient, contractAddress]);

    // Get player guess count
    const getPlayerGuessCount = useCallback(async (gameId: number, playerAddress: string): Promise<number> => {
        if (!contract || !publicClient) {
            throw new Error('Contract not available');
        }

        try {
            const count = await publicClient.readContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'getPlayerGuessCount',
                args: [BigInt(gameId), playerAddress as `0x${string}`]
            });

            return Number(count as bigint);
        } catch (err) {
            console.error('Failed to get player guess count:', err);
            return 0;
        }
    }, [contract, publicClient, contractAddress]);

    // Get secret number (only for game master after game ends)
    const getSecretNumber = useCallback(async (gameId: number): Promise<number> => {
        if (!contract || !publicClient) {
            throw new Error('Contract not available');
        }

        try {
            const secretNumber = await publicClient.readContract({
                address: contractAddress,
                abi: GAME_MASTER_ABI,
                functionName: 'getSecretNumber',
                args: [BigInt(gameId)]
            });

            return secretNumber as number;
        } catch (err) {
            console.error('Failed to get secret number:', err);
            throw err;
        }
    }, [contract, publicClient, contractAddress]);

    // Initialize and fetch data
    useEffect(() => {
        if (address && contract && !isPlayerMode) {
            fetchGameMasterStatus();
        }
    }, [address, contract, fetchGameMasterStatus, isPlayerMode]);

    return {
        // State
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

        // Actions
        claimGameMaster,
        startGame,
        activateGame,
        joinGameWithInvite,
        joinGame,
        makeGuess,
        endGame,
        resetGame,

        // Utils
        refreshGameMasterStatus: fetchGameMasterStatus,
        refreshGameInfo: fetchGameInfo,
        getGameIdByInviteCode,
        getPlayerGuessCount,
        getSecretNumber,

        // Additional exports for components
        publicClient,
        contractAddress,
    };
}
