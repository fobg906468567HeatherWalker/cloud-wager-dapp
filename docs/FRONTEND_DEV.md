# WeatherWager Frontend Development Guide

## 概述
`weather-wager-portal` 为天气预测打造双页面体验：以朦胧天空视觉的主页和操作简洁的预测 DApp。用户选择城市、天气类型并输入下注金额，所有数据在客户端调用 FHE SDK 加密后才会提交链上。

## 应用身份
- **App Name**: `weather-wager-portal`
- **Package Path**: `apps/weather-wager-portal`
- **Design System**: 主题 *Cloud Drift*，采用天空渐变、柔和插画与气象符号。

| Token | Hex |
|-------|-----|
| Primary | `#0EA5E9` |
| Secondary | `#38BDF8` |
| Accent | `#FDE68A` |
| Surface | `#F1F5F9` |
| Background | `#E0F2FE` |
| Gradient | `linear-gradient(160deg, #E0F2FE 0%, #BAE6FD 45%, #0EA5E9 100%)` |

## 技术栈
- Next.js 14 + TypeScript
- Tailwind CSS + DaisyUI (卡片、Chip、Tab)
- Wagmi v2、RainbowKit (MetaMask、WalletConnect)
- `@zama-fhe/relayer-sdk/bundle` + 自建 `useFhe` hook
- React Query + OpenWeather API 拉取实时天气数据
- Recharts 绘制气温/降水趋势

## 布局导航
- `app/layout.tsx` 注入 Theme、Wagmi Provider、`EncryptionToastProvider`。
- 顶部 `SkylineHeader` 显示 LOGO、天气 ticker、进入 DApp 按钮。
- 页面底部 `Footer` 强调隐私合规与 GitHub 链接。

## 路由
- `/` — 云雾风格 Landing：介绍玩法、展示城市卡片、CTA “Start Forecasting”。
- `/app` — 预测控制台：城市选择、天气选项、下注面板、历史列表。
- `/app/history` — 历史票据页：列出已结算与未结算记录。

## Landing 模块

### HeroCloud
- 文件：`components/landing/HeroCloud.tsx`
- 内容：半透明云层背景、标题、副标题、CTA 双按钮。
- 动画：CSS clip-path 渐变模拟云漂浮。

### CityShowcase
- 文件：`components/landing/CityShowcase.tsx`
- 功能：展示热门城市天气，结合外部 API 真实数据。
- 点击卡片跳转 `/app?city=`。

### HowItWorksSteps
- 文件：`components/landing/HowItWorks.tsx`
- 四步流程：连接钱包 → 选择城市 → 加密下注 → 等待官方天气验证。

## DApp 组件

### CitySelector
- 文件：`components/app/CitySelector.tsx`
- 提供搜索框与地理位置识别，更新 `useForecastStore` 中的 `cityCode`。

### ForecastForm
- 文件：`components/app/ForecastForm.tsx`
- 功能：选择天气类型（晴 / 雨 / 雪 / 阴）、填写下注金额。
- 提交前执行 FHE 加密：
  ```typescript
  const fhe = await ensureFheInstance();
  const input = fhe.createEncryptedInput(contractAddress, walletAddress);
  input.add8(selectedCondition);
  input.add64(stakeWei);
  const { handles, inputProof } = await input.encrypt();
  await contract.placeForecast(cityId, handles[0], handles[1], inputProof);
  ```

### TicketTimeline
- 文件：`components/app/TicketTimeline.tsx`
- 展示：按时间排序的预测票据，未结算标记“Encrypted”，结算后显示实际结算情况。
- 交互：支持过滤城市、天气类型。

## FHE SDK 集成
```typescript
import { initSDK, createInstance, SepoliaConfig } from "@zama-fhe/relayer-sdk/bundle";

let instance: Awaited<ReturnType<typeof createInstance>> | null = null;

export async function ensureFheInstance() {
  if (instance) return instance;
  await initSDK();
  instance = await createInstance(SepoliaConfig);
  return instance;
}

export async function encryptForecast(contractAddress: `0x${string}`, wallet: `0x${string}`, condition: number, stakeWei: bigint) {
  const fhe = await ensureFheInstance();
  const input = fhe.createEncryptedInput(contractAddress, wallet);
  input.add8(condition);
  input.add64(stakeWei);
  const { handles, inputProof } = await input.encrypt();
  return { conditionHandle: handles[0], stakeHandle: handles[1], proof: inputProof };
}
```

## 状态管理
- `useForecastStore`：存储城市、选择的天气类型、下注金额草稿、SDK 状态。
- `useTicketsQuery`：监听链上 `ForecastSettled` 事件后刷新列表。
- 错误处理：当浏览器不支持 SharedArrayBuffer 时显示 `EncryptionModal` 指引用户启用正确头部。

## QA 策略
- Jest：确保表单校验（金额限制、必须选择天气类型）。
- Cypress：验证完整下注流程以及票据状态更新。
- 视觉回归：使用 Chromatic 捕捉云层动画在不同浏览器的表现。
