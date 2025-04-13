const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketingPlatform & UserRegistry Contracts", function () {
    let UserRegistry, userRegistry;
    let TicketingPlatform, ticketingPlatform;
    let owner, organiser, randomUser, others;

    // For custom error checks, we need the role hashes if we want to .withArgs(...) them
    let ORGANISER_ROLE;
    let DEFAULT_ADMIN_ROLE; // Usually 0x00 for AccessControl

    before(async function () {
        [owner, organiser, randomUser, ...others] = await ethers.getSigners();

        // Deploy UserRegistry
        UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy(owner.address);
        await userRegistry.waitForDeployment();

        // Deploy TicketingPlatform, passing userRegistry + initial commissionRate
        TicketingPlatform = await ethers.getContractFactory("TicketingPlatform");
        ticketingPlatform = await TicketingPlatform.deploy(
            await userRegistry.getAddress(), // userRegistry address
            500 // 5% in basis points
        );
        await ticketingPlatform.waitForDeployment();

        // If we want to test custom error .withArgs(...) properly, define the roles:
        ORGANISER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ORGANISER_ROLE"));
        // By default, AccessControl's DEFAULT_ADMIN_ROLE is 0x00
        DEFAULT_ADMIN_ROLE =
            "0x0000000000000000000000000000000000000000000000000000000000000000";
    });

    it("Should deploy both UserRegistry and TicketingPlatform successfully", async function () {
        expect(await userRegistry.getAddress()).to.be.properAddress;
        expect(await ticketingPlatform.getAddress()).to.be.properAddress;
    });

    it("Should not let a non-owner approve an organiser (custom error)", async function () {
        await expect(
            ticketingPlatform.connect(randomUser).approveOrganiser(organiser.address)
        )
            .to.be.revertedWithCustomError(ticketingPlatform, "AccessControlUnauthorizedAccount")
            .withArgs(randomUser.address, DEFAULT_ADMIN_ROLE);
    });

    it("Owner can approve an organiser", async function () {
        const tx = await ticketingPlatform
            .connect(owner)
            .approveOrganiser(organiser.address);
        await tx.wait();

        await expect(tx)
            .to.emit(ticketingPlatform, "OrganiserApproved")
            .withArgs(organiser.address);
    });

    it("Should allow an approved organiser to create an event", async function () {
        const tx = await ticketingPlatform
            .connect(organiser)
            .createEvent("My First Event");
        const receipt = await tx.wait();

        //Find the EventCreated log by its name in the transaction receipt
        const eventCreatedLog = receipt.logs.find(
            (log) => log.fragment?.name === "EventCreated"
        );

        //Extract the arguments from that log
        const [emittedOrganiser, eventContractAddress] = eventCreatedLog.args;

        await expect(tx)
            .to.emit(ticketingPlatform, "EventCreated")
            .withArgs(emittedOrganiser, eventContractAddress);

        expect(emittedOrganiser).to.equal(organiser.address);
        expect(eventContractAddress).to.be.properAddress;
    });


    it("Should allow the owner to update the commission rate", async function () {
        // Current commissionRate is 500 (5%)
        // We'll update to 1000 (10%)
        const tx = await ticketingPlatform.connect(owner).updateCommission(1000);
        await tx.wait();

        expect(await ticketingPlatform.commissionRate()).to.equal(1000);
    });

    it("Should revert if a non-owner tries to update commission (custom error)", async function () {
        await expect(
            ticketingPlatform.connect(randomUser).updateCommission(300)
        )
            .to.be.revertedWithCustomError(ticketingPlatform, "AccessControlUnauthorizedAccount")
            .withArgs(randomUser.address, DEFAULT_ADMIN_ROLE);
    });
});
