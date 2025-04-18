// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract UserRegistry is AccessControl {
    struct User {
        string hashedNRIC;
        string name;
        bool registered;
    }

    mapping(address => User) private _users;

    bytes32 public constant ADMIN_ROLE = DEFAULT_ADMIN_ROLE;

    event UserRegistered(address indexed user, string hashedNRIC, string name);
    event UserDeregistered(address indexed user);
    event UserUpdated(
        address indexed user,
        string newHashedNRIC,
        string newName
    );

    constructor(address platformOwner) {
        _grantRole(ADMIN_ROLE, platformOwner);
    }

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

    function isRegistered(address user) external view returns (bool) {
        return _users[user].registered;
    }

    function getUserDetails(
        address user
    ) external view returns (string memory, string memory, bool) {
        require(_users[user].registered, "Not registered");
        require(
            msg.sender == user || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorised"
        );

        User memory u = _users[user];
        return (u.hashedNRIC, u.name, true);
    }

    //Not used during the demo but useful to have
    function deregisterUser() external {
        require(_users[msg.sender].registered, "Not registered");
        delete _users[msg.sender];
        emit UserDeregistered(msg.sender);
    }

    // Allows an admin to update a user's details after off-chain verification. Not used in the demo.
    function adminUpdateUser(
        address user,
        string calldata newHashedNRIC,
        string calldata newName
    ) external onlyRole(ADMIN_ROLE) {
        require(_users[user].registered, "User not registered");

        _users[user].hashedNRIC = newHashedNRIC;
        _users[user].name = newName;

        emit UserUpdated(user, newHashedNRIC, newName);
    }
}
