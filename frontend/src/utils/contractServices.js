// Importing the ABI for UserRegistry smart contract
import UserRegistryArtifact from "./UserRegistry_ABI.json";

const UserRegistry_ABI = UserRegistryArtifact.abi;

// Importing ethers.js utilities
import { BrowserProvider, Contract } from "ethers";

// Importing contract address from your constants file
import { USERREGISTRY_ADDRESS } from "./constants";

// Module-level variables
let provider;
let signer;
let contract;

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
    contract = new Contract(USERREGISTRY_ADDRESS, UserRegistry_ABI, signer);
};

const ensureInitialized = async () => {
    if (!provider || !signer || !contract) {
        await initialize();
    }
};

/**
 * Request wallet connection explicitly
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
 * Registers a new user to the blockchain with their NRIC and name.
 * NRIC is stored as plaintext on-chain purely for demonstration.
 * 
 * 
 * @param {string} nric - User's plaintext NRIC.
 * @param {string} name - User's name.
 * @returns {object} Transaction receipt once registration is successful.
 */
export const registerUser = async (nric, name) => {
    await ensureInitialized();
    try {
        const tx = await contract.registerUser(nric, name);
        await tx.wait();
        return tx;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
};

/**
 * Checks if a specific user address is already registered.
 * @param {string} userAddress - Ethereum address of the user to check.
 * @returns {boolean} Registration status (true or false).
 */
export const isRegistered = async (userAddress) => {
    await ensureInitialized();
    try {
        return await contract.isRegistered(userAddress);
    } catch (error) {
        console.error("Error checking user registration status:", error);
        throw error;
    }
};

/**
 * Retrieves the user details from blockchain.
 * @param {string} userAddress - Ethereum address of the user.
 * @returns {object} Object containing user's hashedNRIC, name, and registration status.
 */
export const getUserDetails = async (userAddress) => {
    await ensureInitialized();
    try {
        const [hashedNRIC, name, registered] = await contract.getUserDetails(userAddress);
        return { hashedNRIC, name, registered };
    } catch (error) {
        console.error("Error retrieving user details:", error);
        throw error;
    }
};