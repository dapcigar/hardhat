import type { HardhatUserConfig } from "@ignored/hardhat-vnext/config";

import HardhatViem from "../../../src/index.js";

const config: HardhatUserConfig = {
  plugins: [HardhatViem],
  solidity: {
    profiles: {
      default: {
        version: "0.8.0",
      },
    },
  },
};

export default config;
