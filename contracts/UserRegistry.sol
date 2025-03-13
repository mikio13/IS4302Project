// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This contract stores user registrations (including hashed NRIC data)
contract UserRegistry {
    struct User {
        string hashedNRIC; // Pre-hashed NRIC provided off-chain
        string name;
        bool registered;
    }

    mapping(address => User) private _users;

    event UserRegistered(address indexed user, string hashedNRIC, string name);

    // This function registers a new user with a hashed NRIC and name
    // We use calldata since we're not modifying the strings + cheaper in gas compared to using memory
    function registerUser(
        string calldata hashedNRIC,
        string calldata name
    ) external {
        require(!_users[msg.sender].registered, "Already registered");
        _users[msg.sender] = User(hashedNRIC, name, true);
        emit UserRegistered(msg.sender, hashedNRIC, name);
    }

    // This function checks if a given address is registered
    function isRegistered(address user) external view returns (bool) {
        return _users[user].registered;
    }

    // This function retrieves user details (hashedNRIC, name, and registration status)
    function getUserDetails(
        address user
    ) external view returns (string memory, string memory, bool) {
        require(_users[user].registered, "Not registered");
        return (_users[user].hashedNRIC, _users[user].name, true);
    }
}
