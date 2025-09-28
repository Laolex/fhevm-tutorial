import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Starting SecretGameMaster deployment to Sepolia...");

    // Get the deployer account
    const signers = await ethers.getSigners();
    if (signers.length === 0) {
        throw new Error("No signers found. Please check your private key configuration.");
    }

    const deployer = signers[0];
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());

    // Get the contract factory
    const SecretGameMaster = await ethers.getContractFactory("SecretGameMaster");

    // Deploy the contract
    console.log("📦 Deploying SecretGameMaster contract...");
    const gameMasterContract = await SecretGameMaster.deploy();

    // Wait for deployment to complete
    await gameMasterContract.waitForDeployment();

    const contractAddress = await gameMasterContract.getAddress();

    console.log("✅ SecretGameMaster deployed successfully!");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🔗 Network: Sepolia Testnet");
    console.log("👤 Deployer:", deployer.address);

    console.log("\n📋 Next Steps:");
    console.log("1. Update your .env file:");
    console.log(`   NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("2. Restart your frontend development server");
    console.log("3. Test the 'Start as Game Master' functionality");

    console.log("\n🎮 How to use:");
    console.log("1. Connect your wallet to the frontend");
    console.log("2. Click 'Start as Game Master'");
    console.log("3. Sign the transaction to claim game master status");
    console.log("4. Configure your game settings");
    console.log("5. Share the invite code with other players");

    console.log("\n💡 Features:");
    console.log("• Users can claim game master status");
    console.log("• Each game master can create one active game");
    console.log("• Invite code system for easy game joining");
    console.log("• Blockchain-random secret number generation");
    console.log("• Customizable game rules");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
