// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KYCRegistry
 * @notice On-chain KYC verification registry for RealFi
 * @dev Tracks verified addresses and expiry times
 */
contract KYCRegistry {
    mapping(address => bool) public isKYCVerified;
    mapping(address => uint256) public kycExpiry;
    mapping(address => bool) public isProvider;

    address public owner;
    address[] public providers;

    event KYCVerified(address indexed user, uint256 expiry);
    event KYCRevoked(address indexed user);
    event ProviderAdded(address indexed provider);
    event ProviderRemoved(address indexed provider);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyProvider() {
        require(isProvider[msg.sender], "Not a KYC provider");
        _;
    }

    constructor() {
        owner = msg.sender;
        // Owner is initial KYC provider
        providers.push(msg.sender);
        isProvider[msg.sender] = true;
        emit ProviderAdded(msg.sender);
    }

    /// @notice Add a new KYC provider
    function addProvider(address provider) external onlyOwner {
        require(!isProvider[provider], "Already a provider");
        require(provider != address(0), "Provider is zero");
        providers.push(provider);
        isProvider[provider] = true;
        emit ProviderAdded(provider);
    }

    /// @notice Remove a KYC provider
    function removeProvider(address provider) external onlyOwner {
        require(isProvider[provider], "Not a provider");
        isProvider[provider] = false;
        emit ProviderRemoved(provider);
    }

    /// @notice Verify a user's KYC (default 1 year expiry)
    function verifyKYC(address user) external onlyProvider {
        require(user != address(0), "User is zero");
        isKYCVerified[user] = true;
        kycExpiry[user] = block.timestamp + 365 days;
        emit KYCVerified(user, kycExpiry[user]);
    }

    /// @notice Verify a user's KYC with custom expiry
    function verifyKYCWithExpiry(address user, uint256 expiry) external onlyProvider {
        require(user != address(0), "User is zero");
        require(expiry > block.timestamp, "Expiry in past");
        isKYCVerified[user] = true;
        kycExpiry[user] = expiry;
        emit KYCVerified(user, expiry);
    }

    /// @notice Revoke a user's KYC
    function revokeKYC(address user) external onlyProvider {
        isKYCVerified[user] = false;
        kycExpiry[user] = 0;
        emit KYCRevoked(user);
    }

    /// @notice Check if a user is currently verified
    function isVerified(address user) external view returns (bool) {
        return isKYCVerified[user] && kycExpiry[user] > block.timestamp;
    }

    /// @notice Get the number of providers
    function getProviderCount() external view returns (uint256) {
        return providers.length;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
