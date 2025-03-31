import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ConnectWalletButton from "./components/ConnectWalletButton";
import UserRegistration from "./components/UserRegistration";
import UserDashboard from "./components/UserDashboard";
import TicketsPage from "./pages/TicketsPage";
import Navbar from "./components/Navbar";
import { isRegistered } from "./utils/contractServices";
import "./App.css";

function App() {
  const [account, setAccount] = useState(null);
  const [registered, setRegistered] = useState(null);

  // Listen for account changes in MetaMask
  useEffect(() => {
    const handleAccountChanged = (newAccounts) => {
      const newAccount = newAccounts.length > 0 ? newAccounts[0] : null;
      setAccount(newAccount);
      setRegistered(null);
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChanged);
    }
    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountChanged);
    };
  }, []);

  // Check if the connected account is registered on-chain
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
    <Router>
      <div className="app-container">
        {account && registered && <Navbar account={account} />}
        <main className="main-content">
          {/* If no account connected, show the welcome/connect wallet screen */}
          {!account && (
            <div className="welcome-screen">
              <h1>Authentix</h1>
              <ConnectWalletButton setAccount={setAccount} />
            </div>
          )}
          {/* If account connected but not registered, show registration form */}
          {account && registered === false && (
            <UserRegistration onRegistered={() => setRegistered(true)} />
          )}
          {/* If registered, render the routes */}
          {account && registered && (
            <Routes>
              <Route path="/" element={<UserDashboard account={account} />} />
              <Route path="/tickets" element={<TicketsPage account={account} />} />
            </Routes>
          )}
        </main>
      </div>
    </Router>
  );
}

export default App;