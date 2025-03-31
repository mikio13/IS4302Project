const hre = require("hardhat");

async function main() {
    // Retrieve the available signers: Account A (Owner), Account B (Organiser), Account C (Buyer)
    const [accountA, accountB, accountC] = await hre.ethers.getSigners();

    console.log("Account A (Owner):", accountA.address);
    console.log("Account B (Organiser):", accountB.address);
    console.log("Account C (Buyer):", accountC.address);

    // ======================================================
    // 1. Deploy UserRegistry using Account A
    // ======================================================
    const UserRegistryFactory = await hre.ethers.getContractFactory("UserRegistry", accountA);
    const userRegistry = await UserRegistryFactory.deploy();
    await userRegistry.waitForDeployment();
    const userRegistryAddress = await userRegistry.getAddress();
    console.log("UserRegistry deployed to:", userRegistryAddress);

    // ======================================================
    // 2. Deploy TicketingPlatform using Account A with commission rate 500 (i.e., 5%)
    // ======================================================
    const TicketingPlatformFactory = await hre.ethers.getContractFactory("TicketingPlatform", accountA);
    const ticketingPlatform = await TicketingPlatformFactory.deploy(userRegistryAddress, 500);
    await ticketingPlatform.waitForDeployment();
    const ticketingPlatformAddress = await ticketingPlatform.getAddress();
    console.log("TicketingPlatform deployed to:", ticketingPlatformAddress);

    // ======================================================
    // 3. Use Account A to approve Account B as organiser
    // ======================================================
    let tx = await ticketingPlatform.connect(accountA).approveOrganiser(accountB.address);
    await tx.wait();
    console.log("Account B approved as organiser by Account A.");

    // ======================================================
    // 4. Use Account B to create an Event via TicketingPlatform
    // ======================================================
    tx = await ticketingPlatform.connect(accountB).createEvent("MyConcert");
    let receipt = await tx.wait();

    // Decode the EventCreated event to get the Event contract address
    let eventAddress;
    for (const log of receipt.logs) {
        try {
            const parsedLog = ticketingPlatform.interface.parseLog(log);
            if (parsedLog.name === "EventCreated") {
                // According to your tests, the event address is the second argument.
                eventAddress = parsedLog.args[1];
                break;
            }
        } catch (e) {
            // Ignore logs that don't match
        }
    }
    if (!eventAddress) {
        throw new Error("EventCreated event not found.");
    }
    console.log("Event deployed to:", eventAddress);

    // ======================================================
    // 5. Use Account B to create a Ticket category via the Event contract
    // ======================================================
    // Attach to the deployed Event contract with Account B as the signer
    const eventInstance = await hre.ethers.getContractAt("Event", eventAddress, accountB);

    tx = await eventInstance.createTicketCategory(
        "VIP",                // Ticket category name
        "VIPSYM",             // Ticket symbol
        100,                  // Total supply
        hre.ethers.parseEther("0.05")  // Base price of 0.05 ETH (using ethers.parseEther directly)
    );
    receipt = await tx.wait();

    // Decode the TicketCategoryCreated event to get the Ticket contract address
    let ticketAddress;
    for (const log of receipt.logs) {
        try {
            const parsedLog = eventInstance.interface.parseLog(log);
            if (parsedLog.name === "TicketCategoryCreated") {
                // According to your tests, the ticket address is the first argument.
                ticketAddress = parsedLog.args[0];
                break;
            }
        } catch (e) {
            // Ignore logs that don't match
        }
    }
    if (!ticketAddress) {
        throw new Error("TicketCategoryCreated event not found.");
    }
    console.log("Ticket (category) deployed to:", ticketAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });