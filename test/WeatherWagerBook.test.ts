import { expect } from "chai";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { ethers, fhevm } from "hardhat";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import type { WeatherWagerBook } from "../types";

const CITY_ID = 5128581; // New York
const WINNING_CONDITION = 0;
const LOSING_CONDITION = 1;
const SCALE = BigInt(1_000_000);

async function encryptForecast(
  contractAddress: string,
  user: HardhatEthersSigner,
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
      [user.address, CITY_ID, encrypted.handles[0], encrypted.handles[1]],
    ),
  );

  return { encrypted, commitment };
}

describe("WeatherWagerBook", function () {
  let deployer: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let contract: WeatherWagerBook;
  let contractAddress: string;
  let gatewayAddress: string;

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("Skipping WeatherWagerBook tests outside of FHEVM mock runtime");
      this.skip();
    }

    [deployer, oracle, , alice, bob] = await ethers.getSigners();
    await fhevm.initializeCLIApi();
    const metadata = await fhevm.getRelayerMetadata();
    gatewayAddress = metadata.DecryptionOracleAddress;

    const factory = await ethers.getContractFactory("WeatherWagerBook");
    contract = (await factory.deploy(await deployer.getAddress(), gatewayAddress)) as WeatherWagerBook;
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();

    // Grant ORACLE role to dedicated signer
    await contract.connect(deployer).grantRole(await contract.ORACLE_ROLE(), await oracle.getAddress());
    await contract.connect(deployer).grantRole(await contract.GATEWAY_ROLE(), gatewayAddress);
    await contract.connect(deployer).grantRole(await contract.GATEWAY_ROLE(), metadata.relayerSignerAddress);

    const lockTimestamp = Math.floor(Date.now() / 1000) + 600;
    await contract.connect(deployer).createCityMarket(CITY_ID, 4, lockTimestamp);
  });

  it("processes encrypted wagers end-to-end", async function () {
    const aliceStake = BigInt(5_000_000_000_000); // 0.000005 ETH
    const bobStake = BigInt(4_000_000_000_000); // 0.000004 ETH

    const aliceEncrypted = await encryptForecast(contractAddress, alice, WINNING_CONDITION, aliceStake);
    const bobEncrypted = await encryptForecast(contractAddress, bob, LOSING_CONDITION, bobStake);

    await expect(
      contract
        .connect(alice)
        .placeForecast(
          CITY_ID,
          aliceEncrypted.encrypted.handles[0],
          aliceEncrypted.encrypted.handles[1],
          aliceEncrypted.encrypted.inputProof,
          aliceEncrypted.commitment,
          { value: aliceStake },
        ),
    )
      .to.emit(contract, "ForecastPlaced")
      .withArgs(CITY_ID, await alice.getAddress(), 1);

    await contract
      .connect(bob)
      .placeForecast(
        CITY_ID,
        bobEncrypted.encrypted.handles[0],
        bobEncrypted.encrypted.handles[1],
        bobEncrypted.encrypted.inputProof,
        bobEncrypted.commitment,
        { value: bobStake },
      );

    const marketAfterBets = await contract.getCityMarket(CITY_ID);
    expect(marketAfterBets.totalDepositedWei).to.equal(aliceStake + bobStake);

    await expect(contract.connect(oracle).settleCity(CITY_ID, WINNING_CONDITION))
      .to.emit(contract, "CitySettled")
      .withArgs(CITY_ID, WINNING_CONDITION, anyValue);

    await fhevm.awaitDecryptionOracle();

    const postSettlement = await contract.getCityMarket(CITY_ID);
    expect(postSettlement.settled).to.be.true;
    expect(postSettlement.payoutRatio).to.be.greaterThan(0n);

    const tickets = await contract.getTicketsForCity(CITY_ID);
    const aliceTicketId = tickets[0];

    const aliceAddress = await alice.getAddress();
    const aliceBalanceBefore = await ethers.provider.getBalance(aliceAddress);

    const claimTx = await contract
      .connect(alice)
      .claim(aliceTicketId, aliceEncrypted.encrypted.inputProof, aliceEncrypted.encrypted.inputProof);
    const claimReceipt = await claimTx.wait();
    const gasPrice = claimReceipt.effectiveGasPrice ?? claimReceipt.gasPrice ?? BigInt(0);
    const claimGasFee = claimReceipt.fee ?? claimReceipt.gasUsed * gasPrice;

    await fhevm.awaitDecryptionOracle();

    const settledState = await contract.getCityMarket(CITY_ID);
    const requestId = settledState.gatewayRequestId;
    await contract.getDecryptionJob(requestId);

    const aliceBalanceAfter = await ethers.provider.getBalance(aliceAddress);
    const netPayout = aliceBalanceAfter - aliceBalanceBefore + claimGasFee;
    expect(netPayout).to.equal(aliceStake + bobStake);

    const marketAfterClaim = await contract.getCityMarket(CITY_ID);
    expect(marketAfterClaim.totalPaidWei).to.be.greaterThan(0);
  });
});
