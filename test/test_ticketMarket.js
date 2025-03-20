const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TicketMarket Contract", function () {
    let userRegistry, ticketMarket, eventInstance, ticketInstance;
    let owner, organiser, buyer1, buyer2, others;
    let eventAddress, ticketCategoryAddress;
    let ticketId = 1;
    let ticketId2 = 2;
    let ticketPrice = ethers.parseEther("0.05");

    before(async function () {
        [owner, organiser, buyer1, buyer2, ...others] = await ethers.getSigners();

        const UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy();
        await userRegistry.waitForDeployment();

        // Deploy TicketingPlatform with an initial commission rate of 5% (500 bps)
        const TicketingPlatform = await ethers.getContractFactory("TicketingPlatform");
        ticketingPlatform = await TicketingPlatform.deploy(await userRegistry.getAddress(), 500);
        await ticketingPlatform.waitForDeployment();

        const TicketMarket = await ethers.getContractFactory("TicketMarket");
        ticketMarket = await TicketMarket.deploy(await userRegistry.getAddress(), 500);
        await ticketMarket.waitForDeployment();

        // Sample Event
        const Event = await ethers.getContractFactory("Event");
        eventInstance = await Event.deploy(
            organiser.address,
            await userRegistry.getAddress(),
            500,
            "Concert Event"
        );
        await eventInstance.waitForDeployment();
        eventAddress = await eventInstance.getAddress();

        // Sample Ticket Category
        const tx = await eventInstance
            .connect(organiser)
            .createTicketCategory("VIP", "VIPSYM", 100, ticketPrice);
        const receipt = await tx.wait();
        const categoryLog = receipt.logs.find((log) => log.fragment?.name === "TicketCategoryCreated");
        ticketCategoryAddress = categoryLog.args[0];

        // Attach the Ticket contract instance
        ticketInstance = await ethers.getContractAt("Ticket", ticketCategoryAddress);
    });

    it("Owner approves an organiser & organiser registers in UserRegistry", async function () {
        // Correctly called by the owner
        const tx = await ticketingPlatform.connect(owner).approveOrganiser(organiser.address);
        await tx.wait();

        // Check the event
        await expect(tx)
            .to.emit(ticketingPlatform, "OrganiserApproved")
            .withArgs(organiser.address);
    });

    it("Organiser creates an Event via TicketingPlatform", async function () {
        // Create a new event
        const tx = await ticketingPlatform.connect(organiser).createEvent("MyConcert");
        const receipt = await tx.wait();

        // We expect an EventCreated log
        const eventCreatedLog = receipt.logs.find((log) => log.fragment?.name === "EventCreated");
        eventAddress = eventCreatedLog.args[1]; // second arg is the deployed Event contract address

        expect(eventAddress).to.be.properAddress;

        // Attach to the deployed Event contract so we can interact with it
        // eventAddress is the literal address
        // eventInstance is an object that we can use to call the functions inside that contract
        // so it's just like ticketingPlatform or userRegistry that we deployed in the before function on top
        eventInstance = await ethers.getContractAt("Event", eventAddress);
    });

    it("Organiser creates a ticket category via the Event contract", async function () {
        // Create a ticket category (instance of Ticket contract) with totalSupply = 100, basePrice = 0.05 ETH
        const tx = await eventInstance
            .connect(organiser)
            .createTicketCategory("VIP", "VIPSYM", 100, ethers.parseEther("0.05"));
        const receipt = await tx.wait();

        // Confirm TicketCategoryCreated event
        const categoryLog = receipt.logs.find((log) => log.fragment?.name === "TicketCategoryCreated");
        ticketCategoryAddress = categoryLog.args[0];  // or .args.ticketContract
        const categoryName = categoryLog.args[1];

        expect(ticketCategoryAddress).to.be.properAddress;
        expect(categoryName).to.equal("VIP");

        // Attach a contract instance for further checks
        ticketInstance = await ethers.getContractAt("Ticket", ticketCategoryAddress);
    });

    it("Buyer 1 buys a ticket", async function () {
        // Register the buyer
        const regTx = await userRegistry
            .connect(buyer1)
            .registerUser("hashedNRIC_buyer", "Alice Buyer");
        await regTx.wait();
        expect(await userRegistry.isRegistered(buyer1.address)).to.equal(true);

        // The basePrice is 0.05 ETH, commissionRate = 500 => 5% so the totalPrice = 0.0525 ETH
        const basePrice = ethers.parseEther("0.05");
        const commissionRate = 500n; // 5%
        const commission = (basePrice * commissionRate) / 10000n;
        const totalPrice = basePrice + commission; // e.g., 0.0525 ETH as BigInt

        // Check buyer's balance before purchase
        const buyerBalanceBeforeBN = await ethers.provider.getBalance(buyer1.address);
        const buyerBalanceBefore = BigInt(buyerBalanceBeforeBN.toString());

        // Execute the buy transaction
        const buyTx = await eventInstance
            .connect(buyer1)
            .buyTicket(0, { value: totalPrice });
        await buyTx.wait();

        // Check buyer's balance after purchase
        const buyerBalanceAfterBN = await ethers.provider.getBalance(buyer1.address);
        const buyerBalanceAfter = BigInt(buyerBalanceAfterBN.toString());

        // netSpent = the difference in buyer's balance
        const netSpent = buyerBalanceBefore - buyerBalanceAfter;

        // small allowance for gas fees
        expect(netSpent).to.be.closeTo(totalPrice, ethers.parseEther("0.0005"));

        //  Check the TicketPurchased event & confirm final price is totalPrice
        await expect(buyTx)
            .to.emit(ticketInstance, "TicketPurchased")
            .withArgs(
                1n,             // ticketId as BigInt
                buyer1.address,  // buyer
                totalPrice      // final price in BigInt
            );

        // Confirm the minted ticket belongs to the buyer
        const ownerOfTicket1 = await ticketInstance.ownerOf(1n);
        expect(ownerOfTicket1).to.equal(buyer1.address);
    });

    it("Buyer 1 lists their ticket on the resale market  and Buyer 2 purchases it successfully", async function () {
        await ticketInstance.connect(buyer1).approve(await ticketMarket.getAddress(), ticketId);

        const originalPrice = ethers.parseEther("0.06");

        const buyTx = await eventInstance
            .connect(buyer1)
            .buyTicket(0, { value: originalPrice });
        await buyTx.wait();

        expect(await ticketInstance.ownerOf(ticketId)).to.equal(buyer1.address);

        const resalePrice = ethers.parseEther("0.05");

        const tx = await ticketMarket.connect(buyer1).listTicket(ticketInstance, ticketId, resalePrice);
        await tx.wait();

        // check ownership transferred to ticket market
        await expect(tx)
            .to.emit(ticketMarket, "TicketListed")
            .withArgs(buyer1.address, ticketInstance, ticketId, resalePrice);

        expect(await ticketInstance.ownerOf(ticketId)).to.equal(await ticketMarket.getAddress());

        const purchasePrice = ethers.parseEther("0.055");

        await ticketMarket.connect(buyer2).buyTicket(0, { value: purchasePrice });

        expect(await ticketInstance.ownerOf(ticketId)).to.equal(buyer2.address);

    });

    it("Buyer 1 unlists ticket, Buyer 2 cannot buy unlisted ticket", async function () {
        await ticketInstance.connect(buyer1).approve(await ticketMarket.getAddress(), ticketId2);

        const originalPrice = ethers.parseEther("0.06");

        const buyTx = await eventInstance
            .connect(buyer1)
            .buyTicket(0, { value: originalPrice });
        await buyTx.wait();

        expect(await ticketInstance.ownerOf(ticketId2)).to.equal(buyer1.address);

        const resalePrice = ethers.parseEther("0.05");

        const tx = await ticketMarket.connect(buyer1).listTicket(ticketInstance, ticketId2, resalePrice);
        await tx.wait();

        // check ownership transfer to ticket market 
        await expect(tx)
            .to.emit(ticketMarket, "TicketListed")
            .withArgs(buyer1.address, ticketInstance, ticketId2, resalePrice);

        expect(await ticketInstance.ownerOf(ticketId2)).to.equal(await ticketMarket.getAddress());

        // unlist ticket
        const tx2 = await ticketMarket.connect(buyer1).unlistTicket(ticketId);
        await tx2.wait();

        await expect(tx2)
        .to.emit(ticketMarket, "TicketUnlisted")
        .withArgs(buyer1.address, ticketInstance, ticketId2, resalePrice);

        // ownership should go back to the seller
        expect(await ticketInstance.ownerOf(ticketId2)).to.equal(buyer1.address);

        // buyer 2 tries to buy unlisted ticket
        const purchasePrice = ethers.parseEther("0.055");

        await expect(
            ticketMarket.connect(buyer2).buyTicket(1, { value: purchasePrice })
        ).to.be.revertedWith("Ticket is not listed for resale on the market");

    });


});