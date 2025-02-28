// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract User {
    enum Role {
        Regular,
        Organiser
    }

    struct user {
        address account; // The user's Ethereum address
        string nric; // NRIC (will be hashed later)
        string email;
        string password;
        string fullName;
        bool isVerified; // Verification status
        Role role; // Role of the user (Regular or Organiser)
    }

    mapping(address => user) public users;

    event UserRegistered(
        address indexed account,
        string nric,
        string email,
        string fullName,
        Role role
    );
    event UserVerified(address indexed account);

    function registerUser(
        string calldata _nric,
        string calldata _email,
        string calldata _password,
        string calldata _fullName,
        Role _role // Allow user to specify role at registration
    ) external {
        require(
            users[msg.sender].account == address(0),
            "User already registered"
        );

        users[msg.sender] = user({
            account: msg.sender,
            nric: _nric,
            email: _email,
            password: _password,
            fullName: _fullName,
            isVerified: false,
            role: _role
        });

        emit UserRegistered(msg.sender, _nric, _email, _fullName, _role);
    }

    function verifyUser(address _user) external {
        require(users[_user].account != address(0), "User not registered");
        users[_user].isVerified = true;
        emit UserVerified(_user);
    }

    function getUser(address _user) external view returns (user memory) {
        require(users[_user].account != address(0), "User not registered");
        return users[_user];
    }
}
