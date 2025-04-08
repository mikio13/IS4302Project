import React from "react";
import { requestAccount } from "../utils/contractServices";

// This component helps to trigger the MetaMask wallet connection
function ConnectWalletButton({ setAccount }) {
    // Handles MetaMask connection and updates the connected account state
    const connectWallet = async () => {
        try {
            const account = await requestAccount();
            if (account) {
                setAccount(account); // Update app-level account state
            } else {
                alert("Wallet connection failed or canceled.");
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
            alert(error.message);
        }
    };

    return <button onClick={connectWallet}>Connect Web3 Wallet</button>;
}

export default ConnectWalletButton;