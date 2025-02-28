const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Event Contract", function () {
    let Event;
    let eventContract;
    let organiser, nonOrganiser, others;

    beforeEach(async function () {
        [organiser, nonOrganiser, ...others] = await ethers.getSigners();
        Event = await ethers.getContractFactory("Event");
        eventContract = await Event.deploy();
        await eventContract.waitForDeployment();
    });

    // Test deployment
    it("Should deploy the Event contract successfully", async function () {
        expect(await eventContract.getAddress()).to.be.properAddress;
    });

    // Test event creation by an organiser
    it("Should allow an organiser to create an event", async function () {
        const description = "Blockchain Conference 2025";
        const createTx = await eventContract.connect(organiser).createEvent(description);
        await createTx.wait();

        // Retrieve event data from the contract (EventObj struct)
        const eventData = await eventContract.events(0);
        expect(eventData.organiser).to.equal(organiser.address);
        expect(eventData.description).to.equal(description);
        expect(eventData.id).to.equal(0);
    });

    // Edge Case: Create event with empty description
    it("Should allow event creation with an empty description", async function () {
        const description = "";
        const createTx = await eventContract.connect(organiser).createEvent(description);
        await createTx.wait();

        const eventData = await eventContract.events(0);
        expect(eventData.description).to.equal("");
    });

    // Test adding a ticket type by the event organiser
    it("Should allow the organiser to add a ticket type to an event", async function () {
        const description = "Blockchain Conference 2025";
        let tx = await eventContract.connect(organiser).createEvent(description);
        await tx.wait();

        // Define ticket type details
        const category = "VIP";
        const price = ethers.parseEther("0.1");
        const quota = 100;

        // Add ticket type to event 0
        tx = await eventContract.connect(organiser).addTicketType(0, category, price, quota);
        await tx.wait();

        // Retrieve and verify the ticket type details
        const ticketType = await eventContract.getTicketType(0, 0);
        expect(ticketType.category).to.equal(category);
        expect(ticketType.price).to.equal(price);
        expect(ticketType.quota).to.equal(quota);
        expect(ticketType.sold).to.equal(0);
    });

    // Edge Case: Adding a ticket type with zero quota or zero price (if allowed)
    it("Should add a ticket type with zero quota and/or zero price", async function () {
        const description = "Test Event";
        let tx = await eventContract.connect(organiser).createEvent(description);
        await tx.wait();

        // Zero quota
        tx = await eventContract.connect(organiser).addTicketType(0, "Free", 0, 0);
        await tx.wait();
        const ticketTypeZero = await eventContract.getTicketType(0, 0);
        expect(ticketTypeZero.quota).to.equal(0);
        expect(ticketTypeZero.price).to.equal(0);
    });

    // Test that a non-organiser cannot add a ticket type
    it("Should not allow a non-organiser to add a ticket type", async function () {
        const description = "Blockchain Conference 2025";
        let tx = await eventContract.connect(organiser).createEvent(description);
        await tx.wait();

        // Attempt to add a ticket type from a non-organiser account should revert
        await expect(
            eventContract.connect(nonOrganiser).addTicketType(0, "General", ethers.parseEther("0.05"), 200)
        ).to.be.revertedWith("Only organiser can add ticket types");
    });
});