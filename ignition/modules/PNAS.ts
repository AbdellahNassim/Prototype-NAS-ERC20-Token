// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const PNAS = buildModule("PNASModule", (m) => {
  const PNAS = m.contract("PNASToken", ["1000000000000000000000000"]);
  const DEX = m.contract("DEX", [PNAS, 1000]);

  return { PNAS, DEX };
});

export default PNAS;
