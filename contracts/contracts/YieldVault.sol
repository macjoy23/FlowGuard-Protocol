// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {PausableUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IAaveV3Pool} from "./interfaces/IAaveV3Pool.sol";
import {IYieldVault} from "./interfaces/IYieldVault.sol";

/**
 * @title YieldVault
 * @notice Aave V3 yield optimization vault for idle USDC on Polygon Mainnet
 * @dev Deposits USDC into Aave V3 Pool and tracks per-user principal for yield calculation
 */
contract YieldVault is
    UUPSUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardTransient,
    IYieldVault
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public usdc;
    IAaveV3Pool public aavePool;
    IERC20 public aToken;

    mapping(address => uint256) private _deposits;
    uint256 private _totalDeposits;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @param usdcAddress Native USDC on Polygon: 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359
     * @param aavePoolAddress Aave V3 Pool on Polygon: 0x794a61358D6845594F94dc1DB02A252b5b4814aD
     * @param admin Admin address for role management
     */
    function initialize(
        address usdcAddress,
        address aavePoolAddress,
        address admin
    ) external initializer {
        require(usdcAddress != address(0), "Vault: zero USDC address");
        require(aavePoolAddress != address(0), "Vault: zero pool address");
        require(admin != address(0), "Vault: zero admin address");

        __AccessControl_init();
        __Pausable_init();

        usdc = IERC20(usdcAddress);
        aavePool = IAaveV3Pool(aavePoolAddress);

        (,,,,,,,,address aTokenAddr,,,,,,) = aavePool.getReserveData(usdcAddress);
        require(aTokenAddr != address(0), "Vault: invalid aToken");
        aToken = IERC20(aTokenAddr);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @notice Deposit USDC into the yield vault (supplies to Aave V3)
     * @param amount USDC amount (6 decimals)
     */
    function deposit(uint256 amount) external override whenNotPaused nonReentrant {
        require(amount > 0, "Vault: zero deposit");

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        usdc.forceApprove(address(aavePool), amount);
        aavePool.supply(address(usdc), amount, address(this), 0);

        _deposits[msg.sender] += amount;
        _totalDeposits += amount;

        emit Deposited(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Withdraw USDC from the yield vault (withdraws from Aave V3)
     * @param amount USDC amount to withdraw (6 decimals)
     */
    function withdraw(uint256 amount) external override whenNotPaused nonReentrant {
        require(amount > 0, "Vault: zero withdrawal");
        require(_deposits[msg.sender] >= amount, "Vault: insufficient deposit");

        _deposits[msg.sender] -= amount;
        _totalDeposits -= amount;

        aavePool.withdraw(address(usdc), amount, msg.sender);

        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    /**
     * @notice Get the principal deposited by a user
     */
    function getDeposit(address user) external view override returns (uint256) {
        return _deposits[user];
    }

    /**
     * @notice Calculate accrued yield for a user based on proportional aToken growth
     * @dev Yield = (userDeposit / totalDeposits) * (aTokenBalance - totalDeposits)
     */
    function getYield(address user) external view override returns (uint256) {
        if (_totalDeposits == 0 || _deposits[user] == 0) return 0;

        uint256 aTokenBalance = aToken.balanceOf(address(this));
        if (aTokenBalance <= _totalDeposits) return 0;

        uint256 totalYield = aTokenBalance - _totalDeposits;
        return (totalYield * _deposits[user]) / _totalDeposits;
    }

    /**
     * @notice Get total deposits across all users
     */
    function getTotalDeposits() external view override returns (uint256) {
        return _totalDeposits;
    }

    /**
     * @notice Get current aToken balance (principal + yield)
     */
    function getTotalBalance() external view returns (uint256) {
        return aToken.balanceOf(address(this));
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
