import React, { useState, useEffect } from "react";
import {
    getOwnedTicketIds,
    getUserDetails,
    getTicketsForEvent,
    getTicketDetails
} from "../utils/contractServices";
import QRCode from "react-qr-code";

// Replace with the actual event contract address you want to use
const EVENT_ADDRESS = "0xYourEventContractAddress";

export default function TicketsPage({ account }) {
    const [tickets, setTickets] = useState([]);
    const [userDetails, setUserDetails] = useState(null);
    const [qrData, setQrData] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [ticketCategories, setTicketCategories] = useState([]);

    // Fetch ticket categories for the event
    useEffect(() => {
        const fetchCategories = async () => {
            if (account) {
                try {
                    const categories = await getTicketsForEvent(EVENT_ADDRESS);
                    setTicketCategories(categories);
                } catch (error) {
                    console.error("Error fetching ticket categories:", error);
                }
            }
        };
        fetchCategories();
    }, [account]);

    // For each ticket category, fetch owned ticket IDs and then full details
    useEffect(() => {
        const fetchTickets = async () => {
            if (account && ticketCategories.length > 0) {
                let ownedTickets = [];
                for (const category of ticketCategories) {
                    try {
                        const tokenIds = await getOwnedTicketIds(category.ticketAddress, account);
                        for (const tokenId of tokenIds) {
                            const details = await getTicketDetails(category.ticketAddress, tokenId);
                            // Merge the details with category info
                            ownedTickets.push({
                                id: tokenId,
                                ticketContract: category.ticketAddress,
                                categoryName: details.categoryName,
                                eventName: category.eventName, // Use the eventName from the category data
                                purchasePrice: details.purchasePrice,
                                lastTransfer: details.lastTransfer
                            });
                        }
                    } catch (error) {
                        console.error(`Error fetching tickets from ${category.ticketAddress}:`, error);
                    }
                }
                setTickets(ownedTickets);
            }
        };
        fetchTickets();
    }, [account, ticketCategories]);

    // Fetch user details for QR code data
    useEffect(() => {
        const fetchUserDetails = async () => {
            if (account) {
                try {
                    const details = await getUserDetails(account);
                    setUserDetails(details);
                } catch (error) {
                    console.error("Error fetching user details:", error);
                }
            }
        };
        fetchUserDetails();
    }, [account]);

    // Prepare and show QR code data when a ticket is selected
    const handleViewQR = (ticket) => {
        if (!userDetails) {
            alert("User details not available.");
            return;
        }
        const data = {
            ticketId: ticket.id,
            ticketContract: ticket.ticketContract,
            event: ticket.eventName,
            category: ticket.categoryName,
            name: userDetails.name,
            nric: userDetails.hashedNRIC // or plaintext if available
        };
        setQrData(JSON.stringify(data));
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
                    <h3>QR Code</h3>
                    <QRCode value={qrData} />
                    <button onClick={() => setShowQR(false)}>Close</button>
                </div>
            )}
        </div>
    );
}

// Optional inline styles for a basic modal
const modalStyles = {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    backgroundColor: "#fff",
    padding: "1rem",
    border: "1px solid #ccc",
    zIndex: 1000
};