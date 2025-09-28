# Deployment Guide

This guide covers deploying the Hello FHEVM Tutorial to production.

## 🚀 Frontend Deployment

### Option 1: Vercel (Recommended)

1. **Connect to Vercel**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy from frontend directory**:
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Set environment variables** in Vercel dashboard:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your deployed contract address
   - `NEXT_PUBLIC_RPC_URL`: Your RPC endpoint

### Option 2: Netlify

1. **Build the project**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy to Netlify**:
   - Connect your GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `.next`
   - Add environment variables in Netlify dashboard

### Option 3: GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deploy script** to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d out"
     }
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

## 🔧 Environment Variables

### Required Variables

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/knSF5BWiIjxRpI4e7ELZsH0Jk5Yf9Wi2
```

### Optional Variables

```env
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_CHAIN_NAME=Sepolia
```

## 📋 Pre-deployment Checklist

- [ ] Smart contracts deployed to Sepolia
- [ ] Contract address updated in environment variables
- [ ] RPC endpoint configured
- [ ] Frontend builds without errors
- [ ] All features tested on testnet
- [ ] Environment variables set in deployment platform

## 🧪 Testing Deployment

1. **Test wallet connection** on deployed site
2. **Verify contract interactions** work
3. **Test game creation** and joining
4. **Confirm encrypted guessing** works
5. **Test auto-ending** functionality

## 🔒 Security Considerations

- Never commit private keys to version control
- Use environment variables for sensitive data
- Verify contract addresses before deployment
- Test thoroughly on testnet before mainnet

## 📊 Monitoring

- Monitor contract interactions
- Track user engagement
- Monitor gas usage
- Check for errors in console

## 🚨 Troubleshooting

### Common Issues

1. **Contract not found**: Verify contract address
2. **RPC errors**: Check RPC endpoint
3. **Wallet connection**: Ensure MetaMask is installed
4. **Build errors**: Check Node.js version compatibility

### Debug Steps

1. Check browser console for errors
2. Verify environment variables
3. Test on different networks
4. Check contract deployment status

## 📈 Performance Optimization

- Enable gzip compression
- Use CDN for static assets
- Optimize images and fonts
- Implement caching strategies
- Monitor Core Web Vitals

## 🔄 Updates and Maintenance

- Monitor for contract updates
- Keep dependencies updated
- Test after dependency updates
- Monitor for security vulnerabilities
- Regular backup of configuration

---

**Ready to deploy? Follow the steps above and your Hello FHEVM Tutorial will be live! 🚀**
