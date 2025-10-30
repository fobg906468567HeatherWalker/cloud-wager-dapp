/**
 * Mock Contract Deployment Script - For Local Testing
 */

const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying WeatherWager Mock version (for local testing)...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying from account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy Mock contract
  console.log("📦 Deploying WeatherWagerMock contract...");
  const WeatherWagerMock = await hre.ethers.getContractFactory("WeatherWagerMock");
  const contract = await WeatherWagerMock.deploy(deployer.address);

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("✅ Mock contract deployed successfully!");
  console.log("📍 Contract address:", contractAddress);
  console.log("");

  // Create test markets
  console.log("🏙️  Creating test markets...");

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
      console.log(`   ✅ ${city.name} market created successfully (ID: ${city.id})`);
    } catch (error) {
      console.log(`   ❌ Failed to create ${city.name} market:`, error.message);
    }
  }

  console.log("");
  console.log("🎉 Mock deployment completed!");
  console.log("");
  console.log("⚠️  Important Notes:");
  console.log("   This is a test version without real FHE encryption");
  console.log("   Only for local development and UI testing");
  console.log("");
  console.log("📝 Next Steps:");
  console.log("   1. Update .env file:");
  console.log(`      VITE_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("   2. Export ABI:");
  console.log("      npm run export-abi");
  console.log("   3. In MetaMask:");
  console.log("      - Add Localhost 8545 network");
  console.log("      - Chain ID: 31337");
  console.log("      - Import test account private key (see Hardhat node output)");
  console.log("   4. Restart frontend development server");
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
