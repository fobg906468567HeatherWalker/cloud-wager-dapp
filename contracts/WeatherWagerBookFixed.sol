// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { FHE, euint8, euint64, externalEuint8, externalEuint64, ebool } from "@fhevm/solidity/lib/FHE.sol";
import { CoprocessorConfig } from "@fhevm/solidity/lib/Impl.sol";

/**
 * @title WeatherWagerBook (Fixed Version)
 * @notice Privacy-preserving weather prediction market using FHE
 * @dev All predictions and stakes are encrypted
 * @dev Uses SDK-compatible CoprocessorAddress for proper attestation verification
 */
contract WeatherWagerBookFixed is AccessControl {
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
        euint8 encryptedCondition;
        euint64 encryptedStake;
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

    /**
     * @notice Constructor with SDK-compatible CoprocessorAddress
     * @param admin The admin address with full control
     * @param gateway The gateway address for decryption callbacks
     * @dev CRITICAL: Uses 0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4 to match SDK
     */
    constructor(address admin, address gateway) {
        require(admin != address(0), "Admin cannot be zero");
        require(gateway != address(0), "Gateway cannot be zero");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
        _grantRole(GATEWAY_ROLE, gateway);

        // Set FHE coprocessor with SDK-compatible address
        // This MUST match @zama-fhe/relayer-sdk@0.2.0's SepoliaConfig
        FHE.setCoprocessor(
            CoprocessorConfig({
                ACLAddress: 0x687820221192C5B662b25367F70076A37bc79b6c,
                CoprocessorAddress: 0xbc91f3daD1A5F19F8390c400196e58073B6a0BC4,  // SDK's InputVerifier
                DecryptionOracleAddress: 0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1,
                KMSVerifierAddress: 0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC
            })
        );
    }

    function protocolId() public pure returns (uint256) {
        // Custom protocol ID for SDK-compatible deployment
        return 10002;
    }

    function createCityMarket(
        uint256 cityId,
        uint8 conditionCount,
        uint256 lockTimestamp
    ) external onlyRole(MARKET_ROLE) {
        require(!markets[cityId].exists, "Market exists");
        require(conditionCount > 0 && conditionCount <= MAX_CONDITIONS, "Invalid condition count");
        require(lockTimestamp > block.timestamp, "Lock time must be future");

        CityMarket storage m = markets[cityId];
        m.exists = true;
        m.conditionCount = conditionCount;
        m.lockTimestamp = lockTimestamp;
        m.settled = false;
        m.payoutRatio = 0;
        m.encryptedPool = FHE.asEuint64(0);

        for (uint8 i = 0; i < conditionCount; i++) {
            m.encryptedConditionTotals[i] = FHE.asEuint64(0);
        }

        emit CityMarketCreated(cityId, lockTimestamp);
    }

    function placeForecast(
        uint256 cityId,
        externalEuint8 encryptedCondition,
        externalEuint64 encryptedStake,
        bytes calldata attestation,
        bytes32 commitment
    ) external payable returns (uint256 ticketId) {
        CityMarket storage market = markets[cityId];
        require(market.exists, "Market does not exist");
        require(block.timestamp < market.lockTimestamp, "Market locked");
        require(!market.settled, "Market settled");
        require(!commitmentUsed[commitment], "Commitment used");
        require(msg.value > 0, "Stake must be positive");

        commitmentUsed[commitment] = true;

        euint8 condition = FHE.fromExternal(encryptedCondition, attestation);
        euint64 stake = FHE.fromExternal(encryptedStake, attestation);

        FHE.allowThis(condition);
        FHE.allowThis(stake);

        ticketId = ticketCount++;
        tickets[ticketId] = ForecastTicket({
            cityId: cityId,
            bettor: msg.sender,
            encryptedCondition: condition,
            encryptedStake: stake,
            commitment: commitment,
            claimed: false
        });

        cityTickets[cityId].push(ticketId);
        market.encryptedPool = FHE.add(market.encryptedPool, stake);
        market.totalDepositedWei += msg.value;

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

    function getClaimAmount(uint256 ticketId) external returns (euint64) {
        ForecastTicket storage ticket = tickets[ticketId];
        require(ticket.bettor == msg.sender, "Not owner");

        CityMarket storage market = markets[ticket.cityId];
        require(market.settled, "Not settled");

        ebool isWinner = FHE.eq(ticket.encryptedCondition, FHE.asEuint8(market.winningCondition));
        euint64 payoutScaled = FHE.mul(ticket.encryptedStake, FHE.asEuint64(market.payoutRatio));
        euint64 finalPayoutScaled = FHE.select(isWinner, payoutScaled, FHE.asEuint64(0));

        return finalPayoutScaled;
    }

    function requestClaim(uint256 ticketId) external returns (uint256 requestId) {
        ForecastTicket storage ticket = tickets[ticketId];
        require(ticket.bettor == msg.sender, "Not owner");
        require(!ticket.claimed, "Already claimed");

        CityMarket storage market = markets[ticket.cityId];
        require(market.settled, "Not settled");

        ticket.claimed = true;

        emit ForecastPaid(ticketId, msg.sender, 0);
        return 0;
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
