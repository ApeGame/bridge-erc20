// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/Bridge.sol";
import "contracts/mock/MyToken.sol";

contract PoolTest is Test {
    Bridge bridge;

    MyTokenMock Token;

    uint256 PublicKeyPrivateKey = 0xC0C;
    uint256 userPrivate = 0xE0E;
    uint256 withdrawPrivate = 0xF0F;

    address PublicKey = vm.addr(PublicKeyPrivateKey);
    address user = vm.addr(userPrivate);
    address withdraw = vm.addr(withdrawPrivate);

    function setUp() public {
        bridge = new Bridge();
        bridge.initialize(address(0), PublicKey);

        Token = new MyTokenMock("Token", "TK");

        Token.mintTo(user, 10000 ether);
        vm.deal(user, 10000 ether);
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

        assertEq(address(bridge).balance, 100 ether);
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
        assertEq(address(bridge).balance, 0 ether);
        vm.stopPrank();
    }

    function testRevokePartLiquidity() public {
        testAddLiquidity();

        bridge.pause();
        vm.expectRevert("Pausable: paused");
        bridge.revokePartLiquidity(
            address(Token),
            withdraw,
            1,
            sign(address(Token), withdraw, 1)
        );
        bridge.unpause();

        vm.startPrank(user);
        vm.expectRevert("Invalid signature");
        bridge.revokePartLiquidity(
            address(Token),
            withdraw,
            1,
            sign(address(11), withdraw, 1)
        );

        bridge.revokePartLiquidity(
            address(Token),
            withdraw,
            1 ether,
            sign(address(Token), withdraw, 1 ether)
        );

        vm.expectRevert("Used signature");
        bridge.revokePartLiquidity(
            address(Token),
            withdraw,
            1 ether,
            sign(address(Token), withdraw, 1 ether)
        );

        assertEq(Token.balanceOf(address(bridge)), 99 ether);
        assertEq(Token.balanceOf(withdraw), 1 ether);

        bridge.revokePartLiquidity(
            address(Token),
            withdraw,
            99 ether,
            sign(address(Token), withdraw, 99 ether)
        );
        assertEq(Token.balanceOf(address(bridge)), 0 ether);
        assertEq(Token.balanceOf(withdraw), 100 ether);

        bridge.revokePartLiquidity(
            address(0),
            withdraw,
            1 ether,
            sign(address(0), withdraw, 1 ether)
        );
        assertEq(withdraw.balance, 1 ether);
        assertEq(address(bridge).balance, 99 ether);
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

    function sign(
        address _token,
        address _to,
        uint256 amount
    ) internal returns (bytes memory) {
        bytes32 hash_ = keccak256(
            abi.encodePacked(
                _token,
                _to,
                amount,
                uint64(block.chainid),
                address(bridge)
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PublicKeyPrivateKey, hash_);
        return abi.encode(r, s, bytes1(v - 27));
    }
}
