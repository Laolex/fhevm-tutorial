# Hello FHEVM Tutorial - Secret Number Guessing Game

A complete, beginner-friendly tutorial for building your first dApp using FHEVM (Fully Homomorphic Encryption Virtual Machine) on the Zama Protocol. This project demonstrates how to create a confidential blockchain application where players can make encrypted guesses without revealing their numbers.

## 🌐 Live Demo & Resources

🎮 **Live Demo**: [https://fhevm-tutorial-silk.vercel.app](https://fhevm-tutorial-silk.vercel.app)

📹 **Video Tutorials**: [Watch on YouTube](https://www.youtube.com/playlist?list=PLNnitpBlq82_y_zHSfLzRAUx0KU3QqAAC)

🔗 **GitHub Repository**: [https://github.com/Laolex/fhevm-tutorial](https://github.com/Laolex/fhevm-tutorial)

## 🎯 Project Overview

This is a **Secret Number Guessing Game** where:
- **Game Masters** create game rooms with custom ranges and invite codes
- **Players** join games and make encrypted guesses (max 3 per player)
- **Winners** are determined when someone guesses the secret number correctly
- **All guesses are encrypted** using FHEVM, ensuring privacy

## 🚀 Features

### For Game Masters
- ✅ Claim game master status with one transaction
- ✅ Create custom game rooms with ranges and player limits
- ✅ Generate unique invite codes for each game
- ✅ Activate games to start accepting players
- ✅ End games manually or automatically
- ✅ Participate in their own games

### For Players
- ✅ Browse available game rooms
- ✅ Join games using invite codes
- ✅ Make up to 3 encrypted guesses per game
- ✅ See real-time game status and player count
- ✅ Receive notifications for successful guesses
- ✅ Auto-end when all players reach guess limit

### Technical Features
- 🔐 **Fully Homomorphic Encryption** for private computations
- 🎮 **Real-time game state** updates
- 📱 **Responsive design** with modern UI
- 🔗 **Wallet integration** with MetaMask
- ⚡ **Optimized performance** with state management
- 🎯 **Auto-game ending** when conditions are met

## 🛠️ Tech Stack

### Smart Contracts
- **Solidity** for contract development
- **Hardhat** for development and deployment
- **FHEVM** for encrypted computations
- **Sepolia Testnet** for deployment

### Frontend
- **Next.js 15** with React 18
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Wagmi** for wallet integration
- **RainbowKit** for wallet connection UI

### Development Tools
- **Hardhat** for contract compilation and deployment
- **TypeScript** for type-safe development
- **ESLint** for code quality
- **Prettier** for code formatting

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **MetaMask** wallet installed
- **Sepolia ETH** for gas fees (get from [Sepolia Faucet](https://sepoliafaucet.com/))
- Basic knowledge of **Solidity** and **React**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Laolex/fhevm-tutorial.git
cd fhevm-tutorial
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the `frontend` directory:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0xa7B5206e874176a3B9E0a8F53ecd6A8F2aa2712d
NEXT_PUBLIC_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/knSF5BWiIjxRpI4e7ELZsH0Jk5Yf9Wi2
```

### 4. Deploy Smart Contracts

```bash
# Deploy the SecretGameMaster contract
npm run deploy:game-master
```

### 5. Start the Development Server

```bash
# Start the frontend development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🎮 How to Play

### As a Game Master

1. **Connect your wallet** to the Sepolia testnet
2. **Claim Game Master status** (one-time transaction)
3. **Create a game room** with custom settings:
   - Set number range (e.g., 1-100)
   - Set maximum players (e.g., 5)
4. **Activate the game** to start accepting players
5. **Share the invite code** with players
6. **Monitor the game** and end it when needed

### As a Player

1. **Connect your wallet** to the Sepolia testnet
2. **Browse available games** or use an invite code
3. **Join a game** by clicking "Join Game"
4. **Make your guesses** (up to 3 per game):
   - Enter your secret number guess
   - Enter your prediction for total guesses
5. **Wait for results** - the game ends when someone guesses correctly or all players reach their limit

## 🔐 FHEVM Integration

This project demonstrates key FHEVM concepts:

### Encrypted Computations
- **Secret numbers** are encrypted using FHEVM
- **Guesses** are processed without revealing the actual numbers
- **Comparisons** happen in encrypted space
- **Results** are decrypted only when necessary

### Privacy Benefits
- Players can't see each other's guesses
- Game masters can't see individual guesses
- Only the final result is revealed
- All computations maintain privacy

## 📁 Project Structure

```
hello-fhevm-tutorial/
├── contracts/
│   └── SecretGameMaster.sol          # Main game contract
├── scripts/
│   └── deploy-game-master.ts        # Deployment script
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx             # Main application page
│   │   │   ├── providers.tsx        # Wagmi/RainbowKit setup
│   │   │   └── globals.css          # Global styles
│   │   ├── components/
│   │   │   ├── GameHeader.tsx       # Application header
│   │   │   ├── GameModeSelector.tsx # Game mode selection
│   │   │   ├── GameMasterPanel.tsx  # Game master interface
│   │   │   ├── ParticipantGameInterface.tsx # Player interface
│   │   │   └── DynamicGamesList.tsx # Games list
│   │   └── hooks/
│   │       └── useGameMaster.ts     # Game master hook
│   └── package.json
├── hardhat.config.ts
└── README.md
```

## 🧪 Testing

### Manual Testing

1. **Deploy contracts** to Sepolia testnet
2. **Connect wallet** and test game master flow
3. **Create game rooms** with different settings
4. **Join games** as different players
5. **Test encrypted guessing** functionality
6. **Verify auto-ending** when conditions are met

### Test Scenarios

- ✅ Game master can create and manage games
- ✅ Players can join games using invite codes
- ✅ Encrypted guesses work correctly
- ✅ Game ends automatically when won
- ✅ Game ends when all players reach guess limit
- ✅ Winner is correctly identified
- ✅ Privacy is maintained throughout

## 🚀 Deployment

### Smart Contracts

```bash
# Deploy to Sepolia testnet
npm run deploy:game-master
```

### Frontend Deployment

The frontend can be deployed to any static hosting service:

- **Vercel** (recommended for Next.js)
- **Netlify**
- **GitHub Pages**
- **AWS S3 + CloudFront**

### Environment Variables

For production deployment, set these environment variables:

```env
NEXT_PUBLIC_CONTRACT_ADDRESS=<deployed_contract_address>
NEXT_PUBLIC_RPC_URL=<rpc_endpoint>
```

## 🎯 Zama Bounty Requirements

This project meets all requirements for the [Zama Bounty Program Season 10](https://www.zama.ai/post/zama-bounty-program-season-10-create-a-hello-fhevm-tutorial):

### ✅ Core Requirements Met

- **Beginner-friendly tutorial** with step-by-step instructions
- **Complete dApp example** (smart contract + frontend)
- **FHEVM integration** with encrypted computations
- **Reproducible setup** with clear documentation
- **Educational value** for new FHEVM developers

### ✅ Target Audience

- **Basic Solidity knowledge** required
- **No prior FHE knowledge** needed
- **Standard Ethereum tools** (Hardhat, MetaMask, React)
- **Zero cryptography background** assumed

### ✅ Learning Objectives

- ✅ Understand FHEVM basics and importance
- ✅ Set up development environment
- ✅ Deploy and interact with FHEVM dApp
- ✅ Build confidence for advanced use cases

### ✅ Tutorial Features

- ✅ **Full dApp example** (not just snippets)
- ✅ **Clear setup instructions** (Hardhat, fhevmjs, wallet)
- ✅ **Complete encryption → computation → decryption** workflow
- ✅ **Reproducible** by any developer with basic Solidity knowledge
- ✅ **Multiple formats** (written guide + code examples)

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama Protocol** for FHEVM technology
- **Hardhat** for development framework
- **Next.js** for frontend framework
- **Wagmi** for wallet integration
- **Tailwind CSS** for styling

## 📞 Support

- **GitHub Issues** for bug reports
- **Discord** for community support
- **Documentation** for detailed guides

---

**Built with ❤️ for the FHEVM community**

*This project is part of the Zama Bounty Program Season 10: Create a "Hello FHEVM" Tutorial*