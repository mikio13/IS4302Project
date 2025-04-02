// Importing ABIs
import UserRegistryArtifact from "./UserRegistry_ABI.json";
import TicketingPlatformArtifact from "./TicketingPlatform_ABI.json";
import EventArtifact from "./Event_ABI.json";
import TicketArtifact from "./Ticket_ABI.json";

const UserRegistry_ABI = UserRegistryArtifact.abi;
const TicketingPlatform_ABI = TicketingPlatformArtifact.abi;
const EVENT_ABI = EventArtifact.abi;
const TICKET_ABI = TicketArtifact.abi;

// Importing ethers.js utilities
import { BrowserProvider, Contract, parseEther } from "ethers";

// Importing deployed addresses from constants file
import { USERREGISTRY_ADDRESS, TICKETING_PLATFORM_ADDRESS } from "./constants";

// Module-level variables for UserRegistry (you already have these)
let provider;
let signer;
let userRegistryContract;

export const initialize = async () => {
    if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask not installed");
    }

    provider = new BrowserProvider(window.ethereum);

    try {
        await provider.send("eth_requestAccounts", []);
    } catch (error) {
        throw new Error("MetaMask is locked or the user rejected the connection");
    }

    signer = await provider.getSigner();
    userRegistryContract = new Contract(USERREGISTRY_ADDRESS, UserRegistry_ABI, signer);
};

const ensureInitialized = async () => {
    if (!provider || !signer || !userRegistryContract) {
        await initialize();
    }
};

/**
 * Request wallet connection explicitly.
 */
export const requestAccount = async () => {
    await ensureInitialized();
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts[0];
    } catch (error) {
        console.error("Error requesting account:", error.message);
        return null;
    }
};

/**
 * Registers a new user on the blockchain.
 * @param {string} nric - User's NRIC (for demonstration, plaintext)
 * @param {string} name - User's name.
 */
export const registerUser = async (nric, name) => {
    await ensureInitialized();
    try {
        const tx = await userRegistryContract.registerUser(nric, name);
        await tx.wait();
        return tx;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

/**
 * Checks if a user is registered.
 * @param {string} userAddress - Ethereum address to check.
 * @returns {boolean} True if registered.
 */

export const isRegistered = async (userAddress) => {
    await ensureInitialized();
    try {
        return await userRegistryContract.isRegistered(userAddress);
    } catch (error) {
        console.error("Error checking registration status:", error);
        throw error;
    }
};

/**
 * Retrieves user details.
 * @param {string} userAddress - Ethereum address of the user.
 * @returns {object} Object containing hashedNRIC, name, and registration status.
 */
export const getUserDetails = async (userAddress) => {
    await ensureInitialized();
    try {
        const [hashedNRIC, name, registered] = await userRegistryContract.getUserDetails(userAddress);
        return { hashedNRIC, name, registered };
    } catch (error) {
        console.error("Error retrieving user details:", error);
        throw error;
    }
};

/**
 * 1) View list of events.
 * Queries the TicketingPlatform contract for past EventCreated events.
 * For each event, it then fetches the event name from the Event contract.
 * @returns {Array} List of event objects with { eventAddress, eventName, organiser }.
 */
export const getEvents = async () => {
    await ensureInitialized();
    const ticketingPlatformContract = new Contract(TICKETING_PLATFORM_ADDRESS, TicketingPlatform_ABI, provider);

    // Create a filter for the EventCreated event (assumes event signature: EventCreated(address organiser, address eventContract))
    const filter = ticketingPlatformContract.filters.EventCreated();
    const logs = await ticketingPlatformContract.queryFilter(filter);

    const events = [];
    for (const log of logs) {
        // log.args: [organiser, eventContract]
        const eventAddress = log.args.eventContract;
        // Create an instance of the Event contract to fetch details
        const eventInstance = new Contract(eventAddress, EVENT_ABI, provider);
        const eventName = await eventInstance.eventName();
        const organiser = await eventInstance.organiser();
        events.push({
            eventAddress,
            eventName,
            organiser,
        });
    }
    return events;
};

/**
 * 2) View a specific event.
 * Given an event contract address, returns its details.
 * @param {string} eventAddress - The address of the Event contract.
 * @returns {object} Object containing eventName, organiser, commissionRate, etc.
 */
export const getEvent = async (eventAddress) => {
    await ensureInitialized();
    const eventInstance = new Contract(eventAddress, EVENT_ABI, provider);
    const eventName = await eventInstance.eventName();
    const organiser = await eventInstance.organiser();
    const commissionRate = await eventInstance.commissionRate();
    // You can add additional properties if needed
    return { eventAddress, eventName, organiser, commissionRate };
};

/**
 * 3) View tickets available for the event.
 * Queries the Event contract for past TicketCategoryCreated events.
 * @param {string} eventAddress - The address of the Event contract.
 * @returns {Array} List of ticket categories with { ticketAddress, categoryName }.
 */
export const getTicketsForEvent = async (eventAddress) => {
    await ensureInitialized();
    const eventInstance = new Contract(eventAddress, EVENT_ABI, provider);
    const filter = eventInstance.filters.TicketCategoryCreated();
    const logs = await eventInstance.queryFilter(filter);

    const tickets = logs.map(log => ({
        ticketAddress: log.args.ticketContract,
        categoryName: log.args.categoryName,
    }));
    return tickets;
};

export const buyTicket = async (eventAddress, categoryIndex, paymentValue) => {
    await ensureInitialized();
    // Connect to the Event contract with the signer so we can send transactions.
    const eventInstance = new Contract(eventAddress, EVENT_ABI, signer);
    // Convert the payment value (a string) to a BigNumber in Wei.
    const value = parseEther(paymentValue);
    const tx = await eventInstance.buyTicket(categoryIndex, { value });
    await tx.wait();
    return tx;
};

// You can leave your dummy getOwnedTickets function if needed
export const getOwnedTickets = async (walletAddress) => {
    return [
        {
            id: 1,
            eventName: "Authentix Live 2025",
            categoryName: "VIP",
        },
        {
            id: 2,
            eventName: "Authentix Live 2025",
            categoryName: "General",
        },
    ];
};