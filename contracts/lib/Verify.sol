// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";

abstract contract Verify is OwnableUpgradeable {
    using SafeMathUpgradeable for uint256;
    address private publicKey;

    function verify(bytes32 hashMessage, bytes memory _data)
        internal
        view
        returns (bool auth)
    {
        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := mload(add(_data, 0x20))
            s := mload(add(_data, 0x40))
            v := add(and(mload(add(_data, 0x41)), 0xff), 27)
        }

        address addr = ecrecover(hashMessage, v, r, s);
        if (publicKey == addr) {
            auth = true;
        }
        return auth;
    }

    function setPublicKey(address _key) public onlyOwner {
        publicKey = _key;
    }

    function getPublicKey() public view onlyOwner returns (address) {
        return publicKey;
    }
}
