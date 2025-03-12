const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserRegistry Contract", function () {
    let UserRegistry;
    let userRegistry;
    let account1, account2, others;

    beforeEach(async function () {
        [account1, account2, ...others] = await ethers.getSigners();
        UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy();
        await userRegistry.waitForDeployment();
    });

    // Test deployment
    it("Should deploy UserRegistry contract successfully", async function () {
        expect(await userRegistry.getAddress()).to.be.properAddress;
    });

    // Test user registration and event emission
    it("Should register a user successfully and emit an event", async function () {
        const tx = await userRegistry.connect(account1).registerUser(
            "hashed123",   // hashed NRIC value
            "Alice"        // name
        );
        // Check for event emission with correct arguments
        await expect(tx)
            .to.emit(userRegistry, "UserRegistered")
            .withArgs(account1.address, "hashed123", "Alice");

        const userData = await userRegistry.users(account1.address);
        expect(userData.nricHash).to.equal("hashed123");
        expect(userData.name).to.equal("Alice");
        expect(userData.registered).to.equal(true);
    });

    // Test that duplicate registration fails
    it("Should not allow duplicate registration", async function () {
        await userRegistry.connect(account1).registerUser("hashed123", "Alice");

        await expect(
            userRegistry.connect(account1).registerUser("hashed456", "Bob")
        ).to.be.revertedWith("User already registered");
    });

    // Test registration status via isRegistered function
    it("Should correctly report registration status using isRegistered", async function () {
        // Initially, account1 should not be registered
        expect(await userRegistry.isRegistered(account1.address)).to.equal(false);

        // Register account1
        await userRegistry.connect(account1).registerUser("hashed123", "Alice");
        expect(await userRegistry.isRegistered(account1.address)).to.equal(true);

        // account2 remains unregistered
        expect(await userRegistry.isRegistered(account2.address)).to.equal(false);
    });

    // Edge Case: Retrieve default values for an unregistered user
    it("Should return default values for non-registered user", async function () {
        const userData = await userRegistry.users(account2.address);
        expect(userData.nricHash).to.equal("");
        expect(userData.name).to.equal("");
        expect(userData.registered).to.equal(false);
    });
});
