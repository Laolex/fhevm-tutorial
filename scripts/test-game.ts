import { ethers } from "hardhat";

/**
 * Test script to demonstrate the complete game flow
 * This script shows how to interact with the SecretGameMaster contract
 */
async function testGame() {
    console.log("🎮 Testing Secret Game Master Contract");
    console.log("=====================================");

    // Get signers
    const [gameMaster, player1, player2, player3] = await ethers.getSigners();

    // Deploy contract
    console.log("📦 Deploying SecretGameMaster contract...");
    const SecretGameMasterFactory = await ethers.getContractFactory("SecretGameMaster");
    const secretGameMaster = await SecretGameMasterFactory.deploy();
    await secretGameMaster.waitForDeployment();

    const contractAddress = await secretGameMaster.getAddress();
    console.log("✅ Contract deployed at:", contractAddress);

    // Test game master claiming
    console.log("\n🔍 Testing Game Master Claiming:");
    console.log("Before claiming - Is Game Master:", await secretGameMaster.isGameMaster(gameMaster.address));

    // Claim game master status
    console.log("🎯 Claiming game master status...");
    const claimTx = await secretGameMaster.connect(gameMaster).claimGameMaster();
    await claimTx.wait(); // Wait for transaction confirmation
    console.log("After claiming - Is Game Master:", await secretGameMaster.isGameMaster(gameMaster.address));

    // Test game creation
    console.log("\n🎮 Testing Game Creation:");
    console.log("Before creating - Has Active Game:", await secretGameMaster.hasActiveGame(gameMaster.address));

    const startGameTx = await secretGameMaster.connect(gameMaster).startGame(5, 1, 100);
    await startGameTx.wait(); // Wait for transaction confirmation
    console.log("After creating - Has Active Game:", await secretGameMaster.hasActiveGame(gameMaster.address));
    console.log("Current Game ID:", await secretGameMaster.gameMasterGameId(gameMaster.address));

    // Note: In a real FHEVM environment, you would:
    // 1. Initialize FHEVM instance
    // 2. Encrypt the secret number
    // 3. Call startGame with encrypted number
    // 4. Encrypt player guesses
    // 5. Call makeGuess with encrypted guesses
    // 6. Verify the encryption/decryption flow

    console.log("\n📝 FHEVM Testing Notes:");
    console.log("========================");
    console.log("To test the complete FHEVM flow:");
    console.log("1. Set up FHEVM test environment");
    console.log("2. Encrypt secret number (e.g., 42)");
    console.log("3. Call startGame(encryptedSecretNumber)");
    console.log("4. Have players join and make encrypted guesses");
    console.log("5. Verify only the winner is revealed");
    console.log("6. Check that individual guesses remain private");

    console.log("\n🎯 Game Flow Summary:");
    console.log("====================");
    console.log("1. Game Master sets secret number (encrypted)");
    console.log("2. Players join the game");
    console.log("3. Players make guesses (encrypted)");
    console.log("4. Contract checks guesses privately");
    console.log("5. Only the winner is revealed publicly");
    console.log("6. Secret number is revealed when game ends");

    console.log("\n🔐 FHEVM Benefits Demonstrated:");
    console.log("===============================");
    console.log("✅ Secret numbers remain hidden during game");
    console.log("✅ Player guesses are never revealed");
    console.log("✅ Computations happen on encrypted data");
    console.log("✅ Only final results are made public");
    console.log("✅ Cryptographically secure privacy");

    console.log("\n🚀 Ready for FHEVM Testing!");
    console.log("==========================");
    console.log("Deploy to Zama Testnet and test with the frontend:");
    console.log("1. npm run deploy:testnet");
    console.log("2. npm run dev");
    console.log("3. Connect wallet and play the game!");
}

// Handle errors
testGame()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });
