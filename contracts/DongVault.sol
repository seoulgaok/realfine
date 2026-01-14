// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DongVault
 * @notice Individual vault for a specific dong (neighborhood) in Seoul
 * @dev Handles deposits, withdrawals, Points tracking, and vToken issuance for one dong
 */

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

interface IVToken {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
}

interface IKYCRegistry {
    function isVerified(address user) external view returns (bool);
}

contract DongVault {
    // Dong identity
    string public dongName;
    string public guName;

    // Token interfaces
    IERC20 public depositToken;      // USDT0
    IVToken public vToken;           // vToken for this dong
    IKYCRegistry public kycRegistry;

    // Ownership
    address public owner;
    address public factory;

    // State
    bool public paused;
    bool public isOpen;              // Whether vault is accepting deposits
    bool private locked;

    // Vault stats
    uint256 public totalDeposited;
    uint256 public participantCount;
    uint256 public targetAmount;

    // User data
    struct UserInfo {
        uint256 deposited;
        uint256 depositTime;
        uint256 points;
        uint256 lastPointsUpdate;
        bool hasLockup;              // 1 year lockup for +10% points
        uint256 lockupEndTime;
    }

    mapping(address => UserInfo) public users;
    address[] public participants;
    mapping(address => bool) private isParticipant;

    // Points multiplier for lockup (110 = 1.1x = +10%)
    uint256 public constant LOCKUP_BONUS = 110;
    uint256 public constant LOCKUP_DURATION = 365 days;

    // Events
    event VaultOpened(string dongName, string guName);
    event VaultClosed(string dongName);
    event Deposited(address indexed user, uint256 amount, bool withLockup);
    event Withdrawn(address indexed user, uint256 amount);
    event PointsUpdated(address indexed user, uint256 newPoints);
    event Paused(address account);
    event Unpaused(address account);

    modifier onlyOwner() {
        require(msg.sender == owner || msg.sender == factory, "Not authorized");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }

    modifier whenOpen() {
        require(isOpen, "Vault not open");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrant call");
        locked = true;
        _;
        locked = false;
    }

    modifier onlyKYC() {
        require(kycRegistry.isVerified(msg.sender), "KYC required");
        _;
    }

    constructor(
        string memory _dongName,
        string memory _guName,
        address _depositToken,
        address _vToken,
        address _kycRegistry,
        address _owner,
        uint256 _targetAmount
    ) {
        require(bytes(_dongName).length > 0, "Dong name required");
        require(_depositToken != address(0), "Invalid deposit token");
        require(_vToken != address(0), "Invalid vToken");
        require(_kycRegistry != address(0), "Invalid KYC registry");

        dongName = _dongName;
        guName = _guName;
        depositToken = IERC20(_depositToken);
        vToken = IVToken(_vToken);
        kycRegistry = IKYCRegistry(_kycRegistry);
        owner = _owner;
        factory = msg.sender;
        targetAmount = _targetAmount;
        isOpen = true;

        emit VaultOpened(_dongName, _guName);
    }

    // === Admin Functions ===

    function setTargetAmount(uint256 _target) external onlyOwner {
        targetAmount = _target;
    }

    function openVault() external onlyOwner {
        isOpen = true;
        emit VaultOpened(dongName, guName);
    }

    function closeVault() external onlyOwner {
        isOpen = false;
        emit VaultClosed(dongName);
    }

    function pause() external onlyOwner {
        paused = true;
        emit Paused(msg.sender);
    }

    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused(msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner is zero");
        owner = newOwner;
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).transfer(owner, amount);
    }

    // === User Functions ===

    /**
     * @notice Deposit USDT0 and receive vToken
     * @param amount Amount of USDT0 to deposit
     * @param withLockup Whether to apply 1-year lockup for +10% points
     */
    function deposit(uint256 amount, bool withLockup) external nonReentrant whenNotPaused whenOpen onlyKYC {
        require(amount > 0, "Amount must be > 0");
        require(totalDeposited + amount <= targetAmount, "Exceeds target");

        // Update points before deposit
        _updatePoints(msg.sender);

        // Transfer USDT0 from user
        require(depositToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // Update user info
        UserInfo storage user = users[msg.sender];
        user.deposited += amount;

        if (user.depositTime == 0) {
            user.depositTime = block.timestamp;
        }

        if (withLockup && !user.hasLockup) {
            user.hasLockup = true;
            user.lockupEndTime = block.timestamp + LOCKUP_DURATION;
        }

        // Track participant
        if (!isParticipant[msg.sender]) {
            isParticipant[msg.sender] = true;
            participants.push(msg.sender);
            participantCount++;
        }

        totalDeposited += amount;

        // Mint vToken 1:1
        vToken.mint(msg.sender, amount);

        emit Deposited(msg.sender, amount, withLockup);
    }

    /**
     * @notice Withdraw USDT0 by burning vToken
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        UserInfo storage user = users[msg.sender];
        require(user.deposited >= amount, "Insufficient balance");

        // Check lockup
        if (user.hasLockup) {
            require(block.timestamp >= user.lockupEndTime, "Still in lockup");
        }

        // Update points before withdrawal
        _updatePoints(msg.sender);

        // Update state
        user.deposited -= amount;
        totalDeposited -= amount;

        // Burn vToken
        vToken.burn(msg.sender, amount);

        // Transfer USDT0 back to user
        require(depositToken.transfer(msg.sender, amount), "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    // === Points System ===

    /**
     * @notice Update points for a user based on deposit duration
     * @dev Points = Deposit × (Days / 365), with optional 10% lockup bonus
     */
    function _updatePoints(address userAddr) internal {
        UserInfo storage user = users[userAddr];
        if (user.deposited == 0) return;

        uint256 timeElapsed = block.timestamp - user.lastPointsUpdate;
        if (timeElapsed == 0) return;

        // Base points: deposit * (days / 365)
        // Using 1e18 precision for fractional days
        uint256 basePoints = (user.deposited * timeElapsed * 1e18) / (365 days);

        // Apply lockup bonus if applicable
        uint256 newPoints = user.hasLockup
            ? (basePoints * LOCKUP_BONUS) / 100
            : basePoints;

        user.points += newPoints / 1e18;
        user.lastPointsUpdate = block.timestamp;

        emit PointsUpdated(userAddr, user.points);
    }

    /**
     * @notice Manually trigger points update for a user
     */
    function updatePoints() external {
        _updatePoints(msg.sender);
    }

    // === View Functions ===

    function getPoints(address userAddr) external view returns (uint256) {
        UserInfo storage user = users[userAddr];
        if (user.deposited == 0) return user.points;

        uint256 timeElapsed = block.timestamp - user.lastPointsUpdate;
        uint256 basePoints = (user.deposited * timeElapsed * 1e18) / (365 days);
        uint256 pendingPoints = user.hasLockup
            ? (basePoints * LOCKUP_BONUS) / 100
            : basePoints;

        return user.points + (pendingPoints / 1e18);
    }

    function getUserInfo(address userAddr) external view returns (
        uint256 deposited,
        uint256 depositTime,
        uint256 points,
        bool hasLockup,
        uint256 lockupEndTime,
        uint256 vTokenBalance
    ) {
        UserInfo storage user = users[userAddr];
        deposited = user.deposited;
        depositTime = user.depositTime;
        points = this.getPoints(userAddr);
        hasLockup = user.hasLockup;
        lockupEndTime = user.lockupEndTime;
        vTokenBalance = vToken.balanceOf(userAddr);
    }

    function getVaultInfo() external view returns (
        string memory _dongName,
        string memory _guName,
        uint256 _totalDeposited,
        uint256 _participantCount,
        uint256 _targetAmount,
        bool _isOpen
    ) {
        return (dongName, guName, totalDeposited, participantCount, targetAmount, isOpen);
    }

    /**
     * @notice Get top depositors for leaderboard
     * @param limit Max number of users to return
     */
    function getLeaderboard(uint256 limit) external view returns (
        address[] memory addresses,
        uint256[] memory points
    ) {
        uint256 count = limit > participantCount ? participantCount : limit;
        addresses = new address[](count);
        points = new uint256[](count);

        // Simple implementation - copy first N participants
        // In production, would need sorting
        for (uint256 i = 0; i < count; i++) {
            addresses[i] = participants[i];
            points[i] = this.getPoints(participants[i]);
        }

        return (addresses, points);
    }
}
