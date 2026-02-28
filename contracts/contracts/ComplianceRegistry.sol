// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ReentrancyGuardTransient} from "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";

/**
 * @title ComplianceRegistry
 * @notice On-chain compliance document registry with IPFS hash storage
 * @dev Stores document hashes and IPFS CIDs for regulatory compliance
 */
contract ComplianceRegistry is
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ReentrancyGuardTransient
{
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant COMPLIANCE_OFFICER_ROLE = keccak256("COMPLIANCE_OFFICER_ROLE");

    struct ComplianceDocument {
        bytes32 docHash;
        string ipfsCid;
        address registeredBy;
        uint256 registeredAt;
        bool verified;
    }

    struct EntityStatus {
        bool isVerified;
        uint256 verifiedAt;
        address verifiedBy;
    }

    mapping(bytes32 => ComplianceDocument) private _documents;
    bytes32[] private _documentHashes;

    mapping(address => EntityStatus) private _entityStatus;
    mapping(address => bytes32[]) private _entityDocuments;

    uint256 private _totalDocuments;
    uint256 private _verifiedDocuments;

    event DocumentRegistered(
        bytes32 indexed docHash,
        string ipfsCid,
        address indexed registeredBy,
        uint256 timestamp
    );

    event DocumentVerified(
        bytes32 indexed docHash,
        address indexed verifiedBy,
        uint256 timestamp
    );

    event EntityVerificationUpdated(
        address indexed entity,
        bool verified,
        address indexed updatedBy,
        uint256 timestamp
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address admin) external initializer {
        require(admin != address(0), "Compliance: zero admin");

        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ADMIN_ROLE, admin);
        _grantRole(COMPLIANCE_OFFICER_ROLE, admin);
    }

    /**
     * @notice Register a compliance document with its IPFS CID
     * @param docHash SHA-256 hash of the document
     * @param ipfsCid IPFS content identifier
     */
    function registerDocument(
        bytes32 docHash,
        string calldata ipfsCid
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(docHash != bytes32(0), "Compliance: zero hash");
        require(bytes(ipfsCid).length > 0, "Compliance: empty CID");
        require(_documents[docHash].registeredAt == 0, "Compliance: already registered");

        _documents[docHash] = ComplianceDocument({
            docHash: docHash,
            ipfsCid: ipfsCid,
            registeredBy: msg.sender,
            registeredAt: block.timestamp,
            verified: false
        });
        _documentHashes.push(docHash);
        _entityDocuments[msg.sender].push(docHash);
        _totalDocuments++;

        emit DocumentRegistered(docHash, ipfsCid, msg.sender, block.timestamp);
    }

    /**
     * @notice Verify a registered document
     * @param docHash Hash of the document to verify
     */
    function verifyDocument(
        bytes32 docHash
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        ComplianceDocument storage doc = _documents[docHash];
        require(doc.registeredAt > 0, "Compliance: not registered");
        require(!doc.verified, "Compliance: already verified");

        doc.verified = true;
        _verifiedDocuments++;

        emit DocumentVerified(docHash, msg.sender, block.timestamp);
    }

    /**
     * @notice Set verification status of an entity (wallet address)
     * @param entity The address to update
     * @param verified Whether the entity is verified
     */
    function setEntityVerification(
        address entity,
        bool verified
    ) external onlyRole(COMPLIANCE_OFFICER_ROLE) {
        require(entity != address(0), "Compliance: zero entity");

        _entityStatus[entity] = EntityStatus({
            isVerified: verified,
            verifiedAt: block.timestamp,
            verifiedBy: msg.sender
        });

        emit EntityVerificationUpdated(entity, verified, msg.sender, block.timestamp);
    }

    function getDocument(bytes32 docHash) external view returns (ComplianceDocument memory) {
        return _documents[docHash];
    }

    function getEntityStatus(address entity) external view returns (EntityStatus memory) {
        return _entityStatus[entity];
    }

    function getEntityDocuments(address entity) external view returns (bytes32[] memory) {
        return _entityDocuments[entity];
    }

    function isEntityVerified(address entity) external view returns (bool) {
        return _entityStatus[entity].isVerified;
    }

    function getTotalDocuments() external view returns (uint256) {
        return _totalDocuments;
    }

    function getVerifiedDocuments() external view returns (uint256) {
        return _verifiedDocuments;
    }

    function getDocumentHashes(uint256 offset, uint256 limit) external view returns (bytes32[] memory) {
        uint256 total = _documentHashes.length;
        if (offset >= total) return new bytes32[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        bytes32[] memory result = new bytes32[](end - offset);
        for (uint256 i = offset; i < end; ) {
            result[i - offset] = _documentHashes[i];
            unchecked { ++i; }
        }
        return result;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyRole(DEFAULT_ADMIN_ROLE) {}
}
