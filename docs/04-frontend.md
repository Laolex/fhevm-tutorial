# Creating the Frontend 🎨

## Overview

Our React frontend provides a beautiful, intuitive interface for interacting with our FHEVM smart contract. It handles wallet connection, FHEVM initialization, and the complete encryption/decryption workflow.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Wagmi** - Ethereum interaction
- **RainbowKit** - Wallet connection
- **fhevmjs** - FHEVM JavaScript library

## Project Structure

```
frontend/src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main game page
│   ├── providers.tsx       # Wallet and FHEVM providers
│   └── globals.css         # Global styles
├── components/
│   ├── GameHeader.tsx      # Header with wallet connection
│   ├── GameStatus.tsx      # Game status display
│   ├── GameMasterPanel.tsx # Game master controls
│   └── PlayerPanel.tsx     # Player controls
└── hooks/
    ├── useFHEVM.ts         # FHEVM integration
    └── useSecretGame.ts    # Smart contract interaction
```

## Core Components

### 1. **FHEVM Hook (`useFHEVM.ts`)**

This hook manages FHEVM initialization and encryption/decryption:

```typescript
export function useFHEVM() {
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [isFHEVMReady, setIsFHEVMReady] = useState(false);

  const initializeFHEVM = async () => {
    const instance = await createInstance({
      chainId: 8009, // Zama Testnet
      publicKey: {
        algorithm: 'TFHE',
        hash: 'sha256',
      },
    });
    setFhevmInstance(instance);
    setIsFHEVMReady(true);
  };

  const encryptNumber = (number: number): string => {
    return fhevmInstance.encrypt8(number);
  };

  const decryptNumber = (encryptedNumber: string): number => {
    return fhevmInstance.decrypt(encryptedNumber);
  };
}
```

**Key Features:**
- Initializes FHEVM instance for Zama Testnet
- Provides encryption/decryption functions
- Handles errors gracefully
- Manages loading states

### 2. **Smart Contract Hook (`useSecretGame.ts`)**

This hook manages all smart contract interactions:

```typescript
export function useSecretGame() {
  const contract = useContract({
    address: contractAddress,
    abi: SECRET_GAME_ABI,
    signerOrProvider: provider,
  });

  const startGame = async (encryptedSecretNumber: string) => {
    const tx = await contract.startGame(encryptedSecretNumber);
    await tx.wait();
    await fetchGameData();
  };

  const makeGuess = async (encryptedGuess: string) => {
    const tx = await contract.makeGuess(encryptedGuess);
    await tx.wait();
    await fetchGameData();
  };
}
```

**Key Features:**
- Manages contract state (game status, players, etc.)
- Handles all contract transactions
- Listens for contract events
- Provides real-time updates

### 3. **Game Master Panel**

The game master can start games and manage the contract:

```typescript
const handleStartGame = async () => {
  const number = parseInt(secretNumber);
  const encryptedNumber = encryptNumber(number);
  await startGame(encryptedNumber);
};
```

**Features:**
- Input validation (1-100 range)
- Encrypted number submission
- Real-time status updates
- Error handling

### 4. **Player Panel**

Players can join games and make encrypted guesses:

```typescript
const handleMakeGuess = async () => {
  const number = parseInt(guess);
  const encryptedGuess = encryptNumber(number);
  await makeGuess(encryptedGuess);
};
```

**Features:**
- Join game functionality
- Encrypted guess submission
- Winner checking
- Status-based UI updates

## FHEVM Integration Flow

### 1. **Initialization**
```typescript
useEffect(() => {
  if (isConnected && !isInitialized) {
    initializeFHEVM().then(() => {
      setIsInitialized(true);
    });
  }
}, [isConnected, isInitialized, initializeFHEVM]);
```

### 2. **Encryption**
```typescript
const encryptNumber = (number: number): string => {
  if (number < 1 || number > 100) {
    throw new Error('Number must be between 1 and 100');
  }
  return fhevmInstance.encrypt8(number);
};
```

### 3. **Transaction Submission**
```typescript
const startGame = async (encryptedSecretNumber: string) => {
  const tx = await contract.startGame(encryptedSecretNumber);
  await tx.wait();
  await fetchGameData();
};
```

### 4. **Event Listening**
```typescript
contract.on('GameFinished', (winner, secretNumber) => {
  console.log('Game finished!', winner, secretNumber);
  fetchGameData();
});
```

## UI/UX Design

### 1. **Responsive Design**
- Mobile-first approach
- Tailwind CSS for styling
- Grid layouts for different screen sizes

### 2. **State-Based UI**
```typescript
{gameStatus === 0 && (
  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p className="text-yellow-800 font-medium">
      ⏳ Waiting for Game Master
    </p>
  </div>
)}
```

### 3. **Loading States**
```typescript
<button
  onClick={handleStartGame}
  disabled={isLoading}
  className="btn-primary w-full"
>
  {isLoading ? 'Starting Game...' : 'Start Game'}
</button>
```

### 4. **Error Handling**
```typescript
{error && (
  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
    <p className="text-red-800 text-sm">{error}</p>
  </div>
)}
```

## Wallet Integration

### 1. **RainbowKit Setup**
```typescript
const { connectors } = getDefaultWallets({
  appName: 'Hello FHEVM Tutorial',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID,
  chains,
});
```

### 2. **Network Configuration**
```typescript
const zamaTestnet = {
  id: 8009,
  name: 'Zama Testnet',
  network: 'zama-testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Zama',
    symbol: 'ZAMA',
  },
  rpcUrls: {
    default: { http: ['https://devnet.zama.ai'] },
  },
};
```

### 3. **Connection Handling**
```typescript
const { address, isConnected } = useAccount();

if (!isConnected) {
  return <ConnectButton />;
}
```

## Styling with Tailwind

### 1. **Custom Components**
```css
.btn-primary {
  @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
}

.card {
  @apply bg-white rounded-xl shadow-lg border border-gray-200 p-6;
}
```

### 2. **Status Badges**
```css
.status-active {
  @apply bg-green-100 text-green-800;
}

.status-waiting {
  @apply bg-yellow-100 text-yellow-800;
}
```

### 3. **Animations**
```css
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
```

## Error Handling

### 1. **FHEVM Errors**
```typescript
try {
  const encryptedNumber = encryptNumber(number);
  await startGame(encryptedNumber);
} catch (err) {
  setError(err instanceof Error ? err.message : 'Failed to start game');
}
```

### 2. **Contract Errors**
```typescript
try {
  const tx = await contract.startGame(encryptedNumber);
  await tx.wait();
} catch (err) {
  if (err.message.includes('Game already started')) {
    setError('Game is already active');
  } else {
    setError('Failed to start game');
  }
}
```

### 3. **Network Errors**
```typescript
if (!isConnected) {
  return <div>Please connect your wallet</div>;
}

if (!isFHEVMReady) {
  return <div>Initializing FHEVM...</div>;
}
```

## Performance Optimization

### 1. **Event Polling**
```typescript
useEffect(() => {
  const interval = setInterval(fetchGameData, 5000);
  return () => clearInterval(interval);
}, [contract]);
```

### 2. **Conditional Rendering**
```typescript
{gameStatus === 1 && hasJoined && (
  <div>Game is active and you've joined!</div>
)}
```

### 3. **Memoization**
```typescript
const gameStatusInfo = useMemo(() => {
  return getStatusInfo(gameStatus);
}, [gameStatus]);
```

## Testing the Frontend

### 1. **Manual Testing**
- Connect wallet to Zama Testnet
- Start a game as game master
- Join as a player
- Make guesses and verify encryption

### 2. **Browser DevTools**
- Check network requests
- Monitor console for errors
- Verify contract interactions

### 3. **Mobile Testing**
- Test responsive design
- Verify wallet connection on mobile
- Check touch interactions

## Next Steps

Now that you have a complete frontend, let's deploy everything and test the full application!

**Ready to deploy?** Let's move to [Testing and Deployment](05-deployment.md) 🚀
