import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
    console.log("🚀 Deploying SecretGameMasterV2 with Chainlink VRF...\n");

    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);

    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

    // Check if we have enough balance
    if (balance < ethers.parseEther("0.01")) {
        console.warn("⚠️  Warning: Low balance. You may need more ETH for deployment.");
    }

    // Chainlink VRF Configuration
    // Default to Sepolia testnet
    const network = await ethers.provider.getNetwork();
    const chainId = network.chainId;

    let vrfCoordinator: string;
    let keyHash: string;
    let subscriptionId: bigint;

    console.log("🌐 Network detected:", chainId.toString());

    if (chainId === 11155111n) {
        // Sepolia
        vrfCoordinator = process.env.VRF_COORDINATOR_SEPOLIA || "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
        keyHash = process.env.VRF_KEY_HASH_SEPOLIA || "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c";
        subscriptionId = BigInt(process.env.VRF_SUBSCRIPTION_ID || "1");
        console.log("📍 Network: Sepolia Testnet");
    } else if (chainId === 1n) {
        // Mainnet
        vrfCoordinator = process.env.VRF_COORDINATOR_MAINNET || "0x271682DEB8C4E0901D1a1550aD2e64D568E69909";
        keyHash = process.env.VRF_KEY_HASH_MAINNET || "0x8af398995b04c28e9951adb9721ef74c74f93e6a478f39e7e0777be13527e7ef";
        subscriptionId = BigInt(process.env.VRF_SUBSCRIPTION_ID || "0");
        console.log("📍 Network: Ethereum Mainnet");
        
        if (subscriptionId === 0n) {
            throw new Error("VRF_SUBSCRIPTION_ID must be set for mainnet deployment");
        }
    } else {
        console.error("❌ Unsupported network. Please use Sepolia or Mainnet.");
        process.exit(1);
    }

    console.log("\n⚙️  Chainlink VRF Configuration:");
    console.log("   • Coordinator:", vrfCoordinator);
    console.log("   • Key Hash:", keyHash);
    console.log("   • Subscription ID:", subscriptionId.toString());

    console.log("\n📦 Deploying contract...");

    try {
        const SecretGameMasterV2 = await ethers.getContractFactory("SecretGameMasterV2");
        const contract = await SecretGameMasterV2.deploy(
            vrfCoordinator,
            keyHash,
            subscriptionId
        );

        console.log("⏳ Waiting for deployment confirmation...");
        await contract.waitForDeployment();
        
        const address = await contract.getAddress();

        console.log("\n✅ SUCCESS! Contract deployed to:", address);
        
        // Verify contract is working
        console.log("\n🔍 Verifying deployment...");
        const nextGameId = await contract.nextGameId();
        console.log("   • Next Game ID:", nextGameId.toString());

        // Save deployment info
        const deploymentInfo = {
            network: chainId === 11155111n ? "sepolia" : "mainnet",
            chainId: chainId.toString(),
            contractAddress: address,
            contractVersion: "v2",
            deployer: deployer.address,
            deploymentTime: new Date().toISOString(),
            vrfConfig: {
                coordinator: vrfCoordinator,
                keyHash: keyHash,
                subscriptionId: subscriptionId.toString()
            },
            transactionHash: contract.deploymentTransaction()?.hash
        };

        const filename = `deployment-v2-${chainId}.json`;
        fs.writeFileSync(
            filename,
            JSON.stringify(deploymentInfo, null, 2)
        );

        console.log("\n✅ Deployment info saved to:", filename);

        console.log("\n📋 Next Steps:");
        console.log("   1. Add this contract as a VRF consumer:");
        console.log("      → Visit: https://vrf.chain.link");
        console.log("      → Add consumer:", address);
        console.log("\n   2. Fund your VRF subscription with LINK tokens:");
        console.log("      → Minimum 2 LINK for testnet");
        console.log("      → Minimum 5 LINK for mainnet");
        console.log("\n   3. Update frontend environment variables:");
        console.log("      → NEXT_PUBLIC_CONTRACT_ADDRESS=" + address);
        console.log("      → NEXT_PUBLIC_CONTRACT_VERSION=v2");
        console.log("\n   4. Verify contract on Etherscan:");
        console.log("      → npx hardhat verify --network", 
                    chainId === 11155111n ? "sepolia" : "mainnet", 
                    address,
                    vrfCoordinator,
                    keyHash,
                    subscriptionId.toString());

        console.log("\n🎉 Deployment complete!");

    } catch (error) {
        console.error("\n❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

