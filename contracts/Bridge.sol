// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "contracts/lib/Admin.sol";
import "contracts/lib/Pause.sol";
import "contracts/Pool.sol";

contract Bridge is Admin, Pause, Pool {
    mapping(bytes32 => bool) public records;

    mapping(address => uint256) public minBurn; // send _amount must >= minBurn
    mapping(address => uint256) public maxBurn;

    address public feeReceiver;

    event MinBurnUpdated(address token, uint256 amount);
    event MaxBurnUpdated(address token, uint256 amount);
    event Burned(
        bytes32 indexed burnId,
        address sender,
        address receiver,
        address token,
        uint256 amount,
        uint256 dstChainId,
        uint256 nonce
    );

    event Minted(
        bytes32 indexed mintId,
        bytes32 indexed burnId,
        address sender,
        address receiver,
        address token,
        uint256 amount,
        uint256 fee,
        uint256 refChainId
    );

    struct MintReq {
        address sender;
        address receiver;
        address token;
        uint256 amount;
        uint256 fee;
        uint256 refChainId;
        bytes32 burnId;
    }

    function initialize(address _feeReceiver, address _pubkey)
        public
        initializer
    {
        __Ownable_init();
        __Pausable_init();
        setPublicKey(_pubkey);
        setFeeReceiver(_feeReceiver);
    }

    /// @notice set fee receiver.
    function setFeeReceiver(address _feeReceiver) public onlyOwner {
        assembly {
            sstore(feeReceiver.slot, _feeReceiver)
        }
    }

    /// @notice burn erc20 token to bridge
    /// @param _receiver bridge to receiver
    /// @param _token erc20 token address
    /// @param _amount amount
    /// @param _dstChainId target chain chanID
    /// @param _nonce random value
    /// @dev will call the burnform method of erc20 contract to destroy
    function burnErc20(
        address _receiver,
        address _token,
        uint256 _amount,
        uint256 _dstChainId,
        uint256 _nonce
    ) public whenNotPaused {
        bytes32 burnId_ = _burn(
            _receiver,
            _token,
            _amount,
            _dstChainId,
            _nonce
        );
        _addToken(_token, msg.sender, _amount);

        emit Burned(
            burnId_,
            msg.sender,
            _receiver,
            _token,
            _amount,
            _dstChainId,
            _nonce
        );
    }

    /// @notice burn native token to bridge
    /// @param _receiver bridge to receiver
    /// @param _dstChainId Target chain chanID
    /// @param _nonce random value
    /// @dev Native token will be transferred to native token management contract and will not be destroyed
    function burnNative(
        address _receiver,
        uint256 _dstChainId,
        uint256 _nonce
    ) public payable whenNotPaused {
        bytes32 burnId_ = _burn(
            _receiver,
            address(0),
            msg.value,
            _dstChainId,
            _nonce
        );

        emit Burned(
            burnId_,
            msg.sender,
            _receiver,
            address(0),
            msg.value,
            _dstChainId,
            _nonce
        );
    }

    /// @notice Mint token to receiver in target chain
    /// @dev the erc20 contract will call to mint tokens to the receiver
    /// native token will withdraw to receiver through the native token manage contract
    function mintToken(MintReq calldata _req, bytes calldata _sign)
        public
        whenNotPaused
    {
        bytes32 hash_ = keccak256(
            abi.encodePacked(
                _req.sender,
                _req.receiver,
                _req.token,
                _req.amount,
                _req.refChainId,
                _req.burnId,
                block.chainid,
                address(this)
            )
        );
        require(!records[hash_], "Record exists");
        records[hash_] = true;
        require(verify(hash_, _sign), "Invalid signature");
        if (_req.token == address(0)) {
            _transferNative(_req.receiver, _req.amount - _req.fee);
            _transferNative(feeReceiver, _req.fee);
        } else {
            _transferToken(_req.token, _req.receiver, _req.amount - _req.fee);
            _transferToken(_req.token, feeReceiver, _req.fee);
        }

        emit Minted(
            hash_,
            _req.burnId,
            _req.sender,
            _req.receiver,
            _req.token,
            _req.amount,
            _req.fee,
            _req.refChainId
        );
    }

    /// @notice Batch mint token to receiver in target chain
    /// @param _tokens All tokens that need to be transferred
    /// @param _fees The amount of handling charges corresponding to tokens
    function mintTokens(
        MintReq[] calldata _reqs,
        bytes[] calldata _signs,
        address[] calldata _tokens,
        uint256[] calldata _fees
    ) public whenNotPaused {
        require(_reqs.length == _signs.length, "Reqs length mismatch");
        require(_tokens.length == _fees.length, "Fees length mismatch");

        bytes32 hash_;
        uint256 feeTotal_;
        MintReq memory req_;

        for (uint256 i = 0; i < _signs.length; ) {
            req_ = _reqs[i];
            hash_ = keccak256(
                abi.encodePacked(
                    req_.sender,
                    req_.receiver,
                    req_.token,
                    req_.amount,
                    req_.refChainId,
                    req_.burnId,
                    block.chainid,
                    address(this)
                )
            );
            require(!records[hash_], "Record exists");
            records[hash_] = true;
            feeTotal_ += req_.fee;
            require(verify(hash_, _signs[i]), "Invalid signature");
            if (req_.token == address(0)) {
                _transferNative(req_.receiver, req_.amount - req_.fee);
            } else {
                _transferToken(
                    req_.token,
                    req_.receiver,
                    req_.amount - req_.fee
                );
            }

            emit Minted(
                hash_,
                req_.burnId,
                req_.sender,
                req_.receiver,
                req_.token,
                req_.amount,
                req_.fee,
                req_.refChainId
            );
            unchecked {
                i++;
            }
        }

        uint256 recordFee_;
        for (uint256 j = 0; j < _tokens.length; ) {
            recordFee_ += _fees[j];
            if (_tokens[j] == address(0)) {
                _transferNative(feeReceiver, _fees[j]);
            } else {
                _transferToken(_tokens[j], feeReceiver, _fees[j]);
            }
            unchecked {
                j++;
            }
        }
        require(feeTotal_ == recordFee_, "Total fee is wrong");
    }

    /// @notice Set the minimum burning value of token
    function setMinBurn(address[] calldata _tokens, uint256[] calldata _amounts)
        external
        onlyAdmin
    {
        require(_tokens.length == _amounts.length, "Length mismatch");
        for (uint256 i = 0; i < _tokens.length; ) {
            minBurn[_tokens[i]] = _amounts[i];
            emit MinBurnUpdated(_tokens[i], _amounts[i]);
            unchecked {
                i++;
            }
        }
    }

    /// @notice Set the maximum burning value of token
    function setMaxBurn(address[] calldata _tokens, uint256[] calldata _amounts)
        external
        onlyAdmin
    {
        require(_tokens.length == _amounts.length, "Length mismatch");
        for (uint256 i = 0; i < _tokens.length; ) {
            maxBurn[_tokens[i]] = _amounts[i];
            emit MaxBurnUpdated(_tokens[i], _amounts[i]);
            unchecked {
                i++;
            }
        }
    }

    /// @notice Verify request parameters and generate burnId
    function _burn(
        address _receiver,
        address _token,
        uint256 _amount,
        uint256 _dstChainId,
        uint256 _nonce
    ) private returns (bytes32 burnId) {
        require(_receiver != address(0), "Invalid receiver");
        require(
            minBurn[_token] != 0 && minBurn[_token] <= _amount,
            "MinBurn value is not set or Amount too small"
        );
        require(
            maxBurn[_token] == 0 || _amount <= maxBurn[_token],
            "Amount too large"
        );
        burnId = keccak256(
            abi.encodePacked(
                msg.sender,
                _token,
                _amount,
                _dstChainId,
                _receiver,
                _nonce,
                uint64(block.chainid),
                address(this)
            )
        );
        require(!records[burnId], "Record exists");
        records[burnId] = true;
        return burnId;
    }
}
