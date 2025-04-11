// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// The UserRegistry contract manages registration of all end users and organisers on-chain.
contract UserRegistry {
    struct User {
        string hashedNRIC; // In production: client should hash NRIC before submitting
        string name;
        bool registered;
    }

    // Maps wallet address to user registration record
    mapping(address => User) private _users;

    event UserRegistered(address indexed user, string hashedNRIC, string name);

    // Registers a user. Rejects duplicate registrations.
    function registerUser(
        string calldata hashedNRIC,
        string calldata name
    ) external {
        require(!_users[msg.sender].registered, "Already registered");

        _users[msg.sender] = User({
            hashedNRIC: hashedNRIC,
            name: name,
            registered: true
        });

        emit UserRegistered(msg.sender, hashedNRIC, name);
    }

    // Checks if a wallet address is registered.
    function isRegistered(address user) external view returns (bool) {
        return _users[user].registered;
    }

    // Returns user details (used for identity verification on the frontend).
    function getUserDetails(
        address user
    ) external view returns (string memory, string memory, bool) {
        require(_users[user].registered, "Not registered");
        return (_users[user].hashedNRIC, _users[user].name, true);
    }
}
