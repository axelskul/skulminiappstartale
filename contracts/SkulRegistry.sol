// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SkulRegistry
 * @author SKÜL Team
 * @notice A public registry for Proof-of-Skill credentials issued by the SKÜL EdTech platform.
 * @dev This contract allows users to record their educational achievements onchain.
 *      Credentials are stored per wallet address and can be queried publicly.
 */
contract SkulRegistry {
    /**
     * @notice Represents a single Proof-of-Skill credential
     * @param fid The user's Farcaster ID (FID)
     * @param skillName The name of the skill/category (e.g., "Business English")
     * @param completedAt The block timestamp when the credential was issued
     */
    struct Credential {
        uint256 fid;
        string skillName;
        uint256 completedAt;
    }

    /**
     * @notice Maps user wallet addresses to their list of credentials
     * @dev Public mapping allows automatic getter function generation
     */
    mapping(address => Credential[]) public userCredentials;

    /**
     * @notice Emitted when a new credential is issued to a user
     * @param user The wallet address of the user receiving the credential
     * @param fid The Farcaster ID associated with the credential
     * @param skillName The name of the skill/category
     * @param timestamp The block timestamp when the credential was issued
     * @dev Both `user` and `fid` are indexed for efficient event filtering
     */
    event CredentialIssued(
        address indexed user,
        uint256 indexed fid,
        string skillName,
        uint256 timestamp
    );

    /**
     * @notice Issues a new Proof-of-Skill credential to the caller
     * @param _fid The Farcaster ID of the user
     * @param _skillName The name of the skill/category being certified
     * @dev Creates a new Credential struct and adds it to the caller's credential list.
     *      Uses block.timestamp for the completion time. Emits CredentialIssued event.
     * @custom:security This function is public and can be called by anyone.
     *                 Users can only issue credentials to their own address (msg.sender).
     */
    function issueCredential(
        uint256 _fid,
        string memory _skillName
    ) public {
        // Create new credential with current block timestamp
        Credential memory newCredential = Credential({
            fid: _fid,
            skillName: _skillName,
            completedAt: block.timestamp
        });

        // Add credential to the caller's list
        userCredentials[msg.sender].push(newCredential);

        // Emit event for frontend indexing and notifications
        emit CredentialIssued(
            msg.sender,
            _fid,
            _skillName,
            block.timestamp
        );
    }

    /**
     * @notice Returns the total number of credentials for a given user
     * @param _user The wallet address to query
     * @return The number of credentials the user has
     * @dev Helper function for frontend to determine array length before fetching
     */
    function getCredentialCount(address _user) public view returns (uint256) {
        return userCredentials[_user].length;
    }

    /**
     * @notice Returns a specific credential for a user by index
     * @param _user The wallet address to query
     * @param _index The index of the credential in the user's array
     * @return The Credential struct at the specified index
     * @dev Reverts if index is out of bounds (Solidity 0.8+ automatic bounds checking)
     */
    function getCredential(
        address _user,
        uint256 _index
    ) public view returns (Credential memory) {
        return userCredentials[_user][_index];
    }
}

