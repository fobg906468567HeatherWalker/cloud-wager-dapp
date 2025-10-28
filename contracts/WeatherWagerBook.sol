// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { FHE, euint8, euint64, externalEuint8, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title WeatherWagerBook
 * @notice Privacy-preserving weather prediction market using FHE
 * @dev All predictions and stakes are encrypted
 * @dev Inherits SepoliaConfig for proper fhEVM infrastructure setup on Sepolia testnet
 */
contract WeatherWagerBook is AccessControl, SepoliaConfig {
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    uint64 public constant SCALE = 1_000_000;
    uint8 public constant MAX_CONDITIONS = 4;

    struct CityMarket {
        bool exists;
        uint8 conditionCount;
        uint256 lockTimestamp;
        bool settled;
        uint8 winningCondition;
        uint64 payoutRatio;
        euint64 encryptedPool;
        euint64[4] encryptedConditionTotals;
        uint256 gatewayRequestId;
        uint64 winningTotalScaled;
        uint256 totalDepositedWei;
        uint256 totalPaidWei;
    }

    struct ForecastTicket {
        uint256 cityId;
        address bettor;
        bytes32 encryptedCondition;
        bytes32 encryptedStake;
        bytes32 commitment;
        bool claimed;
    }

    struct DecryptionJob {
        uint256 cityId;
        bool fulfilled;
        uint64 payoutRatio;
        uint64 poolScaled;
        uint64 winningScaled;
    }

    mapping(uint256 => CityMarket) public markets;
    mapping(uint256 => ForecastTicket) public tickets;
    mapping(uint256 => uint256[]) public cityTickets;
    mapping(bytes32 => bool) public commitmentUsed;
    mapping(uint256 => DecryptionJob) public decryptionJobs;

    uint256 public ticketCount;
    uint256 public requestCount;

    event CityMarketCreated(uint256 indexed cityId, uint256 lockTimestamp);
    event ForecastPlaced(uint256 indexed cityId, address indexed bettor, uint256 indexed ticketId);
    event CitySettled(uint256 indexed cityId, uint8 winningCondition, uint256 requestId);
    event DecryptionFulfilled(uint256 indexed requestId, uint256 indexed cityId, uint64 payoutRatio);
    event ForecastPaid(uint256 indexed ticketId, address indexed bettor, uint256 payoutWei);

    constructor(address admin, address gateway) {
        require(admin != address(0), "Admin cannot be zero");
        require(gateway != address(0), "Gateway cannot be zero");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(GATEWAY_ROLE, gateway);
    }

    function createCityMarket(
        uint256 cityId,
        uint8 conditionCount,
        uint256 lockTimestamp
    ) external onlyRole(MARKET_ROLE) {
        require(!markets[cityId].exists, "Market exists");
        require(conditionCount == MAX_CONDITIONS, "Must have 4 conditions");
        require(lockTimestamp > block.timestamp, "Lock must be future");

        CityMarket storage market = markets[cityId];
        market.exists = true;
        market.conditionCount = conditionCount;
        market.lockTimestamp = lockTimestamp;
        market.settled = false;
        market.winningCondition = 0;

        market.encryptedPool = FHE.asEuint64(0);
        FHE.allowThis(market.encryptedPool);

        for (uint8 i = 0; i < MAX_CONDITIONS; i++) {
            market.encryptedConditionTotals[i] = FHE.asEuint64(0);
            FHE.allowThis(market.encryptedConditionTotals[i]);
        }

        emit CityMarketCreated(cityId, lockTimestamp);
    }

    function placeForecast(
        uint256 cityId,
        bytes32 encryptedCondition,
        bytes32 encryptedStake,
        bytes calldata proof,
        bytes32 commitment
    ) external payable returns (uint256 ticketId) {
        CityMarket storage market = markets[cityId];
        require(market.exists, "Market does not exist");
        require(block.timestamp < market.lockTimestamp, "Market locked");
        require(!market.settled, "Market settled");
        require(!commitmentUsed[commitment], "Commitment used");
        require(msg.value > 0, "Stake must be positive");

        commitmentUsed[commitment] = true;

        euint8 condition = FHE.fromExternal(externalEuint8.wrap(encryptedCondition), proof);
        euint64 stake = FHE.fromExternal(externalEuint64.wrap(encryptedStake), proof);

        FHE.allowThis(condition);
        FHE.allowThis(stake);

        market.encryptedPool = FHE.add(market.encryptedPool, stake);
        FHE.allowThis(market.encryptedPool);

        for (uint8 i = 0; i < MAX_CONDITIONS; i++) {
            ebool isThisCondition = FHE.eq(condition, FHE.asEuint8(i));
            euint64 amountToAdd = FHE.select(isThisCondition, stake, FHE.asEuint64(0));
            market.encryptedConditionTotals[i] = FHE.add(market.encryptedConditionTotals[i], amountToAdd);
            FHE.allowThis(market.encryptedConditionTotals[i]);
        }

        market.totalDepositedWei += msg.value;

        ticketId = ++ticketCount;
        tickets[ticketId] = ForecastTicket({
            cityId: cityId,
            bettor: msg.sender,
            encryptedCondition: encryptedCondition,
            encryptedStake: encryptedStake,
            commitment: commitment,
            claimed: false
        });

        cityTickets[cityId].push(ticketId);

        FHE.allow(condition, msg.sender);
        FHE.allow(stake, msg.sender);

        emit ForecastPlaced(cityId, msg.sender, ticketId);
    }

    function settleCity(uint256 cityId, uint8 winningCondition) external onlyRole(ORACLE_ROLE) {
        CityMarket storage market = markets[cityId];
        require(market.exists, "Market does not exist");
        require(block.timestamp >= market.lockTimestamp, "Market not locked");
        require(!market.settled, "Market settled");
        require(winningCondition < MAX_CONDITIONS, "Invalid condition");

        market.settled = true;
        market.winningCondition = winningCondition;

        uint256 requestId = ++requestCount;
        market.gatewayRequestId = requestId;

        decryptionJobs[requestId] = DecryptionJob({
            cityId: cityId,
            fulfilled: false,
            payoutRatio: 0,
            poolScaled: 0,
            winningScaled: 0
        });

        emit CitySettled(cityId, winningCondition, requestId);
    }

    function gatewayCallback(
        uint256 requestId,
        uint64 poolScaled,
        uint64 winningScaled
    ) external onlyRole(GATEWAY_ROLE) {
        DecryptionJob storage job = decryptionJobs[requestId];
        require(!job.fulfilled, "Job fulfilled");
        require(job.cityId != 0, "Invalid request");

        job.fulfilled = true;
        job.poolScaled = poolScaled;
        job.winningScaled = winningScaled;

        uint64 payoutRatio = winningScaled > 0 ? (poolScaled * SCALE) / winningScaled : 0;
        job.payoutRatio = payoutRatio;

        CityMarket storage market = markets[job.cityId];
        market.payoutRatio = payoutRatio;
        market.winningTotalScaled = winningScaled;

        emit DecryptionFulfilled(requestId, job.cityId, payoutRatio);
    }

    function claim(
        uint256 ticketId,
        bytes calldata proofCondition,
        bytes calldata proofStake
    ) external {
        ForecastTicket storage ticket = tickets[ticketId];
        require(ticket.bettor == msg.sender, "Not owner");
        require(!ticket.claimed, "Already claimed");

        CityMarket storage market = markets[ticket.cityId];
        require(market.settled, "Not settled");
        require(market.payoutRatio > 0, "No payout");

        ticket.claimed = true;

        euint8 condition = FHE.fromExternal(externalEuint8.wrap(ticket.encryptedCondition), proofCondition);
        euint64 stake = FHE.fromExternal(externalEuint64.wrap(ticket.encryptedStake), proofStake);

        ebool isWinner = FHE.eq(condition, FHE.asEuint8(market.winningCondition));
        euint64 payoutScaled = FHE.mul(stake, FHE.asEuint64(market.payoutRatio));

        emit ForecastPaid(ticketId, msg.sender, 0);
    }

    function getCityMarket(uint256 cityId) external view returns (
        bool exists,
        uint8 conditionCount,
        uint256 lockTimestamp,
        bool settled,
        uint8 winningCondition,
        uint64 payoutRatio,
        uint256 totalDepositedWei,
        uint256 totalPaidWei,
        uint256 gatewayRequestId,
        uint64 winningTotalScaled
    ) {
        CityMarket storage market = markets[cityId];
        return (
            market.exists,
            market.conditionCount,
            market.lockTimestamp,
            market.settled,
            market.winningCondition,
            market.payoutRatio,
            market.totalDepositedWei,
            market.totalPaidWei,
            market.gatewayRequestId,
            market.winningTotalScaled
        );
    }

    function getTicket(uint256 ticketId) external view returns (ForecastTicket memory) {
        return tickets[ticketId];
    }

    function getTicketsForCity(uint256 cityId) external view returns (uint256[] memory) {
        return cityTickets[cityId];
    }

    function getDecryptionJob(uint256 requestId) external view returns (DecryptionJob memory) {
        return decryptionJobs[requestId];
    }
}
