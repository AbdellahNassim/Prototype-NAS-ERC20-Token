// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PNASToken is ERC20 {
    constructor(uint initialSupply) ERC20("PrototypeNAS", "PNA") {
        _mint(msg.sender, initialSupply);
    }
}
