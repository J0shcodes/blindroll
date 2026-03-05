// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint64, euint8, ebool, externalEuint64, externalEuint8 } from "@fhevm/solidity/lib/FHE.sol";
import { ZamaEthereumConfig } from "@fhevm/solidity/config/ZamaConfig.sol";

contract Blindroll is ZamaEthereumConfig {

    // ── CONSTANTS ─────────────────────────────────────────────────────────────

    uint256 public constant MAX_EMPLOYEES = 100;

    euint8 private immutable NO_ERROR;
    euint8 private immutable ERR_INSUFFICIENT_TREASURY;
    euint8 private immutable ERR_ZERO_BALANCE;
    euint8 private immutable ERR_NOT_ACTIVE;

    // ── CUSTOM ERRORS ─────────────────────────────────────────────────────────

    error NotEmployer();
    error NotEmployee();
    error AlreadyEmployee(address employee);
    error EmployeeNotFound(address employee);
    error MaxEmployeesReached();
    error InvalidAddress();
    error PayrollAlreadyRunning();

    // ── EVENTS ────────────────────────────────────────────────────────────────

    // Salary amount intentionally NOT emitted — stays encrypted
    event EmployeeAdded(address indexed employee, uint256 timestamp);
    event SalaryUpdated(address indexed employee, uint256 timestamp);
    event EmployeeDeactivated(address indexed employee, uint256 timestamp);
    event EmployeeReactivated(address indexed employee, uint256 timestamp);
    event TreasuryDeposited(uint256 timestamp);
    event PayrollExecuted(uint256 timestamp, uint256 employeesProcessed);
    event Withdrawal(address indexed employee, uint256 amount, uint256 timestamp);
    event ErrorChanged(address indexed addr);

    // ── STRUCTS ───────────────────────────────────────────────────────────────

    struct Employee {
        euint64 encryptedSalary;      // encrypted, never visible on-chain
        euint64 encryptedBalance;     // encrypted, never visible on-chain
        bool isActive;                // plaintext — no sensitivity
        uint256 addedAt;
        bool balanceInitialized;
    }

    struct LastError {
        euint8 errorCode;
        uint256 timestamp;
    }

    // ── STATE VARIABLES ───────────────────────────────────────────────────────

    address public immutable employer;

    mapping(address => Employee) private _employees;
    address[] private _employeeList;
    mapping(address => bool) private _isEmployee;

    euint64 private _encryptedTreasuryBalance;
    bool private _treasuryInitialized;
    uint256 private _plainTreasuryBalance;

    mapping(address => LastError) private _lastErrors;

    // Plaintext salary mirrors — V1 shortcut for ETH withdrawal accounting
    // V2 replaces with FHE.checkSignatures() withdrawal proof flow
    mapping(address => uint256) private _plainSalaryMirror;
    mapping(address => uint256) private _plainEmployeeBalanceMirror;

    // ── MODIFIERS ─────────────────────────────────────────────────────────────

    modifier onlyEmployer() {
        if (msg.sender != employer) revert NotEmployer();
        _;
    }

    modifier onlyEmployee() {
        if (!_isEmployee[msg.sender]) revert NotEmployee();
        _;
    }

    modifier employeeExists(address emp) {
        if (!_isEmployee[emp]) revert EmployeeNotFound(emp);
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    constructor() {
        employer = msg.sender;

        NO_ERROR = FHE.asEuint8(0);
        ERR_INSUFFICIENT_TREASURY = FHE.asEuint8(1);
        ERR_ZERO_BALANCE          = FHE.asEuint8(2);
        ERR_NOT_ACTIVE            = FHE.asEuint8(3);

        FHE.allowThis(NO_ERROR);
        FHE.allowThis(ERR_INSUFFICIENT_TREASURY);
        FHE.allowThis(ERR_ZERO_BALANCE);
        FHE.allowThis(ERR_NOT_ACTIVE);
    }

    // ── EMPLOYER FUNCTIONS ────────────────────────────────────────────────────

    /// @notice Add a new employee with an encrypted salary.
    /// @dev Employer encrypts salary client-side → SDK produces handle + ZK proof
    ///      → FHE.fromExternal() verifies proof and converts to native euint64
    ///      → ACL grants restrict decryption to contract + employer + that employee
    function addEmployee(
        address emp,
        externalEuint64 encryptedSalary,
        bytes calldata inputProof
    )
        external
        onlyEmployer
        validAddress(emp)
    {
        if (_isEmployee[emp]) revert AlreadyEmployee(emp);
        if (_employeeList.length >= MAX_EMPLOYEES) revert MaxEmployeesReached();

        euint64 salary = FHE.fromExternal(encryptedSalary, inputProof);

        _employees[emp].encryptedSalary   = salary;
        _employees[emp].isActive          = true;
        _employees[emp].addedAt           = block.timestamp;
        _employees[emp].balanceInitialized = false;

        _isEmployee[emp] = true;
        _employeeList.push(emp);

        _grantSalaryAccess(emp);

        emit EmployeeAdded(emp, block.timestamp);
    }

    /// @notice Update an employee's salary with a newly encrypted value.
    function updateSalary(
        address emp,
        externalEuint64 encryptedSalary,
        bytes calldata inputProof
    )
        external
        onlyEmployer
        employeeExists(emp)
    {
        euint64 newSalary = FHE.fromExternal(encryptedSalary, inputProof);
        _employees[emp].encryptedSalary = newSalary;
        _grantSalaryAccess(emp);
        emit SalaryUpdated(emp, block.timestamp);
    }

    /// @notice Set the plaintext ETH equivalent for withdrawal accounting (V1).
    function setPlainSalaryMirror(address emp, uint256 amountInWei)
        external
        onlyEmployer
        employeeExists(emp)
    {
        _plainSalaryMirror[emp] = amountInWei;
    }

    function deactivateEmployee(address emp) external onlyEmployer employeeExists(emp) {
        _employees[emp].isActive = false;
        emit EmployeeDeactivated(emp, block.timestamp);
    }

    function reactivateEmployee(address emp) external onlyEmployer employeeExists(emp) {
        _employees[emp].isActive = true;
        emit EmployeeReactivated(emp, block.timestamp);
    }

    /// @notice Employer deposits ETH into the payroll treasury.
    /// @dev Updates both the encrypted mirror (for confidential FHE accounting)
    ///      and the plaintext balance (for actual ETH withdrawal execution).
    function depositToTreasury(externalEuint64 encryptedAmount, bytes calldata inputProof) external payable onlyEmployer {
        require(msg.value > 0, "Deposit must be non-zero");

        euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

        if (!_treasuryInitialized) {
            _encryptedTreasuryBalance = amount;
            _treasuryInitialized = true;
        } else {
            _encryptedTreasuryBalance = FHE.add(_encryptedTreasuryBalance, amount);
        }

        FHE.allowThis(_encryptedTreasuryBalance);
        FHE.allow(_encryptedTreasuryBalance, employer);

        _plainTreasuryBalance += msg.value;

        emit TreasuryDeposited(block.timestamp);
    }

    /// @notice Execute payroll — disburse one period's salary to all active employees.
    ///
    /// @dev SAFE PAYROLL PATTERN:
    ///   hasFunds      = FHE.le(salary, treasury)          — encrypted ebool
    ///   actualPayment = FHE.select(hasFunds, salary, 0)   — 0 if treasury dry
    ///   treasury      = FHE.sub(treasury, actualPayment)  — safe, no underflow
    ///   balance       = FHE.add(balance, actualPayment)   — accumulates pay
    ///
    ///   Loop cannot break on encrypted condition (fhEVM constraint).
    ///   isActive is plaintext so we CAN skip inactive employees with `continue

    function executePayroll() external onlyEmployer {
        require(_treasuryInitialized, "Treasury not funded");

        uint256 processed = 0;

        for (uint256 i = 0; i < _employeeList.length; i++) {
            address emp = _employeeList[i];

            if (!_employees[emp].isActive) continue;

            euint64 salary = _employees[emp].encryptedSalary;

            // Encrypted conditional check — no info leaked about treasury amount
            ebool hasFunds = FHE.le(salary, _encryptedTreasuryBalance);

            // If treasury is short: actualPayment = 0 (employee silently skipped)
            euint64 actualPayment = FHE.select(hasFunds, salary, FHE.asEuint64(0));

            // Deduct from treasury
            _encryptedTreasuryBalance = FHE.sub(_encryptedTreasuryBalance, actualPayment);
            FHE.allowThis(_encryptedTreasuryBalance);
            FHE.allow(_encryptedTreasuryBalance, employer);

            // Credit employee balance
            _initOrAddBalance(emp, actualPayment);

            // Encrypted error feedback for frontend
            _setError(
                FHE.select(hasFunds, NO_ERROR, ERR_INSUFFICIENT_TREASURY),
                emp
            );

            // Update plaintext mirrors for ETH withdrawal
            _plainTreasuryBalance -= _plainSalaryMirror[emp];
            _plainEmployeeBalanceMirror[emp] += _plainSalaryMirror[emp];

            processed++;
        }

        emit PayrollExecuted(block.timestamp, processed);
    }

    // ── EMPLOYEE FUNCTIONS ────────────────────────────────────────────────────

    /// @notice Returns the caller's encrypted salary handle for client-side decryption.
    /// @dev Caller's frontend decrypts via:
    ///      fhevm.userDecryptEuint(FhevmType.euint64, handle, contractAddress, signer)
    function getMyEncryptedSalary() external view onlyEmployee returns (euint64) {
        return _employees[msg.sender].encryptedSalary;
    }

    /// @notice Returns the caller's encrypted accumulated balance handle.
    function getMyEncryptedBalance() external view onlyEmployee returns (euint64) {
        require(_employees[msg.sender].balanceInitialized, "No balance yet");
        return _employees[msg.sender].encryptedBalance;
    }

    /// @notice Employee withdraws their full accumulated balance as ETH.
    /// @dev Follows checks-effects-interactions pattern. Zeroes encrypted
    ///      balance in parallel with ETH transfer for bookkeeping consistency.
    function withdraw() external onlyEmployee {
        uint256 amount = _plainEmployeeBalanceMirror[msg.sender];

        if (amount == 0) {
            _setError(ERR_ZERO_BALANCE, msg.sender);
            return;
        }

        // Effects first
        _plainEmployeeBalanceMirror[msg.sender] = 0;

        // Zero out encrypted balance
        euint64 zeroed = FHE.asEuint64(0);
        _employees[msg.sender].encryptedBalance = zeroed;
        FHE.allowThis(zeroed);
        FHE.allow(zeroed, msg.sender);
        FHE.allow(zeroed, employer);

        _setError(NO_ERROR, msg.sender);

        // Interaction last
        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "ETH transfer failed");

        emit Withdrawal(msg.sender, amount, block.timestamp);
    }

    // ── VIEW FUNCTIONS ────────────────────────────────────────────────────────

    function getEncryptedTreasuryBalance() external view onlyEmployer returns (euint64) {
        require(_treasuryInitialized, "Treasury not funded");
        return _encryptedTreasuryBalance;
    }

    function getEmployeeList() external view returns (address[] memory) {
        return _employeeList;
    }

    function getEmployeeCount() external view returns (uint256) {
        return _employeeList.length;
    }

    function getIsEmployeeActive(address emp) external view returns (bool) {
        return _employees[emp].isActive;
    }

    function getEmployeeAddedAt(address emp) external view returns (uint256) {
        return _employees[emp].addedAt;
    }

    /// @notice Returns encrypted error code for an address.
    /// @dev Error codes: 0=OK, 1=Insufficient treasury, 2=Zero balance, 3=Not active
    ///      Frontend decrypts errorCode using fhEVM SDK to display human-readable message.
    function getLastError(address addr) external view returns (euint8 errorCode, uint256 timestamp) {
        LastError memory err = _lastErrors[addr];
        return (err.errorCode, err.timestamp);
    }

    // ── INTERNAL HELPERS ──────────────────────────────────────────────────────

    /// @dev THREE REQUIRED ACL GRANTS per ciphertext:
    ///      1. allowThis  — contract reuses handle in future txs (payroll loop)
    ///      2. allow(employer) — employer can decrypt for verification
    ///      3. allow(emp)      — employee can decrypt their own salary
    function _grantSalaryAccess(address emp) internal {
        euint64 salary = _employees[emp].encryptedSalary;
        FHE.allowThis(salary);
        FHE.allow(salary, employer);
        FHE.allow(salary, emp);
    }

    function _grantBalanceAccess(address emp) internal {
        euint64 balance = _employees[emp].encryptedBalance;
        FHE.allowThis(balance);
        FHE.allow(balance, employer);
        FHE.allow(balance, emp);
    }

    /// @dev On first payroll: directly assign (uninitialized handle can't be used in FHE ops).
    ///      On subsequent payrolls: FHE.add() to accumulate.
    function _initOrAddBalance(address emp, euint64 amount) internal {
        if (!_employees[emp].balanceInitialized) {
            _employees[emp].encryptedBalance = amount;
            _employees[emp].balanceInitialized = true;
        } else {
            _employees[emp].encryptedBalance = FHE.add(
                _employees[emp].encryptedBalance,
                amount
            );
        }
        _grantBalanceAccess(emp);
    }

    function _setError(euint8 errorCode, address addr) internal {
        _lastErrors[addr] = LastError(errorCode, block.timestamp);
        FHE.allowThis(errorCode);
        FHE.allow(errorCode, addr);
        emit ErrorChanged(addr);
    }

    // ── FALLBACK ──────────────────────────────────────────────────────────────

    receive() external payable {
        _plainTreasuryBalance += msg.value;
    }
}