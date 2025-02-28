const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("User Contract", function () {
    let User;
    let userContract;
    let account1, account2, others;

    beforeEach(async function () {
        [account1, account2, ...others] = await ethers.getSigners();
        User = await ethers.getContractFactory("User");
        userContract = await User.deploy();
        await userContract.waitForDeployment();
    });

    // Test deployment
    it("Should deploy User contract successfully", async function () {
        expect(await userContract.getAddress()).to.be.properAddress;
    });

    // Test registration for a Regular user (role = 0)
    it("Should register a Regular user successfully", async function () {
        const tx = await userContract.connect(account1).registerUser(
            "S1234567A",              // NRIC
            "user1@gmail.com",         // email
            "password123",             // password
            "Tachihara Mikio",         // fullName
            0                          // role: 0 for Regular
        );
        await tx.wait();

        const userData = await userContract.getUser(account1.address);
        expect(userData.account).to.equal(account1.address);
        expect(userData.nric).to.equal("S1234567A");
        expect(userData.email).to.equal("user1@gmail.com");
        expect(userData.fullName).to.equal("Tachihara Mikio");
        expect(userData.isVerified).to.equal(false);
        expect(userData.role).to.equal(0);
    });

    // Test that duplicate registration fails
    it("Should not allow duplicate registration", async function () {
        const tx = await userContract.connect(account1).registerUser(
            "S1234567A",
            "user1@example.com",
            "password123",
            "Alice Doe",
            0
        );
        await tx.wait();

        await expect(
            userContract.connect(account1).registerUser(
                "S7654321B",
                "user1_new@example.com",
                "newpassword",
                "Alice New",
                0
            )
        ).to.be.revertedWith("User already registered");
    });

    // Test user verification and role preservation
    it("Should verify a user and preserve their role", async function () {
        const tx = await userContract.connect(account2).registerUser(
            "S2345678B",
            "user2@example.com",
            "password456",
            "Bob Smith",
            1 // Organiser
        );
        await tx.wait();

        const verifyTx = await userContract.verifyUser(account2.address);
        await verifyTx.wait();

        const userData = await userContract.getUser(account2.address);
        expect(userData.isVerified).to.equal(true);
        expect(userData.role).to.equal(1);
    });

    // Edge Case: Trying to get a user that does not exist
    it("Should revert when trying to retrieve a non-registered user", async function () {
        await expect(userContract.getUser(others[0].address)).to.be.revertedWith("User not registered");
    });
});