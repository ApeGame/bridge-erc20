// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "contracts/lib/Admin.sol";

/// @notice Implemented interface/IETH.sol:IETH
contract NativeTokenMgr is Admin {
    event deposited(address indexed sender, uint256 indexed amount);
    event withdrew(address indexed sender, uint256 indexed amount);

    function initialize() public initializer {
        __Ownable_init();
    }

    function deposit() external payable {
        emit deposited(msg.sender, msg.value);
    }

    function withdraw(address _to, uint256 _amount) external onlyAdmin {
        require(address(this).balance >= _amount, "Insufficient amount");
        payable(_to).transfer(_amount);
        emit withdrew(_to, _amount);
    }
}
