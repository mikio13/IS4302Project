import React, { useState, useEffect } from "react";
import ConnectWalletButton from "./components/ConnectWalletButton";
import './App.css';

function App() {
  const [account, setAccount] = useState(null);

  useEffect(() => {
    const handleAccountChanged = (newAccounts) =>
      setAccount(newAccounts.length > 0 ? newAccounts[0] : null);

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountChanged);
    }

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountChanged);
    };
  }, []);

  return (
    <div className="container">
      <h1>Authentix</h1>
      <ConnectWalletButton setAccount={setAccount} />
      {account && <p>Connected account: {account}</p>}
    </div>
  );
}

export default App;