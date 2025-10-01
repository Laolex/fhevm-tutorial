# 🚀 Frontend Deployment Guide

Your frontend is **production-ready!** Here are 3 deployment options.

---

## ✅ Pre-Deployment Checklist

- [x] Frontend builds successfully
- [x] Contract address configured: `0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d`
- [x] Environment variables set
- [x] All tests passing
- [ ] Choose deployment platform
- [ ] Deploy!

---

## 🚀 Option 1: Deploy via GitHub + Vercel (Recommended - Easiest)

### **Why this is best:**
- ✅ No CLI installation needed
- ✅ Automatic deployments on push
- ✅ Easy to manage
- ✅ Free SSL certificate
- ✅ Global CDN

### **Steps:**

#### 1. **Ensure code is pushed to GitHub** ✅
```bash
cd /home/laolex/Projects/hello-fhevm-tutorial
git add -A
git commit -m "Production build ready"
git push origin main
```

#### 2. **Go to Vercel**
Visit: https://vercel.com/signup

#### 3. **Sign up / Sign in**
- Click "Continue with GitHub"
- Authorize Vercel to access your repositories

#### 4. **Import Your Project**
- Click "New Project"
- Find `fhevm-tutorial` repository
- Click "Import"

#### 5. **Configure Project**
```
Framework Preset: Next.js
Root Directory: frontend
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### 6. **Add Environment Variables**
Click "Environment Variables" and add:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | `0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d` |
| `NEXT_PUBLIC_RPC_URL` | `https://eth-sepolia.g.alchemy.com/v2/knSF5BWiIjxRpI4e7ELZsH0Jk5Yf9Wi2` |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` |
| `NEXT_PUBLIC_NETWORK_NAME` | `sepolia` |
| `NEXT_PUBLIC_DEBUG_MODE` | `false` |

#### 7. **Deploy!**
- Click "Deploy"
- Wait 2-3 minutes
- Get your live URL! 🎉

#### 8. **Your Live URL**
Will be something like: `https://fhevm-tutorial-your-name.vercel.app`

---

## 🚀 Option 2: Deploy via Vercel CLI

### **Steps:**

#### 1. **Install Vercel CLI**
```bash
npm install -g vercel
```

#### 2. **Login**
```bash
vercel login
```

#### 3. **Deploy**
```bash
cd /home/laolex/Projects/hello-fhevm-tutorial/frontend
vercel --prod
```

#### 4. **Configure Environment Variables**
During deployment, Vercel will ask questions:
- Project name: `fhevm-tutorial`
- Root directory: `./` (current)

Then add environment variables in Vercel dashboard.

---

## 🚀 Option 3: Deploy to Netlify

### **Steps:**

#### 1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

#### 2. **Login**
```bash
netlify login
```

#### 3. **Build**
```bash
cd /home/laolex/Projects/hello-fhevm-tutorial/frontend
npm run build
```

#### 4. **Deploy**
```bash
netlify deploy --prod --dir=.next
```

#### 5. **Configure Environment**
Go to Netlify dashboard → Site settings → Environment variables

Add the same variables as Vercel.

---

## 🎯 Recommended: Use Option 1 (GitHub + Vercel)

### **Why?**
1. **Automatic deployments** - Push to GitHub = Auto deploy
2. **Preview deployments** - Every PR gets a preview URL
3. **Easy rollbacks** - One-click rollback to previous versions
4. **Built-in analytics** - See your traffic
5. **Free** - Perfect for this project

### **Time Required:** 10-15 minutes

---

## 📝 Post-Deployment Checklist

After deployment:

- [ ] Visit your live URL
- [ ] Connect wallet (MetaMask on Sepolia)
- [ ] Test: Claim game master
- [ ] Test: Create game
- [ ] Test: Join game
- [ ] Test: Make guess
- [ ] Test: End game
- [ ] Check all features work
- [ ] Share your live URL!

---

## 🔧 Troubleshooting

### **Build fails on Vercel**

**Solution 1**: Update Node.js version in Vercel
- Settings → General → Node.js Version → `18.x`

**Solution 2**: Check build logs
- Deployments → Click failed deployment → View logs

### **Environment variables not working**

**Solution**: Redeploy after adding variables
- Settings → Environment Variables → Add all variables
- Deployments → Redeploy

### **Contract not connecting**

**Solution**: Verify environment variables
```bash
# Check your live site console (F12)
console.log(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
```

Should show: `0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d`

### **"Invalid RPC URL" error**

**Solution**: Use your own Alchemy key
1. Go to https://alchemy.com
2. Create free account
3. Create new app (Sepolia network)
4. Copy HTTP URL
5. Update `NEXT_PUBLIC_RPC_URL` in Vercel

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ Build completes without errors  
✅ Site loads at your Vercel URL  
✅ Wallet connection button works  
✅ Contract address is visible in logs  
✅ Game master can be claimed  
✅ Games can be created  

---

## 📊 Expected Performance

After deployment:

- **Build Time**: 12-15 minutes
- **Deploy Time**: 2-3 minutes
- **Page Load**: < 2 seconds
- **First Paint**: < 1 second
- **Interactive**: < 3 seconds

---

## 🔗 Important URLs

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Netlify Dashboard**: https://app.netlify.com
- **Your GitHub Repo**: https://github.com/Laolex/fhevm-tutorial
- **Sepolia Etherscan**: https://sepolia.etherscan.io/address/0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d

---

## 🚀 Ready to Deploy?

### **Fastest Path (5 commands):**

```bash
# 1. Push to GitHub
cd /home/laolex/Projects/hello-fhevm-tutorial
git add -A
git commit -m "Ready for production deployment"
git push origin main

# 2. Go to Vercel
# Visit: https://vercel.com
# Sign in with GitHub
# Import your repository
# Add environment variables
# Click Deploy!

# Done! 🎉
```

---

## 📹 Need Help?

### **Video Tutorials:**
- [Deploying Next.js to Vercel](https://www.youtube.com/watch?v=7K52aQ7a4TQ)
- [Vercel Environment Variables](https://www.youtube.com/watch?v=pRbQcy9f5ew)

### **Documentation:**
- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

## ✨ After Deployment

Share your project:

```markdown
🎉 Just deployed my FHEVM dApp!

🔐 Privacy-first secret guessing game
🎲 Chainlink VRF integration
🧪 200+ tests passing
🚀 Production ready

Live demo: https://your-app.vercel.app
GitHub: https://github.com/Laolex/fhevm-tutorial

#FHEVM #Web3 #Privacy #Blockchain
```

---

**Ready? Let's deploy!** 🚀

Choose Option 1 (GitHub + Vercel) for the easiest experience.

