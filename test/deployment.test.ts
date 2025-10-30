/**
 * Deployment Test Suite
 *
 * Tests deployment process and post-deployment verification
 * Ensures contract is correctly deployed to Sepolia testnet
 *
 * @author Web3 Test Engineer
 */

import { expect } from "chai";
import { ethers } from "hardhat";
import type { WeatherWagerBook } from "../types";

describe("Deployment Test Suite", function () {
  let contract: WeatherWagerBook;
  let deployerAddress: string;
  let gatewayAddress: string;

  // Sepolia Gateway address (from Zama docs)
  const SEPOLIA_GATEWAY = "0x33347831500F1e73f0ccCBb95c9f86B94d7b1123";

  describe("1. Contract Deployment", function () {
    it("should deploy contract successfully", async function () {
      const [deployer] = await ethers.getSigners();
      deployerAddress = await deployer.getAddress();
      gatewayAddress = SEPOLIA_GATEWAY;

      const factory = await ethers.getContractFactory("WeatherWagerBook");
      contract = (await factory.deploy(
        deployerAddress,
        gatewayAddress
      )) as WeatherWagerBook;

      await contract.waitForDeployment();

      const contractAddress = await contract.getAddress();
      console.log(`      ✅ Contract deployed at: ${contractAddress}`);

      expect(contractAddress).to.be.properAddress;
    });

    it("should have correct deployment parameters", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
    });
  });

  describe("2. Post-Deployment Verification", function () {
    it("should have deployer as admin", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const hasRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, deployerAddress);
      expect(hasRole).to.be.true;
      console.log(`      ✅ Deployer has admin role`);
    });

    it("should have deployer as market creator", async function () {
      const MARKET_ROLE = await contract.MARKET_ROLE();
      const hasRole = await contract.hasRole(MARKET_ROLE, deployerAddress);
      expect(hasRole).to.be.true;
      console.log(`      ✅ Deployer has market role`);
    });

    it("should have deployer as oracle", async function () {
      const ORACLE_ROLE = await contract.ORACLE_ROLE();
      const hasRole = await contract.hasRole(ORACLE_ROLE, deployerAddress);
      expect(hasRole).to.be.true;
      console.log(`      ✅ Deployer has oracle role`);
    });

    it("should have gateway role configured", async function () {
      const GATEWAY_ROLE = await contract.GATEWAY_ROLE();
      const hasRole = await contract.hasRole(GATEWAY_ROLE, gatewayAddress);
      expect(hasRole).to.be.true;
      console.log(`      ✅ Gateway has gateway role`);
    });

    it("should have correct initial state", async function () {
      expect(await contract.ticketCount()).to.equal(0);
      expect(await contract.requestCount()).to.equal(0);
      console.log(`      ✅ Initial state verified`);
    });

    it("should have correct constants", async function () {
      expect(await contract.SCALE()).to.equal(1_000_000);
      expect(await contract.MAX_CONDITIONS()).to.equal(4);
      console.log(`      ✅ Constants verified`);
    });
  });

  describe("3. Initial Market Setup", function () {
    it("should create initial city markets", async function () {
      const [deployer] = await ethers.getSigners();
      const lockTime = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours from now

      const cities = [
        { id: 1, name: "New York" },
        { id: 2, name: "London" },
        { id: 3, name: "Tokyo" },
        { id: 4, name: "Paris" },
      ];

      for (const city of cities) {
        await contract.connect(deployer).createCityMarket(city.id, 4, lockTime);
        console.log(`      ✅ Created market for ${city.name}`);
      }

      // Verify all markets exist
      for (const city of cities) {
        const market = await contract.getCityMarket(city.id);
        expect(market.exists).to.be.true;
      }

      console.log(`      ✅ All initial markets created successfully`);
    });
  });

  describe("4. Contract Verification Data", function () {
    it("should output contract verification data", async function () {
      const contractAddress = await contract.getAddress();

      console.log(`\n      📋 Contract Verification Data:`);
      console.log(`      ═══════════════════════════════════════`);
      console.log(`      Contract Address: ${contractAddress}`);
      console.log(`      Gateway Address:  ${gatewayAddress}`);
      console.log(`      Admin Address:    ${deployerAddress}`);
      console.log(`      ═══════════════════════════════════════\n`);

      console.log(`      📝 Etherscan Verification Command:`);
      console.log(`      npx hardhat verify --network sepolia ${contractAddress} "${deployerAddress}" "${gatewayAddress}"`);
      console.log();
    });
  });
});
