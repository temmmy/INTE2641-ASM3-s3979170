// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IEAS} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {Attestation} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";

/// @title AGE Escrow
/// @notice Attestation-gated escrow contract that releases funds only after a valid EAS attestation.
contract AgeEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @notice Task status lifecycle.
    enum Status {
        Open,
        Submitted,
        Paid,
        Refunded
    }

    /// @notice Task details as defined in the PRD.
    struct Task {
        address client;
        address worker;
        address attestor;
        address token; // address(0) = ETH
        uint256 amount;
        uint64 deadline;
        Status status;
        string workUri;
        bytes32 attestationUid;
    }

    /// @notice EAS instance used for attestation validation.
    IEAS public immutable eas;

    /// @notice Schema UID for the TaskCompleted attestation.
    bytes32 public immutable taskCompletedSchemaUid;

    /// @dev Task storage mapping.
    mapping(uint256 => Task) public tasks;

    /// @dev Tracks whether a task escrow is funded.
    mapping(uint256 taskId => bool) private _funded;

    // -------------------------------------------------------------------------
    // Errors
    // -------------------------------------------------------------------------

    error InvalidEAS();
    error InvalidSchema();
    error InvalidTask();
    error TaskExists();
    error InvalidWorker();
    error InvalidAttestor();
    error InvalidAmount();
    error InvalidDeadline();
    error DeadlinePassed();
    error NotClient();
    error NotWorker();
    error NotFunded();
    error AlreadyFunded();
    error BadStatus();
    error DeadlineNotPassed();
    error WrongAmount();
    error InvalidAttestationProvided();
    error TransferFailed();

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event TaskCreated(
        uint256 indexed id,
        address indexed client,
        address indexed worker,
        address attestor,
        address token,
        uint256 amount,
        uint64 deadline
    );

    event TaskFunded(uint256 indexed id, address indexed funder);

    event WorkSubmitted(uint256 indexed id, string workUri);

    event Paid(uint256 indexed id, bytes32 attestationUid);

    event Refunded(uint256 indexed id);

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(IEAS eas_, bytes32 schemaUid_) {
        if (address(eas_) == address(0)) revert InvalidEAS();
        if (schemaUid_ == bytes32(0)) revert InvalidSchema();

        eas = eas_;
        taskCompletedSchemaUid = schemaUid_;
    }

    // -------------------------------------------------------------------------
    // External API
    // -------------------------------------------------------------------------

    /// @notice Creates a task configuration. Funding is handled separately.
    function createTask(
        uint256 taskId,
        address worker,
        address attestor,
        address token,
        uint256 amount,
        uint64 deadline
    ) external {
        if (tasks[taskId].client != address(0)) revert TaskExists();
        if (worker == address(0)) revert InvalidWorker();
        if (attestor == address(0)) revert InvalidAttestor();
        if (amount == 0) revert InvalidAmount();
        if (deadline <= block.timestamp) revert InvalidDeadline();

        tasks[taskId] = Task({
            client: msg.sender,
            worker: worker,
            attestor: attestor,
            token: token,
            amount: amount,
            deadline: deadline,
            status: Status.Open,
            workUri: "",
            attestationUid: bytes32(0)
        });

        emit TaskCreated(taskId, msg.sender, worker, attestor, token, amount, deadline);
    }

    /// @notice Funds a task escrow with ETH or the configured ERC-20 token.
    function fundTask(uint256 taskId) external payable nonReentrant {
        Task storage task = _getTask(taskId);
        if (msg.sender != task.client) revert NotClient();
        if (_funded[taskId]) revert AlreadyFunded();
        if (task.status != Status.Open) revert BadStatus();

        if (task.token == address(0)) {
            if (msg.value != task.amount) revert WrongAmount();
        } else {
            if (msg.value != 0) revert WrongAmount();
            IERC20(task.token).safeTransferFrom(msg.sender, address(this), task.amount);
        }

        _funded[taskId] = true;

        emit TaskFunded(taskId, msg.sender);
    }

    /// @notice Allows the worker to submit the completed work reference.
    function submitWork(uint256 taskId, string calldata workUri) external {
        Task storage task = _getTask(taskId);
        if (msg.sender != task.worker) revert NotWorker();
        if (!_funded[taskId]) revert NotFunded();
        if (task.status != Status.Open) revert BadStatus();
        if (block.timestamp > task.deadline) revert DeadlinePassed();

        task.workUri = workUri;
        task.status = Status.Submitted;

        emit WorkSubmitted(taskId, workUri);
    }

    /// @notice Releases escrow funds to the worker after verifying the attestation.
    function releasePayment(uint256 taskId, bytes32 attestationUid) external nonReentrant {
        Task storage task = _getTask(taskId);
        if (!_funded[taskId]) revert NotFunded();
        if (task.status != Status.Submitted) revert BadStatus();
        if (task.attestationUid != bytes32(0)) revert BadStatus();

        Attestation memory attestation = eas.getAttestation(attestationUid);
        _validateAttestation(taskId, task, attestationUid, attestation);

        task.attestationUid = attestationUid;
        task.status = Status.Paid;
        _funded[taskId] = false;

        if (task.token == address(0)) {
            (bool success, ) = task.worker.call{value: task.amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(task.token).safeTransfer(task.worker, task.amount);
        }

        emit Paid(taskId, attestationUid);
    }

    /// @notice Refunds the client if the deadline has passed without payout.
    function refund(uint256 taskId) external nonReentrant {
        Task storage task = _getTask(taskId);
        if (msg.sender != task.client) revert NotClient();
        if (!_funded[taskId]) revert NotFunded();
        if (task.status == Status.Paid) revert BadStatus();
        if (task.status == Status.Refunded) revert BadStatus();
        if (block.timestamp <= task.deadline) revert DeadlineNotPassed();

        task.status = Status.Refunded;
        _funded[taskId] = false;

        if (task.token == address(0)) {
            (bool success, ) = task.client.call{value: task.amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(task.token).safeTransfer(task.client, task.amount);
        }

        emit Refunded(taskId);
    }

    // -------------------------------------------------------------------------
    // View helpers
    // -------------------------------------------------------------------------

    function isFunded(uint256 taskId) external view returns (bool) {
        return _funded[taskId];
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    function _getTask(uint256 taskId) private view returns (Task storage task) {
        task = tasks[taskId];
        if (task.client == address(0)) revert InvalidTask();
    }

    function _validateAttestation(
        uint256 taskId,
        Task storage task,
        bytes32 expectedUid,
        Attestation memory attestation
    ) private view {
        if (attestation.uid != expectedUid) revert InvalidAttestationProvided();
        if (attestation.attester == address(0)) revert InvalidAttestationProvided();
        if (attestation.schema != taskCompletedSchemaUid) revert InvalidAttestationProvided();
        if (attestation.attester != task.attestor) revert InvalidAttestationProvided();
        if (attestation.recipient != task.worker) revert InvalidAttestationProvided();
        if (attestation.revocationTime != 0) revert InvalidAttestationProvided();
        if (attestation.expirationTime != 0 && attestation.expirationTime < block.timestamp) {
            revert InvalidAttestationProvided();
        }
        if (attestation.data.length == 0) revert InvalidAttestationProvided();

        (uint256 attTaskId, , , address attWorker, address attClient) = abi.decode(
            attestation.data,
            (uint256, uint8, string, address, address)
        );

        if (attTaskId != taskId) revert InvalidAttestationProvided();
        if (attWorker != task.worker) revert InvalidAttestationProvided();
        if (attClient != task.client) revert InvalidAttestationProvided();
    }
}
