import UserRegistry_ABI from "./UserRegistry_ABI.json";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import { USERREGISTRY_ADDRESS } from "./constants";

let provider;
let signer;
let contract;

export const initialize = async () => {
    if (typeof window.ethereum !== "undefined") {
        provider = new BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        contract = new Contract(USERREGISTRY_ADDRESS, UserRegistry_ABI, signer);
    } else {
        throw new Error("Please install MetaMask!");
    }
};

const ensureInitialized = async () => {
    if (!provider || !signer || !contract) {
        await initialize();
    }
};

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

export const getContractBalanceInETH = async () => {
    await ensureInitialized();
    const balanceWei = await provider.getBalance(USERREGISTRY_ADDRESS);
    return formatEther(balanceWei);
};