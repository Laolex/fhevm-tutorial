import { ethers } from "hardhat";

/**
 * Contract verification script for Zama Testnet
 * This script helps verify your deployed contract on the block explorer
 */
async function verifyContract() {
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!contractAddress) {
        console.error("❌ Contract address not found in environment variables");
        console.log("Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file");
        process.exit(1);
    }

    console.log("🔍 Verifying SecretGame Contract");
    console.log("=================================");
    console.log("Contract Address:", contractAddress);
    console.log("Network: Zama Testnet");

    try {
        // Note: Contract verification on Zama Testnet may require
        // specific configuration. Check Zama documentation for details.

        console.log("\n📋 Verification Steps:");
        console.log("=====================");
        console.log("1. Ensure your contract is deployed");
        console.log("2. Check Zama Explorer for verification requirements");
        console.log("3. Use the appropriate verification method");

        console.log("\n🔗 Useful Links:");
        console.log("================");
        console.log("Zama Explorer:", `https://explorer.zama.ai/address/${contractAddress}`);
        console.log("Zama Documentation:", "https://docs.zama.ai/");

        console.log("\n✅ Contract verification information displayed");
        console.log("Check the Zama Explorer to see your contract!");

    } catch (error) {
        console.error("❌ Verification failed:", error);
        process.exit(1);
    }
}

// Handle errors
verifyContract()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    });
