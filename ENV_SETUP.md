# Environment Setup Guide

This guide explains how to configure environment variables for development and production deployments.

## Frontend Environment Variables

### Development (.env.local)

Create `frontend/.env.local` for local development:

```bash
# Contract Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d
NEXT_PUBLIC_CONTRACT_VERSION=v1

# Network Configuration
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia

# Optional: WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Optional: Debug Mode
NEXT_PUBLIC_DEBUG_MODE=true
```

### Production (.env.production)

For production deployments, create `frontend/.env.production`:

```bash
# Production Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourProductionContractAddress
NEXT_PUBLIC_CONTRACT_VERSION=v2

# Production Network (Mainnet)
NEXT_PUBLIC_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_CHAIN_ID=1
NEXT_PUBLIC_NETWORK_NAME=mainnet

# WalletConnect (Required for production)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Production Settings
NEXT_PUBLIC_DEBUG_MODE=false
NODE_ENV=production
```

## Backend/Contract Deployment

### Development (.env)

Create `.env` in project root for contract deployment:

```bash
# Wallet Configuration
PRIVATE_KEY=your_private_key_here

# Network RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Etherscan API (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key

# Chainlink VRF - Sepolia
VRF_COORDINATOR_SEPOLIA=0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
VRF_KEY_HASH_SEPOLIA=0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c
VRF_SUBSCRIPTION_ID=1

# Chainlink VRF - Mainnet
VRF_COORDINATOR_MAINNET=0x271682DEB8C4E0901D1a1550aD2e64D568E69909
VRF_KEY_HASH_MAINNET=0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef
```

## How to Get API Keys

### 1. Alchemy RPC URL

1. Visit [alchemy.com](https://alchemy.com)
2. Create account / Sign in
3. Click "Create App"
4. Select network (Sepolia or Mainnet)
5. Copy your HTTP URL
6. Replace `YOUR_ALCHEMY_KEY` with your key

### 2. Etherscan API Key

1. Visit [etherscan.io](https://etherscan.io)
2. Register / Sign in
3. Go to "API Keys" section
4. Click "Add" to create new key
5. Copy your API key

### 3. WalletConnect Project ID

1. Visit [cloud.walletconnect.com](https://cloud.walletconnect.com)
2. Sign in with email
3. Create new project
4. Copy your Project ID
5. Add to environment variables

### 4. Chainlink VRF Subscription

1. Visit [vrf.chain.link](https://vrf.chain.link)
2. Connect wallet
3. Click "Create Subscription"
4. Note your Subscription ID
5. Fund with LINK tokens
6. Add contract as consumer after deployment

## Security Best Practices

### ⚠️ NEVER commit these files:

```bash
.env
.env.local
.env.production
.env.*.local
```

### ✅ DO commit these files:

```bash
.env.example
.env.local.example
.env.production.example
```

### Add to .gitignore:

```bash
# Environment variables
.env
.env.local
.env.*.local
.env.production

# Deployment info (contains addresses)
deployment-*.json

# Private keys and secrets
*.key
*.pem
```

## Environment Variable Reference

### Frontend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Yes | - | Deployed contract address |
| `NEXT_PUBLIC_RPC_URL` | Yes | - | Ethereum RPC endpoint |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | - | Network chain ID (11155111 for Sepolia) |
| `NEXT_PUBLIC_NETWORK_NAME` | Yes | - | Network name (sepolia/mainnet) |
| `NEXT_PUBLIC_CONTRACT_VERSION` | No | v1 | Contract version (v1/v2) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | No | - | WalletConnect project ID |
| `NEXT_PUBLIC_DEBUG_MODE` | No | false | Enable debug logging |

### Backend Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PRIVATE_KEY` | Yes | - | Deployer wallet private key |
| `SEPOLIA_RPC_URL` | Yes* | - | Sepolia RPC endpoint |
| `MAINNET_RPC_URL` | Yes* | - | Mainnet RPC endpoint |
| `ETHERSCAN_API_KEY` | No | - | For contract verification |
| `VRF_COORDINATOR_SEPOLIA` | Yes* | Provided | Chainlink VRF coordinator |
| `VRF_KEY_HASH_SEPOLIA` | Yes* | Provided | Chainlink VRF key hash |
| `VRF_SUBSCRIPTION_ID` | Yes** | - | Your VRF subscription ID |

\* Required for respective network deployment  
\** Required for V2 deployment

## Quick Setup Scripts

### Setup Development Environment

```bash
#!/bin/bash
# setup-dev.sh

# Copy example files
cp .env.example .env
cp frontend/.env.local.example frontend/.env.local

echo "✅ Environment files created!"
echo "📝 Please edit the files and add your API keys:"
echo "   - .env (for contract deployment)"
echo "   - frontend/.env.local (for frontend)"
```

### Validate Environment

Create `scripts/validate-env.ts`:

```typescript
import * as dotenv from "dotenv";

dotenv.config();

const requiredVars = [
    "PRIVATE_KEY",
    "SEPOLIA_RPC_URL",
    "VRF_SUBSCRIPTION_ID",
];

const frontendVars = [
    "NEXT_PUBLIC_CONTRACT_ADDRESS",
    "NEXT_PUBLIC_RPC_URL",
    "NEXT_PUBLIC_CHAIN_ID",
];

console.log("Validating environment variables...\n");

let valid = true;

requiredVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Missing: ${varName}`);
        valid = false;
    } else {
        console.log(`✅ Found: ${varName}`);
    }
});

if (valid) {
    console.log("\n✅ All required variables are set!");
} else {
    console.log("\n❌ Please set missing variables in .env file");
    process.exit(1);
}
```

Run validation:

```bash
npx ts-node scripts/validate-env.ts
```

## Troubleshooting

### Issue: "Cannot find module 'dotenv'"

```bash
npm install dotenv
```

### Issue: Variables not loading

Make sure:
1. File is named exactly `.env.local` (with dot prefix)
2. File is in correct directory (`frontend/` for Next.js)
3. Restart development server after changes
4. No quotes around values (in Next.js)

### Issue: PRIVATE_KEY format

Your private key should:
- Be 64 characters (hex)
- NOT include `0x` prefix
- Be from a test wallet (not your main wallet!)
- Have sufficient ETH for gas

Example: `abcd1234...` (64 characters)

---

Need help? Check [DEPLOYMENT_V2.md](./DEPLOYMENT_V2.md) for full deployment guide.

