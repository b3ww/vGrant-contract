// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

// import erc20 abstract contract
import {ERC20} from "@openzeppelin-contracts-5.0.1/token/ERC20/ERC20.sol";

contract myToken is ERC20 {
    constructor() public ERC20("USD coin", "USDC") {
        _mint(msg.sender, 1000);
    }
}
