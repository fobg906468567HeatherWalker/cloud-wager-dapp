// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title WeatherWagerMock
 * @notice 用于本地测试的模拟版本 - 不使用 FHE
 * @dev 仅用于开发和测试，不应在生产环境使用
 */
contract WeatherWagerMock is AccessControl {
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    uint8 public constant MAX_CONDITIONS = 4;

    struct CityMarket {
        bool exists;
        uint8 conditionCount;
        uint256 lockTimestamp;
        bool settled;
        uint8 winningCondition;
        uint64 payoutRatio;
        uint256 totalPool;  // 使用普通 uint256 而不是 euint64
        uint256 totalDepositedWei;
        uint256 totalPaidWei;
    }

    struct ForecastTicket {
        uint256 cityId;
        address bettor;
        uint8 condition;  // 使用普通 uint8 而不是 euint8
        uint256 stake;    // 使用普通 uint256 而不是 euint64
        bytes32 commitment;
        bool claimed;
    }

    mapping(uint256 => CityMarket) public markets;
    mapping(uint256 => ForecastTicket) public tickets;
    mapping(uint256 => uint256[]) public cityTickets;
    mapping(bytes32 => bool) public commitmentUsed;

    uint256 public ticketCount;

    event CityMarketCreated(uint256 indexed cityId, uint256 lockTimestamp);
    event ForecastPlaced(uint256 indexed cityId, address indexed bettor, uint256 indexed ticketId);
    event CitySettled(uint256 indexed cityId, uint8 winningCondition, uint64 payoutRatio);
    event ForecastPaid(uint256 indexed ticketId, address indexed bettor, uint256 payoutWei);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    function protocolId() public pure returns (uint256) {
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
        m.totalPool = 0;  // 简单初始化

        emit CityMarketCreated(cityId, lockTimestamp);
    }

    /**
     * @notice 简化版下注 - 接受加密参数但不验证（仅用于测试）
     */
    function placeForecast(
        uint256 cityId,
        bytes calldata, // encryptedCondition - 忽略
        bytes calldata, // encryptedStake - 忽略
        bytes calldata, // attestation - 忽略
        bytes32 commitment
    ) external payable returns (uint256 ticketId) {
        CityMarket storage market = markets[cityId];
        require(market.exists, "Market does not exist");
        require(block.timestamp < market.lockTimestamp, "Market locked");
        require(!market.settled, "Market settled");
        require(!commitmentUsed[commitment], "Commitment used");
        require(msg.value > 0, "Stake must be positive");

        commitmentUsed[commitment] = true;

        // 使用固定值进行测试（实际应用中应该从加密数据解密）
        uint8 mockCondition = 0;  // Sunny
        uint256 mockStake = msg.value;

        ticketId = ticketCount++;
        tickets[ticketId] = ForecastTicket({
            cityId: cityId,
            bettor: msg.sender,
            condition: mockCondition,
            stake: mockStake,
            commitment: commitment,
            claimed: false
        });

        cityTickets[cityId].push(ticketId);
        market.totalPool += mockStake;
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

        // 计算奖池分配比例（简化版）
        uint64 payoutRatio = 1000000; // 1:1 payout for testing
        market.payoutRatio = payoutRatio;

        emit CitySettled(cityId, winningCondition, payoutRatio);
    }

    function requestClaim(uint256 ticketId) external returns (uint256) {
        ForecastTicket storage ticket = tickets[ticketId];
        require(ticket.bettor == msg.sender, "Not owner");
        require(!ticket.claimed, "Already claimed");

        CityMarket storage market = markets[ticket.cityId];
        require(market.settled, "Not settled");

        ticket.claimed = true;

        // 简化版：如果预测正确，退还本金
        if (ticket.condition == market.winningCondition) {
            uint256 payout = ticket.stake;
            market.totalPaidWei += payout;

            (bool success, ) = payable(msg.sender).call{value: payout}("");
            require(success, "Transfer failed");

            emit ForecastPaid(ticketId, msg.sender, payout);
        } else {
            emit ForecastPaid(ticketId, msg.sender, 0);
        }

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
            0, // no gateway request in mock
            0  // no winning total in mock
        );
    }

    function getTicket(uint256 ticketId) external view returns (ForecastTicket memory) {
        return tickets[ticketId];
    }

    function getTicketsForCity(uint256 cityId) external view returns (uint256[] memory) {
        return cityTickets[cityId];
    }
}
