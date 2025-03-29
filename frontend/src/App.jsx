import React, { useState, useEffect } from "react";
import ConnectWalletButton from "./components/ConnectWalletButton";
import UserRegistration from "./components/UserRegistration";
import UserDashboard from "./components/UserDashboard";
import { isRegistered } from "./utils/contractServices";
import './App.css';

function App() {
  const [account, setAccount] = useState(null);
  const [registered, setRegistered] = useState(null);

  useEffect(() => {
    const handleAccountChanged = (newAccounts) => {
      const newAccount = newAccounts.length > 0 ? newAccounts[0] : null;
      setAccount(newAccount);
      setRegistered(null); // Reset registration state on account change
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChanged);
    }

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountChanged);
    };
  }, []);

  useEffect(() => {
    const checkRegistration = async () => {
      if (account) {
        const userRegistered = await isRegistered(account);
        setRegistered(userRegistered);
      }
    };

    checkRegistration();
  }, [account]);

  return (
    <div className="container">
      <h1>Authentix</h1>
      {!account && <ConnectWalletButton setAccount={setAccount} />}

      {account && registered === false && (
        <UserRegistration onRegistered={() => setRegistered(true)} />
      )}

      {account && registered && (
        <UserDashboard account={account} />
      )}
    </div>
  );
}

export default App;