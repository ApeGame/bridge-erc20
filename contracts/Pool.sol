// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "contracts/lib/Pause.sol";
import "contracts/interfaces/IETH.sol";
import "contracts/lib/Verify.sol";

contract Pool is Initializable, Pause, Verify {
    address public nativeWrap;
    mapping(bytes32 => bool) recordsSign;

    enum TokenType {
        NATIVE,
        ERC20
    }

    event SetNativeWrap(address nativeWrap);

    // liquidity events
    event LiquidityAdded(
        address provider,
        TokenType tokenType,
        address token,
        uint256 amount
    );

    event LiquidityRevoked(
        address Revoker,
        TokenType tokenType,
        address token,
        address to,
        uint256 amount
    );

    function __Pool_init(address _nativeWrap) internal onlyInitializing {
        _setNativeWrap(_nativeWrap);
    }

    function _setNativeWrap(address _nativeWrap) internal {
        nativeWrap = _nativeWrap;
        emit SetNativeWrap(_nativeWrap);
    }

    /// @notice set native token management contract
    function setNativeWrap(address _nativeWrap) public onlyOwner {
        _setNativeWrap(_nativeWrap);
    }

    /// @notice add liquidity for erc20 token, bridge contract will be bridged to users in the pool
    /// @param _token erc20 token
    /// @param _amount transfer token amount
    function addLiquidity(address _token, uint256 _amount)
        external
        whenNotPaused
    {
        require(
            IERC20Upgradeable(_token).transferFrom(
                msg.sender,
                address(this),
                _amount
            ),
            "transferFrom failed"
        );
        emit LiquidityAdded(msg.sender, TokenType.ERC20, _token, _amount);
    }

    /// @notice add liquidity for native token
    /// @dev the transferred native token will be transferred to the native token management contract
    function addNativeLiquidity() external payable whenNotPaused {
        require(msg.value > 0, "Transfer amount needs to be greater than 0");
        require(nativeWrap != address(0), "Native wrap not set");
        IETH(nativeWrap).deposit{value: msg.value}();
        emit LiquidityAdded(
            msg.sender,
            TokenType.NATIVE,
            nativeWrap,
            msg.value
        );
    }

    /// @notice revoke the liquidity of erc20 token or native token
    /// @param _token erc20 token, if _token == adress(0), revoke the liquidity of native token
    /// @param _to After revoke liquidity, the amount in the liquidity pool will be transferred to '_to'
    /// @param _sign sign data
    /// @dev if _token == address(0), revoke the liquidity of native token; else revoke the liquidity of erc20 token;
    function revokeLiquidity(
        address _token,
        address _to,
        bytes calldata _sign
    ) external whenNotPaused {
        bytes32 hash_ = keccak256(
            abi.encodePacked(_token, _to, uint64(block.chainid), address(this))
        );
        require(verify(hash_, _sign), "Invalid signature");
        require(!recordsSign[hash_], "Used signature");

        uint256 amount_;
        if (_token == address(0)) {
            amount_ = nativeWrap.balance;
            if (amount_ > 0) {
                IETH(nativeWrap).withdraw(_to, amount_);
                emit LiquidityRevoked(
                    msg.sender,
                    TokenType.NATIVE,
                    address(0),
                    _to,
                    amount_
                );
            }
        } else {
            amount_ = IERC20Upgradeable(_token).balanceOf(address(this));
            if (amount_ > 0) {
                require(
                    IERC20Upgradeable(_token).transfer(_to, amount_),
                    "transfer failed"
                );
                emit LiquidityRevoked(
                    msg.sender,
                    TokenType.ERC20,
                    _token,
                    _to,
                    amount_
                );
            }
        }
        recordsSign[hash_] = true;
    }

    /// @notice transfer '_amount' from '_from' to this contract in '_token'
    /// @param _token erc20 token
    function _addToken(
        address _token,
        address _from,
        uint256 _amount
    ) internal {
        require(
            IERC20Upgradeable(_token).transferFrom(
                _from,
                address(this),
                _amount
            ),
            "transferFrom failed"
        );
    }

    /// @notice transfer native token to native token management contract
    function _addNative() internal {
        IETH(nativeWrap).deposit{value: msg.value}();
    }

    /// @notice transfer '_amount' to '_to' in '_token'
    function _transferToken(
        address _token,
        address _to,
        uint256 _amount
    ) internal {
        if (_amount > 0) {
            require(
                IERC20Upgradeable(_token).transfer(_to, _amount),
                "transfer failed"
            );
        }
    }

    /// @notice withdraw '_amount' to '_to' in native token management contract
    function _transferNative(address _to, uint256 _amount) internal {
        if (_amount > 0) {
            IETH(nativeWrap).withdraw(_to, _amount);
        }
    }
}
