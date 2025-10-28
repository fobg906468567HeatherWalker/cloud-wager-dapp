/**
 * Deployment Script for WeatherWager Contract
 * 
 * Deploys to Sepolia testnet with proper configuration
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting WeatherWager deployment to Sepolia...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // FHE Gateway address for Sepolia testnet
  const GATEWAY_ADDRESS = "0x33347831500F1e73f0ccCBb95c9f86B94d7b1123"; // Zama FHE Gateway on Sepolia
  
  console.log("📋 Deployment Configuration:");
  console.log("   Admin:", deployer.address);
  console.log("   Gateway:", GATEWAY_ADDRESS);
  console.log("");

  // Deploy contract
  console.log("📦 Deploying WeatherWagerBook contract...");
  const WeatherWagerBook = await hre.ethers.getContractFactory("WeatherWagerBook");
  const contract = await WeatherWagerBook.deploy(deployer.address, GATEWAY_ADDRESS);

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
      const tx = await contract.createCityMarket(city.id, 4, city.lockTime);
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
  console.log("   1. Verify contract on Etherscan:");
  console.log(`      npx hardhat verify --network sepolia ${contractAddress} "${deployer.address}" "${GATEWAY_ADDRESS}"`);
  console.log("   2. Update VITE_CONTRACT_ADDRESS in .env:");
  console.log(`      VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   3. Export ABI:");
  console.log("      npm run export-abi");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
