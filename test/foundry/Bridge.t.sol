// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "forge-std/Test.sol";
import "forge-std/console2.sol";

import "contracts/Bridge.sol";
import "contracts/mock/MyToken.sol";

contract BridgeTest is Test {
    Bridge bridge;

    MyTokenMock AToken;
    MyTokenMock BToken;

    uint256 FeeReceiverPrivateKey = 0xA0A;
    uint256 BridgePrivateKey = 0xB0B;
    uint256 PublicKeyPrivateKey = 0xC0C;
    uint256 receiverPrivate = 0xD0D;
    uint256 adminPrivate = 0xE0E;

    address FeeReceiver = vm.addr(FeeReceiverPrivateKey);
    address bridger = vm.addr(BridgePrivateKey);
    address PublicKey = vm.addr(PublicKeyPrivateKey);
    address receiver = vm.addr(receiverPrivate);
    address admin = vm.addr(adminPrivate);

    function setUp() public {
        bridge = new Bridge();

        bridge.initialize(FeeReceiver, PublicKey);

        AToken = new MyTokenMock();
        BToken = new MyTokenMock();

        AToken.mintTo(bridger, 10000 ether);
        BToken.mintTo(bridger, 10000 ether);
        vm.deal(address(bridger), 10000 ether);

        address[] memory tokens = new address[](1);
        tokens[0] = address(AToken);

        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = 1 ether;

        uint256[] memory maxAmounts = new uint256[](1);
        maxAmounts[0] = 100 ether;

        bridge.setMinBurn(tokens, minAmounts);
        bridge.setMaxBurn(tokens, maxAmounts);
    }

    function testCheckSetBurn() public {
        uint256 minBurn = bridge.minBurn(address(AToken));
        assertEq(minBurn, 1 ether);

        uint256 maxBurn = bridge.maxBurn(address(AToken));
        assertEq(maxBurn, 100 ether);

        console2.log(minBurn / 1 ether, maxBurn / 1 ether);
    }

    function testSetPause() public {
        bridge.pause();
        vm.expectRevert("Pausable: paused");
        bridge.pause();
        assertEq(bridge.paused(), true);

        bridge.unpause();
        vm.expectRevert("Pausable: not paused");
        bridge.unpause();
        assertEq(bridge.paused(), false);
    }

    function testSetBurn() public {
        address[] memory tokens = new address[](1);
        tokens[0] = address(AToken);

        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = 2 ether;

        vm.prank(FeeReceiver);
        vm.expectRevert("Admin: caller is not the admin");
        bridge.setMinBurn(tokens, minAmounts);

        vm.prank(FeeReceiver);
        vm.expectRevert("Admin: caller is not the admin");
        bridge.setMaxBurn(tokens, minAmounts);

        bridge.setAdmin(FeeReceiver, true);

        vm.startPrank(FeeReceiver);
        bridge.setMinBurn(tokens, minAmounts);
        bridge.setMaxBurn(tokens, minAmounts);
        vm.stopPrank();
    }

    function testburnErc20() public {
        bridge.pause();
        vm.prank(bridger);
        vm.expectRevert("Pausable: paused");
        bridge.burnErc20(bridger, address(AToken), 2 ether, 10, 100);

        bridge.unpause();

        vm.startPrank(bridger);
        vm.expectRevert("Invalid receiver");
        bridge.burnErc20(address(0), address(AToken), 0.1 ether, 10, 100);

        vm.expectRevert("MinBurn value is not set or Amount too small");
        bridge.burnErc20(bridger, address(AToken), 0.1 ether, 10, 100);

        vm.expectRevert("Amount too large");
        bridge.burnErc20(bridger, address(AToken), 2000 ether, 10, 100);

        vm.expectRevert("ERC20: insufficient allowance");
        bridge.burnErc20(bridger, address(AToken), 2 ether, 10, 100);

        AToken.approve(address(bridge), 100 ether);
        bridge.burnErc20(bridger, address(AToken), 2 ether, 10, 100);

        vm.expectRevert("Record exists");
        bridge.burnErc20(bridger, address(AToken), 2 ether, 10, 100);

        vm.stopPrank();

        uint256 balance = AToken.balanceOf(bridger);
        assertEq(balance, 9998 ether);
    }

    function testburnNative() public {
        bridge.pause();
        vm.expectRevert("Pausable: paused");
        bridge.burnNative{value: 2 ether}(address(AToken), 10, 1111);
        bridge.unpause();

        vm.expectRevert("Invalid receiver");
        bridge.burnNative{value: 0.01 ether}(address(0), 10, 1111);

        vm.expectRevert("MinBurn value is not set or Amount too small");
        bridge.burnNative{value: 0.01 ether}(address(AToken), 10, 1111);

        address[] memory tokens = new address[](1);
        tokens[0] = address(0);

        uint256[] memory minAmounts = new uint256[](1);
        minAmounts[0] = 1 ether;

        uint256[] memory maxAmounts = new uint256[](1);
        maxAmounts[0] = 2 ether;

        bridge.setMinBurn(tokens, minAmounts);
        bridge.setMaxBurn(tokens, maxAmounts);

        vm.expectRevert("Amount too large");
        bridge.burnNative{value: 2.1 ether}(address(AToken), 10, 1111);

        bridge.burnNative{value: 2 ether}(address(AToken), 10, 1111);

        vm.expectRevert("Record exists");
        bridge.burnNative{value: 2 ether}(address(AToken), 10, 1111);

        assertEq(address(bridge).balance, 2 ether);
    }

    function sign(
        address _sender,
        address _receiver,
        address _token,
        uint256 _amount,
        uint256 _redChainId,
        bytes32 _burnId,
        uint256 _chainId,
        address _bridge
    ) internal returns (bytes memory) {
        bytes32 hash_ = keccak256(
            abi.encodePacked(
                _sender,
                _receiver,
                _token,
                _amount,
                _redChainId,
                _burnId,
                _chainId,
                _bridge
            )
        );
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(PublicKeyPrivateKey, hash_);
        return abi.encode(r, s, bytes1(v - 27));
    }

    function addLiquidity() internal {
        vm.startPrank(bridger);
        BToken.approve(address(bridge), 100 ether);
        bridge.addLiquidity(address(BToken), 2 ether);

        bridge.addNativeLiquidity{value: 2 ether}();
        vm.stopPrank();
    }

    function testMintToken() public {
        addLiquidity();

        Bridge.MintReq[] memory _reqs = new Bridge.MintReq[](2);
        _reqs[0] = Bridge.MintReq({
            sender: bridger,
            receiver: receiver,
            token: address(BToken),
            amount: 2 ether,
            fee: 0.1 ether,
            refChainId: 11,
            burnId: bytes32("aa1231ab")
        });

        _reqs[1] = Bridge.MintReq({
            sender: bridger,
            receiver: receiver,
            token: address(0),
            amount: 2 ether,
            fee: 0.1 ether,
            refChainId: 11,
            burnId: bytes32("aa1231ab111")
        });
        bytes[] memory _sigs = new bytes[](2);

        _sigs[0] = sign(
            bridger,
            receiver,
            address(BToken),
            2 ether,
            11,
            bytes32("aa1231ab"),
            block.chainid,
            address(bridge)
        );
        bytes memory hash1_ = sign(
            bridger,
            receiver,
            address(0),
            2 ether,
            11,
            bytes32("aa1231ab111"),
            block.chainid,
            address(bridge)
        );
        bytes memory hash2_ = sign(
            bridger,
            receiver,
            address(1),
            2 ether,
            11,
            bytes32("aa1231ab111"),
            block.chainid,
            address(bridge)
        );

        bridge.pause();
        vm.expectRevert("Pausable: paused");
        bridge.mintToken(_reqs[0], _sigs[0]);
        bridge.unpause();

        vm.expectRevert("Invalid signature");
        bridge.mintToken(_reqs[1], hash2_);

        bridge.mintToken(_reqs[0], _sigs[0]);
        bridge.mintToken(_reqs[1], hash1_);

        vm.expectRevert("Record exists");
        bridge.mintToken(_reqs[1], hash1_);

        assertEq(BToken.balanceOf(receiver), 2 ether - 0.1 ether);
        assertEq(BToken.balanceOf(FeeReceiver), 0.1 ether);

        assertEq(address(bridge).balance, 0 ether);
        assertEq(address(FeeReceiver).balance, 0.1 ether);
        assertEq(address(receiver).balance, 2 ether - 0.1 ether);
    }
}
