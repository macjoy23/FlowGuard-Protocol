// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IFlowGuardCore} from "./interfaces/IFlowGuardCore.sol";

/**
 * @title FlowGuardCore
 * @notice Core payroll engine for batch USDC transfers on Polygon Mainnet
 * @dev UUPS upgradeable with role-based access control
 */
contract FlowGuardCore is
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardTransient,
    IFlowGuardCore
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PAYER_ROLE = keccak256("PAYER_ROLE");
    uint256 public constant MAX_BATCH_SIZE = 200;

    IERC20 public usdc;

    address[] private _recipientList;
    mapping(address => bool) private _isRecipient;
    mapping(address => string) private _recipientLabels;
    mapping(address => uint256) private _recipientIndex;

    mapping(bytes32 => PayrollBatch) private _batches;
    bytes32[] private _batchIds;

    uint256 private _totalDisbursed;
    uint256 private _nonce;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address usdcAddress, address admin) external initializer {
        require(usdcAddress != address(0), "FlowGuard: zero USDC address");
        require(admin != address(0), "FlowGuard: zero admin address");

        __AccessControl_init();
        __Pausable_init();

        usdc = IERC20(usdcAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(PAYER_ROLE, admin);
    }

    function executePayroll(
        address[] calldata recipients,
        uint256[] calldata amounts
    )
        external
        override
        onlyRole(PAYER_ROLE)
        whenNotPaused
        nonReentrant
        returns (bytes32 batchId)
    {
        uint256 count = recipients.length;
        require(count > 0, "FlowGuard: empty recipients");
        require(count == amounts.length, "FlowGuard: length mismatch");
        require(count <= MAX_BATCH_SIZE, "FlowGuard: batch too large");

        uint256 totalAmount;

        for (uint256 i; i < count; ) {
            require(recipients[i] != address(0), "FlowGuard: zero recipient");
            require(amounts[i] > 0, "FlowGuard: zero amount");
            totalAmount += amounts[i];
            unchecked { ++i; }
        }

        usdc.safeTransferFrom(msg.sender, address(this), totalAmount);

        for (uint256 i; i < count; ) {
            usdc.safeTransfer(recipients[i], amounts[i]);
            unchecked { ++i; }
        }

        _nonce++;
        batchId = keccak256(abi.encodePacked(msg.sender, block.timestamp, _nonce));

        _batches[batchId] = PayrollBatch({
            batchId: batchId,
            payer: msg.sender,
            totalAmount: totalAmount,
            recipientCount: count,
            executedAt: block.timestamp
        });
        _batchIds.push(batchId);
        _totalDisbursed += totalAmount;

        emit PayrollExecuted(batchId, msg.sender, totalAmount, count, block.timestamp);
    }

    function addRecipient(
        address recipient,
        string calldata label
    ) external override onlyRole(ADMIN_ROLE) {
        require(recipient != address(0), "FlowGuard: zero address");
        require(!_isRecipient[recipient], "FlowGuard: already registered");

        _isRecipient[recipient] = true;
        _recipientIndex[recipient] = _recipientList.length;
        _recipientList.push(recipient);
        _recipientLabels[recipient] = label;

        emit RecipientAdded(recipient, label);
    }

    function removeRecipient(
        address recipient
    ) external override onlyRole(ADMIN_ROLE) {
        require(_isRecipient[recipient], "FlowGuard: not registered");

        uint256 index = _recipientIndex[recipient];
        uint256 lastIndex = _recipientList.length - 1;

        if (index != lastIndex) {
            address lastRecipient = _recipientList[lastIndex];
            _recipientList[index] = lastRecipient;
            _recipientIndex[lastRecipient] = index;
        }

        _recipientList.pop();
        delete _isRecipient[recipient];
        delete _recipientLabels[recipient];
        delete _recipientIndex[recipient];

        emit RecipientRemoved(recipient);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
        emit PayrollPaused(msg.sender);
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
        emit PayrollUnpaused(msg.sender);
    }

    function getRecipients() external view override returns (address[] memory) {
        return _recipientList;
    }

    function getRecipientLabel(address recipient) external view override returns (string memory) {
        return _recipientLabels[recipient];
    }

    function isRecipient(address account) external view returns (bool) {
        return _isRecipient[account];
    }

    function getBatch(bytes32 batchId) external view override returns (PayrollBatch memory) {
        return _batches[batchId];
    }

    function getBatchCount() external view override returns (uint256) {
        return _batchIds.length;
    }

    function getTotalDisbursed() external view override returns (uint256) {
        return _totalDisbursed;
    }

    function getBatchIds(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        uint256 total = _batchIds.length;
        if (offset >= total) {
            return new bytes32[](0);
        }
        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; ) {
            result[i - offset] = _batchIds[i];
            unchecked { ++i; }
        }
        return result;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
