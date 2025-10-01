import { ethers } from "hardhat";

async function main() {
    console.log("🚀 Deploying SecretGameMasterEnhanced...");

    // Chainlink VRF Configuration for Sepolia
    const VRF_COORDINATOR = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // Sepolia VRF Coordinator
    const KEY_HASH = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"; // 30 gwei Key Hash
    const SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "1"; // You need to create this on Chainlink
    const CALLBACK_GAS_LIMIT = 100000;

    console.log("\n📋 Deployment Configuration:");
    console.log("- VRF Coordinator:", VRF_COORDINATOR);
    console.log("- Key Hash:", KEY_HASH);
    console.log("- Subscription ID:", SUBSCRIPTION_ID);
    console.log("- Callback Gas Limit:", CALLBACK_GAS_LIMIT);

    const [deployer] = await ethers.getSigners();
    console.log("\n👤 Deploying from:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

    if (balance < ethers.parseEther("0.01")) {
        console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.");
    }

    // Deploy the contract
    const SecretGameMasterEnhanced = await ethers.getContractFactory("SecretGameMasterEnhanced");
    console.log("\n⏳ Deploying contract...");

    const contract = await SecretGameMasterEnhanced.deploy(
        VRF_COORDINATOR,
        SUBSCRIPTION_ID,
        KEY_HASH,
        CALLBACK_GAS_LIMIT
    );

    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();

    console.log("\n✅ SecretGameMasterEnhanced deployed successfully!");
    console.log("📍 Contract address:", contractAddress);

    // Save deployment info
    const deploymentInfo = {
        network: "sepolia",
        contractAddress: contractAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        vrfCoordinator: VRF_COORDINATOR,
        keyHash: KEY_HASH,
        subscriptionId: SUBSCRIPTION_ID,
        callbackGasLimit: CALLBACK_GAS_LIMIT
    };

    console.log("\n📝 Deployment Info:", JSON.stringify(deploymentInfo, null, 2));

    // Instructions
    console.log("\n📚 Next Steps:");
    console.log("1. Create a Chainlink VRF subscription at: https://vrf.chain.link/");
    console.log("2. Fund your subscription with LINK tokens");
    console.log(`3. Add this contract (${contractAddress}) as a consumer to your subscription`);
    console.log(`4. Update your frontend .env.local with: NEXT_PUBLIC_CONTRACT_ADDRESS=${contractAddress}`);
    console.log("5. Verify the contract on Etherscan (optional):");
    console.log(`   npx hardhat verify --network sepolia ${contractAddress} ${VRF_COORDINATOR} ${SUBSCRIPTION_ID} ${KEY_HASH} ${CALLBACK_GAS_LIMIT}`);

    return contractAddress;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

