// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/interfaces/IERC20.sol";

contract DEX {
    IERC20 public associatedToken;

    uint price;
    address owner;

    event TokenTransfer(address to, uint amount);

    event AvailableTokens(uint balance);

    event TokenPriceChanged(uint oldPrice, uint newPrice);

    constructor(IERC20 _associatedToken, uint _price) {
        associatedToken = _associatedToken;
        price = _price;
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    function sell() external onlyOwner {
        uint allowance = associatedToken.allowance(msg.sender, address(this));
        require(
            allowance > 0,
            "You must allow this contract to access at least one token"
        );
        bool sent = associatedToken.transferFrom(
            msg.sender,
            address(this),
            allowance
        );

        require(sent, "Failed to transfer tokens");
    }

    function withdrawTokens() external onlyOwner {
        uint balance = associatedToken.balanceOf(address(this));
        bool sent = associatedToken.transfer(msg.sender, balance);
        require(sent, "Failed to transfer tokens");

        emit AvailableTokens(0);
    }

    function withdrawFunds() external onlyOwner {
        uint balance = address(this).balance;
        (bool sent, ) = payable(msg.sender).call{value: balance}("");
        require(sent, "Failed to transfer funds");
    }

    function getPrice(uint numTokens) public view returns (uint) {
        return numTokens * price;
    }

    function buyTokens(uint numTokens) external payable {
        require(numTokens <= getTokenBalance(), "Not enough tokens");
        uint priceForTokens = getPrice(numTokens);
        require(msg.value == priceForTokens, "Not enough funds submitted");

        bool sent = associatedToken.transfer(msg.sender, numTokens);
        require(sent, "Failed to transfer tokens");

        emit TokenTransfer(msg.sender, numTokens);

        emit AvailableTokens(getTokenBalance());
    }

    function getTokenBalance() public view returns (uint) {
        return associatedToken.balanceOf(address(this));
    }

    function updateTokenPrice(uint _price) external onlyOwner {
        uint oldPrice = price;
        price = _price;
        emit TokenPriceChanged(oldPrice, price);
    }
}
