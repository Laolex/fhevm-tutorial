# Setting Up Development Environment 🛠️

## Prerequisites

Before we start, make sure you have:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **A code editor** (VS Code recommended)
- **Basic knowledge** of Solidity and React

## Step 1: Clone the Repository

```bash
# Clone the tutorial repository
git clone <your-repo-url>
cd hello-fhevm-tutorial

# Install dependencies
npm run install:all
```

## Step 2: Environment Configuration

Create your environment file:

```bash
# Copy the example environment file
cp env.example .env
```

Edit `.env` with your configuration:

```env
# Zama Testnet Configuration
ZAMA_TESTNET_RPC_URL=https://devnet.zama.ai

# Private Key for deployment (use a testnet key only!)
PRIVATE_KEY=your_private_key_here

# Frontend Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=
NEXT_PUBLIC_ZAMA_TESTNET_RPC_URL=https://devnet.zama.ai
NEXT_PUBLIC_CHAIN_ID=8009
```

### 🔐 Getting a Testnet Private Key

**Important**: Never use your mainnet private key! Create a test wallet:

1. **MetaMask**: Create a new account for testing
2. **Export private key**: Account Details → Export Private Key
3. **Fund with testnet tokens**: Get testnet ZAMA tokens

### 🪙 Getting Testnet Tokens

1. **Visit**: [Zama Testnet Faucet](https://faucet.zama.ai/)
2. **Connect wallet** to Zama Testnet
3. **Request testnet tokens**

## Step 3: Install Dependencies

### Backend Dependencies
```bash
# Install Hardhat and FHEVM dependencies
npm install
```

### Frontend Dependencies
```bash
# Install React and FHEVM frontend dependencies
cd frontend
npm install
cd ..
```

## Step 4: Verify Installation

### Test Hardhat
```bash
# Compile contracts
npm run compile

# Run tests
npm run test
```

### Test Frontend
```bash
# Start development server
npm run dev
```

Visit `http://localhost:3000` - you should see the Hello FHEVM interface!

## Step 5: Configure MetaMask

### Add Sepolia Testnet
1. **Open MetaMask**
2. **Click network dropdown** (top of MetaMask)
3. **Click "Add network"** or "Add network manually"
4. **Enter these exact details**:
   - **Network Name**: `Sepolia Testnet`
   - **RPC URL**: `https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`
   - **Chain ID**: `11155111`
   - **Currency Symbol**: `ETH`
   - **Block Explorer URL**: `https://sepolia.etherscan.io`

**Note**: Sepolia is a widely-supported testnet that's more stable than Zama Testnet for tutorial purposes.

### Switch to Sepolia Testnet
Make sure your wallet is connected to Sepolia Testnet before proceeding.

**Supported Wallets:**
- ✅ **MetaMask** - Most popular browser wallet
- ✅ **Coinbase Wallet** - Official Coinbase wallet
- ✅ **WalletConnect** - Connect mobile wallets
- ✅ **Brave Wallet** - Built into Brave browser
- ✅ **Trust Wallet** - Popular mobile wallet
- ✅ **Ledger** - Hardware wallet support
- ✅ **Safe Wallet** - Multi-sig wallet
- ✅ **Phantom** - Solana wallet (EVM support)
- ✅ **OKX Wallet** - Multi-chain wallet
- ✅ **Zerion** - DeFi wallet
- ✅ **1inch Wallet** - DeFi-focused wallet

## Step 6: Deploy Contracts

```bash
# Deploy to Sepolia Testnet
npm run deploy:testnet
```

**Important**: Save the contract address that gets printed!

Update your `.env` file:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x... # Your deployed contract address
```

## Step 7: Start the Frontend

```bash
# Start the development server
npm run dev
```

## Troubleshooting

### Common Issues

#### 1. **"Insufficient funds"**
- Get Sepolia testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Make sure you're on Sepolia Testnet

#### 2. **"Network not found" or "Currency symbol doesn't match"**
- Add Sepolia Testnet to MetaMask manually
- Use the exact network details provided above
- Verify Chain ID is exactly `11155111`
- Sepolia is widely supported and should work without issues

#### 3. **"Contract not deployed"**
- Run `npm run deploy:testnet`
- Update `NEXT_PUBLIC_CONTRACT_ADDRESS` in `.env`

#### 4. **"FHEVM not initialized"**
- Make sure you're connected to Zama Testnet
- Refresh the page and reconnect wallet

### Getting Help

- **Zama Discord**: [Join here](https://discord.gg/zama)
- **Zama Forum**: [Visit here](https://forum.zama.ai/)
- **GitHub Issues**: Open an issue in this repository

## Verification Checklist

Before proceeding, make sure:

- [ ] ✅ Node.js and Git installed
- [ ] ✅ Repository cloned and dependencies installed
- [ ] ✅ Environment file configured
- [ ] ✅ MetaMask connected to Zama Testnet
- [ ] ✅ Testnet tokens obtained
- [ ] ✅ Contracts deployed successfully
- [ ] ✅ Frontend running on localhost:3000
- [ ] ✅ Wallet connected in the frontend

## Next Steps

Great! Your development environment is set up. Now let's dive into the smart contract code and understand how FHEVM works.

**Ready to code?** Let's move to [Building the Smart Contract](03-smart-contract.md) 🚀
