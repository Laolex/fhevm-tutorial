# Testing and Deployment 🚀

## Overview

Now that we have our complete FHEVM dApp, let's deploy it to the Zama Testnet and test the full encryption/decryption workflow. This section covers deployment, testing, and troubleshooting.

## Deployment Steps

### 1. **Deploy Smart Contract**

```bash
# Make sure you're in the project root
cd hello-fhevm-tutorial

# Deploy to Zama Testnet
npm run deploy:testnet
```

**Expected Output:**
```
🚀 Starting SecretGame deployment...
📦 Deploying SecretGame contract...
✅ SecretGame deployed to: 0x1234567890abcdef...
🎮 Game Master: 0xabcdef1234567890...
🆔 Game ID: 1699123456

📋 Deployment Summary:
====================
Contract Address: 0x1234567890abcdef...
Game Master: 0xabcdef1234567890...
Game ID: 1699123456
Network: zama-testnet
Deployed At: 2025-01-XX...

🎯 Next Steps:
==============
1. Copy the contract address to your .env file:
   NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef...
2. Start the frontend: npm run dev
3. Connect your wallet to Zama Testnet
4. Start a new game with a secret number!
```

### 2. **Update Environment Variables**

Copy the contract address to your `.env` file:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1234567890abcdef...
```

### 3. **Start Frontend**

```bash
# Start the development server
npm run dev
```

Visit `http://localhost:3000` to see your dApp!

## Testing the Complete Flow

### 1. **Wallet Connection**

1. **Connect MetaMask** to Zama Testnet
2. **Verify network** shows "Zama Testnet"
3. **Check balance** has testnet tokens
4. **Connect wallet** in the frontend

### 2. **Game Master Flow**

1. **Start a new game**:
   - Enter a secret number (1-100)
   - Click "Start Game"
   - Wait for transaction confirmation

2. **Verify game started**:
   - Status should show "Game Active"
   - Game ID should be updated
   - Players can now join

### 3. **Player Flow**

1. **Join the game**:
   - Click "Join Game"
   - Wait for transaction confirmation
   - Status should show "You've joined!"

2. **Make a guess**:
   - Enter a number (1-100)
   - Click "Make Guess"
   - Wait for transaction confirmation

3. **Check results**:
   - If correct: "Congratulations! You Won!"
   - If incorrect: "Better luck next time!"
   - Secret number is revealed

### 4. **Multiple Players**

1. **Open multiple browser tabs**
2. **Connect different wallets** (or use different accounts)
3. **Join the same game**
4. **Make different guesses**
5. **Verify only the winner is revealed**

## Verification Checklist

### ✅ **Smart Contract**
- [ ] Contract deployed successfully
- [ ] Contract address saved in `.env`
- [ ] Game master can start games
- [ ] Players can join games
- [ ] Guesses are encrypted
- [ ] Only winner is revealed

### ✅ **Frontend**
- [ ] Wallet connects to Zama Testnet
- [ ] FHEVM initializes correctly
- [ ] Game status updates in real-time
- [ ] Encrypted inputs work
- [ ] Error handling works
- [ ] Mobile responsive

### ✅ **Full Workflow**
- [ ] Game master starts game
- [ ] Players join game
- [ ] Players make encrypted guesses
- [ ] Contract processes guesses privately
- [ ] Winner is revealed publicly
- [ ] Game can be reset

## Troubleshooting

### Common Issues

#### 1. **"Contract not deployed"**
```bash
# Check deployment
npm run deploy:testnet

# Verify contract address in .env
echo $NEXT_PUBLIC_CONTRACT_ADDRESS
```

#### 2. **"Insufficient funds"**
- Get testnet tokens from [Zama Faucet](https://faucet.zama.ai/)
- Make sure you're on Zama Testnet
- Check gas price settings

#### 3. **"FHEVM not initialized"**
- Refresh the page
- Reconnect wallet
- Check browser console for errors
- Verify network is Zama Testnet

#### 4. **"Transaction failed"**
- Check gas limit
- Verify contract address
- Ensure you have enough tokens
- Check if game is in correct state

#### 5. **"Frontend not loading"**
```bash
# Check if frontend is running
npm run dev

# Check for build errors
npm run build

# Clear cache and reinstall
rm -rf node_modules
npm install
```

### Debug Mode

Enable debug logging in your browser console:

```javascript
// In browser console
localStorage.setItem('debug', 'fhevm:*');
```

### Network Issues

If you're having network issues:

1. **Check RPC URL**: `https://devnet.zama.ai`
2. **Verify Chain ID**: `8009`
3. **Test connection**: Try visiting the RPC URL directly
4. **Use alternative RPC**: Check Zama documentation for backup URLs

## Performance Testing

### 1. **Load Testing**
- Test with multiple players
- Verify concurrent transactions
- Check for race conditions

### 2. **Gas Optimization**
- Monitor gas usage
- Optimize contract functions
- Use appropriate gas limits

### 3. **User Experience**
- Test on different devices
- Verify mobile functionality
- Check loading times

## Security Verification

### 1. **Encryption Verification**
- Verify inputs are encrypted
- Check that secret numbers aren't revealed
- Confirm only authorized decryption

### 2. **Access Control**
- Test game master permissions
- Verify player restrictions
- Check for unauthorized access

### 3. **Input Validation**
- Test invalid inputs
- Verify range checks
- Check for overflow/underflow

## Production Deployment

### 1. **Frontend Deployment**

Deploy to Vercel, Netlify, or similar:

```bash
# Build for production
npm run build

# Deploy to your platform
# (Follow platform-specific instructions)
```

### 2. **Environment Variables**

Set production environment variables:
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_ZAMA_TESTNET_RPC_URL`
- `NEXT_PUBLIC_CHAIN_ID`

### 3. **Domain Configuration**

- Set up custom domain
- Configure HTTPS
- Set up monitoring

## Monitoring and Analytics

### 1. **Transaction Monitoring**
- Track game starts
- Monitor player joins
- Log guess attempts

### 2. **Error Tracking**
- Set up error reporting
- Monitor failed transactions
- Track user issues

### 3. **Performance Metrics**
- Measure load times
- Track user engagement
- Monitor gas usage

## Next Steps

Congratulations! You've successfully built and deployed a complete FHEVM dApp. Now let's understand the encryption flow in detail.

**Ready to dive deeper?** Let's move to [Understanding the Encryption Flow](06-encryption-flow.md) 🔐
