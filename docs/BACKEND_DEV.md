# WeatherWager Backend Development Guide

## 概述
`WeatherWagerBook` 合约管理天气预测市场。每个预测包含城市、天气类型与下注金额，均以 FHE 密文提交。链上维护奖池、统计不同天气类型的投注，在官方气象数据确认后请求网关解密并发放奖金。

## 角色定义
- `DEFAULT_ADMIN_ROLE`：部署者，配置所有角色。
- `MARKET_ROLE`：创建城市市场、更新锁定时间。
- `ORACLE_ROLE`：写入官方天气结果。
- `GATEWAY_ROLE`：唯一可执行回调的网关账号。

## 数据模型
### `CityMarket`
- `uint256 cityId`
- `uint8 conditionCount`
- `uint256 lockTimestamp`
- `bool settled`
- `uint8 winningCondition`
- `euint64 encryptedPool`
- `euint64[4] encryptedConditionTotals`

### `ForecastTicket`
- `address bettor`
- `uint256 cityId`
- `bytes32 commitment`
- `externalEuint8 encryptedCondition`
- `externalEuint64 encryptedStake`
- `bool claimed`

### `DecryptionJob`
- `uint256 requestId`
- `uint256 cityId`
- `bool fulfilled`
- `uint64 payoutRatio`

## 事件
- `CityMarketCreated(uint256 indexed cityId)`
- `ForecastPlaced(uint256 indexed cityId, address indexed bettor)`
- `CitySettled(uint256 indexed cityId, uint8 winningCondition, uint256 requestId)`
- `ForecastPaid(uint256 indexed ticketId, address indexed bettor, uint64 payout)`

## 核心函数

### `createCityMarket`
```solidity
function createCityMarket(uint256 cityId, uint8 conditionCount, uint256 lockTimestamp) external onlyRole(MARKET_ROLE)
```
- 初始化 `encryptedPool = FHE.asEuint64(0)`。
- 将 `encryptedConditionTotals[i]` 设为零密文。
- 设置锁定时间。

### `placeForecast`
```solidity
function placeForecast(uint256 cityId, externalEuint8 encryptedCondition, externalEuint64 encryptedStake, bytes calldata proof, bytes32 commitment) external
```
- 校验锁定前提交。
- 导入密文：
  ```solidity
  euint8 condition = FHE.fromExternal(encryptedCondition, proof);
  euint64 stake = FHE.fromExternal(encryptedStake, proof);
  FHE.allowThis(condition);
  FHE.allowThis(stake);
  ```
- 使用 `FHE.add` 更新奖池与 `encryptedConditionTotals[conditionIndex]`。
- 保存票据，并记录 commitment 防止重复提交。

### `settleCity`
```solidity
function settleCity(uint256 cityId, uint8 winningCondition) external onlyRole(ORACLE_ROLE)
```
- 写入结果并标记 `settled = true`。
- 计算奖金比例，采用常数缩放：
  ```solidity
  uint64 constant SCALE = 1_000_000;
  euint64 scaledPool = FHE.mul(city.encryptedPool, FHE.asEuint64(SCALE));
  euint64 payoutRatio = FHE.div(scaledPool, city.encryptedConditionTotals[winningCondition]);
  ```
- 请求网关解密 `payoutRatio`，保存 `DecryptionJob`。

### `claim`
```solidity
function claim(uint256 ticketId, bytes calldata proofCondition, bytes calldata proofStake) external
```
- 导入票据密文，与胜出条件比较；不匹配时返回 0。
- 匹配时把解密后的 `payoutRatio` 与投注金额相乘（前端金额已乘 SCALE，回调需除 SCALE）。
- 转账并标记 `claimed = true`。

### `gatewayCallback`
```solidity
function gatewayCallback(uint256 requestId, uint64 payoutRatio) external onlyRole(GATEWAY_ROLE)
```
- 更新 `decryptionJobs[requestId]`，触发 `CitySettled` 或内部事件通知前端。

## FHE 细节
- 天气类型用 `externalEuint8` 表示（0：晴，1：雨，2：雪，3：阴）。
- 金额使用 `externalEuint64`，前端传入 wei 并预乘 SCALE。
- 票据密文需要 `FHE.allow(ticketCipher, msg.sender)` 才能在回调阶段由用户解密查看。
- 所有密文更新后调用 `FHE.allowThis`。

## Solidity 骨架
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { FHE, euint8, euint64, externalEuint8, externalEuint64 } from "@fhevm/solidity/lib/FHE.sol";

contract WeatherWagerBook is AccessControl {
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");
    bytes32 public constant GATEWAY_ROLE = keccak256("GATEWAY_ROLE");

    struct CityMarket {
        euint64 encryptedPool;
        euint64[4] encryptedConditionTotals;
        bool settled;
        uint8 winningCondition;
        uint256 lockTimestamp;
    }

    mapping(uint256 => CityMarket) public markets;

    constructor(address admin, address gateway) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MARKET_ROLE, admin);
        _grantRole(GATEWAY_ROLE, gateway);
    }
}
```

## Hardhat 配置
```ts
import { defineConfig } from "hardhat/config";
import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-toolbox";

export default defineConfig({
  solidity: "0.8.24",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL!,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
  fhEVM: {
    gatewayUrl: process.env.FHE_GATEWAY_URL!,
  },
});
```

## 测试计划
- **锁定时间**：确保锁定后下注被拒绝。
- **奖池更新**：多次投注后校验密态奖池正确增加。
- **结果结算**：模拟获胜条件并触发解密回调，检查奖金计算。
- **回调安全**：仅 `GATEWAY_ROLE` 可调用 `gatewayCallback`。

## 部署 Checklist
1. 设置 `.env` 包含 `SEPOLIA_RPC_URL`、`PRIVATE_KEY`、`FHE_GATEWAY_URL`。
2. 部署后运行 `scripts/seed-cities.ts` 创建常用城市市场。
3. 授予官方气象数据提供者 `ORACLE_ROLE`。
4. 监控 `CitySettled`、`ForecastPaid` 事件同步前端。

## 安全提示
- 对 commitment 使用 `keccak256`，避免同一密文重复使用。
- 如果天气结果滞后，可允许组织者触发退款路径，相关逻辑需额外测试。
- 票据解密后应立刻将金额置为 0 防重领。
