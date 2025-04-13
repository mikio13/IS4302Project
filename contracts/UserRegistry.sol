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

    // Now only the user themselves or an ADMIN can fetch details
    function getUserDetails(
        address user
    ) external view returns (string memory, string memory, bool) {
        require(_users[user].registered, "Not registered");

        // Only the user or someone with ADMIN_ROLE can call this
        require(
            msg.sender == user || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorised"
        );

        User memory u = _users[user];
        return (u.hashedNRIC, u.name, true);
    }
}
