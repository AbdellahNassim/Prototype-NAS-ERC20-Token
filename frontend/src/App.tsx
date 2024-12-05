import { BigNumberish, ethers } from "ethers";
import { useCallback, useEffect, useState } from "react";
import PNASToken from "../../artifacts/contracts/PNASToken.sol/PNASToken.json";
import DEX from "../../artifacts/contracts/DEX.sol/DEX.json";
import { AddressLike } from "ethers";

function App() {
  const [connectedToMetamask, setConnectedToMetamask] = useState(false);
  const [connectedAccount, setConnectedAccount] = useState<string | null>(null);
  const [dexContract, setDEXContract] = useState<ethers.Contract | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>();
  const [tokenPrice, setTokenPrice] = useState<BigNumberish | null>();
  const [tokensAvailable, setTokensAvailable] = useState<BigNumberish | null>();
  const [balance, setBalance] = useState<BigNumberish | null>();
  const [grantTokenAmount, setGrantTokenAmount] =
    useState<BigNumberish | null>();
  const [tokenPriceUpdate, setTokenPriceUpdate] = useState<number | null>();
  const [buyTokensAmount, setBuyTokensAmount] = useState<BigNumberish | null>();

  const formatedTokenPrice = tokenPrice
    ? ethers.formatEther(tokenPrice)
    : "N/A";

  const formatedTokensAvailable = tokensAvailable?.toString() ?? "N/A";

  const formatedBalance = balance?.toString() ?? "N/A";
  // Only PNAS Token  Owner is allowed to grant DEX access
  const handleGrantDexAccess = async () => {
    if (!grantTokenAmount) {
      return;
    }
    console.log("Granting DEX access to " + grantTokenAmount + " tokens");
    if (tokenContract) {
      await tokenContract.approve(
        import.meta.env.VITE_DEX_CONTRACT,
        grantTokenAmount
      );
    }
  };
  const handleUpdateTokenPrice = async () => {
    if (!tokenPriceUpdate) {
      return;
    }
    console.log("Updating token price to " + tokenPriceUpdate + " (ETH)");
    if (dexContract) {
      await dexContract.updateTokenPrice(
        ethers.parseUnits(tokenPriceUpdate.toString(), "ether")
      );
    }
  };
  const handleSellTokens = async () => {
    console.log("Putting tokens for sell");
    if (dexContract) {
      await dexContract.sell();
    }
  };

  const handleBuyTokens = async () => {
    if (!buyTokensAmount || !tokenPrice) {
      return;
    }
    console.log("Buying " + buyTokensAmount + " tokens");
    if (dexContract) {
      await dexContract.buyTokens(buyTokensAmount, {
        value: BigInt(tokenPrice) * BigInt(buyTokensAmount),
      });
    }
  };

  const connectToMetamask = async () => {
    //@ts-expect-error metamask injects ethereum when installed
    if (window.ethereum) {
      //@ts-expect-error metamask injects ethereum when installed
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const _tokenContract = new ethers.Contract(
        import.meta.env.VITE_PNAS_CONTRACT,
        PNASToken.abi,
        signer
      );
      setTokenContract(_tokenContract);
      const _dexContract = new ethers.Contract(
        import.meta.env.VITE_DEX_CONTRACT,
        DEX.abi,
        signer
      );
      setConnectedToMetamask(true);
      setDEXContract(_dexContract);
      setConnectedAccount(await signer.getAddress());
      //@ts-expect-error metamask injects ethereum when installed
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        setConnectedAccount(accounts[0]);
      });

      _dexContract.on(
        "TokenTransfer",
        (to: AddressLike, amount: BigNumberish) => {
          console.log("TokenTransfer", to, amount);
          if (
            to.toString().toLowerCase() === connectedAccount?.toLowerCase() &&
            balance !== null &&
            balance !== undefined
          ) {
            setBalance(BigInt(amount) + BigInt(balance));
          }
        }
      );

      _dexContract.on("AvailableTokens", (balance: BigNumberish) => {
        console.log("AvailableTokens", balance);
        setTokensAvailable(balance);
      });
      _dexContract.on(
        "TokenPriceChanged",
        (oldPrice: BigNumberish, newPrice: BigNumberish) => {
          console.log("TokenPriceChanged", oldPrice, newPrice);
          setTokenPrice(newPrice);
        }
      );
    }
  };
  const fetchData = useCallback(async () => {
    if (dexContract && tokenContract) {
      const _tokenPrice: BigNumberish = await dexContract.getPrice(1);
      setTokenPrice(_tokenPrice);
      const _tokensAvailable: BigNumberish =
        await dexContract.getTokenBalance();
      setTokensAvailable(_tokensAvailable);
      const _balance: BigNumberish = await tokenContract.balanceOf(
        connectedAccount
      );
      setBalance(_balance);
    }
  }, [dexContract, tokenContract, connectedAccount]);
  useEffect(() => {
    connectToMetamask();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isPNASOwner =
    connectedAccount?.toLowerCase() ===
    import.meta.env.VITE_PNAS_OWNER.toLowerCase();
  const isDEXOwner =
    connectedAccount?.toLowerCase() ===
    import.meta.env.VITE_DEX_OWNER.toLowerCase();
  return (
    <div className="p-10">
      <h1 className="text-3xl">
        {" "}
        PNAS Decentralized Exchange{" "}
        {connectedToMetamask
          ? `Connected - ${connectedAccount}`
          : "Not Connected"}
      </h1>

      <div className="">
        <div className="flex gap-4">
          <div className="p-4">
            <h3>
              Token Price (ETH):{" "}
              <span className="font-bold">{formatedTokenPrice}</span>
            </h3>
          </div>
          <div className="p-4">
            <h3>
              DEX Tokens Available:{" "}
              <span className="font-bold">{formatedTokensAvailable}</span>
            </h3>
          </div>
          <div className="p-4">
            <h3>
              Balance: <span className="font-bold">{formatedBalance}</span>
            </h3>
          </div>
        </div>
        {isPNASOwner && (
          <div className="flex flex-col mt-10">
            <h3>Grant DEX Access</h3>
            <div>
              <input
                className="border border-gray-300 px-4 py-2 rounded"
                type="number"
                min={0}
                placeholder="Token Amount"
                value={grantTokenAmount?.toString()}
                onChange={(e) => setGrantTokenAmount(BigInt(e.target.value))}
              />
              <button
                className="ml-2 border border-gray-300 px-4 py-2 rounded hover:bg-black hover:text-white"
                onClick={handleGrantDexAccess}
              >
                Grant
              </button>
            </div>
          </div>
        )}
        {isDEXOwner && (
          <div className="mt-10 flex flex-col gap-4">
            <div>
              <h3>Update Token Price</h3>
              <input
                className="border border-gray-300 px-4 py-2 rounded"
                type="number"
                min={0}
                step={0.000000001}
                placeholder="Token Price(ETH)"
                value={tokenPriceUpdate?.toString()}
                onChange={(e) => setTokenPriceUpdate(Number(e.target.value))}
              />
              <button
                onClick={handleUpdateTokenPrice}
                className="ml-2 border border-gray-300 px-4 py-2 rounded hover:bg-black hover:text-white"
              >
                {" "}
                Update Token Price
              </button>
            </div>
            <div className="flex gap-2 items-center">
              <h3>Sell Tokens</h3>
              <button
                onClick={handleSellTokens}
                className="ml-2 border border-gray-300 px-4 py-2 rounded hover:bg-black hover:text-white"
              >
                {" "}
                Sell Tokens
              </button>
            </div>
          </div>
        )}
        <div className="flex flex-col mt-10">
          <h3>Buy Tokens from DEX</h3>
          <div>
            <input
              className="border border-gray-300 px-4 py-2 rounded"
              type="number"
              min={0}
              placeholder="Token Amount"
              value={buyTokensAmount?.toString()}
              onChange={(e) => setBuyTokensAmount(BigInt(e.target.value))}
            />
            <button
              className="ml-2 border border-gray-300 px-4 py-2 rounded hover:bg-black hover:text-white"
              onClick={handleBuyTokens}
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
