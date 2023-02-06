// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/lib/Verify.sol";

contract SimVerify is Verify {
    function initialize(address publicKey) public initializer {
        __Ownable_init();
        setPublicKey(publicKey);
    }

    function checkVerify(bytes32 hashMessage, bytes memory _data)
        public
        view
        returns (bool)
    {
        return verify(hashMessage, _data);
    }
}

contract VerifyTest is Test {
    SimVerify sv;

    uint256 PublicKeyPrivateKey = 0xC0C;
    address PublicKey = vm.addr(PublicKeyPrivateKey);

    function setUp() public {
        sv = new SimVerify();
        sv.initialize(PublicKey);
        assertEq(sv.getPublicKey(), PublicKey);
    }

    function testVerify() public {
        (bytes32 hash_, bytes memory data_) = sign(2221);
        assertEq(sv.checkVerify(hash_, data_), true);

        // (hash_, data_) = sign(122);
        // assertEq(sv.checkVerify(hash_, data_), true);
    }

    function sign(uint256 _num) internal returns (bytes32, bytes memory) {
        bytes32 hash_ = keccak256(abi.encodePacked(_num));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PublicKeyPrivateKey, hash_);
        return (hash_, abi.encode(r, s, bytes1(v - 27)));
    }
}
