// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IFlowGuardCore {
    struct PayrollBatch {
        bytes32 batchId;
        address payer;
        uint256 totalAmount;
        uint256 recipientCount;
        uint256 executedAt;
    }

    event PayrollExecuted(
        bytes32 indexed batchId,
        address indexed payer,
        uint256 totalAmount,
        uint256 recipientCount,
        uint256 timestamp
    );

    event RecipientAdded(address indexed recipient, string label);
    event RecipientRemoved(address indexed recipient);
    event PayrollPaused(address indexed by);
    event PayrollUnpaused(address indexed by);

    function executePayroll(
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bytes32 batchId);

    function addRecipient(address recipient, string calldata label) external;
    function removeRecipient(address recipient) external;
    function getRecipients() external view returns (address[] memory);
    function getRecipientLabel(address recipient) external view returns (string memory);
    function getBatch(bytes32 batchId) external view returns (PayrollBatch memory);
    function getTotalDisbursed() external view returns (uint256);
    function getBatchCount() external view returns (uint256);
}
