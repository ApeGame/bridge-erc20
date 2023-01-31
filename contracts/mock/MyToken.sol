// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MyTokenMock is ERC20Upgradeable, OwnableUpgradeable {
    address bridge;

    constructor() initializer {
        __ERC20_init("MyToken", "MTK");
        __Ownable_init();
    }

    function mintTo(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
