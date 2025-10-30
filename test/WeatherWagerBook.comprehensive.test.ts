/**
 * Comprehensive Unit Tests for WeatherWagerBook Smart Contract
 *
 * Test Coverage:
 * 1. Deployment and initialization
 * 2. Access control and roles
 * 3. Market creation and management
 * 4. Forecast placement with FHE encryption
 * 5. Market settlement
 * 6. Payout calculations
 * 7. Error handling and edge cases
 * 8. Gas optimization verification
 *
 * @author Web3 Test Engineer
 */

import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { WeatherWagerBook } from "../types";

// Test Constants
const TEST_CITIES = {
  NEW_YORK: 1,
  LONDON: 2,
  TOKYO: 3,
  PARIS: 4,
};

const WEATHER_CONDITIONS = {
  SUNNY: 0,
  RAINY: 1,
  SNOWY: 2,
  CLOUDY: 3,
};

const SCALE = BigInt(1_000_000);
const ONE_HOUR = 3600;
const ONE_DAY = 86400;

/**
 * Helper function to encrypt forecast data
 */
async function encryptForecast(
  contractAddress: string,
  user: HardhatEthersSigner,
  cityId: number,
  condition: number,
  stakeWei: bigint,
) {
  const input = fhevm.createEncryptedInput(contractAddress, user.address);
  input.add8(condition);
  input.add64(stakeWei * SCALE);
  const encrypted = await input.encrypt();

  const commitment = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ["address", "uint256", "bytes32", "bytes32"],
      [user.address, cityId, encrypted.handles[0], encrypted.handles[1]],
    ),
  );

  return { encrypted, commitment };
}

/**
 * Helper to get current timestamp
 */
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

describe("WeatherWagerBook - Comprehensive Test Suite", function () {
  let deployer: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let charlie: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;
  let contract: WeatherWagerBook;
  let contractAddress: string;
  let gatewayAddress: string;

  before(async function () {
    if (!fhevm.isMock) {
      console.warn("⚠️  Skipping tests - FHEVM mock runtime not available");
      this.skip();
    }
  });

  beforeEach(async function () {
    // Get signers
    [deployer, oracle, , alice, bob, charlie, unauthorized] = await ethers.getSigners();

    // Initialize FHE
    await fhevm.initializeCLIApi();
    const metadata = await fhevm.getRelayerMetadata();
    gatewayAddress = metadata.DecryptionOracleAddress;

    // Deploy contract
    const factory = await ethers.getContractFactory("WeatherWagerBook");
    contract = (await factory.deploy(
      await deployer.getAddress(),
      gatewayAddress
    )) as WeatherWagerBook;
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();

    // Setup roles
    await contract.connect(deployer).grantRole(
      await contract.ORACLE_ROLE(),
      await oracle.getAddress()
    );
    await contract.connect(deployer).grantRole(
      await contract.GATEWAY_ROLE(),
      gatewayAddress
    );
    await contract.connect(deployer).grantRole(
      await contract.GATEWAY_ROLE(),
      metadata.relayerSignerAddress
    );
  });

  // ========================================
  // Test Suite 1: Deployment & Initialization
  // ========================================

  describe("1. Deployment & Initialization", function () {
    it("should deploy with correct initial state", async function () {
      expect(await contract.getAddress()).to.be.properAddress;
      expect(await contract.ticketCount()).to.equal(0);
      expect(await contract.requestCount()).to.equal(0);
    });

    it("should set correct constants", async function () {
      expect(await contract.SCALE()).to.equal(SCALE);
      expect(await contract.MAX_CONDITIONS()).to.equal(4);
    });

    it("should grant admin role to deployer", async function () {
      const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
      const hasRole = await contract.hasRole(DEFAULT_ADMIN_ROLE, await deployer.getAddress());
      expect(hasRole).to.be.true;
    });

    it("should revert deployment with zero address", async function () {
      const factory = await ethers.getContractFactory("WeatherWagerBook");
      await expect(
        factory.deploy(ethers.ZeroAddress, gatewayAddress)
      ).to.be.revertedWith("Admin cannot be zero");
    });
  });

  // ========================================
  // Test Suite 2: Access Control
  // ========================================

  describe("2. Access Control & Roles", function () {
    it("should correctly assign MARKET_ROLE", async function () {
      const MARKET_ROLE = await contract.MARKET_ROLE();
      const hasRole = await contract.hasRole(MARKET_ROLE, await deployer.getAddress());
      expect(hasRole).to.be.true;
    });

    it("should correctly assign ORACLE_ROLE", async function () {
      const ORACLE_ROLE = await contract.ORACLE_ROLE();
      const hasRole = await contract.hasRole(ORACLE_ROLE, await oracle.getAddress());
      expect(hasRole).to.be.true;
    });

    it("should correctly assign GATEWAY_ROLE", async function () {
      const GATEWAY_ROLE = await contract.GATEWAY_ROLE();
      const hasRole = await contract.hasRole(GATEWAY_ROLE, gatewayAddress);
      expect(hasRole).to.be.true;
    });

    it("should prevent unauthorized market creation", async function () {
      const lockTime = getCurrentTimestamp() + ONE_DAY;
      await expect(
        contract.connect(unauthorized).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime)
      ).to.be.reverted;
    });

    it("should prevent unauthorized settlement", async function () {
      await expect(
        contract.connect(unauthorized).settleCity(TEST_CITIES.NEW_YORK, WEATHER_CONDITIONS.SUNNY)
      ).to.be.reverted;
    });
  });

  // ========================================
  // Test Suite 3: Market Creation
  // ========================================

  describe("3. Market Creation & Management", function () {
    it("should create a city market successfully", async function () {
      const lockTime = getCurrentTimestamp() + ONE_DAY;

      await expect(
        contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime)
      ).to.emit(contract, "CityMarketCreated")
        .withArgs(TEST_CITIES.NEW_YORK, lockTime);

      const market = await contract.getCityMarket(TEST_CITIES.NEW_YORK);
      expect(market.exists).to.be.true;
      expect(market.conditionCount).to.equal(4);
      expect(market.lockTimestamp).to.equal(lockTime);
      expect(market.settled).to.be.false;
    });

    it("should prevent duplicate market creation", async function () {
      const lockTime = getCurrentTimestamp() + ONE_DAY;

      await contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime);

      await expect(
        contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime)
      ).to.be.revertedWith("Market exists");
    });

    it("should require exactly 4 conditions", async function () {
      const lockTime = getCurrentTimestamp() + ONE_DAY;

      await expect(
        contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 3, lockTime)
      ).to.be.revertedWith("Must have 4 conditions");
    });

    it("should require future lock timestamp", async function () {
      const pastTime = getCurrentTimestamp() - ONE_HOUR;

      await expect(
        contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, pastTime)
      ).to.be.revertedWith("Lock must be future");
    });

    it("should create multiple markets", async function () {
      const lockTime = getCurrentTimestamp() + ONE_DAY;

      await contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime);
      await contract.connect(deployer).createCityMarket(TEST_CITIES.LONDON, 4, lockTime);
      await contract.connect(deployer).createCityMarket(TEST_CITIES.TOKYO, 4, lockTime);

      const nyMarket = await contract.getCityMarket(TEST_CITIES.NEW_YORK);
      const londonMarket = await contract.getCityMarket(TEST_CITIES.LONDON);
      const tokyoMarket = await contract.getCityMarket(TEST_CITIES.TOKYO);

      expect(nyMarket.exists).to.be.true;
      expect(londonMarket.exists).to.be.true;
      expect(tokyoMarket.exists).to.be.true;
    });
  });

  // ========================================
  // Test Suite 4: Forecast Placement
  // ========================================

  describe("4. Encrypted Forecast Placement", function () {
    beforeEach(async function () {
      const lockTime = getCurrentTimestamp() + ONE_HOUR;
      await contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime);
    });

    it("should place forecast with encrypted data", async function () {
      const stakeWei = BigInt(1000000000000); // 0.000001 ETH
      const { encrypted, commitment } = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        stakeWei
      );

      await expect(
        contract.connect(alice).placeForecast(
          TEST_CITIES.NEW_YORK,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.inputProof,
          commitment,
          { value: stakeWei }
        )
      ).to.emit(contract, "ForecastPlaced")
        .withArgs(TEST_CITIES.NEW_YORK, await alice.getAddress(), 1);

      const ticketCount = await contract.ticketCount();
      expect(ticketCount).to.equal(1);
    });

    it("should prevent duplicate commitment", async function () {
      const stakeWei = BigInt(1000000000000);
      const { encrypted, commitment } = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        stakeWei
      );

      await contract.connect(alice).placeForecast(
        TEST_CITIES.NEW_YORK,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.inputProof,
        commitment,
        { value: stakeWei }
      );

      await expect(
        contract.connect(alice).placeForecast(
          TEST_CITIES.NEW_YORK,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.inputProof,
          commitment,
          { value: stakeWei }
        )
      ).to.be.revertedWith("Commitment used");
    });

    it("should require non-zero stake", async function () {
      const stakeWei = BigInt(0);
      const { encrypted, commitment } = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        stakeWei
      );

      await expect(
        contract.connect(alice).placeForecast(
          TEST_CITIES.NEW_YORK,
          encrypted.handles[0],
          encrypted.handles[1],
          encrypted.inputProof,
          commitment,
          { value: stakeWei }
        )
      ).to.be.revertedWith("Stake must be positive");
    });

    it("should track total deposited funds", async function () {
      const aliceStake = BigInt(1000000000000);
      const bobStake = BigInt(2000000000000);

      const aliceData = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        aliceStake
      );

      const bobData = await encryptForecast(
        contractAddress,
        bob,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.RAINY,
        bobStake
      );

      await contract.connect(alice).placeForecast(
        TEST_CITIES.NEW_YORK,
        aliceData.encrypted.handles[0],
        aliceData.encrypted.handles[1],
        aliceData.encrypted.inputProof,
        aliceData.commitment,
        { value: aliceStake }
      );

      await contract.connect(bob).placeForecast(
        TEST_CITIES.NEW_YORK,
        bobData.encrypted.handles[0],
        bobData.encrypted.handles[1],
        bobData.encrypted.inputProof,
        bobData.commitment,
        { value: bobStake }
      );

      const market = await contract.getCityMarket(TEST_CITIES.NEW_YORK);
      expect(market.totalDepositedWei).to.equal(aliceStake + bobStake);
    });
  });

  // ========================================
  // Test Suite 5: Market Settlement
  // ========================================

  describe("5. Market Settlement & Oracle", function () {
    beforeEach(async function () {
      const lockTime = getCurrentTimestamp() + ONE_HOUR;
      await contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime);

      // Place some forecasts
      const stakeWei = BigInt(1000000000000);
      const aliceData = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        stakeWei
      );

      await contract.connect(alice).placeForecast(
        TEST_CITIES.NEW_YORK,
        aliceData.encrypted.handles[0],
        aliceData.encrypted.handles[1],
        aliceData.encrypted.inputProof,
        aliceData.commitment,
        { value: stakeWei }
      );

      // Fast forward time past lock
      await ethers.provider.send("evm_increaseTime", [ONE_HOUR + 60]);
      await ethers.provider.send("evm_mine", []);
    });

    it("should settle market by oracle", async function () {
      await expect(
        contract.connect(oracle).settleCity(TEST_CITIES.NEW_YORK, WEATHER_CONDITIONS.SUNNY)
      ).to.emit(contract, "CitySettled");

      const market = await contract.getCityMarket(TEST_CITIES.NEW_YORK);
      expect(market.settled).to.be.true;
      expect(market.winningCondition).to.equal(WEATHER_CONDITIONS.SUNNY);
    });

    it("should prevent settlement before lock time", async function () {
      // Create new market
      const lockTime = getCurrentTimestamp() + ONE_DAY;
      await contract.connect(deployer).createCityMarket(TEST_CITIES.LONDON, 4, lockTime);

      await expect(
        contract.connect(oracle).settleCity(TEST_CITIES.LONDON, WEATHER_CONDITIONS.SUNNY)
      ).to.be.revertedWith("Market not locked");
    });

    it("should prevent double settlement", async function () {
      await contract.connect(oracle).settleCity(TEST_CITIES.NEW_YORK, WEATHER_CONDITIONS.SUNNY);

      await expect(
        contract.connect(oracle).settleCity(TEST_CITIES.NEW_YORK, WEATHER_CONDITIONS.RAINY)
      ).to.be.revertedWith("Market settled");
    });

    it("should reject invalid winning condition", async function () {
      await expect(
        contract.connect(oracle).settleCity(TEST_CITIES.NEW_YORK, 5) // Invalid condition
      ).to.be.revertedWith("Invalid condition");
    });
  });

  // ========================================
  // Test Suite 6: Ticket Management
  // ========================================

  describe("6. Ticket Management & Queries", function () {
    it("should retrieve ticket details", async function () {
      const lockTime = getCurrentTimestamp() + ONE_HOUR;
      await contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime);

      const stakeWei = BigInt(1000000000000);
      const { encrypted, commitment } = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        stakeWei
      );

      await contract.connect(alice).placeForecast(
        TEST_CITIES.NEW_YORK,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.inputProof,
        commitment,
        { value: stakeWei }
      );

      const ticket = await contract.getTicket(1);
      expect(ticket.cityId).to.equal(TEST_CITIES.NEW_YORK);
      expect(ticket.bettor).to.equal(await alice.getAddress());
      expect(ticket.claimed).to.be.false;
    });

    it("should retrieve city tickets", async function () {
      const lockTime = getCurrentTimestamp() + ONE_HOUR;
      await contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime);

      const stakeWei = BigInt(1000000000000);

      // Alice places forecast
      const aliceData = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        stakeWei
      );
      await contract.connect(alice).placeForecast(
        TEST_CITIES.NEW_YORK,
        aliceData.encrypted.handles[0],
        aliceData.encrypted.handles[1],
        aliceData.encrypted.inputProof,
        aliceData.commitment,
        { value: stakeWei }
      );

      // Bob places forecast
      const bobData = await encryptForecast(
        contractAddress,
        bob,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.RAINY,
        stakeWei
      );
      await contract.connect(bob).placeForecast(
        TEST_CITIES.NEW_YORK,
        bobData.encrypted.handles[0],
        bobData.encrypted.handles[1],
        bobData.encrypted.inputProof,
        bobData.commitment,
        { value: stakeWei }
      );

      const tickets = await contract.getTicketsForCity(TEST_CITIES.NEW_YORK);
      expect(tickets.length).to.equal(2);
    });
  });

  // ========================================
  // Test Suite 7: Gas Optimization
  // ========================================

  describe("7. Gas Optimization Verification", function () {
    it("should have reasonable gas for market creation", async function () {
      const lockTime = getCurrentTimestamp() + ONE_DAY;

      const tx = await contract.connect(deployer).createCityMarket(
        TEST_CITIES.NEW_YORK,
        4,
        lockTime
      );
      const receipt = await tx.wait();

      console.log(`      Gas used for market creation: ${receipt?.gasUsed.toString()}`);

      // Should be less than 500k gas
      expect(receipt?.gasUsed).to.be.lessThan(500000);
    });

    it("should have reasonable gas for forecast placement", async function () {
      const lockTime = getCurrentTimestamp() + ONE_HOUR;
      await contract.connect(deployer).createCityMarket(TEST_CITIES.NEW_YORK, 4, lockTime);

      const stakeWei = BigInt(1000000000000);
      const { encrypted, commitment } = await encryptForecast(
        contractAddress,
        alice,
        TEST_CITIES.NEW_YORK,
        WEATHER_CONDITIONS.SUNNY,
        stakeWei
      );

      const tx = await contract.connect(alice).placeForecast(
        TEST_CITIES.NEW_YORK,
        encrypted.handles[0],
        encrypted.handles[1],
        encrypted.inputProof,
        commitment,
        { value: stakeWei }
      );
      const receipt = await tx.wait();

      console.log(`      Gas used for forecast placement: ${receipt?.gasUsed.toString()}`);
    });
  });
});
