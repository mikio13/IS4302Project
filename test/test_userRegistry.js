const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserRegistry Contract", function () {
    let UserRegistry;
    let userRegistry;
    let account1, account2, others;

    before(async function () {
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
        const tx = await userRegistry
            .connect(account1)
            .registerUser("hashed123", "Alice");

        // Check for UserRegistered event to be emitted with correct arguments
        await expect(tx)
            .to.emit(userRegistry, "UserRegistered")
            .withArgs(account1.address, "hashed123", "Alice");

        // Check that the user details are stored correctly
        const [retrievedNRIC, retrievedName, retrievedStatus] = await userRegistry.getUserDetails(
            account1.address
        );

        expect(retrievedNRIC).to.equal("hashed123");
        expect(retrievedName).to.equal("Alice");
        expect(retrievedStatus).to.equal(true);
    });

    // Test that duplicate registration fails
    it("Should not allow duplicate registration", async function () {
        // Account1 has already registered in the previous test, so this should revert
        await expect(
            userRegistry.connect(account1).registerUser("hashed456", "Bob")
        ).to.be.revertedWith("Already registered");
    });

    // Test registration status via isRegistered function
    it("Should correctly report registration status using isRegistered", async function () {
        // Account1 was registered in the second test
        expect(await userRegistry.isRegistered(account1.address)).to.equal(true);

        // Account2 remains unregistered
        expect(await userRegistry.isRegistered(account2.address)).to.equal(false);

        // Register account2
        const tx = await userRegistry
            .connect(account2)
            .registerUser("hashed999", "Eve");
        await tx.wait();

        // Now account2 should be registered
        expect(await userRegistry.isRegistered(account2.address)).to.equal(true);
    });

    // Test that getUserDetails reverts for an unregistered user (account from 'others')
    it("Should revert when calling getUserDetails on an unregistered user", async function () {
        const unregistered = others[0];
        await expect(
            userRegistry.getUserDetails(unregistered.address)
        ).to.be.revertedWith("Not registered");
    });
});
