# Deployment Guide - FHEVM Tutorial V2

This guide covers deploying the enhanced Secret Game Master contract (V2) with Chainlink VRF and Commit-Reveal features, as well as deploying the frontend application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Chainlink VRF Setup](#chainlink-vrf-setup)
- [Frontend Deployment](#frontend-deployment)
- [Verifying Contracts](#verifying-contracts)
- [Post-Deployment Testing](#post-deployment-testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

- **Node.js**: v18 or higher
- **npm** or **yarn**: Latest version
- **MetaMask**: Browser extension installed
- **Git**: For version control

### Required Accounts

1. **Ethereum Wallet**: With private key (for deployment)
2. **Alchemy Account**: For RPC endpoints ([alchemy.com](https://alchemy.com))
3. **Etherscan Account**: For contract verification ([etherscan.io](https://etherscan.io))
4. **Chainlink VRF**: Subscription ID ([vrf.chain.link](https://vrf.chain.link))
5. **WalletConnect**: Project ID ([cloud.walletconnect.com](https://cloud.walletconnect.com))

### Network Testnet Funds

- **Sepolia ETH**: Get from [sepolia-faucet.com](https://sepolia-faucet.com)
- **Chainlink LINK**: Get from [faucets.chain.link](https://faucets.chain.link)

## Smart Contract Deployment

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/Laolex/fhevm-tutorial.git
cd fhevm-tutorial

# Install dependencies
npm install

# Install Chainlink contracts
npm install @chainlink/contracts
```

### Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Deployment Account
PRIVATE_KEY=your_private_key_here

# Network RPC URLs
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_KEY

# Etherscan API Key
ETHERSCAN_API_KEY=your_etherscan_api_key

# Chainlink VRF Configuration
VRF_COORDINATOR_SEPOLIA=0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
VRF_KEY_HASH_SEPOLIA=0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c
VRF_SUBSCRIPTION_ID=your_subscription_id_here

# For Mainnet
VRF_COORDINATOR_MAINNET=0x271682DEB8C4E0901D1a1550aD2e64D568E69909
VRF_KEY_HASH_MAINNET=0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef
```

### Step 3: Create Deployment Script

Create `scripts/deploy-game-master-v2.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
    console.log("Deploying SecretGameMasterV2...");

    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");

    // Chainlink VRF Configuration (Sepolia)
    const vrfCoordinator = process.env.VRF_COORDINATOR_SEPOLIA || "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
    const keyHash = process.env.VRF_KEY_HASH_SEPOLIA || "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const subscriptionId = process.env.VRF_SUBSCRIPTION_ID || "1";

    console.log("\nChainlink VRF Config:");
    console.log("- Coordinator:", vrfCoordinator);
    console.log("- Key Hash:", keyHash);
    console.log("- Subscription ID:", subscriptionId);

    const SecretGameMasterV2 = await ethers.getContractFactory("SecretGameMasterV2");
    const contract = await SecretGameMasterV2.deploy(
        vrfCoordinator,
        keyHash,
        subscriptionId
    );

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log("\n✅ SecretGameMasterV2 deployed to:", address);
    console.log("\n📝 Next steps:");
    console.log("1. Add this contract as a consumer to your VRF subscription");
    console.log("2. Fund your VRF subscription with LINK tokens");
    console.log("3. Update frontend .env.local with contract address");
    console.log("4. Verify the contract on Etherscan");

    // Save deployment info
    const fs = require("fs");
    const deploymentInfo = {
        network: "sepolia",
        contractAddress: address,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        vrfCoordinator,
        keyHash,
        subscriptionId
    };

    fs.writeFileSync(
        "deployment-info-v2.json",
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n✅ Deployment info saved to deployment-info-v2.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
```

### Step 4: Compile Contracts

```bash
# Compile all contracts
npm run compile

# Check for compilation errors
npx hardhat compile
```

### Step 5: Deploy to Sepolia Testnet

```bash
# Deploy to Sepolia
npx hardhat run scripts/deploy-game-master-v2.ts --network sepolia

# Expected output:
# Deploying SecretGameMasterV2...
# Deploying with account: 0x...
# Account balance: 0.5 ETH
# ✅ SecretGameMasterV2 deployed to: 0x...
```

### Step 6: Save Contract Address

After deployment, save the contract address. You'll see output like:

```
✅ SecretGameMasterV2 deployed to: 0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d
```

## Chainlink VRF Setup

### Step 1: Create VRF Subscription

1. Visit [vrf.chain.link](https://vrf.chain.link)
2. Connect your wallet
3. Click "Create Subscription"
4. Note your Subscription ID

### Step 2: Fund Subscription

1. Add LINK tokens to your subscription (minimum 2 LINK recommended)
2. Get testnet LINK from [faucets.chain.link](https://faucets.chain.link)

### Step 3: Add Consumer

1. In VRF dashboard, click "Add Consumer"
2. Enter your deployed contract address
3. Confirm transaction

### Step 4: Verify VRF Configuration

```bash
# Create a test script: scripts/test-vrf.ts
npx hardhat run scripts/test-vrf.ts --network sepolia
```

## Frontend Deployment

### Option 1: Deploy to Vercel (Recommended)

#### Step 1: Prepare Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create production environment file
cp .env.local.example .env.local
```

#### Step 2: Configure Environment

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_CONTRACT_VERSION=v2
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

#### Step 3: Test Build Locally

```bash
# Build the frontend
npm run build

# Test production build locally
npm run start

# Open http://localhost:3000 to verify
```

#### Step 4: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts to configure:
# - Project name: fhevm-tutorial
# - Framework: Next.js
# - Build command: npm run build
# - Output directory: .next
```

#### Step 5: Configure Environment Variables in Vercel

1. Go to your project dashboard on [vercel.com](https://vercel.com)
2. Click "Settings" → "Environment Variables"
3. Add all variables from `.env.local`:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_CHAIN_ID`
   - `NEXT_PUBLIC_NETWORK_NAME`
   - `NEXT_PUBLIC_CONTRACT_VERSION`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

4. Redeploy to apply changes

### Option 2: Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Build and deploy
cd frontend
npm run build
netlify deploy --prod --dir=.next
```

### Option 3: Deploy to IPFS (Decentralized)

```bash
# Install IPFS
npm install -g ipfs

# Export static site
npm run export

# Upload to IPFS
ipfs add -r out/

# Note the returned CID
# Access at: https://ipfs.io/ipfs/<CID>
```

### Option 4: Self-Hosted (VPS)

```bash
# On your server (Ubuntu/Debian)
sudo apt update
sudo apt install nodejs npm nginx

# Clone repository
git clone https://github.com/Laolex/fhevm-tutorial.git
cd fhevm-tutorial/frontend

# Install dependencies
npm install

# Build
npm run build

# Run with PM2
npm install -g pm2
pm2 start npm --name "fhevm-frontend" -- start

# Configure Nginx reverse proxy
sudo nano /etc/nginx/sites-available/fhevm-tutorial

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/fhevm-tutorial /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Verifying Contracts

### Automatic Verification (Hardhat)

Create `scripts/verify-v2.ts`:

```typescript
import { run } from "hardhat";

async function main() {
    const contractAddress = "0xYourDeployedAddress";
    const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
    const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
    const subscriptionId = "1";

    console.log("Verifying contract...");

    await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [vrfCoordinator, keyHash, subscriptionId],
    });

    console.log("✅ Contract verified!");
}

main().catch(console.error);
```

Run verification:

```bash
npx hardhat run scripts/verify-v2.ts --network sepolia
```

### Manual Verification (Etherscan)

1. Visit [sepolia.etherscan.io](https://sepolia.etherscan.io)
2. Search for your contract address
3. Click "Contract" → "Verify and Publish"
4. Select:
   - Compiler: Solidity (Single file)
   - Version: 0.8.19
   - License: MIT
5. Paste flattened source code
6. Enter constructor arguments
7. Submit

## Post-Deployment Testing

### Test Checklist

```bash
# 1. Verify contract deployment
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>

# 2. Test VRF integration
npm run test:vrf

# 3. Test game creation
npm run test-game

# 4. Test frontend connection
cd frontend && npm run dev

# 5. Test wallet connection
# - Connect MetaMask
# - Claim game master
# - Create game
# - Activate game (triggers VRF)
# - Join game
# - Make guesses

# 6. Test commit-reveal
# - Enable commit-reveal in game settings
# - Commit guesses
# - Wait for reveal period
# - Reveal guesses
```

### Automated Testing

```bash
# Run full test suite
npm test

# Run specific tests
npm run test:unit
npm run test:integration
npm run test:e2e
```

## Troubleshooting

### Common Issues

#### Issue 1: Insufficient Funds

```
Error: insufficient funds for gas
```

**Solution**: Add more ETH to your deployer wallet

#### Issue 2: VRF Not Working

```
Error: VRF subscription is not funded
```

**Solution**: 
1. Add LINK to your VRF subscription
2. Verify consumer is added
3. Check subscription ID is correct

#### Issue 3: Frontend Not Connecting

```
Error: Contract not found
```

**Solution**:
1. Verify contract address in `.env.local`
2. Check network ID matches
3. Ensure wallet is on correct network

#### Issue 4: Build Errors

```
Error: Module not found
```

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Next.js cache
rm -rf frontend/.next
cd frontend && npm run build
```

### Getting Help

- **GitHub Issues**: [github.com/Laolex/fhevm-tutorial/issues](https://github.com/Laolex/fhevm-tutorial/issues)
- **Discord**: Join FHEVM community
- **Documentation**: Check README.md

## Maintenance

### Updating the Contract

```bash
# Make changes to contract
# Test thoroughly
npm test

# Deploy new version
npx hardhat run scripts/deploy-game-master-v2.ts --network sepolia

# Update frontend with new address
cd frontend
# Edit .env.local with new address

# Redeploy frontend
vercel --prod
```

### Monitoring

```bash
# Monitor contract events
npm run monitor:events

# Check VRF requests
# Visit vrf.chain.link dashboard

# Monitor frontend analytics
# Check Vercel analytics dashboard
```

## Production Deployment Checklist

Before deploying to mainnet:

- [ ] All tests passing
- [ ] Security audit completed
- [ ] Gas optimization done
- [ ] VRF subscription funded
- [ ] Frontend tested on testnet
- [ ] Environment variables secured
- [ ] Backup deployment keys
- [ ] Monitor setup configured
- [ ] Documentation updated
- [ ] Emergency procedures documented

## Cost Estimates

### Deployment Costs (Sepolia)

- Contract deployment: ~0.01-0.02 ETH
- VRF subscription: 2 LINK minimum
- Contract verification: Free

### Deployment Costs (Mainnet)

- Contract deployment: ~0.05-0.1 ETH (varies with gas)
- VRF subscription: 5-10 LINK recommended
- Monthly hosting (Vercel): Free tier available

### Ongoing Costs

- VRF requests: ~0.1 LINK per request
- Frontend hosting: Free-$20/month (Vercel)
- RPC calls: Free tier (Alchemy) or $50+/month

---

**Deployment Complete!** 🎉

Your FHEVM tutorial application is now live. Users can:
- ✅ Create game rooms with commit-reveal
- ✅ Use Chainlink VRF for random numbers
- ✅ Play confidential guessing games
- ✅ Experience privacy-preserving smart contracts

For support, visit: [github.com/Laolex/fhevm-tutorial](https://github.com/Laolex/fhevm-tutorial)

