const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Ticket Contract", function () {
    let Event, eventContract;
    let Ticket, ticketContract;
    let organiser, buyer1, buyer2, others;

    beforeEach(async function () {
        [organiser, buyer1, buyer2, ...others] = await ethers.getSigners();

        // Deploy the Event contract and create an event with a ticket type
        Event = await ethers.getContractFactory("Event");
        eventContract = await Event.deploy();
        await eventContract.waitForDeployment();

        // Organiser creates an event
        const eventDesc = "Blockchain Conference 2025";
        let tx = await eventContract.connect(organiser).createEvent(eventDesc);
        await tx.wait();

        // Organiser adds a ticket type to event 0 with quota 1 for testing quota limits
        const category = "VIP";
        const price = ethers.parseEther("0.1");
        const quota = 1; // set low quota for edge case testing
        tx = await eventContract.connect(organiser).addTicketType(0, category, price, quota);
        await tx.wait();

        // Deploy the Ticket contract with the address of the Event contract
        Ticket = await ethers.getContractFactory("Ticket");
        ticketContract = await Ticket.deploy(eventContract.address);
        await ticketContract.waitForDeployment();
    });

    // Test deployment of the Ticket contract
    it("Should deploy the Ticket contract successfully", async function () {
        expect(await ticketContract.getAddress()).to.be.properAddress;
    });

    // Test a successful ticket purchase
    it("Should allow a buyer to purchase a ticket", async function () {
        const price = ethers.parseEther("0.1");
        const qrCode = "QR_CODE_BUYER1";

        // Buyer1 buys a ticket for event 0, ticket type 0
        const tx = await ticketContract.connect(buyer1).buyTicket(0, 0, qrCode, { value: price });
        await tx.wait();

        // Check that the ticket exists and is owned by buyer1
        const ticketData = await ticketContract.tickets(0);
        expect(ticketData.eventId).to.equal(0);
        expect(ticketData.ticketTypeId).to.equal(0);
        expect(ticketData.qrCode).to.equal(qrCode);
        expect(await ticketContract.ownerOf(0)).to.equal(buyer1.address);

        // Verify that the sold count in the Event contract has been incremented
        const ticketType = await eventContract.getTicketType(0, 0);
        expect(ticketType.sold).to.equal(1);
    });

    // Test purchase fails if incorrect Ether is sent
    it("Should revert ticket purchase if incorrect Ether value is sent", async function () {
        const wrongPrice = ethers.parseEther("0.05");
        const qrCode = "QR_CODE_BUYER1";

        await expect(
            ticketContract.connect(buyer1).buyTicket(0, 0, qrCode, { value: wrongPrice })
        ).to.be.revertedWith("Incorrect Ether value sent");
    });

    // Test purchase fails if quota is reached
    it("Should revert ticket purchase if ticket quota is reached", async function () {
        const price = ethers.parseEther("0.1");
        const qrCode1 = "QR_CODE_BUYER1";
        const qrCode2 = "QR_CODE_BUYER2";

        // Buyer1 buys the only available ticket
        let tx = await ticketContract.connect(buyer1).buyTicket(0, 0, qrCode1, { value: price });
        await tx.wait();

        // Buyer2 attempts to buy a ticket but quota is reached
        await expect(
            ticketContract.connect(buyer2).buyTicket(0, 0, qrCode2, { value: price })
        ).to.be.revertedWith("Ticket quota reached");
    });
});