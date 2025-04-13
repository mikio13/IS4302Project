const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("UserRegistry Contract", function () {
    let UserRegistry;
    let userRegistry;
    let account1, account2, others;

    before(async function () {
        [account1, account2, ...others] = await ethers.getSigners();

        // account1 will act as PlatformOwner (admin)
        // Deploy UserRegistry with account1 as the designated admin
        UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy(account1.address);
        await userRegistry.waitForDeployment();
    });

    // Test that deployment succeeded and contract address is valid
    it("Should deploy UserRegistry contract successfully", async function () {
        expect(await userRegistry.getAddress()).to.be.properAddress;
    });

    // Test registration for account1 (PlatformOwner)
    it("Should register a user successfully and emit an event", async function () {
        const tx = await userRegistry
            .connect(account1)
            .registerUser("hashed123", "Alice");

        // Expect UserRegistered event with correct data
        await expect(tx)
            .to.emit(userRegistry, "UserRegistered")
            .withArgs(account1.address, "hashed123", "Alice");

        // account1 fetches their own details
        const [retrievedNRIC, retrievedName, retrievedStatus] = await userRegistry
            .connect(account1)
            .getUserDetails(account1.address);

        expect(retrievedNRIC).to.equal("hashed123");
        expect(retrievedName).to.equal("Alice");
        expect(retrievedStatus).to.equal(true);
    });

    // Prevent duplicate registration for same wallet
    it("Should not allow duplicate registration", async function () {
        await expect(
            userRegistry.connect(account1).registerUser("hashed456", "Bob")
        ).to.be.revertedWith("Already registered");
    });

    // Test registration status reporting
    it("Should correctly report registration status using isRegistered", async function () {
        // account1 is registered from earlier
        expect(await userRegistry.isRegistered(account1.address)).to.equal(true);

        // account2 is not registered yet
        expect(await userRegistry.isRegistered(account2.address)).to.equal(false);

        // Now register account2 (regular platform user)
        const tx = await userRegistry
            .connect(account2)
            .registerUser("hashed999", "Eve");
        await tx.wait();

        expect(await userRegistry.isRegistered(account2.address)).to.equal(true);
    });

    // Test that users can retrieve their *own* details
    it("Should allow the user to view their own details", async function () {
        const [retrievedNRIC, retrievedName, retrievedStatus] = await userRegistry
            .connect(account2)
            .getUserDetails(account2.address); // self-access

        expect(retrievedNRIC).to.equal("hashed999");
        expect(retrievedName).to.equal("Eve");
        expect(retrievedStatus).to.equal(true);
    });

    // Admin (PlatformOwner) can view any registered user's details
    it("Should allow admin to view any registered user’s details", async function () {
        const [nric, name, status] = await userRegistry
            .connect(account1) // admin access
            .getUserDetails(account2.address);

        expect(nric).to.equal("hashed999");
        expect(name).to.equal("Eve");
        expect(status).to.equal(true);
    });

    // Non-admins cannot access other people's user details
    it("Should revert when non-admin tries to view another user's details", async function () {
        await expect(
            userRegistry.connect(account2).getUserDetails(account1.address)
        ).to.be.revertedWith("Not authorised");
    });

    // Even self-access fails if user is not registered
    it("Should revert when calling getUserDetails on an unregistered user", async function () {
        const unregistered = others[0];
        await expect(
            userRegistry.connect(unregistered).getUserDetails(unregistered.address)
        ).to.be.revertedWith("Not registered");
    });
});