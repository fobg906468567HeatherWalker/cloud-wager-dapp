/**
 * Deployment Script for WeatherWager Contract using Private Key
 *
 * This script bypasses the fhEVM hardhat plugin restriction
 * and deploys directly using ethers.js with private key
 */

const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv/config");

async function main() {
  console.log("🚀 Starting WeatherWager deployment to Sepolia...\n");

  // Load contract artifacts
  const artifactPath = path.join(__dirname, "../artifacts/contracts/WeatherWagerBook.sol/WeatherWagerBook.json");
  if (!fs.existsSync(artifactPath)) {
    throw new Error("Contract not compiled! Run: npm run hardhat:compile");
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("📍 Deploying from account:", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  if (balance < ethers.parseEther("0.01")) {
    throw new Error("Insufficient balance for deployment (need at least 0.01 ETH)");
  }

  // FHE Gateway address for Sepolia testnet
  const GATEWAY_ADDRESS = "0x33347831500F1e73f0ccCBb95c9f86B94d7b1123";

  console.log("📋 Deployment Configuration:");
  console.log("   Admin:", wallet.address);
  console.log("   Gateway:", GATEWAY_ADDRESS);
  console.log("");

  // Deploy contract
  console.log("📦 Deploying WeatherWagerBook contract...");
  const ContractFactory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await ContractFactory.deploy(wallet.address, GATEWAY_ADDRESS, {
    gasLimit: 10000000 // Set high gas limit for FHE contract
  });

  console.log("⏳ Waiting for deployment transaction...");
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("");

  // Create initial city markets
  console.log("🏙️  Creating initial city markets...");

  const cities = [
    { id: 1, name: "New York", lockTime: Math.floor(Date.now() / 1000) + 86400 },
    { id: 2, name: "London", lockTime: Math.floor(Date.now() / 1000) + 86400 },
    { id: 3, name: "Tokyo", lockTime: Math.floor(Date.now() / 1000) + 86400 },
  ];

  for (const city of cities) {
    try {
      const tx = await contract.createCityMarket(city.id, 4, city.lockTime, {
        gasLimit: 3000000
      });
      await tx.wait();
      console.log(`   ✓ Created market for ${city.name} (ID: ${city.id})`);
    } catch (error) {
      console.log(`   ✗ Failed to create market for ${city.name}:`, error.message);
    }
  }

  console.log("");
  console.log("🎉 Deployment completed successfully!");
  console.log("");
  console.log("📝 Next steps:");
  console.log("   1. Update VITE_CONTRACT_ADDRESS in .env:");
  console.log(`      VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Export ABI:");
  console.log("      npm run export-abi");
  console.log("   3. View on Sepolia Etherscan:");
  console.log(`      https://sepolia.etherscan.io/address/${contractAddress}`);
  console.log("");

  // Save deployment info to file
  const deploymentInfo = {
    network: "sepolia",
    contractAddress: contractAddress,
    deployer: wallet.address,
    gateway: GATEWAY_ADDRESS,
    timestamp: new Date().toISOString(),
    txHash: contract.deploymentTransaction().hash
  };

  fs.writeFileSync(
    path.join(__dirname, "../deployment-info.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("💾 Deployment info saved to deployment-info.json\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
