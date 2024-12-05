import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DEX, PNASToken } from "../typechain-types";
import { ContractTransactionResponse } from "ethers";

describe("DEX", function () {
  let tokenSupply = "10000000";
  let token: PNASToken & {
    deploymentTransaction(): ContractTransactionResponse;
  };
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;
  let dex: DEX & {
    deploymentTransaction(): ContractTransactionResponse;
  };
  let tokenPrice = 1000;
  this.beforeEach(async function () {
    [owner, addr1, addr2] = await hre.ethers.getSigners();
    const PNASTokenContract = await hre.ethers.getContractFactory("PNASToken");
    token = await PNASTokenContract.deploy(tokenSupply);

    const DEXContract = await hre.ethers.getContractFactory("DEX");
    dex = await DEXContract.deploy(token.getAddress(), tokenPrice);
  });

  describe("sell", function () {
    it("Should fail if contract is not approved to sell tokens", async function () {
      await expect(dex.connect(owner).sell()).to.be.reverted;
    });
    it("Should fail if not owner called sell", async function () {
      await expect(dex.connect(addr1).sell()).to.be.reverted;
    });
    it("Should allow DEX to transfer tokens", async function () {
      await token.approve(dex.getAddress(), 100);
    });
    it("Should allow DEX to sell tokens", async function () {
      await token.approve(dex.getAddress(), 100);
      await expect(dex.sell()).changeTokenBalances(
        token,
        [owner.address, await dex.getAddress()],
        ["-100", "100"]
      );
    });
  });

  describe("getters", function () {
    it("Should return correct token balance", async function () {
      await token.approve(dex.getAddress(), 100);
      await dex.sell();
      expect(await dex.getTokenBalance()).to.equal(100);
    });

    it("Should return correct token price", async function () {
      expect(await dex.getPrice(10)).to.equal(tokenPrice * 10);
    });
  });

  describe("buy", function () {
    it("Should allow user to buy tokens from DEX", async function () {
      await token.approve(dex.getAddress(), 100);
      await dex.sell();
      expect(await dex.getTokenBalance()).to.equal(100);
      await expect(
        dex.connect(addr1).buyTokens(10, { value: tokenPrice * 10 })
      ).changeTokenBalances(
        token,
        [addr1.address, await dex.getAddress()],
        ["10", "-10"]
      );
    });
    it("Should not allow user to buy tokens from DEX if balance is not enough", async function () {
      await token.approve(dex.getAddress(), 100);
      await dex.sell();
      expect(await dex.getTokenBalance()).to.equal(100);
      await expect(
        dex.connect(addr1).buyTokens(101, { value: tokenPrice * 101 })
      ).to.be.reverted;
    });
    it("Should not allow user to buy tokens when he didnt send enough ETH", async function () {
      await token.approve(dex.getAddress(), 100);
      await dex.sell();
      expect(await dex.getTokenBalance()).to.equal(100);
      await expect(dex.connect(addr1).buyTokens(10, { value: tokenPrice * 9 }))
        .to.be.reverted;
    });
  });

  describe("Withdraw tokens", function () {
    it("should allow the owner to withdraw tokens", async function () {
      await token.approve(dex.getAddress(), 100);
      await dex.sell();
      expect(await dex.getTokenBalance()).to.equal(100);
      await expect(dex.withdrawTokens()).changeTokenBalances(
        token,
        [owner.address, await dex.getAddress()],
        ["100", "-100"]
      );
    });
    it("Should not allow another account to withdraw tokens", async function () {
      await expect(dex.connect(addr1).withdrawTokens()).to.be.reverted;
    });
  });

  describe("Withdraw balance", function () {
    it("Should allow owner to withdraw balance", async function () {
      await token.approve(dex.getAddress(), 100);
      await dex.sell();
      expect(await dex.getTokenBalance()).to.equal(100);
      await dex.connect(addr1).buyTokens(10, { value: tokenPrice * 10 });
      await expect(dex.withdrawFunds()).changeEtherBalances(
        [owner.address, await dex.getAddress()],
        [tokenPrice * 10, -tokenPrice * 10]
      );
    });
    it("Should not allow another account to withdraw balance", async function () {
      await expect(dex.connect(addr1).withdrawFunds()).to.be.reverted;
    });
  });

  describe("Pricing", function () {
    it("Should allow owner to set the price of the token", async function () {
      await dex.updateTokenPrice(2000);
      expect(await dex.getPrice(10)).to.equal(2000 * 10);
    });
    it("Should not allow non-owner to set the price of the token", async function () {
      await expect(dex.connect(addr1).updateTokenPrice(2000)).to.be.reverted;
    });
  });
});
