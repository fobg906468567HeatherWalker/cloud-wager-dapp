/**
 * Local Hardhat Network Deployment Script
 *
 * Uses fhEVM mocks for local testing
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting local deployment of WeatherWager...\n");

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Use mock gateway address for local network
  const GATEWAY_ADDRESS = deployer.address; // Use deployer address as gateway for local testing

  console.log("📋 Deployment Configuration:");
  console.log("   Admin:", deployer.address);
  console.log("   Gateway:", GATEWAY_ADDRESS);
  console.log("   Network: localhost (Hardhat)");
  console.log("");

  // Deploy contract
  console.log("📦 Deploying WeatherWagerBookFixed contract...");
  const WeatherWagerBookFixed = await hre.ethers.getContractFactory("WeatherWagerBookFixed");
  const contract = await WeatherWagerBookFixed.deploy(deployer.address, GATEWAY_ADDRESS);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("");

  // Create initial city markets
  console.log("🏙️  Creating initial city markets...");

  const cities = [
    { id: 1, name: "New York" },
    { id: 2, name: "London" },
    { id: 3, name: "Tokyo" },
  ];

  const lockTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now

  for (const city of cities) {
    try {
      const tx = await contract.createCityMarket(city.id, 4, lockTime);
      await tx.wait();
      console.log(`   ✓ Created ${city.name} market (ID: ${city.id})`);
    } catch (error) {
      console.log(`   ✗ Failed to create ${city.name} market:`, error.message);
    }
  }

  console.log("");
  console.log("🎉 Local deployment completed!");
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Copy contract address to .env file:");
  console.log(`      VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Export ABI:");
  console.log("      npm run export-abi");
  console.log("   3. Restart frontend development server");
  console.log("   4. Connect MetaMask to localhost:8545");
  console.log("");
  console.log("💡 Tip: Make sure MetaMask is connected to localhost network");
  console.log("   - Network name: Localhost 8545");
  console.log("   - RPC URL: http://localhost:8545");
  console.log("   - Chain ID: 31337");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
