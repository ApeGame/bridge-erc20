// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// used openzeppelin ERC20Burnable interface
interface TokenBurnFrom {
    function burnFrom(address _from, uint256 _amount) external;
}
