export const weatherWagerAbi = [
  {
    inputs: [],
    name: "SCALE",
    outputs: [{ internalType: "uint64", name: "", type: "uint64" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "cityId", type: "uint256" }],
    name: "getCityMarket",
    outputs: [
      { internalType: "bool", name: "exists", type: "bool" },
      { internalType: "uint8", name: "conditionCount", type: "uint8" },
      { internalType: "uint256", name: "lockTimestamp", type: "uint256" },
      { internalType: "bool", name: "settled", type: "bool" },
      { internalType: "uint8", name: "winningCondition", type: "uint8" },
      { internalType: "uint64", name: "payoutRatio", type: "uint64" },
      { internalType: "uint256", name: "totalDepositedWei", type: "uint256" },
      { internalType: "uint256", name: "totalPaidWei", type: "uint256" },
      { internalType: "uint256", name: "gatewayRequestId", type: "uint256" },
      { internalType: "uint64", name: "winningTotalScaled", type: "uint64" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "requestId", type: "uint256" }],
    name: "getDecryptionJob",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "cityId", type: "uint256" },
          { internalType: "bool", name: "fulfilled", type: "bool" },
          { internalType: "uint64", name: "payoutRatio", type: "uint64" },
          { internalType: "uint64", name: "poolScaled", type: "uint64" },
          { internalType: "uint64", name: "winningScaled", type: "uint64" },
        ],
        internalType: "struct WeatherWagerBook.DecryptionJob",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
    name: "getTicket",
    outputs: [
      {
        components: [
          { internalType: "uint256", name: "cityId", type: "uint256" },
          { internalType: "address", name: "bettor", type: "address" },
          { internalType: "bytes32", name: "encryptedCondition", type: "bytes32" },
          { internalType: "bytes32", name: "encryptedStake", type: "bytes32" },
          { internalType: "bytes32", name: "commitment", type: "bytes32" },
          { internalType: "bool", name: "claimed", type: "bool" },
        ],
        internalType: "struct WeatherWagerBook.ForecastTicket",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "cityId", type: "uint256" }],
    name: "getTicketsForCity",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "cityId", type: "uint256" },
      { internalType: "bytes32", name: "encryptedCondition", type: "bytes32" },
      { internalType: "bytes32", name: "encryptedStake", type: "bytes32" },
      { internalType: "bytes", name: "proof", type: "bytes" },
      { internalType: "bytes32", name: "commitment", type: "bytes32" },
    ],
    name: "placeForecast",
    outputs: [{ internalType: "uint256", name: "ticketId", type: "uint256" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "ticketId", type: "uint256" },
      { internalType: "bytes", name: "proofCondition", type: "bytes" },
      { internalType: "bytes", name: "proofStake", type: "bytes" },
    ],
    name: "claim",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "ticketId", type: "uint256" },
      { indexed: true, internalType: "address", name: "bettor", type: "address" },
      { indexed: false, internalType: "uint256", name: "payoutWei", type: "uint256" },
    ],
    name: "ForecastPaid",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "cityId", type: "uint256" },
      { indexed: true, internalType: "address", name: "bettor", type: "address" },
      { indexed: true, internalType: "uint256", name: "ticketId", type: "uint256" },
    ],
    name: "ForecastPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "cityId", type: "uint256" },
      { indexed: false, internalType: "uint8", name: "winningCondition", type: "uint8" },
      { indexed: false, internalType: "uint256", name: "requestId", type: "uint256" },
    ],
    name: "CitySettled",
    type: "event",
  },
] as const;

export type WeatherWagerAbi = typeof weatherWagerAbi;
