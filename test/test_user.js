const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("User Contract", function () {
    let User;
    let userContract;
    let account1, account2, others;

    // Deploy a fresh instance before each test
    beforeEach(async function () {
        [account1, account2, ...others] = await ethers.getSigners();
        User = await ethers.getContractFactory("User");
        userContract = await User.deploy();
        await userContract.waitForDeployment();
    });

    // Test that the contract deploys successfully
    it("Should deploy User contract successfully", async function () {
        expect(await userContract.getAddress()).to.be.properAddress;
    });

    // Test registration for a Regular user (role = 0)
    it("Should register a Regular user successfully", async function () {
        // account1 registers with their details as a Regular user
        const tx = await userContract.connect(account1).registerUser(
            "S1234567A",              // NRIC
            "user1@gmail.com",         // email
            "password123",             // password
            "Tachihara Mikio",         // fullName
            0                          // role: 0 for Regular
        );
        await tx.wait();

        // Retrieve user data from the contract
        const userData = await userContract.getUser(account1.address);
        expect(userData.account).to.equal(account1.address);
        expect(userData.nric).to.equal("S1234567A");
        expect(userData.email).to.equal("user1@gmail.com");
        expect(userData.fullName).to.equal("Tachihara Mikio");
        expect(userData.isVerified).to.equal(false);
        expect(userData.role).to.equal(0); // Role 0 indicates Regular
    });

    // Test that duplicate registration fails
    it("Should not allow duplicate registration", async function () {
        // account1 registers first
        const tx = await userContract.connect(account1).registerUser(
            "S1234567A",
            "user1@example.com",
            "password123",
            "Alice Doe",
            0 // Regular user
        );
        await tx.wait();

        // Attempt to register again from the same account should revert
        await expect(
            userContract.connect(account1).registerUser(
                "S7654321B",
                "user1_new@example.com",
                "newpassword",
                "Alice New",
                0 // Regular user
            )
        ).to.be.revertedWith("User already registered");
    });

    // Test user verification and role differentiation
    it("Should verify a user and preserve their role", async function () {
        // account2 registers as an Organiser (role = 1)
        const tx = await userContract.connect(account2).registerUser(
            "S2345678B",
            "user2@example.com",
            "password456",
            "Bob Smith",
            1 // role: 1 for Organiser
        );
        await tx.wait();

        // Verify account2
        const verifyTx = await userContract.verifyUser(account2.address);
        await verifyTx.wait();

        // Retrieve and check the verification status and role
        const userData = await userContract.getUser(account2.address);
        expect(userData.isVerified).to.equal(true);
        expect(userData.role).to.equal(1); // Role 1 indicates Organiser
    });
});