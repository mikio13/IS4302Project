import React from "react";
import { requestAccount } from "../utils/contractServices";

function ConnectWalletButton({ setAccount }) {
    const connectWallet = async () => {
        try {
            const account = await requestAccount();
            if (account) {
                setAccount(account);
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