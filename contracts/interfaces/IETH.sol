// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IETH {
    function deposit() external payable;

    function withdraw(address, uint256) external;
}
