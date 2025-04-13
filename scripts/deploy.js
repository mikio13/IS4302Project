const hre = require("hardhat");

async function main() {
    const [platformOwner, eventOrganiser, buyer] = await hre.ethers.getSigners();

    console.log("Platform Owner:", platformOwner.address);
    console.log("Event Organiser:", eventOrganiser.address);
    console.log("Buyer:", buyer.address);

    // 1. Deploy UserRegistry with platformOwner as admin
    const UserRegistryFactory = await hre.ethers.getContractFactory("UserRegistry", platformOwner);
    const userRegistry = await UserRegistryFactory.deploy(platformOwner.address); // <-- Pass admin here
    await userRegistry.waitForDeployment();
    const userRegistryAddress = await userRegistry.getAddress();
    console.log("UserRegistry deployed to:", userRegistryAddress);

    // 2. Deploy TicketingPlatform
    const TicketingPlatformFactory = await hre.ethers.getContractFactory("TicketingPlatform", platformOwner);
    const ticketingPlatform = await TicketingPlatformFactory.deploy(userRegistryAddress, 500); // 5%
    await ticketingPlatform.waitForDeployment();
    const ticketingPlatformAddress = await ticketingPlatform.getAddress();
    console.log("TicketingPlatform deployed to:", ticketingPlatformAddress);

    // 3. Approve Event Organiser
    let tx = await ticketingPlatform.connect(platformOwner).approveOrganiser(eventOrganiser.address);
    await tx.wait();
    console.log("Account B approved as organiser by PlatformOwner.");

    // 4. Create Multiple Events
    const eventNames = [
        "TAEYEON CONCERT - The TENSE in SINGAPORE",
        "Singapore Tech Expo",
        "Marina Bay Carnival"
    ];

    for (const name of eventNames) {
        await createEventWithTickets(name, ticketingPlatform, eventOrganiser);
    }
}

async function createEventWithTickets(eventName, ticketingPlatform, organiser) {
    const tx = await ticketingPlatform.connect(organiser).createEvent(eventName);
    const receipt = await tx.wait();

    // Find the event address from emitted logs
    let eventAddress;
    for (const log of receipt.logs) {
        try {
            const parsedLog = ticketingPlatform.interface.parseLog(log);
            if (parsedLog.name === "EventCreated") {
                eventAddress = parsedLog.args[1];
                break;
            }
        } catch (e) {
            // skip non-matching logs
        }
    }

    if (!eventAddress) {
        throw new Error(`EventCreated event not found for "${eventName}"`);
    }
    console.log(`✅ Event "${eventName}" deployed to: ${eventAddress}`);

    const eventInstance = await hre.ethers.getContractAt("Event", eventAddress, organiser);

    const categoryName = "VIP";
    const symbol = `VIP${Math.floor(Math.random() * 1000)}`; // make unique symbols
    const totalSupply = 100;
    const basePrice = hre.ethers.parseEther("0.05"); //The base price is 0.05 eth with 5% commission, so each ticket costs 0.0525 eth for buyers

    const categoryTx = await eventInstance.createTicketCategory(categoryName, symbol, totalSupply, basePrice);
    const categoryReceipt = await categoryTx.wait();

    let ticketAddress;
    for (const log of categoryReceipt.logs) {
        try {
            const parsedLog = eventInstance.interface.parseLog(log);
            if (parsedLog.name === "TicketCategoryCreated") {
                ticketAddress = parsedLog.args[0];
                break;
            }
        } catch (e) {
            // skip
        }
    }

    if (!ticketAddress) {
        throw new Error("TicketCategoryCreated event not found.");
    }

    console.log(`🎟️  Ticket category "${categoryName}" for "${eventName}" deployed to: ${ticketAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });