// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title StealthPayments
 * @notice Privacy-preserving payment channel using stealth addresses
 * @dev Implements stealth address pattern for private USDC transfers on Polygon
 */
contract StealthPayments is
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardTransient
{
    using SafeERC20 for IERC20;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    IERC20 public usdc;

    struct StealthPayment {
        address sender;
        uint256 amount;
        bytes32 ephemeralPubKeyHash;
        bytes32 stealthMetadata;
        uint256 timestamp;
        bool claimed;
    }

    mapping(bytes32 => StealthPayment) private _payments;
    bytes32[] private _paymentIds;

    uint256 private _totalStealthVolume;
    uint256 private _nonce;

    event StealthPaymentSent(
        bytes32 indexed paymentId,
        address indexed sender,
        uint256 amount,
        bytes32 ephemeralPubKeyHash,
        bytes32 stealthMetadata,
        uint256 timestamp
    );

    event StealthPaymentClaimed(
        bytes32 indexed paymentId,
        address indexed claimer,
        uint256 amount,
        uint256 timestamp
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address usdcAddress, address admin) external initializer {
        require(usdcAddress != address(0), "Stealth: zero USDC address");
        require(admin != address(0), "Stealth: zero admin address");

        __AccessControl_init();

        usdc = IERC20(usdcAddress);

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
    }

    /**
     * @notice Send a stealth payment. Funds are held in contract until claimed.
     * @param amount USDC amount (6 decimals)
     * @param ephemeralPubKeyHash Hash of the ephemeral public key for recipient scanning
     * @param stealthMetadata Encrypted metadata for recipient to derive stealth key
     */
    function sendStealthPayment(
        uint256 amount,
        bytes32 ephemeralPubKeyHash,
        bytes32 stealthMetadata
    ) external nonReentrant returns (bytes32 paymentId) {
        require(amount > 0, "Stealth: zero amount");
        require(ephemeralPubKeyHash != bytes32(0), "Stealth: zero ephemeral key");

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        _nonce++;
        paymentId = keccak256(
            abi.encodePacked(msg.sender, amount, ephemeralPubKeyHash, block.timestamp, _nonce)
        );

        _payments[paymentId] = StealthPayment({
            sender: msg.sender,
            amount: amount,
            ephemeralPubKeyHash: ephemeralPubKeyHash,
            stealthMetadata: stealthMetadata,
            timestamp: block.timestamp,
            claimed: false
        });
        _paymentIds.push(paymentId);
        _totalStealthVolume += amount;

        emit StealthPaymentSent(
            paymentId, msg.sender, amount, ephemeralPubKeyHash, stealthMetadata, block.timestamp
        );
    }

    /**
     * @notice Claim a stealth payment by providing the payment ID
     * @param paymentId The ID of the stealth payment to claim
     * @param recipient The address to receive the funds
     * @param proof Authorization proof (signature from stealth key holder)
     */
    function claimStealthPayment(
        bytes32 paymentId,
        address recipient,
        bytes calldata proof
    ) external nonReentrant {
        StealthPayment storage payment = _payments[paymentId];
        require(payment.amount > 0, "Stealth: payment not found");
        require(!payment.claimed, "Stealth: already claimed");
        require(recipient != address(0), "Stealth: zero recipient");

        bytes32 messageHash = keccak256(
            abi.encodePacked(paymentId, recipient, block.chainid)
        );
        bytes32 ethSignedHash = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash)
        );

        require(proof.length == 65, "Stealth: invalid proof length");
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(proof);
        address signer = ecrecover(ethSignedHash, v, r, s);
        require(signer != address(0), "Stealth: invalid signature");
        require(signer == msg.sender, "Stealth: unauthorized claimer");

        payment.claimed = true;
        usdc.safeTransfer(recipient, payment.amount);

        emit StealthPaymentClaimed(paymentId, recipient, payment.amount, block.timestamp);
    }

    function getPayment(bytes32 paymentId) external view returns (StealthPayment memory) {
        return _payments[paymentId];
    }

    function getPaymentCount() external view returns (uint256) {
        return _paymentIds.length;
    }

    function getTotalStealthVolume() external view returns (uint256) {
        return _totalStealthVolume;
    }

    function getPaymentIds(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        uint256 total = _paymentIds.length;
        if (offset >= total) return new bytes32[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; ) {
            result[i - offset] = _paymentIds[i];
            unchecked { ++i; }
        }
        return result;
    }

    function _splitSignature(bytes calldata sig) private pure returns (bytes32 r, bytes32 s, uint8 v) {
        r = bytes32(sig[0:32]);
        s = bytes32(sig[32:64]);
        v = uint8(bytes1(sig[64:65]));
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
