# FHEVM Development Environment Setup 🛠️

## Overview

This guide helps you set up a proper FHEVM development environment for the Hello FHEVM Tutorial.

## 🎯 Prerequisites

- Node.js v18 or higher
- Git
- A code editor (VS Code recommended)
- Basic knowledge of Solidity and React

## 🔧 Standard Setup (Recommended for Tutorial)

### 1. **Clone and Install**
```bash
git clone <your-repo-url>
cd hello-fhevm-tutorial
npm run install:all
```

### 2. **Environment Configuration**
```bash
cp env.example .env
# Edit .env with your configuration
```

### 3. **Deploy Demo Contract**
```bash
# Deploy the enhanced regular version (works on Sepolia)
npm run deploy:enhanced-regular
```

### 4. **Start Frontend**
```bash
npm run dev
```

This setup uses the **demo version** that simulates FHEVM functionality and works on regular Sepolia testnet.

## 🔐 Full FHEVM Setup (Advanced)

### 1. **Install FHEVM Dependencies**

```bash
# Install FHEVM Hardhat plugin
npm install @zama/fhevm-hardhat-plugin

# Install FHEVM JavaScript library
npm install @zama/fhevmjs
```

### 2. **Configure Hardhat for FHEVM**

Update `hardhat.config.ts`:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@zama/fhevm-hardhat-plugin";
import "dotenv/config";

const config: HardhatUserConfig = {
    solidity: {
        version: "0.8.19",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
            viaIR: true, // Required for FHEVM
        },
    },
    networks: {
        "zama-testnet": {
            url: process.env.ZAMA_TESTNET_RPC_URL || "https://devnet.zama.ai",
            chainId: 8009,
            accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
        },
    },
    fhevm: {
        network: "zama-testnet",
        publicKey: process.env.FHEVM_PUBLIC_KEY,
    },
};

export default config;
```

### 3. **Environment Variables**

Add to your `.env` file:

```env
# Zama Testnet Configuration
ZAMA_TESTNET_RPC_URL=https://devnet.zama.ai
FHEVM_PUBLIC_KEY=your_fhevm_public_key_here

# Frontend Configuration
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_ZAMA_TESTNET_RPC_URL=https://devnet.zama.ai
NEXT_PUBLIC_CHAIN_ID=8009
```

### 4. **Deploy to Zama Testnet**

```bash
# Deploy the full FHEVM contract
npm run deploy:testnet
```

## 🌐 Network Configuration

### **Sepolia Testnet (Demo Mode)**
- **Network Name**: Sepolia Testnet
- **RPC URL**: `https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`
- **Chain ID**: `11155111`
- **Currency Symbol**: `ETH`
- **Block Explorer**: `https://sepolia.etherscan.io`

### **Zama Testnet (Full FHEVM)**
- **Network Name**: Zama Testnet
- **RPC URL**: `https://devnet.zama.ai`
- **Chain ID**: `8009`
- **Currency Symbol**: `ZAMA`
- **Block Explorer**: `https://explorer.zama.ai`

## 🔑 Getting Testnet Tokens

### **Sepolia ETH**
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

### **Zama Testnet Tokens**
- [Zama Faucet](https://faucet.zama.ai/)
- Connect your wallet to Zama Testnet
- Request testnet tokens

## 🧪 Testing Strategy

### **1. Demo Mode Testing**
```bash
# Deploy demo contract
npm run deploy:enhanced-regular

# Run basic tests
npm test

# Test game flow
npm run test-game
```

### **2. FHEVM Testing**
```bash
# Deploy to Zama Testnet
npm run deploy:testnet

# Test FHEVM functionality
npm run check-fhevm
```

### **3. Frontend Testing**
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
cd frontend && npm run type-check
```

## 🔍 Verification Steps

### **1. Contract Deployment**
```bash
# Verify contract is deployed
npm run verify
```

### **2. Frontend Connection**
- Open `http://localhost:3000`
- Connect wallet to correct network
- Check browser console for errors
- Verify contract interaction

### **3. FHEVM Functionality**
- Test encryption/decryption
- Verify game flow works
- Check error handling
- Test offline mode fallback

## 🚨 Common Issues

### **1. FHEVM Plugin Not Working**
- Ensure plugin is properly installed
- Check Hardhat configuration
- Verify network settings

### **2. Contract Deployment Fails**
- Check private key configuration
- Verify network connectivity
- Ensure sufficient testnet tokens

### **3. Frontend Not Connecting**
- Verify contract address in `.env`
- Check network configuration
- Clear browser cache

## 📚 Learning Path

### **Beginner (Recommended)**
1. Use demo mode setup
2. Follow tutorial documentation
3. Learn FHEVM concepts
4. Test game functionality

### **Intermediate**
1. Set up full FHEVM environment
2. Deploy to Zama Testnet
3. Test real encryption/decryption
4. Experiment with contract modifications

### **Advanced**
1. Create custom FHEVM contracts
2. Implement advanced features
3. Optimize for production
4. Contribute to the project

## 🎯 Next Steps

After setting up your environment:

1. **Follow the Tutorial**: Start with [FHEVM Basics](01-fhevm-basics.md)
2. **Deploy Contracts**: Use the appropriate deployment script
3. **Test Functionality**: Verify everything works correctly
4. **Experiment**: Try modifying the code
5. **Learn More**: Explore advanced FHEVM concepts

## 📞 Support

If you encounter issues:

1. **Check Troubleshooting**: See [Troubleshooting Guide](08-troubleshooting.md)
2. **Community Support**: Join [Zama Discord](https://discord.gg/zama)
3. **Documentation**: Review [Zama FHEVM Docs](https://docs.zama.ai/fhevm/)
4. **GitHub Issues**: Open an issue in this repository

---

**Remember**: Start with the demo mode setup for the best learning experience. You can always upgrade to full FHEVM setup later!
