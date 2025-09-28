# Troubleshooting Guide 🔧

## Common Issues and Solutions

This guide helps you resolve common issues when working with the Hello FHEVM Tutorial.

## 🚨 Critical Issues

### 1. **FHEVM Contract Deployment Fails**

**Error**: `Transaction reverted without a reason string`

**Cause**: FHEVM contracts require special runtime support that's not available in standard Hardhat environment.

**Solutions**:
- **Option A**: Deploy to Zama Testnet using the regular contract version
  ```bash
  npm run deploy:enhanced-regular
  ```
- **Option B**: Use the demo version for local testing
  ```bash
  npm run deploy:mock
  ```
- **Option C**: Set up FHEVM development environment (see Environment Setup section)

### 2. **FHEVM Plugin Not Found**

**Error**: `Error HH303: Unrecognized task 'fhevm'`

**Cause**: FHEVM Hardhat plugin is not installed or configured.

**Solutions**:
- Install the FHEVM plugin:
  ```bash
  npm install @zama/fhevm-hardhat-plugin
  ```
- Update `hardhat.config.ts` to include the plugin
- Use alternative deployment methods for now

### 3. **Contract Address Not Set**

**Error**: `No contract address available, using simulation mode`

**Cause**: `NEXT_PUBLIC_CONTRACT_ADDRESS` environment variable is not set.

**Solutions**:
- Deploy a contract first:
  ```bash
  npm run deploy:enhanced-regular
  ```
- Copy the contract address to your `.env` file:
  ```env
  NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
  ```
- Restart the frontend development server

## 🔗 Network Issues

### 1. **Network Connection Timeout**

**Error**: `Contract call timeout after 10 seconds`

**Solutions**:
- Check your internet connection
- Try a different RPC endpoint
- Switch to offline demo mode (automatic fallback)
- Use a VPN if RPC is blocked in your region

### 2. **Wrong Network Connected**

**Error**: `Network not found` or `Currency symbol doesn't match`

**Solutions**:
- Add Sepolia Testnet to MetaMask manually:
  - Network Name: `Sepolia Testnet`
  - RPC URL: `https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161`
  - Chain ID: `11155111`
  - Currency Symbol: `ETH`
  - Block Explorer: `https://sepolia.etherscan.io`
- Switch to Sepolia Testnet in your wallet

### 3. **Insufficient Funds**

**Error**: `Insufficient funds for transaction`

**Solutions**:
- Get testnet ETH from [Sepolia Faucet](https://sepoliafaucet.com/)
- Check your wallet balance
- Ensure you're on the correct testnet

## 🎮 Game Issues

### 1. **Game Master Panel Not Showing**

**Cause**: User is not recognized as the game master.

**Solutions**:
- Check if you deployed the contract (you become the game master)
- Verify the contract address in your `.env` file
- Try refreshing the page
- Check browser console for errors

### 2. **Cannot Join Game**

**Error**: `Game must be active to join`

**Solutions**:
- Ensure the game master has started the game
- Check the game status in the UI
- Verify you're connected to the correct network
- Try refreshing the page

### 3. **FHEVM Not Initializing**

**Error**: `Initializing FHEVM...` (stuck on loading)

**Solutions**:
- Check browser console for specific errors
- Try refreshing the page
- Clear browser cache and cookies
- Disable browser extensions temporarily
- Try a different browser

## 🛠 Development Issues

### 1. **Build Failures**

**Error**: `npm run build` fails

**Solutions**:
- Check for TypeScript errors:
  ```bash
  cd frontend && npm run type-check
  ```
- Clear node_modules and reinstall:
  ```bash
  npm run clean
  npm run install:all
  ```
- Check for missing environment variables

### 2. **Test Failures**

**Error**: Tests fail with timeout or deployment errors

**Solutions**:
- Use the regular contract version for testing:
  ```bash
  npm run deploy:regular
  ```
- Run FHEVM-specific tests only when FHEVM environment is available
- Check test configuration in `hardhat.config.ts`

### 3. **TypeScript Errors**

**Error**: Type errors in frontend

**Solutions**:
- Run type checking:
  ```bash
  cd frontend && npm run type-check
  ```
- Update type definitions if needed
- Check for missing imports

## 🔐 FHEVM Specific Issues

### 1. **Encryption/Decryption Failures**

**Error**: FHEVM operations fail

**Solutions**:
- Ensure you're connected to a FHEVM-compatible network
- Check FHEVM SDK version compatibility
- Verify public key configuration
- Use simulation mode for testing

### 2. **Zama Relayer SDK Issues**

**Error**: Relayer SDK initialization fails

**Solutions**:
- Check network connectivity
- Verify relayer URL configuration
- Update to latest SDK version
- Use fallback simulation mode

## 🐛 Debugging Tips

### 1. **Enable Debug Logging**

Add to browser console:
```javascript
localStorage.setItem('debug', 'fhevm:*');
```

### 2. **Check Browser Console**

Look for:
- Network errors
- Contract interaction errors
- FHEVM initialization errors
- Wallet connection issues

### 3. **Verify Environment Variables**

Check that all required environment variables are set:
```bash
# Check if .env file exists and has required variables
cat .env | grep NEXT_PUBLIC
```

### 4. **Test Contract Interaction**

Use the debug page at `/debug` to test basic contract functionality.

## 📞 Getting Help

### 1. **Check Documentation**
- Review the tutorial steps in `docs/`
- Check the README for setup instructions
- Look at the code comments for implementation details

### 2. **Community Support**
- **Zama Discord**: [Join here](https://discord.gg/zama)
- **Zama Forum**: [Visit here](https://forum.zama.ai/)
- **GitHub Issues**: Open an issue in this repository

### 3. **Common Solutions**
- Restart development server
- Clear browser cache
- Check network connection
- Verify wallet connection
- Use demo mode for testing

## 🚀 Quick Fixes

### Reset Everything
```bash
# Clean and reinstall
npm run clean
npm run install:all

# Deploy fresh contract
npm run deploy:enhanced-regular

# Start fresh
npm run dev
```

### Use Demo Mode
If all else fails, the application automatically falls back to demo mode, which allows you to:
- Test the UI and game flow
- Learn FHEVM concepts
- See how the application works
- Continue with the tutorial

---

**Remember**: This is a tutorial project designed for learning. If you encounter issues, try the demo mode first, then work through the troubleshooting steps above.
