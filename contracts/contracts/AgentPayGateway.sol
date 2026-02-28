// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title AgentPayGateway
 * @notice Automated payroll trigger gateway with signature verification
 * @dev Allows registered agents to execute scheduled payrolls via signed messages
 */
contract AgentPayGateway is
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardTransient,
    PausableUpgradeable
{
    using SafeERC20 for IERC20;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    IERC20 public usdc;
    address public flowGuardCore;

    struct ScheduledPayroll {
        bytes32 payrollId;
        address creator;
        address[] recipients;
        uint256[] amounts;
        uint256 executeAfter;
        bool executed;
        uint256 executedAt;
    }

    mapping(bytes32 => ScheduledPayroll) private _payrolls;
    mapping(bytes32 => bool) private _usedNonces;
    bytes32[] private _payrollIds;

    uint256 private _totalScheduled;
    uint256 private _totalExecuted;

    event AgentRegistered(address indexed agent, address indexed registeredBy, uint256 timestamp);
    event AgentRevoked(address indexed agent, address indexed revokedBy, uint256 timestamp);
    event PayrollScheduled(
        bytes32 indexed payrollId,
        address indexed creator,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 executeAfter,
        uint256 timestamp
    );
    event PayrollExecutedByAgent(
        bytes32 indexed payrollId,
        address indexed agent,
        uint256 totalAmount,
        uint256 timestamp
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address usdcAddress,
        address flowGuardCoreAddress,
        address admin
    ) external initializer {
        require(usdcAddress != address(0), "Agent: zero USDC");
        require(flowGuardCoreAddress != address(0), "Agent: zero core");
        require(admin != address(0), "Agent: zero admin");

        __AccessControl_init();
        __Pausable_init();

        usdc = IERC20(usdcAddress);
        flowGuardCore = flowGuardCoreAddress;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @notice Register an authorized agent
     * @param agent Address to register as an agent
     */
    function registerAgent(address agent) external onlyRole(ADMIN_ROLE) {
        require(agent != address(0), "Agent: zero address");
        require(!hasRole(AGENT_ROLE, agent), "Agent: already registered");

        _grantRole(AGENT_ROLE, agent);
        emit AgentRegistered(agent, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke an agent's authorization
     * @param agent Address to revoke
     */
    function revokeAgent(address agent) external onlyRole(ADMIN_ROLE) {
        require(hasRole(AGENT_ROLE, agent), "Agent: not registered");

        _revokeRole(AGENT_ROLE, agent);
        emit AgentRevoked(agent, msg.sender, block.timestamp);
    }

    /**
     * @notice Schedule a payroll for future execution
     * @param recipients Array of recipient addresses
     * @param amounts Array of USDC amounts
     * @param executeAfter Timestamp after which the payroll can be executed
     */
    function schedulePayroll(
        address[] calldata recipients,
        uint256[] calldata amounts,
        uint256 executeAfter
    ) external onlyRole(ADMIN_ROLE) whenNotPaused returns (bytes32 payrollId) {
        require(recipients.length > 0, "Agent: empty recipients");
        require(recipients.length == amounts.length, "Agent: length mismatch");
        require(executeAfter > block.timestamp, "Agent: invalid schedule time");

        payrollId = keccak256(
            abi.encodePacked(msg.sender, recipients.length, executeAfter, block.timestamp)
        );
        require(_payrolls[payrollId].creator == address(0), "Agent: duplicate payroll ID");

        uint256 totalAmount;
        for (uint256 i; i < amounts.length; ) {
            require(recipients[i] != address(0), "Agent: zero recipient");
            require(amounts[i] > 0, "Agent: zero amount");
            totalAmount += amounts[i];
            unchecked { ++i; }
        }

        _payrolls[payrollId] = ScheduledPayroll({
            payrollId: payrollId,
            creator: msg.sender,
            recipients: recipients,
            amounts: amounts,
            executeAfter: executeAfter,
            executed: false,
            executedAt: 0
        });
        _payrollIds.push(payrollId);
        _totalScheduled++;

        emit PayrollScheduled(
            payrollId, msg.sender, totalAmount, recipients.length, executeAfter, block.timestamp
        );
    }

    /**
     * @notice Execute a scheduled payroll with agent authorization
     * @param payrollId The ID of the scheduled payroll
     * @param nonce Unique nonce to prevent replay attacks
     * @param signature Agent's signature authorizing execution
     */
    function executeScheduledPayroll(
        bytes32 payrollId,
        bytes32 nonce,
        bytes calldata signature
    ) external onlyRole(AGENT_ROLE) whenNotPaused nonReentrant {
        require(!_usedNonces[nonce], "Agent: nonce already used");
        _usedNonces[nonce] = true;

        ScheduledPayroll storage payroll = _payrolls[payrollId];
        require(payroll.creator != address(0), "Agent: payroll not found");
        require(!payroll.executed, "Agent: already executed");
        require(block.timestamp >= payroll.executeAfter, "Agent: too early");

        bytes32 messageHash = keccak256(
            abi.encodePacked(payrollId, nonce, block.chainid, address(this))
        );
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedHash.recover(signature);
        require(hasRole(AGENT_ROLE, signer), "Agent: invalid signer");

        payroll.executed = true;
        payroll.executedAt = block.timestamp;

        uint256 totalAmount;
        for (uint256 i; i < payroll.amounts.length; ) {
            totalAmount += payroll.amounts[i];
            unchecked { ++i; }
        }

        usdc.safeTransferFrom(payroll.creator, address(this), totalAmount);
        for (uint256 i; i < payroll.recipients.length; ) {
            usdc.safeTransfer(payroll.recipients[i], payroll.amounts[i]);
            unchecked { ++i; }
        }

        _totalExecuted++;

        emit PayrollExecutedByAgent(payrollId, msg.sender, totalAmount, block.timestamp);
    }

    function getPayroll(bytes32 payrollId) external view returns (
        address creator,
        uint256 executeAfter,
        bool executed,
        uint256 executedAt,
        uint256 recipientCount
    ) {
        ScheduledPayroll storage p = _payrolls[payrollId];
        return (p.creator, p.executeAfter, p.executed, p.executedAt, p.recipients.length);
    }

    function getTotalScheduled() external view returns (uint256) {
        return _totalScheduled;
    }

    function getTotalExecuted() external view returns (uint256) {
        return _totalExecuted;
    }

    function isNonceUsed(bytes32 nonce) external view returns (bool) {
        return _usedNonces[nonce];
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
