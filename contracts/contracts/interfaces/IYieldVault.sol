// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IYieldVault {
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event YieldClaimed(address indexed user, uint256 yield, uint256 timestamp);

    function deposit(uint256 amount) external;
    function withdraw(uint256 amount) external;
    function getDeposit(address user) external view returns (uint256);
    function getYield(address user) external view returns (uint256);
    function getTotalDeposits() external view returns (uint256);
}
