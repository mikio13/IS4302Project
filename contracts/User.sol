// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract User {
    struct user {
        address account; // The user's Ethereum address
        string nric; // NRIC / email / password / fullName should be hashed later on, but just gonna use string for now
        string email;
        string password;
        string fullName;
        bool isVerified; // Verification status of the user
    }

    // Mapping to store users by their Ethereum address
    // basically creates an array of users and to access each index we use the Eth address
    mapping(address => user) public users;

    // Events for logging user actions
    event UserRegistered(
        address indexed account,
        string nric,
        string email,
        string fullName
    );
    event UserVerified(address indexed account);

    //Registers a new user only if that eth address doesn't already have an account
    function registerUser(
        string calldata _nric, //calldata helps tell the compiler that the field is read-only
        string calldata _email,
        string calldata _password,
        string calldata _fullName
    ) external {
        //specifies that a function can only be called from outside the contract
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
            isVerified: false
        });

        emit UserRegistered(msg.sender, _nric, _email, _fullName);
    }

    /**
     * @dev Verifies an existing user.
     * Note: No access control is enforced here. In a real system, you would restrict this function.
     */
    function verifyUser(address _user) external {
        require(users[_user].account != address(0), "User not registered");
        users[_user].isVerified = true;
        emit UserVerified(_user);
    }

    /**
     * @dev Retrieves user details for a given address.
     * Requirements:
     * - The user must be registered.
     */
    function getUser(address _user) external view returns (user memory) {
        require(users[_user].account != address(0), "User not registered");
        return users[_user];
    }
}
