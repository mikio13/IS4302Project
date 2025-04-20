const hre = require("hardhat");

async function main() {
    const [platformOwner, eventOrganiser, buyer] = await hre.ethers.getSigners();

    console.log("Platform Owner:", platformOwner.address);
    console.log("Event Organiser:", eventOrganiser.address);
    console.log("Buyer:", buyer.address);

    // 1. Deploy UserRegistry with platformOwner as admin
    const UserRegistryFactory = await hre.ethers.getContractFactory("UserRegistry", platformOwner);
    const userRegistry = await UserRegistryFactory.deploy(platformOwner.address);
    await userRegistry.waitForDeployment();
    const userRegistryAddress = await userRegistry.getAddress();
    console.log("UserRegistry deployed to:", userRegistryAddress);

    // 2. Deploy TicketingPlatform
    const TicketingPlatformFactory = await hre.ethers.getContractFactory("TicketingPlatform", platformOwner);
    const ticketingPlatform = await TicketingPlatformFactory.deploy(userRegistryAddress, 500); // 5% commission
    await ticketingPlatform.waitForDeployment();
    const ticketingPlatformAddress = await ticketingPlatform.getAddress();
    console.log("TicketingPlatform deployed to:", ticketingPlatformAddress);

    // 3. Approve Event Organiser
    const tx = await ticketingPlatform.connect(platformOwner).approveOrganiser(eventOrganiser.address);
    await tx.wait();
    console.log("Organiser approved by Platform Owner.");

    // 4. Create Events
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

    // Extract event address from logs
    let eventAddress;
    for (const log of receipt.logs) {
        try {
            const parsedLog = ticketingPlatform.interface.parseLog(log);
            if (parsedLog.name === "EventCreated") {
                eventAddress = parsedLog.args[1];
                break;
            }
        } catch (e) { }
    }

    if (!eventAddress) {
        throw new Error(`EventCreated event not found for "${eventName}"`);
    }
    console.log(`Event "${eventName}" deployed to: ${eventAddress}`);

    const eventInstance = await hre.ethers.getContractAt("Event", eventAddress, organiser);

    // Create Standard category
    await createTicketCategory(eventInstance, eventName, "Standard", "STD", 200, "0.02");

    // Create VIP category
    await createTicketCategory(eventInstance, eventName, "VIP", "VIP", 100, "0.05");
}

async function createTicketCategory(eventInstance, eventName, categoryName, symbolPrefix, supply, priceEth) {
    const symbol = `${symbolPrefix}${Math.floor(Math.random() * 1000)}`;
    const basePrice = hre.ethers.parseEther(priceEth);

    const tx = await eventInstance.createTicketCategory(categoryName, symbol, supply, basePrice);
    const receipt = await tx.wait();

    let ticketAddress;
    for (const log of receipt.logs) {
        try {
            const parsedLog = eventInstance.interface.parseLog(log);
            if (parsedLog.name === "TicketCategoryCreated") {
                ticketAddress = parsedLog.args[0];
                break;
            }
        } catch (e) { }
    }

    if (!ticketAddress) {
        throw new Error(`TicketCategoryCreated event not found for "${categoryName}"`);
    }

    console.log(`"${categoryName}" tickets for "${eventName}" deployed to: ${ticketAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });