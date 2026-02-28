import { http, createConfig } from "wagmi";
import { polygon } from "wagmi/chains";
import { POLYGON_RPC_URL } from "./constants";

export const wagmiConfig = createConfig({
  chains: [polygon],
  transports: {
    [polygon.id]: http(POLYGON_RPC_URL),
  },
  ssr: false,
});

declare module "wagmi" {
  interface Register {
    config: typeof wagmiConfig;
  }
}
