import { BrowserProvider, Contract, parseEther, isAddress } from "ethers";

//Deployed contract addresses
//These are fixed because we already deploy via deploy.js and they should remain fixed
import { USERREGISTRY_ADDRESS, TICKETING_PLATFORM_ADDRESS } from "./constants";

//ABIs
import UserRegistry_ABI from '../abi/UserRegistry_ABI';
import TicketingPlatform_ABI from '../abi/TicketingPlatform_ABI';
import Ticket_ABI from '../abi/Ticket_ABI';
import Event_ABI from '../abi/Event_ABI';

let provider;
let signer;
let userRegistryContract;

export const initialize = async () => {
    if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
    }

    provider = new BrowserProvider(window.ethereum);

    try {
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userRegistryContract = new Contract(USERREGISTRY_ADDRESS, UserRegistry_ABI, signer);

        const network = await provider.getNetwork();
        if (!network.ensAddress) {
            console.info(`ENS not supported on network: ${network.name} (chainId=${network.chainId})`);
        }
    } catch (error) {
        throw new Error("Failed to connect wallet: " + error.message);
    }
};

//Ensures initialization before any contract interaction.
const ensureInitialized = async () => {
    if (!provider || !signer || !userRegistryContract) {
        await initialize();
    }
};

//Prompts the user to connect their wallet.
export const requestAccount = async () => {
    await ensureInitialized();
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        return accounts[0];
    } catch (error) {
        console.error("Wallet connection error:", error);
        return null;
    }
};

//Registers a user via UserRegistry.sol
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

//Checks if a user address is registered.
export const isRegistered = async (userAddress) => {
    await ensureInitialized();
    if (!isAddress(userAddress)) throw new Error("Invalid Ethereum address");

    try {
        return await userRegistryContract.isRegistered(userAddress);
    } catch (error) {
        console.error("Error checking registration:", error);
        throw error;
    }
};

//Retrieves the full user details from the UserRegistry.
export const getUserDetails = async (userAddress) => {
    await ensureInitialized();
    if (!isAddress(userAddress)) throw new Error("Invalid Ethereum address");

    try {
        const [hashedNRIC, name, registered] = await userRegistryContract.getUserDetails(userAddress);
        return { hashedNRIC, name, registered };
    } catch (error) {
        console.error("Error getting user details:", error);
        throw error;
    }
};

//Fetches all past Events created via the TicketingPlatform.
export const getEvents = async () => {
    await ensureInitialized();
    const ticketingPlatform = new Contract(TICKETING_PLATFORM_ADDRESS, TicketingPlatform_ABI, provider);

    try {
        const eventAddresses = await ticketingPlatform.getAllEvents();

        const events = await Promise.all(eventAddresses.map(async (eventAddress) => {
            const eventInstance = new Contract(eventAddress, Event_ABI, provider);
            const [eventName, organiser] = await Promise.all([
                eventInstance.eventName(),
                eventInstance.organiser(),
            ]);
            return { eventAddress, eventName, organiser };
        }));

        return events;
    } catch (error) {
        console.error("Error fetching all events:", error);
        throw error;
    }
};

//Retrieves the details of a specific event
export const getEvent = async (eventAddress) => {
    await ensureInitialized();
    if (!isAddress(eventAddress)) throw new Error("Invalid event address");

    try {
        const eventInstance = new Contract(eventAddress, Event_ABI, provider);
        const [eventName, organiser, commissionRate] = await Promise.all([
            eventInstance.eventName(),
            eventInstance.organiser(),
            eventInstance.commissionRate(),
        ]);
        return { eventAddress, eventName, organiser, commissionRate };
    } catch (error) {
        console.error("Error fetching event:", error);
        throw error;
    }
};

//Fetches all the Ticket contract instances for an Event contract instance
//Basically for a particular Event, this fetches all the Ticket types/ CATs available
export const getTicketsForEvent = async (eventAddress) => {
    await ensureInitialized();
    if (!isAddress(eventAddress)) throw new Error("Invalid event address");

    try {
        const eventInstance = new Contract(eventAddress, Event_ABI, provider);
        const filter = eventInstance.filters.TicketCategoryCreated();
        const logs = await eventInstance.queryFilter(filter);

        return logs.map((log) => ({
            ticketAddress: log.args.ticketContract,
            categoryName: log.args.categoryName,
        }));
    } catch (error) {
        console.error("Error fetching ticket categories:", error);
        throw error;
    }
};

//Purchases a ticket from a specific category in an event.
export const buyTicket = async (eventAddress, categoryIndex, paymentValue) => {
    await ensureInitialized();
    if (!isAddress(eventAddress)) throw new Error("Invalid event address");

    try {
        const eventInstance = new Contract(eventAddress, Event_ABI, signer);
        const value = parseEther(paymentValue);
        const tx = await eventInstance.buyTicket(categoryIndex, { value });
        await tx.wait();
        return tx;
    } catch (error) {
        console.error("Error buying ticket:", error);
        throw error;
    }
};

//Fetches token IDs owned by an address from a Ticket contract.
export const getOwnedTicketIds = async (ticketContractAddress, ownerAddress) => {
    await ensureInitialized();
    if (!isAddress(ticketContractAddress) || !isAddress(ownerAddress)) {
        throw new Error("Invalid Ethereum address");
    }

    try {
        const ticketContract = new Contract(ticketContractAddress, Ticket_ABI, provider);
        const tokenIds = await ticketContract.getOwnedTicketIds(ownerAddress);
        return tokenIds.map((id) => id.toString());
    } catch (error) {
        console.error("Error fetching owned ticket IDs:", error);
        throw error;
    }
};

//Fetches detailed metadata about a ticket NFT.
export const getTicketDetails = async (ticketContractAddress, ticketId) => {
    await ensureInitialized();
    if (!isAddress(ticketContractAddress)) {
        throw new Error("Invalid ticket contract address");
    }

    try {
        const ticketContract = new Contract(ticketContractAddress, Ticket_ABI, provider);
        const details = await ticketContract.getTicketDetails(ticketId);

        return {
            purchasePrice: details.purchasePrice.toString(),
            originalOwner: details.originalOwner,
            lastTransfer: details.lastTransfer.toString(),
            categoryName: details.categoryName,
        };
    } catch (error) {
        console.error("Error fetching ticket details:", error);
        throw error;
    }
};