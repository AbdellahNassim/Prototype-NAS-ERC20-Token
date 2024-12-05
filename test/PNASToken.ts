import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { PNASToken } from "../typechain-types";
import { ContractTransactionResponse } from "ethers";
describe("PNASToken", function () {
  let tokenSupply = "100";
  let token: PNASToken & {
    deploymentTransaction(): ContractTransactionResponse;
  };
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  this.beforeAll(async function () {
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    const PNASTokenContract = await hre.ethers.getContractFactory("PNASToken");
    token = await PNASTokenContract.deploy(tokenSupply);
  });

  describe("Deployment", function () {
    it("Should set assign total supply of tokens to owner/deployer", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      await token.connect(owner).transfer(addr1.address, 50);
      const addr1Balance = await token.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);
    });

    it("Should not transfer tokens if balance is not enough", async function () {
      await expect(token.connect(addr1).transfer(addr2.address, 55)).to.be
        .reverted;
    });
  });
});
