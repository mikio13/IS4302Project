import React from "react";
import { useLocation } from "react-router-dom";
import { decode as base64urlDecode } from "js-base64";

export default function VerifyTicket() {
    const query = new URLSearchParams(useLocation().search);
    const encoded = query.get("data");

    if (!encoded) {
        return <p>No ticket data found in QR code.</p>;
    }

    let ticket;
    try {
        ticket = JSON.parse(base64urlDecode(encoded));
    } catch (e) {
        return <p>Invalid QR code data. Please try again.</p>;
    }

    return (
        <div className="verify-ticket" style={verifyStyles}>
            <h2>Ticket Verification</h2>
            <p><strong>Event Name:</strong> {ticket.event}</p>
            <p><strong>Ticket Category:</strong> {ticket.category}</p>
            <p><strong>Ticket ID:</strong> {ticket.ticketId}</p>
            <p><strong>Owner Name:</strong> {ticket.name}</p>
            <p><strong>NRIC:</strong> {ticket.nric}</p>
        </div>
    );
}

const verifyStyles = {
    maxWidth: "500px",
    margin: "50px auto",
    padding: "20px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#f9f9f9",
    fontFamily: "Arial, sans-serif",
};