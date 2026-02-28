export const POLYGON_CHAIN_ID = 137;

export const POLYGON_RPC_URL =
  import.meta.env.VITE_POLYGON_RPC || "https://polygon.drpc.org";

export const USDC_ADDRESS: `0x${string}` =
  (import.meta.env.VITE_USDC_ADDRESS as `0x${string}`) ||
  "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359";

export const AAVE_POOL_ADDRESS: `0x${string}` =
  (import.meta.env.VITE_AAVE_POOL as `0x${string}`) ||
  "0x794a61358D6845594F94dc1DB02A252b5b4814aD";

export const WALLETCONNECT_PROJECT_ID =
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";

export const USDC_DECIMALS = 6;

export const POLYGONSCAN_BASE_URL = "https://polygonscan.com";

export const CONTRACT_ADDRESSES = {
  flowGuardCore: ((import.meta.env.VITE_FLOWGUARD_CORE || "0x14fE638867383b162B8C08B97Dd7eBE15a9819BE") as `0x${string}`),
  stealthPayments: ((import.meta.env.VITE_STEALTH_PAYMENTS || "0x76243030cD06350D37eE75c58C32F162Bb47AC34") as `0x${string}`),
  yieldVault: ((import.meta.env.VITE_YIELD_VAULT || "0x13bEA23ED1d2fF7e4a60c5e80c4D4cB3C9921Ba5") as `0x${string}`),
  complianceRegistry: ((import.meta.env.VITE_COMPLIANCE_REGISTRY || "0xDf7d92C0f29c587515b444Dc2bB6880233500915") as `0x${string}`),
  agentPayGateway: ((import.meta.env.VITE_AGENT_GATEWAY || "0x39AFFC98a2a29bB990a1A7Fec5a777cFbA2E8177") as `0x${string}`),
} as const;
