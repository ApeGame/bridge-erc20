// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MyTokenMock is ERC20Upgradeable, OwnableUpgradeable {
    address bridge;

    constructor(string memory _name, string memory _symbol) initializer {
        __ERC20_init(_name, _symbol);
        __Ownable_init();
    }

    function mintTo(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
