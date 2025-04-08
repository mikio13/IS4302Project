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

// Displays all tickets owned by the current user and allows viewing a scannable QR code for verification
export default function TicketsPage({ account }) {
    const [tickets, setTickets] = useState([]); // List of all user's tickets
    const [userDetails, setUserDetails] = useState(null); // Contains user's name and hashed NRIC
    const [qrData, setQrData] = useState(""); // Data embedded in the QR code
    const [showQR, setShowQR] = useState(false); // Controls QR code modal visibility

    // Fetch the user's details from the blockchain
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

    // Fetches tickets the user owns across all events and categories
    useEffect(() => {
        const fetchTickets = async () => {
            if (!account) return;

            try {
                const events = await getEvents();
                let allTickets = [];

                for (const event of events) {
                    const eventName = event.eventName;
                    const eventAddr = event.eventAddress;

                    // Get all ticket categories for this event
                    const categories = await getTicketsForEvent(eventAddr);
                    for (const category of categories) {
                        // Get the ticket IDs owned by this user in this category
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

    // Opens a modal with a QR code containing ticket metadata + user identity for scanning at entry
    const handleViewQR = (ticket) => {
        if (!userDetails || !ticket.eventName) {
            alert("User or event info not available.");
            return;
        }

        // Create payload object
        const payload = {
            ticketId: ticket.id,
            ticketContract: ticket.ticketContract,
            event: ticket.eventName,
            category: ticket.categoryName,
            name: userDetails.name,
            nric: userDetails.hashedNRIC
        };

        // Encode and generate URL for QR payload
        const encoded = base64urlEncode(JSON.stringify(payload));
        const qrUrl = `${window.location.origin}/verify?data=${encoded}`;
        setQrData(qrUrl);
        setShowQR(true);
    };

    return (
        <div className="tickets-page">
            <h2>Your Tickets</h2>

            {/* If user owns no tickets */}
            {tickets.length === 0 ? (
                <p>You don't own any tickets yet.</p>
            ) : (
                <ul>
                    {/* Render each ticket */}
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

            {/* QR Code Modal */}
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

// Styling for QR code modal
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