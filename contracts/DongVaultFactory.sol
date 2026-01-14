// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DongVault.sol";

/**
 * @title DongVaultFactory
 * @notice Factory contract to deploy and manage individual DongVault contracts
 * @dev Creates one vault per dong (neighborhood) in Seoul
 */

interface IVTokenFactory {
    function createVToken(string memory name, string memory symbol) external returns (address);
}

contract DongVaultFactory {
    // Core dependencies
    address public depositToken;       // USDT0
    address public kycRegistry;
    address public owner;

    // Vault tracking
    mapping(string => address) public dongVaults;  // dongName => vault address
    string[] public dongList;
    uint256 public vaultCount;

    // Default target amount for new vaults (1M USDT0)
    uint256 public defaultTargetAmount = 1_000_000 * 1e6;  // 6 decimals for USDT0

    // Events
    event VaultCreated(
        string indexed dongName,
        string guName,
        address vaultAddress,
        address vTokenAddress
    );
    event VaultRemoved(string indexed dongName);
    event DefaultTargetUpdated(uint256 newTarget);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(
        address _depositToken,
        address _kycRegistry
    ) {
        require(_depositToken != address(0), "Invalid deposit token");
        require(_kycRegistry != address(0), "Invalid KYC registry");

        depositToken = _depositToken;
        kycRegistry = _kycRegistry;
        owner = msg.sender;
    }

    /**
     * @notice Create a new DongVault for a specific dong
     * @param dongName Name of the dong (e.g., "오금동")
     * @param guName Name of the gu (e.g., "송파구")
     * @param vTokenAddress Address of the vToken for this vault
     * @param targetAmount Target deposit amount (0 = use default)
     */
    function createVault(
        string calldata dongName,
        string calldata guName,
        address vTokenAddress,
        uint256 targetAmount
    ) external onlyOwner returns (address) {
        require(bytes(dongName).length > 0, "Dong name required");
        require(dongVaults[dongName] == address(0), "Vault exists for dong");
        require(vTokenAddress != address(0), "Invalid vToken");

        uint256 target = targetAmount > 0 ? targetAmount : defaultTargetAmount;

        // Deploy new DongVault
        DongVault vault = new DongVault(
            dongName,
            guName,
            depositToken,
            vTokenAddress,
            kycRegistry,
            owner,
            target
        );

        address vaultAddress = address(vault);
        dongVaults[dongName] = vaultAddress;
        dongList.push(dongName);
        vaultCount++;

        emit VaultCreated(dongName, guName, vaultAddress, vTokenAddress);

        return vaultAddress;
    }

    /**
     * @notice Batch create vaults for multiple dongs
     * @param dongNames Array of dong names
     * @param guNames Array of gu names (same length as dongNames)
     * @param vTokenAddresses Array of vToken addresses for each vault
     */
    function batchCreateVaults(
        string[] calldata dongNames,
        string[] calldata guNames,
        address[] calldata vTokenAddresses
    ) external onlyOwner returns (address[] memory) {
        require(dongNames.length == guNames.length, "Length mismatch");
        require(dongNames.length == vTokenAddresses.length, "Length mismatch");

        address[] memory vaultAddresses = new address[](dongNames.length);

        for (uint256 i = 0; i < dongNames.length; i++) {
            vaultAddresses[i] = this.createVault(
                dongNames[i],
                guNames[i],
                vTokenAddresses[i],
                0
            );
        }

        return vaultAddresses;
    }

    // === Admin Functions ===

    function setDefaultTargetAmount(uint256 _target) external onlyOwner {
        defaultTargetAmount = _target;
        emit DefaultTargetUpdated(_target);
    }

    function setDepositToken(address _depositToken) external onlyOwner {
        require(_depositToken != address(0), "Invalid deposit token");
        depositToken = _depositToken;
    }

    function setKYCRegistry(address _kycRegistry) external onlyOwner {
        require(_kycRegistry != address(0), "Invalid KYC registry");
        kycRegistry = _kycRegistry;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // === View Functions ===

    function getVault(string calldata dongName) external view returns (address) {
        return dongVaults[dongName];
    }

    function getAllDongs() external view returns (string[] memory) {
        return dongList;
    }

    function getVaultInfo(string calldata dongName) external view returns (
        address vaultAddress,
        string memory _dongName,
        string memory _guName,
        uint256 totalDeposited,
        uint256 participantCount,
        uint256 targetAmount,
        bool isOpen
    ) {
        vaultAddress = dongVaults[dongName];
        require(vaultAddress != address(0), "Vault not found");

        DongVault vault = DongVault(vaultAddress);
        (
            _dongName,
            _guName,
            totalDeposited,
            participantCount,
            targetAmount,
            isOpen
        ) = vault.getVaultInfo();
    }

    /**
     * @notice Get summary of all active vaults
     */
    function getAllVaultsSummary() external view returns (
        string[] memory dongs,
        address[] memory addresses,
        uint256[] memory tvls,
        uint256[] memory participants,
        bool[] memory openStatuses
    ) {
        uint256 count = dongList.length;
        dongs = new string[](count);
        addresses = new address[](count);
        tvls = new uint256[](count);
        participants = new uint256[](count);
        openStatuses = new bool[](count);

        for (uint256 i = 0; i < count; i++) {
            string memory dong = dongList[i];
            address vaultAddr = dongVaults[dong];
            DongVault vault = DongVault(vaultAddr);

            dongs[i] = dong;
            addresses[i] = vaultAddr;

            (
                ,           // dongName
                ,           // guName
                tvls[i],
                participants[i],
                ,           // targetAmount
                openStatuses[i]
            ) = vault.getVaultInfo();
        }

        return (dongs, addresses, tvls, participants, openStatuses);
    }
}