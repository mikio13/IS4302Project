// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract UserRegistry {
    struct User {
        string nricHash; // Pre-hashed NRIC provided off-chain
        string name;
        bool registered;
    }

    mapping(address => User) public users;

    event UserRegistered(address indexed user, string nricHash, string name);

    // Expects the hashed NRIC to be produced off-chain and passed as a string.
    function registerUser(
        string memory _hashedNRIC,
        string memory _name
    ) public {
        require(!users[msg.sender].registered, "User already registered");
        users[msg.sender] = User({
            nricHash: _hashedNRIC,
            name: _name,
            registered: true
        });
        emit UserRegistered(msg.sender, _hashedNRIC, _name);
    }

    function isRegistered(address _user) external view returns (bool) {
        return users[_user].registered;
    }
}
