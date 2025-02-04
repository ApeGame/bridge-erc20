// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface TokenMint {
    function mint(address _to, uint256 _amount) external returns (bool);
}
