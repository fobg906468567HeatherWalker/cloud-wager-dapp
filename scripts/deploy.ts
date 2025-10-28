import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  const gatewayAddress = process.env.FHE_GATEWAY_SIGNER || deployer.address;

  console.log("Deploying WeatherWagerBook with account:", deployer.address);

  const factory = await ethers.getContractFactory("WeatherWagerBook");
  const contract = await factory.deploy(deployer.address, gatewayAddress);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("WeatherWagerBook deployed to:", address);
  console.log("Gateway signer:", gatewayAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
