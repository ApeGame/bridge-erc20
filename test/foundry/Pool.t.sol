// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/Bridge.sol";
import "contracts/interfaces/IETH.sol";
import "contracts/NativeTokenMgr.sol";
import "contracts/mock/MyToken.sol";

contract PoolTest is Test {
    Bridge bridge;
    NativeTokenMgr nativeTokenMgr;

    MyTokenMock Token;

    uint256 PublicKeyPrivateKey = 0xC0C;
    uint256 userPrivate = 0xE0E;
    uint256 withdrawPrivate = 0xF0F;

    address PublicKey = vm.addr(PublicKeyPrivateKey);
    address user = vm.addr(userPrivate);
    address withdraw = vm.addr(withdrawPrivate);

    function setUp() public {
        bridge = new Bridge();
        nativeTokenMgr = new NativeTokenMgr();
        nativeTokenMgr.initialize();
        nativeTokenMgr.setAdmin(address(bridge), true);

        bridge.initialize(address(0), address(nativeTokenMgr), PublicKey);

        Token = new MyTokenMock();

        Token.mintTo(user, 10000 ether);
        vm.deal(user, 10000 ether);
    }

    function testSetNativeWrap() public {
        assertEq(bridge.nativeWrap(), address(nativeTokenMgr));
        bridge.setNativeWrap(address(1));
        assertEq(bridge.nativeWrap(), address(1));

        vm.prank(user);
        vm.expectRevert("Ownable: caller is not the owner");
        bridge.setNativeWrap(address(1));
    }

    function testAddLiquidity() public {
        bridge.pause();
        vm.expectRevert("Pausable: paused");
        bridge.addLiquidity(address(Token), 100 ether);

        bridge.unpause();

        vm.expectRevert("ERC20: insufficient allowance");
        bridge.addLiquidity(address(Token), 100 ether);

        vm.startPrank(user);
        vm.expectRevert("ERC20: insufficient allowance");
        bridge.addLiquidity(address(Token), 100 ether);

        Token.approve(address(bridge), 100 ether);
        bridge.addLiquidity(address(Token), 100 ether);

        vm.expectRevert("Transfer amount needs to be greater than 0");
        bridge.addNativeLiquidity();

        bridge.addNativeLiquidity{value: 100 ether}();
        vm.stopPrank();

        assertEq(address(nativeTokenMgr).balance, 100 ether);
        assertEq(Token.balanceOf(address(bridge)), 100 ether);
    }

    function testRevokeLiquidity() public {
        testAddLiquidity();

        bridge.pause();
        vm.expectRevert("Pausable: paused");
        bridge.revokeLiquidity(
            address(Token),
            withdraw,
            sign(address(Token), withdraw)
        );
        bridge.unpause();

        vm.startPrank(user);
        vm.expectRevert("Invalid signature");
        bridge.revokeLiquidity(
            address(Token),
            withdraw,
            sign(address(11), withdraw)
        );

        bridge.revokeLiquidity(
            address(Token),
            withdraw,
            sign(address(Token), withdraw)
        );

        vm.expectRevert("Used signature");
        bridge.revokeLiquidity(
            address(Token),
            withdraw,
            sign(address(Token), withdraw)
        );

        vm.expectRevert("Used signature");
        bridge.revokeLiquidity(
            address(Token),
            withdraw,
            sign(address(Token), withdraw)
        );

        assertEq(Token.balanceOf(address(bridge)), 0 ether);
        assertEq(Token.balanceOf(withdraw), 100 ether);

        bridge.revokeLiquidity(
            address(0),
            withdraw,
            sign(address(0), withdraw)
        );
        assertEq(withdraw.balance, 100 ether);
        assertEq(address(nativeTokenMgr).balance, 0 ether);
        vm.stopPrank();
    }

    function sign(address _token, address _to) internal returns (bytes memory) {
        bytes32 hash_ = keccak256(
            abi.encodePacked(
                _token,
                _to,
                uint64(block.chainid),
                address(bridge)
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PublicKeyPrivateKey, hash_);
        return abi.encode(r, s, bytes1(v - 27));
    }
}
