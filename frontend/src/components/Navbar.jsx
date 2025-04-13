import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getUserDetails } from "../utils/contractServices";

export default function Navbar({ account }) {
    const [user, setUser] = useState({ name: "", nric: "" });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // 1. Get hashed NRIC from smart contract
                const details = await getUserDetails(account);
                const hashedNRIC = details.hashedNRIC;

                // 2. Call Express backend to resolve hashedNRIC to real name + nric
                const response = await fetch(`http://localhost:3000/api/users/${hashedNRIC}`);
                if (!response.ok) {
                    throw new Error("Backend user fetch failed");
                }

                const userData = await response.json();
                setUser({ name: userData.name, nric: userData.nric });
            } catch (err) {
                console.error("Failed to fetch full user details:", err);
            }
        };

        if (account) fetchUserData();
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
                    {user.name} ({user.nric})
                </span>
            </div>
        </header>
    );
}