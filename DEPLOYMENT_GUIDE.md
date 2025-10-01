# Deployment Guide

This guide will walk you through deploying the FHEVM Tutorial project to production.

## Prerequisites

- Node.js 18+ installed
- MetaMask or another Web3 wallet
- Sepolia ETH for gas fees ([Get from faucet](https://sepoliafaucet.com/))
- (Optional) LINK tokens for Chainlink VRF ([Get from faucet](https://faucets.chain.link/))
- (Optional) Alchemy, Infura, or other RPC provider account

## Table of Contents

1. [Smart Contract Deployment](#smart-contract-deployment)
2. [Chainlink VRF Setup (Optional)](#chainlink-vrf-setup)
3. [Frontend Deployment](#frontend-deployment)
4. [Verification](#verification)
5. [Troubleshooting](#troubleshooting)

---

## Smart Contract Deployment

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment

Create a `.env` file in the project root:

```bash
cp env.example .env
```

Edit `.env` and add your private key:

```env
PRIVATE_KEY=your_sepolia_testnet_private_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=your_etherscan_api_key_for_verification
```

**⚠️ Security Warning:** Never commit your `.env` file or use mainnet private keys!

### Step 3: Deploy Standard Contract

For the basic version without Chainlink VRF:

```bash
npm run deploy:sepolia
```

### Step 4: Deploy Enhanced Contract (with Chainlink VRF)

First, create a Chainlink VRF subscription:

1. Go to [https://vrf.chain.link/](https://vrf.chain.link/)
2. Connect your wallet (Sepolia network)
3. Create a new subscription
4. Fund it with LINK tokens (5-10 LINK recommended)
5. Note your Subscription ID

Then add to your `.env`:

```env
VRF_SUBSCRIPTION_ID=your_subscription_id_here
```

Deploy the enhanced contract:

```bash
npm run deploy:enhanced
```

### Step 5: Add Contract as VRF Consumer

After deployment:

1. Go back to [https://vrf.chain.link/](https://vrf.chain.link/)
2. Select your subscription
3. Click "Add Consumer"
4. Enter your deployed contract address
5. Confirm the transaction

### Step 6: Verify Contract (Optional)

Verify on Etherscan for transparency:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

For enhanced contract:

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> \
  "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625" \
  "<YOUR_SUBSCRIPTION_ID>" \
  "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c" \
  "100000"
```

---

## Chainlink VRF Setup

### Why Use Chainlink VRF?

Chainlink VRF provides provably random numbers that are cryptographically secure and verifiable on-chain. This prevents:

- Front-running attacks
- Predictable outcomes
- Game master manipulation

### Configuration

The project is pre-configured for Sepolia testnet:

- **VRF Coordinator:** `0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625`
- **Key Hash:** `0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c` (30 gwei)
- **Callback Gas Limit:** `100,000`

For other networks, update `scripts/deploy-enhanced.ts`.

### Testing VRF Locally

VRF cannot be tested on local networks. Use Sepolia testnet for testing.

---

## Frontend Deployment

### Step 1: Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

Create `.env.local` from the template:

```bash
cp env.template .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=<your_deployed_contract_address>
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=Sepolia Testnet
```

### Step 3: Build Frontend

```bash
npm run build
```

### Step 4: Deploy to Vercel

#### Option A: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Set root directory to `frontend`
5. Add environment variables:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_RPC_URL`
   - `NEXT_PUBLIC_CHAIN_ID`
6. Deploy

#### Option C: Via GitHub Integration

1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
   - **Root Directory:** `frontend`
3. Add environment variables in Vercel dashboard
4. Trigger deployment via git push

### Step 5: Deploy to Other Platforms

#### Netlify

```bash
npm install -g netlify-cli
cd frontend
npm run build
netlify deploy --prod --dir=.next
```

#### AWS Amplify

1. Connect GitHub repository
2. Set build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd frontend && npm install
       build:
         commands:
           - cd frontend && npm run build
     artifacts:
       baseDirectory: frontend/.next
       files:
         - '**/*'
   ```

#### Docker

```bash
cd frontend
docker build -t fhevm-tutorial .
docker run -p 3000:3000 fhevm-tutorial
```

---

## Verification

### Smart Contract Tests

Run comprehensive tests:

```bash
# Basic tests
npm run test

# Enhanced contract tests
npm run test:enhanced

# Coverage report
npm run test:coverage
```

### Frontend Tests

```bash
cd frontend
npm run test
npm run lint
npm run type-check
```

### Integration Tests

1. **Connect Wallet:** Test wallet connection on Sepolia
2. **Claim Game Master:** Verify you can claim status
3. **Create Game:** Create a test game room
4. **Join Game:** Join as a different account
5. **Make Guess:** Test the guess functionality
6. **End Game:** Verify game completion

---

## CI/CD Setup

### GitHub Actions

The project includes a CI/CD workflow (`.github/workflows/ci.yml`).

#### Setup Secrets

Add these secrets to your GitHub repository:

1. Go to repository Settings → Secrets and variables → Actions
2. Add secrets:
   - `VERCEL_TOKEN`: Get from Vercel dashboard
   - `VERCEL_ORG_ID`: Found in Vercel settings
   - `VERCEL_PROJECT_ID`: Found in project settings
   - `PREVIEW_CONTRACT_ADDRESS`: Contract address for previews
   - `PREVIEW_RPC_URL`: RPC endpoint for previews

#### Workflow Features

- ✅ Automated testing on push/PR
- ✅ Frontend build verification
- ✅ Contract size checks
- ✅ Security analysis with Slither
- ✅ Preview deployments for PRs

---

## Environment-Specific Configurations

### Development

```env
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_CONTRACT_ADDRESS=<local_or_testnet_address>
```

### Staging

```env
NEXT_PUBLIC_ENVIRONMENT=staging
NEXT_PUBLIC_ENABLE_DEBUG=true
NEXT_PUBLIC_CONTRACT_ADDRESS=<staging_contract_address>
```

### Production

```env
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_CONTRACT_ADDRESS=<production_contract_address>
```

---

## Troubleshooting

### Contract Deployment Issues

#### Insufficient Funds

```
Error: insufficient funds for gas * price + value
```

**Solution:** Get more Sepolia ETH from a faucet.

#### Nonce Too Low

```
Error: nonce has already been used
```

**Solution:** Reset your account nonce in MetaMask or wait for pending transactions.

#### Gas Estimation Failed

```
Error: cannot estimate gas
```

**Solution:** Check constructor parameters and ensure VRF Coordinator address is correct.

### VRF Issues

#### VRF Request Failing

**Symptoms:** Game activates but secret number never set.

**Solutions:**
1. Verify subscription has enough LINK
2. Confirm contract is added as consumer
3. Check callback gas limit is sufficient (100,000+)
4. Wait for 3 block confirmations

#### VRF Not Responding

**Solutions:**
1. Check [Chainlink status page](https://status.chain.link/)
2. Verify you're on Sepolia testnet
3. Ensure subscription is active

### Frontend Issues

#### Contract Not Found

```
Error: call revert exception
```

**Solutions:**
1. Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is correct
2. Ensure you're on the correct network (Sepolia)
3. Check contract is deployed at that address

#### Wallet Connection Issues

**Solutions:**
1. Clear browser cache
2. Reset MetaMask account
3. Try different wallet (WalletConnect, Coinbase Wallet)
4. Check network configuration

#### Build Failures

```
Error: Module not found
```

**Solutions:**
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clear Next.js cache: `rm -rf .next`
3. Check Node.js version: `node --version` (should be 18+)

---

## Performance Optimization

### Frontend

1. **Enable Static Optimization:**
   ```typescript
   // next.config.js
   export default {
     output: 'export', // For static sites
   }
   ```

2. **Image Optimization:**
   Use Next.js `<Image>` component

3. **Code Splitting:**
   Already enabled by default in Next.js

### Smart Contracts

1. **Optimize Gas Usage:**
   ```bash
   npx hardhat test
   # Review gas reports
   ```

2. **Use Storage Efficiently:**
   - Pack variables
   - Use appropriate data types

---

## Security Best Practices

### Contract Security

- ✅ Never expose private keys
- ✅ Use hardware wallet for mainnet
- ✅ Audit contracts before mainnet
- ✅ Set reasonable gas limits
- ✅ Implement emergency pause mechanism

### Frontend Security

- ✅ Validate all user inputs
- ✅ Use HTTPS in production
- ✅ Implement rate limiting
- ✅ Never store sensitive data in localStorage
- ✅ Sanitize error messages

---

## Monitoring & Analytics

### On-Chain Monitoring

- [Etherscan](https://sepolia.etherscan.io/) for transaction tracking
- [Tenderly](https://tenderly.co/) for advanced monitoring
- [Blocknative](https://www.blocknative.com/) for mempool monitoring

### Frontend Analytics

- Google Analytics
- Mixpanel
- Amplitude

Add to `.env.local`:

```env
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

---

## Mainnet Deployment

### ⚠️ Before Mainnet

1. **Audit:** Get professional security audit
2. **Test:** Extensive testing on testnets
3. **Insurance:** Consider smart contract insurance
4. **Legal:** Review legal requirements
5. **Budget:** Prepare for higher gas costs

### Mainnet Configuration

Update `hardhat.config.ts` for mainnet:

```typescript
mainnet: {
  url: process.env.MAINNET_RPC_URL,
  accounts: [process.env.MAINNET_PRIVATE_KEY],
  chainId: 1
}
```

VRF Coordinator for Ethereum Mainnet:
- Address: `0x271682DEB8C4E0901D1a1550aD2e64D568E69909`
- Key Hash: Varies by gas lane

---

## Support

- **GitHub Issues:** [Report bugs](https://github.com/Laolex/fhevm-tutorial/issues)
- **Documentation:** [Full docs](./docs/)
- **Community:** Join our Discord/Telegram

---

## License

MIT License - see [LICENSE](./LICENSE) for details.

