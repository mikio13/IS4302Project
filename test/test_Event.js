const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Event, TicketingPlatform & UserRegistry Contracts", function () {
    let userRegistry, ticketingPlatform;
    let eventAddress, eventInstance;    // For the deployed Event contract
    let ticketCategoryAddress, ticketInstance; // For the Ticket contract
    let owner, organiser, buyer, randomUser, others;

    before(async function () {
        [owner, organiser, buyer, randomUser, ...others] = await ethers.getSigners();

        // Deploy UserRegistry
        const UserRegistry = await ethers.getContractFactory("UserRegistry");
        userRegistry = await UserRegistry.deploy(owner.address);
        await userRegistry.waitForDeployment();

        // Deploy TicketingPlatform with an initial commission rate of 5% (500 bps)
        const TicketingPlatform = await ethers.getContractFactory("TicketingPlatform");
        ticketingPlatform = await TicketingPlatform.deploy(await userRegistry.getAddress(), 500);
        await ticketingPlatform.waitForDeployment();
    });

    it("Owner approves an organiser & organiser registers in UserRegistry", async function () {
        // First we test with a randomUser, this should revert since he doesn't own the platform
        await expect(
            ticketingPlatform.connect(randomUser).approveOrganiser(organiser.address)
        ).to.be.revertedWithCustomError(ticketingPlatform, "AccessControlUnauthorizedAccount");

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

    it("A registered buyer can buy a ticket and see partial refund (ignoring exact gas)", async function () {
        // Attempt to buy as an unregistered user this should revert
        await expect(
            eventInstance.connect(buyer).buyTicket(0, { value: ethers.parseEther("0.1") })
        ).to.be.revertedWith("Unregistered user");

        // Register the buyer
        const regTx = await userRegistry
            .connect(buyer)
            .registerUser("hashedNRIC_buyer", "Alice Buyer");
        await regTx.wait();
        expect(await userRegistry.isRegistered(buyer.address)).to.equal(true);

        // Overpay with 0.1 ETH
        // The basePrice is 0.05 ETH, commissionRate = 500 => 5% so the totalPrice = 0.0525 ETH
        const basePrice = ethers.parseEther("0.05");
        const commissionRate = 500n; // 5%
        const commission = (basePrice * commissionRate) / 10000n;
        const totalPrice = basePrice + commission; // e.g., 0.0525 ETH as BigInt

        const overpayAmount = ethers.parseEther("0.1");

        // Check buyer's balance before purchase
        const buyerBalanceBeforeBN = await ethers.provider.getBalance(buyer.address);
        const buyerBalanceBefore = BigInt(buyerBalanceBeforeBN.toString());

        // Execute the buy transaction
        const buyTx = await eventInstance
            .connect(buyer)
            .buyTicket(0, { value: overpayAmount });
        await buyTx.wait();

        // Check buyer's balance after purchase
        const buyerBalanceAfterBN = await ethers.provider.getBalance(buyer.address);
        const buyerBalanceAfter = BigInt(buyerBalanceAfterBN.toString());

        // netSpent = the difference in buyer's balance
        const netSpent = buyerBalanceBefore - buyerBalanceAfter;

        //    netSpent >= totalPrice => ensures at least the cost was deducted (no underpayment)
        //    netSpent < overpayAmount => ensures not all was spent, so some ETH must be refunded
        expect(netSpent).to.be.gte(totalPrice);
        expect(netSpent).to.be.lt(overpayAmount);

        //  Check the TicketPurchased event & confirm final price is totalPrice
        await expect(buyTx)
            .to.emit(ticketInstance, "TicketPurchased")
            .withArgs(
                1n,             // ticketId as BigInt
                buyer.address,  // buyer
                totalPrice      // final price in BigInt
            );

        // Confirm the minted ticket belongs to the buyer
        const ownerOfTicket1 = await ticketInstance.ownerOf(1n);
        expect(ownerOfTicket1).to.equal(buyer.address);
    });

    it("Event organiser and platform owner receive correct payments", async function () {
        // Base setup again
        const basePrice = ethers.parseEther("0.05");
        const commissionRate = 500n; // 5%
        const commission = (basePrice * commissionRate) / 10000n;
        const totalPrice = basePrice + commission;

        // Get balances before
        const organiserBefore = BigInt(await ethers.provider.getBalance(organiser.address));
        const platformOwnerBefore = BigInt(await ethers.provider.getBalance(owner.address));

        // Have another registered buyer buy a ticket
        const anotherBuyer = others[0];
        await userRegistry.connect(anotherBuyer).registerUser("hashedNRIC", "Another Buyer");

        const buyTx = await eventInstance.connect(anotherBuyer).buyTicket(0, {
            value: totalPrice,
        });
        await buyTx.wait();

        // Get balances after
        const organiserAfter = BigInt(await ethers.provider.getBalance(organiser.address));
        const platformOwnerAfter = BigInt(await ethers.provider.getBalance(owner.address));

        // Calculate diffs
        const organiserReceived = organiserAfter - organiserBefore;
        const platformOwnerReceived = platformOwnerAfter - platformOwnerBefore;

        // Check that organiser got at least basePrice
        expect(organiserReceived).to.be.gte(basePrice);

        // Check that platform owner got at least commission
        expect(platformOwnerReceived).to.be.gte(commission);
    });


});