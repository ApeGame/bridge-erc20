// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "contracts/lib/Admin.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";

abstract contract Pause is Admin, PausableUpgradeable {
    function pause() public onlyAdmin {
        _pause();
    }

    function unpause() public onlyAdmin {
        _unpause();
    }
}
