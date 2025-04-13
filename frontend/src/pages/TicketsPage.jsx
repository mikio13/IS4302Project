import React, { useState, useEffect } from "react";
import {
    getEvents,
    getOwnedTicketIds,
    getUserDetails,
    getTicketsForEvent,
    getTicketDetails
} from "../utils/contractServices";
import QRCode from "react-qr-code";
import { encode as base64urlEncode } from "js-base64";

export default function TicketsPage({ account }) {
    const [tickets, setTickets] = useState([]);
    const [userDetails, setUserDetails] = useState(null); // Real name + NRIC from backend
    const [qrData, setQrData] = useState("");
    const [showQR, setShowQR] = useState(false);

    // Fetch hashedNRIC from chain and resolve actual user identity from backend
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (!account) return;
            try {
                // Step 1: Get hashedNRIC from blockchain
                const { hashedNRIC } = await getUserDetails(account);

                // Step 2: Query backend to resolve hashedNRIC
                const response = await fetch(`http://localhost:3000/api/users/${hashedNRIC}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch user from backend");
                }

                const userData = await response.json();
                setUserDetails({
                    name: userData.name,
                    nric: userData.nric,
                    hashedNRIC
                });
            } catch (error) {
                console.error("Error fetching user details:", error);
            }
        };

        fetchUserDetails();
    }, [account]);

    // Fetch all tickets
    useEffect(() => {
        const fetchTickets = async () => {
            if (!account) return;
            try {
                const events = await getEvents();
                let allTickets = [];

                for (const event of events) {
                    const eventName = event.eventName;
                    const eventAddr = event.eventAddress;

                    const categories = await getTicketsForEvent(eventAddr);
                    for (const category of categories) {
                        const tokenIds = await getOwnedTicketIds(category.ticketAddress, account);
                        for (const tokenId of tokenIds) {
                            const details = await getTicketDetails(category.ticketAddress, tokenId);

                            allTickets.push({
                                id: tokenId,
                                ticketContract: category.ticketAddress,
                                categoryName: details.categoryName,
                                eventName,
                                purchasePrice: details.purchasePrice,
                                lastTransfer: details.lastTransfer
                            });
                        }
                    }
                }

                setTickets(allTickets);
            } catch (error) {
                console.error("Error fetching all tickets:", error);
            }
        };

        fetchTickets();
    }, [account]);

    // QR logic uses real identity now
    const handleViewQR = (ticket) => {
        if (!userDetails || !ticket.eventName) {
            alert("User or event info not available.");
            return;
        }

        const payload = {
            ticketId: ticket.id,
            ticketContract: ticket.ticketContract,
            event: ticket.eventName,
            category: ticket.categoryName,
            name: userDetails.name,
            nric: userDetails.nric
        };

        const encoded = base64urlEncode(JSON.stringify(payload));
        const qrUrl = `${window.location.origin}/verify?data=${encoded}`;
        setQrData(qrUrl);
        setShowQR(true);
    };

    return (
        <div className="tickets-page">
            <h2>Your Tickets</h2>

            {tickets.length === 0 ? (
                <p>You don't own any tickets yet.</p>
            ) : (
                <ul>
                    {tickets.map((ticket, index) => (
                        <li key={index} className="ticket-item">
                            <strong>Event:</strong> {ticket.eventName} <br />
                            <strong>Category:</strong> {ticket.categoryName} <br />
                            <strong>Ticket ID:</strong> {ticket.id} <br />
                            <button onClick={() => handleViewQR(ticket)}>View QR</button>
                        </li>
                    ))}
                </ul>
            )}

            {showQR && (
                <div className="qr-modal" style={modalStyles}>
                    <h3>Scan at Event</h3>
                    <QRCode value={qrData} />
                    <p>Security can scan this QR to verify your identity.</p>
                    <button onClick={() => setShowQR(false)}>Close</button>
                </div>
            )}
        </div>
    );
}

const modalStyles = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fff",
    padding: "1rem",
    border: "1px solid #ccc",
    zIndex: 1000,
    textAlign: "center",
};