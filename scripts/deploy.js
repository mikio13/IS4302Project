const hre = require("hardhat");

async function main() {
    const [platformOwner, eventOrganiser, buyer] = await hre.ethers.getSigners();

    console.log("Platform Owner:", platformOwner.address);
    console.log("Event Organiser:", eventOrganiser.address);
    console.log("Buyer:", buyer.address);

    // 1. Deploy UserRegistry using PlatformOwner
    const UserRegistryFactory = await hre.ethers.getContractFactory("UserRegistry", platformOwner);
    const userRegistry = await UserRegistryFactory.deploy();
    await userRegistry.waitForDeployment();
    const userRegistryAddress = await userRegistry.getAddress();
    console.log("UserRegistry deployed to:", userRegistryAddress);

    // 2. Deploy TicketingPlatform using PlatformOwner with commission rate 500 (5%)
    const TicketingPlatformFactory = await hre.ethers.getContractFactory("TicketingPlatform", platformOwner);
    const ticketingPlatform = await TicketingPlatformFactory.deploy(userRegistryAddress, 500);
    await ticketingPlatform.waitForDeployment();
    const ticketingPlatformAddress = await ticketingPlatform.getAddress();
    console.log("TicketingPlatform deployed to:", ticketingPlatformAddress);

    // 3. Use PlatformOwner to approve eventOrganiser as an Event Organiser
    let tx = await ticketingPlatform.connect(platformOwner).approveOrganiser(eventOrganiser.address);
    await tx.wait();
    console.log("Account B approved as organiser by PlatformOwner.");

    // 4. Use eventOrganiser to create an Event via TicketingPlatform
    tx = await ticketingPlatform.connect(eventOrganiser).createEvent("Jay Chou Concert 2025");
    let receipt = await tx.wait();

    // Decode the EventCreated event to get the Event contract address
    let eventAddress;
    for (const log of receipt.logs) {
        try {
            const parsedLog = ticketingPlatform.interface.parseLog(log);
            if (parsedLog.name === "EventCreated") {
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

    // 5. Use eventOrganiser to create a Ticket category via the Event contract
    // Attach to the deployed Event contract with eventOrganiser as the signer
    const eventInstance = await hre.ethers.getContractAt("Event", eventAddress, eventOrganiser);

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