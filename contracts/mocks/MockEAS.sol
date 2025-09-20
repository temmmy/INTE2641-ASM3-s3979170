// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IEAS, AttestationRequest, DelegatedAttestationRequest, MultiAttestationRequest, MultiDelegatedAttestationRequest, RevocationRequest, DelegatedRevocationRequest, MultiRevocationRequest, MultiDelegatedRevocationRequest, RevocationRequestData} from "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";
import {Attestation} from "@ethereum-attestation-service/eas-contracts/contracts/Common.sol";
import {ISchemaRegistry} from "@ethereum-attestation-service/eas-contracts/contracts/ISchemaRegistry.sol";

/// @dev Simple mock of the EAS contract that allows tests to control attestation responses.
contract MockEAS is IEAS {
    error NotSupported();

    mapping(bytes32 => Attestation) private _attestations;

    function setAttestation(Attestation calldata attestation) external {
        _attestations[attestation.uid] = attestation;
    }

    function deleteAttestation(bytes32 uid) external {
        delete _attestations[uid];
    }

    // IEAS minimal implementations -------------------------------------------------

    function getSchemaRegistry() external pure override returns (ISchemaRegistry) {
        return ISchemaRegistry(address(0));
    }

    function attest(AttestationRequest calldata) external payable override returns (bytes32) {
        revert NotSupported();
    }

    function attestByDelegation(
        DelegatedAttestationRequest calldata
    ) external payable override returns (bytes32) {
        revert NotSupported();
    }

    function multiAttest(
        MultiAttestationRequest[] calldata
    ) external payable override returns (bytes32[] memory) {
        revert NotSupported();
    }

    function multiAttestByDelegation(
        MultiDelegatedAttestationRequest[] calldata
    ) external payable override returns (bytes32[] memory) {
        revert NotSupported();
    }

    function revoke(RevocationRequest calldata) external payable override {
        revert NotSupported();
    }

    function revokeByDelegation(
        DelegatedRevocationRequest calldata
    ) external payable override {
        revert NotSupported();
    }

    function multiRevoke(
        MultiRevocationRequest[] calldata
    ) external payable override {
        revert NotSupported();
    }

    function multiRevokeByDelegation(
        MultiDelegatedRevocationRequest[] calldata
    ) external payable override {
        revert NotSupported();
    }

    function timestamp(bytes32) external pure override returns (uint64) {
        revert NotSupported();
    }

    function multiTimestamp(bytes32[] calldata) external pure override returns (uint64) {
        revert NotSupported();
    }

    function revokeOffchain(bytes32) external pure override returns (uint64) {
        revert NotSupported();
    }

    function multiRevokeOffchain(bytes32[] calldata) external pure override returns (uint64) {
        revert NotSupported();
    }

    function getTimestamp(bytes32) external pure override returns (uint64) {
        revert NotSupported();
    }

    function getRevokeOffchain(address, bytes32) external pure override returns (uint64) {
        revert NotSupported();
    }

    function getAttestation(bytes32 uid) external view override returns (Attestation memory) {
        return _attestations[uid];
    }

    function isAttestationValid(bytes32) external pure override returns (bool) {
        revert NotSupported();
    }

    function version() external pure override returns (string memory) {
        return "mock";
    }
}
