import { ethers } from "hardhat";

const DEFAULT_LOCK_WINDOW = 3600;

const CITY_CONFIG = [
  { cityId: 5128581, name: "New York" },
  { cityId: 2643743, name: "London" },
  { cityId: 1850147, name: "Tokyo" },
  { cityId: 2988507, name: "Paris" },
];

async function main() {
  const [admin] = await ethers.getSigners();
  const contractAddress = process.env.WEATHER_WAGER_ADDRESS;

  if (!contractAddress) {
    throw new Error("Missing WEATHER_WAGER_ADDRESS env variable");
  }

  const contract = await ethers.getContractAt("WeatherWagerBook", contractAddress);

  for (const { cityId, name } of CITY_CONFIG) {
    console.log(`Creating market for ${name} (${cityId})...`);
    const tx = await contract
      .connect(admin)
      .createCityMarket(cityId, 4, Math.floor(Date.now() / 1000) + DEFAULT_LOCK_WINDOW);
    await tx.wait();
    console.log(`✔ Market ${name} ready`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
