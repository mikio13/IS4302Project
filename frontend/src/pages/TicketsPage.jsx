import React, { useState, useEffect } from "react";
import { getOwnedTickets } from "../utils/contractServices";

export default function TicketsPage({ account }) {
    const [tickets, setTickets] = useState([]);

    useEffect(() => {
        const fetchTickets = async () => {
            if (account) {
                const userTickets = await getOwnedTickets(account);
                setTickets(userTickets);
            }
        };
        fetchTickets();
    }, [account]);

    const handleViewQR = (ticket) => {
        //Placeholder for now
        alert(`QR Code for Ticket ID ${ticket.id}`);
    };

    return (
        <div className="tickets-page">
            <h2>Your Tickets</h2>
            {tickets.length === 0 ? (
                <p>You don't own any tickets yet.</p>
            ) : (
                <ul>
                    {tickets.map((ticket) => (
                        <li key={ticket.id} className="ticket-item">
                            <strong>Event:</strong> {ticket.eventName} <br />
                            <strong>Category:</strong> {ticket.categoryName} <br />
                            <button onClick={() => handleViewQR(ticket)}>View QR</button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}