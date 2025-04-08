import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserDetails } from "../utils/contractServices";

// This navbar will have links to the default dashboard page, tickets and events page. It will also show the user's info
export default function Navbar({ account }) {
    const [user, setUser] = useState({ name: "", hashedNRIC: "" });

    useEffect(() => {
        // Fetch the user's name and hashed NRIC from the blockchain
        const fetchUserDetails = async () => {
            try {
                const details = await getUserDetails(account);
                setUser({ name: details.name, hashedNRIC: details.hashedNRIC });
            } catch (err) {
                console.error("Failed to fetch user details:", err);
            }
        };

        // Only fetch details if wallet is connected
        if (account) fetchUserDetails();
    }, [account]);

    return (
        <header className="navbar">
            <div className="nav-left">
                <h2>Authentix</h2>
                <nav>
                    <Link to="/">🏠 Dashboard</Link>
                    <Link to="/tickets">🎫 Tickets</Link>
                    <Link to="/events"> Events</Link>
                </nav>
            </div>
            <div className="nav-right">
                <span>
                    {user.name} ({user.hashedNRIC})
                </span>
            </div>
        </header>
    );
}